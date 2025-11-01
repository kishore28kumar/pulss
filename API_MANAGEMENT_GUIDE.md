# Advanced API Management and Developer Portal Guide

## Overview

The Pulss Platform includes a comprehensive API management system with developer portal, enabling programmatic access to all platform features. This system includes API key management, webhooks, OAuth 2.0, usage analytics, and complete documentation.

## Table of Contents

1. [Architecture](#architecture)
2. [Getting Started](#getting-started)
3. [API Key Management](#api-key-management)
4. [Webhooks](#webhooks)
5. [OAuth 2.0](#oauth-20)
6. [Developer Portal](#developer-portal)
7. [Super Admin Controls](#super-admin-controls)
8. [Rate Limiting](#rate-limiting)
9. [Usage Analytics](#usage-analytics)
10. [Security](#security)
11. [Extending the System](#extending-the-system)

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Pulss API Management                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   API Keys   │  │   Webhooks   │  │   OAuth 2.0  │      │
│  │              │  │              │  │              │      │
│  │ • Generation │  │ • Subscribe  │  │ • Apps       │      │
│  │ • Revocation │  │ • Delivery   │  │ • Authorize  │      │
│  │ • Permissions│  │ • Retry      │  │ • Tokens     │      │
│  │ • Rate Limit │  │ • Logs       │  │ • PKCE       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Usage Analytics & Logging                │  │
│  │                                                        │  │
│  │  • Request tracking  • Response times  • Errors      │  │
│  │  • Per-tenant stats  • Billing data   • Alerts       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                 Developer Portal                       │  │
│  │                                                        │  │
│  │  • Documentation  • API Reference  • Changelog        │  │
│  │  • Quick Start    • Code Samples   • Search           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          Super Admin Feature Toggles                   │  │
│  │                                                        │  │
│  │  • Per-tenant controls  • Global settings             │  │
│  │  • Endpoint access     • Maintenance mode             │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Database Schema

#### Core Tables

1. **api_keys** - API key storage with permissions
2. **api_usage_logs** - Request tracking and analytics
3. **api_rate_limits** - Rate limiting counters
4. **webhooks** - Webhook subscriptions
5. **webhook_deliveries** - Delivery logs
6. **oauth_applications** - OAuth 2.0 apps
7. **oauth_authorization_codes** - Authorization codes
8. **oauth_access_tokens** - Access and refresh tokens
9. **api_feature_flags** - Per-tenant feature toggles
10. **global_api_settings** - Platform-wide settings
11. **api_documentation** - Documentation content
12. **api_changelog** - Version changelog

---

## Getting Started

### For Tenant Admins

1. **Enable API Access** (Super admin must enable this for your tenant)
2. **Generate an API Key**
   - Navigate to Dashboard → API Management → API Keys
   - Click "Create API Key"
   - Configure permissions and rate limits
   - **Save the key securely** - it's only shown once!

3. **Make Your First Request**
   ```bash
   curl -X GET https://api.pulss.com/api/products \
     -H "Authorization: Bearer YOUR_API_KEY"
   ```

### For Super Admins

1. **Enable API Features for Tenant**
   - Go to Super Admin → API Management
   - Select tenant
   - Enable desired features (API keys, webhooks, OAuth, etc.)
   - Set rate limits and quotas
   - Save settings

2. **Monitor Usage**
   - View tenant API usage in Analytics dashboard
   - Set up usage alerts
   - Configure billing if needed

---

## API Key Management

### Creating API Keys

API keys provide the simplest authentication method for accessing the Pulss API.

**Features:**
- Scope-based permissions
- Per-key rate limiting
- Usage tracking
- Expiration dates
- Environment tags (production, staging, development)

### Permissions and Scopes

Available scopes:
- `read:products` - Read product catalog
- `write:products` - Create/update products
- `read:orders` - Read order data
- `write:orders` - Create/update orders
- `read:customers` - Read customer data
- `write:customers` - Create/update customers
- `read:analytics` - Access analytics data

### Example: Creating an API Key

```javascript
// Frontend (React)
const createApiKey = async () => {
  const response = await fetch('/api/api-management/keys', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify({
      key_name: 'Production Integration',
      description: 'Key for production app integration',
      scopes: ['read:products', 'read:orders', 'write:orders'],
      permissions: {
        products: ['read'],
        orders: ['read', 'write']
      },
      rate_limit_per_hour: 1000,
      rate_limit_per_day: 10000,
      expires_in_days: 365,
      environment: 'production'
    })
  });
  
  const data = await response.json();
  // data.data.api_key contains the full key - save it securely!
  console.log('API Key:', data.data.api_key);
};
```

### Best Practices

1. **Never commit API keys to version control**
2. **Use environment-specific keys** (separate for dev, staging, prod)
3. **Rotate keys periodically** (every 90-180 days)
4. **Use minimal permissions** (principle of least privilege)
5. **Monitor key usage** regularly
6. **Revoke compromised keys** immediately

---

## Webhooks

### Overview

Webhooks enable real-time event notifications. When events occur (order created, customer updated, etc.), Pulss sends HTTP POST requests to your configured endpoints.

### Supported Events

- **Order Events**
  - `order.created` - New order placed
  - `order.updated` - Order status changed
  - `order.cancelled` - Order cancelled
  
- **Customer Events**
  - `customer.created` - New customer signed up
  - `customer.updated` - Customer details changed
  
- **Product Events**
  - `product.created` - New product added
  - `product.updated` - Product details changed
  - `product.inventory_low` - Stock below threshold

### Creating a Webhook

```javascript
const createWebhook = async () => {
  const response = await fetch('/api/api-management/webhooks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify({
      name: 'Order Notifications',
      url: 'https://your-app.com/webhooks/pulss',
      description: 'Receive order notifications',
      events: ['order.created', 'order.updated'],
      retry_attempts: 3,
      timeout_seconds: 30
    })
  });
  
  const data = await response.json();
  // Save the webhook secret for signature verification
  console.log('Webhook Secret:', data.data.secret);
};
```

### Webhook Payload Structure

```json
{
  "event": "order.created",
  "data": {
    "order_id": "uuid",
    "customer_id": "uuid",
    "total_amount": 1250.00,
    "status": "pending",
    "items": [...],
    "created_at": "2025-10-20T12:00:00Z"
  },
  "tenant_id": "uuid",
  "timestamp": "2025-10-20T12:00:00Z"
}
```

### Verifying Webhook Signatures

Always verify webhook signatures to ensure authenticity:

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, timestamp, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${JSON.stringify(payload)}`)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Express.js example
app.post('/webhooks/pulss', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const timestamp = req.headers['x-webhook-timestamp'];
  const payload = req.body;
  
  if (!verifyWebhookSignature(payload, signature, timestamp, WEBHOOK_SECRET)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Process webhook
  console.log('Received event:', payload.event);
  
  res.json({ received: true });
});
```

### Testing Webhooks

Use the Test button in the webhook management UI to send a test payload:

```bash
# Or use the API
curl -X POST https://api.pulss.com/api/api-management/webhooks/{id}/test \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Retry Logic

Failed webhooks are automatically retried:
- Retry 1: Immediate
- Retry 2: After 1 minute
- Retry 3: After 5 minutes
- Retry 4: After 15 minutes

---

## OAuth 2.0

### Overview

OAuth 2.0 enables secure third-party access to customer data without sharing passwords.

### Creating an OAuth Application

```javascript
const createOAuthApp = async () => {
  const response = await fetch('/api/api-management/oauth/applications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify({
      name: 'My Integration App',
      description: 'Third-party integration',
      redirect_uris: ['https://myapp.com/callback'],
      allowed_scopes: ['read:products', 'read:orders'],
      logo_url: 'https://myapp.com/logo.png',
      website_url: 'https://myapp.com'
    })
  });
  
  const data = await response.json();
  console.log('Client ID:', data.data.client_id);
  console.log('Client Secret:', data.data.client_secret); // Save securely!
};
```

### Authorization Flow

1. **Redirect user to authorization URL**
   ```
   GET /api/api-management/oauth/authorize
     ?client_id=CLIENT_ID
     &redirect_uri=REDIRECT_URI
     &response_type=code
     &scope=read:products read:orders
     &state=RANDOM_STATE
     &code_challenge=CHALLENGE
     &code_challenge_method=S256
   ```

2. **User grants permission**
   - User sees consent screen
   - Approves requested permissions

3. **Receive authorization code**
   ```
   https://myapp.com/callback?code=AUTH_CODE&state=RANDOM_STATE
   ```

4. **Exchange code for access token**
   ```javascript
   const getAccessToken = async (code) => {
     const response = await fetch('/api/api-management/oauth/token', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         grant_type: 'authorization_code',
         code: code,
         redirect_uri: 'https://myapp.com/callback',
         client_id: CLIENT_ID,
         client_secret: CLIENT_SECRET,
         code_verifier: CODE_VERIFIER
       })
     });
     
     const data = await response.json();
     return data.access_token;
   };
   ```

5. **Use access token for API requests**
   ```javascript
   const response = await fetch('/api/products', {
     headers: {
       'Authorization': `Bearer ${accessToken}`
     }
   });
   ```

### PKCE (Proof Key for Code Exchange)

For mobile and single-page apps, use PKCE:

```javascript
// 1. Generate code verifier
const codeVerifier = generateRandomString(128);

// 2. Create code challenge
const codeChallenge = base64url(sha256(codeVerifier));

// 3. Include in authorization request
const authUrl = `/oauth/authorize?code_challenge=${codeChallenge}&code_challenge_method=S256`;

// 4. Include verifier when exchanging code
const tokenData = await exchangeCodeForToken(code, codeVerifier);
```

---

## Developer Portal

### Accessing Documentation

The developer portal is available at:
- **Public:** `https://developers.pulss.com`
- **Tenant-specific:** `https://your-subdomain.pulss.com/docs`

### Documentation Structure

1. **Getting Started**
   - Quick start guide
   - Authentication
   - Rate limiting

2. **API Reference**
   - All endpoints
   - Request/response examples
   - Error codes

3. **Guides**
   - Webhooks setup
   - OAuth integration
   - Best practices

4. **Changelog**
   - Version history
   - Breaking changes
   - New features

### Code Samples

Documentation includes code samples in multiple languages:
- cURL
- JavaScript (Node.js)
- Python
- PHP
- Ruby

---

## Super Admin Controls

### Feature Toggles

Super admins can control API features per tenant:

**Core Features:**
- API Access (on/off)
- API Documentation Access
- API Key Management (+ max count)

**Endpoint Access:**
- Users API
- Billing API
- Notifications API
- Branding API
- Audit Log API

**Advanced Features:**
- Webhooks (+ max count)
- OAuth 2.0
- Partner Integrations
- App Store

**Analytics & Billing:**
- API Analytics
- API Billing
- Usage Alerts

### Global Settings

**Default Settings for New Tenants:**
- Default rate limits
- API enabled by default

**Platform-Wide Limits:**
- Max API keys per tenant
- Max webhooks per tenant
- Max OAuth apps per tenant

**Maintenance Mode:**
- Disable all API access
- Custom maintenance message

### Managing Tenant Features

```javascript
// Enable webhooks for a tenant
const enableWebhooks = async (tenantId) => {
  await fetch(`/api/api-management/feature-flags/${tenantId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${superAdminToken}`
    },
    body: JSON.stringify({
      webhooks_enabled: true,
      webhooks_max_count: 10
    })
  });
};
```

---

## Rate Limiting

### Default Limits

Per API key:
- **Hourly:** 1,000 requests
- **Daily:** 10,000 requests
- **Monthly:** 100,000 requests

### Rate Limit Headers

Every API response includes rate limit information:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640000000
```

### Handling Rate Limits

```javascript
const makeApiRequest = async (url) => {
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });
  
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    console.log(`Rate limit exceeded. Retry after ${retryAfter} seconds`);
    
    // Wait and retry
    await sleep(retryAfter * 1000);
    return makeApiRequest(url);
  }
  
  return response.json();
};
```

### Custom Rate Limits

Super admins can configure custom rate limits per tenant using the rate limit multiplier:
- `1.0` = default limits
- `2.0` = 2x limits
- `0.5` = half limits

---

## Usage Analytics

### Viewing Analytics

**Tenant View:**
- Dashboard → API Management → Analytics
- View your API usage statistics
- Export usage data

**Super Admin View:**
- Super Admin → API Management → Tenant Analytics
- View usage across all tenants
- Identify top API consumers
- Monitor billing data

### Tracked Metrics

- Total requests
- Requests by endpoint
- Requests by method (GET, POST, etc.)
- Success/error rates
- Average response times
- Requests over time
- Per API key usage

### Analytics API

```javascript
// Get usage analytics
const getAnalytics = async (startDate, endDate) => {
  const response = await fetch(
    `/api/api-management/analytics?start_date=${startDate}&end_date=${endDate}`,
    {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    }
  );
  
  const data = await response.json();
  return data.data;
};
```

---

## Security

### Best Practices

1. **API Key Security**
   - Store keys in environment variables
   - Never commit to version control
   - Use key rotation
   - Monitor for unusual activity

2. **Webhook Security**
   - Always verify signatures
   - Use HTTPS endpoints only
   - Implement replay attack protection (check timestamp)
   - Log all webhook deliveries

3. **OAuth Security**
   - Use PKCE for mobile/SPA apps
   - Validate redirect URIs
   - Keep client secrets secure
   - Implement proper token storage

4. **Network Security**
   - Use HTTPS for all requests
   - Implement proper CORS policies
   - Use secure headers

### Security Headers

All API responses include security headers:
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
```

### Reporting Security Issues

If you discover a security vulnerability, please email: security@pulss.com

---

## Extending the System

### Adding New Events

1. **Define Event Type**
   ```javascript
   // backend/utils/eventTypes.js
   const EVENT_TYPES = {
     ORDER_CREATED: 'order.created',
     ORDER_UPDATED: 'order.updated',
     // Add new event
     INVENTORY_LOW: 'product.inventory_low'
   };
   ```

2. **Trigger Event**
   ```javascript
   // In your controller
   const { triggerWebhookEvent } = require('../controllers/webhooksController');
   
   // When inventory is low
   await triggerWebhookEvent(
     tenantId,
     'product.inventory_low',
     {
       product_id: productId,
       current_stock: stock,
       threshold: threshold,
       product_name: name
     }
   );
   ```

### Adding New Documentation

1. **Via API (Super Admin)**
   ```javascript
   const addDocumentation = async () => {
     await fetch('/api/api-management/docs', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         'Authorization': `Bearer ${superAdminToken}`
       },
       body: JSON.stringify({
         slug: 'advanced-filtering',
         title: 'Advanced Filtering',
         category: 'guides',
         description: 'Learn how to use advanced filtering',
         content: '# Advanced Filtering\n\n...',
         code_samples: {
           curl: 'curl ...',
           javascript: 'fetch(...)',
           python: 'requests.get(...)'
         }
       })
     });
   };
   ```

2. **Via Database**
   ```sql
   INSERT INTO api_documentation (slug, title, category, content)
   VALUES ('my-guide', 'My Guide', 'guides', '# Content here');
   ```

### Custom Middleware

Add custom API middleware:

```javascript
// backend/middleware/customApiMiddleware.js
const customApiCheck = async (req, res, next) => {
  // Custom logic
  if (req.apiKey.tenant_id === 'special-tenant') {
    // Special handling
  }
  next();
};

// In routes
router.get('/special-endpoint', 
  verifyApiKey, 
  customApiCheck, 
  controller.specialEndpoint
);
```

---

## Support

### Getting Help

- **Documentation:** https://developers.pulss.com
- **Email Support:** support@pulss.com
- **GitHub Issues:** https://github.com/yourusername/pulss-api/issues
- **Community Forum:** https://community.pulss.com

### Changelog

Stay updated with the latest API changes:
- **Developer Portal:** https://developers.pulss.com/changelog
- **RSS Feed:** https://developers.pulss.com/changelog.rss
- **Email Notifications:** Subscribe in your dashboard

---

## Appendix

### Error Codes

| Code | Description |
|------|-------------|
| 400  | Bad Request - Invalid parameters |
| 401  | Unauthorized - Invalid or missing API key |
| 403  | Forbidden - Insufficient permissions |
| 404  | Not Found - Resource doesn't exist |
| 429  | Too Many Requests - Rate limit exceeded |
| 500  | Internal Server Error |

### API Versioning

The API uses URL-based versioning:
- Current version: `v1`
- Endpoint format: `https://api.pulss.com/v1/endpoint`

### Migration Guide

When upgrading between versions, refer to:
- Breaking changes section in changelog
- Migration guides in documentation
- Deprecation notices in API responses

---

**Last Updated:** October 2025  
**Version:** 1.0.0
