-- Add fields to tenant_settings for comprehensive settings management

ALTER TABLE public.tenant_settings
ADD COLUMN IF NOT EXISTS business_street text,
ADD COLUMN IF NOT EXISTS business_city text,
ADD COLUMN IF NOT EXISTS business_state text,
ADD COLUMN IF NOT EXISTS business_zip text,
ADD COLUMN IF NOT EXISTS business_country text,
ADD COLUMN IF NOT EXISTS store_email text,
ADD COLUMN IF NOT EXISTS store_currency text DEFAULT 'GHS',
ADD COLUMN IF NOT EXISTS language text DEFAULT 'en',
ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS two_factor_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS sms_recovery_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS brand_primary_color text;
