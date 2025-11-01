# Audit Logging System - Quick Start Guide

## Setup

### 1. Run Database Migration

```bash
# Navigate to backend directory
cd backend

# Run the audit logging migration
psql $DATABASE_URL -f migrations/12_advanced_audit_logging.sql

# Or for local development
psql -h localhost -U postgres -d pulssdb -f migrations/12_advanced_audit_logging.sql
```

### 2. Verify Installation

Check that the following tables were created:

```sql
-- In psql or your database client
\dt audit*

-- Should show:
-- audit_logs
-- audit_config
-- audit_retention_policies
-- audit_export_history
-- audit_alerts
-- audit_reports
```

### 3. Verify Default Data

```sql
-- Check compliance templates
SELECT name, standard FROM compliance_templates;

-- Check default retention policies
SELECT name, retention_days FROM audit_retention_policies;

-- Check audit config (should be created for all tenants)
SELECT tenant_id, enabled FROM audit_config;
```

## Quick Configuration

### Enable Audit Logging for a Tenant

```sql
-- Enable all audit features for a tenant
UPDATE audit_config
SET enabled = true,
    api_logging_enabled = true,
    billing_logging_enabled = true,
    compliance_mode = 'standard'
WHERE tenant_id = 'your-tenant-id';
```

### Via Super Admin UI

1. Log in as super admin
2. Navigate to "Super Admin Dashboard"
3. Click "Audit" tab
4. Select tenant
5. Configure audit settings
6. Click "Save Changes"

## Testing Audit Logging

### 1. Test Authentication Logging

```bash
# Try logging in
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# Check audit logs
psql $DATABASE_URL -c "SELECT * FROM audit_logs WHERE event = 'auth.login' ORDER BY created_at DESC LIMIT 5;"
```

### 2. Test API Logging

```bash
# Make any API request
curl -X GET http://localhost:3000/api/products \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check audit logs
psql $DATABASE_URL -c "SELECT action, resource_type, status FROM audit_logs WHERE request_method = 'GET' ORDER BY created_at DESC LIMIT 5;"
```

### 3. Test Manual Logging

Add this to any controller:

```javascript
const { auditAction } = require('../middleware/auditLogger');

// In your route handler
await auditAction(req, 'update', 'product', productId, {
  event: 'product.update',
  description: 'Updated product details',
  oldValues: { name: 'Old Name' },
  newValues: { name: 'New Name' }
});
```

## Viewing Audit Logs

### Via API

```bash
# Get audit logs
curl -X GET "http://localhost:3000/api/audit-logs?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get audit statistics
curl -X GET "http://localhost:3000/api/audit-logs/stats" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Export audit logs
curl -X GET "http://localhost:3000/api/audit-logs/export?format=json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o audit-logs.json
```

### Via Database

```sql
-- Get recent audit logs
SELECT 
  created_at,
  admin_email,
  action,
  resource_type,
  status,
  event
FROM audit_logs
ORDER BY created_at DESC
LIMIT 20;

-- Get failed operations
SELECT 
  created_at,
  admin_email,
  action,
  resource_type,
  error_message
FROM audit_logs
WHERE status = 'failure'
ORDER BY created_at DESC
LIMIT 10;

-- Get security events
SELECT 
  created_at,
  admin_email,
  event,
  ip_address,
  description
FROM audit_logs
WHERE severity IN ('critical', 'high')
ORDER BY created_at DESC
LIMIT 10;
```

## Common Operations

### Generate Compliance Report

```javascript
// Via API
const response = await fetch('/api/audit-logs/compliance/report?' + new URLSearchParams({
  tenant_id: 'tenant-uuid',
  start_date: '2025-01-01T00:00:00Z',
  end_date: '2025-01-31T23:59:59Z'
}), {
  headers: { 'Authorization': `Bearer ${token}` }
});

const report = await response.json();
console.log(report);
```

### Configure Retention Policy

```sql
-- Add custom retention policy
INSERT INTO audit_retention_policies (
  name,
  description,
  retention_days,
  event_patterns,
  severity_levels,
  priority
) VALUES (
  'VIP Customer Logs',
  'Extended retention for VIP customer activities',
  1095, -- 3 years
  ARRAY['customer.%'],
  ARRAY['info', 'warning', 'high', 'critical'],
  20 -- Higher priority than default policies
);
```

