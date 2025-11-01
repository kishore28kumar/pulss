# RBAC System - Quick Start Guide

## Overview

The Pulss platform now includes a comprehensive Role-Based Access Control (RBAC) system that provides enterprise-grade access control, compliance, and flexibility for your SaaS application.

## Key Features

✅ **Standard and Custom Roles**: Pre-defined system roles (super admin, tenant admin, manager, staff, viewer) plus ability to create custom roles  
✅ **Granular Permissions**: 50+ permissions across 11 categories (users, orders, products, customers, analytics, etc.)  
✅ **Per-Tenant Scope**: Complete tenant isolation with role assignments scoped to tenants  
✅ **Permission Middleware**: Protect routes with permission checks  
✅ **Feature Flags**: Enable/disable features per role and tenant without code changes  
✅ **Audit Logging**: Complete audit trail of all role and permission changes  
✅ **User-Friendly UI**: Full-featured admin interface for role management  
✅ **RESTful API**: Comprehensive API for programmatic access  

## Quick Start

### 1. Database Setup

Run the RBAC migration to set up the necessary tables:

```bash
# PostgreSQL
psql $DATABASE_URL -f backend/migrations/11_rbac_system.sql

# Or for local development
psql -h localhost -U postgres -d pulssdb -f backend/migrations/11_rbac_system.sql
```

This creates:
- `roles` - System and custom roles
- `permissions` - Granular permissions
- `role_permissions` - Role-permission mappings
- `user_roles` - User role assignments
- `role_audit_logs` - Audit trail
- `role_feature_flags` - Feature flags per role

### 2. Backend Setup

The RBAC routes are automatically available at `/api/rbac/*`. No additional configuration needed!

### 3. Access the UI

1. Log in to the admin panel: `http://localhost:5173/admin`
2. Navigate to the **"Roles & Permissions"** tab
3. Start managing roles and permissions!

## Default Roles

The system comes with 5 pre-configured system roles:

### Super Administrator
- **Scope**: System-wide (all tenants)
- **Use Case**: Platform administrators
- **Permissions**: All permissions including tenant management

### Tenant Administrator  
- **Scope**: Tenant-specific
- **Use Case**: Store owners/managers
- **Permissions**: All permissions except tenant management

### Manager
- **Scope**: Tenant-specific
- **Use Case**: Store managers
- **Permissions**: Operations, orders, products, customers, analytics

### Staff
- **Scope**: Tenant-specific  
- **Use Case**: Store employees
- **Permissions**: View and update orders, products, customers (no delete/settings)

### Viewer
- **Scope**: Tenant-specific
- **Use Case**: Read-only access
- **Permissions**: View-only across most resources

## Common Tasks

### Creating a Custom Role

**Via UI:**
1. Go to Admin → Roles & Permissions
2. Click "Create Role"
3. Enter role details (name, display name, description)
4. Select permissions using the permission matrix
5. Click "Create Role"

**Via API:**
```bash
curl -X POST "http://localhost:5000/api/rbac/roles" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "inventory_manager",
    "display_name": "Inventory Manager",
    "description": "Manages product inventory",
    "permission_ids": ["perm-id-1", "perm-id-2"]
  }'
```

### Assigning a Role to a User

**Via UI:**
1. Go to Admin → Roles & Permissions → Assignments tab
2. Click "Assign Role"
3. Select user and role
4. Click "Assign"

**Via API:**
```bash
curl -X POST "http://localhost:5000/api/rbac/assign" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "admin_id": "user-uuid",
    "role_id": "role-uuid"
  }'
```

### Protecting Routes with Permissions

In your route files:

```javascript
const { requirePermission } = require('../middleware/rbac');

// Require specific permission
router.post('/users', 
  authMiddleware, 
  requirePermission('users.create'), 
  usersController.create
);

// Require any of multiple permissions
router.get('/analytics', 
  authMiddleware, 
  requireAnyPermission(['analytics.view', 'reports.view']), 
  analyticsController.getDashboard
);
```

### Checking Permissions in Controllers

```javascript
const rbacService = require('../services/rbacService');

async function deleteUser(req, res) {
  const hasPermission = await rbacService.hasPermission(
    req.user.admin_id, 
    'users.delete'
  );
  
  if (!hasPermission) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  
  // Proceed with deletion...
}
```

### Managing Feature Flags

