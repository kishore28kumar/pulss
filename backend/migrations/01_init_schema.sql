-- ============================================================================
-- Pulss Database Schema - VPS/PostgreSQL Version (Converted from Supabase)
-- ============================================================================
-- This schema has been converted from Supabase to work with plain PostgreSQL
-- All auth.users references have been replaced with local admin/customer tables
-- All RLS policies have been removed - security handled server-side
-- Multi-tenancy preserved via tenant_id columns with proper indexing
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Tenants (Multi-tenant stores)
CREATE TABLE public.tenants (
  tenant_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE,
  status TEXT DEFAULT 'active',
  business_type TEXT DEFAULT 'pharmacy',
  location TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'India',
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Admins (Store administrators - replaces auth.users for admins)
-- CONVERTED: Replaces references to auth.users for admin users
CREATE TABLE public.admins (
  admin_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
  email CITEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL, -- bcrypt hashed password
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'admin', -- 'super_admin', 'admin'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Customers (Replaces auth.users for customer users)
-- CONVERTED: Combines profiles and customers, removes auth.users dependency
CREATE TABLE public.customers (
  customer_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  email CITEXT,
  password_hash TEXT, -- Optional: for customer login, bcrypt hashed
  name TEXT NOT NULL,
  phone TEXT,
  loyalty_points BIGINT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Store Settings (per tenant)
CREATE TABLE public.store_settings (
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  logo_url TEXT,
  address TEXT,
  hero_images TEXT[],
  splash_screen_url TEXT,
  carousel_images TEXT[],
  upi_id TEXT,
  upi_qr_code_url TEXT,
  bank_details JSONB,
  whatsapp_number TEXT,
  social_media JSONB,
  primary_color TEXT,
  theme_id UUID,
  business_name TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'India',
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Global App Settings (Super Admin only)
CREATE TABLE public.app_settings (
  setting_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  main_logo_url TEXT,
  app_name TEXT DEFAULT 'Pulss',
  default_theme_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Themes System
CREATE TABLE public.themes (
  theme_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'custom',
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  css_variables JSONB NOT NULL,
  preview_image_url TEXT,
  -- CONVERTED: created_by now references admins table instead of auth.users
  created_by UUID REFERENCES public.admins(admin_id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Categories
CREATE TABLE public.categories (
  category_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  parent_id UUID REFERENCES public.categories(category_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Products
CREATE TABLE public.products (
  product_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.categories(category_id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  brand TEXT,
  pack_size TEXT,
  price DECIMAL(10,2) NOT NULL,
  mrp DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  images TEXT[],
  requires_rx BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  inventory_count INTEGER DEFAULT 0,
  sku TEXT,
  tags TEXT[],
  weight TEXT,
  dimensions TEXT,
  manufacturer TEXT,
  expiry_date DATE,
  batch_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Orders
CREATE TABLE public.orders (
  order_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES public.customers(customer_id) ON DELETE CASCADE NOT NULL,
  order_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  total DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL,
  payment_status TEXT DEFAULT 'pending',
  delivery_address TEXT,
  delivery_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Order Items
CREATE TABLE public.order_items (
  order_item_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(order_id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(product_id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  line_total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Transactions (for loyalty points)
CREATE TABLE public.transactions (
  transaction_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES public.customers(customer_id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES public.orders(order_id) ON DELETE SET NULL,
  purchase_amount DECIMAL(10,2) NOT NULL,
  points_earned INTEGER DEFAULT 0,
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Rewards (loyalty rewards catalog)
CREATE TABLE public.rewards (
  reward_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  points_required INTEGER NOT NULL,
  reward_type TEXT DEFAULT 'discount', -- 'discount', 'freebie', 'voucher'
  discount_amount DECIMAL(10,2),
  discount_percentage INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Reward Redemptions
CREATE TABLE public.reward_redemptions (
  redemption_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES public.customers(customer_id) ON DELETE CASCADE NOT NULL,
  reward_id UUID REFERENCES public.rewards(reward_id) ON DELETE CASCADE NOT NULL,
  points_used INTEGER NOT NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  status TEXT DEFAULT 'redeemed', -- 'redeemed', 'used', 'expired'
  used_at TIMESTAMP WITH TIME ZONE
);

-- Feature Flags (per tenant)
CREATE TABLE public.feature_flags (
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE PRIMARY KEY,
  tracking_enabled BOOLEAN DEFAULT false,
  wallet_enabled BOOLEAN DEFAULT false,
  loyalty_enabled BOOLEAN DEFAULT true,
  coupons_enabled BOOLEAN DEFAULT false,
  returns_enabled BOOLEAN DEFAULT false,
  refunds_enabled BOOLEAN DEFAULT false,
  subscriptions_enabled BOOLEAN DEFAULT false,
  prescription_required_enabled BOOLEAN DEFAULT false,
  multi_warehouse_enabled BOOLEAN DEFAULT false,
  whatsapp_notifications_enabled BOOLEAN DEFAULT false,
  push_notifications_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Announcements (per tenant)
CREATE TABLE public.announcements (
  announcement_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  type TEXT NOT NULL DEFAULT 'info',
  active BOOLEAN DEFAULT true,
  -- CONVERTED: created_by references admins instead of auth.users
  created_by UUID REFERENCES public.admins(admin_id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Scroll Messages (per tenant)
CREATE TABLE public.scroll_messages (
  message_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  -- CONVERTED: created_by references admins instead of auth.users
  created_by UUID REFERENCES public.admins(admin_id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- QR Code Generation Records (per tenant)
CREATE TABLE public.tenant_qr_codes (
  qr_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  qr_code_url TEXT,
  app_download_url TEXT,
  -- CONVERTED: created_by references admins instead of auth.users
  created_by UUID REFERENCES public.admins(admin_id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Notifications (replaces Supabase realtime)
CREATE TABLE public.notifications (
  notification_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
  -- CONVERTED: user_id split into admin_id and customer_id
  admin_id UUID REFERENCES public.admins(admin_id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(customer_id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT false,
  priority TEXT DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- System Alerts (for super admin)
CREATE TABLE public.system_alerts (
  alert_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  details JSONB,
  severity TEXT DEFAULT 'medium',
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Automated Reports Storage
CREATE TABLE public.automated_reports (
  report_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type TEXT NOT NULL,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  report_data JSONB NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE
);

-- Saved Filters
CREATE TABLE public.saved_filters (
  filter_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  -- CONVERTED: user_id references admins instead of auth.users
  admin_id UUID REFERENCES public.admins(admin_id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  filter_type TEXT NOT NULL,
  filters JSONB NOT NULL,
  sort_options JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tenant Stats (cached metrics)
CREATE TABLE public.tenant_stats (
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE PRIMARY KEY,
  total_revenue NUMERIC DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_customers INTEGER DEFAULT 0,
  last_order_date TIMESTAMP WITH TIME ZONE,
  avg_order_value NUMERIC DEFAULT 0,
  growth_rate NUMERIC DEFAULT 0,
  last_calculated TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Customer Stats
CREATE TABLE public.customer_stats (
  customer_id UUID REFERENCES public.customers(customer_id) ON DELETE CASCADE PRIMARY KEY,
  total_orders INTEGER DEFAULT 0,
  total_spent NUMERIC DEFAULT 0,
  last_order_date TIMESTAMP WITH TIME ZONE,
  loyalty_tier TEXT DEFAULT 'bronze',
  last_calculated TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Global Settings (for super admin)
CREATE TABLE public.global_settings (
  key TEXT PRIMARY KEY,
  value JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE (Multi-tenancy optimization)
-- ============================================================================

-- All RLS policies removed - tenant_id filtering handled server-side
-- Indexes ensure fast queries when filtering by tenant_id

CREATE INDEX idx_admins_tenant ON public.admins(tenant_id);
CREATE INDEX idx_admins_email ON public.admins(email);
CREATE INDEX idx_customers_tenant ON public.customers(tenant_id);
CREATE INDEX idx_customers_email ON public.customers(email);
CREATE INDEX idx_customers_phone ON public.customers(phone);
CREATE INDEX idx_store_settings_tenant ON public.store_settings(tenant_id);
CREATE INDEX idx_categories_tenant ON public.categories(tenant_id);
CREATE INDEX idx_products_tenant ON public.products(tenant_id);
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_active ON public.products(active);
CREATE INDEX idx_orders_tenant ON public.orders(tenant_id);
CREATE INDEX idx_orders_customer ON public.orders(customer_id);
CREATE INDEX idx_order_items_order ON public.order_items(order_id);
CREATE INDEX idx_transactions_tenant ON public.transactions(tenant_id);
CREATE INDEX idx_transactions_customer ON public.transactions(customer_id);
CREATE INDEX idx_rewards_tenant ON public.rewards(tenant_id);
CREATE INDEX idx_redemptions_tenant ON public.reward_redemptions(tenant_id);
CREATE INDEX idx_redemptions_customer ON public.reward_redemptions(customer_id);
CREATE INDEX idx_notifications_tenant ON public.notifications(tenant_id);
CREATE INDEX idx_notifications_admin ON public.notifications(admin_id);
CREATE INDEX idx_notifications_customer ON public.notifications(customer_id);
CREATE INDEX idx_announcements_tenant ON public.announcements(tenant_id);
CREATE INDEX idx_scroll_messages_tenant ON public.scroll_messages(tenant_id);

-- Composite indexes for common queries
CREATE INDEX idx_products_tenant_active ON public.products(tenant_id, active);
CREATE INDEX idx_orders_tenant_status ON public.orders(tenant_id, status);
CREATE INDEX idx_customers_tenant_active ON public.customers(tenant_id, is_active);

-- ============================================================================
-- NOTES ON CONVERSION FROM SUPABASE
-- ============================================================================
-- 1. All auth.users references replaced with admins/customers tables
-- 2. All RLS policies removed - security enforced in Node.js middleware
-- 3. All Supabase functions (admin_create_tenant_with_setup, handle_new_user) 
--    removed - logic moved to Node.js backend
-- 4. All triggers removed - handled in application code
-- 5. tenant_id indexing added for all multi-tenant tables
-- 6. Password hashing using bcrypt in Node.js, not pgcrypto
-- 7. JWT authentication handled in Node.js, not Supabase Auth
-- 8. Storage (images) needs separate solution (local filesystem or S3)
-- ============================================================================
