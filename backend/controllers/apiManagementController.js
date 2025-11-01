const db = require('../config/db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

/**
 * API Management Controller
 * Handles API key management, webhooks, OAuth, and API analytics
 */

// ============================================================================
// API KEYS MANAGEMENT
// ============================================================================

// Get all API keys for a tenant
exports.getApiKeys = async (req, res) => {
  try {
    const tenantId = req.user.role === 'super_admin' && req.query.tenant_id 
      ? req.query.tenant_id 
      : req.user.tenant_id;

    // Check if API keys are enabled for this tenant
    const featureCheck = await db.query(
      'SELECT api_keys_enabled FROM api_feature_flags WHERE tenant_id = $1',
      [tenantId]
    );

    if (featureCheck.rows.length === 0 || !featureCheck.rows[0].api_keys_enabled) {
      return res.status(403).json({
        success: false,
        message: 'API key management is not enabled for this tenant'
      });
    }

    const result = await db.query(
      `SELECT id, tenant_id, key_name, key_prefix, scopes, permissions, 
              rate_limit_per_hour, rate_limit_per_day, rate_limit_per_month,
              is_active, expires_at, last_used_at, total_requests, 
              description, environment, created_at
       FROM api_keys 
       WHERE tenant_id = $1
       ORDER BY created_at DESC`,
      [tenantId]
    );

    res.json({
      success: true,
      data: result.rows
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
    const {
      key_name,
      scopes = ['read:products', 'read:orders'],
      permissions = { products: ['read'], orders: ['read'] },
      rate_limit_per_hour = 1000,
      rate_limit_per_day = 10000,
      rate_limit_per_month = 100000,
      expires_in_days,
      description,
      environment = 'production'
    } = req.body;

    const tenantId = req.user.role === 'super_admin' && req.body.tenant_id 
      ? req.body.tenant_id 
      : req.user.tenant_id;

    // Validate required fields
    if (!key_name) {
      return res.status(400).json({
        success: false,
        message: 'API key name is required'
      });
    }

    // Check if API keys are enabled
    const featureCheck = await db.query(
      'SELECT api_keys_enabled, api_keys_max_count FROM api_feature_flags WHERE tenant_id = $1',
      [tenantId]
    );

    if (featureCheck.rows.length === 0 || !featureCheck.rows[0].api_keys_enabled) {
      return res.status(403).json({
        success: false,
        message: 'API key management is not enabled for this tenant'
      });
    }

    // Check max API keys limit
    const countResult = await db.query(
      'SELECT COUNT(*) FROM api_keys WHERE tenant_id = $1 AND is_active = true',
      [tenantId]
    );

    const currentCount = parseInt(countResult.rows[0].count);
    const maxCount = featureCheck.rows[0].api_keys_max_count || 5;

    if (currentCount >= maxCount) {
      return res.status(400).json({
        success: false,
        message: `Maximum number of API keys (${maxCount}) reached for this tenant`
      });
    }

    // Generate API key
    const apiKey = `pk_${crypto.randomBytes(32).toString('hex')}`;
    const keyPrefix = `${apiKey.substring(0, 12)}...`;
    const keyHash = await bcrypt.hash(apiKey, 10);

    // Calculate expiration date
    let expiresAt = null;
    if (expires_in_days) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expires_in_days);
    }

    // Insert API key
    const result = await db.query(
      `INSERT INTO api_keys 
       (tenant_id, key_name, api_key, key_prefix, key_hash, scopes, permissions,
        rate_limit_per_hour, rate_limit_per_day, rate_limit_per_month,
        expires_at, description, environment, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING id, tenant_id, key_name, key_prefix, scopes, permissions, 
                 rate_limit_per_hour, rate_limit_per_day, rate_limit_per_month,
                 expires_at, description, environment, created_at`,
      [
        tenantId, key_name, apiKey, keyPrefix, keyHash, scopes, JSON.stringify(permissions),
        rate_limit_per_hour, rate_limit_per_day, rate_limit_per_month,
        expiresAt, description, environment, req.user.admin_id
      ]
    );

    res.status(201).json({
      success: true,
      message: 'API key generated successfully. Save this key securely - it will not be shown again.',
      data: {
        ...result.rows[0],
        api_key: apiKey // Only shown once during creation
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

// Update API key
exports.updateApiKey = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      key_name,
      scopes,
      permissions,
      rate_limit_per_hour,
      rate_limit_per_day,
      rate_limit_per_month,
      description,
      is_active
    } = req.body;

    const tenantId = req.user.role === 'super_admin' && req.body.tenant_id 
      ? req.body.tenant_id 
      : req.user.tenant_id;

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (key_name !== undefined) {
      updates.push(`key_name = $${paramCount++}`);
      values.push(key_name);
    }
    if (scopes !== undefined) {
      updates.push(`scopes = $${paramCount++}`);
      values.push(scopes);
    }
    if (permissions !== undefined) {
      updates.push(`permissions = $${paramCount++}`);
      values.push(JSON.stringify(permissions));
    }
    if (rate_limit_per_hour !== undefined) {
      updates.push(`rate_limit_per_hour = $${paramCount++}`);
      values.push(rate_limit_per_hour);
    }
    if (rate_limit_per_day !== undefined) {
      updates.push(`rate_limit_per_day = $${paramCount++}`);
      values.push(rate_limit_per_day);
    }
    if (rate_limit_per_month !== undefined) {
      updates.push(`rate_limit_per_month = $${paramCount++}`);
      values.push(rate_limit_per_month);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(is_active);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    values.push(id, tenantId);

    const result = await db.query(
      `UPDATE api_keys 
       SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${paramCount++} AND tenant_id = $${paramCount++}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'API key not found'
      });
    }

    res.json({
      success: true,
      message: 'API key updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating API key:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update API key'
    });
  }
};

// Revoke API key
exports.revokeApiKey = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.role === 'super_admin' && req.query.tenant_id 
      ? req.query.tenant_id 
      : req.user.tenant_id;

    await db.query(
      `UPDATE api_keys 
       SET is_active = false, updated_at = NOW() 
       WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    res.json({
      success: true,
      message: 'API key revoked successfully'
    });
  } catch (error) {
    console.error('Error revoking API key:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to revoke API key'
    });
  }
};

// Delete API key
exports.deleteApiKey = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.role === 'super_admin' && req.query.tenant_id 
      ? req.query.tenant_id 
      : req.user.tenant_id;

    await db.query(
      'DELETE FROM api_keys WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    res.json({
      success: true,
      message: 'API key deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting API key:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete API key'
    });
  }
};

// Get API usage analytics
exports.getApiUsageAnalytics = async (req, res) => {
  try {
    const tenantId = req.user.role === 'super_admin' && req.query.tenant_id 
      ? req.query.tenant_id 
      : req.user.tenant_id;

    const { start_date, end_date, api_key_id } = req.query;

    let whereClause = 'WHERE tenant_id = $1';
    const values = [tenantId];
    let paramCount = 2;

    if (start_date) {
      whereClause += ` AND timestamp >= $${paramCount++}`;
      values.push(start_date);
    }
    if (end_date) {
      whereClause += ` AND timestamp <= $${paramCount++}`;
      values.push(end_date);
    }
    if (api_key_id) {
      whereClause += ` AND api_key_id = $${paramCount++}`;
      values.push(api_key_id);
    }

    // Get usage statistics
    const stats = await db.query(
      `SELECT 
         COUNT(*) as total_requests,
         COUNT(DISTINCT api_key_id) as unique_api_keys,
         COUNT(DISTINCT DATE(timestamp)) as active_days,
         AVG(response_time_ms) as avg_response_time,
         COUNT(*) FILTER (WHERE status_code >= 200 AND status_code < 300) as successful_requests,
         COUNT(*) FILTER (WHERE status_code >= 400) as failed_requests
       FROM api_usage_logs
       ${whereClause}`,
      values
    );

    // Get requests by endpoint
    const byEndpoint = await db.query(
      `SELECT endpoint, method, COUNT(*) as count
       FROM api_usage_logs
       ${whereClause}
       GROUP BY endpoint, method
       ORDER BY count DESC
       LIMIT 10`,
      values
    );

    // Get requests over time (daily)
    const overTime = await db.query(
      `SELECT DATE(timestamp) as date, COUNT(*) as count
       FROM api_usage_logs
       ${whereClause}
       GROUP BY DATE(timestamp)
       ORDER BY date DESC
       LIMIT 30`,
      values
    );

    res.json({
      success: true,
      data: {
        summary: stats.rows[0],
        by_endpoint: byEndpoint.rows,
        over_time: overTime.rows
      }
    });
  } catch (error) {
    console.error('Error fetching API analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch API analytics'
    });
  }
};

