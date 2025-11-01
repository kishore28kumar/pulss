# Multi-Tenancy Deployment Checklist

Use this checklist when deploying the multi-tenant application to production.

## Pre-Deployment

### Database Setup

- [ ] **Create production database**
  - [ ] PostgreSQL 12+ installed and running
  - [ ] Database created with proper user permissions
  - [ ] Connection string configured in environment

- [ ] **Run all migrations in order**
  ```bash
  psql $DATABASE_URL -f backend/migrations/01_init_schema.sql
  psql $DATABASE_URL -f backend/migrations/02_advanced_features.sql
  # ... run all other migrations
  psql $DATABASE_URL -f backend/migrations/11_enhance_multi_tenancy.sql
  ```

- [ ] **Verify database schema**
  ```bash
  # Check all tables exist
  psql $DATABASE_URL -c "\dt"
  
  # Verify tenant-scoped tables have tenant_id
  psql $DATABASE_URL -c "\d products"
  psql $DATABASE_URL -c "\d orders"
  ```

- [ ] **Check indexes**
  ```bash
  # Verify tenant_id indexes exist
  psql $DATABASE_URL -c "\di" | grep tenant
  ```

### Environment Configuration

- [ ] **Set required environment variables**
  ```bash
  # Required
  export JWT_SECRET="<strong-random-secret-key>"
  export DATABASE_URL="postgresql://user:pass@host:5432/dbname"
  
  # Recommended
  export BASE_URL="https://yourdomain.com"
  export NODE_ENV="production"
  export PORT="5000"
  ```

