# Feature Audit Report - Pulss Multi-Tenant PWA

**Generated:** 2024-01-XX  
**Project:** Pulss - Multi-Tenant E-Commerce Platform  
**Migration:** Supabase → PostgreSQL + Node.js + React

---

## Executive Summary

This report audits the current implementation against required features for a production-ready multi-tenant PWA with backend Node.js + PostgreSQL and frontend React.

**Overall Status:**
- ✅ **Present**: 30%
- ⚠️ **Partial**: 40%
- ❌ **Missing**: 30%

---

## A. Multi-Tenant + Authentication

### A1. Tenants Table
- **Status**: ✅ **PRESENT**
- **Location**: `pulss_schema_vps.sql` lines 20-33
- **Details**: Table exists with tenant_id, name, subdomain, business_type, location fields

### A2. Super Admin Role
- **Status**: ⚠️ **PARTIAL**
- **Issues**:
  - Super admin role exists in admins table
  - No separate super_admins table
  - No endpoint to create super admin (must be seeded)
- **Files to modify**:
  - `backend/controllers/authController.js` - Add super admin creation
  - `migrations/02_super_admin_setup.sql` - Add first super admin seed

### A3. Admin Account Creation Flow
- **Status**: ✅ **PRESENT**
- **Location**: `backend/controllers/authController.js::registerTenantAdmin`
- **Endpoint**: `POST /api/auth/register-tenant-admin`
- **Details**: Creates tenant + admin in transaction

### A4. Password Reset Flow (First Login)
- **Status**: ❌ **MISSING**
- **Required**:
  - Add `must_change_password` column to admins table
  - Add `password_reset_token` and `password_reset_expires` columns
  - Create password reset endpoints
- **Files to create**:
  - `migrations/03_add_password_reset.sql`
  - `backend/controllers/authController.js` - Add reset methods
  - `backend/routes/auth.js` - Add reset routes

### A5. JWT-Based Auth
- **Status**: ✅ **PRESENT**
- **Location**: `backend/middleware/auth.js`
- **Details**: JWT middleware attaches `req.user = { id, role, tenant_id }`

### A6. Tenant Data Isolation
- **Status**: ⚠️ **PARTIAL**
- **Issues**:
  - Tenant middleware exists (`backend/middleware/tenant.js`)
  - Not all endpoints enforce tenant_id filtering
  - Missing comprehensive tests for cross-tenant access
- **Files to create**:
  - `backend/tests/tenant-isolation.test.js`
  - `backend/middleware/tenantFilter.js` - Universal tenant filter

---

## B. Admin Onboarding Profile

### B1. Profile Fields in Database
- **Status**: ⚠️ **PARTIAL**
- **Present in `store_settings` table**:
  - ✅ name, address, upi_id, upi_qr_code_url, whatsapp_number
- **Missing fields**:
  - ❌ shop_name (separate from name)
  - ❌ drug_license_number
  - ❌ gst_number
  - ❌ razorpay_id
  - ❌ cash_on_delivery_enabled
  - ❌ credit_on_delivery_enabled
  - ❌ credit_limit
  - ❌ credit_terms
- **Files to create**:
  - `migrations/04_add_admin_profile_fields.sql`

### B2. Profile Endpoints
- **Status**: ❌ **MISSING**
- **Required endpoints**:
  - `GET /api/tenants/:id`
  - `PUT /api/tenants/:id`
- **Files to create**:
  - `backend/controllers/tenantsController.js`
  - `backend/routes/tenants.js`

### B3. File Upload Handler
- **Status**: ❌ **MISSING**
- **Required**:
  - Image upload middleware (multer)
  - Image validation (type, size)
  - Image storage (local ./uploads/ or cloud)
  - Thumbnail generation
- **Files to create**:
  - `backend/middleware/upload.js`
  - `backend/utils/imageProcessor.js`
  - `backend/config/storage.js`

### B4. Credit on Delivery Flow
- **Status**: ❌ **MISSING**
- **Required**:
  - `customer_ledgers` table
  - `POST /api/orders/:id/request-credit`
  - `POST /api/orders/:id/approve-credit`
  - Ledger query endpoints
- **Files to create**:
  - `migrations/05_create_ledger_table.sql`
  - `backend/controllers/ledgerController.js`
  - `backend/routes/ledger.js`

---

## C. Product Upload (CSV + Bulk Images)

### C1. CSV Upload Endpoint
- **Status**: ❌ **MISSING**
- **Required**:
  - `POST /api/tenants/:tenant_id/products/import-csv`
  - CSV parsing (papaparse)
  - Validation
  - Bulk insert
  - Import report
