# Billing System Quick Start Guide

## Installation

### 1. Run the Migration

```bash
cd backend
psql -h localhost -U postgres -d pulssdb -f migrations/11_billing_system.sql
```

This will create:
- All billing tables (subscriptions, invoices, payments, etc.)
- Default subscription plans
- Billing feature toggles for existing tenants
- Necessary indexes and triggers

### 2. Verify Installation

```bash
# Check if tables were created
psql -d pulssdb -c "\dt billing*"
psql -d pulssdb -c "\dt subscription*"
psql -d pulssdb -c "\dt invoice*"
psql -d pulssdb -c "\dt payment*"
```

---

## Quick Test

### 1. Get Available Plans

```bash
curl http://localhost:3000/api/billing/plans
```

### 2. Enable Billing for a Tenant (Super Admin)

```bash
# Login as super admin first to get token
TOKEN="your_jwt_token"
TENANT_ID="tenant-uuid"

# Enable all billing features
curl -X POST \
  http://localhost:3000/api/billing/toggles/tenant/$TENANT_ID/enable-all \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### 3. Create a Subscription

```bash
curl -X POST \
  http://localhost:3000/api/billing/subscriptions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "'$TENANT_ID'",
    "planId": "plan-uuid-from-step-1"
  }'
```

### 4. Configure Payment Gateway

```bash
curl -X POST \
  http://localhost:3000/api/billing/gateways \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "'$TENANT_ID'",
    "gatewayName": "razorpay",
    "apiKey": "rzp_test_key",
    "apiSecret": "test_secret",
    "webhookSecret": "webhook_secret",
    "isTestMode": true,
    "supportedCurrencies": ["INR"],
    "supportedPaymentMethods": ["card", "upi", "netbanking"]
  }'
```

### 5. Generate Invoice

```bash
SUBSCRIPTION_ID="subscription-uuid-from-step-3"

curl -X POST \
  http://localhost:3000/api/billing/invoices/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subscriptionId": "'$SUBSCRIPTION_ID'"
  }'
```

### 6. Record Payment

```bash
INVOICE_ID="invoice-uuid-from-step-5"

curl -X POST \
  http://localhost:3000/api/billing/payments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "'$TENANT_ID'",
    "invoiceId": "'$INVOICE_ID'",
    "subscriptionId": "'$SUBSCRIPTION_ID'",
    "paymentMethod": "upi",
    "amount": 2499.00,
    "currency": "INR",
    "gatewayName": "razorpay",
    "gatewayTransactionId": "txn_test123"
  }'
```

### 7. View Billing Analytics

```bash
curl http://localhost:3000/api/billing/analytics/tenant/$TENANT_ID \
  -H "Authorization: Bearer $TOKEN"
```

---

## Testing Coupons

### 1. Create a Coupon (Super Admin)

```bash
curl -X POST \
  http://localhost:3000/api/billing/coupons \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "WELCOME20",
    "description": "20% off for new customers",
    "discount_type": "percentage",
    "discount_value": 20,
    "max_uses": 100,
    "max_uses_per_tenant": 1
  }'
```

### 2. Validate Coupon

```bash
curl http://localhost:3000/api/billing/coupons/validate/WELCOME20?planId=plan-uuid&subscriptionValue=2499
```

### 3. Create Subscription with Coupon

```bash
curl -X POST \
  http://localhost:3000/api/billing/subscriptions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "'$TENANT_ID'",
    "planId": "plan-uuid",
    "couponCode": "WELCOME20"
  }'
```

---

## Testing Usage-Based Billing

### 1. Record Usage

```bash
curl -X POST \
  http://localhost:3000/api/billing/usage \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "'$TENANT_ID'",
    "subscriptionId": "'$SUBSCRIPTION_ID'",
    "metricName": "api_calls",
    "quantity": 1000,
    "unit": "calls",
    "unitPrice": 0.01
  }'
```

### 2. View Usage Summary

```bash
curl http://localhost:3000/api/billing/usage/tenant/$TENANT_ID/summary \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Generate Usage Invoice

```bash
curl -X POST \
  http://localhost:3000/api/billing/usage/generate-invoice \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "'$TENANT_ID'",
    "subscriptionId": "'$SUBSCRIPTION_ID'",
    "periodStart": "2024-01-01T00:00:00Z",
    "periodEnd": "2024-01-31T23:59:59Z"
  }'
```

