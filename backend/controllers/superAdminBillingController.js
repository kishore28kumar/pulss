const db = require('../config/db');
const billingService = require('../services/billingService');
const paymentGatewayService = require('../services/paymentGatewayService');

/**
 * Super Admin Billing Controller
 * Manages billing, plans, coupons, and advanced feature permissions
 */

// Get all tenants with subscription info
exports.getAllTenantsSubscriptions = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    let query = `
      SELECT t.tenant_id, t.name, t.status as tenant_status,
             ts.subscription_id, ts.status as subscription_status,
             ts.current_period_start, ts.current_period_end,
             sp.name as plan_name, sp.base_price, sp.billing_period,
             ts.trial_start, ts.trial_end
      FROM tenants t
      LEFT JOIN tenant_subscriptions ts ON t.tenant_id = ts.tenant_id
      LEFT JOIN subscription_plans sp ON ts.plan_id = sp.plan_id
      WHERE 1=1
    `;

    const values = [];
    let paramCount = 1;

    if (status) {
      query += ` AND ts.status = $${paramCount++}`;
      values.push(status);
    }

    query += ` ORDER BY t.created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    values.push(limit, (page - 1) * limit);

    const result = await db.query(query, values);

    // Get total count
    const countQuery = status
      ? 'SELECT COUNT(*) FROM tenant_subscriptions WHERE status = $1'
      : 'SELECT COUNT(*) FROM tenants';
    const countValues = status ? [status] : [];
    const countResult = await db.query(countQuery, countValues);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
      },
    });
  } catch (error) {
    console.error('Error fetching tenant subscriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tenant subscriptions',
    });
  }
};

// Create or update subscription plan
exports.managePlan = async (req, res) => {
  try {
    const { planId } = req.params;
    const {
      name,
      description,
      billing_period,
      base_price,
      currency,
      features,
      limits,
      trial_days,
      is_active,
      is_public,
    } = req.body;

    if (planId) {
      // Update existing plan
      const result = await db.query(
        `UPDATE subscription_plans 
         SET name = $1, description = $2, billing_period = $3, base_price = $4,
             currency = $5, features = $6, limits = $7, trial_days = $8,
             is_active = $9, is_public = $10, updated_at = NOW()
         WHERE plan_id = $11
         RETURNING *`,
        [
          name,
          description,
          billing_period,
          base_price,
          currency,
          features,
          limits,
          trial_days,
          is_active,
          is_public,
          planId,
        ]
      );

      res.json({
        success: true,
        message: 'Plan updated successfully',
        data: result.rows[0],
      });
    } else {
      // Create new plan
      const result = await db.query(
        `INSERT INTO subscription_plans 
         (name, description, billing_period, base_price, currency,
          features, limits, trial_days, is_active, is_public)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          name,
          description,
          billing_period,
          base_price,
          currency,
          features,
          limits,
          trial_days,
          is_active,
          is_public,
        ]
      );

      res.json({
        success: true,
        message: 'Plan created successfully',
        data: result.rows[0],
      });
    }
  } catch (error) {
    console.error('Error managing plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to manage plan',
    });
  }
};

// Delete plan
exports.deletePlan = async (req, res) => {
  try {
    const { planId } = req.params;

    // Check if plan has active subscriptions
    const check = await db.query(
      'SELECT COUNT(*) FROM tenant_subscriptions WHERE plan_id = $1 AND status IN ($2, $3)',
      [planId, 'active', 'trial']
    );

    if (parseInt(check.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete plan with active subscriptions. Deactivate it instead.',
      });
    }

    await db.query('DELETE FROM subscription_plans WHERE plan_id = $1', [planId]);

    res.json({
      success: true,
      message: 'Plan deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete plan',
    });
  }
};

// Get all coupons
exports.getCoupons = async (req, res) => {
  try {
    const { is_active, page = 1, limit = 20 } = req.query;

    let query = 'SELECT * FROM coupons WHERE 1=1';
    const values = [];
    let paramCount = 1;

    if (is_active !== undefined) {
      query += ` AND is_active = $${paramCount++}`;
      values.push(is_active === 'true');
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    values.push(limit, (page - 1) * limit);

    const result = await db.query(query, values);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching coupons:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch coupons',
    });
  }
};

