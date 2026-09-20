-- Add banner_contrast_theme column to public.storefront_settings
ALTER TABLE public.storefront_settings
ADD COLUMN IF NOT EXISTS banner_contrast_theme TEXT DEFAULT 'auto';
