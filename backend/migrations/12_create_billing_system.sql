-- ============================================================================
-- Advanced Billing, Subscription & Monetization System
-- ============================================================================
-- Multi-tenant/partner billing with super admin controls
-- Includes subscription management, usage metering, invoicing, payments
-- GST/tax compliance, partner revenue sharing, discounts
-- ============================================================================

-- Partners/Resellers Table
CREATE TABLE IF NOT EXISTS partners (
  partner_id UUID DEFAULT (lower(hex(randomblob(16)))) PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  contact_phone TEXT,
  business_type TEXT DEFAULT 'reseller',
  commission_rate DECIMAL(5,2) DEFAULT 0.00,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
  address TEXT,
  gstin TEXT,
  pan TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscription Plans
CREATE TABLE IF NOT EXISTS subscription_plans (
  plan_id UUID DEFAULT (lower(hex(randomblob(16)))) PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'basic', 'premium', 'enterprise', 'custom')),
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly', 'custom')),
  base_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  currency TEXT DEFAULT 'INR',
  features JSONB,
  limits JSONB,
  trial_days INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tenant/Partner Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  subscription_id UUID DEFAULT (lower(hex(randomblob(16)))) PRIMARY KEY,
  tenant_id UUID NOT NULL,
  partner_id UUID,
  plan_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trial', 'suspended', 'cancelled', 'expired', 'pending')),
  start_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  end_date TIMESTAMP,
  trial_end_date TIMESTAMP,
  next_billing_date TIMESTAMP,
  auto_renew BOOLEAN DEFAULT true,
  custom_pricing JSONB,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  FOREIGN KEY (partner_id) REFERENCES partners(partner_id) ON DELETE SET NULL,
  FOREIGN KEY (plan_id) REFERENCES subscription_plans(plan_id) ON DELETE RESTRICT
);

-- Usage Metering
CREATE TABLE IF NOT EXISTS usage_records (
  usage_id UUID DEFAULT (lower(hex(randomblob(16)))) PRIMARY KEY,
  tenant_id UUID NOT NULL,
  subscription_id UUID NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value DECIMAL(15,2) NOT NULL,
  unit TEXT,
  recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  billing_period_start TIMESTAMP NOT NULL,
  billing_period_end TIMESTAMP NOT NULL,
  metadata JSONB,
  FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(subscription_id) ON DELETE CASCADE
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  invoice_id UUID DEFAULT (lower(hex(randomblob(16)))) PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  tenant_id UUID NOT NULL,
  partner_id UUID,
  subscription_id UUID,
  invoice_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  due_date TIMESTAMP NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'paid', 'overdue', 'cancelled', 'refunded')),
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  discount_amount DECIMAL(10,2) DEFAULT 0.00,
  tax_amount DECIMAL(10,2) DEFAULT 0.00,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  currency TEXT DEFAULT 'INR',
  payment_terms TEXT,
  notes TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  FOREIGN KEY (partner_id) REFERENCES partners(partner_id) ON DELETE SET NULL,
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(subscription_id) ON DELETE SET NULL
);

-- Invoice Line Items
CREATE TABLE IF NOT EXISTS invoice_items (
  item_id UUID DEFAULT (lower(hex(randomblob(16)))) PRIMARY KEY,
  invoice_id UUID NOT NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) DEFAULT 1.00,
  unit_price DECIMAL(10,2) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  tax_rate DECIMAL(5,2) DEFAULT 0.00,
  discount_rate DECIMAL(5,2) DEFAULT 0.00,
  metadata JSONB,
  FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id) ON DELETE CASCADE
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  payment_id UUID DEFAULT (lower(hex(randomblob(16)))) PRIMARY KEY,
  invoice_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('credit_card', 'debit_card', 'upi', 'net_banking', 'wallet', 'bank_transfer', 'cheque', 'cash', 'other')),
  payment_gateway TEXT,
  transaction_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled')),
  payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE
);

