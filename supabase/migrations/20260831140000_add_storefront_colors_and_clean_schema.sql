-- Add brand primary and secondary color columns to storefront_settings and tenant_settings
ALTER TABLE public.storefront_settings
ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#3b82f6',
ADD COLUMN IF NOT EXISTS secondary_color text DEFAULT '#1e40af';

ALTER TABLE public.tenant_settings
ADD COLUMN IF NOT EXISTS brand_primary_color text DEFAULT '#3b82f6',
ADD COLUMN IF NOT EXISTS brand_secondary_color text DEFAULT '#1e40af';
