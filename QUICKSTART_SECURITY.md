# Quick Start - Security & Privacy Features

This guide helps you quickly set up and test the new security and privacy features.

## Installation

### 1. Install Dependencies

```bash
cd backend
npm install
```

This installs:
- `express-rate-limit` - API rate limiting
- `express-slow-down` - Speed limiting
- Other existing dependencies

### 2. Apply Database Migration

```bash
# PostgreSQL
psql -d pulssdb -f migrations/10_gdpr_privacy_controls.sql

# Or using npm script
npm run migrate:local
```

This creates tables for:
- User consents
- Data export requests
- Data deletion requests

### 3. Configure Environment

Update `backend/.env`:

```env
# CORS - Add your domains (comma-separated)
CORS_ORIGIN=http://localhost:5173,https://yourdomain.com

# HTTPS Enforcement (set to true in production)
ENFORCE_HTTPS=false

# Optional: Snyk token for advanced scanning
SNYK_TOKEN=your_snyk_token
```

## Testing

### Quick Security Test

```bash
cd backend
npm run dev

# In another terminal
node test-security.js
```

Expected output:
- ✓ Health endpoint working
- ✓ Security headers present
- ✓ Rate limiting configured
- ✓ CORS headers present

### Test Features Manually

#### 1. Test Rate Limiting

```bash
# Make multiple rapid requests
for i in {1..10}; do
  curl http://localhost:3000/health
  echo ""
done
```

Should see rate limit headers in responses.

#### 2. Test Login with Audit Logging

```bash
# Login (creates audit log)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@pulss.app",
    "password": "Password123!"
  }'
```

#### 3. Test Privacy Features

**Get Consent:**
```bash
curl http://localhost:3000/api/privacy/consent \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Update Consent:**
```bash
curl -X POST http://localhost:3000/api/privacy/consent \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "marketing_consent": true,
    "analytics_consent": true,
    "privacy_policy_version": "1.0"
  }'
```

**Request Data Export:**
```bash
curl -X POST http://localhost:3000/api/privacy/data-export \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"format": "json"}'
```

**Request Data Deletion:**
```bash
curl -X POST http://localhost:3000/api/privacy/data-deletion \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "No longer need the service"
  }'
```

#### 4. Test Audit Logs (Admin)

```bash
# Get audit logs
curl http://localhost:3000/api/audit-logs \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Get audit statistics
curl http://localhost:3000/api/audit-logs/stats \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Export audit logs
curl http://localhost:3000/api/audit-logs/export?format=csv \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Security Scanning

```bash
cd backend

# Run npm audit
npm run security:audit

# Fix vulnerabilities
npm run security:fix

# Run Snyk (requires SNYK_TOKEN)
npm run security:snyk
```

## Verify Features

### Check Security Headers

```bash
curl -I http://localhost:3000/health
```

Look for:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` (in production)

### Check Rate Limiting

```bash
# Should show rate limit headers
curl -I http://localhost:3000/api/auth/login
```

Look for:
- `RateLimit-Limit`
- `RateLimit-Remaining`
- `RateLimit-Reset`

### Check Audit Logs in Database

```bash
psql -d pulssdb -c "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 5;"
```

Should show recent login attempts and admin actions.

### Check Privacy Tables

```bash
psql -d pulssdb -c "SELECT * FROM user_consents LIMIT 5;"
psql -d pulssdb -c "SELECT * FROM data_export_requests LIMIT 5;"
psql -d pulssdb -c "SELECT * FROM data_deletion_requests LIMIT 5;"
```

## Production Deployment

### 1. Environment Setup

```env
NODE_ENV=production
ENFORCE_HTTPS=true
CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com
JWT_SECRET=<strong-random-secret-min-32-chars>
```

### 2. HTTPS Certificate

```bash
# Using Let's Encrypt
sudo certbot --nginx -d yourdomain.com -d app.yourdomain.com
```

### 3. Apply Migrations

```bash
psql $DATABASE_URL -f migrations/10_gdpr_privacy_controls.sql
```

### 4. Start Server

```bash
# With PM2
pm2 start server.js --name pulss-api

# Or with Docker
docker-compose up -d
```

### 5. Verify Production

```bash
# Check HTTPS redirect
curl -I http://yourdomain.com/health

# Check security headers
curl -I https://yourdomain.com/health

# Test rate limiting
curl -I https://yourdomain.com/api/auth/login
```

## GitHub Actions

Security scanning runs automatically:
- On push to main/develop
- On pull requests
- Weekly (Mondays 9 AM UTC)

### Manual Trigger

1. Go to GitHub repository
2. Click "Actions" tab
3. Select "Security Scanning"
4. Click "Run workflow"

### Setup Snyk (Optional)

1. Create account at [snyk.io](https://snyk.io)
2. Get API token from account settings
3. Add to GitHub Secrets:
   - Go to Settings → Secrets → Actions
   - Add `SNYK_TOKEN` secret

## Troubleshooting

### Rate Limit Too Strict

Edit `backend/middleware/rateLimiter.js`:
```javascript
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200, // Increase from 100
  // ...
});
```

### CORS Errors

Check `CORS_ORIGIN` environment variable:
```env
CORS_ORIGIN=http://localhost:5173,https://yourdomain.com
```

### Audit Logs Not Appearing

1. Check database connection
2. Verify migration was applied
3. Check server logs for errors

### Migration Fails

```bash
# Check if table already exists
psql -d pulssdb -c "\dt public.user_consents"

# Drop and recreate if needed
psql -d pulssdb -c "DROP TABLE IF EXISTS user_consents CASCADE;"
psql -d pulssdb -f migrations/10_gdpr_privacy_controls.sql
```

## Documentation

- **Complete Guide**: [SECURITY_PRIVACY_GUIDE.md](./SECURITY_PRIVACY_GUIDE.md)
- **Implementation Summary**: [SECURITY_IMPLEMENTATION_SUMMARY.md](./SECURITY_IMPLEMENTATION_SUMMARY.md)
- **Security Policy**: [SECURITY.md](./SECURITY.md)
- **API Docs**: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## Support

For issues:
1. Check troubleshooting section above
2. Review documentation
3. Check GitHub Issues
4. Contact maintainers

---

**Quick Reference**

| Feature | Endpoint | Auth Required |
|---------|----------|--------------|
| User Consent | `GET/POST /api/privacy/consent` | Yes |
| Data Export | `POST /api/privacy/data-export` | Yes |
| Data Deletion | `POST /api/privacy/data-deletion` | Yes |
| Audit Logs | `GET /api/audit-logs` | Admin |
| Health Check | `GET /health` | No |

**Testing Commands**
```bash
# Security test
node backend/test-security.js

# NPM audit
npm run security:audit

# Start backend
cd backend && npm run dev
```

Ready to go! 🚀
