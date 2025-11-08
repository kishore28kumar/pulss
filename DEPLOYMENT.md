# Deployment Guide for Pulss E-commerce Platform

This guide covers deploying the Pulss multi-tenant e-commerce platform to various cloud providers.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Deployment Options](#deployment-options)
  - [Render.com (Recommended)](#rendercom-recommended)
  - [Railway](#railway)
  - [Vercel + Render](#vercel--render)
  - [Docker Compose](#docker-compose)
- [Post-Deployment Steps](#post-deployment-steps)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

1. **GitHub Account** - Repository hosted on GitHub
2. **Cloud Provider Account** - Choose one:
   - Render.com (Recommended for beginners)
   - Railway
   - Vercel
   - AWS/GCP/Azure (for advanced users)
3. **Required Service Accounts**:
   - Stripe account (for payments)
   - Cloudinary account (for image storage)
   - Email service (Gmail, SendGrid, etc.)
   - Redis instance (optional, for caching)

---

## Environment Variables

### Backend Environment Variables

Create a `.env` file in `apps/backend/` with:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/database"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-this"

# CORS Origins
FRONTEND_URL="https://your-storefront-domain.com"
ADMIN_URL="https://your-admin-domain.com"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Redis (optional)
REDIS_URL="redis://localhost:6379"

# Email
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"
EMAIL_FROM="noreply@yourdomain.com"

# Server
PORT=5000
NODE_ENV=production
```

### Storefront Environment Variables

Create `.env.local` in `apps/storefront/`:

```env
NEXT_PUBLIC_API_URL="https://your-backend-domain.com/api"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

### Admin Dashboard Environment Variables

Create `.env.local` in `apps/admin-dashboard/`:

```env
NEXT_PUBLIC_API_URL="https://your-backend-domain.com/api"
```

---

## Deployment Options

### Render.com (Recommended)

Render provides the simplest deployment experience with built-in PostgreSQL and automatic SSL certificates.

#### Using Blueprint (Automated)

1. **Fork/Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/pulss.git
   cd pulss
   ```

2. **Push to Your GitHub**
   ```bash
   git remote set-url origin https://github.com/yourusername/pulss.git
   git push -u origin main
   ```

3. **Deploy via Render Dashboard**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New" → "Blueprint"
   - Connect your GitHub repository
   - Render will auto-detect `render.yaml` and create all services

4. **Set Environment Variables**
   - Go to each service (backend, storefront, admin)
   - Navigate to "Environment" tab
   - Add the missing variables (Stripe keys, Cloudinary, etc.)
   - Click "Save Changes"

5. **Database Migration**
   - Once backend is deployed, access the shell:
   ```bash
   cd packages/database
   npx prisma migrate deploy
   npx prisma db seed
   ```

#### Manual Deployment on Render

If you prefer manual setup:

**1. Create PostgreSQL Database:**
- New → PostgreSQL
- Name: `pulss-postgres`
- Plan: Starter ($7/month)
- Save the DATABASE_URL

**2. Deploy Backend:**
- New → Web Service
- Connect your repo
- Settings:
  - Name: `pulss-backend`
  - Environment: Docker
  - Dockerfile Path: `./apps/backend/Dockerfile`
  - Docker Context: `.`
  - Plan: Starter
- Add all backend environment variables
- Deploy

**3. Deploy Storefront:**
- New → Web Service
- Settings:
  - Name: `pulss-storefront`
  - Environment: Docker
  - Dockerfile Path: `./apps/storefront/Dockerfile`
  - Docker Context: `.`
  - Plan: Starter
- Add storefront environment variables
- Deploy

**4. Deploy Admin Dashboard:**
- New → Web Service
- Settings:
  - Name: `pulss-admin`
  - Environment: Docker
  - Dockerfile Path: `./apps/admin-dashboard/Dockerfile`
  - Docker Context: `.`
  - Plan: Starter
- Add admin environment variables
- Deploy

---

### Railway

Railway offers similar simplicity with better pricing for small projects.

**1. Install Railway CLI:**
```bash
npm i -g @railway/cli
railway login
```

**2. Initialize Project:**
```bash
railway init
```

**3. Add PostgreSQL:**
```bash
railway add -d postgres
```

**4. Deploy Each Service:**

```bash
# Backend
cd apps/backend
railway up --service backend

# Storefront
cd ../storefront
railway up --service storefront

# Admin Dashboard
cd ../admin-dashboard
railway up --service admin
```

**5. Set Environment Variables:**
```bash
railway variables set DATABASE_URL=<your-db-url>
railway variables set JWT_SECRET=<your-secret>
# ... add all other variables
```

---

### Vercel + Render

Use Vercel for Next.js apps (faster edge deployment) and Render for backend.

**1. Deploy Backend to Render:**
- Follow Render backend deployment steps above

**2. Deploy Storefront to Vercel:**
```bash
cd apps/storefront
npm i -g vercel
vercel
```
- Set environment variables in Vercel dashboard

**3. Deploy Admin to Vercel:**
```bash
cd apps/admin-dashboard
vercel
```

---

### Docker Compose (Self-Hosted)

For VPS deployment (DigitalOcean, AWS EC2, etc.)

**1. Install Docker & Docker Compose:**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo apt-get install docker-compose-plugin
```

**2. Clone Repository:**
```bash
git clone https://github.com/yourusername/pulss.git
cd pulss
```

**3. Configure Environment:**
```bash
cp .env.example .env
# Edit .env with your production values
nano .env
```

**4. Start Services:**
```bash
docker-compose up -d
```

**5. Run Migrations:**
```bash
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npx prisma db seed
```

**6. Setup Nginx Reverse Proxy:**
```nginx
# /etc/nginx/sites-available/pulss

# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Storefront
server {
    listen 80;
    server_name shop.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Admin Dashboard
server {
    listen 80;
    server_name admin.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**7. Enable SSL with Certbot:**
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com -d shop.yourdomain.com -d admin.yourdomain.com
```

---

## Post-Deployment Steps

### 1. Verify Database Connection
```bash
# For Render/Railway
# Access shell and run:
npx prisma db push
npx prisma db seed
```

### 2. Create First Tenant/Store
```bash
curl -X POST https://your-backend-url.com/api/tenants/register \
  -H "Content-Type: application/json" \
  -d '{
    "storeName": "My Store",
    "subdomain": "mystore",
    "ownerEmail": "admin@example.com",
    "ownerPassword": "SecurePassword123!"
  }'
```

### 3. Configure Stripe Webhooks
- Go to Stripe Dashboard → Webhooks
- Add endpoint: `https://your-backend-url.com/api/stripe/webhook`
- Select events: `checkout.session.completed`, `payment_intent.succeeded`
- Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

### 4. Test the Application
- Storefront: `https://your-storefront-domain.com`
- Admin: `https://your-admin-domain.com/login`
- API Health: `https://your-backend-domain.com/api/health`

---

## Troubleshooting

### Build Failures

**Error: `Cannot find module '@pulss/database'`**
- **Solution**: Ensure Dockerfiles include the `packages/` directory
- Verify Prisma client is generated during build:
  ```dockerfile
  RUN npx prisma generate
  ```

**Error: `ENOENT: no such file or directory`**
- **Solution**: Check Docker context is set to root (`.`) not individual app directories

### Runtime Errors

**Error: `PrismaClientInitializationError`**
- **Solution**: Verify DATABASE_URL is correct
- Check database is accessible from your service
- Run migrations: `npx prisma migrate deploy`

**Error: `CORS blocked`**
- **Solution**: Update FRONTEND_URL and ADMIN_URL in backend env vars
- Ensure they match your deployed URLs exactly (no trailing slash)

**Error: `Stripe webhook signature verification failed`**
- **Solution**: Update STRIPE_WEBHOOK_SECRET with the correct webhook signing secret
- Make sure you're using the webhook secret, not the API secret

### Database Issues

**Connection Timeout:**
- Check if database instance is running
- Verify firewall rules allow connection
- Confirm DATABASE_URL format is correct

**Migration Failed:**
```bash
# Reset and rerun migrations
npx prisma migrate reset
npx prisma migrate deploy
```

### Performance Issues

**Slow API Responses:**
- Enable Redis caching (set REDIS_URL)
- Check database query performance
- Consider upgrading to higher tier plan

**Memory Errors:**
- Increase memory allocation in hosting platform
- Optimize database queries
- Enable connection pooling

---

## Monitoring & Logs

### Render
- View logs: Dashboard → Service → Logs tab
- Metrics: Dashboard → Service → Metrics tab

### Railway
```bash
railway logs
railway logs --service backend
```

### Docker
```bash
docker-compose logs -f backend
docker-compose logs -f storefront
docker-compose logs -f admin
```

---

## Scaling Recommendations

### Small Traffic (< 1,000 users/day)
- Render Starter plan ($7/month per service)
- PostgreSQL Starter ($7/month)
- Total: ~$30/month

### Medium Traffic (1,000 - 10,000 users/day)
- Render Professional plan ($25/month per service)
- PostgreSQL Standard ($20/month)
- Redis instance ($10/month)
- Total: ~$105/month

### High Traffic (> 10,000 users/day)
- Consider load balancing
- Database read replicas
- CDN for static assets (Cloudflare)
- Horizontal scaling with Kubernetes

---

## Support

For issues or questions:
- GitHub Issues: https://github.com/kishore28kumar/pulss/issues
- Documentation: See README.md and API.md
- Email: support@yourdomain.com

---

## License

This project is licensed under the MIT License.

