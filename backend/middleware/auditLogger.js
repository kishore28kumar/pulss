const { logAuditEvent } = require('../services/auditService');

/**
 * Middleware to automatically log API requests for audit
 */
const auditLoggerMiddleware = (options = {}) => {
  const {
    action = 'api_request',
    resourceType = 'api',
    captureBody = false,
    captureResponse = false
  } = options;

  return async (req, res, next) => {
    // Skip audit logging for certain paths
    const skipPaths = ['/health', '/api/health', '/favicon.ico'];
    if (skipPaths.includes(req.path)) {
      return next();
    }

    // Capture request start time
    req.auditStartTime = Date.now();

    // Store original json method to capture response
    const originalJson = res.json;
    let responseBody = null;

    if (captureResponse) {
      res.json = function (body) {
        responseBody = body;
        return originalJson.call(this, body);
      };
    }

    // Log after response is sent
    res.on('finish', async () => {
      try {
        // Check if audit logging is enabled for this tenant
        const tenantId = req.user?.tenant_id || req.body?.tenant_id || req.query?.tenant_id;
        if (!tenantId) {
          return; // Skip if no tenant context
        }

        // Determine event name from route
        const event = generateEventName(req.method, req.path, req.baseUrl);

        // Determine severity based on status code
        let severity = 'info';
        if (res.statusCode >= 500) {
          severity = 'critical';
        } else if (res.statusCode >= 400) {
          severity = 'warning';
        }

        const metadata = {
          duration_ms: Date.now() - req.auditStartTime,
          status_code: res.statusCode,
          request_size: req.get('content-length'),
          response_size: res.get('content-length')
        };

        if (captureBody && req.body) {
          // Sanitize sensitive data
          metadata.request_body = sanitizeData(req.body);
        }

        if (captureResponse && responseBody) {
          metadata.response_body = sanitizeData(responseBody);
        }

        // Log the audit event
        await logAuditEvent({
          tenantId,
          partnerId: req.user?.partner_id || null,
          adminId: req.user?.admin_id || req.user?.id,
          adminEmail: req.user?.email,
          action: req.method,
          resourceType,
          resourceId: req.params?.id || null,
          event,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('user-agent'),
          requestMethod: req.method,
          requestPath: req.originalUrl || req.url,
          description: `${req.method} ${req.path}`,
          status: res.statusCode >= 400 ? 'failure' : 'success',
          errorMessage: res.statusCode >= 400 ? responseBody?.error || responseBody?.message : null,
          severity,
          metadata,
          region: req.get('x-region') || process.env.REGION || 'global'
        });
      } catch (error) {
        console.error('Audit logging middleware error:', error);
        // Don't throw - audit failures shouldn't break requests
      }
    });

    next();
  };
};

/**
 * Generate structured event name from request
 */
function generateEventName(method, path, baseUrl) {
  const fullPath = (baseUrl || '') + path;
  
  // API endpoints
  if (fullPath.includes('/api/products')) return 'product.api';
  if (fullPath.includes('/api/orders')) return 'order.api';
  if (fullPath.includes('/api/customers')) return 'customer.api';
  if (fullPath.includes('/api/billing')) return 'billing.api';
  if (fullPath.includes('/api/notifications')) return 'notification.api';
  if (fullPath.includes('/api/auth')) return 'auth.api';
  if (fullPath.includes('/api/tenants')) return 'tenant.api';
  if (fullPath.includes('/api/admin')) return 'admin.api';
  if (fullPath.includes('/api/audit')) return 'audit.api';
  
  // Generic API event
  return 'api.request';
}

/**
 * Sanitize sensitive data from logs
 * Redacts passwords, tokens, payment info, and PII
 */
