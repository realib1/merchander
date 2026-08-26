-- Create an RPC to increment inventory for multiple items in a batch (used for receiving shipments)

CREATE OR REPLACE FUNCTION public.increment_inventory_batch(
  items jsonb,
  target_store_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  item jsonb;
  v_id uuid;
  qty integer;
BEGIN
  -- Validate inputs
  IF target_store_id IS NULL THEN
    RAISE EXCEPTION 'target_store_id cannot be null';
  END IF;

  IF items IS NULL OR jsonb_array_length(items) = 0 THEN
    RETURN; -- Nothing to do
  END IF;

  -- Iterate through items array
  FOR item IN SELECT * FROM jsonb_array_elements(items)
  LOOP
    v_id := (item->>'variant_id')::uuid;
    qty := (item->>'quantity')::integer;

    IF qty IS NULL OR qty <= 0 THEN
      RAISE EXCEPTION 'Quantity must be greater than 0 for variant %', v_id;
    END IF;

    -- Upsert inventory level
    INSERT INTO public.inventory_levels (variant_id, store_id, quantity)
    VALUES (v_id, target_store_id, qty)
    ON CONFLICT (variant_id, store_id)
    DO UPDATE SET 
      quantity = public.inventory_levels.quantity + EXCLUDED.quantity,
      updated_at = timezone('utc'::text, now());
  END LOOP;
END;
$$;
