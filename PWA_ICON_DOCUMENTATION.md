# PWA Icon Support Documentation

## Overview

The Pulss platform now supports per-tenant PWA (Progressive Web App) icons and favicons, allowing each store to have its own custom branding when customers install the app on their devices.

## Features

- **Custom PWA Icons**: Each tenant can upload a custom app icon (512x512 PNG recommended)
- **Custom Favicons**: Each tenant can upload a custom favicon for browser tabs (32x32 or 64x64 PNG/ICO)
- **Dynamic Manifest**: Automatically generates tenant-specific manifest.json files
- **Automatic Fallback**: Uses tenant logo if no custom PWA icon is provided, falls back to default Pulss icon if neither is available
- **Tenant-Specific Branding**: Favicon, theme colors, and app name are all customized per tenant

## For Store Admins

### Uploading Your PWA Icon

1. **During Onboarding**:
   - Navigate to the "Branding" step in the onboarding flow
   - You'll see two upload sections: "PWA App Icon" and "Favicon"
   - Upload your custom app icon (recommended: 512x512 PNG with transparent background)
   - Upload your favicon (recommended: 32x32 or 64x64 PNG/ICO)

2. **After Onboarding** (Settings Page):
   - Go to Store Settings > Branding
   - Update your PWA icon or favicon at any time
   - Changes take effect immediately for new PWA installations

### Icon Requirements

#### PWA App Icon
- **Format**: PNG (preferred), JPG, or WebP
- **Size**: 512x512 pixels recommended (minimum 192x192)
- **Shape**: Square image works best
- **Background**: Transparent background recommended for best results
- **File Size**: Maximum 5MB
- **Design Tips**: 
  - Use simple, recognizable imagery
  - Avoid text (it becomes hard to read at small sizes)
  - Ensure good contrast and visibility
  - Test at different sizes

#### Favicon
- **Format**: PNG or ICO
- **Size**: 32x32 or 64x64 pixels
- **Shape**: Square
- **File Size**: Maximum 5MB
- **Design Tips**:
  - Keep it very simple (it's displayed very small)
  - Use your brand colors
  - High contrast works best

### What Happens When

1. **If you upload a custom PWA icon**: Customers installing your store as a PWA will see your custom icon on their home screen
2. **If you only upload a logo (no PWA icon)**: Your logo will be used as the PWA icon
3. **If you upload neither**: The default Pulss icon will be used as a fallback

## For Customers

### Installing the PWA

1. Visit your store URL (e.g., `yourstorename.pulss.com` or `pulss.com/store/your-store-id`)
2. On mobile browsers (Chrome, Safari):
   - Tap the browser menu
   - Select "Add to Home Screen" or "Install App"
   - The custom store icon will appear in the install prompt
3. On desktop browsers (Chrome, Edge):
   - Click the install icon in the address bar
   - Or use browser menu > "Install [Store Name]"

### What You'll See

- **Home Screen Icon**: The store's custom PWA icon
- **Browser Tab**: The store's custom favicon
- **Splash Screen**: Store branding while the app loads
- **App Name**: The store's custom name

## Technical Details

### API Endpoints

#### Upload PWA Icon
```
PUT /api/tenants/:tenantId/pwa-icon
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body:
  pwa_icon: <file>
```

#### Upload Favicon
```
PUT /api/tenants/:tenantId/favicon
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body:
  favicon: <file>
```

#### Get Dynamic Manifest
```
GET /api/tenants/:tenantId/manifest.json
```

Returns a JSON manifest with tenant-specific:
- App name
- Icons (custom or fallback)
- Theme colors
- Start URL

### Database Schema

The following fields have been added to support PWA icons:

**store_settings table**:
- `pwa_icon_url`: URL to custom PWA icon
- `favicon_url`: URL to custom favicon

**tenant_settings table**:
- `pwa_icon_url`: URL to custom PWA icon (alternative location)

### Manifest Generation

The manifest is dynamically generated per tenant with the following structure:

```json
{
  "name": "Store Name",
  "short_name": "Store",
  "description": "Shop at Store Name - Your trusted local store",
  "start_url": "/store/tenant-id",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#6366F1",
  "icons": [
    {
      "src": "/uploads/icon-512.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/uploads/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### Tenant Detection

The system supports multiple ways to detect the current tenant:

1. **Subdomain-based**: `tenant1.pulss.com`
2. **Path-based**: `pulss.com/store/tenant-id`
3. **Local Storage**: For development/testing (selected_tenant_id)

### Automatic Branding Application

When a customer visits a store, the system automatically:
1. Updates the manifest link to point to tenant-specific manifest
2. Updates the favicon in the page head
3. Updates the theme color meta tag
4. Updates the page title

## Troubleshooting

### Icon Not Appearing in PWA Install

1. **Clear browser cache**: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
2. **Check image format**: Ensure PNG format for best compatibility
3. **Check image size**: Minimum 192x192, recommended 512x512
4. **Uninstall and reinstall**: Remove existing PWA and install again
5. **Check browser console**: Look for manifest errors

### Favicon Not Showing

1. **Clear browser cache**: Browsers heavily cache favicons
2. **Check file format**: PNG or ICO work best
3. **Close and reopen browser tab**: Favicon updates may require page reload
4. **Check file size**: Should be small (typically under 100KB)

### Fallback Icon Being Used

If you've uploaded an icon but the default is showing:
1. Verify upload was successful (check admin panel)
2. Check that the icon URL is valid
3. Ensure proper permissions on upload directory
4. Check browser developer tools > Network tab for 404 errors

## Best Practices

1. **Design for Multiple Sizes**: Your icon should look good from 32x32 to 512x512
2. **Keep It Simple**: Avoid complex details that won't be visible at small sizes
3. **Use Brand Colors**: Maintain consistency with your overall branding
4. **Test on Devices**: Install the PWA on actual devices to see how it looks
5. **Provide Context**: Use recognizable imagery related to your business
6. **Consider Safe Zones**: Account for iOS icon masking (use simple centered designs)

## Migration Notes

For existing tenants:
- Default behavior is to use the logo as PWA icon if no custom icon is uploaded
- No action required for existing stores
- Can upload custom icons at any time through the admin panel
- Existing PWA installations will update on next visit after icon upload

## Support

If you have questions or need assistance:
- Documentation: See this file
- Admin Guide: Check the onboarding flow for visual guides
- Support: Contact via WhatsApp or email support

---

Last Updated: 2025-10-16
Version: 1.0
