-- ============================================================================
-- Advanced Notification and Messaging System Migration
-- ============================================================================
-- This migration implements a comprehensive notification system with:
-- - Flexible notification types and templates
-- - Tenant-branded email templates
-- - Notification scheduling and automation
-- - Delivery status tracking and audit logs
-- - Analytics and reporting
-- - User preferences and opt-in/out management
-- ============================================================================

-- ============================================================================
-- 1. NOTIFICATION TYPES AND TEMPLATES
-- ============================================================================

-- Notification types table (defines available notification categories)
CREATE TABLE IF NOT EXISTS public.notification_types (
  type_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type_code VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'order_update', 'password_reset', 'billing'
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL, -- 'transactional', 'marketing', 'system', 'security'
  default_enabled BOOLEAN DEFAULT true,
  can_opt_out BOOLEAN DEFAULT true, -- false for critical notifications
  icon VARCHAR(50), -- icon name for UI
  priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Notification templates table (tenant-specific branded templates)
CREATE TABLE IF NOT EXISTS public.notification_templates (
  template_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
  type_code VARCHAR(50) NOT NULL, -- references notification_types.type_code
  channel VARCHAR(20) NOT NULL, -- 'email', 'sms', 'push', 'whatsapp', 'in_app'
  subject TEXT, -- for email/push title
  template_body TEXT NOT NULL, -- supports variables like {{customer_name}}, {{order_id}}
  template_html TEXT, -- HTML version for email
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(tenant_id, type_code, channel)
);

-- ============================================================================
-- 2. ENHANCED NOTIFICATIONS TABLE
-- ============================================================================

-- Main notifications table (enhanced from existing structure)
-- This table stores all notifications sent to users
CREATE TABLE IF NOT EXISTS public.notifications_enhanced (
  notification_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  type_code VARCHAR(50) NOT NULL, -- references notification_types.type_code
  recipient_type VARCHAR(20) NOT NULL, -- 'admin', 'customer'
  recipient_id UUID NOT NULL, -- admin_id or customer_id
  channel VARCHAR(20) NOT NULL, -- 'email', 'sms', 'push', 'whatsapp', 'in_app'
  priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  
  -- Content
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_html TEXT, -- HTML version
  action_url TEXT, -- deep link or URL for action
  action_label TEXT, -- button text like "View Order"
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed', 'read'
  read_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  
  -- Metadata
  metadata JSONB, -- flexible data storage for custom fields
  scheduled_for TIMESTAMP WITH TIME ZONE, -- for scheduled notifications
  expires_at TIMESTAMP WITH TIME ZONE, -- for time-sensitive notifications
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================================================
-- 3. USER NOTIFICATION PREFERENCES
-- ============================================================================

-- Admin notification preferences
CREATE TABLE IF NOT EXISTS public.admin_notification_preferences (
  preference_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  admin_id UUID REFERENCES public.admins(admin_id) ON DELETE CASCADE NOT NULL,
  type_code VARCHAR(50) NOT NULL, -- references notification_types.type_code
  
  -- Channel preferences
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  push_enabled BOOLEAN DEFAULT true,
  whatsapp_enabled BOOLEAN DEFAULT false,
  in_app_enabled BOOLEAN DEFAULT true,
  
  -- Settings
  digest_frequency VARCHAR(20), -- null, 'immediate', 'hourly', 'daily', 'weekly'
  quiet_hours_start TIME, -- e.g., '22:00:00'
  quiet_hours_end TIME, -- e.g., '08:00:00'
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(admin_id, type_code)
);

-- Customer notification preferences
CREATE TABLE IF NOT EXISTS public.customer_notification_preferences (
  preference_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(customer_id) ON DELETE CASCADE NOT NULL,
  type_code VARCHAR(50) NOT NULL, -- references notification_types.type_code
  
  -- Channel preferences
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true,
  whatsapp_enabled BOOLEAN DEFAULT true,
  in_app_enabled BOOLEAN DEFAULT true,
  
  -- Settings
  digest_frequency VARCHAR(20), -- null, 'immediate', 'hourly', 'daily', 'weekly'
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(customer_id, type_code)
);

-- ============================================================================
-- 4. NOTIFICATION AUDIT LOG
-- ============================================================================

-- Comprehensive audit trail for all notification activity
CREATE TABLE IF NOT EXISTS public.notification_audit_log (
  audit_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  notification_id UUID REFERENCES public.notifications_enhanced(notification_id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
  
  -- Actor information
  actor_type VARCHAR(20), -- 'system', 'admin', 'customer', 'scheduler'
  actor_id UUID, -- admin_id or customer_id if applicable
  
  -- Event details
  event_type VARCHAR(50) NOT NULL, -- 'created', 'sent', 'delivered', 'failed', 'read', 'deleted'
  channel VARCHAR(20), -- 'email', 'sms', 'push', 'whatsapp', 'in_app'
  
  -- Delivery details
  provider VARCHAR(50), -- 'smtp', 'twilio', 'fcm', 'whatsapp_business', 'internal'
  provider_message_id TEXT, -- external provider's message ID
  delivery_status VARCHAR(20), -- 'sent', 'delivered', 'bounced', 'failed'
  delivery_metadata JSONB, -- provider response, error details, etc.
  
  -- Context
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================================================
-- 5. SCHEDULED NOTIFICATIONS
-- ============================================================================

-- Scheduled/recurring notifications
CREATE TABLE IF NOT EXISTS public.notification_schedules (
  schedule_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  type_code VARCHAR(50) NOT NULL,
  
  -- Schedule configuration
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  
  -- Recipients
  recipient_type VARCHAR(20) NOT NULL, -- 'admin', 'customer', 'all_customers', 'segment'
  recipient_ids UUID[], -- specific recipients if applicable
  segment_filter JSONB, -- for dynamic segments (e.g., {"loyalty_points": {"$gt": 100}})
  
  -- Content
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  channel VARCHAR(20) NOT NULL,
  action_url TEXT,
  action_label TEXT,
  
  -- Scheduling
  schedule_type VARCHAR(20) NOT NULL, -- 'once', 'recurring', 'trigger'
  scheduled_time TIMESTAMP WITH TIME ZONE, -- for 'once' type
  recurrence_rule VARCHAR(255), -- cron-like or RRULE for 'recurring'
  trigger_event VARCHAR(50), -- for 'trigger' type (e.g., 'order_placed', 'customer_signup')
  trigger_delay_minutes INTEGER, -- delay after trigger event
  
  -- Execution tracking
  last_executed_at TIMESTAMP WITH TIME ZONE,
  next_execution_at TIMESTAMP WITH TIME ZONE,
  execution_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================================================
-- 6. NOTIFICATION ANALYTICS
-- ============================================================================

-- Daily notification metrics per tenant
CREATE TABLE IF NOT EXISTS public.notification_analytics (
  analytics_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  type_code VARCHAR(50) NOT NULL,
  channel VARCHAR(20) NOT NULL,
  
  -- Metrics
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  read_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  
  -- Rates
  delivery_rate DECIMAL(5, 2), -- percentage
  read_rate DECIMAL(5, 2), -- percentage
  click_rate DECIMAL(5, 2), -- percentage
  
  -- Costs (if applicable)
  cost_amount DECIMAL(10, 2),
  cost_currency VARCHAR(3) DEFAULT 'USD',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(tenant_id, date, type_code, channel)
);

-- ============================================================================
-- 7. EMAIL CONFIGURATION
-- ============================================================================

-- Tenant-specific email configuration (SMTP settings, branding)
CREATE TABLE IF NOT EXISTS public.email_configurations (
  config_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- SMTP settings (optional, falls back to system default)
  smtp_host VARCHAR(255),
  smtp_port INTEGER,
  smtp_secure BOOLEAN DEFAULT true,
  smtp_user VARCHAR(255),
  smtp_password_encrypted TEXT, -- encrypted password
  from_email VARCHAR(255) NOT NULL,
  from_name VARCHAR(255) NOT NULL,
  reply_to_email VARCHAR(255),
  
  -- Branding
  logo_url TEXT,
  brand_color VARCHAR(7), -- hex color
  header_image_url TEXT,
  footer_text TEXT,
  
  -- Settings
  enable_custom_smtp BOOLEAN DEFAULT false,
  enable_email_tracking BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================================================
-- 8. INDEXES FOR PERFORMANCE
-- ============================================================================

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_enhanced_tenant ON public.notifications_enhanced(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_enhanced_recipient ON public.notifications_enhanced(recipient_type, recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_enhanced_status ON public.notifications_enhanced(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_enhanced_type ON public.notifications_enhanced(type_code);
CREATE INDEX IF NOT EXISTS idx_notifications_enhanced_scheduled ON public.notifications_enhanced(scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_notifications_enhanced_unread ON public.notifications_enhanced(recipient_id, status) WHERE status != 'read';

-- Audit log indexes
CREATE INDEX IF NOT EXISTS idx_notification_audit_log_notification ON public.notification_audit_log(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_audit_log_tenant ON public.notification_audit_log(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_audit_log_event ON public.notification_audit_log(event_type, created_at DESC);

-- Schedule indexes
CREATE INDEX IF NOT EXISTS idx_notification_schedules_tenant ON public.notification_schedules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notification_schedules_active ON public.notification_schedules(is_active, next_execution_at);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_notification_analytics_tenant_date ON public.notification_analytics(tenant_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_notification_analytics_type ON public.notification_analytics(type_code, date DESC);

-- Preferences indexes
CREATE INDEX IF NOT EXISTS idx_admin_notif_prefs_admin ON public.admin_notification_preferences(admin_id);
CREATE INDEX IF NOT EXISTS idx_customer_notif_prefs_customer ON public.customer_notification_preferences(customer_id);

-- ============================================================================
-- 9. SEED DEFAULT NOTIFICATION TYPES
-- ============================================================================

INSERT INTO public.notification_types (type_code, name, description, category, default_enabled, can_opt_out, priority) VALUES
-- Transactional notifications (cannot opt out)
('order_placed', 'Order Placed', 'Notification when a new order is placed', 'transactional', true, false, 'high'),
('order_confirmed', 'Order Confirmed', 'Notification when order is confirmed by admin', 'transactional', true, false, 'high'),
('order_preparing', 'Order Preparing', 'Notification when order is being prepared', 'transactional', true, false, 'medium'),
('order_ready', 'Order Ready', 'Notification when order is ready for pickup/delivery', 'transactional', true, false, 'high'),
('order_out_for_delivery', 'Out for Delivery', 'Notification when order is out for delivery', 'transactional', true, false, 'high'),
('order_delivered', 'Order Delivered', 'Notification when order is delivered', 'transactional', true, false, 'high'),
('order_cancelled', 'Order Cancelled', 'Notification when order is cancelled', 'transactional', true, false, 'high'),
('payment_received', 'Payment Received', 'Notification when payment is received', 'transactional', true, false, 'medium'),
('payment_failed', 'Payment Failed', 'Notification when payment fails', 'transactional', true, false, 'high'),
('refund_processed', 'Refund Processed', 'Notification when refund is processed', 'transactional', true, false, 'medium'),

-- Security notifications (cannot opt out)
('password_reset', 'Password Reset', 'Password reset request notification', 'security', true, false, 'urgent'),
('password_changed', 'Password Changed', 'Password successfully changed notification', 'security', true, false, 'high'),
('login_new_device', 'New Device Login', 'Login from a new device detected', 'security', true, false, 'high'),
('account_locked', 'Account Locked', 'Account locked due to suspicious activity', 'security', true, false, 'urgent'),

-- System notifications (cannot opt out)
('admin_invite', 'Admin Invite', 'Invitation to join as store admin', 'system', true, false, 'high'),
('tenant_created', 'Store Created', 'New store/tenant created notification', 'system', true, false, 'medium'),
('system_maintenance', 'System Maintenance', 'Scheduled maintenance notification', 'system', true, false, 'medium'),

-- Billing notifications (cannot opt out for critical)
('billing_invoice', 'Billing Invoice', 'Monthly billing invoice', 'billing', true, false, 'high'),
('billing_payment_failed', 'Payment Failed', 'Billing payment failed', 'billing', true, false, 'urgent'),
('billing_payment_success', 'Payment Success', 'Billing payment successful', 'billing', true, false, 'medium'),
('subscription_expiring', 'Subscription Expiring', 'Subscription expiring soon', 'billing', true, false, 'high'),

-- Marketing notifications (can opt out)
('promo_new_offer', 'New Offer', 'New promotional offer available', 'marketing', true, true, 'low'),
('promo_discount', 'Discount Alert', 'Special discount notification', 'marketing', true, true, 'low'),
('product_back_in_stock', 'Back in Stock', 'Product is back in stock', 'marketing', true, true, 'medium'),
('abandoned_cart', 'Abandoned Cart', 'Reminder about items in cart', 'marketing', true, true, 'low'),
('loyalty_points', 'Loyalty Points', 'Loyalty points earned or milestone reached', 'marketing', true, true, 'low'),

-- Operational notifications (can opt out)
('low_stock_alert', 'Low Stock Alert', 'Product stock is running low', 'operational', true, true, 'medium'),
('new_customer', 'New Customer', 'New customer registered', 'operational', true, true, 'low'),
('customer_feedback', 'Customer Feedback', 'New customer feedback received', 'operational', true, true, 'low'),
('daily_summary', 'Daily Summary', 'Daily business summary report', 'operational', true, true, 'low'),
('weekly_report', 'Weekly Report', 'Weekly business report', 'operational', true, true, 'low')
ON CONFLICT (type_code) DO NOTHING;

-- ============================================================================
-- 10. DEFAULT EMAIL TEMPLATES
-- ============================================================================

-- Note: Templates use Handlebars-style syntax {{variable_name}}
-- Actual templates should be created via API or admin interface

COMMENT ON TABLE public.notification_types IS 'Defines all available notification types in the system';
COMMENT ON TABLE public.notification_templates IS 'Tenant-specific notification templates with branding';
COMMENT ON TABLE public.notifications_enhanced IS 'Main notifications table with comprehensive tracking';
COMMENT ON TABLE public.notification_audit_log IS 'Complete audit trail for all notification events';
COMMENT ON TABLE public.notification_schedules IS 'Scheduled and recurring notifications';
COMMENT ON TABLE public.notification_analytics IS 'Aggregated notification metrics for reporting';
COMMENT ON TABLE public.email_configurations IS 'Tenant-specific email SMTP and branding settings';
COMMENT ON TABLE public.admin_notification_preferences IS 'Admin notification preferences and settings';
COMMENT ON TABLE public.customer_notification_preferences IS 'Customer notification preferences and settings';
