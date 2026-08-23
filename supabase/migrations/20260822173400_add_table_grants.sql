-- Grant table-level permissions to the authenticated role.
-- RLS policies handle row-level filtering, but PostgreSQL still
-- requires explicit GRANT for table-level access.

-- Core tables (init_schema)
grant select on public.tenants to authenticated;
grant select on public.tenant_users to authenticated;
grant select, insert, update, delete on public.stores to authenticated;

-- Catalog & Inventory tables
grant select, insert, update, delete on public.tenant_settings to authenticated;
grant select, insert, update, delete on public.customers to authenticated;
grant select, insert, update, delete on public.products to authenticated;
grant select, insert, update, delete on public.product_variants to authenticated;
grant select, insert, update, delete on public.inventory_levels to authenticated;

-- Orders & Payments tables
grant select, insert, update on public.orders to authenticated;
grant select, insert, update on public.order_items to authenticated;
grant select, insert, update on public.payments to authenticated;

-- Waitlist
grant select, insert on public.waitlist to anon, authenticated;