---

## Testing Partner Commissions

### 1. Create Partner (Super Admin)

```bash
curl -X POST \
  http://localhost:3000/api/billing/partners \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Partner",
    "email": "partner@example.com",
    "phone": "+91-9876543210",
    "commission_type": "percentage",
    "commission_value": 15.00
  }'
```

### 2. Link Partner to Tenant

```bash
PARTNER_ID="partner-uuid-from-step-1"

curl -X POST \
  http://localhost:3000/api/billing/partners/link \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "partnerId": "'$PARTNER_ID'",
    "tenantId": "'$TENANT_ID'",
    "custom_commission_value": 20.00
  }'
```

### 3. View Partner Commissions

```bash
curl http://localhost:3000/api/billing/partners/$PARTNER_ID/commissions \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Approve and Pay Commission

```bash
COMMISSION_ID="commission-uuid"

# Approve
curl -X PUT \
  http://localhost:3000/api/billing/partners/commissions/$COMMISSION_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "approved"}'

# Mark as Paid
curl -X PUT \
  http://localhost:3000/api/billing/partners/commissions/$COMMISSION_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "paid",
    "payout_reference": "TXN123456"
  }'
```

---

## Testing Billing Toggles

### 1. Get Current Toggles

```bash
curl http://localhost:3000/api/billing/toggles/tenant/$TENANT_ID \
  -H "Authorization: Bearer $TOKEN"
```

### 2. Update Specific Toggles

```bash
curl -X PUT \
  http://localhost:3000/api/billing/toggles/tenant/$TENANT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "billing_enabled": true,
    "upi_payments_enabled": true,
    "usage_based_billing_enabled": true,
    "invoice_generation_enabled": true
  }'
```

### 3. Check if Feature is Enabled

```bash
curl http://localhost:3000/api/billing/toggles/tenant/$TENANT_ID/check/usage_based_billing_enabled \
  -H "Authorization: Bearer $TOKEN"
```

---

## Automated Tasks

### Setup Cron Jobs

Add to your system cron or use a task scheduler:

```bash
# Daily at 2 AM - Process renewals
0 2 * * * cd /path/to/backend && node -e "require('./services/billingService').processSubscriptionRenewals()"

# Daily at 3 AM - Update overdue invoices
0 3 * * * cd /path/to/backend && node -e "require('./services/billingService').updateOverdueInvoices()"

# Daily at 4 AM - Expire trials
0 4 * * * cd /path/to/backend && node -e "require('./services/billingService').expireTrialSubscriptions()"

# Daily at 5 AM - Calculate commissions
0 5 * * * cd /path/to/backend && node -e "require('./services/billingService').calculatePendingCommissions()"

# Monthly on 1st at 6 AM - Generate usage invoices
0 6 1 * * cd /path/to/backend && node -e "const bs = require('./services/billingService'); const d = new Date(); bs.generateMonthlyUsageInvoices(d.getMonth(), d.getFullYear())"
```

Or create a dedicated cron endpoint:

```javascript
// In backend/routes/cron.js
router.post('/cron/billing/renewals', async (req, res) => {
  const results = await billingService.processSubscriptionRenewals();
  res.json(results);
});
```

---

## Common Queries

### Find Active Subscriptions

```sql
SELECT s.*, t.name as tenant_name, p.name as plan_name
FROM subscriptions s
JOIN tenants t ON s.tenant_id = t.tenant_id
JOIN subscription_plans p ON s.plan_id = p.plan_id
WHERE s.status = 'active';
```

### Find Overdue Invoices

```sql
SELECT i.*, t.name as tenant_name
FROM invoices i
JOIN tenants t ON i.tenant_id = t.tenant_id
WHERE i.status = 'overdue';
```

### Get Monthly Revenue

```sql
SELECT 
  DATE_TRUNC('month', created_at) as month,
  SUM(total_amount) as revenue
