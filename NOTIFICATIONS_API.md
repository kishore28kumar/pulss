# Notifications System API Reference

Complete API reference for the Advanced Notifications and Communication System.

## Base URLs

- **Advanced Notifications**: `/api/notifications-advanced`
- **Super Admin Controls**: `/api/super-admin/notifications`

## Authentication

All endpoints require authentication via JWT token in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

## User Endpoints

### Send Notification

Send a notification through any channel.

**Endpoint:** `POST /api/notifications-advanced/send`

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| recipientEmail | string | No | Recipient email address |
| recipientPhone | string | No | Recipient phone number |
| notificationType | string | Yes | Type: transactional, marketing, promotional, system |
| eventType | string | Yes | Event identifier (e.g., order_confirmed) |
| channel | string | Yes | Channel: email, sms, push, webhook, in_app |
| templateKey | string | Yes | Template identifier |
| variables | object | No | Template variables for substitution |
| priority | string | No | Priority: low, medium, high, urgent (default: medium) |
| metadata | object | No | Additional metadata |
| scheduledFor | string | No | ISO 8601 datetime for scheduled delivery |

**Example Request:**
```json
{
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
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "notificationId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "sent",
    "deliveryInfo": {
      "provider": "sendgrid",
      "providerMessageId": "sg-1234567890"
    }
  }
}
```

---

### Get Notifications

Retrieve user's notifications with pagination and filters.

**Endpoint:** `GET /api/notifications-advanced`

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | integer | 1 | Page number |
| limit | integer | 20 | Results per page (max 100) |
| channel | string | - | Filter by channel |
| notificationType | string | - | Filter by type |
| unreadOnly | boolean | false | Show only unread notifications |
| startDate | string | - | ISO 8601 start date |
| endDate | string | - | ISO 8601 end date |

