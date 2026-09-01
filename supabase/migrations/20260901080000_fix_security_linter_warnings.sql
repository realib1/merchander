-- Drop overly permissive policy on storefront_sessions
DROP POLICY IF EXISTS "Public session access" ON public.storefront_sessions;

-- Allow merchants to manage sessions for their tenant
CREATE POLICY "Merchants manage storefront sessions"
    ON public.storefront_sessions FOR ALL
    USING (tenant_id IN (SELECT public.get_auth_user_tenant_ids()));

-- Revoke anon access from storefront_sessions
REVOKE ALL ON public.storefront_sessions FROM anon;

-- Redefine transfer_inventory_between_branches as SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.transfer_inventory_between_branches(
    p_source_store_id uuid,
    p_target_store_id uuid,
    p_variant_id uuid,
    p_quantity integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
    v_source_qty integer;
    v_tenant_id uuid;
BEGIN
    if p_quantity <= 0 then
      return jsonb_build_object('success', false, 'error', 'Transfer quantity must be greater than zero');
    end if;
  
    if p_source_store_id = p_target_store_id then
      return jsonb_build_object('success', false, 'error', 'Source and destination branch cannot be the same');
    end if;
  
    -- Verify source and target belong to same tenant
    select tenant_id into v_tenant_id from public.stores where id = p_source_store_id;
    if not exists (select 1 from public.stores where id = p_target_store_id and tenant_id = v_tenant_id) then
      return jsonb_build_object('success', false, 'error', 'Branches belong to different tenants');
    end if;
  
    -- Check source inventory
    select quantity into v_source_qty
    from public.inventory_levels
    where store_id = p_source_store_id and variant_id = p_variant_id;
  
    if v_source_qty is null or v_source_qty < p_quantity then
      return jsonb_build_object('success', false, 'error', 'Insufficient stock at source branch. Available: ' || coalesce(v_source_qty, 0));
    end if;
  
    -- Decrement source
    update public.inventory_levels
    set quantity = quantity - p_quantity, updated_at = now()
    where store_id = p_source_store_id and variant_id = p_variant_id;
  
    -- Increment or insert target
    insert into public.inventory_levels (variant_id, store_id, quantity, updated_at)
    values (p_variant_id, p_target_store_id, p_quantity, now())
    on conflict (variant_id, store_id)
    do update set quantity = public.inventory_levels.quantity + excluded.quantity, updated_at = now();
  
    return jsonb_build_object('success', true);
END;
$$;

-- Revoke EXECUTE from anon
REVOKE EXECUTE ON FUNCTION public.transfer_inventory_between_branches(uuid, uuid, uuid, integer) FROM anon;

