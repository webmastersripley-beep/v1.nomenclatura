-- Shared ZIP history for downloaded batches.

alter table public.processes
  add column if not exists batch_name text,
  add column if not exists download_mode text,
  add column if not exists zip_storage_path text,
  add column if not exists zip_size bigint,
  add column if not exists saved_after_download_at timestamptz;

create index if not exists processes_batch_name_idx
  on public.processes (batch_name);

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'process-downloads',
  'process-downloads',
  false,
  104857600,
  array[
    'application/zip',
    'application/x-zip-compressed'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "process downloads are readable" on storage.objects;
create policy "process downloads are readable"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'process-downloads');

drop policy if exists "process downloads can be uploaded" on storage.objects;
create policy "process downloads can be uploaded"
on storage.objects
for insert
to anon, authenticated
with check (
  bucket_id = 'process-downloads'
  and lower(storage.extension(name)) = 'zip'
);

drop policy if exists "process downloads can be updated" on storage.objects;
create policy "process downloads can be updated"
on storage.objects
for update
to anon, authenticated
using (bucket_id = 'process-downloads')
with check (
  bucket_id = 'process-downloads'
  and lower(storage.extension(name)) = 'zip'
);

drop policy if exists "processes are updatable" on public.processes;
create policy "processes are updatable"
on public.processes
for update
to anon, authenticated
using (true)
with check (true);
