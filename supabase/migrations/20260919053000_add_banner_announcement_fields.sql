-- Migration: Add Tastea-inspired banner announcement fields to storefront_settings
ALTER TABLE public.storefront_settings
  ADD COLUMN IF NOT EXISTS banner_badge_text text DEFAULT 'NEW ARRIVALS',
  ADD COLUMN IF NOT EXISTS banner_link_type text DEFAULT 'catalog',
  ADD COLUMN IF NOT EXISTS banner_link_id text,
  ADD COLUMN IF NOT EXISTS banner_price_pill text,
  ADD COLUMN IF NOT EXISTS banner_starts_at timestamptz,
  ADD COLUMN IF NOT EXISTS banner_ends_at timestamptz;
