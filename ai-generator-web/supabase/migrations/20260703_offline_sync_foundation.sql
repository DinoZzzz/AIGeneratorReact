-- Offline sync foundation
--
-- The web client replicates these tables into IndexedDB with incremental
-- pulls keyed on updated_at, and propagates deletions via sync_tombstones.
-- Everything here is additive and idempotent:
--   1. updated_at exists, is backfilled, and is server-maintained by a
--      BEFORE UPDATE trigger on every synced table.
--   2. AFTER DELETE triggers record tombstones so offline clients can
--      remove locally cached rows.
--   3. Composite (updated_at, id) indexes support keyset-paginated pulls.

-- --------------------------------------------------------------------------
-- 1) updated_at columns (materials / certifiers / report_files lack them)
-- --------------------------------------------------------------------------

alter table public.materials    add column if not exists updated_at timestamptz default now();
alter table public.certifiers   add column if not exists updated_at timestamptz default now();
alter table public.report_files add column if not exists updated_at timestamptz default now();

-- Delta pulls key on updated_at: never leave it null.
update public.materials       set updated_at = coalesce(updated_at, created_at, now()) where updated_at is null;
update public.certifiers      set updated_at = coalesce(updated_at, created_at, now()) where updated_at is null;
update public.report_files    set updated_at = coalesce(updated_at, created_at, now()) where updated_at is null;
update public.customers       set updated_at = coalesce(updated_at, created_at, now()) where updated_at is null;
update public.constructions   set updated_at = coalesce(updated_at, created_at, now()) where updated_at is null;
update public.report_forms    set updated_at = coalesce(updated_at, created_at, now()) where updated_at is null;
update public.calendar_events set updated_at = coalesce(updated_at, created_at, now()) where updated_at is null;
update public.messages        set updated_at = coalesce(updated_at, created_at, now()) where updated_at is null;
update public.profiles        set updated_at = coalesce(updated_at, created_at, now()) where updated_at is null;
update public.scheme_images   set updated_at = coalesce(updated_at, now())             where updated_at is null;

-- --------------------------------------------------------------------------
-- 2) Server-maintained updated_at
-- --------------------------------------------------------------------------

create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.customers;
create trigger set_updated_at before update on public.customers
  for each row execute function public.tg_set_updated_at();

drop trigger if exists set_updated_at on public.constructions;
create trigger set_updated_at before update on public.constructions
  for each row execute function public.tg_set_updated_at();

drop trigger if exists set_updated_at on public.report_forms;
create trigger set_updated_at before update on public.report_forms
  for each row execute function public.tg_set_updated_at();

drop trigger if exists set_updated_at on public.calendar_events;
create trigger set_updated_at before update on public.calendar_events
  for each row execute function public.tg_set_updated_at();

drop trigger if exists set_updated_at on public.messages;
create trigger set_updated_at before update on public.messages
  for each row execute function public.tg_set_updated_at();

drop trigger if exists set_updated_at on public.profiles;
create trigger set_updated_at before update on public.profiles
  for each row execute function public.tg_set_updated_at();

drop trigger if exists set_updated_at on public.materials;
create trigger set_updated_at before update on public.materials
  for each row execute function public.tg_set_updated_at();

drop trigger if exists set_updated_at on public.scheme_images;
create trigger set_updated_at before update on public.scheme_images
  for each row execute function public.tg_set_updated_at();

drop trigger if exists set_updated_at on public.certifiers;
create trigger set_updated_at before update on public.certifiers
  for each row execute function public.tg_set_updated_at();

drop trigger if exists set_updated_at on public.report_files;
create trigger set_updated_at before update on public.report_files
  for each row execute function public.tg_set_updated_at();

-- --------------------------------------------------------------------------
-- 3) Deletion tombstones
-- --------------------------------------------------------------------------

create table if not exists public.sync_tombstones (
  id         bigint generated always as identity primary key,
  table_name text not null,
  row_id     text not null,
  deleted_at timestamptz not null default now()
);

