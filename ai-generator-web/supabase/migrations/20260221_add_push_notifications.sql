-- Push notifications storage and delivery tracking

create table if not exists public.push_subscriptions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    endpoint text not null unique,
    p256dh text not null,
    auth text not null,
    expiration_time timestamptz null,
    user_agent text null,
    is_active boolean not null default true,
    last_seen_at timestamptz not null default now(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.push_reminder_deliveries (
    id uuid primary key default gen_random_uuid(),
    appointment_id uuid not null references public.calendar_events(id) on delete cascade,
    subscription_id uuid not null references public.push_subscriptions(id) on delete cascade,
    reminder_minutes_before integer not null check (reminder_minutes_before > 0),
    scheduled_for timestamptz not null,
    status text not null check (status in ('sent', 'failed')),
    error text null,
    sent_at timestamptz null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (appointment_id, subscription_id, reminder_minutes_before, scheduled_for)
);

create index if not exists idx_push_subscriptions_user_active
    on public.push_subscriptions(user_id, is_active);

create index if not exists idx_push_subscriptions_last_seen
    on public.push_subscriptions(last_seen_at desc);

create index if not exists idx_push_deliveries_scheduled_for
    on public.push_reminder_deliveries(scheduled_for desc);

create index if not exists idx_push_deliveries_appointment
    on public.push_reminder_deliveries(appointment_id);

create or replace function public.set_row_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists trg_push_subscriptions_updated_at on public.push_subscriptions;
create trigger trg_push_subscriptions_updated_at
before update on public.push_subscriptions
for each row execute function public.set_row_updated_at();

drop trigger if exists trg_push_deliveries_updated_at on public.push_reminder_deliveries;
create trigger trg_push_deliveries_updated_at
before update on public.push_reminder_deliveries
for each row execute function public.set_row_updated_at();

alter table public.push_subscriptions enable row level security;
alter table public.push_reminder_deliveries enable row level security;

drop policy if exists "push_subscriptions_select_own" on public.push_subscriptions;
create policy "push_subscriptions_select_own"
on public.push_subscriptions
for select
using (auth.uid() = user_id);

drop policy if exists "push_subscriptions_insert_own" on public.push_subscriptions;
create policy "push_subscriptions_insert_own"
on public.push_subscriptions
for insert
with check (auth.uid() = user_id);

drop policy if exists "push_subscriptions_update_own" on public.push_subscriptions;
create policy "push_subscriptions_update_own"
on public.push_subscriptions
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "push_subscriptions_delete_own" on public.push_subscriptions;
create policy "push_subscriptions_delete_own"
on public.push_subscriptions
for delete
using (auth.uid() = user_id);

revoke all on table public.push_reminder_deliveries from anon;
revoke all on table public.push_reminder_deliveries from authenticated;
grant select, insert, update, delete on table public.push_reminder_deliveries to service_role;

grant select, insert, update, delete on table public.push_subscriptions to authenticated;
grant select, insert, update, delete on table public.push_subscriptions to service_role;
