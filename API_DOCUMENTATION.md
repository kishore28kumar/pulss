# Pulss Platform API Documentation

Base URL: `http://localhost:3000/api` (development)

All authenticated endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## 🔐 Authentication

### Register Tenant + Admin (Super Admin Only)

Create a new tenant and admin account.

**Endpoint:** `POST /api/auth/register-admin`

**Headers:**
```
Authorization: Bearer <super_admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "admin@newstore.com",
  "password": "SecurePassword123!",
  "full_name": "Store Admin Name",
  "tenant_name": "New Store Name",
  "subdomain": "newstore",
  "business_type": "pharmacy",
  "city": "Mumbai",
  "state": "Maharashtra"
}
```

**Response:** `201 Created`
```json
{
  "message": "Tenant and admin created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@newstore.com",
    "full_name": "Store Admin Name",
    "role": "admin",
    "tenant_id": "uuid"
  },
  "tenant": {
    "id": "uuid",
    "name": "New Store Name",
    "subdomain": "newstore"
  }
}
```

---

### Admin Login

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "admin@citypharmacy.com",
  "password": "Password123!"
}
```

**Response:** `200 OK`
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@citypharmacy.com",
    "full_name": "Rajesh Kumar",
    "role": "admin",
    "tenant_id": "uuid"
  }
}
```

---

### Register Customer

**Endpoint:** `POST /api/auth/register-customer`

**Request Body:**
```json
{
  "tenant_id": "550e8400-e29b-41d4-a716-446655440001",
  "email": "customer@example.com",
  "password": "Password123!",
  "name": "Customer Name",
  "phone": "+919876543210"
}
```

**Response:** `201 Created`
```json
{
  "message": "Customer registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "customer": {
    "id": "uuid",
    "tenant_id": "uuid",
    "email": "customer@example.com",
    "name": "Customer Name",
    "phone": "+919876543210",
    "loyalty_points": 0
  }
}
```

---

### Customer Login

**Endpoint:** `POST /api/auth/login-customer`

**Request Body:**
```json
{
  "email": "customer@example.com",
  "password": "Password123!",
  "tenant_id": "550e8400-e29b-41d4-a716-446655440001"
}
```

**Response:** `200 OK`
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "customer": {
    "id": "uuid",
    "tenant_id": "uuid",
    "email": "customer@example.com",
    "name": "Customer Name",
    "phone": "+919876543210",
    "loyalty_points": 150
  }
}
```

---

### Get Current User

**Endpoint:** `GET /api/auth/me`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": "uuid",
    "email": "admin@citypharmacy.com",
    "full_name": "Rajesh Kumar",
    "role": "admin",
    "tenant_id": "uuid"
  }
}
```

---

## 👥 Customers

### Get All Customers

**Endpoint:** `GET /api/customers`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:** `200 OK`
```json
{
  "customers": [
    {
      "customer_id": "uuid",
      "tenant_id": "uuid",
      "email": "customer@example.com",
      "name": "Customer Name",
      "phone": "+919876543210",
      "loyalty_points": 150,
      "is_active": true,
      "created_at": "2024-01-20T10:30:00Z"
    }
  ]
}
```

---

### Get Single Customer

**Endpoint:** `GET /api/customers/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "customer": {
    "customer_id": "uuid",
    "tenant_id": "uuid",
    "email": "customer@example.com",
    "name": "Customer Name",
    "phone": "+919876543210",
    "loyalty_points": 150,
    "is_active": true,
    "created_at": "2024-01-20T10:30:00Z",
    "updated_at": "2024-01-20T10:30:00Z"
  }
}
```

---

### Create Customer

**Endpoint:** `POST /api/customers`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "newcustomer@example.com",
  "name": "New Customer",
  "phone": "+919876543999"
}
```

**Response:** `201 Created`
```json
{
  "message": "Customer created successfully",
  "customer": {
    "customer_id": "uuid",
    "tenant_id": "uuid",
    "email": "newcustomer@example.com",
    "name": "New Customer",
    "phone": "+919876543999",
    "loyalty_points": 0,
    "created_at": "2024-01-20T11:00:00Z"
  }
}
```

---

### Update Customer

**Endpoint:** `PUT /api/customers/:id`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "updated@example.com",
  "name": "Updated Name",
  "phone": "+919999999999"
}
```

