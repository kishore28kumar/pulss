# Advanced Billing & Subscription Management System

## Overview

The Pulss platform now includes a comprehensive billing and subscription management system tailored for Indian payment providers and compliance requirements. The system provides enterprise-grade billing with super admin permission controls.

## Features

### Core Billing Features

1. **Subscription Management**
   - Multiple subscription plans (Starter, Professional, Enterprise)
   - Monthly, quarterly, and annual billing cycles
   - Trial period management with configurable trial days
   - Automatic renewal and cancellation options
   - Plan upgrades and downgrades with proration

2. **Payment Gateway Integration**
   - **Razorpay**: Complete integration with subscriptions, orders, and refunds
   - **Cashfree**: Full payment processing with order management
   - **Paytm**: Transaction support with status tracking
   - Multi-gateway support for flexibility
   - Webhook handling for payment verification

3. **GST Compliance**
   - Automatic GST calculation (CGST + SGST for intra-state, IGST for inter-state)
   - GST-compliant invoice generation with all required fields
   - E-invoicing support with IRN (Invoice Reference Number)
   - QR code generation for invoices
   - HSN/SAC code management for services
   - GSTIN validation

4. **Usage-Based Billing**
   - Configurable usage meters (orders, products, customers, API calls, storage)
   - Real-time usage tracking
   - Included units per plan
   - Overage billing for usage beyond plan limits
   - Usage analytics and reporting

5. **Coupon System**
   - Percentage and fixed-amount discounts
   - Time-bound coupons with validity periods
   - Redemption limits (per coupon and per tenant)
   - Minimum purchase requirements
   - Maximum discount caps for percentage coupons
   - First-time user restrictions
   - Plan-specific coupons

6. **Trial Management**
   - Configurable trial periods per plan
   - Trial status tracking
   - Automatic conversion to paid subscription
   - Trial ending notifications

7. **Refund Management**
   - Full and partial refunds
   - Refund request workflow
   - Super admin approval required
   - Gateway-integrated refund processing
   - Refund status tracking

8. **Email Notifications**
   - Invoice created notifications
   - Payment success confirmations
   - Payment failure alerts
   - Renewal reminders (7 days, 3 days, 1 day before)
   - Trial ending notifications (7 days, 3 days before)
   - Subscription cancellation confirmations

9. **Audit Logging**
   - Complete audit trail for all billing operations
   - Compliance-ready logs with timestamps
   - User action tracking
   - Data change history (old and new values)
   - IP address and user agent logging

10. **GST Receipts**
    - Automatic receipt generation upon payment
    - GST breakdown (CGST, SGST, IGST)
    - Taxable value and total tax calculation
    - Downloadable PDF receipts

### Super Admin Features

1. **Advanced Feature Permissions**
   - Enable/disable features per tenant:
     - Usage-based billing
     - Coupon system
     - Trial management
     - Compliance features
     - Email notifications
   - Feature-level access control
   - Permission audit trail

2. **Plan Management**
   - Create and edit subscription plans
   - Set pricing and billing periods
   - Configure features and limits
   - Activate/deactivate plans
   - Plan-specific trial periods

3. **Coupon Management**
   - Create and manage coupon codes
   - Set discount types and values
   - Configure validity periods and restrictions
   - Track redemptions and usage
   - Activate/deactivate coupons

4. **Billing Analytics**
   - Total revenue tracking
   - Active subscription counts
   - Revenue by plan analysis
   - Coupon usage statistics
   - Pending refund management

5. **Tenant Billing Overview**
   - View all tenant subscriptions
   - Monitor payment status
   - Track subscription renewals
   - Manage billing disputes

## Technical Architecture

### Database Schema

The billing system uses PostgreSQL with the following main tables:

- `subscription_plans`: Available subscription plans
- `tenant_subscriptions`: Active tenant subscriptions
- `tenant_feature_permissions`: Feature access control
- `usage_meters`: Usage tracking configuration
- `usage_events`: Individual usage events
- `invoices`: GST-compliant invoices
- `invoice_items`: Invoice line items
- `coupons`: Discount coupons
- `coupon_redemptions`: Coupon usage history
- `payment_transactions`: Payment records
- `refunds`: Refund requests and processing
- `billing_notifications`: Email notification queue
- `billing_audit_log`: Audit trail
- `gst_receipts`: GST receipts for payments

### Backend Services

1. **billingService.js**
   - Core billing operations
   - Subscription management
   - Invoice generation
   - Usage tracking
   - Feature permission management

2. **paymentGatewayService.js**
   - Razorpay integration
   - Cashfree integration
   - Paytm integration
   - Payment verification
   - Refund processing

