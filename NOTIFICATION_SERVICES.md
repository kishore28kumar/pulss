# Notification Services Documentation

## Overview

The notification services in this application provide a comprehensive system for sending notifications across multiple channels including FCM (Firebase Cloud Messaging), Web Push, Email, SMS, and Webhooks. The system includes robust error handling, configuration validation, retry logic, and automated processing of pending notifications.

## Table of Contents

- [Services Overview](#services-overview)
- [Configuration](#configuration)
- [Service Details](#service-details)
- [Usage Examples](#usage-examples)
- [Scheduler](#scheduler)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## Services Overview

### NotificationService

Basic push notification service supporting FCM and Web Push.

**Location**: `backend/services/notificationService.js`

**Features**:
- FCM push notifications
- Web Push notifications  
- Retry logic with exponential backoff
- Configuration validation
- Input validation

### AdvancedNotificationService

Multi-channel notification service with support for Email, SMS, Push, and Webhook notifications.

**Location**: `backend/services/advancedNotificationService.js`

**Features**:
- Multiple providers per channel (e.g., SendGrid, SES, SMTP for email)
- Channel-specific configuration validation
- Notification logging
- Flexible routing

### BillingNotificationService

Specialized service for billing-related email notifications.

**Location**: `backend/services/billingNotificationService.js`

**Features**:
- Integration with emailService
- Queue management for pending notifications
- Automated retry for failed notifications
- Invoice, payment, and subscription notifications

### NotificationScheduler

Automated scheduler for processing pending notifications.

**Location**: `backend/services/notificationScheduler.js`

**Features**:
- Cron-based scheduling (every 5 minutes)
- Manual trigger capability
- Status monitoring

### Configuration Validator

Utility for validating notification service configurations at startup.

**Location**: `backend/utils/configValidator.js`

**Features**:
- Validates all notification service configurations
- Provides clear error messages and suggestions
- Distinguishes between errors and warnings

## Configuration

### Environment Variables

#### FCM Configuration
```bash
FCM_ENABLED=true
FCM_SERVER_KEY=your_fcm_server_key
```

#### Web Push Configuration
```bash
WEB_PUSH_ENABLED=true
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
```

#### Email Configuration

**SMTP:**
```bash
EMAIL_NOTIFICATIONS_ENABLED=true
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_password
```

**SendGrid:**
```bash
EMAIL_NOTIFICATIONS_ENABLED=true
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

**AWS SES:**
```bash
EMAIL_NOTIFICATIONS_ENABLED=true
EMAIL_PROVIDER=ses
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

#### SMS Configuration

**Twilio:**
```bash
SMS_NOTIFICATIONS_ENABLED=true
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

**MSG91 (Indian provider):**
```bash
SMS_NOTIFICATIONS_ENABLED=true
SMS_PROVIDER=msg91
MSG91_AUTH_KEY=your_auth_key
MSG91_SENDER_ID=your_sender_id
```

#### Push Notifications
```bash
PUSH_NOTIFICATIONS_ENABLED=true
PUSH_PROVIDER=fcm
FCM_SERVER_KEY=your_fcm_server_key
```

#### Webhook Configuration
```bash
WEBHOOK_NOTIFICATIONS_ENABLED=true
WEBHOOK_RETRY_ATTEMPTS=3
WEBHOOK_TIMEOUT=10000
```

#### Retry Configuration
```bash
NOTIFICATION_MAX_RETRIES=3
NOTIFICATION_RETRY_DELAY=1000
```

### Configuration Validation

To validate your configuration at startup, use the configValidator:

```javascript
const configValidator = require('./utils/configValidator');

// Validate all configurations
const result = configValidator.validateAll();

if (!result.valid) {
  console.error('Configuration errors detected!');
  configValidator.printResults();
  process.exit(1);
}

// Print warnings even if valid
if (result.warnings.length > 0) {
  configValidator.printResults();
}
```

## Service Details

### NotificationService

#### Send FCM Notification

```javascript
const notificationService = require('./services/notificationService');

const result = await notificationService.sendFCMNotification(
  'device-token',
  {
    title: 'Order Update',
    message: 'Your order has been shipped!',
    icon: '/icon.png',
    badge: '/badge.png',
    data: { orderId: '12345' },
    priority: 'high'
  }
);

if (result.success) {
  console.log('Notification sent:', result.result);
} else {
  console.error('Error:', result.error, result.suggestion);
}
```

#### Send Web Push Notification

```javascript
const result = await notificationService.sendWebPushNotification(
  {
    endpoint: 'https://fcm.googleapis.com/...',
    keys: { /* subscription keys */ }
  },
  {
    title: 'New Message',
    message: 'You have a new message',
    data: { messageId: '67890' }
  }
);
```

#### Send Order Update

```javascript
await notificationService.sendOrderUpdateNotification(
  'order-123',      // orderId
  'confirmed',      // status
  'customer-456',   // customerId
  'tenant-789'      // tenantId
);
```

### AdvancedNotificationService

#### Send Email Notification

```javascript
const advancedNotificationService = require('./services/advancedNotificationService');

const result = await advancedNotificationService.sendNotification({
  channel: 'email',
  recipient: 'user@example.com',
  subject: 'Welcome!',
  message: 'Welcome to our platform',
  data: { userId: '123' }
});
```

#### Send SMS Notification

```javascript
const result = await advancedNotificationService.sendNotification({
  channel: 'sms',
  recipient: '+1234567890',
  message: 'Your verification code is: 123456'
});
```

#### Send Webhook Notification

```javascript
const result = await advancedNotificationService.sendNotification({
  channel: 'webhook',
  recipient: 'https://api.example.com/webhook',
  subject: 'Order Placed',
  message: 'A new order has been placed',
  data: { orderId: '12345', total: 99.99 }
});
```

### BillingNotificationService

#### Send Invoice Created Notification

```javascript
const billingNotificationService = require('./services/billingNotificationService');

const result = await billingNotificationService.sendInvoiceCreated(invoiceId);

if (result.success) {
  console.log('Invoice notification sent:', result.messageId);
} else {
  console.error('Failed to send:', result.error, result.suggestion);
}
```

#### Send Payment Success Notification

```javascript
await billingNotificationService.sendPaymentSuccess(transactionId);
```

#### Process Pending Notifications

```javascript
// Manually process up to 50 pending notifications
const result = await billingNotificationService.processPendingNotifications(50);

console.log(`Processed: ${result.processed}, Failed: ${result.failed}`);
if (result.details.failed.length > 0) {
  console.log('Failed notifications:', result.details.failed);
}
```

## Scheduler

### Starting the Scheduler

Add to your server startup:

```javascript
const notificationScheduler = require('./services/notificationScheduler');

// Start the scheduler
notificationScheduler.start();

// Graceful shutdown
process.on('SIGTERM', () => {
  notificationScheduler.stop();
  process.exit(0);
});
```

### Manual Trigger

```javascript
// Manually trigger pending notification processing
const result = await notificationScheduler.triggerBillingNotifications(100);
console.log(`Processed ${result.processed} notifications`);
```

### Check Scheduler Status

```javascript
const status = notificationScheduler.getStatus();
console.log('Scheduler running:', status.running);
console.log('Jobs:', status.jobs);
```

## Testing

### Running Tests

```bash
# Run all notification service tests
npm test -- __tests__/utils/configValidator.test.js __tests__/services/notificationService.test.js __tests__/services/billingNotificationService.test.js __tests__/services/advancedNotificationService.test.js

# Run with coverage
npm test
```

### Test Structure

- **configValidator.test.js**: 17 tests validating configuration validation logic
- **notificationService.test.js**: 17 tests for FCM and Web Push functionality
- **billingNotificationService.test.js**: 11 tests for billing notification flows
- **advancedNotificationService.test.js**: 20 tests for multi-channel notifications

### Mocking in Tests

Example of mocking emailService:

```javascript
jest.mock('./services/emailService', () => ({
  sendEmail: jest.fn().mockResolvedValue({
    success: true,
    messageId: 'test-id'
  })
}));
```

## Troubleshooting

### Common Issues

#### 1. FCM notifications not sending

**Error**: "FCM is not enabled" or "FCM_SERVER_KEY is not configured"

**Solution**:
1. Verify FCM_ENABLED is set to 'true'
2. Ensure FCM_SERVER_KEY is set and valid
3. Run configuration validator to check for issues

```javascript
const configValidator = require('./utils/configValidator');
const result = configValidator.validateFCMConfig();
if (!result.valid) {
  console.error(result.reason, result.suggestion);
}
```

#### 2. Email notifications failing

**Error**: "SMTP connection failed"

**Solution**:
1. Check SMTP credentials are correct
2. Verify SMTP server allows connections from your IP
3. For Gmail, enable "Less secure app access" or use App Password
4. Check firewall settings

```bash
# Test SMTP connection
telnet smtp.gmail.com 587
```

#### 3. Scheduler not processing notifications

**Issue**: Pending notifications not being sent

**Solution**:
1. Verify scheduler is started: `notificationScheduler.start()`
2. Check scheduler status: `notificationScheduler.getStatus()`
3. Manually trigger to test: `notificationScheduler.triggerBillingNotifications()`
4. Check logs for errors in processPendingNotifications

#### 4. Database connection errors

**Error**: "Cannot read properties of undefined (reading 'rows')"

**Solution**:
1. Ensure database is running and accessible
2. Verify DATABASE_URL or DB_* environment variables
3. Check required tables exist (run migrations)

```bash
# Run migrations
npm run migrate
```

#### 5. Configuration validation failures

**Error**: "Missing configuration for email.smtp: secure"

**Solution**:
1. Ensure all required env variables are set
2. Check for typos in variable names
3. For boolean values, use 'true' or 'false' strings
4. Run validator before starting services

```javascript
const result = configValidator.validateAll();
if (!result.valid) {
  configValidator.printResults();
}
```

### Debugging Tips

1. **Enable Debug Logging**: Set log level to debug to see detailed information
2. **Check Error Suggestions**: All error responses include a `suggestion` field with actionable advice
3. **Test Components Individually**: Use manual triggers to test each service separately
4. **Review Test Coverage**: Run tests to identify which components are failing

### Getting Help

If you continue to experience issues:

1. Check the error logs for detailed error messages
2. Verify all environment variables are set correctly
3. Run the configuration validator
4. Check network connectivity for external services
5. Review the test suite for examples of correct usage

## Best Practices

1. **Always validate configuration at startup** using configValidator
2. **Handle errors gracefully** - all services return error objects with suggestions
3. **Use the scheduler** for billing notifications instead of immediate sending
4. **Monitor failed notifications** using the processPendingNotifications details
5. **Test with mock services** before deploying to production
6. **Set up proper retry limits** to avoid overwhelming external services
7. **Log notification attempts** for debugging and compliance
8. **Keep sensitive credentials secure** - never commit .env files

## Security Considerations

1. **API Keys**: Store all API keys in environment variables, never in code
2. **HTTPS**: Always use HTTPS for webhook endpoints
3. **Rate Limiting**: Implement rate limiting for notification endpoints
4. **Validation**: Validate all inputs before sending notifications
5. **Audit Logging**: Log all notification attempts for security auditing
6. **Access Control**: Restrict who can send notifications using proper authentication

## Performance Optimization

1. **Batch Processing**: Use scheduler to batch process pending notifications
2. **Connection Pooling**: Database connections are pooled automatically
3. **Retry Strategy**: Exponential backoff prevents overwhelming external services
4. **Async Processing**: All notification sending is asynchronous
5. **Caching**: Consider caching frequently accessed configuration

## Future Enhancements

Planned improvements:

1. Support for additional SMS providers (Gupshup, Textlocal)
2. Template management system for notifications
3. A/B testing for notification content
4. Analytics dashboard for notification metrics
5. Priority queue for critical notifications
6. Support for notification preferences per user

## Support

For additional support or questions:
- Check existing tests for usage examples
- Review error messages and suggestions
- Consult API documentation
- Contact the development team
