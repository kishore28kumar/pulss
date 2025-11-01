-- ============================================================================
-- Migration 04: Customer Ledger System
-- ============================================================================
-- Creates tables for credit/ledger management
-- Supports credit on delivery workflow
-- ============================================================================

-- Customer Ledger for tracking credit transactions
CREATE TABLE IF NOT EXISTS public.customer_ledgers (
  ledger_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(customer_id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES public.orders(order_id) ON DELETE SET NULL,
  
  -- Transaction details
  transaction_type TEXT NOT NULL, -- 'credit_purchase', 'payment', 'adjustment'
  amount DECIMAL(10,2) NOT NULL,
  balance DECIMAL(10,2) NOT NULL, -- Running balance after this transaction
  
  -- Credit request/approval
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'paid'
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES public.admins(admin_id) ON DELETE SET NULL,
  
  -- Payment details
  paid_at TIMESTAMP WITH TIME ZONE,
  payment_method TEXT, -- 'cash', 'upi', 'card', 'bank_transfer'
  payment_reference TEXT,
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Customer addresses table (for delivery)
CREATE TABLE IF NOT EXISTS public.customer_addresses (
  address_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(customer_id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  
  -- Address fields
  label TEXT NOT NULL, -- 'Home', 'Work', 'Other'
  street_address TEXT NOT NULL,
  landmark TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  
  -- Contact
  contact_name TEXT,
  contact_phone TEXT,
  
  -- Flags
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add customer profile fields
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
ADD COLUMN IF NOT EXISTS default_address_id UUID REFERENCES public.customer_addresses(address_id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS credit_balance DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(10,2) DEFAULT 0;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ledgers_customer ON public.customer_ledgers(customer_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_ledgers_tenant ON public.customer_ledgers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ledgers_status ON public.customer_ledgers(status);
CREATE INDEX IF NOT EXISTS idx_ledgers_order ON public.customer_ledgers(order_id) WHERE order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_addresses_customer ON public.customer_addresses(customer_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_addresses_default ON public.customer_addresses(customer_id, is_default) WHERE is_default = true;

-- Comments
COMMENT ON TABLE public.customer_ledgers IS 'Tracks credit transactions and payment history for customers';
COMMENT ON TABLE public.customer_addresses IS 'Customer delivery addresses';
COMMENT ON COLUMN public.customer_ledgers.balance IS 'Running balance - positive means customer owes money';
COMMENT ON COLUMN public.customers.credit_balance IS 'Current outstanding credit balance';
COMMENT ON COLUMN public.customers.credit_limit IS 'Maximum credit limit allowed for this customer';
