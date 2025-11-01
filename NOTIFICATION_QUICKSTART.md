# Notification System Quick Start Guide

Get up and running with the advanced notification system in 5 minutes!

## Step 1: Run Database Migration

Apply the notification system schema:

```bash
cd backend

# For PostgreSQL
psql $DATABASE_URL -f migrations/11_advanced_notification_system.sql

# Or for local setup
psql -h localhost -U postgres -d pulssdb -f migrations/11_advanced_notification_system.sql
```

## Step 2: Configure Email (Optional)

Add SMTP settings to your `.env` file:

```bash
# Email/SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@example.com
SMTP_PASSWORD=your_app_password
SMTP_FROM_EMAIL=noreply@pulss.app
SMTP_FROM_NAME=Pulss Platform
```

**Note:** For Gmail, you'll need to:
1. Enable 2-factor authentication
2. Generate an "App Password"
3. Use the app password instead of your regular password

For development, the system will automatically create test email accounts using Ethereal Email (no configuration needed).

## Step 3: Start the Backend

```bash
cd backend
npm start
```

The notification routes are automatically loaded at `/api/advanced-notifications`.

## Step 4: Add Frontend Components

### Add Notification Bell to Your Layout

```tsx
// In your header/navbar component
import { AdvancedNotificationCenter } from '@/components/AdvancedNotificationCenter';

function Header() {
  return (
    <header>
      {/* Your other header content */}
      <AdvancedNotificationCenter />
    </header>
  );
}
```

### Add Preferences to User Settings

```tsx
// In your user settings page
import { NotificationPreferences } from '@/components/NotificationPreferences';

function UserSettings() {
  return (
    <div>
      <h1>Settings</h1>
      <NotificationPreferences />
    </div>
  );
}
```

## Step 5: Send Your First Notification

### From Backend Code

```javascript
const advancedNotificationService = require('./services/advancedNotificationService');

// Send a notification
await advancedNotificationService.sendNotification({
  tenantId: 'your-tenant-uuid',
  typeCode: 'order_confirmed',
  recipientType: 'customer',
  recipientId: 'customer-uuid',
  title: 'Order Confirmed! 🎉',
  content: 'Your order #12345 has been confirmed and will be prepared soon.',
  actionUrl: '/orders/12345',
  actionLabel: 'View Order',
  priority: 'high'
});
```

### From API

```bash
curl -X POST http://localhost:3000/api/advanced-notifications/send \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "tenant-uuid",
    "typeCode": "order_confirmed",
    "recipientType": "customer",
    "recipientId": "customer-uuid",
    "title": "Order Confirmed",
    "content": "Your order has been confirmed!"
  }'
```

## Step 6: Test It Out!

1. **View Notifications**: Click the bell icon in your header
2. **Mark as Read**: Click the checkmark on any notification
3. **Delete**: Click the trash icon
4. **Configure Preferences**: Go to your settings page

## Common Use Cases

### 1. Order Status Updates

