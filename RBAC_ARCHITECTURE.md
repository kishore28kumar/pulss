# Role-Based Access Control (RBAC) Architecture

## Overview

The Pulss platform implements a comprehensive Role-Based Access Control (RBAC) system that provides enterprise-grade access control, compliance, and flexibility. This system enables fine-grained permission management, custom role creation, audit logging, and feature flag control per role and tenant.

## Architecture Components

### 1. Database Schema

#### Tables

- **`roles`**: Stores system and custom roles
  - System roles: `super_admin`, `tenant_admin`, `manager`, `staff`, `viewer`
  - Custom roles: Tenant-specific roles created by admins
  - Fields: `role_id`, `tenant_id`, `name`, `display_name`, `description`, `is_system_role`, `is_active`

- **`permissions`**: Defines granular permissions
  - Organized by category: `users`, `orders`, `products`, `customers`, `analytics`, `settings`, etc.
  - Fields: `permission_id`, `name`, `display_name`, `description`, `category`, `is_active`

- **`role_permissions`**: Many-to-many mapping of roles to permissions
  - Fields: `role_id`, `permission_id`

- **`user_roles`**: Links admin users to roles
  - Fields: `user_role_id`, `admin_id`, `role_id`, `assigned_by`, `assigned_at`

- **`role_audit_logs`**: Audit trail for all role/permission changes
  - Fields: `audit_id`, `tenant_id`, `admin_id`, `role_id`, `action`, `target_admin_id`, `changes`, `performed_by`, `ip_address`, `user_agent`, `created_at`

- **`role_feature_flags`**: Feature flags per role and tenant
  - Fields: `feature_flag_id`, `tenant_id`, `role_id`, `feature_name`, `is_enabled`

### 2. Backend Components

#### Services

- **`rbacService.js`**: Core RBAC business logic
  - Permission checking
  - Role management
  - User-role assignments
  - Audit logging
  - Feature flag management

#### Middleware

- **`rbac.js`**: RBAC enforcement middleware
  - `requirePermission(permissionName)`: Checks if user has specific permission
  - `requireAnyPermission(permissionNames)`: Checks if user has any of the specified permissions
  - `requireRoleName(roleName)`: Checks if user has specific role
  - `attachPermissions`: Attaches user's permissions to request for conditional logic
  - `requireTenantAccess`: Ensures tenant isolation

#### Controllers

- **`rbacController.js`**: RBAC API endpoints
  - Permission management
  - Role CRUD operations
  - Role assignments
  - Audit log retrieval
  - Feature flag management

#### Routes

- **`/api/rbac/*`**: RESTful API endpoints for RBAC operations

## Standard Roles and Permissions

### System Roles

#### Super Administrator (`super_admin`)
- **Scope**: System-wide across all tenants
- **Permissions**: All permissions including tenant management
- **Use Case**: Platform administrators who manage the entire system

#### Tenant Administrator (`tenant_admin`)
- **Scope**: Full access within their tenant
- **Permissions**: All permissions except tenant management
- **Use Case**: Store owners/managers with full control of their tenant

#### Manager (`manager`)
- **Scope**: Tenant-specific operational management
- **Permissions**: 
  - Orders: View, Create, Update, Delete, Manage, Export
  - Customers: View, Create, Update, Delete, Manage, Export
  - Products: View, Create, Update, Delete, Manage, Bulk Upload
  - Analytics: View, Export
  - Reports: View, Create
  - Messaging: Send
- **Use Case**: Store managers who handle day-to-day operations

#### Staff (`staff`)
- **Scope**: Tenant-specific basic operations
- **Permissions**: 
  - Orders: View, Update
  - Products: View
  - Customers: View, Update
- **Use Case**: Store staff who process orders and assist customers

#### Viewer (`viewer`)
- **Scope**: Tenant-specific read-only access
- **Permissions**: View permissions only (excluding sensitive areas)
- **Use Case**: Auditors, observers, or read-only dashboard access

### Permission Categories

1. **Users Management**: `users.*`
   - `users.view`, `users.create`, `users.update`, `users.delete`, `users.manage`, `users.invite_bulk`

2. **Role Management**: `roles.*`
   - `roles.view`, `roles.create`, `roles.update`, `roles.delete`, `roles.assign`

3. **Order Management**: `orders.*`
   - `orders.view`, `orders.create`, `orders.update`, `orders.delete`, `orders.manage`, `orders.export`

