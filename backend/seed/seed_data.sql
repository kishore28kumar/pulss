-- ============================================================================
-- Pulss Database Seed Data - Test Data for Local Development
-- ============================================================================
-- This file contains sample data for testing the Pulss platform
-- Password for all test accounts: "Password123!" (hashed with bcrypt)
-- ============================================================================

-- ============================================================================
-- INSERT TENANTS
-- ============================================================================

INSERT INTO public.tenants (tenant_id, name, subdomain, business_type, city, state, country, status) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'City Care Pharmacy', 'citypharmacy', 'pharmacy', 'Mumbai', 'Maharashtra', 'India', 'active'),
('550e8400-e29b-41d4-a716-446655440002', 'Green Mart Grocery', 'greenmart', 'grocery', 'Delhi', 'Delhi', 'India', 'active'),
('550e8400-e29b-41d4-a716-446655440003', 'Health Plus Store', 'healthplus', 'pharmacy', 'Bangalore', 'Karnataka', 'India', 'active'),
('550e8400-e29b-41d4-a716-446655440004', 'Fresh Foods Market', 'freshfoods', 'grocery', 'Pune', 'Maharashtra', 'India', 'active'),
('550e8400-e29b-41d4-a716-446655440005', 'Wellness Hub', 'wellnesshub', 'pharmacy', 'Chennai', 'Tamil Nadu', 'India', 'active')
ON CONFLICT (tenant_id) DO NOTHING;

-- ============================================================================
-- INSERT ADMINS (password: "Password123!" hashed with bcrypt rounds=10)
-- ============================================================================

-- Super Admin (no tenant_id)
INSERT INTO public.admins (admin_id, tenant_id, email, password_hash, full_name, role, is_active) VALUES
('a0000000-0000-0000-0000-000000000001', NULL, 'superadmin@pulss.app', '$2b$10$YZ1FvRqQgVYKW6z7F5jgDuJ0fJYvh4gPJqE8qxF.tLZ6vQ8aL8vUK', 'Super Admin', 'super_admin', true)
ON CONFLICT (admin_id) DO NOTHING;

-- Tenant Admins
INSERT INTO public.admins (admin_id, tenant_id, email, password_hash, full_name, role, is_active) VALUES
('a0000000-0000-0000-0000-000000000002', '550e8400-e29b-41d4-a716-446655440001', 'admin@citypharmacy.com', '$2b$10$YZ1FvRqQgVYKW6z7F5jgDuJ0fJYvh4gPJqE8qxF.tLZ6vQ8aL8vUK', 'Rajesh Kumar', 'admin', true),
('a0000000-0000-0000-0000-000000000003', '550e8400-e29b-41d4-a716-446655440002', 'admin@greenmart.com', '$2b$10$YZ1FvRqQgVYKW6z7F5jgDuJ0fJYvh4gPJqE8qxF.tLZ6vQ8aL8vUK', 'Priya Sharma', 'admin', true),
('a0000000-0000-0000-0000-000000000004', '550e8400-e29b-41d4-a716-446655440003', 'admin@healthplus.com', '$2b$10$YZ1FvRqQgVYKW6z7F5jgDuJ0fJYvh4gPJqE8qxF.tLZ6vQ8aL8vUK', 'Amit Patel', 'admin', true),
('a0000000-0000-0000-0000-000000000005', '550e8400-e29b-41d4-a716-446655440004', 'admin@freshfoods.com', '$2b$10$YZ1FvRqQgVYKW6z7F5jgDuJ0fJYvh4gPJqE8qxF.tLZ6vQ8aL8vUK', 'Sneha Reddy', 'admin', true),
('a0000000-0000-0000-0000-000000000006', '550e8400-e29b-41d4-a716-446655440005', 'admin@wellnesshub.com', '$2b$10$YZ1FvRqQgVYKW6z7F5jgDuJ0fJYvh4gPJqE8qxF.tLZ6vQ8aL8vUK', 'Vikram Singh', 'admin', true)
ON CONFLICT (admin_id) DO NOTHING;

-- ============================================================================
-- INSERT CUSTOMERS (10 customers across tenants)
-- ============================================================================

