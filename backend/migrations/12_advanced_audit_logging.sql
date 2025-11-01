-- ============================================================================
-- Migration 12: Advanced Audit Logging & Compliance Controls
-- ============================================================================
-- Extends audit logging system with compliance features, retention policies,
-- region controls, and super admin toggles
-- ============================================================================

-- ============================================================================
-- EXTEND EXISTING AUDIT LOGS TABLE
-- ============================================================================

-- Add new columns to existing audit_logs table for advanced features
ALTER TABLE public.audit_logs
ADD COLUMN IF NOT EXISTS partner_id UUID,
ADD COLUMN IF NOT EXISTS event VARCHAR(100),
ADD COLUMN IF NOT EXISTS compliance_tags TEXT[],
ADD COLUMN IF NOT EXISTS region VARCHAR(50),
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS severity VARCHAR(20) DEFAULT 'info',
ADD COLUMN IF NOT EXISTS retention_until TIMESTAMP WITH TIME ZONE;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_audit_logs_partner ON public.audit_logs(partner_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event ON public.audit_logs(event);
CREATE INDEX IF NOT EXISTS idx_audit_logs_compliance_tags ON public.audit_logs USING GIN(compliance_tags);
CREATE INDEX IF NOT EXISTS idx_audit_logs_region ON public.audit_logs(region);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON public.audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_retention ON public.audit_logs(retention_until);

-- ============================================================================
-- AUDIT LOG CONFIGURATION (Super Admin Controls)
-- ============================================================================

-- Audit feature configuration per tenant/partner
CREATE TABLE IF NOT EXISTS public.audit_config (
  config_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
  partner_id UUID,
  
  -- Feature toggles (controlled by super admin)
  enabled BOOLEAN DEFAULT true,
  api_logging_enabled BOOLEAN DEFAULT true,
  billing_logging_enabled BOOLEAN DEFAULT true,
  notification_logging_enabled BOOLEAN DEFAULT true,
  rbac_logging_enabled BOOLEAN DEFAULT true,
  branding_logging_enabled BOOLEAN DEFAULT true,
  subscription_logging_enabled BOOLEAN DEFAULT true,
  developer_portal_logging_enabled BOOLEAN DEFAULT false,
  
  -- Compliance settings
  compliance_mode VARCHAR(50) DEFAULT 'standard', -- 'standard', 'strict', 'minimal'
  auto_tagging_enabled BOOLEAN DEFAULT true,
  
  -- Retention settings
  retention_days INTEGER DEFAULT 365,
  auto_archive_enabled BOOLEAN DEFAULT true,
  archive_after_days INTEGER DEFAULT 90,
  
  -- Export settings
  export_enabled BOOLEAN DEFAULT true,
  export_formats TEXT[] DEFAULT ARRAY['json', 'csv'],
  
  -- Alerting settings
  alerting_enabled BOOLEAN DEFAULT false,
  alert_on_failures BOOLEAN DEFAULT true,
  alert_threshold INTEGER DEFAULT 10,
  
  -- Region settings
  region VARCHAR(50) DEFAULT 'global',
  region_restricted BOOLEAN DEFAULT false,
  allowed_regions TEXT[],
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  UNIQUE(tenant_id)
);

-- Create default audit config for existing tenants
INSERT INTO public.audit_config (tenant_id)
SELECT tenant_id FROM public.tenants
ON CONFLICT (tenant_id) DO NOTHING;

-- ============================================================================
-- COMPLIANCE TEMPLATES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.compliance_templates (
  template_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  standard VARCHAR(50) NOT NULL, -- 'GDPR', 'HIPAA', 'SOC2', 'PCI-DSS', 'DPDP', 'Custom'
  
  -- Template configuration
  required_fields JSONB DEFAULT '{}',
  retention_days INTEGER DEFAULT 365,
  auto_tags TEXT[],
  region_restrictions TEXT[],
  export_format_required VARCHAR(20),
  
  -- Audit requirements
  min_log_level VARCHAR(20) DEFAULT 'info',
  required_events TEXT[],
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Insert default compliance templates
INSERT INTO public.compliance_templates (name, description, standard, retention_days, auto_tags, required_events) VALUES
('GDPR Compliance', 'EU General Data Protection Regulation requirements', 'GDPR', 730, 
 ARRAY['gdpr', 'privacy', 'data-access'], 
 ARRAY['data.access', 'data.export', 'data.delete', 'consent.update']),
('HIPAA Compliance', 'Health Insurance Portability and Accountability Act', 'HIPAA', 2555, 
 ARRAY['hipaa', 'phi', 'healthcare'], 
 ARRAY['patient.access', 'phi.access', 'phi.export', 'audit.access']),
('SOC2 Compliance', 'Service Organization Control 2', 'SOC2', 365, 
 ARRAY['soc2', 'security', 'availability'], 
 ARRAY['security.incident', 'access.control', 'system.change']),
('PCI-DSS Compliance', 'Payment Card Industry Data Security Standard', 'PCI-DSS', 365, 
 ARRAY['pci', 'payment', 'cardholder-data'], 
 ARRAY['payment.process', 'card.store', 'security.access']),
('DPDP Compliance', 'India Digital Personal Data Protection Act', 'DPDP', 730, 
 ARRAY['dpdp', 'privacy', 'india'], 
 ARRAY['data.access', 'consent.update', 'data.erasure', 'data.portability']),
('Standard Audit', 'Standard audit logging for all operations', 'Custom', 365, 
 ARRAY['standard', 'audit'], 
 ARRAY['user.login', 'user.logout', 'data.create', 'data.update', 'data.delete'])
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- RETENTION POLICIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audit_retention_policies (
  policy_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Policy configuration
  retention_days INTEGER NOT NULL,
  archive_enabled BOOLEAN DEFAULT true,
  archive_after_days INTEGER DEFAULT 90,
  delete_after_retention BOOLEAN DEFAULT false,
  
  -- Apply policy to specific events or all
  event_patterns TEXT[], -- Array of event patterns like 'user.*', 'data.access'
  severity_levels TEXT[], -- Array of severity levels to apply policy
  compliance_tags TEXT[], -- Apply to logs with these compliance tags
  
  -- Regional settings
  regions TEXT[], -- Apply policy to specific regions
  
  priority INTEGER DEFAULT 0, -- Higher priority policies override lower ones
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Insert default retention policies
INSERT INTO public.audit_retention_policies (name, description, retention_days, event_patterns, severity_levels, priority) VALUES
('Critical Events', 'Extended retention for critical security events', 730, 
 ARRAY['security.%', 'auth.%', 'rbac.%'], ARRAY['critical', 'high'], 10),
('Compliance Events', 'Extended retention for compliance-related events', 730, 
 NULL, NULL, 9),
('Standard Retention', 'Standard retention for regular audit logs', 365, 
 NULL, ARRAY['info', 'warning'], 5),
('Low Priority Logs', 'Short retention for low-priority events', 90, 
 ARRAY['system.heartbeat', 'health.check'], ARRAY['info'], 1)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- AUDIT LOG EXPORT HISTORY
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audit_export_history (
  export_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
  admin_id UUID REFERENCES public.admins(admin_id) ON DELETE SET NULL,
  admin_email TEXT,
  
  -- Export details
  export_format VARCHAR(20) NOT NULL, -- 'json', 'csv', 'pdf'
  file_name VARCHAR(255),
  file_size BIGINT,
  file_url TEXT,
  
  -- Export filters
  filters JSONB DEFAULT '{}',
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  record_count INTEGER,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  error_message TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_audit_export_tenant ON public.audit_export_history(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_export_admin ON public.audit_export_history(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_export_status ON public.audit_export_history(status);

-- ============================================================================
-- AUDIT ALERTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audit_alerts (
  alert_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
  partner_id UUID,
  
  -- Alert configuration
  name VARCHAR(100) NOT NULL,
  description TEXT,
  alert_type VARCHAR(50) NOT NULL, -- 'threshold', 'pattern', 'anomaly', 'compliance'
  
  -- Trigger conditions
  event_patterns TEXT[],
  severity_levels TEXT[],
  threshold_count INTEGER,
  threshold_window_minutes INTEGER DEFAULT 60,
  
  -- Notification settings
  notification_channels TEXT[] DEFAULT ARRAY['email'], -- 'email', 'sms', 'webhook', 'in_app'
  notification_emails TEXT[],
  webhook_url TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  trigger_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_alerts_tenant ON public.audit_alerts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_alerts_active ON public.audit_alerts(is_active);

-- ============================================================================
-- AUDIT REPORTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audit_reports (
  report_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
  admin_id UUID REFERENCES public.admins(admin_id) ON DELETE SET NULL,
  
  -- Report configuration
  report_name VARCHAR(100) NOT NULL,
  report_type VARCHAR(50) NOT NULL, -- 'compliance', 'security', 'activity', 'custom'
  compliance_standard VARCHAR(50), -- Links to compliance_templates.standard
  
  -- Report parameters
  date_range_start TIMESTAMP WITH TIME ZONE NOT NULL,
  date_range_end TIMESTAMP WITH TIME ZONE NOT NULL,
  filters JSONB DEFAULT '{}',
  
  -- Report data
  summary JSONB DEFAULT '{}',
  details JSONB DEFAULT '{}',
  recommendations TEXT[],
  
  -- Status
  status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'published', 'archived'
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_reports_tenant ON public.audit_reports(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_reports_type ON public.audit_reports(report_type);

-- ============================================================================
-- COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.audit_config IS 'Super admin controlled audit feature toggles per tenant/partner';
COMMENT ON TABLE public.compliance_templates IS 'Predefined compliance standards and requirements';
COMMENT ON TABLE public.audit_retention_policies IS 'Automated retention and archival policies for audit logs';
COMMENT ON TABLE public.audit_export_history IS 'Track all audit log exports for compliance';
COMMENT ON TABLE public.audit_alerts IS 'Real-time alerting based on audit log patterns';
COMMENT ON TABLE public.audit_reports IS 'Scheduled and ad-hoc compliance reports';

COMMENT ON COLUMN public.audit_logs.compliance_tags IS 'Automated tags for compliance categorization (GDPR, HIPAA, etc.)';
COMMENT ON COLUMN public.audit_logs.event IS 'Structured event name (e.g., user.login, data.access, billing.charge)';
COMMENT ON COLUMN public.audit_logs.metadata IS 'Flexible JSON storage for additional context';
COMMENT ON COLUMN public.audit_logs.severity IS 'Log severity: info, warning, error, critical';
COMMENT ON COLUMN public.audit_logs.retention_until IS 'Calculated retention expiry based on policies';
