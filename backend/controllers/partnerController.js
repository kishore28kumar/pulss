const partnerService = require('../services/partnerService');
const oauthService = require('../services/oauthService');
const { pool } = require('../config/db');

/**
 * Partner & Reseller Controller
 * Handles partner management, webhooks, and integrations
 */

/**
 * Create new partner
 * POST /api/partners
 */
exports.createPartner = async (req, res) => {
  try {
    // Only super admin can create partners
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only super admin can create partners'
      });
    }

    const partner = await partnerService.createPartner({
      ...req.body,
      created_by: req.user.admin_id
    });

    res.status(201).json({
      success: true,
      message: 'Partner created successfully',
      data: partner
    });
  } catch (error) {
    console.error('Error creating partner:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create partner'
    });
  }
};

/**
 * List partners
 * GET /api/partners
 */
exports.listPartners = async (req, res) => {
  try {
    // Only super admin can list partners
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { type, status, limit, offset } = req.query;
    const partners = await partnerService.listPartners({ type, status, limit, offset });

    res.json({
      success: true,
      data: partners
    });
  } catch (error) {
    console.error('Error listing partners:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list partners'
    });
  }
};

/**
 * Get partner by ID
 * GET /api/partners/:partnerId
 */
exports.getPartner = async (req, res) => {
  try {
    const { partnerId } = req.params;
    const partner = await partnerService.getPartnerById(partnerId);

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partner not found'
      });
    }

    res.json({
      success: true,
      data: partner
    });
  } catch (error) {
    console.error('Error fetching partner:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch partner'
    });
  }
};

/**
 * Update partner
 * PUT /api/partners/:partnerId
 */
exports.updatePartner = async (req, res) => {
  try {
    // Only super admin can update partners
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { partnerId } = req.params;
    const partner = await partnerService.updatePartner(partnerId, req.body);

    res.json({
      success: true,
      message: 'Partner updated successfully',
      data: partner
    });
  } catch (error) {
    console.error('Error updating partner:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update partner'
    });
  }
};

/**
 * Configure webhook for partner
 * POST /api/partners/:partnerId/webhook
 */
exports.configureWebhook = async (req, res) => {
  try {
    // Only super admin can configure webhooks
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { partnerId } = req.params;
    const webhook = await partnerService.configureWebhook(partnerId, req.body);

    res.json({
      success: true,
      message: 'Webhook configured successfully',
      data: webhook
    });
  } catch (error) {
    console.error('Error configuring webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to configure webhook'
    });
  }
};

/**
 * Test webhook
 * POST /api/partners/:partnerId/webhook/test
 */
exports.testWebhook = async (req, res) => {
  try {
    // Only super admin can test webhooks
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { partnerId } = req.params;
    const testPayload = req.body.payload || {
      event: 'test',
      message: 'This is a test webhook',
      timestamp: new Date().toISOString()
    };

    const result = await partnerService.sendWebhook(partnerId, 'test', testPayload);

    res.json({
      success: result.success,
      message: result.success ? 'Webhook test successful' : 'Webhook test failed',
      data: result
    });
  } catch (error) {
    console.error('Error testing webhook:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get webhook logs
 * GET /api/partners/:partnerId/webhook/logs
 */
exports.getWebhookLogs = async (req, res) => {
  try {
    // Only super admin can view webhook logs
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { partnerId } = req.params;
    const { success, limit, offset } = req.query;

    const logs = await partnerService.getWebhookLogs(partnerId, {
      success: success !== undefined ? success === 'true' : undefined,
      limit,
      offset
    });

    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('Error fetching webhook logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch webhook logs'
    });
  }
};

/**
 * Retry failed webhook
 * POST /api/partners/:partnerId/webhook/retry/:webhookLogId
 */
exports.retryWebhook = async (req, res) => {
  try {
    // Only super admin can retry webhooks
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { partnerId, webhookLogId } = req.params;

    // Get webhook log
    const logResult = await pool.query(
      `SELECT * FROM webhook_logs WHERE webhook_log_id = $1 AND partner_id = $2`,
      [webhookLogId, partnerId]
    );

    if (logResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Webhook log not found'
      });
    }

    const log = logResult.rows[0];

    // Resend webhook
    const result = await partnerService.sendWebhook(partnerId, log.event_type, log.payload);

    res.json({
      success: result.success,
      message: result.success ? 'Webhook retry successful' : 'Webhook retry failed',
      data: result
    });
  } catch (error) {
    console.error('Error retrying webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retry webhook'
    });
  }
};

/**
 * Get integration templates
 * GET /api/partners/integration-templates
 */
exports.getIntegrationTemplates = async (req, res) => {
  try {
    const { type, category } = req.query;
    const templates = await partnerService.getIntegrationTemplates({ type, category });

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Error fetching integration templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch integration templates'
    });
  }
};

/**
 * Initiate SSO login
 * POST /api/partners/:partnerId/sso/login
 */
exports.initiateSSOLogin = async (req, res) => {
  try {
    const { partnerId } = req.params;
    const { redirect_uri } = req.body;

    const ssoConfig = await oauthService.initiateSSOLogin(partnerId, redirect_uri);

    res.json({
      success: true,
      data: ssoConfig
    });
  } catch (error) {
    console.error('Error initiating SSO login:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Complete SSO callback
 * POST /api/partners/sso/callback
 */
exports.completeSSOCallback = async (req, res) => {
  try {
    const { state, code } = req.body;

    const result = await oauthService.completeSSOCallback(state, code);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error completing SSO callback:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Export partner report
 * GET /api/partners/:partnerId/export
 */
exports.exportPartnerReport = async (req, res) => {
  try {
    // Only super admin can export partner reports
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { partnerId } = req.params;
    const { format = 'json' } = req.query;

    // Get partner info
    const partner = await partnerService.getPartnerById(partnerId);
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partner not found'
      });
    }

    // Get API keys
    const keysResult = await pool.query(
      `SELECT key_id, key_name, api_key_prefix, key_type, status,
              total_requests, successful_requests, failed_requests,
              last_used_at, created_at
       FROM api_gateway_keys
       WHERE partner_id = $1
       ORDER BY created_at DESC`,
      [partnerId]
    );

    // Get webhook logs
    const webhookLogs = await partnerService.getWebhookLogs(partnerId, { limit: 100 });

    const reportData = {
      partner,
      api_keys: keysResult.rows,
      webhook_logs: webhookLogs,
      generated_at: new Date().toISOString()
    };

    if (format === 'json') {
      res.json({
        success: true,
        data: reportData
      });
    } else if (format === 'csv') {
      // Convert to CSV
      const lines = [];
      lines.push('Partner Report');
      lines.push(`Partner: ${partner.name}`);
      lines.push(`Type: ${partner.type}`);
      lines.push(`Status: ${partner.status}`);
      lines.push('');
      lines.push('API Keys');
      lines.push('Key Name,Type,Status,Total Requests,Successful,Failed,Last Used');
      keysResult.rows.forEach(key => {
        lines.push(`${key.key_name},${key.key_type},${key.status},${key.total_requests},${key.successful_requests},${key.failed_requests},${key.last_used_at || 'Never'}`);
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=partner-${partnerId}-report.csv`);
      res.send(lines.join('\n'));
    }
  } catch (error) {
    console.error('Error exporting partner report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export partner report'
    });
  }
};

module.exports = exports;