FROM subscriptions
WHERE status = 'active'
GROUP BY month
ORDER BY month DESC;
```

### Get Pending Commissions

```sql
SELECT c.*, p.name as partner_name, t.name as tenant_name
FROM commissions c
JOIN partners p ON c.partner_id = p.partner_id
JOIN tenants t ON c.tenant_id = t.tenant_id
WHERE c.status = 'pending'
ORDER BY c.created_at DESC;
```

---

## Troubleshooting

### Issue: "Billing not enabled for this tenant"

**Solution**: Enable billing via toggles:
```bash
curl -X POST \
  http://localhost:3000/api/billing/toggles/tenant/$TENANT_ID/enable-all \
  -H "Authorization: Bearer $TOKEN"
```

### Issue: "Plan not found or inactive"

**Solution**: Check available plans:
```bash
curl http://localhost:3000/api/billing/plans
```

### Issue: Payment gateway connection failed

**Solution**: 
1. Verify credentials are correct
2. Check if test mode is enabled
3. Test connection:
```bash
curl -X POST \
  http://localhost:3000/api/billing/gateways/$GATEWAY_ID/test \
  -H "Authorization: Bearer $TOKEN"
```

### Issue: Commission not calculated

**Solution**: Ensure partner is linked to tenant:
```bash
curl http://localhost:3000/api/billing/partners/$PARTNER_ID/tenants \
  -H "Authorization: Bearer $TOKEN"
```

---

## Development Tips

### 1. Test Mode

Always start with test mode enabled for payment gateways:
```json
{
  "isTestMode": true
}
```

### 2. Use Trial Plans

Test subscription flow with trial plans first:
```sql
SELECT * FROM subscription_plans WHERE trial_period_days > 0;
```

### 3. Monitor Logs

Check backend logs for billing operations:
```bash
tail -f backend.log | grep -i billing
```

### 4. Database Backups

Backup before testing:
```bash
pg_dump pulssdb > backup_before_billing_test.sql
```

---

## Next Steps

1. **Configure Payment Gateways**: Add real API keys for production
2. **Setup Email Templates**: Create email templates for notifications
3. **Configure Tax Rules**: Implement GST/tax calculation logic
4. **Setup Webhooks**: Configure payment gateway webhooks
5. **Create Admin UI**: Build frontend interfaces for billing management
6. **Add Tests**: Write unit and integration tests
7. **Setup Monitoring**: Monitor billing metrics and alerts

---

## Support

For issues or questions:
- Check [BILLING_SYSTEM_DOCUMENTATION.md](./BILLING_SYSTEM_DOCUMENTATION.md)
- Review API endpoints in [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- Check error logs
- Contact development team

---

**Happy Billing! 💰**

This guide will help you set up and start using the billing system in 5 minutes.

## Prerequisites

- PostgreSQL database running
- Node.js backend configured
- Environment variables set up

## Step 1: Run Database Migration (2 minutes)

```bash
cd backend
psql -h localhost -U postgres -d pulssdb -f migrations/11_create_billing_system.sql
```

This will:

- ✅ Create all billing tables
- ✅ Add indexes for performance
- ✅ Insert default subscription plans (Starter, Professional, Enterprise)

## Step 2: Configure Payment Gateway (2 minutes)

### Option A: Razorpay (Recommended)

1. Sign up at https://razorpay.com
2. Get your credentials from Dashboard → Settings → API Keys
3. Add to `.env`:

```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret_key
```

### Option B: Cashfree

1. Sign up at https://cashfree.com
2. Get credentials from Dashboard
3. Add to `.env`:

```env
CASHFREE_APP_ID=your_app_id
CASHFREE_SECRET_KEY=your_secret_key
CASHFREE_MODE=TEST
```

### Option C: Paytm

1. Sign up at https://business.paytm.com
2. Get credentials
3. Add to `.env`:

```env
PAYTM_MID=your_merchant_id
PAYTM_MERCHANT_KEY=your_merchant_key
PAYTM_MODE=STAGING
```

## Step 3: Configure GST Settings (30 seconds)

Add to `.env`:

```env
GST_RATE=18
PLATFORM_GSTIN=YOUR_GSTIN_NUMBER
PLATFORM_STATE=Karnataka
PLATFORM_STATE_CODE=29
```

## Step 4: Start the Backend (30 seconds)

```bash
cd backend
npm run dev
```

## Step 5: Access Billing Features (30 seconds)

### For Super Admin

1. Login as super admin at `/super`
2. Navigate to "Billing" tab
3. View analytics, manage plans, and create coupons

### For Tenant Admin

1. Login as tenant admin at `/admin`
2. Navigate to "Billing" section
3. View subscription, invoices, and usage

## Quick Test

### Test Subscription Creation

```bash
curl -X POST http://localhost:3000/api/billing/subscription \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "PLAN_ID_FROM_DATABASE",
    "billingEmail": "billing@test.com",
    "paymentGateway": "razorpay"
  }'
