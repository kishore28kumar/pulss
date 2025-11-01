# Notification System API Documentation

## Base URL

```
/api/advanced-notifications
```

## Authentication

All endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Error Handling

All endpoints return a consistent error format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Endpoints

### 1. Send Notification

Send a notification to a user.

**Endpoint:** `POST /api/advanced-notifications/send`

**Access:** Admin only

**Request Body:**

```json
{
  "tenantId": "uuid",
  "typeCode": "order_confirmed",
  "recipientType": "customer",
  "recipientId": "uuid",
  "title": "Order Confirmed",
  "content": "Your order has been confirmed!",
  "contentHtml": "<p>Your order has been confirmed!</p>",
  "actionUrl": "/orders/12345",
  "actionLabel": "View Order",
  "priority": "high",
  "metadata": {
    "orderId": "12345",
    "amount": 99.99
  },
  "scheduledFor": "2024-01-15T10:00:00Z",
  "expiresAt": "2024-01-20T23:59:59Z",
  "channels": ["email", "push", "in_app"]
}
```

**Required Fields:**
- `tenantId`
- `typeCode`
- `recipientType` (either "admin" or "customer")
- `recipientId`
- `title`
- `content`

**Optional Fields:**
- `contentHtml` - HTML version of content
- `actionUrl` - Link for action button
- `actionLabel` - Text for action button
- `priority` - "low", "medium", "high", or "urgent" (default: "medium")
- `metadata` - Additional data as JSON object
- `scheduledFor` - ISO 8601 timestamp for scheduled delivery
- `expiresAt` - ISO 8601 timestamp for expiration
- `channels` - Array of channels (uses user preferences if not specified)

**Response:**

```json
{
  "success": true,
  "notificationId": "uuid",
  "status": "delivered",
  "channelResults": [
    {
      "status": "fulfilled",
      "value": {
        "success": true,
        "provider": "smtp",
        "messageId": "abc123"
      }
    }
  ]
}
```

**Example cURL:**

```bash
curl -X POST https://api.pulss.app/api/advanced-notifications/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "tenant-uuid",
    "typeCode": "order_confirmed",
    "recipientType": "customer",
    "recipientId": "customer-uuid",
    "title": "Order Confirmed",
    "content": "Your order #12345 has been confirmed!"
  }'
```

---

### 2. Get Notifications

Get notifications for the authenticated user.

**Endpoint:** `GET /api/advanced-notifications`

**Access:** Authenticated users

**Query Parameters:**
- `status` (optional) - Filter by status: "pending", "sent", "delivered", "failed", "read"
- `typeCode` (optional) - Filter by notification type
- `limit` (optional) - Number of results (default: 50, max: 100)
- `offset` (optional) - Pagination offset (default: 0)

**Response:**

```json
{
  "success": true,
  "notifications": [
    {
      "notification_id": "uuid",
      "type_code": "order_confirmed",
      "type_name": "Order Confirmed",
      "type_icon": "package",
      "category": "transactional",
      "title": "Order Confirmed",
      "content": "Your order has been confirmed",
      "action_url": "/orders/12345",
      "action_label": "View Order",
      "status": "delivered",
      "priority": "high",
      "created_at": "2024-01-15T10:30:00Z",
      "read_at": null
    }
  ],
  "count": 10
}
```

**Example:**

```bash
curl https://api.pulss.app/api/advanced-notifications?status=delivered&limit=10 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 3. Get Unread Count

Get the count of unread notifications.

**Endpoint:** `GET /api/advanced-notifications/unread-count`

**Access:** Authenticated users

**Response:**

```json
{
  "success": true,
  "count": 5
}
```

**Example:**

```bash
curl https://api.pulss.app/api/advanced-notifications/unread-count \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 4. Mark Notification as Read

Mark a specific notification as read.

**Endpoint:** `PUT /api/advanced-notifications/:id/read`

**Access:** Authenticated users (can only mark their own notifications)

**Response:**

```json
{
  "success": true
}
```

**Example:**

```bash
curl -X PUT https://api.pulss.app/api/advanced-notifications/notification-uuid/read \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 5. Mark All as Read

Mark all notifications as read for the current user.

**Endpoint:** `PUT /api/advanced-notifications/read-all`

**Access:** Authenticated users

**Response:**

```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

