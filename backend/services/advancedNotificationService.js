/**
 * Advanced Notification Service
 * Handles multi-channel notifications (Email, SMS, Push, Webhook)
 * with templates, retry logic, analytics, and super admin controls
 */

const { pool } = require('../config/db');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class AdvancedNotificationService {
  constructor() {
    // Load configuration from environment with validation
    this.config = this.validateAndLoadConfig();
    
    // Initialize SQLite for local caching/queue
    this.initializeSQLite();
  }

  /**
   * Validate and load configuration from environment
   */
  validateAndLoadConfig() {
    const config = {
      email: {
        enabled: process.env.EMAIL_NOTIFICATIONS_ENABLED === 'true',
        provider: process.env.EMAIL_PROVIDER || 'smtp',
        sendgrid: {
          apiKey: process.env.SENDGRID_API_KEY,
          from: process.env.SENDGRID_FROM_EMAIL
        },
        ses: {
          region: process.env.AWS_REGION,
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        },
        smtp: {
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        msg91: {
          authKey: process.env.MSG91_AUTH_KEY,
          senderId: process.env.MSG91_SENDER_ID
        }
      },
      sms: {
        enabled: process.env.SMS_NOTIFICATIONS_ENABLED === 'true',
        provider: process.env.SMS_PROVIDER || 'twilio',
        twilio: {
          accountSid: process.env.TWILIO_ACCOUNT_SID,
          authToken: process.env.TWILIO_AUTH_TOKEN,
          from: process.env.TWILIO_PHONE_NUMBER
        },
        gupshup: {
          apiKey: process.env.GUPSHUP_API_KEY,
          userId: process.env.GUPSHUP_USER_ID
        },
        textlocal: {
          apiKey: process.env.TEXTLOCAL_API_KEY,
          sender: process.env.TEXTLOCAL_SENDER
        },
        msg91: {
          authKey: process.env.MSG91_AUTH_KEY,
          senderId: process.env.MSG91_SENDER_ID
        }
      },
      push: {
        enabled: process.env.PUSH_NOTIFICATIONS_ENABLED === 'true',
        provider: process.env.PUSH_PROVIDER || 'fcm',
        fcm: {
          serverKey: process.env.FCM_SERVER_KEY
        },
        apns: {
          keyId: process.env.APNS_KEY_ID,
          teamId: process.env.APNS_TEAM_ID,
          bundleId: process.env.APNS_BUNDLE_ID
        }
      },
      webhook: {
        enabled: process.env.WEBHOOK_NOTIFICATIONS_ENABLED === 'true',
        retryAttempts: parseInt(process.env.WEBHOOK_RETRY_ATTEMPTS || '3'),
        timeout: parseInt(process.env.WEBHOOK_TIMEOUT || '10000')
      },
      retry: {
        maxAttempts: parseInt(process.env.NOTIFICATION_RETRY_ATTEMPTS || '3'),
        backoffMultiplier: parseFloat(process.env.NOTIFICATION_RETRY_BACKOFF || '2'),
        initialDelay: parseInt(process.env.NOTIFICATION_RETRY_DELAY || '1000')
      },
      analytics: {
        enabled: process.env.ANALYTICS_ENABLED !== 'false',
        batchSize: parseInt(process.env.ANALYTICS_BATCH_SIZE || '100')
      }
    };

    // Validate critical configurations
    this.validateConfig(config);

    return config;
  }

  /**
   * Validate configuration
   */
  validateConfig(config) {
    const errors = [];

    // Validate email configuration
    if (config.email.enabled) {
      if (!config.email.provider) {
        errors.push('Email provider is required when email is enabled');
      }
      const provider = config.email[config.email.provider];
      if (!provider || Object.keys(provider).length === 0) {
        errors.push(`Email provider ${config.email.provider} configuration is missing`);
      }
    }

    // Validate SMS configuration
    if (config.sms.enabled) {
      if (!config.sms.provider) {
        errors.push('SMS provider is required when SMS is enabled');
      }
      const provider = config.sms[config.sms.provider];
      if (!provider || Object.keys(provider).length === 0) {
        errors.push(`SMS provider ${config.sms.provider} configuration is missing`);
      }
    }

    // Validate push configuration
    if (config.push.enabled) {
      if (!config.push.provider) {
        errors.push('Push provider is required when push is enabled');
      }
      const provider = config.push[config.push.provider];
      if (!provider || Object.keys(provider).length === 0) {
        errors.push(`Push provider ${config.push.provider} configuration is missing`);
      }
    }

    // Validate retry configuration
    if (config.retry.maxAttempts < 0 || config.retry.maxAttempts > 10) {
      errors.push('Retry max attempts must be between 0 and 10');
    }

    if (errors.length > 0) {
      console.warn('Notification service configuration warnings:', errors);
    }
  }

  /**
   * Initialize SQLite database for local caching/queue
   */
  initializeSQLite() {
    try {
      const dbPath = process.env.NOTIFICATION_QUEUE_DB || path.join(__dirname, '../dev-database.sqlite');
      this.sqlite = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error('Error opening SQLite database:', err);
          this.sqlite = null;
        } else {
          console.log('SQLite notification queue initialized');
          this.createSQLiteTables();
        }
      });
    } catch (error) {
      console.error('Error initializing SQLite:', error);
      this.sqlite = null;
    }
  }

  /**
   * Create necessary SQLite tables
   */
  createSQLiteTables() {
    if (!this.sqlite) return;

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS notification_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id TEXT NOT NULL,
        notification_id TEXT,
        channel TEXT NOT NULL,
        recipient TEXT NOT NULL,
        payload TEXT NOT NULL,
        priority TEXT DEFAULT 'medium',
        retry_count INTEGER DEFAULT 0,
        max_retries INTEGER DEFAULT 3,
        status TEXT DEFAULT 'pending',
        error_message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        scheduled_for DATETIME,
        last_attempt_at DATETIME,
        processed_at DATETIME
      );

      CREATE INDEX IF NOT EXISTS idx_queue_status ON notification_queue(status);
      CREATE INDEX IF NOT EXISTS idx_queue_scheduled ON notification_queue(scheduled_for);
      CREATE INDEX IF NOT EXISTS idx_queue_tenant ON notification_queue(tenant_id);
    `;

    this.sqlite.exec(createTableSQL, (err) => {
      if (err) {
        console.error('Error creating SQLite tables:', err);
      }
    });
  }

  /**
   * Queue notification in SQLite
   */
  async queueNotificationSQLite(notificationData) {
    return new Promise((resolve, reject) => {
      if (!this.sqlite) {
        return reject(new Error('SQLite not initialized'));
      }

      const {
        tenantId,
        notificationId,
        channel,
        recipient,
        payload,
        priority = 'medium',
        maxRetries = 3,
        scheduledFor = null
      } = notificationData;

      const sql = `
        INSERT INTO notification_queue 
        (tenant_id, notification_id, channel, recipient, payload, priority, max_retries, scheduled_for)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      this.sqlite.run(
        sql,
        [
          tenantId,
          notificationId,
          channel,
          recipient,
          JSON.stringify(payload),
          priority,
          maxRetries,
          scheduledFor
        ],
        function (err) {
          if (err) {
            console.error('Error queuing notification:', err);
            return reject(err);
          }
          resolve({ queueId: this.lastID });
        }
      );
    });
  }

  /**
   * Get pending notifications from SQLite queue
   */
  async getPendingNotificationsSQLite(limit = 100) {
    return new Promise((resolve, reject) => {
      if (!this.sqlite) {
        return reject(new Error('SQLite not initialized'));
      }

      const sql = `
        SELECT * FROM notification_queue
        WHERE status = 'pending' 
        AND (scheduled_for IS NULL OR scheduled_for <= datetime('now'))
        AND retry_count < max_retries
        ORDER BY priority DESC, created_at ASC
        LIMIT ?
      `;

      this.sqlite.all(sql, [limit], (err, rows) => {
        if (err) {
          console.error('Error getting pending notifications:', err);
          return reject(err);
        }
        resolve(rows.map(row => ({
          ...row,
          payload: JSON.parse(row.payload)
        })));
      });
    });
  }

  /**
   * Update notification status in SQLite
   */
  async updateNotificationStatusSQLite(queueId, status, errorMessage = null) {
    return new Promise((resolve, reject) => {
      if (!this.sqlite) {
        return reject(new Error('SQLite not initialized'));
      }

      const sql = `
        UPDATE notification_queue
        SET status = ?,
            error_message = ?,
            last_attempt_at = datetime('now'),
            retry_count = retry_count + 1,
            processed_at = CASE WHEN ? IN ('sent', 'failed') THEN datetime('now') ELSE processed_at END
        WHERE id = ?
      `;

      this.sqlite.run(sql, [status, errorMessage, status, queueId], (err) => {
        if (err) {
          console.error('Error updating notification status:', err);
          return reject(err);
        }
        resolve();
      });
    });
  }

  /**
   * Send notification with retry logic
   */
  async sendNotification(notificationData) {
    try {
      const {
        tenantId,
        adminId,
        customerId,
        recipientEmail,
        recipientPhone,
        notificationType,
        eventType,
        channel,
        templateKey,
        variables = {},
        priority = 'medium',
        metadata = {},
        scheduledFor
      } = notificationData;

      // Validate required fields
      if (!tenantId) {
        throw new Error('Tenant ID is required');
      }

      if (!channel || !notificationType) {
        throw new Error('Channel and notification type are required');
      }

      // Check if channel is enabled
      if (!this.config[channel]?.enabled) {
        throw new Error(`Channel ${channel} is not enabled`);
      }

      // Create notification record in PostgreSQL
      const notificationId = await this.createNotificationRecord({
        tenantId,
        adminId,
        customerId,
        recipientEmail,
        recipientPhone,
        notificationType,
        eventType,
        channel,
        templateKey,
        variables,
        priority,
        metadata,
        scheduledFor
      });

      // If scheduled, queue for later
      if (scheduledFor && new Date(scheduledFor) > new Date()) {
        await this.queueNotificationSQLite({
          tenantId,
          notificationId,
          channel,
          recipient: recipientEmail || recipientPhone,
          payload: notificationData,
          priority,
          scheduledFor
        });

        return {
          notificationId,
          status: 'scheduled',
          scheduledFor
        };
      }

      // Send immediately with retry logic
      const result = await this.sendWithRetry(notificationId, notificationData);

      return {
        notificationId,
        ...result
      };
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  /**
   * Send notification with retry logic
   */
  async sendWithRetry(notificationId, notificationData, attempt = 0) {
    try {
      const { channel } = notificationData;

      // Attempt to send based on channel
      let result;
      switch (channel) {
        case 'email':
          result = await this.sendEmailNotification(notificationData);
          break;
        case 'sms':
          result = await this.sendSMSNotification(notificationData);
          break;
        case 'push':
          result = await this.sendPushNotification(notificationData);
          break;
        case 'webhook':
          result = await this.sendWebhookNotification(notificationData);
          break;
        default:
          throw new Error(`Unsupported channel: ${channel}`);
      }

      // Update status to sent
      await this.updateNotificationStatus(notificationId, 'sent');

      // Track analytics
      if (this.config.analytics.enabled) {
        await this.trackAnalytics(notificationData.tenantId, notificationId, 'sent', channel);
      }

      return { status: 'sent', result };
    } catch (error) {
      console.error(`Error sending notification (attempt ${attempt + 1}):`, error);

      // Check if we should retry
      if (attempt < this.config.retry.maxAttempts) {
        const delay = this.config.retry.initialDelay * Math.pow(this.config.retry.backoffMultiplier, attempt);
        console.log(`Retrying in ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.sendWithRetry(notificationId, notificationData, attempt + 1);
      }

      // Max retries reached, mark as failed
      await this.updateNotificationStatus(notificationId, 'failed', error.message);

      // Track analytics
      if (this.config.analytics.enabled) {
        await this.trackAnalytics(notificationData.tenantId, notificationId, 'failed', notificationData.channel);
      }

      throw error;
    }
  }

  /**
   * Create notification record in PostgreSQL
   */
  async createNotificationRecord(data) {
    const result = await pool.query(
      `INSERT INTO notifications_enhanced 
       (tenant_id, admin_id, customer_id, notification_type, event_type,
        channel, title, message, data, metadata, priority, status, scheduled_for)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING notification_id`,
      [
        data.tenantId,
        data.adminId || null,
        data.customerId || null,
        data.notificationType,
        data.eventType || null,
        data.channel,
        data.variables?.title || 'Notification',
        data.variables?.message || '',
        JSON.stringify(data.variables || {}),
        JSON.stringify(data.metadata || {}),
        data.priority || 'medium',
        data.scheduledFor ? 'scheduled' : 'pending',
        data.scheduledFor || null
      ]
    );

    return result.rows[0].notification_id;
  }

  /**
   * Update notification status
   */
  async updateNotificationStatus(notificationId, status, errorMessage = null) {
    const updateFields = ['status = $2', 'updated_at = NOW()'];
    const params = [notificationId, status];
    let paramIndex = 3;

    if (status === 'sent') {
      updateFields.push(`sent_at = NOW()`, `delivered_at = NOW()`);
    } else if (status === 'failed') {
      updateFields.push(`failed_at = NOW()`, `failure_reason = $${paramIndex++}`);
      params.push(errorMessage);
    }

    await pool.query(
      `UPDATE notifications_enhanced
       SET ${updateFields.join(', ')}
       WHERE notification_id = $1`,
      params
    );
  }

  /**
   * Send email notification (placeholder)
   */
  async sendEmailNotification(data) {
    // This would integrate with actual email provider
    console.log('Sending email notification:', data.recipientEmail);
    
    if (!data.recipientEmail) {
      throw new Error('Recipient email is required');
    }

    // Simulate sending
    return { provider: this.config.email.provider, sent: true };
  }

  /**
   * Send SMS notification (placeholder)
   */
  async sendSMSNotification(data) {
    // This would integrate with actual SMS provider
    console.log('Sending SMS notification:', data.recipientPhone);
    
    if (!data.recipientPhone) {
      throw new Error('Recipient phone is required');
    }

    // Simulate sending
    return { provider: this.config.sms.provider, sent: true };
  }

  /**
   * Send push notification (placeholder)
   */
  async sendPushNotification(data) {
    // This would integrate with actual push provider
    console.log('Sending push notification');
    
    // Simulate sending
    return { provider: this.config.push.provider, sent: true };
  }

  /**
   * Send webhook notification (placeholder)
   */
  async sendWebhookNotification(data) {
    // This would integrate with actual webhook mechanism
    console.log('Sending webhook notification');
    
    // Simulate sending
    return { sent: true };
  }

  /**
   * Track analytics
   */
  async trackAnalytics(tenantId, notificationId, eventType, channel) {
    try {
      await pool.query(
        `INSERT INTO notification_analytics 
         (tenant_id, notification_id, metric_type, channel, recorded_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [tenantId, notificationId, eventType, channel]
      );
    } catch (error) {
      console.error('Error tracking analytics:', error);
      // Don't throw - analytics failure shouldn't break notification sending
    }
  }

  /**
   * Get analytics data
   */
  async getAnalytics(tenantId, startDate, endDate, channel = null) {
    try {
      let query = `
        SELECT 
          DATE(recorded_at) as date,
          metric_type,
          channel,
          COUNT(*) as count
        FROM notification_analytics
        WHERE tenant_id = $1
        AND recorded_at >= $2
        AND recorded_at <= $3
      `;
      
      const params = [tenantId, startDate, endDate];
      
      if (channel) {
        query += ` AND channel = $4`;
        params.push(channel);
      }
      
      query += ` GROUP BY DATE(recorded_at), metric_type, channel ORDER BY date DESC`;

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error getting analytics:', error);
      throw error;
    }
  }

  /**
   * Close SQLite connection
   */
  close() {
    if (this.sqlite) {
      this.sqlite.close((err) => {
        if (err) {
          console.error('Error closing SQLite:', err);
        }
      });
    }
  }
copilot/improve-notification-error-handling

  /**
   * Validate configuration for a specific channel
   */
  validateChannelConfig(channel) {
    const channelConfig = this.config[channel];
    
    if (!channelConfig) {
      return { valid: false, reason: `Unknown channel: ${channel}` };
    }

    if (!channelConfig.enabled) {
      return { valid: false, reason: `${channel} notifications are not enabled` };
    }

    // For channels without providers (like webhook), just check if enabled
    const provider = channelConfig.provider;
    if (!provider) {
      // No provider means basic config, just return valid
      return { valid: true };
    }

    const providerConfig = channelConfig[provider];

    if (!providerConfig) {
      return { valid: false, reason: `Provider ${provider} not configured for ${channel}` };
    }

    // Check if required credentials are present
    const missingKeys = Object.keys(providerConfig).filter(key => {
      const value = providerConfig[key];
      // Allow false boolean and 0 number, but not null, undefined, or empty string
      if (typeof value === 'boolean' || typeof value === 'number') {
        return false; // These are valid values
      }
      return !value || (typeof value === 'string' && value.trim() === '');
    });

    if (missingKeys.length > 0) {
      return { 
        valid: false, 
        reason: `Missing configuration for ${channel}.${provider}: ${missingKeys.join(', ')}`,
        suggestion: `Set the required environment variables for ${provider}`
      };
    }

    return { valid: true };
  }

  /**
   * Send notification through specified channel
   */
  async sendNotification({ channel, recipient, subject, message, data = {} }) {
    try {
      // Validate input
      if (!channel) {
        return { success: false, error: 'Channel is required' };
      }
      if (!recipient) {
        return { success: false, error: 'Recipient is required' };
      }
      if (!message) {
        return { success: false, error: 'Message is required' };
      }

      // Validate channel configuration
      const configValidation = this.validateChannelConfig(channel);
      if (!configValidation.valid) {
        return { 
          success: false, 
          error: configValidation.reason,
          suggestion: configValidation.suggestion
        };
      }

      // Route to appropriate channel handler
      let result;
      switch (channel) {
        case 'email':
          result = await this.sendEmailNotification(recipient, subject, message, data);
          break;
        case 'sms':
          result = await this.sendSMSNotification(recipient, message, data);
          break;
        case 'push':
          result = await this.sendPushNotification(recipient, subject, message, data);
          break;
        case 'webhook':
          result = await this.sendWebhookNotification(recipient, { subject, message, data });
          break;
        default:
          return { success: false, error: `Unsupported channel: ${channel}` };
      }

      // Log the notification attempt
      await this.logNotification({ channel, recipient, subject, message, result });

      return result;
    } catch (error) {
      console.error('Error sending notification:', error);
      return { 
        success: false, 
        error: error.message,
        suggestion: 'Check service configuration and connectivity'
      };
    }
  }

  /**
   * Send email notification (placeholder - implement with actual provider)
   */
  async sendEmailNotification(to, subject, message, data) {
    // This would integrate with the emailService or provider-specific implementation
    console.log(`[EMAIL] To: ${to}, Subject: ${subject}`);
    return { success: true, messageId: `email-${Date.now()}` };
  }

  /**
   * Send SMS notification (placeholder - implement with actual provider)
   */
  async sendSMSNotification(to, message, data) {
    console.log(`[SMS] To: ${to}, Message: ${message}`);
    return { success: true, messageId: `sms-${Date.now()}` };
  }

  /**
   * Send push notification (placeholder - implement with actual provider)
   */
  async sendPushNotification(token, title, message, data) {
    console.log(`[PUSH] Token: ${token}, Title: ${title}`);
    return { success: true, messageId: `push-${Date.now()}` };
  }

  /**
   * Send webhook notification
   */
  async sendWebhookNotification(url, payload) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.webhook.timeout);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
      }

      return { success: true, status: response.status };
    } catch (error) {
      console.error('Webhook notification error:', error);
      return { 
        success: false, 
        error: error.message,
        suggestion: 'Check webhook URL and ensure the endpoint is accessible'
      };
    }
  }

  /**
   * Log notification attempt to database
   */
  async logNotification({ channel, recipient, subject, message, result }) {
    try {
      await pool.query(
        `INSERT INTO notification_logs (channel, recipient, subject, message, success, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [channel, recipient, subject, message, result.success]
      );
    } catch (error) {
      console.error('Error logging notification:', error);
      // Don't fail the main operation if logging fails
    }
  }

main
}

module.exports = new AdvancedNotificationService();