4. **Product Management**: `products.*`
   - `products.view`, `products.create`, `products.update`, `products.delete`, `products.manage`, `products.bulk_upload`

5. **Customer Management**: `customers.*`
   - `customers.view`, `customers.create`, `customers.update`, `customers.delete`, `customers.manage`, `customers.export`

6. **Analytics & Reports**: `analytics.*`, `reports.*`
   - `analytics.view`, `analytics.export`, `reports.view`, `reports.create`

7. **Settings**: `settings.*`
   - `settings.view`, `settings.update`, `settings.manage`

8. **Audit Logs**: `audit_logs.*`
   - `audit_logs.view`, `audit_logs.export`

9. **Feature Flags**: `feature_flags.*`
   - `feature_flags.view`, `feature_flags.update`

10. **Messaging & Notifications**: `messaging.*`, `notifications.*`
    - `messaging.send`, `notifications.manage`

11. **Tenant Management** (Super Admin only): `tenants.*`
    - `tenants.view`, `tenants.create`, `tenants.update`, `tenants.delete`, `tenants.manage`

## API Endpoints

### Permissions

```
GET    /api/rbac/permissions              - Get all permissions (optional: ?category=users)
```

### Roles

```
GET    /api/rbac/roles                    - Get all roles for tenant
GET    /api/rbac/roles/:role_id           - Get role by ID with permissions
POST   /api/rbac/roles                    - Create custom role
PUT    /api/rbac/roles/:role_id/permissions - Update role permissions
DELETE /api/rbac/roles/:role_id           - Delete custom role
```

### Role Assignments

```
POST   /api/rbac/assign                   - Assign role to user
POST   /api/rbac/revoke                   - Revoke role from user
GET    /api/rbac/users/:admin_id/roles    - Get user's roles and permissions
GET    /api/rbac/me                       - Get current user's roles and permissions
```

### Audit Logs

```
GET    /api/rbac/audit-logs               - Get audit logs (supports filtering)
```

### Feature Flags

```
GET    /api/rbac/feature-flags            - Get feature flags (optional: ?role_id=uuid)
PUT    /api/rbac/feature-flags            - Update feature flag
```

## Usage Examples

### 1. Protecting Routes with Permissions

```javascript
const { requirePermission } = require('../middleware/rbac');

// Protect a route that requires specific permission
router.get('/users', 
  authMiddleware, 
  requirePermission('users.view'), 
  usersController.getUsers
);

// Protect a route that requires any of multiple permissions
router.post('/bulk-operations', 
  authMiddleware, 
  requireAnyPermission(['products.bulk_upload', 'users.invite_bulk']), 
  bulkController.performOperation
);
```

### 2. Checking Permissions in Controllers

```javascript
const rbacService = require('../services/rbacService');

async function deleteUser(req, res) {
  // Check permission
  const hasPermission = await rbacService.hasPermission(
    req.user.admin_id, 
    'users.delete'
  );
  
  if (!hasPermission) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  
  // Perform deletion...
}
```

### 3. Creating Custom Roles

```javascript
// POST /api/rbac/roles
{
  "name": "inventory_manager",
  "display_name": "Inventory Manager",
  "description": "Manages product inventory and stock",
  "permission_ids": [
    "uuid-of-products.view",
    "uuid-of-products.update",
    "uuid-of-products.bulk_upload"
  ]
}
```

### 4. Assigning Roles to Users

```javascript
// POST /api/rbac/assign
{
  "admin_id": "user-uuid",
  "role_id": "role-uuid"
}
```

### 5. Managing Feature Flags

```javascript
// PUT /api/rbac/feature-flags
{
  "role_id": "manager-role-uuid",
  "feature_name": "advanced_analytics",
  "is_enabled": true
}
```

## Frontend Integration

### 1. Role Management UI

Create admin interfaces for:
- Viewing and creating custom roles
- Editing role permissions via permission matrix
- Assigning roles to users
- Viewing audit logs

### 2. Permission-Based UI Rendering

```javascript
// Check if user has permission before showing UI elements
if (userPermissions.includes('users.create')) {
  return <CreateUserButton />;
}
```

### 3. Feature Flag UI

Admin interface to:
- View all available feature flags
- Enable/disable features per role
- Enable/disable features per tenant

## Security Considerations

