-- Extend public.stores with structured branch management fields
alter table public.stores
  add column if not exists is_primary boolean default false not null,
  add column if not exists phone text,
  add column if not exists whatsapp_phone text,
  add column if not exists street_address text,
  add column if not exists city text,
  add column if not exists region text,
  add column if not exists landmark text,
  add column if not exists digital_address text,
  add column if not exists operating_hours jsonb default '[]'::jsonb,
  add column if not exists pickup_enabled boolean default true not null,
  add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now()) not null;

-- Ensure every tenant with stores has a primary store designated
update public.stores
set is_primary = true
where id in (
  select distinct on (tenant_id) id
  from public.stores
  order by tenant_id, created_at asc
)
and not exists (
  select 1 from public.stores s2 where s2.tenant_id = public.stores.tenant_id and s2.is_primary = true
);

-- Inter-branch atomic inventory transfer RPC
create or replace function public.transfer_inventory_between_branches(
  p_source_store_id uuid,
  p_target_store_id uuid,
  p_variant_id uuid,
  p_quantity integer
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_source_qty integer;
  v_tenant_id uuid;
begin
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
end;
$$;
