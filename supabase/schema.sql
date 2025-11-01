-- Pulss Database Schema
-- This file contains the essential database structure for the Pulss white-label platform

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- Tenants (Multi-tenant stores)
create table public.tenants (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  subdomain text unique,
  status text default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- User Profiles (All users across all tenants)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email citext,
  full_name text,
  role text not null default 'customer',
  tenant_id uuid references public.tenants(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Store Settings (per tenant)
create table public.chemist_settings (
  tenant_id uuid references public.tenants(id) on delete cascade primary key,
  name text, -- Store/Chemist name
  logo_url text,
  address text,
  hero_images text[],
  splash_screen_url text, -- Current splash screen image
  carousel_images text[], -- Homepage carousel
  upi_id text,
  upi_qr_code_url text, -- UPI QR code image
  bank_details jsonb, -- Bank account details
  whatsapp_number text,
  social_media jsonb, -- Social media links {facebook, instagram, twitter, etc}
  primary_color text, -- Theme primary color
  theme_id uuid references public.themes(id), -- Selected theme
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Global App Settings (Super Admin only)
create table public.app_settings (
  id uuid default uuid_generate_v4() primary key,
  main_logo_url text, -- Pulss main logo
  app_name text default 'Pulss',
  default_theme_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Themes System
create table public.themes (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  type text not null default 'custom', -- 'system', 'custom'
  is_active boolean default true,
  color_scheme jsonb not null, -- CSS custom properties
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Categories
create table public.categories (
  id uuid default uuid_generate_v4() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  name text not null,
  description text,
  image_url text,
  icon text, -- Icon name for category
  display_order integer default 0,
  is_active boolean default true,
  parent_id uuid references public.categories(id), -- For subcategories
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Products
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  description text,
  brand text,
  pack_size text,
  price decimal(10,2) not null,
  mrp decimal(10,2) not null,
  image_url text,
  images text[], -- Multiple product images
  requires_rx boolean default false,
  active boolean default true, -- Changed from is_active for consistency
  featured boolean default false, -- Featured products
  inventory_count integer default 0,
  sku text, -- Stock Keeping Unit
  tags text[], -- Search tags
  weight text, -- Product weight
  dimensions text, -- Product dimensions
  manufacturer text,
  composition text, -- Active ingredients
  uses text, -- Medical uses/indications
  side_effects text, -- Known side effects
  requires_prescription boolean default false, -- Alias for requires_rx for compatibility
  expiry_date date,
  batch_number text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Customers (per tenant)
create table public.customers (
  id uuid default uuid_generate_v4() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  email citext,
  phone text,
  loyalty_points bigint default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Orders
create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  customer_id uuid references public.customers(id) on delete cascade not null,
  order_number text not null,
  status text not null default 'pending',
  total decimal(10,2) not null,
  payment_method text not null,
  payment_status text default 'pending',
  delivery_address text,
  delivery_phone text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Order Items
create table public.order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  quantity integer not null,
  unit_price decimal(10,2) not null,
  line_total decimal(10,2) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Pending Admin Invites
create table public.pending_admin_invites (
  email citext primary key,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  setup_code text not null unique,
  must_change_password boolean default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Feature Flags (per tenant)
create table public.feature_flags (
  tenant_id uuid references public.tenants(id) on delete cascade primary key,
  tracking_enabled boolean default false,
  wallet_enabled boolean default false,
  loyalty_enabled boolean default false,
  coupons_enabled boolean default false,
  returns_enabled boolean default false,
  refunds_enabled boolean default false,
  subscriptions_enabled boolean default false,
  prescription_required_enabled boolean default false,
  multi_warehouse_enabled boolean default false,
  whatsapp_notifications_enabled boolean default false,
  push_notifications_enabled boolean default false,
  social_login_enabled boolean default false,
  customer_support_enabled boolean default true,
  analytics_enabled boolean default true,
  marketing_enabled boolean default false,

  -- New world-class features
  personalization_enabled boolean default false,
  recommendations_enabled boolean default false,
  advanced_search_enabled boolean default false,
  product_gallery_enabled boolean default false,
  product_videos_enabled boolean default false,
  address_book_enabled boolean default false,
  delivery_slots_enabled boolean default false,
  cart_sync_enabled boolean default false,
  wishlist_enabled boolean default false,
  order_timeline_enabled boolean default false,
  invoice_download_enabled boolean default false,
  sms_notifications_enabled boolean default false,
  email_notifications_enabled boolean default false,
  customer_dashboard_enabled boolean default false,
  prescription_archive_enabled boolean default false,
  chat_support_enabled boolean default false,
  help_center_enabled boolean default false,
  pharmacy_license_display_enabled boolean default false,
  privacy_controls_enabled boolean default false,
  accessibility_mode_enabled boolean default false,
  banner_ads_enabled boolean default false,
  marketing_campaigns_enabled boolean default false,
  mobile_app_banner_enabled boolean default false,
  deep_linking_enabled boolean default false,
  push_segmentation_enabled boolean default false,
  analytics_dashboard_enabled boolean default false,
  customer_insights_enabled boolean default false,
  audit_logging_enabled boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Announcements (per tenant)
create table public.announcements (
  id uuid default uuid_generate_v4() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  title text not null,
  content text,
  type text not null default 'info', -- 'info', 'warning', 'success'
  active boolean default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Scroll Messages (per tenant)
create table public.scroll_messages (
  id uuid default uuid_generate_v4() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  message text not null,
  active boolean default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Carousel Slides (per tenant)
create table public.carousel_slides (
  id uuid default uuid_generate_v4() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  title text not null,
  subtitle text,
  image_url text not null,
  cta_text text,
  cta_url text,
  display_order integer default 1,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Prescriptions (per tenant)
create table public.prescriptions (
  id uuid default uuid_generate_v4() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  customer_id uuid references public.customers(id) on delete cascade not null,
  prescription_number text not null,
  doctor_name text not null,
  hospital_name text,
  image_url text not null,
  status text default 'pending', -- 'pending', 'approved', 'rejected'
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(tenant_id, prescription_number)
);

-- QR Code Generation Records (per tenant)
create table public.tenant_qr_codes (
  id uuid default uuid_generate_v4() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  qr_code_url text,
  app_download_url text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Themes (Global themes managed by super admin)
create table public.themes (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  css_variables jsonb not null, -- Store theme CSS variables
  preview_image_url text,
  active boolean default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Global Settings (for super admin)
create table public.global_settings (
  key text primary key,
  value jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security Policies

-- Enable RLS on all tables
alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.chemist_settings enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.pending_admin_invites enable row level security;
alter table public.feature_flags enable row level security;
alter table public.announcements enable row level security;
alter table public.scroll_messages enable row level security;
alter table public.carousel_slides enable row level security;
alter table public.prescriptions enable row level security;
alter table public.tenant_qr_codes enable row level security;
alter table public.themes enable row level security;
alter table public.global_settings enable row level security;

-- Super admin can see everything
create policy "Super admin full access" on public.tenants
  for all using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'super_admin'
    )
  );

create policy "Super admin full access" on public.profiles
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
      and p.role = 'super_admin'
    )
  );

-- Admin can manage their own tenant
create policy "Admin tenant access" on public.tenants
  for select using (
    id in (
      select tenant_id from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Public read access for storefront
create policy "Public storefront access" on public.tenants
  for select using (true);

create policy "Public product access" on public.products
  for select using (is_active = true);

create policy "Public category access" on public.categories
  for select using (true);

-- Functions

-- Create tenant with setup code
create or replace function admin_create_tenant_with_setup(
  admin_email text,
  tenant_name text,
  desired_code text default null
)
returns json
language plpgsql
security definer
as $$
declare
  new_tenant_id uuid;
  generated_setup_code text;
begin
  -- Check if user is super admin
  if not exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'super_admin'
  ) then
    raise exception 'Only super admins can create tenants';
  end if;

  -- Generate setup code
  generated_setup_code := coalesce(desired_code, upper(substr(md5(random()::text), 1, 8)));

  -- Create tenant
  insert into public.tenants (name)
  values (tenant_name)
  returning id into new_tenant_id;

  -- Create pending admin invite
  insert into public.pending_admin_invites (
    email, 
    tenant_id, 
    setup_code, 
    created_by
  )
  values (
    admin_email, 
    new_tenant_id, 
    generated_setup_code, 
    auth.uid()
  );

  -- Initialize feature flags for the tenant
  insert into public.feature_flags (tenant_id)
  values (new_tenant_id);

  return json_build_object(
    'tenant_id', new_tenant_id,
    'setup_code', generated_setup_code
  );
end;
$$;

-- Handle new user registration
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  super_admin_email text;
  pending_invite record;
begin
  -- Get super admin email from env
  super_admin_email := current_setting('app.settings.super_admin_email', true);

  -- Check if this is the super admin
  if new.email = super_admin_email then
    insert into public.profiles (id, email, role)
    values (new.id, new.email, 'super_admin');
    return new;
  end if;

  -- Check for pending admin invite
  select * into pending_invite
  from public.pending_admin_invites
  where email = new.email;

  if found then
    -- Create admin profile
    insert into public.profiles (id, email, role, tenant_id)
    values (new.id, new.email, 'admin', pending_invite.tenant_id);
    
    -- Remove the pending invite
    delete from public.pending_admin_invites where email = new.email;
  else
    -- Create regular customer profile
    insert into public.profiles (id, email, role)
    values (new.id, new.email, 'customer');
  end if;

  return new;
end;
$$;

-- Trigger for new user handling
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Sample data for demonstration
-- This will be inserted automatically when schema is applied

-- Insert a demo tenant
insert into public.tenants (id, name, subdomain) 
values (
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'Demo Pharmacy',
  'demo'
) on conflict do nothing;

-- Insert demo categories
insert into public.categories (tenant_id, name, description) values
(
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'Pain Relief',
  'Medications for pain and fever'
),
(
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'Vitamins',
  'Essential vitamins and supplements'
),
(
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'Cold & Flu',
  'Medicines for cold and flu symptoms'
) on conflict do nothing;

-- Insert sample products
insert into public.products (tenant_id, category_id, name, description, brand, pack_size, price, mrp, requires_rx) 
select 
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  c.id,
  p.name,
  p.description,
  p.brand,
  p.pack_size,
  p.price,
  p.mrp,
  p.requires_rx
from public.categories c
cross join lateral (
  values 
    ('Paracetamol 500mg', 'For fever and pain relief', 'Crocin', '10 tablets', 50, 60, false),
    ('Vitamin D3 60000 IU', 'Vitamin D supplement', 'Calcirol', '4 sachets', 200, 250, false),
    ('Cough Syrup 100ml', 'Relief from cough and cold', 'Benadryl', '100ml bottle', 85, 95, false)
) as p(name, description, brand, pack_size, price, mrp, requires_rx)
where c.tenant_id = '550e8400-e29b-41d4-a716-446655440000'::uuid
on conflict do nothing;

-- Initialize feature flags for demo tenant
insert into public.feature_flags (tenant_id)
values ('550e8400-e29b-41d4-a716-446655440000'::uuid)
on conflict do nothing;

-- Insert default themes for Super Admin
insert into public.themes (id, name, type, color_scheme) values
(
  'theme-light-default'::uuid,
  'Light Classic',
  'system',
  '{
    "background": "oklch(1 0 0)",
    "foreground": "oklch(0.15 0 0)",
    "primary": "oklch(0.47 0.13 264)",
    "secondary": "oklch(0.97 0.01 264)",
    "accent": "oklch(0.55 0.15 27)",
    "muted": "oklch(0.97 0.01 264)",
    "destructive": "oklch(0.577 0.245 27.325)",
    "border": "oklch(0.92 0.01 264)"
  }'
),
(
  'theme-dark-default'::uuid,
  'Dark Modern',
  'system',
  '{
    "background": "oklch(0.08 0 0)",
    "foreground": "oklch(0.95 0 0)",
    "primary": "oklch(0.6 0.13 264)",
    "secondary": "oklch(0.12 0.01 264)",
    "accent": "oklch(0.65 0.15 27)",
    "muted": "oklch(0.12 0.01 264)",
    "destructive": "oklch(0.677 0.245 27.325)",
    "border": "oklch(0.18 0.01 264)"
  }'
),
(
  'theme-medical-green'::uuid,
  'Medical Green',
  'custom',
  '{
    "background": "oklch(0.99 0.01 142)",
    "foreground": "oklch(0.15 0 0)",
    "primary": "oklch(0.45 0.12 142)",
    "secondary": "oklch(0.96 0.02 142)",
    "accent": "oklch(0.55 0.15 142)",
    "muted": "oklch(0.96 0.02 142)",
    "destructive": "oklch(0.577 0.245 27.325)",
    "border": "oklch(0.90 0.02 142)"
  }'
),
(
  'theme-pharmacy-blue'::uuid,
  'Pharmacy Blue',
  'custom',
  '{
    "background": "oklch(0.99 0.01 220)",
    "foreground": "oklch(0.15 0 0)",
    "primary": "oklch(0.45 0.12 220)",
    "secondary": "oklch(0.96 0.02 220)",
    "accent": "oklch(0.55 0.15 220)",
    "muted": "oklch(0.96 0.02 220)",
    "destructive": "oklch(0.577 0.245 27.325)",
    "border": "oklch(0.90 0.02 220)"
  }'
),
(
  'theme-wellness-purple'::uuid,
  'Wellness Purple',
  'custom',
  '{
    "background": "oklch(0.99 0.01 290)",
    "foreground": "oklch(0.15 0 0)",
    "primary": "oklch(0.45 0.12 290)",
    "secondary": "oklch(0.96 0.02 290)",
    "accent": "oklch(0.55 0.15 290)",
    "muted": "oklch(0.96 0.02 290)",
    "destructive": "oklch(0.577 0.245 27.325)",
    "border": "oklch(0.90 0.02 290)"
  }'
),
(
  'theme-warm-orange'::uuid,
  'Warm Orange',
  'custom',
  '{
    "background": "oklch(0.99 0.01 45)",
    "foreground": "oklch(0.15 0 0)",
    "primary": "oklch(0.55 0.15 45)",
    "secondary": "oklch(0.96 0.02 45)",
    "accent": "oklch(0.65 0.18 45)",
    "muted": "oklch(0.96 0.02 45)",
    "destructive": "oklch(0.577 0.245 27.325)",
    "border": "oklch(0.90 0.02 45)"
  }'
),
(
  'theme-nature-green'::uuid,
  'Nature Green',
  'custom',
  '{
    "background": "oklch(0.98 0.01 120)",
    "foreground": "oklch(0.12 0 0)",
    "primary": "oklch(0.40 0.15 120)",
    "secondary": "oklch(0.95 0.03 120)",
    "accent": "oklch(0.50 0.18 120)",
    "muted": "oklch(0.95 0.03 120)",
    "destructive": "oklch(0.577 0.245 27.325)",
    "border": "oklch(0.88 0.03 120)"
  }'
),
(
  'theme-royal-purple'::uuid,
  'Royal Purple',
  'custom',
  '{
    "background": "oklch(0.97 0.01 270)",
    "foreground": "oklch(0.15 0 0)",
    "primary": "oklch(0.40 0.15 270)",
    "secondary": "oklch(0.94 0.03 270)",
    "accent": "oklch(0.50 0.18 270)",
    "muted": "oklch(0.94 0.03 270)",
    "destructive": "oklch(0.577 0.245 27.325)",
    "border": "oklch(0.87 0.03 270)"
  }'
),
(
  'theme-sunset-red'::uuid,
  'Sunset Red',
  'custom',
  '{
    "background": "oklch(0.99 0.01 15)",
    "foreground": "oklch(0.15 0 0)",
    "primary": "oklch(0.50 0.18 15)",
    "secondary": "oklch(0.96 0.02 15)",
    "accent": "oklch(0.60 0.20 15)",
    "muted": "oklch(0.96 0.02 15)",
    "destructive": "oklch(0.577 0.245 27.325)",
    "border": "oklch(0.90 0.02 15)"
  }'
),
(
  'theme-ocean-teal'::uuid,
  'Ocean Teal',
  'custom',
  '{
    "background": "oklch(0.98 0.01 180)",
    "foreground": "oklch(0.15 0 0)",
    "primary": "oklch(0.45 0.12 180)",
    "secondary": "oklch(0.95 0.02 180)",
    "accent": "oklch(0.55 0.15 180)",
    "muted": "oklch(0.95 0.02 180)",
    "destructive": "oklch(0.577 0.245 27.325)",
    "border": "oklch(0.88 0.02 180)"
  }'
) on conflict do nothing;

-- Initialize app settings
insert into public.app_settings (app_name, default_theme_id)
values ('Pulss', 'theme-light-default'::uuid) on conflict do nothing;

-- ===================================================================
-- COMPREHENSIVE DEMO DATA FOR WORLD-CLASS DEMONSTRATION
-- ===================================================================

-- Demo carousel slides with high-quality medical/pharmacy images
insert into public.carousel_slides (tenant_id, title, subtitle, image_url, cta_text, cta_url, display_order, is_active) values
(
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'Premium Healthcare Solutions',
  'Your trusted pharmacy for quality medicines and health products',
  'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
  'Shop Now',
  '/products',
  1,
  true
),
(
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'Fast & Reliable Delivery',
  'Get your medicines delivered to your doorstep in 30 minutes',
  'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2069&q=80',
  'Order Now',
  '/delivery',
  2,
  true
),
(
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'Expert Consultation Available',
  '24/7 pharmacist consultation for all your health needs',
  'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2026&q=80',
  'Consult Now',
  '/consultation',
  3,
  true
) on conflict do nothing;

-- Demo announcements for the pharmacy
insert into public.announcements (tenant_id, title, content, type, active) values
(
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'Winter Health Package Available',
  'Get 20% off on immunity boosters and winter care products. Valid until end of month.',
  'success',
  true
),
(
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'Prescription Upload Made Easy',
  'Now upload your prescriptions directly through our app for faster processing.',
  'info',
  true
),
(
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'Free Home Delivery',
  'Free home delivery on orders above ₹500. No minimum order for senior citizens.',
  'success',
  true
) on conflict do nothing;

-- Demo customers with realistic profiles
insert into public.customers (tenant_id, email, phone, full_name, date_of_birth, address, loyalty_points, wallet_balance) values
(
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'rajesh.sharma@email.com',
  '+919876543210',
  'Rajesh Sharma',
  '1975-03-15',
  'A-204, Green Valley Apartments, Sector 12, Noida, UP - 201301',
  1250,
  450.00
),
(
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'priya.singh@email.com',
  '+919876543211',
  'Priya Singh',
  '1982-07-22',
  'B-45, Silver City, MG Road, Bangalore, KA - 560001',
  875,
  320.50
),
(
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'amit.patel@email.com',
  '+919876543212',
  'Amit Patel',
  '1988-11-08',
  '301, Sunrise Residency, Ahmedabad, GJ - 380001',
  2100,
  680.00
),
(
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'sunita.verma@email.com',
  '+919876543213',
  'Sunita Verma',
  '1965-05-30',
  'House No. 56, Model Town, Delhi - 110009',
  3200,
  1200.00
),
(
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'vikash.kumar@email.com',
  '+919876543214',
  'Vikash Kumar',
  '1990-12-12',
  'Flat 402, Emerald Heights, Pune, MH - 411001',
  540,
  150.75
) on conflict do nothing;

-- Enhanced demo products with medical images and detailed information
insert into public.products (tenant_id, category_id, name, description, brand, pack_size, price, mrp, image_url, requires_prescription, active, inventory_count, manufacturer, composition, uses, side_effects, tags) 
select
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  c.id,
  p.name,
  p.description,
  p.brand,
  p.pack_size,
  p.price,
  p.mrp,
  p.image_url,
  p.requires_prescription,
  true,
  p.inventory_count,
  p.manufacturer,
  p.composition,
  p.uses,
  p.side_effects,
  p.tags
from public.categories c
cross join (
  values
    -- Medicines & Tablets Category
    ('Paracetamol 500mg Tablets', 'Fast-acting pain relief and fever reducer', 'Crocin', '20 tablets', 45.00, 55.00, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80', false, 500, 'GSK Pharmaceuticals', 'Paracetamol 500mg', 'Fever, headache, body pain, dental pain', 'Nausea, skin rash (rare)', 'fever,pain,headache,medicine'),
    ('Amoxicillin 500mg Capsules', 'Broad-spectrum antibiotic for bacterial infections', 'Novamox', '10 capsules', 120.00, 140.00, 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80', true, 200, 'Cipla Ltd', 'Amoxicillin Trihydrate 500mg', 'Bacterial infections, respiratory tract infections', 'Diarrhea, nausea, allergic reactions', 'antibiotic,infection,prescription'),
    ('Cetirizine 10mg Tablets', 'Antihistamine for allergy relief', 'Zyrtec', '14 tablets', 85.00, 100.00, 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80', false, 300, 'Johnson & Johnson', 'Cetirizine Dihydrochloride 10mg', 'Allergic rhinitis, urticaria, skin allergies', 'Drowsiness, dry mouth', 'allergy,antihistamine,cold'),
    ('Omeprazole 20mg Capsules', 'Proton pump inhibitor for acidity', 'Prilosec', '14 capsules', 95.00, 115.00, 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80', true, 150, 'Dr. Reddy''s Lab', 'Omeprazole 20mg', 'GERD, peptic ulcer, hyperacidity', 'Headache, abdominal pain, constipation', 'acidity,stomach,ulcer,prescription'),
    ('Aspirin 75mg Tablets', 'Low-dose aspirin for heart protection', 'Ecosprin', '28 tablets', 25.00, 30.00, 'https://images.unsplash.com/photo-1550572017-edd951aa8d75?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80', true, 400, 'USV Pvt Ltd', 'Acetylsalicylic Acid 75mg', 'Cardiovascular protection, stroke prevention', 'Gastric irritation, bleeding risk', 'heart,cardio,blood,prescription'),
    
    -- Health & Nutrition Category  
    ('Vitamin D3 60000 IU Sachets', 'High-strength Vitamin D supplement', 'Calcirol', '4 sachets', 180.00, 220.00, 'https://images.unsplash.com/photo-1550572017-edd951aa8d75?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80', false, 200, 'Cadila Healthcare', 'Cholecalciferol 60000 IU', 'Vitamin D deficiency, bone health', 'Hypercalcemia with overdose', 'vitamin,supplement,bone,immunity'),
    ('Multivitamin Tablets', 'Complete daily nutrition supplement', 'Centrum', '30 tablets', 350.00, 420.00, 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80', false, 180, 'Pfizer Ltd', 'Multivitamin & Multimineral', 'Daily nutritional support, immunity', 'Nausea if taken empty stomach', 'multivitamin,daily,health,immunity'),
    ('Omega-3 Fish Oil Capsules', 'Essential fatty acids for heart health', 'Seven Seas', '60 capsules', 450.00, 550.00, 'https://images.unsplash.com/photo-1559181567-c3190ca9959b?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80', false, 120, 'Merck Ltd', 'EPA 180mg, DHA 120mg', 'Heart health, brain function, joint health', 'Fishy aftertaste, mild nausea', 'omega3,fish oil,heart,brain'),
    ('Calcium + Vitamin D3 Tablets', 'Bone health and calcium supplement', 'Shelcal', '15 tablets', 125.00, 145.00, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80', false, 250, 'Torrent Pharma', 'Calcium Carbonate 500mg + Vitamin D3 250 IU', 'Calcium deficiency, osteoporosis', 'Constipation, kidney stones (rare)', 'calcium,bone,vitamin D,supplement'),
    ('Protein Powder Vanilla', 'Whey protein for muscle building', 'Optimum Nutrition', '1kg container', 2800.00, 3200.00, 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80', false, 80, 'Glanbia Nutritionals', 'Whey Protein Isolate 24g per serving', 'Muscle building, post-workout recovery', 'Digestive discomfort in lactose intolerant', 'protein,whey,muscle,fitness'),
    
    -- Personal Care Category
    ('Antiseptic Liquid 500ml', 'Broad-spectrum antiseptic solution', 'Dettol', '500ml bottle', 185.00, 220.00, 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80', false, 150, 'Reckitt Benckiser', 'Chloroxylenol 4.8%', 'Wound cleaning, surface disinfection', 'Skin irritation with undiluted use', 'antiseptic,disinfectant,wound,care'),
    ('Hand Sanitizer 200ml', 'Alcohol-based hand sanitizer', 'Lifebuoy', '200ml bottle', 95.00, 110.00, 'https://images.unsplash.com/photo-1584301380006-aca435095bf7?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80', false, 300, 'Hindustan Unilever', 'Ethyl Alcohol 70%', 'Hand hygiene, germ protection', 'Skin dryness with frequent use', 'sanitizer,hygiene,alcohol,protection'),
    ('Moisturizing Lotion 400ml', 'Daily moisturizer for all skin types', 'Nivea', '400ml bottle', 245.00, 280.00, 'https://images.unsplash.com/photo-1556909419-f3a56e65f36c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80', false, 180, 'Beiersdorf AG', 'Glycerin, Shea Butter, Vitamin E', 'Daily skin moisturizing', 'Rare allergic reactions', 'moisturizer,skincare,daily,hydration'),
    ('Sunscreen SPF 50', 'Broad-spectrum UV protection', 'Neutrogena', '100ml tube', 650.00, 750.00, 'https://images.unsplash.com/photo-1556909419-f3a56e65f36c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80', false, 120, 'Johnson & Johnson', 'Zinc Oxide, Titanium Dioxide', 'UV protection, prevents sunburn', 'White cast, may clog pores', 'sunscreen,UV,protection,SPF'),
    ('Toothpaste Fluoride 150g', 'Complete dental care toothpaste', 'Colgate', '150g tube', 85.00, 95.00, 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80', false, 400, 'Colgate Palmolive', 'Sodium Fluoride 0.32%', 'Dental hygiene, cavity prevention', 'Fluorosis with excessive use', 'toothpaste,dental,fluoride,oral care')
) as p(name, description, brand, pack_size, price, mrp, image_url, requires_prescription, inventory_count, manufacturer, composition, uses, side_effects, tags)
where c.name in ('Medicines & Tablets', 'Health & Nutrition', 'Personal Care')
on conflict do nothing;

-- Demo orders with realistic purchase patterns
insert into public.orders (tenant_id, customer_id, total_amount, status, payment_status, payment_method, delivery_address, notes) 
select
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  c.id,
  o.total_amount,
  o.status,
  o.payment_status,
  o.payment_method,
  c.address,
  o.notes
from public.customers c
cross join (
  values
    (450.00, 'delivered', 'completed', 'upi', 'Regular monthly medication order'),
    (280.50, 'delivered', 'completed', 'card', 'Health supplements for family'),
    (125.00, 'processing', 'completed', 'cod', 'Urgent fever medicine needed'),
    (890.00, 'shipped', 'completed', 'upi', 'Winter immunity package'),
    (320.75, 'delivered', 'completed', 'wallet', 'Baby care essentials')
) as o(total_amount, status, payment_status, payment_method, notes)
where c.tenant_id = '550e8400-e29b-41d4-a716-446655440000'::uuid
limit 15
on conflict do nothing;

-- Demo prescriptions for prescription-required products
insert into public.prescriptions (tenant_id, customer_id, prescription_number, doctor_name, hospital_name, image_url, status, notes) 
select
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  c.id,
  'RX' || (row_number() over()) || '2024',
  p.doctor_name,
  p.hospital_name,
  'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
  p.status,
  p.notes
from public.customers c
cross join (
  values
    ('Dr. Rajesh Kumar', 'Apollo Hospital', 'approved', 'Antibiotic course for respiratory infection'),
    ('Dr. Priya Sharma', 'Max Healthcare', 'approved', 'Cardiac medication for hypertension'),
    ('Dr. Amit Singh', 'Fortis Hospital', 'pending', 'Gastric ulcer treatment'),
    ('Dr. Sunita Agarwal', 'AIIMS Delhi', 'approved', 'Diabetes management prescription')
) as p(doctor_name, hospital_name, status, notes)
where c.tenant_id = '550e8400-e29b-41d4-a716-446655440000'::uuid
limit 8
on conflict do nothing;

-- Enhanced categories for demo (pharmacy categories)
insert into public.categories (tenant_id, name, description, icon, display_order) values
(
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'Medicines & Tablets',
  'Prescription and OTC medications',
  'pill',
  1
),
(
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'Health & Nutrition',
  'Vitamins, supplements, and health products',
  'heart',
  2
),
(
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'Personal Care',
  'Skincare, hygiene, and personal items',
  'sparkle',
  3
),
(
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'Baby & Mother Care',
  'Products for babies and expecting mothers',
  'baby',
  4
),
(
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'Health Devices',
  'Medical devices and health monitoring',
  'device-mobile',
  5
),
(
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'Ayurveda & Herbs',
  'Traditional and herbal remedies',
  'leaf',
  6
),
(
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'First Aid',
  'Emergency care and wound care',
  'first-aid-kit',
  7
),
(
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'Diabetic Care',
  'Products for diabetes management',
  'syringe',
  8
) on conflict do nothing;

-- Real-time notifications table
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  type text not null, -- 'order_placed', 'order_status', 'payment_received', 'low_stock', etc.
  title text not null,
  message text not null,
  data jsonb, -- Additional notification data
  tenant_id uuid references public.tenants(id) on delete cascade,
  user_id uuid references auth.users on delete cascade,
  read boolean default false,
  priority text default 'medium', -- 'low', 'medium', 'high', 'urgent'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- System alerts for super admin
create table public.system_alerts (
  id uuid default uuid_generate_v4() primary key,
  type text not null, -- 'error', 'warning', 'info', 'maintenance'
  message text not null,
  details jsonb,
  severity text default 'medium',
  resolved boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  resolved_at timestamp with time zone
);

-- Automated reports storage
create table public.automated_reports (
  id uuid default uuid_generate_v4() primary key,
  type text not null, -- 'monthly_system_report', 'tenant_performance', etc.
  period_start timestamp with time zone not null,
  period_end timestamp with time zone not null,
  report_data jsonb not null, -- Full report data
  generated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  tenant_id uuid references public.tenants(id) on delete cascade -- null for system-wide reports
);

-- Advanced filtering saved filters
create table public.saved_filters (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  filter_type text not null, -- 'tenants', 'customers', 'orders'
  filters jsonb not null, -- Saved filter criteria
  sort_options jsonb, -- Saved sort options
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Business metrics cache (for performance)
create table public.tenant_stats (
  tenant_id uuid references public.tenants(id) on delete cascade primary key,
  total_revenue numeric default 0,
  total_orders integer default 0,
  total_customers integer default 0,
  last_order_date timestamp with time zone,
  avg_order_value numeric default 0,
  growth_rate numeric default 0,
  last_calculated timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Customer stats for advanced filtering
create table public.customer_stats (
  customer_id uuid references public.customers(id) on delete cascade primary key,
  total_orders integer default 0,
  total_spent numeric default 0,
  last_order_date timestamp with time zone,
  loyalty_tier text default 'bronze',
  last_calculated timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add missing columns to existing tables
alter table public.tenants add column if not exists business_type text default 'pharmacy';
alter table public.tenants add column if not exists location text;
alter table public.tenants add column if not exists city text;
alter table public.tenants add column if not exists state text;
alter table public.tenants add column if not exists country text default 'India';
alter table public.tenants add column if not exists tags text[];

alter table public.chemist_settings add column if not exists business_name text;
alter table public.chemist_settings add column if not exists city text;
alter table public.chemist_settings add column if not exists state text;
alter table public.chemist_settings add column if not exists country text default 'India';
alter table public.chemist_settings add column if not exists phone text;

-- Enhanced Tables for World-Class Features

-- Product Images Gallery (Multiple images per product)
create table public.product_images (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references public.products(id) on delete cascade not null,
  image_url text not null,
  alt_text text,
  display_order integer default 0,
  is_primary boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Product Videos
create table public.product_videos (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references public.products(id) on delete cascade not null,
  video_url text not null, -- YouTube embed URL or direct video URL
  video_type text default 'youtube', -- 'youtube', 'direct', 'vimeo'
  title text,
  description text,
  duration text, -- e.g., "2:30"
  thumbnail_url text,
  display_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now') not null
);

-- Enhanced Product Attributes
create table public.product_attributes (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references public.products(id) on delete cascade not null,
  attribute_name text not null, -- e.g., "ingredients", "dosage", "side_effects"
  attribute_value text not null,
  attribute_type text default 'text', -- 'text', 'number', 'date', 'json'
  is_searchable boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Customer Address Book
create table public.customer_addresses (
  id uuid default uuid_generate_v4() primary key,
  customer_id uuid references public.customers(id) on delete cascade not null,
  label text not null, -- e.g., "Home", "Office", "Mom's place"
  recipient_name text not null,
  phone text not null,
  address_line1 text not null,
  address_line2 text,
  landmark text,
  city text not null,
  state text not null,
  pincode text not null,
  country text default 'India',
  is_default boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Delivery Slots
create table public.delivery_slots (
  id uuid default uuid_generate_v4() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  slot_type text not null, -- 'same_day', 'express', 'scheduled'
  time_range text not null, -- e.g., "9:00 AM - 12:00 PM"
  days_offset integer not null default 0, -- 0 for same day, 1 for next day
  max_orders integer default 50,
  delivery_fee numeric default 0,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Order Delivery Slot Selection
create table public.order_delivery_slots (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  slot_id uuid references public.delivery_slots(id) on delete set null,
  preferred_date date not null,
  preferred_time text not null,
  actual_delivery_date date,
  actual_delivery_time text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Customer Wishlist (Save for Later)
create table public.customer_wishlist (
  id uuid default uuid_generate_v4() primary key,
  customer_id uuid references public.customers(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  added_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(customer_id, product_id)
);

-- Recently Viewed Products
create table public.recently_viewed (
  id uuid default uuid_generate_v4() primary key,
  customer_id uuid references public.customers(id) on delete cascade,
  session_id text, -- For guest users
  product_id uuid references public.products(id) on delete cascade not null,
  viewed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(customer_id, product_id),
  unique(session_id, product_id)
);

-- Order Timeline/Events
create table public.order_events (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  event_type text not null, -- 'placed', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'
  event_description text,
  event_data jsonb, -- Additional event data
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Order Invoices
create table public.order_invoices (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  invoice_number text not null unique,
  invoice_url text, -- PDF download URL
  tax_amount numeric default 0,
  discount_amount numeric default 0,
  total_amount numeric not null,
  generated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Customer Support Tickets
create table public.support_tickets (
  id uuid default uuid_generate_v4() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  customer_id uuid references public.customers(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  ticket_number text not null unique,
  subject text not null,
  description text not null,
  status text default 'open', -- 'open', 'in_progress', 'resolved', 'closed'
  priority text default 'medium', -- 'low', 'medium', 'high', 'urgent'
  assigned_to uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Support Chat Messages
create table public.support_messages (
  id uuid default uuid_generate_v4() primary key,
  ticket_id uuid references public.support_tickets(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete set null,
  sender_type text not null, -- 'customer', 'admin', 'system'
  message text not null,
  attachments jsonb, -- Array of attachment URLs
  is_internal boolean default false, -- Internal notes not visible to customer
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Help Center Articles
create table public.help_articles (
  id uuid default uuid_generate_v4() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  title text not null,
  content text not null,
  category text not null, -- 'ordering', 'delivery', 'payments', 'prescriptions'
  tags text[],
  is_published boolean default true,
  views_count integer default 0,
  helpful_count integer default 0,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Prescription Archive
create table public.prescription_archive (
  id uuid default uuid_generate_v4() primary key,
  customer_id uuid references public.customers(id) on delete cascade not null,
  order_id uuid references public.orders(id) on delete set null,
  prescription_url text not null,
  prescription_date date not null,
  doctor_name text,
  notes text,
  is_recurring boolean default false,
  next_refill_date date,
  archived_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Banner Ads
create table public.banner_ads (
  id uuid default uuid_generate_v4() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  title text not null,
  description text,
  image_url text not null,
  link_url text,
  position text default 'home_top', -- 'home_top', 'home_middle', 'category_top', 'product_side'
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  is_active boolean default true,
  click_count integer default 0,
  view_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now') not null
);

-- Marketing Campaigns
create table public.marketing_campaigns (
  id uuid default uuid_generate_v4() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  name text not null,
  campaign_type text not null, -- 'buy_again', 'new_arrivals', 'refill_reminder', 'abandoned_cart'
  target_audience jsonb, -- Criteria for targeting customers
  message_template text not null,
  channel text not null, -- 'email', 'sms', 'push', 'whatsapp'
  trigger_condition jsonb, -- When to send the campaign
  is_active boolean default true,
  sent_count integer default 0,
  opened_count integer default 0,
  clicked_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Customer Campaign Interactions
create table public.campaign_interactions (
  id uuid default uuid_generate_v4() primary key,
  campaign_id uuid references public.marketing_campaigns(id) on delete cascade not null,
  customer_id uuid references public.customers(id) on delete cascade not null,
  interaction_type text not null, -- 'sent', 'opened', 'clicked', 'converted'
  interaction_data jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now') not null
);

-- Social Login Integration
create table public.customer_social_accounts (
  id uuid default uuid_generate_v4() primary key,
  customer_id uuid references public.customers(id) on delete cascade not null,
  provider text not null, -- 'google', 'facebook', 'apple'
  provider_id text not null,
  provider_email text,
  profile_data jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now') not null,
  unique(provider, provider_id)
);

-- Push Notification Segmentation
create table public.push_notification_segments (
  id uuid default uuid_generate_v4() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  name text not null,
  description text,
  criteria jsonb not null, -- Segmentation criteria
  customer_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now') not null,
  updated_at timestamp with time zone default timezone('utc'::text, now') not null
);

-- Privacy Control Settings per Customer
create table public.customer_privacy_settings (
  id uuid default uuid_generate_v4() primary key,
  customer_id uuid references public.customers(id) on delete cascade not null,
  data_processing_consent boolean default false,
  marketing_consent boolean default false,
  analytics_consent boolean default false,
  personalization_consent boolean default false,
  data_retention_preference text default '2_years', -- '1_year', '2_years', '5_years'
  created_at timestamp with time zone default timezone('utc'::text, now') not null,
  updated_at timestamp with time zone default timezone('utc'::text, now') not null
);

-- Audit Log for Admin Actions
create table public.audit_logs (
  id uuid default uuid_generate_v4() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  action text not null, -- 'create', 'update', 'delete', 'login', 'logout'
  resource_type text not null, -- 'product', 'order', 'customer', 'prescription'
  resource_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Terms & Privacy Acceptance History
create table public.legal_acceptances (
  id uuid default uuid_generate_v4() primary key,
  customer_id uuid references public.customers(id) on delete cascade not null,
  document_type text not null, -- 'terms', 'privacy', 'gdpr', 'ccpa'
  document_version text not null,
  accepted_at timestamp with time zone default timezone('utc'::text, now') not null
);

-- Pharmacy License & Compliance Info
create table public.pharmacy_licenses (
  id uuid default uuid_generate_v4() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  license_number text not null,
  license_type text not null, -- 'retail', 'wholesale', 'online'
  issued_by text not null, -- Regulatory authority
  issue_date date not null,
  expiry_date date not null,
  pharmacist_name text not null,
  pharmacist_registration text not null,
  license_document_url text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now') not null,
  updated_at timestamp with time zone default timezone('utc'::text, now') not null
);

-- Search Analytics
create table public.search_analytics (
  id uuid default uuid_generate_v4() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  search_query text not null,
  customer_id uuid references public.customers(id) on delete set null,
  session_id text,
  results_count integer default 0,
  clicked_product_id uuid references public.products(id) on delete set null,
  search_type text, -- 'product', 'symptom', 'condition'
  created_at timestamp with time zone default timezone('utc'::text, now') not null
);

-- Product Recommendations Cache
create table public.product_recommendations (
  id uuid default uuid_generate_v4() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  recommendation_type text not null, -- 'trending', 'top_sellers', 'customers_also_bought', 'personalized'
  source_product_id uuid references public.products(id) on delete cascade,
  recommended_product_id uuid references public.products(id) on delete cascade not null,
  customer_id uuid references public.customers(id) on delete cascade,
  score numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now') not null,
  expires_at timestamp with time zone
);

-- Add indexes for performance
create index idx_product_images_product_id on public.product_images(product_id);
create index idx_product_videos_product_id on public.product_videos(product_id);
create index idx_product_attributes_product_id on public.product_attributes(product_id);
create index idx_customer_addresses_customer_id on public.customer_addresses(customer_id);
create index idx_customer_wishlist_customer_id on public.customer_wishlist(customer_id);
create index idx_recently_viewed_customer_id on public.recently_viewed(customer_id);
create index idx_recently_viewed_session_id on public.recently_viewed(session_id);
create index idx_order_events_order_id on public.order_events(order_id);
create index idx_support_tickets_customer_id on public.support_tickets(customer_id);
create index idx_support_messages_ticket_id on public.support_messages(ticket_id);
create index idx_prescription_archive_customer_id on public.prescription_archive(customer_id);
create index idx_search_analytics_tenant_id on public.search_analytics(tenant_id);
create index idx_search_analytics_created_at on public.search_analytics(created_at);
create index idx_product_recommendations_tenant_id on public.product_recommendations(tenant_id);
create index idx_audit_logs_tenant_id on public.audit_logs(tenant_id);
create index idx_audit_logs_created_at on public.audit_logs(created_at);

alter table public.inventory add column if not exists reorder_level integer default 10;