-- ============================================================================
-- Migration 06: Enhanced Feature Toggles
-- ============================================================================
-- Adds comprehensive feature flags for tenant customization
-- ============================================================================

-- Add missing feature flags to feature_flags table
ALTER TABLE public.feature_flags
ADD COLUMN IF NOT EXISTS carousel_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS product_carousel_editable BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS cod_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS credit_on_delivery_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS self_pickup_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS bulk_image_upload_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS customer_signup_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS dark_mode_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS ai_search_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS reviews_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS chat_support_enabled BOOLEAN DEFAULT false;

-- Tenant settings table (consolidate all tenant preferences)
CREATE TABLE IF NOT EXISTS public.tenant_settings (
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE PRIMARY KEY,
  
  -- Theme settings
  theme_id UUID REFERENCES public.themes(theme_id) ON DELETE SET NULL,
  primary_color TEXT,
  secondary_color TEXT,
  logo_url TEXT,
  favicon_url TEXT,
  
  -- Branding
  business_tagline TEXT,
  welcome_message TEXT,
  footer_text TEXT,
  
  -- Display preferences
  products_per_page INTEGER DEFAULT 20,
  show_out_of_stock BOOLEAN DEFAULT true,
  show_prices_with_tax BOOLEAN DEFAULT true,
  currency_symbol TEXT DEFAULT '₹',
  
  -- Notifications
  email_notifications_enabled BOOLEAN DEFAULT true,
  sms_notifications_enabled BOOLEAN DEFAULT false,
  whatsapp_notifications_enabled BOOLEAN DEFAULT false,
  
  -- SEO
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT[],
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Insert default settings for existing tenants
INSERT INTO public.tenant_settings (tenant_id)
SELECT tenant_id FROM public.tenants
ON CONFLICT (tenant_id) DO NOTHING;

-- Comments
COMMENT ON COLUMN public.feature_flags.carousel_enabled IS 'Enable hero carousel on storefront';
COMMENT ON COLUMN public.feature_flags.product_carousel_editable IS 'Allow admin to edit product carousels';
COMMENT ON COLUMN public.feature_flags.bulk_image_upload_enabled IS 'Allow bulk product image uploads via ZIP';
COMMENT ON COLUMN public.feature_flags.customer_signup_enabled IS 'Allow new customer registrations';
COMMENT ON COLUMN public.feature_flags.dark_mode_enabled IS 'Allow customers to toggle dark mode';
COMMENT ON TABLE public.tenant_settings IS 'Comprehensive tenant-level settings and preferences';
