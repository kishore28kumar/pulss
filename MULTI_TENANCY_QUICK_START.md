# Multi-Tenancy Quick Start Guide

## For Developers: How to Use Multi-Tenancy

This guide provides quick examples for common multi-tenancy patterns in the application.

## 1. Creating a New Tenant-Scoped Controller

### Basic Pattern

```javascript
const { pool } = require('../config/db');
const { validateTenantAccess } = require('../utils/tenantIsolation');

// List resources for a tenant
const listResources = async (req, res) => {
  try {
    const { tenant_id } = req.params; // or req.tenant_id from middleware
    
    // Validate access
    await validateTenantAccess(tenant_id, req.user);
    
    // Query with tenant_id filter
    const result = await pool.query(
      'SELECT * FROM my_resources WHERE tenant_id = ? ORDER BY created_at DESC',
      [tenant_id]
    );
    
    res.json({ resources: result.rows });
  } catch (error) {
    console.error('List resources error:', error);
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
};

// Create resource for a tenant
const createResource = async (req, res) => {
  try {
    const { tenant_id } = req.params;
    const { name, description } = req.body;
    
    // Validate access
    await validateTenantAccess(tenant_id, req.user);
    
    // Insert with tenant_id
    await pool.query(
      'INSERT INTO my_resources (tenant_id, name, description) VALUES (?, ?, ?)',
      [tenant_id, name, description]
    );
    
    res.status(201).json({ message: 'Resource created successfully' });
  } catch (error) {
    console.error('Create resource error:', error);
    res.status(500).json({ error: 'Failed to create resource' });
  }
};

module.exports = { listResources, createResource };
```

## 2. Creating Tenant-Scoped Routes

### Basic Pattern

```javascript
const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const { enforceTenantIsolation } = require('../middleware/tenant');
const myController = require('../controllers/myController');

// Apply authentication and tenant isolation to all routes
router.use(authMiddleware);
router.use(enforceTenantIsolation);

// Routes with tenant_id in path
router.get('/:tenant_id/resources', myController.listResources);
router.post('/:tenant_id/resources', requireRole('admin', 'super_admin'), myController.createResource);
router.put('/:tenant_id/resources/:id', requireRole('admin', 'super_admin'), myController.updateResource);
router.delete('/:tenant_id/resources/:id', requireRole('admin', 'super_admin'), myController.deleteResource);

module.exports = router;
```

### Alternative: Using Middleware-Provided tenant_id

```javascript
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { tenantMiddleware, enforceTenantIsolation } = require('../middleware/tenant');
const myController = require('../controllers/myController');

// Tenant middleware extracts tenant_id from various sources
router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(enforceTenantIsolation);

// Routes without tenant_id in path - using req.tenant_id from middleware
router.get('/resources', myController.listResources);
router.post('/resources', myController.createResource);

module.exports = router;
```

## 3. Adding a New Tenant-Scoped Table

### Step 1: Create Migration

```sql
-- migrations/12_add_my_resource.sql

CREATE TABLE IF NOT EXISTS my_resources (
  resource_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add index for tenant-scoped queries
CREATE INDEX idx_my_resources_tenant ON my_resources(tenant_id);
CREATE INDEX idx_my_resources_tenant_active ON my_resources(tenant_id, is_active);
```

### Step 2: Create Controller

See "Creating a New Tenant-Scoped Controller" above.

### Step 3: Create Routes

See "Creating Tenant-Scoped Routes" above.

### Step 4: Register Routes in app.js

```javascript
// In app.js
const myResourcesRoutes = require('./routes/myResources');
app.use('/api/my-resources', apiLimiter, myResourcesRoutes);
```

## 4. Working with JWT and Tenant Context

### Accessing Tenant from JWT

```javascript
const someController = async (req, res) => {
  // req.user is populated by authMiddleware from JWT
  const { id, email, role, tenant_id } = req.user;
  
  // For admin/customer, always use their tenant_id
  if (role === 'admin' || role === 'customer') {
    // This tenant_id comes from JWT and is trusted
    const myTenantId = tenant_id;
    
    // Query data for this tenant
    const result = await pool.query(
      'SELECT * FROM products WHERE tenant_id = ?',
      [myTenantId]
    );
  }
  
  // Super admin can specify tenant_id
  if (role === 'super_admin') {
    const requestedTenantId = req.params.tenant_id || req.query.tenant_id;
    // Query data for requested tenant
  }
};
```

## 5. Common Patterns

### Pattern 1: List with Pagination

