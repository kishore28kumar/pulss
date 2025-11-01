const { pool } = require('../config/db');

// Request credit for an order (customer)
const requestCredit = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id: order_id } = req.params;
    const { notes } = req.body;
    
    await client.query('BEGIN');
    
    // Get order details
    const orderResult = await client.query(
      'SELECT * FROM orders WHERE order_id = $1',
      [order_id]
    );
    
    if (orderResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = orderResult.rows[0];
    
    // Check if customer is eligible for credit
    const customerResult = await client.query(
      'SELECT credit_limit, credit_balance FROM customers WHERE customer_id = $1',
      [order.customer_id]
    );
    
    const customer = customerResult.rows[0];
    const newBalance = (customer.credit_balance || 0) + order.total;
    
    if (customer.credit_limit && newBalance > customer.credit_limit) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Credit limit exceeded',
        credit_limit: customer.credit_limit,
        current_balance: customer.credit_balance,
        order_amount: order.total
      });
    }
    
    // Create ledger entry
    const ledgerResult = await client.query(
      `INSERT INTO customer_ledgers (
        customer_id, tenant_id, order_id, transaction_type, 
        amount, balance, status, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        order.customer_id,
        order.tenant_id,
        order_id,
        'credit_purchase',
        order.total,
        newBalance,
        'pending',
        notes
      ]
    );
    
    // Update order payment status
    await client.query(
      `UPDATE orders 
       SET payment_status = 'credit_requested', updated_at = TIMEZONE('utc'::text, NOW())
       WHERE order_id = $1`,
      [order_id]
    );
    
    // Notify admin
    await client.query(
      `INSERT INTO notifications (
        type, title, message, tenant_id, data, priority
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        'credit_request',
        'Credit Request',
        `Customer requested credit for order ${order.order_number}`,
        order.tenant_id,
        JSON.stringify({ order_id, order_number: order.order_number, amount: order.total }),
        'high'
      ]
    );
    
    await client.query('COMMIT');
    
    res.json({
      message: 'Credit request submitted successfully',
      ledger: ledgerResult.rows[0]
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Request credit error:', error);
    res.status(500).json({ error: 'Failed to request credit' });
  } finally {
    client.release();
  }
};

// Approve credit request (admin)
const approveCredit = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id: order_id } = req.params;
    const { approved, notes } = req.body;
    
    await client.query('BEGIN');
    
    // Get order and ledger entry
    const orderResult = await pool.query(
      'SELECT * FROM orders WHERE order_id = $1',
      [order_id]
    );
    
    if (orderResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = orderResult.rows[0];
    
    // Permission check
    if (req.user.role !== 'super_admin' && req.user.tenant_id !== order.tenant_id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (approved) {
      // Approve credit
      await client.query(
        `UPDATE customer_ledgers 
         SET status = 'approved', approved_at = TIMEZONE('utc'::text, NOW()), 
             approved_by = $1, notes = $2, updated_at = TIMEZONE('utc'::text, NOW())
         WHERE order_id = $3 AND status = 'pending'`,
        [req.user.id, notes, order_id]
      );
      
      // Update customer credit balance
      await client.query(
        `UPDATE customers 
         SET credit_balance = credit_balance + $1
         WHERE customer_id = $2`,
        [order.total, order.customer_id]
      );
      
      // Update order payment status
      await client.query(
        `UPDATE orders 
         SET payment_status = 'credit_approved', updated_at = TIMEZONE('utc'::text, NOW())
         WHERE order_id = $1`,
        [order_id]
      );
      
      // Notify customer
      await client.query(
        `INSERT INTO notifications (
          type, title, message, tenant_id, customer_id, data
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          'credit_approved',
          'Credit Approved',
          `Your credit request for order ${order.order_number} has been approved`,
          order.tenant_id,
          order.customer_id,
          JSON.stringify({ order_id, order_number: order.order_number, amount: order.total })
        ]
      );
      
      await client.query('COMMIT');
      
      res.json({ message: 'Credit approved successfully' });
      
    } else {
      // Reject credit
      await client.query(
        `UPDATE customer_ledgers 
         SET status = 'rejected', notes = $1, updated_at = TIMEZONE('utc'::text, NOW())
         WHERE order_id = $2 AND status = 'pending'`,
        [notes, order_id]
      );
      
      // Update order payment status
      await client.query(
        `UPDATE orders 
         SET payment_status = 'credit_rejected', updated_at = TIMEZONE('utc'::text, NOW())
         WHERE order_id = $1`,
        [order_id]
      );
      
      // Notify customer
      await client.query(
        `INSERT INTO notifications (
          type, title, message, tenant_id, customer_id, data
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          'credit_rejected',
          'Credit Request Declined',
          `Your credit request for order ${order.order_number} was declined. ${notes || ''}`,
          order.tenant_id,
          order.customer_id,
          JSON.stringify({ order_id, order_number: order.order_number })
        ]
      );
      
      await client.query('COMMIT');
      
      res.json({ message: 'Credit request rejected' });
    }
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Approve credit error:', error);
    res.status(500).json({ error: 'Failed to process credit approval' });
  } finally {
    client.release();
  }
};

