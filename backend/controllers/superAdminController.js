const { pool } = require('../config/db');

/**
 * Super Admin Controller
 * Handles super admin-only features like showcase, API management, etc.
 */

// Get showcase data (top stores/tenants)
exports.getShowcase = async (req, res) => {
  try {
    // Verify super admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin only.'
      });
    }

    // Get top performing tenants
    const topTenants = await db.query(
      `SELECT t.id, t.name, t.subdomain, cs.logo_url, cs.business_name,
              COUNT(DISTINCT o.id) as total_orders,
              COALESCE(SUM(o.final_amount), 0) as total_revenue,
              COUNT(DISTINCT c.id) as total_customers,
              t.created_at
       FROM tenants t
       LEFT JOIN chemist_settings cs ON t.id = cs.tenant_id
       LEFT JOIN orders o ON t.id = o.tenant_id
       LEFT JOIN customers c ON t.id = c.tenant_id
       GROUP BY t.id, cs.logo_url, cs.business_name
       ORDER BY total_revenue DESC
       LIMIT 10`
    );

    // Get user stories/testimonials
    const userStories = await db.query(
      `SELECT * FROM user_stories 
       WHERE is_featured = true AND is_approved = true
       ORDER BY created_at DESC
       LIMIT 5`
    );

    res.json({
      success: true,
      data: {
        top_tenants: topTenants.rows,
        user_stories: userStories.rows
      }
    });
  } catch (error) {
    console.error('Error fetching showcase:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch showcase data' 
    });
  }
};

// Add user story
exports.addUserStory = async (req, res) => {
  try {
    const { tenant_id, customer_name, story, rating, is_featured } = req.body;

    const result = await db.query(
      `INSERT INTO user_stories 
       (tenant_id, customer_name, story, rating, is_featured, is_approved) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [tenant_id, customer_name, story, rating, is_featured, req.user.role === 'super_admin']
    );

    res.json({
      success: true,
      message: 'User story added',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding user story:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to add user story' 
    });
  }
};

// Get API keys for partner integrations
exports.getApiKeys = async (req, res) => {
  try {
    // Verify super admin or tenant admin
    if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied.'
      });
    }

    const tenantId = req.user.role === 'super_admin' ? req.query.tenant_id : req.user.tenant_id;

    const keys = await db.query(
      `SELECT id, tenant_id, key_name, key_prefix, 
              scopes, is_active, last_used_at, created_at
       FROM api_keys 
       WHERE tenant_id = $1
       ORDER BY created_at DESC`,
      [tenantId]
    );

    res.json({
      success: true,
      data: keys.rows
    });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch API keys' 
    });
  }
};

// Generate new API key
exports.generateApiKey = async (req, res) => {
  try {
    // Verify super admin or tenant admin
    if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied.'
      });
    }

    const { key_name, scopes, tenant_id } = req.body;
    const targetTenantId = req.user.role === 'super_admin' ? tenant_id : req.user.tenant_id;

    // Generate API key
    const crypto = require('crypto');
    const fullKey = `pk_${crypto.randomBytes(32).toString('hex')}`;
    const keyPrefix = fullKey.substring(0, 12) + '...';

    const result = await db.query(
      `INSERT INTO api_keys 
       (tenant_id, key_name, api_key, key_prefix, scopes) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, tenant_id, key_name, key_prefix, scopes, created_at`,
      [targetTenantId, key_name, fullKey, keyPrefix, scopes]
    );

    res.json({
      success: true,
      message: 'API key generated. Save this key securely - it will not be shown again.',
      data: {
        ...result.rows[0],
        api_key: fullKey // Only shown once
      }
    });
  } catch (error) {
    console.error('Error generating API key:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate API key' 
    });
  }
};

// Revoke API key
exports.revokeApiKey = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify super admin or tenant admin
    if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied.'
      });
    }

    await db.query(
      `UPDATE api_keys SET is_active = false, updated_at = NOW() WHERE id = $1`,
      [id]
    );

    res.json({
      success: true,
      message: 'API key revoked'
    });
  } catch (error) {
    console.error('Error revoking API key:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to revoke API key' 
    });
  }
};

// Get contribution templates
exports.getContributionTemplates = async (req, res) => {
  try {
    // Verify super admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin only.'
      });
    }

    const templates = await db.query(
      `SELECT * FROM contribution_templates 
       ORDER BY category, name`
    );

    res.json({
      success: true,
      data: templates.rows
    });
  } catch (error) {
    console.error('Error fetching contribution templates:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch contribution templates' 
    });
  }
};

// Add contribution template
exports.addContributionTemplate = async (req, res) => {
  try {
    // Verify super admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin only.'
      });
    }

    const { name, category, description, template_content } = req.body;

    const result = await db.query(
      `INSERT INTO contribution_templates 
       (name, category, description, template_content) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [name, category, description, template_content]
    );

    res.json({
      success: true,
      message: 'Contribution template added',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding contribution template:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to add contribution template' 
    });
  }
};

