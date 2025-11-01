-- ============================================================================
-- Multi-Tenancy Enhancement Migration
-- ============================================================================
-- This migration enhances the multi-tenancy implementation with:
-- 1. Additional tenant metadata fields
-- 2. Tenant settings table
-- 3. Tenant subscription/plan information
-- 4. Enhanced indexes for tenant-scoped queries
-- ============================================================================

-- Add additional fields to tenants table if they don't exist
-- Note: SQLite doesn't support IF NOT EXISTS for columns, so we'll use a safer approach

-- Add tenant metadata columns
ALTER TABLE tenants ADD COLUMN shop_name TEXT;
ALTER TABLE tenants ADD COLUMN street_address TEXT;
ALTER TABLE tenants ADD COLUMN pincode TEXT;
ALTER TABLE tenants ADD COLUMN drug_license_number TEXT;
ALTER TABLE tenants ADD COLUMN gst_number TEXT;
ALTER TABLE tenants ADD COLUMN is_live BOOLEAN DEFAULT false;
ALTER TABLE tenants ADD COLUMN pwa_url TEXT;
ALTER TABLE tenants ADD COLUMN qr_image_url TEXT;

-- Create tenant_settings table for advanced configuration
CREATE TABLE IF NOT EXISTS tenant_settings (
  tenant_id TEXT PRIMARY KEY REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  theme_id TEXT,
  welcome_message TEXT,
  footer_text TEXT,
  currency_symbol TEXT DEFAULT '₹',
  timezone TEXT DEFAULT 'Asia/Kolkata',
  language TEXT DEFAULT 'en',
  date_format TEXT DEFAULT 'DD/MM/YYYY',
  time_format TEXT DEFAULT '24h',
  
  -- Business hours
  business_hours JSONB,
  
  -- Email settings
  smtp_host TEXT,
  smtp_port INTEGER,
  smtp_user TEXT,
  smtp_password TEXT,
  smtp_from_email TEXT,
  smtp_from_name TEXT,
  
  -- Notification preferences
  email_notifications_enabled BOOLEAN DEFAULT true,
  sms_notifications_enabled BOOLEAN DEFAULT false,
  push_notifications_enabled BOOLEAN DEFAULT true,
  
  -- Custom domain settings
  custom_domain TEXT,
  custom_domain_verified BOOLEAN DEFAULT false,
  
  -- API configuration
  api_rate_limit INTEGER DEFAULT 1000,
  api_enabled BOOLEAN DEFAULT true,
  
  -- Metadata
  metadata JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create tenant subscription/plan table
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
  subscription_id TEXT PRIMARY KEY,
  tenant_id TEXT REFERENCES tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  plan_name TEXT NOT NULL DEFAULT 'free',
  plan_type TEXT DEFAULT 'monthly', -- 'monthly', 'yearly', 'lifetime'
  status TEXT DEFAULT 'active', -- 'active', 'inactive', 'cancelled', 'suspended'
  
  -- Limits
  max_products INTEGER DEFAULT 100,
  max_orders_per_month INTEGER DEFAULT 1000,
  max_customers INTEGER DEFAULT 1000,
  max_storage_mb INTEGER DEFAULT 1000,
  max_admins INTEGER DEFAULT 1,
  
  -- Features
  features_enabled JSONB,
  
  -- Billing
  billing_amount DECIMAL(10,2),
  billing_currency TEXT DEFAULT 'INR',
  billing_cycle_start TIMESTAMP WITH TIME ZONE,
  billing_cycle_end TIMESTAMP WITH TIME ZONE,
  next_billing_date TIMESTAMP WITH TIME ZONE,
  
  -- Payment
  last_payment_date TIMESTAMP WITH TIME ZONE,
  last_payment_amount DECIMAL(10,2),
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create pending admin invites table if not exists
CREATE TABLE IF NOT EXISTS pending_admin_invites (
  invite_id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  tenant_id TEXT REFERENCES tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  setup_code TEXT NOT NULL,
  must_change_password BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (TIMEZONE('utc'::text, NOW()) + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add indexes for tenant-scoped queries (if not exist)
CREATE INDEX IF NOT EXISTS idx_tenant_settings_tenant ON tenant_settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant ON tenant_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_status ON tenant_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_pending_admin_invites_tenant ON pending_admin_invites(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pending_admin_invites_email ON pending_admin_invites(email);
CREATE INDEX IF NOT EXISTS idx_pending_admin_invites_code ON pending_admin_invites(setup_code);

-- Add composite indexes for common tenant-scoped queries
CREATE INDEX IF NOT EXISTS idx_tenants_status_business_type ON tenants(status, business_type);
CREATE INDEX IF NOT EXISTS idx_tenants_is_live ON tenants(is_live);

-- Initialize tenant_settings for existing tenants
INSERT INTO tenant_settings (tenant_id)
SELECT tenant_id FROM tenants
WHERE tenant_id NOT IN (SELECT tenant_id FROM tenant_settings);

-- ============================================================================
-- Notes:
-- 1. This migration assumes PostgreSQL. For SQLite, adjust as needed.
-- 2. The tenant_id is enforced in all tenant-scoped tables
-- 3. Indexes are created to optimize tenant-filtered queries
-- 4. Subscription limits can be enforced in application logic
-- ============================================================================
