-- Fix the chart data to generate a complete time series including empty days/hours
create or replace function public.get_dashboard_metrics(
  p_days integer default 1
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_current_start timestamp with time zone;
  v_previous_start timestamp with time zone;
  v_previous_end timestamp with time zone;
  
  v_current_sales decimal(10,2) := 0;
  v_previous_sales decimal(10,2) := 0;
  v_current_orders int := 0;
  v_previous_orders int := 0;
  v_current_cost decimal(10,2) := 0;
  v_previous_cost decimal(10,2) := 0;
  v_current_customers int := 0;
  v_total_customers int := 0;
  
  v_sales_chart jsonb := '[]'::jsonb;
  v_top_products jsonb := '[]'::jsonb;
begin
  -- Get user's tenant
  select tenant_id into v_tenant_id from public.tenant_users where user_id = auth.uid() limit 1;
  
  if v_tenant_id is null then
    raise exception 'Tenant not found';
  end if;

  if p_days = 1 then
    -- Calendar Day Today (since 00:00:00 local/UTC midnight)
    v_current_start := date_trunc('day', now());
    v_previous_start := date_trunc('day', now()) - interval '1 day';
    v_previous_end := date_trunc('day', now());
  else
    -- Rolling period for 7d, 30d, 90d
    v_current_start := (now() - (p_days || ' days')::interval);
    v_previous_start := (now() - ((p_days * 2) || ' days')::interval);
    v_previous_end := v_current_start;
  end if;

  -- Current Period Sales & Order Count (No JOIN to avoid duplicates)
  select 
    coalesce(sum(total_amount - delivery_fee), 0),
    count(id)
  into v_current_sales, v_current_orders
  from public.orders
  where tenant_id = v_tenant_id
    and status in ('paid', 'dispatched', 'delivered')
    and created_at >= v_current_start;

  -- Current Period Costs (JOIN with order_items)
  select 
    coalesce(sum(oi.quantity * coalesce(pv.cost_price, (oi.unit_price * 0.6))), 0)
  into v_current_cost
  from public.order_items oi
  join public.orders o on oi.order_id = o.id
  left join public.product_variants pv on oi.variant_id = pv.id
  where o.tenant_id = v_tenant_id
    and o.status in ('paid', 'dispatched', 'delivered')
    and o.created_at >= v_current_start;

  -- Previous Period Sales & Order Count
  select 
    coalesce(sum(total_amount - delivery_fee), 0),
    count(id)
  into v_previous_sales, v_previous_orders
  from public.orders
  where tenant_id = v_tenant_id
    and status in ('paid', 'dispatched', 'delivered')
    and created_at >= v_previous_start
    and created_at < v_previous_end;

  -- Previous Period Costs
  select 
    coalesce(sum(oi.quantity * coalesce(pv.cost_price, (oi.unit_price * 0.6))), 0)
  into v_previous_cost
  from public.order_items oi
  join public.orders o on oi.order_id = o.id
  left join public.product_variants pv on oi.variant_id = pv.id
  where o.tenant_id = v_tenant_id
    and o.status in ('paid', 'dispatched', 'delivered')
    and o.created_at >= v_previous_start
    and o.created_at < v_previous_end;

  -- Customer metrics
  select count(id) into v_total_customers from public.customers where tenant_id = v_tenant_id;
  select count(id) into v_current_customers from public.customers where tenant_id = v_tenant_id and created_at >= v_current_start;

  -- Sales Chart (daily or hourly grouping with filled dates)
  if p_days = 1 then
    -- Hourly grouping for today
    select jsonb_agg(
      jsonb_build_object(
        'date', d.date_hour,
        'sales', coalesce(t.sales, 0)
      ) order by d.date_hour asc
    ) into v_sales_chart
    from (
      select generate_series(date_trunc('day', now()), date_trunc('day', now()) + interval '23 hours', interval '1 hour') as date_hour
    ) d
    left join (
      select 
        date_trunc('hour', created_at) as date_hour,
        sum(total_amount - delivery_fee) as sales
      from public.orders
      where tenant_id = v_tenant_id
        and status not in ('draft', 'cancelled')
        and created_at >= v_current_start
      group by date_trunc('hour', created_at)
    ) t on d.date_hour = t.date_hour;
  else
    -- Daily grouping
    select jsonb_agg(
      jsonb_build_object(
        'date', d.date_day,
        'sales', coalesce(t.sales, 0)
      ) order by d.date_day asc
    ) into v_sales_chart
    from (
      select date_trunc('day', generate_series(v_current_start, date_trunc('day', now()), interval '1 day'))::date as date_day
    ) d
    left join (
      select 
        date_trunc('day', created_at)::date as date_day,
        sum(total_amount - delivery_fee) as sales
      from public.orders
      where tenant_id = v_tenant_id
        and status not in ('draft', 'cancelled')
        and created_at >= v_current_start
      group by date_trunc('day', created_at)
    ) t on d.date_day = t.date_day;
  end if;

  if v_sales_chart is null then v_sales_chart := '[]'::jsonb; end if;

  -- Top Products
  select jsonb_agg(
    jsonb_build_object(
      'id', t.id,
      'name', t.name,
      'price', t.price,
      'quantitySold', t.quantity_sold
    )
  ) into v_top_products
  from (
    select 
      p.id,
      p.name,
      max(oi.unit_price) as price,
      sum(oi.quantity) as quantity_sold
    from public.order_items oi
    join public.orders o on oi.order_id = o.id
    join public.product_variants pv on oi.variant_id = pv.id
    join public.products p on pv.product_id = p.id
    where o.tenant_id = v_tenant_id
      and o.status in ('paid', 'dispatched', 'delivered')
      and o.created_at >= v_current_start
    group by p.id, p.name
    order by sum(oi.quantity) desc
    limit 4
  ) t;

  if v_top_products is null then v_top_products := '[]'::jsonb; end if;

  return jsonb_build_object(
    'current_sales', v_current_sales,
    'previous_sales', v_previous_sales,
    'current_orders', v_current_orders,
    'previous_orders', v_previous_orders,
    'current_cost', v_current_cost,
    'previous_cost', v_previous_cost,
    'current_customers', v_current_customers,
    'total_customers', v_total_customers,
    'sales_chart', v_sales_chart,
    'top_products', v_top_products
  );
end;
$$;

NOTIFY pgrst, 'reload schema';