```javascript
const listWithPagination = async (req, res) => {
  try {
    const { tenant_id } = req.params;
    const { page = 1, limit = 20, sortBy = 'created_at', order = 'DESC' } = req.query;
    
    await validateTenantAccess(tenant_id, req.user);
    
    const offset = (page - 1) * limit;
    
    const result = await pool.query(
      `SELECT * FROM my_resources 
       WHERE tenant_id = ? 
       ORDER BY ${sortBy} ${order}
       LIMIT ? OFFSET ?`,
      [tenant_id, parseInt(limit), parseInt(offset)]
    );
    
    const countResult = await pool.query(
      'SELECT COUNT(*) as total FROM my_resources WHERE tenant_id = ?',
      [tenant_id]
    );
    
    res.json({
      resources: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        totalPages: Math.ceil(countResult.rows[0].total / limit)
      }
    });
  } catch (error) {
    console.error('List with pagination error:', error);
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
};
```

### Pattern 2: Update with Validation

```javascript
const updateResource = async (req, res) => {
  try {
    const { tenant_id, id } = req.params;
    const { name, description, is_active } = req.body;
    
    // Validate tenant access
    await validateTenantAccess(tenant_id, req.user);
    
    // Verify resource exists and belongs to tenant
    const checkResult = await pool.query(
      'SELECT tenant_id FROM my_resources WHERE resource_id = ?',
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    
    if (checkResult.rows[0].tenant_id !== tenant_id) {
      return res.status(403).json({ error: 'Resource belongs to different tenant' });
    }
    
    // Update resource
    const result = await pool.query(
      `UPDATE my_resources 
       SET name = ?, description = ?, is_active = ?, updated_at = datetime('now')
       WHERE resource_id = ? AND tenant_id = ?`,
      [name, description, is_active, id, tenant_id]
    );
    
    res.json({ message: 'Resource updated successfully' });
  } catch (error) {
    console.error('Update resource error:', error);
    res.status(500).json({ error: 'Failed to update resource' });
  }
};
```

### Pattern 3: Delete with Cascade

```javascript
const deleteResource = async (req, res) => {
  try {
    const { tenant_id, id } = req.params;
    
    await validateTenantAccess(tenant_id, req.user);
    
    // Verify ownership before delete
    const checkResult = await pool.query(
      'SELECT tenant_id FROM my_resources WHERE resource_id = ? AND tenant_id = ?',
      [id, tenant_id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Resource not found or access denied' });
    }
    
    // Delete (CASCADE will handle related records if defined in schema)
    await pool.query(
      'DELETE FROM my_resources WHERE resource_id = ? AND tenant_id = ?',
      [id, tenant_id]
    );
    
    res.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    console.error('Delete resource error:', error);
    res.status(500).json({ error: 'Failed to delete resource' });
  }
};
```

### Pattern 4: Aggregation Queries

```javascript
const getStats = async (req, res) => {
  try {
    const { tenant_id } = req.params;
    
    await validateTenantAccess(tenant_id, req.user);
    
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total_count,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_count,
        COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_count,
        MIN(created_at) as first_created,
        MAX(created_at) as last_created
       FROM my_resources
       WHERE tenant_id = ?`,
      [tenant_id]
    );
    
    res.json({ stats: result.rows[0] });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};
```

## 6. Testing Multi-Tenancy

### Manual Testing with curl

```bash
# 1. Login as tenant admin
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@tenant1.com","password":"password"}'

# Response includes JWT with tenant_id
# {"token":"eyJhbGc...","user":{"id":"...","tenant_id":"tenant-1-uuid"}}

# 2. Use token to access tenant data
curl -X GET http://localhost:5000/api/products/tenant-1-uuid \
  -H "Authorization: Bearer eyJhbGc..."

# 3. Try to access another tenant (should fail)
curl -X GET http://localhost:5000/api/products/tenant-2-uuid \
  -H "Authorization: Bearer eyJhbGc..."
# Expected: 403 Forbidden

# 4. Super admin can access any tenant
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@example.com","password":"password"}'

curl -X GET http://localhost:5000/api/products/tenant-2-uuid \
  -H "Authorization: Bearer <super-admin-token>"
