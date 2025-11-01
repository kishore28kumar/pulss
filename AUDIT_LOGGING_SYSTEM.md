# Advanced Audit Logging & Compliance Controls System

## Overview

The Pulss platform includes a comprehensive audit logging and compliance controls system designed to meet enterprise-grade security and regulatory requirements. The system provides complete visibility into all platform activities while maintaining flexibility for multi-tenant and partner deployments.

## Table of Contents

- [Architecture](#architecture)
- [Features](#features)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Super Admin Controls](#super-admin-controls)
- [Compliance Standards](#compliance-standards)
- [Integration Guide](#integration-guide)
- [Best Practices](#best-practices)
- [Extension Guide](#extension-guide)

## Architecture

### Components

1. **Database Layer** - PostgreSQL with JSONB for flexible metadata storage
2. **Service Layer** - Automated audit logging service with compliance tagging
3. **Middleware Layer** - Request interceptors for automated API logging
4. **Controller Layer** - API endpoints for audit management
5. **UI Layer** - React components for configuration and reporting

### Data Flow

```
User Action → Middleware/Controller → Audit Service → Database
                                           ↓
                                    Compliance Tags
                                    Retention Policy
                                    Alert Checks
```

## Features

### Core Audit Logging

- **Comprehensive Event Capture**: All CRUD operations, authentication, and system changes
- **Rich Metadata**: IP address, user agent, request/response details, timestamps
- **Change Tracking**: Before/after values for update operations
- **Multi-tenant Support**: Tenant and partner-level isolation
- **Event Classification**: Structured event names (e.g., `user.login`, `billing.charge`)

### Compliance Features

- **Auto-Tagging**: Automatic compliance categorization (GDPR, HIPAA, SOC2, PCI-DSS, DPDP)
- **Retention Policies**: Configurable retention periods with auto-archival
- **Region Controls**: Geographic data residency and restrictions
- **Compliance Templates**: Pre-configured standards for major regulations
- **Export Capabilities**: JSON, CSV formats for compliance reporting

### Alerting & Monitoring

- **Real-time Alerts**: Threshold-based and pattern-based alerting
- **Notification Channels**: Email, webhook, in-app notifications
- **Anomaly Detection**: Suspicious activity monitoring
- **Failure Tracking**: Automatic alerting on operation failures

### Super Admin Controls

All advanced audit features are controlled via super admin toggles:

- Master audit logging enable/disable
- Per-feature logging controls (API, billing, notifications, RBAC, etc.)
- Compliance mode settings (minimal, standard, strict)
- Retention and archival configuration
- Export and alerting controls
- Region restrictions

## Database Schema

### Core Tables

#### `audit_logs`
Primary audit log storage with extended fields:

```sql
- log_id (UUID, PK)
- tenant_id (UUID, FK)
- partner_id (UUID)
- admin_id (UUID, FK)
- admin_email (TEXT)
- action (TEXT) -- create, update, delete, login, etc.
- resource_type (TEXT) -- product, order, customer, etc.
- resource_id (UUID)
- event (VARCHAR) -- structured event name
- ip_address (INET)
- user_agent (TEXT)
- request_method (TEXT)
- request_path (TEXT)
- old_values (JSONB)
- new_values (JSONB)
- description (TEXT)
- status (TEXT) -- success, failure, error
- error_message (TEXT)
- severity (VARCHAR) -- info, warning, high, critical
- compliance_tags (TEXT[])
- region (VARCHAR)
- metadata (JSONB)
- retention_until (TIMESTAMP)
- created_at (TIMESTAMP)
```

#### `audit_config`
Per-tenant audit configuration controlled by super admin:

```sql
- config_id (UUID, PK)
- tenant_id (UUID, FK, UNIQUE)
- enabled (BOOLEAN) -- Master toggle
- api_logging_enabled (BOOLEAN)
- billing_logging_enabled (BOOLEAN)
- notification_logging_enabled (BOOLEAN)
- rbac_logging_enabled (BOOLEAN)
- branding_logging_enabled (BOOLEAN)
- subscription_logging_enabled (BOOLEAN)
- developer_portal_logging_enabled (BOOLEAN)
- compliance_mode (VARCHAR) -- minimal, standard, strict
- auto_tagging_enabled (BOOLEAN)
- retention_days (INTEGER)
- auto_archive_enabled (BOOLEAN)
- archive_after_days (INTEGER)
- export_enabled (BOOLEAN)
- export_formats (TEXT[])
- alerting_enabled (BOOLEAN)
- alert_on_failures (BOOLEAN)
- alert_threshold (INTEGER)
- region (VARCHAR)
- region_restricted (BOOLEAN)
- allowed_regions (TEXT[])
```

#### `compliance_templates`
Pre-defined compliance standards:

```sql
- template_id (UUID, PK)
- name (VARCHAR, UNIQUE)
- description (TEXT)
- standard (VARCHAR) -- GDPR, HIPAA, SOC2, PCI-DSS, DPDP, Custom
- required_fields (JSONB)
- retention_days (INTEGER)
- auto_tags (TEXT[])
- region_restrictions (TEXT[])
- export_format_required (VARCHAR)
- min_log_level (VARCHAR)
- required_events (TEXT[])
- is_active (BOOLEAN)
```

#### `audit_retention_policies`
Automated retention and archival rules:

```sql
- policy_id (UUID, PK)
- name (VARCHAR)
- description (TEXT)
- retention_days (INTEGER)
- archive_enabled (BOOLEAN)
- archive_after_days (INTEGER)
- delete_after_retention (BOOLEAN)
- event_patterns (TEXT[])
- severity_levels (TEXT[])
- compliance_tags (TEXT[])
- regions (TEXT[])
- priority (INTEGER)
- is_active (BOOLEAN)
```

#### `audit_alerts`
Real-time alerting configuration:

```sql
- alert_id (UUID, PK)
- tenant_id (UUID, FK)
- partner_id (UUID)
- name (VARCHAR)
- description (TEXT)
- alert_type (VARCHAR) -- threshold, pattern, anomaly, compliance
- event_patterns (TEXT[])
- severity_levels (TEXT[])
- threshold_count (INTEGER)
- threshold_window_minutes (INTEGER)
- notification_channels (TEXT[]) -- email, sms, webhook, in_app
- notification_emails (TEXT[])
- webhook_url (TEXT)
- is_active (BOOLEAN)
- last_triggered_at (TIMESTAMP)
- trigger_count (INTEGER)
```

#### `audit_export_history`
Track all audit log exports:

```sql
- export_id (UUID, PK)
- tenant_id (UUID, FK)
- admin_id (UUID, FK)
- admin_email (TEXT)
- export_format (VARCHAR) -- json, csv, pdf
- file_name (VARCHAR)
- file_size (BIGINT)
- file_url (TEXT)
- filters (JSONB)
- start_date (TIMESTAMP)
- end_date (TIMESTAMP)
- record_count (INTEGER)
- status (VARCHAR) -- pending, processing, completed, failed
- error_message (TEXT)
- created_at (TIMESTAMP)
- completed_at (TIMESTAMP)
```

#### `audit_reports`
Scheduled and ad-hoc compliance reports:

```sql
- report_id (UUID, PK)
- tenant_id (UUID, FK)
- admin_id (UUID, FK)
- report_name (VARCHAR)
- report_type (VARCHAR) -- compliance, security, activity, custom
- compliance_standard (VARCHAR)
- date_range_start (TIMESTAMP)
- date_range_end (TIMESTAMP)
- filters (JSONB)
- summary (JSONB)
- details (JSONB)
- recommendations (TEXT[])
- status (VARCHAR) -- draft, published, archived
```

## API Endpoints

### Audit Log Viewing

```
GET /api/audit-logs
Query params: page, limit, action, resource_type, event, status, 
              severity, compliance_tag, region, search, start_date, end_date
Response: { logs: [], pagination: {} }
```

```
GET /api/audit-logs/:logId
Response: { log: {} }
```

```
GET /api/audit-logs/stats
Query params: start_date, end_date
Response: { total, by_action, by_resource_type, by_status, most_active_admins }
```

### Configuration (Super Admin Only)

```
GET /api/audit-logs/config/settings?tenant_id=<uuid>
Response: { config: {} }
```

```
PUT /api/audit-logs/config/settings
Body: { tenant_id, config: { enabled, api_logging_enabled, ... } }
Response: { message, config: {} }
```

### Compliance

```
GET /api/audit-logs/compliance/templates
Response: { templates: [] }
```

```
GET /api/audit-logs/compliance/report?tenant_id=<uuid>&start_date=<iso>&end_date=<iso>
Response: { report: { summary, eventsByDay, topAdmins } }
```

```
GET /api/audit-logs/compliance/retention-policies
Response: { policies: [] }
```

### Export

```
GET /api/audit-logs/export?format=<json|csv>&start_date=<iso>&end_date=<iso>
Response: File download
```

```
POST /api/audit-logs/export/generate
Body: { filters, format }
Response: File download
```

```
GET /api/audit-logs/export/history?tenant_id=<uuid>
Response: { exports: [] }
```

### Alerts (Super Admin Only)

```
GET /api/audit-logs/alerts?tenant_id=<uuid>
Response: { alerts: [] }
```

```
POST /api/audit-logs/alerts
Body: { tenant_id, name, alert_type, event_patterns, ... }
Response: { message, alert: {} }
```

## Super Admin Controls

### Accessing Audit Configuration

1. Navigate to Super Admin Dashboard
2. Click on "Audit" tab
3. Select a tenant from the list
4. Configure audit settings

### Configuration Options

#### General Settings
- **Master Audit Logging**: Enable/disable all audit logging
- **Compliance Mode**: Choose minimal, standard, or strict compliance
- **Auto-Tagging**: Automatically tag logs with compliance categories
- **Region**: Set geographic region for the tenant
- **Region Restrictions**: Restrict audit log storage to specific regions

#### Feature Toggles
- API Logging
- Billing Logging
- Notification Logging
- RBAC Logging
- Branding Logging
- Subscription Logging
- Developer Portal Logging

#### Retention Settings
- **Retention Period**: Days to keep audit logs (1-3650)
- **Auto-Archive**: Automatically archive old logs
- **Archive After**: Days after which to archive (1-365)
- **Export Enabled**: Allow exporting audit logs

#### Alert Settings
- **Enable Alerting**: Turn on real-time alerts
- **Alert on Failures**: Send alerts when operations fail
- **Alert Threshold**: Number of failures before alerting

## Compliance Standards

### Pre-configured Templates

1. **GDPR Compliance** (EU General Data Protection Regulation)
   - Retention: 730 days
   - Required events: data.access, data.export, data.delete, consent.update
   - Auto-tags: gdpr, privacy, data-access

2. **HIPAA Compliance** (Health Insurance Portability and Accountability Act)
   - Retention: 2555 days (7 years)
   - Required events: patient.access, phi.access, phi.export, audit.access
   - Auto-tags: hipaa, phi, healthcare

3. **SOC2 Compliance** (Service Organization Control 2)
   - Retention: 365 days
   - Required events: security.incident, access.control, system.change
   - Auto-tags: soc2, security, availability

4. **PCI-DSS Compliance** (Payment Card Industry Data Security Standard)
   - Retention: 365 days
   - Required events: payment.process, card.store, security.access
   - Auto-tags: pci, payment, cardholder-data

5. **DPDP Compliance** (India Digital Personal Data Protection Act)
   - Retention: 730 days
   - Required events: data.access, consent.update, data.erasure, data.portability
   - Auto-tags: dpdp, privacy, india

6. **Standard Audit**
   - Retention: 365 days
   - Required events: user.login, user.logout, data.create, data.update, data.delete
   - Auto-tags: standard, audit

## Integration Guide

### Automatic API Logging

Add the audit middleware to your Express app:

```javascript
const { auditLoggerMiddleware } = require('./middleware/auditLogger');

// Apply globally after authentication
app.use(auditLoggerMiddleware({ resourceType: 'api' }));
```

### Manual Audit Logging

#### Authentication Events

```javascript
const { auditAuth } = require('./middleware/auditLogger');

// In login controller
await auditAuth(req, 'login', 'success', user.id, user.email, {
  tenantId: user.tenant_id,
  role: user.role
});
```

#### Billing Events

```javascript
const { auditBilling } = require('./middleware/auditLogger');

await auditBilling(tenantId, 'charge', amount, {
  adminId: req.user.id,
  adminEmail: req.user.email,
  billingId: charge.id,
  status: 'success',
  currency: 'INR'
});
```

#### RBAC Changes

```javascript
const { auditRBAC } = require('./middleware/auditLogger');

await auditRBAC(req, 'role_change', userId, oldRole, newRole);
```

#### Notification Events

```javascript
const { auditNotification } = require('./middleware/auditLogger');

await auditNotification(tenantId, 'email', recipientId, {
  adminId: req.user.id,
  status: 'sent',
  subject: emailSubject
});
```

#### Subscription Events

```javascript
const { auditSubscription } = require('./middleware/auditLogger');

await auditSubscription(tenantId, 'upgrade', subscriptionId, {
  adminId: req.user.id,
  oldValues: { plan: 'basic' },
  newValues: { plan: 'premium' },
  status: 'success'
});
```

#### Branding Changes

```javascript
const { auditBranding } = require('./middleware/auditLogger');

await auditBranding(req, 'update', themeId, oldValues, newValues);
```

### Custom Audit Events

```javascript
const { logAuditEvent } = require('./services/auditService');

await logAuditEvent({
  tenantId: 'tenant-uuid',
  adminId: 'admin-uuid',
  adminEmail: 'admin@example.com',
  action: 'custom_action',
  resourceType: 'custom_resource',
  resourceId: 'resource-uuid',
  event: 'custom.event.name',
  description: 'Custom event description',
  status: 'success',
  severity: 'info',
  metadata: { key: 'value' }
});
```

## Best Practices

### 1. Event Naming Convention

Use dot notation for structured event names:
- `user.login`, `user.logout`, `user.register`
- `data.create`, `data.read`, `data.update`, `data.delete`
- `billing.charge`, `billing.refund`, `billing.subscribe`
- `security.breach`, `security.lockout`

### 2. Severity Levels

- **info**: Normal operations (default)
- **warning**: Non-critical issues, failed validations
- **high**: Important security events, permission changes
- **critical**: Security breaches, data deletions, system failures

### 3. Sensitive Data

Always sanitize sensitive data before logging:
- Passwords, tokens, API keys
- Credit card numbers, CVV
- SSN, PII (unless required for compliance)

The audit middleware automatically redacts common sensitive fields.

### 4. Metadata Usage

Use metadata for additional context:
```javascript
metadata: {
  duration_ms: 150,
  affected_records: 10,
  ip_address: '192.168.1.1',
  session_id: 'session-uuid',
  correlation_id: 'request-uuid'
}
```

### 5. Retention Strategy

- **Critical logs**: 2+ years (compliance requirement)
- **Security logs**: 1-2 years
- **General logs**: 6-12 months
- **Debug logs**: 30-90 days

### 6. Export Strategy

- Schedule regular exports for long-term archival
- Use compressed formats for large datasets
- Store exports in secure, encrypted storage
- Implement export retention policies

## Extension Guide

### Adding New Compliance Templates

```sql
INSERT INTO compliance_templates (
  name, description, standard, retention_days, 
  auto_tags, required_events
) VALUES (
  'Custom Regulation',
  'Description of the regulation',
  'CUSTOM',
  365,
  ARRAY['custom', 'compliance'],
  ARRAY['event.pattern.1', 'event.pattern.2']
);
```

### Adding New Retention Policies

```sql
INSERT INTO audit_retention_policies (
  name, description, retention_days,
  event_patterns, severity_levels, priority
) VALUES (
  'Extended Security Logs',
  'Keep security logs for 2 years',
  730,
  ARRAY['security.%', 'auth.%'],
  ARRAY['critical', 'high'],
  15
);
```

### Creating Custom Alerts

Via API:
```javascript
POST /api/audit-logs/alerts
{
  "tenant_id": "tenant-uuid",
  "name": "Failed Login Alert",
  "alert_type": "threshold",
  "event_patterns": ["auth.login"],
  "severity_levels": ["warning", "high"],
  "threshold_count": 5,
  "threshold_window_minutes": 10,
  "notification_channels": ["email"],
  "notification_emails": ["security@company.com"]
}
```

### Custom Audit Middleware

Create specialized middleware for specific routes:

```javascript
const customAuditMiddleware = async (req, res, next) => {
  // Custom logic before request
  const startTime = Date.now();
  
  // Capture response
  const oldJson = res.json;
  res.json = function(data) {
    // Log with custom logic
    logAuditEvent({
      // ... custom audit data
      metadata: {
        duration_ms: Date.now() - startTime,
        custom_field: 'custom_value'
      }
    });
    
    return oldJson.call(this, data);
  };
  
  next();
};
```

### Integrating with External Systems

#### Webhook Integration

```javascript
// In audit service
if (alert.webhook_url) {
  await fetch(alert.webhook_url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      alert_name: alert.name,
      triggered_at: new Date().toISOString(),
      event_count: count,
      tenant_id: tenantId
    })
  });
}
```

#### SIEM Integration

Export audit logs to SIEM systems:

```javascript
// Scheduled job
const exportToSIEM = async () => {
  const logs = await getAuditLogs({
    startDate: lastExportTime,
    endDate: new Date()
  });
  
  await fetch(process.env.SIEM_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SIEM_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ logs: logs.logs })
  });
};
```

## Troubleshooting

### Common Issues

1. **Logs not appearing**
   - Check if audit logging is enabled in `audit_config`
   - Verify tenant_id is being passed correctly
   - Check database permissions

2. **Performance issues**
   - Add indexes on frequently queried columns
   - Implement archival for old logs
   - Use pagination for large result sets

3. **Missing compliance tags**
   - Ensure `auto_tagging_enabled` is true
   - Check event naming matches patterns
   - Review compliance template configurations

4. **Alerts not triggering**
   - Verify alert is active
   - Check threshold configuration
   - Review event patterns match actual events

## Security Considerations

1. **Access Control**: Only super admins can modify audit configuration
2. **Data Integrity**: Audit logs are append-only (no updates/deletes)
3. **Encryption**: Store sensitive data encrypted at rest
4. **Audit the Auditors**: Log all access to audit logs
5. **Regular Reviews**: Implement periodic audit log reviews
6. **Backup Strategy**: Regular backups of audit data
7. **Retention Compliance**: Follow regulatory retention requirements

## Performance Optimization

1. **Partitioning**: Use table partitioning for large datasets
2. **Indexing**: Optimize indexes for common query patterns
3. **Archival**: Move old logs to cold storage
4. **Batching**: Batch audit log writes for high-volume systems
5. **Caching**: Cache audit configuration to reduce DB queries

## Support

For questions or issues with the audit logging system:
- Check this documentation
- Review existing audit logs for examples
- Contact platform administrators
- Submit feature requests via GitHub issues

---

**Last Updated**: October 2025
**Version**: 1.0.0
**Maintainer**: Pulss Platform Team