// ============================================================================
// API FEATURE FLAGS (Super Admin)
// ============================================================================

// Get API feature flags for a tenant
exports.getApiFeatureFlags = async (req, res) => {
  try {
    const tenantId = req.query.tenant_id || req.user.tenant_id;

    // Only super admin can view other tenants' flags
    if (tenantId !== req.user.tenant_id && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const result = await db.query(
      'SELECT * FROM api_feature_flags WHERE tenant_id = $1',
      [tenantId]
    );

    if (result.rows.length === 0) {
      // Create default flags if they don't exist
      const defaultFlags = await db.query(
        'INSERT INTO api_feature_flags (tenant_id) VALUES ($1) RETURNING *',
        [tenantId]
      );
      return res.json({ success: true, data: defaultFlags.rows[0] });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching API feature flags:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch API feature flags'
    });
  }
};

// Update API feature flags (Super Admin only)
exports.updateApiFeatureFlags = async (req, res) => {
  try {
    // Verify super admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin only.'
      });
    }

    // Get tenant_id from request body instead of params for security
    const { tenant_id } = req.body;
    const flags = req.body;

    // Build update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    Object.keys(flags).forEach(key => {
      if (key !== 'tenant_id') {
        updates.push(`${key} = $${paramCount++}`);
        values.push(flags[key]);
      }
    });

    values.push(tenant_id);

    const result = await db.query(
      `UPDATE api_feature_flags 
       SET ${updates.join(', ')}, updated_at = NOW()
       WHERE tenant_id = $${paramCount}
       RETURNING *`,
      values
    );

    res.json({
      success: true,
      message: 'API feature flags updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating API feature flags:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update API feature flags'
    });
  }
};

// Get global API settings (Super Admin only)
exports.getGlobalApiSettings = async (req, res) => {
  try {
    // Verify super admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin only.'
      });
    }

    const result = await db.query(
      'SELECT * FROM global_api_settings LIMIT 1'
    );

    res.json({
      success: true,
      data: result.rows[0] || {}
    });
  } catch (error) {
    console.error('Error fetching global API settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch global API settings'
    });
  }
};

// Update global API settings (Super Admin only)
exports.updateGlobalApiSettings = async (req, res) => {
  try {
    // Verify super admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin only.'
      });
    }

    const settings = req.body;

    // Build update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    Object.keys(settings).forEach(key => {
      if (key !== 'id') {
        updates.push(`${key} = $${paramCount++}`);
        values.push(settings[key]);
      }
    });

    const result = await db.query(
      `UPDATE global_api_settings 
       SET ${updates.join(', ')}, updated_at = NOW()
       RETURNING *`,
      values
    );

    res.json({
      success: true,
      message: 'Global API settings updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating global API settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update global API settings'
    });
  }
};

module.exports = exports;
