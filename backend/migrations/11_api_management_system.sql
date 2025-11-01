-- ============================================================================
-- Migration 11: Advanced API Management and Developer Portal
-- ============================================================================
-- Implements comprehensive API management system with:
-- - API key management with permissions and rate limiting
-- - Webhook system for event notifications
-- - OAuth 2.0 support
-- - API usage analytics and logging
-- - Super admin toggles for API features
-- ============================================================================

-- ============================================================================
-- API KEYS MANAGEMENT
-- ============================================================================

-- API Keys table (enhanced version of existing basic implementation)
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  key_name TEXT NOT NULL,
  api_key TEXT UNIQUE NOT NULL,
  key_prefix TEXT NOT NULL, -- First 12 chars for display (e.g., "pk_abc123...")
  key_hash TEXT NOT NULL, -- bcrypt hash of the key for secure storage
  
  -- Permissions
  scopes TEXT[] DEFAULT ARRAY['read:products', 'read:orders'], -- API scopes/permissions
  permissions JSONB DEFAULT '{"users": ["read"], "products": ["read"], "orders": ["read"]}'::jsonb,
  
  -- Rate limiting
  rate_limit_per_hour INTEGER DEFAULT 1000,
  rate_limit_per_day INTEGER DEFAULT 10000,
  rate_limit_per_month INTEGER DEFAULT 100000,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Usage tracking
  last_used_at TIMESTAMP WITH TIME ZONE,
  total_requests BIGINT DEFAULT 0,
  
  -- Metadata
  description TEXT,
  environment TEXT DEFAULT 'production', -- 'production', 'staging', 'development'
  created_by UUID, -- admin_id who created this key
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- API usage logs for analytics
CREATE TABLE IF NOT EXISTS public.api_usage_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  api_key_id UUID REFERENCES public.api_keys(id) ON DELETE CASCADE,
  
  -- Request details
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL, -- GET, POST, PUT, DELETE
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER,
  
  -- Request metadata
  ip_address TEXT,
  user_agent TEXT,
  request_body_size INTEGER,
  response_body_size INTEGER,
  
  -- Timestamps
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  -- Partitioning key for performance
  log_date DATE GENERATED ALWAYS AS (DATE(timestamp)) STORED
);

