# Multi-Tenancy Architecture

## Overview

This application implements a **strict multi-tenant architecture** with complete data isolation between tenants. Each tenant represents a separate business/store with its own customers, products, orders, and settings.

## Key Concepts

### What is a Tenant?

A **tenant** is an isolated instance of the application for a specific business/store. Each tenant has:
- Unique tenant ID (UUID)
- Separate data (customers, products, orders, etc.)
- Custom branding and settings
- Independent configuration

### Data Isolation

**Strict data isolation** is enforced at multiple levels:
1. **Database Level**: All multi-tenant tables include `tenant_id` foreign key
2. **Query Level**: All queries automatically filter by `tenant_id`
3. **Middleware Level**: Request validation ensures users can only access their tenant's data
4. **Authentication Level**: JWT tokens include `tenant_id` for automatic scoping

## Architecture Components

### 1. Database Schema

#### Core Multi-Tenant Tables

All tenant-scoped tables include `tenant_id` with proper foreign keys:

```sql
-- Tenants table
CREATE TABLE tenants (
  tenant_id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE,
  status TEXT DEFAULT 'active',
  business_type TEXT DEFAULT 'pharmacy',
  -- Additional fields...
);

-- Example tenant-scoped table
CREATE TABLE products (
  product_id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  -- Other fields...
);
```

#### Tenant-Scoped Tables

The following tables are scoped to tenants:
- `admins` - Store administrators
- `customers` - Customer accounts
- `products` - Product catalog
- `categories` - Product categories
- `orders` - Order records
- `order_items` - Order line items
- `transactions` - Transaction history
- `rewards` - Loyalty rewards
- `reward_redemptions` - Reward redemptions
- `store_settings` - Store branding/settings
- `tenant_settings` - Advanced configuration
- `feature_flags` - Feature toggles
- `notifications` - Notification records
- `announcements` - Store announcements
- And more...

### 2. User Roles & Access Control

#### Role Hierarchy

1. **Super Admin** (`super_admin`)
   - Can access all tenants
   - Manages tenant creation and configuration
   - Full system access

2. **Admin** (`admin`)
   - Can only access their own tenant
   - Manages store operations
   - Cannot access other tenants

3. **Customer** (`customer`)
   - Can only access their own tenant
   - Shops at the store
   - Limited to customer-facing features

#### Access Control Flow

```
Request → JWT Token → Extract tenant_id → Validate Access → Execute Query
```

### 3. Authentication & JWT

#### JWT Token Structure

```json
{
  "id": "user-id",
  "email": "user@example.com",
  "role": "admin|customer|super_admin",
  "tenant_id": "tenant-uuid"
}
```

**Key Points:**
- `tenant_id` is ALWAYS included in JWT for admin/customer roles
- Super admins can access any tenant by providing `tenant_id` in request
- Token expires in 7 days (configurable)

### 4. Middleware Stack

#### Tenant Middleware (`tenantMiddleware`)

Extracts `tenant_id` from multiple sources (priority order):
1. Authenticated user's `tenant_id` (from JWT)
2. Subdomain (e.g., `tenant1.example.com`)
3. URL parameters (`/api/products/:tenant_id/...`)
4. Query parameters (`?tenant_id=...`)
5. Request body (`{ tenant_id: "..." }`)

#### Tenant Isolation Middleware (`enforceTenantIsolation`)

Validates user has access to requested tenant:
- Admins can ONLY access their own tenant
- Customers can ONLY access their own tenant
- Super admins can access any tenant

#### Require Tenant Middleware (`requireTenant`)

Ensures `tenant_id` is present in request. Returns 400 error if missing.

#### Verify Tenant Active Middleware (`verifyTenantActive`)

Ensures tenant status is 'active'. Blocks access to inactive/suspended tenants.

### 5. Tenant Isolation Utilities

Located in `/backend/utils/tenantIsolation.js`:

#### Key Functions

**`validateTenantAccess(tenant_id, user)`**
- Validates user has permission to access tenant
- Throws error if access denied

**`extractTenantId(req)`**
- Extracts tenant_id from request
- Returns tenant_id or null

