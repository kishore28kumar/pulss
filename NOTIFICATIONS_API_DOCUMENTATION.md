# Advanced Notifications System - API Documentation

## Overview

The Advanced Notifications System provides a comprehensive solution for managing multi-channel notifications with templates, campaigns, analytics, and super admin controls. All advanced features are gated by feature toggles that can be controlled by super admins on a per-tenant basis.

## Table of Contents

1. [Authentication](#authentication)
2. [Feature Toggles (Super Admin)](#feature-toggles-super-admin)
3. [Notification Templates](#notification-templates)
4. [Campaign Management](#campaign-management)
5. [Analytics](#analytics)
6. [User Preferences](#user-preferences)
7. [Export](#export)

---

## Authentication

All endpoints require authentication via JWT token in the Authorization header:

```http
Authorization: Bearer <jwt_token>
```

**Role Requirements:**
- **Super Admin**: Full access to feature toggles and all tenant data
- **Admin**: Access to their tenant's notifications, templates, and campaigns
- **User**: Access to their own notifications and preferences

---

## Feature Toggles (Super Admin)

These endpoints are only accessible to super admins and control which features are enabled for each tenant.

### Get Feature Toggles for a Tenant

```http
GET /api/advanced-notifications/tenants/:tenantId/feature-toggles
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tenant_id": "uuid",
    "notifications_enabled": true,
    "push_notifications_enabled": false,
    "sms_notifications_enabled": false,
    "email_notifications_enabled": true,
    "whatsapp_notifications_enabled": false,
    "campaigns_enabled": true,
    "campaign_automation_enabled": false,
    "campaign_scheduling_enabled": true,
    "ab_testing_enabled": false,
    "custom_templates_enabled": true,
    "template_editor_enabled": true,
    "branded_templates_enabled": true,
    "analytics_enabled": true,
    "advanced_analytics_enabled": false,
    "export_enabled": true,
    "compliance_mode": "standard",
    "gdpr_enabled": false,
    "dpdp_enabled": true,
    "opt_in_required": false,
    "api_access_enabled": false,
    "webhook_enabled": false,
    "third_party_integration_enabled": false,
    "max_campaigns_per_month": 10,
    "max_notifications_per_day": 1000,
    "max_templates": 50,
    "configured_by": "uuid",
    "notes": "Standard configuration for Indian market",
    "created_at": "2025-01-15T10:00:00Z",
    "updated_at": "2025-01-20T15:30:00Z"
  }
}
```

### Update Feature Toggles

```http
PUT /api/advanced-notifications/tenants/:tenantId/feature-toggles
```

**Request Body:**
```json
{
  "campaigns_enabled": true,
  "campaign_scheduling_enabled": true,
  "analytics_enabled": true,
  "max_campaigns_per_month": 20,
  "dpdp_enabled": true,
  "notes": "Enabled campaigns for marketing team"
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* updated toggles */ },
  "message": "Feature toggles updated successfully"
}
```

### Get All Tenants with Toggle Status

```http
GET /api/advanced-notifications/feature-toggles/all
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "tenant_id": "uuid",
      "tenant_name": "Pharmacy Store 1",
      "tenant_status": "active",
      "notifications_enabled": true,
      "campaigns_enabled": true,
      "analytics_enabled": true,
      "updated_at": "2025-01-20T10:00:00Z"
    }
  ]
}
```

### Bulk Update Toggles

```http
POST /api/advanced-notifications/feature-toggles/bulk-update
```

**Request Body:**
```json
{
  "tenantIds": ["uuid1", "uuid2", "uuid3"],
  "updates": {
    "campaigns_enabled": true,
    "analytics_enabled": true
  }
}
```

### Reset Toggles to Default

```http
POST /api/advanced-notifications/tenants/:tenantId/feature-toggles/reset
```

### Get Toggle History

```http
GET /api/advanced-notifications/tenants/:tenantId/feature-toggles/history?limit=50&offset=0
```

---

## Notification Templates

### Get All Templates

```http
GET /api/advanced-notifications/tenants/:tenantId/templates?type=marketing&category=promotion&region=india&active=true
```

**Query Parameters:**
- `type`: Filter by template_type (transactional, marketing, compliance, event)
- `category`: Filter by category (order, delivery, payment, account, promotion)
- `region`: Filter by region (india, us, eu, global)
- `active`: Filter by active status (true/false)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "tenant_id": "uuid",
      "name": "order_created",
      "description": "Order confirmation template",
      "template_type": "transactional",
      "category": "order",
      "subject_template": "Order Confirmation - #{order_number}",
      "body_template": "Hi #{customer_name}, your order #{order_number} has been confirmed...",
      "channels": ["email", "sms", "whatsapp", "in_app"],
      "use_tenant_branding": true,
      "custom_branding": {
        "logo_url": "https://...",
        "colors": {
          "primary": "#007bff"
        }
      },
      "region": "india",
      "compliance_type": "dpdp",
      "requires_consent": false,
      "variables": [
        {
          "name": "customer_name",
          "description": "Customer full name",
          "type": "string"
        },
        {
          "name": "order_number",
          "description": "Order number",
          "type": "string"
        }
      ],
      "is_active": true,
      "is_system_template": true,
      "created_at": "2025-01-10T00:00:00Z",
      "updated_at": "2025-01-10T00:00:00Z"
    }
  ]
}
```

### Create Template

```http
POST /api/advanced-notifications/tenants/:tenantId/templates
```

**Request Body:**
```json
{
  "name": "welcome_email",
  "description": "Welcome email for new customers",
  "template_type": "marketing",
  "category": "account",
  "subject_template": "Welcome to #{store_name}!",
  "body_template": "Hi #{customer_name}, welcome to #{store_name}. We're excited to have you!",
  "channels": ["email", "in_app"],
  "region": "global",
  "compliance_type": "standard",
  "requires_consent": false,
  "variables": [
    {
      "name": "customer_name",
      "description": "Customer name",
      "type": "string"
    },
    {
      "name": "store_name",
      "description": "Store name",
      "type": "string"
    }
  ],
  "custom_branding": {
    "logo_url": "https://cdn.example.com/logo.png",
    "colors": {
      "primary": "#007bff",
      "secondary": "#6c757d"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* created template */ }
}
```

### Update Template

```http
PUT /api/advanced-notifications/templates/:templateId
```

**Request Body:**
```json
{
  "subject_template": "Updated subject",
  "body_template": "Updated body",
  "is_active": false
}
```

### Delete Template

```http
DELETE /api/advanced-notifications/templates/:templateId
```

**Note:** System templates cannot be deleted.

---

## Campaign Management

### Get All Campaigns

```http
GET /api/advanced-notifications/tenants/:tenantId/campaigns?status=active&type=one_time&limit=20&offset=0
```

**Query Parameters:**
- `status`: Filter by status (draft, scheduled, active, paused, completed, cancelled)
- `type`: Filter by campaign_type (one_time, recurring, triggered, drip)
- `limit`: Results per page (default: 20)
- `offset`: Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "tenant_id": "uuid",
      "name": "Weekend Sale Campaign",
      "description": "20% off all products this weekend",
      "campaign_type": "one_time",
      "target_type": "all",
      "target_segment": null,
      "template_id": "uuid",
      "channels": ["email", "push", "sms"],
      "priority": "high",
      "schedule_type": "scheduled",
      "scheduled_at": "2025-01-25T09:00:00Z",
      "status": "scheduled",
      "total_recipients": 1500,
      "sent_count": 0,
      "delivered_count": 0,
      "read_count": 0,
      "clicked_count": 0,
      "failed_count": 0,
      "is_automated": false,
      "created_at": "2025-01-20T10:00:00Z",
      "updated_at": "2025-01-20T10:00:00Z"
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0
  }
}
```

### Create Campaign

```http
POST /api/advanced-notifications/tenants/:tenantId/campaigns
```

**Request Body:**
```json
{
  "name": "New Year Sale",
  "description": "Special discount for New Year",
  "campaign_type": "one_time",
  "target_type": "segment",
  "target_segment": "vip",
  "template_id": "uuid",
  "channels": ["email", "push"],
  "priority": "high",
  "schedule_type": "scheduled",
  "scheduled_at": "2025-01-01T00:00:00Z"
}
```

**Target Types:**
- `all`: All customers
- `segment`: Pre-defined segment (vip, loyal, at_risk, new, etc.)
- `individual`: Specific user IDs
- `custom`: Custom filter criteria

**Response:**
```json
{
  "success": true,
  "data": { /* created campaign */ }
}
```

### Get Campaign Details

```http
GET /api/advanced-notifications/campaigns/:campaignId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Weekend Sale",
    "template_name": "promotional_offer",
    "body_template": "Hi #{customer_name}...",
    /* ... other campaign fields ... */
  }
}
```

### Update Campaign Status

```http
PATCH /api/advanced-notifications/campaigns/:campaignId/status
```

**Request Body:**
```json
{
  "status": "paused"
}
```

**Valid Statuses:**
- `active`: Campaign is running
- `paused`: Campaign is paused
- `completed`: Campaign has finished
- `cancelled`: Campaign was cancelled

---

## Analytics

### Get Notification Analytics

```http
GET /api/advanced-notifications/tenants/:tenantId/analytics?startDate=2025-01-01&endDate=2025-01-31&channel=email
```

**Query Parameters:**
- `startDate`: Start date (ISO 8601)
- `endDate`: End date (ISO 8601)
- `channel`: Filter by channel
- `type`: Filter by notification type

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_sent": 5000,
      "total_delivered": 4850,
      "total_opened": 2425,
      "total_clicked": 485,
      "delivery_rate": "97.00",
      "open_rate": "50.00",
      "click_rate": "20.00"
    },
    "details": [
      {
        "metric_type": "sent",
        "count": "5000",
        "channel": "email"
      },
      {
        "metric_type": "delivered",
        "count": "4850",
        "channel": "email"
      },
      {
        "metric_type": "opened",
        "count": "2425",
        "channel": "email"
      },
      {
        "metric_type": "clicked",
        "count": "485",
        "channel": "email"
      }
    ]
  }
}
```

### Get Campaign Analytics

```http
GET /api/advanced-notifications/campaigns/:campaignId/analytics
```

**Response:**
```json
{
  "success": true,
  "data": {
    "campaign": {
      "id": "uuid",
      "name": "Weekend Sale",
      "status": "completed",
      "total_recipients": 1500,
      "sent_count": 1500,
      "delivered_count": 1485,
      "read_count": 742,
      "clicked_count": 148,
      "failed_count": 15
    },
    "analytics": [
      {
        "metric_type": "sent",
        "count": "1500",
        "channel": "email"
      }
    ],
    "rates": {
      "delivery_rate": "99.00",
      "open_rate": "50.00",
      "click_rate": "20.00"
    }
  }
}
```

---

## User Preferences

### Get User Preferences

```http
GET /api/notifications/preferences?tenantId=uuid
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "tenant_id": "uuid",
    "notifications_enabled": true,
    "push_enabled": true,
    "sms_enabled": false,
    "email_enabled": true,
    "whatsapp_enabled": true,
    "in_app_enabled": true,
    "transactional_enabled": true,
    "marketing_enabled": false,
    "promotional_enabled": false,
    "newsletter_enabled": false,
    "quiet_hours_enabled": true,
    "quiet_hours_start": "22:00:00",
    "quiet_hours_end": "08:00:00",
    "quiet_hours_timezone": "Asia/Kolkata",
    "language_preference": "en",
    "created_at": "2025-01-10T00:00:00Z",
    "updated_at": "2025-01-20T10:00:00Z"
  }
}
```

### Update Preferences

```http
PUT /api/notifications/preferences
```

**Request Body:**
```json
{
  "push_enabled": false,
  "email_enabled": true,
  "marketing_enabled": true,
  "quiet_hours_enabled": true,
  "quiet_hours_start": "22:00:00",
  "quiet_hours_end": "08:00:00"
}
```

---

## Export

### Export Notifications

```http
GET /api/advanced-notifications/tenants/:tenantId/export?format=csv&startDate=2025-01-01&endDate=2025-01-31
```

**Query Parameters:**
- `format`: Export format (csv, json)
- `startDate`: Start date filter
- `endDate`: End date filter

**Response (JSON):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "transactional",
      "channel": "email",
      "status": "delivered",
      "title": "Order Confirmation",
      "message": "Your order has been confirmed",
      "created_at": "2025-01-15T10:00:00Z",
      "sent_at": "2025-01-15T10:00:05Z",
      "delivered_at": "2025-01-15T10:00:10Z",
      "read_at": "2025-01-15T11:30:00Z",
      "recipient_email": "customer@example.com",
      "template_name": "order_created"
    }
  ]
}
```

