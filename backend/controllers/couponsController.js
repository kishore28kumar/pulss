const { pool } = require('../config/db');

/**
 * Get all coupons
 */
const getCoupons = async (req, res) => {
  try {
    const { is_active, applicable_plan } = req.query;
    
    let query = 'SELECT * FROM coupons WHERE 1=1';
    const params = [];
    
    if (is_active !== undefined) {
      params.push(is_active === 'true');
      query += ` AND is_active = $${params.length}`;
    }
    
    if (applicable_plan) {
      params.push(applicable_plan);
      query += ` AND (applicable_plans IS NULL OR $${params.length} = ANY(applicable_plans))`;
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, params);
    res.json({ coupons: result.rows });
  } catch (error) {
    console.error('Error fetching coupons:', error);
    res.status(500).json({ error: 'Failed to fetch coupons' });
  }
};

/**
 * Validate a coupon code
 */
const validateCoupon = async (req, res) => {
  try {
    const { code } = req.params;
    const { planId, subscriptionValue } = req.query;
    
    const result = await pool.query(
      `SELECT * FROM coupons 
       WHERE code = $1 AND is_active = true
       AND (valid_from IS NULL OR valid_from <= NOW())
       AND (valid_until IS NULL OR valid_until >= NOW())
       AND (max_uses IS NULL OR times_used < max_uses)`,
      [code]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        valid: false, 
        error: 'Invalid or expired coupon code' 
      });
    }
    
    const coupon = result.rows[0];
    
    // Check plan applicability
    if (coupon.applicable_plans && coupon.applicable_plans.length > 0) {
      if (!planId || !coupon.applicable_plans.includes(planId)) {
        return res.status(400).json({ 
          valid: false, 
          error: 'Coupon not applicable to this plan' 
        });
      }
    }
    
    // Check minimum subscription value
    if (coupon.min_subscription_value && subscriptionValue) {
      if (parseFloat(subscriptionValue) < parseFloat(coupon.min_subscription_value)) {
        return res.status(400).json({ 
          valid: false, 
          error: `Minimum subscription value of ${coupon.min_subscription_value} required` 
        });
      }
    }
    
    // Calculate discount
    let discountAmount = 0;
    if (subscriptionValue) {
      if (coupon.discount_type === 'percentage') {
        discountAmount = parseFloat(subscriptionValue) * (parseFloat(coupon.discount_value) / 100);
      } else {
        discountAmount = parseFloat(coupon.discount_value);
      }
    }
    
    res.json({ 
      valid: true, 
      coupon: {
        ...coupon,
        discount_amount: discountAmount
      }
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    res.status(500).json({ error: 'Failed to validate coupon' });
  }
};

/**
 * Create a coupon (Super Admin only)
 */
const createCoupon = async (req, res) => {
  try {
    const {
      code, description, discount_type, discount_value,
      valid_from, valid_until, max_uses, max_uses_per_tenant,
      applicable_plans, min_subscription_value
    } = req.body;
    
    if (!code || !discount_type || discount_value === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if code already exists
    const existingCoupon = await pool.query(
      'SELECT coupon_id FROM coupons WHERE code = $1',
      [code]
    );
    
    if (existingCoupon.rows.length > 0) {
      return res.status(400).json({ error: 'Coupon code already exists' });
    }
    
    const result = await pool.query(
      `INSERT INTO coupons (
        code, description, discount_type, discount_value,
        valid_from, valid_until, max_uses, max_uses_per_tenant,
        applicable_plans, min_subscription_value
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        code, description, discount_type, discount_value,
        valid_from, valid_until, max_uses, max_uses_per_tenant,
        applicable_plans, min_subscription_value
      ]
    );
    
    res.status(201).json({ coupon: result.rows[0] });
  } catch (error) {
    console.error('Error creating coupon:', error);
    res.status(500).json({ error: 'Failed to create coupon' });
  }
};

/**
 * Update a coupon (Super Admin only)
 */
const updateCoupon = async (req, res) => {
  try {
    const { couponId } = req.params;
    const updates = req.body;
    
    const allowedFields = [
      'description', 'valid_from', 'valid_until', 'max_uses',
      'max_uses_per_tenant', 'is_active', 'min_subscription_value'
    ];
    
    const setFields = [];
    const values = [];
    
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        values.push(updates[key]);
        setFields.push(`${key} = $${values.length}`);
      }
    });
    
    if (setFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    values.push(couponId);
    const query = `
      UPDATE coupons 
      SET ${setFields.join(', ')}, updated_at = NOW()
      WHERE coupon_id = $${values.length}
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    
    res.json({ coupon: result.rows[0] });
  } catch (error) {
    console.error('Error updating coupon:', error);
    res.status(500).json({ error: 'Failed to update coupon' });
  }
};

/**
 * Delete a coupon (Super Admin only)
 */
const deleteCoupon = async (req, res) => {
  try {
    const { couponId } = req.params;
    
    const result = await pool.query(
      'DELETE FROM coupons WHERE coupon_id = $1 RETURNING *',
      [couponId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    
    res.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    res.status(500).json({ error: 'Failed to delete coupon' });
  }
};

/**
 * Get coupon usage statistics
 */
const getCouponUsage = async (req, res) => {
  try {
    const { couponId } = req.params;
    
    const usageResult = await pool.query(
      `SELECT 
        c.*,
        COUNT(cu.usage_id) as total_uses,
        SUM(cu.discount_amount) as total_discount_given,
        COUNT(DISTINCT cu.tenant_id) as unique_tenants
       FROM coupons c
       LEFT JOIN coupon_usage cu ON c.coupon_id = cu.coupon_id
       WHERE c.coupon_id = $1
       GROUP BY c.coupon_id`,
      [couponId]
    );
    
    if (usageResult.rows.length === 0) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    
    // Get detailed usage history
    const historyResult = await pool.query(
      `SELECT 
        cu.*,
        t.name as tenant_name,
        s.subscription_id,
        i.invoice_number
       FROM coupon_usage cu
       JOIN tenants t ON cu.tenant_id = t.tenant_id
       LEFT JOIN subscriptions s ON cu.subscription_id = s.subscription_id
       LEFT JOIN invoices i ON cu.invoice_id = i.invoice_id
       WHERE cu.coupon_id = $1
       ORDER BY cu.used_at DESC`,
      [couponId]
    );
    
    res.json({
      coupon: usageResult.rows[0],
      usage_history: historyResult.rows
    });
  } catch (error) {
    console.error('Error fetching coupon usage:', error);
    res.status(500).json({ error: 'Failed to fetch coupon usage' });
  }
};

module.exports = {
  getCoupons,
  validateCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getCouponUsage
};
