const { pool } = require('../config/db');

// Get rewards for a tenant
const getRewards = async (req, res) => {
  try {
    const { tenant_id } = req;
    
    if (!tenant_id) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }
    
    const result = await pool.query(
      `SELECT * FROM rewards 
       WHERE tenant_id = $1 AND is_active = true
       ORDER BY points_required ASC`,
      [tenant_id]
    );
    
    res.json({ rewards: result.rows });
  } catch (error) {
    console.error('Get rewards error:', error);
    res.status(500).json({ error: 'Failed to fetch rewards' });
  }
};

// Redeem a reward
const redeemReward = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { tenant_id } = req;
    const { customer_id, reward_id } = req.body;
    
    if (!tenant_id || !customer_id || !reward_id) {
      return res.status(400).json({ error: 'Tenant ID, customer ID, and reward ID required' });
    }
    
    await client.query('BEGIN');
    
    // Get customer points
    const customerResult = await client.query(
      'SELECT loyalty_points FROM customers WHERE customer_id = $1 AND tenant_id = $2',
      [customer_id, tenant_id]
    );
    
    if (customerResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    const current_points = customerResult.rows[0].loyalty_points;
    
    // Get reward details
    const rewardResult = await client.query(
      'SELECT * FROM rewards WHERE reward_id = $1 AND tenant_id = $2 AND is_active = true',
      [reward_id, tenant_id]
    );
    
    if (rewardResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Reward not found or inactive' });
    }
    
    const reward = rewardResult.rows[0];
    
    // Check if customer has enough points
    if (current_points < reward.points_required) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Insufficient points',
        required: reward.points_required,
        available: current_points
      });
    }
    
    // Deduct points from customer
    await client.query(
      'UPDATE customers SET loyalty_points = loyalty_points - $1, updated_at = NOW() WHERE customer_id = $2',
      [reward.points_required, customer_id]
    );
    
    // Create redemption record
    const redemptionResult = await client.query(
      `INSERT INTO reward_redemptions (tenant_id, customer_id, reward_id, points_used, status, redeemed_at) 
       VALUES ($1, $2, $3, $4, $5, NOW()) 
       RETURNING *`,
      [tenant_id, customer_id, reward_id, reward.points_required, 'redeemed']
    );
    
    await client.query('COMMIT');
    
    res.status(201).json({
      message: 'Reward redeemed successfully',
      redemption: redemptionResult.rows[0],
      points_remaining: current_points - reward.points_required
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Redeem reward error:', error);
    res.status(500).json({ error: 'Failed to redeem reward' });
  } finally {
    client.release();
  }
};

// Get customer redemptions
const getCustomerRedemptions = async (req, res) => {
  try {
    const { tenant_id } = req;
    const { customer_id } = req.params;
    
    const result = await pool.query(
      `SELECT rr.*, r.name as reward_name, r.description as reward_description
       FROM reward_redemptions rr
       JOIN rewards r ON rr.reward_id = r.reward_id
       WHERE rr.customer_id = $1 AND rr.tenant_id = $2
       ORDER BY rr.redeemed_at DESC`,
      [customer_id, tenant_id]
    );
    
    res.json({ redemptions: result.rows });
  } catch (error) {
    console.error('Get customer redemptions error:', error);
    res.status(500).json({ error: 'Failed to fetch redemptions' });
  }
};

// Create reward (admin only)
const createReward = async (req, res) => {
  try {
    const { tenant_id } = req;
    const { name, description, points_required, reward_type, discount_amount, discount_percentage } = req.body;
    
    if (!tenant_id || !name || !points_required) {
      return res.status(400).json({ error: 'Tenant ID, name, and points required are required' });
    }
    
    const result = await pool.query(
      `INSERT INTO rewards (tenant_id, name, description, points_required, reward_type, discount_amount, discount_percentage, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [tenant_id, name, description, points_required, reward_type || 'discount', discount_amount, discount_percentage, true]
    );
    
    res.status(201).json({
      message: 'Reward created successfully',
      reward: result.rows[0]
    });
  } catch (error) {
    console.error('Create reward error:', error);
    res.status(500).json({ error: 'Failed to create reward' });
  }
};

module.exports = {
  getRewards,
  redeemReward,
  getCustomerRedemptions,
  createReward
};
