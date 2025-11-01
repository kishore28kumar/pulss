# Advanced Tenant Branding and White-Label System - Architecture Documentation

## Overview

This document describes the comprehensive branding and white-label system implemented for the Pulss multi-tenant SaaS platform. The system provides flexible branding controls with permission-based access, allowing standard branding for all tenants while restricting advanced features to super admin approval.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Permission Model](#permission-model)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [Frontend Components](#frontend-components)
6. [Custom Domain Setup](#custom-domain-setup)
7. [White-Label Features](#white-label-features)
8. [Email Branding](#email-branding)
9. [Multi-Brand Support](#multi-brand-support)
10. [Webhooks & API](#webhooks--api)
11. [Security Considerations](#security-considerations)
12. [Extension Guide](#extension-guide)

---

## System Architecture

### High-Level Design

```
┌─────────────────────────────────────────────────────────────┐
│                     Super Admin                              │
│  - Approve/Deny Advanced Features                           │
│  - Manage Custom Domains                                     │
│  - Control White-Label Access                               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Branding Feature Flags                          │
│  - Standard Features (Enabled by Default)                   │
│  - Advanced Features (Require Approval)                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        ▼                              ▼
┌──────────────────┐         ┌──────────────────┐
│  Tenant Admin    │         │  Tenant Branding │
│  - Logo Upload   │         │  - Colors        │
│  - Colors        │         │  - Fonts         │
│  - Themes        │         │  - Legal Info    │
│  - Login Page    │         │  - Email Templates│
└──────────────────┘         └──────────────────┘
        │                              │
        └──────────────┬───────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Customer-Facing Pages                           │
│  - Branded Storefront                                       │
│  - Custom Login Page                                        │
│  - Branded Emails                                           │
│  - White-Label Footer                                       │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

1. **Database Layer**: PostgreSQL with multi-tenant isolation
2. **Backend API**: Node.js/Express with RESTful endpoints
3. **Frontend Components**: React/TypeScript with real-time updates
4. **Permission System**: Role-based access control (RBAC)
5. **Webhook System**: Event-driven notifications for branding changes

---

## Permission Model

### Two-Tier Permission System

#### Standard Branding (Enabled by Default)
Available to all tenant admins without super admin approval:
- **Logo Upload**: Upload custom logo (light and dark mode versions)
- **Color Customization**: Set primary, secondary, accent colors
- **Theme Selection**: Choose from predefined themes
- **Favicon**: Upload custom favicon for browser tab
- **Login Customization**: Customize login page appearance

#### Advanced Branding (Requires Super Admin Approval)
Must be explicitly enabled by super admin for each tenant:
- **Custom Domains**: Use tenant's own domain (e.g., pharmacy.mycompany.com)
- **White-Label Mode**: Completely hide platform branding
- **Custom Footer**: Add custom HTML footer content
- **Custom Legal Pages**: Link to custom terms, privacy policy
- **Email Branding**: Customize email templates
- **Custom CSS**: Add advanced custom styling
- **Multi-Brand Support**: Manage multiple brands (for partners/resellers)
- **API Access**: Programmatic branding updates via API

### Permission Check Flow

```
User Request → Auth Middleware → Permission Check → Feature Flags Check → Execute/Deny
```

---

## Database Schema

### Core Tables

#### 1. `tenant_branding`
Stores all branding configuration for each tenant.

```sql
CREATE TABLE tenant_branding (
  branding_id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(tenant_id) UNIQUE,
  
  -- Visual Identity
  logo_url TEXT,
  logo_dark_url TEXT,
  favicon_url TEXT,
  pwa_icon_url TEXT,
  login_background_url TEXT,
  
  -- Color Scheme
  primary_color VARCHAR(7) DEFAULT '#3B82F6',
  secondary_color VARCHAR(7) DEFAULT '#10B981',
  accent_color VARCHAR(7) DEFAULT '#F59E0B',
  text_color VARCHAR(7) DEFAULT '#1F2937',
  background_color VARCHAR(7) DEFAULT '#FFFFFF',
  
  -- Typography
  font_family TEXT DEFAULT 'Inter',
  font_url TEXT,
  
  -- Theme
  theme_mode VARCHAR(20) DEFAULT 'light',
  custom_css TEXT,
  
  -- Company Info
  company_name TEXT,
  legal_company_name TEXT,
  company_address TEXT,
  support_email TEXT,
  support_phone TEXT,
  
  -- Legal Links
  terms_url TEXT,
  privacy_url TEXT,
  about_url TEXT,
  
  -- Footer
  custom_footer_html TEXT,
  copyright_text TEXT,
  
  -- Email Branding
  email_header_logo_url TEXT,
  email_footer_text TEXT,
  email_primary_color VARCHAR(7),
  
  -- Login Page
  login_title TEXT DEFAULT 'Welcome Back',
  login_subtitle TEXT,
  login_show_logo BOOLEAN DEFAULT true,
  login_custom_message TEXT,
  
  -- Metadata
  custom_meta_tags JSONB,
  social_links JSONB,
  additional_settings JSONB,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. `custom_domains`
Manages custom domains with DNS verification and SSL.

```sql
CREATE TABLE custom_domains (
  domain_id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(tenant_id),
  domain_name VARCHAR(255) UNIQUE,
  is_primary BOOLEAN DEFAULT false,
  
  -- DNS Verification
  verification_status VARCHAR(20) DEFAULT 'pending',
  verification_token VARCHAR(255) UNIQUE,
  verification_method VARCHAR(20) DEFAULT 'txt',
  dns_records JSONB,
  verified_at TIMESTAMP,
  
  -- SSL Configuration
  ssl_status VARCHAR(20) DEFAULT 'pending',
  ssl_provider VARCHAR(50) DEFAULT 'letsencrypt',
  ssl_expires_at TIMESTAMP,
  
  -- Status
  is_active BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 3. `branding_feature_flags`
Controls which branding features are enabled per tenant.

```sql
CREATE TABLE branding_feature_flags (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(tenant_id),
  
  -- Standard Features (default: enabled)
  logo_upload_enabled BOOLEAN DEFAULT true,
  color_customization_enabled BOOLEAN DEFAULT true,
  theme_selection_enabled BOOLEAN DEFAULT true,
  favicon_enabled BOOLEAN DEFAULT true,
  login_customization_enabled BOOLEAN DEFAULT true,
  
  -- Advanced Features (default: disabled)
  custom_domain_enabled BOOLEAN DEFAULT false,
  white_label_enabled BOOLEAN DEFAULT false,
  custom_footer_enabled BOOLEAN DEFAULT false,
  custom_legal_enabled BOOLEAN DEFAULT false,
  email_branding_enabled BOOLEAN DEFAULT false,
  custom_css_enabled BOOLEAN DEFAULT false,
  multi_brand_enabled BOOLEAN DEFAULT false,
  api_access_enabled BOOLEAN DEFAULT false,
  
  -- Approval Metadata
  notes TEXT,
  approved_by UUID REFERENCES admins(admin_id),
  approved_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 4. `branding_webhooks`
Webhook endpoints for branding change notifications.

```sql
CREATE TABLE branding_webhooks (
  webhook_id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(tenant_id),
  webhook_url TEXT NOT NULL,
  webhook_secret VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  events TEXT[] DEFAULT ARRAY['branding.updated', 'domain.verified'],
  
  -- Statistics
  last_triggered_at TIMESTAMP,
  total_deliveries INTEGER DEFAULT 0,
  successful_deliveries INTEGER DEFAULT 0,
  failed_deliveries INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 5. `branding_change_history`
Audit trail for all branding changes.

```sql
CREATE TABLE branding_change_history (
  history_id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(tenant_id),
  change_type VARCHAR(50),
  entity_type VARCHAR(50),
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  changed_fields TEXT[],
  changed_by UUID REFERENCES admins(admin_id),
  ip_address INET,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## API Endpoints

### Branding Management

#### Get Tenant Branding
```
GET /api/branding/:tenant_id
Authorization: Bearer <token>
Response: BrandingConfig object
```

#### Update Tenant Branding
```
PUT /api/branding/:tenant_id
Authorization: Bearer <token>
Body: {
  primary_color: "#3B82F6",
  company_name: "My Pharmacy",
  ...
}
Response: Updated BrandingConfig
```

#### Get Public Branding (No Auth)
```
GET /api/branding/:tenant_id/public
Response: Public branding info (for customer-facing pages)
```

#### Upload Logo
```
POST /api/branding/:tenant_id/upload/logo
Authorization: Bearer <token>
Content-Type: multipart/form-data
Body: FormData with 'logo' file
Response: { logo_url: "/uploads/..." }
```

### Feature Flags Management (Super Admin Only)

#### Get Feature Flags
```
GET /api/branding/:tenant_id/features
Authorization: Bearer <token>
Response: FeatureFlags object
```

#### Update Feature Flags
```
PUT /api/branding/:tenant_id/features
Authorization: Bearer <token> (super_admin only)
Body: {
  custom_domain_enabled: true,
  white_label_enabled: true,
  notes: "Premium customer - approved for white-label"
}
Response: Updated FeatureFlags
```

### Custom Domains

#### List Custom Domains
```
GET /api/custom-domains/:tenant_id
Authorization: Bearer <token>
Response: { domains: [...], feature_enabled: true }
```

#### Add Custom Domain
```
POST /api/custom-domains/:tenant_id
Authorization: Bearer <token>
Body: {
  domain_name: "pharmacy.mycompany.com",
  is_primary: false
}
Response: { domain: {...}, message: "..." }
```

#### Verify Domain
```
POST /api/custom-domains/:tenant_id/:domain_id/verify
Authorization: Bearer <token>
Response: { verified: true/false, domain: {...} }
```

#### Delete Domain
```
DELETE /api/custom-domains/:tenant_id/:domain_id
Authorization: Bearer <token>
Response: { message: "Domain deleted successfully" }
```

### History & Export

#### Get Change History
```
GET /api/branding/:tenant_id/history?limit=50&offset=0
Authorization: Bearer <token>
Response: { history: [...], total: 100 }
```

#### Export Configuration
```
GET /api/branding/:tenant_id/export
Authorization: Bearer <token>
Response: Complete branding configuration as JSON
```

---

## Frontend Components

### 1. BrandingSettings Component
Main interface for tenant admins to configure branding.

**Location**: `src/components/BrandingSettings.tsx`

**Features**:
- Tab-based interface (Visual Identity, Login Page, Email, Legal)
- Real-time color preview
- Image upload with preview
- Form validation
- Auto-save functionality
- Export configuration

**Usage**:
```tsx
import BrandingSettings from '@/components/BrandingSettings';

<BrandingSettings tenantId={tenantId} token={authToken} />
```

### 2. CustomDomainSettings Component
Interface for managing custom domains.

**Location**: `src/components/CustomDomainSettings.tsx`

**Features**:
- Add/remove domains
- DNS configuration instructions
- Verification status tracking
- SSL certificate status
- Copy DNS records to clipboard
- Domain activation toggle

**Usage**:
```tsx
import CustomDomainSettings from '@/components/CustomDomainSettings';

<CustomDomainSettings tenantId={tenantId} token={authToken} />
```

### 3. AdvancedBrandingControl Component
Super admin interface to enable/disable features per tenant.

**Location**: `src/components/AdvancedBrandingControl.tsx`

**Features**:
- Tenant selection dropdown
- Toggle switches for each feature
- Admin notes section
- Approval tracking
- Feature grouping (Standard vs Advanced)

**Usage**:
```tsx
import AdvancedBrandingControl from '@/components/AdvancedBrandingControl';

<AdvancedBrandingControl token={superAdminToken} />
```

---

## Custom Domain Setup

### DNS Verification Process

1. **Tenant adds domain** via CustomDomainSettings
2. **System generates verification token** and DNS records
3. **Tenant configures DNS** at their domain provider:
   - TXT record: `_pulss-verification.domain.com` → `verification_token`
   - CNAME or A record: `domain.com` → platform address
4. **Tenant clicks "Verify"** button
5. **System checks DNS records** and updates status
6. **If verified**, system provisions SSL certificate

### DNS Records Required

```
Type: TXT
Host: _pulss-verification.pharmacy.mycompany.com
Value: <verification_token>

Type: CNAME (or A)
Host: pharmacy.mycompany.com
Value: app.pulss.io (or platform IP)
```

### SSL Certificate Provisioning

The system uses Let's Encrypt for automatic SSL certificates:

1. Domain verification must be completed first
2. SSL provisioning starts automatically after verification
3. Certificate renewal happens automatically before expiration
4. Status tracked in `ssl_status` field

**Note**: In the current implementation, SSL provisioning is simulated. For production, integrate with Let's Encrypt using libraries like `acme-client` or services like Cloudflare.

---

## White-Label Features

When `white_label_enabled` is true for a tenant:

### 1. Platform Branding Hidden
- Main platform logo not displayed
- Platform name replaced with tenant name
- Platform footer removed

### 2. Custom Legal Content
- Custom terms of service URL
- Custom privacy policy URL
- Custom about page URL
- Custom copyright text

### 3. Custom Footer
- HTML footer content
- Social media links
- Custom contact information

### 4. Email White-Labeling
- Custom email header logo
- Custom email colors
- Custom email footer
- No platform branding in emails

### Implementation

Check white-label status in frontend:

```tsx
const branding = await fetch(`/api/branding/${tenantId}/public`);
const isWhiteLabel = branding.white_label_enabled;

if (!isWhiteLabel) {
  // Show platform branding
} else {
  // Show only tenant branding
}
```

---

## Email Branding

### Email Template Variables

Templates can use these branding variables:

```javascript
{
  logo_url: branding.email_header_logo_url,
  primary_color: branding.email_primary_color,
  company_name: branding.company_name,
  footer_text: branding.email_footer_text,
  support_email: branding.support_email,
  support_phone: branding.support_phone
}
```

### Example Email Template

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    .header { background: {{primary_color}}; padding: 20px; }
    .footer { background: #f5f5f5; padding: 20px; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <img src="{{logo_url}}" alt="{{company_name}}" height="50">
  </div>
  <div class="content">
    {{body_content}}
  </div>
  <div class="footer">
    <p>{{footer_text}}</p>
    <p>{{company_name}} | {{support_email}}</p>
  </div>
</body>
</html>
```

---

## Multi-Brand Support

For partners and resellers managing multiple brands under one tenant.

### Use Case
A pharmacy chain wants different branding for each location:
- Location A: "Downtown Pharmacy" with blue theme
- Location B: "Uptown Pharmacy" with green theme

### Implementation

1. **Enable multi_brand_enabled** for the tenant (super admin)
2. **Create brand configs** in `multi_brand_configs` table
3. **Route requests** based on brand identifier

```sql
INSERT INTO multi_brand_configs (
  tenant_id, brand_name, brand_slug, 
  logo_url, primary_color, settings
) VALUES (
  'tenant-id', 
  'Downtown Pharmacy', 
  'downtown',
  '/logos/downtown.png',
  '#3B82F6',
  '{"location": "downtown"}'::jsonb
);
```

### Frontend Usage

```tsx
// Route: /store/downtown
const brandSlug = 'downtown';
const brand = await fetch(`/api/brands/${tenantId}/${brandSlug}`);
// Apply brand.logo_url, brand.primary_color, etc.
```

---

## Webhooks & API

### Webhook Events

The system triggers webhooks for these events:
- `branding.updated`: Branding configuration changed
- `domain.added`: New custom domain added
- `domain.verified`: Domain verification successful
- `domain.removed`: Domain deleted
- `feature.enabled`: New feature enabled for tenant
- `feature.disabled`: Feature disabled for tenant

### Webhook Payload

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

### Webhook Security

Webhooks are signed with HMAC-SHA256:

```javascript
const crypto = require('crypto');

const signature = crypto
  .createHmac('sha256', webhook.webhook_secret)
  .update(JSON.stringify(payload))
  .digest('hex');
```

Verify in your webhook handler:

```javascript
const receivedSig = req.headers['x-webhook-signature'];
const expectedSig = computeSignature(req.body, secret);
if (receivedSig !== expectedSig) {
  return res.status(401).json({ error: 'Invalid signature' });
}
```

---

## Security Considerations

### 1. Input Validation
- Validate all color codes (hex format)
- Sanitize HTML content (custom footer, CSS)
- Validate domain names (regex pattern)
- Limit file upload sizes (logos, favicons)

### 2. Permission Checks
- Every API endpoint checks user role
- Feature flag verification before allowing actions
- Audit log for all changes

### 3. XSS Prevention
- Escape all user-generated content
- Use Content Security Policy (CSP) headers
- Sanitize custom CSS to prevent injection

### 4. CSRF Protection
- Use CSRF tokens for state-changing operations
- Validate origin headers

### 5. Rate Limiting
- Limit branding update frequency
- Throttle DNS verification attempts
- Restrict webhook delivery rate

---

## Extension Guide

### Adding a New Branding Feature

1. **Update Database Schema**:
```sql
ALTER TABLE tenant_branding
ADD COLUMN new_feature_config TEXT;
```

2. **Add Feature Flag**:
```sql
ALTER TABLE branding_feature_flags
ADD COLUMN new_feature_enabled BOOLEAN DEFAULT false;
```

3. **Update Controller**:
```javascript
// brandingController.js
const allowedFields = [...existing, 'new_feature_config'];
```

4. **Add Frontend UI**:
```tsx
// BrandingSettings.tsx
<div>
  <label>New Feature</label>
  <input
    value={branding.new_feature_config}
    onChange={(e) => setBranding({
      ...branding,
      new_feature_config: e.target.value
    })}
  />
</div>
```

5. **Add Permission Check**:
```javascript
if (updateData.new_feature_config && !flags.new_feature_enabled) {
  return res.status(403).json({ 
    error: 'New feature not enabled' 
  });
}
```

### Adding a New Webhook Event

1. **Define Event Type**:
```javascript
// webhookTrigger.js
const EVENT_TYPES = {
  ...existing,
  NEW_EVENT: 'new.event'
};
```

2. **Trigger Webhook**:
```javascript
await triggerWebhook(tenant_id, 'new.event', {
  data: { ... }
});
```

3. **Document Event** in API docs and this guide

---

## Troubleshooting

### Common Issues

**Issue**: Custom domain not verifying
- **Solution**: Check DNS propagation (use `dig` or `nslookup`)
- Wait up to 48 hours for DNS propagation
- Ensure TXT record is exactly as provided

**Issue**: Logo not displaying
- **Solution**: Check file permissions on uploads directory
- Verify file path is correct
- Check Content Security Policy allows image loading

**Issue**: Colors not applying
- **Solution**: Verify hex color format (#RRGGBB)
- Check CSS variable names in stylesheets
- Clear browser cache

**Issue**: White-label mode not hiding platform branding
- **Solution**: Check `white_label_enabled` flag
- Verify frontend is checking the flag
- Clear component cache

---

## Performance Optimization

### Caching Strategy

1. **Branding Configuration**: Cache for 5 minutes
2. **Feature Flags**: Cache for 10 minutes
3. **Public Branding**: Cache for 1 hour (CDN)
4. **Custom Domain Status**: Cache for 5 minutes

### Database Indexes

Ensure these indexes exist for performance:
```sql
CREATE INDEX idx_tenant_branding_tenant ON tenant_branding(tenant_id);
CREATE INDEX idx_custom_domains_tenant ON custom_domains(tenant_id);
CREATE INDEX idx_custom_domains_domain_name ON custom_domains(domain_name);
CREATE INDEX idx_branding_history_tenant ON branding_change_history(tenant_id);
```

---

## Future Enhancements

1. **A/B Testing**: Test different branding configurations
2. **Scheduled Branding**: Change branding based on schedule
3. **Geo-Based Branding**: Different branding per location
4. **Advanced Analytics**: Track branding impact on conversions
5. **Template Marketplace**: Pre-built branding templates
6. **AI-Powered Suggestions**: Smart color scheme recommendations
7. **Mobile App Branding**: Extend to native mobile apps
8. **Video Branding**: Custom video backgrounds and intros

---

## Support

For questions or issues:
- **Email**: support@pulss.io
- **Documentation**: https://docs.pulss.io
- **API Reference**: https://api.pulss.io/docs

---

**Last Updated**: 2024-01-15
**Version**: 1.0.0
