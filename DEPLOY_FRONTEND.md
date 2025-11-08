# Frontend Deployment Guide

Your backend is now live at: **https://pulss.onrender.com** ✅

This guide will help you deploy the Storefront and Admin Dashboard.

---

## Prerequisites

- ✅ Backend deployed and running
- ✅ API endpoints updated to production URL
- 📝 Note your backend URL: `https://pulss.onrender.com`

---

## Option 1: Deploy with Render Blueprint (Recommended - Easiest)

This automatically creates all services at once.

### Steps:

1. **Update Backend Environment Variables**
   - Go to Render Dashboard → Backend Service → Environment
   - Add these variables (you'll get the frontend URLs after deployment):
   ```
   FRONTEND_URL=https://pulss-storefront.onrender.com
   ADMIN_URL=https://pulss-admin.onrender.com
   ```
   - Save and wait for redeploy

2. **Deploy All Services via Blueprint**
   - Render Dashboard → New → Blueprint
   - Connect your GitHub repository
   - Render creates all services from `render.yaml`
   - Add missing environment variables:
     - Stripe keys
     - Cloudinary credentials
     - Email configuration

3. **Verify Deployment**
   - Check each service is "Live"
   - Test the health endpoint: `https://pulss.onrender.com/health`

---

## Option 2: Manual Deployment (Step-by-Step)

### Step 1: Deploy Storefront

1. **Create New Web Service on Render**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New" → "Web Service"
   - Connect your GitHub repository

2. **Configure Service**
   ```
   Name: pulss-storefront
   Environment: Docker
   Dockerfile Path: ./apps/storefront/Dockerfile
   Docker Context: .
   Region: Oregon (same as backend)
   Plan: Starter ($7/month)
   ```

3. **Add Environment Variables**
   Click "Advanced" → "Add Environment Variable":
   ```
   NEXT_PUBLIC_API_URL=https://pulss.onrender.com/api
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
   NEXT_PUBLIC_TENANT_SLUG=default
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Wait 5-10 minutes for build
   - Note your storefront URL (e.g., `https://pulss-storefront.onrender.com`)

### Step 2: Deploy Admin Dashboard

1. **Create New Web Service**
   - Render Dashboard → New → Web Service
   - Connect your repository

2. **Configure Service**
   ```
   Name: pulss-admin
   Environment: Docker
   Dockerfile Path: ./apps/admin-dashboard/Dockerfile
   Docker Context: .
   Region: Oregon (same as backend)
   Plan: Starter ($7/month)
   ```

3. **Add Environment Variables**
   ```
   NEXT_PUBLIC_API_URL=https://pulss.onrender.com/api
   NEXT_PUBLIC_TENANT_SLUG=default
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Wait 5-10 minutes for build
   - Note your admin URL (e.g., `https://pulss-admin.onrender.com`)

### Step 3: Update Backend CORS

Now that you have frontend URLs, update the backend:

1. **Go to Backend Service on Render**
   - Navigate to Environment tab
   - Add/Update these variables:

   ```
   FRONTEND_URL=https://pulss-storefront.onrender.com
   ADMIN_URL=https://pulss-admin.onrender.com
   ```

2. **Save Changes**
   - Backend will automatically redeploy with new CORS settings

---

## Post-Deployment Checklist

### ✅ Backend
- [ ] Service is "Live" on Render
- [ ] Health check passes: `curl https://pulss.onrender.com/health`
- [ ] Environment: `NODE_ENV=production`
- [ ] CORS configured with frontend URLs

### ✅ Storefront
- [ ] Service is "Live" on Render
- [ ] Can access homepage
- [ ] API calls work (check browser console)
- [ ] Stripe integration configured

### ✅ Admin Dashboard
- [ ] Service is "Live" on Render
- [ ] Can access login page
- [ ] API calls work (check browser console)
- [ ] Can log in with admin credentials

---

## Testing Your Deployment

### 1. Test Backend Health
```bash
curl https://pulss.onrender.com/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "Pulss API is running"
}
```

### 2. Test Storefront
- Visit: `https://your-storefront-url.onrender.com`
- Check: Homepage loads
- Check: Products page works
- Check: Browser console has no CORS errors

### 3. Test Admin Dashboard
- Visit: `https://your-admin-url.onrender.com/login`
- Try logging in with admin credentials
- Check: Dashboard loads after login
- Check: Can view/manage data

---

## Common Issues & Solutions

### Issue: "CORS Policy Error"

**Symptom:** Browser console shows:
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Solution:**
1. Verify backend environment variables are set correctly:
   - `FRONTEND_URL` = your storefront URL
   - `ADMIN_URL` = your admin dashboard URL
2. Make sure URLs don't have trailing slashes
3. Backend will auto-redeploy after saving env vars

### Issue: "Network Error" or "ERR_CONNECTION_REFUSED"

**Symptom:** API calls fail completely

**Solution:**
1. Check backend is running (should show "Live" on Render)
2. Verify `NEXT_PUBLIC_API_URL` in frontend environment variables
3. Test backend directly: `curl https://pulss.onrender.com/health`

### Issue: Build Fails for Frontend

**Symptom:** Docker build fails during deployment

**Solution:**
1. Check build logs for specific error
2. Verify Dockerfile path and context are correct:
   - Path: `./apps/storefront/Dockerfile` (or admin-dashboard)
   - Context: `.` (root of repository)
3. Ensure packages/types is building correctly

### Issue: "Cannot find module @pulss/types"

**Symptom:** Build or runtime error about missing module

**Solution:**
- Already fixed! The Dockerfiles now build shared packages
- If still occurring, verify you've pulled latest changes

---

## Environment Variables Reference

### Backend (Required)
```bash
# Core
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# CORS (use actual deployed URLs)
FRONTEND_URL=https://pulss-storefront.onrender.com
ADMIN_URL=https://pulss-admin.onrender.com

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourdomain.com

# Redis (optional)
REDIS_URL=redis://...
```

### Storefront (Required)
```bash
NEXT_PUBLIC_API_URL=https://pulss.onrender.com/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_TENANT_SLUG=default
```

### Admin Dashboard (Required)
```bash
NEXT_PUBLIC_API_URL=https://pulss.onrender.com/api
NEXT_PUBLIC_TENANT_SLUG=default
```

---

## Database Setup

If you haven't already, run migrations and seed data:

1. **Access Backend Shell on Render**
   - Go to Backend Service
   - Click "Shell" tab

2. **Run Commands**
   ```bash
   cd /app/packages/database
   npx prisma migrate deploy
   npx prisma db seed
   ```

3. **Verify**
   - Check that tables are created
   - Verify seed data exists

---

## Custom Domains (Optional)

To use your own domain instead of `.onrender.com`:

1. **In Render Dashboard**
   - Go to each service
   - Navigate to "Settings" → "Custom Domains"
   - Add your domain (e.g., `shop.yourdomain.com`)

2. **Update DNS**
   - Add CNAME record pointing to Render
   - Wait for DNS propagation (5-30 minutes)

3. **Update Environment Variables**
   - Update `FRONTEND_URL` and `ADMIN_URL` in backend
   - Update CORS accordingly

---

## Cost Estimation

### Basic Setup (All services on Render)
- PostgreSQL: $7/month
- Backend: $7/month
- Storefront: $7/month
- Admin Dashboard: $7/month
- **Total: ~$28/month**

### With Free Tier (Limited)
- Can use Render free tier initially
- Services sleep after 15 min of inactivity
- Good for testing, not production

---

## Next Steps After Deployment

1. **Configure Stripe Webhooks**
   - Stripe Dashboard → Webhooks
   - Add endpoint: `https://pulss.onrender.com/api/stripe/webhook`
   - Copy webhook secret to backend env vars

2. **Create First Tenant/Store**
   ```bash
   curl -X POST https://pulss.onrender.com/api/tenants/register \
     -H "Content-Type: application/json" \
     -d '{
       "storeName": "My Store",
       "subdomain": "mystore",
       "ownerEmail": "admin@example.com",
       "ownerPassword": "SecurePassword123!"
     }'
   ```

3. **Test End-to-End Flow**
   - Create a product in admin
   - View product on storefront
   - Add to cart and checkout
   - Verify order in admin dashboard

4. **Set Up Monitoring**
   - Enable Render metrics
   - Set up uptime monitoring (UptimeRobot, Pingdom)
   - Configure error tracking (Sentry)

---

## Support

If you encounter issues:
- Check Render logs: Service → Logs tab
- Review CORS settings in backend
- Verify all environment variables are set
- Test backend health endpoint first

---

## Summary

You've successfully updated your applications to use the production API! 

**What changed:**
- ✅ Storefront API endpoint → `https://pulss.onrender.com/api`
- ✅ Admin Dashboard API endpoint → `https://pulss.onrender.com/api`
- ✅ Both apps ready for deployment

**Ready to deploy:**
```bash
git add .
git commit -m "Configure production API endpoints for frontend apps"
git push origin main
```

Then follow either Option 1 (Blueprint) or Option 2 (Manual) above to deploy!

