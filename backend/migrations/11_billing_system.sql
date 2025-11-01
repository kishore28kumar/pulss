-- ============================================================================
-- Migration 11: Advanced Billing and Subscription Management System
-- ============================================================================
-- Comprehensive billing system with multi-tier subscriptions, payment gateways,
-- invoicing, tax compliance, partner commissions, and analytics
-- ============================================================================

-- ============================================================================
-- SUBSCRIPTION PLANS
-- ============================================================================

-- Subscription Plans (Tiered pricing model)
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  plan_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'basic', 'professional', 'enterprise', 'custom')),
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly', 'one_time')),
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'INR',
  
  -- Feature limits
  max_products INTEGER,
  max_orders_per_month INTEGER,
  max_storage_gb INTEGER,
  max_admin_users INTEGER,
  
  -- Features included
  features JSONB DEFAULT '[]'::jsonb,
  
  -- Usage-based billing
  usage_based_billing BOOLEAN DEFAULT false,
  usage_metrics JSONB, -- {metric: rate_per_unit}
  
  -- Plan status
  is_active BOOLEAN DEFAULT true,
  is_visible BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  
  -- Trial settings
  trial_period_days INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================================================
-- SUBSCRIPTIONS
-- ============================================================================

-- Tenant Subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  subscription_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.subscription_plans(plan_id) ON DELETE RESTRICT NOT NULL,
  
  -- Subscription details
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'active', 'past_due', 'cancelled', 'expired', 'trial', 'suspended'
  )),
  
  -- Dates
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  trial_end_date TIMESTAMP WITH TIME ZONE,
  next_billing_date TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  
  -- Pricing
  base_price DECIMAL(10, 2) NOT NULL,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  
  -- Auto-renewal
  auto_renew BOOLEAN DEFAULT true,
  
  -- Cancellation
  cancellation_reason TEXT,
  cancelled_by UUID, -- admin_id
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  UNIQUE(tenant_id, status) WHERE status = 'active'
);

-- Subscription History (audit trail)
CREATE TABLE IF NOT EXISTS public.subscription_history (
  history_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  subscription_id UUID REFERENCES public.subscriptions(subscription_id) ON DELETE CASCADE NOT NULL,
  
  old_status TEXT,
  new_status TEXT NOT NULL,
  old_plan_id UUID,
  new_plan_id UUID,
  
  change_reason TEXT,
  changed_by UUID, -- admin_id
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================================================
-- PAYMENT GATEWAYS
-- ============================================================================

-- Payment Gateway Configuration
CREATE TABLE IF NOT EXISTS public.payment_gateways (
  gateway_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
  
  gateway_name TEXT NOT NULL CHECK (gateway_name IN (
    'stripe', 'razorpay', 'paypal', 'paytm', 'phonepe', 'cashfree', 'instamojo', 'ccavenue'
  )),
  
  -- Configuration
  is_enabled BOOLEAN DEFAULT false,
  is_test_mode BOOLEAN DEFAULT true,
  
  -- Credentials (encrypted)
  api_key TEXT,
  api_secret TEXT,
  webhook_secret TEXT,
  merchant_id TEXT,
  
  -- Settings
  supported_currencies TEXT[] DEFAULT ARRAY['INR'],
  supported_payment_methods TEXT[] DEFAULT ARRAY['card', 'upi', 'netbanking', 'wallet'],
  
  -- Metadata
  config_data JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  UNIQUE(tenant_id, gateway_name)
);

-- ============================================================================
-- INVOICES
-- ============================================================================

-- Invoices
CREATE TABLE IF NOT EXISTS public.invoices (
  invoice_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  subscription_id UUID REFERENCES public.subscriptions(subscription_id) ON DELETE SET NULL,
  
  -- Invoice details
  invoice_number TEXT UNIQUE NOT NULL,
  invoice_date TIMESTAMP WITH TIME ZONE NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'pending', 'paid', 'partially_paid', 'overdue', 'cancelled', 'refunded'
  )),
  
  -- Amounts
  subtotal DECIMAL(10, 2) NOT NULL,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  paid_amount DECIMAL(10, 2) DEFAULT 0,
  balance_due DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  
  -- Tax details
  tax_rate DECIMAL(5, 2),
  tax_type TEXT, -- GST, VAT, etc.
  gstin TEXT,
  
  -- Customer details (snapshot at time of invoice)
  customer_details JSONB,
  
  -- Line items
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Notes
  notes TEXT,
  terms TEXT,
  
  -- Payment
  payment_date TIMESTAMP WITH TIME ZONE,
  
  -- PDF generation
  pdf_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Invoice Line Items (normalized)