INSERT INTO public.customers (customer_id, tenant_id, email, password_hash, name, phone, loyalty_points) VALUES
('c0000000-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440001', 'customer1@example.com', '$2b$10$YZ1FvRqQgVYKW6z7F5jgDuJ0fJYvh4gPJqE8qxF.tLZ6vQ8aL8vUK', 'Anjali Mehta', '+919876543210', 150),
('c0000000-0000-0000-0000-000000000002', '550e8400-e29b-41d4-a716-446655440001', 'customer2@example.com', '$2b$10$YZ1FvRqQgVYKW6z7F5jgDuJ0fJYvh4gPJqE8qxF.tLZ6vQ8aL8vUK', 'Rohan Verma', '+919876543211', 320),
('c0000000-0000-0000-0000-000000000003', '550e8400-e29b-41d4-a716-446655440002', 'customer3@example.com', '$2b$10$YZ1FvRqQgVYKW6z7F5jgDuJ0fJYvh4gPJqE8qxF.tLZ6vQ8aL8vUK', 'Neha Gupta', '+919876543212', 200),
('c0000000-0000-0000-0000-000000000004', '550e8400-e29b-41d4-a716-446655440002', 'customer4@example.com', '$2b$10$YZ1FvRqQgVYKW6z7F5jgDuJ0fJYvh4gPJqE8qxF.tLZ6vQ8aL8vUK', 'Sanjay Iyer', '+919876543213', 450),
('c0000000-0000-0000-0000-000000000005', '550e8400-e29b-41d4-a716-446655440003', 'customer5@example.com', '$2b$10$YZ1FvRqQgVYKW6z7F5jgDuJ0fJYvh4gPJqE8qxF.tLZ6vQ8aL8vUK', 'Pooja Nair', '+919876543214', 180),
('c0000000-0000-0000-0000-000000000006', '550e8400-e29b-41d4-a716-446655440003', 'customer6@example.com', NULL, 'Arjun Das', '+919876543215', 90),
('c0000000-0000-0000-0000-000000000007', '550e8400-e29b-41d4-a716-446655440004', 'customer7@example.com', NULL, 'Kavya Joshi', '+919876543216', 260),
('c0000000-0000-0000-0000-000000000008', '550e8400-e29b-41d4-a716-446655440004', 'customer8@example.com', '$2b$10$YZ1FvRqQgVYKW6z7F5jgDuJ0fJYvh4gPJqE8qxF.tLZ6vQ8aL8vUK', 'Manish Rao', '+919876543217', 510),
('c0000000-0000-0000-0000-000000000009', '550e8400-e29b-41d4-a716-446655440005', 'customer9@example.com', NULL, 'Divya Khanna', '+919876543218', 75),
('c0000000-0000-0000-0000-000000000010', '550e8400-e29b-41d4-a716-446655440005', 'customer10@example.com', '$2b$10$YZ1FvRqQgVYKW6z7F5jgDuJ0fJYvh4gPJqE8qxF.tLZ6vQ8aL8vUK', 'Karthik Menon', '+919876543219', 340)
ON CONFLICT (customer_id) DO NOTHING;

-- ============================================================================
-- INSERT CATEGORIES
-- ============================================================================

INSERT INTO public.categories (category_id, tenant_id, name, description, icon, display_order, is_active) VALUES
-- City Care Pharmacy Categories
('cat00000-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440001', 'Medicines', 'Prescription and OTC medicines', 'pill', 1, true),
('cat00000-0000-0000-0000-000000000002', '550e8400-e29b-41d4-a716-446655440001', 'Vitamins & Supplements', 'Health supplements and vitamins', 'heart', 2, true),
('cat00000-0000-0000-0000-000000000003', '550e8400-e29b-41d4-a716-446655440001', 'Personal Care', 'Personal hygiene products', 'sparkle', 3, true),