- **Files to create**:
  - `backend/controllers/productsController.js::importCSV`
  - `backend/routes/products.js`
  - `backend/utils/csvParser.js`
  - `backend/utils/productValidator.js`

### C2. Bulk Image Upload
- **Status**: ❌ **MISSING**
- **Required**:
  - `POST /api/tenants/:tenant_id/products/:product_id/images`
  - `POST /api/upload/bulk-images` (zip support)
  - Map filenames to SKUs
- **Files to create**:
  - `backend/controllers/productsController.js::bulkUploadImages`
  - `backend/utils/zipHandler.js`

### C3. Frontend CSV Upload UI
- **Status**: ❌ **MISSING**
- **Required**:
  - CSV upload component
  - Image zip upload component
  - Preview table
  - Import report display
- **Files to create**:
  - `src/components/ProductImportCSV.tsx`
  - `src/components/BulkImageUpload.tsx`

---

## D. Make Store Live + QR/PWA Distribution

### D1. Go Live Endpoint
- **Status**: ❌ **MISSING**
- **Required**:
  - `POST /api/tenants/:tenant_id/go-live`
  - Set `is_live=true` flag
  - Generate PWA URL
  - Generate QR code
- **Files to create**:
  - `migrations/06_add_is_live_flag.sql`
  - `backend/controllers/tenantsController.js::goLive`
  - `backend/utils/qrGenerator.js`

### D2. PWA Subdomain/Path Routing
- **Status**: ⚠️ **PARTIAL**
- **Issues**:
  - Frontend supports tenant routing
  - Backend subdomain detection exists
  - Missing dynamic subdomain DNS/proxy config
- **Files to modify**:
  - `backend/app.js` - Add subdomain routing
  - `nginx.conf` (deployment) - Add wildcard subdomain

### D3. QR Code Generation
- **Status**: ⚠️ **PARTIAL**
- **Issues**:
  - `qrcode` package installed
  - Frontend has QRCodeGenerator component
  - Missing server-side generation endpoint
- **Files to create**:
  - `backend/utils/qrGenerator.js`

---

## E. Order Lifecycle + Notifications

### E1. Order State Transition APIs
- **Status**: ❌ **MISSING**
- **Required endpoints**:
  - `POST /api/tenants/:tenant_id/orders` ✅ (basic exists)
  - `POST /api/orders/:id/accept` ❌
  - `POST /api/orders/:id/pack` ❌
  - `POST /api/orders/:id/send-out` ❌
  - `POST /api/orders/:id/deliver` ❌
  - `POST /api/orders/:id/ready-for-pickup` ❌
- **Files to create**:
  - `backend/controllers/ordersController.js` (full lifecycle)
  - `backend/routes/orders.js`

### E2. Order Status History/Audit Trail
- **Status**: ❌ **MISSING**
- **Required**:
  - `order_status_history` table
  - Auto-log on state change
- **Files to create**:
  - `migrations/07_create_order_status_history.sql`
  - `backend/utils/orderAudit.js`

### E3. Notification System
- **Status**: ⚠️ **PARTIAL**
- **Present**:
  - ✅ `notifications` table exists
  - ✅ Frontend has notification components
- **Missing**:
  - ❌ Push notification API endpoints
  - ❌ Web Push integration (service worker)
  - ❌ Sound alerts on admin UI
  - ❌ Integration with Twilio/WhatsApp (optional)
- **Files to create**:
  - `backend/controllers/notificationsController.js`
  - `backend/utils/pushNotifications.js`
  - `backend/utils/whatsappNotifier.js` (optional)
  - `src/components/NotificationSound.tsx`

---

## F. Customer Portal & Profile

### F1. Customer Registration & Login
- **Status**: ✅ **PRESENT**
- **Location**: `backend/controllers/authController.js`
- **Endpoints**: 
  - `POST /api/auth/register-customer` ✅
  - `POST /api/auth/login-customer` ✅

### F2. Customer Profile Fields
- **Status**: ⚠️ **PARTIAL**
- **Present**: name, email, phone, loyalty_points
- **Missing**:
  - ❌ photo_url
  - ❌ address(es) - separate table
  - ❌ whatsapp_number (separate from phone)
  - ❌ default_address_id
- **Files to create**:
  - `migrations/08_add_customer_profile_fields.sql`
  - `migrations/09_create_customer_addresses.sql`

### F3. Customer Profile Endpoints
- **Status**: ⚠️ **PARTIAL**
- **Present**: Basic customer CRUD in `customersController.js`
- **Missing**:
  - ❌ Order history endpoint
  - ❌ Loyalty points endpoint
  - ❌ Rewards endpoint
  - ❌ Ledger/pending amounts endpoint
- **Files to create**:
  - `backend/controllers/customersController.js` - Add methods
  - `backend/routes/customers.js` - Add routes

