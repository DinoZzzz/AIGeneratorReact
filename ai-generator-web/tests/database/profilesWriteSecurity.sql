\set ON_ERROR_STOP on
begin;
set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';

do $$
declare affected integer;
begin
  update public.profiles set name = 'Updated name', avatar_url = 'avatar.png',
    role = 'user', accreditations = '[]'
  where id = auth.uid();
  get diagnostics affected = row_count;
  assert affected = 1, 'Own ordinary profile edit must succeed';

  begin
    update public.profiles set role = 'admin' where id = auth.uid();
    raise exception 'FAIL: self promotion was allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.profiles set accreditations = '[1,2]' where id = auth.uid();
    raise exception 'FAIL: self accreditation was allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.profiles set email = 'someone@example.test' where id = auth.uid();
    raise exception 'FAIL: self email replacement was allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.profiles set id = '00000000-0000-0000-0000-000000000099' where id = auth.uid();
    raise exception 'FAIL: identity replacement was allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.profiles set created_at = '2000-01-01' where id = auth.uid();
    raise exception 'FAIL: profile audit timestamp replacement was allowed';
  exception when insufficient_privilege then null;
  end;

  update public.profiles set name = 'Unauthorized edit'
  where id = '00000000-0000-0000-0000-000000000002';
  get diagnostics affected = row_count;
  assert affected = 0, 'Other users profile must not be editable';

  delete from public.profiles where id = auth.uid();
  get diagnostics affected = row_count;
  assert affected = 0, 'Regular user must not delete a profile';

  begin
    insert into public.profiles (id, role) values (auth.uid(), 'admin')
    on conflict (id) do update set role = excluded.role;
    raise exception 'FAIL: upsert privilege elevation was allowed';
  exception when insufficient_privilege then null;
  end;
end;
$$;

set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000003';
do $$
declare affected integer;
begin
  update public.profiles set role = 'admin', accreditations = '[1]'
  where id = '00000000-0000-0000-0000-000000000002';
  get diagnostics affected = row_count;
  assert affected = 1, 'Administrator must manage another profile';

  delete from public.profiles where id = '00000000-0000-0000-0000-000000000002';
  get diagnostics affected = row_count;
  assert affected = 1, 'Administrator profile delete remains available';

  insert into public.profiles (id, email, role) values
    ('00000000-0000-0000-0000-000000000002', 'other@example.test', 'user')
  on conflict (id) do update set role = excluded.role;
  get diagnostics affected = row_count;
  assert affected = 1, 'Administrator profile creation/upsert must succeed';
  insert into public.profiles (id, email, role, name) values
    ('00000000-0000-0000-0000-000000000002', 'other@example.test', 'admin', 'Admin edited')
  on conflict (id) do update set role = excluded.role, name = excluded.name;
  assert (select name = 'Admin edited' from public.profiles
    where id = '00000000-0000-0000-0000-000000000002'),
    'Administrator upsert must update an existing signup profile';
end;
$$;

set local role anon;
set local request.jwt.claim.role = 'anon';
set local request.jwt.claim.sub = '';
do $$
declare login_email text;
begin
  select email into login_email from public.profiles where username = 'regular';
  assert login_email = 'user@example.test', 'Existing anonymous username login lookup must continue';
  begin
    perform * from public.profiles;
    raise exception 'FAIL: anonymous full profile reads were allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    perform role, accreditations from public.profiles;
    raise exception 'FAIL: anonymous privileged profile fields were readable';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.profiles set role = 'admin';
    raise exception 'FAIL: anonymous profile writes were allowed';
  exception when insufficient_privilege then null;
  end;
end;
$$;

reset role;
-- Auth signup creates a user profile even when untrusted metadata claims admin.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000000004', 'signup@example.test', '{"role":"admin"}');
do $$
begin
  assert (select role = 'user' from public.profiles
    where id = '00000000-0000-0000-0000-000000000004'),
    'Existing signup trigger must create an unprivileged profile';
end;
$$;

set local role service_role;
update public.profiles set name = 'Server maintenance'
where id = '00000000-0000-0000-0000-000000000004';
do $$
begin
  assert (select name = 'Server maintenance' from public.profiles
    where id = '00000000-0000-0000-0000-000000000004'),
    'Trusted server maintenance must still work';
end;
$$;
rollback;
\echo 'Profile permissions: all real PostgreSQL scenarios passed.'
