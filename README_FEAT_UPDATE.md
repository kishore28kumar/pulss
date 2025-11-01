# Feature Implementation Update - Pulss Multi-Tenant PWA

## 📋 Overview

This document provides step-by-step instructions for implementing and testing the newly added features for the Pulss multi-tenant e-commerce platform. The implementation converts the project from Supabase to local PostgreSQL + Node.js while adding comprehensive features.

## 🗂️ Files Created

### Database Migrations (9 files)
- ✅ `backend/migrations/02_super_admin_setup.sql` - Super admin & password reset
- ✅ `backend/migrations/03_add_admin_profile_fields.sql` - Admin profile fields
- ✅ `backend/migrations/04_create_ledger_tables.sql` - Customer ledger & addresses
- ✅ `backend/migrations/05_create_order_status_history.sql` - Order audit trail
- ✅ `backend/migrations/06_add_feature_toggles.sql` - Enhanced feature flags
- ✅ `backend/migrations/07_seed_predefined_themes.sql` - Predefined themes
- ✅ `backend/migrations/08_create_audit_log.sql` - Audit logging
- ✅ `backend/migrations/09_add_performance_indexes.sql` - Performance indexes

### Backend Controllers (1 file so far, more needed)
- ✅ `backend/controllers/tenantsController.js` - Tenant management

### Documentation
- ✅ `FEATURE_AUDIT.md` - Complete feature audit report
- ✅ `README_FEAT_UPDATE.md` - This file

## 🚀 Setup Instructions

### Step 1: Database Migration

Run the migrations in order:

```bash
# Navigate to backend directory
cd /workspaces/spark-template/backend

# Ensure PostgreSQL is running
# Check connection with:
psql -h localhost -U postgres -d pulssdb -c "SELECT version();"

# Run migrations in order
psql -h localhost -U postgres -d pulssdb -f migrations/02_super_admin_setup.sql
psql -h localhost -U postgres -d pulssdb -f migrations/03_add_admin_profile_fields.sql
psql -h localhost -U postgres -d pulssdb -f migrations/04_create_ledger_tables.sql
psql -h localhost -U postgres -d pulssdb -f migrations/05_create_order_status_history.sql
psql -h localhost -U postgres -d pulssdb -f migrations/06_add_feature_toggles.sql
psql -h localhost -U postgres -d pulssdb -f migrations/07_seed_predefined_themes.sql
psql -h localhost -U postgres -d pulssdb -f migrations/08_create_audit_log.sql
psql -h localhost -U postgres -d pulssdb -f migrations/09_add_performance_indexes.sql

# Verify migrations
psql -h localhost -U postgres -d pulssdb -c "\dt public.*" | grep -E "(ledger|audit|history|tenant_settings)"
```

### Step 2: Install Additional Dependencies

```bash
cd /workspaces/spark-template/backend

# Install required packages
npm install multer sharp qrcode papaparse express-rate-limit node-cron uuid

# Verify installation
npm list | grep -E "(multer|sharp|qrcode|papaparse)"
```

### Step 3: Environment Configuration

Update `.env` file in backend directory:

```bash
# Add these variables to backend/.env
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Payment gateway (optional - can be configured later)
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Notifications (optional)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number
```

### Step 4: Create Uploads Directory

```bash
cd /workspaces/spark-template/backend
mkdir -p uploads/{products,logos,qrcodes,documents}
chmod 755 uploads
```

## 📝 Remaining Implementation Tasks

### Critical (Implement First)

#### 1. Products Controller with CSV Import
**File**: `backend/controllers/productsController.js`
**Endpoints needed**:
- `POST /api/tenants/:tenant_id/products/import-csv` - CSV import
- `POST /api/tenants/:tenant_id/products/:product_id/images` - Bulk images
- `GET /api/tenants/:tenant_id/products` - List products
- `POST /api/tenants/:tenant_id/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

#### 2. Orders Controller with Lifecycle
**File**: `backend/controllers/ordersController.js`
**Endpoints needed**:
- `POST /api/tenants/:tenant_id/orders` - Create order
- `POST /api/orders/:id/accept` - Accept order
- `POST /api/orders/:id/pack` - Pack order
- `POST /api/orders/:id/send-out` - Dispatch order
- `POST /api/orders/:id/deliver` - Mark delivered
- `POST /api/orders/:id/ready-for-pickup` - Ready for pickup
- `GET /api/orders/:id/history` - Get status history

#### 3. File Upload Middleware
**Files needed**:
- `backend/middleware/upload.js` - Multer configuration
- `backend/utils/imageProcessor.js` - Image resizing/optimization
- `backend/utils/qrGenerator.js` - QR code generation

#### 4. Ledger Controller
**File**: `backend/controllers/ledgerController.js`
**Endpoints needed**:
- `POST /api/orders/:id/request-credit` - Request credit
- `POST /api/orders/:id/approve-credit` - Approve credit
- `GET /api/customers/:id/ledger` - Get ledger
- `POST /api/ledger/:id/payment` - Record payment

### Important (Implement Second)

#### 5. Notifications Controller
**File**: `backend/controllers/notificationsController.js`
**Endpoints needed**:
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `POST /api/notifications/send` - Send notification (internal)

#### 6. Feature Flags Controller
**File**: `backend/controllers/featureFlagsController.js`
**Endpoints needed**:
- `GET /api/tenants/:id/features` - Get feature flags
- `PUT /api/tenants/:id/features` - Update feature flags

#### 7. Password Reset Flow
**Update**: `backend/controllers/authController.js`
**Endpoints needed**:
- `POST /api/auth/forgot-password` - Request reset
- `POST /api/auth/reset-password` - Reset with token
- `POST /api/auth/change-password` - Change password (authenticated)

### Nice to Have (Implement Third)

#### 8. Themes Controller
**File**: `backend/controllers/themesController.js`
**Endpoints needed**:
- `GET /api/themes` - List themes
- `POST /api/themes` - Create custom theme
- `PUT /api/tenants/:id/theme` - Assign theme

#### 9. Go Live Endpoint
**Update**: `backend/controllers/tenantsController.js`
**Endpoint needed**:
- `POST /api/tenants/:id/go-live` - Activate store

## 🧪 Testing

### Manual Testing with cURL

#### 1. Super Admin Login
```bash
curl -X POST http://localhost:3000/api/auth/login-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@pulss.local",
    "password": "SuperAdmin@123"
  }'
