-- Grant permissions for views
grant select on public.customer_stats_view to authenticated;
grant select on public.customer_stats_view to service_role;

grant select on public.inventory_view to authenticated;
grant select on public.inventory_view to service_role;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
