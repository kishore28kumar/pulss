const {
  validatePagination,
  validateAuditLogQuery,
  validateExportParams,
  validateAuditConfig,
  validateAlertCreation,
  validateLogId,
  isValidUUID,
  isValidDate
} = require('../../middleware/auditValidation');

describe('Audit Validation Middleware', () => {
  describe('isValidUUID', () => {
    test('should validate correct UUID', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });

    test('should reject invalid UUID', () => {
      expect(isValidUUID('invalid-uuid')).toBe(false);
      expect(isValidUUID('123')).toBe(false);
      expect(isValidUUID('')).toBe(false);
    });
  });

  describe('isValidDate', () => {
    test('should validate correct ISO date', () => {
      expect(isValidDate('2025-01-01T00:00:00Z')).toBe(true);
      expect(isValidDate('2025-10-21')).toBe(true);
    });

    test('should reject invalid date', () => {
      expect(isValidDate('invalid-date')).toBe(false);
      expect(isValidDate('2025-13-01')).toBe(false);
    });
  });

  describe('validatePagination', () => {
    test('should pass with valid pagination', () => {
      const req = { query: { page: '1', limit: '50' } };
      const res = {};
      const next = jest.fn();

      validatePagination(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    test('should reject invalid page number', () => {
      const req = { query: { page: '0' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      validatePagination(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Invalid pagination' })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject limit exceeding maximum', () => {
      const req = { query: { limit: '1001' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      validatePagination(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('validateAuditLogQuery', () => {
    test('should pass with valid query parameters', () => {
      const req = {
        query: {
          action: 'create',
          severity: 'info',
          status: 'success',
          start_date: '2025-01-01T00:00:00Z',
          end_date: '2025-01-31T23:59:59Z'
        }
      };
      const res = {};
      const next = jest.fn();

      validateAuditLogQuery(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    test('should reject invalid UUID', () => {
      const req = {
        query: { admin_id: 'invalid-uuid' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      validateAuditLogQuery(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'admin_id must be a valid UUID' })
      );
    });

    test('should reject invalid date', () => {
      const req = {
        query: { start_date: 'invalid-date' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      validateAuditLogQuery(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should reject invalid date range', () => {
      const req = {
        query: {
          start_date: '2025-01-31T00:00:00Z',
          end_date: '2025-01-01T00:00:00Z'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      validateAuditLogQuery(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Invalid date range' })
      );
    });

    test('should reject invalid action', () => {
      const req = {
        query: { action: 'invalid_action' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      validateAuditLogQuery(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should reject invalid severity', () => {
      const req = {
        query: { severity: 'invalid_severity' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      validateAuditLogQuery(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('validateExportParams', () => {
    test('should pass with valid format', () => {
      const req = { query: { format: 'json' } };
      const res = {};
      const next = jest.fn();

      validateExportParams(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    test('should pass with csv format', () => {
      const req = { query: { format: 'csv' } };
      const res = {};
      const next = jest.fn();

      validateExportParams(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    test('should reject invalid format', () => {
      const req = { query: { format: 'pdf' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      validateExportParams(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('validateAuditConfig', () => {
    const validTenantId = '550e8400-e29b-41d4-a716-446655440000';

    test('should pass with valid configuration', () => {
      const req = {
        body: {
          tenant_id: validTenantId,
          config: {
            enabled: true,
            compliance_mode: 'standard',
            retention_days: 365
          }
        }
      };
      const res = {};
      const next = jest.fn();

      validateAuditConfig(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    test('should reject missing tenant_id', () => {
      const req = {
        body: { config: {} }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      validateAuditConfig(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should reject invalid tenant_id', () => {
      const req = {
        body: {
          tenant_id: 'invalid-uuid',
          config: {}
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      validateAuditConfig(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should reject invalid boolean field', () => {
      const req = {
        body: {
          tenant_id: validTenantId,
          config: { enabled: 'yes' }
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      validateAuditConfig(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should reject invalid retention_days', () => {
      const req = {
        body: {
          tenant_id: validTenantId,
          config: { retention_days: 5000 }
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      validateAuditConfig(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should reject invalid compliance_mode', () => {
      const req = {
        body: {
          tenant_id: validTenantId,
          config: { compliance_mode: 'invalid_mode' }
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      validateAuditConfig(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('validateAlertCreation', () => {
    const validTenantId = '550e8400-e29b-41d4-a716-446655440000';

    test('should pass with valid alert creation', () => {
      const req = {
        body: {
          tenant_id: validTenantId,
          name: 'Test Alert',
          alert_type: 'threshold',
          threshold_count: 5,
          threshold_window_minutes: 60
        }
      };
      const res = {};
      const next = jest.fn();

      validateAlertCreation(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    test('should reject missing tenant_id', () => {
      const req = {
        body: {
          name: 'Test Alert',
          alert_type: 'threshold'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      validateAlertCreation(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should reject invalid name length', () => {
      const req = {
        body: {
          tenant_id: validTenantId,
          name: 'Ab',
          alert_type: 'threshold'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      validateAlertCreation(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should reject invalid alert_type', () => {
      const req = {
        body: {
          tenant_id: validTenantId,
          name: 'Test Alert',
          alert_type: 'invalid_type'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      validateAlertCreation(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should reject threshold alert without threshold_count', () => {
      const req = {
        body: {
          tenant_id: validTenantId,
          name: 'Test Alert',
          alert_type: 'threshold',
          threshold_window_minutes: 60
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      validateAlertCreation(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('validateLogId', () => {
    test('should pass with valid log ID', () => {
      const req = {
        params: { logId: '550e8400-e29b-41d4-a716-446655440000' }
      };
      const res = {};
      const next = jest.fn();

      validateLogId(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    test('should reject invalid log ID', () => {
      const req = {
        params: { logId: 'invalid-uuid' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      validateLogId(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
