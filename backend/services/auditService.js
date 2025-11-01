const { pool } = require('../config/db');

/**
 * Advanced Audit Logging Service
 * Provides comprehensive audit logging with compliance features
 */

/**
 * Log an audit event
 * @param {Object} params - Audit log parameters
 * @returns {Promise<Object>} Created audit log entry
 */
const logAuditEvent = async ({
  tenantId,
  partnerId = null,
  adminId,
  adminEmail,
  action,
  resourceType,
  resourceId = null,
  event,
  ipAddress = null,
  userAgent = null,
  requestMethod = null,
  requestPath = null,
  oldValues = null,
  newValues = null,
  description = null,
  status = 'success',
  errorMessage = null,
  severity = 'info',
  metadata = {},
  region = null
}) => {
  try {
    // Check if audit logging is enabled for this tenant
    const configCheck = await pool.query(
      'SELECT enabled FROM audit_config WHERE tenant_id = $1',
      [tenantId]
    );

    // Skip logging if disabled (but always log critical security events)
    if (configCheck.rows.length > 0 && !configCheck.rows[0].enabled && severity !== 'critical') {
      return null;
    }

    // Auto-generate compliance tags based on action and resource type
    const complianceTags = generateComplianceTags(action, resourceType, event);

    // Calculate retention based on policies
    const retentionUntil = await calculateRetentionDate(event, severity, complianceTags, region);

    const query = `
      INSERT INTO audit_logs (
        tenant_id, partner_id, admin_id, admin_email, action, resource_type, resource_id,
        event, ip_address, user_agent, request_method, request_path,
        old_values, new_values, description, status, error_message,
        severity, compliance_tags, region, metadata, retention_until
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      RETURNING *
    `;

    const values = [
      tenantId, partnerId, adminId, adminEmail, action, resourceType, resourceId,
      event, ipAddress, userAgent, requestMethod, requestPath,
      oldValues ? JSON.stringify(oldValues) : null,
      newValues ? JSON.stringify(newValues) : null,
      description, status, errorMessage,
      severity, complianceTags, region, JSON.stringify(metadata), retentionUntil
    ];

    const result = await pool.query(query, values);

    // Check if we should trigger any alerts
    await checkAndTriggerAlerts(tenantId, event, severity);

    return result.rows[0];
  } catch (error) {
    console.error('Audit logging error:', error);
    // Don't throw - audit logging failures shouldn't break the main operation
    return null;
  }
};

/**
 * Auto-generate compliance tags based on action and context
 */
function generateComplianceTags(action, resourceType, event) {
  const tags = ['audit'];

  // GDPR/DPDP related tags
  if (resourceType === 'customer' || event?.includes('data.')) {
    tags.push('gdpr', 'dpdp', 'privacy');
  }

  if (action === 'delete' && resourceType === 'customer') {
    tags.push('data-erasure', 'right-to-be-forgotten');
  }

  if (event?.includes('export') || event?.includes('data.access')) {
    tags.push('data-portability', 'data-access');
  }

  // Payment/PCI-DSS related tags
  if (resourceType === 'payment' || event?.includes('payment.') || event?.includes('billing.')) {
    tags.push('pci', 'payment', 'financial');
  }

  // Healthcare/HIPAA related tags
  if (resourceType === 'prescription' || resourceType === 'medical') {
    tags.push('hipaa', 'phi', 'healthcare');
  }

  // Security related tags
  if (event?.includes('auth.') || event?.includes('security.') || action === 'login' || action === 'logout') {
    tags.push('security', 'authentication');
  }

  if (event?.includes('rbac.') || resourceType === 'role' || resourceType === 'permission') {
    tags.push('rbac', 'access-control');
  }

  // SOC2 related tags
  if (event?.includes('system.') || event?.includes('config.')) {
    tags.push('soc2', 'system-change');
  }

  return tags;
}

/**
 * Calculate retention date based on policies
 */