// Create coupon
exports.createCoupon = async (req, res) => {
  try {
    const {
      code,
      name,
      description,
      discount_type,
      discount_value,
      currency,
      valid_from,
      valid_until,
      max_redemptions,
      min_purchase_amount,
      max_discount_amount,
      applies_to,
      plan_ids,
      first_time_only,
    } = req.body;

    const createdBy = req.user.admin_id;

    const result = await db.query(
      `INSERT INTO coupons 
       (code, name, description, discount_type, discount_value, currency,
        valid_from, valid_until, max_redemptions, min_purchase_amount,
        max_discount_amount, applies_to, plan_ids, first_time_only, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        code,
        name,
        description,
        discount_type,
        discount_value,
        currency,
        valid_from,
        valid_until,
        max_redemptions,
        min_purchase_amount,
        max_discount_amount,
        applies_to,
        plan_ids,
        first_time_only,
        createdBy,
      ]
    );

    res.json({
      success: true,
      message: 'Coupon created successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error creating coupon:', error);
    res.status(500).json({
      success: false,
      message: error.code === '23505' ? 'Coupon code already exists' : 'Failed to create coupon',
    });
  }
};

// Update coupon
exports.updateCoupon = async (req, res) => {
  try {
    const { couponId } = req.params;
    const updates = req.body;

    const allowedFields = [
      'name',
      'description',
      'valid_until',
      'max_redemptions',
      'min_purchase_amount',
      'max_discount_amount',
      'is_active',
    ];

    const updateFields = [];
    const values = [];
    let paramCount = 1;

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateFields.push(`${field} = $${paramCount++}`);
        values.push(updates[field]);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update',
      });
    }

    values.push(couponId);

    const result = await db.query(
      `UPDATE coupons 
       SET ${updateFields.join(', ')}, updated_at = NOW()
       WHERE coupon_id = $${paramCount}
       RETURNING *`,
      values
    );

    res.json({
      success: true,
      message: 'Coupon updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating coupon:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update coupon',
    });
  }
};

// Delete coupon
exports.deleteCoupon = async (req, res) => {
  try {
    const { couponId } = req.params;

    // Soft delete by deactivating
    await db.query(
      'UPDATE coupons SET is_active = false, updated_at = NOW() WHERE coupon_id = $1',
      [couponId]
    );

    res.json({
      success: true,
      message: 'Coupon deactivated successfully',
    });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete coupon',
    });
  }
};

// Get tenant feature permissions
exports.getTenantFeatures = async (req, res) => {
  try {
    const { tenantId } = req.params;

    const result = await db.query(
      `SELECT tfp.*, a.full_name as enabled_by_name
       FROM tenant_feature_permissions tfp
       LEFT JOIN admins a ON tfp.enabled_by = a.admin_id
       WHERE tfp.tenant_id = $1
       ORDER BY tfp.created_at DESC`,
      [tenantId]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching tenant features:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tenant features',
    });
  }
};

// Enable/disable feature for tenant
exports.setTenantFeature = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { featureKey, enabled, metadata } = req.body;
    const adminId = req.user.admin_id;

    // Verify user is super admin
    const adminCheck = await db.query('SELECT role FROM admins WHERE admin_id = $1', [adminId]);

    if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only super admins can manage features',
      });
    }

    const result = await billingService.setFeatureEnabled(tenantId, featureKey, enabled, adminId);

    // If metadata provided, update it
    if (metadata) {
      await db.query(
        'UPDATE tenant_feature_permissions SET metadata = $1 WHERE permission_id = $2',
        [metadata, result.permission_id]
      );
    }

    res.json({
      success: true,
      message: `Feature ${enabled ? 'enabled' : 'disabled'} successfully`,
      data: result,
    });
  } catch (error) {
    console.error('Error setting tenant feature:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set tenant feature',
    });
  }
};

// Get billing analytics
exports.getBillingAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate
      ? new Date(startDate)
      : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const end = endDate ? new Date(endDate) : new Date();

    // Total revenue
    const revenueResult = await db.query(
      `SELECT SUM(amount_paid) as total_revenue, COUNT(*) as paid_invoices
       FROM invoices
       WHERE payment_status = 'paid' 
       AND paid_at >= $1 AND paid_at <= $2`,
      [start, end]
    );

    // Active subscriptions by status
    const subscriptionsResult = await db.query(
      `SELECT status, COUNT(*) as count
       FROM tenant_subscriptions
       GROUP BY status`
    );

    // Revenue by plan
    const planRevenueResult = await db.query(
      `SELECT sp.name, sp.base_price, COUNT(ts.subscription_id) as subscriptions,
              COUNT(ts.subscription_id) * sp.base_price as estimated_revenue
       FROM subscription_plans sp
       LEFT JOIN tenant_subscriptions ts ON sp.plan_id = ts.plan_id
       WHERE sp.is_active = true
       GROUP BY sp.plan_id, sp.name, sp.base_price
       ORDER BY estimated_revenue DESC`
    );

    // Coupon usage
    const couponResult = await db.query(
      `SELECT c.code, c.name, COUNT(cr.redemption_id) as redemptions,
              SUM(cr.discount_amount) as total_discount
       FROM coupons c
       LEFT JOIN coupon_redemptions cr ON c.coupon_id = cr.coupon_id
         AND cr.redeemed_at >= $1 AND cr.redeemed_at <= $2
       WHERE c.is_active = true
       GROUP BY c.coupon_id, c.code, c.name
       ORDER BY total_discount DESC
       LIMIT 10`,
      [start, end]
    );

    // Pending refunds
    const refundsResult = await db.query(
      `SELECT COUNT(*) as pending_count, SUM(amount) as pending_amount
       FROM refunds
       WHERE status = 'pending'`
    );

    res.json({
      success: true,
      data: {
        period: { start, end },
        revenue: {
          total: parseFloat(revenueResult.rows[0].total_revenue || 0),
          paid_invoices: parseInt(revenueResult.rows[0].paid_invoices),
        },
        subscriptions: subscriptionsResult.rows,
        plan_revenue: planRevenueResult.rows,
        top_coupons: couponResult.rows,
        refunds: refundsResult.rows[0],
      },
    });
  } catch (error) {
    console.error('Error fetching billing analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch billing analytics',
    });
  }
};

// Get all invoices (super admin)
exports.getAllInvoices = async (req, res) => {
  try {
    const { status, tenant_id, page = 1, limit = 20 } = req.query;

    let query = `
      SELECT i.*, t.name as tenant_name
      FROM invoices i
      JOIN tenants t ON i.tenant_id = t.tenant_id
      WHERE 1=1
    `;

    const values = [];
    let paramCount = 1;

    if (status) {
      query += ` AND i.status = $${paramCount++}`;
      values.push(status);
    }

    if (tenant_id) {
      query += ` AND i.tenant_id = $${paramCount++}`;
      values.push(tenant_id);
    }

    query += ` ORDER BY i.invoice_date DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    values.push(limit, (page - 1) * limit);

    const result = await db.query(query, values);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching all invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoices',
    });
  }
};