```javascript
// When order status changes
await advancedNotificationService.sendNotification({
  tenantId: order.tenant_id,
  typeCode: 'order_' + order.status, // order_confirmed, order_ready, etc.
  recipientType: 'customer',
  recipientId: order.customer_id,
  title: `Order ${order.status.toUpperCase()}`,
  content: `Your order #${order.id} is now ${order.status}`,
  actionUrl: `/orders/${order.id}`,
  actionLabel: 'Track Order',
  priority: 'high'
});
```

### 2. Welcome New Users

```javascript
// After user registration
await advancedNotificationService.sendNotification({
  tenantId: tenant.tenant_id,
  typeCode: 'new_customer',
  recipientType: 'customer',
  recipientId: newCustomer.customer_id,
  title: 'Welcome to Our Store! 🎊',
  content: 'Thanks for joining! Here\'s a special welcome offer...',
  actionUrl: '/offers/welcome',
  actionLabel: 'Claim Offer',
  priority: 'medium'
});
```

### 3. Low Stock Alerts (Admin)

```javascript
// When product stock is low
await advancedNotificationService.sendNotification({
  tenantId: product.tenant_id,
  typeCode: 'low_stock_alert',
  recipientType: 'admin',
  recipientId: admin.admin_id,
  title: '⚠️ Low Stock Alert',
  content: `${product.name} is running low (${product.stock} remaining)`,
  actionUrl: `/admin/products/${product.id}`,
  actionLabel: 'Update Stock',
  priority: 'medium'
});
```

### 4. Schedule Weekly Reports

```javascript
// Create a recurring notification
const response = await fetch('/api/advanced-notifications/schedules', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    typeCode: 'weekly_report',
    name: 'Weekly Sales Report',
    recipientType: 'admin',
    title: 'Your Weekly Performance Report',
    content: 'Here\'s your weekly sales summary...',
    channel: 'email',
    scheduleType: 'recurring',
    recurrenceRule: '0 9 * * 1' // Every Monday at 9 AM
  })
});
```

## Customize Templates

### Create Email Template

```javascript
const response = await fetch('/api/advanced-notifications/templates', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    typeCode: 'order_confirmed',
    channel: 'email',
    subject: 'Order Confirmed - {{order_id}}',
    templateBody: `
      Hi {{customer_name}},
      
      Great news! Your order {{order_id}} has been confirmed.
      
      Order Details:
      - Total: {{total_amount}}
      - Items: {{item_count}}
      
      Thanks for shopping with us!
    `,
    templateHtml: `
      <div style="font-family: Arial, sans-serif;">
        <h2>Order Confirmed! 🎉</h2>
        <p>Hi {{customer_name}},</p>
        <p>Your order <strong>{{order_id}}</strong> has been confirmed.</p>
        <a href="{{action_url}}" style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          {{action_label}}
        </a>
      </div>
    `
  })
});
```

## Monitor Performance

### View Analytics

```bash
curl "http://localhost:3000/api/advanced-notifications/analytics?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Check Audit Log

```bash
curl "http://localhost:3000/api/advanced-notifications/audit-log?eventType=failed" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Troubleshooting

### Emails Not Sending

**Problem:** Test emails work but real emails don't send.

**Solution:**
1. Check SMTP credentials in `.env`
2. For Gmail, use an App Password
3. Check firewall/network settings
4. Review audit log: `curl /api/advanced-notifications/audit-log?eventType=failed`

### Notifications Not Appearing

**Problem:** Sent notifications don't show up.

**Solution:**
1. Check browser console for errors
2. Verify JWT token is valid
3. Test API: `curl /api/advanced-notifications?status=delivered`
4. Check notification was actually sent (audit log)

### Slow Performance

**Problem:** Notification list is slow to load.

**Solution:**
1. The database migration includes indexes
2. Use pagination: `?limit=20&offset=0`
3. Filter by status: `?status=delivered`
4. Check database query performance

## Next Steps

Now that you have the basics working:

1. **Read the Full Documentation**: See [NOTIFICATION_SYSTEM.md](./NOTIFICATION_SYSTEM.md)
2. **API Reference**: Check [NOTIFICATION_API.md](./NOTIFICATION_API.md)
3. **Customize Templates**: Create branded templates for your store
4. **Set Up Scheduling**: Automate recurring notifications
5. **Monitor Analytics**: Track delivery and engagement rates

## Pro Tips

1. **Test with Ethereal Email**: No SMTP setup needed for development
2. **Use Type Codes**: Leverage pre-defined notification types
3. **Respect Preferences**: System automatically checks user preferences
4. **Monitor Audit Logs**: Track issues before users report them
5. **Batch Operations**: Use schedules for bulk notifications

## Need Help?

- 📖 [Full Documentation](./NOTIFICATION_SYSTEM.md)
- 🔧 [API Reference](./NOTIFICATION_API.md)
- 💬 [GitHub Issues](https://github.com/pulss/pulss-platform/issues)
- 📧 Email: support@pulss.app

---

**Congratulations!** You now have a world-class notification system running! 🚀
