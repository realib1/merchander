-- Migration: Add spotlight_one and spotlight_two JSONB columns to storefront_settings
ALTER TABLE public.storefront_settings
ADD COLUMN IF NOT EXISTS spotlight_one JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS spotlight_two JSONB DEFAULT NULL;