- [ ] **Generate strong JWT secret**
  ```bash
  # Example: Generate 64-character random string
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

- [ ] **Configure CORS origins**
  - Update `middleware/security.js` with production domain
  - Set allowed origins for cross-origin requests

- [ ] **Set up SSL/TLS certificates**
  - [ ] Obtain SSL certificate (Let's Encrypt, etc.)
  - [ ] Configure HTTPS in reverse proxy (nginx, Apache)
  - [ ] Verify HTTPS enforcement middleware is enabled

### Application Setup

- [ ] **Install dependencies**
  ```bash
  cd backend
  npm ci --production
  ```

- [ ] **Build application** (if using TypeScript/transpilation)
  ```bash
  npm run build
  ```

- [ ] **Validate code syntax**
  ```bash
  node -c app.js
  node -c controllers/authController.js
  node -c utils/tenantIsolation.js
  ```

- [ ] **Run validation script**
  ```bash
  node backend/validate-multi-tenancy.js
  ```

## Initial Setup

### Create Super Admin

- [ ] **Create super admin account**
  ```bash
  # Option 1: Use SQL
  psql $DATABASE_URL -c "
    INSERT INTO admins (admin_id, email, password_hash, role, is_active)
    VALUES (
      gen_random_uuid(),
      'superadmin@yourdomain.com',
      '$2b$12$<bcrypt-hashed-password>',
      'super_admin',
      true
    );
  "
  
  # Option 2: Use registration endpoint
  curl -X POST https://yourdomain.com/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{
      "email": "superadmin@yourdomain.com",
      "password": "StrongPassword123!",
      "role": "super_admin"
    }'
  ```

- [ ] **Test super admin login**
  ```bash
  curl -X POST https://yourdomain.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "superadmin@yourdomain.com",
      "password": "StrongPassword123!"
    }'
  ```

### Create First Tenant

- [ ] **Create test tenant**
  ```bash
  curl -X POST https://yourdomain.com/api/tenants \
    -H "Authorization: Bearer <super-admin-token>" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Test Store",
      "admin_email": "admin@teststore.com",
      "business_type": "pharmacy",
      "theme_id": "medical"
    }'
  ```

- [ ] **Save tenant_id and setup_code** from response

- [ ] **Verify tenant created**
  ```bash
  curl -X GET https://yourdomain.com/api/tenants \
    -H "Authorization: Bearer <super-admin-token>"
  ```

## Testing

### Functional Testing

- [ ] **Test authentication**
  - [ ] Super admin login
  - [ ] Admin login
  - [ ] Customer login
  - [ ] Invalid credentials rejection
  - [ ] JWT token generation and validation

- [ ] **Test tenant isolation**
  - [ ] Create two tenants
  - [ ] Login as admin of tenant A
  - [ ] Attempt to access tenant B data → Should fail (403)
  - [ ] Verify no data leakage between tenants

- [ ] **Test CRUD operations**
  - [ ] Create product for tenant A
  - [ ] List products for tenant A
  - [ ] Update product for tenant A
  - [ ] Delete product for tenant A
  - [ ] Verify tenant B cannot see tenant A products

- [ ] **Test role-based access**
  - [ ] Super admin can access all tenants
  - [ ] Admin can only access own tenant
  - [ ] Customer can only access customer endpoints
  - [ ] Unauthorized access rejected (401/403)

### Security Testing

- [ ] **Test SQL injection prevention**
  ```bash
  # Try SQL injection in various parameters
  curl -X GET "https://yourdomain.com/api/products/tenants/'; DROP TABLE tenants; --"
  # Should be safely handled
  ```

- [ ] **Test authentication bypass attempts**
  - [ ] Access protected endpoints without token → 401
  - [ ] Use invalid/expired token → 401
  - [ ] Tamper with JWT token → 401

- [ ] **Test cross-tenant access**
  - [ ] Manipulate tenant_id in requests
  - [ ] Should be blocked by middleware
  - [ ] Audit logs should show attempts (if logging enabled)

- [ ] **Test rate limiting**
  - [ ] Send many requests rapidly
  - [ ] Verify rate limiting kicks in
  - [ ] Check different endpoints have appropriate limits

### Performance Testing

- [ ] **Load test with multiple tenants**
  ```bash
  # Use tools like Apache Bench, k6, or Artillery
  ab -n 1000 -c 10 https://yourdomain.com/api/products/tenants/<tenant-id>
  ```

- [ ] **Monitor database query performance**
  ```sql
  -- Enable slow query log
  -- Check for missing indexes
  EXPLAIN ANALYZE SELECT * FROM products WHERE tenant_id = '<uuid>';
  ```

- [ ] **Verify index usage**
  ```sql
  -- Should use idx_products_tenant index
  EXPLAIN SELECT * FROM products WHERE tenant_id = '<uuid>';
  ```

## Production Deployment

### Server Configuration

- [ ] **Set up reverse proxy** (nginx/Apache)
  - [ ] Configure SSL/TLS
  - [ ] Set up domain/subdomains
  - [ ] Configure proxy headers
  - [ ] Enable gzip compression

- [ ] **Configure process manager** (PM2/systemd)
  ```bash
  # Example with PM2
  pm2 start server.js --name pulss-backend
  pm2 save
  pm2 startup
  ```

- [ ] **Set up monitoring**
  - [ ] Application monitoring (PM2, New Relic, etc.)
  - [ ] Server monitoring (CPU, memory, disk)
  - [ ] Database monitoring (connections, queries)
  - [ ] Error tracking (Sentry, Rollbar, etc.)

- [ ] **Configure logging**
  - [ ] Application logs to file/service
  - [ ] Access logs from reverse proxy
  - [ ] Error logs with stack traces
  - [ ] Log rotation configured

### DNS Configuration

- [ ] **Set up primary domain**
  - [ ] A record: yourdomain.com → server IP
  - [ ] AAAA record (if using IPv6)

- [ ] **Set up subdomain wildcarding** (if using subdomains)
  - [ ] Wildcard A record: *.yourdomain.com → server IP
  - [ ] Test: tenant1.yourdomain.com resolves

- [ ] **Configure SSL for wildcards**
  - [ ] Wildcard SSL certificate
  - [ ] Or separate certificates per subdomain

### Backup & Recovery

- [ ] **Set up automated backups**
  ```bash
  # Example daily backup script
  pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
  ```

- [ ] **Test backup restoration**
  ```bash
  # Restore to test database
  psql test_database < backup-20240101.sql
  ```

- [ ] **Configure backup retention**
  - [ ] Daily backups kept for 7 days
  - [ ] Weekly backups kept for 4 weeks
  - [ ] Monthly backups kept for 12 months

- [ ] **Document recovery procedure**
  - [ ] Steps to restore from backup
  - [ ] RTO (Recovery Time Objective)
  - [ ] RPO (Recovery Point Objective)

## Post-Deployment

### Monitoring & Alerts

- [ ] **Set up health check monitoring**
  ```bash
  # Ping health endpoint every 5 minutes
  curl https://yourdomain.com/health
  ```

- [ ] **Configure alerts**
  - [ ] Server down alert
  - [ ] High CPU/memory alert
  - [ ] Database connection errors
  - [ ] High error rate
  - [ ] Slow response times

- [ ] **Set up uptime monitoring**
  - [ ] Use service like UptimeRobot, Pingdom
  - [ ] Monitor from multiple locations
  - [ ] Alert via email/SMS/Slack

### Documentation

- [ ] **Document production environment**
  - [ ] Server specifications
  - [ ] Database configuration
  - [ ] Environment variables
  - [ ] DNS settings
  - [ ] SSL certificate details

- [ ] **Create runbook**
  - [ ] Common issues and solutions
  - [ ] Deployment procedure
  - [ ] Rollback procedure
  - [ ] Emergency contacts

- [ ] **Train team members**
  - [ ] Share multi-tenancy documentation
  - [ ] Conduct demo of admin features
  - [ ] Review security best practices
  - [ ] Practice incident response

### Maintenance Plan

- [ ] **Schedule regular maintenance**
  - [ ] Database vacuum/optimize
  - [ ] Log rotation and cleanup
  - [ ] Dependency updates
  - [ ] Security patches

- [ ] **Plan for scaling**
  - [ ] Database read replicas
  - [ ] Load balancer configuration
  - [ ] CDN for static assets
  - [ ] Caching strategy (Redis)

- [ ] **Monitor tenant growth**
  - [ ] Track number of tenants
  - [ ] Monitor storage usage per tenant
  - [ ] Review subscription plans
  - [ ] Plan capacity upgrades

## Security Checklist

### Application Security

- [ ] **Input validation enabled**
  - [ ] All user inputs sanitized
  - [ ] SQL injection prevention (parameterized queries)
  - [ ] XSS prevention
  - [ ] CSRF protection (if applicable)

- [ ] **Authentication security**
  - [ ] Strong password requirements
  - [ ] Passwords hashed with bcrypt (12+ rounds)
  - [ ] JWT secret is strong and secret
  - [ ] Tokens expire appropriately (7 days)
  - [ ] Refresh token strategy (optional)

- [ ] **Authorization security**
  - [ ] All endpoints protected with authMiddleware
  - [ ] Role-based access enforced
  - [ ] Tenant isolation middleware applied
  - [ ] Super admin access audited

### Infrastructure Security

- [ ] **HTTPS enforced**
  - [ ] HTTP redirects to HTTPS
  - [ ] HSTS header enabled
  - [ ] Strong SSL/TLS configuration

- [ ] **Firewall configured**
  - [ ] Only necessary ports open (80, 443, SSH)
  - [ ] Database port restricted to localhost
  - [ ] SSH key authentication only

- [ ] **Security headers enabled**
  - [ ] X-Content-Type-Options: nosniff
  - [ ] X-Frame-Options: DENY
  - [ ] X-XSS-Protection: 1; mode=block
  - [ ] Content-Security-Policy configured

### Data Security

- [ ] **Database security**
  - [ ] Strong database password
  - [ ] Database not exposed to internet
  - [ ] Encrypted connections (SSL)
  - [ ] Regular backups encrypted

- [ ] **Sensitive data protection**
  - [ ] API keys in environment variables
  - [ ] No secrets in code/repository
  - [ ] Payment data handled securely
  - [ ] PII data encrypted at rest (if applicable)

- [ ] **Compliance**
  - [ ] GDPR compliance (if applicable)
  - [ ] Data retention policies
  - [ ] Privacy policy published
  - [ ] Terms of service published

## Launch Checklist

### Final Verification

- [ ] **Run full test suite**
  ```bash
  npm test
  ```

- [ ] **Verify all environment variables set**
  ```bash
  echo $JWT_SECRET
  echo $DATABASE_URL
  echo $NODE_ENV
  ```

- [ ] **Check logs for errors**
  ```bash
  tail -f /var/log/pulss/error.log
  ```

- [ ] **Verify external services**
  - [ ] Email service (if configured)
  - [ ] SMS service (if configured)
  - [ ] Payment gateway (if configured)
  - [ ] File storage (if configured)

### Go Live

- [ ] **Announce maintenance window** (if updating existing system)

- [ ] **Deploy to production**
  ```bash
  git pull origin main
  npm ci --production
  pm2 restart pulss-backend
  ```

- [ ] **Verify deployment**
  ```bash
  curl https://yourdomain.com/health
  # Should return: {"status":"healthy"}
  ```

- [ ] **Monitor logs for 30 minutes**
  - [ ] Watch for errors
  - [ ] Check response times
  - [ ] Verify tenant requests working

- [ ] **Test critical paths**
  - [ ] User registration
  - [ ] User login
  - [ ] Create tenant
  - [ ] Create product
  - [ ] Create order
  - [ ] Payment processing (if applicable)

### Post-Launch

- [ ] **Announce launch** to users

- [ ] **Monitor closely for 24-48 hours**
  - [ ] Watch error rates
  - [ ] Monitor performance
  - [ ] Check user feedback
  - [ ] Be ready to rollback if needed

- [ ] **Document any issues**
  - [ ] Log problems encountered
  - [ ] Note solutions applied
  - [ ] Update runbook

- [ ] **Schedule post-mortem** (if issues occurred)
  - [ ] What went well?
  - [ ] What could be improved?
  - [ ] Action items for next deployment

## Emergency Procedures

### If Critical Error Occurs

1. **Assess severity**
   - Data loss? Security breach? Service outage?

2. **Notify stakeholders**
   - Technical team, management, customers (if needed)

3. **Choose action**
   - Fix forward vs. rollback
   - Consider impact of each option

4. **Execute**
   ```bash
   # Rollback example
   git checkout <previous-commit>
   npm ci --production
   pm2 restart pulss-backend
   ```

5. **Verify fix**
   - Run tests
   - Check logs
   - Monitor for 1 hour

6. **Post-incident**
   - Document what happened
   - Update procedures
   - Improve monitoring/alerts

### Rollback Procedure

```bash
# 1. Stop application
pm2 stop pulss-backend

# 2. Restore code to previous version
git checkout <previous-stable-commit>
npm ci --production

# 3. Restore database (if schema changed)
psql $DATABASE_URL < backup-before-deployment.sql

# 4. Start application
pm2 start pulss-backend

# 5. Verify
curl https://yourdomain.com/health
```

## Success Criteria

Deployment is successful when:

- [ ] All checklist items completed
- [ ] No critical errors in logs
- [ ] Response times acceptable (<500ms average)
- [ ] Error rate below threshold (<1%)
- [ ] All tests passing
- [ ] Tenant isolation working correctly
- [ ] Authentication working
- [ ] Monitoring and alerts active
- [ ] Backups running
- [ ] Team trained and ready

---

**Congratulations on deploying your multi-tenant application! 🎉**

Keep this checklist handy for future deployments and updates.
