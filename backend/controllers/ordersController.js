const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const { triggerOrderPlaced, triggerOrderStatusChange } = require('../utils/webhookTrigger');

// Helper function to log order status change
const logStatusChange = async (client, order_id, tenant_id, from_status, to_status, changed_by_admin_id, changed_by_customer_id, notes = null) => {
  await client.query(
    `INSERT INTO order_status_history (
      order_id, tenant_id, from_status, to_status, 
      changed_by_admin_id, changed_by_customer_id, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [order_id, tenant_id, from_status, to_status, changed_by_admin_id, changed_by_customer_id, notes]
  );
};

// Helper function to create notification
const createNotification = async (client, type, title, message, tenant_id, admin_id = null, customer_id = null, data = null) => {
  await client.query(
    `INSERT INTO notifications (
      type, title, message, tenant_id, admin_id, customer_id, data, priority
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [type, title, message, tenant_id, admin_id, customer_id, data, 'high']
  );
};

// Create order (customer)
const createOrder = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { tenant_id } = req.params;
    const {
      customer_id,
      items, // Array of { product_id, quantity, unit_price }
      payment_method,
      delivery_type = 'delivery',
      delivery_address,
      delivery_phone,
      notes
    } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Order must have at least one item' });
    }
    
    await client.query('BEGIN');
    
    // Calculate total
    const total = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    
    // Generate order number
    const orderNumberResult = await client.query(
      'SELECT COUNT(*) as count FROM orders WHERE tenant_id = $1',
      [tenant_id]
    );
    const order_number = `ORD-${Date.now()}-${parseInt(orderNumberResult.rows[0].count) + 1}`;
    
    // Calculate acceptance deadline (5 minutes by default)
    const auto_accept_timer = 300; // 5 minutes in seconds
    const acceptance_deadline = new Date(Date.now() + (auto_accept_timer * 1000));
    
    // Create order
    const orderResult = await client.query(
      `INSERT INTO orders (
        tenant_id, customer_id, order_number, status, total, 
        payment_method, payment_status, delivery_type, delivery_address, 
        delivery_phone, delivery_notes, acceptance_status, auto_accept_timer, acceptance_deadline
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        tenant_id, customer_id, order_number, 'pending', total,
        payment_method, 'pending', delivery_type, delivery_address,
        delivery_phone, notes, 'pending_acceptance', auto_accept_timer, acceptance_deadline
      ]
    );
    
    const order = orderResult.rows[0];
    
    // Create order items
    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (
          order_id, product_id, quantity, unit_price, line_total
        ) VALUES ($1, $2, $3, $4, $5)`,
        [order.order_id, item.product_id, item.quantity, item.unit_price, item.quantity * item.unit_price]
      );
      
      // Update product inventory
      await client.query(
        'UPDATE products SET inventory_count = inventory_count - $1 WHERE product_id = $2',
        [item.quantity, item.product_id]
      );
    }
    
    // Log status
    await logStatusChange(client, order.order_id, tenant_id, null, 'pending', null, customer_id, 'Order created');
    
    // Notify admin
    await createNotification(
      client,
      'new_order',
      'New Order Received',
      `New order ${order_number} from customer`,
      tenant_id,
      null, // Will notify all admins of this tenant
      null,
      { order_id: order.order_id, order_number, total }
    );
    
    await client.query('COMMIT');
    
    // Trigger n8n webhook asynchronously (don't wait for it)
    triggerOrderPlaced(tenant_id, order).catch(err => {
      console.error('Failed to trigger order placed webhook:', err);
    });
    
    res.status(201).json({
      message: 'Order created successfully',
      order
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  } finally {
    client.release();
  }
};

