-- ============================================================================
-- Migration 11: RBAC (Role-Based Access Control) System
-- ============================================================================
-- Comprehensive RBAC system with roles, permissions, resources, and audit logging
-- All features controlled by super admin toggles per tenant/partner
-- ============================================================================

-- Resources table: Defines all controllable resources in the system
CREATE TABLE IF NOT EXISTS public.resources (
  resource_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE, -- e.g., 'products', 'orders', 'customers', 'reports'
  description TEXT,
  resource_type VARCHAR(50) NOT NULL, -- e.g., 'entity', 'feature', 'system'
  parent_resource_id UUID REFERENCES public.resources(resource_id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Permissions table: Defines granular permissions
CREATE TABLE IF NOT EXISTS public.permissions (
  permission_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  resource_id UUID REFERENCES public.resources(resource_id) ON DELETE CASCADE NOT NULL,
  action VARCHAR(50) NOT NULL, -- e.g., 'create', 'read', 'update', 'delete', 'export', 'import'
  name VARCHAR(150) NOT NULL UNIQUE, -- e.g., 'products:create', 'orders:read'
  description TEXT,
  is_system BOOLEAN DEFAULT false, -- System permissions cannot be deleted
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(resource_id, action)
);

-- Roles table: Defines roles with hierarchy support
CREATE TABLE IF NOT EXISTS public.roles (
  role_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(150) NOT NULL,
  description TEXT,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE, -- NULL for global roles
  partner_id UUID, -- For partner-specific roles
  parent_role_id UUID REFERENCES public.roles(role_id) ON DELETE SET NULL, -- For role inheritance
  is_system BOOLEAN DEFAULT false, -- System roles cannot be deleted
  is_custom BOOLEAN DEFAULT false, -- Custom roles created by admins
  priority INTEGER DEFAULT 0, -- Higher priority roles override lower ones
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_by UUID, -- Admin who created the role
  UNIQUE(name, tenant_id)
);

-- Role permissions mapping: Many-to-many relationship
CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_permission_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  role_id UUID REFERENCES public.roles(role_id) ON DELETE CASCADE NOT NULL,
  permission_id UUID REFERENCES public.permissions(permission_id) ON DELETE CASCADE NOT NULL,
  granted_by UUID, -- Admin who granted the permission
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(role_id, permission_id)
);

-- User roles table: Replaces simple role column in users table
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_role_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL, -- Can reference admins.admin_id or customers.customer_id
  user_type VARCHAR(20) NOT NULL, -- 'admin' or 'customer'
  role_id UUID REFERENCES public.roles(role_id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
  assigned_by UUID, -- Admin who assigned the role
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE, -- Optional: for temporary role assignments
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, role_id, tenant_id)
);

