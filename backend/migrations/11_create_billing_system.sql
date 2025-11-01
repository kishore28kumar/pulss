-- ============================================================================
-- Billing & Subscription Management System with Indian Compliance
-- ============================================================================
-- This migration adds comprehensive billing features including:
-- - Subscription plans and management
-- - Usage-based billing with metering
-- - Coupon codes and discounts
-- - Trial management and proration
-- - GST invoicing and e-invoicing support
-- - Audit logging for compliance
-- - Tenant-specific billing with super admin controls
-- ============================================================================

-- Enable required extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- SUBSCRIPTION PLANS
-- ============================================================================

-- Subscription plans offered by the platform
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  plan_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  billing_period TEXT NOT NULL CHECK (billing_period IN ('monthly', 'quarterly', 'yearly', 'custom')),
  base_price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  features JSONB, -- Features included in the plan
  limits JSONB, -- Usage limits (orders/month, products, etc.)
  is_active BOOLEAN DEFAULT true,
  trial_days INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true, -- Public plans visible to all tenants
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================================================
-- TENANT SUBSCRIPTIONS
-- ============================================================================

-- Tenant subscription status and billing
CREATE TABLE IF NOT EXISTS public.tenant_subscriptions (
  subscription_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.subscription_plans(plan_id) ON DELETE RESTRICT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('trial', 'active', 'past_due', 'cancelled', 'suspended')),
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  billing_email TEXT NOT NULL,
  payment_gateway TEXT, -- 'razorpay', 'cashfree', 'paytm', etc.
  gateway_subscription_id TEXT, -- ID from payment gateway
  gateway_customer_id TEXT, -- Customer ID in payment gateway
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(tenant_id) -- One active subscription per tenant
);

-- ============================================================================
-- ADVANCED FEATURE PERMISSIONS
-- ============================================================================

-- Controls which advanced features are enabled for each tenant by super admin
CREATE TABLE IF NOT EXISTS public.tenant_feature_permissions (
  permission_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  feature_key TEXT NOT NULL, -- 'usage_billing', 'coupons', 'trials', 'compliance', 'notifications'
  enabled BOOLEAN DEFAULT false,
  enabled_by UUID REFERENCES public.admins(admin_id) ON DELETE SET NULL, -- Super admin who enabled
  enabled_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB, -- Additional configuration for the feature
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(tenant_id, feature_key)
);

-- ============================================================================
-- USAGE-BASED BILLING
-- ============================================================================

-- Usage meters for tracking billable usage
CREATE TABLE IF NOT EXISTS public.usage_meters (
  meter_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  meter_type TEXT NOT NULL, -- 'orders', 'products', 'customers', 'api_calls', 'storage_gb'
  aggregation_type TEXT NOT NULL DEFAULT 'sum' CHECK (aggregation_type IN ('sum', 'max', 'last')),
  unit_price DECIMAL(10,4), -- Price per unit if usage-based billing enabled
  included_units INTEGER DEFAULT 0, -- Units included in base plan
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(tenant_id, meter_type)
);

