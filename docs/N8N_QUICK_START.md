# n8n Workflow Automation - Quick Start

This is a quick reference for the n8n workflow automation integration in Pulss.

## What is n8n?

n8n is a free and open-source workflow automation tool that allows you to connect different services and automate tasks. Think of it as IFTTT or Zapier, but self-hosted and more powerful.

## Why integrate n8n with Pulss?

With n8n, you can automatically:
- 📧 Send email notifications when orders are placed
- 💬 Post to Slack when inventory is low
- 📊 Update Google Sheets with customer data
- 📱 Send SMS alerts for order updates
- 🔄 Sync data with your CRM
- And much more!

## Quick Setup (5 minutes)

### 1. Start n8n

```bash
# Using Docker (recommended)
docker run -it --rm --name n8n -p 5678:5678 -v ~/.n8n:/home/node/.n8n n8nio/n8n

# Or using npm
npm install -g n8n
n8n start
```

### 2. Enable in Pulss

Edit `backend/.env`:
```env
N8N_ENABLED=true
N8N_WEBHOOK_URL=http://localhost:5678
```

### 3. Run Migration

```bash
cd backend
npm run migrate:local
```

### 4. Access Admin UI

1. Log in to your Pulss admin panel
2. Go to **Workflows** tab
3. Toggle on the events you want to automate
4. Click **Test** to verify it's working

## Example: Email on New Order

1. **In n8n** (http://localhost:5678):
   - Create new workflow
   - Add "Webhook" node
   - Set path: `order-placed`
   - Add "Send Email" node
   - Configure email settings
   - Activate workflow

2. **In Pulss Admin**:
   - Go to Workflows tab
   - Enable "Order Placed" webhook
   - Click Test button

3. **Done!** Now emails will be sent automatically when orders are placed.

## Available Webhook Events

| Event | When it triggers |
|-------|-----------------|
| order-placed | New order is created |
| order-accepted | Admin accepts an order |
| order-dispatched | Order is shipped |
| order-delivered | Order is delivered |
| customer-registered | New customer signs up |
| product-out-of-stock | Product inventory reaches 0 |

## Documentation

- **Full Guide**: [docs/N8N_INTEGRATION.md](./N8N_INTEGRATION.md)
- **n8n Docs**: https://docs.n8n.io
- **Sample Workflows**: See docs/N8N_INTEGRATION.md#sample-workflows

## Troubleshooting

**n8n shows as "unhealthy"**
- Check n8n is running: `curl http://localhost:5678/healthz`
- Verify `N8N_WEBHOOK_URL` in `.env`

**Webhooks not triggering**
- Enable the webhook in Admin UI
- Check logs: `tail -f backend/logs/server.log`
- Click "Test" button to verify connectivity

## Support

Need help? Check the [full documentation](./N8N_INTEGRATION.md) or contact support.
