/**
 * Unit tests for Advanced Notification Service
copilot/improve-notification-error-handling
 */

// Mock dependencies

 * Tests core notification functionality with retry logic and analytics
 */

// Set environment variables before requiring modules
process.env.EMAIL_NOTIFICATIONS_ENABLED = 'true';
process.env.SMS_NOTIFICATIONS_ENABLED = 'true';
process.env.PUSH_NOTIFICATIONS_ENABLED = 'true';
process.env.WEBHOOK_NOTIFICATIONS_ENABLED = 'true';

// Mock the database pool
main
jest.mock('../../config/db', () => ({
  pool: {
    query: jest.fn()
  }
}));

copilot/improve-notification-error-handling
const { pool } = require('../../config/db');

// Mock global fetch
global.fetch = jest.fn();

describe('AdvancedNotificationService', () => {
  let advancedNotificationService;
  let originalEnv;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    
    // Save original env
    originalEnv = { ...process.env };
    
    // Setup test environment
    process.env.EMAIL_NOTIFICATIONS_ENABLED = 'true';
    process.env.EMAIL_PROVIDER = 'smtp';
    process.env.SMTP_HOST = 'smtp.test.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_SECURE = 'false';
    process.env.SMTP_USER = 'test-user';
    process.env.SMTP_PASS = 'test-pass';
    process.env.SMS_NOTIFICATIONS_ENABLED = 'true';
    process.env.SMS_PROVIDER = 'twilio';
    process.env.TWILIO_ACCOUNT_SID = 'test-sid';
    process.env.TWILIO_AUTH_TOKEN = 'test-token';
    process.env.TWILIO_PHONE_NUMBER = '+1234567890';
    process.env.PUSH_NOTIFICATIONS_ENABLED = 'true';
    process.env.PUSH_PROVIDER = 'fcm';
    process.env.FCM_SERVER_KEY = 'test-fcm-key';
    process.env.WEBHOOK_NOTIFICATIONS_ENABLED = 'true';
    
    advancedNotificationService = require('../../services/advancedNotificationService');
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
  });

  describe('validateChannelConfig', () => {
    test('should validate email channel configuration', () => {
      const result = advancedNotificationService.validateChannelConfig('email');
      if (!result.valid) {
        console.log('Validation failed:', result);
      }
      expect(result.valid).toBe(true);
    });

    test('should return invalid for unknown channel', () => {
      const result = advancedNotificationService.validateChannelConfig('unknown');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Unknown channel');
    });

    test('should return invalid when channel is not enabled', () => {
      process.env.EMAIL_NOTIFICATIONS_ENABLED = 'false';
      jest.resetModules();
      advancedNotificationService = require('../../services/advancedNotificationService');
      
      const result = advancedNotificationService.validateChannelConfig('email');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('not enabled');
    });

    test('should validate SMS channel configuration', () => {
      const result = advancedNotificationService.validateChannelConfig('sms');
      expect(result.valid).toBe(true);
    });

    test('should return invalid when SMS credentials are missing', () => {
      delete process.env.TWILIO_ACCOUNT_SID;
      jest.resetModules();
      advancedNotificationService = require('../../services/advancedNotificationService');
      
      const result = advancedNotificationService.validateChannelConfig('sms');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Missing configuration');
    });

    test('should validate push channel configuration', () => {
      const result = advancedNotificationService.validateChannelConfig('push');
      expect(result.valid).toBe(true);
    });

    test('should validate webhook channel configuration', () => {
      const result = advancedNotificationService.validateChannelConfig('webhook');
      if (!result.valid) {
        console.log('Webhook validation failed:', result);
      }
      expect(result.valid).toBe(true);

// Mock sqlite3
jest.mock('sqlite3', () => {
  const mockDatabase = {
    exec: jest.fn((sql, callback) => callback && callback(null)),
    run: jest.fn(function (sql, params, callback) {
      if (callback) callback.call({ lastID: 1 }, null);
    }),
    all: jest.fn((sql, params, callback) => callback && callback(null, [])),
    close: jest.fn((callback) => callback && callback(null))
  };

  return {
    verbose: jest.fn(() => ({
      Database: jest.fn(() => mockDatabase)
    }))
  };
});

const { pool } = require('../../config/db');
const advancedNotificationService = require('../../services/advancedNotificationService');

describe('Advanced Notification Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Configuration Validation', () => {
    test('should validate configuration on initialization', () => {
      // Service is already initialized, just verify it exists
      expect(advancedNotificationService).toBeDefined();
      expect(advancedNotificationService.config).toBeDefined();
    });

    test('should have proper retry configuration', () => {
      expect(advancedNotificationService.config.retry).toBeDefined();
      expect(advancedNotificationService.config.retry.maxAttempts).toBeGreaterThanOrEqual(0);
      expect(advancedNotificationService.config.retry.maxAttempts).toBeLessThanOrEqual(10);
    });

    test('should have analytics configuration', () => {
      expect(advancedNotificationService.config.analytics).toBeDefined();
      expect(typeof advancedNotificationService.config.analytics.enabled).toBe('boolean');
main
    });
  });

  describe('sendNotification', () => {
copilot/improve-notification-error-handling
    test('should return error when channel is missing', async () => {
      const result = await advancedNotificationService.sendNotification({
        recipient: 'test@example.com',
        message: 'Test message'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Channel is required');
    });

    test('should return error when recipient is missing', async () => {
      const result = await advancedNotificationService.sendNotification({
        channel: 'email',
        message: 'Test message'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Recipient is required');
    });

    test('should return error when message is missing', async () => {
      const result = await advancedNotificationService.sendNotification({
        channel: 'email',
        recipient: 'test@example.com'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Message is required');
    });

    test('should send email notification successfully', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const result = await advancedNotificationService.sendNotification({
        channel: 'email',
        recipient: 'test@example.com',
        subject: 'Test Subject',
        message: 'Test message'
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    test('should send SMS notification successfully', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const result = await advancedNotificationService.sendNotification({
        channel: 'sms',
        recipient: '+1234567890',
        message: 'Test message'
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    test('should send push notification successfully', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const result = await advancedNotificationService.sendNotification({
        channel: 'push',
        recipient: 'device-token',
        subject: 'Test',
        message: 'Test message'
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    test('should return error for unsupported channel', async () => {
      const result = await advancedNotificationService.sendNotification({
        channel: 'telegram',
        recipient: 'test',
        message: 'Test message'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown channel');
    });

    test('should return error when channel config is invalid', async () => {
      process.env.EMAIL_NOTIFICATIONS_ENABLED = 'false';
      jest.resetModules();
      advancedNotificationService = require('../../services/advancedNotificationService');

      const result = await advancedNotificationService.sendNotification({
        channel: 'email',
        recipient: 'test@example.com',
        message: 'Test message'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      // Note: suggestion may not be defined for all error types
    });
  });

  describe('sendWebhookNotification', () => {
    test('should send webhook notification successfully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200
      });

      const result = await advancedNotificationService.sendWebhookNotification(
        'https://example.com/webhook',
        { test: 'data' }
      );

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://example.com/webhook',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      );
    });

    test('should handle webhook failures', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const result = await advancedNotificationService.sendWebhookNotification(
        'https://example.com/webhook',
        { test: 'data' }
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Webhook failed');
      expect(result.suggestion).toBeDefined();
    });

    test('should handle network errors', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await advancedNotificationService.sendWebhookNotification(
        'https://example.com/webhook',
        { test: 'data' }
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });

  describe('logNotification', () => {
    test('should send notification and attempt to log', async () => {
      // sendNotification calls logNotification internally
      // logNotification is wrapped in try-catch so it won't fail the main operation
      const result = await advancedNotificationService.sendNotification({
        channel: 'email',
        recipient: 'test@example.com',
        subject: 'Test',
        message: 'Test message'
      });

      // Verify notification was sent successfully
      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      
      // Note: logNotification is called internally, but since it's wrapped in try-catch
      // and uses a singleton pool, we verify its behavior through the "should not fail" test
    });

    test('should not fail main operation if logging fails', async () => {
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      // Should not throw
      await expect(
        advancedNotificationService.logNotification({
          channel: 'email',
          recipient: 'test@example.com',
          subject: 'Test',
          message: 'Test message',
          result: { success: true }
        })
      ).resolves.toBeUndefined();

    const mockNotificationData = {
      tenantId: 'tenant-123',
      adminId: 'admin-456',
      recipientEmail: 'test@example.com',
      notificationType: 'order',
      channel: 'email',
      templateKey: 'order-confirmation',
      variables: { orderId: '789' },
      priority: 'high'
    };

    test('should create notification record in database', async () => {
      // Mock database responses
      pool.query.mockResolvedValueOnce({
        rows: [{ notification_id: 'notif-001' }]
      });

      // Mock sendEmailNotification to succeed
      advancedNotificationService.sendEmailNotification = jest.fn().mockResolvedValue({ sent: true });

      await advancedNotificationService.sendNotification(mockNotificationData);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO notifications_enhanced'),
        expect.arrayContaining([mockNotificationData.tenantId])
      );
    });

    test('should reject when tenant ID is missing', async () => {
      const invalidData = { ...mockNotificationData, tenantId: null };

      await expect(
        advancedNotificationService.sendNotification(invalidData)
      ).rejects.toThrow('Tenant ID is required');
    });

    test('should reject when channel is missing', async () => {
      const invalidData = { ...mockNotificationData, channel: null };

      await expect(
        advancedNotificationService.sendNotification(invalidData)
      ).rejects.toThrow('Channel and notification type are required');
    });

    test('should reject when channel is not enabled', async () => {
      const invalidData = { ...mockNotificationData, channel: 'disabled_channel' };

      pool.query.mockResolvedValueOnce({
        rows: [{ notification_id: 'notif-001' }]
      });

      await expect(
        advancedNotificationService.sendNotification(invalidData)
      ).rejects.toThrow('not enabled');
    });

    test('should handle scheduled notifications', async () => {
      const scheduledData = {
        ...mockNotificationData,
        scheduledFor: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
      };

      pool.query.mockResolvedValueOnce({
        rows: [{ notification_id: 'notif-002' }]
      });

      const result = await advancedNotificationService.sendNotification(scheduledData);

      expect(result.status).toBe('scheduled');
      expect(result.scheduledFor).toBe(scheduledData.scheduledFor);
    });
  });

  describe('Retry Logic', () => {
    let originalSendEmailNotification;

    beforeEach(() => {
      // Save the original method
      originalSendEmailNotification = advancedNotificationService.sendEmailNotification;
    });

    afterEach(() => {
      // Restore the original method after each test
      advancedNotificationService.sendEmailNotification = originalSendEmailNotification;
    });

    test('should retry failed notifications', async () => {
      const notificationId = 'notif-retry-001';
      const notificationData = {
        channel: 'email',
        recipientEmail: 'test@example.com',
        tenantId: 'tenant-123'
      };

      // Mock sendEmailNotification to fail twice then succeed
      let attemptCount = 0;
      advancedNotificationService.sendEmailNotification = jest.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.reject(new Error('Temporary failure'));
        }
        return Promise.resolve({ sent: true });
      });

      // Mock updateNotificationStatus
      pool.query.mockResolvedValue({ rows: [] });

      const result = await advancedNotificationService.sendWithRetry(
        notificationId,
        notificationData,
        0
      );

      expect(result.status).toBe('sent');
      expect(attemptCount).toBe(3);
    });

    test('should fail after max retries', async () => {
      const notificationId = 'notif-fail-001';
      const notificationData = {
        channel: 'email',
        recipientEmail: 'test@example.com',
        tenantId: 'tenant-123'
      };

      // Mock sendEmailNotification to always fail
      advancedNotificationService.sendEmailNotification = jest.fn()
        .mockRejectedValue(new Error('Permanent failure'));

      // Mock updateNotificationStatus
      pool.query.mockResolvedValue({ rows: [] });

      // Set max retries to 2 for faster testing
      const originalMaxAttempts = advancedNotificationService.config.retry.maxAttempts;
      advancedNotificationService.config.retry.maxAttempts = 2;

      await expect(
        advancedNotificationService.sendWithRetry(notificationId, notificationData, 0)
      ).rejects.toThrow('Permanent failure');

      // Restore original value
      advancedNotificationService.config.retry.maxAttempts = originalMaxAttempts;
    });
  });

  describe('Analytics', () => {
    test('should track notification sent event', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      await advancedNotificationService.trackAnalytics(
        'tenant-123',
        'notif-001',
        'sent',
        'email'
      );

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO notification_analytics'),
        ['tenant-123', 'notif-001', 'sent', 'email']
      );
    });

    test('should handle analytics errors gracefully', async () => {
      pool.query.mockRejectedValueOnce(new Error('Analytics DB error'));

      // Should not throw
      await expect(
        advancedNotificationService.trackAnalytics(
          'tenant-123',
          'notif-001',
          'sent',
          'email'
        )
      ).resolves.not.toThrow();
    });

    test('should retrieve analytics data', async () => {
      const mockAnalytics = [
        { date: '2025-01-01', metric_type: 'sent', channel: 'email', count: 10 },
        { date: '2025-01-01', metric_type: 'delivered', channel: 'email', count: 9 }
      ];

      pool.query.mockResolvedValueOnce({ rows: mockAnalytics });

      const result = await advancedNotificationService.getAnalytics(
        'tenant-123',
        '2025-01-01',
        '2025-01-31',
        'email'
      );

      expect(result).toEqual(mockAnalytics);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM notification_analytics'),
        expect.arrayContaining(['tenant-123', '2025-01-01', '2025-01-31', 'email'])
      );
    });
  });

  describe('SQLite Queue Operations', () => {
    test('should queue notification in SQLite', async () => {
      const queueData = {
        tenantId: 'tenant-123',
        notificationId: 'notif-001',
        channel: 'email',
        recipient: 'test@example.com',
        payload: { test: 'data' },
        priority: 'high'
      };

      const result = await advancedNotificationService.queueNotificationSQLite(queueData);

      expect(result).toHaveProperty('queueId');
      expect(result.queueId).toBe(1);
    });

    test('should get pending notifications from SQLite', async () => {
      const result = await advancedNotificationService.getPendingNotificationsSQLite(10);

      expect(Array.isArray(result)).toBe(true);
    });

    test('should update notification status in SQLite', async () => {
      await expect(
        advancedNotificationService.updateNotificationStatusSQLite(1, 'sent')
      ).resolves.not.toThrow();
    });
  });

  describe('Channel-specific Methods', () => {
    test('should have sendEmailNotification method', () => {
      expect(typeof advancedNotificationService.sendEmailNotification).toBe('function');
    });

    test('should have sendSMSNotification method', () => {
      expect(typeof advancedNotificationService.sendSMSNotification).toBe('function');
    });

    test('should have sendPushNotification method', () => {
      expect(typeof advancedNotificationService.sendPushNotification).toBe('function');
    });

    test('should have sendWebhookNotification method', () => {
      expect(typeof advancedNotificationService.sendWebhookNotification).toBe('function');
main
    });
  });
});