-- Partition api_usage_logs by month for performance
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_date ON public.api_usage_logs(log_date DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_tenant ON public.api_usage_logs(tenant_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_api_key ON public.api_usage_logs(api_key_id, timestamp DESC);

-- API rate limit tracking (for short-term rate limiting)
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  api_key_id UUID REFERENCES public.api_keys(id) ON DELETE CASCADE NOT NULL,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL,
  window_type TEXT NOT NULL, -- 'hour', 'day', 'month'
  request_count INTEGER DEFAULT 0,
  
  UNIQUE(api_key_id, window_start, window_type)
);

CREATE INDEX IF NOT EXISTS idx_api_rate_limits_lookup ON public.api_rate_limits(api_key_id, window_start, window_type);

-- ============================================================================
-- WEBHOOKS SYSTEM
-- ============================================================================

-- Webhook subscriptions
CREATE TABLE IF NOT EXISTS public.webhooks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  
  -- Webhook configuration
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT NOT NULL, -- HMAC secret for signature verification
  
  -- Events to listen to
  events TEXT[] NOT NULL, -- e.g., ['order.created', 'order.updated', 'customer.created']
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false, -- URL verification status
  
  -- Delivery settings
  retry_attempts INTEGER DEFAULT 3,
  timeout_seconds INTEGER DEFAULT 30,
  
  -- Statistics
  total_deliveries BIGINT DEFAULT 0,
  successful_deliveries BIGINT DEFAULT 0,
  failed_deliveries BIGINT DEFAULT 0,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  description TEXT,
  headers JSONB DEFAULT '{}'::jsonb, -- Custom headers to include
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Webhook delivery logs
CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  webhook_id UUID REFERENCES public.webhooks(id) ON DELETE CASCADE NOT NULL,
  
  -- Event details
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  
  -- Delivery details
  status TEXT NOT NULL, -- 'pending', 'success', 'failed', 'retrying'
  http_status_code INTEGER,
  response_body TEXT,
  error_message TEXT,
  
  -- Retry tracking
  attempt_number INTEGER DEFAULT 1,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  delivered_at TIMESTAMP WITH TIME ZONE,
  
  -- Partitioning key
  log_date DATE GENERATED ALWAYS AS (DATE(created_at)) STORED
);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook ON public.webhook_deliveries(webhook_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON public.webhook_deliveries(status, next_retry_at) WHERE status = 'retrying';

-- ============================================================================
-- OAUTH 2.0 SUPPORT
-- ============================================================================

-- OAuth applications (for third-party integrations)
CREATE TABLE IF NOT EXISTS public.oauth_applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  
  -- Application details
  name TEXT NOT NULL,
  description TEXT,
  client_id TEXT UNIQUE NOT NULL,
  client_secret TEXT NOT NULL, -- hashed
  
  -- OAuth configuration
  redirect_uris TEXT[] NOT NULL,
  allowed_scopes TEXT[] NOT NULL,
  grant_types TEXT[] DEFAULT ARRAY['authorization_code', 'refresh_token'],
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_trusted BOOLEAN DEFAULT false, -- Skip consent screen for trusted apps
  
  -- Metadata
  logo_url TEXT,
  website_url TEXT,
  privacy_policy_url TEXT,
  terms_of_service_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- OAuth authorization codes
CREATE TABLE IF NOT EXISTS public.oauth_authorization_codes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  application_id UUID REFERENCES public.oauth_applications(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES public.customers(customer_id) ON DELETE CASCADE,
  
  -- Authorization details
  scopes TEXT[] NOT NULL,
  redirect_uri TEXT NOT NULL,
  code_challenge TEXT, -- PKCE support
  code_challenge_method TEXT, -- 'S256' or 'plain'
  
  -- Status
  is_used BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_oauth_codes_code ON public.oauth_authorization_codes(code) WHERE NOT is_used;

-- OAuth access tokens
CREATE TABLE IF NOT EXISTS public.oauth_access_tokens (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  application_id UUID REFERENCES public.oauth_applications(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES public.customers(customer_id) ON DELETE CASCADE,
  
  -- Token details
  scopes TEXT[] NOT NULL,
  token_type TEXT DEFAULT 'Bearer',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Refresh token
  refresh_token TEXT UNIQUE,
  refresh_token_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Status
  is_revoked BOOLEAN DEFAULT false,
  
  -- Usage tracking
  last_used_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_oauth_tokens_token ON public.oauth_access_tokens(token) WHERE NOT is_revoked;
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_refresh ON public.oauth_access_tokens(refresh_token) WHERE NOT is_revoked;

-- ============================================================================
-- API FEATURE TOGGLES (Super Admin Controls)
-- ============================================================================

-- API feature flags per tenant
CREATE TABLE IF NOT EXISTS public.api_feature_flags (
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE PRIMARY KEY,
  
  -- Core API features
  api_enabled BOOLEAN DEFAULT true, -- Overall API access
  api_docs_enabled BOOLEAN DEFAULT true, -- Access to API documentation
  
  -- API key management
  api_keys_enabled BOOLEAN DEFAULT false, -- Can create/manage API keys
  api_keys_max_count INTEGER DEFAULT 5, -- Max API keys per tenant
  
  -- Endpoints access
  users_api_enabled BOOLEAN DEFAULT false,
  billing_api_enabled BOOLEAN DEFAULT false,
  notifications_api_enabled BOOLEAN DEFAULT false,
  branding_api_enabled BOOLEAN DEFAULT false,
  audit_log_api_enabled BOOLEAN DEFAULT false,
  
  -- Advanced features
  webhooks_enabled BOOLEAN DEFAULT false,
  webhooks_max_count INTEGER DEFAULT 10,
  oauth_enabled BOOLEAN DEFAULT false,
  
  -- Analytics and billing
  api_analytics_enabled BOOLEAN DEFAULT true,
  api_billing_enabled BOOLEAN DEFAULT false,
  api_usage_alerts_enabled BOOLEAN DEFAULT false,
  
  -- Partner/marketplace features
  partner_integrations_enabled BOOLEAN DEFAULT false,
  app_store_enabled BOOLEAN DEFAULT false,
  
  -- Rate limiting
  custom_rate_limits_enabled BOOLEAN DEFAULT false,
  rate_limit_multiplier NUMERIC(3,2) DEFAULT 1.0, -- Multiplier for default limits
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Insert default API feature flags for existing tenants
INSERT INTO public.api_feature_flags (tenant_id)
SELECT tenant_id FROM public.tenants
ON CONFLICT (tenant_id) DO NOTHING;

-- Global API feature flags (super admin only)
CREATE TABLE IF NOT EXISTS public.global_api_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Default settings for new tenants
  default_api_enabled BOOLEAN DEFAULT true,
  default_rate_limit_per_hour INTEGER DEFAULT 1000,
  default_rate_limit_per_day INTEGER DEFAULT 10000,
  
  -- Platform-wide limits
  max_api_keys_per_tenant INTEGER DEFAULT 10,
  max_webhooks_per_tenant INTEGER DEFAULT 20,
  max_oauth_apps_per_tenant INTEGER DEFAULT 5,
  
  -- Maintenance mode
  api_maintenance_mode BOOLEAN DEFAULT false,
  maintenance_message TEXT,
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Insert default global settings
INSERT INTO public.global_api_settings (id) 
VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- DEVELOPER PORTAL CONTENT
-- ============================================================================

-- API documentation pages
CREATE TABLE IF NOT EXISTS public.api_documentation (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Documentation metadata
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'getting-started', 'api-reference', 'guides', 'changelog'
  
  -- Content
  content TEXT NOT NULL, -- Markdown or HTML content
  code_samples JSONB, -- {"javascript": "...", "python": "...", "curl": "..."}
  
  -- Organization
  parent_id UUID REFERENCES public.api_documentation(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  
  -- Status
  is_published BOOLEAN DEFAULT true,
  version TEXT DEFAULT '1.0',
  
  -- SEO
  meta_title TEXT,
  meta_description TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_api_docs_category ON public.api_documentation(category, order_index);
CREATE INDEX IF NOT EXISTS idx_api_docs_published ON public.api_documentation(is_published);

-- API changelog entries
CREATE TABLE IF NOT EXISTS public.api_changelog (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Version info
  version TEXT NOT NULL,
  release_date DATE NOT NULL,
  type TEXT NOT NULL, -- 'major', 'minor', 'patch'
  
  -- Content
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  changes JSONB NOT NULL, -- {"added": [...], "changed": [...], "deprecated": [...], "removed": [...], "fixed": [...]}
  
  -- Status
  is_published BOOLEAN DEFAULT true,
  is_breaking BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_api_changelog_date ON public.api_changelog(release_date DESC);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_api_keys_tenant ON public.api_keys(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON public.api_keys(api_key) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_webhooks_tenant ON public.webhooks(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_oauth_apps_tenant ON public.oauth_applications(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_oauth_apps_client ON public.oauth_applications(client_id) WHERE is_active = true;

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON public.api_keys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webhooks_updated_at BEFORE UPDATE ON public.webhooks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_oauth_applications_updated_at BEFORE UPDATE ON public.oauth_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_feature_flags_updated_at BEFORE UPDATE ON public.api_feature_flags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.api_keys IS 'API keys for programmatic access with permissions and rate limiting';
COMMENT ON TABLE public.api_usage_logs IS 'Logs of all API requests for analytics and billing';
COMMENT ON TABLE public.webhooks IS 'Webhook subscriptions for event notifications';
COMMENT ON TABLE public.webhook_deliveries IS 'Webhook delivery attempts and results';
COMMENT ON TABLE public.oauth_applications IS 'OAuth 2.0 applications for third-party integrations';
COMMENT ON TABLE public.oauth_access_tokens IS 'OAuth 2.0 access and refresh tokens';
COMMENT ON TABLE public.api_feature_flags IS 'Per-tenant API feature toggles controlled by super admin';
COMMENT ON TABLE public.global_api_settings IS 'Platform-wide API settings and limits';
COMMENT ON TABLE public.api_documentation IS 'API documentation content for developer portal';
COMMENT ON TABLE public.api_changelog IS 'API version changelog for tracking changes';

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Insert sample API documentation
INSERT INTO public.api_documentation (slug, title, description, category, content, order_index) VALUES
  ('getting-started', 'Getting Started', 'Quick start guide for Pulss API', 'getting-started', 
   '# Getting Started with Pulss API\n\nWelcome to the Pulss API! This guide will help you get started with integrating our API into your application.\n\n## Authentication\n\nAll API requests require authentication using an API key. You can generate an API key from your dashboard.\n\n## Making Your First Request\n\nUse your API key in the Authorization header:\n\n```bash\ncurl -H "Authorization: Bearer YOUR_API_KEY" https://api.pulss.com/api/products\n```', 
   1),
  ('authentication', 'Authentication', 'How to authenticate API requests', 'getting-started',
   '# Authentication\n\nThe Pulss API uses API keys for authentication. Include your API key in the Authorization header of all requests.\n\n## API Key Format\n\nAPI keys are prefixed with `pk_` for production keys and `pk_test_` for test keys.\n\n## Example\n\n```bash\nAuthorization: Bearer pk_your_api_key_here\n```',
   2),
  ('rate-limiting', 'Rate Limiting', 'Understanding API rate limits', 'getting-started',
   '# Rate Limiting\n\nThe Pulss API implements rate limiting to ensure fair usage and maintain service quality.\n\n## Default Limits\n\n- 1,000 requests per hour\n- 10,000 requests per day\n- 100,000 requests per month\n\n## Rate Limit Headers\n\nEach response includes rate limit information in the headers:\n\n```\nX-RateLimit-Limit: 1000\nX-RateLimit-Remaining: 999\nX-RateLimit-Reset: 1640000000\n```',
   3),
  ('webhooks', 'Webhooks', 'Setting up webhook notifications', 'guides',
   '# Webhooks\n\nWebhooks allow you to receive real-time notifications when events occur in your Pulss account.\n\n## Supported Events\n\n- `order.created` - New order is placed\n- `order.updated` - Order status changes\n- `customer.created` - New customer signs up\n- `product.updated` - Product inventory changes\n\n## Webhook Payload\n\nAll webhooks include a signature header for verification:\n\n```json\n{\n  "event": "order.created",\n  "data": {...},\n  "timestamp": "2025-10-20T12:00:00Z"\n}\n```',
   1)
ON CONFLICT (slug) DO NOTHING;

-- Insert sample changelog entry
INSERT INTO public.api_changelog (version, release_date, type, title, description, changes, is_published) VALUES
  ('1.0.0', CURRENT_DATE, 'major', 'Initial API Release', 'First stable release of Pulss API with core features',
   '{"added": ["API key authentication", "Product management endpoints", "Order management endpoints", "Webhook support"], "changed": [], "deprecated": [], "removed": [], "fixed": []}'::jsonb,
   true)
ON CONFLICT DO NOTHING;
