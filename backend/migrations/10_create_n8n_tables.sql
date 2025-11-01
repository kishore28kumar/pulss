-- ============================================================================
-- n8n Workflow Integration Tables
-- Migration: 10_create_n8n_tables.sql
-- ============================================================================

-- Table to store n8n workflow trigger configurations per tenant
CREATE TABLE IF NOT EXISTS public.n8n_workflow_triggers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL, -- 'order-placed', 'customer-registered', etc.
  enabled BOOLEAN DEFAULT false,
  webhook_url TEXT, -- Optional: custom webhook URL for this tenant
  config JSONB DEFAULT '{}', -- Additional configuration (retry settings, filters, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE (tenant_id, event_type)
);

-- Table to store webhook trigger logs for debugging and monitoring
CREATE TABLE IF NOT EXISTS public.n8n_webhook_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL, -- The data sent to the webhook
  response JSONB, -- The response from n8n
  success BOOLEAN DEFAULT false,
  error_message TEXT, -- Error message if failed
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  duration_ms INTEGER -- Time taken for the webhook call
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_n8n_triggers_tenant ON public.n8n_workflow_triggers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_n8n_triggers_event ON public.n8n_workflow_triggers(event_type);
CREATE INDEX IF NOT EXISTS idx_n8n_triggers_enabled ON public.n8n_workflow_triggers(enabled) WHERE enabled = true;

CREATE INDEX IF NOT EXISTS idx_n8n_logs_tenant ON public.n8n_webhook_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_n8n_logs_event ON public.n8n_webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_n8n_logs_triggered ON public.n8n_webhook_logs(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_n8n_logs_success ON public.n8n_webhook_logs(success);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.n8n_workflow_triggers TO postgres;
GRANT SELECT, INSERT ON public.n8n_webhook_logs TO postgres;

-- Comments for documentation
COMMENT ON TABLE public.n8n_workflow_triggers IS 'Configuration for n8n workflow webhooks per tenant and event type';
COMMENT ON TABLE public.n8n_webhook_logs IS 'Audit log of all webhook triggers for monitoring and debugging';
COMMENT ON COLUMN public.n8n_workflow_triggers.event_type IS 'Event type: order-placed, order-accepted, customer-registered, etc.';
COMMENT ON COLUMN public.n8n_workflow_triggers.config IS 'JSON configuration: retry_count, timeout, filter_conditions, etc.';
COMMENT ON COLUMN public.n8n_webhook_logs.payload IS 'The complete payload sent to the n8n webhook';
COMMENT ON COLUMN public.n8n_webhook_logs.response IS 'The response received from n8n (if any)';
