# Advanced Notification and Messaging System

## Overview

The Pulss platform now features a world-class notification and messaging system with comprehensive multi-channel support, tenant-specific branding, scheduling, analytics, and audit logging.

## Architecture

### Database Schema

The notification system uses 9 core tables:

1. **notification_types** - Defines available notification categories
2. **notification_templates** - Tenant-specific branded templates
3. **notifications_enhanced** - Main notifications storage
4. **admin_notification_preferences** - Admin user preferences
5. **customer_notification_preferences** - Customer user preferences
6. **notification_audit_log** - Complete audit trail
7. **notification_schedules** - Scheduled/recurring notifications
8. **notification_analytics** - Aggregated metrics
9. **email_configurations** - Tenant SMTP and branding settings

### Services

#### AdvancedNotificationService

Main service handling all notification operations:

- Multi-channel delivery (email, push, SMS, WhatsApp, in-app)
- User preference management
- Quiet hours support
- Template rendering
- Scheduling support
- Analytics tracking

#### EmailService

Handles email delivery with:

- Tenant-specific SMTP configuration
- Custom branding support
- HTML template rendering
- Pre-built templates for common scenarios
- Test account support for development

## Features

### 1. Multi-Channel Notifications

Send notifications through multiple channels:

- **Email** - HTML emails with tenant branding
- **Push** - Mobile and browser push notifications
- **SMS** - Via Twilio integration (ready to implement)
- **WhatsApp** - Via WhatsApp Business API (ready to implement)
- **In-App** - Native platform notifications

### 2. Notification Types

Pre-configured notification types across categories:

#### Transactional (Cannot opt out)
- Order placed, confirmed, preparing, ready, delivered
- Payment received/failed
- Refund processed

#### Security (Cannot opt out)
- Password reset/changed
- New device login
- Account locked

#### System (Cannot opt out)
- Admin invite
- Tenant created
- System maintenance

#### Billing (Cannot opt out for critical)
- Billing invoice
- Payment failed/success
- Subscription expiring

#### Marketing (Can opt out)
- New offers
- Discount alerts
- Back in stock
- Abandoned cart
- Loyalty points

#### Operational (Can opt out)
- Low stock alerts
- New customer registrations
- Customer feedback
- Daily/weekly reports

### 3. User Preferences

Users can customize notification preferences:

- **Per-channel control** - Enable/disable email, push, SMS, WhatsApp, in-app
- **Quiet hours** - Set time ranges to avoid non-urgent notifications
- **Digest frequency** - Immediate, hourly, daily, or weekly digests
- **Opt-out** - For marketing and operational notifications

### 4. Notification Templates

Tenant-specific branded templates:

- **Variables** - Use Handlebars-style syntax (e.g., `{{customer_name}}`)
- **Branding** - Logo, colors, header images, footer text
- **Multi-channel** - Different templates for email, SMS, push, etc.
- **Version control** - Track template changes

### 5. Scheduling

Schedule notifications for delivery:

- **One-time** - Schedule for specific date/time
- **Recurring** - Cron-like scheduling for repeated notifications
- **Trigger-based** - Send after specific events with delay
- **Segment targeting** - Send to filtered customer segments

### 6. Analytics

Track notification performance:

- **Delivery metrics** - Sent, delivered, failed counts
- **Engagement metrics** - Read rate, click rate
- **Cost tracking** - Monitor spending per channel
- **Trends** - Daily/weekly/monthly reports

### 7. Audit Logging

Complete audit trail:

- **Who sent** - Actor tracking (admin, system, customer)
- **Who received** - Recipient information
- **Delivery status** - Success/failure with error details
- **Provider info** - External service tracking
- **Metadata** - Request/response data for debugging

## API Endpoints

### Notifications

```
POST   /api/advanced-notifications/send           - Send a notification
GET    /api/advanced-notifications                - Get user's notifications
GET    /api/advanced-notifications/unread-count   - Get unread count
PUT    /api/advanced-notifications/:id/read       - Mark as read
PUT    /api/advanced-notifications/read-all       - Mark all as read
DELETE /api/advanced-notifications/:id            - Delete notification
```

### Types and Preferences

