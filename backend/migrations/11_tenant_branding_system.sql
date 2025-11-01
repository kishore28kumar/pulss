-- Migration for Advanced Tenant Branding and White-Label System
-- This migration adds comprehensive branding and custom domain support

-- ============================================================================
-- TENANT BRANDING TABLE
-- ============================================================================
-- Stores all branding configuration for each tenant
CREATE TABLE IF NOT EXISTS public.tenant_branding (
  branding_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Logo and Visual Identity
  logo_url TEXT,
  logo_dark_url TEXT, -- Dark mode version
  favicon_url TEXT,
  pwa_icon_url TEXT,
  login_background_url TEXT,
  
  -- Color Scheme
  primary_color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color
  secondary_color VARCHAR(7) DEFAULT '#10B981',
  accent_color VARCHAR(7) DEFAULT '#F59E0B',
  text_color VARCHAR(7) DEFAULT '#1F2937',
  background_color VARCHAR(7) DEFAULT '#FFFFFF',
  
  -- Typography
  font_family TEXT DEFAULT 'Inter',
  font_url TEXT, -- Google Fonts URL or custom font
  
  -- Theme Configuration
  theme_mode VARCHAR(20) DEFAULT 'light', -- 'light', 'dark', 'auto'
  custom_css TEXT, -- Additional custom CSS
  
  -- Legal and Footer Content (White-Label)
  company_name TEXT,
  legal_company_name TEXT,
  company_address TEXT,
  support_email TEXT,
  support_phone TEXT,
  terms_url TEXT,
  privacy_url TEXT,
  about_url TEXT,
  custom_footer_html TEXT,
  copyright_text TEXT,
  
  -- Email Branding
  email_header_logo_url TEXT,
  email_footer_text TEXT,
  email_primary_color VARCHAR(7),
  email_template_id TEXT, -- Reference to custom email template
  
  -- Login Page Customization
  login_title TEXT DEFAULT 'Welcome Back',
  login_subtitle TEXT,
  login_show_logo BOOLEAN DEFAULT true,
  login_custom_message TEXT,
  
  -- Advanced Settings (JSON for flexibility)
  custom_meta_tags JSONB, -- Custom meta tags for SEO
  social_links JSONB, -- {facebook, twitter, instagram, linkedin}
  additional_settings JSONB, -- Extensible settings
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_by UUID REFERENCES public.admins(admin_id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.admins(admin_id) ON DELETE SET NULL
);

CREATE INDEX idx_tenant_branding_tenant ON public.tenant_branding(tenant_id);

-- ============================================================================
-- CUSTOM DOMAINS TABLE
-- ============================================================================
-- Manages custom domains for tenants (e.g., pharmacy.mycompany.com)
CREATE TABLE IF NOT EXISTS public.custom_domains (
  domain_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  
  -- Domain Information
  domain_name VARCHAR(255) UNIQUE NOT NULL, -- e.g., pharmacy.mycompany.com
  is_primary BOOLEAN DEFAULT false, -- Primary domain for this tenant
  
  -- DNS Verification
  verification_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'verified', 'failed'
  verification_token VARCHAR(255) UNIQUE, -- Token for DNS TXT record verification
  verification_method VARCHAR(20) DEFAULT 'txt', -- 'txt', 'cname', 'http'
  dns_records JSONB, -- Required DNS records for setup
  verified_at TIMESTAMP WITH TIME ZONE,
  
  -- SSL Configuration
  ssl_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'active', 'failed', 'expired'
  ssl_provider VARCHAR(50) DEFAULT 'letsencrypt',
  ssl_certificate_id TEXT, -- External certificate ID
  ssl_expires_at TIMESTAMP WITH TIME ZONE,
  ssl_last_checked TIMESTAMP WITH TIME ZONE,
  
  -- Routing Configuration
  is_active BOOLEAN DEFAULT false, -- Domain is active and routing
  redirect_to_primary BOOLEAN DEFAULT false, -- Redirect to primary domain
  
  -- Metadata
  notes TEXT, -- Admin notes about this domain
  last_error TEXT, -- Last error message if any
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_by UUID REFERENCES public.admins(admin_id) ON DELETE SET NULL
);

CREATE INDEX idx_custom_domains_tenant ON public.custom_domains(tenant_id);
CREATE INDEX idx_custom_domains_domain_name ON public.custom_domains(domain_name);
CREATE INDEX idx_custom_domains_verification_status ON public.custom_domains(verification_status);
CREATE INDEX idx_custom_domains_is_active ON public.custom_domains(is_active);

-- ============================================================================
-- BRANDING FEATURE FLAGS TABLE
-- ============================================================================
-- Controls which branding features are enabled for each tenant
-- Super admin can enable/disable advanced features per tenant
CREATE TABLE IF NOT EXISTS public.branding_feature_flags (
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE PRIMARY KEY,
  
  -- Standard Features (enabled by default for all admins)
  logo_upload_enabled BOOLEAN DEFAULT true,
  color_customization_enabled BOOLEAN DEFAULT true,
  theme_selection_enabled BOOLEAN DEFAULT true,
  favicon_enabled BOOLEAN DEFAULT true,
  login_customization_enabled BOOLEAN DEFAULT true,
  
  -- Advanced Features (require super admin approval)
  custom_domain_enabled BOOLEAN DEFAULT false,
  white_label_enabled BOOLEAN DEFAULT false, -- Hide main brand completely
  custom_footer_enabled BOOLEAN DEFAULT false,
  custom_legal_enabled BOOLEAN DEFAULT false, -- Custom terms, privacy policy
  email_branding_enabled BOOLEAN DEFAULT false,
  custom_css_enabled BOOLEAN DEFAULT false,
  multi_brand_enabled BOOLEAN DEFAULT false, -- For partners/resellers
  api_access_enabled BOOLEAN DEFAULT false, -- API for branding updates
  
  -- Email Template Settings
  custom_email_templates_enabled BOOLEAN DEFAULT false,
  
  -- Metadata
  notes TEXT, -- Super admin notes about why features are enabled/disabled
  approved_by UUID REFERENCES public.admins(admin_id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX idx_branding_feature_flags_tenant ON public.branding_feature_flags(tenant_id);

-- ============================================================================
-- BRANDING WEBHOOKS TABLE
-- ============================================================================
-- Webhooks for notifying external systems about branding changes
CREATE TABLE IF NOT EXISTS public.branding_webhooks (
  webhook_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  
  -- Webhook Configuration
  webhook_url TEXT NOT NULL,
  webhook_secret VARCHAR(255), -- Secret for HMAC signature
  is_active BOOLEAN DEFAULT true,
  
  -- Events to trigger on
  events TEXT[] DEFAULT ARRAY['branding.updated', 'domain.verified', 'domain.added', 'domain.removed'],
  
  -- Delivery Settings
  retry_count INTEGER DEFAULT 3,
  timeout_seconds INTEGER DEFAULT 30,
  
  -- Statistics
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  last_success_at TIMESTAMP WITH TIME ZONE,
  last_failure_at TIMESTAMP WITH TIME ZONE,
  last_error TEXT,
  total_deliveries INTEGER DEFAULT 0,
  successful_deliveries INTEGER DEFAULT 0,
  failed_deliveries INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_by UUID REFERENCES public.admins(admin_id) ON DELETE SET NULL
);

CREATE INDEX idx_branding_webhooks_tenant ON public.branding_webhooks(tenant_id);
CREATE INDEX idx_branding_webhooks_active ON public.branding_webhooks(is_active);

-- ============================================================================
-- MULTI-BRAND CONFIGURATIONS TABLE
-- ============================================================================
-- For partners/resellers who manage multiple brands under one tenant
CREATE TABLE IF NOT EXISTS public.multi_brand_configs (
  brand_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  
  -- Brand Identity
  brand_name VARCHAR(255) NOT NULL,
  brand_slug VARCHAR(100) UNIQUE NOT NULL, -- URL-friendly identifier
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false, -- Default brand for this tenant
  
  -- Brand-specific Settings (similar to tenant_branding but for sub-brands)
  logo_url TEXT,
  primary_color VARCHAR(7),
  secondary_color VARCHAR(7),
  custom_domain VARCHAR(255),
  
  -- Brand Configuration
  settings JSONB, -- Extended brand settings
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_by UUID REFERENCES public.admins(admin_id) ON DELETE SET NULL
);

CREATE INDEX idx_multi_brand_configs_tenant ON public.multi_brand_configs(tenant_id);
CREATE INDEX idx_multi_brand_configs_slug ON public.multi_brand_configs(brand_slug);
CREATE INDEX idx_multi_brand_configs_active ON public.multi_brand_configs(is_active);

-- ============================================================================
-- BRANDING CHANGE HISTORY TABLE
-- ============================================================================
-- Audit trail for all branding changes
CREATE TABLE IF NOT EXISTS public.branding_change_history (
  history_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  
  -- Change Information
  change_type VARCHAR(50) NOT NULL, -- 'branding_updated', 'domain_added', 'feature_enabled', etc.
  entity_type VARCHAR(50) NOT NULL, -- 'tenant_branding', 'custom_domains', 'feature_flags'
  entity_id UUID, -- ID of the changed entity
  
  -- Change Details
  old_values JSONB, -- Previous values
  new_values JSONB, -- New values
  changed_fields TEXT[], -- List of changed field names
  
  -- Metadata
  changed_by UUID REFERENCES public.admins(admin_id) ON DELETE SET NULL,
  change_reason TEXT,
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX idx_branding_history_tenant ON public.branding_change_history(tenant_id);
CREATE INDEX idx_branding_history_type ON public.branding_change_history(change_type);
CREATE INDEX idx_branding_history_created ON public.branding_change_history(created_at DESC);

-- ============================================================================
-- INITIALIZE DEFAULT BRANDING FOR EXISTING TENANTS
-- ============================================================================
-- Create default branding records for existing tenants
INSERT INTO public.tenant_branding (tenant_id, company_name, created_at, updated_at)
SELECT 
  tenant_id, 
  name as company_name,
  TIMEZONE('utc'::text, NOW()),
  TIMEZONE('utc'::text, NOW())
FROM public.tenants
WHERE tenant_id NOT IN (SELECT tenant_id FROM public.tenant_branding)
ON CONFLICT (tenant_id) DO NOTHING;

-- Initialize branding feature flags for existing tenants (standard features enabled)
INSERT INTO public.branding_feature_flags (tenant_id, created_at, updated_at)
SELECT 
  tenant_id,
  TIMEZONE('utc'::text, NOW()),
  TIMEZONE('utc'::text, NOW())
FROM public.tenants
WHERE tenant_id NOT IN (SELECT tenant_id FROM public.branding_feature_flags)
ON CONFLICT (tenant_id) DO NOTHING;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get active custom domain for a tenant
CREATE OR REPLACE FUNCTION get_tenant_active_domain(p_tenant_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_domain TEXT;
BEGIN
  SELECT domain_name INTO v_domain
  FROM public.custom_domains
  WHERE tenant_id = p_tenant_id 
    AND is_active = true 
    AND is_primary = true
    AND verification_status = 'verified'
  LIMIT 1;
  
  RETURN v_domain;
END;
$$ LANGUAGE plpgsql;

-- Function to check if tenant has white-label enabled
CREATE OR REPLACE FUNCTION is_white_label_enabled(p_tenant_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_enabled BOOLEAN;
BEGIN
  SELECT white_label_enabled INTO v_enabled
  FROM public.branding_feature_flags
  WHERE tenant_id = p_tenant_id;
  
  RETURN COALESCE(v_enabled, false);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.tenant_branding IS 'Stores comprehensive branding configuration for each tenant including logos, colors, fonts, and white-label settings';
COMMENT ON TABLE public.custom_domains IS 'Manages custom domains for tenants with DNS verification and SSL management';
COMMENT ON TABLE public.branding_feature_flags IS 'Controls which branding features are enabled for each tenant - super admin managed';
COMMENT ON TABLE public.branding_webhooks IS 'Webhook endpoints for external systems to receive branding change notifications';
COMMENT ON TABLE public.multi_brand_configs IS 'Multi-brand support for partners/resellers managing multiple brands';
COMMENT ON TABLE public.branding_change_history IS 'Audit trail for all branding and domain changes';

COMMENT ON COLUMN public.branding_feature_flags.white_label_enabled IS 'When enabled, hides main platform brand and uses only tenant branding';
COMMENT ON COLUMN public.branding_feature_flags.custom_domain_enabled IS 'Allows tenant to use custom domains - requires super admin approval';
COMMENT ON COLUMN public.branding_feature_flags.multi_brand_enabled IS 'Enables multi-brand management for partners/resellers';

-- ============================================================================
-- COMPLETION
-- ============================================================================
-- Migration completed successfully