-- Green Mart Grocery Categories
('cat00000-0000-0000-0000-000000000004', '550e8400-e29b-41d4-a716-446655440002', 'Fresh Vegetables', 'Farm fresh vegetables', 'leaf', 1, true),
('cat00000-0000-0000-0000-000000000005', '550e8400-e29b-41d4-a716-446655440002', 'Fruits', 'Fresh seasonal fruits', 'apple', 2, true),
('cat00000-0000-0000-0000-000000000006', '550e8400-e29b-41d4-a716-446655440002', 'Dairy Products', 'Milk, cheese, butter', 'milk', 3, true)
ON CONFLICT (category_id) DO NOTHING;

-- ============================================================================
-- INSERT PRODUCTS
-- ============================================================================

INSERT INTO public.products (product_id, tenant_id, category_id, name, description, brand, pack_size, price, mrp, active, featured, inventory_count) VALUES
-- City Care Pharmacy Products
('prod0000-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440001', 'cat00000-0000-0000-0000-000000000001', 'Paracetamol 500mg', 'Pain and fever relief', 'Crocin', '15 tablets', 45.00, 50.00, true, true, 500),
('prod0000-0000-0000-0000-000000000002', '550e8400-e29b-41d4-a716-446655440001', 'cat00000-0000-0000-0000-000000000001', 'Ibuprofen 400mg', 'Anti-inflammatory', 'Brufen', '10 tablets', 85.00, 95.00, true, false, 300),
('prod0000-0000-0000-0000-000000000003', '550e8400-e29b-41d4-a716-446655440001', 'cat00000-0000-0000-0000-000000000002', 'Vitamin D3 60000 IU', 'Vitamin D supplement', 'Calcirol', '4 sachets', 180.00, 200.00, true, true, 250),
('prod0000-0000-0000-0000-000000000004', '550e8400-e29b-41d4-a716-446655440001', 'cat00000-0000-0000-0000-000000000002', 'Multivitamin Tablets', 'Complete daily nutrition', 'Revital', '30 tablets', 350.00, 400.00, true, false, 150),
('prod0000-0000-0000-0000-000000000005', '550e8400-e29b-41d4-a716-446655440001', 'cat00000-0000-0000-0000-000000000003', 'Hand Sanitizer 500ml', 'Kills 99.9% germs', 'Dettol', '500ml', 120.00, 150.00, true, false, 400),

-- Green Mart Grocery Products
('prod0000-0000-0000-0000-000000000006', '550e8400-e29b-41d4-a716-446655440002', 'cat00000-0000-0000-0000-000000000004', 'Fresh Tomatoes', 'Farm fresh tomatoes', 'Local Farm', '1 kg', 40.00, 45.00, true, true, 100),
('prod0000-0000-0000-0000-000000000007', '550e8400-e29b-41d4-a716-446655440002', 'cat00000-0000-0000-0000-000000000004', 'Onions', 'Premium quality onions', 'Local Farm', '1 kg', 35.00, 40.00, true, false, 150),
('prod0000-0000-0000-0000-000000000008', '550e8400-e29b-41d4-a716-446655440002', 'cat00000-0000-0000-0000-000000000005', 'Fresh Apples', 'Kashmiri apples', 'Kashmir Valley', '1 kg', 180.00, 200.00, true, true, 80),
('prod0000-0000-0000-0000-000000000009', '550e8400-e29b-41d4-a716-446655440002', 'cat00000-0000-0000-0000-000000000006', 'Milk', 'Full cream milk', 'Amul', '1 liter', 60.00, 65.00, true, false, 200),
('prod0000-0000-0000-0000-000000000010', '550e8400-e29b-41d4-a716-446655440002', 'cat00000-0000-0000-0000-000000000006', 'Butter', 'Salted butter', 'Amul', '500g', 240.00, 260.00, true, false, 100)
ON CONFLICT (product_id) DO NOTHING;

-- ============================================================================
-- INSERT ORDERS
-- ============================================================================