function sanitizeData(data) {
  if (!data || typeof data !== 'object') {
    return data;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }

  const sanitized = {};
  
  // Extended list of sensitive fields
  const sensitiveFields = [
    // Authentication & Security
    'password', 'password_hash', 'passwordHash', 'oldPassword', 'newPassword',
    'confirmPassword', 'token', 'accessToken', 'refreshToken', 'access_token',
    'refresh_token', 'secret', 'api_key', 'apiKey', 'privateKey', 'private_key',
    'jwt', 'bearer', 'authorization', 'auth',
    
    // Payment & Financial
    'credit_card', 'creditCard', 'card_number', 'cardNumber', 'cvv', 'cvc',
    'expiry', 'expiry_date', 'expiryDate', 'account_number', 'accountNumber',
    'routing_number', 'routingNumber', 'iban', 'swift', 'bic',
    'payment_token', 'paymentToken', 'stripe_token', 'stripeToken',
    
    // Personal Identifiable Information (PII)
    'ssn', 'social_security', 'socialSecurity', 'sin', 'national_id',
    'nationalId', 'passport', 'passport_number', 'passportNumber',
    'drivers_license', 'driversLicense', 'license_number', 'licenseNumber',
    
    // Healthcare (HIPAA)
    'medical_record', 'medicalRecord', 'health_card', 'healthCard',
    'insurance_number', 'insuranceNumber', 'patient_id', 'patientId',
    
    // Other sensitive data
    'pin', 'otp', 'verification_code', 'verificationCode', 'security_answer',
    'securityAnswer', 'recovery_key', 'recoveryKey', 'backup_codes', 'backupCodes'
  ];

  // Patterns to detect sensitive data
  const sensitivePatterns = [
    /password/i,
    /token/i,
    /secret/i,
    /key/i,
    /cvv/i,
    /ssn/i,
    /credit[_-]?card/i,
    /card[_-]?number/i
  ];

  for (const [key, value] of Object.entries(data)) {
    // Check if field name is in sensitive list
    const isSensitiveField = sensitiveFields.includes(key.toLowerCase());
    
    // Check if field name matches sensitive pattern
    const matchesPattern = sensitivePatterns.some(pattern => pattern.test(key));
    
    if (isSensitiveField || matchesPattern) {
      // Redact sensitive data
      if (value !== null && value !== undefined) {
        if (typeof value === 'string' && value.length > 0) {
          // Show first 2 and last 2 characters for non-empty strings
          if (value.length > 8) {
            sanitized[key] = `${value.substring(0, 2)}***${value.substring(value.length - 2)}`;
          } else {
            sanitized[key] = '[REDACTED]';
          }
        } else {
          sanitized[key] = '[REDACTED]';
        }
      } else {
        sanitized[key] = value;
      }
    } else if (typeof value === 'object' && value !== null) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeData(value);
    } else {
      // Keep non-sensitive data as is
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Specialized audit logger for specific actions
 */
const auditAction = async (req, action, resourceType, resourceId, options = {}) => {
  try {
    const tenantId = req.user?.tenant_id || options.tenantId;
    if (!tenantId) {
      return;
    }

    await logAuditEvent({
      tenantId,
      partnerId: req.user?.partner_id || options.partnerId || null,
      adminId: req.user?.admin_id || req.user?.id,
      adminEmail: req.user?.email,
      action,
      resourceType,
      resourceId,
      event: options.event || `${resourceType}.${action}`,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      requestMethod: req.method,
      requestPath: req.originalUrl || req.url,
      oldValues: options.oldValues || null,
      newValues: options.newValues || null,
      description: options.description || `${action} ${resourceType}`,
      status: options.status || 'success',
      errorMessage: options.errorMessage || null,
      severity: options.severity || 'info',
      metadata: options.metadata || {},
      region: req.get('x-region') || process.env.REGION || 'global'
    });
  } catch (error) {
    console.error('Audit action logging error:', error);
  }
};

/**
 * Audit logger for authentication events
 */
const auditAuth = async (req, action, status, userId, email, metadata = {}) => {
  try {
    const tenantId = req.body?.tenant_id || req.query?.tenant_id || metadata.tenantId;

    await logAuditEvent({
      tenantId,
      partnerId: metadata.partnerId || null,
      adminId: userId,
      adminEmail: email,
      action,
      resourceType: 'auth',
      resourceId: userId,
      event: `auth.${action}`,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      requestMethod: req.method,
      requestPath: req.originalUrl || req.url,
      description: `Authentication: ${action}`,
      status,
      errorMessage: metadata.errorMessage || null,
      severity: status === 'success' ? 'info' : 'warning',
      metadata,
      region: req.get('x-region') || process.env.REGION || 'global'
    });
  } catch (error) {
    console.error('Auth audit logging error:', error);
  }
};

/**
 * Audit logger for billing events
 */
const auditBilling = async (tenantId, action, amount, metadata = {}) => {
  try {
    await logAuditEvent({
      tenantId,
      partnerId: metadata.partnerId || null,
      adminId: metadata.adminId || null,
      adminEmail: metadata.adminEmail || null,
      action,
      resourceType: 'billing',
      resourceId: metadata.billingId || null,
      event: `billing.${action}`,
      ipAddress: metadata.ipAddress || null,
      userAgent: metadata.userAgent || null,
      requestMethod: 'INTERNAL',
      requestPath: '/billing',
      description: `Billing: ${action} - Amount: ${amount}`,
      status: metadata.status || 'success',
      errorMessage: metadata.errorMessage || null,
      severity: metadata.severity || 'info',
      metadata: {
        ...metadata,
        amount,
        currency: metadata.currency || 'INR'
      },
      region: metadata.region || 'global'
    });
  } catch (error) {
    console.error('Billing audit logging error:', error);
  }
};

/**
 * Audit logger for RBAC changes
 */
const auditRBAC = async (req, action, targetUserId, oldRole, newRole) => {
  try {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) return;

    await logAuditEvent({
      tenantId,
      partnerId: req.user?.partner_id || null,
      adminId: req.user?.admin_id || req.user?.id,
      adminEmail: req.user?.email,
      action,
      resourceType: 'rbac',
      resourceId: targetUserId,
      event: `rbac.${action}`,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      requestMethod: req.method,
      requestPath: req.originalUrl || req.url,
      oldValues: { role: oldRole },
      newValues: { role: newRole },
      description: `RBAC: Changed role from ${oldRole} to ${newRole}`,
      status: 'success',
      severity: 'high',
      metadata: {
        target_user_id: targetUserId,
        old_role: oldRole,
        new_role: newRole
      },
      region: req.get('x-region') || process.env.REGION || 'global'
    });
  } catch (error) {
    console.error('RBAC audit logging error:', error);
  }
};

/**
 * Audit logger for notification events
 */
const auditNotification = async (tenantId, notificationType, recipientId, metadata = {}) => {
  try {
    await logAuditEvent({
      tenantId,
      partnerId: metadata.partnerId || null,
      adminId: metadata.adminId || null,
      adminEmail: metadata.adminEmail || null,
      action: 'send',
      resourceType: 'notification',
      resourceId: recipientId,
      event: `notification.${notificationType}`,
      ipAddress: null,
      userAgent: null,
      requestMethod: 'INTERNAL',
      requestPath: '/notifications',
      description: `Notification sent: ${notificationType}`,
      status: metadata.status || 'success',
      errorMessage: metadata.errorMessage || null,
      severity: 'info',
      metadata: {
        ...metadata,
        notification_type: notificationType,
        recipient_id: recipientId
      },
      region: metadata.region || 'global'
    });
  } catch (error) {
    console.error('Notification audit logging error:', error);
  }
};

/**
 * Audit logger for subscription events
 */
const auditSubscription = async (tenantId, action, subscriptionId, metadata = {}) => {
  try {
    await logAuditEvent({
      tenantId,
      partnerId: metadata.partnerId || null,
      adminId: metadata.adminId || null,
      adminEmail: metadata.adminEmail || null,
      action,
      resourceType: 'subscription',
      resourceId: subscriptionId,
      event: `subscription.${action}`,
      ipAddress: metadata.ipAddress || null,
      userAgent: metadata.userAgent || null,
      requestMethod: metadata.method || 'INTERNAL',
      requestPath: '/subscriptions',
      oldValues: metadata.oldValues || null,
      newValues: metadata.newValues || null,
      description: `Subscription: ${action}`,
      status: metadata.status || 'success',
      errorMessage: metadata.errorMessage || null,
      severity: metadata.severity || 'info',
      metadata,
      region: metadata.region || 'global'
    });
  } catch (error) {
    console.error('Subscription audit logging error:', error);
  }
};

/**
 * Audit logger for branding changes
 */
const auditBranding = async (req, action, resourceId, oldValues, newValues) => {
  try {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) return;

    await logAuditEvent({
      tenantId,
      partnerId: req.user?.partner_id || null,
      adminId: req.user?.admin_id || req.user?.id,
      adminEmail: req.user?.email,
      action,
      resourceType: 'branding',
      resourceId,
      event: `branding.${action}`,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      requestMethod: req.method,
      requestPath: req.originalUrl || req.url,
      oldValues,
      newValues,
      description: `Branding: ${action}`,
      status: 'success',
      severity: 'info',
      metadata: {
        resource_id: resourceId
      },
      region: req.get('x-region') || process.env.REGION || 'global'
    });
  } catch (error) {
    console.error('Branding audit logging error:', error);
  }
};

module.exports = {
  auditLoggerMiddleware,
  auditAction,
  auditAuth,
  auditBilling,
  auditRBAC,
  auditNotification,
  auditSubscription,
  auditBranding
};
