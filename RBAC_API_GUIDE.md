# RBAC API Usage Guide

This guide provides practical examples for using the RBAC (Role-Based Access Control) API endpoints in the Pulss platform.

## Table of Contents

- [Authentication](#authentication)
- [Permissions API](#permissions-api)
- [Roles API](#roles-api)
- [Role Assignments API](#role-assignments-api)
- [Audit Logs API](#audit-logs-api)
- [Feature Flags API](#feature-flags-api)
- [Frontend Integration](#frontend-integration)
- [Common Patterns](#common-patterns)

## Authentication

All RBAC endpoints require authentication. Include the JWT token in the Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```

## Permissions API

### Get All Permissions

Retrieve all available permissions in the system.

**Endpoint:** `GET /api/rbac/permissions`

**Required Permission:** `roles.view`

**Query Parameters:**
- `category` (optional): Filter by permission category (e.g., `users`, `orders`, `products`)

**Example Request:**

```bash
curl -X GET "http://localhost:5000/api/rbac/permissions?category=users" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Example Response:**

```json
[
  {
    "permission_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "users.view",
    "display_name": "View Users",
    "description": "View user list and details",
    "category": "users",
    "is_active": true
  },
  {
    "permission_id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "users.create",
    "display_name": "Create Users",
    "description": "Create new users",
    "category": "users",
    "is_active": true
  }
]
```

## Roles API

### Get All Roles

Retrieve all roles for the current tenant.

**Endpoint:** `GET /api/rbac/roles`

**Required Permission:** `roles.view`

**Example Request:**

```bash
curl -X GET "http://localhost:5000/api/rbac/roles" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Example Response:**

```json
[
  {
    "role_id": "660e8400-e29b-41d4-a716-446655440000",
    "tenant_id": null,
    "name": "super_admin",
    "display_name": "Super Administrator",
    "description": "Full system access across all tenants",
    "is_system_role": true,
    "is_active": true,
    "user_count": 2
  },
  {
    "role_id": "660e8400-e29b-41d4-a716-446655440001",
    "tenant_id": "770e8400-e29b-41d4-a716-446655440000",
    "name": "custom_manager",
    "display_name": "Custom Manager",
    "description": "Custom role for specific business needs",
    "is_system_role": false,
    "is_active": true,
    "user_count": 5
  }
]
```

### Get Role by ID

Retrieve a specific role with its permissions.

**Endpoint:** `GET /api/rbac/roles/:role_id`

**Required Permission:** `roles.view`

**Example Request:**

```bash
curl -X GET "http://localhost:5000/api/rbac/roles/660e8400-e29b-41d4-a716-446655440001" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Example Response:**

```json
{
  "role_id": "660e8400-e29b-41d4-a716-446655440001",
  "tenant_id": "770e8400-e29b-41d4-a716-446655440000",
  "name": "custom_manager",
  "display_name": "Custom Manager",
  "description": "Custom role for specific business needs",
  "is_system_role": false,
  "is_active": true,
  "permissions": [
    {
      "permission_id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "users.view",
      "display_name": "View Users",
      "description": "View user list and details",
      "category": "users"
    }
  ]
}
```

### Create Custom Role

Create a new custom role with specific permissions.

**Endpoint:** `POST /api/rbac/roles`

**Required Permission:** `roles.create`

**Request Body:**

```json
{
  "name": "inventory_specialist",
  "display_name": "Inventory Specialist",
  "description": "Manages product inventory and stock levels",
  "permission_ids": [
    "550e8400-e29b-41d4-a716-446655440010",
    "550e8400-e29b-41d4-a716-446655440011",
    "550e8400-e29b-41d4-a716-446655440012"
  ]
}
```

**Example Request:**

```bash
curl -X POST "http://localhost:5000/api/rbac/roles" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "inventory_specialist",
    "display_name": "Inventory Specialist",
    "description": "Manages product inventory and stock levels",
    "permission_ids": [
      "550e8400-e29b-41d4-a716-446655440010"
    ]
  }'
```

**Example Response:**

```json
{
  "role_id": "660e8400-e29b-41d4-a716-446655440002",
  "tenant_id": "770e8400-e29b-41d4-a716-446655440000",
  "name": "inventory_specialist",
  "display_name": "Inventory Specialist",
  "description": "Manages product inventory and stock levels",
  "is_system_role": false,
  "is_active": true
}
```

### Update Role Permissions

Update the permissions assigned to a role.

**Endpoint:** `PUT /api/rbac/roles/:role_id/permissions`

**Required Permission:** `roles.update`

**Request Body:**

```json
{
  "permission_ids": [
    "550e8400-e29b-41d4-a716-446655440010",
    "550e8400-e29b-41d4-a716-446655440011"
  ]
}
```

**Example Request:**

```bash
curl -X PUT "http://localhost:5000/api/rbac/roles/660e8400-e29b-41d4-a716-446655440002/permissions" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "permission_ids": [
      "550e8400-e29b-41d4-a716-446655440010",
      "550e8400-e29b-41d4-a716-446655440011"
    ]
  }'
```

**Example Response:**

```json
{
  "message": "Role permissions updated successfully"
}
```

### Delete Role

Soft delete a custom role (sets `is_active` to false).

**Endpoint:** `DELETE /api/rbac/roles/:role_id`

**Required Permission:** `roles.delete`

**Note:** System roles cannot be deleted.

**Example Request:**

```bash
curl -X DELETE "http://localhost:5000/api/rbac/roles/660e8400-e29b-41d4-a716-446655440002" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Example Response:**

```json
{
  "message": "Role deleted successfully"
}
```

## Role Assignments API

### Assign Role to User

Assign a role to a user (admin).

**Endpoint:** `POST /api/rbac/assign`

**Required Permission:** `roles.assign`

**Request Body:**

```json
{
  "admin_id": "880e8400-e29b-41d4-a716-446655440000",
  "role_id": "660e8400-e29b-41d4-a716-446655440001"
}
```

**Example Request:**

```bash
curl -X POST "http://localhost:5000/api/rbac/assign" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "admin_id": "880e8400-e29b-41d4-a716-446655440000",
    "role_id": "660e8400-e29b-41d4-a716-446655440001"
  }'
```

**Example Response:**

```json
{
  "user_role_id": "990e8400-e29b-41d4-a716-446655440000",
  "admin_id": "880e8400-e29b-41d4-a716-446655440000",
  "role_id": "660e8400-e29b-41d4-a716-446655440001",
  "assigned_by": "110e8400-e29b-41d4-a716-446655440000",
  "assigned_at": "2025-10-20T12:30:00.000Z"
}
```

### Revoke Role from User

Revoke a role from a user.

**Endpoint:** `POST /api/rbac/revoke`

**Required Permission:** `roles.assign`

**Request Body:**

```json
{
  "admin_id": "880e8400-e29b-41d4-a716-446655440000",
  "role_id": "660e8400-e29b-41d4-a716-446655440001"
}
```

**Example Request:**

```bash
curl -X POST "http://localhost:5000/api/rbac/revoke" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "admin_id": "880e8400-e29b-41d4-a716-446655440000",
    "role_id": "660e8400-e29b-41d4-a716-446655440001"
  }'
```

**Example Response:**

```json
{
  "message": "Role revoked successfully"
}
```

### Get User's Roles and Permissions

Retrieve all roles and permissions for a specific user.

**Endpoint:** `GET /api/rbac/users/:admin_id/roles`

**Required Permission:** Own data or `users.view`

**Example Request:**

```bash
curl -X GET "http://localhost:5000/api/rbac/users/880e8400-e29b-41d4-a716-446655440000/roles" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Example Response:**

```json
{
  "roles": [
    {
      "role_id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "tenant_admin",
      "display_name": "Tenant Administrator",
      "description": "Full access within tenant scope",
      "is_system_role": true,
      "tenant_id": "770e8400-e29b-41d4-a716-446655440000"
    }
  ],
  "permissions": [
    {
      "permission_id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "users.view",
      "display_name": "View Users",
      "category": "users",
      "description": "View user list and details"
    },
    {
      "permission_id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "users.create",
      "display_name": "Create Users",
      "category": "users",
      "description": "Create new users"
    }
  ]
}
```

### Get Current User's Roles and Permissions

Retrieve roles and permissions for the authenticated user.

**Endpoint:** `GET /api/rbac/me`

**Required Permission:** Authenticated user

**Example Request:**

```bash
curl -X GET "http://localhost:5000/api/rbac/me" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Audit Logs API

### Get Audit Logs

Retrieve audit logs for role and permission changes.

**Endpoint:** `GET /api/rbac/audit-logs`

**Required Permission:** `audit_logs.view`

**Query Parameters:**
- `action` (optional): Filter by action type
- `start_date` (optional): Filter by start date (ISO 8601)
- `end_date` (optional): Filter by end date (ISO 8601)
- `limit` (optional): Number of results (default: 100)

**Example Request:**

```bash
curl -X GET "http://localhost:5000/api/rbac/audit-logs?action=role_assigned&limit=50" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Example Response:**

```json
[
  {
    "audit_id": "aa0e8400-e29b-41d4-a716-446655440000",
    "tenant_id": "770e8400-e29b-41d4-a716-446655440000",
    "admin_id": "880e8400-e29b-41d4-a716-446655440000",
    "role_id": "660e8400-e29b-41d4-a716-446655440001",
    "action": "role_assigned",
    "target_admin_id": "880e8400-e29b-41d4-a716-446655440001",
    "changes": null,
    "performed_by": "110e8400-e29b-41d4-a716-446655440000",
    "performed_by_name": "John Doe",
    "target_admin_name": "Jane Smith",
    "role_name": "manager",
    "role_display_name": "Manager",
    "ip_address": "192.168.1.1",
    "user_agent": "Mozilla/5.0...",
    "created_at": "2025-10-20T12:30:00.000Z"
  }
]
```

## Feature Flags API

### Get Feature Flags

Retrieve feature flags for tenant and optionally a specific role.

**Endpoint:** `GET /api/rbac/feature-flags`

**Required Permission:** `feature_flags.view`

**Query Parameters:**
- `role_id` (optional): Filter by specific role

**Example Request:**

```bash
curl -X GET "http://localhost:5000/api/rbac/feature-flags?role_id=660e8400-e29b-41d4-a716-446655440001" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Example Response:**

```json
[
  {
    "feature_flag_id": "bb0e8400-e29b-41d4-a716-446655440000",
    "tenant_id": "770e8400-e29b-41d4-a716-446655440000",
    "role_id": "660e8400-e29b-41d4-a716-446655440001",
    "feature_name": "advanced_analytics",
    "is_enabled": true,
    "created_at": "2025-10-20T10:00:00.000Z",
    "updated_at": "2025-10-20T12:00:00.000Z"
  }
]
```

### Update Feature Flag

Enable or disable a feature flag for a specific role.

**Endpoint:** `PUT /api/rbac/feature-flags`

**Required Permission:** `feature_flags.update`

**Request Body:**

```json
{
  "role_id": "660e8400-e29b-41d4-a716-446655440001",
  "feature_name": "advanced_analytics",
  "is_enabled": true
}
```

**Example Request:**

```bash
curl -X PUT "http://localhost:5000/api/rbac/feature-flags" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role_id": "660e8400-e29b-41d4-a716-446655440001",
    "feature_name": "advanced_analytics",
    "is_enabled": true
  }'
```

**Example Response:**

```json
{
  "feature_flag_id": "bb0e8400-e29b-41d4-a716-446655440000",
  "tenant_id": "770e8400-e29b-41d4-a716-446655440000",
  "role_id": "660e8400-e29b-41d4-a716-446655440001",
  "feature_name": "advanced_analytics",
  "is_enabled": true,
  "created_at": "2025-10-20T10:00:00.000Z",
  "updated_at": "2025-10-20T12:30:00.000Z"
}
```

## Frontend Integration

### React/TypeScript Example

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Fetch user permissions
const { data: permissions } = useQuery({
  queryKey: ['my-permissions'],
  queryFn: async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/rbac/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
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

// Assign role mutation
const assignRoleMutation = useMutation({
  mutationFn: async ({ admin_id, role_id }: AssignRoleParams) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/rbac/assign`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ admin_id, role_id })
    });
    
    if (!response.ok) {
      throw new Error('Failed to assign role');
    }
    
    return response.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['roles'] });
  }
});
```

### Conditional Rendering

```tsx
// Show button only if user has permission
{hasPermission('users.create') && (
  <Button onClick={handleCreateUser}>
    Create User
  </Button>
)}

