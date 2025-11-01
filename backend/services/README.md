# Backend Services

This directory contains service modules that provide reusable business logic for the Pulss platform.

## Available Services

### 📧 Email Service (`emailService.js`)

A robust email service abstraction that supports multiple email providers with seamless switching via environment variables.

**Features:**

- Multi-provider support (Nodemailer SMTP, SendGrid API)
- Professional HTML email templates
- Secure password reset functionality
- Welcome and invitation emails
- Easy provider switching via environment variables
- Extensible architecture for adding new providers

**Quick Start:**

```javascript
const emailService = require('./services/emailService');

// Send a custom email
await emailService.sendEmail({
  to: 'user@example.com',
  subject: 'Hello!',
  text: 'Plain text content',
  html: '<h1>HTML content</h1>',
});

// Send a password reset email
await emailService.sendPasswordResetEmail(
  'user@example.com',
  'reset-token',
  'https://app.pulss.com/reset-password?token=...'
);

// Send a welcome email
await emailService.sendWelcomeEmail('user@example.com', 'John Doe');

// Send an invitation email
await emailService.sendInviteEmail(
  'user@example.com',
  'Jane Admin',
  'https://app.pulss.com/invite?token=...'
);
```

**Configuration:**

Set environment variables in `.env`:

```env
# Choose provider
EMAIL_PROVIDER=nodemailer  # or 'sendgrid'
EMAIL_FROM=noreply@pulss.app

# For Nodemailer (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# For SendGrid
SENDGRID_API_KEY=SG.your_api_key_here
```

**See Also:**

- [EMAIL_PROVIDERS_GUIDE.md](./EMAIL_PROVIDERS_GUIDE.md) - Comprehensive guide for extending email providers

---

### 📊 Analytics Service (`analyticsService.js`)

Provides comprehensive analytics tracking and reporting for tenant-specific data.

**Features:**

- Revenue tracking
- Order analytics
- Customer insights
- Product performance metrics

---

### 🔔 Notification Service (`notificationService.js`)

Handles push notifications via FCM and Web Push API.

**Features:**

- Firebase Cloud Messaging (FCM)
- Web Push notifications
- Device token management
- Custom notification payloads

---

### 💬 Messaging Service (`messagingService.js`)

Manages SMS and WhatsApp notifications via Twilio and WhatsApp Business API.

**Features:**

- SMS notifications
- WhatsApp messaging
- Template management
- Delivery tracking

---

### 🔗 n8n Service (`n8nService.js`)

Integration with n8n workflow automation platform.

**Features:**

- Webhook triggers
- Workflow automation
- Event-driven integrations
- Custom workflow support

---

### 📈 Super Admin Analytics (`superAdminAnalyticsService.js`)

Platform-wide analytics for super administrators.

**Features:**

- Multi-tenant analytics
- Platform performance metrics
- Revenue aggregation
- User statistics

---

### 📦 Tracking Service (`trackingService.js`)

Order and shipment tracking functionality.

**Features:**

- Real-time order status updates
- Shipment tracking
- Delivery notifications
- Status history

---

## Service Architecture

All services follow a consistent architecture:

1. **Singleton Pattern**: Most services are exported as singleton instances
2. **Environment Configuration**: Configuration via environment variables
3. **Error Handling**: Comprehensive error handling with logging
4. **Async/Await**: Modern async patterns throughout
5. **Provider Abstraction**: Where applicable, services support multiple providers

## Adding New Services

When adding a new service:

1. Create a new file in this directory (e.g., `myService.js`)
2. Follow the existing service patterns:

   ```javascript
   class MyService {
     constructor() {
       // Initialize with environment variables
       this.enabled = process.env.MY_SERVICE_ENABLED === 'true';
     }

     async myMethod(params) {
       try {
         // Implementation
         return { success: true, data: result };
       } catch (error) {
         console.error('MyService error:', error);
         return { success: false, error: error.message };
       }
     }
   }

   module.exports = new MyService();
   ```

3. Add configuration to `.env.example`
4. Document the service in this README
5. Add tests for the new service

## Testing Services

Services can be tested in isolation:

```javascript
// Example test
const myService = require('./services/myService');

async function test() {
  const result = await myService.myMethod(testParams);
  console.assert(result.success, 'Service call should succeed');
}

test();
```

## Best Practices

1. **Always use try-catch**: Wrap service calls in try-catch blocks
2. **Return consistent objects**: Use `{ success: boolean, data?, error? }` pattern
3. **Log errors**: Use `console.error()` for error logging
4. **Validate inputs**: Check parameters before processing
5. **Use environment variables**: Never hardcode credentials or configuration
6. **Handle failures gracefully**: Return meaningful error messages
7. **Document public methods**: Add JSDoc comments for all public methods

## Environment Variables

Each service may require specific environment variables. Check individual service files or `.env.example` for complete configuration options.

Common patterns:

- `SERVICE_NAME_ENABLED=true|false` - Enable/disable the service
- `SERVICE_NAME_API_KEY=...` - API credentials
- `SERVICE_NAME_URL=...` - Service endpoints
- `SERVICE_NAME_TIMEOUT=5000` - Request timeouts

## Security Considerations

- **Never commit secrets**: Use environment variables for all credentials
- **Validate inputs**: Sanitize and validate all user inputs
- **Rate limiting**: Implement rate limiting for external service calls
- **Error messages**: Don't expose sensitive information in error messages
- **Logging**: Be careful not to log sensitive data

## Support

For questions or issues with services:

1. Check the service-specific documentation
2. Review the `.env.example` file for configuration
3. Check logs for error messages
4. Open an issue on GitHub

---

**Last Updated**: 2025-10-20
