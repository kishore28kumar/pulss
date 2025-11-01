# Pulss Backend API

Node.js/Express backend for the Pulss multi-tenant e-commerce platform.

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- PostgreSQL >= 14
- npm >= 9.0.0

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Setup database
createdb pulssdb

# 3. Run migrations
psql -d pulssdb -f migrations/01_init_schema.sql
psql -d pulssdb -f seed/seed_data.sql

# 4. Configure environment
cp .env.example .env
# Edit .env with your database credentials

# 5. Start server
npm run dev
```

Or use the quick start script:
```bash
chmod +x quick-start.sh
./quick-start.sh
```

## 📁 Project Structure

```
backend/
├── config/
│   └── db.js              # Database connection
├── controllers/
│   ├── authController.js  # Authentication
│   ├── customersController.js
│   ├── transactionsController.js
│   └── rewardsController.js
├── middleware/
│   ├── auth.js            # JWT verification
│   └── tenant.js          # Multi-tenant isolation
├── routes/
│   ├── auth.js
│   ├── customers.js
│   ├── transactions.js
│   └── rewards.js
├── migrations/
│   └── 01_init_schema.sql
├── seed/
│   └── seed_data.sql
├── app.js                 # Express app
├── server.js              # Entry point
└── package.json
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register-admin` - Create tenant + admin (super admin only)
- `POST /api/auth/login` - Admin login
- `POST /api/auth/register-customer` - Register customer
- `POST /api/auth/login-customer` - Customer login
- `GET /api/auth/me` - Get current user

### Customers
- `GET /api/customers` - List customers
- `GET /api/customers/:id` - Get customer
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `GET /api/customers/:id/stats` - Customer stats

### Privacy & GDPR
- `GET /api/privacy/consent` - Get user consent
- `POST /api/privacy/consent` - Update user consent
- `POST /api/privacy/data-export` - Request data export
- `GET /api/privacy/data-export/:id` - Check export status
- `POST /api/privacy/data-deletion` - Request data deletion
- `GET /api/privacy/data-deletion/:id` - Check deletion status
- `GET /api/privacy/admin/data-deletion-requests` - List deletion requests (admin)
- `POST /api/privacy/admin/data-deletion-requests/:id/process` - Process deletion request (admin)

### Audit Logs
- `GET /api/audit-logs` - List audit logs (admin/super_admin)
- `GET /api/audit-logs/stats` - Audit statistics (admin/super_admin)
- `GET /api/audit-logs/export` - Export audit logs (admin/super_admin)
- `GET /api/audit-logs/:logId` - Get specific audit log (admin/super_admin)

### Transactions
- `GET /api/transactions` - List transactions
- `POST /api/transactions` - Create transaction & award points
- `GET /api/transactions/customer/:id` - Customer transactions

### Rewards
- `GET /api/rewards` - List rewards
- `POST /api/rewards` - Create reward
- `POST /api/rewards/redeem` - Redeem reward
- `GET /api/rewards/customer/:id/redemptions` - Customer redemptions

See [../API_DOCUMENTATION.md](../API_DOCUMENTATION.md) for full API reference.
See [../SECURITY_PRIVACY_GUIDE.md](../SECURITY_PRIVACY_GUIDE.md) for security features.

## 🔐 Authentication

Uses JWT (JSON Web Tokens) for authentication.

### Get Token
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'
```

### Use Token
```bash
curl http://localhost:3000/api/customers \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Token Structure
```javascript
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "admin|customer|super_admin",
  "tenant_id": "uuid"
}
```

## 🏢 Multi-Tenancy

### Tenant Isolation
- All data tables include `tenant_id`
- Middleware automatically filters by tenant
- Admins restricted to their tenant
- Super admin can access all tenants

### Tenant Detection
1. From JWT token (authenticated user)
2. From Host header (subdomain)
3. From query parameter (dev/testing)
4. From request body

## 🗄️ Database

### Connection
Uses `pg` (node-postgres) with connection pooling.

Configuration in `.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_NAME=pulssdb
```

### Migrations
```bash
# Run schema
npm run migrate:local

# Seed data
npm run seed:local
```

### Query Pattern
Always use parameterized queries:
```javascript
// ✅ CORRECT
await pool.query('SELECT * FROM customers WHERE tenant_id = $1', [tenantId])

