/**
 * Input validation middleware for audit log endpoints
 * Protects against SQL injection and validates input data
 */

/**
 * Validate UUID format
 */
function isValidUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate date format (ISO 8601)
 */
function isValidDate(dateString) {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Sanitize string input
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  // Remove any potential SQL injection patterns
  return str.replace(/['";\\]/g, '');
}

/**
 * Validate pagination parameters
 */
const validatePagination = (req, res, next) => {
  const { page, limit } = req.query;

  if (page && (isNaN(page) || parseInt(page) < 1)) {
    return res.status(400).json({ 
      error: 'Invalid pagination',
      message: 'Page number must be a positive integer' 
    });
  }

  if (limit && (isNaN(limit) || parseInt(limit) < 1 || parseInt(limit) > 1000)) {
    return res.status(400).json({ 
      error: 'Invalid pagination',
      message: 'Limit must be between 1 and 1000' 
    });
  }

  next();
};

/**
 * Validate audit log query parameters
 */
const validateAuditLogQuery = (req, res, next) => {
  const { 
    action, 
    resource_type, 
    admin_id, 
    tenant_id,
    start_date, 
    end_date,
    event,
    severity,
    status,
    compliance_tag,
    region
  } = req.query;

  // Validate UUIDs
  if (admin_id && !isValidUUID(admin_id)) {
    return res.status(400).json({ 
      error: 'Invalid parameter',
      message: 'admin_id must be a valid UUID' 
    });
  }

  if (tenant_id && !isValidUUID(tenant_id)) {
    return res.status(400).json({ 
      error: 'Invalid parameter',
      message: 'tenant_id must be a valid UUID' 
    });
  }

  // Validate dates
  if (start_date && !isValidDate(start_date)) {
    return res.status(400).json({ 
      error: 'Invalid parameter',
      message: 'start_date must be a valid ISO 8601 date' 
    });
  }

  if (end_date && !isValidDate(end_date)) {
    return res.status(400).json({ 
      error: 'Invalid parameter',
      message: 'end_date must be a valid ISO 8601 date' 
    });
  }

  // Validate date range
  if (start_date && end_date) {
    const start = new Date(start_date);
    const end = new Date(end_date);
    if (start > end) {
      return res.status(400).json({ 
        error: 'Invalid date range',
        message: 'start_date must be before end_date' 
      });
    }
  }

  // Validate enum values
  const validActions = ['create', 'read', 'update', 'delete', 'login', 'logout', 'export', 
                       'GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
  if (action && !validActions.includes(action)) {
    return res.status(400).json({ 
      error: 'Invalid parameter',
      message: `action must be one of: ${validActions.join(', ')}` 
    });
  }

  const validSeverities = ['info', 'warning', 'high', 'critical'];
  if (severity && !validSeverities.includes(severity)) {
    return res.status(400).json({ 
      error: 'Invalid parameter',
      message: `severity must be one of: ${validSeverities.join(', ')}` 
    });
  }

  const validStatuses = ['success', 'failure', 'error'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ 
      error: 'Invalid parameter',
      message: `status must be one of: ${validStatuses.join(', ')}` 
    });
  }

  // Validate string lengths (check type first to prevent type confusion)
  if (resource_type) {
    if (typeof resource_type !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid parameter',
        message: 'resource_type must be a string' 
      });
    }
    if (resource_type.length > 100) {
      return res.status(400).json({ 
        error: 'Invalid parameter',
        message: 'resource_type must be less than 100 characters' 
      });
    }
  }

  if (event) {
    if (typeof event !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid parameter',
        message: 'event must be a string' 
      });
    }
    if (event.length > 100) {
      return res.status(400).json({ 
        error: 'Invalid parameter',
        message: 'event must be less than 100 characters' 
      });
    }
  }

  if (compliance_tag) {
    if (typeof compliance_tag !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid parameter',
        message: 'compliance_tag must be a string' 
      });
    }
    if (compliance_tag.length > 50) {
      return res.status(400).json({ 
        error: 'Invalid parameter',
        message: 'compliance_tag must be less than 50 characters' 
      });
    }
  }

  if (region) {
    if (typeof region !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid parameter',
        message: 'region must be a string' 
      });
    }
    if (region.length > 50) {
      return res.status(400).json({ 
        error: 'Invalid parameter',
        message: 'region must be less than 50 characters' 
      });
    }
  }

  next();
};

/**
 * Validate export parameters
 */
const validateExportParams = (req, res, next) => {
  const { format } = req.query;

  const validFormats = ['json', 'csv'];
  if (format && !validFormats.includes(format)) {
    return res.status(400).json({ 
      error: 'Invalid format',
      message: `format must be one of: ${validFormats.join(', ')}` 
    });
  }

  next();
};

/**
 * Validate audit configuration update
 */