INSERT INTO public.orders (order_id, tenant_id, customer_id, order_number, status, total, payment_method, payment_status, delivery_address, delivery_phone) VALUES
('ord00000-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440001', 'c0000000-0000-0000-0000-000000000001', 'ORD-2024-0001', 'completed', 225.00, 'upi', 'paid', '123 Main St, Mumbai', '+919876543210'),
('ord00000-0000-0000-0000-000000000002', '550e8400-e29b-41d4-a716-446655440001', 'c0000000-0000-0000-0000-000000000002', 'ORD-2024-0002', 'completed', 435.00, 'cash', 'paid', '456 Park Ave, Mumbai', '+919876543211'),
('ord00000-0000-0000-0000-000000000003', '550e8400-e29b-41d4-a716-446655440002', 'c0000000-0000-0000-0000-000000000003', 'ORD-2024-0003', 'completed', 315.00, 'upi', 'paid', '789 Green St, Delhi', '+919876543212'),
('ord00000-0000-0000-0000-000000000004', '550e8400-e29b-41d4-a716-446655440002', 'c0000000-0000-0000-0000-000000000004', 'ORD-2024-0004', 'pending', 480.00, 'upi', 'pending', '321 Lake View, Delhi', '+919876543213')
ON CONFLICT (order_id) DO NOTHING;

-- ============================================================================
-- INSERT ORDER ITEMS
-- ============================================================================

INSERT INTO public.order_items (order_id, product_id, quantity, unit_price, line_total) VALUES
('ord00000-0000-0000-0000-000000000001', 'prod0000-0000-0000-0000-000000000001', 2, 45.00, 90.00),
('ord00000-0000-0000-0000-000000000001', 'prod0000-0000-0000-0000-000000000005', 1, 120.00, 120.00),
('ord00000-0000-0000-0000-000000000002', 'prod0000-0000-0000-0000-000000000002', 1, 85.00, 85.00),
('ord00000-0000-0000-0000-000000000002', 'prod0000-0000-0000-0000-000000000004', 1, 350.00, 350.00),
('ord00000-0000-0000-0000-000000000003', 'prod0000-0000-0000-0000-000000000006', 3, 40.00, 120.00),
('ord00000-0000-0000-0000-000000000003', 'prod0000-0000-0000-0000-000000000008', 1, 180.00, 180.00),
('ord00000-0000-0000-0000-000000000004', 'prod0000-0000-0000-0000-000000000009', 4, 60.00, 240.00),
('ord00000-0000-0000-0000-000000000004', 'prod0000-0000-0000-0000-000000000010', 1, 240.00, 240.00)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- INSERT TRANSACTIONS (Loyalty Points)
-- ============================================================================

INSERT INTO public.transactions (transaction_id, tenant_id, customer_id, order_id, purchase_amount, points_earned, transaction_date) VALUES
('trx00000-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440001', 'c0000000-0000-0000-0000-000000000001', 'ord00000-0000-0000-0000-000000000001', 225.00, 22, NOW() - INTERVAL '5 days'),
('trx00000-0000-0000-0000-000000000002', '550e8400-e29b-41d4-a716-446655440001', 'c0000000-0000-0000-0000-000000000002', 'ord00000-0000-0000-0000-000000000002', 435.00, 43, NOW() - INTERVAL '3 days'),
('trx00000-0000-0000-0000-000000000003', '550e8400-e29b-41d4-a716-446655440002', 'c0000000-0000-0000-0000-000000000003', 'ord00000-0000-0000-0000-000000000003', 315.00, 31, NOW() - INTERVAL '2 days')
ON CONFLICT (transaction_id) DO NOTHING;

-- ============================================================================
-- INSERT REWARDS
-- ============================================================================

INSERT INTO public.rewards (reward_id, tenant_id, name, description, points_required, reward_type, discount_amount, is_active) VALUES
('rew00000-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440001', '₹50 Off', 'Get ₹50 off on your next purchase', 100, 'discount', 50.00, true),
('rew00000-0000-0000-0000-000000000002', '550e8400-e29b-41d4-a716-446655440001', '₹100 Off', 'Get ₹100 off on your next purchase', 200, 'discount', 100.00, true),
('rew00000-0000-0000-0000-000000000003', '550e8400-e29b-41d4-a716-446655440001', 'Free Sanitizer', 'Get a free hand sanitizer', 150, 'freebie', NULL, true),
('rew00000-0000-0000-0000-000000000004', '550e8400-e29b-41d4-a716-446655440002', '₹75 Off', 'Get ₹75 off on groceries', 150, 'discount', 75.00, true),
('rew00000-0000-0000-0000-000000000005', '550e8400-e29b-41d4-a716-446655440002', '₹200 Off', 'Get ₹200 off on orders above ₹1000', 400, 'discount', 200.00, true)
ON CONFLICT (reward_id) DO NOTHING;