```
GET    /api/advanced-notifications/types                    - Get notification types
GET    /api/advanced-notifications/preferences              - Get user preferences
PUT    /api/advanced-notifications/preferences/:typeCode    - Update preferences
```

### Templates (Admin only)

```
GET    /api/advanced-notifications/templates       - Get tenant templates
PUT    /api/advanced-notifications/templates       - Create/update template
```

### Schedules (Admin only)

```
GET    /api/advanced-notifications/schedules       - List schedules
POST   /api/advanced-notifications/schedules       - Create schedule
PUT    /api/advanced-notifications/schedules/:id   - Update schedule
DELETE /api/advanced-notifications/schedules/:id   - Delete schedule
```

### Analytics & Audit (Admin only)

```
GET    /api/advanced-notifications/analytics       - Get analytics
GET    /api/advanced-notifications/audit-log       - Get audit log
```

## Usage Examples

### Sending a Notification

```javascript
const result = await advancedNotificationService.sendNotification({
  tenantId: 'tenant-uuid',
  typeCode: 'order_confirmed',
  recipientType: 'customer',
  recipientId: 'customer-uuid',
  title: 'Order Confirmed',
  content: 'Your order #12345 has been confirmed!',
  actionUrl: '/orders/12345',
  actionLabel: 'View Order',
  priority: 'high',
  channels: ['email', 'push', 'in_app'] // optional, uses preferences if not specified
});
```

### Creating a Template

```javascript
POST /api/advanced-notifications/templates
{
  "typeCode": "order_confirmed",
  "channel": "email",
  "subject": "Your Order is Confirmed! 🎉",
  "templateBody": "Hi {{customer_name}},\n\nYour order {{order_id}} has been confirmed...",
  "templateHtml": "<html>...</html>"
}
```

### Scheduling a Notification

```javascript
POST /api/advanced-notifications/schedules
{
  "typeCode": "weekly_report",
  "name": "Weekly Sales Report",
  "recipientType": "admin",
  "title": "Your Weekly Sales Report",
  "content": "Here's your performance summary...",
  "channel": "email",
  "scheduleType": "recurring",
  "recurrenceRule": "0 9 * * 1" // Every Monday at 9 AM
}
```

## Frontend Components

### AdvancedNotificationCenter

Bell icon with notification list:

```tsx
import { AdvancedNotificationCenter } from '@/components/AdvancedNotificationCenter';

<AdvancedNotificationCenter 
  apiUrl="/api/advanced-notifications"
  pollingInterval={30000}
  onNotificationClick={(notification) => {
    // Handle click
  }}
/>
```

Features:
- Real-time polling for new notifications
- Unread count badge
- Filter by all/unread
- Mark as read/delete actions
- Responsive design
- Animation effects

### NotificationPreferences

User preference management:

```tsx
import { NotificationPreferences } from '@/components/NotificationPreferences';

<NotificationPreferences apiUrl="/api/advanced-notifications" />
```

Features:
- Per-channel toggles
- Category-based organization
- Quiet hours configuration
- Visual feedback
- Cannot disable critical notifications

## Configuration

### Environment Variables

Add to `.env`:

```bash
# Email/SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@example.com
SMTP_PASSWORD=your_email_password
SMTP_FROM_EMAIL=noreply@pulss.app
SMTP_FROM_NAME=Pulss Platform
```

### Database Migration

Run the migration:

```bash
cd backend
psql $DATABASE_URL -f migrations/11_advanced_notification_system.sql
```

Or for local PostgreSQL:

```bash
psql -h localhost -U postgres -d pulssdb -f migrations/11_advanced_notification_system.sql
```

## Customization

### Adding New Notification Types

1. Insert into `notification_types` table:

```sql
INSERT INTO notification_types (type_code, name, description, category, can_opt_out, priority)
VALUES ('custom_event', 'Custom Event', 'Description', 'operational', true, 'medium');
```

2. Create templates (optional):

```sql
INSERT INTO notification_templates (tenant_id, type_code, channel, subject, template_body)
VALUES ('tenant-uuid', 'custom_event', 'email', 'Custom Event', '...');
```

3. Send notifications using the service:

