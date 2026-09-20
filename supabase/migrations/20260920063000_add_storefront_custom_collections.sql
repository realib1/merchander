-- Migration: Add custom_collections JSONB column to storefront_settings
ALTER TABLE public.storefront_settings
ADD COLUMN IF NOT EXISTS custom_collections JSONB DEFAULT NULL;
