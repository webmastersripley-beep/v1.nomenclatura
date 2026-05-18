-- Public background-image bucket used by ConfigurationModal.
-- Public read is intentional because the app uses direct background URLs.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'backgrounds',
  'backgrounds',
  true,
  5242880,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "backgrounds are publicly readable" on storage.objects;
create policy "backgrounds are publicly readable"
on storage.objects
for select
to public
using (bucket_id = 'backgrounds');

drop policy if exists "backgrounds can be uploaded" on storage.objects;
create policy "backgrounds can be uploaded"
on storage.objects
for insert
to anon, authenticated
with check (
  bucket_id = 'backgrounds'
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp', 'gif')
);

drop policy if exists "backgrounds can be updated" on storage.objects;
create policy "backgrounds can be updated"
on storage.objects
for update
to anon, authenticated
using (bucket_id = 'backgrounds')
with check (
  bucket_id = 'backgrounds'
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp', 'gif')
);