**Response:** `200 OK`
```json
{
  "message": "Customer updated successfully",
  "customer": {
    "customer_id": "uuid",
    "tenant_id": "uuid",
    "email": "updated@example.com",
    "name": "Updated Name",
    "phone": "+919999999999",
    "loyalty_points": 150,
    "updated_at": "2024-01-20T11:30:00Z"
  }
}
```

---

### Get Customer Stats

**Endpoint:** `GET /api/customers/:id/stats`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "stats": {
    "customer_id": "uuid",
    "total_orders": 15,
    "total_spent": 5250.00,
    "last_order_date": "2024-01-19T14:30:00Z",
    "loyalty_tier": "silver",
    "last_calculated": "2024-01-20T10:00:00Z",
    "name": "Customer Name",
    "email": "customer@example.com",
    "loyalty_points": 525
  }
}
```

---

## 💳 Transactions

### Create Transaction

**Endpoint:** `POST /api/transactions`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "customer_id": "c0000000-0000-0000-0000-000000000001",
  "order_id": "ord00000-0000-0000-0000-000000000001",
  "purchase_amount": 500.00
}
```

**Response:** `201 Created`
```json
{
  "message": "Transaction created and points awarded",
  "transaction": {
    "transaction_id": "uuid",
    "tenant_id": "uuid",
    "customer_id": "uuid",
    "order_id": "uuid",
    "purchase_amount": 500.00,
    "points_earned": 50,
    "transaction_date": "2024-01-20T12:00:00Z",
    "created_at": "2024-01-20T12:00:00Z"
  },
  "points_awarded": 50
}
```

**Points Calculation:**
- Points = FLOOR(purchase_amount * 0.1)
- Example: ₹500 purchase = 50 points
- Points are automatically added to customer's account

---

### Get Customer Transactions

**Endpoint:** `GET /api/transactions/customer/:customer_id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "transactions": [
    {
      "transaction_id": "uuid",
      "tenant_id": "uuid",
      "customer_id": "uuid",
      "order_id": "uuid",
      "purchase_amount": 500.00,
      "points_earned": 50,
      "transaction_date": "2024-01-20T12:00:00Z",
      "created_at": "2024-01-20T12:00:00Z",
      "customer_name": "Customer Name"
    }
  ]
}
```

---

### Get All Transactions

