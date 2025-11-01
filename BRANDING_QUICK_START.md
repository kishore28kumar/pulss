# Branding System Quick Start Guide

## Overview

The Advanced Branding & White-Label Controls System allows you to customize every aspect of your tenant's storefront, from logos and colors to custom domains and branded communications.

## For Super Admins

### 1. Enable Branding Features for a Tenant

1. Navigate to Super Admin Dashboard → **Controls** tab
2. Select the tenant you want to configure
3. Choose a tier preset or customize individual features:
   - **Basic Tier**: Logo, colors, 1 custom domain
   - **Professional Tier**: + Fonts, branded email, 3 domains
   - **Enterprise Tier**: + White-label, CSS, unlimited domains
4. Click **Save Feature Toggles**

### 2. Quick Enable via API

```bash
# Enable Professional tier features
curl -X PUT https://your-api.com/api/branding/toggles/TENANT_ID \
  -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "custom_logo_enabled": true,
    "custom_colors_enabled": true,
    "custom_fonts_enabled": true,
    "custom_domain_enabled": true,
    "branded_email_enabled": true,
    "max_custom_domains": 3,
    "max_logo_size_mb": 10,
    "max_asset_storage_mb": 500
  }'
```

### 3. Monitor Usage

Check audit logs in the Controls tab to see:
- Who changed what
- When changes were made
- Previous and new values
- IP addresses and user roles

## For Tenant Admins

### 1. Configure Your Branding

1. Navigate to Admin Dashboard → **Branding** tab
2. Upload your logo (light and dark versions)
3. Set your brand colors using the color picker
4. Choose custom fonts
5. Click **Save**

### 2. Set Up Custom Domain

1. In Branding tab → **Domains** section
2. Click **Add Custom Domain**
3. Enter your domain (e.g., `shop.mystore.com`)
4. Copy the DNS TXT record provided
5. Add the record to your DNS settings
6. Wait for verification (usually 5-30 minutes)
7. SSL certificate will be issued automatically

### 3. Customize Email Templates

1. In Branding tab → **Communication** section
2. Select **Email Templates**
3. Customize templates:
   - Order Confirmation
   - Welcome Email
   - Password Reset
4. Use variables like `{{customer_name}}`, `{{order_id}}`
5. Preview and Save

## Common Tasks

### Upload a New Logo

```bash
curl -X POST https://your-api.com/api/branding/assets/TENANT_ID/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "asset=@logo.png" \
  -F "branding_id=YOUR_BRANDING_ID" \
  -F "asset_type=logo"
```

### Export Your Configuration

```bash
curl -X GET https://your-api.com/api/branding/export/TENANT_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  > branding-backup.json
```

### Import Configuration

```bash
curl -X POST https://your-api.com/api/branding/import/TENANT_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d @branding-backup.json
```

## Feature Tiers

### Basic Tier (Free)
✅ Custom logo (1 file, 5MB max)
✅ Basic color customization
✅ 1 custom domain
✅ 100MB asset storage

### Professional Tier
✅ All Basic features
✅ Dark mode logo
✅ Complete color palette
✅ Custom fonts
✅ Branded emails
✅ 3 custom domains
✅ 500MB asset storage

### Enterprise Tier
✅ All Professional features
✅ White-label mode (no Pulss branding)
✅ Custom CSS
✅ Branded SMS
✅ Branded notifications
✅ API docs branding
✅ Unlimited custom domains
✅ 5GB asset storage
✅ Region customization
✅ Export/Import

## Architecture

```
┌──────────────────┐
│  Super Admin     │──► Enables features via toggles
│  Panel           │
└──────────────────┘
         │
         ▼
┌──────────────────┐
│ Feature Toggles  │──► Gates access to features
│  (per tenant)    │
└──────────────────┘
         │
         ▼
┌──────────────────┐
│ Tenant Admin     │──► Configures branding
│  Panel           │
└──────────────────┘
         │
         ▼
┌──────────────────┐
│ Branding Config  │──► Stores configuration
│  + Assets        │
└──────────────────┘
         │
         ▼
┌──────────────────┐
│ Customer-facing  │──► Displays branded store
│  Application     │
└──────────────────┘
```

## Database Tables

1. **branding_configs** - Main branding data
2. **branding_feature_toggles** - Super admin controls
3. **branding_assets** - Uploaded files
4. **branding_templates** - Email/SMS templates
5. **branding_audit_logs** - Change history
6. **custom_domains** - Domain verification

