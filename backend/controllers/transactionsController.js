const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// Create transaction and update customer points atomically
const createTransaction = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { tenant_id } = req;
    const { customer_id, order_id, purchase_amount } = req.body;
    
    if (!tenant_id || !customer_id || !purchase_amount) {
      return res.status(400).json({ error: 'Tenant ID, customer ID, and purchase amount required' });
    }
    
    // Verify customer belongs to tenant
    const customerCheck = await client.query(
      'SELECT customer_id FROM customers WHERE customer_id = $1 AND tenant_id = $2',
      [customer_id, tenant_id]
    );
    
    if (customerCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    // Calculate points (10% of purchase amount, rounded down)
    const points_earned = Math.floor(purchase_amount * 0.1);
    
    await client.query('BEGIN');
    
    // Insert transaction
    const transactionResult = await client.query(
      `INSERT INTO transactions (transaction_id, tenant_id, customer_id, order_id, purchase_amount, points_earned, transaction_date) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) 
       RETURNING *`,
      [uuidv4(), tenant_id, customer_id, order_id, purchase_amount, points_earned]
    );
    
    // Update customer points
    await client.query(
      `UPDATE customers 
       SET loyalty_points = loyalty_points + $1, updated_at = NOW() 
       WHERE customer_id = $2 AND tenant_id = $3`,
      [points_earned, customer_id, tenant_id]
    );
    
    // Update customer stats
    await client.query(
      `INSERT INTO customer_stats (customer_id, total_orders, total_spent, last_order_date, last_calculated)
       VALUES ($1, 1, $2, NOW(), NOW())
       ON CONFLICT (customer_id) 
       DO UPDATE SET 
         total_orders = customer_stats.total_orders + 1,
         total_spent = customer_stats.total_spent + $2,
         last_order_date = NOW(),
         last_calculated = NOW()`,
      [customer_id, purchase_amount]
    );
    
    await client.query('COMMIT');
    
    res.status(201).json({
      message: 'Transaction created and points awarded',
      transaction: transactionResult.rows[0],
      points_awarded: points_earned
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create transaction error:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  } finally {
    client.release();
  }
};

// Get transactions for a customer
const getCustomerTransactions = async (req, res) => {
  try {
    const { tenant_id } = req;
    const { customer_id } = req.params;
    
    const result = await pool.query(
      `SELECT t.*, c.name as customer_name 
       FROM transactions t
       JOIN customers c ON t.customer_id = c.customer_id
       WHERE t.customer_id = $1 AND t.tenant_id = $2
       ORDER BY t.transaction_date DESC`,
      [customer_id, tenant_id]
    );
    
    res.json({ transactions: result.rows });
  } catch (error) {
    console.error('Get customer transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

// Get all transactions for tenant
const getTransactions = async (req, res) => {
  try {
    const { tenant_id } = req;
    const { limit = 50, offset = 0 } = req.query;
    
    const result = await pool.query(
      `SELECT t.*, c.name as customer_name, c.phone as customer_phone
       FROM transactions t
       JOIN customers c ON t.customer_id = c.customer_id
       WHERE t.tenant_id = $1
       ORDER BY t.transaction_date DESC
       LIMIT $2 OFFSET $3`,
      [tenant_id, limit, offset]
    );
    
    res.json({ transactions: result.rows });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

module.exports = {
  createTransaction,
  getCustomerTransactions,
  getTransactions
};
