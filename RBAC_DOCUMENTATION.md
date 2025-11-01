# RBAC (Role-Based Access Control) System Documentation

## Overview

The Pulss platform now includes a comprehensive Role-Based Access Control (RBAC) system that provides fine-grained permission management across all tenants. This system is fully controlled by super admin toggles and includes audit logging, role templates, and compliance features.

## Table of Contents

1. [Architecture](#architecture)
2. [Database Schema](#database-schema)
3. [Predefined Roles](#predefined-roles)
4. [Permissions](#permissions)
5. [API Endpoints](#api-endpoints)
6. [Super Admin Controls](#super-admin-controls)
7. [Usage Examples](#usage-examples)
8. [Integration Guide](#integration-guide)
9. [Compliance Features](#compliance-features)
10. [Extension Points](#extension-points)

---

## Architecture

### Core Components

1. **Resources**: Entities that can be controlled (products, orders, customers, etc.)
2. **Permissions**: Granular actions on resources (create, read, update, delete, export, etc.)
3. **Roles**: Collections of permissions with hierarchical support
4. **User Roles**: Assignment of roles to users
5. **RBAC Feature Flags**: Super admin toggles controlling RBAC features per tenant
6. **Audit Logs**: Complete trail of all RBAC changes

### Key Features

- ✅ **Granular Permissions**: Resource-action based permissions (e.g., `products:create`, `orders:read`)
- ✅ **Custom Roles**: Admins can create custom roles with specific permissions
- ✅ **Role Templates**: Pre-configured roles for quick setup
- ✅ **Role Hierarchy**: Support for parent-child role relationships
- ✅ **Permission Inheritance**: Roles can inherit permissions from parent roles
- ✅ **Bulk Operations**: Assign roles to multiple users at once
- ✅ **Temporal Assignments**: Roles can expire after a specified time
- ✅ **Audit Logging**: Complete history of all RBAC changes
- ✅ **Feature Toggles**: Super admin controls which RBAC features are enabled per tenant
- ✅ **Tenant Isolation**: Complete separation of roles and permissions between tenants
- ✅ **Compliance**: Least-privilege enforcement and access reviews

---

## Database Schema

### Resources Table
Defines all controllable resources in the system.

```sql
CREATE TABLE resources (
  resource_id UUID PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  resource_type VARCHAR(50) NOT NULL, -- 'entity', 'feature', 'system'
  parent_resource_id UUID REFERENCES resources(resource_id),
  is_active BOOLEAN DEFAULT true
);
```

### Permissions Table
Defines granular permissions for resources.

```sql
CREATE TABLE permissions (
  permission_id UUID PRIMARY KEY,
  resource_id UUID REFERENCES resources(resource_id) NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'create', 'read', 'update', 'delete', 'export', etc.
  name VARCHAR(150) UNIQUE NOT NULL, -- e.g., 'products:create'
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true
);
```

### Roles Table
Defines roles with hierarchy support.

```sql
CREATE TABLE roles (
  role_id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(150) NOT NULL,
  description TEXT,
  tenant_id UUID REFERENCES tenants(tenant_id),
  partner_id UUID,
  parent_role_id UUID REFERENCES roles(role_id),
  is_system BOOLEAN DEFAULT false,
  is_custom BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID
);
```

### User Roles Table
Maps users to their assigned roles.

```sql
CREATE TABLE user_roles (
  user_role_id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  user_type VARCHAR(20) NOT NULL, -- 'admin' or 'customer'
  role_id UUID REFERENCES roles(role_id) NOT NULL,
  tenant_id UUID REFERENCES tenants(tenant_id),
  assigned_by UUID,
  assigned_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP, -- Optional expiration
  is_active BOOLEAN DEFAULT true
);
```

### RBAC Feature Flags Table
Super admin controls for RBAC features per tenant.

```sql
CREATE TABLE rbac_feature_flags (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(tenant_id),
  rbac_enabled BOOLEAN DEFAULT false,
  custom_roles_enabled BOOLEAN DEFAULT false,
  role_templates_enabled BOOLEAN DEFAULT true,
  permission_inheritance_enabled BOOLEAN DEFAULT true,
  bulk_assignment_enabled BOOLEAN DEFAULT false,
  audit_logging_enabled BOOLEAN DEFAULT true,
  access_review_enabled BOOLEAN DEFAULT false,
  least_privilege_enforcement BOOLEAN DEFAULT true,
  max_custom_roles INTEGER DEFAULT 10,
  max_users_per_role INTEGER DEFAULT 100
);
```

---

## Predefined Roles

The system comes with six predefined system roles:

### 1. Super Administrator
- **Name**: `super_admin`
- **Priority**: 1000
- **Permissions**: ALL
- **Description**: Full system access across all tenants

### 2. Administrator
- **Name**: `admin`
- **Priority**: 900
- **Permissions**: All except tenant management
- **Description**: Full access within tenant

### 3. Partner
- **Name**: `partner`
- **Priority**: 800
- **Permissions**: Access to multiple tenants with administrative rights
- **Description**: Partner with multi-tenant access

### 4. Reseller
- **Name**: `reseller`
- **Priority**: 700
- **Permissions**: Limited administrative access
- **Description**: Reseller with sales and customer management

### 5. Support Agent
- **Name**: `support`
- **Priority**: 600
- **Permissions**: Read-only access + order and customer updates
- **Description**: Customer support representative

### 6. User
- **Name**: `user`
- **Priority**: 100
- **Permissions**: Basic customer permissions
- **Description**: Basic user with limited access

---

## Permissions

### Permission Format
Permissions follow the format: `resource:action`

Examples:
- `products:create`
- `orders:read`
- `customers:update`
- `reports:export`

### Default Resources and Actions

#### Products
- `products:create` - Create new products
- `products:read` - View products
- `products:update` - Update products
- `products:delete` - Delete products
- `products:export` - Export product data
- `products:import` - Import products

#### Orders
- `orders:create` - Create new orders
- `orders:read` - View orders
- `orders:update` - Update order status
- `orders:delete` - Cancel orders
- `orders:export` - Export order data

#### Customers
- `customers:create` - Add new customers
- `customers:read` - View customer information
- `customers:update` - Update customer information
- `customers:delete` - Delete customers
- `customers:export` - Export customer data

#### Reports
- `reports:read` - View reports
- `reports:export` - Export reports

#### Settings
- `settings:read` - View settings
- `settings:update` - Modify settings

#### Users
- `users:create` - Create new users
- `users:read` - View users
- `users:update` - Update user information
- `users:delete` - Delete users

#### Roles
- `roles:create` - Create custom roles
- `roles:read` - View roles
- `roles:update` - Modify roles
- `roles:delete` - Delete roles
- `roles:assign` - Assign roles to users

#### Audit Logs
- `audit_logs:read` - View audit logs
- `audit_logs:export` - Export audit logs

---

## API Endpoints

### Role Management

#### Get All Roles
```http
GET /api/rbac/roles
Query Parameters:
  - tenant_id: Filter by tenant
  - include_system: Include system roles (default: true)
  - include_custom: Include custom roles (default: true)
```

#### Get Role by ID
```http
GET /api/rbac/roles/:roleId
Response includes role details and all associated permissions
```

#### Create Custom Role
```http
POST /api/rbac/roles
Body:
{
  "name": "store_manager",
  "display_name": "Store Manager",
  "description": "Manages day-to-day store operations",
  "tenant_id": "uuid",
  "permissions": ["permission-uuid-1", "permission-uuid-2"]
}
```

#### Update Role
```http
PUT /api/rbac/roles/:roleId
Body:
{
  "display_name": "Updated Name",
  "description": "Updated description",
  "is_active": true
}
```

#### Delete Role
```http
DELETE /api/rbac/roles/:roleId
Note: Only custom roles can be deleted
```

### Permission Management

#### Get All Permissions
```http
GET /api/rbac/permissions
Query Parameters:
  - resource_name: Filter by resource
  - action: Filter by action
```

#### Get All Resources
```http
GET /api/rbac/resources
Returns all resources with permission counts
```

#### Grant Permission to Role
```http
POST /api/rbac/permissions/grant
Body:
{
  "roleId": "uuid",
  "permissionId": "uuid"
}
```

#### Revoke Permission from Role
```http
POST /api/rbac/permissions/revoke
Body:
{
  "roleId": "uuid",
  "permissionId": "uuid"
}
```

### User Role Assignment

#### Get User Roles
```http
GET /api/rbac/users/:userId/:userType/roles
Query Parameters:
  - tenant_id: Filter by tenant
```

#### Get User Permissions
```http
GET /api/rbac/users/:userId/:userType/permissions
Query Parameters:
  - tenant_id: Filter by tenant
```

#### Assign Role to User
```http
POST /api/rbac/users/assign-role
Body:
{
  "user_id": "uuid",
  "user_type": "admin", // or "customer"
  "role_id": "uuid",
  "tenant_id": "uuid",
  "expires_at": "2024-12-31T23:59:59Z" // Optional
}
```

#### Revoke Role from User
```http
POST /api/rbac/users/revoke-role
Body:
{
  "user_id": "uuid",
  "role_id": "uuid",
  "tenant_id": "uuid"
}
```

#### Bulk Assign Roles
```http
POST /api/rbac/users/bulk-assign
Body:
{
  "assignments": [
    {
      "user_id": "uuid",
      "user_type": "admin",
      "role_id": "uuid",
      "tenant_id": "uuid"
    },
    // ... more assignments
  ]
}
```

### Role Templates

#### Get Role Templates
```http
GET /api/rbac/templates
Query Parameters:
  - category: Filter by category (admin, customer, partner, support)
```

#### Create Role from Template
```http
POST /api/rbac/templates/create-role
Body:
{
  "template_id": "uuid",
  "tenant_id": "uuid"
}
```

### Super Admin Controls

#### Get RBAC Feature Flags
```http
GET /api/rbac/feature-flags?tenant_id=uuid
Requires: Super Admin role
```

#### Update RBAC Feature Flags
```http
PUT /api/rbac/feature-flags
Body:
{
  "tenant_id": "uuid",
  "rbac_enabled": true,
  "custom_roles_enabled": true,
  "bulk_assignment_enabled": false
}
Requires: Super Admin role
```

### Audit & Reporting

#### Get Audit Logs
```http
GET /api/rbac/audit-logs
Query Parameters:
  - tenant_id: Filter by tenant
  - action_type: Filter by action type
  - entity_type: Filter by entity type
  - performed_by: Filter by user
  - start_date: Start date filter
  - end_date: End date filter
  - limit: Results per page (default: 50)
  - offset: Pagination offset (default: 0)
```

#### Export Roles and Permissions
```http
GET /api/rbac/export
Query Parameters:
  - tenant_id: Filter by tenant (optional)
Returns: Complete export of roles, permissions, and resources
```

### Utility Endpoints

#### Check Permission
```http
GET /api/rbac/check-permission
Query Parameters:
  - user_id: User ID
  - user_type: User type (admin/customer)
  - permission: Permission to check
  - tenant_id: Tenant ID (optional)
```

#### Get My Permissions
```http
GET /api/rbac/my-permissions
Returns: Current user's roles and permissions
```

#### Get My Roles
```http
GET /api/rbac/my-roles
Returns: Current user's roles
```

---

## Super Admin Controls

Super admins have complete control over RBAC features through feature flags. Each tenant can have different RBAC capabilities enabled.

### Feature Flags

1. **rbac_enabled**: Master toggle for the entire RBAC system
2. **custom_roles_enabled**: Allow creating custom roles
3. **role_templates_enabled**: Allow using role templates
4. **permission_inheritance_enabled**: Enable permission inheritance
5. **bulk_assignment_enabled**: Enable bulk role assignments
6. **audit_logging_enabled**: Track RBAC changes
7. **access_review_enabled**: Enable periodic access reviews
8. **least_privilege_enforcement**: Enforce least-privilege principle
9. **role_expiration_enabled**: Allow temporary role assignments
10. **max_custom_roles**: Limit custom roles per tenant
11. **max_users_per_role**: Limit users per role

### Enabling RBAC for a Tenant

```javascript
// Super admin request
PUT /api/rbac/feature-flags
{
  "tenant_id": "tenant-uuid",
  "rbac_enabled": true,
  "custom_roles_enabled": true,
  "role_templates_enabled": true,
  "bulk_assignment_enabled": true,
  "max_custom_roles": 20
}
```

---

## Usage Examples

### Example 1: Creating a Custom Role

```javascript
// Step 1: Create the role
POST /api/rbac/roles
{
  "name": "inventory_manager",
  "display_name": "Inventory Manager",
  "description": "Manages product inventory",
  "tenant_id": "tenant-uuid"
}

// Step 2: Grant permissions
POST /api/rbac/permissions/grant
{
  "roleId": "new-role-uuid",
  "permissionId": "products-create-permission-uuid"
}

POST /api/rbac/permissions/grant
{
  "roleId": "new-role-uuid",
  "permissionId": "products-update-permission-uuid"
}
```

### Example 2: Assigning Role to User

```javascript
POST /api/rbac/users/assign-role
{
  "user_id": "user-uuid",
  "user_type": "admin",
  "role_id": "inventory-manager-role-uuid",
  "tenant_id": "tenant-uuid"
}
```

### Example 3: Using Middleware for Permission Checking

```javascript
const { requirePermission } = require('../middleware/rbac');

// Protect route with permission check
router.post('/products', 
  authMiddleware,
  requirePermission('products:create'),
  productController.createProduct
);
```

### Example 4: Bulk Role Assignment

```javascript
POST /api/rbac/users/bulk-assign
{
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
}
```

### Example 5: Creating Role from Template

```javascript
// List available templates
GET /api/rbac/templates?category=admin

// Create role from template
POST /api/rbac/templates/create-role
{
  "template_id": "store-manager-template-uuid",
  "tenant_id": "tenant-uuid"
}
```

---

## Integration Guide

### Integrating RBAC with Existing Code

#### 1. Update Auth Middleware

```javascript
const { authMiddleware } = require('../middleware/auth');
const { requirePermission, attachUserPermissions } = require('../middleware/rbac');

// Basic route with role check (legacy)
router.get('/products', authMiddleware, productController.list);

// Route with RBAC permission check
router.post('/products', 
  authMiddleware,
  requirePermission('products:create'),
  productController.create
);

// Route with multiple permission options
router.get('/reports', 
  authMiddleware,
  requireAnyPermission(['reports:read', 'analytics:read']),
  reportController.list
);
```

#### 2. Check Permissions in Controllers

```javascript
const rbacService = require('../services/rbacService');

exports.createProduct = async (req, res) => {
  try {
    // Permission already checked by middleware
    // Additional business logic here
    
    // Check additional permission dynamically
    const canExport = await rbacService.hasPermission(
      req.user.id,
      'admin',
      'products:export',
      req.user.tenant_id
    );
    
    // Your logic here
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

#### 3. Frontend Integration

```javascript
// Fetch user permissions on login
const fetchUserPermissions = async () => {
  const response = await fetch('/api/rbac/my-permissions', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  return data.permissions;
};

// Check permission in UI
const canCreateProduct = permissions.some(p => p.name === 'products:create');

// Render UI conditionally
{canCreateProduct && (
  <button onClick={createProduct}>Create Product</button>
)}
```

### Notification Integration

The RBAC system automatically logs all changes. You can integrate with the notification system:

```javascript
// In rbacService.js, after successful role assignment
const notificationService = require('./notificationService');

await notificationService.sendNotification({
  user_id: userId,
  tenant_id: tenantId,
  title: 'Role Assigned',
  message: `You have been assigned the role: ${roleName}`,
  type: 'system',
  channel: 'in_app'
});
```

### Billing Integration

Track RBAC feature usage for billing:

```javascript
// When custom role is created
const billingService = require('./billingService');

await billingService.trackFeatureUsage({
  tenant_id: tenantId,
  feature: 'custom_roles',
  quantity: 1
});
```

---

## Compliance Features

### Least-Privilege Enforcement

When enabled, the system logs all access attempts for compliance auditing:

```javascript
// Automatically logs access attempts
const { enforceLeastPrivilege } = require('../middleware/rbac');

router.use(enforceLeastPrivilege());
```

### Access Reviews

Schedule periodic reviews of user permissions:

```javascript
// Create access review
INSERT INTO access_reviews (
  tenant_id,
  review_type,
  reviewer_id,
  scheduled_date
) VALUES (
  'tenant-uuid',
  'scheduled',
  'reviewer-uuid',
  '2024-12-31'
);
```

### Audit Trail

Complete history of all RBAC changes:

```javascript
GET /api/rbac/audit-logs?tenant_id=uuid&start_date=2024-01-01

// Response includes:
{
  "logs": [
    {
      "action_type": "role_assigned",
      "entity_type": "user_role",
      "performed_by": "admin-uuid",
      "affected_user_id": "user-uuid",
      "old_value": null,
      "new_value": { "role": "admin" },
      "ip_address": "192.168.1.1",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

## Extension Points

### Adding New Resources

```sql
-- Add new resource
INSERT INTO resources (name, description, resource_type)
VALUES ('invoices', 'Invoice management', 'entity');

-- Add permissions for the resource
INSERT INTO permissions (resource_id, action, name, description)
SELECT resource_id, 'create', 'invoices:create', 'Create invoices'
FROM resources WHERE name = 'invoices';
```

### Adding Custom Permissions

```sql
-- Add custom permission action
INSERT INTO permissions (resource_id, action, name, description)
SELECT resource_id, 'approve', 'orders:approve', 'Approve orders'
FROM resources WHERE name = 'orders';
```

### Creating Role Templates

```javascript
POST /api/rbac/templates
{
  "name": "warehouse_manager",
  "display_name": "Warehouse Manager",
  "description": "Manages warehouse operations",
  "category": "admin",
  "permissions": [
    "products:read",
    "products:update",
    "orders:read",
    "orders:update"
  ]
}
```

### Custom Middleware

```javascript
// Create custom permission middleware
const requireCustomPermission = (resource, action, condition) => {
  return async (req, res, next) => {
    const permission = `${resource}:${action}`;
    
    // Check base permission
    const hasPermission = await rbacService.hasPermission(
      req.user.id,
      'admin',
      permission,
      req.user.tenant_id
    );
    
    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    // Additional custom logic
    if (condition && !condition(req)) {
      return res.status(403).json({ error: 'Condition not met' });
    }
    
    next();
  };
};
```

---

## Best Practices

1. **Use Least Privilege**: Grant only the minimum permissions required
2. **Regular Reviews**: Schedule periodic access reviews
3. **Audit Everything**: Keep audit logging enabled
4. **Role Templates**: Use templates for consistency
5. **Temporal Roles**: Use expiration dates for temporary access
6. **Hierarchical Roles**: Leverage role hierarchy for easier management
7. **Tenant Isolation**: Always enforce tenant boundaries
8. **Testing**: Test permission changes in staging before production
9. **Documentation**: Document custom roles and their purposes
10. **Monitoring**: Monitor audit logs for suspicious activity

---

## Troubleshooting

### RBAC Not Working

1. Check if RBAC is enabled for the tenant:
   ```
   GET /api/rbac/feature-flags?tenant_id=uuid
   ```

2. Verify user has the role assigned:
   ```
   GET /api/rbac/users/:userId/admin/roles
   ```

3. Verify role has the permission:
   ```
   GET /api/rbac/roles/:roleId
   ```

### Permission Denied Errors

1. Check user's actual permissions:
   ```
   GET /api/rbac/my-permissions
   ```

2. Check if permission exists:
   ```
   GET /api/rbac/permissions
   ```

3. Review audit logs:
   ```
   GET /api/rbac/audit-logs?performed_by=userId
   ```

---

## Support

For questions or issues with the RBAC system:

1. Review this documentation
2. Check the audit logs for detailed error information
3. Review the API endpoint responses for specific error messages
4. Contact the development team for assistance

---

## Version History

- **v1.0.0** (2024-10-20): Initial RBAC system implementation
  - Core RBAC functionality
  - Predefined roles and permissions
  - Super admin controls
  - Audit logging
  - Role templates
  - Compliance features
