# 🔄 Supabase to Node.js/PostgreSQL Migration - Complete Guide

## ✅ What Was Changed

### 1. Backend Infrastructure
- **OLD**: Supabase cloud service
- **NEW**: Node.js/Express + PostgreSQL
- **Location**: `/backend` directory

### 2. Authentication System
- **OLD**: Supabase Auth with magic links
- **NEW**: JWT tokens with bcrypt password hashing
- **Files Changed**:
  - `/src/lib/useAuth.tsx` - Updated to use API client
  - `/src/lib/api.ts` - New API client with auth methods

### 3. Database Client
- **OLD**: `@supabase/supabase-js` client
- **NEW**: Custom API wrapper maintaining Supabase-like interface
- **Files Changed**:
  - `/src/lib/supabase.ts` - Compatibility layer for existing code

### 4. Data Persistence
- **OLD**: Supabase Realtime Database
- **NEW**: PostgreSQL with REST API
- **Migration**: Schema converted in `/backend/migrations/01_init_schema.sql`

## 🚀 Quick Start

### Option 1: Using Docker (Recommended)

```bash
# 1. Start all services
docker-compose up -d

# 2. Check logs
docker-compose logs -f api

# 3. Access services
# - API: http://localhost:3000
# - PostgreSQL: localhost:5432
# - pgAdmin: http://localhost:5050 (admin@pulss.app / admin)
```

### Option 2: Local Development

```bash
# 1. Install PostgreSQL
# Mac: brew install postgresql
# Ubuntu: sudo apt-get install postgresql

# 2. Create database
createdb pulssdb

# 3. Run migrations
psql -d pulssdb -f backend/migrations/01_init_schema.sql

# 4. Install backend dependencies
cd backend
npm install

# 5. Configure environment
cp .env.example .env
# Edit .env with your database credentials

# 6. Start backend
npm run dev

# 7. In another terminal, start frontend
cd ..
npm run dev
```

## 📝 Environment Configuration

### Backend `.env`
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=pulssdb

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRY=7d

# Server
PORT=3000
NODE_ENV=development
```

### Frontend `.env`
```env
# API Configuration
VITE_API_URL=http://localhost:3000/api

# Admin Config
VITE_DEFAULT_SUPERADMIN_EMAIL=admin@pulss.app
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login with email/password
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/reset-password` - Request password reset

### Tenants (Super Admin Only)
- `GET /api/tenants` - List all tenants
- `POST /api/tenants` - Create new tenant
- `GET /api/tenants/:id` - Get tenant details
- `PUT /api/tenants/:id` - Update tenant
- `DELETE /api/tenants/:id` - Delete tenant

### Products
- `GET /api/products` - List products (tenant-isolated)
- `POST /api/products` - Create product
- `GET /api/products/:id` - Get product details
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `POST /api/products/bulk-upload` - CSV upload

### Orders
- `GET /api/orders` - List orders (tenant-isolated)
- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id` - Update order
- `PATCH /api/orders/:id/status` - Update order status

### Customers
- `GET /api/customers` - List customers (tenant-isolated)
- `POST /api/customers` - Create customer
- `GET /api/customers/:id` - Get customer details
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Loyalty & Rewards
- `GET /api/transactions` - List transactions
- `GET /api/transactions/customer/:id` - Customer transactions
- `POST /api/transactions` - Create transaction
- `GET /api/rewards` - List available rewards
- `POST /api/rewards/redeem` - Redeem reward

## 🔐 Security Features

### Multi-Tenant Isolation
Every API request automatically filters data by tenant_id:
```javascript
// Middleware automatically adds tenant filter
req.tenantId = user.tenant_id

// All queries are scoped to tenant
WHERE tenant_id = $1
```

### Authentication
- JWT tokens stored in localStorage
- Token sent in Authorization header: `Bearer <token>`
- Automatic token refresh on 401 errors
- Password hashing with bcrypt (10 rounds)

### SQL Injection Prevention
All queries use parameterized statements:
```javascript
// ✅ SAFE
const result = await pool.query(
  'SELECT * FROM products WHERE id = $1',
  [productId]
)

// ❌ UNSAFE (never do this)
const result = await pool.query(
  `SELECT * FROM products WHERE id = ${productId}`
)
```

## 📊 Database Schema

### Core Tables
- `tenants` - Business/store accounts
- `admins` - Admin users (replaces auth.users)
- `customers` - Customer accounts
- `products` - Product catalog
- `orders` - Order records
- `order_items` - Order line items
- `transactions` - Loyalty point transactions
- `rewards` - Reward definitions
- `reward_redemptions` - Redemption history

### Multi-Tenant Pattern
```sql
CREATE TABLE products (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    name VARCHAR(255),
    -- ... other fields
);

CREATE INDEX idx_products_tenant ON products(tenant_id);
```

## 🔄 Migration Checklist

### Frontend Code Changes Required

#### 1. Update Imports
```typescript
// OLD
import { supabase } from '@/lib/supabase'

// NEW - Still works! Compatibility layer maintained
import { supabase } from '@/lib/supabase'
// OR use new API client
import { api, productsApi } from '@/lib/api'
```

#### 2. Auth Pattern
```typescript
// OLD Supabase pattern
const { data, error } = await supabase.auth.signInWithPassword({
  email, password
})

// NEW - Still compatible!
const { error } = await signIn(email, password)
// User state managed by AuthContext
```

