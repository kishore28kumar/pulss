-- ============================================================================
-- Migration 02: Super Admin Setup & Password Reset
-- ============================================================================
-- Creates initial super admin account and password reset functionality
-- Run after 01_init_schema.sql
-- ============================================================================

-- Add password reset fields to admins table
ALTER TABLE public.admins 
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS password_reset_token TEXT,
ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP WITH TIME ZONE;

-- Create index on reset token for faster lookups
CREATE INDEX IF NOT EXISTS idx_admins_password_reset_token 
ON public.admins(password_reset_token) 
WHERE password_reset_token IS NOT NULL;

-- Create first super admin (change credentials before running!)
-- Password: 'SuperAdmin@123' (CHANGE THIS IN PRODUCTION!)
INSERT INTO public.admins (
  tenant_id, 
  email, 
  password_hash, 
  full_name, 
  role, 
  is_active,
  must_change_password
) VALUES (
  NULL, -- Super admin has no tenant
  'superadmin@pulss.local',
  '$2b$10$rX5YqG8VKqB3kp9mH8zXqOYvYx0oI7gQ2wQm9vN8xL4pR6sT5uV3W', -- Hash of 'SuperAdmin@123'
  'Super Administrator',
  'super_admin',
  true,
  true -- Must change password on first login
) ON CONFLICT (email) DO NOTHING;

-- Create index on role for faster queries
CREATE INDEX IF NOT EXISTS idx_admins_role ON public.admins(role);

-- Comments
COMMENT ON COLUMN public.admins.must_change_password IS 'Flag to force password change on first login';
COMMENT ON COLUMN public.admins.password_reset_token IS 'Token for password reset, expires after use or timeout';
COMMENT ON COLUMN public.admins.password_reset_expires IS 'Expiration timestamp for password reset token';
