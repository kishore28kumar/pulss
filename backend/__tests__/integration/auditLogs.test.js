/**
 * Integration tests for Audit Logs API
 * Tests require a running database and server
 */

// Mock database for integration tests
jest.mock('../../config/db', () => ({
  pool: {
    query: jest.fn()
  }
}));

const request = require('supertest');
const { pool } = require('../../config/db');

// Mock Express app setup
const express = require('express');
const app = express();
app.use(express.json());

// Mock auth middleware
const mockAuthMiddleware = (req, res, next) => {
  req.user = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'admin@test.com',
    tenant_id: '660e8400-e29b-41d4-a716-446655440001',
    role: 'admin'
  };
  next();
};

const mockRequireRole = (...roles) => (req, res, next) => {
  if (roles.includes(req.user.role)) {
    return next();
  }
  res.status(403).json({ error: 'Forbidden' });
};

// Mock the auth module
jest.mock('../../middleware/auth', () => ({
  authMiddleware: mockAuthMiddleware,
  requireRole: jest.fn((...roles) => mockRequireRole(...roles))
}));

// Import routes after mocking
const auditLogsRoutes = require('../../routes/auditLogs');
app.use('/api/audit-logs', auditLogsRoutes);

describe('Audit Logs API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/audit-logs', () => {
    test('should return audit logs with pagination', async () => {
      const mockLogs = [
        {
          log_id: '1',
          action: 'create',
          resource_type: 'product',
          admin_email: 'admin@test.com',
          created_at: new Date().toISOString()
        }
      ];

      // Mock query for logs
      pool.query.mockResolvedValueOnce({
        rows: mockLogs
      });

      // Mock query for count
      pool.query.mockResolvedValueOnce({
        rows: [{ count: '1' }]
      });

      const response = await request(app)
        .get('/api/audit-logs')
        .query({ page: 1, limit: 50 })
        .expect(200);

      expect(response.body.logs).toBeDefined();
      expect(response.body.pagination).toBeDefined();
    });

    test('should reject invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/audit-logs')
        .query({ page: 0 })
        .expect(400);

      expect(response.body.error).toBe('Invalid pagination');
    });
  });

  describe('GET /api/audit-logs/stats', () => {
    test('should return audit log statistics', async () => {
      // Mock all stats queries
      pool.query.mockResolvedValueOnce({ rows: [{ total: '100' }] });
      pool.query.mockResolvedValueOnce({ rows: [{ action: 'create', count: '50' }] });
      pool.query.mockResolvedValueOnce({ rows: [{ resource_type: 'product', count: '50' }] });
      pool.query.mockResolvedValueOnce({ rows: [{ status: 'success', count: '95' }] });
      pool.query.mockResolvedValueOnce({ rows: [{ admin_email: 'admin@test.com', count: '60' }] });

      const response = await request(app)
        .get('/api/audit-logs/stats')
        .expect(200);

      expect(response.body.total).toBeDefined();
      expect(response.body.by_action).toBeDefined();
    });
  });

  describe('GET /api/audit-logs/:logId', () => {
    test('should return specific audit log', async () => {
      const logId = '550e8400-e29b-41d4-a716-446655440000';
      const mockLog = {
        log_id: logId,
        action: 'create',
        resource_type: 'product'
      };

      pool.query.mockResolvedValueOnce({
        rows: [mockLog]
      });

      const response = await request(app)
        .get(`/api/audit-logs/${logId}`)
        .expect(200);

      expect(response.body.log).toBeDefined();
      expect(response.body.log.log_id).toBe(logId);
    });

    test('should reject invalid UUID', async () => {
      const response = await request(app)
        .get('/api/audit-logs/invalid-uuid')
        .expect(400);

      expect(response.body.error).toBe('Invalid parameter');
    });
  });

  describe('GET /api/audit-logs/export', () => {
    test('should export logs as JSON', async () => {
      const mockLogs = [
        { log_id: '1', action: 'create' },
        { log_id: '2', action: 'update' }
      ];

      pool.query.mockResolvedValueOnce({
        rows: mockLogs
      });

      const response = await request(app)
        .get('/api/audit-logs/export')
        .query({ format: 'json' })
        .expect(200);

      expect(response.body.logs).toBeDefined();
      expect(response.body.exported_at).toBeDefined();
    });

    test('should reject invalid export format', async () => {
      const response = await request(app)
        .get('/api/audit-logs/export')
        .query({ format: 'pdf' })
        .expect(400);

      expect(response.body.error).toBe('Invalid format');
    });
  });
});
