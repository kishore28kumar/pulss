-- ============================================================================
-- API Gateway & Partner Integrations System
-- ============================================================================
-- This migration creates all tables needed for the API Gateway system
-- Fully controlled by super admin toggles
-- ============================================================================

-- API Gateway Keys table
-- Stores API keys for tenants, partners, and resellers
CREATE TABLE IF NOT EXISTS public.api_gateway_keys (
  key_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
  partner_id UUID, -- Can be NULL for tenant keys
  key_name TEXT NOT NULL,
  api_key_hash TEXT NOT NULL, -- bcrypt hashed key
  api_key_prefix TEXT NOT NULL, -- First 12 chars + '...' for display
  api_secret_hash TEXT, -- Optional secret for OAuth flows
  key_type TEXT NOT NULL DEFAULT 'tenant', -- 'tenant', 'partner', 'reseller'
  scopes TEXT[] NOT NULL DEFAULT '{}', -- Array of permission scopes
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'revoked', 'expired', 'suspended'
  
  -- Usage statistics
  total_requests BIGINT DEFAULT 0,
  successful_requests BIGINT DEFAULT 0,
  failed_requests BIGINT DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  
  -- Rate limiting
  rate_limit_per_minute INTEGER DEFAULT 60,
  rate_limit_per_hour INTEGER DEFAULT 1000,
  rate_limit_per_day INTEGER DEFAULT 10000,
  
  -- Security
  ip_whitelist TEXT[], -- Array of allowed IPs/CIDR ranges
  allowed_origins TEXT[], -- CORS allowed origins
  geo_restrictions JSONB, -- {allowed: ['US', 'IN'], blocked: ['CN']}
  
  -- Metadata
  description TEXT,
  metadata JSONB, -- Additional custom data
  expires_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_by UUID REFERENCES public.admins(admin_id) ON DELETE SET NULL
);

