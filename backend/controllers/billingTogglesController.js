const { pool } = require('../config/db');

/**
 * Get billing feature toggles for a tenant
 */
const getBillingToggles = async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM billing_feature_toggles WHERE tenant_id = $1',
      [tenantId]
    );
    
    if (result.rows.length === 0) {
      // Create default toggles if not exists
      const createResult = await pool.query(
        'INSERT INTO billing_feature_toggles (tenant_id) VALUES ($1) RETURNING *',
        [tenantId]
      );
      return res.json({ toggles: createResult.rows[0] });
    }
    
    res.json({ toggles: result.rows[0] });
  } catch (error) {
    console.error('Error fetching billing toggles:', error);
    res.status(500).json({ error: 'Failed to fetch billing toggles' });
  }
};

/**
 * Get all tenants' billing toggles (Super Admin only)
 */
const getAllBillingToggles = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT bft.*, t.name as tenant_name, t.status as tenant_status
       FROM billing_feature_toggles bft
       JOIN tenants t ON bft.tenant_id = t.tenant_id
       ORDER BY t.name ASC`
    );
    
    res.json({ toggles: result.rows });
  } catch (error) {
    console.error('Error fetching all billing toggles:', error);
    res.status(500).json({ error: 'Failed to fetch billing toggles' });
  }
};

/**
 * Update billing feature toggles (Super Admin only)
 */
const updateBillingToggles = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const updates = req.body;
    
    const allowedFields = [
      'billing_enabled',
      'subscription_management_enabled',
      'credit_card_payments_enabled',
      'upi_payments_enabled',
      'netbanking_enabled',
      'wallet_payments_enabled',
      'usage_based_billing_enabled',
      'metered_billing_enabled',
      'invoice_generation_enabled',
      'automated_invoicing_enabled',
      'coupons_enabled',
      'promotional_discounts_enabled',
      'partner_commissions_enabled',
      'reseller_program_enabled',
      'gst_compliance_enabled',
      'tax_calculations_enabled',
      'billing_analytics_enabled',
      'revenue_reports_enabled',
      'churn_analysis_enabled',
      'invoice_export_enabled',
      'billing_history_export_enabled'
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
    
    values.push(tenantId);
    const query = `
      UPDATE billing_feature_toggles 
      SET ${setFields.join(', ')}, updated_at = NOW()
      WHERE tenant_id = $${values.length}
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      // Create if not exists
      const createResult = await pool.query(
        `INSERT INTO billing_feature_toggles (tenant_id, ${Object.keys(updates).join(', ')})
         VALUES ($1, ${Object.keys(updates).map((_, i) => `$${i + 2}`).join(', ')})
         RETURNING *`,
        [tenantId, ...Object.values(updates)]
      );
      return res.json({ toggles: createResult.rows[0] });
    }
    
    res.json({ toggles: result.rows[0] });
  } catch (error) {
    console.error('Error updating billing toggles:', error);
    res.status(500).json({ error: 'Failed to update billing toggles' });
  }
};

/**
 * Enable all billing features for a tenant (Super Admin only)
 */
