# Branding & White-Label System - API Reference

Complete API reference for the Pulss branding and white-label system.

## Base URL

```
https://api.pulss.io/api
```

For local development:
```
http://localhost:5000/api
```

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Response Format

### Success Response
```json
{
  "data": { ... },
  "message": "Success message (optional)"
}
```

### Error Response
```json
{
  "error": "Error message",
  "details": "Additional error details (optional)"
}
```

---

## Branding Endpoints

### Get Tenant Branding

Retrieve complete branding configuration for a tenant.

**Endpoint**: `GET /branding/:tenant_id`

**Authentication**: Required (Tenant Admin or Super Admin)

**Parameters**:
- `tenant_id` (path, UUID) - Tenant identifier

**Response**: `200 OK`
```json
{
  "branding_id": "uuid",
  "tenant_id": "uuid",
  "logo_url": "/uploads/logo.png",
  "logo_dark_url": "/uploads/logo-dark.png",
  "favicon_url": "/uploads/favicon.ico",
  "primary_color": "#3B82F6",
  "secondary_color": "#10B981",
  "accent_color": "#F59E0B",
  "company_name": "My Pharmacy",
  "support_email": "support@mypharmacy.com",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-15T00:00:00Z"
}
```

**Example**:
```bash
curl -X GET "https://api.pulss.io/api/branding/tenant-uuid" \
  -H "Authorization: Bearer your-jwt-token"
```

---

### Update Tenant Branding

Update branding configuration. Only fields provided will be updated.

**Endpoint**: `PUT /branding/:tenant_id`

**Authentication**: Required (Tenant Admin or Super Admin)

**Parameters**:
- `tenant_id` (path, UUID) - Tenant identifier

**Request Body**:
```json
{
  "primary_color": "#3B82F6",
  "secondary_color": "#10B981",
  "company_name": "My Updated Pharmacy",
  "support_email": "support@mypharmacy.com",
  "copyright_text": "© 2024 My Pharmacy. All rights reserved.",
  "login_title": "Welcome Back",
  "social_links": {
    "facebook": "https://facebook.com/mypharmacy",
    "twitter": "https://twitter.com/mypharmacy"
  }
}
```

**Response**: `200 OK`
```json
{
  "branding_id": "uuid",
  "tenant_id": "uuid",
  "primary_color": "#3B82F6",
  "company_name": "My Updated Pharmacy",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

**Permission Checks**:
- `custom_footer_html` requires `custom_footer_enabled`
- `custom_css` requires `custom_css_enabled`
- `terms_url`, `privacy_url` require `custom_legal_enabled`

**Example**:
```bash
curl -X PUT "https://api.pulss.io/api/branding/tenant-uuid" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "primary_color": "#3B82F6",
    "company_name": "My Pharmacy"
  }'
```

---

### Get Public Branding

Retrieve public branding information (no authentication required). Used by customer-facing pages.

**Endpoint**: `GET /branding/:tenant_id/public`

**Authentication**: None

**Parameters**:
- `tenant_id` (path, UUID) - Tenant identifier

**Response**: `200 OK`
```json
{
  "logo_url": "/uploads/logo.png",
  "logo_dark_url": "/uploads/logo-dark.png",
  "favicon_url": "/uploads/favicon.ico",
  "primary_color": "#3B82F6",
  "secondary_color": "#10B981",
  "company_name": "My Pharmacy",
  "support_email": "support@mypharmacy.com",
  "white_label_enabled": true,
  "social_links": { ... }
}
```

**Example**:
```bash
curl -X GET "https://api.pulss.io/api/branding/tenant-uuid/public"
```

---

### Upload Logo

Upload a logo image file.

**Endpoint**: `POST /branding/:tenant_id/upload/logo`

**Authentication**: Required (Tenant Admin or Super Admin)

**Parameters**:
- `tenant_id` (path, UUID) - Tenant identifier

**Request Body**: `multipart/form-data`
- `logo` (file) - Image file (PNG, JPG, SVG)
- Max size: 5MB
- Recommended dimensions: 200x60px

**Response**: `200 OK`
```json
{
  "logo_url": "/uploads/logo-1234567890.png",
  "message": "Logo uploaded successfully"
}
```

**Example**:
```bash
curl -X POST "https://api.pulss.io/api/branding/tenant-uuid/upload/logo" \
  -H "Authorization: Bearer your-jwt-token" \
  -F "logo=@/path/to/logo.png"