-- API Key Usage Logs
-- Tracks all API requests for analytics
CREATE TABLE IF NOT EXISTS public.api_usage_logs (
  log_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key_id UUID REFERENCES public.api_gateway_keys(key_id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
  
  -- Request details
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER, -- Response time in milliseconds
  
  -- Client info
  ip_address INET,
  user_agent TEXT,
  geo_location JSONB, -- {country, city, lat, lon}
  
  -- Request/Response
  request_size BIGINT, -- bytes
  response_size BIGINT, -- bytes
  error_message TEXT,
  
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Partner/Reseller Registry
CREATE TABLE IF NOT EXISTS public.partners (
  partner_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'partner', -- 'partner', 'reseller', 'integrator'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'active', 'suspended', 'terminated'
  
  -- Contact info
  company_name TEXT,
  contact_email CITEXT NOT NULL,
  contact_phone TEXT,
  website TEXT,
  
  -- Business details
  business_address TEXT,
  tax_id TEXT,
  contract_details JSONB,
  
  -- API Access
  api_access_enabled BOOLEAN DEFAULT false,
  allowed_scopes TEXT[] DEFAULT '{}',
  
  -- SSO Configuration
  sso_enabled BOOLEAN DEFAULT false,
  sso_provider TEXT, -- 'oauth2', 'saml', 'oidc'
  sso_config JSONB, -- Provider-specific configuration
  
  -- Webhook Configuration
  webhook_url TEXT,
  webhook_secret TEXT,
  webhook_events TEXT[] DEFAULT '{}',
  
  -- Branding
  logo_url TEXT,
  primary_color TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_by UUID REFERENCES public.admins(admin_id) ON DELETE SET NULL
);

-- OAuth2 Tokens
-- For partner OAuth2 authentication flows
CREATE TABLE IF NOT EXISTS public.oauth_tokens (
  token_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  partner_id UUID REFERENCES public.partners(partner_id) ON DELETE CASCADE NOT NULL,
  key_id UUID REFERENCES public.api_gateway_keys(key_id) ON DELETE CASCADE,
  
  token_type TEXT NOT NULL DEFAULT 'access', -- 'access', 'refresh'
  token_hash TEXT NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  revoked BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Webhook Delivery Logs
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  webhook_log_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  partner_id UUID REFERENCES public.partners(partner_id) ON DELETE CASCADE NOT NULL,
  
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  
  -- Delivery details
  webhook_url TEXT NOT NULL,
  status_code INTEGER,
  response_body TEXT,
  delivery_attempts INTEGER DEFAULT 0,
  
  success BOOLEAN DEFAULT false,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  delivered_at TIMESTAMP WITH TIME ZONE
);

-- API Scopes/Permissions
-- Defines available API scopes
CREATE TABLE IF NOT EXISTS public.api_scopes (
  scope_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  scope_name TEXT UNIQUE NOT NULL, -- e.g., 'orders:read', 'products:write'
  scope_group TEXT NOT NULL, -- e.g., 'orders', 'products', 'customers'
  description TEXT NOT NULL,
  is_system BOOLEAN DEFAULT false, -- System scopes can't be deleted
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- API Feature Toggles (Super Admin Controls)
-- Extends existing feature_flags table with API-specific features
ALTER TABLE public.feature_flags 
ADD COLUMN IF NOT EXISTS api_gateway_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS api_webhooks_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS api_oauth2_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS api_partner_access_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS api_rate_limiting_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS api_geo_fencing_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS api_ip_whitelisting_enabled BOOLEAN DEFAULT false;

-- Global API Settings (Super Admin only)
CREATE TABLE IF NOT EXISTS public.api_global_settings (
  setting_key TEXT PRIMARY KEY,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_by UUID REFERENCES public.admins(admin_id) ON DELETE SET NULL
);

-- Integration Templates
-- Pre-configured integration templates for partners
CREATE TABLE IF NOT EXISTS public.integration_templates (
  template_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'webhook', 'sso', 'api', 'custom'
  category TEXT, -- 'accounting', 'shipping', 'payment', 'crm', etc.
  description TEXT,
  
  -- Template configuration
  config_schema JSONB NOT NULL, -- JSON Schema for configuration
  default_config JSONB, -- Default configuration values
  documentation_url TEXT,
  
  -- Code samples
  code_samples JSONB, -- {nodejs: '...', python: '...', curl: '...'}
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_api_keys_tenant ON public.api_gateway_keys(tenant_id);
CREATE INDEX idx_api_keys_partner ON public.api_gateway_keys(partner_id);
CREATE INDEX idx_api_keys_status ON public.api_gateway_keys(status);
CREATE INDEX idx_api_keys_expires ON public.api_gateway_keys(expires_at);
CREATE INDEX idx_api_keys_key_type ON public.api_gateway_keys(key_type);

CREATE INDEX idx_api_usage_key ON public.api_usage_logs(key_id);
CREATE INDEX idx_api_usage_tenant ON public.api_usage_logs(tenant_id);
CREATE INDEX idx_api_usage_timestamp ON public.api_usage_logs(timestamp);
CREATE INDEX idx_api_usage_endpoint ON public.api_usage_logs(endpoint);

CREATE INDEX idx_partners_status ON public.partners(status);
CREATE INDEX idx_partners_type ON public.partners(type);
CREATE INDEX idx_partners_email ON public.partners(contact_email);

CREATE INDEX idx_oauth_tokens_partner ON public.oauth_tokens(partner_id);
CREATE INDEX idx_oauth_tokens_expires ON public.oauth_tokens(expires_at);
CREATE INDEX idx_oauth_tokens_revoked ON public.oauth_tokens(revoked);

CREATE INDEX idx_webhook_logs_partner ON public.webhook_logs(partner_id);
CREATE INDEX idx_webhook_logs_success ON public.webhook_logs(success);
CREATE INDEX idx_webhook_logs_created ON public.webhook_logs(created_at);

-- ============================================================================
-- SEED DEFAULT API SCOPES
-- ============================================================================

INSERT INTO public.api_scopes (scope_name, scope_group, description, is_system) VALUES
-- Orders
('orders:read', 'orders', 'Read order information', true),
('orders:write', 'orders', 'Create and update orders', true),
('orders:delete', 'orders', 'Delete orders', true),

-- Products
('products:read', 'products', 'Read product catalog', true),
('products:write', 'products', 'Create and update products', true),
('products:delete', 'products', 'Delete products', true),

-- Customers
('customers:read', 'customers', 'Read customer information', true),
('customers:write', 'customers', 'Create and update customers', true),
('customers:delete', 'customers', 'Delete customers', true),

-- Inventory
('inventory:read', 'inventory', 'Read inventory levels', true),
('inventory:write', 'inventory', 'Update inventory levels', true),

-- Analytics
('analytics:read', 'analytics', 'Access analytics and reports', true),

-- Webhooks
('webhooks:manage', 'webhooks', 'Manage webhook configurations', true),

-- Payments
('payments:read', 'payments', 'Read payment information', true),
('payments:write', 'payments', 'Process payments', true),

-- Admin
('admin:read', 'admin', 'Read admin configurations', true),
('admin:write', 'admin', 'Modify admin configurations', true)
ON CONFLICT (scope_name) DO NOTHING;

-- ============================================================================
-- SEED DEFAULT INTEGRATION TEMPLATES
-- ============================================================================

INSERT INTO public.integration_templates (name, type, category, description, config_schema, default_config, code_samples) VALUES
(
  'Webhook Integration',
  'webhook',
  'general',
  'Basic webhook integration for real-time event notifications',
  '{"type":"object","properties":{"url":{"type":"string","format":"uri"},"events":{"type":"array","items":{"type":"string"}},"secret":{"type":"string"}}}',
  '{"events":["order.created","order.updated","order.cancelled"]}',
  '{"curl":"curl -X POST https://your-webhook-url.com -H \"Content-Type: application/json\" -d \"{\\\"event\\\":\\\"order.created\\\"}\"","nodejs":"const axios = require(\"axios\");\nawait axios.post(webhookUrl, {event: \"order.created\"});","python":"import requests\nrequests.post(webhook_url, json={\"event\": \"order.created\"})"}'
),
(
  'OAuth2 SSO',
  'sso',
  'authentication',
  'OAuth2 Single Sign-On integration',
  '{"type":"object","properties":{"client_id":{"type":"string"},"client_secret":{"type":"string"},"redirect_uri":{"type":"string","format":"uri"},"scopes":{"type":"array","items":{"type":"string"}}}}',
  '{"scopes":["openid","profile","email"]}',
  '{"curl":"curl -X POST https://oauth.provider.com/token -d \"grant_type=authorization_code&code=...&client_id=...&client_secret=...\"","nodejs":"// Use passport-oauth2 or similar library","python":"# Use authlib or requests-oauthlib"}'
),
(
  'REST API Integration',
  'api',
  'general',
  'Standard REST API integration with API keys',
  '{"type":"object","properties":{"api_key":{"type":"string"},"base_url":{"type":"string","format":"uri"},"endpoints":{"type":"object"}}}',
  '{"base_url":"https://api.pulss.com/v1"}',
  '{"curl":"curl -H \"Authorization: Bearer YOUR_API_KEY\" https://api.pulss.com/v1/orders","nodejs":"const response = await fetch(\"https://api.pulss.com/v1/orders\", {\n  headers: {\"Authorization\": \"Bearer YOUR_API_KEY\"}\n});","python":"import requests\nresponse = requests.get(\"https://api.pulss.com/v1/orders\", headers={\"Authorization\": \"Bearer YOUR_API_KEY\"})"}'
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SEED DEFAULT GLOBAL API SETTINGS
-- ============================================================================

INSERT INTO public.api_global_settings (setting_key, setting_value, description) VALUES
('default_rate_limits', '{"per_minute":60,"per_hour":1000,"per_day":10000}', 'Default rate limits for new API keys'),
('webhook_retry_config', '{"max_attempts":5,"retry_delays":[60,300,900,3600,7200]}', 'Webhook retry configuration in seconds'),
('oauth_token_ttl', '{"access_token":3600,"refresh_token":2592000}', 'OAuth token TTL in seconds'),
('api_version', '"v1"', 'Current API version'),
('maintenance_mode', 'false', 'Global API maintenance mode')
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================================================
-- NOTES
-- ============================================================================
-- This migration creates a complete API Gateway system with:
-- 1. API Key management with scopes and permissions
-- 2. Partner/Reseller registry with SSO support
-- 3. OAuth2 authentication flows
-- 4. Webhook management with retry logic
-- 5. Usage logging and analytics
-- 6. Rate limiting, IP whitelisting, geo-fencing
-- 7. Integration templates for quick onboarding
-- 8. Super admin toggles for all API features
-- ============================================================================
