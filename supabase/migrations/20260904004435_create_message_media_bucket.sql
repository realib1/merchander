-- Set up storage bucket for message-media
insert into storage.buckets (id, name, public)
values ('message-media', 'message-media', false)
on conflict (id) do nothing;

-- Storage policies for message-media
-- Only the service role (via webhooks) can insert, but let's allow authenticated users to view for future UI
create policy "Authenticated Users can view message-media" on storage.objects
  for select using (
    bucket_id = 'message-media' and auth.role() = 'authenticated'
  );

-- Service role bypasses RLS so no insert policy is strictly needed for webhooks,
-- but we might want authenticated users to upload outbound media later.
create policy "Authenticated Users can upload message-media" on storage.objects
  for insert with check (
    bucket_id = 'message-media' and auth.role() = 'authenticated'
  );