-- Discounts & Coupons
CREATE TABLE IF NOT EXISTS discounts (
  discount_id UUID DEFAULT (lower(hex(randomblob(16)))) PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'trial_extension')),
  discount_value DECIMAL(10,2) NOT NULL,
  min_amount DECIMAL(10,2) DEFAULT 0.00,
  max_discount DECIMAL(10,2),
  applicable_plans JSONB,
  valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  valid_until TIMESTAMP,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Applied Discounts
CREATE TABLE IF NOT EXISTS applied_discounts (
  applied_discount_id UUID DEFAULT (lower(hex(randomblob(16)))) PRIMARY KEY,
  discount_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  invoice_id UUID,
  subscription_id UUID,
  discount_amount DECIMAL(10,2) NOT NULL,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (discount_id) REFERENCES discounts(discount_id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id) ON DELETE SET NULL,
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(subscription_id) ON DELETE SET NULL
);

-- Partner Revenue Sharing
CREATE TABLE IF NOT EXISTS partner_revenue (
  revenue_id UUID DEFAULT (lower(hex(randomblob(16)))) PRIMARY KEY,
  partner_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  invoice_id UUID NOT NULL,
  payment_id UUID,
  revenue_amount DECIMAL(10,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  payout_date TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (partner_id) REFERENCES partners(partner_id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id) ON DELETE CASCADE,
  FOREIGN KEY (payment_id) REFERENCES payments(payment_id) ON DELETE SET NULL
);

-- Tax Configuration
CREATE TABLE IF NOT EXISTS tax_config (
  tax_id UUID DEFAULT (lower(hex(randomblob(16)))) PRIMARY KEY,
  country TEXT NOT NULL,
  state TEXT,
  tax_type TEXT NOT NULL,
  tax_name TEXT NOT NULL,
  tax_rate DECIMAL(5,2) NOT NULL,
  applicable_from TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  applicable_to TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Super Admin Billing Feature Toggles
CREATE TABLE IF NOT EXISTS billing_feature_toggles (
  toggle_id UUID DEFAULT (lower(hex(randomblob(16)))) PRIMARY KEY,
  tenant_id UUID,
  partner_id UUID,
  feature_name TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT false,
  config JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  FOREIGN KEY (partner_id) REFERENCES partners(partner_id) ON DELETE CASCADE
);

-- Payment Reminders
CREATE TABLE IF NOT EXISTS payment_reminders (
  reminder_id UUID DEFAULT (lower(hex(randomblob(16)))) PRIMARY KEY,
  invoice_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('first', 'second', 'final', 'overdue')),
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'bounced')),
  metadata JSONB,
  FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE
);

-- Billing Configuration per Tenant
CREATE TABLE IF NOT EXISTS billing_config (
  config_id UUID DEFAULT (lower(hex(randomblob(16)))) PRIMARY KEY,
  tenant_id UUID UNIQUE NOT NULL,
  auto_invoice BOOLEAN DEFAULT true,
  invoice_prefix TEXT DEFAULT 'INV',
  payment_terms_days INTEGER DEFAULT 30,
  send_reminders BOOLEAN DEFAULT true,
  reminder_days_before TEXT DEFAULT '7,3,1',
  overdue_reminder_days TEXT DEFAULT '1,7,14',
  currency TEXT DEFAULT 'INR',
  tax_enabled BOOLEAN DEFAULT true,
  default_tax_rate DECIMAL(5,2) DEFAULT 18.00,
  payment_methods JSONB,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE
);