**Endpoint:** `GET /api/transactions`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `limit` (optional): Number of records to return (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response:** `200 OK`
```json
{
  "transactions": [
    {
      "transaction_id": "uuid",
      "tenant_id": "uuid",
      "customer_id": "uuid",
      "order_id": "uuid",
      "purchase_amount": 500.00,
      "points_earned": 50,
      "transaction_date": "2024-01-20T12:00:00Z",
      "created_at": "2024-01-20T12:00:00Z",
      "customer_name": "Customer Name",
      "customer_phone": "+919876543210"
    }
  ]
}
```

---

## 🎁 Rewards

### Get Rewards

**Endpoint:** `GET /api/rewards`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "rewards": [
    {
      "reward_id": "uuid",
      "tenant_id": "uuid",
      "name": "₹50 Off",
      "description": "Get ₹50 off on your next purchase",
      "points_required": 100,
      "reward_type": "discount",
      "discount_amount": 50.00,
      "discount_percentage": null,
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### Create Reward

**Endpoint:** `POST /api/rewards`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "₹200 Off",
  "description": "Get ₹200 off on orders above ₹1000",
  "points_required": 400,
  "reward_type": "discount",
  "discount_amount": 200.00
}
```

**Response:** `201 Created`
```json
{
  "message": "Reward created successfully",
  "reward": {
    "reward_id": "uuid",
    "tenant_id": "uuid",
    "name": "₹200 Off",
    "description": "Get ₹200 off on orders above ₹1000",
    "points_required": 400,
    "reward_type": "discount",
    "discount_amount": 200.00,
    "discount_percentage": null,
    "is_active": true,
    "created_at": "2024-01-20T12:30:00Z",
    "updated_at": "2024-01-20T12:30:00Z"
  }
}
```

---

### Redeem Reward

**Endpoint:** `POST /api/rewards/redeem`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "customer_id": "c0000000-0000-0000-0000-000000000001",
  "reward_id": "rew00000-0000-0000-0000-000000000001"
}
```

**Response:** `201 Created`
```json
{
  "message": "Reward redeemed successfully",
  "redemption": {
    "redemption_id": "uuid",
    "tenant_id": "uuid",
    "customer_id": "uuid",
    "reward_id": "uuid",
    "points_used": 100,
    "redeemed_at": "2024-01-20T13:00:00Z",
    "status": "redeemed",
    "used_at": null
  },
  "points_remaining": 50
}
```

**Error Responses:**
- `400 Bad Request`: Insufficient points
```json
{
  "error": "Insufficient points",
  "required": 100,
  "available": 50
}
```

---

### Get Customer Redemptions

**Endpoint:** `GET /api/rewards/customer/:customer_id/redemptions`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "redemptions": [
    {
      "redemption_id": "uuid",
      "tenant_id": "uuid",
      "customer_id": "uuid",
      "reward_id": "uuid",
      "points_used": 100,
      "redeemed_at": "2024-01-20T13:00:00Z",
      "status": "redeemed",
      "used_at": null,
      "reward_name": "₹50 Off",
      "reward_description": "Get ₹50 off on your next purchase"
    }
  ]
}
```

---

## 🏥 Health Check

### Health Check

**Endpoint:** `GET /health`

**Response:** `200 OK`
```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T14:00:00.000Z",
  "environment": "development"
}
```

---

## ⚠️ Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Detailed error message"
}
```

### 401 Unauthorized
```json
{
  "error": "No token provided"
}
```
```json
{
  "error": "Invalid token"
}
```
```json
{
  "error": "Token expired"
}
```

### 403 Forbidden
```json
{
  "error": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "stack": "..." // Only in development mode
}
```

---

## 🔒 Security Notes

1. **JWT Tokens:** All tokens expire after 7 days (configurable via `JWT_EXPIRES_IN`)
2. **Tenant Isolation:** Admins can only access their own tenant data
3. **Super Admin:** Can access all tenant data
4. **Password Requirements:** Minimum 8 characters (recommended: uppercase, lowercase, number, special char)
5. **Rate Limiting:** Consider implementing rate limiting in production
6. **HTTPS:** Always use HTTPS in production

---

## 📝 Postman Collection

Import this JSON to Postman for quick testing:

```json
{
  "info": {
    "name": "Pulss Platform API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000/api"
    },
    {
      "key": "token",
      "value": ""
    }
  ]
}
```

Save your token after login and use `{{token}}` in Authorization headers.

## 👥 User Invites

### Create Single Invite

Invite a single user to join the tenant.

**Endpoint:** `POST /api/invites`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "role": "customer",
  "metadata": {
    "name": "John Doe",
    "phone": "+1234567890"
  }
}
```

**Response:** `201 Created`
```json
{
  "invite": {
    "invite_id": "uuid",
    "email": "newuser@example.com",
    "role": "customer",
    "status": "pending",
    "expires_at": "2025-10-27T11:45:20.057Z",
    "created_at": "2025-10-20T11:45:20.057Z"
  },
  "inviteLink": "http://localhost:5173/accept-invite?token=abc123..."
}
```

---

### Create Bulk Invites

Invite multiple users at once.

**Endpoint:** `POST /api/invites/bulk`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "invites": [
    {
      "email": "user1@example.com",
      "role": "customer",
      "metadata": {
        "name": "John Doe"
      }
    },
    {
      "email": "user2@example.com",
      "role": "admin",
      "metadata": {
        "name": "Jane Smith",
        "phone": "+0987654321"
      }
    }
  ],
  "method": "manual"
}
```

