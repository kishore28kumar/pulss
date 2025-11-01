/**
 * Super Admin Notifications Controller
 * Handles super admin controls for notifications system including
 * global toggles, tenant settings, and platform-wide analytics
 */

const { pool } = require('../config/db');

/**
 * Get global notification controls
 * GET /api/super-admin/notifications/controls
 */
exports.getGlobalControls = async (req, res) => {
  try {
    // Verify super admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin only.',
      });
    }

    const result = await pool.query(
      `SELECT * FROM super_admin_notification_controls LIMIT 1`
    );

    if (result.rows.length === 0) {
      // Create default controls
      const defaultControls = await pool.query(
        `INSERT INTO super_admin_notification_controls DEFAULT VALUES
         RETURNING *`
      );
      return res.json({
        success: true,
        data: defaultControls.rows[0],
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error getting global controls:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get global controls',
      error: error.message,
    });
  }
};

/**
 * Update global notification controls
 * PUT /api/super-admin/notifications/controls
 */
exports.updateGlobalControls = async (req, res) => {
  try {
    // Verify super admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin only.',
      });
    }

    const updates = req.body;

    const allowedFields = [
      'notifications_enabled',
      'email_enabled',
      'sms_enabled',
      'push_enabled',
      'webhook_enabled',
      'global_email_daily_limit',
      'global_sms_daily_limit',
      'global_push_daily_limit',
      'alert_on_high_failure_rate',
      'failure_rate_threshold',
      'alert_email',
      'email_provider_primary',
      'email_provider_fallback',
      'sms_provider_primary',
      'sms_provider_fallback',
    ];

    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateFields.push(`${field} = $${paramIndex++}`);
        values.push(updates[field]);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update',
      });
    }

    updateFields.push(`updated_at = NOW()`);

    const result = await pool.query(
      `UPDATE super_admin_notification_controls
       SET ${updateFields.join(', ')}
       WHERE control_id = (SELECT control_id FROM super_admin_notification_controls LIMIT 1)
       RETURNING *`,
      values
    );

    res.json({
      success: true,
      message: 'Global controls updated',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating global controls:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update global controls',
      error: error.message,
    });
  }
};

/**
 * Get tenant notification settings
 * GET /api/super-admin/notifications/tenant-settings/:tenantId
 */
exports.getTenantSettings = async (req, res) => {
  try {
    // Verify super admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin only.',
      });
    }

    const { tenantId } = req.params;

    const result = await pool.query(
      `SELECT * FROM tenant_notification_settings WHERE tenant_id = $1`,
      [tenantId]
    );

    if (result.rows.length === 0) {
      // Create default settings
      const defaultSettings = await pool.query(
        `INSERT INTO tenant_notification_settings (tenant_id)
         VALUES ($1)
         RETURNING *`,
        [tenantId]
      );
      return res.json({
        success: true,
        data: defaultSettings.rows[0],
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error getting tenant settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tenant settings',
      error: error.message,
    });
  }
};

/**
 * Update tenant notification settings
 * PUT /api/super-admin/notifications/tenant-settings/:tenantId
 */
exports.updateTenantSettings = async (req, res) => {
  try {
    // Verify super admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin only.',
      });
    }

    const { tenantId } = req.params;
    const updates = req.body;

    const allowedFields = [
      'email_enabled',
      'sms_enabled',
      'push_enabled',
      'webhook_enabled',
      'in_app_enabled',
      'transactional_enabled',
      'marketing_enabled',
      'system_enabled',
      'promotional_enabled',
      'email_provider',
      'email_provider_config',
      'sms_provider',
      'sms_provider_config',
      'push_provider',
      'push_provider_config',
      'webhook_url',
      'webhook_secret',
      'webhook_events',
      'email_daily_limit',
      'sms_daily_limit',
      'push_daily_limit',
      'default_sender_name',
      'default_sender_email',
      'default_reply_to',
      'default_sms_sender_id',
      'track_opens',
      'track_clicks',
    ];

    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateFields.push(`${field} = $${paramIndex++}`);
        
        // Handle JSON fields
        if (['email_provider_config', 'sms_provider_config', 'push_provider_config'].includes(field)) {
          values.push(JSON.stringify(updates[field]));
        } else if (field === 'webhook_events') {
          values.push(updates[field]); // Already an array
        } else {
          values.push(updates[field]);
        }
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update',
      });
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(tenantId);

    const result = await pool.query(
      `UPDATE tenant_notification_settings
       SET ${updateFields.join(', ')}
       WHERE tenant_id = $${paramIndex}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tenant settings not found',
      });
    }

    res.json({
      success: true,
      message: 'Tenant settings updated',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating tenant settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update tenant settings',
      error: error.message,
    });
  }
};

/**
 * Get all tenant notification settings (list)
 * GET /api/super-admin/notifications/tenant-settings
 */
exports.getAllTenantSettings = async (req, res) => {
  try {
    // Verify super admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin only.',
      });
    }

    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT 
        tns.*,
        t.name as tenant_name,
        t.subdomain
       FROM tenant_notification_settings tns
       JOIN tenants t ON tns.tenant_id = t.tenant_id
       ORDER BY t.name
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM tenant_notification_settings`
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(countResult.rows[0].total / limit),
      },
    });
  } catch (error) {
    console.error('Error getting all tenant settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tenant settings',
      error: error.message,
    });
  }
};

