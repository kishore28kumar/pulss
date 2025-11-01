-- ============================================================================
-- Migration 11: Role-Based Access Control (RBAC) System
-- ============================================================================
-- Implements comprehensive RBAC with roles, permissions, and feature flags
-- ============================================================================

-- Roles Table: Define standard and custom roles per tenant
CREATE TABLE IF NOT EXISTS public.roles (
  role_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  is_system_role BOOLEAN DEFAULT false, -- true for predefined roles (super_admin, tenant_admin, user, viewer)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(tenant_id, name) -- Unique role names per tenant, NULL tenant_id for system roles
);

-- Permissions Table: Define granular permissions
CREATE TABLE IF NOT EXISTS public.permissions (
  permission_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE, -- e.g., 'users.manage', 'orders.view', 'audit_logs.view'
  display_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- e.g., 'users', 'orders', 'products', 'settings', 'analytics'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Role Permissions: Map roles to permissions (many-to-many)
CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_id UUID REFERENCES public.roles(role_id) ON DELETE CASCADE,
  permission_id UUID REFERENCES public.permissions(permission_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (role_id, permission_id)
);

-- User Roles: Link users (admins) to roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_role_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  admin_id UUID REFERENCES public.admins(admin_id) ON DELETE CASCADE NOT NULL,
  role_id UUID REFERENCES public.roles(role_id) ON DELETE CASCADE NOT NULL,
  assigned_by UUID REFERENCES public.admins(admin_id) ON DELETE SET NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(admin_id, role_id) -- A user can only have each role once
);

