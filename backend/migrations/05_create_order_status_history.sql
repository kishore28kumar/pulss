-- ============================================================================
-- Migration 05: Order Status History & Audit Trail
-- ============================================================================
-- Creates audit trail for order lifecycle tracking
-- ============================================================================

-- Order status history for audit trail
CREATE TABLE IF NOT EXISTS public.order_status_history (
  history_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(order_id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  
  -- Status change details
  from_status TEXT,
  to_status TEXT NOT NULL,
  
  -- Who made the change
  changed_by_admin_id UUID REFERENCES public.admins(admin_id) ON DELETE SET NULL,
  changed_by_customer_id UUID REFERENCES public.customers(customer_id) ON DELETE SET NULL,
  
  -- Additional info
  notes TEXT,
  metadata JSONB, -- For storing additional context (e.g., delivery tracking info)
  
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add additional order fields
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS delivery_type TEXT DEFAULT 'delivery', -- 'delivery', 'pickup'
ADD COLUMN IF NOT EXISTS estimated_delivery_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS actual_delivery_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS packed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS dispatched_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS delivery_notes TEXT,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_order_history_order ON public.order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_history_tenant ON public.order_status_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_order_history_changed_at ON public.order_status_history(changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status, tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_type ON public.orders(delivery_type);

-- Comments
COMMENT ON TABLE public.order_status_history IS 'Complete audit trail of all order status changes';
COMMENT ON COLUMN public.order_status_history.metadata IS 'JSON field for storing additional context like tracking numbers, timestamps, etc.';
COMMENT ON COLUMN public.orders.delivery_type IS 'Type of delivery: home delivery or self pickup';
COMMENT ON COLUMN public.orders.metadata IS 'JSON field for storing order-specific data like prescription uploads, special instructions';
