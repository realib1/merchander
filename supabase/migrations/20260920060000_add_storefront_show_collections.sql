-- Migration: Add show_collections boolean column to storefront_settings
ALTER TABLE public.storefront_settings
ADD COLUMN IF NOT EXISTS show_collections BOOLEAN DEFAULT FALSE;
