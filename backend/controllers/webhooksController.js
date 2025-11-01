const db = require('../config/db');
const crypto = require('crypto');
const axios = require('axios');

/**
 * Webhooks Controller
 * Manages webhook subscriptions and deliveries
 */

// ============================================================================
// WEBHOOK MANAGEMENT
// ============================================================================

// Get all webhooks for a tenant
exports.getWebhooks = async (req, res) => {
  try {
    const tenantId = req.user.role === 'super_admin' && req.query.tenant_id 
      ? req.query.tenant_id 
      : req.user.tenant_id;

    // Check if webhooks are enabled
    const featureCheck = await db.query(
      'SELECT webhooks_enabled FROM api_feature_flags WHERE tenant_id = $1',
      [tenantId]
    );

    if (featureCheck.rows.length === 0 || !featureCheck.rows[0].webhooks_enabled) {
      return res.status(403).json({
        success: false,
        message: 'Webhooks are not enabled for this tenant'
      });
    }

    const result = await db.query(
      `SELECT * FROM webhooks 
       WHERE tenant_id = $1
       ORDER BY created_at DESC`,
      [tenantId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching webhooks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch webhooks'
    });
  }
};

// Create new webhook
exports.createWebhook = async (req, res) => {
  try {
    const {
      name,
      url,
      events,
      description,
      headers = {},
      retry_attempts = 3,
      timeout_seconds = 30
    } = req.body;

    const tenantId = req.user.role === 'super_admin' && req.body.tenant_id 
      ? req.body.tenant_id 
      : req.user.tenant_id;

    // Validate required fields
    if (!name || !url || !events || events.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Name, URL, and at least one event are required'
      });
    }

    // Check if webhooks are enabled
    const featureCheck = await db.query(
      'SELECT webhooks_enabled, webhooks_max_count FROM api_feature_flags WHERE tenant_id = $1',
      [tenantId]
    );

    if (featureCheck.rows.length === 0 || !featureCheck.rows[0].webhooks_enabled) {
      return res.status(403).json({
        success: false,
        message: 'Webhooks are not enabled for this tenant'
      });
    }

    // Check max webhooks limit
    const countResult = await db.query(
      'SELECT COUNT(*) FROM webhooks WHERE tenant_id = $1 AND is_active = true',
      [tenantId]
    );

    const currentCount = parseInt(countResult.rows[0].count);
    const maxCount = featureCheck.rows[0].webhooks_max_count || 10;

    if (currentCount >= maxCount) {
      return res.status(400).json({
        success: false,
        message: `Maximum number of webhooks (${maxCount}) reached for this tenant`
      });
    }

    // Generate webhook secret
    const secret = crypto.randomBytes(32).toString('hex');

    // Insert webhook
    const result = await db.query(
      `INSERT INTO webhooks 
       (tenant_id, name, url, secret, events, description, headers, retry_attempts, timeout_seconds)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [tenantId, name, url, secret, events, description, JSON.stringify(headers), retry_attempts, timeout_seconds]
    );

    res.status(201).json({
      success: true,
      message: 'Webhook created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create webhook'
    });
  }
};

// Update webhook
exports.updateWebhook = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, url, events, description, headers, retry_attempts, timeout_seconds, is_active } = req.body;

    const tenantId = req.user.role === 'super_admin' && req.body.tenant_id 
      ? req.body.tenant_id 
      : req.user.tenant_id;

    // Build update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (url !== undefined) {
      updates.push(`url = $${paramCount++}`);
      values.push(url);
    }
    if (events !== undefined) {
      updates.push(`events = $${paramCount++}`);
      values.push(events);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (headers !== undefined) {
      updates.push(`headers = $${paramCount++}`);
      values.push(JSON.stringify(headers));
    }
    if (retry_attempts !== undefined) {
      updates.push(`retry_attempts = $${paramCount++}`);
      values.push(retry_attempts);
    }
    if (timeout_seconds !== undefined) {
      updates.push(`timeout_seconds = $${paramCount++}`);
      values.push(timeout_seconds);
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
      `UPDATE webhooks 
       SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${paramCount++} AND tenant_id = $${paramCount++}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Webhook not found'
      });
    }

    res.json({
      success: true,
      message: 'Webhook updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update webhook'
    });
  }
};

