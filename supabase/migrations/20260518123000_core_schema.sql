-- Core schema for the retail nomenclature engine.
-- Compatible with the current app flow:
-- custom app users, user preferences, campaigns, process history and process items.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists app_users_name_lower_uidx
  on public.app_users (lower(name));

drop trigger if exists set_app_users_updated_at on public.app_users;
create trigger set_app_users_updated_at
before update on public.app_users
for each row
execute function public.set_updated_at();

create table if not exists public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  app_user_id uuid not null references public.app_users(id) on delete cascade,
  default_country text not null default 'cl',
  default_campaign text not null default 'hg',
  download_mode text not null default 'por-familia',
  use_active_campaigns boolean not null default true,
  theme_preset text not null default 'midnight',
  background_type text not null default 'gradient',
  background_image_url text not null default '',
  background_opacity numeric(4, 2) not null default 0.15,
  enable_blobs boolean not null default true,
  descriptor_mode text not null default 'category',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_preferences_user_uidx unique (app_user_id),
  constraint user_preferences_download_mode_chk
    check (download_mode in ('directo', 'carpeta-unica', 'por-familia', 'por-formato')),
  constraint user_preferences_theme_chk
    check (theme_preset in ('midnight', 'cyber', 'ocean', 'sunset', 'luxury')),
  constraint user_preferences_background_type_chk
    check (background_type in ('gradient', 'image', 'mixed')),
  constraint user_preferences_opacity_chk
    check (background_opacity >= 0 and background_opacity <= 1),
  constraint user_preferences_descriptor_mode_chk
    check (descriptor_mode in ('category', 'brand-category', 'category-brand', 'brand'))
);

drop trigger if exists set_user_preferences_updated_at on public.user_preferences;
create trigger set_user_preferences_updated_at
before update on public.user_preferences
for each row
execute function public.set_updated_at();

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null,
  country text not null default 'cl',
  start_at timestamptz not null,
  end_at timestamptz not null,
  is_active boolean not null default true,
  created_by_name text,
  created_by_id uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint campaigns_code_chk
    check (code ~ '^[a-z0-9-]+$'),
  constraint campaigns_date_range_chk
    check (end_at > start_at)
);

create index if not exists campaigns_country_start_end_idx
  on public.campaigns (country, start_at, end_at);

create index if not exists campaigns_active_country_idx
  on public.campaigns (country, is_active);

drop trigger if exists set_campaigns_updated_at on public.campaigns;
create trigger set_campaigns_updated_at
before update on public.campaigns
for each row
execute function public.set_updated_at();

create or replace function public.enforce_campaign_overlap_limit()
returns trigger
language plpgsql
as $$
declare
  overlapping_count integer;
begin
  if new.is_active is distinct from true then
    return new;
  end if;

  select count(*)
  into overlapping_count
  from public.campaigns c
  where c.is_active = true
    and c.country = new.country
    and c.id is distinct from new.id
    and c.start_at <= new.end_at
    and c.end_at >= new.start_at;

  if overlapping_count >= 4 then
    raise exception 'Máximo 4 campañas simultáneas permitidas';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_campaign_overlap_limit on public.campaigns;
create trigger enforce_campaign_overlap_limit
before insert or update of country, start_at, end_at, is_active
on public.campaigns
for each row
execute function public.enforce_campaign_overlap_limit();

create table if not exists public.processes (
  id uuid primary key default gen_random_uuid(),
  total_files integer not null default 0,
  total_families integer not null default 0,
  country text not null default '',
  campaign text not null default '',
  app_user_id uuid references public.app_users(id) on delete set null,
  app_user_name text not null default 'anonimo',
  created_at timestamptz not null default now()
);

create index if not exists processes_created_at_idx
  on public.processes (created_at desc);

create index if not exists processes_user_campaign_idx
  on public.processes (app_user_name, campaign);

create table if not exists public.process_items (
  id uuid primary key default gen_random_uuid(),
  process_id uuid not null references public.processes(id) on delete cascade,
  original_name text not null,
  final_name text not null,
  piece text not null default '',
  format text not null default '',
  category text not null default '',
  brand text not null default '',
  tags text[] not null default '{}',
  compressed boolean not null default false,
  original_size bigint,
  compressed_size bigint,
  created_at timestamptz not null default now()
);

create index if not exists process_items_process_id_idx
  on public.process_items (process_id);

-- RLS enabled because these tables are exposed through the API.
alter table public.app_users enable row level security;
alter table public.user_preferences enable row level security;
alter table public.campaigns enable row level security;
alter table public.processes enable row level security;
alter table public.process_items enable row level security;

-- NOTE:
-- The app currently uses custom login by app_users.name, not Supabase Auth.
-- These compatibility policies keep the existing browser app working.
-- Once Supabase Auth is adopted, replace these permissive policies
-- with auth.uid()-based ownership rules.

drop policy if exists "active users are readable" on public.app_users;
create policy "active users are readable"
on public.app_users
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "preferences are readable" on public.user_preferences;
create policy "preferences are readable"
on public.user_preferences
for select
to anon, authenticated
using (true);

drop policy if exists "preferences are insertable" on public.user_preferences;
create policy "preferences are insertable"
on public.user_preferences
for insert
to anon, authenticated
with check (true);

drop policy if exists "preferences are updatable" on public.user_preferences;
create policy "preferences are updatable"
on public.user_preferences
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "campaigns are readable" on public.campaigns;
create policy "campaigns are readable"
on public.campaigns
for select
to anon, authenticated
using (true);

drop policy if exists "campaigns are insertable" on public.campaigns;
create policy "campaigns are insertable"
on public.campaigns
for insert
to anon, authenticated
with check (true);

drop policy if exists "campaigns are updatable" on public.campaigns;
create policy "campaigns are updatable"
on public.campaigns
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "processes are readable" on public.processes;
create policy "processes are readable"
on public.processes
for select
to anon, authenticated
using (true);

drop policy if exists "processes are insertable" on public.processes;
create policy "processes are insertable"
on public.processes
for insert
to anon, authenticated
with check (true);

drop policy if exists "process items are readable" on public.process_items;
create policy "process items are readable"
on public.process_items
for select
to anon, authenticated
using (true);

drop policy if exists "process items are insertable" on public.process_items;
create policy "process items are insertable"
on public.process_items
for insert
to anon, authenticated
with check (true);