async function calculateRetentionDate(event, severity, complianceTags, region) {
  try {
    // Get matching retention policies (ordered by priority)
    const query = `
      SELECT retention_days, archive_after_days
      FROM audit_retention_policies
      WHERE is_active = true
        AND (
          event_patterns IS NULL 
          OR EXISTS (
            SELECT 1 FROM unnest(event_patterns) AS pattern
            WHERE $1 LIKE pattern
          )
        )
        AND (
          severity_levels IS NULL 
          OR $2 = ANY(severity_levels)
        )
        AND (
          compliance_tags IS NULL
          OR compliance_tags && $3
        )
        AND (
          regions IS NULL
          OR $4 = ANY(regions)
        )
      ORDER BY priority DESC
      LIMIT 1
    `;

    const result = await pool.query(query, [event || '', severity, complianceTags, region || 'global']);

    if (result.rows.length > 0) {
      const { retention_days } = result.rows[0];
      const retentionDate = new Date();
      retentionDate.setDate(retentionDate.getDate() + retention_days);
      return retentionDate;
    }

    // Default retention: 365 days
    const defaultRetention = new Date();
    defaultRetention.setDate(defaultRetention.getDate() + 365);
    return defaultRetention;
  } catch (error) {
    console.error('Calculate retention error:', error);
    // Default retention on error
    const defaultRetention = new Date();
    defaultRetention.setDate(defaultRetention.getDate() + 365);
    return defaultRetention;
  }
}

/**
 * Check if any alerts should be triggered
 */
async function checkAndTriggerAlerts(tenantId, event, severity) {
  try {
    // Get active alerts for this tenant
    const alertsQuery = `
      SELECT * FROM audit_alerts
      WHERE tenant_id = $1
        AND is_active = true
        AND (
          event_patterns IS NULL
          OR EXISTS (
            SELECT 1 FROM unnest(event_patterns) AS pattern
            WHERE $2 LIKE pattern
          )
        )
        AND (
          severity_levels IS NULL
          OR $3 = ANY(severity_levels)
        )
    `;

    const alerts = await pool.query(alertsQuery, [tenantId, event || '', severity]);

    for (const alert of alerts.rows) {
      // Check threshold if applicable
      if (alert.threshold_count && alert.threshold_window_minutes) {
        const windowStart = new Date();
        windowStart.setMinutes(windowStart.getMinutes() - alert.threshold_window_minutes);

        const countQuery = `
          SELECT COUNT(*) as count
          FROM audit_logs
          WHERE tenant_id = $1
            AND created_at >= $2
            AND (
              event_patterns IS NULL
              OR EXISTS (
                SELECT 1 FROM unnest($3::text[]) AS pattern
                WHERE event LIKE pattern
              )
            )
        `;

        const countResult = await pool.query(countQuery, [tenantId, windowStart, alert.event_patterns]);
        const count = parseInt(countResult.rows[0].count);

        if (count >= alert.threshold_count) {
          await triggerAlert(alert);
        }
      } else {
        // Trigger alert immediately for non-threshold alerts
        await triggerAlert(alert);
      }
    }
  } catch (error) {
    console.error('Alert check error:', error);
  }
}

/**
 * Trigger an alert notification
 */
async function triggerAlert(alert) {
  try {
    // Update alert trigger count
    await pool.query(
      `UPDATE audit_alerts 
       SET last_triggered_at = NOW(), trigger_count = trigger_count + 1
       WHERE alert_id = $1`,
      [alert.alert_id]
    );

    // Send notifications based on channels
    if (alert.notification_channels.includes('email') && alert.notification_emails) {
      // TODO: Send email notification
      console.log('Email alert triggered:', alert.name);
    }

    if (alert.notification_channels.includes('webhook') && alert.webhook_url) {
      // TODO: Send webhook notification
      console.log('Webhook alert triggered:', alert.name);
    }

    if (alert.notification_channels.includes('in_app')) {
      // TODO: Create in-app notification
      console.log('In-app alert triggered:', alert.name);
    }
  } catch (error) {
    console.error('Trigger alert error:', error);
  }
}

/**
 * Get audit logs with advanced filtering
 */