// Delete webhook
exports.deleteWebhook = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.role === 'super_admin' && req.query.tenant_id 
      ? req.query.tenant_id 
      : req.user.tenant_id;

    await db.query(
      'DELETE FROM webhooks WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    res.json({
      success: true,
      message: 'Webhook deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete webhook'
    });
  }
};

// Test webhook
exports.testWebhook = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.role === 'super_admin' && req.query.tenant_id 
      ? req.query.tenant_id 
      : req.user.tenant_id;

    const webhookResult = await db.query(
      'SELECT * FROM webhooks WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    if (webhookResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Webhook not found'
      });
    }

    const webhook = webhookResult.rows[0];

    // Create test payload
    const testPayload = {
      event: 'webhook.test',
      data: {
        message: 'This is a test webhook delivery',
        timestamp: new Date().toISOString()
      },
      webhook_id: webhook.id,
      tenant_id: tenantId
    };

    // Trigger webhook
    const deliveryResult = await triggerWebhook(webhook, testPayload);

    res.json({
      success: deliveryResult.success,
      message: deliveryResult.success ? 'Webhook test successful' : 'Webhook test failed',
      delivery: deliveryResult
    });
  } catch (error) {
    console.error('Error testing webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test webhook'
    });
  }
};

// Get webhook deliveries
exports.getWebhookDeliveries = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, status } = req.query;

    const tenantId = req.user.role === 'super_admin' && req.query.tenant_id 
      ? req.query.tenant_id 
      : req.user.tenant_id;

    const offset = (page - 1) * limit;

    let whereClause = 'WHERE w.id = $1 AND w.tenant_id = $2';
    const values = [id, tenantId];
    let paramCount = 3;

    if (status) {
      whereClause += ` AND wd.status = $${paramCount++}`;
      values.push(status);
    }

    const result = await db.query(
      `SELECT wd.*, w.name as webhook_name, w.url
       FROM webhook_deliveries wd
       JOIN webhooks w ON wd.webhook_id = w.id
       ${whereClause}
       ORDER BY wd.created_at DESC
       LIMIT $${paramCount++} OFFSET $${paramCount}`,
      [...values, limit, offset]
    );

    const countResult = await db.query(
      `SELECT COUNT(*) 
       FROM webhook_deliveries wd
       JOIN webhooks w ON wd.webhook_id = w.id
       ${whereClause}`,
      values
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count)
      }
    });
  } catch (error) {
    console.error('Error fetching webhook deliveries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch webhook deliveries'
    });
  }
};

// Retry failed webhook delivery
exports.retryWebhookDelivery = async (req, res) => {
  try {
    const { id } = req.params; // delivery ID

    const deliveryResult = await db.query(
      'SELECT wd.*, w.* FROM webhook_deliveries wd JOIN webhooks w ON wd.webhook_id = w.id WHERE wd.id = $1',
      [id]
    );

    if (deliveryResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Webhook delivery not found'
      });
    }

    const delivery = deliveryResult.rows[0];
    const webhook = {
      id: delivery.webhook_id,
      url: delivery.url,
      secret: delivery.secret,
      timeout_seconds: delivery.timeout_seconds,
      headers: delivery.headers
    };

    const payload = {
      event: delivery.event_type,
      data: delivery.event_data
    };

    // Retry webhook
    const result = await triggerWebhook(webhook, payload, delivery.attempt_number + 1);

    // Update delivery record
    await db.query(
      `UPDATE webhook_deliveries 
       SET status = $1, http_status_code = $2, response_body = $3, 
           error_message = $4, attempt_number = $5, delivered_at = $6
       WHERE id = $7`,
      [
        result.success ? 'success' : 'failed',
        result.statusCode,
        result.response,
        result.error,
        delivery.attempt_number + 1,
        result.success ? new Date() : null,
        id
      ]
    );

    res.json({
      success: result.success,
      message: result.success ? 'Webhook retry successful' : 'Webhook retry failed',
      delivery: result
    });
  } catch (error) {
    console.error('Error retrying webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retry webhook'
    });
  }
};

