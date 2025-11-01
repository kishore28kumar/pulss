# 🔄 n8n Workflow Automation Integration

> **Automate your Pulss store with powerful workflows**

The n8n integration allows you to trigger automated workflows when important events occur in your store - like sending emails when orders are placed, updating your CRM when customers register, or posting to Slack when inventory runs low.

---

## 🚀 Quick Start (3 Steps)

### 1️⃣ Start n8n Server

**Using Docker (Recommended):**
```bash
docker run -d --name n8n -p 5678:5678 -v ~/.n8n:/home/node/.n8n n8nio/n8n
```

**Using npm:**
```bash
npm install -g n8n
n8n start
```

Open http://localhost:5678 to access n8n UI.

### 2️⃣ Configure Pulss

Edit `backend/.env`:
```env
N8N_ENABLED=true
N8N_WEBHOOK_URL=http://localhost:5678
```

Run database migration:
```bash
cd backend
npm run migrate:local
```

### 3️⃣ Enable Webhooks

1. Log in to Pulss admin panel
2. Click **Workflows** tab
3. Toggle ON the events you want to automate
4. Click **Test** to verify connectivity

**That's it!** Your workflows are now active. 🎉

---

## 📚 What You Can Automate

### Order Events
- 📦 **Order Placed** - When a customer places an order
- ✅ **Order Accepted** - When admin accepts the order
- 📋 **Order Packed** - When order is packed and ready
- 🚚 **Order Dispatched** - When order is sent for delivery
- ✅ **Order Delivered** - When order reaches customer

### Customer Events
- 👤 **Customer Registered** - When new customer signs up
- ✏️ **Customer Updated** - When customer updates profile

### Inventory Events
- 📦 **Product Created** - When new product is added
- ⚠️ **Product Out of Stock** - When inventory reaches zero

### Loyalty Events
- ⭐ **Loyalty Points Earned** - When customer earns points

---

## 💡 Example Workflows

### Send Email on New Order

**In n8n:**
1. Add **Webhook** node → Set path: `order-placed`
2. Add **Send Email** node → Configure email settings
3. Activate workflow

**In Pulss:**
- Enable "Order Placed" webhook
- Test with the Test button

**Result:** Automatic emails sent for every new order! 📧

### Post to Slack on Low Stock

**In n8n:**
1. Add **Webhook** node → Path: `product-out-of-stock`
2. Add **Slack** node → Select channel
3. Format message with product details

**Result:** Real-time Slack alerts when products run out! 💬

### Update Google Sheets with Customer Data

**In n8n:**
1. Add **Webhook** node → Path: `customer-registered`
2. Add **Google Sheets** node → Append row
3. Map customer fields to columns

**Result:** Automatic CRM updates! 📊

---

## 🎛️ Admin UI Features

### Workflow Triggers Tab
- View all 12 available webhook events
- Enable/disable with toggle switches
- Test webhooks with one click
- Health status indicator

### Webhook Logs Tab
- Recent webhook activity
- Success/failure status
- Response times
- Error messages for debugging

### Statistics Tab
- Total triggers per event
- Success rate
- Average response time
- Last triggered timestamp

---

## 🔒 Security & Isolation

- ✅ **JWT Authentication** - All endpoints require valid auth token
- ✅ **Tenant Isolation** - Each store manages only their webhooks
- ✅ **Role-Based Access** - Admin and Super Admin only
- ✅ **Audit Logging** - All webhook calls are logged
- ✅ **Graceful Degradation** - App works even if n8n is down

---

## 🧪 Testing

Run the automated test suite:
```bash
cd backend
./test-n8n-integration.sh
```

Expected output:
```
================================================
All tests passed! ✓
================================================
```

Test individual webhook:
```bash
curl -X POST http://localhost:3000/api/n8n/test \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "your-tenant-id",
    "event_type": "order-placed",
    "test_data": {"message": "Test webhook"}
  }'
```

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [N8N_INTEGRATION.md](docs/N8N_INTEGRATION.md) | Complete integration guide (350+ lines) |
| [N8N_QUICK_START.md](docs/N8N_QUICK_START.md) | 5-minute quick start guide |
| [N8N_IMPLEMENTATION_SUMMARY.md](docs/N8N_IMPLEMENTATION_SUMMARY.md) | Technical implementation details |
| [N8N_QUICK_REFERENCE.md](docs/N8N_QUICK_REFERENCE.md) | Quick reference card |

---

## 🛠️ Configuration

### Environment Variables

```env
# Enable/disable n8n integration
N8N_ENABLED=true

# n8n server URL
N8N_WEBHOOK_URL=http://localhost:5678

# Optional: API key for authentication
N8N_API_KEY=your_api_key

# Webhook timeout (milliseconds)
N8N_TIMEOUT=5000
```

### Database Tables

**n8n_workflow_triggers** - Webhook configuration
- Stores enabled/disabled state per tenant and event type
- Custom webhook URLs supported

**n8n_webhook_logs** - Activity audit log
- Complete webhook payload
- Response data
- Success/failure status
- Response time

---

## 🚨 Troubleshooting

### Problem: n8n shows as "unhealthy"

**Solution:**
```bash
# 1. Check if n8n is running
curl http://localhost:5678/healthz

# 2. Verify configuration
grep N8N_WEBHOOK_URL backend/.env

# 3. Restart n8n
docker restart n8n
```

### Problem: Webhooks not triggering

**Check:**
1. Is webhook enabled in Admin UI?
2. Is `N8N_ENABLED=true` in `.env`?
3. Is n8n workflow active?

**Debug:**
```bash
# View webhook logs
psql -d pulssdb -c "
  SELECT event_type, success, error_message, triggered_at 
  FROM n8n_webhook_logs 
  ORDER BY triggered_at DESC 
  LIMIT 10;
"
```

### Problem: Slow webhook responses

**Solutions:**
- Increase `N8N_TIMEOUT` in `.env`
- Optimize n8n workflows
- Use async webhooks (respond immediately)

---

## 📊 API Reference

### GET `/api/n8n/health`
Check n8n server health status

**Response:**
```json
{
  "status": "healthy",
  "data": {...}
}
```

### POST `/api/n8n/triggers`
Enable/disable webhook for tenant

**Request:**
```json
{
  "tenant_id": "uuid",
  "event_type": "order-placed",
  "enabled": true
}
```

### GET `/api/n8n/logs`
Get webhook activity logs

**Query params:** `event_type`, `success`, `limit`, `offset`

---

## 🎯 Best Practices

1. **Start Simple** - Enable one webhook at a time
2. **Test First** - Use Test button before going live
3. **Monitor Logs** - Check webhook logs regularly
4. **Handle Failures** - Add error handling in n8n workflows
5. **Secure API Keys** - Keep n8n API key secret
6. **Use Async Webhooks** - Don't wait for long-running workflows

---

## 🤝 Support

- 📖 Full documentation in `docs/` folder
- 🧪 Run test suite: `backend/test-n8n-integration.sh`
- 🌐 n8n community: https://community.n8n.io
- 📧 Pulss support: support@pulss.app

---

## ✨ What's Next?

After setup, try these popular use cases:

1. **Email Notifications** - Send order confirmations
2. **SMS Alerts** - Notify customers of status changes
3. **CRM Integration** - Sync customer data to Salesforce/HubSpot
4. **Inventory Management** - Auto-reorder low stock items
5. **Analytics** - Push events to Google Analytics
6. **Social Media** - Share new products on social channels

**Happy Automating!** 🚀

---

**Version:** 1.0.0  
**Last Updated:** October 2025  
**Status:** Production Ready ✅