**Response (CSV):**
Downloads a CSV file with notification data.

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

**Common Error Status Codes:**
- `400`: Bad Request - Invalid parameters
- `401`: Unauthorized - Missing or invalid token
- `403`: Forbidden - Insufficient permissions or feature not enabled
- `404`: Not Found - Resource not found
- `500`: Internal Server Error - Server error

---

## Feature Toggle Dependencies

Some endpoints require specific features to be enabled:

| Endpoint | Required Toggle |
|----------|----------------|
| Template CRUD | `custom_templates_enabled` |
| Template Editor | `template_editor_enabled` |
| Campaign CRUD | `campaigns_enabled` |
| Campaign Scheduling | `campaign_scheduling_enabled` |
| Campaign Automation | `campaign_automation_enabled` |
| Analytics | `analytics_enabled` |
| Export | `export_enabled` |

---

## Rate Limits

All API endpoints are subject to rate limiting:

- **General API**: 100 requests per 15 minutes
- **Authentication**: 5 attempts per 15 minutes
- **Export**: 10 requests per hour

---

## Webhook Integration

When `webhook_enabled` is true, the system can send webhooks for events:

- `notification.sent`
- `notification.delivered`
- `notification.failed`
- `campaign.started`
- `campaign.completed`
- `user.opted_out`

Webhook configuration is managed through tenant settings.

---

## Best Practices

1. **Always check feature toggles** before making requests to advanced features
2. **Use pagination** for large result sets
3. **Implement retry logic** for failed notifications
4. **Cache feature toggles** on the client side with periodic refresh
5. **Monitor rate limits** and implement backoff strategies
6. **Use templates** for consistent messaging
7. **Test campaigns** with small segments before full deployment
8. **Track analytics** to optimize campaign performance
9. **Respect user preferences** and opt-out requests
10. **Follow compliance requirements** for your region (GDPR, DPDP, etc.)

---

## Support

For questions or issues with the Notifications API, contact:
- Technical Support: support@pulss.app
- Documentation: https://docs.pulss.app/notifications
- Status Page: https://status.pulss.app
