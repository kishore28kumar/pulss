-- ============================================================================
-- Migration 10: GDPR Privacy Controls
-- ============================================================================
-- Adds tables and fields for GDPR compliance:
-- - User consent tracking
-- - Data deletion requests
-- - Privacy policy acceptance
-- ============================================================================

-- User consent management table
CREATE TABLE IF NOT EXISTS public.user_consents (
  consent_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_type TEXT NOT NULL, -- 'customer', 'admin', 'super_admin'
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
  
  -- Consent types
  marketing_consent BOOLEAN DEFAULT FALSE,
  analytics_consent BOOLEAN DEFAULT FALSE,
  data_processing_consent BOOLEAN DEFAULT TRUE,
  third_party_sharing_consent BOOLEAN DEFAULT FALSE,
  
  -- Privacy policy
  privacy_policy_version TEXT,
  privacy_policy_accepted_at TIMESTAMP WITH TIME ZONE,
  terms_version TEXT,
  terms_accepted_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Data deletion requests (right to be forgotten)
CREATE TABLE IF NOT EXISTS public.data_deletion_requests (
  request_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_type TEXT NOT NULL, -- 'customer', 'admin'
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
  
  -- Request details
  email TEXT NOT NULL,
  phone TEXT,
  reason TEXT,
  
  -- Status tracking
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'rejected'
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Processing details
  processed_by UUID REFERENCES public.admins(admin_id) ON DELETE SET NULL,
  rejection_reason TEXT,
  
  -- Metadata
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Data export requests (data portability)
CREATE TABLE IF NOT EXISTS public.data_export_requests (
  request_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_type TEXT NOT NULL, -- 'customer', 'admin'
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
  
  -- Request details
  email TEXT NOT NULL,
  export_format TEXT DEFAULT 'json', -- 'json', 'csv', 'pdf'
  
  -- Status tracking
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Export details
  file_path TEXT,
  file_size BIGINT,
  expiry_date TIMESTAMP WITH TIME ZONE, -- Downloads expire after 7 days
  download_count INTEGER DEFAULT 0,
  
  -- Metadata
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_consents_user ON public.user_consents(user_id, user_type);
CREATE INDEX IF NOT EXISTS idx_user_consents_tenant ON public.user_consents(tenant_id);

CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_user ON public.data_deletion_requests(user_id, user_type);
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_status ON public.data_deletion_requests(status, requested_at);
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_tenant ON public.data_deletion_requests(tenant_id);

CREATE INDEX IF NOT EXISTS idx_data_export_requests_user ON public.data_export_requests(user_id, user_type);
CREATE INDEX IF NOT EXISTS idx_data_export_requests_status ON public.data_export_requests(status, requested_at);
CREATE INDEX IF NOT EXISTS idx_data_export_requests_tenant ON public.data_export_requests(tenant_id);

-- Comments
COMMENT ON TABLE public.user_consents IS 'Tracks user consent for GDPR compliance';
COMMENT ON TABLE public.data_deletion_requests IS 'Handles right to be forgotten requests per GDPR Article 17';
COMMENT ON TABLE public.data_export_requests IS 'Handles data portability requests per GDPR Article 20';

-- Add updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_user_consents_updated_at ON public.user_consents;
CREATE TRIGGER update_user_consents_updated_at 
  BEFORE UPDATE ON public.user_consents 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_data_deletion_requests_updated_at ON public.data_deletion_requests;
CREATE TRIGGER update_data_deletion_requests_updated_at 
  BEFORE UPDATE ON public.data_deletion_requests 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_data_export_requests_updated_at ON public.data_export_requests;
CREATE TRIGGER update_data_export_requests_updated_at 
  BEFORE UPDATE ON public.data_export_requests 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
