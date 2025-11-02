# 🔌 Pulss API Documentation

Complete API reference for the Pulss E-Commerce Platform.

**Base URL:** `http://localhost:5000/api`

---

## 📑 Table of Contents

- [Authentication](#authentication)
- [Tenants](#tenants)
- [Products](#products)
- [Categories](#categories)
- [Orders](#orders)
- [Cart](#cart)
- [Payments](#payments-stripe)
- [Error Handling](#error-handling)

---

## 🔐 Authentication

### Headers

Most endpoints require authentication. Include these headers:

```http
Authorization: Bearer <access_token>
X-Tenant-Slug: <tenant-slug>    # For tenant-specific operations
Content-Type: application/json
```

### Admin/Staff Login

```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-123",
      "email": "admin@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "ADMIN",
      "tenantId": "tenant-123",
      "tenant": {
        "id": "tenant-123",
        "name": "City Pharmacy",
        "slug": "city-pharmacy"
      }
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  },
  "message": "Login successful"
}
```

### Customer Login

```http
POST /api/auth/customer/login
```

**Request Body:**
```json
{
  "email": "customer@example.com",
  "password": "password123"
}
```

### Customer Registration

```http
POST /api/auth/customer/register
```

**Request Body:**
```json
{
  "email": "newcustomer@example.com",
  "password": "SecurePass123!",
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+1234567890"
}
```

### Get Current User

```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Refresh Token

```http
POST /api/auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 🏢 Tenants

### Get All Tenants (Super Admin Only)

```http
GET /api/tenants
Authorization: Bearer <super_admin_token>
```

### Get Tenant Info (Public)

```http
GET /api/tenants/info
X-Tenant-Slug: city-pharmacy
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "tenant-123",
    "name": "City Pharmacy",
    "slug": "city-pharmacy",
    "businessType": "pharmacy",
    "logo": "https://...",
    "primaryColor": "#3B82F6",
    "email": "info@citypharmacy.com",
    "settings": {
      "storeName": "City Pharmacy",
      "allowGuestCheckout": true,
      "shippingFee": 5.99
    }
  }
}
```

### Create Tenant (Super Admin Only)

```http
POST /api/tenants
Authorization: Bearer <super_admin_token>
```

**Request Body:**
```json
{
  "name": "City Pharmacy",
  "slug": "city-pharmacy",
  "businessType": "pharmacy",
  "email": "info@citypharmacy.com",
  "phone": "+1234567890",
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "country": "US",
  "adminEmail": "admin@citypharmacy.com",
  "adminPassword": "SecurePass123!",
  "adminFirstName": "John",
  "adminLastName": "Doe"
}
```

### Update Tenant

```http
PUT /api/tenants/:id
Authorization: Bearer <admin_token>
```

---

## 📦 Products

### Get All Products

```http
GET /api/products
X-Tenant-Slug: city-pharmacy
```

**Query Parameters:**
- `search` - Search by name, description, or SKU
- `categoryId` - Filter by category
- `minPrice` - Minimum price
- `maxPrice` - Maximum price
- `isActive` - Filter by active status (true/false)
- `isFeatured` - Filter featured products (true/false)
- `inStock` - Filter in-stock products (true)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `sortBy` - Sort field (name, price, createdAt, stockQuantity)
- `sortOrder` - Sort order (asc, desc)

**Example:**
```http
GET /api/products?search=aspirin&minPrice=5&maxPrice=50&page=1&limit=10
X-Tenant-Slug: city-pharmacy
```

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "prod-123",
        "name": "Aspirin 500mg",
        "slug": "aspirin-500mg",
        "description": "Pain relief medication",
        "price": 9.99,
        "compareAtPrice": 12.99,
        "sku": "ASP-500",
        "stockQuantity": 100,
        "thumbnail": "https://...",
        "isActive": true,
        "isFeatured": true,
        "categories": [
          {
            "category": {
              "id": "cat-123",
              "name": "Pain Relief",
              "slug": "pain-relief"
            }
          }
        ],
        "images": [
          {
            "url": "https://...",
            "sortOrder": 0
          }
        ]
      }
    ],
    "meta": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "totalPages": 10
    }
  }
}
```

### Get Single Product

```http
GET /api/products/:id
X-Tenant-Slug: city-pharmacy
```

### Create Product (Admin Only)

```http
POST /api/products
Authorization: Bearer <admin_token>
X-Tenant-Slug: city-pharmacy
```

**Request Body:**
```json
{
  "name": "Aspirin 500mg",
  "slug": "aspirin-500mg",
  "description": "Effective pain relief for headaches and minor aches",
  "shortDescription": "Fast-acting pain relief",
  "price": 9.99,
  "compareAtPrice": 12.99,
  "costPrice": 5.00,
  "sku": "ASP-500",
  "barcode": "123456789",
  "trackInventory": true,
  "stockQuantity": 100,
  "lowStockThreshold": 10,
  "weight": 0.05,
  "weightUnit": "kg",
  "categoryIds": ["cat-123", "cat-456"],
  "images": [
    "https://cloudinary.com/image1.jpg",
    "https://cloudinary.com/image2.jpg"
  ],
  "isActive": true,
  "isFeatured": false,
  "requiresPrescription": false,
  "isOTC": true,
  "manufacturer": "PharmaCorp",
  "metaTitle": "Aspirin 500mg - Fast Pain Relief",
  "metaDescription": "Buy Aspirin 500mg online for effective pain relief"
}
```

### Update Product

```http
PUT /api/products/:id
Authorization: Bearer <admin_token>
X-Tenant-Slug: city-pharmacy
```

### Delete Product

```http
DELETE /api/products/:id
Authorization: Bearer <admin_token>
X-Tenant-Slug: city-pharmacy
```

---

## 🗂️ Categories

### Get All Categories

```http
GET /api/categories
X-Tenant-Slug: city-pharmacy
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cat-123",
      "name": "Pain Relief",
      "slug": "pain-relief",
      "description": "Pain relief medications",
      "image": "https://...",
      "isActive": true,
      "sortOrder": 0,
      "parent": null,
      "children": [],
      "_count": {
        "products": 25
      }
    }
  ]
}
```

### Create Category

```http
POST /api/categories
Authorization: Bearer <admin_token>
X-Tenant-Slug: city-pharmacy
```

**Request Body:**
```json
{
  "name": "Pain Relief",
  "slug": "pain-relief",
  "description": "Medications for pain relief",
  "image": "https://...",
  "icon": "💊",
  "parentId": null,
  "isActive": true,
  "sortOrder": 0
}
```

---

## 🛒 Orders

### Get All Orders (Admin)

```http
GET /api/orders
Authorization: Bearer <admin_token>
X-Tenant-Slug: city-pharmacy
```

**Query Parameters:**
- `customerId` - Filter by customer
- `status` - PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED
- `paymentStatus` - PENDING, PAID, FAILED, REFUNDED
- `fulfillmentStatus` - UNFULFILLED, PARTIALLY_FULFILLED, FULFILLED
- `startDate` - Filter from date
- `endDate` - Filter to date
- `search` - Search by order number or customer email
- `page` - Page number
- `limit` - Items per page

### Get Single Order

```http
GET /api/orders/:id
Authorization: Bearer <admin_token>
X-Tenant-Slug: city-pharmacy
```

### Create Order (Customer)

```http
POST /api/orders
Authorization: Bearer <customer_token>
X-Tenant-Slug: city-pharmacy
```

**Request Body:**
```json
{
  "items": [
    {
      "productId": "prod-123",
      "quantity": 2,
      "variantOptions": null
    }
  ],
  "shippingAddressId": "addr-123",
  "billingAddressId": "addr-123",
  "paymentMethod": "card",
  "customerNote": "Please deliver in the morning",
  "prescriptionUrl": "https://..." // Optional for pharmacy
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "order-123",
    "orderNumber": "ORD-2024-000001",
    "subtotal": 19.98,
    "shippingFee": 5.99,
    "tax": 2.60,
    "total": 28.57,
    "status": "PENDING",
    "paymentStatus": "PENDING",
    "fulfillmentStatus": "UNFULFILLED",
    "items": [...]
  },
  "message": "Order placed successfully"
}
```

### Update Order Status (Admin)

```http
PATCH /api/orders/:id/status
Authorization: Bearer <admin_token>
X-Tenant-Slug: city-pharmacy
```

**Request Body:**
```json
{
  "status": "SHIPPED",
  "fulfillmentStatus": "FULFILLED",
  "trackingNumber": "1Z999AA10123456784",
  "internalNote": "Shipped via UPS"
}
```

### Get Customer Orders

```http
GET /api/orders/my-orders
Authorization: Bearer <customer_token>
```

---

## 🛍️ Cart

### Get Cart

```http
GET /api/cart
Authorization: Bearer <customer_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "cart-item-123",
        "productId": "prod-123",
        "productName": "Aspirin 500mg",
        "productImage": "https://...",
        "price": 9.99,
        "quantity": 2,
        "total": 19.98
      }
    ],
    "subtotal": 19.98,
    "itemCount": 2
  }
}
```

### Add to Cart

```http
POST /api/cart
Authorization: Bearer <customer_token>
```

**Request Body:**
```json
{
  "productId": "prod-123",
  "quantity": 2,
  "variantOptions": null
}
```

### Update Cart Item

```http
PUT /api/cart/:id
Authorization: Bearer <customer_token>
```

**Request Body:**
```json
{
  "quantity": 3
}
```

### Remove from Cart

```http
DELETE /api/cart/:id
Authorization: Bearer <customer_token>
```

### Clear Cart

```http
DELETE /api/cart
Authorization: Bearer <customer_token>
```

---

## 💳 Payments (Stripe)

### Get Stripe Config

```http
GET /api/stripe/config
```

**Response:**
```json
{
  "success": true,
  "data": {
    "publishableKey": "pk_test_..."
  }
}
```

### Create Payment Intent

```http
POST /api/stripe/create-payment-intent
Authorization: Bearer <customer_token>
```

**Request Body:**
```json
{
  "orderId": "order-123",
  "amount": 28.57,
  "currency": "usd"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "clientSecret": "pi_xxx_secret_yyy",
    "paymentIntentId": "pi_xxx"
  }
}
```

### Stripe Webhook

```http
POST /api/stripe/webhook
Content-Type: application/json
Stripe-Signature: <webhook_signature>
```

Handles events:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`

