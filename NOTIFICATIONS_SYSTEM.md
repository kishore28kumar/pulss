# Advanced Notifications and Communication System

## Overview

The Pulss platform includes a comprehensive, enterprise-grade notification system with multi-channel support, templates, analytics, and granular super admin controls. This system enables automated and manual notifications across email, SMS, push, webhooks, and in-app channels.

## Features

### 1. Multi-Channel Support

- **Email**: SendGrid, AWS SES, SMTP, MSG91 (Indian provider)
- **SMS**: Twilio, Gupshup, Textlocal, MSG91 (Indian providers)
- **Push Notifications**: Firebase Cloud Messaging (FCM), Apple Push Notification Service (APNs)
- **Webhooks**: Custom HTTP webhooks for integration with external systems
- **In-App**: Real-time in-app notifications via WebSocket/polling

### 2. Notification Templates

- Template management with multi-channel content
- Per-tenant branding and customization
- Multi-language support with localization
- Variable substitution for dynamic content
- Default system templates for common scenarios

### 3. Super Admin Controls

- Global notification enable/disable toggles
- Per-tenant channel and notification type controls
- Rate limiting and daily quotas per tenant
- Provider configuration and failover management
- Platform-wide monitoring and analytics

### 4. User Preferences

- Channel-level opt-in/opt-out
- Notification type preferences (transactional, marketing, promotional)
- Quiet hours configuration
- Language preference
- Granular event-level controls

### 5. Analytics and Tracking

- Delivery rates, open rates, click-through rates
- Engagement metrics per channel and tenant
- Failure tracking and retry statistics
- Export capabilities for reporting
- Real-time delivery logs

### 6. Delivery Management

- Automatic retry with exponential backoff
- Failure tracking and detailed error logs
- Queue-based processing for scalability
- Priority-based delivery
- Scheduled notifications

## Architecture

### Database Schema

The notifications system uses the following tables:

1. **notification_templates** - Store notification templates with multi-channel content
2. **notifications_enhanced** - Main notifications table with comprehensive tracking
3. **tenant_notification_settings** - Per-tenant configuration (super admin controlled)
4. **user_notification_preferences** - User-level preferences
5. **notification_queue** - Async processing queue
6. **notification_analytics** - Aggregated analytics data
7. **notification_event_log** - Detailed event tracking
8. **super_admin_notification_controls** - Global platform controls
9. **notification_campaigns** - Marketing campaign management

### Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Notification Request                      │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│          Advanced Notification Service                       │
│  - Check super admin controls                                │
│  - Check tenant settings                                     │
│  - Check user preferences                                    │
│  - Render template                                           │
│  - Route to appropriate channel                              │
└──────────────────────────┬──────────────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │  Email   │    │   SMS    │    │   Push   │
    │ Service  │    │ Service  │    │ Service  │
    └────┬─────┘    └────┬─────┘    └────┬─────┘
         │               │               │
         ▼               ▼               ▼
    Provider A      Provider B      Provider C
```

## API Documentation

### User Endpoints

#### Send Notification
```
POST /api/notifications-advanced/send
```

**Request Body:**
```json
{
  "recipientEmail": "user@example.com",
  "recipientPhone": "+1234567890",
  "notificationType": "transactional",
  "eventType": "order_confirmed",
  "channel": "email",
  "templateKey": "order_confirmed",
  "variables": {
    "customer_name": "John Doe",
    "order_id": "ORD-12345",
    "order_total": "$99.99"
  },
  "priority": "high",
  "metadata": {
    "campaign_id": "summer_sale"
  },
  "scheduledFor": "2024-01-15T10:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "notificationId": "uuid",
    "status": "sent"
  }
}
```

#### Get User Notifications
```
GET /api/notifications-advanced?page=1&limit=20&channel=email&unreadOnly=true
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "notification_id": "uuid",
      "notification_type": "transactional",
      "channel": "email",
      "title": "Order Confirmed",
      "message": "Your order has been confirmed",
      "read": false,
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "pages": 3
  }
}
```

#### Get/Update User Preferences
```
GET /api/notifications-advanced/preferences
PUT /api/notifications-advanced/preferences
```

**Request Body (PUT):**
```json
{
  "email_enabled": true,
  "sms_enabled": false,
  "push_enabled": true,
  "transactional_enabled": true,
  "marketing_enabled": false,
  "promotional_enabled": false,
  "order_updates": true,
  "payment_updates": true,
  "quiet_hours_enabled": true,
  "quiet_hours_start": "22:00",
  "quiet_hours_end": "08:00",
  "preferred_language": "en"
}
```

### Template Management

#### Get Templates
```
GET /api/notifications-advanced/templates?category=transactional&language=en
```

#### Create Template
```
POST /api/notifications-advanced/templates
```

**Request Body:**
```json
{
  "templateKey": "order_shipped",
  "templateName": "Order Shipped Notification",
  "description": "Sent when order is shipped",
  "emailSubject": "Your order {{order_id}} has shipped!",
  "emailBody": "Hi {{customer_name}}, your order is on its way...",
  "smsContent": "Order {{order_id}} shipped! Track: {{tracking_url}}",
  "pushTitle": "Order Shipped",
  "pushBody": "Your order {{order_id}} is on its way!",
  "category": "transactional",
  "language": "en",
  "variables": {
    "customer_name": "string",
    "order_id": "string",
    "tracking_url": "string"
  },
  "branding": {
    "logo_url": "https://example.com/logo.png",
    "primary_color": "#2563EB"
  }
}
```

### Super Admin Endpoints

#### Get Global Controls
```
GET /api/super-admin/notifications/controls
```

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications_enabled": true,
    "email_enabled": true,
    "sms_enabled": true,
    "push_enabled": true,
    "webhook_enabled": true,
    "global_email_daily_limit": 100000,
    "global_sms_daily_limit": 50000,
    "global_push_daily_limit": 500000,
    "alert_on_high_failure_rate": true,
    "failure_rate_threshold": 10.00,
    "email_provider_primary": "sendgrid",
    "email_provider_fallback": "ses"
  }
}
```

