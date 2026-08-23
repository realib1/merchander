-- Create product_categories table
create table public.product_categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(tenant_id, name)
);

-- Enable RLS for categories
alter table public.product_categories enable row level security;

-- Policies for categories
create policy "Users can view categories of their tenant." on public.product_categories
  for select using (tenant_id in (select public.get_auth_user_tenant_ids()));
create policy "Users can insert categories of their tenant." on public.product_categories
  for insert with check (tenant_id in (select public.get_auth_user_tenant_ids()));
create policy "Users can update categories of their tenant." on public.product_categories
  for update using (tenant_id in (select public.get_auth_user_tenant_ids()));
create policy "Users can delete categories of their tenant." on public.product_categories
  for delete using (tenant_id in (select public.get_auth_user_tenant_ids()));
create policy "Superadmins can view all product_categories." on public.product_categories for select using (public.is_superadmin());

-- Add columns to products
alter table public.products 
add column category_id uuid references public.product_categories(id) on delete set null,
add column vendor text,
add column image_urls text[] default '{}'::text[];

-- Set up storage bucket for product-images
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Storage policies for product-images
create policy "Public Access to product-images" on storage.objects
  for select using (bucket_id = 'product-images');

create policy "Authenticated Users can upload product-images" on storage.objects
  for insert with check (
    bucket_id = 'product-images' and auth.role() = 'authenticated'
  );

create policy "Authenticated Users can update product-images" on storage.objects
  for update using (
    bucket_id = 'product-images' and auth.role() = 'authenticated'
  );

create policy "Authenticated Users can delete product-images" on storage.objects
  for delete using (
    bucket_id = 'product-images' and auth.role() = 'authenticated'
  );
