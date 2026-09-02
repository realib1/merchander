-- Migration: 20260901180000_customer_acquisition_attribution.sql
-- Customer Acquisition Channels & Attribution Tracking (PRD v2.2 §18)

-- 1. Add attribution columns to customers
ALTER TABLE public.customers
    ADD COLUMN IF NOT EXISTS first_touch_source TEXT DEFAULT 'direct',
    ADD COLUMN IF NOT EXISTS referral_code TEXT,
    ADD COLUMN IF NOT EXISTS utm_source TEXT,
    ADD COLUMN IF NOT EXISTS utm_medium TEXT,
    ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
    ADD COLUMN IF NOT EXISTS total_orders_count INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_spend_amount NUMERIC(12, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS last_order_at TIMESTAMPTZ;

-- 2. Add attribution columns to orders
ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS attribution_source TEXT DEFAULT 'direct',
    ADD COLUMN IF NOT EXISTS referral_code TEXT,
    ADD COLUMN IF NOT EXISTS utm_source TEXT,
    ADD COLUMN IF NOT EXISTS utm_medium TEXT,
    ADD COLUMN IF NOT EXISTS utm_campaign TEXT;

-- 3. Indexes for fast aggregation
CREATE INDEX IF NOT EXISTS idx_customers_attribution ON public.customers(tenant_id, first_touch_source);
CREATE INDEX IF NOT EXISTS idx_orders_attribution ON public.orders(tenant_id, attribution_source);
