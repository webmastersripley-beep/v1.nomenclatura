-- Live process audit for upload, automatic grouping, manual review and final nomenclature.

alter table public.processes
  add column if not exists status text not null default 'uploaded',
  add column if not exists current_stage text not null default 'upload',
  add column if not exists rules_version text,
  add column if not exists source_summary jsonb not null default '{}'::jsonb,
  add column if not exists classified_at timestamptz,
  add column if not exists review_synced_at timestamptz,
  add column if not exists edit_synced_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

drop trigger if exists set_processes_updated_at on public.processes;
create trigger set_processes_updated_at
before update on public.processes
for each row
execute function public.set_updated_at();

alter table public.process_items
  add column if not exists width integer,
  add column if not exists height integer,
  add column if not exists dimension text not null default '',
  add column if not exists ratio numeric(12, 6),
  add column if not exists name_family text,
  add column if not exists size_family text,
  add column if not exists final_family text,
  add column if not exists family_confidence text not null default '',
  add column if not exists family_status text not null default '',
  add column if not exists family_reasons text[] not null default '{}',
  add column if not exists name_version text,
  add column if not exists size_version text,
  add column if not exists detected_version text,
  add column if not exists initial_piece text not null default '',
  add column if not exists final_piece text not null default '',
  add column if not exists initial_family_id text,
  add column if not exists initial_family_key text not null default '',
  add column if not exists final_family_id text,
  add column if not exists final_family_key text not null default '',
  add column if not exists folder_group text not null default '',
  add column if not exists zip_path text not null default '',
  add column if not exists zip_folder text not null default '',
  add column if not exists manual_status text not null default '',
  add column if not exists pending_reason text not null default '',
  add column if not exists audit_payload jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists process_items_process_original_name_uidx
  on public.process_items (process_id, original_name);

drop trigger if exists set_process_items_updated_at on public.process_items;
create trigger set_process_items_updated_at
before update on public.process_items
for each row
execute function public.set_updated_at();

create table if not exists public.process_families (
  id uuid primary key default gen_random_uuid(),
  process_id uuid not null references public.processes(id) on delete cascade,
  family_id text not null,
  family_key text not null default '',
  base_piece text not null default '',
  initial_piece text not null default '',
  final_piece text not null default '',
  final_family text not null default '',
  group_number integer,
  folder_group text not null default '',
  is_manual_created boolean not null default false,
  files_count integer not null default 0,
  formats text[] not null default '{}',
  status text not null default 'active',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint process_families_process_family_uidx unique (process_id, family_id)
);

create index if not exists process_families_process_id_idx
  on public.process_families (process_id);

drop trigger if exists set_process_families_updated_at on public.process_families;
create trigger set_process_families_updated_at
before update on public.process_families
for each row
execute function public.set_updated_at();

create table if not exists public.process_item_events (
  id uuid primary key default gen_random_uuid(),
  process_id uuid not null references public.processes(id) on delete cascade,
  event_type text not null,
  original_name text,
  source_family_id text,
  target_family_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists process_item_events_process_id_idx
  on public.process_item_events (process_id, created_at);

alter table public.process_families enable row level security;
alter table public.process_item_events enable row level security;

drop policy if exists "process items are updatable" on public.process_items;
create policy "process items are updatable"
on public.process_items
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "process families are readable" on public.process_families;
create policy "process families are readable"
on public.process_families
for select
to anon, authenticated
using (true);

drop policy if exists "process families are insertable" on public.process_families;
create policy "process families are insertable"
on public.process_families
for insert
to anon, authenticated
with check (true);

drop policy if exists "process families are updatable" on public.process_families;
create policy "process families are updatable"
on public.process_families
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "process item events are readable" on public.process_item_events;
create policy "process item events are readable"
on public.process_item_events
for select
to anon, authenticated
using (true);

drop policy if exists "process item events are insertable" on public.process_item_events;
create policy "process item events are insertable"
on public.process_item_events
for insert
to anon, authenticated
with check (true);

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.processes to anon, authenticated;
grant select, insert, update on public.process_items to anon, authenticated;
grant select, insert, update on public.process_families to anon, authenticated;
grant select, insert on public.process_item_events to anon, authenticated;