// ============================================================================
// WEBHOOK TRIGGER FUNCTION (Internal)
// ============================================================================

async function triggerWebhook(webhook, payload, attemptNumber = 1) {
  try {
    // Create signature
    const timestamp = Date.now();
    const signature = crypto
      .createHmac('sha256', webhook.secret)
      .update(`${timestamp}.${JSON.stringify(payload)}`)
      .digest('hex');

    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': signature,
      'X-Webhook-Timestamp': timestamp.toString(),
      'User-Agent': 'Pulss-Webhooks/1.0',
      ...webhook.headers
    };

    // Make request
    const startTime = Date.now();
    const response = await axios.post(webhook.url, payload, {
      headers,
      timeout: (webhook.timeout_seconds || 30) * 1000
    });
    const responseTime = Date.now() - startTime;

    // Log successful delivery
    await db.query(
      `INSERT INTO webhook_deliveries 
       (webhook_id, event_type, event_data, status, http_status_code, response_body, attempt_number, delivered_at)
       VALUES ($1, $2, $3, 'success', $4, $5, $6, NOW())`,
      [webhook.id, payload.event, JSON.stringify(payload.data), response.status, JSON.stringify(response.data).substring(0, 1000), attemptNumber]
    );

    // Update webhook stats
    await db.query(
      `UPDATE webhooks 
       SET total_deliveries = total_deliveries + 1,
           successful_deliveries = successful_deliveries + 1,
           last_triggered_at = NOW()
       WHERE id = $1`,
      [webhook.id]
    );

    return {
      success: true,
      statusCode: response.status,
      response: response.data,
      responseTime
    };
  } catch (error) {
    console.error('Webhook delivery failed:', error.message);

    // Log failed delivery
    const errorMessage = error.response?.data || error.message;
    const statusCode = error.response?.status || null;

    await db.query(
      `INSERT INTO webhook_deliveries 
       (webhook_id, event_type, event_data, status, http_status_code, error_message, attempt_number)
       VALUES ($1, $2, $3, 'failed', $4, $5, $6)`,
      [webhook.id, payload.event, JSON.stringify(payload.data), statusCode, errorMessage, attemptNumber]
    );

    // Update webhook stats
    await db.query(
      `UPDATE webhooks 
       SET total_deliveries = total_deliveries + 1,
           failed_deliveries = failed_deliveries + 1
       WHERE id = $1`,
      [webhook.id]
    );

    return {
      success: false,
      statusCode,
      error: errorMessage
    };
  }
}

// Export trigger function for use in other controllers
exports.triggerWebhookEvent = async (tenantId, eventType, eventData) => {
  try {
    // Get all active webhooks for this tenant that listen to this event
    const result = await db.query(
      `SELECT * FROM webhooks 
       WHERE tenant_id = $1 AND is_active = true AND $2 = ANY(events)`,
      [tenantId, eventType]
    );

    const webhooks = result.rows;

    // Trigger all matching webhooks
    const promises = webhooks.map(webhook => 
      triggerWebhook(webhook, {
        event: eventType,
        data: eventData,
        tenant_id: tenantId,
        timestamp: new Date().toISOString()
      })
    );

    await Promise.allSettled(promises);

    return { success: true, webhooks_triggered: webhooks.length };
  } catch (error) {
    console.error('Error triggering webhook event:', error);
    return { success: false, error: error.message };
  }
};

module.exports = exports;
