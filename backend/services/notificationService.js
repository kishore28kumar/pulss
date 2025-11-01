/**
 * Notification Service
 * Handles push notifications via FCM and Web Push API
 */

const db = require('../config/db');

class NotificationService {
  constructor() {
    this.fcmEnabled = process.env.FCM_ENABLED === 'true';
    this.fcmServerKey = process.env.FCM_SERVER_KEY;
    this.webPushEnabled = process.env.WEB_PUSH_ENABLED === 'true';
    this.vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    this.vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    this.maxRetries = parseInt(process.env.NOTIFICATION_MAX_RETRIES || '3');
    this.retryDelay = parseInt(process.env.NOTIFICATION_RETRY_DELAY || '1000');
  }

  /**
   * Validate FCM configuration
   */
  validateFCMConfig() {
    if (!this.fcmEnabled) {
      return { valid: false, reason: 'FCM is not enabled' };
    }
    if (!this.fcmServerKey || this.fcmServerKey.trim() === '') {
      return { valid: false, reason: 'FCM_SERVER_KEY is not configured' };
    }
    return { valid: true };
  }

  /**
   * Validate Web Push configuration
   */
  validateWebPushConfig() {
    if (!this.webPushEnabled) {
      return { valid: false, reason: 'Web Push is not enabled' };
    }
    if (!this.vapidPublicKey || !this.vapidPrivateKey) {
      return { valid: false, reason: 'VAPID keys are not configured' };
    }
    return { valid: true };
  }

