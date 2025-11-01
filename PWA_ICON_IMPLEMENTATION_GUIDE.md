# PWA Icon Implementation Guide

## Quick Setup Guide for Developers

### Prerequisites
- Backend server running with PostgreSQL
- Frontend development server running
- Admin account with tenant access

### Step 1: Database Migration

Run the migration to add PWA icon support:

```bash
cd backend
psql $DATABASE_URL -f migrations/10_add_pwa_icon_support.sql
```

Or if using local PostgreSQL:

```bash
psql -h localhost -U postgres -d pulssdb -f migrations/10_add_pwa_icon_support.sql
```

### Step 2: Verify Backend Routes

The following endpoints are now available:

1. **Upload PWA Icon**
   ```
   PUT /api/tenants/:tenantId/pwa-icon
   Content-Type: multipart/form-data
   Authorization: Bearer <token>
   Body: pwa_icon=<file>
   ```

2. **Upload Favicon**
   ```
   PUT /api/tenants/:tenantId/favicon
   Content-Type: multipart/form-data
   Authorization: Bearer <token>
   Body: favicon=<file>
   ```

3. **Get Dynamic Manifest**
   ```
   GET /api/tenants/:tenantId/manifest.json
   ```

### Step 3: Test the Feature

#### As an Admin:

1. **Login to Admin Panel**
   ```
   http://localhost:5173/admin
   ```

2. **Navigate to Onboarding** (or Settings if already onboarded)
   - Go to the "Branding" step
   - Find the "PWA App Icon" and "Favicon" upload sections
   - Upload a 512x512 PNG for the PWA icon
   - Upload a 32x32 PNG for the favicon

3. **Verify Upload**
   - Check that preview appears after upload
   - Verify that the file was uploaded to `/uploads` directory
   - Check the database that URLs were saved

#### As a Customer:

1. **Visit Store**
   ```
   http://localhost:5173/store/<tenant-id>
   ```

2. **Check Branding**
   - Verify favicon appears in browser tab
   - Check that page title matches store name
   - Inspect the manifest link in page source:
     ```html
     <link rel="manifest" href="http://localhost:3000/api/tenants/<tenant-id>/manifest.json">
     ```

3. **Install PWA** (Chrome)
   - Click the install icon in the address bar
   - Verify custom icon appears in install prompt
   - After installing, check home screen icon

#### Testing Different Scenarios:

**Test 1: Custom PWA Icon**
- Upload a custom PWA icon
- Install PWA
- Verify custom icon appears