**`executeTenantscopedQuery(query, params, tenant_id, user)`**
- Executes query with tenant validation
- Ensures tenant_id is included

**`getTenantById(tenant_id, user)`**
- Fetches tenant with access validation

**`verifyTenantActive(tenant_id)`**
- Checks tenant is active status

## API Patterns

### Standard Tenant-Scoped Endpoint

```javascript
// Route definition
router.get('/:tenant_id/products', 
  authMiddleware,           // Require authentication
  enforceTenantIsolation,   // Enforce tenant access
  productsController.list   // Controller
);

// Controller implementation
const list = async (req, res) => {
  const { tenant_id } = req.params;
  
  // Query automatically scoped to tenant_id
  const result = await pool.query(
    'SELECT * FROM products WHERE tenant_id = ? AND active = 1',
    [tenant_id]
  );
  
  res.json({ products: result.rows });
};
```

### Using Tenant Isolation Utilities

```javascript
const { validateTenantAccess, executeTenantscopedQuery } = require('../utils/tenantIsolation');

const getProducts = async (req, res) => {
  try {
    const { tenant_id } = req.params;
    
    // Validate access
    await validateTenantAccess(tenant_id, req.user);
    
    // Execute tenant-scoped query
    const result = await executeTenantscopedQuery(
      'SELECT * FROM products WHERE tenant_id = ?',
      [tenant_id],
      tenant_id,
      req.user
    );
    
    res.json({ products: result.rows });
  } catch (error) {
    res.status(403).json({ error: error.message });
  }
};
```

## Tenant Management

### Creating a Tenant

**Endpoint:** `POST /api/tenants`

**Access:** Super Admin only

**Request:**
```json
{
  "name": "Store Name",
  "admin_email": "admin@store.com",
  "business_type": "pharmacy",
  "theme_id": "medical"
}
```

**Response:**
```json
{
  "tenant": {
    "tenant_id": "uuid",
    "name": "Store Name",
    "status": "pending",
    "setup_code": "SETUP123",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

**What Happens:**
1. Tenant record created with `pending` status
2. Admin invite created with setup code
3. Feature flags initialized
4. Setup code emailed to admin (implementation needed)

### Updating Tenant Settings

**Endpoint:** `PUT /api/tenants/:id`

**Access:** Admin (own tenant) or Super Admin

**Request:**
```json
{
  "name": "Updated Store Name",
  "shop_name": "My Pharmacy",
  "street_address": "123 Main St",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001"
}
```

### Advanced Settings

**Endpoint:** `PUT /api/tenants/:id/advanced-settings`

**Access:** Admin (own tenant) or Super Admin

**Request:**
```json
{
  "theme_id": "modern",
  "welcome_message": "Welcome to our store!",
  "currency_symbol": "₹",
  "timezone": "Asia/Kolkata",
  "language": "en",
  "email_notifications_enabled": true,
  "api_rate_limit": 1000
}
```

### Going Live

**Endpoint:** `POST /api/tenants/:id/go-live`

**Access:** Admin (own tenant) or Super Admin

**What Happens:**
1. Tenant status changed to `active` and `is_live = true`
2. PWA URL generated
3. QR codes generated (store QR and UPI payment QR)
4. Store becomes accessible to customers

## Subdomain Routing

### How It Works

Tenants can have custom subdomains (e.g., `pharmacy1.yourdomain.com`):

1. **DNS Setup**: Configure wildcard DNS (`*.yourdomain.com`)
2. **Tenant Configuration**: Set `subdomain` field in tenant record
3. **Middleware Detection**: `tenantMiddleware` extracts subdomain from host header
4. **Automatic Routing**: All requests automatically scoped to tenant

### Example

```
Request: https://pharmacy1.example.com/products
↓
tenantMiddleware extracts "pharmacy1"
↓
Queries tenant with subdomain = "pharmacy1"
↓
Sets req.tenant_id = tenant's UUID
↓
All subsequent queries scoped to this tenant
```

## Security Best Practices

### 1. Always Include tenant_id in Queries

❌ **Wrong:**
```javascript
const result = await pool.query('SELECT * FROM products');
```

✅ **Correct:**
```javascript
const result = await pool.query(
  'SELECT * FROM products WHERE tenant_id = ?',
  [tenant_id]
);
```

### 2. Validate Tenant Access

❌ **Wrong:**
```javascript
const { tenant_id } = req.params;
// Directly query without validation
```

✅ **Correct:**
```javascript
const { tenant_id } = req.params;
await validateTenantAccess(tenant_id, req.user);
```

### 3. Use Middleware Protection

❌ **Wrong:**
```javascript
router.get('/products', productsController.list);
```

✅ **Correct:**
```javascript
router.get('/:tenant_id/products',
  authMiddleware,
  enforceTenantIsolation,
  productsController.list
);
```

### 4. Never Trust Client Input

Always validate and sanitize tenant_id from request:
- Check tenant exists
- Check tenant is active
- Validate user has access

## Advanced Features

### Feature Flags

Each tenant has feature flags for enabling/disabling features:

```javascript
const result = await pool.query(
  'SELECT * FROM feature_flags WHERE tenant_id = ?',
  [tenant_id]
);