1. **Tenant Isolation**: Users can only access data within their tenant (except super admins)
2. **System Role Protection**: System roles cannot be deleted, only permissions can be customized
3. **Audit Trail**: All role/permission changes are logged with actor, timestamp, and changes
4. **Permission Inheritance**: Users can have multiple roles, permissions are combined
5. **Rate Limiting**: All RBAC endpoints are rate-limited to prevent abuse

## Migration and Setup

### Running Migrations

```bash
# Run the RBAC migration
psql $DATABASE_URL -f backend/migrations/11_rbac_system.sql
```

### Initial Setup

1. Migration automatically creates system roles and permissions
2. Existing super admins are assigned `super_admin` role
3. Existing tenant admins are assigned `tenant_admin` role

### Updating Existing Auth Middleware

The existing `requireRole` middleware in `auth.js` continues to work for backward compatibility, but new implementations should use the RBAC middleware for more granular control.

## Extension Guide

### Adding New Permissions

1. Insert new permission into `permissions` table:

```sql
INSERT INTO public.permissions (name, display_name, description, category)
VALUES ('invoices.generate', 'Generate Invoices', 'Generate and download invoices', 'invoices');
```

2. Assign permission to relevant roles:

```sql
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'tenant_admin' AND p.name = 'invoices.generate';
```

3. Use in routes:

```javascript
router.post('/invoices/generate', 
  authMiddleware, 
  requirePermission('invoices.generate'), 
  invoicesController.generate
);
```

### Creating Feature Flags for New Features

1. Define feature flag name (e.g., `advanced_reporting`)
2. Add UI in feature flags management to enable/disable per role
3. Check feature flag in backend:

```javascript
const flags = await rbacService.getFeatureFlags(tenantId, roleId);
const isEnabled = flags.find(f => f.feature_name === 'advanced_reporting')?.is_enabled;

if (!isEnabled) {
  return res.status(403).json({ error: 'Feature not enabled for this role' });
}
```

### Adding New System Roles

1. Insert into roles table with `is_system_role = true`
2. Assign appropriate permissions
3. Update role selection UI

## Best Practices

1. **Use Permissions Over Roles**: Check permissions, not roles, for authorization
2. **Principle of Least Privilege**: Grant minimum permissions needed
3. **Regular Audits**: Review audit logs regularly for suspicious activity
4. **Custom Roles for Complex Scenarios**: Create tenant-specific roles for unique workflows
5. **Feature Flags for Gradual Rollout**: Use feature flags to test new features with specific roles
6. **Document Custom Permissions**: Document any custom permissions added
7. **Test Permission Changes**: Always test permission changes in staging before production

## Compliance and Audit

### Audit Logging

All RBAC operations are logged:
- Role creation/update/deletion
- Permission changes
- Role assignments/revocations
- Feature flag changes

### Compliance Reports

Query audit logs for compliance reports:

```javascript
// Get all role changes in last 30 days
const logs = await rbacService.getAuditLogs(tenantId, {
  startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  action: 'role_assigned'
});
```

### Data Access Tracking

Combine RBAC audit logs with application audit logs to track:
- Who accessed what data
- When permissions were granted/revoked
- What changes were made by whom

## Troubleshooting

### User Cannot Access Route

1. Check if user is authenticated
2. Verify user has role assigned: `GET /api/rbac/me`
3. Verify role has required permission: `GET /api/rbac/roles/:role_id`
4. Check audit logs for recent permission changes

### Permission Not Working

1. Verify permission exists: `GET /api/rbac/permissions`
2. Check if permission is active
3. Verify role-permission mapping in database
4. Clear any permission caches (if implemented)

### Cannot Create Custom Role

1. Ensure user has `roles.create` permission
2. Check if role name is unique within tenant
3. Verify permission IDs are valid

## Future Enhancements

1. **Time-Based Permissions**: Temporary role assignments with expiration
2. **Resource-Level Permissions**: Permissions on specific resources (e.g., specific products)
3. **Permission Inheritance**: Hierarchical permission structures
4. **External Identity Providers**: SSO integration with SAML/OAuth
5. **API Key Permissions**: Granular permissions for API keys
6. **Permission Templates**: Pre-configured permission sets for common scenarios
7. **Permission Approval Workflow**: Request-approval flow for sensitive permissions

## Support

For questions or issues with the RBAC system:
1. Check this documentation
2. Review audit logs for configuration issues
3. Consult API documentation for endpoint details
4. Contact system administrator for permission requests