-- ============================================================================
-- INSERT REWARD REDEMPTIONS
-- ============================================================================

INSERT INTO public.reward_redemptions (redemption_id, tenant_id, customer_id, reward_id, points_used, status, redeemed_at) VALUES
('red00000-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440001', 'c0000000-0000-0000-0000-000000000001', 'rew00000-0000-0000-0000-000000000001', 100, 'used', NOW() - INTERVAL '1 day'),
('red00000-0000-0000-0000-000000000002', '550e8400-e29b-41d4-a716-446655440001', 'c0000000-0000-0000-0000-000000000002', 'rew00000-0000-0000-0000-000000000003', 150, 'redeemed', NOW() - INTERVAL '6 hours')
ON CONFLICT (redemption_id) DO NOTHING;

-- ============================================================================
-- INSERT FEATURE FLAGS
-- ============================================================================

INSERT INTO public.feature_flags (tenant_id, loyalty_enabled, tracking_enabled, whatsapp_notifications_enabled) VALUES
('550e8400-e29b-41d4-a716-446655440001', true, true, true),
('550e8400-e29b-41d4-a716-446655440002', true, false, true),
('550e8400-e29b-41d4-a716-446655440003', true, true, false),
('550e8400-e29b-41d4-a716-446655440004', false, false, true),
('550e8400-e29b-41d4-a716-446655440005', true, true, true)
ON CONFLICT (tenant_id) DO NOTHING;

-- ============================================================================
-- INSERT STORE SETTINGS
-- ============================================================================

INSERT INTO public.store_settings (tenant_id, name, business_name, address, city, state, phone, whatsapp_number, upi_id) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'City Care Pharmacy', 'City Care Pharmacy Pvt Ltd', '123 MG Road, Mumbai', 'Mumbai', 'Maharashtra', '+912212345678', '+919876543200', 'citypharmacy@paytm'),
('550e8400-e29b-41d4-a716-446655440002', 'Green Mart Grocery', 'Green Mart Supermarket', '456 Connaught Place, Delhi', 'Delhi', 'Delhi', '+911112345678', '+919876543201', 'greenmart@upi'),
('550e8400-e29b-41d4-a716-446655440003', 'Health Plus Store', 'Health Plus Pharmacy', '789 Brigade Road, Bangalore', 'Bangalore', 'Karnataka', '+918012345678', '+919876543202', 'healthplus@paytm'),
('550e8400-e29b-41d4-a716-446655440004', 'Fresh Foods Market', 'Fresh Foods Pvt Ltd', '321 FC Road, Pune', 'Pune', 'Maharashtra', '+912012345678', '+919876543203', 'freshfoods@upi'),
('550e8400-e29b-41d4-a716-446655440005', 'Wellness Hub', 'Wellness Hub Pharmacy', '654 Anna Salai, Chennai', 'Chennai', 'Tamil Nadu', '+914412345678', '+919876543204', 'wellnesshub@paytm')
ON CONFLICT (tenant_id) DO NOTHING;

-- ============================================================================
-- TEST CREDENTIALS SUMMARY
-- ============================================================================
-- Super Admin:
--   Email: superadmin@pulss.app
--   Password: Password123!
--
-- Tenant Admins (all password: Password123!):
--   admin@citypharmacy.com - City Care Pharmacy
--   admin@greenmart.com - Green Mart Grocery
--   admin@healthplus.com - Health Plus Store
--   admin@freshfoods.com - Fresh Foods Market
--   admin@wellnesshub.com - Wellness Hub
--
-- Sample Customers (all password: Password123!):
--   customer1@example.com - City Care Pharmacy
--   customer2@example.com - City Care Pharmacy
--   customer3@example.com - Green Mart Grocery
--   (some customers have no password - phone-based auth)
-- ============================================================================
