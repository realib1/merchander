-- Create tenants table
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create tenant_users mapping table (for RBAC / associating auth.users to tenants)
create table public.tenant_users (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (tenant_id, user_id)
);

-- Create stores table
create table public.stores (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  name text not null,
  location text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.tenants enable row level security;
alter table public.tenant_users enable row level security;
alter table public.stores enable row level security;

-- Function to get the current user's tenant_id (useful for policies)
create or replace function public.get_auth_user_tenant_ids()
returns setof uuid
language sql
security definer
set search_path = public
as $$
  select tenant_id from tenant_users where user_id = auth.uid();
$$;

-- RLS Policies for Tenants
-- Users can read tenants they belong to
create policy "Users can view their own tenant." on public.tenants
  for select using (id in (select public.get_auth_user_tenant_ids()));

-- RLS Policies for Tenant Users
-- Users can see other users in the same tenant
create policy "Users can view members of their tenant." on public.tenant_users
  for select using (tenant_id in (select public.get_auth_user_tenant_ids()));

-- RLS Policies for Stores
-- Users can see stores belonging to their tenant
create policy "Users can view stores of their tenant." on public.stores
  for select using (tenant_id in (select public.get_auth_user_tenant_ids()));
create policy "Users can insert stores of their tenant." on public.stores
  for insert with check (tenant_id in (select public.get_auth_user_tenant_ids()));
create policy "Users can update stores of their tenant." on public.stores
  for update using (tenant_id in (select public.get_auth_user_tenant_ids()));
create policy "Users can delete stores of their tenant." on public.stores
  for delete using (tenant_id in (select public.get_auth_user_tenant_ids()));

-- Basic function for Superadmin bypass check (can be expanded later)
create or replace function public.is_superadmin()
returns boolean
language sql
security definer
set search_path = public
as $$
  -- For now, check if user has a superadmin claim in app_metadata
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'is_superadmin')::boolean, false);
$$;

-- Add Superadmin policies
create policy "Superadmins can view all tenants." on public.tenants
  for select using (public.is_superadmin());
create policy "Superadmins can insert tenants." on public.tenants
  for insert with check (public.is_superadmin());
create policy "Superadmins can update tenants." on public.tenants
  for update using (public.is_superadmin());
create policy "Superadmins can view all stores." on public.stores
  for select using (public.is_superadmin());
create policy "Superadmins can view all tenant_users." on public.tenant_users
  for select using (public.is_superadmin());