// Get customer ledger
const getCustomerLedger = async (req, res) => {
  try {
    const { id: customer_id } = req.params;
    const { status, page = 1, limit = 20 } = req.query;
    
    // Get customer to check tenant
    const customerResult = await pool.query(
      'SELECT tenant_id, credit_balance, credit_limit FROM customers WHERE customer_id = $1',
      [customer_id]
    );
    
    if (customerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    const customer = customerResult.rows[0];
    
    // Permission check
    if (
      req.user.role !== 'super_admin' && 
      req.user.tenant_id !== customer.tenant_id &&
      req.user.id !== customer_id
    ) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT l.*, o.order_number, a.full_name as approved_by_name
      FROM customer_ledgers l
      LEFT JOIN orders o ON l.order_id = o.order_id
      LEFT JOIN admins a ON l.approved_by = a.admin_id
      WHERE l.customer_id = $1
    `;
    
    const params = [customer_id];
    let paramCount = 2;
    
    if (status) {
      query += ` AND l.status = $${paramCount++}`;
      params.push(status);
    }
    
    // Get total count
    const countResult = await pool.query(
      query.replace('SELECT l.*, o.order_number, a.full_name as approved_by_name', 'SELECT COUNT(*)'),
      params
    );
    const total = parseInt(countResult.rows[0].count);
    
    // Add pagination
    query += ` ORDER BY l.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    res.json({
      ledger: result.rows,
      summary: {
        credit_balance: customer.credit_balance,
        credit_limit: customer.credit_limit,
        available_credit: customer.credit_limit ? customer.credit_limit - customer.credit_balance : null
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Get ledger error:', error);
    res.status(500).json({ error: 'Failed to get ledger' });
  }
};

// Record payment against ledger (admin)
const recordPayment = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id: ledger_id } = req.params;
    const { amount, payment_method, payment_reference, notes } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid payment amount' });
    }
    
    await client.query('BEGIN');
    
    // Get ledger entry
    const ledgerResult = await client.query(
      'SELECT * FROM customer_ledgers WHERE ledger_id = $1',
      [ledger_id]
    );
    
    if (ledgerResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Ledger entry not found' });
    }
    
    const ledger = ledgerResult.rows[0];
    
    // Permission check
    if (req.user.role !== 'super_admin' && req.user.tenant_id !== ledger.tenant_id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Get customer current balance
    const customerResult = await client.query(
      'SELECT credit_balance FROM customers WHERE customer_id = $1',
      [ledger.customer_id]
    );
    
    const currentBalance = customerResult.rows[0].credit_balance;
    const newBalance = Math.max(0, currentBalance - amount);
    
    // Update customer credit balance
    await client.query(
      'UPDATE customers SET credit_balance = $1 WHERE customer_id = $2',
      [newBalance, ledger.customer_id]
    );
    
    // Create payment ledger entry
    await client.query(
      `INSERT INTO customer_ledgers (
        customer_id, tenant_id, order_id, transaction_type, amount, balance,
        status, payment_method, payment_reference, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        ledger.customer_id,
        ledger.tenant_id,
        ledger.order_id,
        'payment',
        -amount, // Negative for payment
        newBalance,
        'paid',
        payment_method,
        payment_reference,
        notes
      ]
    );
    
    // Update original ledger entry status if fully paid
    if (ledger.amount <= amount) {
      await client.query(
        `UPDATE customer_ledgers 
         SET status = 'paid', paid_at = TIMEZONE('utc'::text, NOW()), updated_at = TIMEZONE('utc'::text, NOW())
         WHERE ledger_id = $1`,
        [ledger_id]
      );
      
      // Update order payment status
      if (ledger.order_id) {
        await client.query(
          `UPDATE orders 
           SET payment_status = 'completed', updated_at = TIMEZONE('utc'::text, NOW())
           WHERE order_id = $1`,
          [ledger.order_id]
        );
      }
    }
    
    // Notify customer
    await client.query(
      `INSERT INTO notifications (
        type, title, message, tenant_id, customer_id, data
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        'payment_received',
        'Payment Received',
        `Payment of ₹${amount} received. New balance: ₹${newBalance}`,
        ledger.tenant_id,
        ledger.customer_id,
        JSON.stringify({ amount, payment_method, new_balance: newBalance })
      ]
    );
    
    await client.query('COMMIT');
    
    res.json({
      message: 'Payment recorded successfully',
      new_balance: newBalance
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Record payment error:', error);
    res.status(500).json({ error: 'Failed to record payment' });
  } finally {
    client.release();
  }
};

// Get pending credit requests for tenant (admin)
const getPendingCreditRequests = async (req, res) => {
  try {
    const { tenant_id } = req.params;
    
    // Permission check
    if (req.user.role !== 'super_admin' && req.user.tenant_id !== tenant_id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const result = await pool.query(
      `SELECT 
        l.*,
        c.name as customer_name,
        c.phone as customer_phone,
        c.credit_limit,
        c.credit_balance,
        o.order_number
       FROM customer_ledgers l
       JOIN customers c ON l.customer_id = c.customer_id
       LEFT JOIN orders o ON l.order_id = o.order_id
       WHERE l.tenant_id = $1 AND l.status = 'pending' AND l.transaction_type = 'credit_purchase'
       ORDER BY l.created_at DESC`,
      [tenant_id]
    );
    
    res.json({ requests: result.rows });
    
  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({ error: 'Failed to get pending requests' });
  }
};

module.exports = {
  requestCredit,
  approveCredit,
  getCustomerLedger,
  recordPayment,
  getPendingCreditRequests
};
