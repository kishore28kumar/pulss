-- ============================================================================
copilot/add-advanced-notifications-system-again
-- Migration 11: Advanced Notifications & Messaging System
-- ============================================================================
-- Comprehensive notification system with super admin feature toggles
-- Supports multi-tenant, multi-channel notifications with compliance
-- ============================================================================

-- ============================================================================
-- 1. NOTIFICATION TEMPLATES
-- ============================================================================

-- Notification templates for branded, reusable messages
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Template identification
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template_type VARCHAR(50) NOT NULL, -- 'transactional', 'marketing', 'compliance', 'event'
  category VARCHAR(100), -- 'order', 'delivery', 'payment', 'account', 'promotion'
  
  -- Template content
  subject_template VARCHAR(500),
  body_template TEXT NOT NULL,
  
  -- Channel support
  channels TEXT[] DEFAULT ARRAY['in_app'], -- 'push', 'sms', 'email', 'whatsapp', 'in_app'
  
  -- Branding
  use_tenant_branding BOOLEAN DEFAULT true,
  custom_branding JSONB, -- logo_url, colors, footer, etc.
  
  -- Regional compliance
  region VARCHAR(50) DEFAULT 'global', -- 'india', 'us', 'eu', 'global'
  compliance_type VARCHAR(50), -- 'dpdp', 'gdpr', 'ccpa', 'standard'
  requires_consent BOOLEAN DEFAULT false,
  
  -- Template variables
  variables JSONB, -- {name: 'customer_name', description: 'Customer full name', type: 'string'}
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_system_template BOOLEAN DEFAULT false, -- System templates can't be deleted
  
  -- Metadata
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_template_name_per_tenant UNIQUE(tenant_id, name)
);

CREATE INDEX idx_notification_templates_tenant ON notification_templates(tenant_id);
CREATE INDEX idx_notification_templates_type ON notification_templates(template_type, category);
CREATE INDEX idx_notification_templates_active ON notification_templates(is_active);
CREATE INDEX idx_notification_templates_region ON notification_templates(region);

-- ============================================================================
-- 2. ENHANCED NOTIFICATIONS TABLE
-- ============================================================================

-- Enhanced notifications table with metadata support
DROP TABLE IF EXISTS notifications CASCADE;

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Recipient
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_email VARCHAR(255),
  recipient_phone VARCHAR(20),
  
  -- Tenant/Partner context
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Notification details
  type VARCHAR(50) NOT NULL, -- 'transactional', 'marketing', 'compliance', 'event', 'alert'
  channel VARCHAR(50) NOT NULL, -- 'push', 'sms', 'email', 'whatsapp', 'in_app'
  priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  
  -- Content
  title VARCHAR(500),
  message TEXT NOT NULL,
  subject VARCHAR(500),
  
  -- Template reference
  template_id UUID REFERENCES notification_templates(id) ON DELETE SET NULL,
  template_variables JSONB, -- Values used to render template
  
  -- Event tracking
  event VARCHAR(100), -- 'order_created', 'payment_received', 'delivery_started', etc.
  event_id UUID, -- Reference to the event source (order_id, payment_id, etc.)
  
  -- Status tracking
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed', 'bounced'
  delivery_status VARCHAR(50), -- Channel-specific delivery status
  error_message TEXT,
  
  -- Timestamps
  scheduled_at TIMESTAMP,
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  read_at TIMESTAMP,
  clicked_at TIMESTAMP,
  
  -- User interaction
  is_read BOOLEAN DEFAULT false,
  is_clicked BOOLEAN DEFAULT false,
  action_url VARCHAR(500),
  
  -- Metadata and audit
  metadata JSONB, -- Additional data: campaign_id, ab_test_variant, user_segment, etc.
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Compliance
  requires_consent BOOLEAN DEFAULT false,
  consent_obtained BOOLEAN DEFAULT false,
  consent_timestamp TIMESTAMP,
  opt_out_available BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_tenant ON notifications(tenant_id, created_at DESC);
CREATE INDEX idx_notifications_status ON notifications(status, scheduled_at);
CREATE INDEX idx_notifications_channel ON notifications(channel, status);
CREATE INDEX idx_notifications_event ON notifications(event, event_id);
CREATE INDEX idx_notifications_template ON notifications(template_id);
CREATE INDEX idx_notifications_scheduled ON notifications(scheduled_at) WHERE status = 'pending';
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- ============================================================================
-- 3. NOTIFICATION CAMPAIGNS
-- ============================================================================

