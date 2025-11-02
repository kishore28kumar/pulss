# 🛠️ Pulss Platform - Setup Guide

Complete step-by-step guide to get Pulss running on your machine.

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

### Required
- **Node.js** v18.0.0 or higher
- **npm** v9.0.0 or higher
- **PostgreSQL** v16 or higher
- **Git**

### Optional (but recommended)
- **Docker** and **Docker Compose**
- **Redis** (for caching)
- **Postman** or similar API testing tool

---

## 🚀 Installation Methods

Choose one of the following installation methods:

### Method 1: Docker (Easiest - Recommended for Beginners)
### Method 2: Manual Setup (More Control)

---

## 🐳 Method 1: Docker Setup

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd pulss-white-label-ch-main
```

### Step 2: Environment Configuration

```bash
# Copy the example environment file
cp .env.example .env
```

Edit the `.env` file and update these critical values:

```env
# Change these JWT secrets to random secure strings
JWT_SECRET="your-random-secret-here-change-this"
JWT_REFRESH_SECRET="your-refresh-secret-here-change-this"

# Stripe Keys (get from https://dashboard.stripe.com)
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key"

# Email (optional - for notifications)
SENDGRID_API_KEY="your_sendgrid_api_key"
```

### Step 3: Start Docker Services

```bash
# Start all services in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

### Step 4: Database Setup

```bash
# Run database migrations
docker-compose exec backend sh -c "cd /app/packages/database && npx prisma migrate dev"

# Generate Prisma Client
docker-compose exec backend sh -c "cd /app/packages/database && npx prisma generate"

# (Optional) Seed database with sample data
docker-compose exec backend npm run seed
```

### Step 5: Access Applications

✅ **Storefront:** http://localhost:3000  
✅ **Admin Dashboard:** http://localhost:3001  
✅ **API:** http://localhost:5000  
✅ **PostgreSQL:** localhost:5432  
✅ **Redis:** localhost:6379  

### Docker Useful Commands

```bash
# Stop all services
docker-compose down

# Restart a specific service
docker-compose restart backend

# View logs for a specific service
docker-compose logs -f admin

# Remove all containers and volumes (⚠️ deletes data)
docker-compose down -v

# Rebuild images after code changes
docker-compose up -d --build
```

---

## 🔧 Method 2: Manual Setup

### Step 1: Clone & Install Dependencies

```bash
# Clone repository
git clone <repository-url>
cd pulss-white-label-ch-main

# Install all dependencies
npm install
```

### Step 2: Database Setup

#### Install PostgreSQL

**macOS (Homebrew):**
```bash
brew install postgresql@16
brew services start postgresql@16
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download from [postgresql.org](https://www.postgresql.org/download/windows/)

#### Create Database

```bash
# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE pulss_db;

# Create user (optional)
CREATE USER pulss_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE pulss_db TO pulss_user;

# Exit psql
\q
```

### Step 3: Redis Setup (Optional but Recommended)

**macOS:**
```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian:**
```bash
sudo apt install redis-server
sudo systemctl start redis
```

**Windows:**
Download from [redis.io](https://redis.io/download)

### Step 4: Environment Configuration

```bash
cp .env.example .env
```

Update `.env` with your database credentials:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/pulss_db"
REDIS_URL="redis://localhost:6379"

JWT_SECRET="generate-a-secure-random-string"
JWT_REFRESH_SECRET="generate-another-secure-random-string"

# ... other configurations
```

### Step 5: Database Migrations

```bash
# Navigate to database package
cd packages/database

# Run migrations
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate

# Go back to root
cd ../..
```

### Step 6: Start Development Servers

Open **3 separate terminal windows**:

**Terminal 1 - Backend:**
```bash
npm run backend:dev
```

**Terminal 2 - Admin Dashboard:**
```bash
npm run admin:dev
```

**Terminal 3 - Storefront:**
```bash
npm run storefront:dev
```

### Step 7: Verify Setup

Visit these URLs to confirm everything is running:

- ✅ Backend API: http://localhost:5000/health
- ✅ Admin Dashboard: http://localhost:3001
- ✅ Storefront: http://localhost:3000

---

## 🎯 Initial Configuration

### 1. Create Super Admin Account

```bash
# Option A: Using seed script
npm run seed

# Option B: Manual SQL insert
psql pulss_db
```

```sql
-- Create a super admin user (update tenant_id as needed)
INSERT INTO "User" (id, "tenantId", email, password, "firstName", "lastName", role, status, "emailVerified")
VALUES (
  'admin-123',
  'your-tenant-id',
  'admin@pulss.com',
  '$2a$10$hashed.password.here', -- Use bcrypt to hash
  'Super',
  'Admin',
  'SUPER_ADMIN',
  'ACTIVE',
  true
);
```

### 2. Create Your First Tenant

Use the API or Prisma Studio:

```bash
# Open Prisma Studio
cd packages/database
npx prisma studio
```

Navigate to `Tenant` model and add:
- **name:** "My Store"
- **slug:** "my-store"
- **businessType:** "pharmacy" / "grocery" / "retail"
- **email:** "store@example.com"
- **status:** "ACTIVE"

### 3. Configure Stripe

1. Sign up at https://dashboard.stripe.com
2. Get your test API keys
3. Add to `.env`:
   ```env
   STRIPE_SECRET_KEY="sk_test_..."
   STRIPE_PUBLISHABLE_KEY="pk_test_..."
   ```
4. Set up webhook endpoint: http://localhost:5000/api/stripe/webhook

### 4. Configure Cloudinary (Image Uploads)

1. Sign up at https://cloudinary.com
2. Get your credentials
3. Add to `.env`:
   ```env
   CLOUDINARY_CLOUD_NAME="your_cloud_name"
   CLOUDINARY_API_KEY="your_api_key"
   CLOUDINARY_API_SECRET="your_api_secret"
   ```

---

## 🧪 Testing the Setup

### Test Backend API

```bash
curl http://localhost:5000/health
# Should return: {"status":"ok","message":"Pulss API is running"}
```

### Test Database Connection

```bash
cd packages/database
npx prisma studio
```

Should open Prisma Studio in your browser.

### Test Tenant Resolution

```bash
curl -H "X-Tenant-Slug: my-store" http://localhost:5000/api/tenants/info
```

Should return tenant information.

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Find and kill process using port 5000
lsof -ti:5000 | xargs kill -9

# For Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Database Connection Issues

```bash
# Check if PostgreSQL is running
# macOS/Linux
pg_isready

# Test connection
psql -U postgres -h localhost -d pulss_db
```

### Prisma Client Issues

```bash
# Regenerate Prisma Client
cd packages/database
rm -rf node_modules/.prisma
npx prisma generate
```

### Module Not Found Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules
npm install
```

### Docker Issues

```bash
# Reset Docker completely
docker-compose down -v
docker system prune -a
docker-compose up -d --build
```

---

## 📞 Need Help?

If you're stuck:

1. Check the [main README](README.md)
2. Review error logs: `docker-compose logs` or check terminal output
3. Open an issue on GitHub
4. Email: support@pulss.com

---

## ✅ Setup Checklist

- [ ] Node.js 18+ installed
- [ ] PostgreSQL installed and running
- [ ] Redis installed (optional)
- [ ] Repository cloned
- [ ] Dependencies installed
- [ ] .env file configured
- [ ] Database migrations run
- [ ] All services running
- [ ] Super admin created
- [ ] First tenant created
- [ ] Stripe configured
- [ ] Tested basic API calls

---

**Next Steps:** Check out the [API Documentation](README.md#-api-documentation) and start building! 🚀