/**
 * Toggle notification channel for tenant
 * POST /api/super-admin/notifications/tenant-settings/:tenantId/toggle
 */
exports.toggleTenantChannel = async (req, res) => {
  try {
    // Verify super admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin only.',
      });
    }

    const { tenantId } = req.params;
    const { channel, enabled } = req.body;

    const validChannels = ['email', 'sms', 'push', 'webhook', 'in_app'];
    if (!validChannels.includes(channel)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid channel',
      });
    }

    const result = await pool.query(
      `UPDATE tenant_notification_settings
       SET ${channel}_enabled = $1, updated_at = NOW()
       WHERE tenant_id = $2
       RETURNING *`,
      [enabled, tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tenant settings not found',
      });
    }

    res.json({
      success: true,
      message: `${channel} notifications ${enabled ? 'enabled' : 'disabled'} for tenant`,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error toggling channel:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle channel',
      error: error.message,
    });
  }
};

/**
 * Toggle notification type for tenant
 * POST /api/super-admin/notifications/tenant-settings/:tenantId/toggle-type
 */
exports.toggleTenantNotificationType = async (req, res) => {
  try {
    // Verify super admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin only.',
      });
    }

    const { tenantId } = req.params;
    const { notificationType, enabled } = req.body;

    const validTypes = ['transactional', 'marketing', 'system', 'promotional'];
    if (!validTypes.includes(notificationType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification type',
      });
    }

    const result = await pool.query(
      `UPDATE tenant_notification_settings
       SET ${notificationType}_enabled = $1, updated_at = NOW()
       WHERE tenant_id = $2
       RETURNING *`,
      [enabled, tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tenant settings not found',
      });
    }

    res.json({
      success: true,
      message: `${notificationType} notifications ${enabled ? 'enabled' : 'disabled'} for tenant`,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error toggling notification type:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle notification type',
      error: error.message,
    });
  }
};

/**
 * Get platform-wide notification analytics
 * GET /api/super-admin/notifications/analytics
 */