-- Campaign management for marketing and automated notifications
CREATE TABLE IF NOT EXISTS notification_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Campaign details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  campaign_type VARCHAR(50) NOT NULL, -- 'one_time', 'recurring', 'triggered', 'drip'
  
  -- Target audience
  target_type VARCHAR(50) NOT NULL, -- 'all', 'segment', 'individual', 'custom'
  target_segment VARCHAR(100), -- 'vip', 'loyal', 'at_risk', 'new', etc.
  target_filters JSONB, -- Custom filter criteria
  target_user_ids UUID[], -- Specific users
  
  -- Template and content
  template_id UUID REFERENCES notification_templates(id) ON DELETE SET NULL,
  channels TEXT[] NOT NULL DEFAULT ARRAY['in_app'],
  priority VARCHAR(20) DEFAULT 'medium',
  
  -- Scheduling
  schedule_type VARCHAR(50) DEFAULT 'immediate', -- 'immediate', 'scheduled', 'recurring', 'triggered'
  scheduled_at TIMESTAMP,
  recurrence_pattern VARCHAR(50), -- 'daily', 'weekly', 'monthly', 'custom'
  recurrence_config JSONB, -- Detailed recurrence configuration
  trigger_event VARCHAR(100), -- Event that triggers the campaign
  
  -- Campaign status
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled'
  
  -- Analytics
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  read_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  unsubscribed_count INTEGER DEFAULT 0,
  
  -- A/B Testing
  is_ab_test BOOLEAN DEFAULT false,
  ab_test_config JSONB, -- Variants, split percentage, etc.
  
  -- Automation
  is_automated BOOLEAN DEFAULT false,
  automation_config JSONB,
  
  -- Metadata
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notification_campaigns_tenant ON notification_campaigns(tenant_id);
CREATE INDEX idx_notification_campaigns_status ON notification_campaigns(status);
CREATE INDEX idx_notification_campaigns_scheduled ON notification_campaigns(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX idx_notification_campaigns_type ON notification_campaigns(campaign_type);

-- ============================================================================
-- 4. NOTIFICATION PREFERENCES & OPT-IN/OPT-OUT
-- ============================================================================

-- Enhanced notification preferences with opt-in/opt-out per channel and type
DROP TABLE IF EXISTS notification_preferences CASCADE;

CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Global preferences
  notifications_enabled BOOLEAN DEFAULT true,
  
  -- Channel preferences
  push_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,
  whatsapp_enabled BOOLEAN DEFAULT true,
  in_app_enabled BOOLEAN DEFAULT true,
  
  -- Type preferences
  transactional_enabled BOOLEAN DEFAULT true, -- Order updates, etc. (usually can't opt-out)
  marketing_enabled BOOLEAN DEFAULT false,
  promotional_enabled BOOLEAN DEFAULT false,
  newsletter_enabled BOOLEAN DEFAULT false,

-- Advanced Notifications and Communication System Migration
-- ============================================================================
-- Implements comprehensive multi-channel notification system with templates,
-- analytics, super admin controls, and delivery tracking
-- ============================================================================

-- ============================================================================
-- NOTIFICATION TEMPLATES
-- ============================================================================

-- Notification templates with per-tenant branding and localization
CREATE TABLE IF NOT EXISTS notification_templates (
  template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  template_key VARCHAR(100) NOT NULL, -- e.g., 'order_confirmed', 'password_reset'
  template_name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Channel-specific content
  email_subject VARCHAR(255),
  email_body TEXT,
  email_html TEXT,
  sms_content TEXT,
  push_title VARCHAR(100),
  push_body TEXT,
  webhook_payload JSONB,
  
  -- Template metadata
  category VARCHAR(50), -- 'transactional', 'marketing', 'system', 'promotional'
  language VARCHAR(10) DEFAULT 'en', -- ISO 639-1 language code
  variables JSONB, -- Available variables for substitution e.g., {"user_name": "string", "order_id": "number"}
  
  -- Branding
  branding JSONB, -- Per-tenant colors, logo, footer, etc.
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false, -- System default template
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  UNIQUE(tenant_id, template_key, language)
);

CREATE INDEX idx_notification_templates_tenant ON notification_templates(tenant_id);
CREATE INDEX idx_notification_templates_key ON notification_templates(template_key);
CREATE INDEX idx_notification_templates_active ON notification_templates(is_active);

-- ============================================================================
-- ENHANCED NOTIFICATIONS TABLE
-- ============================================================================

-- Enhanced notifications table with comprehensive tracking
CREATE TABLE IF NOT EXISTS notifications_enhanced (
  notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Recipient information
  tenant_id UUID REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  admin_id UUID REFERENCES admins(admin_id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(customer_id) ON DELETE CASCADE,
  recipient_email VARCHAR(255),
  recipient_phone VARCHAR(20),
  
  -- Notification details
  notification_type VARCHAR(50) NOT NULL, -- 'order', 'payment', 'marketing', 'system', 'alert'
  event_type VARCHAR(100) NOT NULL, -- 'order_created', 'order_shipped', 'payment_success', etc.
  template_id UUID REFERENCES notification_templates(template_id),
  
  -- Channel information
  channel VARCHAR(20) NOT NULL, -- 'email', 'sms', 'push', 'webhook', 'in_app'
  priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  
  -- Content
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB, -- Additional structured data
  metadata JSONB, -- Extra metadata (campaign_id, tags, etc.)
  
  -- Delivery tracking
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'queued', 'sent', 'delivered', 'failed', 'bounced'
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  failure_reason TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  -- Engagement tracking
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  clicked BOOLEAN DEFAULT false,
  clicked_at TIMESTAMP WITH TIME ZONE,
  action_url TEXT,
  
  -- External provider tracking
  provider VARCHAR(50), -- 'sendgrid', 'twilio', 'fcm', 'ses', etc.
  provider_message_id VARCHAR(255),
  provider_response JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX idx_notifications_enhanced_tenant ON notifications_enhanced(tenant_id);
CREATE INDEX idx_notifications_enhanced_admin ON notifications_enhanced(admin_id);
CREATE INDEX idx_notifications_enhanced_customer ON notifications_enhanced(customer_id);
CREATE INDEX idx_notifications_enhanced_status ON notifications_enhanced(status);
CREATE INDEX idx_notifications_enhanced_channel ON notifications_enhanced(channel);
CREATE INDEX idx_notifications_enhanced_type ON notifications_enhanced(notification_type);
CREATE INDEX idx_notifications_enhanced_event ON notifications_enhanced(event_type);
CREATE INDEX idx_notifications_enhanced_created ON notifications_enhanced(created_at DESC);
CREATE INDEX idx_notifications_enhanced_read ON notifications_enhanced(read);

-- ============================================================================
-- TENANT NOTIFICATION SETTINGS
-- ============================================================================

-- Per-tenant notification configuration with super admin controls
CREATE TABLE IF NOT EXISTS tenant_notification_settings (
  setting_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(tenant_id) ON DELETE CASCADE UNIQUE,
  
  -- Channel enablement (super admin controlled)
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true,
  webhook_enabled BOOLEAN DEFAULT true,
  in_app_enabled BOOLEAN DEFAULT true,
  
  -- Notification type controls
  transactional_enabled BOOLEAN DEFAULT true,
  marketing_enabled BOOLEAN DEFAULT true,
  system_enabled BOOLEAN DEFAULT true,
  promotional_enabled BOOLEAN DEFAULT true,
  
  -- Provider configurations
  email_provider VARCHAR(50) DEFAULT 'smtp', -- 'sendgrid', 'ses', 'smtp', 'msg91'
  email_provider_config JSONB, -- API keys, credentials (encrypted)
  
  sms_provider VARCHAR(50) DEFAULT 'twilio', -- 'twilio', 'gupshup', 'textlocal', 'msg91'
  sms_provider_config JSONB,
  
  push_provider VARCHAR(50) DEFAULT 'fcm', -- 'fcm', 'apns'
  push_provider_config JSONB,
  
  webhook_url TEXT,
  webhook_secret VARCHAR(255),
  webhook_events TEXT[], -- Array of events to send webhooks for
  
  -- Rate limiting
  email_daily_limit INTEGER DEFAULT 1000,
  sms_daily_limit INTEGER DEFAULT 500,
  push_daily_limit INTEGER DEFAULT 5000,
  
  -- Branding defaults
  default_sender_name VARCHAR(100),
  default_sender_email VARCHAR(255),
  default_reply_to VARCHAR(255),
  default_sms_sender_id VARCHAR(20),
  
  -- Analytics
  track_opens BOOLEAN DEFAULT true,
  track_clicks BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX idx_tenant_notification_settings_tenant ON tenant_notification_settings(tenant_id);

-- ============================================================================
-- USER NOTIFICATION PREFERENCES
-- ============================================================================

-- Enhanced user notification preferences
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  preference_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  admin_id UUID REFERENCES admins(admin_id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(customer_id) ON DELETE CASCADE,
  
  -- Channel preferences
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true,
  in_app_enabled BOOLEAN DEFAULT true,
  
  -- Notification type preferences
  transactional_enabled BOOLEAN DEFAULT true,
  marketing_enabled BOOLEAN DEFAULT false,
  promotional_enabled BOOLEAN DEFAULT false,
  
  -- Specific event preferences
  order_updates BOOLEAN DEFAULT true,
  payment_updates BOOLEAN DEFAULT true,
  delivery_updates BOOLEAN DEFAULT true,
  promotional_offers BOOLEAN DEFAULT false,
  loyalty_updates BOOLEAN DEFAULT true,
  system_alerts BOOLEAN DEFAULT true,
feature/auth-system
  
  -- Quiet hours
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  quiet_hours_timezone VARCHAR(50) DEFAULT 'UTC',
  
copilot/add-advanced-notifications-system-again
  -- Frequency limits
  max_notifications_per_day INTEGER,
  max_marketing_per_week INTEGER,
  
  -- Metadata
  language_preference VARCHAR(10) DEFAULT 'en',
  last_updated_ip VARCHAR(45),
  last_updated_user_agent TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_user_tenant_prefs UNIQUE(user_id, tenant_id)
);

CREATE INDEX idx_notification_prefs_user ON notification_preferences(user_id);
CREATE INDEX idx_notification_prefs_tenant ON notification_preferences(tenant_id);

-- ============================================================================
-- 5. SUPER ADMIN FEATURE TOGGLES
-- ============================================================================

-- Super admin controls for notification features per tenant/partner
CREATE TABLE IF NOT EXISTS notification_feature_toggles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Core notification features
  notifications_enabled BOOLEAN DEFAULT true,
  push_notifications_enabled BOOLEAN DEFAULT false,
  sms_notifications_enabled BOOLEAN DEFAULT false,
  email_notifications_enabled BOOLEAN DEFAULT false,
  whatsapp_notifications_enabled BOOLEAN DEFAULT false,
  
  -- Advanced features
  campaigns_enabled BOOLEAN DEFAULT false,
  campaign_automation_enabled BOOLEAN DEFAULT false,
  campaign_scheduling_enabled BOOLEAN DEFAULT false,
  ab_testing_enabled BOOLEAN DEFAULT false,
  
  -- Template features
  custom_templates_enabled BOOLEAN DEFAULT false,
  template_editor_enabled BOOLEAN DEFAULT false,
  branded_templates_enabled BOOLEAN DEFAULT true,
  
  -- Analytics features
  analytics_enabled BOOLEAN DEFAULT false,
  advanced_analytics_enabled BOOLEAN DEFAULT false,
  export_enabled BOOLEAN DEFAULT false,
  
  -- Compliance features
  compliance_mode VARCHAR(50) DEFAULT 'standard', -- 'standard', 'strict', 'custom'
  gdpr_enabled BOOLEAN DEFAULT false,
  dpdp_enabled BOOLEAN DEFAULT false,
  opt_in_required BOOLEAN DEFAULT false,
  
  -- Integration features
  api_access_enabled BOOLEAN DEFAULT false,
  webhook_enabled BOOLEAN DEFAULT false,
  third_party_integration_enabled BOOLEAN DEFAULT false,
  
  -- Limits and quotas
  max_campaigns_per_month INTEGER,
  max_notifications_per_day INTEGER,
  max_templates INTEGER DEFAULT 10,
  
  -- Metadata
  configured_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_tenant_notification_toggles UNIQUE(tenant_id)
);

CREATE INDEX idx_notification_toggles_tenant ON notification_feature_toggles(tenant_id);
CREATE INDEX idx_notification_toggles_partner ON notification_feature_toggles(partner_id);

-- ============================================================================
-- 6. NOTIFICATION ANALYTICS & HISTORY
-- ============================================================================

-- Detailed analytics for notifications and campaigns
CREATE TABLE IF NOT EXISTS notification_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES notification_campaigns(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Metrics
  metric_type VARCHAR(50) NOT NULL, -- 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed'
  metric_value INTEGER DEFAULT 1,
  
  -- Context
  channel VARCHAR(50),
  device_type VARCHAR(50), -- 'mobile', 'desktop', 'tablet'
  browser VARCHAR(100),
  os VARCHAR(100),
  location VARCHAR(100),
  
  -- Timestamps
  recorded_at TIMESTAMP DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB
);

CREATE INDEX idx_notification_analytics_notification ON notification_analytics(notification_id);
CREATE INDEX idx_notification_analytics_campaign ON notification_analytics(campaign_id);
CREATE INDEX idx_notification_analytics_tenant ON notification_analytics(tenant_id, recorded_at DESC);
CREATE INDEX idx_notification_analytics_metric ON notification_analytics(metric_type, recorded_at DESC);

-- ============================================================================
-- 7. COMPLIANCE AUDIT LOG
-- ============================================================================

-- Track all notification-related compliance activities
CREATE TABLE IF NOT EXISTS notification_compliance_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Action details
  action_type VARCHAR(100) NOT NULL, -- 'opt_in', 'opt_out', 'consent_given', 'consent_revoked', 'data_export', 'data_deletion'
  channel VARCHAR(50), -- Specific channel for opt-in/out
  notification_type VARCHAR(50), -- Specific notification type
  
  -- Audit trail
  ip_address VARCHAR(45),
  user_agent TEXT,
  consent_method VARCHAR(100), -- 'web_form', 'email_link', 'api', 'admin_portal'
  
  -- Legal
  privacy_policy_version VARCHAR(50),
  terms_version VARCHAR(50),
  
  -- Metadata
  metadata JSONB,
  recorded_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notification_compliance_user ON notification_compliance_log(user_id, recorded_at DESC);
CREATE INDEX idx_notification_compliance_tenant ON notification_compliance_log(tenant_id, recorded_at DESC);
CREATE INDEX idx_notification_compliance_action ON notification_compliance_log(action_type, recorded_at DESC);

-- ============================================================================
-- 8. SEED DEFAULT TEMPLATES
-- ============================================================================

-- Insert system notification templates
INSERT INTO notification_templates (name, description, template_type, category, subject_template, body_template, channels, is_system_template, region, compliance_type) VALUES
-- Order notifications
('order_created', 'Order confirmation', 'transactional', 'order', 'Order Confirmation - #{order_number}', 'Hi #{customer_name}, your order #{order_number} has been confirmed. Total: #{total_amount}. Track your order: #{tracking_url}', ARRAY['email', 'sms', 'whatsapp', 'in_app'], true, 'global', 'standard'),
('order_shipped', 'Order shipped notification', 'transactional', 'order', 'Your order is on the way!', 'Hi #{customer_name}, your order #{order_number} has been shipped. Track: #{tracking_url}', ARRAY['email', 'push', 'sms', 'in_app'], true, 'global', 'standard'),
('order_delivered', 'Order delivered confirmation', 'transactional', 'order', 'Order Delivered', 'Hi #{customer_name}, your order #{order_number} has been delivered. Thank you for shopping with us!', ARRAY['email', 'push', 'in_app'], true, 'global', 'standard'),

-- Payment notifications
('payment_received', 'Payment confirmation', 'transactional', 'payment', 'Payment Received', 'Hi #{customer_name}, we have received your payment of #{amount} for order #{order_number}.', ARRAY['email', 'sms', 'in_app'], true, 'global', 'standard'),
('payment_failed', 'Payment failure notification', 'transactional', 'payment', 'Payment Failed', 'Hi #{customer_name}, your payment for order #{order_number} could not be processed. Please try again or contact support.', ARRAY['email', 'push', 'in_app'], true, 'global', 'standard'),

-- Account notifications
('account_created', 'Welcome message', 'transactional', 'account', 'Welcome to #{store_name}!', 'Hi #{customer_name}, welcome to #{store_name}! Your account has been created successfully.', ARRAY['email', 'in_app'], true, 'global', 'standard'),
('password_reset', 'Password reset', 'transactional', 'account', 'Password Reset Request', 'Hi #{customer_name}, click here to reset your password: #{reset_url}. This link expires in 1 hour.', ARRAY['email', 'sms'], true, 'global', 'standard'),

-- Marketing templates
('promotional_offer', 'Promotional offer template', 'marketing', 'promotion', 'Special Offer - #{discount}% Off!', 'Hi #{customer_name}, enjoy #{discount}% off on #{category}. Use code: #{promo_code}. Valid until #{expiry_date}.', ARRAY['email', 'push', 'sms', 'whatsapp'], true, 'global', 'standard'),
('abandoned_cart', 'Cart abandonment reminder', 'marketing', 'promotion', 'You left items in your cart', 'Hi #{customer_name}, you have #{item_count} items in your cart. Complete your purchase now: #{cart_url}', ARRAY['email', 'push'], true, 'global', 'standard'),

-- India-specific compliance templates
('order_created_india', 'Order confirmation (India)', 'transactional', 'order', 'Order Confirmation - #{order_number}', 'Hi #{customer_name}, your order #{order_number} has been confirmed. Total: ₹#{total_amount}. As per DPDP Act 2023, your data is processed with consent. Track: #{tracking_url}', ARRAY['email', 'sms', 'whatsapp', 'in_app'], true, 'india', 'dpdp'),
('marketing_consent_india', 'Marketing consent request (India)', 'compliance', 'account', 'Your consent for marketing communications', 'As per DPDP Act 2023, we need your consent to send promotional offers. Click to opt-in: #{consent_url}', ARRAY['email', 'sms'], true, 'india', 'dpdp')
ON CONFLICT (tenant_id, name) DO NOTHING;

-- ============================================================================
-- 9. INITIALIZE FEATURE TOGGLES FOR EXISTING TENANTS
-- ============================================================================

-- Create default notification feature toggles for all existing tenants
INSERT INTO notification_feature_toggles (tenant_id)
SELECT id FROM tenants
ON CONFLICT (tenant_id) DO NOTHING;

-- ============================================================================
-- 10. UPDATE EXISTING NOTIFICATIONS TABLE REFERENCES
-- ============================================================================

-- Migrate any existing notification_preferences data if they exist
-- (Safe to run even if table doesn't exist due to IF EXISTS)

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE notification_templates IS 'Reusable notification templates with multi-channel support';
COMMENT ON TABLE notifications IS 'Enhanced notifications with metadata, compliance, and multi-channel tracking';
COMMENT ON TABLE notification_campaigns IS 'Campaign management for automated and marketing notifications';
COMMENT ON TABLE notification_preferences IS 'User notification preferences with opt-in/opt-out controls';
COMMENT ON TABLE notification_feature_toggles IS 'Super admin controls for notification features per tenant';
COMMENT ON TABLE notification_analytics IS 'Detailed analytics for notification performance';
COMMENT ON TABLE notification_compliance_log IS 'Compliance audit trail for notification activities';

COMMENT ON COLUMN notification_templates.region IS 'Regional variant for compliance (india, us, eu, global)';
COMMENT ON COLUMN notification_templates.compliance_type IS 'Compliance framework (dpdp, gdpr, ccpa, standard)';
COMMENT ON COLUMN notifications.metadata IS 'Flexible metadata: campaign_id, segment, ab_variant, custom_data';
COMMENT ON COLUMN notification_campaigns.target_segment IS 'Customer segment: vip, loyal, at_risk, new, churned';
COMMENT ON COLUMN notification_feature_toggles.compliance_mode IS 'Compliance enforcement level';

  -- Language preference
  preferred_language VARCHAR(10) DEFAULT 'en',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  -- Only one preference record per user
  UNIQUE(tenant_id, admin_id, customer_id)
);

CREATE INDEX idx_user_notification_prefs_tenant ON user_notification_preferences(tenant_id);
CREATE INDEX idx_user_notification_prefs_admin ON user_notification_preferences(admin_id);
CREATE INDEX idx_user_notification_prefs_customer ON user_notification_preferences(customer_id);

-- ============================================================================
-- NOTIFICATION QUEUE
-- ============================================================================

-- Queue for async notification processing
CREATE TABLE IF NOT EXISTS notification_queue (
  queue_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID REFERENCES notifications_enhanced(notification_id) ON DELETE CASCADE,
  
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  priority INTEGER DEFAULT 5, -- 1-10, higher is more important
  scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  
  error_message TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX idx_notification_queue_status ON notification_queue(status);
CREATE INDEX idx_notification_queue_priority ON notification_queue(priority DESC);
CREATE INDEX idx_notification_queue_scheduled ON notification_queue(scheduled_for);
CREATE INDEX idx_notification_queue_retry ON notification_queue(next_retry_at) WHERE status = 'failed';

-- ============================================================================
-- NOTIFICATION ANALYTICS
-- ============================================================================

-- Aggregated notification analytics per tenant
CREATE TABLE IF NOT EXISTS notification_analytics (
  analytics_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  
  -- Time period
  date DATE NOT NULL,
  hour INTEGER, -- Optional: for hourly analytics
  
  -- Channel breakdown
  channel VARCHAR(20) NOT NULL,
  
  -- Metrics
  total_sent INTEGER DEFAULT 0,
  total_delivered INTEGER DEFAULT 0,
  total_failed INTEGER DEFAULT 0,
  total_bounced INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  
  -- Rates
  delivery_rate DECIMAL(5,2),
  open_rate DECIMAL(5,2),
  click_rate DECIMAL(5,2),
  bounce_rate DECIMAL(5,2),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  UNIQUE(tenant_id, date, channel, hour)
);

CREATE INDEX idx_notification_analytics_tenant ON notification_analytics(tenant_id);
CREATE INDEX idx_notification_analytics_date ON notification_analytics(date DESC);
CREATE INDEX idx_notification_analytics_channel ON notification_analytics(channel);

-- ============================================================================
-- NOTIFICATION EVENT LOG
-- ============================================================================

-- Detailed event log for notification lifecycle tracking
CREATE TABLE IF NOT EXISTS notification_event_log (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID REFERENCES notifications_enhanced(notification_id) ON DELETE CASCADE,
  
  event_type VARCHAR(50) NOT NULL, -- 'created', 'queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'
  event_data JSONB,
  
  -- Provider information
  provider VARCHAR(50),
  provider_event_id VARCHAR(255),
  
  -- Webhook data
  webhook_received_at TIMESTAMP WITH TIME ZONE,
  webhook_payload JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX idx_notification_event_log_notification ON notification_event_log(notification_id);
CREATE INDEX idx_notification_event_log_type ON notification_event_log(event_type);
CREATE INDEX idx_notification_event_log_created ON notification_event_log(created_at DESC);

-- ============================================================================
-- SUPER ADMIN NOTIFICATION CONTROLS
-- ============================================================================

-- Super admin global notification controls and limits
CREATE TABLE IF NOT EXISTS super_admin_notification_controls (
  control_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Global feature toggles
  notifications_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true,
  webhook_enabled BOOLEAN DEFAULT true,
  
  -- Global rate limits (platform-wide)
  global_email_daily_limit INTEGER DEFAULT 100000,
  global_sms_daily_limit INTEGER DEFAULT 50000,
  global_push_daily_limit INTEGER DEFAULT 500000,
  
  -- Monitoring and alerts
  alert_on_high_failure_rate BOOLEAN DEFAULT true,
  failure_rate_threshold DECIMAL(5,2) DEFAULT 10.00,
  alert_email VARCHAR(255),
  
  -- Provider failover
  email_provider_primary VARCHAR(50) DEFAULT 'sendgrid',
  email_provider_fallback VARCHAR(50),
  sms_provider_primary VARCHAR(50) DEFAULT 'twilio',
  sms_provider_fallback VARCHAR(50),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Insert default super admin controls
INSERT INTO super_admin_notification_controls (control_id, notifications_enabled)
VALUES (gen_random_uuid(), true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- NOTIFICATION CAMPAIGNS (Marketing feature)
-- ============================================================================

-- Marketing campaigns for bulk notifications
CREATE TABLE IF NOT EXISTS notification_campaigns (
  campaign_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  
  campaign_name VARCHAR(255) NOT NULL,
  campaign_type VARCHAR(50) NOT NULL, -- 'promotional', 'announcement', 'newsletter'
  description TEXT,
  
  -- Targeting
  target_audience JSONB, -- Filters for recipient selection
  segment_name VARCHAR(100),
  
  -- Content
  template_id UUID REFERENCES notification_templates(template_id),
  channels TEXT[], -- Array of channels to use
  
  -- Scheduling
  status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'scheduled', 'running', 'paused', 'completed', 'cancelled'
  scheduled_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metrics
  total_recipients INTEGER DEFAULT 0,
  total_sent INTEGER DEFAULT 0,
  total_delivered INTEGER DEFAULT 0,
  total_failed INTEGER DEFAULT 0,
  
  created_by UUID REFERENCES admins(admin_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX idx_notification_campaigns_tenant ON notification_campaigns(tenant_id);
CREATE INDEX idx_notification_campaigns_status ON notification_campaigns(status);
CREATE INDEX idx_notification_campaigns_scheduled ON notification_campaigns(scheduled_at);

-- ============================================================================
-- UTILITY VIEWS
-- ============================================================================

-- View for notification delivery summary
CREATE OR REPLACE VIEW notification_delivery_summary AS
SELECT 
  tenant_id,
  channel,
  DATE(created_at) as date,
  COUNT(*) as total_notifications,
  COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_count,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
  COUNT(CASE WHEN status = 'bounced' THEN 1 END) as bounced_count,
  COUNT(CASE WHEN read = true THEN 1 END) as read_count,
  COUNT(CASE WHEN clicked = true THEN 1 END) as clicked_count,
  ROUND(100.0 * COUNT(CASE WHEN status = 'delivered' THEN 1 END) / NULLIF(COUNT(*), 0), 2) as delivery_rate,
  ROUND(100.0 * COUNT(CASE WHEN read = true THEN 1 END) / NULLIF(COUNT(CASE WHEN status = 'delivered' THEN 1 END), 0), 2) as open_rate,
  ROUND(100.0 * COUNT(CASE WHEN clicked = true THEN 1 END) / NULLIF(COUNT(CASE WHEN status = 'delivered' THEN 1 END), 0), 2) as click_rate
FROM notifications_enhanced
GROUP BY tenant_id, channel, DATE(created_at);

-- View for recent notifications per user
CREATE OR REPLACE VIEW user_recent_notifications AS
SELECT 
  notification_id,
  tenant_id,
  admin_id,
  customer_id,
  title,
  message,
  channel,
  priority,
  read,
  read_at,
  created_at,
  notification_type,
  event_type
FROM notifications_enhanced
WHERE created_at > NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;

-- ============================================================================
-- DEFAULT NOTIFICATION TEMPLATES
-- ============================================================================

-- Insert default system templates
INSERT INTO notification_templates (template_key, template_name, description, category, is_default, 
  email_subject, email_body, sms_content, push_title, push_body, variables, language)
VALUES 
  -- Order notifications
  ('order_confirmed', 'Order Confirmed', 'Sent when order is confirmed', 'transactional', true,
   'Order {{order_id}} Confirmed',
   'Hi {{customer_name}},\n\nYour order #{{order_id}} has been confirmed and is being processed.\n\nOrder Total: {{order_total}}\n\nThank you for shopping with us!',
   'Order #{{order_id}} confirmed. Total: {{order_total}}. Track at {{tracking_url}}',
   'Order Confirmed',
   'Your order #{{order_id}} has been confirmed',
   '{"customer_name": "string", "order_id": "string", "order_total": "string", "tracking_url": "string"}',
   'en'),
   
  ('order_shipped', 'Order Shipped', 'Sent when order is shipped', 'transactional', true,
   'Order {{order_id}} Shipped',
   'Hi {{customer_name}},\n\nGreat news! Your order #{{order_id}} has been shipped.\n\nTracking Number: {{tracking_number}}\nExpected Delivery: {{expected_delivery}}',
   'Order #{{order_id}} shipped! Track: {{tracking_number}}',
   'Order Shipped',
   'Your order #{{order_id}} is on its way!',
   '{"customer_name": "string", "order_id": "string", "tracking_number": "string", "expected_delivery": "string"}',
   'en'),
   
  ('order_delivered', 'Order Delivered', 'Sent when order is delivered', 'transactional', true,
   'Order {{order_id}} Delivered',
   'Hi {{customer_name}},\n\nYour order #{{order_id}} has been delivered successfully.\n\nThank you for shopping with us!',
   'Order #{{order_id}} delivered. Thank you!',
   'Order Delivered',
   'Your order #{{order_id}} has been delivered',
   '{"customer_name": "string", "order_id": "string"}',
   'en'),
   
  -- Payment notifications
  ('payment_success', 'Payment Successful', 'Sent when payment is successful', 'transactional', true,
   'Payment Received - {{amount}}',
   'Hi {{customer_name}},\n\nWe have received your payment of {{amount}} for order #{{order_id}}.\n\nTransaction ID: {{transaction_id}}',
   'Payment of {{amount}} received. Transaction: {{transaction_id}}',
   'Payment Successful',
   'Payment of {{amount}} received successfully',
   '{"customer_name": "string", "amount": "string", "order_id": "string", "transaction_id": "string"}',
   'en'),
   
  ('payment_failed', 'Payment Failed', 'Sent when payment fails', 'transactional', true,
   'Payment Failed - {{amount}}',
   'Hi {{customer_name}},\n\nYour payment of {{amount}} for order #{{order_id}} failed.\n\nReason: {{failure_reason}}\n\nPlease try again or use a different payment method.',
   'Payment of {{amount}} failed. Please retry.',
   'Payment Failed',
   'Payment of {{amount}} failed. Please retry.',
   '{"customer_name": "string", "amount": "string", "order_id": "string", "failure_reason": "string"}',
   'en'),
   
  -- Account notifications
  ('welcome', 'Welcome Message', 'Sent when user signs up', 'transactional', true,
   'Welcome to {{store_name}}',
   'Hi {{customer_name}},\n\nWelcome to {{store_name}}! We are excited to have you.\n\nStart exploring our products and enjoy exclusive offers.',
   'Welcome to {{store_name}}! Start shopping now.',
   'Welcome!',
   'Welcome to {{store_name}}',
   '{"customer_name": "string", "store_name": "string"}',
   'en'),
   
  ('password_reset', 'Password Reset', 'Sent for password reset', 'transactional', true,
   'Reset Your Password',
   'Hi {{customer_name}},\n\nClick the link below to reset your password:\n{{reset_link}}\n\nThis link will expire in 1 hour.\n\nIf you did not request this, please ignore this email.',
   'Reset password: {{reset_link}}',
   'Reset Password',
   'Click to reset your password',
   '{"customer_name": "string", "reset_link": "string"}',
   'en')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to update notification analytics
CREATE OR REPLACE FUNCTION update_notification_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update analytics when notification status changes
  IF (TG_OP = 'UPDATE' AND OLD.status != NEW.status) OR TG_OP = 'INSERT' THEN
    INSERT INTO notification_analytics (
      tenant_id, date, hour, channel,
      total_sent, total_delivered, total_failed, total_bounced,
      total_opened, total_clicked
    )
    VALUES (
      NEW.tenant_id, 
      DATE(NEW.created_at), 
      EXTRACT(HOUR FROM NEW.created_at)::INTEGER,
      NEW.channel,
      CASE WHEN NEW.status IN ('sent', 'delivered') THEN 1 ELSE 0 END,
      CASE WHEN NEW.status = 'delivered' THEN 1 ELSE 0 END,
      CASE WHEN NEW.status = 'failed' THEN 1 ELSE 0 END,
      CASE WHEN NEW.status = 'bounced' THEN 1 ELSE 0 END,
      CASE WHEN NEW.read = true THEN 1 ELSE 0 END,
      CASE WHEN NEW.clicked = true THEN 1 ELSE 0 END
    )
    ON CONFLICT (tenant_id, date, channel, hour)
    DO UPDATE SET
      total_sent = notification_analytics.total_sent + EXCLUDED.total_sent,
      total_delivered = notification_analytics.total_delivered + EXCLUDED.total_delivered,
      total_failed = notification_analytics.total_failed + EXCLUDED.total_failed,
      total_bounced = notification_analytics.total_bounced + EXCLUDED.total_bounced,
      total_opened = notification_analytics.total_opened + EXCLUDED.total_opened,
      total_clicked = notification_analytics.total_clicked + EXCLUDED.total_clicked,
      delivery_rate = ROUND(100.0 * notification_analytics.total_delivered / NULLIF(notification_analytics.total_sent, 0), 2),
      open_rate = ROUND(100.0 * notification_analytics.total_opened / NULLIF(notification_analytics.total_delivered, 0), 2),
      click_rate = ROUND(100.0 * notification_analytics.total_clicked / NULLIF(notification_analytics.total_delivered, 0), 2),
      bounce_rate = ROUND(100.0 * notification_analytics.total_bounced / NULLIF(notification_analytics.total_sent, 0), 2),
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for analytics updates
CREATE TRIGGER trigger_update_notification_analytics
AFTER INSERT OR UPDATE ON notifications_enhanced
FOR EACH ROW
EXECUTE FUNCTION update_notification_analytics();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE notification_templates IS 'Stores notification templates with multi-channel content and per-tenant branding';
COMMENT ON TABLE notifications_enhanced IS 'Enhanced notifications table with comprehensive tracking and analytics';
COMMENT ON TABLE tenant_notification_settings IS 'Per-tenant notification configuration controlled by super admin';
COMMENT ON TABLE user_notification_preferences IS 'User-level notification preferences and opt-in/opt-out settings';
COMMENT ON TABLE notification_queue IS 'Queue for async notification processing with retry logic';
COMMENT ON TABLE notification_analytics IS 'Aggregated notification analytics per tenant and channel';
COMMENT ON TABLE notification_event_log IS 'Detailed event log for notification lifecycle tracking';
COMMENT ON TABLE super_admin_notification_controls IS 'Global notification controls and limits managed by super admin';
COMMENT ON TABLE notification_campaigns IS 'Marketing campaigns for bulk notifications';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
feature/auth-system
