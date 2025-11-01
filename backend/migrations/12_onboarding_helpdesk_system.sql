-- ============================================================================
-- Migration 12: Advanced Onboarding, Helpdesk, Support & Automation System
-- ============================================================================
-- Implements comprehensive onboarding, helpdesk, support, and automation
-- features with super admin controls for feature gating
-- ============================================================================

-- ============================================================================
-- ONBOARDING MANAGEMENT TABLES
-- ============================================================================

-- Main onboarding/helpdesk tracking table
CREATE TABLE IF NOT EXISTS public.onboarding_helpdesk (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
  partner_id UUID, -- For partner-level onboarding
  user_id UUID, -- References either admins.admin_id or customers.customer_id
  user_type TEXT NOT NULL CHECK (user_type IN ('admin', 'customer', 'partner')),
  
  -- Onboarding status tracking
  onboarding_status TEXT DEFAULT 'not_started' CHECK (onboarding_status IN (
    'not_started', 'in_progress', 'completed', 'skipped', 'blocked'
  )),
  onboarding_step INTEGER DEFAULT 0,
  onboarding_completed_at TIMESTAMP WITH TIME ZONE,
  onboarding_data JSONB DEFAULT '{}', -- Flexible data for onboarding state
  
  -- Activity tracking
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  
  -- Metadata
  notes TEXT,
  tags TEXT[],
  assigned_to UUID, -- References admins.admin_id for support assignment
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Onboarding workflow definitions
CREATE TABLE IF NOT EXISTS public.onboarding_workflows (
  workflow_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
  
  -- Workflow details
  name TEXT NOT NULL,
  description TEXT,
  workflow_type TEXT NOT NULL CHECK (workflow_type IN (
    'tenant', 'partner', 'admin', 'customer'
  )),
  
  -- Workflow configuration
  steps JSONB NOT NULL DEFAULT '[]', -- Array of step definitions
  auto_advance BOOLEAN DEFAULT false, -- Auto-advance to next step
  allow_skip BOOLEAN DEFAULT true,
  require_completion BOOLEAN DEFAULT false,
  
  -- Automation
  trigger_conditions JSONB DEFAULT '{}',
  actions_on_complete JSONB DEFAULT '[]', -- Actions to execute on completion
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Workflow step progress tracking
CREATE TABLE IF NOT EXISTS public.onboarding_progress (
  progress_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  onboarding_id UUID REFERENCES public.onboarding_helpdesk(id) ON DELETE CASCADE NOT NULL,
  workflow_id UUID REFERENCES public.onboarding_workflows(workflow_id) ON DELETE CASCADE NOT NULL,
  
  step_number INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  step_status TEXT DEFAULT 'pending' CHECK (step_status IN (
    'pending', 'in_progress', 'completed', 'skipped', 'failed'
  )),
  
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  data JSONB DEFAULT '{}', -- Step-specific data
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  UNIQUE(onboarding_id, workflow_id, step_number)
);

-- ============================================================================
-- HELPDESK & SUPPORT TICKET SYSTEM
-- ============================================================================

-- Support tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (
  ticket_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  ticket_number TEXT UNIQUE NOT NULL, -- Human-readable ticket number
  
  -- Ticket details
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'technical', 'billing', 'onboarding', 'feature_request', 'bug', 'other'
  )),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN (
    'open', 'in_progress', 'pending', 'resolved', 'closed', 'reopened'
  )),
  
  -- User information
  requester_id UUID NOT NULL, -- References admins or customers
  requester_type TEXT NOT NULL CHECK (requester_type IN ('admin', 'customer')),
  requester_email TEXT,
  requester_name TEXT,
  
  -- Assignment
  assigned_to UUID, -- References admins.admin_id
  assigned_at TIMESTAMP WITH TIME ZONE,
  
  -- Resolution
  resolved_by UUID, -- References admins.admin_id
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  
  -- Escalation
  escalated BOOLEAN DEFAULT false,
  escalated_at TIMESTAMP WITH TIME ZONE,
  escalation_reason TEXT,
  
  -- SLA tracking
  response_due_at TIMESTAMP WITH TIME ZONE,
  resolution_due_at TIMESTAMP WITH TIME ZONE,
  first_response_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  tags TEXT[],
  attachments JSONB DEFAULT '[]',
  related_tickets UUID[],
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Ticket comments/replies
CREATE TABLE IF NOT EXISTS public.ticket_comments (
  comment_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ticket_id UUID REFERENCES public.support_tickets(ticket_id) ON DELETE CASCADE NOT NULL,
  
  -- Comment details
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false, -- Internal notes vs customer-visible
  
  -- Author
  author_id UUID NOT NULL,
  author_type TEXT NOT NULL CHECK (author_type IN ('admin', 'customer', 'system')),
  author_name TEXT,
  
  -- Metadata
  attachments JSONB DEFAULT '[]',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Ticket templates
CREATE TABLE IF NOT EXISTS public.ticket_templates (
  template_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
  
  -- Template details
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  
  -- Template content
  subject_template TEXT NOT NULL,
  description_template TEXT NOT NULL,
  default_priority TEXT DEFAULT 'medium',
  default_tags TEXT[],
  
  -- Configuration
  auto_assign_rules JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================================================
-- GUIDED TOURS
-- ============================================================================

-- Guided tour definitions
CREATE TABLE IF NOT EXISTS public.guided_tours (
  tour_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
  
  -- Tour details
  name TEXT NOT NULL,
  description TEXT,
  tour_type TEXT NOT NULL CHECK (tour_type IN (
    'onboarding', 'feature', 'admin', 'customer'
  )),
  target_audience TEXT NOT NULL CHECK (target_audience IN (
    'admin', 'customer', 'super_admin', 'all'
  )),
  
  -- Tour configuration
  steps JSONB NOT NULL DEFAULT '[]', -- Array of tour step definitions
  trigger_event TEXT, -- Event that triggers the tour
  trigger_conditions JSONB DEFAULT '{}',
  
  -- Display settings
  is_mandatory BOOLEAN DEFAULT false,
  can_skip BOOLEAN DEFAULT true,
  show_progress BOOLEAN DEFAULT true,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- User tour progress
CREATE TABLE IF NOT EXISTS public.tour_progress (
  progress_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tour_id UUID REFERENCES public.guided_tours(tour_id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('admin', 'customer')),
  
  current_step INTEGER DEFAULT 0,
  status TEXT DEFAULT 'not_started' CHECK (status IN (
    'not_started', 'in_progress', 'completed', 'skipped', 'dismissed'
  )),
  
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  last_viewed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  UNIQUE(tour_id, user_id, user_type)
);

-- ============================================================================
-- AUTOMATION SYSTEM
-- ============================================================================

-- Automation rules
CREATE TABLE IF NOT EXISTS public.automation_rules (
  rule_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
  
  -- Rule details
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL CHECK (rule_type IN (
    'onboarding', 'ticket', 'notification', 'workflow', 'escalation'
  )),
  
  -- Trigger configuration
  trigger_event TEXT NOT NULL, -- Event that triggers the rule
  trigger_conditions JSONB NOT NULL DEFAULT '{}', -- Conditions to evaluate
  
  -- Actions
  actions JSONB NOT NULL DEFAULT '[]', -- Array of actions to execute
  
  -- Scheduling
  execution_order INTEGER DEFAULT 0,
  delay_seconds INTEGER DEFAULT 0,
  max_executions INTEGER, -- Null for unlimited
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_executed_at TIMESTAMP WITH TIME ZONE,
  execution_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Automation execution logs
CREATE TABLE IF NOT EXISTS public.automation_logs (
  log_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  rule_id UUID REFERENCES public.automation_rules(rule_id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  
  -- Execution details
  trigger_event TEXT NOT NULL,
  trigger_data JSONB DEFAULT '{}',
  
  -- Results
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'partial')),
  actions_executed JSONB DEFAULT '[]',
  error_message TEXT,
  
  execution_time_ms INTEGER,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================================================
-- SELF-SERVICE ACTIONS
-- ============================================================================

-- Self-service action definitions
CREATE TABLE IF NOT EXISTS public.self_service_actions (
  action_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
  
  -- Action details
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'form', 'wizard', 'link', 'script', 'api_call'
  )),
  
  -- Configuration
  config JSONB NOT NULL DEFAULT '{}',
  required_permissions TEXT[],
  
  -- Display
  icon TEXT,
  button_text TEXT,
  display_order INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Self-service action usage logs
CREATE TABLE IF NOT EXISTS public.self_service_logs (
  log_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  action_id UUID REFERENCES public.self_service_actions(action_id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  
  user_id UUID NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('admin', 'customer')),
  
  status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  input_data JSONB DEFAULT '{}',
  result_data JSONB DEFAULT '{}',
  error_message TEXT,
  
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================================================
-- SUPER ADMIN FEATURE TOGGLES
-- ============================================================================

-- Add onboarding/helpdesk/support feature flags to feature_flags table
ALTER TABLE public.feature_flags
ADD COLUMN IF NOT EXISTS onboarding_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_workflows_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS helpdesk_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS support_tickets_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS guided_tours_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS automation_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS self_service_portal_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ticket_templates_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ticket_escalation_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS advanced_automation_enabled BOOLEAN DEFAULT false;

-- Onboarding/helpdesk configuration per tenant
CREATE TABLE IF NOT EXISTS public.onboarding_helpdesk_config (
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE PRIMARY KEY,
  
  -- Onboarding settings
  onboarding_auto_start BOOLEAN DEFAULT true,
  onboarding_require_completion BOOLEAN DEFAULT false,
  onboarding_reminder_enabled BOOLEAN DEFAULT true,
  onboarding_reminder_days INTEGER DEFAULT 3,
  
  -- Helpdesk settings
  ticket_auto_assignment BOOLEAN DEFAULT false,
  ticket_auto_close_days INTEGER,
  ticket_escalation_hours INTEGER DEFAULT 24,
  ticket_response_sla_hours INTEGER DEFAULT 4,
  ticket_resolution_sla_hours INTEGER DEFAULT 48,
  
  -- Support portal settings
  support_portal_public BOOLEAN DEFAULT false,
  support_portal_custom_domain TEXT,
  support_kb_enabled BOOLEAN DEFAULT false,
  
  -- Automation settings
  automation_enabled BOOLEAN DEFAULT true,
  automation_max_actions_per_hour INTEGER DEFAULT 100,
  
  -- Notification settings
  notify_on_ticket_created BOOLEAN DEFAULT true,
  notify_on_ticket_assigned BOOLEAN DEFAULT true,
  notify_on_ticket_resolved BOOLEAN DEFAULT true,
  notify_on_onboarding_complete BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Insert default config for existing tenants
INSERT INTO public.onboarding_helpdesk_config (tenant_id)
SELECT tenant_id FROM public.tenants
ON CONFLICT (tenant_id) DO NOTHING;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Onboarding indexes
CREATE INDEX IF NOT EXISTS idx_onboarding_helpdesk_tenant_id ON public.onboarding_helpdesk(tenant_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_helpdesk_user_id ON public.onboarding_helpdesk(user_id, user_type);
CREATE INDEX IF NOT EXISTS idx_onboarding_helpdesk_status ON public.onboarding_helpdesk(onboarding_status);
CREATE INDEX IF NOT EXISTS idx_onboarding_helpdesk_assigned_to ON public.onboarding_helpdesk(assigned_to);

CREATE INDEX IF NOT EXISTS idx_onboarding_workflows_tenant_id ON public.onboarding_workflows(tenant_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_workflows_type ON public.onboarding_workflows(workflow_type);
CREATE INDEX IF NOT EXISTS idx_onboarding_workflows_active ON public.onboarding_workflows(is_active);

CREATE INDEX IF NOT EXISTS idx_onboarding_progress_onboarding_id ON public.onboarding_progress(onboarding_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_workflow_id ON public.onboarding_progress(workflow_id);

-- Ticket indexes
CREATE INDEX IF NOT EXISTS idx_support_tickets_tenant_id ON public.support_tickets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_ticket_number ON public.support_tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_support_tickets_requester ON public.support_tickets(requester_id, requester_type);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON public.support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON public.support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_category ON public.support_tickets(category);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON public.support_tickets(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket_id ON public.ticket_comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_author ON public.ticket_comments(author_id, author_type);

CREATE INDEX IF NOT EXISTS idx_ticket_templates_tenant_id ON public.ticket_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ticket_templates_category ON public.ticket_templates(category);

-- Tour indexes
CREATE INDEX IF NOT EXISTS idx_guided_tours_tenant_id ON public.guided_tours(tenant_id);
CREATE INDEX IF NOT EXISTS idx_guided_tours_type ON public.guided_tours(tour_type);
CREATE INDEX IF NOT EXISTS idx_guided_tours_active ON public.guided_tours(is_active);

CREATE INDEX IF NOT EXISTS idx_tour_progress_tour_id ON public.tour_progress(tour_id);
CREATE INDEX IF NOT EXISTS idx_tour_progress_user ON public.tour_progress(user_id, user_type);

-- Automation indexes
CREATE INDEX IF NOT EXISTS idx_automation_rules_tenant_id ON public.automation_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_type ON public.automation_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_automation_rules_active ON public.automation_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_automation_rules_trigger ON public.automation_rules(trigger_event);

CREATE INDEX IF NOT EXISTS idx_automation_logs_rule_id ON public.automation_logs(rule_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_tenant_id ON public.automation_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_executed_at ON public.automation_logs(executed_at DESC);

-- Self-service indexes
CREATE INDEX IF NOT EXISTS idx_self_service_actions_tenant_id ON public.self_service_actions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_self_service_actions_category ON public.self_service_actions(category);
CREATE INDEX IF NOT EXISTS idx_self_service_actions_active ON public.self_service_actions(is_active);

CREATE INDEX IF NOT EXISTS idx_self_service_logs_action_id ON public.self_service_logs(action_id);
CREATE INDEX IF NOT EXISTS idx_self_service_logs_tenant_id ON public.self_service_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_self_service_logs_user ON public.self_service_logs(user_id, user_type);

-- ============================================================================
-- COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.onboarding_helpdesk IS 'Main tracking table for user onboarding status and helpdesk data';
COMMENT ON TABLE public.onboarding_workflows IS 'Workflow definitions for onboarding processes';
COMMENT ON TABLE public.onboarding_progress IS 'Tracks progress through onboarding workflow steps';
COMMENT ON TABLE public.support_tickets IS 'Support ticket management with SLA tracking';
COMMENT ON TABLE public.ticket_comments IS 'Comments and replies on support tickets';
COMMENT ON TABLE public.ticket_templates IS 'Pre-defined templates for common ticket types';
COMMENT ON TABLE public.guided_tours IS 'Guided tour definitions for feature walkthroughs';
COMMENT ON TABLE public.tour_progress IS 'User progress through guided tours';
COMMENT ON TABLE public.automation_rules IS 'Automation rules for workflows and actions';
COMMENT ON TABLE public.automation_logs IS 'Execution logs for automation rules';
COMMENT ON TABLE public.self_service_actions IS 'Self-service action definitions for support portal';
COMMENT ON TABLE public.self_service_logs IS 'Usage logs for self-service actions';
COMMENT ON TABLE public.onboarding_helpdesk_config IS 'Tenant-specific configuration for onboarding and helpdesk features';

COMMENT ON COLUMN public.feature_flags.onboarding_enabled IS 'Enable onboarding system for this tenant';
COMMENT ON COLUMN public.feature_flags.helpdesk_enabled IS 'Enable helpdesk/ticketing system for this tenant';
COMMENT ON COLUMN public.feature_flags.guided_tours_enabled IS 'Enable guided tours for this tenant';
COMMENT ON COLUMN public.feature_flags.automation_enabled IS 'Enable automation rules for this tenant';
COMMENT ON COLUMN public.feature_flags.self_service_portal_enabled IS 'Enable self-service support portal for this tenant';
