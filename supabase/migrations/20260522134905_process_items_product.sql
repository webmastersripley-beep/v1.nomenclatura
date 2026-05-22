alter table public.process_items
  add column if not exists product text not null default '';
