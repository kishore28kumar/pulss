# Advanced Billing and Subscription Management System

## Overview

The Pulss platform now includes a comprehensive billing and subscription management system with enterprise-grade features, all controlled by super admin toggles for granular control over tenant capabilities.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Super Admin Controls](#super-admin-controls)
- [Payment Gateway Integration](#payment-gateway-integration)
- [Usage-Based Billing](#usage-based-billing)
- [Partner Commission System](#partner-commission-system)
- [Compliance & Tax](#compliance--tax)
- [Analytics & Reporting](#analytics--reporting)
- [Extension Guide](#extension-guide)

---

## Features

### Core Billing Features

1. **Subscription Management**
   - Tiered subscription plans (Free, Basic, Professional, Enterprise, Custom)
   - Multiple billing cycles (monthly, quarterly, yearly, one-time)
   - Trial period support
   - Auto-renewal management
   - Subscription history tracking
   - Status management (pending, active, past_due, cancelled, expired, trial, suspended)

2. **Invoice Generation**
   - Automated invoice creation
   - Invoice number generation
   - Line item support
   - Tax calculation integration
   - Multiple payment status tracking
   - PDF generation ready

3. **Payment Processing**
   - Multi-gateway support (Stripe, Razorpay, PayPal, Paytm, PhonePe, Cashfree, Instamojo, CCAvenue)
   - Multiple payment methods (card, UPI, netbanking, wallet, bank transfer)
   - Payment status tracking
   - Gateway response logging
   - Refund support

4. **Discount & Coupon System**
   - Percentage and fixed-amount discounts
   - Coupon codes with validation
   - Usage limits (total and per-tenant)
   - Time-bound validity
   - Plan-specific applicability
   - Minimum subscription value requirements
   - Usage tracking and analytics

5. **Usage-Based Billing**
   - Metered billing support
   - Multiple metric tracking (API calls, storage, orders, etc.)
   - Usage aggregation and reporting
   - Automated invoice generation from usage
   - Flexible unit pricing

6. **Partner & Reseller Program**
   - Partner registration and management
   - Commission tracking (percentage or fixed)
   - Custom commission rates per tenant
   - Commission status management (pending, approved, paid, cancelled)
   - Payout tracking
   - Partner analytics

### Advanced Features

1. **Super Admin Toggles**
   - Per-tenant billing feature control
   - Payment method toggles
   - Advanced feature toggles
   - Compliance feature toggles
   - Export and analytics toggles

2. **Analytics & Reporting**
   - Revenue metrics (MRR, ARR, total revenue)
   - Subscription metrics (active, cancelled, churn rate)
   - Customer lifetime value (LTV)
   - Average revenue per user (ARPU)
   - Revenue trends over time
   - Global analytics for super admin
   - Partner analytics

3. **Multi-Gateway Support**
   - Easy gateway configuration
   - Test/Production mode switching
   - Gateway credential management
   - Connection testing
   - Gateway-specific settings

4. **Compliance Ready**
   - GST compliance support
   - Tax calculation hooks
   - Audit trail through subscription history
   - Invoice compliance
   - Data export capabilities

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Super Admin Layer                        │
│  - Billing Feature Toggles                                   │
│  - Plan Management                                           │
│  - Partner Management                                        │
│  - Global Analytics                                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Tenant Layer                             │
│  - Subscription Management                                   │
│  - Invoice Management                                        │
│  - Payment Gateway Config                                    │
│  - Usage Tracking                                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Payment Gateways                           │
│  Stripe | Razorpay | PayPal | Paytm | PhonePe | Others     │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Subscription Creation**
   ```
   Tenant → Select Plan → Apply Coupon (optional) → Create Subscription
   → Generate Invoice → Process Payment → Activate Subscription
   ```

2. **Usage-Based Billing**
   ```
   Track Usage → Aggregate Usage → Generate Invoice → Process Payment
   → Mark Usage as Billed
   ```

3. **Partner Commission**
   ```
   Payment Processed → Calculate Commission → Create Commission Record
   → Approve Commission → Payout to Partner
   ```

---

## Database Schema

### Core Tables

#### subscription_plans
Defines available subscription tiers and pricing.

```sql
- plan_id (UUID, PK)
- name, description
- plan_type (free, basic, professional, enterprise, custom)
- billing_cycle (monthly, quarterly, yearly, one_time)
- price, currency
- max_products, max_orders_per_month, max_storage_gb, max_admin_users
- features (JSONB)
- usage_based_billing, usage_metrics
- trial_period_days
- is_active, is_visible
```

#### subscriptions
Tracks active and historical subscriptions.

```sql
- subscription_id (UUID, PK)
- tenant_id, plan_id
- status (pending, active, past_due, cancelled, expired, trial, suspended)
- start_date, end_date, trial_end_date, next_billing_date
- base_price, discount_amount, tax_amount, total_amount
- auto_renew
- cancellation_reason, cancelled_by, cancelled_at
```

#### invoices
Generated invoices for subscriptions and usage.

```sql
- invoice_id (UUID, PK)
- tenant_id, subscription_id
- invoice_number, invoice_date, due_date
- status (draft, pending, paid, partially_paid, overdue, cancelled, refunded)
- subtotal, discount_amount, tax_amount, total_amount
- paid_amount, balance_due
- tax_rate, tax_type, gstin
- customer_details (JSONB)
- line_items (JSONB)
```

#### payments
Payment transaction records.

```sql
- payment_id (UUID, PK)
- tenant_id, invoice_id, subscription_id
- payment_method (card, upi, netbanking, wallet, etc.)
- gateway_name, gateway_transaction_id, gateway_payment_id
- amount, currency
- status (pending, processing, completed, failed, cancelled, refunded)
- payment_date, processed_at
- gateway_response (JSONB)
```

#### coupons
Discount coupons and promotional codes.

```sql
- coupon_id (UUID, PK)
- code, description
- discount_type (percentage, fixed_amount)
- discount_value
- valid_from, valid_until
- max_uses, max_uses_per_tenant, times_used
- applicable_plans (UUID[])
- min_subscription_value
```

#### partners
Partner/reseller information.

```sql
- partner_id (UUID, PK)
- name, email, phone
- commission_type (percentage, fixed)
- commission_value
- bank_details (JSONB)
- is_active
```

#### commissions
Commission tracking for partners.

```sql
- commission_id (UUID, PK)
- partner_id, tenant_id, subscription_id, payment_id
- base_amount, commission_rate, commission_amount
- status (pending, approved, paid, cancelled)
- payout_date, payout_reference
```

#### usage_records
Usage tracking for metered billing.

```sql
- usage_id (UUID, PK)
- tenant_id, subscription_id
- metric_name, quantity, unit
- unit_price, total_amount
- period_start, period_end
- is_billed, billed_in_invoice_id
```

#### billing_feature_toggles
Super admin controls for billing features.

```sql
- tenant_id (UUID, PK)
- billing_enabled
- subscription_management_enabled
- credit_card_payments_enabled, upi_payments_enabled, etc.
- usage_based_billing_enabled, metered_billing_enabled
- invoice_generation_enabled, automated_invoicing_enabled
- coupons_enabled, promotional_discounts_enabled
- partner_commissions_enabled, reseller_program_enabled
- gst_compliance_enabled, tax_calculations_enabled
- billing_analytics_enabled, revenue_reports_enabled
- churn_analysis_enabled
- invoice_export_enabled, billing_history_export_enabled
```

---

## API Endpoints

### Subscription Plans

```
GET    /api/billing/plans                    - List all plans
GET    /api/billing/plans/:planId            - Get plan details
POST   /api/billing/plans                    - Create plan (Super Admin)
PUT    /api/billing/plans/:planId            - Update plan (Super Admin)
```

### Subscriptions

```
GET    /api/billing/subscriptions/tenant/:tenantId           - Get current subscription
GET    /api/billing/subscriptions/tenant/:tenantId/history   - Get subscription history
POST   /api/billing/subscriptions                            - Create subscription
PUT    /api/billing/subscriptions/:subscriptionId/status     - Update subscription status
POST   /api/billing/subscriptions/:subscriptionId/cancel     - Cancel subscription
```

### Invoices

```
GET    /api/billing/invoices/tenant/:tenantId       - List invoices
GET    /api/billing/invoices/:invoiceId             - Get invoice details
POST   /api/billing/invoices/generate               - Generate invoice
PUT    /api/billing/invoices/:invoiceId/mark-paid   - Mark as paid
```

### Payments

```
POST   /api/billing/payments                        - Record payment
GET    /api/billing/payments/tenant/:tenantId       - Payment history
```

### Analytics

```
GET    /api/billing/analytics/tenant/:tenantId         - Tenant billing analytics
GET    /api/billing/analytics/tenant/:tenantId/trends  - Revenue trends
GET    /api/billing/analytics/global                   - Global analytics (Super Admin)
GET    /api/billing/analytics/tenant/:tenantId/export  - Export billing data
```

### Coupons

```
GET    /api/billing/coupons                    - List coupons
GET    /api/billing/coupons/validate/:code     - Validate coupon
POST   /api/billing/coupons                    - Create coupon (Super Admin)
PUT    /api/billing/coupons/:couponId          - Update coupon (Super Admin)
DELETE /api/billing/coupons/:couponId          - Delete coupon (Super Admin)
GET    /api/billing/coupons/:couponId/usage    - Coupon usage stats
```

### Partners

```
GET    /api/billing/partners                           - List partners
GET    /api/billing/partners/:partnerId                - Get partner details
POST   /api/billing/partners                           - Create partner
PUT    /api/billing/partners/:partnerId                - Update partner
POST   /api/billing/partners/link                      - Link partner to tenant
GET    /api/billing/partners/:partnerId/tenants        - Partner's tenants
GET    /api/billing/partners/:partnerId/commissions    - Partner commissions
POST   /api/billing/partners/commissions               - Create commission
PUT    /api/billing/partners/commissions/:commissionId - Update commission status
GET    /api/billing/partners/:partnerId/analytics      - Partner analytics
```

### Usage Tracking

```
POST   /api/billing/usage                          - Record usage
POST   /api/billing/usage/batch                    - Batch record usage
GET    /api/billing/usage/tenant/:tenantId         - Get tenant usage
GET    /api/billing/usage/tenant/:tenantId/summary - Usage summary
PUT    /api/billing/usage/mark-billed              - Mark usage as billed
POST   /api/billing/usage/generate-invoice         - Generate usage invoice
```

### Billing Toggles (Super Admin)

```
GET    /api/billing/toggles/tenant/:tenantId              - Get tenant toggles
GET    /api/billing/toggles                               - Get all toggles
PUT    /api/billing/toggles/tenant/:tenantId              - Update toggles
POST   /api/billing/toggles/tenant/:tenantId/enable-all   - Enable all features
POST   /api/billing/toggles/tenant/:tenantId/disable-all  - Disable all features
GET    /api/billing/toggles/tenant/:tenantId/check/:feature - Check feature status
GET    /api/billing/toggles/summary                       - Toggles summary
```

### Payment Gateways

```
GET    /api/billing/gateways/available           - List available gateways
GET    /api/billing/gateways/tenant/:tenantId    - Tenant gateways
GET    /api/billing/gateways/:gatewayId          - Gateway details
POST   /api/billing/gateways                     - Configure gateway
PUT    /api/billing/gateways/:gatewayId/toggle   - Enable/disable gateway
PUT    /api/billing/gateways/:gatewayId/test-mode - Toggle test mode
DELETE /api/billing/gateways/:gatewayId          - Delete gateway
POST   /api/billing/gateways/:gatewayId/test     - Test connection
```

---

## Super Admin Controls

### Enabling Billing for a Tenant

```bash
# Enable all billing features
POST /api/billing/toggles/tenant/:tenantId/enable-all

# Or enable specific features
PUT /api/billing/toggles/tenant/:tenantId
{
  "billing_enabled": true,
  "subscription_management_enabled": true,
  "upi_payments_enabled": true,
  "invoice_generation_enabled": true
}
```

### Creating Subscription Plans

```bash
POST /api/billing/plans
{
  "name": "Professional",
  "description": "For growing businesses",
  "plan_type": "professional",
  "billing_cycle": "monthly",
  "price": 2499.00,
  "currency": "INR",
  "max_products": null,
  "max_orders_per_month": 2000,
  "max_storage_gb": 20,
  "max_admin_users": 5,
  "features": [
    "Unlimited products",
    "Advanced analytics",
    "Multi-location support",
    "API access",
    "Priority support"
  ],
  "trial_period_days": 14
}
```

### Managing Partners

```bash
# Create partner
POST /api/billing/partners
{
  "name": "Regional Distributor XYZ",
  "email": "partner@example.com",
  "phone": "+91-9876543210",
  "commission_type": "percentage",
  "commission_value": 15.00,
  "bank_details": {
    "account_number": "1234567890",
    "ifsc": "SBIN0001234",
    "bank_name": "State Bank of India"
  }
}

# Link partner to tenant
POST /api/billing/partners/link
{
  "partnerId": "uuid",
  "tenantId": "uuid",
  "custom_commission_value": 20.00
}
```

---

## Payment Gateway Integration

### Supported Gateways

1. **Stripe** - Global payments
2. **Razorpay** - India's leading gateway
3. **PayPal** - International payments
4. **Paytm** - Digital wallet and payments
5. **PhonePe** - UPI-first payment solution
6. **Cashfree** - Payment and banking
7. **Instamojo** - Indian payment solution
8. **CCAvenue** - Comprehensive gateway

### Gateway Configuration

```bash
POST /api/billing/gateways
{
  "tenantId": "uuid",
  "gatewayName": "razorpay",
  "apiKey": "rzp_test_xxxxx",
  "apiSecret": "secret_key_xxxxx",
  "webhookSecret": "webhook_secret_xxxxx",
  "isTestMode": true,
  "supportedCurrencies": ["INR"],
  "supportedPaymentMethods": ["card", "upi", "netbanking", "wallet"]
}
```

### Test Gateway Connection

```bash
POST /api/billing/gateways/:gatewayId/test
```

---

## Usage-Based Billing

### Recording Usage

```bash
# Single usage record
POST /api/billing/usage
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

# Batch usage records
POST /api/billing/usage/batch
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
      "metricName": "orders_processed",
      "quantity": 500,
      "unit": "orders",
      "unitPrice": 2
    }
  ]
}
```

### Generating Usage Invoice

```bash
POST /api/billing/usage/generate-invoice
{
  "tenantId": "uuid",
  "subscriptionId": "uuid",
  "periodStart": "2024-01-01T00:00:00Z",
  "periodEnd": "2024-01-31T23:59:59Z"
}
```

---

## Partner Commission System

### Commission Calculation

Commissions are automatically calculated based on:
- Base subscription amount
- Partner's commission rate (percentage or fixed)
- Custom rates per tenant (if configured)

### Commission Workflow

1. **Automatic Creation**: When a payment is processed for a partner-linked tenant
2. **Pending State**: Commission starts in pending state
3. **Approval**: Super admin approves commission
4. **Payout**: Mark as paid with payout reference

```bash
# Approve commission
PUT /api/billing/partners/commissions/:commissionId
{
  "status": "approved"
}

# Mark as paid
PUT /api/billing/partners/commissions/:commissionId
{
  "status": "paid",
  "payout_reference": "TXN123456"
}
```

---

## Compliance & Tax

### GST Compliance

The system is designed to support GST compliance:
- GSTIN field on invoices
- Tax rate and type tracking
- Tax amount calculation hooks
- Compliance-ready invoice format

### Tax Calculation Hook

```javascript
// In billingController.js - can be extended
const taxAmount = calculateTax(baseAmount, tenantLocation, taxType);
```

### Audit Trail

- Subscription history table tracks all changes
- Payment records maintain gateway responses
- Audit log integration for all billing actions

---

## Analytics & Reporting

### Key Metrics

1. **Monthly Recurring Revenue (MRR)**
   ```
   SUM(active_subscriptions.total_amount)
   ```

2. **Churn Rate**
   ```
   (cancelled_subscriptions / total_subscriptions) * 100
   ```

3. **Average Revenue Per User (ARPU)**
   ```
   total_revenue / total_subscriptions
   ```

4. **Lifetime Value (LTV)**
   ```
   (avg_subscription_lifetime_days / 30) * avg_monthly_revenue
   ```

### Generating Reports

```bash
# Tenant analytics
GET /api/billing/analytics/tenant/:tenantId
?startDate=2024-01-01&endDate=2024-12-31

# Revenue trends
GET /api/billing/analytics/tenant/:tenantId/trends
?period=monthly&startDate=2024-01-01

# Export data
GET /api/billing/analytics/tenant/:tenantId/export
?type=invoices&format=csv&startDate=2024-01-01
```

---

## Extension Guide

### Adding New Payment Gateway

1. Add gateway name to database enum in migration
2. Update `getAvailableGateways()` in `paymentGatewaysController.js`
3. Implement gateway-specific logic in a service file
4. Add webhook handler for gateway callbacks

### Adding New Usage Metrics

1. Define metric in subscription plan `usage_metrics` JSONB
2. Record usage via `/api/billing/usage` endpoint
3. Configure unit price for the metric
4. Usage will automatically appear in invoices

### Custom Commission Rules

Extend `createCommission()` in `partnersController.js`:

```javascript
// Add custom logic before commission calculation
if (customRule) {
  finalCommissionAmount = customCalculation(baseAmount);
}
```

### Adding Tax Calculation

Implement tax calculation in `billingController.js`:

```javascript
const calculateTax = (amount, tenantLocation, taxType) => {
  // GST calculation for India
  if (tenantLocation.country === 'India') {
    const gstRate = tenantLocation.state === 'local' ? 18 : 18;
    return amount * (gstRate / 100);
  }
  return 0;
};
```

### Email Notifications

Integrate with existing notification system:

```javascript
// After invoice creation
await sendNotification({
  type: 'email',
  template: 'invoice_generated',
  to: tenant.email,
  data: { invoice }
});
```

---

## Security Considerations

1. **Credential Storage**: Payment gateway credentials should be encrypted at rest
2. **API Authentication**: All billing endpoints require authentication
3. **Role-Based Access**: Super admin vs tenant admin permissions
4. **Audit Logging**: All billing actions should be logged
5. **PCI Compliance**: Never store card details - use gateway tokens
6. **Webhook Validation**: Verify webhook signatures from gateways

---

## Testing

### Test Scenarios

1. **Subscription Creation**
   - Create with/without coupon
   - Apply trial period
   - Test auto-renewal

2. **Payment Processing**
   - Test mode payments
   - Different payment methods
   - Failed payments
   - Refunds

3. **Usage Billing**
   - Record usage
   - Generate invoice
   - Mark as billed

4. **Commission Calculation**
   - Percentage commission
   - Fixed commission
   - Custom rates

5. **Feature Toggles**
   - Enable/disable features
   - Check restrictions
   - Verify access control

---

## Migration Guide

### Running the Migration

```bash
# PostgreSQL
psql -d pulssdb -f backend/migrations/11_billing_system.sql

# Or using npm script
cd backend
npm run migrate:local
```

### Seed Data

The migration includes default subscription plans:
- Free Trial (14 days)
- Basic (₹999/month)
- Professional (₹2,499/month)
- Enterprise (₹9,999/month)
- Annual plans with 20% discount

---

## Support & Maintenance

### Common Operations

1. **Monthly Renewal Processing**
   ```sql
   -- Find subscriptions due for renewal
   SELECT * FROM subscriptions 
   WHERE next_billing_date <= NOW() 
   AND auto_renew = true 
   AND status = 'active';
   ```

2. **Overdue Invoice Detection**
   ```sql
   -- Find overdue invoices
   UPDATE invoices SET status = 'overdue'
   WHERE due_date < NOW() 
   AND status = 'pending';
   ```

3. **Usage Aggregation**
   ```sql
   -- Get unbilled usage for period
   SELECT tenant_id, metric_name, SUM(quantity) as total
   FROM usage_records
   WHERE is_billed = false
   GROUP BY tenant_id, metric_name;
   ```

### Monitoring

- Monitor failed payments
- Track churn rate trends
- Review commission approval queue
- Check gateway connection status
- Monitor usage patterns

---

## Roadmap

### Phase 2 Enhancements

- [ ] Automated email notifications for billing events
- [ ] PDF invoice generation with custom templates
- [ ] Dunning management (failed payment recovery)
- [ ] Proration for mid-cycle upgrades/downgrades
- [ ] Multi-currency support expansion
- [ ] Advanced tax rules engine
- [ ] Subscription pause/resume functionality
- [ ] Customer portal for self-service billing
- [ ] Automated payment retry logic
- [ ] Advanced reporting dashboards

---

## Contact & Support

For questions or issues with the billing system:
- Check API documentation
- Review error logs
- Consult super admin analytics
- Contact development team

---

**Version**: 1.0.0  
**Last Updated**: January 2024  
**Maintained By**: Pulss Development Team