```

**Other Upload Endpoints**:
- `POST /branding/:tenant_id/upload/logo-dark` - Dark mode logo
- `POST /branding/:tenant_id/upload/favicon` - Favicon
- `POST /branding/:tenant_id/upload/login-background` - Login page background
- `POST /branding/:tenant_id/upload/email-logo` - Email template logo

---

### Export Branding Configuration

Export complete branding configuration as JSON.

**Endpoint**: `GET /branding/:tenant_id/export`

**Authentication**: Required (Tenant Admin or Super Admin)

**Parameters**:
- `tenant_id` (path, UUID) - Tenant identifier

**Response**: `200 OK`
```json
{
  "version": "1.0",
  "exported_at": "2024-01-15T10:30:00Z",
  "tenant_id": "uuid",
  "branding": { ... },
  "feature_flags": { ... },
  "custom_domains": [ ... ]
}
```

**Example**:
```bash
curl -X GET "https://api.pulss.io/api/branding/tenant-uuid/export" \
  -H "Authorization: Bearer your-jwt-token" \
  -o branding-config.json
```

---

### Get Branding History

Retrieve audit trail of branding changes.

**Endpoint**: `GET /branding/:tenant_id/history`

**Authentication**: Required (Tenant Admin or Super Admin)

**Parameters**:
- `tenant_id` (path, UUID) - Tenant identifier
- `limit` (query, number) - Results per page (default: 50, max: 100)
- `offset` (query, number) - Pagination offset (default: 0)

**Response**: `200 OK`
```json
{
  "history": [
    {
      "history_id": "uuid",
      "change_type": "branding_updated",
      "entity_type": "tenant_branding",
      "changed_fields": ["primary_color", "logo_url"],
      "changed_by_email": "admin@pharmacy.com",
      "changed_by_name": "John Doe",
      "ip_address": "192.168.1.1",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 25,
  "limit": 50,
  "offset": 0
}
```

**Example**:
```bash
curl -X GET "https://api.pulss.io/api/branding/tenant-uuid/history?limit=10&offset=0" \
  -H "Authorization: Bearer your-jwt-token"
```

---

## Feature Flags Endpoints

### Get Feature Flags

Retrieve branding feature flags for a tenant.

**Endpoint**: `GET /branding/:tenant_id/features`

**Authentication**: Required (Tenant Admin or Super Admin)

**Parameters**:
- `tenant_id` (path, UUID) - Tenant identifier

**Response**: `200 OK`
```json
{
  "tenant_id": "uuid",
  "logo_upload_enabled": true,
  "color_customization_enabled": true,
  "theme_selection_enabled": true,
  "favicon_enabled": true,
  "login_customization_enabled": true,
  "custom_domain_enabled": false,
  "white_label_enabled": false,
  "custom_footer_enabled": false,
  "custom_legal_enabled": false,
  "email_branding_enabled": false,
  "custom_css_enabled": false,
  "multi_brand_enabled": false,
  "api_access_enabled": false,
  "notes": "Standard tier customer",
  "approved_by": "super-admin-uuid",
  "approved_at": "2024-01-01T00:00:00Z"
}
```

---

### Update Feature Flags (Super Admin Only)

Enable or disable branding features for a tenant.

**Endpoint**: `PUT /branding/:tenant_id/features`

**Authentication**: Required (Super Admin only)

**Parameters**:
- `tenant_id` (path, UUID) - Tenant identifier

**Request Body**:
```json
{
  "custom_domain_enabled": true,
  "white_label_enabled": true,
  "email_branding_enabled": true,
  "notes": "Premium customer - approved for white-label features"
}
```

**Response**: `200 OK`
```json
{
  "tenant_id": "uuid",
  "custom_domain_enabled": true,
  "white_label_enabled": true,
  "email_branding_enabled": true,
  "approved_by": "super-admin-uuid",
  "approved_at": "2024-01-15T10:30:00Z"
}
```

**Example**:
```bash
curl -X PUT "https://api.pulss.io/api/branding/tenant-uuid/features" \
  -H "Authorization: Bearer super-admin-token" \
  -H "Content-Type: application/json" \
  -d '{
    "white_label_enabled": true,
    "notes": "Premium customer"
  }'
```

---

## Custom Domains Endpoints

### List Custom Domains

Get all custom domains for a tenant.

**Endpoint**: `GET /custom-domains/:tenant_id`

**Authentication**: Required (Tenant Admin or Super Admin)

**Parameters**:
- `tenant_id` (path, UUID) - Tenant identifier

**Response**: `200 OK`
```json
{
  "domains": [
    {
      "domain_id": "uuid",
      "domain_name": "pharmacy.mycompany.com",
      "is_primary": true,
      "verification_status": "verified",
      "verification_token": "abc123...",
      "dns_records": {
        "txt": {
          "host": "_pulss-verification.pharmacy.mycompany.com",
          "value": "abc123...",
          "type": "TXT"
        },
        "cname": {
          "host": "pharmacy.mycompany.com",
          "value": "app.pulss.io",
          "type": "CNAME"
        }
      },
      "ssl_status": "active",
      "ssl_expires_at": "2024-04-15T00:00:00Z",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z",
      "verified_at": "2024-01-01T02:30:00Z"
    }
  ],
  "feature_enabled": true
}
```

**Error Response** (Feature Not Enabled): `403 Forbidden`
```json
{
  "error": "Custom domains feature not enabled for this tenant",
  "feature_enabled": false
}
```

---

### Add Custom Domain

Add a new custom domain.

**Endpoint**: `POST /custom-domains/:tenant_id`

**Authentication**: Required (Tenant Admin or Super Admin)

**Parameters**:
- `tenant_id` (path, UUID) - Tenant identifier

**Request Body**:
```json
{
  "domain_name": "pharmacy.mycompany.com",
  "is_primary": false
}
```

**Response**: `201 Created`
```json
{
  "domain": {
    "domain_id": "uuid",
    "domain_name": "pharmacy.mycompany.com",
    "verification_status": "pending",
    "verification_token": "abc123...",
    "dns_records": { ... },
    "ssl_status": "pending",
    "is_active": false
  },
  "message": "Domain added successfully. Please configure DNS records to verify ownership."
}
```

**Validation Rules**:
- Domain must be valid format (e.g., subdomain.domain.com)
- Domain must not already exist
- Must be unique across all tenants

**Example**:
```bash
curl -X POST "https://api.pulss.io/api/custom-domains/tenant-uuid" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "domain_name": "pharmacy.mycompany.com",
    "is_primary": false
  }'
