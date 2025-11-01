# Developer Portal Setup Guide

## Overview

This guide walks through setting up and customizing the Pulss Developer Portal, a comprehensive documentation and API management interface for developers integrating with your platform.

## Prerequisites

- Pulss Platform installed and running
- PostgreSQL database accessible
- Super admin access
- Node.js 18+ and npm

## Quick Start

### 1. Run Database Migration

```bash
cd backend
psql $DATABASE_URL -f migrations/11_api_management_system.sql
```

This creates all necessary tables for:
- API keys and authentication
- Webhooks and delivery tracking
- OAuth 2.0 applications
- API documentation content
- Usage analytics

### 2. Seed Initial Documentation

The migration includes sample documentation. To add more content:

```bash
# Using psql
psql $DATABASE_URL <<EOF
INSERT INTO api_documentation (slug, title, category, content, description, code_samples)
VALUES (
  'custom-guide',
  'Custom Integration Guide',
  'guides',
  '# Custom Integration\n\nYour content here...',
  'Learn how to integrate custom features',
  '{"curl": "curl example...", "javascript": "fetch example..."}'::jsonb
);
EOF
```

### 3. Configure Environment Variables

Add to your `.env` file:

```bash
# API Management
API_ENABLED=true
API_DOCS_URL=https://developers.yourdomain.com
API_BASE_URL=https://api.yourdomain.com

# JWT Secret (for OAuth)
JWT_SECRET=your-secure-secret-here

# Webhook Settings
WEBHOOK_TIMEOUT_SECONDS=30
WEBHOOK_RETRY_ATTEMPTS=3

# Rate Limiting Defaults
DEFAULT_RATE_LIMIT_HOUR=1000
DEFAULT_RATE_LIMIT_DAY=10000
DEFAULT_RATE_LIMIT_MONTH=100000
```

### 4. Start the Server

```bash
cd backend
npm start
```

The API management endpoints will be available at:
- API Management: `http://localhost:3000/api/api-management/*`
- Documentation: `http://localhost:3000/api/api-management/docs`
- Changelog: `http://localhost:3000/api/api-management/changelog`

### 5. Access the Frontend

```bash
cd .. # Back to root
npm run dev
```

Access the developer portal at:
- Local: `http://localhost:5173/developer-portal`
- Production: `https://yourdomain.com/developer-portal`

## Configuration

### Super Admin Setup

1. **Enable API Features for Tenants**

   Navigate to: Super Admin → API Management → Tenant Settings

   For each tenant:
   - Enable API Access
   - Enable API Documentation
   - Enable API Key Management
   - Set max API keys limit
   - Configure rate limits

2. **Configure Global Settings**

   Navigate to: Super Admin → API Management → Global Settings

   Set:
   - Default rate limits for new tenants
   - Maximum API keys/webhooks per tenant
   - Maintenance mode settings

### Tenant Setup

1. **Generate First API Key**

   Navigate to: Dashboard → API Management → API Keys

   Click "Create API Key" and configure:
   - Name and description
   - Environment (production/staging/development)
   - Permissions/scopes
   - Rate limits
   - Expiration

   **Save the key securely** - it's only shown once!

2. **Set Up Webhooks (if enabled)**

   Navigate to: Dashboard → API Management → Webhooks

   Click "Create Webhook" and configure:
   - Endpoint URL
   - Events to subscribe to
   - Retry settings
   - Test your webhook

## Customization

### Branding the Developer Portal

#### 1. Update Logo and Colors

Edit `src/components/DeveloperPortal.tsx`:

```typescript
// Change header
<h1 className="text-3xl font-bold">
  Your Company API
</h1>

// Update primary color in Tailwind config
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#your-color',
          // ...
        }
      }
    }
  }
}
```

#### 2. Custom Documentation Structure

Add custom documentation categories:

```sql
-- Add custom category
INSERT INTO api_documentation (slug, title, category, content, order_index)
VALUES 
  ('industry-specific', 'Industry Guides', 'industry', '# Industry Guides', 1),
  ('pharmacy-guide', 'Pharmacy Integration', 'industry', '# Pharmacy...', 1),
  ('grocery-guide', 'Grocery Integration', 'industry', '# Grocery...', 2);
```

Update the frontend to display new categories:

```typescript
// In DeveloperPortal.tsx
const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'industry':
      return <Building className="h-4 w-4" />
    // ... other cases
  }
}
```

#### 3. Add Custom Code Samples

When creating documentation, include code samples in multiple languages:

```javascript
const codeSamples = {
  curl: `curl -X GET https://api.pulss.com/api/products \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
  
  javascript: `const response = await fetch('https://api.pulss.com/api/products', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
});
const data = await response.json();`,
  
  python: `import requests

response = requests.get(
    'https://api.pulss.com/api/products',
    headers={'Authorization': 'Bearer YOUR_API_KEY'}
)
data = response.json()`,
  
  php: `<?php
$ch = curl_init('https://api.pulss.com/api/products');
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer YOUR_API_KEY'
]);
$response = curl_exec($ch);
curl_close($ch);`
};
```

### Adding Custom Pages

#### 1. Create New Documentation Page

```javascript
// Via API (Super Admin)
const createPage = async () => {
  await fetch('/api/api-management/docs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${superAdminToken}`
    },
    body: JSON.stringify({
      slug: 'custom-integration',
      title: 'Custom Integration Guide',
      category: 'guides',
      description: 'Step-by-step custom integration',
      content: `
# Custom Integration Guide

## Overview
This guide covers...

## Prerequisites
- API Key
- Development environment

## Steps

### 1. Setup
...

### 2. Authentication
...

### 3. First Request
...
      `,
      code_samples: {
        curl: '...',
        javascript: '...',
        python: '...'
      },
      order_index: 10
    })
  });
};
```

#### 2. Add Navigation Links

Update `DeveloperPortal.tsx` to add custom navigation:

```typescript
<Tabs defaultValue="documentation">
  <TabsList>
    {/* Existing tabs */}
    <TabsTrigger value="custom">
      <Star className="h-4 w-4 mr-2" />
      Custom Guide
    </TabsTrigger>
  </TabsList>
  
  <TabsContent value="custom">
    {/* Your custom content */}
  </TabsContent>
</Tabs>
```

### Webhook Configuration

#### Adding New Events

1. **Define Event Type**

```javascript
// backend/utils/webhookEvents.js
export const WEBHOOK_EVENTS = {
  // Existing events
  ORDER_CREATED: 'order.created',
  ORDER_UPDATED: 'order.updated',
  
  // Add new events
  PRODUCT_OUT_OF_STOCK: 'product.out_of_stock',
  CUSTOMER_MILESTONE: 'customer.milestone_reached'
};
```

2. **Trigger Event in Code**

```javascript
// In your controller
const { triggerWebhookEvent } = require('../controllers/webhooksController');

// When product runs out of stock
if (product.stock === 0) {
  await triggerWebhookEvent(
    req.user.tenant_id,
    WEBHOOK_EVENTS.PRODUCT_OUT_OF_STOCK,
    {
      product_id: product.id,
      product_name: product.name,
      last_sale_at: new Date(),
      reorder_suggested: true
    }
  );
}
```

3. **Document the Event**

Add to documentation:

```markdown
## Product Events

### product.out_of_stock

Triggered when a product's stock reaches zero.

**Payload:**
```json
{
  "event": "product.out_of_stock",
  "data": {
    "product_id": "uuid",
    "product_name": "Product Name",
    "last_sale_at": "2025-10-20T12:00:00Z",
    "reorder_suggested": true
  }
}
```
```

### OAuth 2.0 Configuration

#### 1. Enable OAuth for Tenant

```javascript
// Via Super Admin API
const enableOAuth = async (tenantId) => {
  await fetch(`/api/api-management/feature-flags/${tenantId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${superAdminToken}`
    },
    body: JSON.stringify({
      oauth_enabled: true
    })
  });
};
```

#### 2. Create OAuth Application

Tenants can create OAuth apps from the dashboard:

```javascript
const createApp = async () => {
  const response = await fetch('/api/api-management/oauth/applications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tenantToken}`
    },
    body: JSON.stringify({
      name: 'My Third-Party App',
      description: 'Integration with external service',
      redirect_uris: ['https://myapp.com/callback'],
      allowed_scopes: ['read:products', 'read:orders']
    })
  });
  
  const data = await response.json();
  // Save client_id and client_secret
};
```

## Testing

### Test API Keys

```bash
# Create test API key
curl -X POST http://localhost:3000/api/api-management/keys \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "key_name": "Test Key",
    "scopes": ["read:products"],
    "environment": "development"
  }'

# Test API key
curl -X GET http://localhost:3000/api/products \
  -H "Authorization: Bearer TEST_API_KEY"
```

### Test Webhooks

```bash
# Create webhook
curl -X POST http://localhost:3000/api/api-management/webhooks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "name": "Test Webhook",
    "url": "https://webhook.site/unique-url",
    "events": ["order.created"]
  }'