-- Subscription History/Audit
CREATE TABLE IF NOT EXISTS subscription_history (
  history_id UUID DEFAULT (lower(hex(randomblob(16)))) PRIMARY KEY,
  subscription_id UUID NOT NULL,
  action TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT,
  old_plan_id UUID,
  new_plan_id UUID,
  changed_by UUID,
  change_reason TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(subscription_id) ON DELETE CASCADE
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant ON subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_partner ON subscriptions(partner_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_billing_date ON subscriptions(next_billing_date);

CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_partner ON invoices(partner_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);

CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_tenant ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);

CREATE INDEX IF NOT EXISTS idx_usage_records_tenant ON usage_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_subscription ON usage_records(subscription_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_period ON usage_records(billing_period_start, billing_period_end);

CREATE INDEX IF NOT EXISTS idx_partner_revenue_partner ON partner_revenue(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_revenue_tenant ON partner_revenue(tenant_id);
CREATE INDEX IF NOT EXISTS idx_partner_revenue_status ON partner_revenue(status);

CREATE INDEX IF NOT EXISTS idx_billing_toggles_tenant ON billing_feature_toggles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_billing_toggles_partner ON billing_feature_toggles(partner_id);

-- Insert default subscription plans
INSERT INTO subscription_plans (plan_id, name, description, plan_type, billing_cycle, base_price, features, limits)
VALUES 
  ((lower(hex(randomblob(16)))), 'Free Trial', 'Try Pulss for free', 'free', 'monthly', 0.00, 
   '{"products": 50, "orders": 100, "users": 2, "support": "email"}', 
   '{"max_products": 50, "max_orders_monthly": 100, "max_users": 2}'),
  
  ((lower(hex(randomblob(16)))), 'Basic', 'Perfect for small pharmacies', 'basic', 'monthly', 999.00,
   '{"products": 500, "orders": 1000, "users": 5, "support": "email+chat", "analytics": true}',
   '{"max_products": 500, "max_orders_monthly": 1000, "max_users": 5}'),
  
  ((lower(hex(randomblob(16)))), 'Premium', 'For growing businesses', 'premium', 'monthly', 2999.00,
   '{"products": 2000, "orders": 5000, "users": 15, "support": "24/7", "analytics": true, "multi_location": true, "api_access": true}',
   '{"max_products": 2000, "max_orders_monthly": 5000, "max_users": 15}'),
  
  ((lower(hex(randomblob(16)))), 'Enterprise', 'Unlimited scale', 'enterprise', 'monthly', 9999.00,
   '{"products": -1, "orders": -1, "users": -1, "support": "dedicated", "analytics": true, "multi_location": true, "api_access": true, "white_label": true, "custom_integrations": true}',
   '{"max_products": -1, "max_orders_monthly": -1, "max_users": -1}');

-- Insert default tax configuration (GST for India)
INSERT INTO tax_config (country, state, tax_type, tax_name, tax_rate, is_active)
VALUES 
  ('India', NULL, 'GST', 'CGST+SGST', 18.00, true),
  ('India', NULL, 'GST', 'IGST', 18.00, true);

-- Insert default billing features that can be toggled
-- These will be used to control access to billing features per tenant/partner
CREATE TABLE IF NOT EXISTS billing_features (
  feature_id UUID DEFAULT (lower(hex(randomblob(16)))) PRIMARY KEY,
  feature_name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'billing',
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO billing_features (feature_name, display_name, description, category, is_premium)
VALUES 
  ('billing_enabled', 'Billing System', 'Enable billing and subscription management', 'core', false),
  ('invoicing_enabled', 'Automated Invoicing', 'Automatic invoice generation and management', 'automation', true),
  ('usage_metering', 'Usage Metering', 'Track and bill based on usage metrics', 'metering', true),
  ('partner_revenue_sharing', 'Partner Revenue Sharing', 'Revenue sharing with partners/resellers', 'partners', true),
  ('custom_pricing', 'Custom Pricing', 'Tenant-specific pricing models', 'pricing', true),
  ('discounts_enabled', 'Discounts & Coupons', 'Apply discounts and promotional codes', 'pricing', false),
  ('payment_reminders', 'Payment Reminders', 'Automated payment reminder emails', 'automation', true),
  ('tax_compliance', 'Tax Compliance', 'GST and tax calculation support', 'compliance', true),
  ('multi_currency', 'Multi-Currency Support', 'Support for multiple currencies', 'international', true),
  ('subscription_management', 'Subscription Management', 'Advanced subscription lifecycle management', 'core', false);