```

---

### Verify Custom Domain

Verify domain ownership via DNS.

**Endpoint**: `POST /custom-domains/:tenant_id/:domain_id/verify`

**Authentication**: Required (Tenant Admin or Super Admin)

**Parameters**:
- `tenant_id` (path, UUID) - Tenant identifier
- `domain_id` (path, UUID) - Domain identifier

**Request Body**: None

**Response**: `200 OK`
```json
{
  "verified": true,
  "domain": {
    "domain_id": "uuid",
    "verification_status": "verified",
    "verified_at": "2024-01-15T10:30:00Z",
    "ssl_status": "pending",
    "is_active": true
  },
  "message": "Domain verified successfully"
}
```

**Response** (Failed Verification): `200 OK`
```json
{
  "verified": false,
  "domain": {
    "domain_id": "uuid",
    "verification_status": "failed",
    "last_error": "DNS verification failed: TXT record not found"
  },
  "message": "Verification failed: DNS verification failed: TXT record not found"
}
```

**Verification Process**:
1. Checks for TXT record at `_pulss-verification.{domain}`
2. Verifies TXT record value matches `verification_token`
3. If successful, marks domain as verified and activates it
4. Initiates SSL certificate provisioning

**Example**:
```bash
curl -X POST "https://api.pulss.io/api/custom-domains/tenant-uuid/domain-uuid/verify" \
  -H "Authorization: Bearer your-jwt-token"
