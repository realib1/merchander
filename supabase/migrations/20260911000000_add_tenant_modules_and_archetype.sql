-- ====================================================================
-- Migration: Add business_archetype and enabled_modules to tenant_settings
-- ====================================================================

-- 1. Add business_archetype and enabled_modules columns
ALTER TABLE public.tenant_settings
ADD COLUMN IF NOT EXISTS business_archetype text NOT NULL DEFAULT 'import_resale',
ADD COLUMN IF NOT EXISTS enabled_modules text[] NOT NULL DEFAULT ARRAY['storefront', 'profitability', 'intelligence']::text[];

-- 2. Backfill existing active tenants to have full import_resale module suite enabled
UPDATE public.tenant_settings
SET 
  business_archetype = COALESCE(business_archetype, 'import_resale'),
  enabled_modules = ARRAY['shipments', 'batches', 'suppliers', 'storefront', 'profitability', 'intelligence']::text[]
WHERE enabled_modules IS NULL OR enabled_modules = '{}'::text[] OR array_length(enabled_modules, 1) = 3;

-- 3. Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