const enableAllBillingFeatures = async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    const result = await pool.query(
      `UPDATE billing_feature_toggles 
       SET 
         billing_enabled = true,
         subscription_management_enabled = true,
         credit_card_payments_enabled = true,
         upi_payments_enabled = true,
         netbanking_enabled = true,
         wallet_payments_enabled = true,
         usage_based_billing_enabled = true,
         metered_billing_enabled = true,
         invoice_generation_enabled = true,
         automated_invoicing_enabled = true,
         coupons_enabled = true,
         promotional_discounts_enabled = true,
         partner_commissions_enabled = true,
         reseller_program_enabled = true,
         gst_compliance_enabled = true,
         tax_calculations_enabled = true,
         billing_analytics_enabled = true,
         revenue_reports_enabled = true,
         churn_analysis_enabled = true,
         invoice_export_enabled = true,
         billing_history_export_enabled = true,
         updated_at = NOW()
       WHERE tenant_id = $1
       RETURNING *`,
      [tenantId]
    );
    
    if (result.rows.length === 0) {
      // Create with all features enabled
      const createResult = await pool.query(
        `INSERT INTO billing_feature_toggles (
          tenant_id, billing_enabled, subscription_management_enabled,
          credit_card_payments_enabled, upi_payments_enabled, netbanking_enabled,
          wallet_payments_enabled, usage_based_billing_enabled, metered_billing_enabled,
          invoice_generation_enabled, automated_invoicing_enabled, coupons_enabled,
          promotional_discounts_enabled, partner_commissions_enabled, reseller_program_enabled,
          gst_compliance_enabled, tax_calculations_enabled, billing_analytics_enabled,
          revenue_reports_enabled, churn_analysis_enabled, invoice_export_enabled,
          billing_history_export_enabled
        ) VALUES (
          $1, true, true, true, true, true, true, true, true, true, true, true,
          true, true, true, true, true, true, true, true, true, true
        ) RETURNING *`,
        [tenantId]
      );
      return res.json({ toggles: createResult.rows[0] });
    }
    
    res.json({ toggles: result.rows[0] });
  } catch (error) {
    console.error('Error enabling all billing features:', error);
    res.status(500).json({ error: 'Failed to enable all billing features' });
  }
};

/**
 * Disable all billing features for a tenant (Super Admin only)
 */
const disableAllBillingFeatures = async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    const result = await pool.query(
      `UPDATE billing_feature_toggles 
       SET 
         billing_enabled = false,
         subscription_management_enabled = false,
         credit_card_payments_enabled = false,
         upi_payments_enabled = false,
         netbanking_enabled = false,
         wallet_payments_enabled = false,
         usage_based_billing_enabled = false,
         metered_billing_enabled = false,
         invoice_generation_enabled = false,
         automated_invoicing_enabled = false,
         coupons_enabled = false,
         promotional_discounts_enabled = false,
         partner_commissions_enabled = false,
         reseller_program_enabled = false,
         gst_compliance_enabled = false,
         tax_calculations_enabled = false,
         billing_analytics_enabled = false,
         revenue_reports_enabled = false,
         churn_analysis_enabled = false,
         invoice_export_enabled = false,
         billing_history_export_enabled = false,
         updated_at = NOW()
       WHERE tenant_id = $1
       RETURNING *`,
      [tenantId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Billing toggles not found' });
    }
    
    res.json({ toggles: result.rows[0] });
  } catch (error) {
    console.error('Error disabling all billing features:', error);
    res.status(500).json({ error: 'Failed to disable all billing features' });
  }
};

/**
 * Check if a specific billing feature is enabled
 */
const checkFeatureEnabled = async (req, res) => {
  try {
    const { tenantId, feature } = req.params;
    
    const result = await pool.query(
      `SELECT ${feature} as is_enabled FROM billing_feature_toggles WHERE tenant_id = $1`,
      [tenantId]
    );
    
    if (result.rows.length === 0) {
      return res.json({ is_enabled: false });
    }
    
    res.json({ is_enabled: result.rows[0].is_enabled });
  } catch (error) {
    console.error('Error checking feature enabled:', error);
    res.status(500).json({ error: 'Failed to check feature status' });
  }
};

/**
 * Get billing features summary
 */
const getBillingSummary = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_tenants,
        COUNT(CASE WHEN billing_enabled THEN 1 END) as billing_enabled_count,
        COUNT(CASE WHEN subscription_management_enabled THEN 1 END) as subscription_enabled_count,
        COUNT(CASE WHEN invoice_generation_enabled THEN 1 END) as invoice_enabled_count,
        COUNT(CASE WHEN partner_commissions_enabled THEN 1 END) as commissions_enabled_count,
        COUNT(CASE WHEN usage_based_billing_enabled THEN 1 END) as usage_billing_enabled_count
      FROM billing_feature_toggles
    `);
    
    res.json({ summary: result.rows[0] });
  } catch (error) {
    console.error('Error fetching billing summary:', error);
    res.status(500).json({ error: 'Failed to fetch billing summary' });
  }
};

module.exports = {
  getBillingToggles,
  getAllBillingToggles,
  updateBillingToggles,
  enableAllBillingFeatures,
  disableAllBillingFeatures,
  checkFeatureEnabled,
  getBillingSummary
};
