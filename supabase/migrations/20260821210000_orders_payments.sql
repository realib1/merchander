-- Create orders table
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  store_id uuid references public.stores(id) on delete cascade not null,
  customer_id uuid references public.customers(id) on delete restrict not null,
  status text not null default 'draft' check (status in ('draft', 'pending_payment', 'paid', 'dispatched', 'delivered', 'cancelled')),
  total_amount decimal(10, 2) not null default 0.00,
  delivery_address text,
  delivery_fee decimal(10, 2) not null default 0.00,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create order_items table
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade not null,
  variant_id uuid references public.product_variants(id) on delete restrict not null,
  quantity integer not null default 1 check (quantity > 0),
  unit_price decimal(10, 2) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create payments table
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  order_id uuid references public.orders(id) on delete cascade not null,
  provider text not null check (provider in ('mtn_momo', 'telecel_cash', 'at_money', 'cash_on_delivery')),
  transaction_ref text, -- Often extracted from SMS
  amount decimal(10, 2) not null,
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (tenant_id, transaction_ref) -- Prevent duplicate processing of the same MoMo SMS for a merchant
);

-- Enable RLS
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;

-- RLS Policies for orders
create policy "Users can view orders of their tenant." on public.orders
  for select using (tenant_id in (select public.get_auth_user_tenant_ids()));
create policy "Users can insert orders for their tenant." on public.orders
  for insert with check (tenant_id in (select public.get_auth_user_tenant_ids()));
create policy "Users can update orders of their tenant." on public.orders
  for update using (tenant_id in (select public.get_auth_user_tenant_ids()));

-- RLS Policies for order_items
create policy "Users can view order_items of their tenant's orders." on public.order_items
  for select using (order_id in (select id from public.orders where tenant_id in (select public.get_auth_user_tenant_ids())));
create policy "Users can insert order_items to their tenant's orders." on public.order_items
  for insert with check (order_id in (select id from public.orders where tenant_id in (select public.get_auth_user_tenant_ids())));
create policy "Users can update order_items of their tenant's orders." on public.order_items
  for update using (order_id in (select id from public.orders where tenant_id in (select public.get_auth_user_tenant_ids())));

-- RLS Policies for payments
create policy "Users can view payments of their tenant." on public.payments
  for select using (tenant_id in (select public.get_auth_user_tenant_ids()));
create policy "Users can insert payments for their tenant." on public.payments
  for insert with check (tenant_id in (select public.get_auth_user_tenant_ids()));
create policy "Users can update payments of their tenant." on public.payments
  for update using (tenant_id in (select public.get_auth_user_tenant_ids()));

-- Superadmin Policies
create policy "Superadmins can view all orders." on public.orders for select using (public.is_superadmin());
create policy "Superadmins can view all order_items." on public.order_items for select using (public.is_superadmin());
create policy "Superadmins can view all payments." on public.payments for select using (public.is_superadmin());
