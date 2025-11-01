const { pool } = require('../config/db');
const { triggerCustomerRegistered } = require('../utils/webhookTrigger');

// Get all customers for a tenant
const getCustomers = async (req, res) => {
  try {
    const { tenant_id } = req;
    
    if (!tenant_id) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }
    
    const result = await pool.query(
      `SELECT customer_id, tenant_id, email, name, phone, loyalty_points, is_active, created_at 
       FROM customers 
       WHERE tenant_id = $1 
       ORDER BY created_at DESC`,
      [tenant_id]
    );
    
    res.json({ customers: result.rows });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
};

// Get single customer
const getCustomer = async (req, res) => {
  try {
    const { tenant_id } = req;
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT customer_id, tenant_id, email, name, phone, loyalty_points, is_active, created_at, updated_at 
       FROM customers 
       WHERE customer_id = $1 AND tenant_id = $2`,
      [id, tenant_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json({ customer: result.rows[0] });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
};

// Create customer (for admin)
const createCustomer = async (req, res) => {
  try {
    const { tenant_id } = req;
    const { email, name, phone } = req.body;
    
    if (!tenant_id || !name) {
      return res.status(400).json({ error: 'Tenant ID and name required' });
    }
    
    const result = await pool.query(
      `INSERT INTO customers (tenant_id, email, name, phone, loyalty_points, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING customer_id, tenant_id, email, name, phone, loyalty_points, created_at`,
      [tenant_id, email, name, phone, 0, true]
    );
    
    const customer = result.rows[0];
    
    // Trigger n8n webhook asynchronously
    triggerCustomerRegistered(tenant_id, customer).catch(err => {
      console.error('Failed to trigger customer registered webhook:', err);
    });
    
    res.status(201).json({ 
      message: 'Customer created successfully',
      customer 
    });
  } catch (error) {
    console.error('Create customer error:', error);
    
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    res.status(500).json({ error: 'Failed to create customer' });
  }
};

// Update customer
const updateCustomer = async (req, res) => {
  try {
    const { tenant_id } = req;
    const { id } = req.params;
    const { email, name, phone } = req.body;
    
    const result = await pool.query(
      `UPDATE customers 
       SET email = COALESCE($1, email), 
           name = COALESCE($2, name), 
           phone = COALESCE($3, phone),
           updated_at = NOW()
       WHERE customer_id = $4 AND tenant_id = $5
       RETURNING customer_id, tenant_id, email, name, phone, loyalty_points, updated_at`,
      [email, name, phone, id, tenant_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json({ 
      message: 'Customer updated successfully',
      customer: result.rows[0] 
    });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
};

// Get customer stats
const getCustomerStats = async (req, res) => {
  try {
    const { tenant_id } = req;
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT cs.*, c.name, c.email, c.loyalty_points
       FROM customer_stats cs
       JOIN customers c ON cs.customer_id = c.customer_id
       WHERE cs.customer_id = $1 AND c.tenant_id = $2`,
      [id, tenant_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer stats not found' });
    }
    
    res.json({ stats: result.rows[0] });
  } catch (error) {
    console.error('Get customer stats error:', error);
    res.status(500).json({ error: 'Failed to fetch customer stats' });
  }
};

module.exports = {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  getCustomerStats
};
