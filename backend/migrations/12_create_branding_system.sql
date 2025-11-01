-- ============================================================================
-- Migration 12: Advanced Branding & White-Label Control System
-- ============================================================================
-- Creates comprehensive branding system with super admin toggles
-- ============================================================================

-- Branding Configuration Table (Main branding data per tenant/partner)
CREATE TABLE IF NOT EXISTS public.branding_configs (
  branding_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  partner_id UUID, -- Optional: for partner-level branding
  
  -- Logos and Icons
  logo_url TEXT,
  logo_dark_url TEXT, -- Dark mode logo
  favicon_url TEXT,
  favicon_16_url TEXT,
  favicon_32_url TEXT,
  apple_touch_icon_url TEXT,
  
  -- Brand Identity
  brand_name TEXT,
  brand_tagline TEXT,
  brand_description TEXT,
  
  -- Color Palette
  colors JSONB DEFAULT '{
    "primary": "#4F46E5",
    "secondary": "#10B981",
    "accent": "#F59E0B",
    "background": "#FFFFFF",
    "foreground": "#1F2937",
    "muted": "#F3F4F6",
    "border": "#E5E7EB"
  }'::jsonb,
  
  -- Typography
  fonts JSONB DEFAULT '{
    "heading": "Inter",
    "body": "Inter",
    "mono": "JetBrains Mono"
  }'::jsonb,
  
  -- Custom Domains
  custom_domains TEXT[], -- Array of custom domains
  primary_domain TEXT,
  
  -- Email Branding
  email_header_url TEXT,
  email_footer_text TEXT,
  email_from_name TEXT,
  email_reply_to TEXT,
  email_templates JSONB DEFAULT '{}'::jsonb,
  
  -- SMS Branding
  sms_sender_name TEXT,
  sms_templates JSONB DEFAULT '{}'::jsonb,
  
  -- Notification Branding
  notification_icon_url TEXT,
  notification_templates JSONB DEFAULT '{}'::jsonb,
  
  -- API Documentation Branding
  api_docs_logo_url TEXT,
  api_docs_title TEXT,
  api_docs_description TEXT,
  api_docs_theme JSONB DEFAULT '{}'::jsonb,
  
  -- Additional Assets
  assets JSONB DEFAULT '{
    "hero_images": [],
    "carousel_images": [],
    "social_preview": null,
    "og_image": null
  }'::jsonb,
  
  -- Custom CSS/Styles
  custom_css TEXT,
  custom_head_html TEXT, -- Custom HTML for <head>
  custom_body_html TEXT, -- Custom HTML for <body>
  
  -- Region-specific settings
  region TEXT DEFAULT 'global', -- 'india', 'global', 'us', 'eu', etc.
  region_config JSONB DEFAULT '{}'::jsonb,
  
  -- Compliance
  compliance_templates JSONB DEFAULT '{}'::jsonb,
  privacy_policy_url TEXT,
  terms_url TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_by UUID REFERENCES public.admins(admin_id),
  updated_by UUID REFERENCES public.admins(admin_id)
);

-- Super Admin Feature Toggles for Branding
CREATE TABLE IF NOT EXISTS public.branding_feature_toggles (
  toggle_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Core Branding Features
  custom_logo_enabled BOOLEAN DEFAULT false,
  custom_colors_enabled BOOLEAN DEFAULT false,
  custom_fonts_enabled BOOLEAN DEFAULT false,
  custom_css_enabled BOOLEAN DEFAULT false,
  
  -- Domain Features
  custom_domain_enabled BOOLEAN DEFAULT false,
  max_custom_domains INTEGER DEFAULT 1,
  
  -- Email/SMS Features
  branded_email_enabled BOOLEAN DEFAULT false,
  branded_sms_enabled BOOLEAN DEFAULT false,
  email_template_customization BOOLEAN DEFAULT false,
  sms_template_customization BOOLEAN DEFAULT false,
  
  -- Notification Features
  branded_notifications_enabled BOOLEAN DEFAULT false,
  notification_template_customization BOOLEAN DEFAULT false,
  
  -- API Documentation
  branded_api_docs_enabled BOOLEAN DEFAULT false,
  
  -- Advanced Features
  white_label_mode_enabled BOOLEAN DEFAULT false, -- Removes all Pulss branding
  asset_management_enabled BOOLEAN DEFAULT false,
  compliance_templates_enabled BOOLEAN DEFAULT false,
  
  -- Export/Import
  branding_export_enabled BOOLEAN DEFAULT false,
  branding_import_enabled BOOLEAN DEFAULT false,
  
  -- Region Controls
  region_customization_enabled BOOLEAN DEFAULT false,
  allowed_regions TEXT[] DEFAULT ARRAY['india', 'global'],
  
  -- Limits
  max_logo_size_mb DECIMAL(5,2) DEFAULT 5.00,
  max_asset_storage_mb DECIMAL(10,2) DEFAULT 100.00,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  enabled_by UUID REFERENCES public.admins(admin_id),
  notes TEXT
);

