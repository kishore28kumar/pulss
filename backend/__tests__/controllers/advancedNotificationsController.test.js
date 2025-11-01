/**
 * Unit tests for Advanced Notifications Controller
 * Tests controller methods with proper error handling and validation
 */

// Mock the database pool
jest.mock('../../config/db', () => ({
  pool: {
    query: jest.fn()
  }
}));

// Mock the notification service
jest.mock('../../services/advancedNotificationService', () => ({
  sendNotification: jest.fn(),
  getAnalytics: jest.fn()
}));

const { pool } = require('../../config/db');
const advancedNotificationService = require('../../services/advancedNotificationService');
const controller = require('../../controllers/advancedNotificationsController');

describe('Advanced Notifications Controller', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockReq = {
      user: {
        tenantId: 'tenant-123',
        adminId: 'admin-456',
        customerId: null,
        role: 'admin'
      },
      params: {},
      query: {},
      body: {}
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis()
    };
  });

  describe('getTemplates', () => {
    test('should get templates successfully', async () => {
      const mockTemplates = [
        { template_id: '1', template_name: 'Order Confirmation' },
        { template_id: '2', template_name: 'Payment Receipt' }
      ];

      pool.query.mockResolvedValueOnce({ rows: mockTemplates });

      await controller.getTemplates(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM notification_templates'),
        expect.arrayContaining(['tenant-123'])
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockTemplates
      });
    });

    test('should filter templates by category', async () => {
      mockReq.query.category = 'transactional';
      pool.query.mockResolvedValueOnce({ rows: [] });

      await controller.getTemplates(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('category'),
        expect.arrayContaining(['tenant-123', 'transactional'])
      );
    });

    test('should handle missing tenant ID', async () => {
      mockReq.user.tenantId = null;

      await controller.getTemplates(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Tenant ID is required'
      });
    });

    test('should handle database errors', async () => {
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      await controller.getTemplates(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to get templates',
        error: 'Database error'
      });
    });
  });

  describe('createTemplate', () => {
    test('should create template successfully', async () => {
      mockReq.body = {
        templateKey: 'order-confirmation',
        templateName: 'Order Confirmation',
        category: 'transactional',
        emailSubject: 'Order Confirmed',
        emailBody: 'Your order has been confirmed'
      };

      pool.query.mockResolvedValueOnce({
        rows: [{ template_id: 'new-template-id', template_key: 'order-confirmation' }]
      });

      await controller.createTemplate(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO notification_templates'),
        expect.arrayContaining(['tenant-123', 'order-confirmation'])
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Template created',
        data: expect.objectContaining({ template_id: 'new-template-id' })
      });
    });

    test('should validate required fields', async () => {
      mockReq.body = {
        templateName: 'Test Template'
        // Missing templateKey and category
      };

      await controller.createTemplate(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Template key, name, and category are required'
      });
    });

    test('should check admin permissions', async () => {
      mockReq.user.role = 'user';
      mockReq.body = {
        templateKey: 'test',
        templateName: 'Test',
        category: 'test'
      };

      await controller.createTemplate(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Insufficient permissions'
      });
    });
  });

  describe('updateTemplate', () => {
    test('should update template successfully', async () => {
      mockReq.params.id = 'template-123';
      mockReq.body = {
        template_name: 'Updated Template Name',
        is_active: true
      };

      pool.query.mockResolvedValueOnce({
        rows: [{ template_id: 'template-123', template_name: 'Updated Template Name' }]
      });

      await controller.updateTemplate(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE notification_templates'),
        expect.arrayContaining([expect.anything(), 'template-123', 'tenant-123'])
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Template updated',
        data: expect.objectContaining({ template_id: 'template-123' })
      });
    });

    test('should validate template ID', async () => {
      mockReq.params.id = null;
      mockReq.body = { template_name: 'Test' };

      await controller.updateTemplate(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Template ID is required'
      });
    });

    test('should handle template not found', async () => {
      mockReq.params.id = 'nonexistent';
      mockReq.body = { template_name: 'Test' };

      pool.query.mockResolvedValueOnce({ rows: [] });

      await controller.updateTemplate(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteTemplate', () => {
    test('should delete template successfully', async () => {
      mockReq.params.id = 'template-123';

      pool.query.mockResolvedValueOnce({
        rows: [{ template_id: 'template-123' }]
      });

      await controller.deleteTemplate(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM notification_templates'),
        ['template-123', 'tenant-123']
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Template deleted'
      });
    });

    test('should check permissions before delete', async () => {
      mockReq.user.role = 'user';
      mockReq.params.id = 'template-123';

      await controller.deleteTemplate(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });
  });

  describe('sendNotification', () => {
    test('should send notification successfully', async () => {
      mockReq.body = {
        recipientEmail: 'test@example.com',
        notificationType: 'order',
        channel: 'email',
        templateKey: 'order-confirmation'
      };

      advancedNotificationService.sendNotification.mockResolvedValueOnce({
        notificationId: 'notif-123',
        status: 'sent'
      });

      await controller.sendNotification(mockReq, mockRes);

      expect(advancedNotificationService.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-123',
          channel: 'email',
          notificationType: 'order'
        })
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({ notificationId: 'notif-123' })
      });
    });

    test('should validate required fields', async () => {
      mockReq.body = {
        recipientEmail: 'test@example.com'
        // Missing channel and notificationType
      };

      await controller.sendNotification(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Channel and notification type are required'
      });
    });
  });

  describe('getNotifications', () => {
    test('should get notifications with pagination', async () => {
      mockReq.query = { page: '1', limit: '20' };

      const mockNotifications = [
        { notification_id: '1', title: 'Notification 1' },
        { notification_id: '2', title: 'Notification 2' }
      ];

      pool.query
        .mockResolvedValueOnce({ rows: mockNotifications })
        .mockResolvedValueOnce({ rows: [{ total: '2' }] });

      await controller.getNotifications(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockNotifications,
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          pages: 1
        }
      });
    });

    test('should filter by channel', async () => {
      mockReq.query = { channel: 'email' };

      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] });

      await controller.getNotifications(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('AND channel ='),
        expect.arrayContaining(['email'])
      );
    });
  });

  describe('markAsRead', () => {
    test('should mark notification as read', async () => {
      mockReq.params.id = 'notif-123';

      pool.query.mockResolvedValueOnce({
        rows: [{ notification_id: 'notif-123' }]
      });

      await controller.markAsRead(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE notifications_enhanced'),
        expect.arrayContaining(['notif-123', 'tenant-123'])
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Notification marked as read'
      });
    });

    test('should validate notification ID', async () => {
      mockReq.params.id = null;

      await controller.markAsRead(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should handle notification not found', async () => {
      mockReq.params.id = 'nonexistent';

      pool.query.mockResolvedValueOnce({ rows: [] });

      await controller.markAsRead(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getAnalytics', () => {
    test('should get analytics data', async () => {
      mockReq.query = {
        startDate: '2025-01-01',
        endDate: '2025-01-31'
      };

      const mockAnalytics = [
        { date: '2025-01-01', metric: 'sent', count: 10 }
      ];
      const mockSummary = [
        { channel: 'email', total_notifications: 10, delivered: 9 }
      ];

      advancedNotificationService.getAnalytics.mockResolvedValueOnce(mockAnalytics);
      pool.query.mockResolvedValueOnce({ rows: mockSummary });

      await controller.getAnalytics(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          analytics: mockAnalytics,
          summary: mockSummary
        }
      });
    });

    test('should validate tenant ID for analytics', async () => {
      mockReq.user.tenantId = null;

      await controller.getAnalytics(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('exportHistory', () => {
    test('should export as JSON by default', async () => {
      mockReq.query = {};

      const mockData = [
        { notification_id: '1', title: 'Test' }
      ];

      pool.query.mockResolvedValueOnce({ rows: mockData });

      await controller.exportHistory(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockData
      });
    });

    test('should export as CSV when requested', async () => {
      mockReq.query = { format: 'csv' };

      const mockData = [
        { notification_id: '1', title: 'Test' }
      ];

      pool.query.mockResolvedValueOnce({ rows: mockData });

      await controller.exportHistory(mockReq, mockRes);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringContaining('attachment')
      );
    });

    test('should check admin permissions for export', async () => {
      mockReq.user.role = 'user';

      await controller.exportHistory(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });
  });

  describe('getPreferences', () => {
    test('should get user preferences', async () => {
      const mockPreferences = {
        email_enabled: true,
        sms_enabled: false,
        push_enabled: true
      };

      pool.query.mockResolvedValueOnce({ rows: [mockPreferences] });

      await controller.getPreferences(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockPreferences
      });
    });

    test('should create default preferences if not found', async () => {
      const mockDefaultPreferences = {
        email_enabled: true,
        sms_enabled: true,
        push_enabled: true
      };

      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [mockDefaultPreferences] });

      await controller.getPreferences(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO user_notification_preferences'),
        expect.any(Array)
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockDefaultPreferences
      });
    });
  });

  describe('updatePreferences', () => {
    test('should update preferences successfully', async () => {
      mockReq.body = {
        email_enabled: false,
        sms_enabled: true
      };

      const mockUpdatedPreferences = {
        ...mockReq.body,
        tenant_id: 'tenant-123'
      };

      pool.query.mockResolvedValueOnce({ rows: [mockUpdatedPreferences] });

      await controller.updatePreferences(mockReq, mockRes);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE user_notification_preferences'),
        expect.any(Array)
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Preferences updated',
        data: mockUpdatedPreferences
      });
    });

    test('should validate fields to update', async () => {
      mockReq.body = {};

      await controller.updatePreferences(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'No valid fields to update'
      });
    });
  });
});