### Create Alert

```javascript
// Via API
await fetch('/api/audit-logs/alerts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    tenant_id: 'tenant-uuid',
    name: 'Failed Login Alert',
    alert_type: 'threshold',
    event_patterns: ['auth.login'],
    severity_levels: ['warning', 'high'],
    threshold_count: 5,
    threshold_window_minutes: 10,
    notification_channels: ['email'],
    notification_emails: ['security@company.com']
  })
});
```

## Troubleshooting

### Logs Not Appearing

1. Check audit config is enabled:
   ```sql
   SELECT * FROM audit_config WHERE tenant_id = 'your-tenant-id';
   ```

2. Check middleware is loaded:
   ```javascript
   // In backend/app.js, should have:
   const { auditLoggerMiddleware } = require('./middleware/auditLogger');
   app.use(auditLoggerMiddleware({ resourceType: 'api' }));
   ```

3. Check database connection:
   ```bash
   psql $DATABASE_URL -c "SELECT 1;"
   ```

### Performance Issues

1. Add indexes if querying frequently:
   ```sql
   CREATE INDEX idx_audit_logs_custom ON audit_logs(tenant_id, created_at DESC, status);
   ```

2. Archive old logs:
   ```sql
   -- Move logs older than 90 days to archive table
   CREATE TABLE audit_logs_archive AS
   SELECT * FROM audit_logs WHERE created_at < NOW() - INTERVAL '90 days';
   
   DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '90 days';
   ```

3. Enable pagination:
   ```javascript
   // Always use pagination for large datasets
   const logs = await fetch('/api/audit-logs?page=1&limit=50');
   ```

### Missing Compliance Tags

1. Check auto-tagging is enabled:
   ```sql
   UPDATE audit_config SET auto_tagging_enabled = true WHERE tenant_id = 'your-tenant-id';
   ```

2. Verify event naming:
   ```javascript
   // Use structured event names
   event: 'user.login' // ✓ Good
   event: 'login'      // ✗ May miss tags
   ```

## Best Practices

### 1. Regular Exports

Set up a scheduled job to export audit logs:

```javascript
// Weekly export job
const cron = require('node-cron');

cron.schedule('0 0 * * 0', async () => {
  const endDate = new Date();
  const startDate = new Date(endDate - 7 * 24 * 60 * 60 * 1000);
  
  await exportAuditLogs(tenantId, adminId, adminEmail, {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  }, 'json');
});
```

### 2. Monitor Critical Events

```sql
-- Create view for critical events
CREATE VIEW critical_audit_events AS
SELECT 
  log_id,
  created_at,
  admin_email,
  event,
  description,
  ip_address
FROM audit_logs
WHERE severity = 'critical'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### 3. Regular Reviews

Schedule regular audit log reviews:

- Daily: Critical and high severity events
- Weekly: Failed operations and security events
- Monthly: Compliance reports
- Quarterly: Full audit log analysis

### 4. Backup Strategy

```bash
# Backup audit logs regularly
pg_dump -h localhost -U postgres -d pulssdb \
  -t audit_logs \
  -t audit_config \
  -t audit_export_history \
  -f audit_backup_$(date +%Y%m%d).sql
```

## Next Steps

1. **Configure Compliance Standards**: Choose appropriate compliance templates for your industry
2. **Set Up Alerts**: Configure alerts for critical security events
3. **Train Admins**: Ensure admin users understand audit logging
4. **Regular Reviews**: Establish a schedule for audit log reviews
5. **Integrate SIEM**: Connect to your SIEM system if applicable

## Support

- Full documentation: See `AUDIT_LOGGING_SYSTEM.md`
- Issues: Submit via GitHub issues
- Questions: Contact platform administrators

---

**Quick Reference Card**

| Task | Command/URL |
|------|-------------|
| View logs | `GET /api/audit-logs` |
| Export logs | `GET /api/audit-logs/export?format=json` |
| Get stats | `GET /api/audit-logs/stats` |
| Configure | Super Admin → Audit → Select Tenant |
| Generate report | `GET /api/audit-logs/compliance/report` |
| Database query | `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10;` |

---

Last Updated: October 2025
