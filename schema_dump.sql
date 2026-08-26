


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "private";


ALTER SCHEMA "private" OWNER TO "postgres";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "private"."get_auth_user_tenant_ids"() RETURNS SETOF "uuid"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select tenant_id from public.tenant_users where user_id = auth.uid();
$$;


ALTER FUNCTION "private"."get_auth_user_tenant_ids"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decrement_inventory"("p_variant_id" "uuid", "p_store_id" "uuid", "p_amount" integer) RETURNS boolean
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
  v_current_qty integer;
begin
  -- Lock the row for update
  select quantity into v_current_qty
  from public.inventory_levels
  where variant_id = p_variant_id and store_id = p_store_id
  for update;

  if not found then
    raise exception 'Inventory record not found';
  end if;

  if v_current_qty < p_amount then
    raise exception 'Insufficient inventory';
  end if;

  update public.inventory_levels
  set quantity = quantity - p_amount,
      updated_at = now()
  where variant_id = p_variant_id and store_id = p_store_id;

  return true;
end;
$$;


ALTER FUNCTION "public"."decrement_inventory"("p_variant_id" "uuid", "p_store_id" "uuid", "p_amount" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decrement_inventory_batch"("p_items" "jsonb", "p_tenant_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
  v_item jsonb;
  v_variant_id uuid;
  v_store_id uuid;
  v_quantity integer;
  v_current_qty integer;
begin
  -- Loop through items and lock rows
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_variant_id := (v_item->>'variant_id')::uuid;
    v_store_id := (v_item->>'store_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;
    
    -- Verify the store belongs to the tenant
    if not exists (select 1 from public.stores where id = v_store_id and tenant_id = p_tenant_id) then
      raise exception 'Store % does not belong to tenant %', v_store_id, p_tenant_id;
    end if;

    -- Lock the row for update
    select quantity into v_current_qty
    from public.inventory_levels
    where variant_id = v_variant_id and store_id = v_store_id
    for update;

    if not found then
      -- If the inventory record doesn't exist, we can't decrement. 
      raise exception 'Inventory record not found for variant % at store %', v_variant_id, v_store_id;
    end if;

    if v_current_qty < v_quantity then
      raise exception 'Insufficient inventory for variant % at store % (requested: %, available: %)', v_variant_id, v_store_id, v_quantity, v_current_qty;
    end if;

    update public.inventory_levels
    set quantity = quantity - v_quantity,
        updated_at = now()
    where variant_id = v_variant_id and store_id = v_store_id;
  end loop;

  return true;
end;
$$;


ALTER FUNCTION "public"."decrement_inventory_batch"("p_items" "jsonb", "p_tenant_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_auth_user_tenant_ids"() RETURNS SETOF "uuid"
    LANGUAGE "sql"
    SET "search_path" TO 'public'
    AS $$
  select private.get_auth_user_tenant_ids();
$$;


ALTER FUNCTION "public"."get_auth_user_tenant_ids"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_customer_page_metrics"() RETURNS "jsonb"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."get_customer_page_metrics"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_dashboard_metrics"("p_days" integer DEFAULT 1) RETURNS "jsonb"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."get_dashboard_metrics"("p_days" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_inventory_metrics"() RETURNS "jsonb"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
  v_tenant_id uuid;
  v_total_units int := 0;
  v_total_variants int := 0;
  v_total_value decimal(10,2) := 0;
  v_low_stock_count int := 0;
  v_out_of_stock_count int := 0;
begin
  select tenant_id into v_tenant_id from public.tenant_users where user_id = auth.uid() limit 1;
  if v_tenant_id is null then raise exception 'Tenant not found'; end if;

  select count(distinct variant_id) into v_total_variants
  from public.inventory_view
  where tenant_id = v_tenant_id;

  select 
    coalesce(sum(quantity), 0),
    coalesce(sum(quantity * price), 0),
    count(case when quantity > 0 and quantity < 10 then 1 end),
    count(case when quantity = 0 then 1 end)
  into 
    v_total_units,
    v_total_value,
    v_low_stock_count,
    v_out_of_stock_count
  from public.inventory_view
  where tenant_id = v_tenant_id;

  return jsonb_build_object(
    'totalUnits', v_total_units,
    'totalVariants', v_total_variants,
    'totalValue', v_total_value,
    'lowStockCount', v_low_stock_count,
    'outOfStockCount', v_out_of_stock_count
  );
end;
$$;


ALTER FUNCTION "public"."get_inventory_metrics"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_superadmin"() RETURNS boolean
    LANGUAGE "sql"
    SET "search_path" TO 'public'
    AS $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'is_superadmin')::boolean, false);
$$;


ALTER FUNCTION "public"."is_superadmin"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."customers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "name" "text",
    "phone" "text" NOT NULL,
    "email" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."customers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "store_id" "uuid" NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "total_amount" numeric(10,2) DEFAULT 0.00 NOT NULL,
    "delivery_address" "text",
    "delivery_fee" numeric(10,2) DEFAULT 0.00 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "orders_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'pending_payment'::"text", 'paid'::"text", 'dispatched'::"text", 'delivered'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."customer_stats_view" WITH ("security_invoker"='true') AS
 SELECT "c"."id",
    "c"."tenant_id",
    "c"."name",
    "c"."phone",
    "c"."email",
    "c"."created_at",
    "count"("o"."id") AS "total_orders",
    COALESCE("sum"(("o"."total_amount" - "o"."delivery_fee")), (0)::numeric) AS "total_spent",
    "max"("o"."created_at") AS "last_order_date",
        CASE
            WHEN ("count"("o"."id") > 0) THEN (COALESCE("sum"(("o"."total_amount" - "o"."delivery_fee")), (0)::numeric) / ("count"("o"."id"))::numeric)
            ELSE (0)::numeric
        END AS "aov",
    "count"(
        CASE
            WHEN ("o"."created_at" >= ("now"() - '30 days'::interval)) THEN 1
            ELSE NULL::integer
        END) AS "current_orders",
    "count"(
        CASE
            WHEN (("o"."created_at" >= ("now"() - '60 days'::interval)) AND ("o"."created_at" < ("now"() - '30 days'::interval))) THEN 1
            ELSE NULL::integer
        END) AS "previous_orders"
   FROM ("public"."customers" "c"
     LEFT JOIN "public"."orders" "o" ON ((("c"."id" = "o"."customer_id") AND ("o"."status" <> ALL (ARRAY['draft'::"text", 'cancelled'::"text"])))))
  GROUP BY "c"."id", "c"."tenant_id", "c"."name", "c"."phone", "c"."email", "c"."created_at";


ALTER VIEW "public"."customer_stats_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."expenses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "store_id" "uuid",
    "amount" numeric(12,2) NOT NULL,
    "currency" "text" DEFAULT 'GHS'::"text" NOT NULL,
    "category" "text" NOT NULL,
    "description" "text",
    "expense_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "receipt_url" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."expenses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventory_levels" (
    "variant_id" "uuid" NOT NULL,
    "store_id" "uuid" NOT NULL,
    "quantity" integer DEFAULT 0 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."inventory_levels" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."product_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_variants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "sku" "text" NOT NULL,
    "name" "text",
    "price" numeric(10,2) NOT NULL,
    "compare_at_price" numeric(10,2),
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "cost_price" numeric(10,2)
);


ALTER TABLE "public"."product_variants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "category_id" "uuid",
    "vendor" "text",
    "image_urls" "text"[] DEFAULT '{}'::"text"[],
    "stock_unit" "text" DEFAULT 'pcs'::"text"
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stores" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "location" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."stores" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."inventory_view" AS
 SELECT "pv"."id" AS "variant_id",
    "pv"."sku",
    "pv"."name" AS "variant_name",
    "pv"."price",
    "pv"."product_id",
    "p"."name" AS "product_name",
    "p"."image_urls",
    "p"."category_id",
    "pc"."name" AS "category_name",
    COALESCE("il"."quantity", 0) AS "quantity",
    "il"."store_id",
    "s"."name" AS "store_name",
    "p"."tenant_id"
   FROM (((("public"."product_variants" "pv"
     JOIN "public"."products" "p" ON (("pv"."product_id" = "p"."id")))
     LEFT JOIN "public"."product_categories" "pc" ON (("p"."category_id" = "pc"."id")))
     LEFT JOIN "public"."inventory_levels" "il" ON (("pv"."id" = "il"."variant_id")))
     LEFT JOIN "public"."stores" "s" ON (("il"."store_id" = "s"."id")));


ALTER VIEW "public"."inventory_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "variant_id" "uuid" NOT NULL,
    "quantity" integer DEFAULT 1 NOT NULL,
    "unit_price" numeric(10,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "order_items_quantity_check" CHECK (("quantity" > 0))
);


ALTER TABLE "public"."order_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "order_id" "uuid" NOT NULL,
    "provider" "text" NOT NULL,
    "transaction_ref" "text",
    "amount" numeric(10,2) NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "payments_provider_check" CHECK (("provider" = ANY (ARRAY['momo'::"text", 'cash_on_delivery'::"text", 'card_payment'::"text", 'cash_payment'::"text"]))),
    CONSTRAINT "payments_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_waitlist" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "variant_id" "uuid" NOT NULL,
    "customer_name" "text",
    "email" "text",
    "phone" "text",
    "status" "text" DEFAULT 'waiting'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "product_waitlist_status_check" CHECK (("status" = ANY (ARRAY['waiting'::"text", 'notified'::"text", 'purchased'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."product_waitlist" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shipment_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "shipment_id" "uuid" NOT NULL,
    "variant_id" "uuid" NOT NULL,
    "quantity" integer DEFAULT 1 NOT NULL,
    "cost_price" numeric(10,2),
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "shipment_items_quantity_check" CHECK (("quantity" > 0))
);


ALTER TABLE "public"."shipment_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shipments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "supplier_id" "uuid" NOT NULL,
    "tracking_number" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "eta" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "shipments_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'in_transit'::"text", 'delivered'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."shipments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."suppliers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "contact_name" "text",
    "email" "text",
    "phone" "text",
    "country" "text" DEFAULT 'Ghana'::"text",
    "outstanding_balance" numeric(10,2) DEFAULT 0.00 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."suppliers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tenant_settings" (
    "tenant_id" "uuid" NOT NULL,
    "branding" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "features" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "integrations" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "business_street" "text",
    "business_city" "text",
    "business_state" "text",
    "business_zip" "text",
    "business_country" "text",
    "store_email" "text",
    "store_currency" "text" DEFAULT 'GHS'::"text",
    "language" "text" DEFAULT 'en'::"text",
    "timezone" "text" DEFAULT 'UTC'::"text",
    "two_factor_enabled" boolean DEFAULT false,
    "sms_recovery_enabled" boolean DEFAULT false,
    "brand_primary_color" "text",
    "trading_name" "text",
    "industry" "text",
    "tax_id" "text",
    "brand_secondary_color" "text"
);


ALTER TABLE "public"."tenant_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tenant_users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'member'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "tenant_users_role_check" CHECK (("role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'member'::"text"])))
);


