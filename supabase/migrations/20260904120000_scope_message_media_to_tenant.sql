-- Migration: scope the message-media storage policies to the caller's tenant (finding F-02).
-- The original policies (20260904004435) gated only on auth.role() = 'authenticated',
-- so any signed-in merchant could read or overwrite another tenant's customer media.
-- Objects are keyed <tenant_id>/whatsapp/<message_id>.<ext>, so match the first
-- path segment against the caller's tenants. Service-role webhook writes bypass
-- RLS and are unaffected.

drop policy if exists "Authenticated Users can view message-media" on storage.objects;
drop policy if exists "Authenticated Users can upload message-media" on storage.objects;

create policy "Tenant users can view their message-media" on storage.objects
  for select to authenticated using (
    bucket_id = 'message-media'
    and (storage.foldername(name))[1] in (
      select tenant_users.tenant_id::text
      from public.tenant_users
      where tenant_users.user_id = auth.uid()
    )
  );

create policy "Tenant users can upload their message-media" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'message-media'
    and (storage.foldername(name))[1] in (
      select tenant_users.tenant_id::text
      from public.tenant_users
      where tenant_users.user_id = auth.uid()
    )
  );
