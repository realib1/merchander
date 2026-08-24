-- Create tenant_settings table
create table if not exists public.tenant_settings (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade unique,
  low_stock_threshold integer not null default 10,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up RLS
alter table public.tenant_settings enable row level security;

-- Policies for tenant_settings
create policy "Tenant settings are viewable by tenant users"
  on public.tenant_settings for select
  using (
    tenant_id in (
      select tenant_id 
      from public.tenant_users 
      where user_id = auth.uid()
    )
  );

create policy "Tenant settings are insertable by tenant users"
  on public.tenant_settings for insert
  with check (
    tenant_id in (
      select tenant_id 
      from public.tenant_users 
      where user_id = auth.uid()
      and role = 'owner'
    )
  );

create policy "Tenant settings are updatable by tenant users"
  on public.tenant_settings for update
  using (
    tenant_id in (
      select tenant_id 
      from public.tenant_users 
      where user_id = auth.uid()
      and role = 'owner'
    )
  );

-- Function to automatically update the updated_at column
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger for updated_at
create trigger set_tenant_settings_updated_at
  before update on public.tenant_settings
  for each row execute function public.handle_updated_at();

-- Insert default settings for existing tenants
insert into public.tenant_settings (tenant_id)
select id from public.tenants
on conflict (tenant_id) do nothing;