-- Usage events for metering
CREATE TABLE IF NOT EXISTS public.usage_events (
  event_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  meter_id UUID REFERENCES public.usage_meters(meter_id) ON DELETE CASCADE NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  event_time TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  metadata JSONB, -- Additional context
  processed BOOLEAN DEFAULT false, -- Whether included in billing
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================================================
-- INVOICES WITH GST COMPLIANCE
-- ============================================================================

-- Invoices for subscription and usage billing
CREATE TABLE IF NOT EXISTS public.invoices (
  invoice_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  subscription_id UUID REFERENCES public.tenant_subscriptions(subscription_id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL UNIQUE, -- Sequential invoice number
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'paid', 'overdue', 'cancelled', 'void')),
  
  -- Amounts
  subtotal DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  cgst_amount DECIMAL(10,2) DEFAULT 0, -- Central GST
  sgst_amount DECIMAL(10,2) DEFAULT 0, -- State GST
  igst_amount DECIMAL(10,2) DEFAULT 0, -- Integrated GST (for inter-state)
  total_amount DECIMAL(10,2) NOT NULL,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'INR',
  
  -- GST Details
  gstin TEXT, -- Tenant's GSTIN
  place_of_supply TEXT, -- State for GST calculation
  gst_rate DECIMAL(5,2), -- GST percentage
  reverse_charge BOOLEAN DEFAULT false,
  
  -- E-invoicing
  irn TEXT, -- Invoice Reference Number for e-invoicing
  irn_date TIMESTAMP WITH TIME ZONE,
  qr_code TEXT, -- QR code for e-invoice
  ack_no TEXT, -- Acknowledgement number from GSTN
  ack_date TIMESTAMP WITH TIME ZONE,
  e_invoice_status TEXT CHECK (e_invoice_status IN ('pending', 'generated', 'cancelled')),
  
  -- Payment
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'refunded')),
  payment_method TEXT,
  payment_gateway TEXT,
  gateway_transaction_id TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  
  -- Billing Details
  billing_name TEXT NOT NULL,
  billing_address TEXT NOT NULL,
  billing_email TEXT NOT NULL,
  billing_phone TEXT,
  billing_gstin TEXT,
  
  -- Additional
  notes TEXT,
  metadata JSONB,
  pdf_url TEXT, -- URL to PDF invoice
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Invoice line items
CREATE TABLE IF NOT EXISTS public.invoice_items (
  item_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  invoice_id UUID REFERENCES public.invoices(invoice_id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  item_type TEXT NOT NULL, -- 'subscription', 'usage', 'addon', 'adjustment'
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================================================
-- COUPON CODES & DISCOUNTS
-- ============================================================================

-- Coupon codes for discounts
CREATE TABLE IF NOT EXISTS public.coupons (
  coupon_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  
  -- Validity
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
  valid_until TIMESTAMP WITH TIME ZONE,
  max_redemptions INTEGER, -- Null = unlimited
  redemptions_count INTEGER DEFAULT 0,
  
  -- Restrictions
  min_purchase_amount DECIMAL(10,2),
  max_discount_amount DECIMAL(10,2), -- Cap for percentage discounts
  applies_to TEXT[] DEFAULT ARRAY['subscription'], -- 'subscription', 'usage', 'all'
  plan_ids UUID[], -- Specific plans this applies to (null = all plans)
  first_time_only BOOLEAN DEFAULT false,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.admins(admin_id) ON DELETE SET NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Coupon redemptions
CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  redemption_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  coupon_id UUID REFERENCES public.coupons(coupon_id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  invoice_id UUID REFERENCES public.invoices(invoice_id) ON DELETE SET NULL,
  discount_amount DECIMAL(10,2) NOT NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  metadata JSONB
);

-- ============================================================================
-- PAYMENTS & REFUNDS
-- ============================================================================

-- Payment transactions
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  transaction_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  invoice_id UUID REFERENCES public.invoices(invoice_id) ON DELETE SET NULL,
  
  -- Payment details
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  payment_method TEXT NOT NULL, -- 'card', 'netbanking', 'upi', 'wallet'
  payment_gateway TEXT NOT NULL, -- 'razorpay', 'cashfree', 'paytm'
  
  -- Gateway details
  gateway_transaction_id TEXT,
  gateway_order_id TEXT,
  gateway_payment_id TEXT,
  gateway_signature TEXT,
  gateway_status TEXT,
  gateway_response JSONB,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'failed', 'cancelled')),
  failure_reason TEXT,
  
  -- Timestamps
  initiated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Refund transactions
CREATE TABLE IF NOT EXISTS public.refunds (
  refund_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  transaction_id UUID REFERENCES public.payment_transactions(transaction_id) ON DELETE CASCADE NOT NULL,
  invoice_id UUID REFERENCES public.invoices(invoice_id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  
  -- Refund details
  amount DECIMAL(10,2) NOT NULL,
  reason TEXT,
  refund_type TEXT NOT NULL CHECK (refund_type IN ('full', 'partial')),
  
  -- Gateway details
  gateway_refund_id TEXT,
  gateway_status TEXT,
  gateway_response JSONB,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'failed')),
  
  -- Approval
  requested_by UUID REFERENCES public.admins(admin_id) ON DELETE SET NULL,
  approved_by UUID REFERENCES public.admins(admin_id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE,
  
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================================================
-- BILLING NOTIFICATIONS
-- ============================================================================

-- Email notifications for billing events
CREATE TABLE IF NOT EXISTS public.billing_notifications (
  notification_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  invoice_id UUID REFERENCES public.invoices(invoice_id) ON DELETE SET NULL,
  
  notification_type TEXT NOT NULL, -- 'invoice_created', 'payment_success', 'payment_failed', 'renewal_reminder', 'trial_ending', 'subscription_cancelled'
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT,
  
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMP WITH TIME ZONE,
  failure_reason TEXT,
  
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================================================
-- BILLING AUDIT LOG
-- ============================================================================

-- Audit log for billing operations (compliance requirement)
CREATE TABLE IF NOT EXISTS public.billing_audit_log (
  log_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
  admin_id UUID REFERENCES public.admins(admin_id) ON DELETE SET NULL,
  
  action TEXT NOT NULL, -- 'subscription_created', 'invoice_generated', 'payment_received', 'refund_issued', 'feature_enabled', 'feature_disabled'
  entity_type TEXT NOT NULL, -- 'subscription', 'invoice', 'payment', 'refund', 'coupon', 'feature'
  entity_id UUID,
  
  old_values JSONB,
  new_values JSONB,
  
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================================================
-- COMPLIANCE & RECEIPTS
-- ============================================================================

-- GST receipts for payments
CREATE TABLE IF NOT EXISTS public.gst_receipts (
  receipt_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  invoice_id UUID REFERENCES public.invoices(invoice_id) ON DELETE CASCADE NOT NULL,
  transaction_id UUID REFERENCES public.payment_transactions(transaction_id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  
  receipt_number TEXT NOT NULL UNIQUE,
  receipt_date DATE NOT NULL,
  
  -- GST details
  hsn_sac_code TEXT, -- HSN/SAC code for the service
  taxable_value DECIMAL(10,2) NOT NULL,
  cgst_rate DECIMAL(5,2),
  cgst_amount DECIMAL(10,2),
  sgst_rate DECIMAL(5,2),
  sgst_amount DECIMAL(10,2),
  igst_rate DECIMAL(5,2),
  igst_amount DECIMAL(10,2),
  total_tax DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  
  -- Compliance
  pdf_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Subscription plans
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON public.subscription_plans(is_active) WHERE is_active = true;

-- Tenant subscriptions
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant ON public.tenant_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_status ON public.tenant_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_period_end ON public.tenant_subscriptions(current_period_end);

-- Feature permissions
CREATE INDEX IF NOT EXISTS idx_feature_permissions_tenant ON public.tenant_feature_permissions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_feature_permissions_feature ON public.tenant_feature_permissions(feature_key);

-- Usage events
CREATE INDEX IF NOT EXISTS idx_usage_events_tenant ON public.usage_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_meter ON public.usage_events(meter_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_time ON public.usage_events(event_time);
CREATE INDEX IF NOT EXISTS idx_usage_events_processed ON public.usage_events(processed) WHERE processed = false;

-- Invoices
CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON public.invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_subscription ON public.invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON public.invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON public.invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date);

-- Coupons
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_coupons_active ON public.coupons(is_active);

-- Payments
CREATE INDEX IF NOT EXISTS idx_payment_transactions_tenant ON public.payment_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_invoice ON public.payment_transactions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_gateway_id ON public.payment_transactions(gateway_transaction_id);

-- Refunds
CREATE INDEX IF NOT EXISTS idx_refunds_transaction ON public.refunds(transaction_id);
CREATE INDEX IF NOT EXISTS idx_refunds_tenant ON public.refunds(tenant_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON public.refunds(status);

-- Billing notifications
CREATE INDEX IF NOT EXISTS idx_billing_notifications_tenant ON public.billing_notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_billing_notifications_status ON public.billing_notifications(status);

-- Audit log
CREATE INDEX IF NOT EXISTS idx_billing_audit_log_tenant ON public.billing_audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_billing_audit_log_action ON public.billing_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_billing_audit_log_entity ON public.billing_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_billing_audit_log_created ON public.billing_audit_log(created_at);

-- ============================================================================
-- INSERT PREDEFINED SUBSCRIPTION PLANS
-- ============================================================================

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, description, billing_period, base_price, features, limits, trial_days, is_public)
VALUES 
  (
    'Starter',
    'Perfect for small pharmacies starting their digital journey',
    'monthly',
    999.00,
    '{"products": 500, "orders_per_month": 1000, "customers": "unlimited", "features": ["basic_analytics", "whatsapp_support", "qr_code"]}'::jsonb,
    '{"products": 500, "orders_per_month": 1000}'::jsonb,
    14,
    true
  ),
  (
    'Professional',
    'Ideal for growing pharmacies with advanced needs',
    'monthly',
    2499.00,
    '{"products": 2000, "orders_per_month": 5000, "customers": "unlimited", "features": ["advanced_analytics", "whatsapp_support", "qr_code", "loyalty_program", "prescription_management"]}'::jsonb,
    '{"products": 2000, "orders_per_month": 5000}'::jsonb,
    14,
    true
  ),
  (
    'Enterprise',
    'Complete solution for large pharmacy chains',
    'monthly',
    4999.00,
    '{"products": "unlimited", "orders_per_month": "unlimited", "customers": "unlimited", "features": ["all_features", "priority_support", "custom_integrations", "white_label"]}'::jsonb,
    '{"products": -1, "orders_per_month": -1}'::jsonb,
    30,
    true
  ),
  (
    'Starter Annual',
    'Perfect for small pharmacies - Annual billing (2 months free)',
    'yearly',
    9990.00,
    '{"products": 500, "orders_per_month": 1000, "customers": "unlimited", "features": ["basic_analytics", "whatsapp_support", "qr_code"]}'::jsonb,
    '{"products": 500, "orders_per_month": 1000}'::jsonb,
    14,
    true
  ),
  (
    'Professional Annual',
    'Ideal for growing pharmacies - Annual billing (2 months free)',
    'yearly',
    24990.00,
    '{"products": 2000, "orders_per_month": 5000, "customers": "unlimited", "features": ["advanced_analytics", "whatsapp_support", "qr_code", "loyalty_program", "prescription_management"]}'::jsonb,
    '{"products": 2000, "orders_per_month": 5000}'::jsonb,
    14,
    true
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.subscription_plans IS 'Subscription plans offered by the platform';
COMMENT ON TABLE public.tenant_subscriptions IS 'Active subscriptions for each tenant';
COMMENT ON TABLE public.tenant_feature_permissions IS 'Controls which advanced features are enabled for tenants by super admin';
COMMENT ON TABLE public.usage_meters IS 'Defines usage metrics for usage-based billing';
COMMENT ON TABLE public.usage_events IS 'Tracks billable usage events';
COMMENT ON TABLE public.invoices IS 'GST-compliant invoices with e-invoicing support';
COMMENT ON TABLE public.invoice_items IS 'Line items within invoices';
COMMENT ON TABLE public.coupons IS 'Discount coupon codes';
COMMENT ON TABLE public.coupon_redemptions IS 'History of coupon usage';
COMMENT ON TABLE public.payment_transactions IS 'Payment transactions via gateways';
COMMENT ON TABLE public.refunds IS 'Refund transactions';
COMMENT ON TABLE public.billing_notifications IS 'Email notifications for billing events';
COMMENT ON TABLE public.billing_audit_log IS 'Audit trail for billing operations (compliance)';
COMMENT ON TABLE public.gst_receipts IS 'GST receipts for completed payments';
