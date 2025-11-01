# Pulss Platform - Supabase to PostgreSQL/Node.js Conversion Guide

## 🎯 Overview

This guide provides step-by-step instructions for running the Pulss platform with a standalone PostgreSQL database and Node.js backend, replacing Supabase entirely.

### What Changed?

✅ **Removed:**
- Supabase Auth (`auth.users` table)
- Supabase RLS (Row Level Security) policies
- Supabase functions and triggers
- Supabase client SDK
- `SUPABASE_URL` and `SUPABASE_ANON_KEY` environment variables

✅ **Added:**
- Local `admins` and `customers` tables (replaces `auth.users`)
- Server-side authentication with JWT
- Server-side security and tenant isolation
- Express.js API with proper middleware
- Docker Compose setup for easy deployment

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup (without Docker)](#local-development-setup-without-docker)
3. [Docker Setup (Recommended)](#docker-setup-recommended)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Testing](#testing)
7. [Deployment to VPS (Hostinger)](#deployment-to-vps-hostinger)
8. [Conversion Checklist](#conversion-checklist)
9. [Troubleshooting](#troubleshooting)

---

## 🔧 Prerequisites

### For Local Development
- Node.js >= 18.0.0
- PostgreSQL >= 14
- npm >= 9.0.0

### For Docker Deployment
- Docker >= 20.10
- Docker Compose >= 2.0

---

## 🚀 Local Development Setup (without Docker)

### Step 1: Install PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**macOS:**
```bash
brew install postgresql@16
brew services start postgresql@16
```

**Windows:**
Download and install from [PostgreSQL Official Website](https://www.postgresql.org/download/windows/)

### Step 2: Create Database

```bash
# Login to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE pulssdb;
CREATE USER pulssuser WITH ENCRYPTED PASSWORD 'yourpassword';
GRANT ALL PRIVILEGES ON DATABASE pulssdb TO pulssuser;
\q
```

### Step 3: Run Migrations

```bash
# Navigate to backend directory
cd backend

# Set DATABASE_URL (or use connection params directly)
export DATABASE_URL="postgresql://pulssuser:yourpassword@localhost:5432/pulssdb"

# Run schema migration
psql $DATABASE_URL -f migrations/01_init_schema.sql

# OR using connection params directly:
psql -h localhost -U pulssuser -d pulssdb -f migrations/01_init_schema.sql

# Seed test data
psql $DATABASE_URL -f seed/seed_data.sql
```

### Step 4: Configure Backend

```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your settings
nano .env
```

**Required `.env` configuration:**
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=pulssuser
DB_PASSWORD=yourpassword
DB_NAME=pulssdb

PORT=3000
NODE_ENV=development

JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=7d

SUPER_ADMIN_EMAIL=superadmin@pulss.app
CORS_ORIGIN=http://localhost:5173
```

### Step 5: Install Dependencies and Start Backend

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# OR for production
npm start
```

Backend will be available at `http://localhost:3000`

### Step 6: Verify Backend is Running

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "environment": "development"
}
```

---

## 🐳 Docker Setup (Recommended)

### Step 1: Build and Start All Services

```bash
# From project root
docker-compose up --build -d
```

This starts:
- **PostgreSQL** on port `5432`
- **Backend API** on port `3000`
- **pgAdmin** on port `5050` (optional, for DB management)
- **n8n** on port `5678` (optional, for workflows)

### Step 2: Seed Database (First Time Only)

```bash
# Wait for database to be ready (about 10 seconds)
sleep 10

# Seed data
docker-compose exec db psql -U postgres -d pulssdb -f /docker-entrypoint-initdb.d/01_init_schema.sql
docker-compose exec api sh -c "cd /app && node -e \"
const { pool } = require('./config/db');
const fs = require('fs');
const sql = fs.readFileSync('./seed/seed_data.sql', 'utf8');
pool.query(sql).then(() => { console.log('Seeded!'); process.exit(0); }).catch(console.error);
\""
```

**OR** access the database container directly:
```bash
docker-compose exec db psql -U postgres -d pulssdb
```

Then run:
```sql
\i /docker-entrypoint-initdb.d/01_init_schema.sql
```

### Step 3: Verify Services

```bash
# Check all containers are running
docker-compose ps

# Test backend health
curl http://localhost:3000/health

# Access pgAdmin (optional)
# Open http://localhost:5050
# Email: admin@pulss.app, Password: admin123
```

### Managing Docker Services

```bash
# View logs
docker-compose logs -f api
docker-compose logs -f db

# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes all data)
docker-compose down -v

# Restart a service
docker-compose restart api
```

---

## 🗄️ Database Schema

### Key Tables

| Table | Description | Key Columns |
|-------|-------------|-------------|
| `tenants` | Multi-tenant stores | `tenant_id`, `name`, `subdomain`, `business_type` |
| `admins` | Store administrators & super admin | `admin_id`, `tenant_id`, `email`, `password_hash`, `role` |
| `customers` | Customer accounts | `customer_id`, `tenant_id`, `email`, `loyalty_points` |
| `products` | Product catalog | `product_id`, `tenant_id`, `category_id`, `price`, `active` |
| `orders` | Customer orders | `order_id`, `tenant_id`, `customer_id`, `total` |
| `transactions` | Loyalty point transactions | `transaction_id`, `tenant_id`, `customer_id`, `points_earned` |
| `rewards` | Loyalty rewards catalog | `reward_id`, `tenant_id`, `points_required` |
| `reward_redemptions` | Redeemed rewards | `redemption_id`, `customer_id`, `reward_id`, `points_used` |

### Multi-Tenancy

All data tables include `tenant_id` column with proper indexing. Backend middleware enforces tenant isolation:

- **Admins** can only access their own `tenant_id` data
- **Super Admin** can access all tenants
- **Customers** can only access data within their `tenant_id`

---

## 🔌 API Endpoints

### Authentication

#### Register Tenant + Admin (Super Admin Only)
```bash
POST /api/auth/register-admin
Authorization: Bearer <super_admin_token>

{
  "email": "admin@newstore.com",
  "password": "Password123!",
  "full_name": "Store Admin",
  "tenant_name": "New Store",
  "subdomain": "newstore",
  "business_type": "pharmacy",
  "city": "Mumbai",
  "state": "Maharashtra"
}
```

#### Admin Login
```bash
POST /api/auth/login

{
  "email": "admin@citypharmacy.com",
  "password": "Password123!"
}
```

Response:
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@citypharmacy.com",
    "role": "admin",
    "tenant_id": "uuid"
  }
}
```

#### Register Customer
```bash
POST /api/auth/register-customer

{
  "tenant_id": "550e8400-e29b-41d4-a716-446655440001",
  "email": "customer@example.com",
  "password": "Password123!",
  "name": "John Doe",
  "phone": "+919876543210"
}
```

#### Customer Login
```bash
POST /api/auth/login-customer

{
  "email": "customer@example.com",
  "password": "Password123!",
  "tenant_id": "550e8400-e29b-41d4-a716-446655440001"
}
```

### Customers

#### Get All Customers (Admin)
```bash
GET /api/customers
Authorization: Bearer <admin_token>
```

#### Create Customer (Admin)
```bash
POST /api/customers
Authorization: Bearer <admin_token>

{
  "email": "newcustomer@example.com",
  "name": "Jane Doe",
  "phone": "+919876543220"
}
```

### Transactions

#### Create Transaction (Admin)
```bash
POST /api/transactions
Authorization: Bearer <admin_token>

{
  "customer_id": "c0000000-0000-0000-0000-000000000001",
  "order_id": "ord00000-0000-0000-0000-000000000001",
  "purchase_amount": 500.00
}
```

Response:
```json
{
  "message": "Transaction created and points awarded",
  "transaction": { ... },
  "points_awarded": 50
}
```

Points calculation: `points_earned = FLOOR(purchase_amount * 0.1)`

#### Get Customer Transactions
```bash
GET /api/transactions/customer/:customer_id
Authorization: Bearer <token>
```

### Rewards

#### Get Rewards
```bash
GET /api/rewards
Authorization: Bearer <token>
```

#### Redeem Reward
```bash
POST /api/rewards/redeem
Authorization: Bearer <token>

{
  "customer_id": "c0000000-0000-0000-0000-000000000001",
  "reward_id": "rew00000-0000-0000-0000-000000000001"
}
```

#### Create Reward (Admin)
```bash
POST /api/rewards
Authorization: Bearer <admin_token>

{
  "name": "₹100 Off",
  "description": "Get ₹100 off on your next purchase",
  "points_required": 200,
  "reward_type": "discount",
  "discount_amount": 100.00
}
```

---

## 🧪 Testing

### Using cURL

#### 1. Login as Super Admin
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@pulss.app",
    "password": "Password123!"
  }'
```

Save the token from response.

#### 2. Create Tenant + Admin
```bash
curl -X POST http://localhost:3000/api/auth/register-admin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <super_admin_token>" \
  -d '{
    "email": "test@test.com",
    "password": "Password123!",
    "full_name": "Test Admin",
    "tenant_name": "Test Store",
    "subdomain": "teststore"
  }'
```

#### 3. Login as Tenant Admin
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@citypharmacy.com",
    "password": "Password123!"
  }'
```

#### 4. Get Customers
```bash
curl http://localhost:3000/api/customers \
  -H "Authorization: Bearer <admin_token>"
```

#### 5. Create Transaction
```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
    "customer_id": "c0000000-0000-0000-0000-000000000001",
    "purchase_amount": 1000
  }'
```

#### 6. Redeem Reward
```bash
curl -X POST http://localhost:3000/api/rewards/redeem \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <customer_token>" \
  -d '{
    "customer_id": "c0000000-0000-0000-0000-000000000001",
    "reward_id": "rew00000-0000-0000-0000-000000000001"
  }'
```

### Test Credentials (from seed data)

**Super Admin:**
- Email: `superadmin@pulss.app`
- Password: `Password123!`

**Tenant Admins:**
- Email: `admin@citypharmacy.com` | Password: `Password123!`
- Email: `admin@greenmart.com` | Password: `Password123!`

**Customers:**
- Email: `customer1@example.com` | Password: `Password123!`
- Email: `customer2@example.com` | Password: `Password123!`

---

## 🚀 Deployment to VPS (Hostinger)

### Option 1: Docker Compose (Recommended)

#### Step 1: Prepare VPS
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin
```

#### Step 2: Clone Repository
```bash
git clone <your-repo-url>
cd pulss-platform
```

#### Step 3: Configure Production Environment
```bash
# Create production env file
cp backend/.env.example backend/.env

# Edit with production values
nano backend/.env
```

**Production `.env`:**
```env
DB_HOST=db
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=<strong-password>
DB_NAME=pulssdb

PORT=3000
NODE_ENV=production

JWT_SECRET=<generate-strong-secret-key>
JWT_EXPIRES_IN=7d

CORS_ORIGIN=https://yourdomain.com
```

#### Step 4: Update docker-compose.yml for Production
```bash
nano docker-compose.yml
```

Change these values:
- PostgreSQL password
- JWT secret
- CORS origin
- Remove pgAdmin (or secure it)

#### Step 5: Deploy
```bash
docker-compose up -d --build
```

#### Step 6: Setup Nginx Reverse Proxy
```bash
sudo apt install nginx certbot python3-certbot-nginx

# Create Nginx config
sudo nano /etc/nginx/sites-available/pulss
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/pulss /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Setup SSL
sudo certbot --nginx -d api.yourdomain.com
```

### Option 2: PM2 (Without Docker)

#### Step 1: Install Dependencies
```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2
```

#### Step 2: Setup Database
```bash
sudo -u postgres psql

CREATE DATABASE pulssdb;
CREATE USER pulssuser WITH ENCRYPTED PASSWORD 'strongpassword';
GRANT ALL PRIVILEGES ON DATABASE pulssdb TO pulssuser;
\q

# Run migrations
cd backend
psql -h localhost -U pulssuser -d pulssdb -f migrations/01_init_schema.sql
psql -h localhost -U pulssuser -d pulssdb -f seed/seed_data.sql
```

#### Step 3: Configure and Start Backend
```bash
cd backend
npm install --production

# Create .env with production values
nano .env

# Start with PM2
pm2 start server.js --name pulss-api
pm2 save
pm2 startup
```

#### Step 4: Setup Nginx (same as Docker option above)

### Security Recommendations

1. **Database Security:**
```bash
# Edit PostgreSQL config to bind only to localhost
sudo nano /etc/postgresql/14/main/postgresql.conf
# Set: listen_addresses = 'localhost'

sudo systemctl restart postgresql
```

2. **Firewall:**
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

3. **Environment Variables:**
- Never commit `.env` files
- Use strong JWT secrets (32+ characters)
- Use strong database passwords
- Rotate secrets regularly

4. **SSL/HTTPS:**
- Always use HTTPS in production
- Use Let's Encrypt for free SSL certificates
- Enable HSTS headers

5. **Rate Limiting (Optional):**
```bash
npm install express-rate-limit
```

Add to `app.js`:
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

---

## ✅ Conversion Checklist

### Database
- [ ] PostgreSQL installed and running
- [ ] Database created (`pulssdb`)
- [ ] Schema migration completed (`01_init_schema.sql`)
- [ ] Seed data loaded (`seed_data.sql`)
- [ ] No references to `auth.users` remain
- [ ] All RLS policies removed
- [ ] Tenant isolation via `tenant_id` columns working

### Backend
- [ ] Node.js backend running
- [ ] JWT authentication working
- [ ] All queries use parameterized statements ($1, $2)
- [ ] All queries include `tenant_id` filtering
- [ ] Password hashing with bcrypt working
- [ ] No `SUPABASE_URL` or `SUPABASE_ANON_KEY` in code
- [ ] Health check endpoint responding

### Frontend (To Do)
- [ ] Remove Supabase client imports
- [ ] Replace `supabase.auth` calls with `/api/auth/*` endpoints
- [ ] Replace `supabase.from()` calls with fetch/axios to backend
- [ ] Update auth context to use JWT tokens
- [ ] Store JWT token in localStorage/cookies
- [ ] Add Authorization header to all API calls

### Security
- [ ] Passwords hashed with bcrypt (rounds >= 10)
- [ ] JWT tokens properly signed and verified
- [ ] CORS configured correctly
- [ ] Helmet middleware active
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (parameterized queries)
- [ ] Rate limiting configured (production)

### Deployment
- [ ] Docker Compose working locally
- [ ] Environment variables configured
- [ ] Nginx reverse proxy configured
- [ ] SSL certificates installed
- [ ] Database backups scheduled
- [ ] Monitoring/logging configured

### Testing
- [ ] Health check works
- [ ] Admin registration works
- [ ] Admin login works
- [ ] Customer registration works
- [ ] Customer login works
- [ ] Customer CRUD operations work
- [ ] Transaction creation works
- [ ] Points calculation correct
- [ ] Reward redemption works
- [ ] Tenant isolation verified

### Optional (Advanced)
- [ ] n8n workflows updated to use backend API
- [ ] File uploads working (local/S3)
- [ ] Email notifications configured
- [ ] SMS notifications configured
- [ ] Analytics/reporting working
- [ ] Backup/restore procedures documented

---

## 🔧 Troubleshooting

### Database Connection Issues

**Error: "ECONNREFUSED ::1:5432"**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check PostgreSQL is listening
sudo netstat -nlp | grep 5432

# Try using 127.0.0.1 instead of localhost in .env
DB_HOST=127.0.0.1
```

**Error: "password authentication failed"**
```bash
# Reset PostgreSQL password
sudo -u postgres psql
ALTER USER postgres WITH PASSWORD 'newpassword';
\q

# Update .env with new password
```

### Migration Issues

**Error: "relation already exists"**
```bash
# Drop database and recreate
sudo -u postgres psql
DROP DATABASE pulssdb;
CREATE DATABASE pulssdb;
GRANT ALL PRIVILEGES ON DATABASE pulssdb TO pulssuser;
\q

# Re-run migrations
psql -h localhost -U pulssuser -d pulssdb -f migrations/01_init_schema.sql
```

### JWT Issues

**Error: "JsonWebTokenError: invalid token"**
- Check `JWT_SECRET` is the same between login and verification
- Check token is being sent with "Bearer " prefix
- Check token hasn't expired

### Docker Issues

**Containers won't start:**
```bash
# Check logs
docker-compose logs db
docker-compose logs api

# Rebuild
docker-compose down -v
docker-compose up --build

# Check port conflicts
sudo netstat -nlp | grep 5432
sudo netstat -nlp | grep 3000
```

### CORS Issues

**Error: "CORS policy blocked"**
```javascript
// In backend/app.js, update CORS origin
const corsOptions = {
  origin: ['http://localhost:5173', 'https://yourdomain.com'],
  credentials: true
};
```

---

## 📚 Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)

---

## 🤝 Support

For issues or questions:
- Create an issue on GitHub
- Email: support@pulss.app
- WhatsApp: +91 99999 99999

---

**Made with ❤️ by Pulss Team**
