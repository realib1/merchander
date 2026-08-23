-- Add cost_price to product_variants
alter table public.product_variants add column cost_price decimal(10, 2);

-- Create suppliers table
create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  name text not null,
  contact_name text,
  email text,
  phone text,
  country text default 'Ghana',
  outstanding_balance decimal(10, 2) not null default 0.00,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create shipments table
create table public.shipments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  supplier_id uuid references public.suppliers(id) on delete restrict not null,
  tracking_number text,
  status text not null default 'pending' check (status in ('pending', 'in_transit', 'delivered', 'cancelled')),
  eta timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create shipment_items table
create table public.shipment_items (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid references public.shipments(id) on delete cascade not null,
  variant_id uuid references public.product_variants(id) on delete restrict not null,
  quantity integer not null default 1 check (quantity > 0),
  cost_price decimal(10, 2), -- The cost price at the time of purchase
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create product_waitlist table
create table public.product_waitlist (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  variant_id uuid references public.product_variants(id) on delete cascade not null,
  customer_name text,
  email text,
  phone text,
  status text not null default 'waiting' check (status in ('waiting', 'notified', 'purchased', 'cancelled')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.suppliers enable row level security;
alter table public.shipments enable row level security;
alter table public.shipment_items enable row level security;
alter table public.product_waitlist enable row level security;

-- RLS Policies

-- Suppliers
create policy "Users can view suppliers of their tenant." on public.suppliers
  for select using (tenant_id in (select public.get_auth_user_tenant_ids()));
create policy "Users can insert suppliers for their tenant." on public.suppliers
  for insert with check (tenant_id in (select public.get_auth_user_tenant_ids()));
create policy "Users can update suppliers of their tenant." on public.suppliers
  for update using (tenant_id in (select public.get_auth_user_tenant_ids()));
create policy "Users can delete suppliers of their tenant." on public.suppliers
  for delete using (tenant_id in (select public.get_auth_user_tenant_ids()));

-- Shipments
create policy "Users can view shipments of their tenant." on public.shipments
  for select using (tenant_id in (select public.get_auth_user_tenant_ids()));
create policy "Users can insert shipments for their tenant." on public.shipments
  for insert with check (tenant_id in (select public.get_auth_user_tenant_ids()));
create policy "Users can update shipments of their tenant." on public.shipments
  for update using (tenant_id in (select public.get_auth_user_tenant_ids()));

-- Shipment Items
create policy "Users can view shipment_items of their tenant's shipments." on public.shipment_items
  for select using (shipment_id in (select id from public.shipments where tenant_id in (select public.get_auth_user_tenant_ids())));
create policy "Users can insert shipment_items to their tenant's shipments." on public.shipment_items
  for insert with check (shipment_id in (select id from public.shipments where tenant_id in (select public.get_auth_user_tenant_ids())));
create policy "Users can update shipment_items of their tenant's shipments." on public.shipment_items
  for update using (shipment_id in (select id from public.shipments where tenant_id in (select public.get_auth_user_tenant_ids())));

-- Product Waitlist
create policy "Users can view waitlist of their tenant." on public.product_waitlist
  for select using (tenant_id in (select public.get_auth_user_tenant_ids()));
create policy "Users can manage waitlist of their tenant." on public.product_waitlist
  for all using (tenant_id in (select public.get_auth_user_tenant_ids()));

-- Superadmin overrides
create policy "Superadmins can view all suppliers." on public.suppliers for select using (public.is_superadmin());
create policy "Superadmins can view all shipments." on public.shipments for select using (public.is_superadmin());
create policy "Superadmins can view all shipment_items." on public.shipment_items for select using (public.is_superadmin());
create policy "Superadmins can view all product_waitlist." on public.product_waitlist for select using (public.is_superadmin());