**Example Request:**
```
GET /api/notifications-advanced?page=1&limit=20&unreadOnly=true&channel=email
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "notification_id": "550e8400-e29b-41d4-a716-446655440000",
      "notification_type": "transactional",
      "event_type": "order_confirmed",
      "channel": "email",
      "title": "Order Confirmed",
      "message": "Your order has been confirmed",
      "priority": "high",
      "status": "delivered",
      "read": false,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

---

### Mark as Read

Mark a specific notification as read.

**Endpoint:** `PUT /api/notifications-advanced/:id/read`

**Path Parameters:**
- `id` - Notification ID

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

---

### Mark All as Read

Mark all user notifications as read.

**Endpoint:** `PUT /api/notifications-advanced/read-all`

**Response:**
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

---

### Delete Notification

Delete a specific notification.

**Endpoint:** `DELETE /api/notifications-advanced/:id`

**Path Parameters:**
- `id` - Notification ID

**Response:**
```json
{
  "success": true,
  "message": "Notification deleted"
}
```

---

## Template Endpoints

### Get Templates

List all available notification templates.

**Endpoint:** `GET /api/notifications-advanced/templates`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| category | string | Filter by category |
| language | string | Filter by language (default: en) |
| includeDefaults | boolean | Include system defaults (default: true) |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "template_id": "550e8400-e29b-41d4-a716-446655440000",
      "template_key": "order_confirmed",
      "template_name": "Order Confirmed",
      "description": "Sent when order is confirmed",
      "category": "transactional",
      "language": "en",
      "is_active": true,
      "is_default": true,
      "created_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

---

### Get Template

Get a specific template by ID.

**Endpoint:** `GET /api/notifications-advanced/templates/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "template_id": "550e8400-e29b-41d4-a716-446655440000",
    "template_key": "order_confirmed",
    "template_name": "Order Confirmed",
    "description": "Sent when order is confirmed",
    "email_subject": "Order {{order_id}} Confirmed",
    "email_body": "Hi {{customer_name}}, your order has been confirmed...",
    "sms_content": "Order {{order_id}} confirmed. Total: {{order_total}}",
    "push_title": "Order Confirmed",
    "push_body": "Your order {{order_id}} has been confirmed",
    "category": "transactional",
    "language": "en",
    "variables": {
      "customer_name": "string",
      "order_id": "string",
      "order_total": "string"
    },
    "branding": {
      "logo_url": "https://example.com/logo.png",
      "primary_color": "#2563EB"
    },
    "is_active": true
  }
}
```

---

### Create Template

Create a new notification template (Admin/Super Admin only).

**Endpoint:** `POST /api/notifications-advanced/templates`

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| templateKey | string | Yes | Unique template identifier |
| templateName | string | Yes | Display name |
| description | string | No | Template description |
| emailSubject | string | No | Email subject line |
| emailBody | string | No | Email plain text body |
| emailHtml | string | No | Email HTML body |
| smsContent | string | No | SMS message content |
| pushTitle | string | No | Push notification title |
| pushBody | string | No | Push notification body |
| webhookPayload | object | No | Webhook JSON payload |
| category | string | Yes | Category: transactional, marketing, promotional, system |
| language | string | No | Language code (default: en) |
| variables | object | No | Available variables with types |
| branding | object | No | Branding customization |

**Example Request:**
```json
{
  "templateKey": "order_shipped",
  "templateName": "Order Shipped",
  "description": "Sent when order is shipped",
  "emailSubject": "Your order {{order_id}} has shipped!",
  "emailBody": "Hi {{customer_name}}, great news! Your order #{{order_id}} has been shipped and is on its way.\n\nTracking Number: {{tracking_number}}\nExpected Delivery: {{expected_delivery}}",
  "smsContent": "Order {{order_id}} shipped! Track: {{tracking_url}}",
  "pushTitle": "Order Shipped",
  "pushBody": "Your order {{order_id}} is on its way!",
  "category": "transactional",
  "language": "en",
  "variables": {
    "customer_name": "string",
    "order_id": "string",
    "tracking_number": "string",
    "tracking_url": "string",
    "expected_delivery": "string"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Template created",
  "data": {
    "template_id": "550e8400-e29b-41d4-a716-446655440000",
    "template_key": "order_shipped",
    "template_name": "Order Shipped",
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

---

### Update Template

Update an existing template (Admin/Super Admin only).

**Endpoint:** `PUT /api/notifications-advanced/templates/:id`

**Request Body:** Same as Create Template (all fields optional)

---

### Delete Template

Delete a template (Admin/Super Admin only, cannot delete default templates).

**Endpoint:** `DELETE /api/notifications-advanced/templates/:id`

**Response:**
```json
{
  "success": true,
  "message": "Template deleted"
}
```

---

## Preferences Endpoints

### Get Preferences

Get current user's notification preferences.

**Endpoint:** `GET /api/notifications-advanced/preferences`

**Response:**
```json
{
  "success": true,
  "data": {
    "preference_id": "550e8400-e29b-41d4-a716-446655440000",
    "email_enabled": true,
    "sms_enabled": true,
    "push_enabled": true,
    "in_app_enabled": true,
    "transactional_enabled": true,
    "marketing_enabled": false,
    "promotional_enabled": false,
    "order_updates": true,
    "payment_updates": true,
    "delivery_updates": true,
    "promotional_offers": false,
    "loyalty_updates": true,
    "system_alerts": true,
    "quiet_hours_enabled": false,
    "quiet_hours_start": null,
    "quiet_hours_end": null,
    "quiet_hours_timezone": "UTC",
    "preferred_language": "en"
  }
}
```

---

### Update Preferences

Update user's notification preferences.

**Endpoint:** `PUT /api/notifications-advanced/preferences`

**Request Body:** (All fields optional)
```json
{
  "email_enabled": true,
  "sms_enabled": false,
  "push_enabled": true,
  "in_app_enabled": true,
  "transactional_enabled": true,
  "marketing_enabled": false,
  "promotional_enabled": false,
  "order_updates": true,
  "payment_updates": true,
  "delivery_updates": true,
  "promotional_offers": false,
  "quiet_hours_enabled": true,
  "quiet_hours_start": "22:00",
  "quiet_hours_end": "08:00",
  "quiet_hours_timezone": "America/New_York",
  "preferred_language": "en"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Preferences updated",
  "data": { /* updated preferences */ }
}
```

---

## Analytics Endpoints

### Get Analytics

Get notification analytics for current tenant.

**Endpoint:** `GET /api/notifications-advanced/analytics`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| startDate | string | ISO 8601 start date |
| endDate | string | ISO 8601 end date |
| channel | string | Filter by specific channel |
| groupBy | string | Group by: hour, day, week, month |

**Response:**
```json
{
  "success": true,
  "data": {
    "analytics": [
      {
        "date": "2024-01-15",
        "channel": "email",
        "total_sent": 1000,
        "total_delivered": 970,
        "total_failed": 30,
        "total_opened": 485,
        "total_clicked": 145,
        "delivery_rate": 97.0,
        "open_rate": 50.0,
        "click_rate": 15.0
      }
    ],
    "summary": [
      {
        "channel": "email",
        "total_notifications": 5000,
        "delivered": 4850,
        "failed": 150,
        "opened": 2425,
        "clicked": 728
      }
    ]
  }
}
```

---

### Export History

Export notification history (Admin/Super Admin only).

**Endpoint:** `GET /api/notifications-advanced/export`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| startDate | string | ISO 8601 start date |
| endDate | string | ISO 8601 end date |
| channel | string | Filter by channel |
| format | string | Export format: json (default), csv |

**Response:** Returns JSON or CSV file download

---

## Super Admin Endpoints

### Get Global Controls

Get global notification controls (Super Admin only).

**Endpoint:** `GET /api/super-admin/notifications/controls`

**Response:**
```json
{
  "success": true,
  "data": {
    "control_id": "550e8400-e29b-41d4-a716-446655440000",
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
    "alert_email": "admin@platform.com",
    "email_provider_primary": "sendgrid",
    "email_provider_fallback": "ses",
    "sms_provider_primary": "twilio",
    "sms_provider_fallback": "msg91"
  }
}
```

---

### Update Global Controls

Update global notification controls (Super Admin only).

**Endpoint:** `PUT /api/super-admin/notifications/controls`

**Request Body:** (All fields optional)
```json
{
  "notifications_enabled": true,
  "email_enabled": true,
  "sms_enabled": true,
  "global_email_daily_limit": 150000,
  "alert_on_high_failure_rate": true,
  "failure_rate_threshold": 15.00
}
```

---

### Get All Tenant Settings

List notification settings for all tenants (Super Admin only).

**Endpoint:** `GET /api/super-admin/notifications/tenant-settings`

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 20)

---

### Get Tenant Settings

Get notification settings for specific tenant (Super Admin only).

**Endpoint:** `GET /api/super-admin/notifications/tenant-settings/:tenantId`

**Response:**
```json
{
  "success": true,
  "data": {
    "setting_id": "550e8400-e29b-41d4-a716-446655440000",
    "tenant_id": "tenant-uuid",
    "email_enabled": true,
    "sms_enabled": true,
    "push_enabled": true,
    "webhook_enabled": false,
    "in_app_enabled": true,
    "transactional_enabled": true,
    "marketing_enabled": false,
    "system_enabled": true,
    "promotional_enabled": false,
    "email_provider": "sendgrid",
    "sms_provider": "twilio",
    "push_provider": "fcm",
    "email_daily_limit": 1000,
    "sms_daily_limit": 500,
    "push_daily_limit": 5000,
    "default_sender_name": "MyStore",
    "default_sender_email": "noreply@mystore.com",
    "track_opens": true,
    "track_clicks": true
  }
}
```

---

### Update Tenant Settings

Update tenant notification settings (Super Admin only).

**Endpoint:** `PUT /api/super-admin/notifications/tenant-settings/:tenantId`

**Request Body:** (All fields optional)
```json
{
  "email_enabled": true,
  "sms_enabled": false,
  "email_daily_limit": 2000,
  "default_sender_name": "Updated Store Name"
}
```

---

### Toggle Tenant Channel

Enable/disable a specific channel for a tenant (Super Admin only).

**Endpoint:** `POST /api/super-admin/notifications/tenant-settings/:tenantId/toggle`

**Request Body:**
```json
{
  "channel": "email",
  "enabled": false
}
```

Valid channels: `email`, `sms`, `push`, `webhook`, `in_app`

---

### Toggle Tenant Notification Type

Enable/disable a notification type for a tenant (Super Admin only).

**Endpoint:** `POST /api/super-admin/notifications/tenant-settings/:tenantId/toggle-type`

**Request Body:**
```json
{
  "notificationType": "marketing",
  "enabled": false
}
```

Valid types: `transactional`, `marketing`, `system`, `promotional`

---

### Get Platform Analytics

Get platform-wide notification analytics (Super Admin only).

**Endpoint:** `GET /api/super-admin/notifications/analytics`

**Query Parameters:**
- `startDate` - ISO 8601 start date
- `endDate` - ISO 8601 end date
- `groupBy` - Group by: hour, day, week, month

**Response:**
```json
{
  "success": true,
  "data": {
    "overall": {
      "total_notifications": 50000,
      "delivered": 48500,
      "failed": 1500,
      "bounced": 200,
      "opened": 20625,
      "clicked": 7425,
      "delivery_rate": 97.0,
      "open_rate": 42.5,
      "click_rate": 15.3
    },
    "byChannel": [
      {
        "channel": "email",
        "total": 30000,
        "delivered": 29100,
        "failed": 900,
        "delivery_rate": 97.0
      },
      {
        "channel": "sms",
        "total": 15000,
        "delivered": 14700,
        "failed": 300,
        "delivery_rate": 98.0
      }
    ],
    "byTenant": [
      {
        "tenant_id": "tenant-1-uuid",
        "tenant_name": "Store A",
        "subdomain": "storea",
        "total_notifications": 10000,
        "delivered": 9700,
        "failed": 300
      }
    ],
    "dailyTrends": [
      {
        "date": "2024-01-15",
        "total": 2500,
        "delivered": 2425,
        "failed": 75
      }
    ]
  }
}
```

---

### Get Delivery Logs

Get detailed delivery logs for monitoring (Super Admin only).

**Endpoint:** `GET /api/super-admin/notifications/delivery-logs`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | integer | Page number |
| limit | integer | Results per page (max 100) |
| status | string | Filter by status |
| channel | string | Filter by channel |
| tenantId | string | Filter by tenant |
| startDate | string | ISO 8601 start date |
| endDate | string | ISO 8601 end date |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "notification_id": "550e8400-e29b-41d4-a716-446655440000",
      "tenant_id": "tenant-uuid",
      "tenant_name": "Store A",
      "notification_type": "transactional",
      "event_type": "order_confirmed",
      "channel": "email",
      "status": "delivered",
      "priority": "high",
      "provider": "sendgrid",
      "provider_message_id": "sg-1234567890",
      "failure_reason": null,
      "retry_count": 0,
      "created_at": "2024-01-15T10:00:00Z",
      "sent_at": "2024-01-15T10:00:05Z",
      "delivered_at": "2024-01-15T10:00:10Z",
      "failed_at": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1250,
    "pages": 25
  }
}
```

---

### Retry Failed Notification

Retry a failed notification (Super Admin only).

**Endpoint:** `POST /api/super-admin/notifications/retry/:notificationId`

**Response:**
```json
{
  "success": true,
  "message": "Notification queued for retry"
}
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting

All API endpoints are rate-limited:
- Standard endpoints: 100 requests per 15 minutes
- Analytics endpoints: 50 requests per 15 minutes
- Super admin endpoints: 200 requests per 15 minutes

---

**Version**: 1.0.0  
**Last Updated**: 2024-01-15
