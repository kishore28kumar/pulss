# Audit Logging System - Troubleshooting Guide

## Common Issues and Solutions

### Table of Contents

1. [Logs Not Appearing](#logs-not-appearing)
2. [Rate Limiting Issues](#rate-limiting-issues)
3. [Export Failures](#export-failures)
4. [Performance Issues](#performance-issues)
5. [Authentication Errors](#authentication-errors)
6. [Database Errors](#database-errors)
7. [Configuration Issues](#configuration-issues)
8. [Frontend Issues](#frontend-issues)

---

## Logs Not Appearing

### Symptom
Audit logs are not being recorded for certain actions or tenants.

### Possible Causes & Solutions

#### 1. Audit Logging Disabled for Tenant

**Check Configuration:**
```sql
SELECT enabled, api_logging_enabled 
FROM audit_config 
WHERE tenant_id = 'your-tenant-id';
```

**Solution:**
```sql
UPDATE audit_config 
SET enabled = true, 
    api_logging_enabled = true 
WHERE tenant_id = 'your-tenant-id';
```

#### 2. Missing Tenant ID in Request

**Symptom:** Logs don't record because tenant context is missing.

**Check Request:**
```javascript
// Ensure req.user contains tenant_id
console.log('User context:', req.user);
```

**Solution:** Verify authentication middleware is correctly extracting tenant information from JWT.

#### 3. Database Connection Issues

**Check Connection:**
```bash
psql $DATABASE_URL -c "SELECT 1;"
```

**Solution:** Verify database credentials and connection string.

#### 4. Middleware Not Applied

**Check Route Configuration:**
```javascript
// Ensure audit middleware is applied
app.use(auditLoggerMiddleware({ resourceType: 'api' }));
```

**Solution:** Verify middleware order in `app.js`.

---

## Rate Limiting Issues

### Symptom
Getting 429 (Too Many Requests) errors.

### Solutions

#### 1. Legitimate High Usage

**Check Current Limits:**
```javascript
// View logs rate limiter: 100 requests per 15 minutes
// Export rate limiter: 10 requests per hour
```

**Solution:** Request rate limit increase or implement caching.

#### 2. Shared IP Address

**Symptom:** Multiple users behind same IP hitting limits.

**Solution:** Consider using user-based rate limiting instead of IP-based:
```javascript
const rateLimiter = rateLimit({
  keyGenerator: (req) => req.user.id, // Use user ID instead of IP
  // ... other options
});
```

#### 3. Rate Limit Reset

**Manual Reset (Development Only):**
```javascript
// Clear rate limit store (in-memory)
// Restart the server
```

**For Production (Redis):**
```bash
# Clear specific key
redis-cli DEL "rate-limit:user-id"
```

---

## Export Failures

### Symptom
Export requests fail or produce empty files.

### Solutions

#### 1. No Data in Date Range

**Check Data Availability:**
```sql
SELECT COUNT(*) 
FROM audit_logs 
WHERE tenant_id = 'your-tenant-id'
  AND created_at >= '2025-01-01'
  AND created_at <= '2025-01-31';
```

**Solution:** Adjust date range or verify logs exist.

#### 2. Export Format Not Supported

**Error:** "Invalid format"

**Solution:** Use only supported formats:
```javascript
// Supported: 'json', 'csv'
// Not supported: 'pdf', 'xml'
```

#### 3. Large Dataset Timeout

**Symptom:** Export times out for large datasets.

**Solution:** 
- Reduce date range
- Export in smaller chunks
- Increase timeout limit:
```javascript
// In export controller
const timeout = 5 * 60 * 1000; // 5 minutes
```

#### 4. Permission Issues

**Check Permissions:**
```sql
SELECT export_enabled 
FROM audit_config 
WHERE tenant_id = 'your-tenant-id';
```

**Solution:**
```sql
UPDATE audit_config 
SET export_enabled = true 
WHERE tenant_id = 'your-tenant-id';
```

---

## Performance Issues

### Symptom
Slow audit log queries or high database load.

### Solutions

#### 1. Missing Indexes

**Check Indexes:**
```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'audit_logs';
```

**Add Indexes:**
```sql
-- Common query patterns
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_date 
ON audit_logs(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action 
ON audit_logs(action);

CREATE INDEX IF NOT EXISTS idx_audit_logs_severity 
ON audit_logs(severity) 
WHERE severity IN ('critical', 'high');
```

#### 2. Large Table Size

**Check Table Size:**
```sql
SELECT 
  pg_size_pretty(pg_total_relation_size('audit_logs')) as total_size,
  (SELECT COUNT(*) FROM audit_logs) as row_count;
```

**Solutions:**
- Archive old logs
- Implement table partitioning
- Enable auto-archival

**Archival Script:**
```sql
-- Move logs older than 90 days to archive
CREATE TABLE audit_logs_archive (LIKE audit_logs INCLUDING ALL);

INSERT INTO audit_logs_archive 
SELECT * FROM audit_logs 
WHERE created_at < NOW() - INTERVAL '90 days';

DELETE FROM audit_logs 
WHERE created_at < NOW() - INTERVAL '90 days';
```

#### 3. Inefficient Queries

**Use EXPLAIN ANALYZE:**
```sql
EXPLAIN ANALYZE
SELECT * FROM audit_logs 
WHERE tenant_id = 'your-tenant-id' 
ORDER BY created_at DESC 
LIMIT 50;
```

**Optimization:**
- Always use pagination
- Avoid `SELECT *`, specify needed columns
- Use appropriate indexes
- Consider materialized views for stats

#### 4. High Concurrency

**Monitor Connections:**
```sql
SELECT COUNT(*) as active_connections 
FROM pg_stat_activity 
WHERE datname = 'pulssdb';
```

**Solution:** Implement connection pooling:
```javascript
const pool = new Pool({
  max: 20, // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

---

## Authentication Errors

### Symptom
401 Unauthorized or 403 Forbidden errors.

### Solutions

#### 1. Invalid or Expired Token

**Error:** "Invalid token" or "Token expired"

**Check Token:**
```javascript
const jwt = require('jsonwebtoken');
try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log('Token valid:', decoded);
} catch (error) {
  console.error('Token invalid:', error.message);
}
```

**Solution:** Get a new token by logging in again.

#### 2. Insufficient Permissions

**Error:** "Insufficient permissions"

**Check Role:**
```sql
SELECT role FROM admins WHERE admin_id = 'your-admin-id';
```

**Required Roles:**
- View logs: `admin` or `super_admin`
- Update config: `super_admin`
- Create alerts: `super_admin`

#### 3. Missing Authorization Header

**Error:** "No token provided"

**Solution:** Include Authorization header:
```bash
curl -X GET "http://localhost:3000/api/audit-logs" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Database Errors

### Symptom
Database-related errors when accessing audit logs.

### Solutions

#### 1. Migration Not Run

**Error:** "relation 'audit_config' does not exist"

**Solution:** Run migrations:
```bash
cd backend
psql $DATABASE_URL -f migrations/12_advanced_audit_logging.sql
```

#### 2. Connection Pool Exhausted

**Error:** "Connection pool exhausted"

**Check Active Connections:**
```sql
SELECT * FROM pg_stat_activity WHERE state = 'active';
```

**Solution:**
- Increase pool size
- Check for connection leaks
- Ensure connections are properly released

#### 3. Constraint Violations

**Error:** "foreign key constraint violation"

**Common Causes:**
- Tenant doesn't exist
- Admin doesn't exist

**Solution:** Ensure referenced records exist:
```sql
-- Check if tenant exists
SELECT * FROM tenants WHERE tenant_id = 'your-tenant-id';

-- Check if admin exists
SELECT * FROM admins WHERE admin_id = 'your-admin-id';
```

#### 4. Deadlocks

**Error:** "deadlock detected"

**Solution:**
- Reduce transaction scope
- Use consistent lock order
- Implement retry logic

---

## Configuration Issues

### Symptom
Configuration changes not taking effect.

### Solutions

#### 1. Cache Not Cleared

**Solution:** Restart application or clear cache:
```bash
# Restart Node.js application
pm2 restart pulss-backend

# Or if using nodemon
# It should auto-restart on file changes
```

#### 2. Invalid Configuration Values

**Check Configuration:**
```sql
SELECT * FROM audit_config WHERE tenant_id = 'your-tenant-id';
```

**Common Issues:**
- `retention_days` out of range (1-3650)
- Invalid `compliance_mode` ('minimal', 'standard', 'strict')
- Negative `alert_threshold`

**Solution:** Update with valid values:
```sql
UPDATE audit_config 
SET retention_days = 365,
    compliance_mode = 'standard',
    alert_threshold = 10
WHERE tenant_id = 'your-tenant-id';
```

#### 3. Configuration Not Created

**Check if config exists:**
```sql
SELECT * FROM audit_config WHERE tenant_id = 'your-tenant-id';
```

**Create default config:**
```sql
INSERT INTO audit_config (tenant_id, enabled, compliance_mode)
VALUES ('your-tenant-id', true, 'standard')
ON CONFLICT (tenant_id) DO NOTHING;
```

---

## Frontend Issues

### Symptom
Frontend components not displaying audit logs correctly.

### Solutions

#### 1. API Endpoint Not Responding

**Check API:**
```bash
curl -X GET "http://localhost:3000/api/audit-logs" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Solution:** Verify backend is running and accessible.

#### 2. CORS Errors

**Error:** "CORS policy blocked"

**Check CORS Configuration:**
```javascript
// In app.js
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS.split(','),
  credentials: true
}));
```

**Solution:** Add frontend origin to allowed origins:
```bash
# .env
ALLOWED_ORIGINS=http://localhost:5173,https://app.pulss.com
```

#### 3. Date Format Issues

**Symptom:** Dates not displaying correctly.

**Solution:** Ensure consistent date format:
```javascript
// Use ISO 8601 format
const startDate = new Date('2025-01-01').toISOString();
const endDate = new Date('2025-01-31').toISOString();
```

#### 4. Pagination Not Working

**Check Pagination Parameters:**
```javascript
const { page, limit } = req.query;
console.log('Page:', page, 'Limit:', limit);
```

**Solution:** Ensure parameters are passed correctly:
```javascript
fetch(`/api/audit-logs?page=${page}&limit=${limit}`)
```

---

## Diagnostic Commands

### Quick Health Check

```bash
# Check if backend is running
curl http://localhost:3000/health

# Check database connection
psql $DATABASE_URL -c "SELECT NOW();"

# Check audit logs table
psql $DATABASE_URL -c "SELECT COUNT(*) FROM audit_logs;"

# Check recent logs
psql $DATABASE_URL -c "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 5;"
```

### Database Diagnostics

```sql
-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE tablename LIKE 'audit%'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as times_used,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE tablename = 'audit_logs'
ORDER BY idx_scan DESC;

-- Check slow queries
SELECT 
  query,
  calls,
  total_time / calls as avg_time,
  rows / calls as avg_rows
FROM pg_stat_statements
WHERE query LIKE '%audit_logs%'
ORDER BY total_time DESC
LIMIT 10;
```

### Performance Monitoring

```sql
-- Monitor active queries
SELECT 
  pid,
  now() - query_start as duration,
  state,
  query
FROM pg_stat_activity
WHERE query LIKE '%audit%'
  AND state != 'idle'
ORDER BY duration DESC;

-- Check cache hit ratio
SELECT 
  sum(heap_blks_read) as heap_read,
  sum(heap_blks_hit) as heap_hit,
  sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) as ratio
FROM pg_statio_user_tables
WHERE schemaname = 'public';
```

---

## Getting Help

### Before Requesting Support

1. Check this troubleshooting guide
2. Review error logs:
   ```bash
   # Backend logs
   tail -f logs/backend.log
   
   # Database logs
   tail -f /var/log/postgresql/postgresql-*.log
   ```
3. Try the diagnostic commands above
4. Document the issue with:
   - Error messages
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment (development/staging/production)

### Support Channels

- **Internal Support**: support@company.com
- **Security Issues**: security@company.com (urgent)
- **Documentation**: See AUDIT_LOGGING_SYSTEM.md
- **API Reference**: See API_DOCUMENTATION.md

### Emergency Issues

For critical security incidents or data breaches:

1. **Immediately contact**: security@company.com
2. **Phone**: +1-XXX-XXX-XXXX (24/7)
3. **Document everything**: Save logs, screenshots, error messages
4. **Don't modify data**: Until security team advises

---

**Last Updated**: October 2025  
**Version**: 1.0.0  
**Maintainer**: Pulss Platform Team
