-- Prevent authenticated users from granting themselves administrator access.
-- Preserve the anonymous username/email login lookup, not full profile reads.
begin;

alter table public.profiles enable row level security;

revoke all on public.profiles from anon;
grant select (username, email) on public.profiles to anon;
revoke all on public.profiles from authenticated;
grant select, insert, update, delete on public.profiles to authenticated;

drop policy if exists "Enable all for authenticated users" on public.profiles;

create policy "Authenticated users can read profiles"
on public.profiles for select to authenticated
using (true);

create policy "Administrators can insert profiles"
on public.profiles for insert to authenticated
with check (
  exists (
    select 1 from public.profiles as actor
    where actor.id = (select auth.uid()) and actor.role = 'admin'
  )
);

create policy "Users can update own profiles or administrators"
on public.profiles for update to authenticated
using (
  id = (select auth.uid()) or exists (
    select 1 from public.profiles as actor
    where actor.id = (select auth.uid()) and actor.role = 'admin'
  )
)
with check (
  id = (select auth.uid()) or exists (
    select 1 from public.profiles as actor
    where actor.id = (select auth.uid()) and actor.role = 'admin'
  )
);

create policy "Administrators can delete profiles"
on public.profiles for delete to authenticated
using (
  exists (
    select 1 from public.profiles as actor
    where actor.id = (select auth.uid()) and actor.role = 'admin'
  )
);

-- RLS controls which rows may be edited; this trigger controls privileged
-- fields. The Profile screen submits unchanged role/accreditations values,
-- so compare values instead of rejecting every UPDATE mentioning a column.
-- SECURITY INVOKER is intentional: the public SELECT policy permits this
-- lookup without bypassing RLS or introducing an exposed privileged function.
create function public.enforce_profile_write_permissions()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- Auth's existing signup trigger and trusted server/database maintenance
  -- run as privileged database roles, not as the API's client roles.
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  if new.id is distinct from old.id then
    raise exception 'Profile identity cannot be changed'
      using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.profiles as actor
    where actor.id = auth.uid() and actor.role = 'admin'
  ) and (
    new.role is distinct from old.role
    or coalesce(new.accreditations, '[]'::jsonb) is distinct from coalesce(old.accreditations, '[]'::jsonb)
    or new.email is distinct from old.email
    or new.created_at is distinct from old.created_at
  ) then
    raise exception 'Only administrators can change privileged profile fields'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_profile_write_permissions()
  from public, anon, authenticated;

create trigger enforce_profile_write_permissions
before update on public.profiles
for each row execute function public.enforce_profile_write_permissions();

commit;