**Test 2: No PWA Icon (Logo Fallback)**
- Remove PWA icon (don't upload one)
- Ensure logo exists
- Install PWA
- Verify logo is used as icon

**Test 3: No PWA Icon or Logo (Default Fallback)**
- Remove both PWA icon and logo
- Install PWA
- Verify default Pulss icon appears

**Test 4: Path-based Routing**
- Visit `/store/tenant-id`
- Verify branding is applied
- Check manifest link points to correct tenant

**Test 5: Multiple Tenants**
- Create two tenants with different icons
- Visit each store
- Verify correct branding for each

### Step 4: Browser Testing

Test on multiple browsers:

**Chrome/Edge (Desktop)**
1. Visit store URL
2. Click install icon in address bar
3. Verify icon in install prompt
4. Install and check desktop app icon

**Chrome (Android)**
1. Visit store URL
2. Menu > Add to Home Screen
3. Verify icon in prompt
4. Check home screen after install

**Safari (iOS)**
1. Visit store URL
2. Share > Add to Home Screen
3. Verify icon preview
4. Check home screen after install

**Firefox**
1. Visit store URL
2. Verify favicon in tab
3. Check manifest link in inspector

### Step 5: Verify Database

Check that icons were saved:

```sql
SELECT 
  t.tenant_id,
  t.name,
  ss.logo_url,
  ss.pwa_icon_url,
  ss.favicon_url
FROM tenants t
LEFT JOIN store_settings ss ON t.tenant_id = ss.tenant_id
WHERE t.tenant_id = '<your-tenant-id>';
```

### Step 6: Inspect Generated Manifest

Visit the manifest URL directly:

```
http://localhost:3000/api/tenants/<tenant-id>/manifest.json
```

Expected response:
```json
{
  "name": "Store Name",
  "short_name": "Store",
  "description": "Shop at Store Name - Your trusted local store",
  "start_url": "/store/<tenant-id>",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#6366F1",
  "icons": [
    {
      "src": "/uploads/icon.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/uploads/icon.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "categories": ["business", "shopping"],
  "lang": "en",
  "scope": "/",
  "orientation": "portrait-primary"
}
```

### Common Issues and Solutions

#### Issue 1: Upload fails with 400/500 error
**Solution:**
- Check that `uploads` directory exists and is writable
- Verify multer middleware is configured correctly
- Check file size (should be under 5MB)
- Ensure correct field name in form data

#### Issue 2: Icon not appearing in PWA install
**Solution:**
- Clear browser cache (Ctrl+Shift+R)
- Uninstall and reinstall PWA
- Verify manifest URL is accessible
- Check that icon URL in manifest is valid
- Ensure icon is at least 192x192

#### Issue 3: Favicon not updating
**Solution:**
- Browsers heavily cache favicons
- Clear browser cache completely
- Close and reopen tab
- Try incognito/private mode
- Check favicon URL in page source

#### Issue 4: Wrong tenant branding showing
**Solution:**
- Check tenant ID detection in console
- Verify URL format (subdomain or path-based)
- Clear localStorage (it may cache tenant ID)
- Check that `initializeTenantPWA()` is called

#### Issue 5: Default icon used instead of custom
**Solution:**
- Verify upload was successful
- Check database for icon URL
- Ensure icon file exists in uploads directory
- Check file permissions
- Verify manifest endpoint returns correct icon URL

### Development Tips

1. **Use browser DevTools**
   - Application tab > Manifest to inspect PWA manifest
   - Console to check for errors in tenant detection
   - Network tab to verify icon URLs load correctly

2. **Test with different image formats**
   - PNG (recommended)
   - JPG (works but no transparency)
   - WebP (modern format, good compression)
   - SVG (for default fallback only)

3. **Test at different sizes**
   - 32x32 (favicon)
   - 192x192 (small PWA icon)
   - 512x512 (large PWA icon)
   - Check that images look good at all sizes

4. **Monitor console logs**
   - Check for PWA initialization messages
   - Watch for tenant detection logs
   - Look for manifest loading errors

### Production Deployment

Before deploying to production:

1. **Update environment variables**
   ```env
   VITE_API_URL=https://api.yourdomain.com
   BASE_URL=https://yourdomain.com
   ```

2. **Configure HTTPS**
   - PWA requires HTTPS in production
   - Set up SSL certificate
   - Update CORS settings

3. **Set up file storage**
   - Consider using cloud storage (S3, CloudFlare R2)
   - Or ensure persistent volume for uploads
   - Set appropriate file permissions

4. **Test subdomain routing**
   - Configure DNS for wildcard subdomains (*.yourdomain.com)
   - Test subdomain-based tenant detection
   - Verify SSL works for all subdomains

5. **Performance optimization**
   - Enable image optimization
   - Set cache headers for icons
   - Consider CDN for static assets

### Monitoring

Monitor the following in production:

1. **Upload success rate**
   - Track failed uploads
   - Monitor file size issues
   - Check storage capacity

2. **PWA installations**
   - Use analytics to track PWA installs
   - Monitor installation success rate
   - Track which tenants have custom icons

3. **Icon loading performance**
   - Monitor icon load times
   - Check for 404s on icon URLs
   - Optimize image sizes if needed

### Next Steps

After successful implementation:

1. **User Training**
   - Create video tutorial for admins
   - Update help documentation
   - Add tooltips in UI

2. **Feature Enhancements**
   - Add icon cropper tool
   - Support multiple icon sizes
   - Add icon preview at different sizes
   - Implement icon quality validation

3. **Analytics**
   - Track PWA install conversions
   - Monitor icon upload rates
   - Measure branding impact on installs

---

**Need Help?**
- Check [PWA_ICON_DOCUMENTATION.md](./PWA_ICON_DOCUMENTATION.md) for user guide
- Review backend logs for API errors
- Use browser DevTools for frontend debugging
- Test in incognito mode to avoid cache issues