ALTER TABLE "public"."tenant_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tenants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."tenants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."waitlist" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."waitlist" OWNER TO "postgres";


ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_tenant_id_phone_key" UNIQUE ("tenant_id", "phone");



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventory_levels"
    ADD CONSTRAINT "inventory_levels_pkey" PRIMARY KEY ("variant_id", "store_id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_tenant_id_transaction_ref_key" UNIQUE ("tenant_id", "transaction_ref");



ALTER TABLE ONLY "public"."product_categories"
    ADD CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_categories"
    ADD CONSTRAINT "product_categories_tenant_id_name_key" UNIQUE ("tenant_id", "name");



ALTER TABLE ONLY "public"."product_variants"
    ADD CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_variants"
    ADD CONSTRAINT "product_variants_product_id_sku_key" UNIQUE ("product_id", "sku");



ALTER TABLE ONLY "public"."product_waitlist"
    ADD CONSTRAINT "product_waitlist_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shipment_items"
    ADD CONSTRAINT "shipment_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shipments"
    ADD CONSTRAINT "shipments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stores"
    ADD CONSTRAINT "stores_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."suppliers"
    ADD CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tenant_settings"
    ADD CONSTRAINT "tenant_settings_pkey" PRIMARY KEY ("tenant_id");



ALTER TABLE ONLY "public"."tenant_users"
    ADD CONSTRAINT "tenant_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tenant_users"
    ADD CONSTRAINT "tenant_users_tenant_id_user_id_key" UNIQUE ("tenant_id", "user_id");



ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."waitlist"
    ADD CONSTRAINT "waitlist_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."waitlist"
    ADD CONSTRAINT "waitlist_pkey" PRIMARY KEY ("id");



CREATE OR REPLACE TRIGGER "set_tenant_settings_updated_at" BEFORE UPDATE ON "public"."tenant_settings" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inventory_levels"
    ADD CONSTRAINT "inventory_levels_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inventory_levels"
    ADD CONSTRAINT "inventory_levels_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_categories"
    ADD CONSTRAINT "product_categories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_variants"
    ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_waitlist"
    ADD CONSTRAINT "product_waitlist_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_waitlist"
    ADD CONSTRAINT "product_waitlist_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."product_categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shipment_items"
    ADD CONSTRAINT "shipment_items_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shipment_items"
    ADD CONSTRAINT "shipment_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."shipments"
    ADD CONSTRAINT "shipments_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."shipments"
    ADD CONSTRAINT "shipments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stores"
    ADD CONSTRAINT "stores_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."suppliers"
    ADD CONSTRAINT "suppliers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tenant_settings"
    ADD CONSTRAINT "tenant_settings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tenant_users"
    ADD CONSTRAINT "tenant_users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tenant_users"
    ADD CONSTRAINT "tenant_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Anyone can join waitlist" ON "public"."waitlist" FOR INSERT WITH CHECK ((("auth"."role"() = 'anon'::"text") OR ("auth"."role"() = 'authenticated'::"text")));



CREATE POLICY "Superadmins can insert tenants." ON "public"."tenants" FOR INSERT WITH CHECK ("public"."is_superadmin"());



CREATE POLICY "Superadmins can update tenants." ON "public"."tenants" FOR UPDATE USING ("public"."is_superadmin"());



CREATE POLICY "Superadmins can view all customers." ON "public"."customers" FOR SELECT USING ("public"."is_superadmin"());



CREATE POLICY "Superadmins can view all expenses." ON "public"."expenses" FOR SELECT USING ("public"."is_superadmin"());



CREATE POLICY "Superadmins can view all inventory_levels." ON "public"."inventory_levels" FOR SELECT USING ("public"."is_superadmin"());



CREATE POLICY "Superadmins can view all order_items." ON "public"."order_items" FOR SELECT USING ("public"."is_superadmin"());



CREATE POLICY "Superadmins can view all orders." ON "public"."orders" FOR SELECT USING ("public"."is_superadmin"());



CREATE POLICY "Superadmins can view all payments." ON "public"."payments" FOR SELECT USING ("public"."is_superadmin"());



CREATE POLICY "Superadmins can view all product_categories." ON "public"."product_categories" FOR SELECT USING ("public"."is_superadmin"());



CREATE POLICY "Superadmins can view all product_variants." ON "public"."product_variants" FOR SELECT USING ("public"."is_superadmin"());



CREATE POLICY "Superadmins can view all product_waitlist." ON "public"."product_waitlist" FOR SELECT USING ("public"."is_superadmin"());



CREATE POLICY "Superadmins can view all products." ON "public"."products" FOR SELECT USING ("public"."is_superadmin"());



CREATE POLICY "Superadmins can view all shipment_items." ON "public"."shipment_items" FOR SELECT USING ("public"."is_superadmin"());



CREATE POLICY "Superadmins can view all shipments." ON "public"."shipments" FOR SELECT USING ("public"."is_superadmin"());



CREATE POLICY "Superadmins can view all stores." ON "public"."stores" FOR SELECT USING ("public"."is_superadmin"());



CREATE POLICY "Superadmins can view all suppliers." ON "public"."suppliers" FOR SELECT USING ("public"."is_superadmin"());



CREATE POLICY "Superadmins can view all tenant_settings." ON "public"."tenant_settings" FOR SELECT USING ("public"."is_superadmin"());



CREATE POLICY "Superadmins can view all tenant_users." ON "public"."tenant_users" FOR SELECT USING ("public"."is_superadmin"());



CREATE POLICY "Superadmins can view all tenants." ON "public"."tenants" FOR SELECT USING ("public"."is_superadmin"());



CREATE POLICY "Superadmins can view waitlist" ON "public"."waitlist" FOR SELECT USING ("public"."is_superadmin"());



CREATE POLICY "Tenant settings are insertable by tenant users" ON "public"."tenant_settings" FOR INSERT WITH CHECK (("tenant_id" IN ( SELECT "tenant_users"."tenant_id"
   FROM "public"."tenant_users"
  WHERE (("tenant_users"."user_id" = "auth"."uid"()) AND ("tenant_users"."role" = 'owner'::"text")))));



CREATE POLICY "Tenant settings are updatable by tenant users" ON "public"."tenant_settings" FOR UPDATE USING (("tenant_id" IN ( SELECT "tenant_users"."tenant_id"
   FROM "public"."tenant_users"
  WHERE (("tenant_users"."user_id" = "auth"."uid"()) AND ("tenant_users"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"]))))));



CREATE POLICY "Tenant settings are viewable by tenant users" ON "public"."tenant_settings" FOR SELECT USING (("tenant_id" IN ( SELECT "tenant_users"."tenant_id"
   FROM "public"."tenant_users"
  WHERE ("tenant_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can delete categories of their tenant." ON "public"."product_categories" FOR DELETE USING (("tenant_id" IN ( SELECT "public"."get_auth_user_tenant_ids"() AS "get_auth_user_tenant_ids")));



CREATE POLICY "Users can delete expenses of their tenant." ON "public"."expenses" FOR DELETE USING (("tenant_id" IN ( SELECT "public"."get_auth_user_tenant_ids"() AS "get_auth_user_tenant_ids")));



CREATE POLICY "Users can delete products of their tenant." ON "public"."products" FOR DELETE USING (("tenant_id" IN ( SELECT "public"."get_auth_user_tenant_ids"() AS "get_auth_user_tenant_ids")));



CREATE POLICY "Users can delete stores of their tenant." ON "public"."stores" FOR DELETE USING (("tenant_id" IN ( SELECT "public"."get_auth_user_tenant_ids"() AS "get_auth_user_tenant_ids")));



CREATE POLICY "Users can delete suppliers of their tenant." ON "public"."suppliers" FOR DELETE USING (("tenant_id" IN ( SELECT "public"."get_auth_user_tenant_ids"() AS "get_auth_user_tenant_ids")));



CREATE POLICY "Users can delete variants of their tenant's products." ON "public"."product_variants" FOR DELETE USING (("product_id" IN ( SELECT "products"."id"
   FROM "public"."products"
  WHERE ("products"."tenant_id" IN ( SELECT "public"."get_auth_user_tenant_ids"() AS "get_auth_user_tenant_ids")))));



CREATE POLICY "Users can insert categories of their tenant." ON "public"."product_categories" FOR INSERT WITH CHECK (("tenant_id" IN ( SELECT "public"."get_auth_user_tenant_ids"() AS "get_auth_user_tenant_ids")));



CREATE POLICY "Users can insert customers of their tenant." ON "public"."customers" FOR INSERT WITH CHECK (("tenant_id" IN ( SELECT "public"."get_auth_user_tenant_ids"() AS "get_auth_user_tenant_ids")));



CREATE POLICY "Users can insert expenses of their tenant." ON "public"."expenses" FOR INSERT WITH CHECK (("tenant_id" IN ( SELECT "public"."get_auth_user_tenant_ids"() AS "get_auth_user_tenant_ids")));



CREATE POLICY "Users can insert order_items to their tenant's orders." ON "public"."order_items" FOR INSERT WITH CHECK (("order_id" IN ( SELECT "orders"."id"
   FROM "public"."orders"
  WHERE ("orders"."tenant_id" IN ( SELECT "public"."get_auth_user_tenant_ids"() AS "get_auth_user_tenant_ids")))));



CREATE POLICY "Users can insert orders for their tenant." ON "public"."orders" FOR INSERT WITH CHECK (("tenant_id" IN ( SELECT "public"."get_auth_user_tenant_ids"() AS "get_auth_user_tenant_ids")));



CREATE POLICY "Users can insert payments for their tenant." ON "public"."payments" FOR INSERT WITH CHECK (("tenant_id" IN ( SELECT "public"."get_auth_user_tenant_ids"() AS "get_auth_user_tenant_ids")));



CREATE POLICY "Users can insert products of their tenant." ON "public"."products" FOR INSERT WITH CHECK (("tenant_id" IN ( SELECT "public"."get_auth_user_tenant_ids"() AS "get_auth_user_tenant_ids")));



CREATE POLICY "Users can insert shipment_items to their tenant's shipments." ON "public"."shipment_items" FOR INSERT WITH CHECK (("shipment_id" IN ( SELECT "shipments"."id"
   FROM "public"."shipments"
  WHERE ("shipments"."tenant_id" IN ( SELECT "public"."get_auth_user_tenant_ids"() AS "get_auth_user_tenant_ids")))));



CREATE POLICY "Users can insert shipments for their tenant." ON "public"."shipments" FOR INSERT WITH CHECK (("tenant_id" IN ( SELECT "public"."get_auth_user_tenant_ids"() AS "get_auth_user_tenant_ids")));



CREATE POLICY "Users can insert stores of their tenant." ON "public"."stores" FOR INSERT WITH CHECK (("tenant_id" IN ( SELECT "public"."get_auth_user_tenant_ids"() AS "get_auth_user_tenant_ids")));



CREATE POLICY "Users can insert suppliers for their tenant." ON "public"."suppliers" FOR INSERT WITH CHECK (("tenant_id" IN ( SELECT "public"."get_auth_user_tenant_ids"() AS "get_auth_user_tenant_ids")));



CREATE POLICY "Users can insert variants to their tenant's products." ON "public"."product_variants" FOR INSERT WITH CHECK (("product_id" IN ( SELECT "products"."id"
   FROM "public"."products"
  WHERE ("products"."tenant_id" IN ( SELECT "public"."get_auth_user_tenant_ids"() AS "get_auth_user_tenant_ids")))));



CREATE POLICY "Users can manage waitlist of their tenant." ON "public"."product_waitlist" USING (("tenant_id" IN ( SELECT "public"."get_auth_user_tenant_ids"() AS "get_auth_user_tenant_ids")));



CREATE POLICY "Users can update categories of their tenant." ON "public"."product_categories" FOR UPDATE USING (("tenant_id" IN ( SELECT "public"."get_auth_user_tenant_ids"() AS "get_auth_user_tenant_ids")));



CREATE POLICY "Users can update customers of their tenant." ON "public"."customers" FOR UPDATE USING (("tenant_id" IN ( SELECT "public"."get_auth_user_tenant_ids"() AS "get_auth_user_tenant_ids")));



CREATE POLICY "Users can update expenses of their tenant." ON "public"."expenses" FOR UPDATE USING (("tenant_id" IN ( SELECT "public"."get_auth_user_tenant_ids"() AS "get_auth_user_tenant_ids")));



CREATE POLICY "Users can update inventory of their tenant's stores." ON "public"."inventory_levels" USING (("store_id" IN ( SELECT "stores"."id"
   FROM "public"."stores"
  WHERE ("stores"."tenant_id" IN ( SELECT "public"."get_auth_user_tenant_ids"() AS "get_auth_user_tenant_ids")))));



CREATE POLICY "Users can update order_items of their tenant's orders." ON "public"."order_items" FOR UPDATE USING (("order_id" IN ( SELECT "orders"."id"
   FROM "public"."orders"
  WHERE ("orders"."tenant_id" IN ( SELECT "public"."get_auth_user_tenant_ids"() AS "get_auth_user_tenant_ids")))));



CREATE POLICY "Users can update orders of their tenant." ON "public"."orders" FOR UPDATE USING (("tenant_id" IN ( SELECT "public"."get_auth_user_tenant_ids"() AS "get_auth_user_tenant_ids")));



CREATE POLICY "Users can update payments of their tenant." ON "public"."payments" FOR UPDATE USING (("tenant_id" IN ( SELECT "public"."get_auth_user_tenant_ids"() AS "get_auth_user_tenant_ids")));



CREATE POLICY "Users can update products of their tenant." ON "public"."products" FOR UPDATE USING (("tenant_id" IN ( SELECT "public"."get_auth_user_tenant_ids"() AS "get_auth_user_tenant_ids")));



CREATE POLICY "Users can update settings of their tenant." ON "public"."tenant_settings" FOR UPDATE USING (("tenant_id" IN ( SELECT "public"."get_auth_user_tenant_ids"() AS "get_auth_user_tenant_ids")));



CREATE POLICY "Users can update shipment_items of their tenant's shipments." ON "public"."shipment_items" FOR UPDATE USING (("shipment_id" IN ( SELECT "shipments"."id"
   FROM "public"."shipments"
  WHERE ("shipments"."tenant_id" IN ( SELECT "public"."get_auth_user_tenant_ids"() AS "get_auth_user_tenant_ids")))));



CREATE POLICY "Users can update shipments of their tenant." ON "public"."shipments" FOR UPDATE USING (("tenant_id" IN ( SELECT "public"."get_auth_user_tenant_ids"() AS "get_auth_user_tenant_ids")));



CREATE POLICY "Users can update stores of their tenant." ON "public"."stores" FOR UPDATE USING (("tenant_id" IN ( SELECT "public"."get_auth_user_tenant_ids"() AS "get_auth_user_tenant_ids")));



CREATE POLICY "Users can update suppliers of their tenant." ON "public"."suppliers" FOR UPDATE USING (("tenant_id" IN ( SELECT "public"."get_auth_user_tenant_ids"() AS "get_auth_user_tenant_ids")));



CREATE POLICY "Users can update variants of their tenant's products." ON "public"."product_variants" FOR UPDATE USING (("product_id" IN ( SELECT "products"."id"
   FROM "public"."products"
  WHERE ("products"."tenant_id" IN ( SELECT "public"."get_auth_user_tenant_ids"() AS "get_auth_user_tenant_ids")))));



CREATE POLICY "Users can view categories of their tenant." ON "public"."product_categories" FOR SELECT USING (("tenant_id" IN ( SELECT "public"."get_auth_user_tenant_ids"() AS "get_auth_user_tenant_ids")));



CREATE POLICY "Users can view customers of their tenant." ON "public"."customers" FOR SELECT USING (("tenant_id" IN ( SELECT "public"."get_auth_user_tenant_ids"() AS "get_auth_user_tenant_ids")));



CREATE POLICY "Users can view expenses of their tenant." ON "public"."expenses" FOR SELECT USING (("tenant_id" IN ( SELECT "public"."get_auth_user_tenant_ids"() AS "get_auth_user_tenant_ids")));



CREATE POLICY "Users can view inventory of their tenant's stores." ON "public"."inventory_levels" FOR SELECT USING (("store_id" IN ( SELECT "stores"."id"
   FROM "public"."stores"
  WHERE ("stores"."tenant_id" IN ( SELECT "public"."get_auth_user_tenant_ids"() AS "get_auth_user_tenant_ids")))));



CREATE POLICY "Users can view members of their tenant." ON "public"."tenant_users" FOR SELECT USING (("tenant_id" IN ( SELECT "public"."get_auth_user_tenant_ids"() AS "get_auth_user_tenant_ids")));



CREATE POLICY "Users can view order_items of their tenant's orders." ON "public"."order_items" FOR SELECT USING (("order_id" IN ( SELECT "orders"."id"
   FROM "public"."orders"
  WHERE ("orders"."tenant_id" IN ( SELECT "public"."get_auth_user_tenant_ids"() AS "get_auth_user_tenant_ids")))));



CREATE POLICY "Users can view orders of their tenant." ON "public"."orders" FOR SELECT USING (("tenant_id" IN ( SELECT "public"."get_auth_user_tenant_ids"() AS "get_auth_user_tenant_ids")));



CREATE POLICY "Users can view payments of their tenant." ON "public"."payments" FOR SELECT USING (("tenant_id" IN ( SELECT "public"."get_auth_user_tenant_ids"() AS "get_auth_user_tenant_ids")));



CREATE POLICY "Users can view products of their tenant." ON "public"."products" FOR SELECT USING (("tenant_id" IN ( SELECT "public"."get_auth_user_tenant_ids"() AS "get_auth_user_tenant_ids")));



CREATE POLICY "Users can view settings of their tenant." ON "public"."tenant_settings" FOR SELECT USING (("tenant_id" IN ( SELECT "public"."get_auth_user_tenant_ids"() AS "get_auth_user_tenant_ids")));



CREATE POLICY "Users can view shipment_items of their tenant's shipments." ON "public"."shipment_items" FOR SELECT USING (("shipment_id" IN ( SELECT "shipments"."id"
   FROM "public"."shipments"
  WHERE ("shipments"."tenant_id" IN ( SELECT "public"."get_auth_user_tenant_ids"() AS "get_auth_user_tenant_ids")))));



CREATE POLICY "Users can view shipments of their tenant." ON "public"."shipments" FOR SELECT USING (("tenant_id" IN ( SELECT "public"."get_auth_user_tenant_ids"() AS "get_auth_user_tenant_ids")));



CREATE POLICY "Users can view stores of their tenant." ON "public"."stores" FOR SELECT USING (("tenant_id" IN ( SELECT "public"."get_auth_user_tenant_ids"() AS "get_auth_user_tenant_ids")));



CREATE POLICY "Users can view suppliers of their tenant." ON "public"."suppliers" FOR SELECT USING (("tenant_id" IN ( SELECT "public"."get_auth_user_tenant_ids"() AS "get_auth_user_tenant_ids")));



CREATE POLICY "Users can view their own tenant." ON "public"."tenants" FOR SELECT USING (("id" IN ( SELECT "public"."get_auth_user_tenant_ids"() AS "get_auth_user_tenant_ids")));



CREATE POLICY "Users can view variants of their tenant's products." ON "public"."product_variants" FOR SELECT USING (("product_id" IN ( SELECT "products"."id"
   FROM "public"."products"
  WHERE ("products"."tenant_id" IN ( SELECT "public"."get_auth_user_tenant_ids"() AS "get_auth_user_tenant_ids")))));



CREATE POLICY "Users can view waitlist of their tenant." ON "public"."product_waitlist" FOR SELECT USING (("tenant_id" IN ( SELECT "public"."get_auth_user_tenant_ids"() AS "get_auth_user_tenant_ids")));



CREATE POLICY "Users with owner or admin role can update their tenant." ON "public"."tenants" FOR UPDATE USING (("id" IN ( SELECT "tenant_users"."tenant_id"
   FROM "public"."tenant_users"
  WHERE (("tenant_users"."user_id" = "auth"."uid"()) AND ("tenant_users"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"]))))));



ALTER TABLE "public"."customers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."expenses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inventory_levels" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_variants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_waitlist" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shipment_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shipments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stores" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."suppliers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tenant_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tenant_users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tenants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."waitlist" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "private" TO PUBLIC;



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."decrement_inventory"("p_variant_id" "uuid", "p_store_id" "uuid", "p_amount" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."decrement_inventory"("p_variant_id" "uuid", "p_store_id" "uuid", "p_amount" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."decrement_inventory"("p_variant_id" "uuid", "p_store_id" "uuid", "p_amount" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."decrement_inventory_batch"("p_items" "jsonb", "p_tenant_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."decrement_inventory_batch"("p_items" "jsonb", "p_tenant_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."decrement_inventory_batch"("p_items" "jsonb", "p_tenant_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_auth_user_tenant_ids"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_auth_user_tenant_ids"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_auth_user_tenant_ids"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_customer_page_metrics"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_customer_page_metrics"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_customer_page_metrics"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_dashboard_metrics"("p_days" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_dashboard_metrics"("p_days" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_dashboard_metrics"("p_days" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_inventory_metrics"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_inventory_metrics"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_inventory_metrics"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_superadmin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_superadmin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_superadmin"() TO "service_role";


















GRANT ALL ON TABLE "public"."customers" TO "anon";
GRANT ALL ON TABLE "public"."customers" TO "authenticated";
GRANT ALL ON TABLE "public"."customers" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."customer_stats_view" TO "anon";
GRANT ALL ON TABLE "public"."customer_stats_view" TO "authenticated";
GRANT ALL ON TABLE "public"."customer_stats_view" TO "service_role";



GRANT ALL ON TABLE "public"."expenses" TO "anon";
GRANT ALL ON TABLE "public"."expenses" TO "authenticated";
GRANT ALL ON TABLE "public"."expenses" TO "service_role";



GRANT ALL ON TABLE "public"."inventory_levels" TO "anon";
GRANT ALL ON TABLE "public"."inventory_levels" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory_levels" TO "service_role";



GRANT ALL ON TABLE "public"."product_categories" TO "anon";
GRANT ALL ON TABLE "public"."product_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."product_categories" TO "service_role";



GRANT ALL ON TABLE "public"."product_variants" TO "anon";
GRANT ALL ON TABLE "public"."product_variants" TO "authenticated";
GRANT ALL ON TABLE "public"."product_variants" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."stores" TO "anon";
GRANT ALL ON TABLE "public"."stores" TO "authenticated";
GRANT ALL ON TABLE "public"."stores" TO "service_role";



GRANT ALL ON TABLE "public"."inventory_view" TO "anon";
GRANT ALL ON TABLE "public"."inventory_view" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory_view" TO "service_role";



GRANT ALL ON TABLE "public"."order_items" TO "anon";
GRANT ALL ON TABLE "public"."order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."order_items" TO "service_role";



GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT ALL ON TABLE "public"."product_waitlist" TO "anon";
GRANT ALL ON TABLE "public"."product_waitlist" TO "authenticated";
GRANT ALL ON TABLE "public"."product_waitlist" TO "service_role";



GRANT ALL ON TABLE "public"."shipment_items" TO "anon";
GRANT ALL ON TABLE "public"."shipment_items" TO "authenticated";
GRANT ALL ON TABLE "public"."shipment_items" TO "service_role";



GRANT ALL ON TABLE "public"."shipments" TO "anon";
GRANT ALL ON TABLE "public"."shipments" TO "authenticated";
GRANT ALL ON TABLE "public"."shipments" TO "service_role";



GRANT ALL ON TABLE "public"."suppliers" TO "anon";
GRANT ALL ON TABLE "public"."suppliers" TO "authenticated";
GRANT ALL ON TABLE "public"."suppliers" TO "service_role";



GRANT ALL ON TABLE "public"."tenant_settings" TO "anon";
GRANT ALL ON TABLE "public"."tenant_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."tenant_settings" TO "service_role";



GRANT ALL ON TABLE "public"."tenant_users" TO "anon";
GRANT ALL ON TABLE "public"."tenant_users" TO "authenticated";
GRANT ALL ON TABLE "public"."tenant_users" TO "service_role";



GRANT ALL ON TABLE "public"."tenants" TO "anon";
GRANT ALL ON TABLE "public"."tenants" TO "authenticated";
GRANT ALL ON TABLE "public"."tenants" TO "service_role";



GRANT ALL ON TABLE "public"."waitlist" TO "anon";
GRANT ALL ON TABLE "public"."waitlist" TO "authenticated";
GRANT ALL ON TABLE "public"."waitlist" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































