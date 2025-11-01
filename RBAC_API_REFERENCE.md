# RBAC API Reference

Complete API reference for the Role-Based Access Control (RBAC) system.

## Base URL

```
/api/rbac
```

## Authentication

All RBAC endpoints require authentication via Bearer token:

```
Authorization: Bearer <jwt_token>
```

## Table of Contents

- [Role Management](#role-management)
- [Permission Management](#permission-management)
- [User Role Assignment](#user-role-assignment)
- [Role Templates](#role-templates)
- [Feature Flags](#feature-flags)
- [Audit & Reporting](#audit--reporting)
- [Utility Endpoints](#utility-endpoints)

---

## Role Management

### List Roles

Get all roles, optionally filtered.

**Endpoint:** `GET /api/rbac/roles`

**Access:** Admin, Super Admin

**Query Parameters:**
- `tenant_id` (optional) - Filter roles by tenant ID
- `include_system` (optional, default: true) - Include system roles
- `include_custom` (optional, default: true) - Include custom roles

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "role_id": "uuid",
      "name": "admin",
      "display_name": "Administrator",
      "description": "Full access within tenant",
      "tenant_id": null,
      "partner_id": null,
      "parent_role_id": null,
      "is_system": true,
      "is_custom": false,
      "priority": 900,
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### Get Role Details

Get a specific role with its permissions.

**Endpoint:** `GET /api/rbac/roles/:roleId`

**Access:** Admin, Super Admin

**Path Parameters:**
- `roleId` - Role UUID

**Response:**
```json
{
  "success": true,
  "data": {
    "role_id": "uuid",
    "name": "admin",
    "display_name": "Administrator",
    "description": "Full access within tenant",
    "tenant_id": null,
    "is_system": true,
    "is_custom": false,
    "priority": 900,
    "is_active": true,
    "permissions": [
      {
        "permission_id": "uuid",
        "name": "products:create",
        "description": "Create new products",
        "action": "create",
        "resource_name": "products",
        "resource_description": "Product catalog management",
        "granted_at": "2024-01-01T00:00:00Z",
        "granted_by": "uuid"
      }
    ]
  }
}
```

---

### Create Custom Role

Create a new custom role.

**Endpoint:** `POST /api/rbac/roles`

**Access:** Users with `roles:create` permission

**Request Body:**
```json
{
  "name": "store_manager",
  "display_name": "Store Manager",
  "description": "Manages day-to-day store operations",
  "tenant_id": "tenant-uuid",
  "partner_id": null,
  "parent_role_id": null,
  "permissions": ["permission-uuid-1", "permission-uuid-2"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Role created successfully",
  "data": {
    "role_id": "new-role-uuid",
    "name": "store_manager",
    "display_name": "Store Manager",
    "is_custom": true,
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

**Error Responses:**
- `400` - Missing required fields
- `403` - Custom roles not enabled for tenant or limit reached
- `500` - Server error

---

### Update Role

Update an existing custom role.

**Endpoint:** `PUT /api/rbac/roles/:roleId`

**Access:** Users with `roles:update` permission

**Path Parameters:**
- `roleId` - Role UUID

**Request Body:**
```json
{
  "display_name": "Updated Store Manager",
  "description": "Updated description",
  "is_active": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Role updated successfully",
  "data": {
    "role_id": "role-uuid",
    "name": "store_manager",
    "display_name": "Updated Store Manager",
    "updated_at": "2024-01-15T11:00:00Z"
  }
}
```

**Note:** System roles cannot be modified.

---

### Delete Role

Delete a custom role.

**Endpoint:** `DELETE /api/rbac/roles/:roleId`

**Access:** Users with `roles:delete` permission

**Path Parameters:**
- `roleId` - Role UUID

**Response:**
```json
{
  "success": true,
  "message": "Role deleted successfully"
}
```

**Error Responses:**
- `404` - Role not found or is a system role
- `500` - Server error

---

## Permission Management

### List Permissions

Get all permissions with resource information.

**Endpoint:** `GET /api/rbac/permissions`

**Access:** Admin, Super Admin

**Query Parameters:**
- `resource_name` (optional) - Filter by resource name
- `action` (optional) - Filter by action (create, read, update, delete, etc.)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "permission_id": "uuid",
      "resource_id": "resource-uuid",
      "action": "create",
      "name": "products:create",
      "description": "Create new products",
      "is_system": true,
      "is_active": true,
      "resource_name": "products",
      "resource_description": "Product catalog management",
      "resource_type": "entity"
    }
  ]
}
```

---

### List Resources

Get all available resources.

**Endpoint:** `GET /api/rbac/resources`

**Access:** Admin, Super Admin

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "resource_id": "uuid",
      "name": "products",
      "description": "Product catalog management",
      "resource_type": "entity",
      "parent_resource_id": null,
      "is_active": true,
      "permission_count": 6
    }
  ]
}
```

---

### Grant Permission to Role

Add a permission to a role.

**Endpoint:** `POST /api/rbac/permissions/grant`

**Access:** Users with `permissions:update` permission

**Request Body:**
```json
{
  "roleId": "role-uuid",
  "permissionId": "permission-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Permission granted successfully",
  "data": {
    "role_permission_id": "uuid",
    "role_id": "role-uuid",
    "permission_id": "permission-uuid",
    "granted_at": "2024-01-15T10:00:00Z"
  }
}
```

---

### Revoke Permission from Role

Remove a permission from a role.

**Endpoint:** `POST /api/rbac/permissions/revoke`

**Access:** Users with `permissions:update` permission

**Request Body:**
```json
{
  "roleId": "role-uuid",
  "permissionId": "permission-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Permission revoked successfully"
}
```

---

## User Role Assignment

### Get User Roles

Get all roles assigned to a user.

**Endpoint:** `GET /api/rbac/users/:userId/:userType/roles`

**Access:** Admin, Super Admin

**Path Parameters:**
- `userId` - User UUID
- `userType` - Either `admin` or `customer`

**Query Parameters:**
- `tenant_id` (optional) - Filter by tenant

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "role_id": "uuid",
      "name": "admin",
      "display_name": "Administrator",
      "description": "Full access within tenant",
      "priority": 900,
      "assigned_at": "2024-01-01T00:00:00Z",
      "expires_at": null,
      "assigned_by": "super-admin-uuid"
    }
  ]
}
```

---

### Get User Permissions

Get all permissions for a user (aggregated from all roles).

**Endpoint:** `GET /api/rbac/users/:userId/:userType/permissions`

**Access:** Admin, Super Admin

**Path Parameters:**
- `userId` - User UUID
- `userType` - Either `admin` or `customer`

**Query Parameters:**
- `tenant_id` (optional) - Filter by tenant

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "permission_id": "uuid",
      "name": "products:create",
      "description": "Create new products",
      "action": "create",
      "resource_name": "products",
      "resource_description": "Product catalog management"
    }
  ]
}
```

---

### Assign Role to User

Assign a role to a user.

**Endpoint:** `POST /api/rbac/users/assign-role`

**Access:** Users with `roles:assign` permission

**Request Body:**
```json
{
  "user_id": "user-uuid",
  "user_type": "admin",
  "role_id": "role-uuid",
  "tenant_id": "tenant-uuid",
  "expires_at": "2024-12-31T23:59:59Z"
}
```

**Field Descriptions:**
- `user_id` (required) - User UUID
- `user_type` (required) - Either `admin` or `customer`
- `role_id` (required) - Role UUID
- `tenant_id` (required) - Tenant UUID
- `expires_at` (optional) - Expiration timestamp (ISO 8601)

**Response:**
```json
{
  "success": true,
  "message": "Role assigned successfully",
  "data": {
    "user_role_id": "uuid",
    "user_id": "user-uuid",
    "role_id": "role-uuid",
    "assigned_at": "2024-01-15T10:00:00Z",
    "expires_at": "2024-12-31T23:59:59Z"
  }
}
```

---

### Revoke Role from User

Remove a role from a user.

**Endpoint:** `POST /api/rbac/users/revoke-role`

**Access:** Users with `roles:assign` permission

**Request Body:**
```json
{
  "user_id": "user-uuid",
  "role_id": "role-uuid",
  "tenant_id": "tenant-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Role revoked successfully"
}
```

---

### Bulk Assign Roles

Assign roles to multiple users at once.

**Endpoint:** `POST /api/rbac/users/bulk-assign`

**Access:** Users with `roles:assign` permission

**Request Body:**
```json
{
  "assignments": [
    {
      "user_id": "user-1-uuid",
      "user_type": "admin",
      "role_id": "role-uuid",
      "tenant_id": "tenant-uuid",
      "expires_at": null
    },
    {
      "user_id": "user-2-uuid",
      "user_type": "admin",
      "role_id": "role-uuid",
      "tenant_id": "tenant-uuid",
      "expires_at": "2024-12-31T23:59:59Z"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bulk assignment completed: 2 succeeded, 0 failed",
  "data": {
    "success": [
      {
        "user_id": "user-1-uuid",
        "role_id": "role-uuid",
        "result": { "user_role_id": "uuid" }
      },
      {
        "user_id": "user-2-uuid",
        "role_id": "role-uuid",
        "result": { "user_role_id": "uuid" }
      }
    ],
    "failed": []
  }
}
```

---

## Role Templates

### List Role Templates

Get all available role templates.

**Endpoint:** `GET /api/rbac/templates`

**Access:** Admin, Super Admin

**Query Parameters:**
- `category` (optional) - Filter by category (admin, customer, partner, support)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "template_id": "uuid",
      "name": "store_manager",
      "display_name": "Store Manager",
      "description": "Manages day-to-day store operations",
      "category": "admin",
      "permissions": [
        "products:create",
        "products:read",
        "products:update",
        "orders:read",
        "orders:update"
      ],
      "is_system": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### Create Role from Template

Create a new role based on a template.

**Endpoint:** `POST /api/rbac/templates/create-role`

**Access:** Users with `roles:create` permission

**Request Body:**
```json
{
  "template_id": "template-uuid",
  "tenant_id": "tenant-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Role created from template successfully",
  "data": {
    "role_id": "new-role-uuid",
    "name": "store_manager_1234567890",
    "display_name": "Store Manager",
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

---

## Feature Flags

### Get RBAC Feature Flags

Get RBAC feature flags for a tenant.

**Endpoint:** `GET /api/rbac/feature-flags`

**Access:** Super Admin

**Query Parameters:**
- `tenant_id` (required) - Tenant UUID

**Response:**
```json
{
  "success": true,
  "data": {
    "tenant_id": "tenant-uuid",
    "rbac_enabled": false,
    "custom_roles_enabled": false,
    "role_templates_enabled": true,
    "permission_inheritance_enabled": true,
    "bulk_assignment_enabled": false,
    "audit_logging_enabled": true,
    "access_review_enabled": false,
    "least_privilege_enforcement": true,
    "role_expiration_enabled": false,
    "max_custom_roles": 10,
    "max_users_per_role": 100,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

---

### Update RBAC Feature Flags

Update RBAC feature flags for a tenant (Super Admin only).

**Endpoint:** `PUT /api/rbac/feature-flags`

**Access:** Super Admin only

**Request Body:**
```json
{
  "tenant_id": "tenant-uuid",
  "rbac_enabled": true,
  "custom_roles_enabled": true,
  "bulk_assignment_enabled": true,
  "max_custom_roles": 20
}
```

**Response:**
```json
{
  "success": true,
  "message": "RBAC feature flags updated successfully",
  "data": {
    "tenant_id": "tenant-uuid",
    "rbac_enabled": true,
    "custom_roles_enabled": true,
    "bulk_assignment_enabled": true,
    "max_custom_roles": 20,
    "updated_at": "2024-01-15T10:00:00Z"
  }
}
```

---

## Audit & Reporting

### Get Audit Logs

Get RBAC audit logs with filtering.

**Endpoint:** `GET /api/rbac/audit-logs`

**Access:** Users with `audit_logs:read` permission

**Query Parameters:**
- `tenant_id` (optional) - Filter by tenant
- `action_type` (optional) - Filter by action type
  - Possible values: `role_created`, `role_updated`, `role_deleted`, `permission_granted`, `permission_revoked`, `role_assigned`, `role_revoked`, `rbac_flags_updated`
- `entity_type` (optional) - Filter by entity type
  - Possible values: `role`, `permission`, `user_role`, `rbac_feature_flags`
- `performed_by` (optional) - Filter by performer UUID
- `start_date` (optional) - Start date (ISO 8601)
- `end_date` (optional) - End date (ISO 8601)
- `limit` (optional, default: 50) - Results per page
- `offset` (optional, default: 0) - Pagination offset

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "audit_id": "uuid",
        "tenant_id": "tenant-uuid",
        "action_type": "role_assigned",
        "entity_type": "user_role",
        "entity_id": "entity-uuid",
        "entity_name": "admin",
        "performed_by": "admin-uuid",
        "performed_by_name": "admin@example.com",
        "affected_user_id": "user-uuid",
        "affected_user_name": "user@example.com",
        "old_value": null,
        "new_value": {
          "roleId": "role-uuid",
          "userId": "user-uuid",
          "userType": "admin"
        },
        "changes": null,
        "ip_address": "192.168.1.1",
        "user_agent": "Mozilla/5.0...",
        "reason": null,
        "created_at": "2024-01-15T10:00:00Z"
      }
    ],
    "total": 1,
    "limit": 50,
    "offset": 0,
    "pages": 1
  }
}
```

---

### Export Roles and Permissions

Export complete RBAC configuration.

**Endpoint:** `GET /api/rbac/export`

**Access:** Admin, Super Admin

**Query Parameters:**
- `tenant_id` (optional) - Filter by tenant

**Response:**
```json
{
  "success": true,
  "data": {
    "roles": [
      {
        "role_id": "uuid",
        "name": "admin",
        "display_name": "Administrator",
        "permissions": [
          {
            "permission_id": "uuid",
            "name": "products:create",
            "description": "Create new products"
          }
        ]
      }
    ],
    "permissions": [
      {
        "permission_id": "uuid",
        "name": "products:create",
        "description": "Create new products",
        "action": "create",
        "resource_name": "products"
      }
    ],
    "resources": [
      {
        "resource_id": "uuid",
        "name": "products",
        "description": "Product catalog management",
        "resource_type": "entity"
      }
    ],
    "exported_at": "2024-01-15T10:00:00Z",
    "exported_by": "admin@example.com"
  }
}
```

---

## Utility Endpoints

### Check Permission

Check if a user has a specific permission.

**Endpoint:** `GET /api/rbac/check-permission`

**Access:** Admin, Super Admin

**Query Parameters:**
- `user_id` (required) - User UUID
- `user_type` (required) - Either `admin` or `customer`
- `permission` (required) - Permission name (e.g., `products:create`)
- `tenant_id` (optional) - Tenant UUID

**Response:**
```json
{
  "success": true,
  "data": {
    "has_permission": true,
    "user_id": "user-uuid",
    "permission": "products:create",
    "tenant_id": "tenant-uuid"
  }
}
```

---

### Get My Permissions

Get current authenticated user's permissions.

**Endpoint:** `GET /api/rbac/my-permissions`

**Access:** Any authenticated user

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "role": "admin",
      "tenant_id": "tenant-uuid"
    },
    "roles": [
      {
        "role_id": "role-uuid",
        "name": "admin",
        "display_name": "Administrator",
        "priority": 900
      }
    ],
    "permissions": [
      {
        "permission_id": "uuid",
        "name": "products:create",
        "description": "Create new products",
        "action": "create",
        "resource_name": "products"
      }
    ]
  }
}
```

---

### Get My Roles

Get current authenticated user's roles.

**Endpoint:** `GET /api/rbac/my-roles`

**Access:** Any authenticated user

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "role": "admin",
      "tenant_id": "tenant-uuid"
    },
    "roles": [
      {
        "role_id": "role-uuid",
        "name": "admin",
        "display_name": "Administrator",
        "description": "Full access within tenant",
        "priority": 900,
        "assigned_at": "2024-01-01T00:00:00Z",
        "expires_at": null
      }
    ]
  }
}
```

---

## Error Responses

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (in development mode)"
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (missing or invalid parameters)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource not found)
- `500` - Internal Server Error

---

## Rate Limiting

All RBAC endpoints are subject to the standard API rate limiting:
- **Default**: 100 requests per 15 minutes per IP
- **Auth endpoints**: 20 requests per 15 minutes per IP

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

---

## Examples

### Example 1: Complete Role Setup Workflow

```bash
# 1. Create a custom role
curl -X POST https://api.example.com/api/rbac/roles \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "inventory_manager",
    "display_name": "Inventory Manager",
    "description": "Manages product inventory",
    "tenant_id": "tenant-uuid"
  }'

# 2. Grant permissions to the role
curl -X POST https://api.example.com/api/rbac/permissions/grant \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roleId": "new-role-uuid",
    "permissionId": "products-create-permission-uuid"
  }'

# 3. Assign role to a user
curl -X POST https://api.example.com/api/rbac/users/assign-role \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-uuid",
    "user_type": "admin",
    "role_id": "new-role-uuid",
    "tenant_id": "tenant-uuid"
  }'
```

### Example 2: Enable RBAC for Tenant

```bash
# Super admin enables RBAC features
curl -X PUT https://api.example.com/api/rbac/feature-flags \
  -H "Authorization: Bearer $SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "tenant-uuid",
    "rbac_enabled": true,
    "custom_roles_enabled": true,
    "bulk_assignment_enabled": true,
    "max_custom_roles": 25
  }'
```

### Example 3: Audit Log Query

```bash
# Get all role assignments in the last 30 days
curl -X GET "https://api.example.com/api/rbac/audit-logs?action_type=role_assigned&start_date=2024-01-01&limit=100" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Support

For API support or questions:
- Review the [RBAC Documentation](./RBAC_DOCUMENTATION.md)
- Check error responses for detailed information
- Contact your system administrator for access issues
