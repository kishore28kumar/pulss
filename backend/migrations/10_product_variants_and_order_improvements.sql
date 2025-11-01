-- ============================================================================
-- Product Variants and Order Improvements Migration
-- ============================================================================
-- This migration adds:
-- 1. Product variants support (Strength, Pack Size, Brand variants)
-- 2. Order acceptance tracking and auto-accept functionality
-- 3. Enhanced onboarding field validations
-- ============================================================================

-- ============================================================================
-- PRODUCT VARIANTS
-- ============================================================================

-- Product Variants table
-- Stores different variants of a base product (e.g., different strengths, pack sizes)
CREATE TABLE IF NOT EXISTS public.product_variants (
  variant_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES public.products(product_id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  
  -- Variant attributes
  variant_name TEXT NOT NULL, -- e.g., "500mg", "1kg", "Blue"
  variant_type TEXT NOT NULL, -- e.g., "strength", "pack_size", "color", "size"
  
  -- Pricing and inventory specific to this variant
  price DECIMAL(10,2),
  mrp DECIMAL(10,2),
  inventory_count INTEGER DEFAULT 0,
  sku TEXT,
  
  -- Variant-specific details
  attributes JSONB, -- Store additional variant attributes
  is_default BOOLEAN DEFAULT false, -- Is this the default variant
  active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0, -- Order to display variants
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  -- Ensure unique variant per product/tenant combination
  UNIQUE(product_id, variant_type, variant_name)
);

-- Indexes for product variants
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_tenant_id ON public.product_variants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_type ON public.product_variants(variant_type);
CREATE INDEX IF NOT EXISTS idx_product_variants_active ON public.product_variants(active);

-- Comments for product variants
COMMENT ON TABLE public.product_variants IS 'Product variants for different attributes like strength, size, color';
COMMENT ON COLUMN public.product_variants.variant_type IS 'Type of variant: strength, pack_size, color, size, brand, etc.';
COMMENT ON COLUMN public.product_variants.is_default IS 'Whether this is the default variant to show';

-- Add parent_product_id to products table to support product grouping
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS parent_product_id UUID REFERENCES public.products(product_id) ON DELETE SET NULL;

-- Index for parent product lookup
CREATE INDEX IF NOT EXISTS idx_products_parent_id ON public.products(parent_product_id);

-- Add unique constraint for product identification (to support upserts in CSV)
-- This allows updating existing products when reimporting CSV
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_unique_identifier 
ON public.products(tenant_id, name, COALESCE(brand, ''), COALESCE(pack_size, ''));

COMMENT ON COLUMN public.products.parent_product_id IS 'Link to parent product for variant grouping';

-- ============================================================================
-- ORDER ACCEPTANCE & AUTO-ACCEPT
-- ============================================================================

-- Add order acceptance fields
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS acceptance_status TEXT DEFAULT 'pending_acceptance',
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS accepted_by UUID REFERENCES public.admins(admin_id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS auto_accept_timer INTEGER DEFAULT 300, -- 5 minutes default
ADD COLUMN IF NOT EXISTS auto_accepted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS acceptance_deadline TIMESTAMP WITH TIME ZONE;

-- Index for acceptance queries
CREATE INDEX IF NOT EXISTS idx_orders_acceptance_status ON public.orders(acceptance_status);
CREATE INDEX IF NOT EXISTS idx_orders_acceptance_deadline ON public.orders(acceptance_deadline) WHERE acceptance_deadline IS NOT NULL;

-- Comments for order acceptance
COMMENT ON COLUMN public.orders.acceptance_status IS 'Order acceptance status: pending_acceptance, accepted, auto_accepted';
COMMENT ON COLUMN public.orders.auto_accept_timer IS 'Time in seconds before order is auto-accepted';
COMMENT ON COLUMN public.orders.acceptance_deadline IS 'Deadline for manual acceptance before auto-accept';

-- ============================================================================
-- ONBOARDING VALIDATION FIELDS
-- ============================================================================

-- Add validation tracking to store_settings
ALTER TABLE public.store_settings
ADD COLUMN IF NOT EXISTS whatsapp_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS upi_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS razorpay_key_id TEXT,
ADD COLUMN IF NOT EXISTS razorpay_key_secret TEXT,
ADD COLUMN IF NOT EXISTS razorpay_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0;

-- Comments for onboarding fields
COMMENT ON COLUMN public.store_settings.whatsapp_verified IS 'Whether WhatsApp number is verified';
COMMENT ON COLUMN public.store_settings.upi_verified IS 'Whether UPI ID is verified';
COMMENT ON COLUMN public.store_settings.razorpay_verified IS 'Whether Razorpay credentials are verified';
COMMENT ON COLUMN public.store_settings.onboarding_step IS 'Current onboarding step (0-based index)';

-- ============================================================================
-- ANALYTICS TRACKING
-- ============================================================================

-- Analytics events table for tracking various metrics
CREATE TABLE IF NOT EXISTS public.analytics_events (
  event_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL, -- 'order_accepted', 'variant_selected', 'whatsapp_click', 'payment_method'
  event_data JSONB, -- Flexible data storage for event details
  customer_id UUID REFERENCES public.customers(customer_id) ON DELETE SET NULL,
  admin_id UUID REFERENCES public.admins(admin_id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(order_id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.products(product_id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for analytics
CREATE INDEX IF NOT EXISTS idx_analytics_events_tenant_id ON public.analytics_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_order_id ON public.analytics_events(order_id) WHERE order_id IS NOT NULL;

COMMENT ON TABLE public.analytics_events IS 'Track various analytics events for dashboard metrics';

-- ============================================================================
-- ORDER ITEMS UPDATE FOR VARIANTS
-- ============================================================================

-- Add variant tracking to order items
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.product_variants(variant_id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS variant_details JSONB; -- Store snapshot of variant at order time

-- Index for variant order lookups
CREATE INDEX IF NOT EXISTS idx_order_items_variant_id ON public.order_items(variant_id) WHERE variant_id IS NOT NULL;

COMMENT ON COLUMN public.order_items.variant_id IS 'Product variant selected for this order item';
COMMENT ON COLUMN public.order_items.variant_details IS 'Snapshot of variant details at time of order';

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to auto-accept orders past deadline
CREATE OR REPLACE FUNCTION auto_accept_expired_orders()
RETURNS void AS $$
BEGIN
  UPDATE public.orders
  SET 
    acceptance_status = 'auto_accepted',
    auto_accepted = true,
    status = CASE WHEN status = 'pending' THEN 'confirmed' ELSE status END,
    updated_at = NOW()
  WHERE 
    acceptance_status = 'pending_acceptance'
    AND acceptance_deadline IS NOT NULL
    AND acceptance_deadline < NOW()
    AND status = 'pending';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION auto_accept_expired_orders IS 'Auto-accepts orders past their acceptance deadline';

-- Function to update product variant inventory
CREATE OR REPLACE FUNCTION update_variant_inventory()
RETURNS TRIGGER AS $$
BEGIN
  -- When order item is created, decrease variant inventory if variant_id exists
  IF TG_OP = 'INSERT' AND NEW.variant_id IS NOT NULL THEN
    UPDATE public.product_variants
    SET inventory_count = inventory_count - NEW.quantity
    WHERE variant_id = NEW.variant_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for variant inventory updates
DROP TRIGGER IF EXISTS trigger_update_variant_inventory ON public.order_items;
CREATE TRIGGER trigger_update_variant_inventory
  AFTER INSERT ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_variant_inventory();

-- ============================================================================
-- DATA MIGRATION
-- ============================================================================

-- Create default variants for existing products (optional - can be done via app)
-- This is commented out to avoid automatic migration, admin can create variants via UI

-- ============================================================================
-- PERMISSIONS & SECURITY
-- ============================================================================

-- Grant appropriate permissions (adjust based on your user roles)
-- These are examples - adjust based on your actual role structure

-- Allow admins to manage variants for their tenant
-- GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_variants TO authenticated;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON public.analytics_events TO authenticated;

COMMENT ON TABLE public.product_variants IS 'Product variants with different attributes (strength, pack size, etc.)';
COMMENT ON TABLE public.analytics_events IS 'Analytics events for tracking user interactions and metrics';
