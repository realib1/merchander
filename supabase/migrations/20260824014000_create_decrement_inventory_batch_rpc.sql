-- Create a batch inventory decrement RPC to avoid N+1 and partial failures
create or replace function public.decrement_inventory_batch(
  p_items jsonb, -- array of { variant_id, store_id, quantity }
  p_tenant_id uuid
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
  v_variant_id uuid;
  v_store_id uuid;
  v_quantity integer;
  v_current_qty integer;
begin
  -- Loop through items and lock rows
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_variant_id := (v_item->>'variant_id')::uuid;
    v_store_id := (v_item->>'store_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;
    
    -- Verify the store belongs to the tenant
    if not exists (select 1 from public.stores where id = v_store_id and tenant_id = p_tenant_id) then
      raise exception 'Store % does not belong to tenant %', v_store_id, p_tenant_id;
    end if;

    -- Lock the row for update
    select quantity into v_current_qty
    from public.inventory_levels
    where variant_id = v_variant_id and store_id = v_store_id
    for update;

    if not found then
      -- If the inventory record doesn't exist, we can't decrement. 
      raise exception 'Inventory record not found for variant % at store %', v_variant_id, v_store_id;
    end if;

    if v_current_qty < v_quantity then
      raise exception 'Insufficient inventory for variant % at store % (requested: %, available: %)', v_variant_id, v_store_id, v_quantity, v_current_qty;
    end if;

    update public.inventory_levels
    set quantity = quantity - v_quantity,
        updated_at = now()
    where variant_id = v_variant_id and store_id = v_store_id;
  end loop;

  return true;
end;
$$;