```

#### 2. Create Tenant + Admin
```bash
curl -X POST http://localhost:3000/api/auth/register-tenant-admin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN" \
  -d '{
    "email": "admin@pharmacy1.com",
    "password": "Admin@123",
    "full_name": "John Doe",
    "tenant_name": "City Pharmacy",
    "subdomain": "citypharmacy",
    "business_type": "pharmacy",
    "city": "Mumbai",
    "state": "Maharashtra"
  }'
```

#### 3. Update Tenant Profile
```bash
curl -X PUT http://localhost:3000/api/tenants/TENANT_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "shop_name": "City Pharmacy",
    "street_address": "123 Main St",
    "city": "Mumbai",
    "pincode": "400001",
    "drug_license_number": "DL-12345",
    "gst_number": "27AABCU9603R1ZM",
    "upi_id": "citypharmacy@upi",
    "cash_on_delivery_enabled": true,
    "credit_on_delivery_enabled": true,
    "credit_limit": 5000
  }'
```

#### 4. Get Tenant Settings (Public)
```bash
curl http://localhost:3000/api/tenants/TENANT_ID/settings
```

### Tenant Isolation Test

```bash
# As Admin A, try to access Admin B's data
curl -X GET http://localhost:3000/api/tenants/TENANT_B_ID \
  -H "Authorization: Bearer ADMIN_A_TOKEN"

# Should return 403 Forbidden
```

## 📦 Frontend Components Needed

### Priority Components

1. **ProductImportCSV.tsx** - CSV upload with preview
2. **BulkImageUpload.tsx** - ZIP upload for product images
3. **OrderLifecycle.tsx** - Order status management UI
4. **CreditRequestModal.tsx** - Credit approval UI for admin
5. **NotificationBell.tsx** - Real-time notifications with sound

### Implementation Locations
- Place in: `/workspaces/spark-template/src/components/`
- Import in admin portal pages
- Connect to backend APIs

## 🔐 Security Checklist

- ✅ JWT authentication implemented
- ✅ Role-based access control (RBAC)
- ✅ Tenant isolation middleware
- ✅ SQL injection prevention (parameterized queries)
- ✅ Password hashing (bcrypt)
- ⏳ Rate limiting (needs implementation)
- ⏳ File upload validation (needs implementation)
- ⏳ CSRF protection (needs implementation)
- ✅ Audit logging (schema ready)

## 🔄 API Routes to Add

Update `backend/app.js` to include new routes:

```javascript
// Add these route imports
const tenantsRoutes = require('./routes/tenants');
const productsRoutes = require('./routes/products');
const ordersRoutes = require('./routes/orders');
const ledgerRoutes = require('./routes/ledger');
const notificationsRoutes = require('./routes/notifications');

// Add these route registrations
app.use('/api/tenants', tenantsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/ledger', ledgerRoutes);
app.use('/api/notifications', notificationsRoutes);
```

## 📊 Database Backup & Restore

### Backup
```bash
# Full database backup
pg_dump -h localhost -U postgres -d pulssdb -F c -f pulssdb_backup_$(date +%Y%m%d).dump

# Schema only
pg_dump -h localhost -U postgres -d pulssdb -s -f pulssdb_schema_$(date +%Y%m%d).sql

# Data only
pg_dump -h localhost -U postgres -d pulssdb -a -f pulssdb_data_$(date +%Y%m%d).sql
```

### Restore
```bash
# Restore from custom format
pg_restore -h localhost -U postgres -d pulssdb_new pulssdb_backup_20240120.dump

# Restore from SQL
psql -h localhost -U postgres -d pulssdb_new -f pulssdb_backup_20240120.sql
```

## 🚀 Next Steps

1. **Complete remaining controllers** (see Critical section above)
2. **Create route files** for new controllers
3. **Implement file upload middleware**
4. **Add rate limiting** for security
5. **Create frontend components** for new features
6. **Write integration tests**
7. **Create Postman collection** for API testing
8. **Setup n8n workflows** (optional) or background jobs

## 📞 Support

For implementation questions or issues:
- Review `FEATURE_AUDIT.md` for detailed feature status
- Check `backend/README.md` for backend-specific docs
- See API route definitions in `backend/routes/`

## ⚠️ Important Notes

1. **Change default super admin password** before production!
2. **Configure proper JWT secret** in environment variables
3. **Setup proper CORS** for production domains
4. **Enable HTTPS** for production deployment
5. **Configure file upload limits** based on your server capacity
6. **Setup database backups** on production

---

**Status**: Phase 1 migrations and base controllers completed. Proceeding with remaining controllers and middleware...