### F4. Customer Portal UI
- **Status**: ⚠️ **PARTIAL**
- **Present**: Frontend has EnhancedCustomerHome
- **Missing**: Scoped to tenant via URL/subdomain
- **Files to modify**:
  - `src/App.tsx` - Add tenant routing

---

## G. Branding, Toggles & Themes

### G1. Tenant Logo Upload
- **Status**: ❌ **MISSING**
- **Required**: `PUT /api/tenants/:id/logo`
- **Files to create**:
  - `backend/controllers/tenantsController.js::uploadLogo`

### G2. Feature Toggles
- **Status**: ⚠️ **PARTIAL**
- **Present**: `feature_flags` table exists with some flags
- **Missing toggles**:
  - ❌ carousel_on
  - ❌ product_carousel_editable
  - ❌ cod_enabled
  - ❌ credit_on_delivery_enabled
  - ❌ self_pickup_enabled
  - ❌ allow_bulk_image_upload
  - ❌ allow_customer_signup
  - ❌ dark_mode_customer
- **Files to create**:
  - `migrations/10_add_feature_toggles.sql`
  - `backend/controllers/featureFlagsController.js`

### G3. Theme Management
- **Status**: ⚠️ **PARTIAL**
- **Present**: 
  - ✅ `themes` table exists
  - ✅ Frontend has theme classes
- **Missing**:
  - ❌ 5-6 predefined themes in database
  - ❌ Super admin theme assignment endpoint
  - ❌ Customer dark/light toggle
- **Files to create**:
  - `migrations/11_seed_predefined_themes.sql`
  - `backend/controllers/themesController.js`
  - `src/components/ThemeSwitcher.tsx`

### G4. Settings API
- **Status**: ❌ **MISSING**
- **Required**: `GET /api/tenants/:id/settings`
- **Files to create**:
  - `backend/controllers/tenantsController.js::getSettings`

---

## H. Non-Functional & Security

### H1. File Upload Validation
- **Status**: ❌ **MISSING**
- **Required**: Size and type validation for all uploads
- **Files to create**:
  - `backend/middleware/validateUpload.js`

### H2. Rate Limiting
- **Status**: ❌ **MISSING**
- **Required**: Rate limit admin endpoints
- **Files to create**:
  - `backend/middleware/rateLimiter.js`

### H3. Audit Logging
- **Status**: ⚠️ **PARTIAL**
- **Present**: Some logging in controllers
- **Missing**: Comprehensive admin action audit log table
- **Files to create**:
  - `migrations/12_create_audit_log.sql`
  - `backend/middleware/auditLog.js`

### H4. Database Indexes
- **Status**: ⚠️ **PARTIAL**
- **Present**: Basic indexes on tenant_id
- **Missing**: Composite indexes for common queries
- **Files to create**:
  - `migrations/13_add_performance_indexes.sql`

### H5. Backup Instructions
- **Status**: ❌ **MISSING**
- **Files to create**:
  - `docs/BACKUP_RESTORE.md`
  - `scripts/backup-db.sh`

### H6. API Tests
- **Status**: ❌ **MISSING**
- **Files to create**:
  - `TESTS.postman_collection.json`
  - `tests/curl_tests.sh`
  - `backend/tests/integration/`

---

## I. n8n / Automation Tasks

### I1. n8n Workflow Templates
- **Status**: ❌ **MISSING**
- **Required**:
  - New order notification workflow
  - Order state change workflow
  - Loyalty points update workflow
- **Files to create**:
  - `n8n/workflows/new-order-notification.json`
  - `n8n/workflows/order-state-change.json`
  - `n8n/workflows/loyalty-points-update.json`

### I2. Alternative Node.js Background Jobs
- **Status**: ❌ **MISSING**
- **Files to create**:
  - `backend/jobs/orderNotifications.js`
  - `backend/jobs/loyaltyPointsProcessor.js`
  - `backend/jobs/scheduler.js` (using node-cron)

---

## Summary of Files to Create/Modify

### Migrations (13 files)
1. ✅ `migrations/01_init_schema.sql` - EXISTS
2. 🆕 `migrations/02_super_admin_setup.sql`
3. 🆕 `migrations/03_add_password_reset.sql`
4. 🆕 `migrations/04_add_admin_profile_fields.sql`
5. 🆕 `migrations/05_create_ledger_table.sql`
6. 🆕 `migrations/06_add_is_live_flag.sql`
7. 🆕 `migrations/07_create_order_status_history.sql`
8. 🆕 `migrations/08_add_customer_profile_fields.sql`
9. 🆕 `migrations/09_create_customer_addresses.sql`
10. 🆕 `migrations/10_add_feature_toggles.sql`
11. 🆕 `migrations/11_seed_predefined_themes.sql`
12. 🆕 `migrations/12_create_audit_log.sql`
13. 🆕 `migrations/13_add_performance_indexes.sql`

