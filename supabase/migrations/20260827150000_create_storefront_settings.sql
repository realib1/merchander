-- Create storefront_settings table for public Link-in-Bio online stores
create table if not exists public.storefront_settings (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade unique,
  store_name text not null default 'Online Store',
  slug text not null unique,
  tagline text,
  bio text,
  logo_url text,
  banner_url text,
  whatsapp_phone text,
  instagram_handle text,
  tiktok_handle text,
  delivery_policy text,
  is_active boolean not null default true,
  currency text not null default 'GHS',
  featured_product_ids jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for fast public slug lookups
create index if not exists idx_storefront_settings_slug on public.storefront_settings(slug);
create index if not exists idx_storefront_settings_tenant on public.storefront_settings(tenant_id);

-- Enable RLS
alter table public.storefront_settings enable row level security;

-- Policies for storefront_settings
create policy "Storefront settings are publicly viewable if active"
  on public.storefront_settings for select
  using (
    is_active = true or
    tenant_id in (
      select tenant_id 
      from public.tenant_users 
      where user_id = auth.uid()
    )
  );

create policy "Storefront settings are insertable by tenant admins"
  on public.storefront_settings for insert
  with check (
    tenant_id in (
      select tenant_id 
      from public.tenant_users 
      where user_id = auth.uid()
      and role in ('owner', 'admin')
    )
  );

create policy "Storefront settings are updatable by tenant admins"
  on public.storefront_settings for update
  using (
    tenant_id in (
      select tenant_id 
      from public.tenant_users 
      where user_id = auth.uid()
      and role in ('owner', 'admin')
    )
  );

-- Function for updated_at trigger
create trigger set_storefront_settings_updated_at
  before update on public.storefront_settings
  for each row execute function public.handle_updated_at();

-- Grants
grant select on public.storefront_settings to anon, authenticated, service_role;
grant insert, update, delete on public.storefront_settings to authenticated, service_role;
