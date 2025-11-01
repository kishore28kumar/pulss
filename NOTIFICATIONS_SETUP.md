# Advanced Notifications System - Setup Guide

Quick start guide for setting up and using the advanced notifications system.

## Prerequisites

- Node.js 18+
- PostgreSQL (or SQLite for development)
- Access to notification providers (optional for testing)

## Installation Steps

### 1. Database Setup

Run the notification system migration:

```bash
# For PostgreSQL
psql $DATABASE_URL -f backend/migrations/11_advanced_notifications_system.sql

# Or for local PostgreSQL
psql -h localhost -U postgres -d pulssdb -f backend/migrations/11_advanced_notifications_system.sql
```

This will create all necessary tables:
- `notification_templates` - Template storage
- `notifications_enhanced` - Main notifications table
- `tenant_notification_settings` - Per-tenant settings
- `user_notification_preferences` - User preferences
- `notification_queue` - Processing queue
- `notification_analytics` - Analytics data
- `notification_event_log` - Event tracking
- `super_admin_notification_controls` - Global controls
- `notification_campaigns` - Marketing campaigns

### 2. Environment Configuration

Copy and update the environment variables in your `.env` file:

```bash
# Copy example configuration
cp backend/.env.example backend/.env

# Edit the .env file with your credentials
nano backend/.env
```

#### Email Configuration

Choose one email provider:

**Option 1: SendGrid (Recommended for production)**
```env
EMAIL_NOTIFICATIONS_ENABLED=true
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

**Option 2: AWS SES**
```env
EMAIL_NOTIFICATIONS_ENABLED=true
EMAIL_PROVIDER=ses
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
```

**Option 3: SMTP (Gmail, etc.)**
```env
EMAIL_NOTIFICATIONS_ENABLED=true
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_specific_password
```

**Option 4: MSG91 (Indian provider)**
```env
EMAIL_NOTIFICATIONS_ENABLED=true
EMAIL_PROVIDER=msg91
MSG91_AUTH_KEY=your_msg91_auth_key
MSG91_SENDER_ID=your_sender_id
```

#### SMS Configuration

Choose one SMS provider:

**Option 1: Twilio (Recommended)**
```env
SMS_NOTIFICATIONS_ENABLED=true
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

**Option 2: Gupshup (Indian provider)**
```env
SMS_NOTIFICATIONS_ENABLED=true
SMS_PROVIDER=gupshup
GUPSHUP_API_KEY=your_gupshup_api_key
GUPSHUP_USER_ID=your_gupshup_user_id
```

**Option 3: Textlocal (Indian provider)**
```env
SMS_NOTIFICATIONS_ENABLED=true
SMS_PROVIDER=textlocal
TEXTLOCAL_API_KEY=your_textlocal_api_key
TEXTLOCAL_SENDER=TXTLCL
```

**Option 4: MSG91 SMS (Indian provider)**
```env
SMS_NOTIFICATIONS_ENABLED=true
SMS_PROVIDER=msg91
MSG91_AUTH_KEY=your_msg91_auth_key
MSG91_SENDER_ID=your_sender_id
```

#### Push Notifications

**Firebase Cloud Messaging (FCM)**
```env
PUSH_NOTIFICATIONS_ENABLED=true
PUSH_PROVIDER=fcm
FCM_SERVER_KEY=your_fcm_server_key
```

**Apple Push Notification Service (APNs)**
```env
PUSH_NOTIFICATIONS_ENABLED=true
PUSH_PROVIDER=apns
APNS_KEY_ID=your_apns_key_id
APNS_TEAM_ID=your_apns_team_id
APNS_BUNDLE_ID=com.yourapp.bundle
```

#### Webhooks

```env
WEBHOOK_NOTIFICATIONS_ENABLED=true
WEBHOOK_RETRY_ATTEMPTS=3
WEBHOOK_TIMEOUT=10000
```

### 3. Start the Server

```bash
cd backend
npm install  # If not already done
npm start
```

The server will start with the new notification routes available.

### 4. Verify Installation

Run the test script to verify everything is set up correctly:

```bash
cd backend
node test-notifications.js
```

Expected output:
```
🔔 Testing Advanced Notifications System

1. File Structure Test
   ✓ services/advancedNotificationService.js
   ✓ controllers/advancedNotificationsController.js
   ...

2. Template Rendering Test
   ✓ Template variable substitution working

...

✅ All basic tests passed!
```

## Quick Start Examples

### Sending Your First Notification

#### 1. Get Authentication Token

First, log in to get a JWT token:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your_password"
  }'
```

#### 2. Send an Email Notification

```bash
curl -X POST http://localhost:3000/api/notifications-advanced/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "recipientEmail": "customer@example.com",
    "notificationType": "transactional",
    "eventType": "order_confirmed",
    "channel": "email",
    "templateKey": "order_confirmed",
    "variables": {
      "customer_name": "John Doe",
      "order_id": "ORD-12345",
      "order_total": "$99.99"
    },
    "priority": "high"
  }'