3. **gstInvoiceService.js**
   - GST-compliant invoice generation
   - E-invoicing support
   - QR code generation
   - Receipt creation
   - GST calculation

4. **billingNotificationService.js**
   - Email notification management
   - Notification queuing
   - Template-based emails
   - Bulk notification processing

### API Endpoints

#### Public Endpoints

- `GET /api/billing/plans` - Get all subscription plans
- `GET /api/billing/plans/:planId` - Get specific plan details

#### Tenant Endpoints (Authenticated)

- `POST /api/billing/subscription` - Create subscription
- `GET /api/billing/subscription` - Get tenant subscription
- `PUT /api/billing/subscription/:subscriptionId` - Update subscription
- `POST /api/billing/invoice/generate` - Generate invoice
- `GET /api/billing/invoices` - Get invoices
- `GET /api/billing/invoices/:invoiceId` - Get invoice details
- `GET /api/billing/invoices/:invoiceId/gst` - Get GST-formatted invoice
- `POST /api/billing/coupon/apply` - Apply coupon code
- `POST /api/billing/payment/order` - Create payment order
- `POST /api/billing/refund/request` - Request refund
- `GET /api/billing/usage` - Get usage metrics
- `POST /api/billing/usage/record` - Record usage event

#### Super Admin Endpoints

- `GET /api/billing/admin/tenants/subscriptions` - Get all tenant subscriptions
- `POST /api/billing/admin/plans` - Create plan
- `PUT /api/billing/admin/plans/:planId` - Update plan
- `DELETE /api/billing/admin/plans/:planId` - Delete plan
- `GET /api/billing/admin/coupons` - Get all coupons
- `POST /api/billing/admin/coupons` - Create coupon
- `PUT /api/billing/admin/coupons/:couponId` - Update coupon
- `DELETE /api/billing/admin/coupons/:couponId` - Delete coupon
- `GET /api/billing/admin/tenants/:tenantId/features` - Get tenant features
- `POST /api/billing/admin/tenants/:tenantId/features` - Set tenant feature
- `GET /api/billing/admin/analytics` - Get billing analytics
- `GET /api/billing/admin/invoices` - Get all invoices
- `POST /api/billing/admin/refunds/:refundId/manage` - Approve/reject refund
- `GET /api/billing/admin/audit` - Get audit log

### Frontend Components

1. **BillingManagement.tsx** (Tenant Admin)
   - Subscription overview
   - Invoice listing and download
   - Usage metrics display
   - Coupon code application
   - Payment processing

2. **SuperAdminBilling.tsx** (Super Admin)
   - Billing analytics dashboard
   - Plan management interface
   - Coupon management interface
   - Tenant subscription overview
   - Feature permission management

## Setup Instructions

### 1. Database Migration

Run the billing system migration:

```bash
cd backend
psql -h localhost -U postgres -d pulssdb -f migrations/11_create_billing_system.sql
```

### 2. Environment Configuration

Add the following to your `.env` file:

```env
# Payment Gateway Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret

CASHFREE_APP_ID=your_cashfree_app_id
CASHFREE_SECRET_KEY=your_cashfree_secret_key
CASHFREE_MODE=TEST

PAYTM_MID=your_paytm_merchant_id
PAYTM_MERCHANT_KEY=your_paytm_merchant_key
PAYTM_MODE=STAGING

# Email Configuration
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your_sendgrid_api_key
EMAIL_FROM=billing@pulss.app

# GST Configuration
GST_RATE=18
PLATFORM_GSTIN=YOUR_PLATFORM_GSTIN
PLATFORM_STATE=Your State
PLATFORM_STATE_CODE=00
```

### 3. Payment Gateway Setup

#### Razorpay

1. Sign up at https://razorpay.com
2. Get your Key ID and Key Secret from Dashboard
3. Configure webhook URL: `https://yourdomain.com/api/billing/payment/callback?paymentGateway=razorpay`
4. Enable required payment methods (cards, UPI, netbanking, wallets)

#### Cashfree

1. Sign up at https://cashfree.com
2. Get your App ID and Secret Key
3. Configure callback URL in dashboard
4. Set mode to TEST for testing, PROD for production

#### Paytm

1. Sign up at https://business.paytm.com
2. Get your Merchant ID and Merchant Key
3. Configure callback URL
4. Set mode to STAGING for testing, PROD for production

### 4. Email Service Setup

Configure your email provider (SendGrid recommended):

```bash
npm install @sendgrid/mail
```

Update `billingNotificationService.js` to use your email provider:

```javascript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async sendEmail(to, subject, body) {
  const msg = {
    to,
    from: process.env.EMAIL_FROM,
    subject,
    text: body,
    html: body.replace(/\n/g, '<br>')
  };
  return await sgMail.send(msg);
}
```

## Usage Guide

### For Tenants

#### 1. Subscribe to a Plan

```javascript
// Create subscription
const response = await fetch('/api/billing/subscription', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    planId: 'plan-id-here',
    billingEmail: 'billing@tenant.com',
    paymentGateway: 'razorpay',
  }),
});
```

#### 2. View Invoices

```javascript
// Get invoices
const response = await fetch('/api/billing/invoices', {
  headers: { Authorization: `Bearer ${token}` },
});
const { data } = await response.json();
```

#### 3. Apply Coupon Code

```javascript
// Apply coupon
const response = await fetch('/api/billing/coupon/apply', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    invoiceId: 'invoice-id',
    couponCode: 'WELCOME20',
  }),
});
```

#### 4. Track Usage

```javascript
// Get usage metrics
const response = await fetch('/api/billing/usage', {
  headers: { Authorization: `Bearer ${token}` },
});
const { data } = await response.json();
```

### For Super Admins

#### 1. Create Subscription Plan

```javascript
// Create plan
const response = await fetch('/api/billing/admin/plans', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Professional',
    description: 'For growing businesses',
    billing_period: 'monthly',
    base_price: 2499,
    features: {
      products: 2000,
      orders_per_month: 5000,
    },
    limits: {
      products: 2000,
      orders_per_month: 5000,
    },
    trial_days: 14,
    is_active: true,
    is_public: true,
  }),
});
```

#### 2. Create Coupon

```javascript
// Create coupon
const response = await fetch('/api/billing/admin/coupons', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    code: 'LAUNCH50',
    name: 'Launch Offer',
    description: '50% off for first 3 months',
    discount_type: 'percentage',
    discount_value: 50,
    valid_from: '2024-01-01',
    valid_until: '2024-12-31',
    max_redemptions: 100,
    first_time_only: true,
  }),
});
```

#### 3. Enable Feature for Tenant

```javascript
// Enable feature
const response = await fetch('/api/billing/admin/tenants/tenant-id/features', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    featureKey: 'usage_billing',
    enabled: true,
    metadata: {
      config: 'custom configuration',
    },
  }),
});
```

## Customization

### Adding New Payment Gateways

1. Add gateway configuration to `paymentGatewayService.js`
2. Implement gateway-specific methods:
   - `createOrder()`
   - `verifyPayment()`
   - `processRefund()`
3. Update webhook handler in `billingController.js`

### Custom Invoice Templates

Modify `gstInvoiceService.js` to customize invoice format:

```javascript
async generateGSTInvoice(invoiceId) {
  // Your custom invoice format
  return customInvoiceData;
}
```

### Custom Email Templates

Update `billingNotificationService.js` with HTML email templates:

```javascript
async sendInvoiceCreated(invoiceId) {
  const htmlBody = `
    <html>
      <body>
        <!-- Your custom email template -->
      </body>
    </html>
  `;
  // Send email
}
```

## Compliance

### GST Compliance Checklist

- ✅ GSTIN validation
- ✅ Tax calculation (CGST/SGST/IGST)
- ✅ HSN/SAC codes
- ✅ Invoice numbering
- ✅ E-invoicing support
- ✅ QR code generation
- ✅ GST receipts
- ✅ Audit trail

### Data Privacy

- All payment data is handled securely
- PCI DSS compliance through payment gateways
- No card details stored locally
- Encrypted sensitive data
- Audit logging for compliance

## Troubleshooting

### Common Issues

1. **Payment verification fails**
   - Check webhook secret configuration
   - Verify signature calculation
   - Check gateway credentials

2. **Invoice generation errors**
   - Verify GST rate configuration
   - Check tenant billing details
   - Ensure subscription is active

3. **Coupon not applying**
   - Verify coupon is active
   - Check validity period
   - Confirm redemption limits

4. **Email notifications not sending**
   - Check email provider configuration
   - Verify API keys
   - Check notification queue status

## Support

For issues and questions:

- Check the troubleshooting section above
- Review API documentation
- Contact support team

## Future Enhancements

Planned features for future releases:

1. Automated subscription plan recommendations
2. Advanced usage analytics with predictive insights
3. Multi-currency support
4. Automated tax compliance reporting
5. Custom billing cycles
6. Volume-based discounts
7. Partner/reseller billing
8. Revenue recognition automation
9. Advanced proration logic
10. Dunning management for failed payments