  /**
   * Retry helper for external API calls
   */
  async retryOperation(operation, retries = this.maxRetries) {
    let lastError;
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (attempt < retries) {
          // Exponential backoff
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          console.log(`Retry attempt ${attempt}/${retries} after ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    throw lastError;
  }

  /**
   * Send push notification via FCM
   */
  async sendFCMNotification(token, notification) {
    // Validate configuration
    const configValidation = this.validateFCMConfig();
    if (!configValidation.valid) {
      console.log('FCM configuration invalid:', configValidation.reason);
      return { success: false, reason: configValidation.reason };
    }

    // Validate input
    if (!token || token.trim() === '') {
      return { success: false, reason: 'Invalid or missing FCM token' };
    }
    if (!notification || !notification.title || !notification.message) {
      return { success: false, reason: 'Invalid notification: title and message are required' };
    }

    try {
      const message = {
        to: token,
        notification: {
          title: notification.title,
          body: notification.message,
          icon: notification.icon || '/icon-192x192.png',
          badge: notification.badge || '/badge-72x72.png',
        },
        data: notification.data || {},
        priority: notification.priority || 'high',
      };

      const result = await this.retryOperation(async () => {
        const response = await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `key=${this.fcmServerKey}`,
          },
          body: JSON.stringify(message),
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(
            `FCM API error: ${response.status} ${response.statusText}. ${errorBody.error || ''}`
          );
        }

        return await response.json();
      });

      return { success: true, result };
    } catch (error) {
      console.error('FCM notification error:', error);
      return { 
        success: false, 
        error: error.message,
        suggestion: 'Check FCM_SERVER_KEY configuration and ensure the token is valid'
      };
    }
  }

  /**
   * Send Web Push notification
   */
  async sendWebPushNotification(subscription, notification) {
    // Validate configuration
    const configValidation = this.validateWebPushConfig();
    if (!configValidation.valid) {
      console.log('Web Push configuration invalid:', configValidation.reason);
      return { success: false, reason: configValidation.reason };
    }

    // Validate input
    if (!subscription || !subscription.endpoint) {
      return { success: false, reason: 'Invalid or missing subscription endpoint' };
    }
    if (!notification || !notification.title || !notification.message) {
      return { success: false, reason: 'Invalid notification: title and message are required' };
    }

    try {
      // Web Push would typically use libraries like 'web-push'
      // For now, we'll store the notification for the service worker to fetch
      const { rows } = await db.query(
        `INSERT INTO push_notifications (subscription_endpoint, title, message, data, sent_at)
         VALUES ($1, $2, $3, $4, NOW())
         RETURNING notification_id`,
        [subscription.endpoint, notification.title, notification.message, JSON.stringify(notification.data || {})]
      );

      return { success: true, notificationId: rows[0].notification_id };
    } catch (error) {
      console.error('Web Push notification error:', error);
      return { 
        success: false, 
        error: error.message,
        suggestion: 'Check database connection and ensure push_notifications table exists'
      };
    }
  }

  /**
   * Save notification to database
   */
  async saveNotification(notification) {
    try {
      const { rows } = await db.query(
        `INSERT INTO notifications (type, title, message, data, tenant_id, admin_id, customer_id, priority)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING notification_id`,
        [
          notification.type,
          notification.title,
          notification.message,
          JSON.stringify(notification.data || {}),
          notification.tenant_id,
          notification.admin_id,
          notification.customer_id,
          notification.priority || 'medium',
        ]
      );

      return { success: true, notificationId: rows[0].notification_id };
    } catch (error) {
      console.error('Save notification error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send notification to user (admin or customer)
   */
  async sendNotification({ tenantId, adminId, customerId, notification }) {
    try {
      // Save to database
      const savedNotification = await this.saveNotification({
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        tenant_id: tenantId,
        admin_id: adminId,
        customer_id: customerId,
        priority: notification.priority,
      });

      if (!savedNotification.success) {
        return savedNotification;
      }

      // Get push tokens for the user
      const tokens = await this.getPushTokens(adminId, customerId);

      // Send push notifications
      const results = [];
      for (const token of tokens) {
        if (token.type === 'fcm') {
          const result = await this.sendFCMNotification(token.token, notification);
          results.push({ type: 'fcm', ...result });
        } else if (token.type === 'web_push') {
          const result = await this.sendWebPushNotification(JSON.parse(token.token), notification);
          results.push({ type: 'web_push', ...result });
        }
      }

      return {
        success: true,
        notificationId: savedNotification.notificationId,
        pushResults: results,
      };
    } catch (error) {
      console.error('Send notification error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get push tokens for a user
   */
  async getPushTokens(adminId, customerId) {
    try {
      const { rows } = await db.query(
        `SELECT token, type FROM push_subscriptions
         WHERE (admin_id = $1 OR customer_id = $2) AND active = true`,
        [adminId, customerId]
      );
      return rows;
    } catch (error) {
      console.error('Get push tokens error:', error);
      return [];
    }
  }

  /**
   * Send order update notification
   */
  async sendOrderUpdateNotification(orderId, status, customerId, tenantId) {
    const statusMessages = {
      pending: 'Your order has been received and is being processed.',
      confirmed: 'Your order has been confirmed and will be prepared soon.',
      preparing: 'Your order is being prepared.',
      ready: 'Your order is ready for pickup/delivery!',
      out_for_delivery: 'Your order is out for delivery.',
      delivered: 'Your order has been delivered. Thank you!',
      cancelled: 'Your order has been cancelled.',
    };

    return this.sendNotification({
      tenantId,
      customerId,
      notification: {
        type: 'order_update',
        title: `Order Update - ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: statusMessages[status] || 'Your order status has been updated.',
        data: { orderId, status },
        priority: 'high',
      },
    });
  }

  /**
   * Send admin message notification
   */
  async sendAdminMessageNotification(tenantId, adminId, message, targetCustomerIds = []) {
    const results = [];
    
    if (targetCustomerIds.length === 0) {
      // Broadcast to all customers of the tenant
      const { rows } = await db.query(
        'SELECT customer_id FROM customers WHERE tenant_id = $1 AND is_active = true',
        [tenantId]
      );
      targetCustomerIds = rows.map(row => row.customer_id);
    }

    for (const customerId of targetCustomerIds) {
      const result = await this.sendNotification({
        tenantId,
        customerId,
        notification: {
          type: 'admin_message',
          title: 'Message from Store',
          message: message,
          priority: 'medium',
        },
      });
      results.push({ customerId, ...result });
    }

    return { success: true, results };
  }
}

module.exports = new NotificationService();
