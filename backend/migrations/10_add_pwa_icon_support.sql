-- ============================================================================
-- Migration 10: Add PWA Icon Support
-- ============================================================================
-- Adds support for per-tenant PWA icons and favicons
-- ============================================================================

-- Add PWA icon URL to store_settings table
ALTER TABLE public.store_settings
ADD COLUMN IF NOT EXISTS pwa_icon_url TEXT,
ADD COLUMN IF NOT EXISTS favicon_url TEXT;

-- Add PWA icon URL to tenant_settings table (if not already exists from migration 06)
ALTER TABLE public.tenant_settings
ADD COLUMN IF NOT EXISTS pwa_icon_url TEXT;

-- Update comments
COMMENT ON COLUMN public.store_settings.pwa_icon_url IS 'URL to custom PWA app icon (512x512 recommended)';
COMMENT ON COLUMN public.store_settings.favicon_url IS 'URL to custom favicon for web browsers';
COMMENT ON COLUMN public.tenant_settings.pwa_icon_url IS 'URL to custom PWA app icon (512x512 recommended)';

-- Add index for faster lookups (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_store_settings_pwa_icon ON public.store_settings(tenant_id) WHERE pwa_icon_url IS NOT NULL;
