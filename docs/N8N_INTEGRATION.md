# n8n Workflow Automation Integration

This guide explains how to integrate n8n workflow automation with the Pulss platform to automate business processes based on key events.

## Table of Contents

1. [Overview](#overview)
2. [Setup Instructions](#setup-instructions)
3. [Available Webhook Events](#available-webhook-events)
4. [Configuration](#configuration)
5. [Sample Workflows](#sample-workflows)
6. [Admin UI Guide](#admin-ui-guide)
7. [Security & Tenant Isolation](#security--tenant-isolation)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The n8n integration allows Pulss to trigger automated workflows when important events occur in your store, such as:

- New order placed
- Order status changes (accepted, packed, dispatched, delivered)
- New customer registration
- Product out of stock
- Loyalty points earned

These webhooks can trigger n8n workflows to perform actions like:
- Send email notifications
- Update external CRM systems
- Post to Slack/Discord channels
- Generate reports
- Update inventory in other systems
- Send SMS notifications

### Architecture

```
Pulss App → Event Occurs → Webhook Trigger → n8n Server → Workflow Execution
```

The integration is designed with:
- **Graceful degradation**: If n8n is unavailable, the app continues working normally
- **Tenant isolation**: Each tenant can configure their own webhooks independently
- **Async execution**: Webhooks don't block the main application flow
- **Audit logging**: All webhook calls are logged for monitoring and debugging

---

## Setup Instructions

### 1. Install n8n

You can install n8n using Docker, npm, or their cloud service.

#### Option A: Docker (Recommended)

```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

#### Option B: npm

```bash
npm install -g n8n
n8n start
```

#### Option C: n8n Cloud

Sign up at [n8n.cloud](https://n8n.cloud) for a managed instance.

### 2. Configure Pulss Backend

Update your `.env` file in the `backend` directory:

```bash
# Enable n8n integration
N8N_ENABLED=true

# n8n webhook URL (change port if needed)
N8N_WEBHOOK_URL=http://localhost:5678

# Optional: n8n API key for advanced features
N8N_API_KEY=your_api_key_here

# Webhook timeout in milliseconds (default: 5000)
N8N_TIMEOUT=5000
```

### 3. Run Database Migration

Apply the n8n tables migration:

```bash
cd backend
npm run migrate:local
# or for remote database:
# npm run migrate
```

This creates two tables:
- `n8n_workflow_triggers`: Configuration for enabled webhooks per tenant
- `n8n_webhook_logs`: Audit log of all webhook calls

### 4. Restart Backend Server

```bash
cd backend
npm run dev
```

---

## Available Webhook Events

| Event Type | Trigger | Payload Data |
|------------|---------|--------------|
| `order-placed` | New order created | order_id, order_number, customer_id, total, items_count, payment_method |
| `order-accepted` | Admin accepts order | order_id, order_number, customer_id, status, previous_status |
| `order-packed` | Order marked as packed | order_id, order_number, status, previous_status |
| `order-dispatched` | Order dispatched for delivery | order_id, order_number, tracking_number, status |
| `order-delivered` | Order delivered to customer | order_id, order_number, status, delivery_time |
| `customer-registered` | New customer signs up | customer_id, name, email, phone, loyalty_points |
| `customer-updated` | Customer profile updated | customer_id, name, email, phone |
| `product-created` | New product added | product_id, name, sku, category, price |
| `product-out-of-stock` | Product inventory reaches 0 | product_id, name, sku, category |
| `loyalty-points-earned` | Customer earns loyalty points | customer_id, order_id, points_earned, total_points |

### Webhook Payload Structure

All webhooks send a standardized payload:

```json
{
  "event": "order-placed",
  "tenant_id": "uuid-here",
  "timestamp": "2025-10-16T07:00:00.000Z",
  "data": {
    "order_id": "uuid-here",
    "order_number": "ORD-1234567890-1",
    "customer_id": "uuid-here",
    "total": 1250.50,
    "items_count": 5,
    "payment_method": "upi",
    "delivery_type": "delivery",
    "created_at": "2025-10-16T07:00:00.000Z"
  }
}
```

Additional headers:
- `X-Tenant-ID`: The tenant ID for multi-tenant isolation
- `X-N8N-API-KEY`: Optional API key for authentication (if configured)

---

## Configuration

### Enable Webhooks via Admin UI

1. Log in as admin to your store
2. Navigate to **Settings** → **Workflow Automation**
3. View the list of available webhook events
4. Toggle the switch to enable/disable specific events
5. Click **Test** to send a test webhook and verify n8n is receiving it

### Enable Webhooks via API

You can also configure webhooks programmatically:

```bash
curl -X POST http://localhost:3000/api/n8n/triggers \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "your-tenant-id",
    "event_type": "order-placed",
    "enabled": true,
    "config": {}
  }'
```

### Check n8n Health

```bash
curl -X GET http://localhost:3000/api/n8n/health \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Sample Workflows

### 1. Send Email on New Order

**n8n Workflow:**

1. **Webhook Node** - Listen for `order-placed` events
2. **Filter Node** - Optional: filter by order amount, payment method, etc.
3. **Send Email Node** - Send notification to admin

**Webhook URL:** `http://localhost:5678/webhook/order-placed`

**Example Workflow JSON:**
```json
{
  "nodes": [
    {
      "parameters": {
        "path": "order-placed",
        "responseMode": "lastNode",
        "responseData": "firstEntryJson"
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook"
    },
    {
      "parameters": {
        "fromEmail": "noreply@yourstore.com",
        "toEmail": "admin@yourstore.com",
        "subject": "=New Order: {{$json[\"data\"][\"order_number\"]}}",
        "text": "=Order Total: ₹{{$json[\"data\"][\"total\"]}}\nCustomer ID: {{$json[\"data\"][\"customer_id\"]}}"
      },
      "name": "Send Email",
      "type": "n8n-nodes-base.emailSend"
    }
  ],
  "connections": {
    "Webhook": {
      "main": [[{ "node": "Send Email", "type": "main", "index": 0 }]]
    }
  }
}
```

### 2. Update Google Sheets on Customer Registration

**n8n Workflow:**

1. **Webhook Node** - Listen for `customer-registered` events
2. **Google Sheets Node** - Append row with customer data

**Setup:**
- Create a Google Sheet with columns: Date, Name, Email, Phone, Tenant
- Connect Google Sheets credentials in n8n
- Configure "Append" operation

### 3. Slack Notification on Order Status Change

**n8n Workflow:**

1. **Webhook Node** - Listen for `order-dispatched` events
2. **Slack Node** - Post message to #orders channel

**Message Template:**
```
📦 Order Dispatched!
Order: {{$json["data"]["order_number"]}}
Customer: {{$json["data"]["customer_id"]}}
Time: {{$json["timestamp"]}}
```

### 4. Low Stock Alert

**n8n Workflow:**

1. **Webhook Node** - Listen for `product-out-of-stock` events
2. **HTTP Request Node** - Call inventory management API
3. **Conditional Node** - If product is critical
4. **Send Email Node** - Alert purchasing team

### 5. Customer Loyalty Email Campaign

**n8n Workflow:**

1. **Webhook Node** - Listen for `loyalty-points-earned` events
2. **Filter Node** - Check if points > 1000
3. **Send Email Node** - Send "VIP Customer" thank you email

---

## Admin UI Guide

### Workflow Triggers Tab

- **View all events**: See all available webhook events
- **Enable/Disable**: Toggle webhooks on or off per event
- **Test**: Send a test payload to verify n8n connectivity
- **Status Badge**: Green (healthy), Red (unhealthy), Gray (disabled)

### Webhook Logs Tab

View recent webhook activity:
- Event type
- Success/Failure status
- Timestamp
- Response time (ms)
- Error messages (if any)

Use logs to:
- Debug failing webhooks
- Monitor performance
- Verify events are being triggered

### Statistics Tab

View aggregated metrics per event type:
- Total triggers
- Successful vs Failed count
- Average response time
- Last triggered timestamp

---

## Security & Tenant Isolation

### Authentication

All webhook management endpoints require:
- Valid JWT token
- Admin or Super Admin role

### Tenant Isolation

- Each tenant can only view/manage their own webhook configurations
- Webhook logs are filtered by tenant_id
- Super admins can access all tenants

### Webhook Security

1. **API Key Authentication** (Optional):
   - Set `N8N_API_KEY` in `.env`
   - n8n can verify requests using `X-N8N-API-KEY` header

2. **Webhook URL Validation**:
   - Only valid n8n URLs are accepted
   - Custom webhook URLs can be configured per tenant

3. **Payload Sanitization**:
   - All payloads are validated before sending
   - Sensitive data (passwords, tokens) are excluded

### Rate Limiting

Consider implementing rate limiting on n8n webhooks to prevent abuse:
- Max triggers per minute per tenant
- Circuit breaker pattern if n8n is down

---

## Troubleshooting

### n8n is showing as "unhealthy"

**Possible causes:**
- n8n server is not running
- Incorrect `N8N_WEBHOOK_URL` in `.env`
- Firewall blocking connection

**Solutions:**
1. Check n8n is running: `curl http://localhost:5678/healthz`
2. Verify URL in `.env` matches n8n server
3. Check network connectivity

### Webhooks are not triggering

**Check:**
1. Is the webhook enabled in Admin UI?
2. Is `N8N_ENABLED=true` in `.env`?
3. Check webhook logs for errors
4. Verify n8n workflow is active

**Debug:**
```bash
# Check logs in backend
tail -f backend/logs/server.log

# Test webhook manually
curl -X POST http://localhost:3000/api/n8n/test \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "xxx", "event_type": "order-placed"}'
```

### High latency / Timeouts

**Solutions:**
- Increase `N8N_TIMEOUT` in `.env` (default: 5000ms)
- Optimize n8n workflows (remove slow nodes)
- Use async webhooks in n8n (don't wait for response)

### Duplicate webhook triggers

**Cause:** Multiple backend instances or retries

**Solution:**
- Implement idempotency keys in n8n workflows
- Use n8n's deduplication features

### Database migration fails

**Error:** Table already exists

**Solution:**
```bash
# Check if tables exist
psql -d pulssdb -c "SELECT * FROM n8n_workflow_triggers LIMIT 1;"

# If needed, manually run migration
psql -d pulssdb -f backend/migrations/10_create_n8n_tables.sql
```

---

## API Reference

### GET `/api/n8n/health`
Check n8n service health

**Response:**
```json
{
  "status": "healthy",
  "data": {...}
}
```

### GET `/api/n8n/events`
Get available webhook events

### GET `/api/n8n/triggers`
Get enabled triggers for tenant

### POST `/api/n8n/triggers`
Enable/disable a webhook trigger

**Body:**
```json
{
  "tenant_id": "uuid",
  "event_type": "order-placed",
  "enabled": true
}
```

### GET `/api/n8n/logs`
Get webhook logs

**Query params:** `event_type`, `success`, `limit`, `offset`

### POST `/api/n8n/test`
Test a webhook

**Body:**
```json
{
  "tenant_id": "uuid",
  "event_type": "order-placed",
  "test_data": {}
}
```

---

## Advanced Topics

### Custom Webhook URLs per Tenant

You can configure different n8n instances per tenant:

```sql
UPDATE n8n_workflow_triggers 
SET webhook_url = 'https://custom-n8n.example.com/webhook/order-placed'
WHERE tenant_id = 'xxx' AND event_type = 'order-placed';
```

### Retry Logic

Webhooks do not automatically retry. To implement retries:

1. Enable in n8n workflow (Retry node)
2. Or use a message queue (RabbitMQ, Redis)

### Performance Optimization

- Use connection pooling for database queries
- Cache webhook configurations in Redis
- Implement batch webhook sending
- Use async workers for webhook dispatch

---

## Support

For issues or questions:
- Check logs in `backend/logs/`
- Review n8n documentation: https://docs.n8n.io
- Contact Pulss support: support@pulss.app

---

**Last Updated:** October 2025
**Version:** 1.0.0
