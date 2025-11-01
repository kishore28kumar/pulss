const { pool } = require('../config/db');
const { 
  getAuditLogs: getAuditLogsService, 
  generateComplianceReport, 
  exportAuditLogs: exportAuditLogsService 
} = require('../services/auditService');

/**
 * Audit Logs Controller
 * Provides endpoints for viewing audit logs with advanced compliance features
 */

/**
 * Get audit logs with filtering and pagination
 */
const getAuditLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      action,
      resource_type,
      admin_id,
      start_date,
      end_date,
      status
    } = req.query;

    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        log_id,
        tenant_id,
        admin_id,
        admin_email,
        action,
        resource_type,
        resource_id,
        ip_address,
        user_agent,
        request_method,
        request_path,
        description,
        status,
        error_message,
        created_at
      FROM audit_logs
      WHERE 1=1
    `;

    const values = [];
    let paramCount = 1;

    // Filter by tenant for admins (not super admins)
    if (req.user.role === 'admin') {
      query += ` AND tenant_id = $${paramCount}`;
      values.push(req.user.tenant_id);
      paramCount++;
    }

    if (action) {
      query += ` AND action = $${paramCount}`;
      values.push(action);
      paramCount++;
    }

    if (resource_type) {
      query += ` AND resource_type = $${paramCount}`;
      values.push(resource_type);
      paramCount++;
    }

    if (admin_id) {
      query += ` AND admin_id = $${paramCount}`;
      values.push(admin_id);
      paramCount++;
    }

    if (status) {
      query += ` AND status = $${paramCount}`;
      values.push(status);
      paramCount++;
    }

    if (start_date) {
      query += ` AND created_at >= $${paramCount}`;
      values.push(start_date);
      paramCount++;
    }

    if (end_date) {
      query += ` AND created_at <= $${paramCount}`;
      values.push(end_date);
      paramCount++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM audit_logs WHERE 1=1';
    const countValues = [];
    let countParamCount = 1;

    if (req.user.role === 'admin') {
      countQuery += ` AND tenant_id = $${countParamCount}`;
      countValues.push(req.user.tenant_id);
      countParamCount++;
    }

    if (action) {
      countQuery += ` AND action = $${countParamCount}`;
      countValues.push(action);
      countParamCount++;
    }

    if (resource_type) {
      countQuery += ` AND resource_type = $${countParamCount}`;
      countValues.push(resource_type);
      countParamCount++;
    }

    if (admin_id) {
      countQuery += ` AND admin_id = $${countParamCount}`;
      countValues.push(admin_id);
      countParamCount++;
    }

    if (status) {
      countQuery += ` AND status = $${countParamCount}`;
      countValues.push(status);
      countParamCount++;
    }

    if (start_date) {
      countQuery += ` AND created_at >= $${countParamCount}`;
      countValues.push(start_date);
      countParamCount++;
    }

    if (end_date) {
      countQuery += ` AND created_at <= $${countParamCount}`;
      countValues.push(end_date);
    }

    const countResult = await pool.query(countQuery, countValues);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      logs: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Failed to retrieve audit logs' });
  }
};

/**
 * Get a specific audit log entry
 */
const getAuditLogById = async (req, res) => {
  try {
    const { logId } = req.params;

    let query = `
      SELECT * FROM audit_logs
      WHERE log_id = $1
    `;

    const values = [logId];

    // Filter by tenant for admins (not super admins)
    if (req.user.role === 'admin') {
      query += ' AND tenant_id = $2';
      values.push(req.user.tenant_id);
    }

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Audit log not found' });
    }

    res.json({ log: result.rows[0] });
  } catch (error) {
    console.error('Get audit log by ID error:', error);
    res.status(500).json({ error: 'Failed to retrieve audit log' });
  }
};

/**
 * Get audit log statistics
 */
const getAuditLogStats = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let baseQuery = 'FROM audit_logs WHERE 1=1';
    const values = [];
    let paramCount = 1;

    // Filter by tenant for admins (not super admins)
    if (req.user.role === 'admin') {
      baseQuery += ` AND tenant_id = $${paramCount}`;
      values.push(req.user.tenant_id);
      paramCount++;
    }

    if (start_date) {
      baseQuery += ` AND created_at >= $${paramCount}`;
      values.push(start_date);
      paramCount++;
    }

    if (end_date) {
      baseQuery += ` AND created_at <= $${paramCount}`;
      values.push(end_date);
      paramCount++;
    }

    // Total logs
    const totalQuery = `SELECT COUNT(*) as total ${baseQuery}`;
    const totalResult = await pool.query(totalQuery, values);

    // Logs by action
    const actionQuery = `
      SELECT action, COUNT(*) as count 
      ${baseQuery}
      GROUP BY action
      ORDER BY count DESC
    `;
    const actionResult = await pool.query(actionQuery, values);

    // Logs by resource type
    const resourceQuery = `
      SELECT resource_type, COUNT(*) as count 
      ${baseQuery}
      GROUP BY resource_type
      ORDER BY count DESC
    `;
    const resourceResult = await pool.query(resourceQuery, values);

    // Logs by status
    const statusQuery = `
      SELECT status, COUNT(*) as count 
      ${baseQuery}
      GROUP BY status
    `;
    const statusResult = await pool.query(statusQuery, values);

    // Most active admins
    const adminQuery = `
      SELECT admin_email, COUNT(*) as count 
      ${baseQuery} AND admin_email IS NOT NULL
      GROUP BY admin_email
      ORDER BY count DESC
      LIMIT 10
    `;
    const adminResult = await pool.query(adminQuery, values);

    res.json({
      total: parseInt(totalResult.rows[0].total),
      by_action: actionResult.rows,
      by_resource_type: resourceResult.rows,
      by_status: statusResult.rows,
      most_active_admins: adminResult.rows
    });
  } catch (error) {
    console.error('Get audit log stats error:', error);
    res.status(500).json({ error: 'Failed to retrieve audit log statistics' });
  }
};

/**
 * Export audit logs as JSON
 */
const exportAuditLogs = async (req, res) => {
  try {
    const { start_date, end_date, format = 'json' } = req.query;

    let query = `
      SELECT * FROM audit_logs
      WHERE 1=1
    `;

    const values = [];
    let paramCount = 1;

    // Filter by tenant for admins (not super admins)
    if (req.user.role === 'admin') {
      query += ` AND tenant_id = $${paramCount}`;
      values.push(req.user.tenant_id);
      paramCount++;
    }

    if (start_date) {
      query += ` AND created_at >= $${paramCount}`;
      values.push(start_date);
      paramCount++;
    }

    if (end_date) {
      query += ` AND created_at <= $${paramCount}`;
      values.push(end_date);
      paramCount++;
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, values);

    if (format === 'csv') {
      // Convert to CSV
      const csv = convertToCSV(result.rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
      res.send(csv);
    } else {
      // Default to JSON
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.json');
      res.json({ logs: result.rows, exported_at: new Date().toISOString() });
    }
  } catch (error) {
    console.error('Export audit logs error:', error);
    res.status(500).json({ error: 'Failed to export audit logs' });
  }
};

/**
 * Helper function to convert JSON to CSV
 */
function convertToCSV(data) {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvRows = [];

  // Add header row
  csvRows.push(headers.join(','));

  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value).replace(/"/g, '""');
      return `"${String(value).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

