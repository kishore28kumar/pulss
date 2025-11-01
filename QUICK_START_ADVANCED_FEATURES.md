# Quick Start Guide: Advanced Features

This guide will help you quickly set up and start using the advanced features in Pulss.

## Prerequisites

- PostgreSQL database running
- Node.js backend server running
- Access to Twilio (for SMS/WhatsApp) or Firebase (for push notifications) - optional but recommended

## Step 1: Database Setup

Run the advanced features migration:

```bash
cd backend
psql -d pulssdb -f migrations/09_advanced_features.sql
```

Or if using environment variable:
```bash
psql $DATABASE_URL -f migrations/09_advanced_features.sql
```

Expected output:
```
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
ALTER TABLE
CREATE INDEX
...
```

## Step 2: Configure Environment Variables

Edit your `backend/.env` file and add:

### For Push Notifications (Optional)

**Option A: Firebase Cloud Messaging (FCM)**
```env
FCM_ENABLED=true
FCM_SERVER_KEY=your_firebase_server_key
```

**Option B: Web Push API**
```env
WEB_PUSH_ENABLED=true
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
```

To generate VAPID keys:
```bash
npm install -g web-push
web-push generate-vapid-keys
```

### For SMS/WhatsApp (Optional)

**Option A: Twilio**
```env
TWILIO_ENABLED=true
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=+1234567890
```

**Option B: WhatsApp Business API**
```env
WHATSAPP_BUSINESS_ENABLED=true
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_API_KEY=your_whatsapp_api_key
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
```

### Frontend URL
```env
FRONTEND_URL=http://localhost:5173
```

## Step 3: Restart Backend Server

```bash
cd backend
npm run dev
```

The server should start without errors and show all routes loaded.

## Step 4: Test the Features

### Test 1: Check Configuration
```bash
curl http://localhost:3000/api/messaging/config \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected response:
```json
{
  "success": true,
  "config": {
    "twilioEnabled": true,
    "whatsappBusinessEnabled": false,
    "twilioConfigured": true,
    "whatsappConfigured": false
  }
}
```

### Test 2: Get Analytics Dashboard
```bash
curl "http://localhost:3000/api/analytics/dashboard?startDate=2025-01-01&endDate=2025-12-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test 3: Get Order Tracking
```bash
curl http://localhost:3000/api/tracking/YOUR_ORDER_ID
```

## Step 5: Access Frontend Features

### Analytics Dashboard
Navigate to: `http://localhost:5173/admin/analytics`

Features:
- Sales trends over time
- Customer segmentation
- Product performance
- Category performance

### Messaging Center
Navigate to: `http://localhost:5173/admin/messaging`

Features:
- Send broadcast messages via SMS/WhatsApp
- Send push notifications
- View message logs

### Order Tracking
Navigate to: `http://localhost:5173/track/ORDER_ID`

Features:
- Real-time order status
- Delivery timeline
- GPS location updates (if configured)

## Common Issues & Solutions

### Issue 1: Migration Fails

**Error:** `ERROR:  relation "push_subscriptions" already exists`

**Solution:** The migration has already been run. You can skip this step.

### Issue 2: Push Notifications Not Working

**Checklist:**
- [ ] FCM_ENABLED or WEB_PUSH_ENABLED is set to `true`
- [ ] FCM_SERVER_KEY or VAPID keys are correctly set
- [ ] Service worker is registered in the browser
- [ ] Notification permissions are granted
- [ ] User has subscribed to notifications

### Issue 3: SMS/WhatsApp Not Sending

**Checklist:**
- [ ] TWILIO_ENABLED or WHATSAPP_BUSINESS_ENABLED is set to `true`
- [ ] API credentials are correct
- [ ] Phone numbers are in E.164 format (+country code)
- [ ] Twilio account has sufficient balance
- [ ] WhatsApp Business account is verified

### Issue 4: Analytics Shows No Data

**Solution:** 
- Ensure there are orders in the database
- Check the date range is correct
- Verify tenant_id is set correctly in the request

## Next Steps

### 1. Configure Push Notifications

1. Get Firebase credentials or generate VAPID keys
2. Update `.env` file
3. Subscribe users to notifications from the frontend
4. Test by sending a broadcast notification

### 2. Set Up SMS/WhatsApp

1. Sign up for Twilio or WhatsApp Business API
2. Add credentials to `.env`
3. Test by sending a message to a customer
4. Set up automated order notifications

### 3. Enable GPS Tracking

1. Ensure delivery personnel have location permissions
2. Update order locations via `/api/tracking/:orderId/location`
3. View real-time tracking on customer order page

### 4. Explore Analytics

1. Access the analytics dashboard
2. Review customer segments
3. Identify VIP customers
4. Monitor product performance
5. Track churn predictions

## Testing Checklist

- [ ] Database migration completed successfully
- [ ] Environment variables configured
- [ ] Backend server starts without errors
- [ ] Can access `/api/notifications/vapid-key` endpoint
- [ ] Can access `/api/messaging/config` endpoint
- [ ] Can access `/api/analytics/dashboard` endpoint
- [ ] Can access `/api/tracking/:orderId` endpoint
- [ ] Frontend pages load without errors
- [ ] Can send test notification (if configured)
- [ ] Can send test message (if configured)
- [ ] Analytics dashboard displays data

## Support

For issues or questions:
1. Check the [ADVANCED_FEATURES.md](./ADVANCED_FEATURES.md) documentation
2. Review API endpoint responses for error details
3. Check backend server logs
4. Verify environment configuration

## Feature Flags

You can enable/disable features individually:

```env
# Disable all messaging features
TWILIO_ENABLED=false
WHATSAPP_BUSINESS_ENABLED=false

# Disable all push notifications
FCM_ENABLED=false
WEB_PUSH_ENABLED=false
```

The system will gracefully handle disabled features and show appropriate messages to users.

---

**Congratulations!** 🎉

You now have access to world-class engagement and operational excellence features including:
- ✅ Push notifications
- ✅ SMS and WhatsApp messaging
- ✅ Real-time delivery tracking
- ✅ Business intelligence dashboard

Start exploring these features to improve customer engagement and operational efficiency!