**Response:** `201 Created`
```json
{
  "batchId": "uuid",
  "summary": {
    "total": 2,
    "successful": 2,
    "failed": 0,
    "skipped": 0
  },
  "results": {
    "successful": [
      {
        "invite_id": "uuid",
        "email": "user1@example.com",
        "role": "customer",
        "status": "pending",
        "expires_at": "2025-10-27T11:45:20.057Z",
        "inviteLink": "http://localhost:5173/accept-invite?token=abc123..."
      }
    ],
    "failed": [],
    "skipped": []
  }
}
```

---

### Get Invites

List all invites for the tenant with optional filtering.

**Endpoint:** `GET /api/invites`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `status` (optional): Filter by status (pending, accepted, expired, cancelled)
- `role` (optional): Filter by role (admin, customer)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 50, max: 100)

**Example:** `GET /api/invites?status=pending&page=1&limit=20`

**Response:** `200 OK`
```json
{
  "invites": [
    {
      "invite_id": "uuid",
      "email": "user@example.com",
      "role": "customer",
      "status": "pending",
      "expires_at": "2025-10-27T11:45:20.057Z",
      "accepted_at": null,
      "created_at": "2025-10-20T11:45:20.057Z",
      "batch_id": "uuid",
      "metadata": {},
      "invited_by_name": "Admin User",
      "invited_by_email": "admin@store.com"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

---

### Get Invite Statistics

Get summary statistics for all invites.

**Endpoint:** `GET /api/invites/stats`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:** `200 OK`
```json
{
  "pending": 15,
  "accepted": 30,
  "expired": 5,
  "cancelled": 2,
  "total": 52
}
```

---

### Get Invite Batches

List bulk invite batch operations.

**Endpoint:** `GET /api/invites/batches`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20)

**Response:** `200 OK`
```json
{
  "batches": [
    {
      "batch_id": "uuid",
      "total_invites": 100,
      "successful_invites": 95,
      "failed_invites": 5,
      "method": "csv",
      "status": "completed",
      "created_at": "2025-10-20T11:45:20.057Z",
      "completed_at": "2025-10-20T11:46:05.123Z",
      "created_by_name": "Admin User",
      "created_by_email": "admin@store.com"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 10,
    "pages": 1
  }
}
```

---

### Resend Invite

Resend an invite with a new token and expiration.

**Endpoint:** `POST /api/invites/:inviteId/resend`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:** `200 OK`
```json
{
  "invite": {
    "invite_id": "uuid",
    "email": "user@example.com",
    "role": "customer",
    "status": "pending",
    "expires_at": "2025-10-27T11:45:20.057Z"
  },
  "inviteLink": "http://localhost:5173/accept-invite?token=new_token..."
}
```

---

### Cancel Invite

Cancel a pending invite.

**Endpoint:** `DELETE /api/invites/:inviteId`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:** `200 OK`
```json
{
  "invite": {
    "invite_id": "uuid",
    "email": "user@example.com",
    "status": "cancelled"
  }
}
```

---

### Accept Invite (Public)

Accept an invitation and create user account.

**Endpoint:** `POST /api/invites/accept`

**Request Body:**
```json
{
  "token": "abc123...",
  "password": "SecurePassword123!",
  "name": "John Doe",
  "phone": "+1234567890"
}
```

**Response:** `200 OK`
```json
{
  "message": "Invite accepted successfully",
  "userId": "uuid",
  "email": "user@example.com",
  "role": "customer",
  "tenantId": "uuid"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid token, expired invite, or passwords don't match
- `404 Not Found`: Invalid invite token
- `409 Conflict`: User already exists with this email

---

### Expire Old Invites (Super Admin)

Manually expire old pending invites.

**Endpoint:** `POST /api/invites/expire-old`

**Headers:**
```
Authorization: Bearer <super_admin_token>
```

**Response:** `200 OK`
```json
{
  "message": "Old invites expired successfully",
  "count": 23
}
```

---