---

## ⚠️ Error Handling

### Error Response Format

All errors follow this structure:

```json
{
  "success": false,
  "error": "Error message here",
  "errors": {
    "field": ["Validation error message"]
  }
}
```

### HTTP Status Codes

- `200 OK` - Successful request
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

### Common Errors

**401 Unauthorized:**
```json
{
  "success": false,
  "error": "No authentication token provided"
}
```

**400 Bad Request:**
```json
{
  "success": false,
  "error": "Validation failed",
  "errors": {
    "email": ["Invalid email address"],
    "password": ["Password must be at least 6 characters"]
  }
}
```

**404 Not Found:**
```json
{
  "success": false,
  "error": "Product not found"
}
```

---

## 📊 Rate Limiting

- **General API:** 100 requests per 15 minutes per IP
- **Authentication:** 5 login attempts per 15 minutes per IP

Exceeded rate limits return `429 Too Many Requests`.

---

## 🔒 Security Best Practices

1. **Always use HTTPS** in production
2. **Store tokens securely** (httpOnly cookies or secure storage)
3. **Never expose secret keys** in client-side code
4. **Validate all inputs** on both client and server
5. **Use environment variables** for sensitive configuration
6. **Implement CSRF protection** for state-changing operations
7. **Sanitize user input** to prevent XSS attacks

---

## 📞 Support

Need help with the API?

- **Documentation:** See main [README.md](README.md)
- **Issues:** Open on GitHub
- **Email:** api-support@pulss.com

---

**Happy Building! 🚀**

