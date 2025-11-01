# Billing API Reference

Complete API reference for the Pulss Billing and Subscription Management System.

## Base URL

```
http://localhost:3000/api/billing
```

## Authentication

All endpoints (except public plan listing) require JWT authentication:

```
Authorization: Bearer <your_jwt_token>
```

## Permission Levels

- **Public**: No authentication required
- **Admin**: Tenant admin authentication required
- **Super Admin**: Super admin authentication required

---

## Subscription Plans

### List Plans (Public)

Get all active and visible subscription plans.

```http
GET /plans
```

**Query Parameters:**
- `plan_type` (optional): Filter by type (`free`, `basic`, `professional`, `enterprise`, `custom`)
- `billing_cycle` (optional): Filter by cycle (`monthly`, `quarterly`, `yearly`, `one_time`)

**Response:**
```json
{
  "plans": [
    {
      "plan_id": "uuid",
      "name": "Professional",
      "description": "For growing businesses",
      "plan_type": "professional",
      "billing_cycle": "monthly",
      "price": "2499.00",
      "currency": "INR",
      "max_products": null,
      "max_orders_per_month": 2000,
      "max_storage_gb": 20,
      "max_admin_users": 5,
      "features": ["Unlimited products", "Advanced analytics"],
      "trial_period_days": 14,
      "is_active": true,
      "is_visible": true
    }
  ]
}
```

### Get Plan Details (Public)

```http
GET /plans/:planId
```

**Response:**
```json
{
  "plan": { /* plan object */ }
}
```

### Create Plan (Super Admin)

```http
POST /plans
```

**Request Body:**
```json
{
  "name": "Enterprise Plus",
  "description": "For large enterprises",
  "plan_type": "enterprise",
  "billing_cycle": "yearly",
  "price": 99999.00,
  "currency": "INR",
  "max_products": null,
  "max_orders_per_month": null,
  "max_storage_gb": 500,
  "max_admin_users": 50,
  "features": [
    "Unlimited everything",
    "Dedicated support",
    "Custom SLA"
  ],
  "usage_based_billing": false,
  "trial_period_days": 30
}
```

**Response:** `201 Created`
```json
{
  "plan": { /* created plan object */ }
}
```

### Update Plan (Super Admin)

```http
PUT /plans/:planId
```

**Request Body:** (partial update)
```json
{
  "price": 2999.00,
  "features": ["Updated feature list"],
  "is_active": true
}
```

**Response:**
```json
{
  "plan": { /* updated plan object */ }
}
```

---

## Subscriptions

### Get Tenant Subscription (Admin)

```http
GET /subscriptions/tenant/:tenantId
```

**Response:**
```json
{
  "subscription": {
    "subscription_id": "uuid",
    "tenant_id": "uuid",
    "plan_id": "uuid",
    "plan_name": "Professional",
    "plan_type": "professional",
    "status": "active",
    "start_date": "2024-01-01T00:00:00Z",
    "end_date": "2024-02-01T00:00:00Z",
    "next_billing_date": "2024-02-01T00:00:00Z",
    "base_price": "2499.00",
    "discount_amount": "0.00",
    "tax_amount": "449.82",
    "total_amount": "2948.82",
    "currency": "INR",
    "auto_renew": true,
    "features": ["feature1", "feature2"]
  }
}
```

### Get Subscription History (Admin)

```http
GET /subscriptions/tenant/:tenantId/history
```

**Response:**
```json
{
  "subscriptions": [
    { /* subscription object */ },
    { /* subscription object */ }
  ]
}
```

### Create Subscription (Admin)

```http
POST /subscriptions
```

**Request Body:**
```json
{
  "tenantId": "uuid",
  "planId": "uuid",
  "couponCode": "WELCOME20" // optional
}
```

**Response:** `201 Created`
```json
{
  "subscription": { /* created subscription */ }
}
```