-- RBAC audit logs: Tracks all role and permission changes
CREATE TABLE IF NOT EXISTS public.rbac_audit_logs (
  audit_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL, -- 'role_created', 'role_updated', 'role_deleted', 'permission_granted', 'permission_revoked', etc.
  entity_type VARCHAR(50) NOT NULL, -- 'role', 'permission', 'user_role', etc.
  entity_id UUID NOT NULL,
  entity_name VARCHAR(255),
  performed_by UUID NOT NULL, -- Admin who performed the action
  performed_by_name VARCHAR(255),
  affected_user_id UUID, -- User affected by the action
  affected_user_name VARCHAR(255),
  old_value JSONB, -- Previous state
  new_value JSONB, -- New state
  changes JSONB, -- Specific changes made
  ip_address INET,
  user_agent TEXT,
  reason TEXT, -- Optional reason for the change
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RBAC feature flags: Super admin controls per tenant/partner
CREATE TABLE IF NOT EXISTS public.rbac_feature_flags (
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE PRIMARY KEY,
  partner_id UUID, -- For partner-level controls
  rbac_enabled BOOLEAN DEFAULT false, -- Master toggle for RBAC system
  custom_roles_enabled BOOLEAN DEFAULT false, -- Allow creating custom roles
  role_templates_enabled BOOLEAN DEFAULT true, -- Allow using role templates
  permission_inheritance_enabled BOOLEAN DEFAULT true, -- Enable permission inheritance
  bulk_assignment_enabled BOOLEAN DEFAULT false, -- Enable bulk role assignments
  audit_logging_enabled BOOLEAN DEFAULT true, -- Track RBAC changes
  access_review_enabled BOOLEAN DEFAULT false, -- Periodic access reviews
  least_privilege_enforcement BOOLEAN DEFAULT true, -- Enforce least-privilege principle
  role_expiration_enabled BOOLEAN DEFAULT false, -- Allow temporary role assignments
  max_custom_roles INTEGER DEFAULT 10, -- Limit custom roles per tenant
  max_users_per_role INTEGER DEFAULT 100, -- Limit users per role
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Role templates: Pre-configured role definitions
CREATE TABLE IF NOT EXISTS public.role_templates (
  template_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(150) NOT NULL,
  description TEXT,
  category VARCHAR(50), -- e.g., 'admin', 'customer', 'partner', 'support'
  permissions JSONB NOT NULL, -- Array of permission names
  is_system BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Access review schedule: Tracks periodic access reviews
CREATE TABLE IF NOT EXISTS public.access_reviews (
  review_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE CASCADE NOT NULL,
  review_type VARCHAR(50) NOT NULL, -- 'scheduled', 'adhoc', 'compliance'
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
  reviewer_id UUID NOT NULL,
  reviewer_name VARCHAR(255),
  scheduled_date TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  users_reviewed INTEGER DEFAULT 0,
  roles_reviewed INTEGER DEFAULT 0,
  changes_made INTEGER DEFAULT 0,
  findings JSONB, -- Array of issues found
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_resources_name ON public.resources(name);
CREATE INDEX idx_resources_type ON public.resources(resource_type);
CREATE INDEX idx_resources_active ON public.resources(is_active);

CREATE INDEX idx_permissions_resource ON public.permissions(resource_id);
CREATE INDEX idx_permissions_name ON public.permissions(name);
CREATE INDEX idx_permissions_active ON public.permissions(is_active);

CREATE INDEX idx_roles_tenant ON public.roles(tenant_id);
CREATE INDEX idx_roles_partner ON public.roles(partner_id);
CREATE INDEX idx_roles_name ON public.roles(name);
CREATE INDEX idx_roles_system ON public.roles(is_system);
CREATE INDEX idx_roles_custom ON public.roles(is_custom);
CREATE INDEX idx_roles_active ON public.roles(is_active);

CREATE INDEX idx_role_permissions_role ON public.role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON public.role_permissions(permission_id);

CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role_id);
CREATE INDEX idx_user_roles_tenant ON public.user_roles(tenant_id);
CREATE INDEX idx_user_roles_type ON public.user_roles(user_type);
CREATE INDEX idx_user_roles_active ON public.user_roles(is_active);
CREATE INDEX idx_user_roles_expires ON public.user_roles(expires_at);

CREATE INDEX idx_rbac_audit_tenant ON public.rbac_audit_logs(tenant_id);
CREATE INDEX idx_rbac_audit_action ON public.rbac_audit_logs(action_type);
CREATE INDEX idx_rbac_audit_entity ON public.rbac_audit_logs(entity_type, entity_id);
CREATE INDEX idx_rbac_audit_performer ON public.rbac_audit_logs(performed_by);
CREATE INDEX idx_rbac_audit_affected ON public.rbac_audit_logs(affected_user_id);
CREATE INDEX idx_rbac_audit_created ON public.rbac_audit_logs(created_at DESC);

CREATE INDEX idx_access_reviews_tenant ON public.access_reviews(tenant_id);
CREATE INDEX idx_access_reviews_status ON public.access_reviews(status);
CREATE INDEX idx_access_reviews_reviewer ON public.access_reviews(reviewer_id);
CREATE INDEX idx_access_reviews_date ON public.access_reviews(scheduled_date);

-- Insert default resources
INSERT INTO public.resources (name, description, resource_type, is_active) VALUES
('products', 'Product catalog management', 'entity', true),
('orders', 'Order processing and management', 'entity', true),
('customers', 'Customer information and profiles', 'entity', true),
('transactions', 'Financial transactions', 'entity', true),
('reports', 'Analytics and reporting', 'feature', true),
('settings', 'System and tenant settings', 'feature', true),
('users', 'User account management', 'entity', true),
('roles', 'Role management', 'entity', true),
('permissions', 'Permission management', 'entity', true),
('tenants', 'Tenant management', 'entity', true),
('analytics', 'Analytics and insights', 'feature', true),
('notifications', 'Notification system', 'feature', true),
('audit_logs', 'Audit trail viewing', 'feature', true),
('billing', 'Billing and invoicing', 'feature', true),
('branding', 'Branding and theme management', 'feature', true),
('api_keys', 'API key management', 'feature', true),
('integrations', 'Third-party integrations', 'feature', true),
('support', 'Customer support features', 'feature', true)
ON CONFLICT (name) DO NOTHING;

-- Insert default permissions for each resource
-- Products permissions
INSERT INTO public.permissions (resource_id, action, name, description, is_system) 
SELECT resource_id, 'create', 'products:create', 'Create new products', true FROM public.resources WHERE name = 'products'
ON CONFLICT (name) DO NOTHING;
INSERT INTO public.permissions (resource_id, action, name, description, is_system) 
SELECT resource_id, 'read', 'products:read', 'View products', true FROM public.resources WHERE name = 'products'
ON CONFLICT (name) DO NOTHING;
INSERT INTO public.permissions (resource_id, action, name, description, is_system) 
SELECT resource_id, 'update', 'products:update', 'Update products', true FROM public.resources WHERE name = 'products'
ON CONFLICT (name) DO NOTHING;
INSERT INTO public.permissions (resource_id, action, name, description, is_system) 
SELECT resource_id, 'delete', 'products:delete', 'Delete products', true FROM public.resources WHERE name = 'products'
ON CONFLICT (name) DO NOTHING;
INSERT INTO public.permissions (resource_id, action, name, description, is_system) 
SELECT resource_id, 'export', 'products:export', 'Export products', true FROM public.resources WHERE name = 'products'
ON CONFLICT (name) DO NOTHING;
INSERT INTO public.permissions (resource_id, action, name, description, is_system) 
SELECT resource_id, 'import', 'products:import', 'Import products', true FROM public.resources WHERE name = 'products'
ON CONFLICT (name) DO NOTHING;

-- Orders permissions
INSERT INTO public.permissions (resource_id, action, name, description, is_system) 
SELECT resource_id, 'create', 'orders:create', 'Create new orders', true FROM public.resources WHERE name = 'orders'
ON CONFLICT (name) DO NOTHING;
INSERT INTO public.permissions (resource_id, action, name, description, is_system) 
SELECT resource_id, 'read', 'orders:read', 'View orders', true FROM public.resources WHERE name = 'orders'
ON CONFLICT (name) DO NOTHING;
INSERT INTO public.permissions (resource_id, action, name, description, is_system) 
SELECT resource_id, 'update', 'orders:update', 'Update order status', true FROM public.resources WHERE name = 'orders'
ON CONFLICT (name) DO NOTHING;
INSERT INTO public.permissions (resource_id, action, name, description, is_system) 
SELECT resource_id, 'delete', 'orders:delete', 'Cancel orders', true FROM public.resources WHERE name = 'orders'
ON CONFLICT (name) DO NOTHING;
INSERT INTO public.permissions (resource_id, action, name, description, is_system) 
SELECT resource_id, 'export', 'orders:export', 'Export orders', true FROM public.resources WHERE name = 'orders'
ON CONFLICT (name) DO NOTHING;

-- Customers permissions
INSERT INTO public.permissions (resource_id, action, name, description, is_system) 
SELECT resource_id, 'create', 'customers:create', 'Add new customers', true FROM public.resources WHERE name = 'customers'
ON CONFLICT (name) DO NOTHING;
INSERT INTO public.permissions (resource_id, action, name, description, is_system) 
SELECT resource_id, 'read', 'customers:read', 'View customer information', true FROM public.resources WHERE name = 'customers'
ON CONFLICT (name) DO NOTHING;
INSERT INTO public.permissions (resource_id, action, name, description, is_system) 
SELECT resource_id, 'update', 'customers:update', 'Update customer information', true FROM public.resources WHERE name = 'customers'
ON CONFLICT (name) DO NOTHING;
INSERT INTO public.permissions (resource_id, action, name, description, is_system) 
SELECT resource_id, 'delete', 'customers:delete', 'Delete customers', true FROM public.resources WHERE name = 'customers'
ON CONFLICT (name) DO NOTHING;
INSERT INTO public.permissions (resource_id, action, name, description, is_system) 
SELECT resource_id, 'export', 'customers:export', 'Export customer data', true FROM public.resources WHERE name = 'customers'
ON CONFLICT (name) DO NOTHING;

-- Reports permissions
INSERT INTO public.permissions (resource_id, action, name, description, is_system) 
SELECT resource_id, 'read', 'reports:read', 'View reports', true FROM public.resources WHERE name = 'reports'
ON CONFLICT (name) DO NOTHING;
INSERT INTO public.permissions (resource_id, action, name, description, is_system) 
SELECT resource_id, 'export', 'reports:export', 'Export reports', true FROM public.resources WHERE name = 'reports'
ON CONFLICT (name) DO NOTHING;

-- Settings permissions
INSERT INTO public.permissions (resource_id, action, name, description, is_system) 
SELECT resource_id, 'read', 'settings:read', 'View settings', true FROM public.resources WHERE name = 'settings'
ON CONFLICT (name) DO NOTHING;
INSERT INTO public.permissions (resource_id, action, name, description, is_system) 
SELECT resource_id, 'update', 'settings:update', 'Modify settings', true FROM public.resources WHERE name = 'settings'
ON CONFLICT (name) DO NOTHING;

-- Users permissions
INSERT INTO public.permissions (resource_id, action, name, description, is_system) 
SELECT resource_id, 'create', 'users:create', 'Create new users', true FROM public.resources WHERE name = 'users'
ON CONFLICT (name) DO NOTHING;
INSERT INTO public.permissions (resource_id, action, name, description, is_system) 
SELECT resource_id, 'read', 'users:read', 'View users', true FROM public.resources WHERE name = 'users'
ON CONFLICT (name) DO NOTHING;
INSERT INTO public.permissions (resource_id, action, name, description, is_system) 
SELECT resource_id, 'update', 'users:update', 'Update user information', true FROM public.resources WHERE name = 'users'
ON CONFLICT (name) DO NOTHING;
INSERT INTO public.permissions (resource_id, action, name, description, is_system) 
SELECT resource_id, 'delete', 'users:delete', 'Delete users', true FROM public.resources WHERE name = 'users'
ON CONFLICT (name) DO NOTHING;

-- Roles permissions
INSERT INTO public.permissions (resource_id, action, name, description, is_system) 
SELECT resource_id, 'create', 'roles:create', 'Create custom roles', true FROM public.resources WHERE name = 'roles'
ON CONFLICT (name) DO NOTHING;
INSERT INTO public.permissions (resource_id, action, name, description, is_system) 
SELECT resource_id, 'read', 'roles:read', 'View roles', true FROM public.resources WHERE name = 'roles'
ON CONFLICT (name) DO NOTHING;
INSERT INTO public.permissions (resource_id, action, name, description, is_system) 
SELECT resource_id, 'update', 'roles:update', 'Modify roles', true FROM public.resources WHERE name = 'roles'
ON CONFLICT (name) DO NOTHING;
INSERT INTO public.permissions (resource_id, action, name, description, is_system) 
SELECT resource_id, 'delete', 'roles:delete', 'Delete roles', true FROM public.resources WHERE name = 'roles'
ON CONFLICT (name) DO NOTHING;
INSERT INTO public.permissions (resource_id, action, name, description, is_system) 
SELECT resource_id, 'assign', 'roles:assign', 'Assign roles to users', true FROM public.resources WHERE name = 'roles'
ON CONFLICT (name) DO NOTHING;

-- Permissions permissions (meta)
INSERT INTO public.permissions (resource_id, action, name, description, is_system) 
SELECT resource_id, 'read', 'permissions:read', 'View permissions', true FROM public.resources WHERE name = 'permissions'
ON CONFLICT (name) DO NOTHING;
INSERT INTO public.permissions (resource_id, action, name, description, is_system) 
SELECT resource_id, 'update', 'permissions:update', 'Grant/revoke permissions', true FROM public.resources WHERE name = 'permissions'
ON CONFLICT (name) DO NOTHING;

-- Audit logs permissions
INSERT INTO public.permissions (resource_id, action, name, description, is_system) 
SELECT resource_id, 'read', 'audit_logs:read', 'View audit logs', true FROM public.resources WHERE name = 'audit_logs'
ON CONFLICT (name) DO NOTHING;
INSERT INTO public.permissions (resource_id, action, name, description, is_system) 
SELECT resource_id, 'export', 'audit_logs:export', 'Export audit logs', true FROM public.resources WHERE name = 'audit_logs'
ON CONFLICT (name) DO NOTHING;

-- Analytics permissions
INSERT INTO public.permissions (resource_id, action, name, description, is_system) 
SELECT resource_id, 'read', 'analytics:read', 'View analytics', true FROM public.resources WHERE name = 'analytics'
ON CONFLICT (name) DO NOTHING;

-- Tenants permissions (super admin only)
INSERT INTO public.permissions (resource_id, action, name, description, is_system) 
SELECT resource_id, 'create', 'tenants:create', 'Create new tenants', true FROM public.resources WHERE name = 'tenants'
ON CONFLICT (name) DO NOTHING;
INSERT INTO public.permissions (resource_id, action, name, description, is_system) 
SELECT resource_id, 'read', 'tenants:read', 'View tenants', true FROM public.resources WHERE name = 'tenants'
ON CONFLICT (name) DO NOTHING;
INSERT INTO public.permissions (resource_id, action, name, description, is_system) 
SELECT resource_id, 'update', 'tenants:update', 'Update tenants', true FROM public.resources WHERE name = 'tenants'
ON CONFLICT (name) DO NOTHING;
INSERT INTO public.permissions (resource_id, action, name, description, is_system) 
SELECT resource_id, 'delete', 'tenants:delete', 'Delete tenants', true FROM public.resources WHERE name = 'tenants'
ON CONFLICT (name) DO NOTHING;

-- Insert predefined system roles
INSERT INTO public.roles (name, display_name, description, is_system, is_custom, priority) VALUES
('super_admin', 'Super Administrator', 'Full system access across all tenants', true, false, 1000),
('admin', 'Administrator', 'Full access within tenant', true, false, 900),
('partner', 'Partner', 'Partner with access to multiple tenants', true, false, 800),
('reseller', 'Reseller', 'Reseller with limited administrative access', true, false, 700),
('support', 'Support Agent', 'Customer support representative', true, false, 600),
('user', 'User', 'Basic user with limited access', true, false, 100)
ON CONFLICT (name, tenant_id) DO NOTHING;

-- Grant all permissions to super_admin role
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'super_admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Grant admin permissions (all except tenant management)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'admin'
AND p.name NOT LIKE 'tenants:%'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Grant support permissions (read-only mostly)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'support'
AND (p.action IN ('read') OR p.name IN ('orders:update', 'customers:update'))
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Grant user permissions (minimal)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'user'
AND p.name IN ('products:read', 'orders:create', 'orders:read')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Insert default role templates
INSERT INTO public.role_templates (name, display_name, description, category, permissions) VALUES
('store_manager', 'Store Manager', 'Manages day-to-day store operations', 'admin', 
 '["products:create", "products:read", "products:update", "orders:read", "orders:update", "customers:read", "reports:read"]'::jsonb),
('inventory_manager', 'Inventory Manager', 'Manages product inventory', 'admin',
 '["products:create", "products:read", "products:update", "products:import", "products:export"]'::jsonb),
('customer_service', 'Customer Service Representative', 'Handles customer inquiries and orders', 'support',
 '["customers:read", "orders:read", "orders:update", "products:read"]'::jsonb),
('sales_rep', 'Sales Representative', 'Focused on sales and customer relations', 'support',
 '["customers:read", "customers:create", "orders:create", "orders:read", "products:read"]'::jsonb),
('accountant', 'Accountant', 'Manages financial aspects', 'admin',
 '["reports:read", "reports:export", "orders:read", "analytics:read"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Initialize RBAC feature flags for existing tenants
INSERT INTO public.rbac_feature_flags (tenant_id)
SELECT tenant_id FROM public.tenants
ON CONFLICT (tenant_id) DO NOTHING;

-- Comments
COMMENT ON TABLE public.resources IS 'Defines all controllable resources in the system';
COMMENT ON TABLE public.permissions IS 'Granular permissions for resources and actions';
COMMENT ON TABLE public.roles IS 'Role definitions with hierarchy support';
COMMENT ON TABLE public.role_permissions IS 'Maps roles to their permissions';
COMMENT ON TABLE public.user_roles IS 'Assigns roles to users';
COMMENT ON TABLE public.rbac_audit_logs IS 'Audit trail for all RBAC changes';
COMMENT ON TABLE public.rbac_feature_flags IS 'Super admin controls for RBAC features per tenant';
COMMENT ON TABLE public.role_templates IS 'Pre-configured role templates for quick setup';
COMMENT ON TABLE public.access_reviews IS 'Tracks periodic access reviews for compliance';