### Backend Controllers (10 files)
1. ✅ `backend/controllers/authController.js` - MODIFY (add reset)
2. 🆕 `backend/controllers/tenantsController.js`
3. 🆕 `backend/controllers/productsController.js`
4. 🆕 `backend/controllers/ordersController.js`
5. 🆕 `backend/controllers/ledgerController.js`
6. 🆕 `backend/controllers/notificationsController.js`
7. 🆕 `backend/controllers/featureFlagsController.js`
8. 🆕 `backend/controllers/themesController.js`
9. ✅ `backend/controllers/customersController.js` - MODIFY
10. ✅ `backend/controllers/rewardsController.js` - EXISTS

### Backend Routes (8 files)
1. ✅ `backend/routes/auth.js` - MODIFY
2. 🆕 `backend/routes/tenants.js`
3. 🆕 `backend/routes/products.js`
4. 🆕 `backend/routes/orders.js`
5. 🆕 `backend/routes/ledger.js`
6. 🆕 `backend/routes/notifications.js`
7. 🆕 `backend/routes/featureFlags.js`
8. 🆕 `backend/routes/themes.js`

### Backend Middleware (7 files)
1. ✅ `backend/middleware/auth.js` - EXISTS
2. ✅ `backend/middleware/tenant.js` - EXISTS
3. 🆕 `backend/middleware/upload.js`
4. 🆕 `backend/middleware/validateUpload.js`
5. 🆕 `backend/middleware/rateLimiter.js`
6. 🆕 `backend/middleware/auditLog.js`
7. 🆕 `backend/middleware/tenantFilter.js`

### Backend Utils (10 files)
1. 🆕 `backend/utils/imageProcessor.js`
2. 🆕 `backend/utils/csvParser.js`
3. 🆕 `backend/utils/productValidator.js`
4. 🆕 `backend/utils/zipHandler.js`
5. 🆕 `backend/utils/qrGenerator.js`
6. 🆕 `backend/utils/orderAudit.js`
7. 🆕 `backend/utils/pushNotifications.js`
8. 🆕 `backend/utils/whatsappNotifier.js`
9. 🆕 `backend/config/storage.js`

### Frontend Components (5 files)
1. 🆕 `src/components/ProductImportCSV.tsx`
2. 🆕 `src/components/BulkImageUpload.tsx`
3. 🆕 `src/components/NotificationSound.tsx`
4. 🆕 `src/components/ThemeSwitcher.tsx`
5. ✅ `src/App.tsx` - MODIFY (tenant routing)

### Tests & Documentation (6 files)
1. 🆕 `TESTS.postman_collection.json`
2. 🆕 `tests/curl_tests.sh`
3. 🆕 `backend/tests/tenant-isolation.test.js`
4. 🆕 `backend/tests/integration/`
5. 🆕 `docs/BACKUP_RESTORE.md`
6. 🆕 `README_FEAT_UPDATE.md`

### Jobs & Automation (6 files)
1. 🆕 `n8n/workflows/new-order-notification.json`
2. 🆕 `n8n/workflows/order-state-change.json`
3. 🆕 `n8n/workflows/loyalty-points-update.json`
4. 🆕 `backend/jobs/orderNotifications.js`
5. 🆕 `backend/jobs/loyaltyPointsProcessor.js`
6. 🆕 `backend/jobs/scheduler.js`

---

## Priority Implementation Order

### Phase 1: Critical Backend Infrastructure (Week 1)
1. Password reset flow
2. Admin profile fields & endpoints
3. File upload system
4. Products CSV import
5. Order lifecycle APIs

### Phase 2: Customer & Payments (Week 2)
1. Customer profile enhancement
2. Customer addresses
3. Credit/ledger system
4. Payment integrations

### Phase 3: Go Live & Distribution (Week 3)
1. Go live endpoint
2. QR code generation
3. PWA distribution
4. Subdomain routing

### Phase 4: Notifications & UX (Week 4)
1. Notification system
2. Push notifications
3. Sound alerts
4. Email/SMS/WhatsApp (optional)

### Phase 5: Testing & Security (Week 5)
1. Rate limiting
2. Audit logging
3. Tenant isolation tests
4. API test suite
5. Performance indexes

---

## Next Steps

I will now proceed to implement all missing features in the priority order above. Each implementation will include:
- Database migrations
- Backend API endpoints
- Frontend UI components (where needed)
- Tests and documentation

**Starting with Phase 1 now...**
