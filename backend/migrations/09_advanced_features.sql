-- ============================================================================
-- Advanced Features Migration
-- Adds tables for push notifications, messaging, tracking, and analytics
-- ============================================================================

-- Push subscriptions table (for Web Push and FCM tokens)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  subscription_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  admin_id UUID REFERENCES public.admins(admin_id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(customer_id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  type TEXT NOT NULL, -- 'fcm' or 'web_push'
  active BOOLEAN DEFAULT true,
  device_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Message logs table (for SMS/WhatsApp tracking)
CREATE TABLE IF NOT EXISTS public.message_logs (
  message_log_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type TEXT NOT NULL, -- 'sms' or 'whatsapp'
  phone_number TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL, -- 'sent', 'failed', 'delivered', 'read'
  provider TEXT NOT NULL, -- 'twilio', 'whatsapp_business'
  provider_id TEXT,
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Order tracking locations table (GPS tracking)
CREATE TABLE IF NOT EXISTS public.order_tracking_locations (
  tracking_location_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(order_id) ON DELETE CASCADE NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(10, 2), -- accuracy in meters
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Push notifications table (for Web Push queue)
CREATE TABLE IF NOT EXISTS public.push_notifications (
  notification_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  subscription_endpoint TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  delivered_at TIMESTAMP WITH TIME ZONE
);

-- Add new columns to orders table for tracking
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS estimated_delivery_time TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS actual_delivery_time TIMESTAMP WITH TIME ZONE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_admin ON public.push_subscriptions(admin_id) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_customer ON public.push_subscriptions(customer_id) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_message_logs_phone ON public.message_logs(phone_number);
CREATE INDEX IF NOT EXISTS idx_message_logs_sent_at ON public.message_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_order_tracking_order ON public.order_tracking_locations(order_id);
CREATE INDEX IF NOT EXISTS idx_order_tracking_recorded_at ON public.order_tracking_locations(recorded_at);
CREATE INDEX IF NOT EXISTS idx_push_notifications_endpoint ON public.push_notifications(subscription_endpoint);

-- Add analytics-friendly indexes
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON public.orders(status, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_tenant_created_at ON public.orders(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_customer_created_at ON public.orders(customer_id, created_at);
CREATE INDEX IF NOT EXISTS idx_customers_tenant_created_at ON public.customers(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON public.order_items(product_id);

COMMENT ON TABLE public.push_subscriptions IS 'Stores push notification subscriptions for FCM and Web Push';
COMMENT ON TABLE public.message_logs IS 'Logs all SMS and WhatsApp messages sent via Twilio or WhatsApp Business API';
COMMENT ON TABLE public.order_tracking_locations IS 'GPS tracking data for order deliveries';
COMMENT ON TABLE public.push_notifications IS 'Queue for Web Push notifications to be sent by service worker';