// Accept order (admin)
const acceptOrder = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { estimated_delivery_time, notes } = req.body;
    
    await client.query('BEGIN');
    
    // Get order
    const orderResult = await client.query(
      'SELECT * FROM orders WHERE order_id = $1',
      [id]
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
    
    // Update order
    await client.query(
      `UPDATE orders 
       SET status = 'accepted', 
           acceptance_status = 'accepted',
           accepted_at = TIMEZONE('utc'::text, NOW()),
           accepted_by = $1,
           auto_accepted = false,
           estimated_delivery_time = $2, 
           updated_at = TIMEZONE('utc'::text, NOW())
       WHERE order_id = $3`,
      [req.user.id, estimated_delivery_time, id]
    );
    
    // Log status change
    await logStatusChange(client, id, order.tenant_id, order.status, 'accepted', req.user.id, null, notes);
    
    // Notify customer
    await createNotification(
      client,
      'order_accepted',
      'Order Accepted',
      `Your order ${order.order_number} has been accepted and is being prepared`,
      order.tenant_id,
      null,
      order.customer_id,
      { order_id: id, order_number: order.order_number }
    );
    
    await client.query('COMMIT');
    
    // Trigger n8n webhook asynchronously
    triggerOrderStatusChange(order.tenant_id, { 
      ...order, 
      previous_status: order.status 
    }, 'accepted').catch(err => {
      console.error('Failed to trigger order accepted webhook:', err);
    });
    
    res.json({ message: 'Order accepted successfully' });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Accept order error:', error);
    res.status(500).json({ error: 'Failed to accept order' });
  } finally {
    client.release();
  }
};

// Pack order (admin)
const packOrder = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { notes } = req.body;
    
    await client.query('BEGIN');
    
    const orderResult = await client.query(
      'SELECT * FROM orders WHERE order_id = $1',
      [id]
    );
    
    if (orderResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = orderResult.rows[0];
    
    if (req.user.role !== 'super_admin' && req.user.tenant_id !== order.tenant_id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await client.query(
      `UPDATE orders 
       SET status = 'packed', packed_at = TIMEZONE('utc'::text, NOW()), updated_at = TIMEZONE('utc'::text, NOW())
       WHERE order_id = $1`,
      [id]
    );
    
    await logStatusChange(client, id, order.tenant_id, order.status, 'packed', req.user.id, null, notes);
    
    await createNotification(
      client,
      'order_packed',
      'Order Packed',
      `Your order ${order.order_number} has been packed and ready for dispatch`,
      order.tenant_id,
      null,
      order.customer_id,
      { order_id: id, order_number: order.order_number }
    );
    
    await client.query('COMMIT');
    
    // Trigger n8n webhook asynchronously
    triggerOrderStatusChange(order.tenant_id, {
      ...order,
      previous_status: order.status
    }, 'packed').catch(err => {
      console.error('Failed to trigger order packed webhook:', err);
    });
    
    res.json({ message: 'Order marked as packed' });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Pack order error:', error);
    res.status(500).json({ error: 'Failed to pack order' });
  } finally {
    client.release();
  }
};

// Send out / Dispatch order (admin)
const sendOutOrder = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { tracking_number, notes } = req.body;
    
    await client.query('BEGIN');
    
    const orderResult = await client.query(
      'SELECT * FROM orders WHERE order_id = $1',
      [id]
    );
    
    if (orderResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = orderResult.rows[0];
    
    if (req.user.role !== 'super_admin' && req.user.tenant_id !== order.tenant_id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const metadata = { tracking_number };
    
    await client.query(
      `UPDATE orders 
       SET status = 'dispatched', dispatched_at = TIMEZONE('utc'::text, NOW()), 
           metadata = $1, updated_at = TIMEZONE('utc'::text, NOW())
       WHERE order_id = $2`,
      [JSON.stringify(metadata), id]
    );
    
    await logStatusChange(client, id, order.tenant_id, order.status, 'dispatched', req.user.id, null, notes);
    
    await createNotification(
      client,
      'order_dispatched',
      'Order Dispatched',
      `Your order ${order.order_number} is on the way!`,
      order.tenant_id,
      null,
      order.customer_id,
      { order_id: id, order_number: order.order_number, tracking_number }
    );
    
    await client.query('COMMIT');
    
    // Trigger n8n webhook asynchronously
    triggerOrderStatusChange(order.tenant_id, {
      ...order,
      previous_status: order.status
    }, 'dispatched').catch(err => {
      console.error('Failed to trigger order dispatched webhook:', err);
    });
    
    res.json({ message: 'Order dispatched successfully' });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Dispatch order error:', error);
    res.status(500).json({ error: 'Failed to dispatch order' });
  } finally {
    client.release();
  }
};

