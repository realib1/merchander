-- Migration: Secure Function Search Paths (Fix Linter Warnings 0011)
-- Description: Pins search_path to public, pg_temp on database functions to prevent search path hijacking.

-- 1. normalize_ghana_phone_text
CREATE OR REPLACE FUNCTION public.normalize_ghana_phone_text(p_phone text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  cleaned text;
BEGIN
  -- Strip spaces, dashes, dots
  cleaned := regexp_replace(p_phone, '[\s\-\.]', '', 'g');
  
  -- Convert 0XX... to +233XX...
  IF cleaned ~ '^0[2-5][0-9]{8}$' THEN
    RETURN '+233' || substring(cleaned FROM 2);
  -- Convert 233XX... to +233XX...
  ELSIF cleaned ~ '^233[2-5][0-9]{8}$' THEN
    RETURN '+' || cleaned;
  -- Already +233 format
  ELSIF cleaned ~ '^\+233[2-5][0-9]{8}$' THEN
    RETURN cleaned;
  END IF;
  -- If none match, leave phone as-is
  RETURN p_phone;
END;
$$;

-- 2. normalize_ghana_phone trigger function
CREATE OR REPLACE FUNCTION public.normalize_ghana_phone()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.phone IS NOT NULL THEN
    NEW.phone := public.normalize_ghana_phone_text(NEW.phone);
  END IF;
  RETURN NEW;
END;
$$;

-- 3. generate_short_id function
CREATE OR REPLACE FUNCTION public.generate_short_id(prefix text)
RETURNS text
LANGUAGE plpgsql
VOLATILE
SET search_path = public, pg_temp
AS $$
DECLARE
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result text := '';
  i integer := 0;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN prefix || '-' || result;
END;
$$;

-- 4. set_po_number trigger function
CREATE OR REPLACE FUNCTION public.set_po_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.po_number IS NULL THEN
    NEW.po_number := 'PO-' || nextval('public.purchase_order_seq')::text;
  END IF;
  RETURN NEW;
END;
$$;

-- 5. handle_updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;
