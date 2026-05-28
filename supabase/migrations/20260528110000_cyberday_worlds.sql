-- Cyberday rule profile and mundo audit fields.

alter table public.processes
  add column if not exists rule_profile text not null default 'generic';

alter table public.process_families
  add column if not exists rule_profile text not null default '',
  add column if not exists world_code text not null default '',
  add column if not exists world_name text not null default '';

alter table public.process_items
  add column if not exists rule_profile text not null default '',
  add column if not exists world_code text not null default '',
  add column if not exists world_name text not null default '',
  add column if not exists world_confidence text not null default '',
  add column if not exists world_status text not null default '',
  add column if not exists world_reasons text[] not null default '{}';

create index if not exists processes_rule_profile_idx
  on public.processes (rule_profile);

create index if not exists process_items_world_code_idx
  on public.process_items (process_id, world_code);

grant select, insert, update on public.processes to anon, authenticated;
grant select, insert, update on public.process_items to anon, authenticated;
grant select, insert, update on public.process_families to anon, authenticated;
