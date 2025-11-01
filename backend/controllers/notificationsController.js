const db = require('../config/db');

/**
 * Advanced Notifications Controller
 * Handles multi-channel notifications with templates, campaigns, and analytics
 * All advanced features are gated by super admin toggles
 */

// ============================================================================
// NOTIFICATION MANAGEMENT
// ============================================================================

// Get all notifications for a user
exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      limit = 50, 
      offset = 0, 
      unreadOnly = false,
      type,
      channel 
    } = req.query;

    let query = `
      SELECT n.*, t.name as template_name
      FROM notifications n
      LEFT JOIN notification_templates t ON n.template_id = t.id
      WHERE n.user_id = $1
    `;
    
    const params = [userId];
    let paramIndex = 2;

    if (unreadOnly === 'true') {
      query += ` AND n.is_read = false`;
    }

    if (type) {
      query += ` AND n.type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (channel) {
      query += ` AND n.channel = $${paramIndex}`;
      params.push(channel);
      paramIndex++;
    }

    query += ` ORDER BY n.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const notifications = await db.query(query, params);

    // Get unread count
    const unreadCount = await db.query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    );

    res.json({
      success: true,
      data: notifications.rows,
      unreadCount: parseInt(unreadCount.rows[0].count),
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: notifications.rowCount
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch notifications' 
    });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await db.query(
      `UPDATE notifications 
       SET is_read = true, read_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    // Track analytics
    await db.query(
      `INSERT INTO notification_analytics (notification_id, metric_type, tenant_id)
       SELECT $1, 'opened', tenant_id FROM notifications WHERE id = $1`,
      [id]
    );

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to mark notification as read' 
    });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await db.query(
      `UPDATE notifications 
       SET is_read = true, read_at = NOW(), updated_at = NOW()
       WHERE user_id = $1 AND is_read = false`,
      [userId]
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to mark all as read' 
    });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await db.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete notification' 
    });
  }
};

// ============================================================================
// NOTIFICATION PREFERENCES
// ============================================================================

// Get notification preferences
exports.getPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tenantId } = req.query;

    let query = 'SELECT * FROM notification_preferences WHERE user_id = $1';
    const params = [userId];

    if (tenantId) {
      query += ' AND tenant_id = $2';
      params.push(tenantId);
    }

    const prefs = await db.query(query, params);

    if (prefs.rows.length === 0) {
      // Create default preferences
      const defaultPrefs = await db.query(
        `INSERT INTO notification_preferences 
         (user_id, tenant_id, push_enabled, sms_enabled, email_enabled, whatsapp_enabled, in_app_enabled) 
         VALUES ($1, $2, true, true, true, true, true) 
         RETURNING *`,
        [userId, tenantId || null]
      );
      return res.json({
        success: true,
        data: defaultPrefs.rows[0]
      });
    }

    res.json({
      success: true,
      data: prefs.rows[0]
    });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch notification preferences' 
    });
  }
};

// Update notification preferences
exports.updatePreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const { push_enabled, sms_enabled, email_enabled, whatsapp_enabled } = req.body;

    const result = await db.query(
      `UPDATE notification_preferences 
       SET push_enabled = $1, sms_enabled = $2, email_enabled = $3, whatsapp_enabled = $4, updated_at = NOW() 
       WHERE user_id = $5 
       RETURNING *`,
      [push_enabled, sms_enabled, email_enabled, whatsapp_enabled, userId]
    );

    if (result.rows.length === 0) {
      // Create if doesn't exist
      const newPrefs = await db.query(
        `INSERT INTO notification_preferences 
         (user_id, push_enabled, sms_enabled, email_enabled, whatsapp_enabled) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [userId, push_enabled, sms_enabled, email_enabled, whatsapp_enabled]
      );
      return res.json({
        success: true,
        data: newPrefs.rows[0]
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update notification preferences' 
    });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await db.query(
      `DELETE FROM notifications WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete notification' 
    });
  }
};

// Mark all as read
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await db.query(
      `UPDATE notifications 
       SET is_read = true, read_at = NOW() 
       WHERE user_id = $1 AND is_read = false`,
      [userId]
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to mark all notifications as read' 
    });
  }
};

const notificationService = require('../services/notificationService');

/**
 * Subscribe to push notifications
 */
exports.subscribe = async (req, res) => {
  try {
    const { token, type, deviceInfo } = req.body;
    const { adminId, customerId } = req.user;

    if (!token || !type) {
      return res.status(400).json({ error: 'Token and type are required' });
    }

    if (!['fcm', 'web_push'].includes(type)) {
      return res.status(400).json({ error: 'Invalid subscription type' });
    }

    // Check if subscription already exists
    const { rows: existingRows } = await db.query(
      `SELECT subscription_id FROM push_subscriptions
       WHERE token = $1 AND (admin_id = $2 OR customer_id = $3)`,
      [token, adminId || null, customerId || null]
    );

    if (existingRows.length > 0) {
      // Update existing subscription
      await db.query(
        `UPDATE push_subscriptions
         SET active = true, device_info = $1, updated_at = NOW()
         WHERE subscription_id = $2`,
        [JSON.stringify(deviceInfo), existingRows[0].subscription_id]
      );

      return res.json({
        success: true,
        subscriptionId: existingRows[0].subscription_id,
        message: 'Subscription updated',
      });
    }

    // Create new subscription
    const { rows } = await db.query(
      `INSERT INTO push_subscriptions (admin_id, customer_id, token, type, device_info)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING subscription_id`,
      [adminId || null, customerId || null, token, type, JSON.stringify(deviceInfo)]
    );

    res.status(201).json({
      success: true,
      subscriptionId: rows[0].subscription_id,
      message: 'Subscription created',
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ error: 'Failed to subscribe to push notifications' });
  }
};

/**
 * Unsubscribe from push notifications
 */
exports.unsubscribe = async (req, res) => {
  try {
    const { token } = req.body;
    const { adminId, customerId } = req.user;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    await db.query(
      `UPDATE push_subscriptions
       SET active = false, updated_at = NOW()
       WHERE token = $1 AND (admin_id = $2 OR customer_id = $3)`,
      [token, adminId || null, customerId || null]
    );

    res.json({ success: true, message: 'Unsubscribed successfully' });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({ error: 'Failed to unsubscribe from push notifications' });
  }
};

/**
 * Get user notifications
 */
exports.getNotifications = async (req, res) => {
  try {
    const { adminId, customerId } = req.user;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        notification_id,
        type,
        title,
        message,
        data,
        read,
        priority,
        created_at
      FROM notifications
      WHERE (admin_id = $1 OR customer_id = $2)
    `;
    const params = [adminId || null, customerId || null];

    if (unreadOnly === 'true') {
      query += ' AND read = false';
    }

    query += ' ORDER BY created_at DESC LIMIT $3 OFFSET $4';
    params.push(limit, offset);

    const { rows } = await db.query(query, params);

    // Get total count
    const { rows: countRows } = await db.query(
      `SELECT COUNT(*) FROM notifications
       WHERE (admin_id = $1 OR customer_id = $2) ${unreadOnly === 'true' ? 'AND read = false' : ''}`,
      [adminId || null, customerId || null]
    );

    res.json({
      success: true,
      notifications: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countRows[0].count),
        pages: Math.ceil(countRows[0].count / limit),
      },
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
};

/**
 * Mark notification as read
 */
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { adminId, customerId } = req.user;

    const { rows } = await db.query(
      `UPDATE notifications
       SET read = true
       WHERE notification_id = $1 AND (admin_id = $2 OR customer_id = $3)
       RETURNING notification_id`,
      [notificationId, adminId || null, customerId || null]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
};

/**
 * Send admin broadcast notification
 */
exports.sendBroadcast = async (req, res) => {
  try {
    const { message, targetCustomerIds } = req.body;
    const { tenantId, adminId } = req.user;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const result = await notificationService.sendAdminMessageNotification(
      tenantId,
      adminId,
      message,
      targetCustomerIds || []
    );

    res.json(result);
  } catch (error) {
    console.error('Send broadcast error:', error);
    res.status(500).json({ error: 'Failed to send broadcast notification' });
  }
};

/**
 * Get VAPID public key for Web Push
 */
exports.getVapidPublicKey = async (req, res) => {
  try {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    if (!publicKey) {
      return res.status(404).json({ error: 'VAPID public key not configured' });
    }
    res.json({ publicKey });
  } catch (error) {
    console.error('Get VAPID key error:', error);
    res.status(500).json({ error: 'Failed to get VAPID public key' });
  }
};
