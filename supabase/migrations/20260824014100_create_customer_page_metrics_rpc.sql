create or replace function public.get_customer_page_metrics()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  
  v_total_customers int := 0;
  v_current_new_customers int := 0;
  v_previous_new_customers int := 0;
  
  v_active_customers int := 0;
  
  v_total_orders int := 0;
  v_current_orders int := 0;
  v_previous_orders int := 0;
  
  v_total_revenue decimal(10,2) := 0;
  
  v_thirty_days_ago timestamp with time zone;
  v_sixty_days_ago timestamp with time zone;
  v_ninety_days_ago timestamp with time zone;
begin
  select tenant_id into v_tenant_id from public.tenant_users where user_id = auth.uid() limit 1;
  if v_tenant_id is null then raise exception 'Tenant not found'; end if;

  v_thirty_days_ago := (now() - interval '30 days');
  v_sixty_days_ago := (now() - interval '60 days');
  v_ninety_days_ago := (now() - interval '90 days');

  -- Aggregate metrics from customer_stats_view for current tenant
  select 
    count(id),
    sum(case when created_at >= v_thirty_days_ago then 1 else 0 end),
    sum(case when created_at >= v_sixty_days_ago and created_at < v_thirty_days_ago then 1 else 0 end),
    sum(case when last_order_date >= v_ninety_days_ago then 1 else 0 end),
    coalesce(sum(total_orders), 0),
    coalesce(sum(current_orders), 0),
    coalesce(sum(previous_orders), 0),
    coalesce(sum(total_spent), 0)
  into
    v_total_customers,
    v_current_new_customers,
    v_previous_new_customers,
    v_active_customers,
    v_total_orders,
    v_current_orders,
    v_previous_orders,
    v_total_revenue
  from public.customer_stats_view;

  return jsonb_build_object(
    'totalCustomers', v_total_customers,
    'currentNewCustomers', v_current_new_customers,
    'previousNewCustomers', v_previous_new_customers,
    'activeCustomers', v_active_customers,
    'totalOrders', v_total_orders,
    'currentOrders', v_current_orders,
    'previousOrders', v_previous_orders,
    'totalRevenue', v_total_revenue
  );
end;
$$;