// Approve/reject refund
exports.manageRefund = async (req, res) => {
  try {
    const { refundId } = req.params;
    const { action, gateway_refund_id, gateway_response } = req.body; // action: 'approve' or 'reject'
    const adminId = req.user.admin_id;

    if (action === 'approve') {
      // Update refund status
      const result = await db.query(
        `UPDATE refunds 
         SET status = 'processing', approved_by = $1, approved_at = NOW(),
             gateway_refund_id = $2, gateway_response = $3
         WHERE refund_id = $4
         RETURNING *`,
        [adminId, gateway_refund_id, gateway_response || {}, refundId]
      );

      // In production, actually process refund via gateway here

      res.json({
        success: true,
        message: 'Refund approved and processing',
        data: result.rows[0],
      });
    } else if (action === 'reject') {
      await db.query(
        `UPDATE refunds 
         SET status = 'failed', approved_by = $1, approved_at = NOW()
         WHERE refund_id = $2`,
        [adminId, refundId]
      );

      res.json({
        success: true,
        message: 'Refund rejected',
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid action. Use "approve" or "reject"',
      });
    }
  } catch (error) {
    console.error('Error managing refund:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to manage refund',
    });
  }
};

// Get billing audit log
exports.getAuditLog = async (req, res) => {
  try {
    const { tenant_id, action, startDate, endDate, page = 1, limit = 50 } = req.query;

    let query = 'SELECT * FROM billing_audit_log WHERE 1=1';
    const values = [];
    let paramCount = 1;

    if (tenant_id) {
      query += ` AND tenant_id = $${paramCount++}`;
      values.push(tenant_id);
    }

    if (action) {
      query += ` AND action = $${paramCount++}`;
      values.push(action);
    }

    if (startDate) {
      query += ` AND created_at >= $${paramCount++}`;
      values.push(new Date(startDate));
    }

    if (endDate) {
      query += ` AND created_at <= $${paramCount++}`;
      values.push(new Date(endDate));
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    values.push(limit, (page - 1) * limit);

    const result = await db.query(query, values);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit log',
    });
  }
};

module.exports = exports;