**Notes:**
- Automatically calculates dates based on billing cycle
- Applies coupon if provided
- Calculates tax based on tenant location
- Cancels existing active subscription

### Update Subscription Status (Admin)

```http
PUT /subscriptions/:subscriptionId/status
```

**Request Body:**
```json
{
  "status": "active", // pending, active, past_due, cancelled, expired, trial, suspended
  "cancellation_reason": "Reason if cancelling" // optional
}
```

**Response:**
```json
{
  "subscription": { /* updated subscription */ }
}
```

### Cancel Subscription (Admin)

```http
POST /subscriptions/:subscriptionId/cancel
```

**Request Body:**
```json
{
  "reason": "User requested cancellation"
}
```

**Response:**
```json
{
  "subscription": { /* cancelled subscription */ },
  "message": "Subscription cancelled successfully"
}
```

---

## Invoices

### List Tenant Invoices (Admin)

```http
GET /invoices/tenant/:tenantId
```

**Query Parameters:**
- `status` (optional): Filter by status
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset

**Response:**
```json
{
  "invoices": [
    {
      "invoice_id": "uuid",
      "tenant_id": "uuid",
      "subscription_id": "uuid",
      "invoice_number": "INV-1234567890-ABC",
      "invoice_date": "2024-01-01T00:00:00Z",
      "due_date": "2024-01-16T00:00:00Z",
      "status": "paid",
      "subtotal": "2499.00",
      "discount_amount": "0.00",
      "tax_amount": "449.82",
      "total_amount": "2948.82",
      "paid_amount": "2948.82",
      "balance_due": "0.00",
      "currency": "INR"
    }
  ]
}
```

### Get Invoice Details (Admin)

```http
GET /invoices/:invoiceId
```

**Response:**
```json
{
  "invoice": {
    "invoice_id": "uuid",
    "invoice_number": "INV-1234567890-ABC",
    /* ... invoice fields ... */
    "line_items": [
      {
        "line_item_id": "uuid",
        "description": "Professional Plan - Monthly",
        "quantity": "1.00",
        "unit_price": "2499.00",
        "amount": "2499.00",
        "tax_rate": "18.00",
        "tax_amount": "449.82"
      }
    ]
  }
}
```

### Generate Invoice (Admin)

```http
POST /invoices/generate
```

**Request Body:**
```json
{
  "subscriptionId": "uuid"
}
```

**Response:** `201 Created`
```json
{
  "invoice": { /* generated invoice */ }
}
```

### Mark Invoice as Paid (Admin)

```http
PUT /invoices/:invoiceId/mark-paid
```

**Request Body:**
```json
{
  "paymentDate": "2024-01-15T10:30:00Z", // optional, defaults to now
  "paymentMethod": "upi",
  "paymentReference": "TXN123456"
}
```

**Response:**
```json
{
  "invoice": { /* updated invoice with paid status */ }
}
```

---

## Payments

### Record Payment (Admin)

```http
POST /payments
```

**Request Body:**
```json
{
  "tenantId": "uuid",
  "invoiceId": "uuid", // optional
  "subscriptionId": "uuid", // optional
  "paymentMethod": "upi", // card, upi, netbanking, wallet, bank_transfer, check, cash, other
  "amount": 2948.82,
  "currency": "INR",
  "gatewayName": "razorpay",
  "gatewayTransactionId": "txn_abc123",
  "gatewayPaymentId": "pay_xyz789",
  "gatewayResponse": {
    /* gateway specific data */
  }
}
```

**Response:** `201 Created`
```json
{
  "payment": {
    "payment_id": "uuid",
    "tenant_id": "uuid",
    "invoice_id": "uuid",
    "payment_method": "upi",
    "gateway_name": "razorpay",
    "amount": "2948.82",
    "status": "completed",
    "payment_date": "2024-01-15T10:30:00Z"
  }
}
```

**Side Effects:**
- Updates invoice status to paid/partially_paid
- Activates subscription if in pending/past_due status

