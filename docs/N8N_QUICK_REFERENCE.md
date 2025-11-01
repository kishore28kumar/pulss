# n8n Integration - Quick Reference Card

## 📋 Quick Commands

### Start n8n (Docker)
```bash
docker run -it --rm --name n8n -p 5678:5678 -v ~/.n8n:/home/node/.n8n n8nio/n8n
```

### Enable in Pulss
```bash
# Edit backend/.env
N8N_ENABLED=true
N8N_WEBHOOK_URL=http://localhost:5678
```

### Run Migration
```bash
cd backend && npm run migrate:local
```

### Run Tests
```bash
cd backend && ./test-n8n-integration.sh
```

## 🔗 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/n8n/health` | Check n8n server status | Admin |
| GET | `/api/n8n/events` | List available webhook events | Admin |
| GET | `/api/n8n/triggers` | Get enabled webhooks for tenant | Admin |
| POST | `/api/n8n/triggers` | Enable/disable webhook | Admin |
| DELETE | `/api/n8n/triggers/:id` | Delete webhook config | Admin |
| GET | `/api/n8n/logs` | Get webhook activity logs | Admin |
| GET | `/api/n8n/stats` | Get webhook statistics | Admin |
| POST | `/api/n8n/test` | Test webhook endpoint | Admin |

## 📡 Available Webhook Events

| Event | Trigger |
|-------|---------|
| `order-placed` | New order created |
| `order-accepted` | Admin accepts order |
| `order-packed` | Order marked as packed |
| `order-dispatched` | Order sent for delivery |
| `order-delivered` | Order delivered to customer |
| `order-cancelled` | Order cancelled |
| `customer-registered` | New customer signs up |
| `customer-updated` | Customer profile updated |
| `product-created` | New product added |
| `product-out-of-stock` | Inventory reaches 0 |
| `payment-received` | Payment completed |
| `loyalty-points-earned` | Points awarded to customer |

## 🎯 Sample Webhook Payload

```json
{
  "event": "order-placed",
  "tenant_id": "uuid-here",
  "timestamp": "2025-10-16T07:00:00.000Z",
  "data": {
    "order_id": "uuid",
    "order_number": "ORD-1234567890-1",
    "customer_id": "uuid",
    "total": 1250.50,
    "items_count": 5,
    "payment_method": "upi"
  }
}
```

## 🛠️ Admin UI Access

1. Log in to admin panel
2. Go to **Workflows** tab
3. Enable/disable events
4. View logs and statistics
5. Test webhooks

## 🚨 Troubleshooting

### n8n shows "unhealthy"
```bash
# Check n8n is running
curl http://localhost:5678/healthz

# Verify URL in .env
grep N8N_WEBHOOK_URL backend/.env
```

### Webhooks not triggering
```bash
# Check if enabled
curl http://localhost:3000/api/n8n/triggers \
  -H "Authorization: Bearer TOKEN"

# Test manually
curl -X POST http://localhost:3000/api/n8n/test \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id":"xxx","event_type":"order-placed"}'
```

### View logs
```bash
# Database logs
psql -d pulssdb -c "SELECT * FROM n8n_webhook_logs ORDER BY triggered_at DESC LIMIT 10;"

# Application logs
tail -f backend/logs/server.log
```

## 📚 Documentation

- **Full Guide**: `docs/N8N_INTEGRATION.md`
- **Quick Start**: `docs/N8N_QUICK_START.md`
- **Implementation**: `docs/N8N_IMPLEMENTATION_SUMMARY.md`
- **n8n Docs**: https://docs.n8n.io

## 🔐 Security Checklist

- ✅ JWT authentication on all endpoints
- ✅ Tenant isolation enforced
- ✅ Admin-only access
- ✅ Payload sanitization
- ✅ Graceful error handling
- ✅ Audit logging enabled

## 🧪 Test Suite

Run all tests:
```bash
cd backend
./test-n8n-integration.sh
```

Expected output: `All tests passed! ✓`

## 📊 Database Tables

### n8n_workflow_triggers
- Stores webhook configuration per tenant/event
- Columns: tenant_id, event_type, enabled, webhook_url, config

### n8n_webhook_logs
- Audit log of all webhook triggers
- Columns: tenant_id, event_type, payload, response, success, triggered_at

---

**Need Help?** See full documentation or run the test suite.
