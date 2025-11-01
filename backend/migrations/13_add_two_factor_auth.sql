-- Migration: Add Two-Factor Authentication fields
-- This migration adds 2FA support to both admins and customers tables

-- Add 2FA fields to admins table
ALTER TABLE admins ADD COLUMN two_factor_secret TEXT;
ALTER TABLE admins ADD COLUMN two_factor_enabled INTEGER DEFAULT 0;
ALTER TABLE admins ADD COLUMN two_factor_backup_codes TEXT;

-- Add 2FA fields to customers table  
ALTER TABLE customers ADD COLUMN two_factor_secret TEXT;
ALTER TABLE customers ADD COLUMN two_factor_enabled INTEGER DEFAULT 0;
ALTER TABLE customers ADD COLUMN two_factor_backup_codes TEXT;

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_admins_2fa_enabled ON admins(two_factor_enabled);
CREATE INDEX IF NOT EXISTS idx_customers_2fa_enabled ON customers(two_factor_enabled);