```

#### 3. Send an SMS Notification

```bash
curl -X POST http://localhost:3000/api/notifications-advanced/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "recipientPhone": "+1234567890",
    "notificationType": "transactional",
    "eventType": "order_confirmed",
    "channel": "sms",
    "templateKey": "order_confirmed",
    "variables": {
      "order_id": "ORD-12345",
      "order_total": "$99.99"
    },
    "priority": "high"
  }'
```

#### 4. Get User Notifications

```bash
curl -X GET "http://localhost:3000/api/notifications-advanced?page=1&limit=20&unreadOnly=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 5. Get Notification Templates

```bash
curl -X GET "http://localhost:3000/api/notifications-advanced/templates" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Super Admin Operations

#### 1. Get Global Controls

```bash
curl -X GET http://localhost:3000/api/super-admin/notifications/controls \
  -H "Authorization: Bearer SUPER_ADMIN_JWT_TOKEN"
```

#### 2. Disable Email for a Tenant

```bash
curl -X POST http://localhost:3000/api/super-admin/notifications/tenant-settings/TENANT_ID/toggle \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SUPER_ADMIN_JWT_TOKEN" \
  -d '{
    "channel": "email",
    "enabled": false
  }'
```

#### 3. View Platform Analytics

```bash
curl -X GET "http://localhost:3000/api/super-admin/notifications/analytics?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer SUPER_ADMIN_JWT_TOKEN"
```

## Testing Without Providers

For development and testing, you can enable notifications without actual provider credentials. The system will log attempts but won't send actual notifications:

```env
# Disable actual sending
EMAIL_NOTIFICATIONS_ENABLED=false
SMS_NOTIFICATIONS_ENABLED=false
PUSH_NOTIFICATIONS_ENABLED=false

# Or set to mock mode (notifications will be logged only)
EMAIL_PROVIDER=smtp
SMTP_HOST=localhost
```

The notification system will:
- Create records in the database
- Generate mock provider responses
- Log all activity
- Return success responses

This is useful for:
- Local development
- Testing templates
- Verifying notification flow
- Building UI components

## Common Issues and Solutions

### Issue: "Template not found"

**Solution:** Ensure the migration was run successfully. Check if default templates exist:

```sql
SELECT template_key, template_name FROM notification_templates WHERE is_default = true;
```

### Issue: "Provider credentials invalid"

**Solution:** Verify your provider credentials in `.env`:
- Check API keys are correct
- Ensure no extra spaces or quotes
- Verify provider is enabled
- Test credentials directly with provider's API

### Issue: Notifications not sending

**Solution:** Check in this order:
1. Global controls: `GET /api/super-admin/notifications/controls`
2. Tenant settings: `GET /api/super-admin/notifications/tenant-settings/:tenantId`
3. User preferences: `GET /api/notifications-advanced/preferences`
4. Delivery logs: `GET /api/super-admin/notifications/delivery-logs`

### Issue: High failure rate

**Solution:**
1. Check provider status
2. Verify recipient data quality
3. Review rate limits
4. Check delivery logs for patterns
5. Consider switching providers

## Next Steps

1. **Read Full Documentation**
   - System Overview: `NOTIFICATIONS_SYSTEM.md`
   - API Reference: `NOTIFICATIONS_API.md`

2. **Customize Templates**
   - Create tenant-specific templates
   - Add your branding
   - Translate to multiple languages

3. **Set Up Webhooks**
   - Configure webhook URLs for tenants
   - Implement webhook handlers
   - Test event delivery

4. **Monitor Analytics**
   - Review delivery rates
   - Track engagement metrics
   - Optimize sending times

5. **Configure Super Admin Controls**
   - Set global rate limits
   - Configure provider failover
   - Enable monitoring alerts

## Support and Resources

- **System Documentation**: `NOTIFICATIONS_SYSTEM.md`
- **API Reference**: `NOTIFICATIONS_API.md`
- **Migration File**: `backend/migrations/11_advanced_notifications_system.sql`
- **Service Code**: `backend/services/advancedNotificationService.js`
- **Test Script**: `backend/test-notifications.js`

## Provider-Specific Setup Guides

### SendGrid

1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Create an API key with "Mail Send" permission
3. Verify your sender domain or email
4. Add to `.env`: `SENDGRID_API_KEY=your_key`

### Twilio

1. Sign up at [twilio.com](https://twilio.com)
2. Get your Account SID and Auth Token from dashboard
3. Purchase a phone number
4. Add to `.env`: Account SID, Auth Token, Phone Number

### Firebase (FCM)

1. Create project at [console.firebase.google.com](https://console.firebase.google.com)
2. Go to Project Settings > Cloud Messaging
3. Copy the Server Key
4. Add to `.env`: `FCM_SERVER_KEY=your_key`

### Indian Providers (MSG91, Gupshup, Textlocal)

1. Sign up with the provider
2. Verify your business details
3. Get API credentials from dashboard
4. Follow provider-specific documentation for DLT registration (India)

---

**Version**: 1.0.0  
**Last Updated**: 2024-01-15  
**Need Help?** Check the full documentation or create an issue.
