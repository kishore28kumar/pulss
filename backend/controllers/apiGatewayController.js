const apiGatewayService = require('../services/apiGatewayService');
const partnerService = require('../services/partnerService');
const oauthService = require('../services/oauthService');
const { pool } = require('../config/db');

/**
 * API Gateway Controller
 * Handles API key management, analytics, and configuration
 */

/**
 * Generate new API key
 * POST /api/gateway/keys
 */
exports.generateApiKey = async (req, res) => {
  try {
    // Check if user is super admin or tenant admin
    if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const {
      key_name,
      key_type = 'tenant',
      scopes = [],
      description,
      rate_limit_per_minute,
      rate_limit_per_hour,
      rate_limit_per_day,
      ip_whitelist,
      allowed_origins,
      geo_restrictions,
      expires_at,
      tenant_id,
      partner_id
    } = req.body;

    // Determine tenant ID
    const targetTenantId = req.user.role === 'super_admin' 
      ? tenant_id 
      : req.user.tenant_id;

    // Validate required fields
    if (!key_name || !scopes || scopes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Key name and scopes are required'
      });
    }

    // Check if API gateway is enabled for tenant
    const featureCheck = await pool.query(
      `SELECT api_gateway_enabled FROM feature_flags WHERE tenant_id = $1`,
      [targetTenantId]
    );

    if (featureCheck.rows.length === 0 || !featureCheck.rows[0].api_gateway_enabled) {
      return res.status(403).json({
        success: false,
        message: 'API Gateway not enabled for this tenant. Contact super admin.'
      });
    }

    // Generate API key
    const apiKey = await apiGatewayService.generateApiKey({
      tenant_id: targetTenantId,
      partner_id,
      key_name,
      key_type,
      scopes,
      description,
      rate_limit_per_minute,
      rate_limit_per_hour,
      rate_limit_per_day,
      ip_whitelist,
      allowed_origins,
      geo_restrictions,
      expires_at,
      created_by: req.user.admin_id
    });

    res.status(201).json({
      success: true,
      message: 'API key generated successfully. Save it securely - it will not be shown again.',
      data: apiKey
    });
  } catch (error) {
    console.error('Error generating API key:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate API key'
    });
  }
};

/**
 * List API keys
 * GET /api/gateway/keys
 */
exports.listApiKeys = async (req, res) => {
  try {
    const { key_type, status, limit, offset } = req.query;

    // Determine filters based on user role
    const filters = { key_type, status, limit, offset };

    if (req.user.role === 'super_admin') {
      // Super admin can see all keys or filter by tenant
      if (req.query.tenant_id) {
        filters.tenant_id = req.query.tenant_id;
      }
      if (req.query.partner_id) {
        filters.partner_id = req.query.partner_id;
      }
    } else {
      // Regular admin can only see their tenant's keys
      filters.tenant_id = req.user.tenant_id;
    }

    const keys = await apiGatewayService.listApiKeys(filters);

    res.json({
      success: true,
      data: keys
    });
  } catch (error) {
    console.error('Error listing API keys:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list API keys'
    });
  }
};

/**
 * Update API key
 * PUT /api/gateway/keys/:keyId
 */
exports.updateApiKey = async (req, res) => {
  try {
    const { keyId } = req.params;
    const updates = req.body;

    // Verify ownership
    const key = await pool.query(
      `SELECT tenant_id FROM api_gateway_keys WHERE key_id = $1`,
      [keyId]
    );

    if (key.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'API key not found'
      });
    }

    // Check permissions
    if (req.user.role !== 'super_admin' && key.rows[0].tenant_id !== req.user.tenant_id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const updatedKey = await apiGatewayService.updateApiKey(keyId, updates);

    res.json({
      success: true,
      message: 'API key updated successfully',
      data: updatedKey
    });
  } catch (error) {
    console.error('Error updating API key:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update API key'
    });
  }
};

/**
 * Revoke API key
 * DELETE /api/gateway/keys/:keyId
 */
