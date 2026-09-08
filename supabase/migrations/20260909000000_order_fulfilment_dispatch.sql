-- Migration: 20260909000000_order_fulfilment_dispatch.sql
-- Description: Add order fulfilment, rider assignment, pickup branch, and dispatch timestamp columns to orders table.

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS rider_name text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS rider_phone text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS courier_name text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS dispatch_notes text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_zone_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_zone_name text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pickup_store_id uuid references public.stores(id) on delete set null;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS dispatched_at timestamp with time zone;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivered_at timestamp with time zone;

-- Index for querying dispatched orders and pickup assignments
CREATE INDEX IF NOT EXISTS idx_orders_pickup_store_id ON public.orders(pickup_store_id);
CREATE INDEX IF NOT EXISTS idx_orders_dispatched_at ON public.orders(tenant_id, dispatched_at);
