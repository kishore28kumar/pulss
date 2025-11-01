-- ============================================================================
-- Migration 09: Performance Indexes
-- ============================================================================
-- Adds composite and covering indexes for common query patterns
-- ============================================================================

-- Products table indexes
CREATE INDEX IF NOT EXISTS idx_products_tenant_active ON public.products(tenant_id, active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id, active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_products_sku_tenant ON public.products(sku, tenant_id) WHERE sku IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(tenant_id, featured, created_at DESC) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_products_search ON public.products USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Orders table indexes
CREATE INDEX IF NOT EXISTS idx_orders_tenant_status_date ON public.orders(tenant_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status, tenant_id);

-- Order items for reporting
CREATE INDEX IF NOT EXISTS idx_order_items_product ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

-- Customers table indexes
CREATE INDEX IF NOT EXISTS idx_customers_tenant_active ON public.customers(tenant_id, is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customers_email_tenant ON public.customers(email, tenant_id) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_loyalty ON public.customers(tenant_id, loyalty_points DESC) WHERE loyalty_points > 0;

-- Categories indexes
CREATE INDEX IF NOT EXISTS idx_categories_tenant_active ON public.categories(tenant_id, is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON public.categories(parent_id) WHERE parent_id IS NOT NULL;

-- Transactions indexes
CREATE INDEX IF NOT EXISTS idx_transactions_customer_date ON public.transactions(customer_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_tenant_date ON public.transactions(tenant_id, transaction_date DESC);

-- Rewards indexes
CREATE INDEX IF NOT EXISTS idx_rewards_tenant_active ON public.rewards(tenant_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_customer ON public.reward_redemptions(customer_id, redeemed_at DESC);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_admin_unread ON public.notifications(admin_id, read, created_at DESC) WHERE admin_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_customer_unread ON public.notifications(customer_id, read, created_at DESC) WHERE customer_id IS NOT NULL;

-- Store settings for quick tenant lookup
CREATE INDEX IF NOT EXISTS idx_store_settings_tenant ON public.store_settings(tenant_id);

-- Feature flags
CREATE INDEX IF NOT EXISTS idx_feature_flags_tenant ON public.feature_flags(tenant_id);

-- Announcements
CREATE INDEX IF NOT EXISTS idx_announcements_tenant_active ON public.announcements(tenant_id, active, created_at DESC);

-- Comments
COMMENT ON INDEX idx_products_search IS 'Full-text search index for product names and descriptions';
COMMENT ON INDEX idx_orders_tenant_status_date IS 'Composite index for common order queries by tenant and status';
COMMENT ON INDEX idx_customers_loyalty IS 'Index for loyalty program queries and leaderboards';
