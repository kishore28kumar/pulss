/**
 * Unit tests for Audit Service
 * Tests core audit logging functionality
 */

// Mock the database pool
jest.mock('../../config/db', () => ({
  pool: {
    query: jest.fn()
  }
}));

const { pool } = require('../../config/db');
const {
  logAuditEvent,
  getAuditLogs,
  generateComplianceReport,
  exportAuditLogs
} = require('../../services/auditService');

describe('Audit Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('logAuditEvent', () => {
    const mockAuditParams = {
      tenantId: '550e8400-e29b-41d4-a716-446655440000',
      adminId: '660e8400-e29b-41d4-a716-446655440001',
      adminEmail: 'admin@test.com',
      action: 'create',
      resourceType: 'product',
      resourceId: '770e8400-e29b-41d4-a716-446655440002',
      event: 'product.create',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      status: 'success',
      severity: 'info'
    };

    test('should log audit event successfully', async () => {
      // Mock config check
      pool.query.mockResolvedValueOnce({
        rows: [{ enabled: true }]
      });

      // Mock retention policy query
      pool.query.mockResolvedValueOnce({
        rows: [{ retention_days: 365 }]
      });

      // Mock insert query
      pool.query.mockResolvedValueOnce({
        rows: [{ log_id: 'test-log-id', ...mockAuditParams }]
      });

      // Mock alerts query
      pool.query.mockResolvedValueOnce({
        rows: []
      });

      const result = await logAuditEvent(mockAuditParams);

      expect(result).toBeDefined();
      expect(pool.query).toHaveBeenCalledTimes(4);
    });

    test('should skip logging when disabled for tenant', async () => {
      // Mock config check - disabled
      pool.query.mockResolvedValueOnce({
        rows: [{ enabled: false }]
      });

      const result = await logAuditEvent({
        ...mockAuditParams,
        severity: 'info'
      });

      expect(result).toBeNull();
      expect(pool.query).toHaveBeenCalledTimes(1);
    });

    test('should log critical events even when disabled', async () => {
      // Mock config check - disabled
      pool.query.mockResolvedValueOnce({
        rows: [{ enabled: false }]
      });

      // Mock retention policy query
      pool.query.mockResolvedValueOnce({
        rows: [{ retention_days: 365 }]
      });

      // Mock insert query
      pool.query.mockResolvedValueOnce({
        rows: [{ log_id: 'test-log-id', ...mockAuditParams }]
      });

      // Mock alerts query
      pool.query.mockResolvedValueOnce({
        rows: []
      });

      const result = await logAuditEvent({
        ...mockAuditParams,
        severity: 'critical'
      });

      expect(result).toBeDefined();
    });

    test('should handle errors gracefully', async () => {
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      const result = await logAuditEvent(mockAuditParams);

      expect(result).toBeNull();
    });
  });

  describe('getAuditLogs', () => {
    test('should retrieve audit logs with pagination', async () => {
      const mockLogs = [
        { log_id: '1', action: 'create', created_at: new Date() },
        { log_id: '2', action: 'update', created_at: new Date() }
      ];

      // Mock main query
      pool.query.mockResolvedValueOnce({
        rows: mockLogs
      });

      // Mock count query
      pool.query.mockResolvedValueOnce({
        rows: [{ count: '2' }]
      });

      const filters = { tenantId: '550e8400-e29b-41d4-a716-446655440000' };
      const result = await getAuditLogs(filters, 1, 50);

      expect(result).toBeDefined();
      expect(result.logs).toEqual(mockLogs);
      expect(result.pagination).toBeDefined();
      expect(result.pagination.total).toBe(2);
    });

    test('should filter logs by action', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });
      pool.query.mockResolvedValueOnce({ rows: [{ count: '0' }] });

      const filters = {
        tenantId: '550e8400-e29b-41d4-a716-446655440000',
        action: 'create'
      };

      await getAuditLogs(filters);

      expect(pool.query).toHaveBeenCalled();
      const firstCall = pool.query.mock.calls[0];
      expect(firstCall[0]).toContain('action = $');
    });
  });

  describe('generateComplianceReport', () => {
    test('should generate compliance report', async () => {
      const mockSummary = {
        total_events: 100,
        unique_admins: 5,
        successful_events: 95,
        failed_events: 5,
        critical_events: 2,
        high_events: 8
      };

      // Mock summary query
      pool.query.mockResolvedValueOnce({
        rows: [mockSummary]
      });

      // Mock events by day query
      pool.query.mockResolvedValueOnce({
        rows: [
          { date: '2025-01-01', count: 50 },
          { date: '2025-01-02', count: 50 }
        ]
      });

      // Mock top admins query
      pool.query.mockResolvedValueOnce({
        rows: [
          { admin_email: 'admin1@test.com', action_count: 60 },
          { admin_email: 'admin2@test.com', action_count: 40 }
        ]
      });

      const tenantId = '550e8400-e29b-41d4-a716-446655440000';
      const startDate = '2025-01-01';
      const endDate = '2025-01-31';

      const result = await generateComplianceReport(
        tenantId,
        'standard',
        startDate,
        endDate
      );

      expect(result).toBeDefined();
      expect(result.summary).toEqual(mockSummary);
      expect(result.eventsByDay).toHaveLength(2);
      expect(result.topAdmins).toHaveLength(2);
    });
  });

  describe('exportAuditLogs', () => {
    test('should export audit logs successfully', async () => {
      const mockExportId = '880e8400-e29b-41d4-a716-446655440003';
      const mockLogs = [
        { log_id: '1', action: 'create' },
        { log_id: '2', action: 'update' }
      ];

      // Mock export record creation
      pool.query.mockResolvedValueOnce({
        rows: [{ export_id: mockExportId }]
      });

      // Mock getAuditLogs (called internally)
      pool.query.mockResolvedValueOnce({
        rows: mockLogs
      });

      pool.query.mockResolvedValueOnce({
        rows: [{ count: '2' }]
      });

      // Mock export record update
      pool.query.mockResolvedValueOnce({
        rows: [{ export_id: mockExportId, status: 'completed' }]
      });

      const tenantId = '550e8400-e29b-41d4-a716-446655440000';
      const adminId = '660e8400-e29b-41d4-a716-446655440001';
      const adminEmail = 'admin@test.com';
      const filters = { tenantId, startDate: '2025-01-01', endDate: '2025-01-31' };

      const result = await exportAuditLogs(
        tenantId,
        adminId,
        adminEmail,
        filters,
        'json'
      );

      expect(result).toBeDefined();
      expect(result.exportId).toBe(mockExportId);
      expect(result.format).toBe('json');
    });
  });
});
