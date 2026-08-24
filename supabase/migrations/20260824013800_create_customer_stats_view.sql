-- Create a view for customer statistics with security invoker to respect RLS
create or replace view public.customer_stats_view with (security_invoker = true) as
select
  c.id,
  c.tenant_id,
  c.name,
  c.phone,
  c.email,
  c.created_at,
  count(o.id) as total_orders,
  coalesce(sum(o.total_amount - o.delivery_fee), 0) as total_spent,
  max(o.created_at) as last_order_date,
  case
    when count(o.id) > 0 then coalesce(sum(o.total_amount - o.delivery_fee), 0) / count(o.id)
    else 0
  end as aov,
  count(case when o.created_at >= (now() - interval '30 days') then 1 end) as current_orders,
  count(case when o.created_at >= (now() - interval '60 days') and o.created_at < (now() - interval '30 days') then 1 end) as previous_orders
from public.customers c
left join public.orders o on c.id = o.customer_id and o.status not in ('draft', 'cancelled')
group by c.id, c.tenant_id, c.name, c.phone, c.email, c.created_at;
