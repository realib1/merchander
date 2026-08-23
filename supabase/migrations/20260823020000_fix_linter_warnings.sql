-- Fix 1: rls_policy_always_true for waitlist
drop policy if exists "Anyone can join waitlist" on public.waitlist;
create policy "Anyone can join waitlist" on public.waitlist
  for insert with check (auth.role() = 'anon' or auth.role() = 'authenticated');

-- Fix 2: public_bucket_allows_listing for product-images
drop policy if exists "Public Access to product-images" on storage.objects;

-- Fix 3: SECURITY DEFINER functions callable by anon/authenticated

-- 3a: decrement_inventory -> Make it SECURITY INVOKER since RLS allows the user to update inventory
create or replace function public.decrement_inventory(
  p_variant_id uuid,
  p_store_id uuid,
  p_amount integer
) returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_current_qty integer;
begin
  -- Lock the row for update
  select quantity into v_current_qty
  from public.inventory_levels
  where variant_id = p_variant_id and store_id = p_store_id
  for update;

  if not found then
    raise exception 'Inventory record not found';
  end if;

  if v_current_qty < p_amount then
    raise exception 'Insufficient inventory';
  end if;

  update public.inventory_levels
  set quantity = quantity - p_amount,
      updated_at = now()
  where variant_id = p_variant_id and store_id = p_store_id;

  return true;
end;
$$;

-- 3b: is_superadmin -> Make it SECURITY INVOKER since it only reads from jwt
create or replace function public.is_superadmin()
returns boolean
language sql
security invoker
set search_path = public
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'is_superadmin')::boolean, false);
$$;

-- 3c: get_auth_user_tenant_ids -> Move the SECURITY DEFINER logic to a private schema
create schema if not exists private;

-- Grant usage to public so they can execute functions in this schema
grant usage on schema private to public;

create or replace function private.get_auth_user_tenant_ids()
returns setof uuid
language sql
security definer
set search_path = public
as $$
  select tenant_id from public.tenant_users where user_id = auth.uid();
$$;

-- Grant execute to public
grant execute on function private.get_auth_user_tenant_ids() to public;

-- Update the public function to be SECURITY INVOKER and call the private function
create or replace function public.get_auth_user_tenant_ids()
returns setof uuid
language sql
security invoker
set search_path = public
as $$
  select private.get_auth_user_tenant_ids();
$$;
