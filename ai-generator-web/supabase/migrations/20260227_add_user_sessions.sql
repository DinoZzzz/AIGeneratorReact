-- User session tracking for multi-device management

create table if not exists public.user_sessions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    device_id text not null,
    device_name text not null default 'Unknown Device',
    browser text,
    os text,
    last_active_at timestamptz not null default now(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (user_id, device_id)
);

create index if not exists idx_user_sessions_user_active
    on public.user_sessions(user_id, last_active_at desc);

-- Reuse the set_row_updated_at() trigger function from push_notifications migration
drop trigger if exists trg_user_sessions_updated_at on public.user_sessions;
create trigger trg_user_sessions_updated_at
before update on public.user_sessions
for each row execute function public.set_row_updated_at();

-- RLS
alter table public.user_sessions enable row level security;

drop policy if exists "user_sessions_select_own" on public.user_sessions;
create policy "user_sessions_select_own"
on public.user_sessions
for select
using (auth.uid() = user_id);

drop policy if exists "user_sessions_insert_own" on public.user_sessions;
create policy "user_sessions_insert_own"
on public.user_sessions
for insert
with check (auth.uid() = user_id);

drop policy if exists "user_sessions_update_own" on public.user_sessions;
create policy "user_sessions_update_own"
on public.user_sessions
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "user_sessions_delete_own" on public.user_sessions;
create policy "user_sessions_delete_own"
on public.user_sessions
for delete
using (auth.uid() = user_id);

grant select, insert, update, delete on table public.user_sessions to authenticated;
grant select, insert, update, delete on table public.user_sessions to service_role;
