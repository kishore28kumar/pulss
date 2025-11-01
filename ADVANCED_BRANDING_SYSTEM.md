# Advanced Branding & White-Label Controls System

## Overview

The Advanced Branding & White-Label Controls System provides comprehensive multi-tenant branding capabilities with super admin toggles, custom domain support, branded templates, and automated asset management.

## Table of Contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [Super Admin Controls](#super-admin-controls)
6. [Integration](#integration)
7. [Usage Guide](#usage-guide)
8. [Security](#security)

## Features

### Core Branding Features
- **Multi-tenant Branding**: Separate branding configuration per tenant/partner
- **Logo Management**: Primary logo, dark mode logo, favicon (multiple sizes)
- **Color Palette**: Customizable color scheme with JSON storage
- **Typography**: Custom font selection (Google Fonts integration)
- **Custom CSS**: Advanced styling capabilities
- **Assets Management**: Organized asset upload and optimization

### Custom Domain Support
- **Multiple Domains**: Support for multiple custom domains per tenant
- **DNS Verification**: Automated verification via DNS TXT records
- **SSL/TLS**: SSL certificate management and status tracking
- **Primary Domain**: Designated primary domain per tenant

### Branded Communication
- **Email Branding**: Custom email templates with header/footer
- **SMS Branding**: Branded SMS templates with custom sender name
- **Notification Branding**: Push notification templates with custom icons
- **Template Variables**: Dynamic content insertion with variable support

### API Documentation Branding
- **Custom API Docs**: Branded API documentation portal
- **Theme Support**: Custom theme for developer portal
- **Logo & Title**: Custom branding for API documentation

### Region Controls
- **Multi-region Support**: India, Global, US, EU, etc.
- **Region-specific Config**: Custom settings per region
- **Compliance Templates**: Region-specific compliance documents

### Super Admin Toggles
All advanced features are gated by super admin toggles:
- Custom logo/colors/fonts/CSS
- Custom domains
- Branded email/SMS/notifications
- White-label mode (removes Pulss branding)
- Asset management
- Export/import functionality
- Region customization

### Audit & Compliance
- **Complete Audit Trail**: All changes logged with user/IP/timestamp
- **Compliance Templates**: Privacy policy, terms of service templates
- **Version Control**: Configuration versioning

## Architecture

### Database Tables

1. **branding_configs** - Main branding configuration
2. **branding_feature_toggles** - Super admin feature gates
3. **branding_assets** - Asset management and tracking
4. **branding_templates** - Reusable email/SMS/notification templates
5. **branding_audit_logs** - Complete audit trail
6. **custom_domains** - Custom domain management

### Component Flow

```
┌─────────────────┐
│  Super Admin    │ ──► Enables/Disables Features
│  Dashboard      │
└─────────────────┘
        │
        ▼
┌─────────────────┐
│ Feature Toggles │ ──► Gates Branding Features
│   (Per Tenant)  │
└─────────────────┘
        │
        ▼
┌─────────────────┐
│   Tenant/Admin  │ ──► Configures Branding
│   Dashboard     │
└─────────────────┘
        │
        ▼
┌─────────────────┐
│ Branding Config │ ──► Stores Configuration
│   + Assets      │
└─────────────────┘
        │
        ▼
┌─────────────────┐
│   Frontend      │ ──► Applies Branding
│  Application    │
└─────────────────┘
```

## Database Schema

### branding_configs

Main table for storing branding configuration:

```sql
CREATE TABLE branding_configs (
  branding_id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  partner_id UUID,
  
  -- Logos
  logo_url TEXT,
  logo_dark_url TEXT,
  favicon_url TEXT,
  
  -- Brand Identity
  brand_name TEXT,
  brand_tagline TEXT,
  colors JSONB,
  fonts JSONB,
  
  -- Custom Domains
  custom_domains TEXT[],
  primary_domain TEXT,
  
  -- Communication Branding
  email_templates JSONB,
  sms_templates JSONB,
  notification_templates JSONB,
  
  -- Region
  region TEXT DEFAULT 'global',
  region_config JSONB,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### branding_feature_toggles

Super admin controls for gating features:

```sql
CREATE TABLE branding_feature_toggles (
  toggle_id UUID PRIMARY KEY,
  tenant_id UUID UNIQUE NOT NULL,
  
  -- Feature Flags
  custom_logo_enabled BOOLEAN DEFAULT false,
  custom_colors_enabled BOOLEAN DEFAULT false,
  custom_fonts_enabled BOOLEAN DEFAULT false,
  custom_css_enabled BOOLEAN DEFAULT false,
  custom_domain_enabled BOOLEAN DEFAULT false,
  branded_email_enabled BOOLEAN DEFAULT false,
  branded_sms_enabled BOOLEAN DEFAULT false,
  branded_notifications_enabled BOOLEAN DEFAULT false,
  white_label_mode_enabled BOOLEAN DEFAULT false,
  
  -- Limits
  max_custom_domains INTEGER DEFAULT 1,
  max_logo_size_mb DECIMAL(5,2) DEFAULT 5.00,
  
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## API Endpoints

### Branding Configuration

#### Get Branding Config
```http
GET /api/branding/config/:tenant_id
Authorization: Bearer <token>
Query Parameters:
  - includeAssets: boolean (optional)
  - includeToggles: boolean (optional)

Response:
{
  "config": { ... },
  "assets": [ ... ],
  "toggles": { ... }
}
```

#### Update Branding Config
```http
PUT /api/branding/config/:tenant_id
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "logo_url": "https://...",
  "brand_name": "My Store",
  "colors": {
    "primary": "#4F46E5",
    "secondary": "#10B981"
  },
  "fonts": {
    "heading": "Inter",
    "body": "Inter"
  },
  "email_templates": { ... },
  "region": "india"
}

Response:
{
  "message": "Branding configuration updated successfully",
  "config": { ... }
}
```

### Feature Toggles (Super Admin Only)

#### Get Feature Toggles
```http
GET /api/branding/toggles/:tenant_id
Authorization: Bearer <super_admin_token>

Response:
{
  "toggle_id": "...",
  "tenant_id": "...",
  "custom_logo_enabled": true,
  "custom_colors_enabled": true,
  ...
}
```

#### Update Feature Toggles
```http
PUT /api/branding/toggles/:tenant_id
Authorization: Bearer <super_admin_token>
Content-Type: application/json

Body:
{
  "custom_logo_enabled": true,
  "custom_colors_enabled": true,
  "custom_domain_enabled": true,
  "max_custom_domains": 5,
  "branded_email_enabled": true,
  "white_label_mode_enabled": true,
  "notes": "Premium tier features enabled"
}

Response:
{
  "message": "Feature toggles updated successfully",
  "toggles": { ... }
}
```

### Asset Management

#### Upload Asset
```http
POST /api/branding/assets/:tenant_id/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body:
  - asset: File
  - branding_id: UUID
  - asset_type: "logo" | "favicon" | "email_header" | etc.

Response:
{
  "message": "Asset uploaded successfully",
  "asset": {
    "asset_id": "...",
    "file_url": "/uploads/...",
    "file_size_bytes": 12345,
    ...
  }
}
```

### Custom Domains

#### Create Custom Domain
```http
POST /api/branding/domains/:tenant_id
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "domain": "shop.example.com",
  "is_primary": true,
  "branding_id": "..."
}

Response:
{
  "message": "Custom domain created successfully",
  "domain": { ... },
  "verification_instructions": {
    "method": "DNS TXT Record",
    "record_name": "_pulss-verification.shop.example.com",
    "record_value": "abc123...",
    "instructions": "..."
  }
}
```

#### Get Custom Domains
```http
GET /api/branding/domains/:tenant_id
Authorization: Bearer <token>

Response:
{
  "domains": [
    {
      "domain_id": "...",
      "domain": "shop.example.com",
      "verification_status": "verified",
      "ssl_status": "active",
      ...
    }
  ]
}
```

### Templates

#### Get Templates
```http
GET /api/branding/templates
Authorization: Bearer <token>
Query Parameters:
  - template_type: "email" | "sms" | "notification" | "compliance"
  - template_category: "order_confirmation" | "welcome" | etc.
  - region: "india" | "global" | etc.
  - locale: "en" | "hi" | etc.

Response:
{
  "templates": [
    {
      "template_id": "...",
      "template_name": "Order Confirmation",
      "template_type": "email",
      "content": "...",
      "variables": ["order_id", "customer_name"],
      ...
    }
  ]
}
```

### Export/Import

#### Export Configuration
```http
GET /api/branding/export/:tenant_id
Authorization: Bearer <token>

Response:
{
  "version": "1.0",
  "exported_at": "2025-10-20T12:00:00Z",
  "tenant_id": "...",
  "config": { ... },
  "assets": [ ... ],
  "custom_domains": [ ... ]
}
```

#### Import Configuration
```http
POST /api/branding/import/:tenant_id
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "version": "1.0",
  "config": { ... },
  "assets": [ ... ]
}

Response:
{
  "message": "Configuration imported successfully",
  "imported_items": {
    "config": 1,
    "assets": 5,
    "domains": 2
  }
}
```

### Audit Logs

#### Get Audit Logs
```http
GET /api/branding/audit/:tenant_id
Authorization: Bearer <token>
Query Parameters:
  - page: integer (default: 1)
  - limit: integer (default: 50)
  - action: "create" | "update" | "delete" | etc.
  - entity_type: "branding_config" | "asset" | etc.

Response:
{
  "logs": [
    {
      "audit_id": "...",
      "action": "update",
      "entity_type": "branding_config",
      "old_values": { ... },
      "new_values": { ... },
      "user_id": "...",
      "created_at": "..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 123,
    "pages": 3
  }
}
```

## Super Admin Controls

### Feature Toggle Workflow

1. **Super Admin enables features** for a tenant via toggles
2. **Tenant/Admin configures** branding within enabled features
3. **System validates** requests against feature toggles
4. **Changes are logged** in audit trail

### Toggle Levels

#### Basic Tier (Free)
- Limited logo customization
- Basic color selection
- 1 custom domain

#### Professional Tier
- Full logo suite (light/dark/favicon)
- Complete color palette
- Custom fonts
- 3 custom domains
- Branded emails

#### Enterprise Tier
- All Professional features
- White-label mode (removes Pulss branding)
- Custom CSS
- Unlimited custom domains
- Branded SMS
- Branded notifications
- API docs branding
- Region customization
- Export/import

## Integration

### With Billing System
Feature toggles can be synchronized with subscription tiers:

```javascript
// Example: Enable features based on subscription
async function syncFeaturesWithSubscription(tenantId, subscriptionTier) {
  const features = {
    basic: {
      custom_logo_enabled: true,
      custom_colors_enabled: true,
      max_custom_domains: 1
    },
    professional: {
      custom_logo_enabled: true,
      custom_colors_enabled: true,
      custom_fonts_enabled: true,
      branded_email_enabled: true,
      max_custom_domains: 3
    },
    enterprise: {
      custom_logo_enabled: true,
      custom_colors_enabled: true,
      custom_fonts_enabled: true,
      custom_css_enabled: true,
      custom_domain_enabled: true,
      branded_email_enabled: true,
      branded_sms_enabled: true,
      white_label_mode_enabled: true,
      max_custom_domains: 999
    }
  };
  
  await updateFeatureToggles(tenantId, features[subscriptionTier]);
}
```

### With Notification System
Branded notification templates:

```javascript
// Example: Send branded notification
async function sendBrandedNotification(tenantId, customerId, type, data) {
  // Get branding config
  const branding = await getBrandingConfig(tenantId);
  
  // Get template
  const template = branding.notification_templates[type];
  
  // Replace variables
  const content = replaceVariables(template.content, data);
  
  // Send with custom icon
  await sendNotification({
    customerId,
    title: template.title,
    content,
    icon: branding.notification_icon_url
  });
}
```

### With RBAC
Access control integration:

```javascript
// Example: Check branding permissions
function canAccessBrandingFeature(user, feature) {
  // Super admin has full access
  if (user.role === 'super_admin') return true;
  
  // Check if user's tenant has feature enabled
  const toggles = getFeatureToggles(user.tenant_id);
  return toggles[`${feature}_enabled`] === true;
}
```

## Usage Guide

### For Super Admins

#### 1. Enable Features for a Tenant
```bash
curl -X PUT https://api.example.com/api/branding/toggles/TENANT_ID \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "custom_logo_enabled": true,
    "custom_colors_enabled": true,
    "custom_domain_enabled": true,
    "max_custom_domains": 3,
    "branded_email_enabled": true,
    "notes": "Upgraded to Professional tier"
  }'
```

#### 2. Monitor Usage
- Check audit logs regularly
- Review asset storage usage
- Monitor domain verification status

### For Tenant Admins

#### 1. Configure Branding
```bash
curl -X PUT https://api.example.com/api/branding/config/YOUR_TENANT_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "brand_name": "My Awesome Store",
    "logo_url": "https://cdn.example.com/logo.png",
    "colors": {
      "primary": "#4F46E5",
      "secondary": "#10B981"
    }
  }'
```

#### 2. Upload Assets
```bash
curl -X POST https://api.example.com/api/branding/assets/YOUR_TENANT_ID/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "asset=@logo.png" \
  -F "branding_id=YOUR_BRANDING_ID" \
  -F "asset_type=logo"
```

#### 3. Add Custom Domain
```bash
curl -X POST https://api.example.com/api/branding/domains/YOUR_TENANT_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "shop.mystore.com",
    "is_primary": true,
    "branding_id": "YOUR_BRANDING_ID"
  }'
```

Then add the DNS TXT record provided in the response.

#### 4. Export Configuration
```bash
curl -X GET https://api.example.com/api/branding/export/YOUR_TENANT_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  > branding-backup.json
```

## Security

### Authentication & Authorization
- All endpoints require authentication
- Super admin endpoints require `super_admin` role
- Tenant-specific access enforced
- Feature toggles gate functionality

### Input Validation
- File upload size limits enforced
- Domain format validation
- CSS sanitization for custom CSS
- Template variable validation

### Audit Trail
- All changes logged with:
  - User ID and role
  - IP address
  - Timestamp
  - Old and new values
  - Changed fields

### Data Protection
- Sensitive data encrypted at rest
- HTTPS enforced for all API calls
- API rate limiting applied
- CORS configured for allowed origins

### Compliance
- GDPR-compliant data handling
- DPDP Act (India) compliance templates
- Data export/deletion support
- Audit trail retention

## Region-Specific Features

### India
- SMS templates with DLT compliance
- DPDP Act privacy templates
- Rupee currency formatting
- Hindi language support

### Global
- Standard email templates
- GDPR privacy templates
- Multi-currency support
- Multi-language support

### Custom Regions
- Configurable via `region_config` JSONB field
- Custom compliance templates
- Region-specific asset management

## Best Practices

### 1. Asset Management
- Use SVG for logos when possible
- Optimize images before upload
- Use CDN for asset delivery
- Maintain backup of all assets

### 2. Domain Management
- Verify domains promptly
- Keep SSL certificates updated
- Use primary domain for emails
- Test domains before going live

### 3. Template Management
- Test templates before deployment
- Use variables for dynamic content
- Maintain multi-language versions
- Keep templates compliant

### 4. Configuration Management
- Export configuration regularly
- Version control configuration files
- Test imports in staging first
- Document customizations

### 5. Security
- Regularly review audit logs
- Monitor for unauthorized access
- Keep feature toggles aligned with billing
- Sanitize all user inputs

## Troubleshooting

### Common Issues

#### 1. Feature Not Available
- **Problem**: "Feature not enabled for this tenant"
- **Solution**: Super admin needs to enable the feature via toggles

#### 2. Domain Verification Failed
- **Problem**: Domain shows "verification failed"
- **Solution**: Check DNS TXT record is correctly added

#### 3. Asset Upload Fails
- **Problem**: "File size exceeds limit"
- **Solution**: Compress image or request higher limit from super admin

#### 4. Template Not Rendering
- **Problem**: Variables not being replaced
- **Solution**: Check variable names match template specification

## Future Enhancements

- [ ] Automated image optimization
- [ ] CDN integration
- [ ] A/B testing for templates
- [ ] Template preview functionality
- [ ] Bulk asset upload
- [ ] Asset versioning
- [ ] Advanced template editor
- [ ] Multi-language template management
- [ ] Automated SSL certificate renewal
- [ ] Domain health monitoring
- [ ] Analytics for branding effectiveness

## Support

For issues or questions:
1. Check this documentation
2. Review audit logs for errors
3. Contact support with tenant_id and error details
4. Include relevant log entries

## Changelog

### Version 1.0.0 (2025-10-20)
- Initial release
- Core branding features
- Super admin toggles
- Custom domain support
- Branded templates
- Audit logging
- Export/import functionality

---

**Last Updated**: October 20, 2025
**Version**: 1.0.0
**Status**: Production Ready