**Example:**

```bash
curl -X PUT https://api.pulss.app/api/advanced-notifications/read-all \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 6. Delete Notification

Delete a specific notification.

**Endpoint:** `DELETE /api/advanced-notifications/:id`

**Access:** Authenticated users (can only delete their own notifications)

**Response:**

```json
{
  "success": true,
  "message": "Notification deleted"
}
```

**Example:**

```bash
curl -X DELETE https://api.pulss.app/api/advanced-notifications/notification-uuid \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 7. Get Notification Types

Get all available notification types.

**Endpoint:** `GET /api/advanced-notifications/types`

**Access:** Authenticated users

**Response:**

```json
{
  "success": true,
  "types": [
    {
      "type_id": "uuid",
      "type_code": "order_confirmed",
      "name": "Order Confirmed",
      "description": "Notification when order is confirmed by admin",
      "category": "transactional",
      "default_enabled": true,
      "can_opt_out": false,
      "icon": "package",
      "priority": "high"
    }
  ]
}
```

**Example:**

```bash
curl https://api.pulss.app/api/advanced-notifications/types \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 8. Get User Preferences

Get notification preferences for the authenticated user.

**Endpoint:** `GET /api/advanced-notifications/preferences`

**Access:** Authenticated users

**Response:**

```json
{
  "success": true,
  "preferences": [
    {
      "preference_id": "uuid",
      "type_code": "order_confirmed",
      "type_name": "Order Confirmed",
      "description": "Notification when order is confirmed",
      "category": "transactional",
      "can_opt_out": false,
      "email_enabled": true,
      "sms_enabled": false,
      "push_enabled": true,
      "whatsapp_enabled": false,
      "in_app_enabled": true,
      "digest_frequency": "immediate",
      "quiet_hours_start": null,
      "quiet_hours_end": null
    }
  ]
}
```

**Example:**

```bash
curl https://api.pulss.app/api/advanced-notifications/preferences \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 9. Update Notification Preferences

Update notification preferences for a specific notification type.

**Endpoint:** `PUT /api/advanced-notifications/preferences/:typeCode`

**Access:** Authenticated users

**Request Body:**

```json
{
  "emailEnabled": true,
  "smsEnabled": false,
  "pushEnabled": true,
  "whatsappEnabled": false,
  "inAppEnabled": true,
  "digestFrequency": "immediate",
  "quietHoursStart": "22:00:00",
  "quietHoursEnd": "08:00:00"
}
```

**Note:** All fields are optional. Only provide fields you want to update.

**Response:**

```json
{
  "success": true,
  "preference": {
    "preference_id": "uuid",
    "type_code": "promo_new_offer",
    "email_enabled": true,
    "sms_enabled": false,
    "push_enabled": true,
    "whatsapp_enabled": false,
    "in_app_enabled": true,
    "digest_frequency": "immediate",
    "quiet_hours_start": "22:00:00",
    "quiet_hours_end": "08:00:00"
  }
}
```

**Example:**

```bash
curl -X PUT https://api.pulss.app/api/advanced-notifications/preferences/promo_new_offer \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "emailEnabled": false,
    "pushEnabled": true
  }'
```

---

### 10. Get Templates

Get notification templates for the tenant (Admin only).

**Endpoint:** `GET /api/advanced-notifications/templates`

**Access:** Admin only

**Response:**

```json
{
  "success": true,
  "templates": [
    {
      "template_id": "uuid",
      "type_code": "order_confirmed",
      "type_name": "Order Confirmed",
      "category": "transactional",
      "channel": "email",
      "subject": "Your Order is Confirmed!",
      "template_body": "Hi {{customer_name}}, your order {{order_id}} has been confirmed...",
      "template_html": "<html>...</html>",
      "is_active": true,
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

**Example:**

```bash
curl https://api.pulss.app/api/advanced-notifications/templates \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 11. Create/Update Template

Create or update a notification template.

**Endpoint:** `PUT /api/advanced-notifications/templates`

**Access:** Admin only

**Request Body:**