-- Branding Assets Table (For managing uploaded assets)
CREATE TABLE IF NOT EXISTS public.branding_assets (
  asset_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  branding_id UUID REFERENCES public.branding_configs(branding_id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  
  -- Asset Information
  asset_type TEXT NOT NULL, -- 'logo', 'favicon', 'email_header', 'hero_image', etc.
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size_bytes BIGINT,
  mime_type TEXT,
  
  -- Image Metadata
  width INTEGER,
  height INTEGER,
  format TEXT, -- 'png', 'jpg', 'svg', etc.
  
  -- Optimization
  is_optimized BOOLEAN DEFAULT false,
  optimized_url TEXT,
  optimized_size_bytes BIGINT,
  
  -- CDN
  cdn_url TEXT,
  cdn_status TEXT DEFAULT 'pending', -- 'pending', 'uploaded', 'failed'
  
  -- Usage Tracking
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  uploaded_by UUID REFERENCES public.admins(admin_id)
);

-- Branding Templates Table (Reusable branding templates)
CREATE TABLE IF NOT EXISTS public.branding_templates (
  template_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  template_name TEXT NOT NULL,
  template_type TEXT NOT NULL, -- 'email', 'sms', 'notification', 'compliance'
  template_category TEXT, -- 'order_confirmation', 'welcome', 'privacy_policy', etc.
  
  -- Template Content
  subject TEXT, -- For emails
  content TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb, -- Available template variables
  
  -- Styling
  styles JSONB DEFAULT '{}'::jsonb,
  
  -- Multi-language Support
  locale TEXT DEFAULT 'en',
  translations JSONB DEFAULT '{}'::jsonb,
  
  -- Region
  region TEXT DEFAULT 'global',
  
  -- Compliance
  is_compliant BOOLEAN DEFAULT true,
  compliance_notes TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_by UUID REFERENCES public.admins(admin_id)
);

-- Branding Audit Log
CREATE TABLE IF NOT EXISTS public.branding_audit_logs (
  audit_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  branding_id UUID REFERENCES public.branding_configs(branding_id) ON DELETE SET NULL,
  
  -- Action Details
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'export', 'import', 'preview'
  entity_type TEXT NOT NULL, -- 'branding_config', 'asset', 'template', 'toggle'
  entity_id UUID,
  
  -- Changes
  old_values JSONB,
  new_values JSONB,
  changed_fields TEXT[],
  
  -- Context
  user_id UUID REFERENCES public.admins(admin_id),
  user_role TEXT,
  ip_address INET,
  user_agent TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Custom Domain Verification Table
CREATE TABLE IF NOT EXISTS public.custom_domains (
  domain_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  branding_id UUID REFERENCES public.branding_configs(branding_id) ON DELETE CASCADE NOT NULL,
  
  -- Domain Information
  domain TEXT NOT NULL UNIQUE,
  is_primary BOOLEAN DEFAULT false,
  
  -- DNS Verification
  verification_token TEXT NOT NULL,
  verification_status TEXT DEFAULT 'pending', -- 'pending', 'verified', 'failed'
  verification_method TEXT DEFAULT 'dns', -- 'dns', 'http'
  verified_at TIMESTAMP WITH TIME ZONE,
  
  -- SSL/TLS
  ssl_status TEXT DEFAULT 'pending', -- 'pending', 'active', 'failed'
  ssl_issued_at TIMESTAMP WITH TIME ZONE,
  ssl_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- DNS Records (for reference)
  dns_records JSONB DEFAULT '[]'::jsonb,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_by UUID REFERENCES public.admins(admin_id)
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_branding_configs_tenant ON public.branding_configs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_branding_configs_partner ON public.branding_configs(partner_id);
CREATE INDEX IF NOT EXISTS idx_branding_configs_active ON public.branding_configs(is_active);
CREATE INDEX IF NOT EXISTS idx_branding_configs_region ON public.branding_configs(region);

CREATE INDEX IF NOT EXISTS idx_branding_assets_branding ON public.branding_assets(branding_id);
CREATE INDEX IF NOT EXISTS idx_branding_assets_tenant ON public.branding_assets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_branding_assets_type ON public.branding_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_branding_assets_active ON public.branding_assets(is_active);

CREATE INDEX IF NOT EXISTS idx_branding_templates_type ON public.branding_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_branding_templates_category ON public.branding_templates(template_category);
CREATE INDEX IF NOT EXISTS idx_branding_templates_locale ON public.branding_templates(locale);
CREATE INDEX IF NOT EXISTS idx_branding_templates_region ON public.branding_templates(region);

CREATE INDEX IF NOT EXISTS idx_branding_audit_tenant ON public.branding_audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_branding_audit_action ON public.branding_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_branding_audit_created ON public.branding_audit_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_custom_domains_tenant ON public.custom_domains(tenant_id);
CREATE INDEX IF NOT EXISTS idx_custom_domains_domain ON public.custom_domains(domain);
CREATE INDEX IF NOT EXISTS idx_custom_domains_status ON public.custom_domains(verification_status);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_branding_configs_updated_at BEFORE UPDATE ON public.branding_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_branding_feature_toggles_updated_at BEFORE UPDATE ON public.branding_feature_toggles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_branding_assets_updated_at BEFORE UPDATE ON public.branding_assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_branding_templates_updated_at BEFORE UPDATE ON public.branding_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_domains_updated_at BEFORE UPDATE ON public.custom_domains
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default branding templates
INSERT INTO public.branding_templates (template_name, template_type, template_category, subject, content, variables, region) VALUES
-- Email Templates
('Order Confirmation', 'email', 'order_confirmation', 'Order Confirmation - {{order_id}}', 
'<h1>Thank you for your order!</h1><p>Your order {{order_id}} has been confirmed.</p><p>Total: {{total_amount}}</p>', 
'["order_id", "customer_name", "total_amount", "order_date"]'::jsonb, 'global'),

('Welcome Email', 'email', 'welcome', 'Welcome to {{brand_name}}!',
'<h1>Welcome {{customer_name}}!</h1><p>We are excited to have you as a customer.</p>',
'["customer_name", "brand_name"]'::jsonb, 'global'),

('Password Reset', 'email', 'password_reset', 'Reset Your Password',
'<h1>Password Reset Request</h1><p>Click the link below to reset your password:</p><a href="{{reset_link}}">Reset Password</a>',
'["customer_name", "reset_link"]'::jsonb, 'global'),

-- SMS Templates
('Order Confirmation SMS', 'sms', 'order_confirmation', NULL,
'Your order {{order_id}} is confirmed. Total: {{total_amount}}. Thank you for shopping with {{brand_name}}!',
'["order_id", "total_amount", "brand_name"]'::jsonb, 'india'),

('OTP Verification', 'sms', 'otp', NULL,
'Your OTP for {{brand_name}} is: {{otp}}. Valid for 10 minutes.',
'["otp", "brand_name"]'::jsonb, 'india'),

-- Notification Templates
('Order Update', 'notification', 'order_update', 'Order Status Update',
'Your order {{order_id}} status: {{status}}',
'["order_id", "status"]'::jsonb, 'global'),

-- Compliance Templates
('Privacy Policy (India)', 'compliance', 'privacy_policy', NULL,
'[Privacy Policy Template for India - DPDP Act Compliant]',
'[]'::jsonb, 'india'),

('Terms of Service', 'compliance', 'terms', NULL,
'[Terms of Service Template]',
'[]'::jsonb, 'global')

ON CONFLICT DO NOTHING;

-- Comments
COMMENT ON TABLE public.branding_configs IS 'Stores comprehensive branding configuration for each tenant/partner';
COMMENT ON TABLE public.branding_feature_toggles IS 'Super admin controls for gating branding features per tenant';
COMMENT ON TABLE public.branding_assets IS 'Manages all branding-related assets with optimization tracking';
COMMENT ON TABLE public.branding_templates IS 'Reusable templates for emails, SMS, notifications, and compliance';
COMMENT ON TABLE public.branding_audit_logs IS 'Audit trail for all branding-related changes';
COMMENT ON TABLE public.custom_domains IS 'Custom domain management with verification and SSL status';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration 12: Advanced Branding & White-Label Control System completed successfully';
END $$;