const getAuditLogs = async (filters, page = 1, limit = 50) => {
  try {
    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const values = [];
    let paramCount = 1;

    // Build filter conditions
    if (filters.tenantId) {
      query += ` AND tenant_id = $${paramCount}`;
      values.push(filters.tenantId);
      paramCount++;
    }

    if (filters.partnerId) {
      query += ` AND partner_id = $${paramCount}`;
      values.push(filters.partnerId);
      paramCount++;
    }

    if (filters.action) {
      query += ` AND action = $${paramCount}`;
      values.push(filters.action);
      paramCount++;
    }

    if (filters.resourceType) {
      query += ` AND resource_type = $${paramCount}`;
      values.push(filters.resourceType);
      paramCount++;
    }

    if (filters.event) {
      query += ` AND event LIKE $${paramCount}`;
      values.push(`%${filters.event}%`);
      paramCount++;
    }

    if (filters.severity) {
      query += ` AND severity = $${paramCount}`;
      values.push(filters.severity);
      paramCount++;
    }

    if (filters.status) {
      query += ` AND status = $${paramCount}`;
      values.push(filters.status);
      paramCount++;
    }

    if (filters.complianceTag) {
      query += ` AND $${paramCount} = ANY(compliance_tags)`;
      values.push(filters.complianceTag);
      paramCount++;
    }

    if (filters.region) {
      query += ` AND region = $${paramCount}`;
      values.push(filters.region);
      paramCount++;
    }

    if (filters.startDate) {
      query += ` AND created_at >= $${paramCount}`;
      values.push(filters.startDate);
      paramCount++;
    }

    if (filters.endDate) {
      query += ` AND created_at <= $${paramCount}`;
      values.push(filters.endDate);
      paramCount++;
    }

    if (filters.search) {
      query += ` AND (description ILIKE $${paramCount} OR admin_email ILIKE $${paramCount})`;
      values.push(`%${filters.search}%`);
      paramCount++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM audit_logs WHERE 1=1';
    const countValues = values.slice(0, -2); // Remove limit and offset
    
    const countResult = await pool.query(
      countQuery + query.substring(query.indexOf('WHERE') + 7, query.indexOf('ORDER BY')),
      countValues
    );

    return {
      logs: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
      }
    };
  } catch (error) {
    console.error('Get audit logs error:', error);
    throw error;
  }
};

/**
 * Generate compliance report
 */
const generateComplianceReport = async (tenantId, reportType, startDate, endDate) => {
  try {
    const query = `
      SELECT 
        COUNT(*) as total_events,
        COUNT(DISTINCT admin_id) as unique_admins,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_events,
        COUNT(CASE WHEN status = 'failure' THEN 1 END) as failed_events,
        COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_events,
        COUNT(CASE WHEN severity = 'high' THEN 1 END) as high_events,
        array_agg(DISTINCT action) as actions_performed,
        array_agg(DISTINCT resource_type) as resources_accessed
      FROM audit_logs
      WHERE tenant_id = $1
        AND created_at >= $2
        AND created_at <= $3
    `;

    const result = await pool.query(query, [tenantId, startDate, endDate]);
    const summary = result.rows[0];

    // Get events by day
    const eventsByDayQuery = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM audit_logs
      WHERE tenant_id = $1
        AND created_at >= $2
        AND created_at <= $3
      GROUP BY DATE(created_at)
      ORDER BY date
    `;

    const eventsByDay = await pool.query(eventsByDayQuery, [tenantId, startDate, endDate]);

    // Get top admins
    const topAdminsQuery = `
      SELECT 
        admin_email,
        COUNT(*) as action_count
      FROM audit_logs
      WHERE tenant_id = $1
        AND created_at >= $2
        AND created_at <= $3
        AND admin_email IS NOT NULL
      GROUP BY admin_email
      ORDER BY action_count DESC
      LIMIT 10
    `;

    const topAdmins = await pool.query(topAdminsQuery, [tenantId, startDate, endDate]);

    return {
      summary,
      eventsByDay: eventsByDay.rows,
      topAdmins: topAdmins.rows
    };
  } catch (error) {
    console.error('Generate compliance report error:', error);
    throw error;
  }
};

/**
 * Export audit logs
 */
const exportAuditLogs = async (tenantId, adminId, adminEmail, filters, format = 'json') => {
  try {
    // Create export record
    const exportRecord = await pool.query(
      `INSERT INTO audit_export_history 
       (tenant_id, admin_id, admin_email, export_format, filters, start_date, end_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'processing')
       RETURNING export_id`,
      [tenantId, adminId, adminEmail, format, JSON.stringify(filters), filters.startDate, filters.endDate]
    );

    const exportId = exportRecord.rows[0].export_id;

    // Get logs
    const { logs } = await getAuditLogs(filters, 1, 100000); // Large limit for export

    // Update export record
    await pool.query(
      `UPDATE audit_export_history 
       SET status = 'completed', record_count = $1, completed_at = NOW()
       WHERE export_id = $2`,
      [logs.length, exportId]
    );

    return {
      exportId,
      logs,
      format
    };
  } catch (error) {
    console.error('Export audit logs error:', error);
    throw error;
  }
};

module.exports = {
  logAuditEvent,
  getAuditLogs,
  generateComplianceReport,
  exportAuditLogs
};
