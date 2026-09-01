-- Add missing columns to orders table for storefront commerce
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS sales_channel text DEFAULT 'storefront';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'cash_on_delivery';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS fulfillment_mode text DEFAULT 'delivery' CHECK (fulfillment_mode IN ('delivery', 'pickup'));