```json
{
  "typeCode": "order_confirmed",
  "channel": "email",
  "subject": "Your Order is Confirmed! 🎉",
  "templateBody": "Hi {{customer_name}},\n\nYour order {{order_id}} has been confirmed...",
  "templateHtml": "<html><body>...</body></html>",
  "isActive": true
}
```

**Required Fields:**
- `typeCode`
- `channel`
- `templateBody`

**Response:**

```json
{
  "success": true,
  "template": {
    "template_id": "uuid",
    "type_code": "order_confirmed",
    "channel": "email",
    "subject": "Your Order is Confirmed! 🎉",
    "template_body": "...",
    "template_html": "...",
    "is_active": true
  }
}
```

**Example:**

```bash
curl -X PUT https://api.pulss.app/api/advanced-notifications/templates \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "typeCode": "order_confirmed",
    "channel": "email",
    "subject": "Order Confirmed!",
    "templateBody": "Your order has been confirmed"
  }'
```

---

### 12. Get Schedules

Get notification schedules for the tenant.

**Endpoint:** `GET /api/advanced-notifications/schedules`

**Access:** Admin only

**Response:**

```json
{
  "success": true,
  "schedules": [
    {
      "schedule_id": "uuid",
      "type_code": "weekly_report",
      "type_name": "Weekly Report",
      "name": "Weekly Sales Report",
      "description": "Automated weekly sales report",
      "is_active": true,
      "recipient_type": "admin",
      "title": "Your Weekly Sales Report",
      "content": "Here's your performance summary...",
      "channel": "email",
      "schedule_type": "recurring",
      "recurrence_rule": "0 9 * * 1",
      "next_execution_at": "2024-01-22T09:00:00Z",
      "execution_count": 10,
      "created_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

**Example:**

```bash
curl https://api.pulss.app/api/advanced-notifications/schedules \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 13. Create Schedule

Create a new notification schedule.

**Endpoint:** `POST /api/advanced-notifications/schedules`

**Access:** Admin only

**Request Body:**

```json
{
  "typeCode": "weekly_report",
  "name": "Weekly Sales Report",
  "description": "Automated weekly sales report",
  "recipientType": "admin",
  "recipientIds": ["admin-uuid-1", "admin-uuid-2"],
  "segmentFilter": null,
  "title": "Your Weekly Sales Report",
  "content": "Here's your performance summary...",
  "channel": "email",
  "actionUrl": "/analytics/weekly",
  "actionLabel": "View Full Report",
  "scheduleType": "recurring",
  "scheduledTime": null,
  "recurrenceRule": "0 9 * * 1",
  "triggerEvent": null,
  "triggerDelayMinutes": null
}
```

**Schedule Types:**
- `once` - One-time scheduled notification (requires `scheduledTime`)
- `recurring` - Recurring notification (requires `recurrenceRule`)
- `trigger` - Event-triggered notification (requires `triggerEvent`)

**Response:**

```json
{
  "success": true,
  "schedule": {
    "schedule_id": "uuid",
    "name": "Weekly Sales Report",
    "is_active": true,
    "next_execution_at": "2024-01-22T09:00:00Z"
  }
}
```

**Example:**

```bash
curl -X POST https://api.pulss.app/api/advanced-notifications/schedules \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "typeCode": "weekly_report",
    "name": "Weekly Sales Report",
    "recipientType": "admin",
    "title": "Weekly Report",
    "content": "Your weekly sales report",
    "channel": "email",
    "scheduleType": "recurring",
    "recurrenceRule": "0 9 * * 1"
  }'
```

---

### 14. Update Schedule

Update a notification schedule.

**Endpoint:** `PUT /api/advanced-notifications/schedules/:id`

**Access:** Admin only

**Request Body:**

```json
{
  "isActive": false
}
```

**Response:**

```json
{
  "success": true,
  "schedule": {
    "schedule_id": "uuid",
    "is_active": false
  }
}
```

**Example:**

```bash
curl -X PUT https://api.pulss.app/api/advanced-notifications/schedules/schedule-uuid \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isActive": false}'
```

---

### 15. Delete Schedule

Delete a notification schedule.