if (result.rows[0].loyalty_enabled) {
  // Show loyalty features
}
```

Available flags:
- `tracking_enabled` - Order tracking
- `wallet_enabled` - Digital wallet
- `loyalty_enabled` - Loyalty program
- `coupons_enabled` - Discount coupons
- `prescription_required_enabled` - Rx verification
- `multi_warehouse_enabled` - Multi-warehouse
- `whatsapp_notifications_enabled` - WhatsApp alerts
- `push_notifications_enabled` - Push notifications

### Tenant Subscriptions

Track subscription plans and limits:

```javascript
const sub = await pool.query(
  'SELECT * FROM tenant_subscriptions WHERE tenant_id = ?',
  [tenant_id]
);

// Enforce limits
if (productCount >= sub.rows[0].max_products) {
  throw new Error('Product limit reached for your plan');
}
```

### Custom Branding

Each tenant can customize:
- Logo
- PWA icon
- Favicon
- Primary color
- Theme
- Welcome message
- Footer text

### Audit Logging

All tenant actions can be logged:

```javascript
await pool.query(
  `INSERT INTO audit_logs (tenant_id, admin_id, action, entity_type, entity_id, changes)
   VALUES (?, ?, ?, ?, ?, ?)`,
  [tenant_id, admin_id, 'UPDATE', 'product', product_id, JSON.stringify(changes)]
);
```

## Extending Multi-Tenancy

### Adding New Tenant-Scoped Table

1. **Create table with tenant_id:**
```sql
CREATE TABLE my_new_table (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  -- other fields...
);

-- Add index
CREATE INDEX idx_my_new_table_tenant ON my_new_table(tenant_id);
```

2. **Always filter by tenant_id:**
```javascript
const result = await pool.query(
  'SELECT * FROM my_new_table WHERE tenant_id = ?',
  [tenant_id]
);
```

3. **Use tenant isolation middleware:**
```javascript
router.get('/:tenant_id/my-resource',
  authMiddleware,
  enforceTenantIsolation,
  controller.list
);
```

### Adding Custom Tenant Settings

1. **Add field to tenant_settings table:**
```sql
ALTER TABLE tenant_settings ADD COLUMN my_setting TEXT;
```

2. **Update controller:**
```javascript
// In updateAdvancedSettings
if (my_setting !== undefined) {
  updates.push(`my_setting = $${paramCount++}`);
  values.push(my_setting);
}
```

### Creating Tenant-Specific Features

Use feature flags to enable/disable per tenant:

```javascript
// Check if feature is enabled
const flags = await pool.query(
  'SELECT my_feature_enabled FROM feature_flags WHERE tenant_id = ?',
  [tenant_id]
);

if (flags.rows[0].my_feature_enabled) {
  // Feature logic here
}
```

## Testing Multi-Tenancy

### Manual Testing

1. **Create multiple tenants:**
```bash
curl -X POST http://localhost:5000/api/tenants \
  -H "Authorization: Bearer <super_admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Tenant 1","admin_email":"admin1@test.com","business_type":"pharmacy"}'