#### Update Global Controls
```
PUT /api/super-admin/notifications/controls
```

#### Get/Update Tenant Settings
```
GET /api/super-admin/notifications/tenant-settings/:tenantId
PUT /api/super-admin/notifications/tenant-settings/:tenantId
```

**Request Body (PUT):**
```json
{
  "email_enabled": true,
  "sms_enabled": true,
  "push_enabled": false,
  "transactional_enabled": true,
  "marketing_enabled": false,
  "email_provider": "sendgrid",
  "email_daily_limit": 1000,
  "sms_daily_limit": 500,
  "default_sender_name": "MyStore",
  "default_sender_email": "noreply@mystore.com",
  "track_opens": true,
  "track_clicks": true
}
```

#### Toggle Tenant Channel
```
POST /api/super-admin/notifications/tenant-settings/:tenantId/toggle
```

**Request Body:**
```json
{
  "channel": "email",
  "enabled": false
}
```

#### Get Platform Analytics
```
GET /api/super-admin/notifications/analytics?startDate=2024-01-01&endDate=2024-01-31
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overall": {
      "total_notifications": 50000,
      "delivered": 48500,
      "failed": 1500,
      "delivery_rate": 97.0,
      "open_rate": 42.5,
      "click_rate": 15.3
    },
    "byChannel": [
      {
        "channel": "email",
        "total": 30000,
        "delivered": 29100,
        "delivery_rate": 97.0
      }
    ],
    "byTenant": [
      {
        "tenant_id": "uuid",
        "tenant_name": "Store A",
        "total_notifications": 5000
      }
    ]
  }
}
```

## Configuration

### Environment Variables

See `.env.example` for all available configuration options:

```bash
# Email Configuration
EMAIL_NOTIFICATIONS_ENABLED=true
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# SMS Configuration
SMS_NOTIFICATIONS_ENABLED=true
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890

# Push Configuration
PUSH_NOTIFICATIONS_ENABLED=true
PUSH_PROVIDER=fcm
FCM_SERVER_KEY=your_fcm_key

# Webhook Configuration
WEBHOOK_NOTIFICATIONS_ENABLED=true
WEBHOOK_RETRY_ATTEMPTS=3
WEBHOOK_TIMEOUT=10000
```

## Usage Examples

### Sending an Order Confirmation

```javascript
const advancedNotificationService = require('./services/advancedNotificationService');

await advancedNotificationService.sendNotification({
  tenantId: 'tenant-uuid',
  customerId: 'customer-uuid',
  recipientEmail: 'customer@example.com',
  notificationType: 'transactional',
  eventType: 'order_confirmed',
  channel: 'email',
  templateKey: 'order_confirmed',
  variables: {
    customer_name: 'John Doe',
    order_id: 'ORD-12345',
    order_total: '$99.99',
    tracking_url: 'https://track.example.com/12345'
  },
  priority: 'high'
});
```

### Sending Multi-Channel Notification

```javascript
// Send email
await advancedNotificationService.sendNotification({
  tenantId,
  customerId,
  recipientEmail: 'customer@example.com',
  channel: 'email',
  templateKey: 'order_shipped',
  variables: { order_id: 'ORD-12345' }
});

// Send SMS
await advancedNotificationService.sendNotification({
  tenantId,
  customerId,
  recipientPhone: '+1234567890',
  channel: 'sms',
  templateKey: 'order_shipped',
  variables: { order_id: 'ORD-12345' }
});

// Send Push
await advancedNotificationService.sendNotification({
  tenantId,
  customerId,
  channel: 'push',
  templateKey: 'order_shipped',
  variables: { order_id: 'ORD-12345' }
});
```