// Deliver order (admin)
const deliverOrder = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { notes, payment_status } = req.body;
    
    await client.query('BEGIN');
    
    const orderResult = await client.query(
      'SELECT * FROM orders WHERE order_id = $1',
      [id]
    );
    
    if (orderResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = orderResult.rows[0];
    
    if (req.user.role !== 'super_admin' && req.user.tenant_id !== order.tenant_id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await client.query(
      `UPDATE orders 
       SET status = 'delivered', actual_delivery_time = TIMEZONE('utc'::text, NOW()),
           payment_status = $1, updated_at = TIMEZONE('utc'::text, NOW())
       WHERE order_id = $2`,
      [payment_status || 'completed', id]
    );
    
    await logStatusChange(client, id, order.tenant_id, order.status, 'delivered', req.user.id, null, notes);
    
    // Add loyalty points
    const pointsEarned = Math.floor(order.total / 100); // 1 point per ₹100
    await client.query(
      'UPDATE customers SET loyalty_points = loyalty_points + $1 WHERE customer_id = $2',
      [pointsEarned, order.customer_id]
    );
    
    // Log transaction
    await client.query(
      `INSERT INTO transactions (tenant_id, customer_id, order_id, purchase_amount, points_earned)
       VALUES ($1, $2, $3, $4, $5)`,
      [order.tenant_id, order.customer_id, id, order.total, pointsEarned]
    );
    
    await createNotification(
      client,
      'order_delivered',
      'Order Delivered',
      `Your order ${order.order_number} has been delivered. You earned ${pointsEarned} loyalty points!`,
      order.tenant_id,
      null,
      order.customer_id,
      { order_id: id, order_number: order.order_number, points_earned: pointsEarned }
    );
    
    await client.query('COMMIT');
    
    // Trigger n8n webhook asynchronously
    triggerOrderStatusChange(order.tenant_id, {
      ...order,
      previous_status: order.status
    }, 'delivered').catch(err => {
      console.error('Failed to trigger order delivered webhook:', err);
    });
    
    res.json({ message: 'Order delivered successfully', points_earned: pointsEarned });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Deliver order error:', error);
    res.status(500).json({ error: 'Failed to mark order as delivered' });
  } finally {
    client.release();
  }
};

// Ready for pickup (admin)
const readyForPickup = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { notes } = req.body;
    
    await client.query('BEGIN');
    
    const orderResult = await client.query(
      'SELECT * FROM orders WHERE order_id = $1',
      [id]
    );
    
    if (orderResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = orderResult.rows[0];
    
    if (req.user.role !== 'super_admin' && req.user.tenant_id !== order.tenant_id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await client.query(
      `UPDATE orders 
       SET status = 'ready_for_pickup', updated_at = TIMEZONE('utc'::text, NOW())
       WHERE order_id = $1`,
      [id]
    );
    
    await logStatusChange(client, id, order.tenant_id, order.status, 'ready_for_pickup', req.user.id, null, notes);
    
    await createNotification(
      client,
      'order_ready',
      'Order Ready for Pickup',
      `Your order ${order.order_number} is ready for pickup at the store`,
      order.tenant_id,
      null,
      order.customer_id,
      { order_id: id, order_number: order.order_number }
    );
    
    await client.query('COMMIT');
    
    res.json({ message: 'Order marked as ready for pickup' });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Ready for pickup error:', error);
    res.status(500).json({ error: 'Failed to mark order as ready' });
  } finally {
    client.release();
  }
};