// ❌ WRONG (SQL injection risk)
await pool.query(`SELECT * FROM customers WHERE tenant_id = '${tenantId}'`)
```

## 🔒 Security

### Enhanced Security Features

#### Rate Limiting & Brute-Force Protection
- **General API**: 100 requests per 15 minutes per IP
- **Authentication**: 5 login attempts per 15 minutes
- **Account Creation**: 3 accounts per hour
- **Speed Limiter**: Gradual slowdown for rapid requests

#### Security Headers (Helmet)
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Frame-Options (clickjacking protection)
- X-Content-Type-Options (MIME sniffing protection)
- X-XSS-Protection

#### HTTPS Enforcement
- Automatic HTTP to HTTPS redirect in production
- HSTS header with preload directive
- Strict Transport Security for subdomains

#### CORS Hardening
- Whitelist-based origin validation
- Configurable via `CORS_ORIGIN` environment variable
- Support for multiple origins (comma-separated)

### Password Hashing
- bcrypt with 10 rounds
- Passwords never stored in plain text

### JWT Secrets
- Strong secret in production
- Rotate regularly
- Store in environment variables

### Input Validation
- Validate all inputs
- Sanitize user data
- Use parameterized queries

### Audit Logging
- All admin actions logged
- Authentication events tracked
- IP address and user agent logging
- Queryable audit trail with filtering

See [../SECURITY.md](../SECURITY.md) for security policy.
See [../SECURITY_PRIVACY_GUIDE.md](../SECURITY_PRIVACY_GUIDE.md) for detailed implementation guide.

## 📝 Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_NAME=pulssdb

# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d

# Admin
SUPER_ADMIN_EMAIL=superadmin@pulss.app

# CORS (comma-separated for multiple origins)
CORS_ORIGIN=http://localhost:5173

# Security - Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5
ACCOUNT_CREATION_LIMIT_MAX=3

# HTTPS Enforcement
ENFORCE_HTTPS=false

# Security Scanning
SNYK_TOKEN=your_snyk_token
```

## 🧪 Testing

### Security Testing
```bash
# Test security features
node test-security.js
```

### Security Scanning
```bash
# NPM audit
npm run security:audit

# Fix vulnerabilities
npm run security:fix

# Snyk scan (requires SNYK_TOKEN)
npm run security:snyk
```

### Manual Testing
```bash
# Health check
curl http://localhost:3000/health

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@citypharmacy.com","password":"Password123!"}'

# Get customers (with token)
curl http://localhost:3000/api/customers \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Credentials
**Super Admin:**
- Email: `superadmin@pulss.app`
- Password: `Password123!`

**Tenant Admin:**
- Email: `admin@citypharmacy.com`
- Password: `Password123!`

**Customer:**
- Email: `customer1@example.com`
- Password: `Password123!`

## 📦 npm Scripts

```bash
npm start               # Start production server
npm run dev             # Start development server (nodemon)
npm run migrate         # Run migrations (requires DATABASE_URL)
npm run seed            # Seed database (requires DATABASE_URL)
npm run migrate:local   # Run migrations locally
npm run seed:local      # Seed data locally
npm test                # Run tests (TODO)
npm run lint            # Run linter (TODO)
npm run security:audit  # Run npm audit
npm run security:fix    # Fix security vulnerabilities
npm run security:check  # Complete security check
npm run security:snyk   # Run Snyk security scan
```

## 🐳 Docker

### Build Image
```bash
docker build -t pulss-api .
```

### Run Container
```bash
docker run -p 3000:3000 \
  -e DB_HOST=host.docker.internal \
  -e DB_PASSWORD=yourpassword \
  pulss-api
```

### With Docker Compose
```bash
# From project root
docker-compose up --build
```

## 🚀 Deployment

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Use strong `JWT_SECRET` (min 32 characters)
- [ ] Configure proper CORS origin (no wildcards)
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Set `ENFORCE_HTTPS=true`
- [ ] Setup database backups
- [ ] Configure logging (consider external service)
- [ ] Add monitoring (Prometheus, Grafana, etc.)
- [ ] Setup error tracking (Sentry, etc.)
- [ ] Configure rate limiting appropriately
- [ ] Secure database credentials (use secrets manager)
- [ ] Run security audit: `npm run security:audit`
- [ ] Review and test GDPR compliance features
- [ ] Configure audit log retention policy
- [ ] Setup automated security scanning
- [ ] Review and update dependencies regularly

### VPS Deployment
See [../CONVERSION_README.md](../CONVERSION_README.md) for detailed deployment instructions.

## 🔍 Debugging

### Enable Debug Logs
```bash
DEBUG=* npm run dev
```

### Check Database Connection
```bash
node -e "const {pool} = require('./config/db'); pool.query('SELECT NOW()').then(r => console.log(r.rows))"
```

### View Logs
```bash
# Development
npm run dev

# Production (with PM2)
pm2 logs pulss-api

# Docker
docker-compose logs -f api
```

## 🤝 Contributing

1. Follow existing code style
2. Use async/await for async operations
3. Always use parameterized queries
4. Add error handling
5. Document new endpoints
6. Test before committing

## 📚 Documentation

- [API Documentation](../API_DOCUMENTATION.md)
- [Security & Privacy Guide](../SECURITY_PRIVACY_GUIDE.md)
- [Security Policy](../SECURITY.md)
- [Conversion Guide](../CONVERSION_README.md)
- [Frontend Migration](../FRONTEND_CONVERSION.md)
- [Summary](../CONVERSION_SUMMARY.md)

## ⚖️ License

MIT

---

**Pulss Backend API** - Built with Node.js, Express, and PostgreSQL
