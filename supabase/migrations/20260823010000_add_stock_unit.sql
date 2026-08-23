-- Add stock_unit to products
alter table public.products add column stock_unit text default 'pcs';
