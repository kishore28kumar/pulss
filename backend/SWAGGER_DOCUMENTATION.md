# Pulss Platform API Documentation Guide

## Overview

The Pulss Platform API is now fully documented using Swagger/OpenAPI 3.0. This provides an interactive interface for exploring, testing, and understanding all backend API endpoints.

## Accessing the Documentation

### Local Development
When running the backend server locally:
```
http://localhost:3000/api/docs
```

### Production
```
https://api.pulss.io/api/docs
```

## Features

### 1. Interactive API Explorer
- **Browse all endpoints**: Organized by tags (Authentication, Users, Tenants, Customers, etc.)
- **Test endpoints directly**: Execute API calls from the browser
- **View request/response schemas**: See expected data structures
- **Error code documentation**: Understand all possible error responses

### 2. JWT Authorization Support
The Swagger UI includes built-in support for testing authenticated endpoints:

1. Click the **"Authorize"** button in the top-right corner
2. Enter your JWT token in the format: `Bearer <your-token>`
3. Click **"Authorize"**
4. All subsequent requests will include your authentication token

#### Getting a JWT Token

First, register or login to get a token:

**Login Request:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePass123!"
  }'
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

Copy the token value and use it in Swagger UI's Authorize dialog.

### 3. Comprehensive Documentation

#### Authentication Endpoints (`/api/auth`)
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/password-reset/request` - Request password reset
- `POST /api/auth/password-reset/confirm` - Confirm password reset

#### Tenant Management (`/api/tenants`)
- `POST /api/tenants` - Create new tenant (Super Admin only)
- `GET /api/tenants` - Get all tenants (Super Admin only)
- `GET /api/tenants/{id}` - Get tenant by ID
- `PUT /api/tenants/{id}` - Update tenant profile
- `PATCH /api/tenants/{id}/status` - Update tenant status (Super Admin only)
- `GET /api/tenants/{id}/settings` - Get public tenant settings

#### Customer Management (`/api/customers`)
- `GET /api/customers` - Get all customers
- `GET /api/customers/{id}` - Get customer by ID
- `POST /api/customers` - Create new customer (Admin only)
- `PUT /api/customers/{id}` - Update customer (Admin only)
- `GET /api/customers/{id}/stats` - Get customer statistics

#### Audit Logs (`/api/audit-logs`)
- `GET /api/audit-logs` - Get audit logs with filtering
- `GET /api/audit-logs/stats` - Get audit log statistics
- `GET /api/audit-logs/export` - Export audit logs as CSV
- `GET /api/audit-logs/{logId}` - Get specific audit log

## Security

### Authentication
All protected endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Role-Based Access Control (RBAC)
The API implements three user roles:
- **Super Admin**: Full system access
- **Admin**: Tenant-level management
- **Customer**: Customer-facing operations

Endpoints document required roles in their security requirements.

### Tenant Isolation
Multi-tenant architecture ensures data isolation:
- Each tenant's data is completely isolated
- Tenant context is enforced via middleware
- Cross-tenant data access is prevented

## API Response Formats

### Success Response
```json
{
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "error": "Error message description",
  "details": { ... } // Optional additional information
}
```

### Common HTTP Status Codes
- `200 OK` - Successful GET/PUT/PATCH request
- `201 Created` - Successful POST request
- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## Pagination

Endpoints that return lists support pagination:

**Query Parameters:**
- `page` - Page number (default: 1, min: 1)
- `limit` - Results per page (default: 20, min: 1, max: 100)

**Response Format:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

## Filtering and Searching

Many endpoints support filtering and search:

**Example: Audit Logs Filtering**
```
GET /api/audit-logs?action=CREATE&entity_type=customer&start_date=2024-01-01&end_date=2024-12-31
```

**Example: Customer Search**
```
GET /api/customers?search=john&page=1&limit=20
```

## Rate Limiting

API requests are rate-limited to prevent abuse:
- **Authentication endpoints**: 5 requests per 15 minutes per IP
- **General API endpoints**: 100 requests per 15 minutes per IP

When rate limit is exceeded:
```json
{
  "error": "Too many requests, please try again later."
}
```

## Extending the Documentation

### Adding Documentation to New Endpoints

When creating new API endpoints, add Swagger JSDoc comments:

```javascript
/**
 * @swagger
 * /api/your-endpoint:
 *   post:
 *     tags: [YourTag]
 *     summary: Brief description
 *     description: Detailed description
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - field1
 *             properties:
 *               field1:
 *                 type: string
 *                 example: example-value
 *     responses:
 *       200:
 *         description: Success response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Bad request
 */
router.post('/your-endpoint', authMiddleware, yourController.yourMethod);
```

### Defining Reusable Schemas

Add schemas to `backend/config/swagger.js`:

```javascript
components: {
  schemas: {
    YourModel: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
          description: 'Unique identifier'
        },
        name: {
          type: 'string',
          description: 'Name field'
        }
      }
    }
  }
}
```

Reference schemas in your documentation:
```javascript
schema:
  $ref: '#/components/schemas/YourModel'
```

### Adding New Tags

Update the tags array in `backend/config/swagger.js`:

```javascript
tags: [
  {
    name: 'YourTag',
    description: 'Description of your API section'
  }
]
```

## Best Practices

### 1. Document All Endpoints
Every endpoint should have:
- Clear summary and description
- Request body schema (for POST/PUT/PATCH)
- All possible response codes
- Security requirements
- Parameter descriptions

### 2. Provide Examples
Include realistic examples for:
- Request bodies
- Path parameters
- Query parameters
- Response bodies

### 3. Keep Documentation Updated
- Update docs when changing endpoint behavior
- Add new endpoints as they're created
- Remove documentation for deprecated endpoints

### 4. Test Your Documentation
- Verify endpoints work from Swagger UI
- Test with different authentication states
- Validate all response schemas match actual responses

## Maintenance

### Updating Documentation
1. Edit JSDoc comments in route files
2. Update schemas in `backend/config/swagger.js`
3. Restart the server to see changes
4. Test in Swagger UI

### Versioning
Consider API versioning for breaking changes:
```javascript
servers: [
  {
    url: 'http://localhost:3000',
    description: 'Development server'
  },
  {
    url: 'https://api.pulss.io/v1',
    description: 'Production API v1'
  }
]
```

## Troubleshooting

### Documentation Not Showing Up
1. Check that JSDoc comments follow correct format
2. Verify file paths in `swagger.js` apis array
3. Check server console for swagger-jsdoc errors
4. Restart the server

### Authentication Not Working in Swagger UI
1. Ensure you've clicked "Authorize" button
2. Token format must be: `Bearer <token>` (with space)
3. Verify token is valid and not expired
4. Check that endpoint has `security: [{ bearerAuth: [] }]`

### Schema Validation Errors
1. Ensure all `required` fields are listed
2. Check property types match actual data
3. Validate enum values are correct
4. Test with actual API responses

## Resources

- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [Swagger JSDoc Documentation](https://github.com/Surnet/swagger-jsdoc)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)

## Support

For questions or issues with the API documentation:
- Check this guide first
- Review example endpoints in `routes/auth.js`, `routes/tenants.js`
- Consult the OpenAPI specification
- Raise an issue in the project repository