# Expected: 200 OK
```

### Testing Checklist

- [ ] Create multiple test tenants
- [ ] Login as admin for each tenant
- [ ] Verify admin can only access their own tenant data
- [ ] Verify admin cannot access other tenant data (403 error)
- [ ] Verify super admin can access all tenants
- [ ] Test all CRUD operations with tenant isolation
- [ ] Verify queries include tenant_id in WHERE clause
- [ ] Test subdomain routing (if enabled)

## 7. Common Mistakes to Avoid

### ❌ Don't: Query without tenant_id

```javascript
// BAD - No tenant filter
const result = await pool.query('SELECT * FROM products');
```

### ✅ Do: Always filter by tenant_id

```javascript
// GOOD - Filtered by tenant
const result = await pool.query(
  'SELECT * FROM products WHERE tenant_id = ?',
  [tenant_id]
);
```

### ❌ Don't: Trust tenant_id from client

```javascript
// BAD - Client can manipulate tenant_id
const { tenant_id } = req.body;
const result = await pool.query(
  'SELECT * FROM products WHERE tenant_id = ?',
  [tenant_id]
);
```

### ✅ Do: Use tenant_id from JWT or validate

```javascript
// GOOD - Use tenant from authenticated user
const tenant_id = req.user.tenant_id;
// Or validate access
await validateTenantAccess(req.params.tenant_id, req.user);
```

### ❌ Don't: Skip tenant validation

```javascript
// BAD - No validation
const { tenant_id } = req.params;
const result = await pool.query(
  'SELECT * FROM products WHERE tenant_id = ?',
  [tenant_id]
);
```

### ✅ Do: Validate tenant access

```javascript
// GOOD - Validate first
const { tenant_id } = req.params;
await validateTenantAccess(tenant_id, req.user);
const result = await pool.query(
  'SELECT * FROM products WHERE tenant_id = ?',
  [tenant_id]
);
```

### ❌ Don't: Forget indexes

```sql
-- BAD - No index on tenant_id
CREATE TABLE my_resources (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(tenant_id),
  name TEXT
);
```

### ✅ Do: Always add tenant_id index

```sql
-- GOOD - Index on tenant_id for performance
CREATE TABLE my_resources (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(tenant_id) NOT NULL,
  name TEXT
);
CREATE INDEX idx_my_resources_tenant ON my_resources(tenant_id);
```

## 8. Troubleshooting

### Issue: "Tenant identification required"

**Cause:** tenant_id not found in request

**Solution:** Ensure tenant_id is provided via:
- URL parameter: `/api/products/:tenant_id`
- Query parameter: `/api/products?tenant_id=...`
- JWT token (for admin/customer)
- Subdomain

### Issue: "Access denied to other tenant data"

**Cause:** User trying to access different tenant

**Solution:** Check that:
- User's JWT includes correct tenant_id
- Request tenant_id matches user's tenant_id
- User has super_admin role if accessing multiple tenants

### Issue: Queries returning no data

**Cause:** Missing tenant_id filter or wrong tenant_id

**Solution:**
- Verify tenant_id is included in WHERE clause
- Check tenant_id value is correct UUID
- Ensure data exists for that tenant

### Issue: "Tenant not found"

**Cause:** Invalid or inactive tenant_id

**Solution:**
- Verify tenant exists in database
- Check tenant status is 'active'
- Ensure tenant_id is correct UUID format

## 9. Best Practices Summary

1. **Always filter by tenant_id** in queries
2. **Validate tenant access** before operations
3. **Use middleware** for tenant isolation
4. **Include tenant_id in JWT** for authenticated users
5. **Add indexes** on tenant_id columns
6. **Use foreign keys** with CASCADE for data integrity
7. **Never trust client input** for tenant_id
8. **Test cross-tenant access** prevention
9. **Log tenant operations** for audit trail
10. **Document tenant-scoped features** for your team

## 10. Quick Reference

### Utility Functions

```javascript
const {
  validateTenantAccess,      // Validate user can access tenant
  extractTenantId,           // Extract tenant_id from request
  getTenantById,             // Get tenant with validation
  verifyTenantActive         // Check tenant is active
} = require('../utils/tenantIsolation');
```

### Middleware

```javascript
const {
  tenantMiddleware,          // Extract tenant_id from request
  requireTenant,             // Require tenant_id to be present
  enforceTenantIsolation,    // Enforce tenant access control
  verifyTenantActive         // Ensure tenant is active
} = require('../middleware/tenant');
```

### Auth Middleware

```javascript
const {
  authMiddleware,            // Require valid JWT
  optionalAuth,              // Optional JWT (for public endpoints)
  requireRole                // Require specific role(s)
} = require('../middleware/auth');
```

## Need Help?

- Read the full architecture documentation: `MULTI_TENANCY_ARCHITECTURE.md`
- Run validation script: `node backend/validate-multi-tenancy.js`
- Check examples in existing controllers: `backend/controllers/`
- Review tests: `backend/tests/` (if available)

---

**Remember:** Multi-tenancy is critical for data security. Always think "tenant-first" when writing code!
