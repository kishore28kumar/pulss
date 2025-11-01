-- ============================================================================
-- Migration 07: Predefined Themes
-- ============================================================================
-- Seeds database with pre-designed themes for quick setup
-- ============================================================================

-- Insert predefined themes
INSERT INTO public.themes (name, type, description, is_active, css_variables) VALUES
('Medical Blue', 'predefined', 'Professional medical blue theme with clean aesthetics', true, '{
  "primary": "oklch(0.47 0.13 264)",
  "secondary": "oklch(0.97 0.01 264)",
  "accent": "oklch(0.55 0.15 27)",
  "background": "oklch(1 0 0)",
  "foreground": "oklch(0.15 0 0)"
}'::jsonb),

('Green Pharmacy', 'predefined', 'Fresh green theme perfect for pharmacies and wellness stores', true, '{
  "primary": "oklch(0.5 0.15 145)",
  "secondary": "oklch(0.95 0.05 145)",
  "accent": "oklch(0.7 0.15 160)",
  "background": "oklch(0.99 0.01 145)",
  "foreground": "oklch(0.15 0 0)"
}'::jsonb),

('Orange Grocery', 'predefined', 'Vibrant orange theme for grocery and food stores', true, '{
  "primary": "oklch(0.65 0.15 45)",
  "secondary": "oklch(0.96 0.03 45)",
  "accent": "oklch(0.7 0.15 30)",
  "background": "oklch(1 0 0)",
  "foreground": "oklch(0.15 0 0)"
}'::jsonb),

('Purple Modern', 'predefined', 'Contemporary purple theme for modern retail', true, '{
  "primary": "oklch(0.55 0.15 290)",
  "secondary": "oklch(0.97 0.02 290)",
  "accent": "oklch(0.6 0.15 270)",
  "background": "oklch(1 0 0)",
  "foreground": "oklch(0.15 0 0)"
}'::jsonb),

('Teal Wellness', 'predefined', 'Calming teal theme for wellness and health stores', true, '{
  "primary": "oklch(0.5 0.15 185)",
  "secondary": "oklch(0.96 0.03 185)",
  "accent": "oklch(0.6 0.15 165)",
  "background": "oklch(0.99 0.01 185)",
  "foreground": "oklch(0.15 0 0)"
}'::jsonb),

('Indigo Tech', 'predefined', 'Modern indigo theme for tech-savvy stores', true, '{
  "primary": "oklch(0.5 0.15 250)",
  "secondary": "oklch(0.97 0.02 250)",
  "accent": "oklch(0.6 0.15 230)",
  "background": "oklch(1 0 0)",
  "foreground": "oklch(0.15 0 0)"
}'::jsonb)

ON CONFLICT (name) DO NOTHING;

-- Set default theme for app_settings
DO $$
DECLARE
  default_theme_id UUID;
BEGIN
  SELECT theme_id INTO default_theme_id FROM public.themes WHERE name = 'Medical Blue' LIMIT 1;
  
  IF default_theme_id IS NOT NULL THEN
    UPDATE public.app_settings SET default_theme_id = default_theme_id WHERE setting_id IS NOT NULL;
    
    -- If no app_settings exist, create one
    INSERT INTO public.app_settings (default_theme_id, app_name, main_logo_url)
    SELECT default_theme_id, 'Pulss', NULL
    WHERE NOT EXISTS (SELECT 1 FROM public.app_settings);
  END IF;
END $$;

-- Comments
COMMENT ON TABLE public.themes IS 'Theme definitions including predefined and custom themes';