// Get order status history
const getOrderHistory = async (req, res) => {
  try {
    const { id } = req.params;
    
    const orderResult = await pool.query(
      'SELECT tenant_id, customer_id FROM orders WHERE order_id = $1',
      [id]
    );
    
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = orderResult.rows[0];
    
    // Permission check: admin of tenant or customer who placed order
    if (
      req.user.role !== 'super_admin' && 
      req.user.tenant_id !== order.tenant_id &&
      req.user.id !== order.customer_id
    ) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const result = await pool.query(
      `SELECT 
        h.*,
        a.full_name as admin_name,
        c.name as customer_name
       FROM order_status_history h
       LEFT JOIN admins a ON h.changed_by_admin_id = a.admin_id
       LEFT JOIN customers c ON h.changed_by_customer_id = c.customer_id
       WHERE h.order_id = $1
       ORDER BY h.changed_at ASC`,
      [id]
    );
    
    res.json({ history: result.rows });
    
  } catch (error) {
    console.error('Get order history error:', error);
    res.status(500).json({ error: 'Failed to get order history' });
  }
};

// Process auto-accept for expired orders
const processAutoAccept = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Find orders past their acceptance deadline
    const expiredOrders = await client.query(
      `SELECT * FROM orders 
       WHERE acceptance_status = 'pending_acceptance'
       AND acceptance_deadline IS NOT NULL
       AND acceptance_deadline < TIMEZONE('utc'::text, NOW())
       AND status = 'pending'`
    );
    
    const processedOrders = [];
    
    for (const order of expiredOrders.rows) {
      // Auto-accept the order
      await client.query(
        `UPDATE orders 
         SET status = 'accepted',
             acceptance_status = 'auto_accepted',
             auto_accepted = true,
             accepted_at = TIMEZONE('utc'::text, NOW()),
             updated_at = TIMEZONE('utc'::text, NOW())
         WHERE order_id = $1`,
        [order.order_id]
      );
      
      // Log status change
      await logStatusChange(
        client,
        order.order_id,
        order.tenant_id,
        'pending',
        'accepted',
        null,
        null,
        'Auto-accepted due to timeout'
      );
      
      // Notify admin
      await createNotification(
        client,
        'order_auto_accepted',
        'Order Auto-Accepted',
        `Order ${order.order_number} was automatically accepted`,
        order.tenant_id,
        null,
        null,
        { order_id: order.order_id, order_number: order.order_number }
      );
      
      // Notify customer
      await createNotification(
        client,
        'order_accepted',
        'Order Accepted',
        `Your order ${order.order_number} has been accepted and is being prepared`,
        order.tenant_id,
        null,
        order.customer_id,
        { order_id: order.order_id, order_number: order.order_number }
      );
      
      processedOrders.push(order.order_id);
    }
    
    await client.query('COMMIT');
    
    res.json({
      message: `Processed ${processedOrders.length} orders for auto-acceptance`,
      processedOrders
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Process auto-accept error:', error);
    res.status(500).json({ error: 'Failed to process auto-accept' });
  } finally {
    client.release();
  }
};

// Get pending acceptance orders for a tenant
const getPendingAcceptanceOrders = async (req, res) => {
  try {
    const { tenant_id } = req.params;
    
    // Permission check
    if (req.user.role !== 'super_admin' && req.user.tenant_id !== tenant_id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const result = await pool.query(
      `SELECT 
        o.*,
        c.name as customer_name,
        c.phone as customer_phone
       FROM orders o
       LEFT JOIN customers c ON o.customer_id = c.customer_id
       WHERE o.tenant_id = $1
       AND o.acceptance_status = 'pending_acceptance'
       AND o.acceptance_deadline > TIMEZONE('utc'::text, NOW())
       ORDER BY o.created_at ASC`,
      [tenant_id]
    );
    
    res.json({
      orders: result.rows,
      count: result.rows.length
    });
    
  } catch (error) {
    console.error('Get pending acceptance orders error:', error);
    res.status(500).json({ error: 'Failed to get pending orders' });
  }
};

module.exports = {
  createOrder,
  acceptOrder,
  packOrder,
  sendOutOrder,
  deliverOrder,
  readyForPickup,
  getOrderHistory,
  processAutoAccept,
  getPendingAcceptanceOrders
};
