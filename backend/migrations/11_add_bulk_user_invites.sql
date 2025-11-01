-- ============================================================================
-- Bulk User Invite Feature
-- ============================================================================
-- This migration adds support for bulk user invites functionality
-- Allows tenant admins to invite multiple users via email list or CSV upload
-- Super admin can enable/disable this feature per tenant
-- ============================================================================

-- Add bulk_invite_enabled flag to feature_flags table
ALTER TABLE public.feature_flags
ADD COLUMN IF NOT EXISTS bulk_invite_enabled BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.feature_flags.bulk_invite_enabled IS 'Enable bulk user invite functionality for tenant admins';

-- User Invites table
CREATE TABLE IF NOT EXISTS public.user_invites (
  invite_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  email CITEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer', -- 'admin', 'customer'
  invited_by UUID REFERENCES public.admins(admin_id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'expired', 'cancelled'
  invite_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB, -- Additional data (name, phone, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT unique_pending_invite UNIQUE (tenant_id, email, status)
);

-- Bulk Invite Batches - track groups of invites
CREATE TABLE IF NOT EXISTS public.bulk_invite_batches (
  batch_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES public.admins(admin_id) ON DELETE SET NULL NOT NULL,
  total_invites INTEGER NOT NULL DEFAULT 0,
  successful_invites INTEGER NOT NULL DEFAULT 0,
  failed_invites INTEGER NOT NULL DEFAULT 0,
  method TEXT NOT NULL DEFAULT 'manual', -- 'manual', 'csv'
  status TEXT NOT NULL DEFAULT 'processing', -- 'processing', 'completed', 'failed'
  error_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Add batch_id to user_invites to link invites to batch
ALTER TABLE public.user_invites
ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES public.bulk_invite_batches(batch_id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_invites_tenant ON public.user_invites(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_invites_email ON public.user_invites(email);
CREATE INDEX IF NOT EXISTS idx_user_invites_status ON public.user_invites(status);
CREATE INDEX IF NOT EXISTS idx_user_invites_token ON public.user_invites(invite_token);
CREATE INDEX IF NOT EXISTS idx_user_invites_expires ON public.user_invites(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_invites_batch ON public.user_invites(batch_id);
CREATE INDEX IF NOT EXISTS idx_bulk_invite_batches_tenant ON public.bulk_invite_batches(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bulk_invite_batches_created_by ON public.bulk_invite_batches(created_by);

-- Add comments for documentation
COMMENT ON TABLE public.user_invites IS 'Stores user invitation records with status tracking';
COMMENT ON TABLE public.bulk_invite_batches IS 'Tracks bulk invite operations and their statistics';
COMMENT ON COLUMN public.user_invites.invite_token IS 'Unique token for accepting invitation';
COMMENT ON COLUMN public.user_invites.status IS 'Invitation status: pending, accepted, expired, or cancelled';
COMMENT ON COLUMN public.user_invites.metadata IS 'Additional user information provided during invite';
COMMENT ON COLUMN public.bulk_invite_batches.method IS 'How invites were created: manual entry or CSV upload';

-- Function to automatically expire old invites
CREATE OR REPLACE FUNCTION expire_old_invites()
RETURNS void AS $$
BEGIN
  UPDATE public.user_invites
  SET status = 'expired',
      updated_at = NOW()
  WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to clean up duplicate pending invites (keep most recent)
CREATE OR REPLACE FUNCTION cleanup_duplicate_invites()
RETURNS void AS $$
BEGIN
  -- This handles edge cases where the unique constraint might be temporarily violated
  DELETE FROM public.user_invites a
  USING public.user_invites b
  WHERE a.tenant_id = b.tenant_id
    AND a.email = b.email
    AND a.status = 'pending'
    AND b.status = 'pending'
    AND a.created_at < b.created_at;
END;
$$ LANGUAGE plpgsql;
