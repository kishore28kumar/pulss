/**
 * Unit tests for Notification Service
 */

// Mock dependencies
const mockQuery = jest.fn();
jest.mock('../../config/db', () => ({
  query: mockQuery
}));

const db = require('../../config/db');

// Mock global fetch
global.fetch = jest.fn();

describe('NotificationService', () => {
  let notificationService;
  let originalEnv;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    
    // Save original env
    originalEnv = { ...process.env };
    
    // Setup default test environment
    process.env.FCM_ENABLED = 'true';
    process.env.FCM_SERVER_KEY = 'test-fcm-key';
    process.env.WEB_PUSH_ENABLED = 'true';
    process.env.VAPID_PUBLIC_KEY = 'test-public-key';
    process.env.VAPID_PRIVATE_KEY = 'test-private-key';
    process.env.NOTIFICATION_MAX_RETRIES = '2';
    process.env.NOTIFICATION_RETRY_DELAY = '100';
    
    notificationService = require('../../services/notificationService');
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
  });

  describe('validateFCMConfig', () => {
    test('should return valid when FCM is properly configured', () => {
      const result = notificationService.validateFCMConfig();
      expect(result.valid).toBe(true);
    });

    test('should return invalid when FCM is not enabled', () => {
      process.env.FCM_ENABLED = 'false';
      jest.resetModules();
      notificationService = require('../../services/notificationService');
      
      const result = notificationService.validateFCMConfig();
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('not enabled');
    });

    test('should return invalid when FCM_SERVER_KEY is missing', () => {
      process.env.FCM_SERVER_KEY = '';
      jest.resetModules();
      notificationService = require('../../services/notificationService');
      
      const result = notificationService.validateFCMConfig();
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('not configured');
    });
  });

  describe('validateWebPushConfig', () => {
    test('should return valid when Web Push is properly configured', () => {
      const result = notificationService.validateWebPushConfig();
      expect(result.valid).toBe(true);
    });

    test('should return invalid when Web Push is not enabled', () => {
      process.env.WEB_PUSH_ENABLED = 'false';
      jest.resetModules();
      notificationService = require('../../services/notificationService');
      
      const result = notificationService.validateWebPushConfig();
      expect(result.valid).toBe(false);
    });
  });

  describe('sendFCMNotification', () => {
    test('should return error when token is missing', async () => {
      const result = await notificationService.sendFCMNotification('', {
        title: 'Test',
        message: 'Test message'
      });
      
      expect(result.success).toBe(false);
      expect(result.reason).toContain('token');
    });

    test('should return error when notification title is missing', async () => {
      const result = await notificationService.sendFCMNotification('test-token', {
        message: 'Test message'
      });
      
      expect(result.success).toBe(false);
      expect(result.reason).toContain('title');
    });

    test('should send FCM notification successfully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: 1, messageId: 'test-id' })
      });

      const result = await notificationService.sendFCMNotification('test-token', {
        title: 'Test Title',
        message: 'Test message'
      });
      
      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
      expect(global.fetch).toHaveBeenCalledWith(
        'https://fcm.googleapis.com/fcm/send',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'key=test-fcm-key'
          })
        })
      );
    });

    test('should handle FCM API errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: 'Invalid token' })
      });

      const result = await notificationService.sendFCMNotification('test-token', {
        title: 'Test Title',
        message: 'Test message'
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.suggestion).toBeDefined();
    });

    test('should retry on transient failures', async () => {
      // First call fails, second succeeds
      global.fetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: 1 })
        });

      const result = await notificationService.sendFCMNotification('test-token', {
        title: 'Test Title',
        message: 'Test message'
      });
      
      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('sendWebPushNotification', () => {
    test('should return error when subscription endpoint is missing', async () => {
      const result = await notificationService.sendWebPushNotification({}, {
        title: 'Test',
        message: 'Test message'
      });
      
      expect(result.success).toBe(false);
      expect(result.reason).toContain('endpoint');
    });

    test('should store Web Push notification successfully', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ notification_id: 1 }]
      });

      const result = await notificationService.sendWebPushNotification(
        { endpoint: 'https://test.endpoint' },
        {
          title: 'Test Title',
          message: 'Test message'
        }
      );
      
      expect(result.success).toBe(true);
      expect(result.notificationId).toBe(1);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO push_notifications'),
        expect.arrayContaining(['https://test.endpoint', 'Test Title', 'Test message'])
      );
    });

    test('should handle database errors', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      const result = await notificationService.sendWebPushNotification(
        { endpoint: 'https://test.endpoint' },
        {
          title: 'Test Title',
          message: 'Test message'
        }
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Database error');
      expect(result.suggestion).toBeDefined();
    });
  });

  describe('sendNotification', () => {
    test('should save notification and send push notifications', async () => {
      // Mock saveNotification
      mockQuery
        .mockResolvedValueOnce({ rows: [{ notification_id: 1 }] }) // saveNotification
        .mockResolvedValueOnce({ rows: [{ token: 'fcm-token', type: 'fcm' }] }); // getPushTokens

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: 1 })
      });

      const result = await notificationService.sendNotification({
        tenantId: 'tenant-1',
        customerId: 'customer-1',
        notification: {
          type: 'test',
          title: 'Test Title',
          message: 'Test message'
        }
      });
      
      expect(result.success).toBe(true);
      expect(result.notificationId).toBe(1);
      expect(result.pushResults).toBeDefined();
    });

    test('should handle notification save failures', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Save failed'));

      const result = await notificationService.sendNotification({
        tenantId: 'tenant-1',
        customerId: 'customer-1',
        notification: {
          type: 'test',
          title: 'Test Title',
          message: 'Test message'
        }
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getPushTokens', () => {
    test('should retrieve push tokens for user', async () => {
      const mockTokens = [
        { token: 'token1', type: 'fcm' },
        { token: 'token2', type: 'web_push' }
      ];
      
      mockQuery.mockResolvedValueOnce({ rows: mockTokens });

      const result = await notificationService.getPushTokens('admin-1', null);
      
      expect(result).toEqual(mockTokens);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT token, type FROM push_subscriptions'),
        ['admin-1', null]
      );
    });

    test('should return empty array on error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      const result = await notificationService.getPushTokens('admin-1', null);
      
      expect(result).toEqual([]);
    });
  });
});