**Endpoint:** `DELETE /api/advanced-notifications/schedules/:id`

**Access:** Admin only

**Response:**

```json
{
  "success": true,
  "message": "Schedule deleted"
}
```

**Example:**

```bash
curl -X DELETE https://api.pulss.app/api/advanced-notifications/schedules/schedule-uuid \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 16. Get Analytics

Get notification analytics for the tenant.

**Endpoint:** `GET /api/advanced-notifications/analytics`

**Access:** Admin only

**Query Parameters:**
- `startDate` (optional) - Start date (YYYY-MM-DD)
- `endDate` (optional) - End date (YYYY-MM-DD)
- `typeCode` (optional) - Filter by notification type
- `channel` (optional) - Filter by channel

**Response:**

```json
{
  "success": true,
  "analytics": [
    {
      "date": "2024-01-15",
      "type_code": "order_confirmed",
      "channel": "email",
      "total_sent": 150,
      "total_delivered": 145,
      "total_failed": 5,
      "total_read": 120,
      "total_clicks": 95,
      "avg_delivery_rate": 96.67,
      "avg_read_rate": 82.76,
      "avg_click_rate": 79.17
    }
  ]
}
```

**Example:**

```bash
curl "https://api.pulss.app/api/advanced-notifications/analytics?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 17. Get Audit Log

Get notification audit log for the tenant.

**Endpoint:** `GET /api/advanced-notifications/audit-log`

**Access:** Admin only

**Query Parameters:**
- `notificationId` (optional) - Filter by notification ID
- `eventType` (optional) - Filter by event type
- `limit` (optional) - Number of results (default: 100)
- `offset` (optional) - Pagination offset (default: 0)

**Response:**

```json
{
  "success": true,
  "auditLog": [
    {
      "audit_id": "uuid",
      "notification_id": "uuid",
      "actor_type": "admin",
      "actor_id": "admin-uuid",
      "event_type": "sent",
      "channel": "email",
      "provider": "smtp",
      "provider_message_id": "abc123",
      "delivery_status": "delivered",
      "delivery_metadata": {
        "response": "250 OK"
      },
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**Example:**

```bash
curl "https://api.pulss.app/api/advanced-notifications/audit-log?eventType=failed&limit=50" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Webhooks (Future Feature)

Webhook support for notification events will be added in a future release:

- `notification.sent` - When notification is sent
- `notification.delivered` - When notification is delivered
- `notification.failed` - When notification fails
- `notification.read` - When notification is read
- `notification.clicked` - When action is clicked

---

## Rate Limits

API rate limits:
- **General endpoints:** 100 requests per 15 minutes per user
- **Send notification:** 50 requests per 15 minutes per tenant
- **Bulk operations:** 10 requests per 15 minutes per tenant

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

---

## SDKs and Libraries

### JavaScript/Node.js

```javascript
import { NotificationClient } from '@pulss/notifications';

const client = new NotificationClient({
  apiUrl: 'https://api.pulss.app',
  token: 'your-jwt-token'
});

// Send notification
await client.send({
  typeCode: 'order_confirmed',
  recipientType: 'customer',
  recipientId: 'customer-uuid',
  title: 'Order Confirmed',
  content: 'Your order has been confirmed'
});

// Get notifications
const notifications = await client.getNotifications({ limit: 10 });
```

### React Hooks

```jsx
import { useNotifications } from '@pulss/notifications-react';

function MyComponent() {
  const { notifications, unreadCount, markAsRead } = useNotifications();
  
  return (
    <div>
      <span>Unread: {unreadCount}</span>
      {notifications.map(n => (
        <div key={n.id} onClick={() => markAsRead(n.id)}>
          {n.title}
        </div>
      ))}
    </div>
  );
}
```

---

## Support

For API support:
- Documentation: [https://docs.pulss.app/notifications](https://docs.pulss.app/notifications)
- GitHub Issues: [https://github.com/pulss/pulss-platform/issues](https://github.com/pulss/pulss-platform/issues)
- Email: support@pulss.app

---

## Changelog

### v1.0.0 (2024-01-15)
- Initial release
- Multi-channel notifications
- User preferences
- Templates and scheduling
- Analytics and audit logging