/**
 * Get audit configuration for tenant
 */
const getAuditConfig = async (req, res) => {
  try {
    const { tenant_id } = req.query;
    
    // Super admins can view any tenant, admins only their own
    const tenantId = req.user.role === 'super_admin' ? tenant_id : req.user.tenant_id;
    
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    const result = await pool.query(
      'SELECT * FROM audit_config WHERE tenant_id = $1',
      [tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Audit configuration not found' });
    }

    res.json({ config: result.rows[0] });
  } catch (error) {
    console.error('Get audit config error:', error);
    res.status(500).json({ error: 'Failed to retrieve audit configuration' });
  }
};

/**
 * Update audit configuration (Super Admin only)
 */
const updateAuditConfig = async (req, res) => {
  try {
    const { tenant_id, config } = req.body;

    if (!tenant_id) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    // Build update query dynamically based on provided fields
    const allowedFields = [
      'enabled', 'api_logging_enabled', 'billing_logging_enabled',
      'notification_logging_enabled', 'rbac_logging_enabled',
      'branding_logging_enabled', 'subscription_logging_enabled',
      'developer_portal_logging_enabled', 'compliance_mode',
      'auto_tagging_enabled', 'retention_days', 'auto_archive_enabled',
      'archive_after_days', 'export_enabled', 'export_formats',
      'alerting_enabled', 'alert_on_failures', 'alert_threshold',
      'region', 'region_restricted', 'allowed_regions'
    ];

    const updates = [];
    const values = [tenant_id];
    let paramCount = 2;

    for (const [key, value] of Object.entries(config)) {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updates.push(`updated_at = NOW()`);

    const query = `
      UPDATE audit_config
      SET ${updates.join(', ')}
      WHERE tenant_id = $1
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Audit configuration not found' });
    }

    res.json({ 
      message: 'Audit configuration updated successfully',
      config: result.rows[0]
    });
  } catch (error) {
    console.error('Update audit config error:', error);
    res.status(500).json({ error: 'Failed to update audit configuration' });
  }
};

/**
 * Get compliance templates
 */
const getComplianceTemplates = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM compliance_templates WHERE is_active = true ORDER BY name'
    );

    res.json({ templates: result.rows });
  } catch (error) {
    console.error('Get compliance templates error:', error);
    res.status(500).json({ error: 'Failed to retrieve compliance templates' });
  }
};

/**
 * Generate compliance report
 */
const getComplianceReport = async (req, res) => {
  try {
    const { tenant_id, report_type, start_date, end_date } = req.query;

    // Super admins can view any tenant, admins only their own
    const tenantId = req.user.role === 'super_admin' ? tenant_id : req.user.tenant_id;

    if (!tenantId || !start_date || !end_date) {
      return res.status(400).json({ error: 'Tenant ID, start_date, and end_date required' });
    }

    const report = await generateComplianceReport(
      tenantId,
      report_type || 'standard',
      start_date,
      end_date
    );

    res.json({ report });
  } catch (error) {
    console.error('Get compliance report error:', error);
    res.status(500).json({ error: 'Failed to generate compliance report' });
  }
};

/**
 * Export audit logs (enhanced)
 */
const exportAuditLogsEnhanced = async (req, res) => {
  try {
    const { format = 'json', ...filters } = req.query;

    // Super admins can export any tenant, admins only their own
    if (req.user.role !== 'super_admin') {
      filters.tenantId = req.user.tenant_id;
    }

    const exportData = await exportAuditLogsService(
      filters.tenantId || filters.tenant_id,
      req.user.admin_id || req.user.id,
      req.user.email,
      filters,
      format
    );

    if (format === 'csv') {
      const csv = convertToCSV(exportData.logs);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${Date.now()}.csv`);
      res.send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${Date.now()}.json`);
      res.json({
        export_id: exportData.exportId,
        logs: exportData.logs,
        exported_at: new Date().toISOString(),
        exported_by: req.user.email,
        filters
      });
    }
  } catch (error) {
    console.error('Export audit logs error:', error);
    res.status(500).json({ error: 'Failed to export audit logs' });
  }
};

/**
 * Get retention policies
 */
const getRetentionPolicies = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM audit_retention_policies WHERE is_active = true ORDER BY priority DESC'
    );

    res.json({ policies: result.rows });
  } catch (error) {
    console.error('Get retention policies error:', error);
    res.status(500).json({ error: 'Failed to retrieve retention policies' });
  }
};

/**
 * Get audit alerts
 */
const getAuditAlerts = async (req, res) => {
  try {
    const { tenant_id } = req.query;

    // Super admins can view any tenant, admins only their own
    const tenantId = req.user.role === 'super_admin' ? tenant_id : req.user.tenant_id;

    let query = 'SELECT * FROM audit_alerts WHERE 1=1';
    const values = [];

    if (tenantId) {
      query += ' AND tenant_id = $1';
      values.push(tenantId);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, values);

    res.json({ alerts: result.rows });
  } catch (error) {
    console.error('Get audit alerts error:', error);
    res.status(500).json({ error: 'Failed to retrieve audit alerts' });
  }
};

/**
 * Create audit alert (Super Admin only)
 */
const createAuditAlert = async (req, res) => {
  try {
    const {
      tenant_id,
      name,
      description,
      alert_type,
      event_patterns,
      severity_levels,
      threshold_count,
      threshold_window_minutes,
      notification_channels,
      notification_emails,
      webhook_url
    } = req.body;

    if (!tenant_id || !name || !alert_type) {
      return res.status(400).json({ error: 'Tenant ID, name, and alert_type required' });
    }

    const result = await pool.query(
      `INSERT INTO audit_alerts (
        tenant_id, name, description, alert_type, event_patterns,
        severity_levels, threshold_count, threshold_window_minutes,
        notification_channels, notification_emails, webhook_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        tenant_id, name, description, alert_type, event_patterns,
        severity_levels, threshold_count, threshold_window_minutes,
        notification_channels, notification_emails, webhook_url
      ]
    );

    res.status(201).json({
      message: 'Audit alert created successfully',
      alert: result.rows[0]
    });
  } catch (error) {
    console.error('Create audit alert error:', error);
    res.status(500).json({ error: 'Failed to create audit alert' });
  }
};

/**
 * Get export history
 */
const getExportHistory = async (req, res) => {
  try {
    const { tenant_id } = req.query;

    // Super admins can view any tenant, admins only their own
    const tenantId = req.user.role === 'super_admin' ? tenant_id : req.user.tenant_id;

    let query = 'SELECT * FROM audit_export_history WHERE 1=1';
    const values = [];

    if (tenantId) {
      query += ' AND tenant_id = $1';
      values.push(tenantId);
    }

    query += ' ORDER BY created_at DESC LIMIT 50';

    const result = await pool.query(query, values);

    res.json({ exports: result.rows });
  } catch (error) {
    console.error('Get export history error:', error);
    res.status(500).json({ error: 'Failed to retrieve export history' });
  }
};

module.exports = {
  getAuditLogs,
  getAuditLogById,
  getAuditLogStats,
  exportAuditLogs,
  getAuditConfig,
  updateAuditConfig,
  getComplianceTemplates,
  getComplianceReport,
  exportAuditLogsEnhanced,
  getRetentionPolicies,
  getAuditAlerts,
  createAuditAlert,
  getExportHistory
};