# Test webhook delivery
curl -X POST http://localhost:3000/api/api-management/webhooks/WEBHOOK_ID/test \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Test OAuth Flow

1. Open authorization URL:
```
http://localhost:3000/api/api-management/oauth/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&response_type=code&scope=read:products
```

2. Approve consent

3. Exchange code for token:
```bash
curl -X POST http://localhost:3000/api/api-management/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "authorization_code",
    "code": "AUTH_CODE",
    "redirect_uri": "REDIRECT_URI",
    "client_id": "CLIENT_ID",
    "client_secret": "CLIENT_SECRET"
  }'
```

## Deployment

### Production Considerations

1. **Use HTTPS**
   - All API endpoints must use HTTPS
   - Webhook URLs must be HTTPS
   - OAuth redirect URIs must be HTTPS

2. **Secure Secrets**
   - Use environment variables for JWT_SECRET
   - Never commit secrets to version control
   - Rotate secrets regularly

3. **Database**
   - Enable PostgreSQL connection pooling
   - Set up read replicas for analytics
   - Configure automated backups

4. **Monitoring**
   - Set up logging for API requests
   - Monitor rate limit hits
   - Track webhook delivery rates
   - Alert on error spikes

5. **CDN**
   - Serve documentation through CDN
   - Cache API documentation
   - Reduce latency for global users

### Nginx Configuration

```nginx
# API Management endpoints
location /api/api-management/ {
    proxy_pass http://localhost:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # Increase timeout for webhook testing
    proxy_read_timeout 60s;
}

# Developer Portal (static)
location /developer-portal {
    alias /var/www/pulss/dist;
    try_files $uri $uri/ /index.html;
}
```

## Maintenance

### Regular Tasks

**Daily:**
- Monitor API usage
- Check webhook delivery rates
- Review error logs

**Weekly:**
- Review API key usage
- Check for expiring keys
- Update documentation if needed

**Monthly:**
- Rotate secrets if necessary
- Review and update rate limits
- Analyze usage patterns
- Generate billing reports

### Database Maintenance

```sql
-- Clean up old usage logs (keep 90 days)
DELETE FROM api_usage_logs 
WHERE timestamp < NOW() - INTERVAL '90 days';

-- Clean up expired rate limit windows
DELETE FROM api_rate_limits 
WHERE window_start < NOW() - INTERVAL '2 days';

-- Vacuum tables
VACUUM ANALYZE api_usage_logs;
VACUUM ANALYZE api_rate_limits;
```

### Monitoring Queries

```sql
-- Top API consumers today
SELECT tenant_id, COUNT(*) as requests
FROM api_usage_logs
WHERE timestamp >= CURRENT_DATE
GROUP BY tenant_id
ORDER BY requests DESC
LIMIT 10;

-- Failed webhook deliveries last hour
SELECT webhook_id, COUNT(*) as failures
FROM webhook_deliveries
WHERE status = 'failed' 
  AND created_at >= NOW() - INTERVAL '1 hour'
GROUP BY webhook_id;

-- Rate limit hits today
SELECT api_key_id, window_type, MAX(request_count) as max_requests
FROM api_rate_limits
WHERE window_start >= CURRENT_DATE
GROUP BY api_key_id, window_type
HAVING MAX(request_count) > 900; -- Near limit
```

## Troubleshooting

### Common Issues

**Issue: API key not working**
- Verify key is active: `SELECT is_active FROM api_keys WHERE id = ?`
- Check expiration: `SELECT expires_at FROM api_keys WHERE id = ?`
- Verify scopes match endpoint requirements

**Issue: Webhooks not delivering**
- Check webhook is active
- Verify URL is accessible (try curl)
- Check webhook delivery logs for errors
- Verify HTTPS certificate is valid

**Issue: Rate limit errors**
- Check current usage: `SELECT * FROM api_rate_limits WHERE api_key_id = ?`
- Review rate limit settings
- Consider increasing limits for tenant

**Issue: OAuth authorization fails**
- Verify redirect URI matches exactly
- Check client credentials
- Verify scopes are allowed for application

## Support

### Getting Help

- **Documentation:** This guide and API_MANAGEMENT_GUIDE.md
- **Architecture:** See API_MANAGEMENT_ARCHITECTURE.md
- **Issues:** Open issue on GitHub
- **Email:** support@pulss.com

### Contributing

To contribute documentation:

1. Edit markdown files or add new pages via API
2. Test changes locally
3. Submit pull request with description
4. Super admin approves and publishes

---

**Version:** 1.0.0  
**Last Updated:** October 2025