CREATE TABLE IF NOT EXISTS public.invoice_line_items (
  line_item_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  invoice_id UUID REFERENCES public.invoices(invoice_id) ON DELETE CASCADE NOT NULL,
  
  description TEXT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  
  -- Tax
  tax_rate DECIMAL(5, 2),
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================================================
-- PAYMENTS
-- ============================================================================

-- Payments
CREATE TABLE IF NOT EXISTS public.payments (
  payment_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  invoice_id UUID REFERENCES public.invoices(invoice_id) ON DELETE SET NULL,
  subscription_id UUID REFERENCES public.subscriptions(subscription_id) ON DELETE SET NULL,
  
  -- Payment details
  payment_method TEXT NOT NULL CHECK (payment_method IN (
    'card', 'upi', 'netbanking', 'wallet', 'bank_transfer', 'check', 'cash', 'other'
  )),
  
  -- Gateway details
  gateway_name TEXT,
  gateway_transaction_id TEXT,
  gateway_payment_id TEXT,
  
  -- Amount
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'
  )),
  
  -- Timestamps
  payment_date TIMESTAMP WITH TIME ZONE,
  processed_at TIMESTAMP WITH TIME ZONE,
  
  -- Gateway response
  gateway_response JSONB,
  
  -- Failure details
  failure_reason TEXT,
  failure_code TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================================================
-- DISCOUNTS AND COUPONS
-- ============================================================================