// Get platform analytics (super admin only)
exports.getPlatformAnalytics = async (req, res) => {
  try {
    // Verify super admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin only.'
      });
    }

    // Get overall statistics
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM tenants WHERE is_active = true) as active_tenants,
        (SELECT COUNT(*) FROM customers) as total_customers,
        (SELECT COUNT(*) FROM orders) as total_orders,
        (SELECT COALESCE(SUM(final_amount), 0) FROM orders WHERE payment_status = 'paid') as total_revenue,
        (SELECT COUNT(*) FROM orders WHERE created_at > NOW() - INTERVAL '30 days') as orders_last_30_days,
        (SELECT COALESCE(SUM(final_amount), 0) FROM orders WHERE created_at > NOW() - INTERVAL '30 days' AND payment_status = 'paid') as revenue_last_30_days
    `);

    res.json({
      success: true,
      data: stats.rows[0]
    });
  } catch (error) {
    console.error('Error fetching platform analytics:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch platform analytics' 
    });
  }
};

/**
 * Get API feature toggles for a tenant
 * GET /api/super-admin/api-features/:tenantId
 */
exports.getApiFeatureToggles = async (req, res) => {
  try {
    // Verify super admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin only.'
      });
    }

    const { tenantId } = req.params;

    const result = await pool.query(
      `SELECT api_gateway_enabled, api_webhooks_enabled, api_oauth2_enabled,
              api_partner_access_enabled, api_rate_limiting_enabled,
              api_geo_fencing_enabled, api_ip_whitelisting_enabled
       FROM feature_flags
       WHERE tenant_id = $1`,
      [tenantId]
    );

    if (result.rows.length === 0) {
      // Create default feature flags if not exists
      await pool.query(
        `INSERT INTO feature_flags (tenant_id) VALUES ($1)`,
        [tenantId]
      );
      
      return res.json({
        success: true,
        data: {
          api_gateway_enabled: false,
          api_webhooks_enabled: false,
          api_oauth2_enabled: false,
          api_partner_access_enabled: false,
          api_rate_limiting_enabled: true,
          api_geo_fencing_enabled: false,
          api_ip_whitelisting_enabled: false
        }
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching API feature toggles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch API feature toggles'
    });
  }
};

/**
 * Update API feature toggles for a tenant
 * PUT /api/super-admin/api-features/:tenantId
 */
exports.updateApiFeatureToggles = async (req, res) => {
  try {
    // Verify super admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin only.'
      });
    }

    const { tenantId } = req.params;
    const {
      api_gateway_enabled,
      api_webhooks_enabled,
      api_oauth2_enabled,
      api_partner_access_enabled,
      api_rate_limiting_enabled,
      api_geo_fencing_enabled,
      api_ip_whitelisting_enabled
    } = req.body;

    const updates = [];
    const params = [];
    let paramCount = 1;

    if (api_gateway_enabled !== undefined) {
      updates.push(`api_gateway_enabled = $${paramCount++}`);
      params.push(api_gateway_enabled);
    }
    if (api_webhooks_enabled !== undefined) {
      updates.push(`api_webhooks_enabled = $${paramCount++}`);
      params.push(api_webhooks_enabled);
    }
    if (api_oauth2_enabled !== undefined) {
      updates.push(`api_oauth2_enabled = $${paramCount++}`);
      params.push(api_oauth2_enabled);
    }
    if (api_partner_access_enabled !== undefined) {
      updates.push(`api_partner_access_enabled = $${paramCount++}`);
      params.push(api_partner_access_enabled);
    }
    if (api_rate_limiting_enabled !== undefined) {
      updates.push(`api_rate_limiting_enabled = $${paramCount++}`);
      params.push(api_rate_limiting_enabled);
    }
    if (api_geo_fencing_enabled !== undefined) {
      updates.push(`api_geo_fencing_enabled = $${paramCount++}`);
      params.push(api_geo_fencing_enabled);
    }
    if (api_ip_whitelisting_enabled !== undefined) {
      updates.push(`api_ip_whitelisting_enabled = $${paramCount++}`);
      params.push(api_ip_whitelisting_enabled);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid updates provided'
      });
    }

    params.push(tenantId);

    await pool.query(
      `UPDATE feature_flags
       SET ${updates.join(', ')}, updated_at = NOW()
       WHERE tenant_id = $${paramCount}`,
      params
    );

    // Log the change in audit logs
    await pool.query(
      `INSERT INTO audit_logs (action, resource_type, resource_id, performed_by, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        'update_api_features',
        'feature_flags',
        tenantId,
        req.user.admin_id,
        JSON.stringify(req.body)
      ]
    );

    res.json({
      success: true,
      message: 'API feature toggles updated successfully'
    });
  } catch (error) {
    console.error('Error updating API feature toggles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update API feature toggles'
    });
  }
};

/**
 * Get global API settings
 * GET /api/super-admin/api-settings
 */
exports.getGlobalApiSettings = async (req, res) => {
  try {
    // Verify super admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin only.'
      });
    }

    const result = await pool.query(
      `SELECT setting_key, setting_value, description, updated_at
       FROM api_global_settings
       ORDER BY setting_key`
    );

    const settings = result.rows.reduce((acc, row) => {
      acc[row.setting_key] = {
        value: row.setting_value,
        description: row.description,
        updated_at: row.updated_at
      };
      return acc;
    }, {});

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching global API settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch global API settings'
    });
  }
};

/**
 * Update global API settings
 * PUT /api/super-admin/api-settings/:settingKey
 */
exports.updateGlobalApiSetting = async (req, res) => {
  try {
    // Verify super admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin only.'
      });
    }

    const { settingKey } = req.params;
    const { value, description } = req.body;

    if (value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Setting value is required'
      });
    }

    await pool.query(
      `INSERT INTO api_global_settings (setting_key, setting_value, description, updated_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (setting_key)
       DO UPDATE SET setting_value = $2, description = COALESCE($3, api_global_settings.description),
                     updated_at = NOW(), updated_by = $4`,
      [settingKey, JSON.stringify(value), description, req.user.admin_id]
    );

    res.json({
      success: true,
      message: 'Global API setting updated successfully'
    });
  } catch (error) {
    console.error('Error updating global API setting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update global API setting'
    });
  }
};