### Get Payment History (Admin)

```http
GET /payments/tenant/:tenantId
```

**Query Parameters:**
- `limit` (optional): Default 50
- `offset` (optional): Default 0

**Response:**
```json
{
  "payments": [
    {
      "payment_id": "uuid",
      "amount": "2948.82",
      "payment_method": "upi",
      "status": "completed",
      "payment_date": "2024-01-15T10:30:00Z",
      "invoice_number": "INV-1234567890-ABC"
    }
  ]
}
```

---

## Billing Analytics

### Get Tenant Analytics (Admin)

```http
GET /analytics/tenant/:tenantId
```

**Query Parameters:**
- `startDate` (optional): ISO 8601 date
- `endDate` (optional): ISO 8601 date

**Response:**
```json
{
  "revenue": {
    "total_subscriptions": "5",
    "active_subscriptions": "3",
    "cancelled_subscriptions": "2",
    "total_revenue": "12495.00",
    "avg_revenue_per_subscription": "2499.00",
    "mrr": "7497.00"
  },
  "invoices": {
    "total_invoices": "5",
    "paid_invoices": "4",
    "overdue_invoices": "1",
    "total_invoiced": "14942.10",
    "total_paid": "11953.68",
    "total_outstanding": "2988.42"
  },
  "payments": {
    "total_payments": "4",
    "total_amount": "11953.68",
    "payment_methods_used": "2"
  },
  "churn": {
    "churned_count": "2",
    "avg_subscription_lifetime_days": "45",
    "churn_rate": "40.00"
  },
  "metrics": {
    "arpu": "2499.00",
    "ltv": "3748.50",
    "mrr": "7497.00"
  }
}
```

### Get Revenue Trends (Admin)

```http
GET /analytics/tenant/:tenantId/trends
```

**Query Parameters:**
- `period`: `daily`, `weekly`, `monthly` (default), `yearly`
- `startDate` (optional)
- `endDate` (optional)

**Response:**
```json
{
  "trends": [
    {
      "period": "2024-01-01T00:00:00Z",
      "subscription_count": "3",
      "revenue": "7497.00",
      "active_count": "3",
      "cancelled_count": "0"
    },
    {
      "period": "2023-12-01T00:00:00Z",
      "subscription_count": "2",
      "revenue": "4998.00",
      "active_count": "2",
      "cancelled_count": "0"
    }
  ]
}
```

### Get Global Analytics (Super Admin)

```http
GET /analytics/global
```

**Query Parameters:**
- `startDate` (optional)
- `endDate` (optional)

**Response:**
```json
{
  "global": {
    "total_tenants": "50",
    "total_subscriptions": "125",
    "active_subscriptions": "98",
    "total_revenue": "312375.00",
    "avg_revenue_per_subscription": "2499.00",
    "total_mrr": "244902.00"
  },
  "plan_distribution": [
    {
      "plan_name": "Professional",
      "plan_type": "professional",
      "subscription_count": "45",
      "revenue": "112455.00"
    }
  ],
  "top_tenants": [
    {
      "tenant_name": "Store ABC",
      "tenant_id": "uuid",
      "subscription_count": "5",
      "total_revenue": "37485.00"
    }
  ]
}
```

### Export Billing Data (Admin)

```http
GET /analytics/tenant/:tenantId/export
```

**Query Parameters:**
- `type`: `invoices`, `payments`, `subscriptions`
- `format`: `json` (default), `csv`
- `startDate` (optional)
- `endDate` (optional)

**Response:** JSON or CSV file download

---

## Coupons

### List Coupons (Super Admin)

```http
GET /coupons
```

**Query Parameters:**
- `is_active` (optional): `true` or `false`
- `applicable_plan` (optional): Plan UUID