const validateAuditConfig = (req, res, next) => {
  const { tenant_id, config } = req.body;

  if (!tenant_id) {
    return res.status(400).json({ 
      error: 'Missing required field',
      message: 'tenant_id is required' 
    });
  }

  if (!isValidUUID(tenant_id)) {
    return res.status(400).json({ 
      error: 'Invalid parameter',
      message: 'tenant_id must be a valid UUID' 
    });
  }

  if (!config || typeof config !== 'object') {
    return res.status(400).json({ 
      error: 'Invalid parameter',
      message: 'config must be an object' 
    });
  }

  // Validate boolean fields
  const booleanFields = [
    'enabled', 'api_logging_enabled', 'billing_logging_enabled',
    'notification_logging_enabled', 'rbac_logging_enabled',
    'branding_logging_enabled', 'subscription_logging_enabled',
    'developer_portal_logging_enabled', 'auto_tagging_enabled',
    'auto_archive_enabled', 'export_enabled', 'alerting_enabled',
    'alert_on_failures', 'region_restricted'
  ];

  for (const field of booleanFields) {
    if (config[field] !== undefined && typeof config[field] !== 'boolean') {
      return res.status(400).json({ 
        error: 'Invalid parameter',
        message: `${field} must be a boolean` 
      });
    }
  }

  // Validate numeric fields
  const numericFields = {
    retention_days: { min: 1, max: 3650 },
    archive_after_days: { min: 1, max: 365 },
    alert_threshold: { min: 1, max: 1000 }
  };

  for (const [field, bounds] of Object.entries(numericFields)) {
    if (config[field] !== undefined) {
      const value = parseInt(config[field]);
      if (isNaN(value) || value < bounds.min || value > bounds.max) {
        return res.status(400).json({ 
          error: 'Invalid parameter',
          message: `${field} must be between ${bounds.min} and ${bounds.max}` 
        });
      }
    }
  }

  // Validate compliance_mode
  if (config.compliance_mode) {
    const validModes = ['minimal', 'standard', 'strict'];
    if (!validModes.includes(config.compliance_mode)) {
      return res.status(400).json({ 
        error: 'Invalid parameter',
        message: `compliance_mode must be one of: ${validModes.join(', ')}` 
      });
    }
  }

  // Validate arrays
  if (config.export_formats && !Array.isArray(config.export_formats)) {
    return res.status(400).json({ 
      error: 'Invalid parameter',
      message: 'export_formats must be an array' 
    });
  }

  if (config.allowed_regions && !Array.isArray(config.allowed_regions)) {
    return res.status(400).json({ 
      error: 'Invalid parameter',
      message: 'allowed_regions must be an array' 
    });
  }

  next();
};

/**
 * Validate alert creation
 */
const validateAlertCreation = (req, res, next) => {
  const {
    tenant_id,
    name,
    alert_type,
    event_patterns,
    severity_levels,
    threshold_count,
    threshold_window_minutes,
    notification_channels
  } = req.body;

  // Required fields
  if (!tenant_id) {
    return res.status(400).json({ 
      error: 'Missing required field',
      message: 'tenant_id is required' 
    });
  }

  if (!name || name.length < 3 || name.length > 100) {
    return res.status(400).json({ 
      error: 'Invalid parameter',
      message: 'name must be between 3 and 100 characters' 
    });
  }

  if (!alert_type) {
    return res.status(400).json({ 
      error: 'Missing required field',
      message: 'alert_type is required' 
    });
  }

  // Validate UUID
  if (!isValidUUID(tenant_id)) {
    return res.status(400).json({ 
      error: 'Invalid parameter',
      message: 'tenant_id must be a valid UUID' 
    });
  }

  // Validate alert_type
  const validAlertTypes = ['threshold', 'pattern', 'anomaly', 'compliance'];
  if (!validAlertTypes.includes(alert_type)) {
    return res.status(400).json({ 
      error: 'Invalid parameter',
      message: `alert_type must be one of: ${validAlertTypes.join(', ')}` 
    });
  }

  // Validate arrays
  if (event_patterns && !Array.isArray(event_patterns)) {
    return res.status(400).json({ 
      error: 'Invalid parameter',
      message: 'event_patterns must be an array' 
    });
  }

  if (severity_levels && !Array.isArray(severity_levels)) {
    return res.status(400).json({ 
      error: 'Invalid parameter',
      message: 'severity_levels must be an array' 
    });
  }

  if (notification_channels && !Array.isArray(notification_channels)) {
    return res.status(400).json({ 
      error: 'Invalid parameter',
      message: 'notification_channels must be an array' 
    });
  }

  // Validate threshold parameters for threshold alerts
  if (alert_type === 'threshold') {
    if (!threshold_count || threshold_count < 1 || threshold_count > 10000) {
      return res.status(400).json({ 
        error: 'Invalid parameter',
        message: 'threshold_count must be between 1 and 10000 for threshold alerts' 
      });
    }

    if (!threshold_window_minutes || threshold_window_minutes < 1 || threshold_window_minutes > 1440) {
      return res.status(400).json({ 
        error: 'Invalid parameter',
        message: 'threshold_window_minutes must be between 1 and 1440 (24 hours) for threshold alerts' 
      });
    }
  }

  next();
};

/**
 * Validate log ID parameter
 */
const validateLogId = (req, res, next) => {
  const { logId } = req.params;

  if (!logId || !isValidUUID(logId)) {
    return res.status(400).json({ 
      error: 'Invalid parameter',
      message: 'logId must be a valid UUID' 
    });
  }

  next();
};

module.exports = {
  validatePagination,
  validateAuditLogQuery,
  validateExportParams,
  validateAuditConfig,
  validateAlertCreation,
  validateLogId,
  sanitizeString,
  isValidUUID,
  isValidDate
};
