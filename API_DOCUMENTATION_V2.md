# Pulss Platform API Documentation

## Overview

The Pulss Platform provides a comprehensive REST API for managing multi-tenant pharmacy operations, including products, orders, customers, notifications, and more.

## Base URL

```
Production: https://api.pulss.app
Development: http://localhost:3000/api
```

## Authentication

All API requests require authentication using JWT tokens or API keys.

### JWT Authentication

Include the JWT token in the Authorization header:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

### API Key Authentication

For partner integrations, use API keys:

```http
X-API-Key: YOUR_API_KEY
```

## Rate Limiting

- General API: 100 requests per 15 minutes
- Authentication: 5 requests per 15 minutes
- Search: 60 requests per minute
- Cart operations: 30 requests per minute

## Endpoints

### Authentication

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "role": "admin"
    }
  }
}
```

### Products

#### Get Products
```http
GET /api/products?page=1&limit=20&category=medicines
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Create Product
```http
POST /api/products
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "name": "Paracetamol 500mg",
  "description": "Pain relief medication",
  "category_id": "category_uuid",
  "brand": "Cipla",
  "mrp": 100,
  "selling_price": 85,
  "requires_prescription": false
}
```

### Cart

#### Get Cart
```http
GET /api/cart
Authorization: Bearer YOUR_JWT_TOKEN
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "cart_id",
    "items": [
      {
        "id": "item_id",
        "product_id": "product_id",
        "quantity": 2,
        "product": {
          "name": "Product Name",
          "selling_price": 100
        }
      }
    ]
  }
}
```

#### Add Item to Cart
```http
POST /api/cart/items
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "product_id": "product_uuid",
  "quantity": 2
}
```

#### Update Cart Item
```http
PUT /api/cart/items/{item_id}
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "quantity": 3
}
```

#### Sync Cart (Cross-device)
```http
POST /api/cart/sync
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "items": [
    {
      "product_id": "product_uuid",
      "quantity": 2
    }
  ]
}
```

### Orders

#### Create Order
```http
POST /api/orders
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "items": [
    {
      "product_id": "product_uuid",
      "quantity": 2,
      "unit_price": 100
    }
  ],
  "payment_method": "upi",
  "delivery_address": {
    "name": "John Doe",
    "phone": "9876543210",
    "address": "123 Main St",
    "city": "Mumbai",
    "pincode": "400001"
  }
}
```

### Notifications

#### Get Notifications
```http
GET /api/notifications?limit=50
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Mark as Read
```http
PUT /api/notifications/{id}/read
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Update Preferences
```http
PUT /api/notifications/preferences
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "push_enabled": true,
  "sms_enabled": true,
  "email_enabled": true,
  "whatsapp_enabled": false
}
```

### Payment Methods

#### Get Saved Payment Methods
```http
GET /api/payment-methods
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Add Payment Method
```http
POST /api/payment-methods
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "payment_type": "card",
  "card_last4": "4242",
  "card_brand": "visa",
  "nickname": "My Visa Card",
  "is_default": true
}
```

#### One-Click Reorder
```http
POST /api/payment-methods/reorder
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "order_id": "previous_order_uuid"
}
```

### Bulk Operations

#### Bulk Import Products
```http
POST /api/bulk/products/import
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "products": [
    {
      "name": "Product 1",
      "category": "Medicines",
      "selling_price": 100,
      "mrp": 120
    }
  ]
}
```

#### Export Orders
```http
GET /api/bulk/orders/export?start_date=2024-01-01&end_date=2024-12-31
Authorization: Bearer YOUR_JWT_TOKEN
```

Response: CSV file download

### Super Admin (Admin Only)

#### Get Showcase
```http
GET /api/super-admin/showcase
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Generate API Key
```http
POST /api/super-admin/api-keys
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "key_name": "Production API",
  "scopes": ["products:read", "orders:read"],
  "tenant_id": "tenant_uuid"
}
```

#### Get Platform Analytics
```http
GET /api/super-admin/analytics
Authorization: Bearer YOUR_JWT_TOKEN
```

## API Key Scopes

When using API keys, ensure you have the required scopes:

- `products:read` - View products
- `products:write` - Create/update products
- `orders:read` - View orders
- `orders:write` - Create/update orders
- `customers:read` - View customers
- `customers:write` - Create/update customers
- `inventory:read` - View inventory
- `inventory:write` - Update inventory
- `analytics:read` - View analytics

## Error Handling

All errors follow this format:

```json
{
  "success": false,
  "message": "Error description"
}
```

Common HTTP status codes:

- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

## Webhooks

Configure webhooks to receive real-time updates:

### Available Events

- `order.created`
- `order.updated`
- `order.delivered`
- `payment.success`
- `payment.failed`

### Webhook Payload

```json
{
  "event": "order.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "order_id": "order_uuid",
    "customer_id": "customer_uuid",
    "total_amount": 1000
  }
}
```

## Best Practices

1. **Use pagination** for list endpoints
2. **Cache responses** when appropriate
3. **Handle rate limits** gracefully
4. **Validate input** before sending requests
5. **Use HTTPS** in production
6. **Store API keys securely**
7. **Implement exponential backoff** for retries

## SDKs

Official SDKs are available for:

- JavaScript/TypeScript
- Python
- PHP
- Ruby

## Support

For API support, contact:
- Email: api-support@pulss.app
- Documentation: https://docs.pulss.app
- Status Page: https://status.pulss.app

## Changelog

### Version 2.0 (Current)
- Added persistent cart with sync
- Added saved payment methods
- Added one-click reorder
- Added bulk operations
- Added notification preferences
- Enhanced security with rate limiting
- Added API key authentication

### Version 1.0
- Initial release
- Basic CRUD operations
- JWT authentication
- Multi-tenant support