```

---

### Update Custom Domain

Update domain configuration.

**Endpoint**: `PUT /custom-domains/:tenant_id/:domain_id`

**Authentication**: Required (Tenant Admin or Super Admin)

**Parameters**:
- `tenant_id` (path, UUID) - Tenant identifier
- `domain_id` (path, UUID) - Domain identifier

**Request Body**:
```json
{
  "is_primary": true,
  "redirect_to_primary": false,
  "notes": "Primary domain for production"
}
```

**Response**: `200 OK`
```json
{
  "domain_id": "uuid",
  "is_primary": true,
  "redirect_to_primary": false,
  "notes": "Primary domain for production",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

---

### Delete Custom Domain

Remove a custom domain.

**Endpoint**: `DELETE /custom-domains/:tenant_id/:domain_id`

**Authentication**: Required (Tenant Admin or Super Admin)

**Parameters**:
- `tenant_id` (path, UUID) - Tenant identifier
- `domain_id` (path, UUID) - Domain identifier

**Response**: `200 OK`
```json
{
  "message": "Domain deleted successfully"
}
```

**Example**:
```bash
curl -X DELETE "https://api.pulss.io/api/custom-domains/tenant-uuid/domain-uuid" \
  -H "Authorization: Bearer your-jwt-token"
```

---

### Check SSL Status

Check SSL certificate status for a domain.

**Endpoint**: `GET /custom-domains/:tenant_id/:domain_id/ssl-status`

**Authentication**: Required (Tenant Admin or Super Admin)

**Parameters**:
- `tenant_id` (path, UUID) - Tenant identifier
- `domain_id` (path, UUID) - Domain identifier

**Response**: `200 OK`
```json
{
  "domain_name": "pharmacy.mycompany.com",
  "ssl_status": "active",
  "ssl_provider": "letsencrypt",
  "ssl_expires_at": "2024-04-15T00:00:00Z",
  "ssl_last_checked": "2024-01-15T10:00:00Z",
  "message": "SSL certificate is active"
}
```

**SSL Status Values**:
- `pending`: Certificate provisioning in progress
- `active`: Certificate is active and valid
- `failed`: Certificate provisioning failed
- `expired`: Certificate has expired

---

## Webhooks

### Webhook Events

The system can send webhooks for these events:

- `branding.updated` - Branding configuration changed
- `domain.added` - New custom domain added
- `domain.verified` - Domain verification successful
- `domain.removed` - Domain deleted
- `feature.enabled` - Feature enabled for tenant
- `feature.disabled` - Feature disabled for tenant

### Webhook Payload Format

All webhooks use this format:

```json
{
  "event": "branding.updated",
  "timestamp": "2024-01-15T10:30:00Z",
  "tenant_id": "uuid",
  "data": {
    "branding": { ... },
    "changed_fields": ["primary_color", "logo_url"]
  },
  "signature": "hmac-sha256-signature"
}
```

### Webhook Signature Verification

Webhooks are signed with HMAC-SHA256. Verify the signature:

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
    
  return signature === expectedSignature;
}

// In your webhook handler:
const receivedSignature = req.headers['x-webhook-signature'];
const isValid = verifyWebhookSignature(req.body, receivedSignature, webhookSecret);

if (!isValid) {
  return res.status(401).json({ error: 'Invalid signature' });
}
```

---

## Rate Limits

All endpoints are rate limited:

- **Standard endpoints**: 100 requests per minute
- **Upload endpoints**: 10 requests per minute
- **Verification endpoints**: 5 requests per minute

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1610000000
```

When rate limited:
```
HTTP/1.1 429 Too Many Requests
{
  "error": "Rate limit exceeded",
  "retry_after": 60
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 413 | Payload Too Large - File too large |
| 422 | Unprocessable Entity - Validation error |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

---

## SDK Examples

### JavaScript/TypeScript

```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'https://api.pulss.io/api',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

// Get branding
const branding = await apiClient.get(`/branding/${tenantId}`);

// Update branding
await apiClient.put(`/branding/${tenantId}`, {
  primary_color: '#3B82F6',
  company_name: 'My Pharmacy'
});

// Upload logo
const formData = new FormData();
formData.append('logo', file);
await apiClient.post(`/branding/${tenantId}/upload/logo`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
```

### Python

```python
import requests

headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

# Get branding
response = requests.get(
    f'https://api.pulss.io/api/branding/{tenant_id}',
    headers=headers
)
branding = response.json()

# Update branding
requests.put(
    f'https://api.pulss.io/api/branding/{tenant_id}',
    headers=headers,
    json={
        'primary_color': '#3B82F6',
        'company_name': 'My Pharmacy'
    }
)

# Upload logo
files = {'logo': open('logo.png', 'rb')}
requests.post(
    f'https://api.pulss.io/api/branding/{tenant_id}/upload/logo',
    headers={'Authorization': f'Bearer {token}'},
    files=files
)
```

### cURL

```bash
# Get branding
curl -X GET "https://api.pulss.io/api/branding/tenant-uuid" \
  -H "Authorization: Bearer your-token"

# Update branding
curl -X PUT "https://api.pulss.io/api/branding/tenant-uuid" \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{"primary_color": "#3B82F6"}'

# Upload logo
curl -X POST "https://api.pulss.io/api/branding/tenant-uuid/upload/logo" \
  -H "Authorization: Bearer your-token" \
  -F "logo=@logo.png"
```

---

## Testing

Use the provided Postman collection: `postman/branding-api.json`

Or test with the API playground: https://api.pulss.io/playground

---

## Support

- **Documentation**: https://docs.pulss.io
- **API Status**: https://status.pulss.io
- **Support Email**: support@pulss.io

---

**Last Updated**: 2024-01-15
**API Version**: 1.0.0
