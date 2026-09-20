-- Migration: Add hero_slides and banner_image_fit to storefront_settings and ensure store-assets storage bucket exists
ALTER TABLE public.storefront_settings
  ADD COLUMN IF NOT EXISTS hero_slides JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS banner_image_fit TEXT DEFAULT 'fit';

-- Ensure storage buckets exist and are public
INSERT INTO storage.buckets (id, name, public)
VALUES ('store-assets', 'store-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage RLS policies for store-assets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public Access to store-assets'
  ) THEN
    CREATE POLICY "Public Access to store-assets" ON storage.objects
      FOR SELECT USING (bucket_id = 'store-assets');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated Users can upload store-assets'
  ) THEN
    CREATE POLICY "Authenticated Users can upload store-assets" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'store-assets' AND auth.role() = 'authenticated'
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated Users can update store-assets'
  ) THEN
    CREATE POLICY "Authenticated Users can update store-assets" ON storage.objects
      FOR UPDATE USING (
        bucket_id = 'store-assets' AND auth.role() = 'authenticated'
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated Users can delete store-assets'
  ) THEN
    CREATE POLICY "Authenticated Users can delete store-assets" ON storage.objects
      FOR DELETE USING (
        bucket_id = 'store-assets' AND auth.role() = 'authenticated'
      );
  END IF;
END $$;