```

2. **Login as different tenants:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin1@test.com","password":"password"}'
```

3. **Try cross-tenant access:**
```bash
# Should fail with 403
curl -X GET http://localhost:5000/api/products/tenant-2-id/list \
  -H "Authorization: Bearer <tenant-1-admin-token>"
```

### Automated Testing

Create tests for:
- Tenant isolation enforcement
- Cross-tenant access prevention
- JWT tenant_id validation
- Query filtering
- Middleware protection

Example test:
```javascript
describe('Tenant Isolation', () => {
  it('should prevent admin from accessing other tenant data', async () => {
    const tenant1Token = await loginAsTenant1Admin();
    const response = await request(app)
      .get('/api/products/tenant-2-id/list')
      .set('Authorization', `Bearer ${tenant1Token}`);
    
    expect(response.status).toBe(403);
    expect(response.body.error).toContain('Access denied');
  });
});
```

## Troubleshooting

### Common Issues

**Problem:** User can't access their tenant data
- Check JWT includes correct `tenant_id`
- Verify tenant status is 'active'
- Check user's `tenant_id` matches requested tenant

**Problem:** Queries returning no data
- Ensure `tenant_id` is included in WHERE clause
- Verify tenant_id value is correct UUID format
- Check data exists for that tenant

**Problem:** 403 Access Denied errors
- Verify user role permissions
- Check tenant isolation middleware is applied
- Ensure JWT is valid and not expired

**Problem:** Cross-tenant data leakage
- Audit all queries include `tenant_id` filter
- Review controllers for missing tenant checks
- Add indexes on tenant_id for all tables

## Monitoring & Maintenance

### Regular Audits

1. **Check for missing tenant_id filters:**
```bash
# Search for queries without tenant_id
grep -r "SELECT.*FROM.*WHERE" backend/controllers/ | grep -v "tenant_id"
```

2. **Verify indexes:**
```sql
-- Check all tenant-scoped tables have indexes
SELECT tablename, indexname 
FROM pg_indexes 
WHERE indexname LIKE '%tenant%';
```

3. **Monitor tenant metrics:**
```javascript
// Track per-tenant usage
SELECT 
  tenant_id,
  COUNT(*) as total_orders,
  SUM(total) as revenue
FROM orders
GROUP BY tenant_id;
```

### Performance Optimization

1. **Add indexes on tenant_id:**
```sql
CREATE INDEX idx_table_tenant ON table_name(tenant_id);
CREATE INDEX idx_table_tenant_created ON table_name(tenant_id, created_at);
```

2. **Use composite indexes:**
```sql
CREATE INDEX idx_products_tenant_active 
ON products(tenant_id, active);
```

3. **Partition large tables by tenant (PostgreSQL 10+):**
```sql
CREATE TABLE orders_partitioned (
  -- columns...
) PARTITION BY LIST (tenant_id);
```

## Migration Guide

### Migrating Existing Application

1. **Add tenant_id to all tables:**
```sql
ALTER TABLE existing_table ADD COLUMN tenant_id UUID REFERENCES tenants(tenant_id);
CREATE INDEX idx_existing_table_tenant ON existing_table(tenant_id);
```

2. **Update controllers to include tenant_id:**
```javascript
// Before
const products = await pool.query('SELECT * FROM products');

// After
const products = await pool.query(
  'SELECT * FROM products WHERE tenant_id = ?',
  [tenant_id]
);
```

3. **Add middleware protection:**
```javascript
// Update routes
router.get('/:tenant_id/products',
  authMiddleware,
  enforceTenantIsolation,
  controller.list
);
```

4. **Update JWT to include tenant_id:**
```javascript
// Update signToken function
function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      tenant_id: user.tenant_id  // Add this
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}
```

## Conclusion

This multi-tenancy architecture provides:
- ✅ Complete data isolation between tenants
- ✅ Secure access control with role-based permissions
- ✅ Scalable architecture for thousands of tenants
- ✅ Flexible configuration per tenant
- ✅ Easy to extend with new features
- ✅ Production-ready for B2B SaaS deployments

For questions or support, refer to the codebase or contact the development team.