// Check multiple permissions
{hasPermission('orders.view') || hasPermission('orders.manage') ? (
  <OrdersTable />
) : (
  <div>You don't have permission to view orders</div>
)}
```

## Common Patterns

### Creating a Custom Role for Store Managers

```bash
# 1. Get all available permissions
curl -X GET "http://localhost:5000/api/rbac/permissions" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 2. Create custom role with selected permissions
curl -X POST "http://localhost:5000/api/rbac/roles" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "store_manager",
    "display_name": "Store Manager",
    "description": "Manages daily store operations",
    "permission_ids": [
      "orders.view", "orders.update",
      "products.view", "products.update",
      "customers.view", "customers.update"
    ]
  }'

# 3. Assign role to user
curl -X POST "http://localhost:5000/api/rbac/assign" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "admin_id": "USER_ID",
    "role_id": "NEW_ROLE_ID"
  }'
```

### Setting Up Feature Flags for Premium Features

```bash
# Enable advanced analytics for manager role
curl -X PUT "http://localhost:5000/api/rbac/feature-flags" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role_id": "MANAGER_ROLE_ID",
    "feature_name": "advanced_analytics",
    "is_enabled": true
  }'

# Enable bulk operations for admin role
curl -X PUT "http://localhost:5000/api/rbac/feature-flags" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role_id": "ADMIN_ROLE_ID",
    "feature_name": "bulk_operations",
    "is_enabled": true
  }'