-- Coupons
CREATE TABLE IF NOT EXISTS public.coupons (
  coupon_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  
  -- Discount type
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value DECIMAL(10, 2) NOT NULL,
  
  -- Validity
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_until TIMESTAMP WITH TIME ZONE,
  
  -- Usage limits
  max_uses INTEGER,
  max_uses_per_tenant INTEGER,
  times_used INTEGER DEFAULT 0,
  
  -- Applicable to
  applicable_plans UUID[], -- Array of plan_ids, NULL means all plans
  min_subscription_value DECIMAL(10, 2),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Coupon Usage
CREATE TABLE IF NOT EXISTS public.coupon_usage (
  usage_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  coupon_id UUID REFERENCES public.coupons(coupon_id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  subscription_id UUID REFERENCES public.subscriptions(subscription_id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES public.invoices(invoice_id) ON DELETE SET NULL,
  
  discount_amount DECIMAL(10, 2) NOT NULL,
  
  used_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================================================
-- USAGE TRACKING (for metered billing)
-- ============================================================================

-- Usage Records
CREATE TABLE IF NOT EXISTS public.usage_records (
  usage_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  subscription_id UUID REFERENCES public.subscriptions(subscription_id) ON DELETE CASCADE NOT NULL,
  
  -- Usage metrics
  metric_name TEXT NOT NULL, -- e.g., 'api_calls', 'storage_gb', 'orders_processed'
  quantity DECIMAL(10, 2) NOT NULL,
  unit TEXT, -- e.g., 'calls', 'gb', 'orders'
  
  -- Billing
  unit_price DECIMAL(10, 2),
  total_amount DECIMAL(10, 2),
  
  -- Time period
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Status
  is_billed BOOLEAN DEFAULT false,
  billed_in_invoice_id UUID,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================================================
-- PARTNER/RESELLER COMMISSIONS
-- ============================================================================

-- Partners/Resellers
CREATE TABLE IF NOT EXISTS public.partners (
  partner_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  name TEXT NOT NULL,
  email CITEXT UNIQUE NOT NULL,
  phone TEXT,
  
  -- Commission settings
  commission_type TEXT NOT NULL DEFAULT 'percentage' CHECK (commission_type IN ('percentage', 'fixed')),
  commission_value DECIMAL(10, 2) NOT NULL,
  
  -- Bank details for payouts
  bank_details JSONB,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Partner-Tenant Associations
CREATE TABLE IF NOT EXISTS public.partner_tenants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  partner_id UUID REFERENCES public.partners(partner_id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  
  -- Override commission for specific tenant
  custom_commission_type TEXT CHECK (custom_commission_type IN ('percentage', 'fixed')),
  custom_commission_value DECIMAL(10, 2),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  UNIQUE(partner_id, tenant_id)
);

-- Commission Transactions
CREATE TABLE IF NOT EXISTS public.commissions (
  commission_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  partner_id UUID REFERENCES public.partners(partner_id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  subscription_id UUID REFERENCES public.subscriptions(subscription_id) ON DELETE SET NULL,
  payment_id UUID REFERENCES public.payments(payment_id) ON DELETE SET NULL,
  
  -- Commission details
  base_amount DECIMAL(10, 2) NOT NULL, -- Amount on which commission is calculated
  commission_rate DECIMAL(10, 2) NOT NULL,
  commission_amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  
  -- Payout
  payout_date TIMESTAMP WITH TIME ZONE,
  payout_reference TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================================================
-- SUPER ADMIN BILLING TOGGLES
-- ============================================================================

-- Billing Feature Toggles (per tenant)
CREATE TABLE IF NOT EXISTS public.billing_feature_toggles (
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE PRIMARY KEY,
  
  -- Core billing features
  billing_enabled BOOLEAN DEFAULT false,
  subscription_management_enabled BOOLEAN DEFAULT false,
  
  -- Payment methods
  credit_card_payments_enabled BOOLEAN DEFAULT false,
  upi_payments_enabled BOOLEAN DEFAULT false,
  netbanking_enabled BOOLEAN DEFAULT false,
  wallet_payments_enabled BOOLEAN DEFAULT false,
  
  -- Advanced features
  usage_based_billing_enabled BOOLEAN DEFAULT false,
  metered_billing_enabled BOOLEAN DEFAULT false,
  invoice_generation_enabled BOOLEAN DEFAULT false,
  automated_invoicing_enabled BOOLEAN DEFAULT false,
  
  -- Discount features
  coupons_enabled BOOLEAN DEFAULT false,
  promotional_discounts_enabled BOOLEAN DEFAULT false,
  
  -- Partner features
  partner_commissions_enabled BOOLEAN DEFAULT false,
  reseller_program_enabled BOOLEAN DEFAULT false,
  
  -- Compliance
  gst_compliance_enabled BOOLEAN DEFAULT false,
  tax_calculations_enabled BOOLEAN DEFAULT false,
  
  -- Analytics
  billing_analytics_enabled BOOLEAN DEFAULT false,
  revenue_reports_enabled BOOLEAN DEFAULT false,
  churn_analysis_enabled BOOLEAN DEFAULT false,
  
  -- Exports
  invoice_export_enabled BOOLEAN DEFAULT false,
  billing_history_export_enabled BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Insert default billing toggles for existing tenants
INSERT INTO public.billing_feature_toggles (tenant_id)
SELECT tenant_id FROM public.tenants
ON CONFLICT (tenant_id) DO NOTHING;

-- ============================================================================
-- BILLING ANALYTICS
-- ============================================================================

-- Revenue Analytics (Materialized View for performance)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_billing_analytics AS
SELECT
  tenant_id,
  DATE_TRUNC('month', created_at) as month,
  COUNT(DISTINCT subscription_id) as total_subscriptions,
  COUNT(DISTINCT CASE WHEN status = 'active' THEN subscription_id END) as active_subscriptions,
  COUNT(DISTINCT CASE WHEN status = 'cancelled' THEN subscription_id END) as cancelled_subscriptions,
  SUM(total_amount) as total_revenue,
  AVG(total_amount) as avg_revenue_per_subscription,
  SUM(CASE WHEN status = 'active' THEN total_amount ELSE 0 END) as mrr -- Monthly Recurring Revenue
FROM public.subscriptions
GROUP BY tenant_id, DATE_TRUNC('month', created_at);

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_mv_billing_analytics_tenant ON public.mv_billing_analytics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mv_billing_analytics_month ON public.mv_billing_analytics(month);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_id ON public.subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON public.subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing_date ON public.subscriptions(next_billing_date);

-- Invoices
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_id ON public.invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_subscription_id ON public.invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON public.invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date);

-- Payments
CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON public.payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON public.payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_gateway_transaction_id ON public.payments(gateway_transaction_id);

-- Usage records
CREATE INDEX IF NOT EXISTS idx_usage_records_tenant_id ON public.usage_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_subscription_id ON public.usage_records(subscription_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_period ON public.usage_records(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_usage_records_is_billed ON public.usage_records(is_billed);

-- Commissions
CREATE INDEX IF NOT EXISTS idx_commissions_partner_id ON public.commissions(partner_id);
CREATE INDEX IF NOT EXISTS idx_commissions_tenant_id ON public.commissions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON public.commissions(status);

-- Coupons
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON public.coupons(is_active);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update subscription history on status change
CREATE OR REPLACE FUNCTION update_subscription_history()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status OR OLD.plan_id IS DISTINCT FROM NEW.plan_id THEN
    INSERT INTO public.subscription_history (
      subscription_id, old_status, new_status, old_plan_id, new_plan_id
    ) VALUES (
      NEW.subscription_id, OLD.status, NEW.status, OLD.plan_id, NEW.plan_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_subscription_history
AFTER UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_subscription_history();

-- Auto-update invoice balance
CREATE OR REPLACE FUNCTION update_invoice_balance()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.invoices
  SET balance_due = total_amount - COALESCE(paid_amount, 0)
  WHERE invoice_id = NEW.invoice_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_invoice_balance
AFTER UPDATE OF paid_amount ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION update_invoice_balance();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.subscription_plans IS 'Tiered subscription plans with features and pricing';
COMMENT ON TABLE public.subscriptions IS 'Active and historical subscriptions for tenants';
COMMENT ON TABLE public.invoices IS 'Generated invoices for subscriptions and services';
COMMENT ON TABLE public.payments IS 'Payment transactions and gateway integrations';
COMMENT ON TABLE public.coupons IS 'Promotional coupons and discount codes';
COMMENT ON TABLE public.partners IS 'Partners and resellers for commission tracking';
COMMENT ON TABLE public.commissions IS 'Commission transactions for partners';
COMMENT ON TABLE public.billing_feature_toggles IS 'Super admin controls for billing features per tenant';
COMMENT ON TABLE public.usage_records IS 'Usage tracking for metered billing';

-- ============================================================================
-- SEED DATA - Default Subscription Plans
-- ============================================================================

INSERT INTO public.subscription_plans (name, description, plan_type, billing_cycle, price, features, max_products, max_orders_per_month, max_storage_gb, max_admin_users) VALUES
('Free Trial', 'Try all features free for 14 days', 'free', 'monthly', 0.00, 
 '["Basic storefront", "Up to 50 products", "Mobile app", "Email support"]'::jsonb, 
 50, 100, 1, 1),
 
('Basic', 'Perfect for small businesses starting out', 'basic', 'monthly', 999.00,
 '["Unlimited products", "Custom domain", "Basic analytics", "Email & chat support", "Payment gateway integration"]'::jsonb,
 NULL, 500, 5, 2),
 
('Professional', 'For growing businesses', 'professional', 'monthly', 2499.00,
 '["Everything in Basic", "Advanced analytics", "Multi-location support", "API access", "Priority support", "Custom branding"]'::jsonb,
 NULL, 2000, 20, 5),
 
('Enterprise', 'For large-scale operations', 'enterprise', 'monthly', 9999.00,
 '["Everything in Professional", "Dedicated account manager", "White-label solution", "Custom integrations", "SLA guarantee", "Advanced security"]'::jsonb,
 NULL, NULL, 100, 20),
 
('Basic Annual', 'Basic plan - Save 20% with annual billing', 'basic', 'yearly', 9590.00,
 '["Unlimited products", "Custom domain", "Basic analytics", "Email & chat support", "Payment gateway integration"]'::jsonb,
 NULL, 500, 5, 2),
 
('Professional Annual', 'Professional plan - Save 20% with annual billing', 'professional', 'yearly', 23990.00,
 '["Everything in Basic", "Advanced analytics", "Multi-location support", "API access", "Priority support", "Custom branding"]'::jsonb,
 NULL, 2000, 20, 5);
