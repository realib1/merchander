-- Create tenant_settings table
create table public.tenant_settings (
  tenant_id uuid primary key references public.tenants(id) on delete cascade not null,
  branding jsonb default '{}'::jsonb not null,
  features jsonb default '{}'::jsonb not null,
  integrations jsonb default '{}'::jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create customers table
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  name text,
  phone text not null,
  email text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (tenant_id, phone)
);

-- Create products table
create table public.products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  name text not null,
  description text,
  is_active boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create product_variants table
create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade not null,
  sku text not null,
  name text, -- Optional variant name (e.g., "Red / Large")
  price decimal(10, 2) not null,
  compare_at_price decimal(10, 2),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (product_id, sku)
);

-- Create inventory_levels table
create table public.inventory_levels (
  variant_id uuid references public.product_variants(id) on delete cascade not null,
  store_id uuid references public.stores(id) on delete cascade not null,
  quantity integer not null default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (variant_id, store_id)
);

-- Enable RLS
alter table public.tenant_settings enable row level security;
alter table public.customers enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.inventory_levels enable row level security;

-- RLS Policies

-- tenant_settings
create policy "Users can view settings of their tenant." on public.tenant_settings
  for select using (tenant_id in (select public.get_auth_user_tenant_ids()));
create policy "Users can update settings of their tenant." on public.tenant_settings
  for update using (tenant_id in (select public.get_auth_user_tenant_ids()));

-- customers
create policy "Users can view customers of their tenant." on public.customers
  for select using (tenant_id in (select public.get_auth_user_tenant_ids()));
create policy "Users can insert customers of their tenant." on public.customers
  for insert with check (tenant_id in (select public.get_auth_user_tenant_ids()));
create policy "Users can update customers of their tenant." on public.customers
  for update using (tenant_id in (select public.get_auth_user_tenant_ids()));

-- products
create policy "Users can view products of their tenant." on public.products
  for select using (tenant_id in (select public.get_auth_user_tenant_ids()));
create policy "Users can insert products of their tenant." on public.products
  for insert with check (tenant_id in (select public.get_auth_user_tenant_ids()));
create policy "Users can update products of their tenant." on public.products
  for update using (tenant_id in (select public.get_auth_user_tenant_ids()));
create policy "Users can delete products of their tenant." on public.products
  for delete using (tenant_id in (select public.get_auth_user_tenant_ids()));

-- product_variants
create policy "Users can view variants of their tenant's products." on public.product_variants
  for select using (product_id in (select id from public.products where tenant_id in (select public.get_auth_user_tenant_ids())));
create policy "Users can insert variants to their tenant's products." on public.product_variants
  for insert with check (product_id in (select id from public.products where tenant_id in (select public.get_auth_user_tenant_ids())));
create policy "Users can update variants of their tenant's products." on public.product_variants
  for update using (product_id in (select id from public.products where tenant_id in (select public.get_auth_user_tenant_ids())));
create policy "Users can delete variants of their tenant's products." on public.product_variants
  for delete using (product_id in (select id from public.products where tenant_id in (select public.get_auth_user_tenant_ids())));

-- inventory_levels
create policy "Users can view inventory of their tenant's stores." on public.inventory_levels
  for select using (store_id in (select id from public.stores where tenant_id in (select public.get_auth_user_tenant_ids())));
create policy "Users can update inventory of their tenant's stores." on public.inventory_levels
  for all using (store_id in (select id from public.stores where tenant_id in (select public.get_auth_user_tenant_ids())));

-- Superadmin Policies
create policy "Superadmins can view all tenant_settings." on public.tenant_settings for select using (public.is_superadmin());
create policy "Superadmins can view all customers." on public.customers for select using (public.is_superadmin());
create policy "Superadmins can view all products." on public.products for select using (public.is_superadmin());
create policy "Superadmins can view all product_variants." on public.product_variants for select using (public.is_superadmin());
create policy "Superadmins can view all inventory_levels." on public.inventory_levels for select using (public.is_superadmin());

-- Safe Inventory Decrement RPC
create or replace function public.decrement_inventory(
  p_variant_id uuid,
  p_store_id uuid,
  p_amount integer
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_qty integer;
begin
  -- Lock the row for update
  select quantity into v_current_qty
  from public.inventory_levels
  where variant_id = p_variant_id and store_id = p_store_id
  for update;

  if not found then
    raise exception 'Inventory record not found';
  end if;

  if v_current_qty < p_amount then
    raise exception 'Insufficient inventory';
  end if;

  update public.inventory_levels
  set quantity = quantity - p_amount,
      updated_at = now()
  where variant_id = p_variant_id and store_id = p_store_id;

  return true;
end;
$$;