## API Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/branding/config/:tenant_id` | Get branding config | Admin |
| PUT | `/api/branding/config/:tenant_id` | Update branding | Admin |
| GET | `/api/branding/toggles/:tenant_id` | Get feature toggles | Super Admin |
| PUT | `/api/branding/toggles/:tenant_id` | Update toggles | Super Admin |
| POST | `/api/branding/assets/:tenant_id/upload` | Upload asset | Admin |
| GET | `/api/branding/export/:tenant_id` | Export config | Admin |
| POST | `/api/branding/import/:tenant_id` | Import config | Admin |
| GET | `/api/branding/audit/:tenant_id` | Get audit logs | Admin |
| GET | `/api/branding/templates` | Get templates | Admin |
| POST | `/api/branding/domains/:tenant_id` | Add custom domain | Admin |
| GET | `/api/branding/domains/:tenant_id` | List domains | Admin |

## Security

- ✅ All endpoints require authentication
- ✅ Role-based access control (RBAC)
- ✅ Tenant isolation enforced
- ✅ Feature toggle validation
- ✅ File size limits enforced
- ✅ Rate limiting applied
- ✅ Complete audit trail
- ✅ SQL injection prevention
- ✅ XSS protection

## Troubleshooting

### Feature Not Available
**Error**: "Feature not enabled for this tenant"
**Solution**: Super admin needs to enable the feature via toggles

### Domain Verification Failed
**Error**: Domain shows "verification failed"
**Solution**: 
1. Check DNS TXT record is correctly added
2. Wait up to 30 minutes for DNS propagation
3. Ensure record name matches: `_pulss-verification.yourdomain.com`

### Asset Upload Fails
**Error**: "File size exceeds limit"
**Solution**: 
1. Compress your image
2. Or ask super admin to increase limit

### Template Not Rendering
**Error**: Variables not being replaced
**Solution**: Check variable names match template spec:
- `{{customer_name}}` not `{{customername}}`
- `{{order_id}}` not `{{orderId}}`

## Best Practices

### Asset Management
1. Use SVG for logos (scales perfectly)
2. Optimize images before upload
3. Use consistent naming conventions
4. Keep backups of all assets

### Domain Management
1. Verify domains promptly after adding
2. Keep SSL certificates updated (automatic)
3. Use primary domain for all emails
4. Test domains thoroughly before going live

### Template Management
1. Test templates before deploying
2. Use variables for dynamic content
3. Keep templates mobile-responsive
4. Maintain multi-language versions

### Configuration Management
1. Export configuration regularly
2. Test imports in staging first
3. Document all customizations
4. Use version control for templates

## Support

### Documentation
- Full Guide: `ADVANCED_BRANDING_SYSTEM.md`
- API Docs: See "API Endpoints" section
- Examples: See common tasks above

### Contact
- Check audit logs for errors
- Include tenant_id in support requests
- Provide error messages and timestamps

## Migration

To enable the branding system on an existing installation:

```bash
# 1. Run the database migration
psql $DATABASE_URL -f backend/migrations/12_create_branding_system.sql

# 2. Ensure upload directory exists
mkdir -p backend/uploads
chmod 755 backend/uploads

# 3. Restart backend server
cd backend && npm start

# 4. Verify API is working
curl http://localhost:3000/api/branding/templates
```

## Example Workflow

### Setting Up a New Tenant (Super Admin)

1. Create tenant in Tenant Management
2. Go to Controls tab
3. Select tenant
4. Enable Professional tier features
5. Set resource limits
6. Save toggles
7. Notify tenant admin

### Customizing Brand (Tenant Admin)

1. Log in to admin panel
2. Go to Branding tab
3. Upload logo (light version)
4. Upload logo (dark version)
5. Set primary color
6. Set secondary color
7. Choose heading font
8. Add custom domain
9. Configure DNS
10. Wait for verification
11. Customize email templates
12. Preview changes
13. Save and publish

### Maintaining Branding (Ongoing)

1. Export configuration monthly (backup)
2. Review audit logs weekly
3. Update assets as needed
4. Monitor domain SSL status
5. Test templates regularly
6. Update compliance templates as regulations change

---

**Version**: 1.0.0
**Last Updated**: October 20, 2025
**Status**: Production Ready
