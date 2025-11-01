# Security & Privacy Implementation Guide

This guide explains how to use the security, privacy, and compliance features in the Pulss platform.

## Table of Contents

1. [Security Features](#security-features)
2. [Privacy & GDPR Compliance](#privacy--gdpr-compliance)
3. [Audit Logging](#audit-logging)
4. [Rate Limiting Configuration](#rate-limiting-configuration)
5. [Security Scanning](#security-scanning)

## Security Features

### Rate Limiting

The platform implements multiple rate limiters to protect against abuse:

#### General API Rate Limiter
- **Limit**: 100 requests per 15 minutes per IP
- **Applies to**: All API endpoints
- **Headers**: `RateLimit-*` headers in responses

#### Authentication Rate Limiter
- **Limit**: 5 login attempts per 15 minutes per IP
- **Applies to**: `/api/auth/login`, `/api/auth/login-customer`
- **Behavior**: Skips counting successful logins

#### Account Creation Rate Limiter
- **Limit**: 3 accounts per hour per IP
- **Applies to**: `/api/auth/register-admin`, `/api/auth/register-customer`

#### Speed Limiter
- **Behavior**: Adds increasing delay after 50 requests in 15 minutes
- **Max Delay**: 20 seconds
- **Applies to**: All requests

### Security Headers

All responses include these security headers via Helmet:

```
Content-Security-Policy: default-src 'self'; ...
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
```

### HTTPS Enforcement

In production (`NODE_ENV=production`):
- HTTP requests automatically redirect to HTTPS
- HSTS header forces browsers to use HTTPS
- Preload directive for HSTS preload list

### CORS Configuration

Whitelist-based CORS validation:

```env
# Single origin
CORS_ORIGIN=https://yourdomain.com

# Multiple origins (comma-separated)
CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com,http://localhost:5173
```

## Privacy & GDPR Compliance

### User Consent Management

Track user consent for different data processing purposes.

#### Get User Consent
```http
GET /api/privacy/consent
Authorization: Bearer <token>
```

Response:
```json
{
  "consent": {
    "consent_id": "uuid",
    "user_id": "uuid",
    "marketing_consent": false,
    "analytics_consent": true,
    "data_processing_consent": true,
    "third_party_sharing_consent": false,
    "privacy_policy_version": "1.0",
    "privacy_policy_accepted_at": "2025-10-16T00:00:00Z",
    "created_at": "2025-10-16T00:00:00Z"
  }
}
```

#### Update User Consent
```http
POST /api/privacy/consent
Authorization: Bearer <token>
Content-Type: application/json

{
  "marketing_consent": true,
  "analytics_consent": true,
  "data_processing_consent": true,
  "third_party_sharing_consent": false,
  "privacy_policy_version": "1.0",
  "terms_version": "1.0"
}
```

### Data Export (GDPR Article 20)

Users can request a complete export of their data.

#### Request Data Export
```http
POST /api/privacy/data-export
Authorization: Bearer <token>
Content-Type: application/json

{
  "format": "json"  // or "csv"
}
```

Response:
```json
{
  "success": true,
  "request": {
    "request_id": "uuid",
    "status": "pending",
    "export_format": "json",
    "requested_at": "2025-10-16T00:00:00Z"
  },
  "message": "Data export request created..."
}
```

#### Check Export Status
```http
GET /api/privacy/data-export/{requestId}
Authorization: Bearer <token>
```

### Data Deletion (GDPR Article 17)

Users can request deletion of their account and data.

#### Request Data Deletion
```http
POST /api/privacy/data-deletion
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "No longer need the service",
  "phone": "+1234567890"
}
```

Response:
```json
{
  "success": true,
  "request": {
    "request_id": "uuid",
    "status": "pending",
    "requested_at": "2025-10-16T00:00:00Z"
  },
  "message": "Data deletion request created..."
}
```

#### Check Deletion Status
```http
GET /api/privacy/data-deletion/{requestId}
Authorization: Bearer <token>
```

### Admin: Manage Deletion Requests

#### List Deletion Requests
```http
GET /api/privacy/admin/data-deletion-requests?status=pending&page=1&limit=20
Authorization: Bearer <admin-token>
```

#### Process Deletion Request
```http
POST /api/privacy/admin/data-deletion-requests/{requestId}/process
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "action": "approve",  // or "reject"
  "rejection_reason": "Optional reason for rejection"
}
```

## Audit Logging

All admin and critical user actions are automatically logged.

### View Audit Logs (Admin/Super Admin only)

#### List Audit Logs
```http
GET /api/audit-logs?page=1&limit=50&action=login&resource_type=admin
Authorization: Bearer <admin-token>
```

Query Parameters:
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 50, max: 100)
- `action`: Filter by action (login, create, update, delete, etc.)
- `resource_type`: Filter by resource (admin, customer, product, order, etc.)
- `admin_id`: Filter by admin ID
- `status`: Filter by status (success, failure)
- `start_date`: Filter from date (ISO 8601)
- `end_date`: Filter to date (ISO 8601)

Response:
```json
{
  "logs": [
    {
      "log_id": "uuid",
      "admin_email": "admin@example.com",
      "action": "login",
      "resource_type": "authentication",
      "ip_address": "192.168.1.1",
      "status": "success",
      "created_at": "2025-10-16T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "pages": 2
  }
}
```

#### Get Audit Statistics
```http
GET /api/audit-logs/stats?start_date=2025-10-01&end_date=2025-10-31
Authorization: Bearer <admin-token>
```

#### Export Audit Logs
```http
GET /api/audit-logs/export?format=csv&start_date=2025-10-01
Authorization: Bearer <admin-token>
```

### Logged Events

Automatically logged:
- ✓ Admin login/logout
- ✓ Customer login
- ✓ Failed login attempts
- ✓ Admin creation
- ✓ User consent updates
- ✓ Data export requests
- ✓ Data deletion requests

To add logging to your controllers:
```javascript
const { logAudit } = require('../middleware/auditLog');

// In your controller
await logAudit(
  req,                           // Request object
  'update',                      // Action
  'product',                     // Resource type
  productId,                     // Resource ID
  'Product price updated',       // Description
  { price: 100 },               // Old values
  { price: 120 }                // New values
);
```

## Rate Limiting Configuration

Customize rate limits via environment variables:

```env
# Rate limiting windows (in milliseconds)
RATE_LIMIT_WINDOW_MS=900000          # 15 minutes

# General API rate limit
RATE_LIMIT_MAX_REQUESTS=100          # requests per window

# Auth endpoints
AUTH_RATE_LIMIT_MAX=5                # login attempts per window

# Account creation
ACCOUNT_CREATION_LIMIT_MAX=3         # accounts per hour
```

Or modify in `backend/middleware/rateLimiter.js`:

```javascript
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,           // Change window
  max: 100,                            // Change max requests
  // ... other options
});
```

## Security Scanning

### Manual Scanning

Run security scans locally:

```bash
# NPM audit
cd backend
npm run security:audit

# Fix vulnerabilities automatically
npm run security:fix

# Snyk scan (requires SNYK_TOKEN)
npm run security:snyk
```

### Automated Scanning

GitHub Actions workflow runs automatically:
- On push to main/develop
- On pull requests
- Weekly (Mondays at 9 AM UTC)
- Manual trigger via GitHub Actions UI

#### Setup Snyk Integration

1. Create account at [snyk.io](https://snyk.io)
2. Get your Snyk token from account settings
3. Add to GitHub repository secrets:
   - Go to Settings → Secrets → Actions
   - Add `SNYK_TOKEN` with your token value

#### View Scan Results

1. Go to Actions tab in GitHub
2. Click on "Security Scanning" workflow
3. View results for NPM Audit, Snyk, and CodeQL

## Best Practices

### For Production

1. **Strong Secrets**
   ```env
   JWT_SECRET=<generate-with-openssl-rand-base64-32>
   ```

2. **HTTPS Only**
   ```env
   NODE_ENV=production
   ENFORCE_HTTPS=true
   ```

3. **Specific CORS Origins**
   ```env
   CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com
   ```

4. **Regular Updates**
   ```bash
   npm audit fix
   npm update
   ```

### For Development

1. **Use .env.example as template**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

2. **Test security features**
   ```bash
   node test-security.js
   ```

3. **Review audit logs regularly**
   - Check for unusual patterns
   - Monitor failed login attempts
   - Track admin actions

## Troubleshooting

### Rate Limit Issues

If legitimate users are hitting rate limits:
1. Increase limits in `rateLimiter.js`
2. Implement user-based rate limiting (not just IP)
3. Add IP whitelisting for trusted sources

### CORS Errors

If getting CORS errors:
1. Check `CORS_ORIGIN` environment variable
2. Ensure frontend origin is in whitelist
3. Check browser console for specific error
4. Verify credentials are being sent

### Audit Log Performance

For high-volume audit logs:
1. Enable table partitioning (see migration comments)
2. Archive old logs regularly
3. Use appropriate indexes
4. Consider separate audit database

## Support

For security issues, see [SECURITY.md](../SECURITY.md)

For general questions, see [README.md](../README.md)