create index if not exists sync_tombstones_deleted_at_idx
  on public.sync_tombstones (deleted_at);

alter table public.sync_tombstones enable row level security;

drop policy if exists "Authenticated users can read tombstones" on public.sync_tombstones;
create policy "Authenticated users can read tombstones"
  on public.sync_tombstones for select
  to authenticated
  using (true);

-- SECURITY DEFINER so the insert bypasses RLS regardless of who deletes.
create or replace function public.tg_record_tombstone()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.sync_tombstones (table_name, row_id)
  values (tg_table_name, old.id::text);
  return old;
end;
$$;

drop trigger if exists record_tombstone on public.customers;
create trigger record_tombstone after delete on public.customers
  for each row execute function public.tg_record_tombstone();

drop trigger if exists record_tombstone on public.constructions;
create trigger record_tombstone after delete on public.constructions
  for each row execute function public.tg_record_tombstone();

drop trigger if exists record_tombstone on public.report_forms;
create trigger record_tombstone after delete on public.report_forms
  for each row execute function public.tg_record_tombstone();

drop trigger if exists record_tombstone on public.calendar_events;
create trigger record_tombstone after delete on public.calendar_events
  for each row execute function public.tg_record_tombstone();

drop trigger if exists record_tombstone on public.messages;
create trigger record_tombstone after delete on public.messages
  for each row execute function public.tg_record_tombstone();

drop trigger if exists record_tombstone on public.profiles;
create trigger record_tombstone after delete on public.profiles
  for each row execute function public.tg_record_tombstone();

drop trigger if exists record_tombstone on public.materials;
create trigger record_tombstone after delete on public.materials
  for each row execute function public.tg_record_tombstone();

drop trigger if exists record_tombstone on public.scheme_images;
create trigger record_tombstone after delete on public.scheme_images
  for each row execute function public.tg_record_tombstone();

drop trigger if exists record_tombstone on public.certifiers;
create trigger record_tombstone after delete on public.certifiers
  for each row execute function public.tg_record_tombstone();

drop trigger if exists record_tombstone on public.report_files;
create trigger record_tombstone after delete on public.report_files
  for each row execute function public.tg_record_tombstone();

-- Retention: tombstones only matter until every device has pulled them.
-- Run manually or wire to pg_cron if the extension is enabled:
--   select cron.schedule('cleanup-sync-tombstones', '0 4 * * 0',
--                        $$select public.cleanup_sync_tombstones()$$);
create or replace function public.cleanup_sync_tombstones(retention interval default interval '90 days')
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  removed integer;
begin
  delete from public.sync_tombstones where deleted_at < now() - retention;
  get diagnostics removed = row_count;
  return removed;
end;
$$;

revoke execute on function public.cleanup_sync_tombstones(interval) from public, anon, authenticated;

-- --------------------------------------------------------------------------
-- 4) Indexes for keyset-paginated delta pulls
-- --------------------------------------------------------------------------

create index if not exists customers_updated_at_id_idx       on public.customers (updated_at, id);
create index if not exists constructions_updated_at_id_idx   on public.constructions (updated_at, id);
create index if not exists report_forms_updated_at_id_idx    on public.report_forms (updated_at, id);
create index if not exists calendar_events_updated_at_id_idx on public.calendar_events (updated_at, id);
create index if not exists messages_updated_at_id_idx        on public.messages (updated_at, id);
create index if not exists profiles_updated_at_id_idx        on public.profiles (updated_at, id);
create index if not exists materials_updated_at_id_idx       on public.materials (updated_at, id);
create index if not exists scheme_images_updated_at_id_idx   on public.scheme_images (updated_at, id);
create index if not exists certifiers_updated_at_id_idx      on public.certifiers (updated_at, id);
create index if not exists report_files_updated_at_id_idx    on public.report_files (updated_at, id);
