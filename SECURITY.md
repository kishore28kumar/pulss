# Security Policy

## Overview

The Pulss White-Label E-Commerce Platform takes security seriously. This document outlines our security features, best practices, and how to report security vulnerabilities.

## Security Features

### 1. Authentication & Authorization

- **JWT-based Authentication**: Secure token-based authentication with configurable expiration
- **Role-Based Access Control (RBAC)**: Separate permissions for super_admin, admin, and customer roles
- **Password Hashing**: bcrypt with configurable salt rounds for secure password storage
- **Multi-tenant Isolation**: Strict tenant data separation at the database level

### 2. API Security

#### Rate Limiting & Brute-Force Protection

The platform implements multiple layers of rate limiting:

- **General API Limiter**: 100 requests per 15 minutes per IP
- **Authentication Endpoints**: 5 login attempts per 15 minutes per IP
- **Account Creation**: 3 accounts per hour per IP
- **Password Reset**: 3 attempts per hour per IP
- **Speed Limiter**: Gradually increases response time for repeated requests

#### Security Headers

Implemented via Helmet middleware:
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Frame-Options (clickjacking protection)
- X-Content-Type-Options (MIME sniffing protection)
- X-XSS-Protection
- Referrer-Policy
- Permissions-Policy

#### HTTPS Enforcement

- Automatic HTTP to HTTPS redirect in production
- HSTS header with 1-year max-age and preload directive
- Strict Transport Security for all subdomains

#### CORS (Cross-Origin Resource Sharing)

Hardened CORS configuration:
- Whitelist-based origin validation
- Credentials support for authenticated requests
- Limited HTTP methods (GET, POST, PUT, DELETE, PATCH)
- Specific allowed headers
- 24-hour preflight cache

### 3. Privacy & GDPR Compliance

#### User Consent Management
- Track user consent for marketing, analytics, and data processing
- Privacy policy and terms acceptance tracking
- Consent history with IP and user agent logging

#### Right to Access (GDPR Article 15)
- Users can view all data stored about them via the `/me` endpoint
- Audit logs track all access to user data

#### Right to Data Portability (GDPR Article 20)
- Users can request data export in JSON or CSV format
- Automated data export generation (implementation pending)
- Export downloads expire after 7 days
- Download tracking

#### Right to be Forgotten (GDPR Article 17)
- Users can request data deletion
- Admin review and approval workflow
- Audit trail of deletion requests
- Automated or manual deletion process

### 4. Audit Logging

Comprehensive audit trail system:
- All admin actions logged (create, update, delete operations)
- Authentication events (login, logout, failed attempts)
- IP address and user agent tracking
- Old and new values for data changes
- Queryable audit logs with filtering and pagination
- Export audit logs for compliance reporting

### 5. Database Security

- **Prepared Statements**: Protection against SQL injection
- **Connection Pooling**: Secure and efficient database connections
- **Row-Level Security**: Tenant isolation at the database level
- **Encrypted Connections**: SSL/TLS for database connections in production
- **Regular Backups**: Automated backup recommendations

### 6. File Upload Security

- File size limits (10MB default)
- File type validation
- Sanitized filenames
- Separate upload directory
- Path traversal protection

## Automated Security Scanning

### NPM Audit
```bash
npm run security:audit
```
Runs npm audit to check for known vulnerabilities in dependencies.

### Snyk Integration
```bash
npm run security:snyk
```
Advanced vulnerability scanning with Snyk (requires SNYK_TOKEN).

### GitHub Actions
Automated security scanning runs:
- On every push to main/develop branches
- On pull requests
- Weekly scheduled scans (Mondays at 9 AM UTC)
- Manual triggers via workflow_dispatch

Scans include:
- NPM audit for both frontend and backend
- Snyk vulnerability scanning
- CodeQL static analysis
- Dependency review on PRs

## Security Best Practices

### For Deployment

1. **Environment Variables**
   - Never commit `.env` files
   - Use strong, unique values for `JWT_SECRET`
   - Rotate secrets regularly
   - Use different secrets for dev/staging/production

2. **Database**
   - Use strong database passwords
   - Enable SSL/TLS connections
   - Restrict database access by IP
   - Regular backups
   - Keep PostgreSQL updated

3. **HTTPS**
   - Always use HTTPS in production
   - Obtain SSL/TLS certificates (Let's Encrypt recommended)
   - Enable HSTS preloading
   - Configure secure ciphers

4. **CORS**
   - Set `CORS_ORIGIN` to specific domains (comma-separated)
   - Never use wildcard (`*`) in production
   - Review and update allowed origins regularly

5. **Rate Limiting**
   - Adjust rate limits based on your traffic patterns
   - Monitor for abuse patterns
   - Consider IP whitelisting for trusted clients

6. **Dependencies**
   - Run `npm audit` before deployments
   - Keep all dependencies updated
   - Review security advisories
   - Use automated dependency updates (Dependabot)

### For Development

1. **Code Review**
   - All code changes require review
   - Security-focused review for authentication/authorization changes
   - Test security features thoroughly

2. **Secrets Management**
   - Use `.env.example` as template
   - Never log sensitive data
   - Use environment-specific configurations

3. **Testing**
   - Write security tests for critical endpoints
   - Test rate limiting behavior
   - Verify RBAC permissions
   - Test input validation

## API Security Endpoints

### Privacy & GDPR

```
POST   /api/privacy/consent                    # Update user consent
GET    /api/privacy/consent                    # Get user consent
POST   /api/privacy/data-export                # Request data export
GET    /api/privacy/data-export/:requestId     # Check export status
POST   /api/privacy/data-deletion              # Request data deletion
GET    /api/privacy/data-deletion/:requestId   # Check deletion status
```

### Audit Logs (Admin/Super Admin Only)

```
GET    /api/audit-logs                         # List audit logs
GET    /api/audit-logs/stats                   # Audit statistics
GET    /api/audit-logs/export                  # Export audit logs
GET    /api/audit-logs/:logId                  # Get specific log
```

## Reporting Security Issues

If you believe you have found a security vulnerability, please report it to us through coordinated disclosure.

**Please do not report security vulnerabilities through public GitHub issues, discussions, or pull requests.**

Instead, please email security details to the repository maintainers.

Please include as much of the information listed below as you can to help us better understand and resolve the issue:

- The type of issue (e.g., buffer overflow, SQL injection, or cross-site scripting)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit the issue

We will:
- Acknowledge receipt within 48 hours
- Provide a timeline for fixing the issue
- Credit you in the fix announcement (if desired)
- Keep you updated on progress

## Security Updates

- Security patches are released as soon as possible
- Critical vulnerabilities fixed within 24-48 hours
- Regular updates announced via GitHub releases
- Subscribe to repository notifications for alerts

## Compliance Certifications

The platform is designed to support:
- GDPR (General Data Protection Regulation)
- CCPA (California Consumer Privacy Act) - basic support
- HIPAA considerations for healthcare data (additional configuration required)

## Security Roadmap

Planned enhancements:
- [ ] Two-factor authentication (2FA)
- [ ] OAuth2/OpenID Connect integration
- [ ] Advanced intrusion detection
- [ ] Automated data export generation
- [ ] Enhanced encryption for sensitive data
- [ ] Security training documentation
- [ ] Penetration testing results

---

**Last Updated**: 2025-10-16
**Version**: 1.0.0

