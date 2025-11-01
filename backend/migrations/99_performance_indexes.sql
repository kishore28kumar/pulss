-- Performance Indexes Migration
-- Creates indexes to optimize common query patterns
-- Run this migration to improve database query performance

-- Tenants table indexes
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_created_at ON tenants(created_at);

-- Customers table indexes  
CREATE INDEX IF NOT EXISTS idx_customers_tenant_id ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_tenant_email ON customers(tenant_id, email);

-- Orders table indexes
CREATE INDEX IF NOT EXISTS idx_orders_tenant_id ON orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_tenant_status ON orders(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_created ON orders(customer_id, created_at);

-- Products table indexes
CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_tenant_category ON products(tenant_id, category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

-- Transactions table indexes
CREATE INDEX IF NOT EXISTS idx_transactions_tenant_id ON transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_customer_id ON transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_order_id ON transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_tenant_created ON transactions(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);

-- Audit logs table indexes (if exists)
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_created ON audit_logs(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);

-- Notifications table indexes (if exists)
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_id ON notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_status ON notifications(recipient_id, status);

-- API keys table indexes (if exists)
CREATE INDEX IF NOT EXISTS idx_api_keys_tenant_id ON api_keys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_api_keys_last_used ON api_keys(last_used_at);

-- Cart items indexes (if exists)
CREATE INDEX IF NOT EXISTS idx_cart_items_customer_id ON cart_items(customer_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_tenant_id ON cart_items(tenant_id);

-- Rewards table indexes (if exists)
CREATE INDEX IF NOT EXISTS idx_rewards_customer_id ON rewards(customer_id);
CREATE INDEX IF NOT EXISTS idx_rewards_tenant_id ON rewards(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rewards_created_at ON rewards(created_at);

-- Payment methods indexes (if exists)
CREATE INDEX IF NOT EXISTS idx_payment_methods_customer_id ON payment_methods(customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_tenant_id ON payment_methods(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_is_default ON payment_methods(is_default);

-- Billing table indexes (if exists)
CREATE INDEX IF NOT EXISTS idx_billing_tenant_id ON billing(tenant_id);
CREATE INDEX IF NOT EXISTS idx_billing_status ON billing(status);
CREATE INDEX IF NOT EXISTS idx_billing_due_date ON billing(due_date);
CREATE INDEX IF NOT EXISTS idx_billing_tenant_status ON billing(tenant_id, status);

-- Usage tracking indexes (if exists)
CREATE INDEX IF NOT EXISTS idx_usage_tracking_tenant_id ON usage_tracking(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_created_at ON usage_tracking(created_at);

-- Branding indexes (if exists)
CREATE INDEX IF NOT EXISTS idx_branding_tenant_id ON branding(tenant_id);

-- RBAC indexes (if exists)
CREATE INDEX IF NOT EXISTS idx_roles_tenant_id ON roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_permissions_role_id ON permissions(role_id);

-- Analytics optimization - partial indexes for common queries
CREATE INDEX IF NOT EXISTS idx_orders_completed ON orders(tenant_id, created_at) WHERE status = 'completed';
CREATE INDEX IF NOT EXISTS idx_orders_pending ON orders(tenant_id, created_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_customers_active ON customers(tenant_id, created_at) WHERE is_active = true;

-- Composite indexes for common join patterns
CREATE INDEX IF NOT EXISTS idx_orders_customer_tenant ON orders(customer_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_order_tenant ON transactions(order_id, tenant_id);

-- Text search indexes (if supported)
-- CREATE INDEX IF NOT EXISTS idx_products_name_search ON products USING gin(to_tsvector('english', name));
-- CREATE INDEX IF NOT EXISTS idx_customers_name_search ON customers USING gin(to_tsvector('english', name));

-- Update statistics for query planner
ANALYZE tenants;
ANALYZE customers;
ANALYZE orders;
ANALYZE products;
ANALYZE transactions;
ANALYZE audit_logs;

-- Log completion
SELECT 'Performance indexes created successfully' AS message;