```

### Test Invoice Generation

```bash
curl -X POST http://localhost:3000/api/billing/invoice/generate \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Default Subscription Plans

The system comes with 3 pre-configured plans:

1. **Starter** - ₹999/month
   - 500 products
   - 1,000 orders/month
   - 14-day free trial

2. **Professional** - ₹2,499/month
   - 2,000 products
   - 5,000 orders/month
   - Advanced analytics
   - 14-day free trial

3. **Enterprise** - ₹4,999/month
   - Unlimited products and orders
   - Priority support
   - 30-day free trial

## Common Tasks

### Create a Coupon Code

```bash
curl -X POST http://localhost:3000/api/billing/admin/coupons \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "WELCOME20",
    "name": "Welcome Discount",
    "discount_type": "percentage",
    "discount_value": 20,
    "valid_from": "2024-01-01",
    "valid_until": "2024-12-31",
    "max_redemptions": 100
  }'
```

### Enable Feature for Tenant

```bash
curl -X POST http://localhost:3000/api/billing/admin/tenants/TENANT_ID/features \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "featureKey": "usage_billing",
    "enabled": true
  }'
```

### Get Usage Metrics

```bash
curl http://localhost:3000/api/billing/usage \
  -H "Authorization: Bearer TENANT_TOKEN"
```

## Webhook Configuration

Configure webhooks in your payment gateway dashboard:

**Razorpay Webhook URL:**

```
https://yourdomain.com/api/billing/payment/callback?paymentGateway=razorpay
```

**Webhook Events to Enable:**

- payment.authorized
- payment.captured
- payment.failed
- subscription.charged
- subscription.cancelled

## Testing Payment Flow

1. Create an invoice
2. Get payment order from `/api/billing/payment/order`
3. Use gateway's test credentials
4. Complete test payment
5. Verify webhook callback
6. Check invoice status updated to "paid"

## Email Notifications (Optional)

To enable email notifications, add to `.env`:

```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your_sendgrid_api_key
EMAIL_FROM=billing@yourdomain.com
```

Then install SendGrid:

```bash
npm install @sendgrid/mail
```

## Troubleshooting

### Database Connection Error

```
Error: Connection refused
```

**Solution:** Ensure PostgreSQL is running and credentials are correct in `.env`

### Payment Gateway Error

```
Error: Invalid API key
```

**Solution:** Verify API keys in `.env` match your gateway dashboard

### Invoice Generation Fails

```
Error: Subscription not found
```

**Solution:** Create a subscription first before generating invoices

### Webhook Not Receiving Callbacks

**Solution:**

1. Check webhook URL is correct
2. Verify SSL certificate if using HTTPS
3. Check server firewall allows incoming requests

## Next Steps

1. Customize invoice templates in `backend/services/gstInvoiceService.js`
2. Configure email templates in `backend/services/billingNotificationService.js`
3. Add custom subscription plans
4. Set up automated billing notifications
5. Configure usage meters for your metrics

## Support

- 📖 Full documentation: [BILLING_SYSTEM.md](./BILLING_SYSTEM.md)
- 🔧 API Reference: `/api/billing/*` endpoints
- 🐛 Issues: Check troubleshooting section above

## Security Checklist

Before going to production:

- [ ] Change all test API keys to production keys
- [ ] Enable HTTPS
- [ ] Configure production webhook URLs
- [ ] Set up monitoring for failed payments
- [ ] Enable audit logging
- [ ] Configure email notifications
- [ ] Set up backup for billing data
- [ ] Review GST compliance settings
- [ ] Test refund flow
- [ ] Verify invoice generation

## Production Deployment

1. Update environment variables to production values
2. Run migrations on production database
3. Configure production payment gateway
4. Set up SSL certificates
5. Enable monitoring and alerts
6. Test end-to-end payment flow
7. Monitor first few transactions closely

---

**You're all set! 🎉**

Your billing system is now ready to accept subscriptions and process payments.
feature/auth-system
