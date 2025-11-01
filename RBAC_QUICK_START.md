# RBAC Quick Start Guide

A quick reference guide for developers to get started with the RBAC system.

## Table of Contents

1. [Installation](#installation)
2. [Basic Usage](#basic-usage)
3. [Common Scenarios](#common-scenarios)
4. [Middleware Examples](#middleware-examples)
5. [API Quick Reference](#api-quick-reference)
6. [Frontend Integration](#frontend-integration)

---

## Installation

### 1. Run Database Migration

```bash
# Connect to your PostgreSQL database
psql -h localhost -U postgres -d pulssdb

# Run the RBAC migration
\i backend/migrations/11_create_rbac_system.sql
```

### 2. Verify Installation

```bash
# Check if tables were created
psql -h localhost -U postgres -d pulssdb -c "\dt rbac*"

# Should show:
# - resources
# - permissions
# - roles
# - role_permissions
# - user_roles
# - rbac_audit_logs
# - rbac_feature_flags
# - role_templates
# - access_reviews
```

---

## Basic Usage

### Enable RBAC for a Tenant (Super Admin)

```javascript
// PUT /api/rbac/feature-flags
{
  "tenant_id": "your-tenant-id",
  "rbac_enabled": true,
  "custom_roles_enabled": true,
  "role_templates_enabled": true
}
```

### Check User's Permissions

```javascript
// GET /api/rbac/my-permissions
// Returns current user's roles and permissions

// In your code:
const rbacService = require('./services/rbacService');

const hasPermission = await rbacService.hasPermission(
  userId,
  'admin',  // or 'customer'
  'products:create',
  tenantId
);
```

### Protect Routes with Permissions

```javascript
const { requirePermission } = require('./middleware/rbac');

// Single permission
router.post('/products', 
  authMiddleware,
  requirePermission('products:create'),
  productController.create
);

// Any of multiple permissions
router.get('/reports',
  authMiddleware,
  requireAnyPermission(['reports:read', 'analytics:read']),
  reportController.list
);

// All permissions required
router.post('/sensitive-action',
  authMiddleware,
  requireAllPermissions(['users:update', 'audit_logs:read']),
  controller.action
);
```

---

## Common Scenarios

### Scenario 1: Create Custom Role for Store Manager

```bash
# Step 1: Create the role
curl -X POST http://localhost:3000/api/rbac/roles \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "store_manager",
    "display_name": "Store Manager",
    "description": "Manages day-to-day store operations",
    "tenant_id": "tenant-uuid"
  }'

# Step 2: Get permission IDs
curl http://localhost:3000/api/rbac/permissions | jq '.data[] | select(.name | contains("products")) | {id: .permission_id, name: .name}'

# Step 3: Grant permissions
curl -X POST http://localhost:3000/api/rbac/permissions/grant \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roleId": "role-uuid",
    "permissionId": "permission-uuid"
  }'

# Step 4: Assign to user
curl -X POST http://localhost:3000/api/rbac/users/assign-role \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-uuid",
    "user_type": "admin",
    "role_id": "role-uuid",
    "tenant_id": "tenant-uuid"
  }'
```

### Scenario 2: Use Role Template

```bash
# List available templates
curl http://localhost:3000/api/rbac/templates \
  -H "Authorization: Bearer $TOKEN"

# Create role from template
curl -X POST http://localhost:3000/api/rbac/templates/create-role \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "template_id": "template-uuid",
    "tenant_id": "tenant-uuid"
  }'
```

### Scenario 3: Bulk Assign Roles

```bash
curl -X POST http://localhost:3000/api/rbac/users/bulk-assign \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "assignments": [
      {
        "user_id": "user-1-uuid",
        "user_type": "admin",
        "role_id": "support-role-uuid",
        "tenant_id": "tenant-uuid"
      },
      {
        "user_id": "user-2-uuid",
        "user_type": "admin",
        "role_id": "support-role-uuid",
        "tenant_id": "tenant-uuid"
      }
    ]
  }'
```

### Scenario 4: Temporary Role Assignment

```bash
# Assign role with expiration
curl -X POST http://localhost:3000/api/rbac/users/assign-role \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-uuid",
    "user_type": "admin",
    "role_id": "role-uuid",
    "tenant_id": "tenant-uuid",
    "expires_at": "2024-12-31T23:59:59Z"
  }'
```

---

## Middleware Examples

### Example 1: Basic Permission Check

```javascript
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('./middleware/auth');
const { requirePermission } = require('./middleware/rbac');

router.post('/products',
  authMiddleware,
  requirePermission('products:create'),
  async (req, res) => {
    // User has products:create permission
    // Your logic here
  }
);
```

### Example 2: Multiple Permission Options

```javascript
const { requireAnyPermission } = require('./middleware/rbac');

router.get('/dashboard',
  authMiddleware,
  requireAnyPermission(['reports:read', 'analytics:read', 'admin:dashboard']),
  async (req, res) => {
    // User has at least one of the permissions
  }
);
```

### Example 3: Super Admin Only

```javascript
const { requireSuperAdmin } = require('./middleware/rbac');

router.put('/rbac/feature-flags',
  authMiddleware,
  requireSuperAdmin(),
  async (req, res) => {
    // Only super admin can access
  }
);
```

### Example 4: Admin or Super Admin

```javascript
const { requireAdmin } = require('./middleware/rbac');

router.get('/users',
  authMiddleware,
  requireAdmin(),
  async (req, res) => {
    // Admin or super admin can access
  }
);
```

### Example 5: Tenant Isolation

```javascript
const { checkTenantIsolation } = require('./middleware/rbac');

router.get('/tenant-data',
  authMiddleware,
  checkTenantIsolation(),
  async (req, res) => {
    // Ensures user can only access their tenant's data
    // Super admin bypasses this check
  }
);
```

### Example 6: Attach Permissions to Request

```javascript
const { attachUserPermissions } = require('./middleware/rbac');

router.get('/products',
  authMiddleware,
  attachUserPermissions(),
  async (req, res) => {
    // req.userPermissions contains array of permission names
    // req.hasPermission('products:update') returns boolean
    
    const products = await getProducts();
    
    // Conditionally include data based on permissions
    const response = {
      products,
      canEdit: req.hasPermission('products:update'),
      canDelete: req.hasPermission('products:delete')
    };
    
    res.json(response);
  }
);
```

### Example 7: Dynamic Permission Checking in Controller

```javascript
const rbacService = require('./services/rbacService');

exports.getProduct = async (req, res) => {
  try {
    const product = await getProductById(req.params.id);
    
    // Check permission dynamically
    const canEdit = await rbacService.hasPermission(
      req.user.id,
      'admin',
      'products:update',
      req.user.tenant_id
    );
    
    res.json({
      product,
      canEdit
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

---

## API Quick Reference

### Roles

```bash
# List roles
GET /api/rbac/roles?tenant_id=uuid

# Get role with permissions
GET /api/rbac/roles/:roleId

# Create role
POST /api/rbac/roles
{
  "name": "role_name",
  "display_name": "Display Name",
  "description": "Description",
  "tenant_id": "uuid",
  "permissions": ["perm-uuid-1", "perm-uuid-2"]
}

# Update role
PUT /api/rbac/roles/:roleId
{
  "display_name": "New Name",
  "description": "New description"
}

# Delete role
DELETE /api/rbac/roles/:roleId
```

### Permissions

```bash
# List all permissions
GET /api/rbac/permissions

# List by resource
GET /api/rbac/permissions?resource_name=products

# Grant permission to role
POST /api/rbac/permissions/grant
{
  "roleId": "role-uuid",
  "permissionId": "permission-uuid"
}

# Revoke permission
POST /api/rbac/permissions/revoke
{
  "roleId": "role-uuid",
  "permissionId": "permission-uuid"
}
```

### User Roles

```bash
# Get user's roles
GET /api/rbac/users/:userId/:userType/roles?tenant_id=uuid

# Get user's permissions
GET /api/rbac/users/:userId/:userType/permissions?tenant_id=uuid

# Assign role
POST /api/rbac/users/assign-role
{
  "user_id": "uuid",
  "user_type": "admin",
  "role_id": "uuid",
  "tenant_id": "uuid",
  "expires_at": "2024-12-31T23:59:59Z"
}

# Revoke role
POST /api/rbac/users/revoke-role
{
  "user_id": "uuid",
  "role_id": "uuid",
  "tenant_id": "uuid"
}
```

### Templates

```bash
# List templates
GET /api/rbac/templates

# Create from template
POST /api/rbac/templates/create-role
{
  "template_id": "uuid",
  "tenant_id": "uuid"
}
```

### Feature Flags (Super Admin)

```bash
# Get flags
GET /api/rbac/feature-flags?tenant_id=uuid

# Update flags
PUT /api/rbac/feature-flags
{
  "tenant_id": "uuid",
  "rbac_enabled": true,
  "custom_roles_enabled": true
}
```

### Audit

```bash
# Get audit logs
GET /api/rbac/audit-logs?tenant_id=uuid&limit=50&offset=0

# Export roles and permissions
GET /api/rbac/export?tenant_id=uuid
```

### Utility

```bash
# Check permission
GET /api/rbac/check-permission?user_id=uuid&user_type=admin&permission=products:create

# Get my permissions
GET /api/rbac/my-permissions

# Get my roles
GET /api/rbac/my-roles
```

---

## Frontend Integration

### React Hook for Permissions

```typescript
// usePermissions.ts
import { useQuery } from '@tanstack/react-query';

export const usePermissions = () => {
  return useQuery({
    queryKey: ['my-permissions'],
    queryFn: async () => {
      const response = await fetch('/api/rbac/my-permissions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      return data.data;
    }
  });
};

// Usage in component
const MyComponent = () => {
  const { data: permissionsData } = usePermissions();
  const permissions = permissionsData?.permissions || [];
  
  const hasPermission = (perm) => 
    permissions.some(p => p.name === perm);
  
  return (
    <div>
      {hasPermission('products:create') && (
        <button>Create Product</button>
      )}
    </div>
  );
};
```

### Permission Component

```typescript
// PermissionGuard.tsx
import { usePermissions } from './usePermissions';

export const PermissionGuard = ({ 
  permission, 
  children,
  fallback = null 
}) => {
  const { data } = usePermissions();
  const permissions = data?.permissions || [];
  
  const hasPermission = permissions.some(p => p.name === permission);
  
  if (!hasPermission) return fallback;
  
  return <>{children}</>;
};

// Usage
<PermissionGuard permission="products:create">
  <CreateProductButton />
</PermissionGuard>
```

### Using RBAC Management Component

```typescript
import { RBACManagement } from '@/components/RBACManagement';
import { RBACFeatureFlagsManager } from '@/components/RBACFeatureFlagsManager';

// In Admin Panel
const AdminPanel = () => {
  const { user } = useAuth();
  
  return (
    <div>
      <Tabs>
        <TabsList>
          <TabsTrigger value="rbac">RBAC</TabsTrigger>
          {user.role === 'super_admin' && (
            <TabsTrigger value="flags">Feature Flags</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="rbac">
          <RBACManagement tenantId={user.tenant_id} />
        </TabsContent>
        
        {user.role === 'super_admin' && (
          <TabsContent value="flags">
            <RBACFeatureFlagsManager />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};
```

---

## Testing RBAC

### Test Permission Check

```bash
# Create a test user and assign role
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  | jq -r '.token')

# Check permissions
curl http://localhost:3000/api/rbac/my-permissions \
  -H "Authorization: Bearer $TOKEN" | jq

# Test protected endpoint
curl -X POST http://localhost:3000/api/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Product"}'
```

### Test Role Creation

```bash
# Get super admin token
SUPER_TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@pulss.app","password":"password"}' \
  | jq -r '.token')

# Create custom role
curl -X POST http://localhost:3000/api/rbac/roles \
  -H "Authorization: Bearer $SUPER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test_role",
    "display_name": "Test Role",
    "description": "Test role for development",
    "tenant_id": "tenant-uuid"
  }' | jq
```

---

## Troubleshooting

### Issue: Permission Denied

**Check:**
1. Is RBAC enabled for the tenant?
2. Does the user have the role assigned?
3. Does the role have the required permission?

```bash
# Check feature flags
GET /api/rbac/feature-flags?tenant_id=uuid

# Check user's roles
GET /api/rbac/users/USER_ID/admin/roles

# Check role's permissions
GET /api/rbac/roles/ROLE_ID
```

### Issue: Cannot Create Custom Role

**Check:**
1. Is `custom_roles_enabled` flag set to true?
2. Has the tenant reached the `max_custom_roles` limit?

```bash
# Check flags
GET /api/rbac/feature-flags?tenant_id=uuid
```

### Issue: Audit Logs Not Appearing

**Check:**
1. Is `audit_logging_enabled` flag set to true?
2. Check the `rbac_audit_logs` table directly

```sql
SELECT * FROM rbac_audit_logs 
WHERE tenant_id = 'your-tenant-id' 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## Best Practices

1. **Always enable audit logging** for compliance and debugging
2. **Use role templates** for consistency across tenants
3. **Test permissions** in development before deploying
4. **Regular access reviews** for security
5. **Least privilege** - grant minimum necessary permissions
6. **Document custom roles** and their purpose
7. **Use expiration dates** for temporary access
8. **Monitor audit logs** for suspicious activity

---

## Next Steps

- Read the full [RBAC Documentation](./RBAC_DOCUMENTATION.md)
- Review the [API Reference](./RBAC_API_REFERENCE.md)
- Check out example implementations in the codebase
- Set up monitoring for audit logs
- Plan your access review schedule

---

## Support

For questions or issues:
- Review the documentation
- Check audit logs for error details
- Contact your system administrator
