-- Create expenses table
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  store_id uuid references public.stores(id) on delete set null,
  amount decimal(12, 2) not null,
  currency text default 'GHS' not null,
  category text not null,
  description text,
  expense_date date not null default current_date,
  receipt_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.expenses enable row level security;

-- RLS Policies
create policy "Users can view expenses of their tenant." on public.expenses
  for select using (tenant_id in (select public.get_auth_user_tenant_ids()));
create policy "Users can insert expenses of their tenant." on public.expenses
  for insert with check (tenant_id in (select public.get_auth_user_tenant_ids()));
create policy "Users can update expenses of their tenant." on public.expenses
  for update using (tenant_id in (select public.get_auth_user_tenant_ids()));
create policy "Users can delete expenses of their tenant." on public.expenses
  for delete using (tenant_id in (select public.get_auth_user_tenant_ids()));

-- Superadmin Policy
create policy "Superadmins can view all expenses." on public.expenses
  for select using (public.is_superadmin());
