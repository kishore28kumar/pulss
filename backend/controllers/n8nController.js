const { pool } = require('../config/db');
const n8nService = require('../services/n8nService');
const { WEBHOOK_EVENTS } = require('../utils/webhookTrigger');

/**
 * Get n8n service health status
 */
const getN8nHealth = async (req, res) => {
  try {
    const health = await n8nService.checkHealth();
    res.json(health);
  } catch (error) {
    console.error('Get n8n health error:', error);
    res.status(500).json({ error: 'Failed to check n8n health' });
  }
};

/**
 * Get workflow triggers for a tenant
 */
const getWorkflowTriggers = async (req, res) => {
  try {
    const { tenant_id } = req;

    if (!tenant_id) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    // Check tenant access
    if (req.user.role !== 'super_admin' && req.user.tenant_id !== tenant_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      `SELECT id, tenant_id, event_type, enabled, webhook_url, config, created_at, updated_at
       FROM n8n_workflow_triggers
       WHERE tenant_id = $1
       ORDER BY event_type`,
      [tenant_id]
    );

    res.json({ triggers: result.rows });
  } catch (error) {
    console.error('Get workflow triggers error:', error);
    res.status(500).json({ error: 'Failed to fetch workflow triggers' });
  }
};

/**
 * Get all available webhook events
 */
const getAvailableEvents = async (req, res) => {
  try {
    const events = Object.entries(WEBHOOK_EVENTS).map(([key, value]) => ({
      key,
      value,
      name: key.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')
    }));

    res.json({ events });
  } catch (error) {
    console.error('Get available events error:', error);
    res.status(500).json({ error: 'Failed to fetch available events' });
  }
};

/**
 * Update or create workflow trigger configuration
 */
const updateWorkflowTrigger = async (req, res) => {
  try {
    const { tenant_id } = req;
    const { event_type, enabled, webhook_url, config } = req.body;

    if (!tenant_id || !event_type) {
      return res.status(400).json({ error: 'Tenant ID and event type required' });
    }

    // Check tenant access
    if (req.user.role !== 'super_admin' && req.user.tenant_id !== tenant_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Validate event type
    if (!Object.values(WEBHOOK_EVENTS).includes(event_type)) {
      return res.status(400).json({ error: 'Invalid event type' });
    }

    const result = await pool.query(
      `INSERT INTO n8n_workflow_triggers (tenant_id, event_type, enabled, webhook_url, config)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (tenant_id, event_type) 
       DO UPDATE SET 
         enabled = EXCLUDED.enabled,
         webhook_url = EXCLUDED.webhook_url,
         config = EXCLUDED.config,
         updated_at = NOW()
       RETURNING *`,
      [tenant_id, event_type, enabled || false, webhook_url, JSON.stringify(config || {})]
    );

    res.json({
      message: 'Workflow trigger updated successfully',
      trigger: result.rows[0]
    });
  } catch (error) {
    console.error('Update workflow trigger error:', error);
    res.status(500).json({ error: 'Failed to update workflow trigger' });
  }
};

/**
 * Delete workflow trigger configuration
 */
const deleteWorkflowTrigger = async (req, res) => {
  try {
    const { id } = req.params;

    // Get trigger to check permissions
    const triggerResult = await pool.query(
      'SELECT tenant_id FROM n8n_workflow_triggers WHERE id = $1',
      [id]
    );

    if (triggerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Workflow trigger not found' });
    }

    const trigger = triggerResult.rows[0];

    // Check tenant access
    if (req.user.role !== 'super_admin' && req.user.tenant_id !== trigger.tenant_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await pool.query(
      'DELETE FROM n8n_workflow_triggers WHERE id = $1',
      [id]
    );

    res.json({ message: 'Workflow trigger deleted successfully' });
  } catch (error) {
    console.error('Delete workflow trigger error:', error);
    res.status(500).json({ error: 'Failed to delete workflow trigger' });
  }
};

/**
 * Get webhook logs for a tenant
 */
const getWebhookLogs = async (req, res) => {
  try {
    const { tenant_id } = req;
    const { event_type, success, limit = 100, offset = 0 } = req.query;

    if (!tenant_id) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    // Check tenant access
    if (req.user.role !== 'super_admin' && req.user.tenant_id !== tenant_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    let query = `
      SELECT id, tenant_id, event_type, payload, response, success, error_message, triggered_at, duration_ms
      FROM n8n_webhook_logs
      WHERE tenant_id = $1
    `;
    const params = [tenant_id];
    let paramIndex = 2;

    if (event_type) {
      query += ` AND event_type = $${paramIndex}`;
      params.push(event_type);
      paramIndex++;
    }

    if (success !== undefined) {
      query += ` AND success = $${paramIndex}`;
      params.push(success === 'true');
      paramIndex++;
    }

    query += ` ORDER BY triggered_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM n8n_webhook_logs WHERE tenant_id = $1';
    const countParams = [tenant_id];
    let countParamIndex = 2;

    if (event_type) {
      countQuery += ` AND event_type = $${countParamIndex}`;
      countParams.push(event_type);
      countParamIndex++;
    }

    if (success !== undefined) {
      countQuery += ` AND success = $${countParamIndex}`;
      countParams.push(success === 'true');
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      logs: result.rows,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: offset + result.rows.length < total
      }
    });
  } catch (error) {
    console.error('Get webhook logs error:', error);
    res.status(500).json({ error: 'Failed to fetch webhook logs' });
  }
};

/**
 * Test a webhook endpoint
 */
const testWebhook = async (req, res) => {
  try {
    const { tenant_id } = req;
    const { event_type, test_data } = req.body;

    if (!tenant_id || !event_type) {
      return res.status(400).json({ error: 'Tenant ID and event type required' });
    }

    // Check tenant access
    if (req.user.role !== 'super_admin' && req.user.tenant_id !== tenant_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Validate event type
    if (!Object.values(WEBHOOK_EVENTS).includes(event_type)) {
      return res.status(400).json({ error: 'Invalid event type' });
    }

    const result = await n8nService.testWebhook(event_type, {
      tenant_id,
      test_data: test_data || { message: 'Test webhook from Pulss' }
    });

    res.json({
      message: 'Test webhook triggered',
      result
    });
  } catch (error) {
    console.error('Test webhook error:', error);
    res.status(500).json({ error: 'Failed to test webhook' });
  }
};

/**
 * Get webhook statistics for a tenant
 */
const getWebhookStats = async (req, res) => {
  try {
    const { tenant_id } = req;

    if (!tenant_id) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    // Check tenant access
    if (req.user.role !== 'super_admin' && req.user.tenant_id !== tenant_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      `SELECT 
        event_type,
        COUNT(*) as total_triggers,
        SUM(CASE WHEN success = true THEN 1 ELSE 0 END) as successful,
        SUM(CASE WHEN success = false THEN 1 ELSE 0 END) as failed,
        AVG(duration_ms) as avg_duration_ms,
        MAX(triggered_at) as last_triggered
       FROM n8n_webhook_logs
       WHERE tenant_id = $1
       GROUP BY event_type
       ORDER BY total_triggers DESC`,
      [tenant_id]
    );

    res.json({ stats: result.rows });
  } catch (error) {
    console.error('Get webhook stats error:', error);
    res.status(500).json({ error: 'Failed to fetch webhook statistics' });
  }
};

module.exports = {
  getN8nHealth,
  getWorkflowTriggers,
  getAvailableEvents,
  updateWorkflowTrigger,
  deleteWorkflowTrigger,
  getWebhookLogs,
  testWebhook,
  getWebhookStats
};
