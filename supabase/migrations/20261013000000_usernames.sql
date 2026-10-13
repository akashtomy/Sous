-- Sous: sign up with a username + password.
-- Supabase Auth needs an email, so the app signs up "<username>@<internal domain>" with the
-- username in user metadata. Usernames are unique here; profiles show them to partners.

alter table public.profiles
  add column username text unique
  check (username ~ '^[a-z0-9][a-z0-9._]{2,19}$' and username !~ '[._]{2}');

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  uname text := lower(nullif(new.raw_user_meta_data ->> 'username', ''));
begin
  insert into public.profiles (id, display_name, username)
  values (
    new.id,
    left(coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      uname,
      split_part(coalesce(new.email, ''), '@', 1)
    ), 80),
    uname
  )
  on conflict (id) do nothing;
  return new;
end $$;

-- Lets the sign-up form say "taken" before submitting. Returns only a boolean.
create function public.username_available(p_username text) returns boolean
language sql stable security definer set search_path = public as $$
  select not exists (select 1 from public.profiles where username = lower(trim(p_username)));
$$;

revoke all on function public.username_available(text) from public;
grant execute on function public.username_available(text) to anon, authenticated;