**Response:**
```json
{
  "coupons": [
    {
      "coupon_id": "uuid",
      "code": "WELCOME20",
      "description": "20% off for new customers",
      "discount_type": "percentage",
      "discount_value": "20.00",
      "valid_from": null,
      "valid_until": "2024-12-31T23:59:59Z",
      "max_uses": 100,
      "times_used": 25,
      "is_active": true
    }
  ]
}
```

### Validate Coupon (Public)

```http
GET /coupons/validate/:code
```

**Query Parameters:**
- `planId` (optional): Plan to check applicability
- `subscriptionValue` (optional): Subscription amount

**Response:**
```json
{
  "valid": true,
  "coupon": {
    "coupon_id": "uuid",
    "code": "WELCOME20",
    "discount_type": "percentage",
    "discount_value": "20.00",
    "discount_amount": 499.80
  }
}
```

**Error Response:**
```json
{
  "valid": false,
  "error": "Invalid or expired coupon code"
}
```

### Create Coupon (Super Admin)

```http
POST /coupons
```

**Request Body:**
```json
{
  "code": "SUMMER50",
  "description": "Summer sale - 50% off",
  "discount_type": "percentage", // or "fixed_amount"
  "discount_value": 50.00,
  "valid_from": "2024-06-01T00:00:00Z",
  "valid_until": "2024-08-31T23:59:59Z",
  "max_uses": 500,
  "max_uses_per_tenant": 1,
  "applicable_plans": ["plan-uuid-1", "plan-uuid-2"], // optional, null = all plans
  "min_subscription_value": 1000.00 // optional
}
```

**Response:** `201 Created`

### Update Coupon (Super Admin)

```http
PUT /coupons/:couponId
```

**Request Body:** (partial update)
```json
{
  "is_active": false,
  "max_uses": 1000
}
```

### Delete Coupon (Super Admin)

```http
DELETE /coupons/:couponId
```

**Response:**
```json
{
  "message": "Coupon deleted successfully"
}
```

### Get Coupon Usage (Super Admin)

```http
GET /coupons/:couponId/usage
```

