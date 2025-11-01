/**
 * Unit tests for Billing Notification Service
 */

// Mock dependencies
const mockQuery = jest.fn();
jest.mock('../../config/db', () => ({
  query: mockQuery
}));

jest.mock('../../services/emailService', () => ({
  sendEmail: jest.fn()
}));

const db = require('../../config/db');
const emailService = require('../../services/emailService');

// Load the service after mocks are in place
const billingNotificationService = require('../../services/billingNotificationService');

describe('BillingNotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendEmail', () => {
    test('should send email successfully', async () => {
      emailService.sendEmail.mockResolvedValueOnce({
        success: true,
        messageId: 'test-message-id'
      });

      const result = await billingNotificationService.sendEmail(
        'test@example.com',
        'Test Subject',
        'Test Body'
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test-message-id');
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: 'Test Subject',
          text: 'Test Body'
        })
      );
    });

    test('should return error when email parameters are missing', async () => {
      const result = await billingNotificationService.sendEmail('', 'Subject', 'Body');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should handle email service failures', async () => {
      emailService.sendEmail.mockResolvedValueOnce({
        success: false,
        error: 'SMTP connection failed'
      });

      const result = await billingNotificationService.sendEmail(
        'test@example.com',
        'Test Subject',
        'Test Body'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('SMTP connection failed');
    });
  });

  describe('queueNotification', () => {
    test('should queue notification successfully', async () => {
      const mockNotification = {
        notification_id: 1,
        tenant_id: 'tenant-1',
        invoice_id: 'invoice-1'
      };

      mockQuery.mockResolvedValueOnce({ rows: [mockNotification] });

      const result = await billingNotificationService.queueNotification(
        'tenant-1',
        'invoice-1',
        'invoice_created',
        'test@example.com',
        'Test Subject',
        'Test Body'
      );

      expect(result).toEqual(mockNotification);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO billing_notifications'),
        expect.arrayContaining(['tenant-1', 'invoice-1', 'invoice_created'])
      );
    });
  });

  describe('sendInvoiceCreated', () => {
    test('should send invoice created notification successfully', async () => {
      const mockInvoice = {
        invoice_id: 1,
        tenant_id: 'tenant-1',
        invoice_number: 'INV-001',
        billing_email: 'test@example.com',
        billing_name: 'Test User',
        tenant_name: 'Test Tenant',
        invoice_date: '2024-01-01',
        due_date: '2024-01-31',
        total_amount: 1000
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [mockInvoice] }) // Get invoice
        .mockResolvedValueOnce({ rows: [{ notification_id: 1 }] }) // Queue notification
        .mockResolvedValueOnce({ rows: [] }); // Update status

      emailService.sendEmail.mockResolvedValueOnce({
        success: true,
        messageId: 'test-id'
      });

      const result = await billingNotificationService.sendInvoiceCreated(1);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test-id');
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: expect.stringContaining('INV-001')
        })
      );
    });

    test('should handle invoice not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await billingNotificationService.sendInvoiceCreated(999);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invoice not found');
    });

    test('should mark notification as failed when email fails', async () => {
      const mockInvoice = {
        invoice_id: 1,
        tenant_id: 'tenant-1',
        invoice_number: 'INV-001',
        billing_email: 'test@example.com',
        billing_name: 'Test User',
        tenant_name: 'Test Tenant'
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [mockInvoice] })
        .mockResolvedValueOnce({ rows: [{ notification_id: 1 }] })
        .mockResolvedValueOnce({ rows: [] }); // Update to failed

      emailService.sendEmail.mockResolvedValueOnce({
        success: false,
        error: 'Email failed'
      });

      const result = await billingNotificationService.sendInvoiceCreated(1);

      expect(result.success).toBe(false);
      // Verify that the notification was marked as failed
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE billing_notifications'),
        expect.arrayContaining(['failed', 'Email failed', 1, 'invoice_created'])
      );
    });
  });

  describe('sendPaymentSuccess', () => {
    test('should send payment success notification', async () => {
      const mockTransaction = {
        transaction_id: 1,
        tenant_id: 'tenant-1',
        invoice_id: 'invoice-1',
        invoice_number: 'INV-001',
        billing_email: 'test@example.com',
        billing_name: 'Test User',
        tenant_name: 'Test Tenant',
        amount: 1000,
        gateway_transaction_id: 'pay_123',
        payment_method: 'card',
        completed_at: '2024-01-01'
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [mockTransaction] })
        .mockResolvedValueOnce({ rows: [{ notification_id: 1 }] })
        .mockResolvedValueOnce({ rows: [] });

      emailService.sendEmail.mockResolvedValueOnce({
        success: true,
        messageId: 'test-id'
      });

      const result = await billingNotificationService.sendPaymentSuccess(1);

      expect(result.success).toBe(true);
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('Payment Received')
        })
      );
    });
  });

  describe('processPendingNotifications', () => {
    test('should process pending notifications successfully', async () => {
      const mockNotifications = [
        {
          notification_id: 1,
          tenant_id: 'tenant-1',
          recipient_email: 'user1@example.com',
          subject: 'Test 1',
          body: 'Body 1'
        },
        {
          notification_id: 2,
          tenant_id: 'tenant-2',
          recipient_email: 'user2@example.com',
          subject: 'Test 2',
          body: 'Body 2'
        }
      ];

      mockQuery
        .mockResolvedValueOnce({ rows: mockNotifications })
        .mockResolvedValueOnce({ rows: [] }) // Update 1
        .mockResolvedValueOnce({ rows: [] }); // Update 2

      emailService.sendEmail
        .mockResolvedValueOnce({ success: true, messageId: 'id1' })
        .mockResolvedValueOnce({ success: true, messageId: 'id2' });

      const result = await billingNotificationService.processPendingNotifications(10);

      expect(result.success).toBe(true);
      expect(result.processed).toBe(2);
      expect(result.failed).toBe(0);
      expect(emailService.sendEmail).toHaveBeenCalledTimes(2);
    });

    test('should handle partial failures', async () => {
      const mockNotifications = [
        {
          notification_id: 1,
          tenant_id: 'tenant-1',
          recipient_email: 'user1@example.com',
          subject: 'Test 1',
          body: 'Body 1'
        },
        {
          notification_id: 2,
          tenant_id: 'tenant-2',
          recipient_email: 'user2@example.com',
          subject: 'Test 2',
          body: 'Body 2'
        }
      ];

      mockQuery
        .mockResolvedValueOnce({ rows: mockNotifications })
        .mockResolvedValueOnce({ rows: [] }) // Update success
        .mockResolvedValueOnce({ rows: [] }); // Update failed

      emailService.sendEmail
        .mockResolvedValueOnce({ success: true, messageId: 'id1' })
        .mockResolvedValueOnce({ success: false, error: 'Email failed' });

      const result = await billingNotificationService.processPendingNotifications(10);

      expect(result.success).toBe(true);
      expect(result.processed).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.details.failed).toHaveLength(1);
    });

    test('should handle database query failures', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      const result = await billingNotificationService.processPendingNotifications(10);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Database error');
      expect(result.suggestion).toBeDefined();
    });
  });
});
