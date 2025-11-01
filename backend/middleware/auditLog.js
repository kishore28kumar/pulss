const { pool } = require('../config/db');

/**
 * Audit Logging Middleware
 * Records admin and user actions for security and compliance
 */

/**
 * Create an audit log entry
 * @param {Object} logData - The audit log data
 */
async function createAuditLog(logData) {
  const {
    tenantId,
    adminId,
    adminEmail,
    action,
    resourceType,
    resourceId,
    ipAddress,
    userAgent,
    requestMethod,
    requestPath,
    oldValues,
    newValues,
    description,
    status = 'success',
    errorMessage
  } = logData;

  try {
    const query = `
      INSERT INTO audit_logs (
        tenant_id, admin_id, admin_email, action, resource_type, resource_id,
        ip_address, user_agent, request_method, request_path,
        old_values, new_values, description, status, error_message
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING log_id
    `;

    const values = [
      tenantId || null,
      adminId || null,
      adminEmail || null,
      action,
      resourceType,
      resourceId || null,
      ipAddress || null,
      userAgent || null,
      requestMethod || null,
      requestPath || null,
      oldValues ? JSON.stringify(oldValues) : null,
      newValues ? JSON.stringify(newValues) : null,
      description || null,
      status,
      errorMessage || null
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    // Don't throw error in audit logging - just log it
    console.error('Failed to create audit log:', error);
    return null;
  }
}

/**
 * Middleware to automatically log requests
 * Use this for routes that need automatic audit logging
 */
const auditLog = (action, resourceType) => {
  return async (req, res, next) => {
    // Store original methods
    const originalJson = res.json;
    const originalSend = res.send;

    // Capture response data
    let responseData = null;
    let statusCode = 200;

    // Override res.json
    res.json = function (data) {
      responseData = data;
      statusCode = res.statusCode;
      return originalJson.call(this, data);
    };

    // Override res.send
    res.send = function (data) {
      responseData = data;
      statusCode = res.statusCode;
      return originalSend.call(this, data);
    };

    // Log after response is sent
    res.on('finish', async () => {
      const logData = {
        tenantId: req.user?.tenant_id,
        adminId: req.user?.id,
        adminEmail: req.user?.email,
        action: action,
        resourceType: resourceType,
        resourceId: req.params?.id || req.body?.id || req.query?.id,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        requestMethod: req.method,
        requestPath: req.originalUrl || req.url,
        newValues: req.method !== 'GET' ? req.body : null,
        status: statusCode >= 200 && statusCode < 300 ? 'success' : 'failure',
        errorMessage: statusCode >= 400 ? JSON.stringify(responseData) : null
      };

      await createAuditLog(logData);
    });

    next();
  };
};

/**
 * Manually log an audit entry
 * Use this for custom logging scenarios
 */
const logAudit = async (req, action, resourceType, resourceId, description, oldValues, newValues) => {
  const logData = {
    tenantId: req.user?.tenant_id,
    adminId: req.user?.id,
    adminEmail: req.user?.email,
    action,
    resourceType,
    resourceId,
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    requestMethod: req.method,
    requestPath: req.originalUrl || req.url,
    oldValues,
    newValues,
    description,
    status: 'success'
  };

  return await createAuditLog(logData);
};

/**
 * Log authentication events
 */
const logAuth = async (req, action, email, status, errorMessage = null) => {
  const logData = {
    tenantId: null, // Auth events may not have tenant context
    adminId: req.user?.id || null,
    adminEmail: email,
    action,
    resourceType: 'authentication',
    resourceId: null,
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    requestMethod: req.method,
    requestPath: req.originalUrl || req.url,
    description: `${action} attempt for ${email}`,
    status,
    errorMessage
  };

  return await createAuditLog(logData);
};

module.exports = {
  createAuditLog,
  auditLog,
  logAudit,
  logAuth
};