-- Role Assignment Audit Log
CREATE TABLE IF NOT EXISTS public.role_audit_logs (
  audit_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
  admin_id UUID REFERENCES public.admins(admin_id) ON DELETE SET NULL,
  role_id UUID REFERENCES public.roles(role_id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'role_created', 'role_updated', 'role_deleted', 'role_assigned', 'role_revoked', 'permission_added', 'permission_removed'
  target_admin_id UUID REFERENCES public.admins(admin_id) ON DELETE SET NULL, -- For role assignments
  changes JSONB, -- Store what changed
  performed_by UUID REFERENCES public.admins(admin_id) ON DELETE SET NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Feature Flags per Role/Tenant: Enhanced feature flag system
CREATE TABLE IF NOT EXISTS public.role_feature_flags (
  feature_flag_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
  role_id UUID REFERENCES public.roles(role_id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(tenant_id, role_id, feature_name)
);

-- ============================================================================
-- Seed Standard Permissions
-- ============================================================================

INSERT INTO public.permissions (name, display_name, description, category) VALUES
  -- User Management
  ('users.view', 'View Users', 'View user list and details', 'users'),
  ('users.create', 'Create Users', 'Create new users', 'users'),
  ('users.update', 'Update Users', 'Update user information', 'users'),
  ('users.delete', 'Delete Users', 'Delete users', 'users'),
  ('users.manage', 'Manage Users', 'Full user management access', 'users'),
  ('users.invite_bulk', 'Bulk Invite Users', 'Invite multiple users at once', 'users'),
  
  -- Role Management
  ('roles.view', 'View Roles', 'View roles and permissions', 'roles'),
  ('roles.create', 'Create Roles', 'Create custom roles', 'roles'),
  ('roles.update', 'Update Roles', 'Update role permissions', 'roles'),
  ('roles.delete', 'Delete Roles', 'Delete custom roles', 'roles'),
  ('roles.assign', 'Assign Roles', 'Assign roles to users', 'roles'),
  
  -- Order Management
  ('orders.view', 'View Orders', 'View order list and details', 'orders'),
  ('orders.create', 'Create Orders', 'Create new orders', 'orders'),
  ('orders.update', 'Update Orders', 'Update order status', 'orders'),
  ('orders.delete', 'Delete Orders', 'Delete orders', 'orders'),
  ('orders.manage', 'Manage Orders', 'Full order management access', 'orders'),
  ('orders.export', 'Export Orders', 'Export order data', 'orders'),
  
  -- Product Management
  ('products.view', 'View Products', 'View product catalog', 'products'),
  ('products.create', 'Create Products', 'Add new products', 'products'),
  ('products.update', 'Update Products', 'Update product information', 'products'),
  ('products.delete', 'Delete Products', 'Delete products', 'products'),
  ('products.manage', 'Manage Products', 'Full product management access', 'products'),
  ('products.bulk_upload', 'Bulk Upload Products', 'Upload products via CSV/Excel', 'products'),
  
  -- Customer Management
  ('customers.view', 'View Customers', 'View customer list and details', 'customers'),
  ('customers.create', 'Create Customers', 'Create new customers', 'customers'),
  ('customers.update', 'Update Customers', 'Update customer information', 'customers'),
  ('customers.delete', 'Delete Customers', 'Delete customers', 'customers'),
  ('customers.manage', 'Manage Customers', 'Full customer management access', 'customers'),
  ('customers.export', 'Export Customers', 'Export customer data', 'customers'),
  
  -- Analytics & Reports
  ('analytics.view', 'View Analytics', 'View analytics dashboard', 'analytics'),
  ('analytics.export', 'Export Analytics', 'Export analytics reports', 'analytics'),
  ('reports.view', 'View Reports', 'View reports', 'reports'),
  ('reports.create', 'Create Reports', 'Generate custom reports', 'reports'),
  
  -- Settings
  ('settings.view', 'View Settings', 'View tenant settings', 'settings'),
  ('settings.update', 'Update Settings', 'Update tenant settings', 'settings'),
  ('settings.manage', 'Manage Settings', 'Full settings management', 'settings'),
  
  -- Audit Logs
  ('audit_logs.view', 'View Audit Logs', 'View audit log entries', 'audit_logs'),
  ('audit_logs.export', 'Export Audit Logs', 'Export audit logs', 'audit_logs'),
  
  -- Feature Flags
  ('feature_flags.view', 'View Feature Flags', 'View feature flag settings', 'feature_flags'),
  ('feature_flags.update', 'Update Feature Flags', 'Update feature flags', 'feature_flags'),
  
  -- Messaging & Notifications
  ('messaging.send', 'Send Messages', 'Send messages to customers', 'messaging'),
  ('notifications.manage', 'Manage Notifications', 'Manage notification settings', 'notifications'),
  
  -- Tenant Management (Super Admin only)
  ('tenants.view', 'View Tenants', 'View all tenants', 'tenants'),
  ('tenants.create', 'Create Tenants', 'Create new tenants', 'tenants'),
  ('tenants.update', 'Update Tenants', 'Update tenant information', 'tenants'),
  ('tenants.delete', 'Delete Tenants', 'Delete tenants', 'tenants'),
  ('tenants.manage', 'Manage Tenants', 'Full tenant management', 'tenants')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- Seed Standard System Roles
-- ============================================================================

-- Super Admin Role (tenant_id = NULL for system-wide)
INSERT INTO public.roles (tenant_id, name, display_name, description, is_system_role) VALUES
  (NULL, 'super_admin', 'Super Administrator', 'Full system access across all tenants', true),
  (NULL, 'tenant_admin', 'Tenant Administrator', 'Full access within tenant scope', true),
  (NULL, 'manager', 'Manager', 'Manage operations with limited admin access', true),
  (NULL, 'staff', 'Staff', 'Standard operational access', true),
  (NULL, 'viewer', 'Viewer', 'Read-only access to data', true)
ON CONFLICT (tenant_id, name) DO NOTHING;

-- ============================================================================
-- Assign Permissions to System Roles
-- ============================================================================

-- Super Admin: All permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'super_admin'
ON CONFLICT DO NOTHING;

-- Tenant Admin: All permissions except tenant management
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'tenant_admin'
  AND p.category != 'tenants'
ON CONFLICT DO NOTHING;

-- Manager: Operations, orders, customers, products (no settings, roles)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'manager'
  AND p.category IN ('orders', 'customers', 'products', 'analytics', 'reports', 'messaging')
ON CONFLICT DO NOTHING;

-- Staff: View and update orders, products, customers (no delete, no settings)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'staff'
  AND p.name IN ('orders.view', 'orders.update', 'products.view', 'customers.view', 'customers.update')
ON CONFLICT DO NOTHING;

-- Viewer: Read-only access
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'viewer'
  AND p.name LIKE '%.view'
  AND p.category NOT IN ('tenants', 'settings', 'audit_logs')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Update existing admins to use RBAC system
-- ============================================================================

-- Assign super_admin role to existing super admins
INSERT INTO public.user_roles (admin_id, role_id)
SELECT a.admin_id, r.role_id
FROM public.admins a
CROSS JOIN public.roles r
WHERE a.role = 'super_admin' 
  AND r.name = 'super_admin'
  AND r.is_system_role = true
ON CONFLICT DO NOTHING;

-- Assign tenant_admin role to existing admins
INSERT INTO public.user_roles (admin_id, role_id)
SELECT a.admin_id, r.role_id
FROM public.admins a
CROSS JOIN public.roles r
WHERE a.role = 'admin' 
  AND r.name = 'tenant_admin'
  AND r.is_system_role = true
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Create Indexes for Performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_roles_tenant_id ON public.roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_roles_is_active ON public.roles(is_active);
CREATE INDEX IF NOT EXISTS idx_user_roles_admin_id ON public.user_roles(admin_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON public.user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON public.role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON public.role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_role_audit_logs_tenant_id ON public.role_audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_role_audit_logs_admin_id ON public.role_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_role_audit_logs_created_at ON public.role_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_role_feature_flags_tenant_id ON public.role_feature_flags(tenant_id);
CREATE INDEX IF NOT EXISTS idx_role_feature_flags_role_id ON public.role_feature_flags(role_id);

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE public.roles IS 'System and tenant-specific roles for RBAC';
COMMENT ON TABLE public.permissions IS 'Granular permissions for access control';
COMMENT ON TABLE public.role_permissions IS 'Many-to-many mapping of roles to permissions';
COMMENT ON TABLE public.user_roles IS 'User role assignments';
COMMENT ON TABLE public.role_audit_logs IS 'Audit trail for role and permission changes';
COMMENT ON TABLE public.role_feature_flags IS 'Feature flags per role and tenant';

COMMENT ON COLUMN public.roles.is_system_role IS 'System roles cannot be deleted, only customized';
COMMENT ON COLUMN public.role_audit_logs.action IS 'Type of action performed on roles/permissions';
COMMENT ON COLUMN public.role_audit_logs.changes IS 'JSON object describing what changed';
