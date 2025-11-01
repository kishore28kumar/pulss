-- ============================================================================
-- Migration 08: Audit Log System
-- ============================================================================
-- Creates comprehensive audit log for admin actions
-- ============================================================================

-- Audit log table for tracking admin actions
CREATE TABLE IF NOT EXISTS public.audit_logs (
  log_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
  
  -- Who performed the action
  admin_id UUID REFERENCES public.admins(admin_id) ON DELETE SET NULL,
  admin_email TEXT,
  
  -- What action was performed
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'login', 'logout', etc.
  resource_type TEXT NOT NULL, -- 'product', 'order', 'customer', 'settings', etc.
  resource_id UUID,
  
  -- Request details
  ip_address INET,
  user_agent TEXT,
  request_method TEXT, -- 'GET', 'POST', 'PUT', 'DELETE'
  request_path TEXT,
  
  -- Change details
  old_values JSONB,
  new_values JSONB,
  
  -- Additional context
  description TEXT,
  status TEXT DEFAULT 'success', -- 'success', 'failure', 'error'
  error_message TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON public.audit_logs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin ON public.audit_logs(admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action, resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Partition by month for better performance (optional, for high-volume systems)
-- Uncomment if you expect very high audit log volume
-- CREATE TABLE IF NOT EXISTS public.audit_logs_2024_01 PARTITION OF public.audit_logs
-- FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Comments
COMMENT ON TABLE public.audit_logs IS 'Comprehensive audit trail of all admin actions for compliance and security';
COMMENT ON COLUMN public.audit_logs.old_values IS 'JSON snapshot of resource before change';
COMMENT ON COLUMN public.audit_logs.new_values IS 'JSON snapshot of resource after change';
COMMENT ON COLUMN public.audit_logs.ip_address IS 'IP address of the request for security tracking';
