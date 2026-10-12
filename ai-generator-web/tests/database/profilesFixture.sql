-- Synthetic schema for the isolated test runner only. No production data.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema auth;
grant usage on schema auth, public to anon, authenticated, service_role;

create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;
create function auth.role() returns text language sql stable as $$
  select nullif(current_setting('request.jwt.claim.role', true), '');
$$;

create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb);
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text, name text, last_name text, username text, title text,
  role text default 'user', accreditations jsonb default '[]'::jsonb,
  created_at timestamptz default now(), updated_at timestamptz default now(),
  gender text check (gender in ('M', 'F')), avatar_url text
);
alter table public.profiles enable row level security;
grant all on public.profiles to anon, authenticated, service_role;
create policy "Enable all for authenticated users" on public.profiles
  for all to authenticated using (auth.role() = 'authenticated');
create policy "Allow anonymous username lookup for login" on public.profiles
  for select to anon using (true);

-- Matches the existing production Auth signup trigger exactly.
create function public.handle_new_user() returns trigger language plpgsql
security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, role) values (new.id, new.email, 'user');
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000001', 'user@example.test'),
  ('00000000-0000-0000-0000-000000000002', 'other@example.test'),
  ('00000000-0000-0000-0000-000000000003', 'admin@example.test');
update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-000000000003';
update public.profiles set username = 'regular' where id = '00000000-0000-0000-0000-000000000001';
-- Legacy profiles can contain NULL; the UI normalizes this to an empty list.
update public.profiles set accreditations = null where id = '00000000-0000-0000-0000-000000000001';
