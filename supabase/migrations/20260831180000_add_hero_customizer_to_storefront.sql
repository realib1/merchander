-- Migration: Add hero showcase columns to storefront_settings
ALTER TABLE public.storefront_settings 
  ADD COLUMN IF NOT EXISTS hero_mode text DEFAULT 'default',
  ADD COLUMN IF NOT EXISTS banner_headline text,
  ADD COLUMN IF NOT EXISTS banner_tagline text,
  ADD COLUMN IF NOT EXISTS banner_cta_text text;
