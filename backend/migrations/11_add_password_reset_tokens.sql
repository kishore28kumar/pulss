-- ============================================================================
-- Add Password Reset Token Support
-- ============================================================================
-- This migration adds columns to support secure password reset functionality
-- for all user tables (admins and customers)
-- ============================================================================

-- Create unified users table if it doesn't exist
-- This table combines admin and customer authentication
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email CITEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer', -- 'super_admin', 'admin', 'customer'
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add password reset token columns to users table
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS reset_token TEXT,
  ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP WITH TIME ZONE;

-- Add password reset token columns to admins table (if using separate tables)
ALTER TABLE public.admins
  ADD COLUMN IF NOT EXISTS reset_token TEXT,
  ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP WITH TIME ZONE;

-- Add password reset token columns to customers table (if using separate tables)
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS reset_token TEXT,
  ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP WITH TIME ZONE;

-- Add index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON public.users(reset_token) WHERE reset_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_admins_reset_token ON public.admins(reset_token) WHERE reset_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_reset_token ON public.customers(reset_token) WHERE reset_token IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.users.reset_token IS 'Hashed password reset token (bcrypt)';
COMMENT ON COLUMN public.users.reset_token_expiry IS 'Expiration timestamp for the reset token (typically 1 hour from creation)';
