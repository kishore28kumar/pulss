# Audit Logging - Quick Reference Card

## Common Operations

### View Audit Logs
```bash
curl -X GET "http://localhost:3000/api/audit-logs?page=1&limit=50" \
  -H "Authorization: Bearer $TOKEN"
```

### Export Logs (JSON)
```bash
curl -X GET "http://localhost:3000/api/audit-logs/export?format=json&start_date=2025-01-01&end_date=2025-01-31" \
  -H "Authorization: Bearer $TOKEN" \
  -o audit-logs.json
```

### Export Logs (CSV)
```bash
curl -X GET "http://localhost:3000/api/audit-logs/export?format=csv&start_date=2025-01-01&end_date=2025-01-31" \
  -H "Authorization: Bearer $TOKEN" \
  -o audit-logs.csv
```

### Get Statistics
```bash
curl -X GET "http://localhost:3000/api/audit-logs/stats?start_date=2025-01-01&end_date=2025-01-31" \
  -H "Authorization: Bearer $TOKEN"
```

### Generate Compliance Report
```bash
curl -X GET "http://localhost:3000/api/audit-logs/compliance/report?tenant_id=$TENANT_ID&start_date=2025-01-01&end_date=2025-01-31" \
  -H "Authorization: Bearer $TOKEN"
```

## Manual Logging

### Log Authentication Event
```javascript
const { auditAuth } = require('./middleware/auditLogger');

await auditAuth(req, 'login', 'success', user.id, user.email, {
  tenantId: user.tenant_id,
  role: user.role
});
```

### Log Resource Action
```javascript
const { auditAction } = require('./middleware/auditLogger');

await auditAction(req, 'update', 'product', productId, {
  event: 'product.update',
  description: 'Updated product details',
  oldValues: { name: 'Old Name' },
  newValues: { name: 'New Name' }
});
```

### Log Billing Event
```javascript
const { auditBilling } = require('./middleware/auditLogger');

await auditBilling(tenantId, 'charge', amount, {
  adminId: req.user.id,
  adminEmail: req.user.email,
  status: 'success',
  currency: 'INR'
});
```

### Custom Event
```javascript
const { logAuditEvent } = require('./services/auditService');

await logAuditEvent({
  tenantId: 'tenant-uuid',
  adminId: 'admin-uuid',
  adminEmail: 'admin@example.com',
  action: 'custom_action',
  resourceType: 'custom_resource',
  event: 'custom.event.name',
  severity: 'info',
  status: 'success'
});
```

## Database Queries

### Recent Logs
```sql
SELECT * FROM audit_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

### Failed Operations
```sql
SELECT * FROM audit_logs 
WHERE status = 'failure' 
ORDER BY created_at DESC 
LIMIT 10;
```

### Critical Events
```sql
SELECT * FROM audit_logs 
WHERE severity = 'critical' 
ORDER BY created_at DESC;
```

### Logs by Tenant
```sql
SELECT * FROM audit_logs 
WHERE tenant_id = 'your-tenant-id' 
ORDER BY created_at DESC 
LIMIT 50;
```

### Logs by Date Range
```sql
SELECT * FROM audit_logs 
WHERE created_at >= '2025-01-01' 
  AND created_at <= '2025-01-31'
ORDER BY created_at DESC;
```

## Configuration

### Check Configuration
```sql
SELECT * FROM audit_config 
WHERE tenant_id = 'your-tenant-id';
```

### Enable All Logging
```sql
UPDATE audit_config 
SET enabled = true,
    api_logging_enabled = true,
    billing_logging_enabled = true,
    compliance_mode = 'standard'
WHERE tenant_id = 'your-tenant-id';
```

### Set Strict Compliance
```sql
UPDATE audit_config 
SET compliance_mode = 'strict',
    retention_days = 2555,  -- 7 years for HIPAA
    auto_tagging_enabled = true,
    alerting_enabled = true
WHERE tenant_id = 'your-tenant-id';
```

## Rate Limits

| Operation | Limit | Window |
|-----------|-------|--------|
| View Logs | 100 | 15 min |
| Export | 10 | 1 hour |
| Config Update | 20 | 1 hour |
| Alert Creation | 5 | 1 hour |

## Severity Levels

- `info` - Normal operations
- `warning` - Non-critical issues
- `high` - Important security events
- `critical` - Security breaches, data deletion

## Compliance Tags

- `gdpr` - EU data protection
- `hipaa` - Healthcare data
- `pci` - Payment data
- `soc2` - Security controls
- `dpdp` - India privacy law

## Troubleshooting

### Logs Not Appearing
```sql
-- Check if enabled
SELECT enabled FROM audit_config WHERE tenant_id = 'your-tenant-id';

-- Check recent logs
SELECT COUNT(*) FROM audit_logs WHERE tenant_id = 'your-tenant-id';
```

### Rate Limit Hit
Wait for the window to reset or contact admin to increase limits.

### Export Fails
- Check date range has data
- Reduce date range for large datasets
- Verify export is enabled in config

### Performance Issues
```sql
-- Check table size
SELECT pg_size_pretty(pg_total_relation_size('audit_logs'));

-- Check if indexes exist
SELECT indexname FROM pg_indexes WHERE tablename = 'audit_logs';
```

## Testing

### Run Unit Tests
```bash
cd backend
npm test
```

### Run Specific Test
```bash
npm test -- auditValidation.test.js
```

### Run Integration Tests
```bash
npm test -- __tests__/integration/
```

### Check Coverage
```bash
npm test -- --coverage
```

## Support

- **Documentation**: See AUDIT_LOGGING_SYSTEM.md
- **Security**: See AUDIT_SECURITY_GUIDE.md
- **Troubleshooting**: See AUDIT_TROUBLESHOOTING.md
- **Review Summary**: See AUDIT_REVIEW_SUMMARY.md

---

**Quick Reference v1.0** | Last Updated: October 2025