```

### Auditing Role Changes

```bash
# Get all role assignments in the last 30 days
curl -X GET "http://localhost:5000/api/rbac/audit-logs?action=role_assigned&start_date=2025-09-20T00:00:00Z" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get all permission changes
curl -X GET "http://localhost:5000/api/rbac/audit-logs?action=permission_updated" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Error Responses

All endpoints may return the following error responses:

### 401 Unauthorized

```json
{
  "error": "Not authenticated"
}
```

### 403 Forbidden

```json
{
  "error": "Insufficient permissions",
  "required": "roles.create"
}
```

### 404 Not Found

```json
{
  "error": "Role not found"
}
```

### 400 Bad Request

```json
{
  "error": "Name and display name are required"
}
```

### 500 Internal Server Error

```json
{
  "error": "Failed to create role"
}
```

## Rate Limiting

All RBAC endpoints are rate-limited to prevent abuse. Current limits:
- 100 requests per minute per IP address
- 500 requests per hour per user

When rate limit is exceeded:

```json
{
  "error": "Too many requests",
  "retryAfter": 60
}
```

## Best Practices

1. **Always check permissions before making requests** - Use `GET /api/rbac/me` to check user's permissions
2. **Cache permissions on the client** - Reduce API calls by caching permissions
3. **Use specific permissions** - Check for specific permissions (e.g., `users.create`) rather than roles
4. **Log important actions** - Audit logs are automatically created, but supplement with application logs
5. **Test with different roles** - Always test features with different role configurations
6. **Handle permission errors gracefully** - Show user-friendly messages when permissions are denied
7. **Validate on backend** - Never rely solely on frontend permission checks

## Support

For additional help or questions:
- Review the [RBAC Architecture Documentation](./RBAC_ARCHITECTURE.md)
- Check the audit logs for troubleshooting
- Contact your system administrator for permission requests