exports.revokeApiKey = async (req, res) => {
  try {
    const { keyId } = req.params;

    // Verify ownership
    const key = await pool.query(
      `SELECT tenant_id FROM api_gateway_keys WHERE key_id = $1`,
      [keyId]
    );

    if (key.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'API key not found'
      });
    }

    // Check permissions
    if (req.user.role !== 'super_admin' && key.rows[0].tenant_id !== req.user.tenant_id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await apiGatewayService.revokeApiKey(keyId, req.user.admin_id);

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

/**
 * Get API usage statistics
 * GET /api/gateway/analytics/usage
 */
exports.getUsageStats = async (req, res) => {
  try {
    const { key_id, start_date, end_date, group_by } = req.query;

    const filters = { key_id, start_date, end_date, group_by };

    // Filter by tenant for non-super-admins
    if (req.user.role !== 'super_admin') {
      filters.tenant_id = req.user.tenant_id;
    } else if (req.query.tenant_id) {
      filters.tenant_id = req.query.tenant_id;
    }

    const stats = await apiGatewayService.getUsageStats(filters);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching usage stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch usage statistics'
    });
  }
};

/**
 * Get popular endpoints
 * GET /api/gateway/analytics/endpoints
 */
exports.getPopularEndpoints = async (req, res) => {
  try {
    const { key_id, limit } = req.query;

    const filters = { key_id, limit };

    // Filter by tenant for non-super-admins
    if (req.user.role !== 'super_admin') {
      filters.tenant_id = req.user.tenant_id;
    } else if (req.query.tenant_id) {
      filters.tenant_id = req.query.tenant_id;
    }

    const endpoints = await apiGatewayService.getPopularEndpoints(filters);

    res.json({
      success: true,
      data: endpoints
    });
  } catch (error) {
    console.error('Error fetching popular endpoints:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch popular endpoints'
    });
  }
};

/**
 * Get available API scopes
 * GET /api/gateway/scopes
 */
exports.getApiScopes = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT scope_id, scope_name, scope_group, description
       FROM api_scopes
       ORDER BY scope_group, scope_name`
    );

    // Group scopes by scope_group
    const groupedScopes = result.rows.reduce((acc, scope) => {
      if (!acc[scope.scope_group]) {
        acc[scope.scope_group] = [];
      }
      acc[scope.scope_group].push(scope);
      return acc;
    }, {});

    res.json({
      success: true,
      data: groupedScopes
    });
  } catch (error) {
    console.error('Error fetching API scopes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch API scopes'
    });
  }
};

/**
 * Export API usage report
 * GET /api/gateway/analytics/export
 */
exports.exportUsageReport = async (req, res) => {
  try {
    const { format = 'json', start_date, end_date } = req.query;

    const filters = { start_date, end_date };

    // Filter by tenant for non-super-admins
    if (req.user.role !== 'super_admin') {
      filters.tenant_id = req.user.tenant_id;
    } else if (req.query.tenant_id) {
      filters.tenant_id = req.query.tenant_id;
    }

    // Get usage data
    const usageStats = await apiGatewayService.getUsageStats(filters);
    const popularEndpoints = await apiGatewayService.getPopularEndpoints({ ...filters, limit: 20 });

    const reportData = {
      generated_at: new Date().toISOString(),
      period: { start_date, end_date },
      usage_stats: usageStats,
      popular_endpoints: popularEndpoints
    };

    if (format === 'csv') {
      // Convert to CSV
      const csv = convertToCSV(reportData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=api-usage-report.csv');
      res.send(csv);
    } else {
      // Return JSON
      res.json({
        success: true,
        data: reportData
      });
    }
  } catch (error) {
    console.error('Error exporting usage report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export usage report'
    });
  }
};

/**
 * Helper function to convert data to CSV
 */
function convertToCSV(data) {
  const lines = [];
  
  // Usage stats
  lines.push('Usage Statistics');
  lines.push('Period,Total Requests,Successful,Failed,Avg Response Time (ms)');
  data.usage_stats.forEach(stat => {
    lines.push(`${stat.period},${stat.total_requests},${stat.successful_requests},${stat.failed_requests},${stat.avg_response_time}`);
  });
  
  lines.push('');
  
  // Popular endpoints
  lines.push('Popular Endpoints');
  lines.push('Endpoint,Method,Request Count,Avg Response Time (ms),Success Count,Error Count');
  data.popular_endpoints.forEach(endpoint => {
    lines.push(`${endpoint.endpoint},${endpoint.method},${endpoint.request_count},${endpoint.avg_response_time},${endpoint.success_count},${endpoint.error_count}`);
  });
  
  return lines.join('\n');
}

module.exports = exports;