**Via UI:**
1. Go to Admin → Roles & Permissions → Feature Flags tab
2. Select a role
3. Toggle features on/off
4. Changes take effect immediately

**Via API:**
```bash
curl -X PUT "http://localhost:5000/api/rbac/feature-flags" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role_id": "role-uuid",
    "feature_name": "advanced_analytics",
    "is_enabled": true
  }'
```

## Permission Categories

The system includes permissions in these categories:

- **Users Management** (`users.*`) - User CRUD and bulk operations
- **Role Management** (`roles.*`) - Role CRUD and assignments
- **Order Management** (`orders.*`) - Order operations and exports
- **Product Management** (`products.*`) - Product CRUD and bulk uploads
- **Customer Management** (`customers.*`) - Customer operations
- **Analytics & Reports** (`analytics.*`, `reports.*`) - Dashboards and reporting
- **Settings** (`settings.*`) - Tenant configuration
- **Audit Logs** (`audit_logs.*`) - Audit trail access
- **Feature Flags** (`feature_flags.*`) - Feature toggle management
- **Messaging & Notifications** (`messaging.*`, `notifications.*`) - Communication
- **Tenant Management** (`tenants.*`) - Super admin only

## Viewing Audit Logs

**Via UI:**
1. Go to Admin → Roles & Permissions → Audit Logs tab
2. Filter by action type, date range, or search
3. View detailed change history

**Via API:**
```bash
curl -X GET "http://localhost:5000/api/rbac/audit-logs?limit=50" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Testing the RBAC System

Run the integration test suite:

```bash
cd backend
TEST_ADMIN_EMAIL=admin@test.com TEST_ADMIN_PASSWORD=yourpassword node test-rbac.js
```

This tests:
- Authentication
- Permission retrieval
- Role management
- User permissions
- Audit logging
- Feature flags
- Unauthorized access handling

## Frontend Integration

### Checking Permissions in React

```typescript
import { useQuery } from '@tanstack/react-query';

// Fetch current user's permissions
const { data: permissions } = useQuery({
  queryKey: ['my-permissions'],
  queryFn: async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/rbac/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.json();
  }
});

// Check if user has permission
const hasPermission = (permissionName: string) => {
  return permissions?.permissions?.some(
    (p: any) => p.name === permissionName
  ) || false;
};

// Conditional rendering
{hasPermission('users.create') && (
  <Button onClick={handleCreateUser}>Create User</Button>
)}
```

## Migration from Old System

Existing users are automatically migrated:
- Super admins → `super_admin` role
- Regular admins → `tenant_admin` role

The old `requireRole` middleware continues to work for backward compatibility.

## Documentation

- **[RBAC Architecture](./RBAC_ARCHITECTURE.md)** - Complete system architecture
- **[RBAC API Guide](./RBAC_API_GUIDE.md)** - Detailed API documentation with examples

## Security Best Practices

1. ✅ Always check permissions on the backend
2. ✅ Use specific permissions, not role checks
3. ✅ Grant minimum required permissions (principle of least privilege)
4. ✅ Regularly review audit logs
5. ✅ Test with different role configurations
6. ✅ Never rely solely on frontend permission checks
7. ✅ Use feature flags for gradual feature rollouts

## Troubleshooting

### User cannot access a route

1. Check user's permissions: `GET /api/rbac/me`
2. Verify role has required permission: `GET /api/rbac/roles/:role_id`
3. Check audit logs for recent changes: `GET /api/rbac/audit-logs`

### Permission not working

1. Verify permission exists: `GET /api/rbac/permissions`
2. Check if permission is active in database
3. Verify role-permission mapping
4. Clear any client-side caches

### Cannot create custom role

1. Ensure user has `roles.create` permission
2. Check role name is unique within tenant
3. Verify permission IDs are valid

## Support

For questions or issues:
- Review the [RBAC Architecture Documentation](./RBAC_ARCHITECTURE.md)
- Check the [RBAC API Guide](./RBAC_API_GUIDE.md)  
- Review audit logs for configuration issues
- Run the test suite: `node backend/test-rbac.js`

## Future Enhancements

Planned features for future releases:
- Time-based permissions (temporary role assignments)
- Resource-level permissions (permissions on specific records)
- Permission inheritance hierarchies
- SSO integration (SAML/OAuth)
- API key permissions
- Permission request/approval workflows

---

**Version**: 1.0.0  
**Last Updated**: October 2025  
**Status**: Production Ready ✅
