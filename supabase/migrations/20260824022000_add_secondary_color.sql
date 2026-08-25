-- Add brand_secondary_color to tenant_settings

ALTER TABLE public.tenant_settings
ADD COLUMN IF NOT EXISTS brand_secondary_color text;