### Scheduling a Notification

```javascript
await advancedNotificationService.sendNotification({
  tenantId,
  customerId,
  recipientEmail: 'customer@example.com',
  channel: 'email',
  templateKey: 'promotional_offer',
  variables: { offer_details: '50% off' },
  priority: 'medium',
  scheduledFor: '2024-12-25T10:00:00Z' // Christmas Day morning
});
```

## Best Practices

### 1. Use Templates

Always use templates for consistent branding and easier management. Create tenant-specific templates for customization.

### 2. Respect User Preferences

The system automatically checks user preferences. Ensure users can easily manage their notification settings.

### 3. Choose Appropriate Channels

- **Email**: Detailed information, receipts, reports
- **SMS**: Urgent updates, delivery notifications, OTPs
- **Push**: Real-time updates, time-sensitive alerts
- **Webhook**: System integrations, external workflows

### 4. Set Proper Priority

- **Urgent**: Payment failures, security alerts
- **High**: Order updates, delivery notifications
- **Medium**: Marketing messages, newsletters
- **Low**: General updates, tips

### 5. Monitor and Optimize

- Review analytics regularly
- Adjust sending times based on engagement
- Test templates across channels
- Monitor delivery rates and failures

## Super Admin Guide

### Enabling/Disabling Notifications

Super admins can control notifications at three levels:

1. **Global Level**: Enable/disable entire notification system
2. **Channel Level**: Enable/disable specific channels (email, SMS, push)
3. **Tenant Level**: Control notifications per tenant

### Managing Tenant Quotas

Set daily limits per tenant to prevent abuse:

```json
{
  "email_daily_limit": 1000,
  "sms_daily_limit": 500,
  "push_daily_limit": 5000
}
```

### Provider Configuration

Configure primary and fallback providers for reliability:

```json
{
  "email_provider_primary": "sendgrid",
  "email_provider_fallback": "ses",
  "sms_provider_primary": "twilio",
  "sms_provider_fallback": "msg91"
}
```

### Monitoring and Alerts

Set up alerts for high failure rates:

```json
{
  "alert_on_high_failure_rate": true,
  "failure_rate_threshold": 10.00,
  "alert_email": "admin@yourplatform.com"
}
```

## Troubleshooting

### Notifications Not Sending

1. Check global controls are enabled
2. Verify tenant settings allow the channel
3. Check user preferences
4. Review provider configuration
5. Check delivery logs for errors

### High Failure Rates

1. Review delivery logs for error patterns
2. Verify provider credentials
3. Check rate limits
4. Review recipient data quality
5. Consider switching to fallback provider

### Template Issues

1. Verify template exists and is active
2. Check variable names match
3. Ensure tenant-specific template overrides default
4. Test template rendering with sample data

## Extension and Customization

### Adding New Providers

To add a new email/SMS/push provider:

1. Add provider configuration in `advancedNotificationService.js`
2. Implement provider-specific sending methods
3. Update environment variables
4. Add provider to super admin controls

### Custom Notification Types

Add new notification types in:

1. Database: Update `notification_type` enum
2. Templates: Create templates for new type
3. Preferences: Add user preference controls
4. Documentation: Update API docs

### Webhook Integration

Configure webhooks for custom integrations:

1. Set webhook URL in tenant settings
2. Configure webhook secret for signature verification
3. Select events to trigger webhooks
4. Handle webhook responses in external system

## Security Considerations

1. **Provider Credentials**: Store securely, never expose in client
2. **Personal Data**: Encrypt recipient information
3. **Rate Limiting**: Prevent abuse with quotas
4. **Webhook Signatures**: Verify webhook authenticity
5. **Audit Logging**: Track all notification events

## Performance Optimization

1. **Queue Processing**: Use background workers for async processing
2. **Batch Operations**: Send bulk notifications efficiently
3. **Caching**: Cache templates and settings
4. **Database Indexing**: Optimize queries with proper indexes
5. **Provider Selection**: Choose providers based on volume and cost

## Compliance

The notification system supports:

- **GDPR**: User consent and data export
- **CAN-SPAM**: Unsubscribe links in emails
- **TCPA**: SMS opt-in requirements
- **Data Protection**: Encryption and secure storage

## Support

For issues or questions:

1. Check this documentation
2. Review delivery logs in super admin panel
3. Test with sample notifications
4. Contact platform support

---

**Version**: 1.0.0  
**Last Updated**: 2024-01-15  
**Maintained By**: Pulss Platform Team