exports.getPlatformAnalytics = async (req, res) => {
  try {
    // Verify super admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin only.',
      });
    }

    const { startDate, endDate, groupBy = 'day' } = req.query;

    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const end = endDate || new Date().toISOString();

    // Overall stats
    const overallStats = await pool.query(
      `SELECT 
        COUNT(*) as total_notifications,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
        COUNT(CASE WHEN status = 'bounced' THEN 1 END) as bounced,
        COUNT(CASE WHEN read = true THEN 1 END) as opened,
        COUNT(CASE WHEN clicked = true THEN 1 END) as clicked,
        ROUND(100.0 * COUNT(CASE WHEN status = 'delivered' THEN 1 END) / NULLIF(COUNT(*), 0), 2) as delivery_rate,
        ROUND(100.0 * COUNT(CASE WHEN read = true THEN 1 END) / NULLIF(COUNT(CASE WHEN status = 'delivered' THEN 1 END), 0), 2) as open_rate,
        ROUND(100.0 * COUNT(CASE WHEN clicked = true THEN 1 END) / NULLIF(COUNT(CASE WHEN status = 'delivered' THEN 1 END), 0), 2) as click_rate
       FROM notifications_enhanced
       WHERE created_at >= $1 AND created_at <= $2`,
      [start, end]
    );

    // By channel
    const channelStats = await pool.query(
      `SELECT 
        channel,
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
        ROUND(100.0 * COUNT(CASE WHEN status = 'delivered' THEN 1 END) / NULLIF(COUNT(*), 0), 2) as delivery_rate
       FROM notifications_enhanced
       WHERE created_at >= $1 AND created_at <= $2
       GROUP BY channel
       ORDER BY total DESC`,
      [start, end]
    );

    // By tenant (top 10)
    const tenantStats = await pool.query(
      `SELECT 
        t.tenant_id,
        t.name as tenant_name,
        t.subdomain,
        COUNT(n.notification_id) as total_notifications,
        COUNT(CASE WHEN n.status = 'delivered' THEN 1 END) as delivered,
        COUNT(CASE WHEN n.status = 'failed' THEN 1 END) as failed
       FROM tenants t
       LEFT JOIN notifications_enhanced n ON t.tenant_id = n.tenant_id 
         AND n.created_at >= $1 AND n.created_at <= $2
       GROUP BY t.tenant_id, t.name, t.subdomain
       ORDER BY total_notifications DESC
       LIMIT 10`,
      [start, end]
    );

    // Daily trends
    const dailyTrends = await pool.query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
       FROM notifications_enhanced
       WHERE created_at >= $1 AND created_at <= $2
       GROUP BY DATE(created_at)
       ORDER BY date DESC`,
      [start, end]
    );

    res.json({
      success: true,
      data: {
        overall: overallStats.rows[0],
        byChannel: channelStats.rows,
        byTenant: tenantStats.rows,
        dailyTrends: dailyTrends.rows,
      },
    });
  } catch (error) {
    console.error('Error getting platform analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get platform analytics',
      error: error.message,
    });
  }
};

/**
 * Get notification delivery logs for monitoring
 * GET /api/super-admin/notifications/delivery-logs
 */
exports.getDeliveryLogs = async (req, res) => {
  try {
    // Verify super admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin only.',
      });
    }

    const {
      page = 1,
      limit = 50,
      status,
      channel,
      tenantId,
      startDate,
      endDate,
    } = req.query;

    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        n.notification_id,
        n.tenant_id,
        t.name as tenant_name,
        n.notification_type,
        n.event_type,
        n.channel,
        n.status,
        n.priority,
        n.provider,
        n.provider_message_id,
        n.failure_reason,
        n.retry_count,
        n.created_at,
        n.sent_at,
        n.delivered_at,
        n.failed_at
      FROM notifications_enhanced n
      LEFT JOIN tenants t ON n.tenant_id = t.tenant_id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND n.status = $${paramIndex++}`;
      params.push(status);
    }

    if (channel) {
      query += ` AND n.channel = $${paramIndex++}`;
      params.push(channel);
    }

    if (tenantId) {
      query += ` AND n.tenant_id = $${paramIndex++}`;
      params.push(tenantId);
    }

    if (startDate) {
      query += ` AND n.created_at >= $${paramIndex++}`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND n.created_at <= $${paramIndex++}`;
      params.push(endDate);
    }

    query += ` ORDER BY n.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM notifications_enhanced n WHERE 1=1`;
    const countParams = [];
    let countIndex = 1;

    if (status) {
      countQuery += ` AND status = $${countIndex++}`;
      countParams.push(status);
    }

    if (channel) {
      countQuery += ` AND channel = $${countIndex++}`;
      countParams.push(channel);
    }

    if (tenantId) {
      countQuery += ` AND tenant_id = $${countIndex++}`;
      countParams.push(tenantId);
    }

    if (startDate) {
      countQuery += ` AND created_at >= $${countIndex++}`;
      countParams.push(startDate);
    }

    if (endDate) {
      countQuery += ` AND created_at <= $${countIndex++}`;
      countParams.push(endDate);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error getting delivery logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get delivery logs',
      error: error.message,
    });
  }
};

/**
 * Retry failed notifications
 * POST /api/super-admin/notifications/retry/:notificationId
 */
exports.retryNotification = async (req, res) => {
  try {
    // Verify super admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin only.',
      });
    }

    const { notificationId } = req.params;

    // Get notification details
    const notification = await pool.query(
      `SELECT * FROM notifications_enhanced WHERE notification_id = $1`,
      [notificationId]
    );

    if (notification.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    const notif = notification.rows[0];

    // Check if retries exceeded
    if (notif.retry_count >= notif.max_retries) {
      return res.status(400).json({
        success: false,
        message: 'Maximum retries exceeded',
      });
    }

    // Update retry count and status
    await pool.query(
      `UPDATE notifications_enhanced
       SET status = 'pending', retry_count = retry_count + 1, updated_at = NOW()
       WHERE notification_id = $1`,
      [notificationId]
    );

    // Queue for retry
    await pool.query(
      `INSERT INTO notification_queue (notification_id, status, priority, scheduled_for)
       VALUES ($1, 'pending', 7, NOW())`,
      [notificationId]
    );

    res.json({
      success: true,
      message: 'Notification queued for retry',
    });
  } catch (error) {
    console.error('Error retrying notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retry notification',
      error: error.message,
    });
  }
};

module.exports = exports;
