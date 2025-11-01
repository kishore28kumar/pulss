-- ============================================================================
-- Product Offers and Badges Enhancement
-- ============================================================================
-- Adds support for offer badges, bundle offers, and enhanced product metadata

-- Add offer-related columns to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS offer_badge_text TEXT,
ADD COLUMN IF NOT EXISTS offer_badge_visible BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS discount_percentage INTEGER,
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS offer_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS offer_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_bundle BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS bundle_products JSONB; -- Array of {product_id, quantity, discount}

-- Create product bundles table for more complex bundle management
CREATE TABLE IF NOT EXISTS public.product_bundles (
  bundle_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  main_product_id UUID REFERENCES public.products(product_id) ON DELETE CASCADE NOT NULL,
  bundle_products JSONB NOT NULL, -- Array of {product_id, quantity, discount}
  total_price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2) NOT NULL,
  savings DECIMAL(10,2) NOT NULL,
  active BOOLEAN DEFAULT true,
  badge_text TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_offer_active 
  ON public.products(tenant_id, offer_badge_visible) 
  WHERE offer_badge_visible = true;

CREATE INDEX IF NOT EXISTS idx_products_bundles 
  ON public.products(tenant_id, is_bundle) 
  WHERE is_bundle = true;

CREATE INDEX IF NOT EXISTS idx_product_bundles_tenant 
  ON public.product_bundles(tenant_id, active);

-- Add comment for documentation
COMMENT ON COLUMN public.products.offer_badge_text IS 'Custom text to display on offer badge (e.g., "9% off", "Buy 1 Get 1")';
COMMENT ON COLUMN public.products.offer_badge_visible IS 'Controls whether the offer badge is shown to customers';
COMMENT ON COLUMN public.products.bundle_products IS 'JSON array of products in bundle: [{product_id, quantity, discount}]';
COMMENT ON TABLE public.product_bundles IS 'Manages complex product bundles with multiple items';