#### 3. Data Queries
```typescript
// OLD Supabase pattern
const { data, error } = await supabase
  .from('products')
  .select('*')
  .eq('tenant_id', tenantId)

// NEW Option 1 - Compatibility layer (works!)
const { data, error } = await supabase
  .from('products')
  .select('*')
  .eq('tenant_id', tenantId)
  .execute()

// NEW Option 2 - Direct API (recommended)
const response = await productsApi.getAll({ tenant_id: tenantId })
```

#### 4. File Uploads
```typescript
// OLD
const { data, error } = await supabase.storage
  .from('pulss-media')
  .upload(path, file)

// NEW
const response = await api.uploadFile('/upload', file)
```

## 🧪 Testing

### Test Super Admin Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@pulss.app","password":"admin123"}'
```

### Test Product Creation
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Test Product",
    "price": 99.99,
    "category": "general"
  }'
```

### Test Tenant Isolation
```bash
# Login as tenant 1
TOKEN1=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin1@store.com","password":"pass"}' | jq -r '.token')

# Login as tenant 2
TOKEN2=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin2@store.com","password":"pass"}' | jq -r '.token')

# Each should only see their own products
curl -H "Authorization: Bearer $TOKEN1" http://localhost:3000/api/products
curl -H "Authorization: Bearer $TOKEN2" http://localhost:3000/api/products
```

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
pg_isready

# Check database exists
psql -l | grep pulssdb

# Test connection
psql -d pulssdb -c "SELECT NOW()"
```

### API Not Starting
```bash
# Check port 3000 is free
lsof -i :3000

# Check environment variables
cd backend && node -e "console.log(process.env)"

# View logs
cd backend && npm run dev
```

### Frontend Not Connecting
```bash
# Verify API URL in .env
cat .env | grep VITE_API_URL

# Check CORS settings in backend/app.js
# Should allow your frontend origin
```

### Authentication Issues
```bash
# Verify JWT secret is set
cd backend && grep JWT_SECRET .env

# Check token format
# Should be: Bearer eyJhbGciOiJIUzI1NiIs...

# Test token manually
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/auth/me
```

## 📈 Performance Optimization

### Database Indexes
All critical queries have indexes:
```sql
CREATE INDEX idx_products_tenant ON products(tenant_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_orders_tenant_status ON orders(tenant_id, status);
CREATE INDEX idx_customers_tenant_phone ON customers(tenant_id, phone);
```

### Connection Pooling
PostgreSQL pool configured for optimal performance:
```javascript
const pool = new Pool({
  max: 20,                    // Max connections
  idleTimeoutMillis: 30000,   // Close idle connections
  connectionTimeoutMillis: 2000
})
```

### Caching Strategy
Implement caching for frequently accessed data:
```javascript
// Example: Cache tenant settings
const getTenantSettings = async (tenantId) => {
  const cached = cache.get(`tenant:${tenantId}`)
  if (cached) return cached
  
  const settings = await fetchFromDB(tenantId)
  cache.set(`tenant:${tenantId}`, settings, 300) // 5 min TTL
  return settings
}
```

## 🚀 Deployment

### Docker Production
```bash
# Build production image
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d

# Scale API
docker-compose -f docker-compose.prod.yml up -d --scale api=3
```

### VPS Deployment
```bash
# 1. Copy files to server
scp -r backend user@server:/var/www/pulss/

# 2. Install dependencies
ssh user@server
cd /var/www/pulss/backend
npm ci --production

# 3. Setup PostgreSQL
sudo -u postgres createdb pulssdb
sudo -u postgres psql -d pulssdb -f migrations/01_init_schema.sql

# 4. Configure systemd service
sudo nano /etc/systemd/system/pulss-api.service

# 5. Start service
sudo systemctl start pulss-api
sudo systemctl enable pulss-api
```

### Nginx Reverse Proxy
```nginx
server {
    listen 80;
    server_name api.pulss.app;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## 📚 Additional Resources

- **API Documentation**: `/API_DOCUMENTATION.md`
- **Database Schema**: `/backend/migrations/01_init_schema.sql`
- **Seed Data**: `/backend/seed/seed_data.sql`
- **Frontend Guide**: `/FRONTEND_CONVERSION.md`
- **Docker Setup**: `/docker-compose.yml`

## ✨ Benefits of Migration

1. **Full Control**: Own your infrastructure and data
2. **Cost Savings**: No vendor lock-in or usage limits
3. **Performance**: Direct database access, no network overhead
4. **Customization**: Extend backend as needed
5. **Security**: Full control over auth and data access
6. **Scalability**: Scale horizontally with load balancers
7. **Compliance**: Meet data residency requirements

## 🎉 Migration Complete!

Your Pulss platform is now running on:
- ✅ Node.js/Express backend
- ✅ PostgreSQL database
- ✅ JWT authentication
- ✅ Multi-tenant architecture
- ✅ RESTful API
- ✅ Docker containerization

**Next Steps**:
1. Test all features thoroughly
2. Update any remaining Supabase-specific code
3. Configure production environment
4. Set up monitoring and logging
5. Deploy to production

Need help? Check the troubleshooting section or open an issue!