**Response:**
```json
{
  "coupon": {
    /* coupon details */
    "total_uses": 25,
    "total_discount_given": "12495.00",
    "unique_tenants": 20
  },
  "usage_history": [
    {
      "usage_id": "uuid",
      "tenant_name": "Store ABC",
      "subscription_id": "uuid",
      "discount_amount": "499.80",
      "used_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

---

## Partners & Commissions

### List Partners (Super Admin)

```http
GET /partners
```

**Query Parameters:**
- `is_active` (optional)

**Response:**
```json
{
  "partners": [
    {
      "partner_id": "uuid",
      "name": "Regional Distributor",
      "email": "partner@example.com",
      "commission_type": "percentage",
      "commission_value": "15.00",
      "is_active": true
    }
  ]
}
```

### Get Partner Details (Super Admin)

```http
GET /partners/:partnerId
```

### Create Partner (Super Admin)

```http
POST /partners
```

**Request Body:**
```json
{
  "name": "New Partner Name",
  "email": "partner@example.com",
  "phone": "+91-9876543210",
  "commission_type": "percentage", // or "fixed"
  "commission_value": 15.00,
  "bank_details": {
    "account_number": "1234567890",
    "ifsc": "SBIN0001234",
    "bank_name": "State Bank of India"
  }
}
```

**Response:** `201 Created`

### Update Partner (Super Admin)

```http
PUT /partners/:partnerId
```

### Link Partner to Tenant (Super Admin)

```http
POST /partners/link
```

**Request Body:**
```json
{
  "partnerId": "uuid",
  "tenantId": "uuid",
  "custom_commission_type": "percentage", // optional override
  "custom_commission_value": 20.00 // optional override
}
```

**Response:** `201 Created`

### Get Partner Tenants (Super Admin)

```http
GET /partners/:partnerId/tenants
```

### Get Partner Commissions (Super Admin)

```http
GET /partners/:partnerId/commissions
```

**Query Parameters:**
- `status` (optional): `pending`, `approved`, `paid`, `cancelled`
- `startDate`, `endDate` (optional)
- `limit`, `offset` (optional)

**Response:**
```json
{
  "commissions": [
    {
      "commission_id": "uuid",
      "tenant_name": "Store ABC",
      "base_amount": "2948.82",
      "commission_rate": "15.00",
      "commission_amount": "442.32",
      "status": "pending",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "summary": {
    "total_commissions": "50",
    "total_amount": "22116.00",
    "pending_amount": "8846.40",
    "approved_amount": "8846.40",
    "paid_amount": "4423.20"
  }
}
```

### Create Commission (Super Admin)

```http
POST /partners/commissions
```

**Request Body:**
```json
{
  "partnerId": "uuid",
  "tenantId": "uuid",
  "subscriptionId": "uuid", // optional
  "paymentId": "uuid", // optional
  "baseAmount": 2948.82,
  "commissionRate": 15.00, // optional, will be calculated from partner settings
  "commissionAmount": 442.32 // optional, will be calculated
}
```

### Update Commission Status (Super Admin)

```http
PUT /partners/commissions/:commissionId
```

**Request Body:**
```json
{
  "status": "paid", // pending, approved, paid, cancelled
  "payout_reference": "TXN789456" // optional, for paid status
}
```

### Get Partner Analytics (Super Admin)

```http
GET /partners/:partnerId/analytics
```

**Query Parameters:**
- `startDate`, `endDate` (optional)

**Response:**
```json
{
  "analytics": {
    "total_commissions": "50",
    "total_tenants": "10",
    "total_earnings": "22116.00",
    "avg_commission": "442.32",
    "paid_earnings": "13269.60",
    "pending_earnings": "6638.80",
    "approved_earnings": "2207.60"
  }
}
```

---

## Usage Tracking

### Record Usage (Admin)

```http
POST /usage
```

**Request Body:**
```json
{
  "tenantId": "uuid",
  "subscriptionId": "uuid",
  "metricName": "api_calls",
  "quantity": 1000,
  "unit": "calls",
  "unitPrice": 0.01,
  "periodStart": "2024-01-01T00:00:00Z",
  "periodEnd": "2024-01-31T23:59:59Z"
}
```

**Response:** `201 Created`

### Batch Record Usage (Admin)

```http
POST /usage/batch
```

**Request Body:**
```json
{
  "records": [
    {
      "tenantId": "uuid",
      "subscriptionId": "uuid",
      "metricName": "storage_gb",
      "quantity": 50,
      "unit": "gb",
      "unitPrice": 10
    },
    {
      "tenantId": "uuid",
      "subscriptionId": "uuid",
      "metricName": "api_calls",
      "quantity": 5000,
      "unit": "calls",
      "unitPrice": 0.01
    }
  ]
}
```

**Response:** `201 Created`
```json
{
  "count": 2,
  "usage_records": [/* array of created records */]
}
```

### Get Tenant Usage (Admin)

```http
GET /usage/tenant/:tenantId
```

**Query Parameters:**
- `subscriptionId` (optional)
- `metricName` (optional)
- `startDate`, `endDate` (optional)
- `is_billed` (optional): `true` or `false`
- `limit`, `offset` (optional)

**Response:**
```json
{
  "usage_records": [
    {
      "usage_id": "uuid",
      "metric_name": "api_calls",
      "quantity": "1000.00",
      "unit": "calls",
      "unit_price": "0.01",
      "total_amount": "10.00",
      "is_billed": false,
      "period_start": "2024-01-01T00:00:00Z",
      "period_end": "2024-01-31T23:59:59Z"
    }
  ],
  "summary": [
    {
      "metric_name": "api_calls",
      "total_quantity": "15000.00",
      "total_amount": "150.00",
      "record_count": "15",
      "billed_quantity": "10000.00",
      "unbilled_quantity": "5000.00"
    }
  ]
}
```

### Get Usage Summary (Admin)

```http
GET /usage/tenant/:tenantId/summary
```

**Query Parameters:**
- `startDate`, `endDate` (optional)

**Response:**
```json
{
  "summary": [
    {
      "metric_name": "api_calls",
      "unit": "calls",
      "total_quantity": "15000.00",
      "avg_quantity": "1000.00",
      "max_quantity": "2500.00",
      "min_quantity": "500.00",
      "total_cost": "150.00",
      "measurement_count": "15"
    }
  ]
}
```

### Mark Usage as Billed (Admin)

```http
PUT /usage/mark-billed
```

**Request Body:**
```json
{
  "usageIds": ["uuid1", "uuid2", "uuid3"],
  "invoiceId": "uuid"
}
```

**Response:**
```json
{
  "updated_count": 3,
  "usage_records": [/* updated records */]
}
```

### Generate Usage Invoice (Admin)

```http
POST /usage/generate-invoice
```

**Request Body:**
```json
{
  "tenantId": "uuid",
  "subscriptionId": "uuid",
  "periodStart": "2024-01-01T00:00:00Z",
  "periodEnd": "2024-01-31T23:59:59Z"
}
```

**Response:** `201 Created`
```json
{
  "invoice": {/* created invoice */},
  "usage_records_count": 15
}
```

---

## Billing Feature Toggles

### Get Tenant Toggles (Admin)

```http
GET /toggles/tenant/:tenantId
```

**Response:**
```json
{
  "toggles": {
    "tenant_id": "uuid",
    "billing_enabled": true,
    "subscription_management_enabled": true,
    "credit_card_payments_enabled": true,
    "upi_payments_enabled": true,
    "netbanking_enabled": true,
    "wallet_payments_enabled": true,
    "usage_based_billing_enabled": true,
    "metered_billing_enabled": true,
    "invoice_generation_enabled": true,
    "automated_invoicing_enabled": true,
    "coupons_enabled": true,
    "promotional_discounts_enabled": true,
    "partner_commissions_enabled": true,
    "reseller_program_enabled": false,
    "gst_compliance_enabled": true,
    "tax_calculations_enabled": true,
    "billing_analytics_enabled": true,
    "revenue_reports_enabled": true,
    "churn_analysis_enabled": true,
    "invoice_export_enabled": true,
    "billing_history_export_enabled": true
  }
}
```

### Get All Toggles (Super Admin)

```http
GET /toggles
```

**Response:**
```json
{
  "toggles": [
    {
      "tenant_id": "uuid",
      "tenant_name": "Store ABC",
      "tenant_status": "active",
      "billing_enabled": true,
      /* ... all toggle fields ... */
    }
  ]
}
```

### Update Toggles (Super Admin)

```http
PUT /toggles/tenant/:tenantId
```

**Request Body:** (partial update)
```json
{
  "billing_enabled": true,
  "upi_payments_enabled": true,
  "usage_based_billing_enabled": false
}
```

### Enable All Features (Super Admin)

```http
POST /toggles/tenant/:tenantId/enable-all
```

### Disable All Features (Super Admin)

```http
POST /toggles/tenant/:tenantId/disable-all
```

### Check Feature Status (Admin)

```http
GET /toggles/tenant/:tenantId/check/:feature
```

Example:
```http
GET /toggles/tenant/uuid/check/usage_based_billing_enabled
```

**Response:**
```json
{
  "is_enabled": true
}
```

### Get Toggles Summary (Super Admin)

```http
GET /toggles/summary
```

**Response:**
```json
{
  "summary": {
    "total_tenants": "50",
    "billing_enabled_count": "35",
    "subscription_enabled_count": "35",
    "invoice_enabled_count": "30",
    "commissions_enabled_count": "10",
    "usage_billing_enabled_count": "15"
  }
}
```

---

## Payment Gateways

### Get Available Gateways (Public)

```http
GET /gateways/available
```

**Response:**
```json
{
  "gateways": [
    {
      "name": "razorpay",
      "display_name": "Razorpay",
      "description": "India's leading payment gateway",
      "supported_countries": ["India"],
      "supported_currencies": ["INR"],
      "supported_methods": ["card", "upi", "netbanking", "wallet"],
      "setup_fields": ["api_key", "api_secret", "webhook_secret"]
    }
  ]
}
```

### Get Tenant Gateways (Admin)

```http
GET /gateways/tenant/:tenantId
```

**Response:**
```json
{
  "gateways": [
    {
      "gateway_id": "uuid",
      "gateway_name": "razorpay",
      "is_enabled": true,
      "is_test_mode": true,
      "supported_currencies": ["INR"],
      "supported_payment_methods": ["card", "upi", "netbanking"]
    }
  ]
}
```

### Get Gateway Details (Admin)

```http
GET /gateways/:gatewayId
```

**Response:** (credentials excluded for security)

### Configure Gateway (Admin)

```http
POST /gateways
```

**Request Body:**
```json
{
  "tenantId": "uuid",
  "gatewayName": "razorpay",
  "apiKey": "rzp_test_xxxxx",
  "apiSecret": "secret_key_xxxxx",
  "webhookSecret": "webhook_secret_xxxxx",
  "merchantId": "merchant123", // optional
  "isTestMode": true,
  "supportedCurrencies": ["INR"],
  "supportedPaymentMethods": ["card", "upi", "netbanking", "wallet"],
  "configData": {} // optional additional config
}
```

**Response:** `201 Created` or `200 OK` if updating

### Enable/Disable Gateway (Admin)

```http
PUT /gateways/:gatewayId/toggle
```

**Request Body:**
```json
{
  "is_enabled": true
}
```

### Toggle Test Mode (Admin)

```http
PUT /gateways/:gatewayId/test-mode
```

**Request Body:**
```json
{
  "is_test_mode": false
}
```

### Delete Gateway (Admin)

```http
DELETE /gateways/:gatewayId
```

### Test Gateway Connection (Admin)

```http
POST /gateways/:gatewayId/test
```

**Response:**
```json
{
  "test_result": {
    "gateway_name": "razorpay",
    "test_mode": true,
    "connection_status": "success",
    "message": "Gateway credentials are valid",
    "tested_at": "2024-01-15T10:30:00Z"
  }
}
```

---

## Error Responses

All endpoints return appropriate HTTP status codes and error messages:

### 400 Bad Request
```json
{
  "error": "Missing required fields"
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required"
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
  "stack": "..." // only in development
}
```

---

## Rate Limiting

All API endpoints are rate-limited:
- General API: 100 requests per 15 minutes
- Authentication: 5 attempts per 15 minutes

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

---

## Pagination

List endpoints support pagination:

**Parameters:**
- `limit`: Results per page (max: 100, default: 50)
- `offset`: Starting position (default: 0)

**Example:**
```http
GET /invoices/tenant/:tenantId?limit=20&offset=40
```

---

## Webhook Events

(To be implemented in Phase 2)

Payment gateways can send webhook events for:
- `payment.completed`
- `payment.failed`
- `subscription.renewed`
- `subscription.cancelled`

---

## Best Practices

1. **Always use HTTPS** in production
2. **Store credentials securely** - never commit API keys
3. **Use test mode** for development and testing
4. **Validate coupons** before applying to subscriptions
5. **Handle errors gracefully** - check error responses
6. **Monitor rate limits** - implement exponential backoff
7. **Keep audit logs** - all billing actions are logged
8. **Backup data regularly** - export billing data periodically

---

For complete documentation, see [BILLING_SYSTEM_DOCUMENTATION.md](./BILLING_SYSTEM_DOCUMENTATION.md)

**Version**: 1.0.0  
**Last Updated**: January 2024
