-- ============================================================================
-- Migration 03: Admin/Tenant Profile Fields
-- ============================================================================
-- Adds comprehensive profile fields for admin onboarding
-- Adds payment and delivery configuration options
-- ============================================================================

-- Add missing fields to tenants table
ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS shop_name TEXT,
ADD COLUMN IF NOT EXISTS street_address TEXT,
ADD COLUMN IF NOT EXISTS pincode TEXT,
ADD COLUMN IF NOT EXISTS drug_license_number TEXT,
ADD COLUMN IF NOT EXISTS gst_number TEXT,
ADD COLUMN IF NOT EXISTS is_live BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pwa_url TEXT,
ADD COLUMN IF NOT EXISTS qr_image_url TEXT;

-- Add payment and delivery fields to store_settings table
ALTER TABLE public.store_settings
ADD COLUMN IF NOT EXISTS razorpay_id TEXT,
ADD COLUMN IF NOT EXISTS razorpay_key TEXT,
ADD COLUMN IF NOT EXISTS razorpay_secret TEXT,
ADD COLUMN IF NOT EXISTS cash_on_delivery_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS credit_on_delivery_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS credit_terms TEXT,
ADD COLUMN IF NOT EXISTS self_pickup_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS delivery_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS min_order_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS delivery_charge DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS free_delivery_above DECIMAL(10,2);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_tenants_is_live ON public.tenants(is_live);
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON public.tenants(subdomain) WHERE subdomain IS NOT NULL;

-- Comments
COMMENT ON COLUMN public.tenants.shop_name IS 'Display name of the shop (different from tenant name)';
COMMENT ON COLUMN public.tenants.drug_license_number IS 'Drug license number for pharmacy compliance';
COMMENT ON COLUMN public.tenants.gst_number IS 'GST registration number for tax compliance';
COMMENT ON COLUMN public.tenants.is_live IS 'Flag indicating if tenant store is publicly accessible';
COMMENT ON COLUMN public.tenants.pwa_url IS 'Public URL for customer PWA access';
COMMENT ON COLUMN public.tenants.qr_image_url IS 'QR code image URL for store access';

COMMENT ON COLUMN public.store_settings.credit_on_delivery_enabled IS 'Allow customers to request credit payment';
COMMENT ON COLUMN public.store_settings.credit_limit IS 'Maximum credit amount allowed per customer';
COMMENT ON COLUMN public.store_settings.credit_terms IS 'Terms and conditions for credit payment';
