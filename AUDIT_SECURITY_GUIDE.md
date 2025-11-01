# Audit Logging System - Security Guide

## Overview

This guide provides comprehensive security guidelines for the Audit Logging system in the Pulss White Label platform. It covers security best practices, compliance requirements, and operational procedures.

## Table of Contents

1. [Security Architecture](#security-architecture)
2. [Rate Limiting](#rate-limiting)
3. [Input Validation](#input-validation)
4. [Data Sanitization](#data-sanitization)
5. [Authentication & Authorization](#authentication--authorization)
6. [Compliance & Privacy](#compliance--privacy)
7. [Best Practices](#best-practices)
8. [Security Testing](#security-testing)

## Security Architecture

### Multi-Layer Protection

The audit logging system implements multiple layers of security:

```
┌─────────────────────────────────────────┐
│         Rate Limiting Layer             │  <- Prevents abuse
├─────────────────────────────────────────┤
│      Input Validation Layer             │  <- Validates all inputs
├─────────────────────────────────────────┤
│     Authentication Layer                │  <- Verifies identity
├─────────────────────────────────────────┤
│      Authorization Layer                │  <- Checks permissions
├─────────────────────────────────────────┤
│     Data Sanitization Layer             │  <- Removes sensitive data
├─────────────────────────────────────────┤
│        Database Layer                   │  <- Secure storage
└─────────────────────────────────────────┘
```

### Threat Model

The system protects against:

- **SQL Injection**: Input validation and parameterized queries
- **Rate Limiting Bypass**: Token bucket algorithm with distributed tracking
- **Privilege Escalation**: Role-based access control (RBAC)
- **Data Exposure**: Automatic sanitization of sensitive fields
- **Brute Force**: Progressive rate limiting and account lockout
- **Information Disclosure**: Minimal error messages in production

## Rate Limiting

### Implementation

All audit log endpoints are protected by rate limiters:

| Endpoint Type | Limit | Window | Purpose |
|--------------|-------|--------|---------|
| View Logs | 100 requests | 15 minutes | General viewing |
| Export | 10 requests | 1 hour | Resource-intensive operations |
| Config Update | 20 requests | 1 hour | Configuration changes |
| Alert Creation | 5 requests | 1 hour | Alert setup |

### Configuration

```javascript
// Rate limiter configuration
const auditLogsViewLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: req.rateLimit.resetTime
    });
  }
});
```

### Best Practices

1. **Monitor Rate Limit Events**: Track rate limit triggers for anomaly detection
2. **Adjust Limits**: Review and adjust limits based on legitimate usage patterns
3. **Whitelist Trusted IPs**: Consider whitelisting internal monitoring systems
4. **Use Distributed Storage**: For production, use Redis instead of in-memory storage

## Input Validation

### Validation Rules

All inputs are validated before processing:

#### UUID Validation
```javascript
// Valid UUIDs only
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
```

#### Date Validation
```javascript
// ISO 8601 format required
const isValidDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};
```

#### Enum Validation
```javascript
// Whitelist approach
const validActions = ['create', 'read', 'update', 'delete', 'login', 'logout'];
const validSeverities = ['info', 'warning', 'high', 'critical'];
const validStatuses = ['success', 'failure', 'error'];
```

### SQL Injection Prevention

**Always use parameterized queries:**

```javascript
// ✅ CORRECT - Parameterized query
const result = await pool.query(
  'SELECT * FROM audit_logs WHERE tenant_id = $1 AND action = $2',
  [tenantId, action]
);

// ❌ WRONG - String concatenation
const result = await pool.query(
  `SELECT * FROM audit_logs WHERE tenant_id = '${tenantId}'`
);
```

### Validation Middleware Usage

```javascript
// Apply validation to routes
router.get(
  '/api/audit-logs',
  auditLogsViewLimiter,
  validatePagination,
  validateAuditLogQuery,
  auditLogsController.getAuditLogs
);
```

## Data Sanitization

### Sensitive Fields

The system automatically redacts these field types:

#### Authentication & Security
- `password`, `password_hash`, `token`, `secret`, `api_key`
- `jwt`, `bearer`, `authorization`, `privateKey`

#### Payment & Financial
- `credit_card`, `card_number`, `cvv`, `cvc`
- `account_number`, `routing_number`, `iban`
- `payment_token`, `stripe_token`

#### Personal Identifiable Information
- `ssn`, `social_security`, `national_id`
- `passport`, `passport_number`
- `drivers_license`, `license_number`

#### Healthcare (HIPAA)
- `medical_record`, `health_card`
- `insurance_number`, `patient_id`

### Sanitization Algorithm

```javascript
// Recursive sanitization with pattern matching
function sanitizeData(data) {
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      if (isSensitiveField(key)) {
        // Partial redaction for long strings
        sanitized[key] = value.length > 8 
          ? `${value.substring(0, 2)}***${value.substring(value.length - 2)}`
          : '[REDACTED]';
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeData(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
  
  return data;
}
```

### Custom Sanitization

For domain-specific sensitive fields:

```javascript
// Add custom sensitive fields to the middleware
const customSensitiveFields = [
  'prescription_number',
  'medical_notes',
  'diagnosis_code'
];

// Extend the sanitization function
sensitiveFields.push(...customSensitiveFields);
```

## Authentication & Authorization

### Authentication Flow

```
1. User sends JWT token in Authorization header
2. authMiddleware validates token
3. Extracts user information (id, email, tenant_id, role)
4. Attaches to req.user
5. Proceeds to authorization check
```

### Role-Based Access Control

| Role | Permissions |
|------|-------------|
| **admin** | - View own tenant's audit logs<br>- Export own tenant's logs<br>- View compliance reports |
| **super_admin** | - View all tenants' audit logs<br>- Modify audit configuration<br>- Create alerts<br>- Access all features |

### Implementation

```javascript
// Authentication required for all routes
router.use(authMiddleware);
router.use(requireRole('admin', 'super_admin'));

// Super admin only routes
router.put('/config/settings', 
  requireRole('super_admin'), 
  auditConfigUpdateLimiter,
  validateAuditConfig,
  auditLogsController.updateAuditConfig
);
```

### Tenant Isolation

```javascript
// Automatic tenant filtering for admins
if (req.user.role === 'admin') {
  query += ' AND tenant_id = $1';
  values.push(req.user.tenant_id);
}

// Super admins can specify tenant
const tenantId = req.user.role === 'super_admin' 
  ? req.query.tenant_id 
  : req.user.tenant_id;
```

## Compliance & Privacy

### GDPR Compliance

The system implements:

1. **Right to Access**: Export functionality for data portability
2. **Right to Erasure**: Retention policies with automatic deletion
3. **Right to Rectification**: Audit trail of all changes
4. **Data Minimization**: Only essential data logged
5. **Purpose Limitation**: Logs used only for audit purposes
6. **Storage Limitation**: Configurable retention periods

### HIPAA Compliance

For healthcare data:

1. **Access Controls**: Role-based access with audit trails
2. **Audit Controls**: Comprehensive logging of all PHI access
3. **Integrity Controls**: Immutable audit logs (append-only)
4. **Transmission Security**: HTTPS/TLS required
5. **Retention**: 7-year retention for compliance

### Compliance Tags

Automatic tagging for compliance tracking:

```javascript
// Auto-generated based on resource type and action
const complianceTags = [
  'gdpr',        // EU data protection
  'hipaa',       // Healthcare data
  'pci',         // Payment data
  'soc2',        // Security controls
  'dpdp'         // India privacy law
];
```

## Best Practices

### 1. Secure Configuration

```javascript
// Environment-based configuration
const config = {
  // Use strong secrets
  jwtSecret: process.env.JWT_SECRET, // Never hardcode
  
  // Enable security headers
  helmet: true,
  
  // Restrict CORS
  cors: {
    origin: process.env.ALLOWED_ORIGINS.split(','),
    credentials: true
  },
  
  // Use HTTPS in production
  forceHttps: process.env.NODE_ENV === 'production'
};
```

### 2. Error Handling

```javascript
// Don't expose internal errors
try {
  // Operation
} catch (error) {
  console.error('Detailed error:', error); // Log internally
  res.status(500).json({ 
    error: 'Internal server error' // Generic message to client
  });
}
```

### 3. Logging Security Events

```javascript
// Always log critical security events
await logAuditEvent({
  tenantId,
  adminId,
  adminEmail,
  action: 'security_breach',
  resourceType: 'security',
  event: 'security.breach.detected',
  severity: 'critical',
  status: 'alert',
  description: 'Multiple failed login attempts detected',
  metadata: {
    attempt_count: 5,
    time_window: '5 minutes',
    ip_addresses: ['192.168.1.1', '192.168.1.2']
  }
});
```

### 4. Regular Security Reviews

Schedule regular reviews:

- **Weekly**: Critical and high-severity logs
- **Monthly**: Failed operations and security events
- **Quarterly**: Full compliance audit
- **Annually**: Security posture assessment

### 5. Backup Strategy

```bash
# Daily backups
pg_dump -h localhost -U postgres -d pulssdb \
  -t audit_logs \
  -t audit_config \
  -t audit_export_history \
  -f audit_backup_$(date +%Y%m%d).sql

# Encrypt backups
gpg --encrypt --recipient admin@company.com audit_backup_$(date +%Y%m%d).sql

# Store off-site
aws s3 cp audit_backup_$(date +%Y%m%d).sql.gpg s3://backups/audit/
```

## Security Testing

### Unit Tests

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- auditValidation.test.js

# Run with coverage
npm test -- --coverage
```

### Integration Tests

```bash
# Run integration tests
npm test -- __tests__/integration/

# Test rate limiting
npm test -- --testNamePattern="rate limit"
```

### Security Scanning

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Snyk scanning
snyk test --severity-threshold=high
```

### Penetration Testing

Test for common vulnerabilities:

1. **SQL Injection**: Try malicious inputs in all parameters
2. **Authentication Bypass**: Attempt to access endpoints without tokens
3. **Authorization Bypass**: Try to access other tenants' data
4. **Rate Limit Bypass**: Send requests faster than allowed
5. **Data Exposure**: Check for sensitive data in responses

### Sample Security Tests

```bash
# Test SQL injection protection
curl -X GET "http://localhost:3000/api/audit-logs?action=' OR '1'='1" \
  -H "Authorization: Bearer $TOKEN"

# Test rate limiting
for i in {1..101}; do
  curl -X GET "http://localhost:3000/api/audit-logs" \
    -H "Authorization: Bearer $TOKEN"
done

# Test invalid UUID
curl -X GET "http://localhost:3000/api/audit-logs/invalid-uuid" \
  -H "Authorization: Bearer $TOKEN"
```

## Incident Response

### Security Event Response

1. **Detection**: Monitor alerts for suspicious activity
2. **Investigation**: Review audit logs for the incident
3. **Containment**: Disable affected accounts/tokens
4. **Eradication**: Remove malicious access
5. **Recovery**: Restore normal operations
6. **Lessons Learned**: Update security measures

### Audit Log Access Breach

If audit logs are compromised:

1. **Immediate Actions**:
   - Rotate all JWT secrets
   - Force logout all users
   - Enable strict rate limiting
   - Review all super admin accounts

2. **Investigation**:
   - Check audit_logs for unauthorized access
   - Review audit_export_history for data exfiltration
   - Analyze IP addresses and user agents

3. **Notification**:
   - Notify affected tenants
   - Report to compliance officers
   - Document the incident

## Support & Resources

### Internal Resources
- Security Team: security@company.com
- Compliance Team: compliance@company.com
- DevOps Team: devops@company.com

### External Resources
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- GDPR Guidelines: https://gdpr.eu/
- HIPAA Security Rule: https://www.hhs.gov/hipaa/

### Emergency Contacts
- Security Incident: +1-XXX-XXX-XXXX
- Compliance Officer: +1-XXX-XXX-XXXX

---

**Last Updated**: October 2025  
**Version**: 1.0.0  
**Maintainer**: Pulss Security Team