```javascript
await advancedNotificationService.sendNotification({
  typeCode: 'custom_event',
  // ... other params
});
```

### Custom Email Templates

Templates support Handlebars-style variables:

Available variables:
- `{{customer_name}}` - Recipient name
- `{{tenant_name}}` - Store name
- `{{order_id}}` - Order ID
- `{{action_url}}` - Action URL
- `{{action_label}}` - Button text
- Custom variables via metadata

### Tenant Branding

Configure per-tenant email branding:

```sql
INSERT INTO email_configurations (
  tenant_id,
  from_email,
  from_name,
  logo_url,
  brand_color,
  footer_text,
  enable_custom_smtp
) VALUES (
  'tenant-uuid',
  'store@example.com',
  'My Store',
  'https://example.com/logo.png',
  '#3b82f6',
  'Thanks for shopping with us!',
  false
);
```

## Best Practices

### 1. Notification Priority

- **Urgent** - Critical security issues, payment failures
- **High** - Order updates, important account changes
- **Medium** - General updates, new features
- **Low** - Marketing content, tips

### 2. User Experience

- Always provide clear action labels
- Include relevant context in notifications
- Respect user preferences and quiet hours
- Don't over-notify - batch similar notifications

### 3. Testing

Test notifications in development:

```javascript
// Email service creates test accounts automatically
// Check console for preview URLs (using Ethereal email)
const result = await emailService.sendEmail({
  to: 'test@example.com',
  subject: 'Test',
  text: 'Test message',
  html: '<p>Test message</p>'
});

console.log('Preview URL:', result.previewUrl);
```

### 4. Performance

- Use scheduled notifications for bulk sends
- Implement rate limiting for external APIs
- Monitor delivery rates and adjust accordingly
- Cache user preferences

### 5. Security

- Validate all notification content
- Sanitize user-provided data in templates
- Encrypt SMTP passwords
- Implement proper access controls
- Log all notification events

## Monitoring

### Key Metrics to Track

1. **Delivery Rate** - Percentage successfully delivered
2. **Read Rate** - Percentage opened/read
3. **Click Rate** - Percentage of action clicks
4. **Bounce Rate** - Failed deliveries
5. **Opt-out Rate** - Users disabling notifications
6. **Response Time** - Notification send latency

### Health Checks

Monitor:
- SMTP connectivity
- Push notification service status
- Queue depth for scheduled notifications
- Database performance
- API response times

## Troubleshooting

### Emails Not Sending

1. Check SMTP configuration in `.env`
2. Verify credentials are correct
3. Check firewall/network settings
4. Review audit log for error messages
5. Test with Ethereal test account

### Notifications Not Showing

1. Verify user is authenticated
2. Check user preferences
3. Ensure notifications aren't in quiet hours
4. Check browser console for errors
5. Verify polling is working

### High Latency

1. Check database indexes
2. Optimize template queries
3. Implement caching
4. Review slow query logs
5. Consider queue system for bulk sends

## Migration Path

For existing notifications:

```sql
-- Migrate existing notifications to new schema
INSERT INTO notifications_enhanced (
  tenant_id, type_code, recipient_type, recipient_id,
  channel, title, content, status, created_at
)
SELECT 
  tenant_id, 
  type, -- map to type_code
  CASE WHEN admin_id IS NOT NULL THEN 'admin' ELSE 'customer' END,
  COALESCE(admin_id, customer_id),
  'in_app',
  title,
  message,
  CASE WHEN read THEN 'read' ELSE 'delivered' END,
  created_at
FROM notifications;
```

## Future Enhancements

Planned features:

1. **Rich Media** - Image/video attachments in notifications
2. **Interactive Actions** - Reply directly from notification
3. **AI-Powered** - Smart notification timing and content
4. **Multi-language** - Localized notifications
5. **A/B Testing** - Test notification variations
6. **Webhooks** - Third-party integrations
7. **Mobile SDK** - Native mobile push
8. **Notification Bundles** - Group related notifications

## Support

For issues or questions:

1. Check this documentation
2. Review audit logs
3. Check GitHub issues
4. Contact support team

## License

Same as the main Pulss platform - MIT License
