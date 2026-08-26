-- 1. Add missing low_stock_threshold column
ALTER TABLE public.tenant_settings
ADD COLUMN IF NOT EXISTS low_stock_threshold integer DEFAULT 10;

-- 2. Grant missing table-level permissions for procurement tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.suppliers TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.shipments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.shipment_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_waitlist TO authenticated;

-- 3. Grant UPDATE on tenants (from unapplied migration 20260824021100)
GRANT UPDATE ON public.tenants TO authenticated;

-- 4. Add missing columns from unapplied migration (idempotent)
ALTER TABLE public.tenant_settings
ADD COLUMN IF NOT EXISTS trading_name text,
ADD COLUMN IF NOT EXISTS industry text,
ADD COLUMN IF NOT EXISTS tax_id text;

-- 5. Fix tenant_settings update RLS to allow admins (from unapplied migration)
DROP POLICY IF EXISTS "Tenant settings are updatable by tenant users" ON public.tenant_settings;
CREATE POLICY "Tenant settings are updatable by tenant users"
  ON public.tenant_settings FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id
      FROM public.tenant_users
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- 6. RLS policy for UPDATE on tenants
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'tenants'
    AND policyname = 'Users with owner or admin role can update their tenant.'
  ) THEN
    CREATE POLICY "Users with owner or admin role can update their tenant."
      ON public.tenants FOR UPDATE
      USING (
        id IN (
          SELECT tenant_id
          FROM public.tenant_users
          WHERE user_id = auth.uid()
          AND role IN ('owner', 'admin')
        )
      );
  END IF;
END $$;

-- 7. Phone normalization function (DB-level enforcement)
CREATE OR REPLACE FUNCTION public.normalize_ghana_phone_text(p_phone text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  cleaned text;
BEGIN
  -- Strip spaces, dashes, dots
  cleaned := regexp_replace(p_phone, '[\s\-\.]', '', 'g');
  
  -- Convert 0XX... to +233XX...
  IF cleaned ~ '^0[2-5][0-9]{8}$' THEN
    RETURN '+233' || substring(cleaned FROM 2);
  -- Convert 233XX... to +233XX...
  ELSIF cleaned ~ '^233[2-5][0-9]{8}$' THEN
    RETURN '+' || cleaned;
  -- Already +233 format
  ELSIF cleaned ~ '^\+233[2-5][0-9]{8}$' THEN
    RETURN cleaned;
  END IF;
  -- If none match, leave phone as-is
  RETURN p_phone;
END;
$$;

CREATE OR REPLACE FUNCTION public.normalize_ghana_phone()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.phone := public.normalize_ghana_phone_text(NEW.phone);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS normalize_customer_phone ON public.customers;
CREATE TRIGGER normalize_customer_phone
  BEFORE INSERT OR UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.normalize_ghana_phone();

-- 8. Merge duplicate customers (compare normalized phones)
-- This data cleanup step runs before updating to prevent unique constraint violations
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT 
      c1.id AS keep_id,
      c2.id AS merge_id
    FROM public.customers c1
    JOIN public.customers c2 
      ON c1.tenant_id = c2.tenant_id 
      AND public.normalize_ghana_phone_text(c1.phone) = public.normalize_ghana_phone_text(c2.phone) 
      AND c1.id < c2.id
    LEFT JOIN LATERAL (SELECT count(*) AS cnt FROM public.orders WHERE customer_id = c1.id) o1 ON TRUE
    LEFT JOIN LATERAL (SELECT count(*) AS cnt FROM public.orders WHERE customer_id = c2.id) o2 ON TRUE
    WHERE o1.cnt >= o2.cnt -- keep the one with more orders
  LOOP
    -- Reassign orders from merge_id to keep_id
    UPDATE public.orders SET customer_id = r.keep_id WHERE customer_id = r.merge_id;
    -- Delete the duplicate
    DELETE FROM public.customers WHERE id = r.merge_id;
  END LOOP;
END $$;

-- 9. Normalize existing phone numbers
UPDATE public.customers
SET phone = public.normalize_ghana_phone_text(phone)
WHERE phone != public.normalize_ghana_phone_text(phone);

-- 10. Short ID Generator Function
CREATE OR REPLACE FUNCTION public.generate_short_id(prefix text)
RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result text := '';
  i integer := 0;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN prefix || '-' || result;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- 11. Add short_id columns to core tables
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS short_id text UNIQUE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS short_id text UNIQUE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS short_id text UNIQUE;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS short_id text UNIQUE;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS short_id text UNIQUE;

-- Backfill short_ids for existing rows if they are null
UPDATE public.customers SET short_id = public.generate_short_id('CUST') WHERE short_id IS NULL;
UPDATE public.products SET short_id = public.generate_short_id('PROD') WHERE short_id IS NULL;
UPDATE public.orders SET short_id = public.generate_short_id('ORD') WHERE short_id IS NULL;
UPDATE public.suppliers SET short_id = public.generate_short_id('SUP') WHERE short_id IS NULL;
UPDATE public.shipments SET short_id = public.generate_short_id('SHP') WHERE short_id IS NULL;

-- Make short_id columns NOT NULL after backfilling
ALTER TABLE public.customers ALTER COLUMN short_id SET NOT NULL;
ALTER TABLE public.products ALTER COLUMN short_id SET NOT NULL;
ALTER TABLE public.orders ALTER COLUMN short_id SET NOT NULL;
ALTER TABLE public.suppliers ALTER COLUMN short_id SET NOT NULL;
ALTER TABLE public.shipments ALTER COLUMN short_id SET NOT NULL;

-- Ensure future rows get short_ids by default
ALTER TABLE public.customers ALTER COLUMN short_id SET DEFAULT public.generate_short_id('CUST');
ALTER TABLE public.products ALTER COLUMN short_id SET DEFAULT public.generate_short_id('PROD');
ALTER TABLE public.orders ALTER COLUMN short_id SET DEFAULT public.generate_short_id('ORD');
ALTER TABLE public.suppliers ALTER COLUMN short_id SET DEFAULT public.generate_short_id('SUP');
ALTER TABLE public.shipments ALTER COLUMN short_id SET DEFAULT public.generate_short_id('SHP');

-- 12. Fix for data inflation bug in get_dashboard_metrics
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

  -- Sales Chart (daily grouping)
  select jsonb_agg(
    jsonb_build_object(
      'date', t.date_day,
      'sales', coalesce(t.sales, 0)
    )
  ) into v_sales_chart
  from (
    select 
      date_trunc('day', created_at)::date as date_day,
      sum(total_amount - delivery_fee) as sales
    from public.orders
    where tenant_id = v_tenant_id
      and status not in ('draft', 'cancelled')
      and created_at >= v_current_start
    group by date_trunc('day', created_at)
    order by date_trunc('day', created_at) asc
  ) t;

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


-- 13. Fix for cross-tenant bug in get_customer_page_metrics
create or replace function public.get_customer_page_metrics()
returns jsonb
language plpgsql
security invoker
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

  -- Aggregate metrics from customer_stats_view FOR CURRENT TENANT
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
  from public.customer_stats_view
  where tenant_id = v_tenant_id;

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

-- 14. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
