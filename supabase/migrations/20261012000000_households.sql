-- Kitchen Manager: accounts, households (partners share one kitchen) and shared kitchen data.
--
-- Security model
--   * Every shared row carries household_id. Members can SELECT their household's rows (RLS).
--   * Clients never write tables directly: there are no INSERT/UPDATE/DELETE policies.
--     All writes go through SECURITY DEFINER functions that check membership first.
--   * Inventory changes are deltas ("-120 g onion"), applied atomically, so two partners
--     editing at once never lose each other's changes. Each op has a UUID; replays are ignored.

-- ---------------------------------------------------------------- profiles
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 80),
  created_at timestamptz not null default now()
);

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      split_part(coalesce(new.email, ''), '@', 1)
    ), 80)
  )
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------- households
create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.household_members (
  household_id uuid not null references public.households (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id),
  -- One kitchen per person keeps "my data" unambiguous.
  unique (user_id)
);

create table public.household_invites (
  code text primary key,
  household_id uuid not null references public.households (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_by uuid references auth.users (id) on delete set null,
  used_at timestamptz
);

-- ---------------------------------------------------------------- shared kitchen data
create table public.inventory_items (
  household_id uuid not null references public.households (id) on delete cascade,
  ingredient_id text not null,
  qty numeric not null check (qty >= 0),
  par numeric check (par >= 0),
  added_on date,
  updated_at timestamptz not null default now(),
  updated_by uuid,
  primary key (household_id, ingredient_id)
);

create table public.meal_history (
  household_id uuid not null references public.households (id) on delete cascade,
  id text not null,
  recipe_id text not null,
  servings numeric not null,
  date date not null,
  course text,
  slot jsonb,
  applied jsonb not null default '[]',
  cooked_by uuid,
  created_at timestamptz not null default now(),
  primary key (household_id, id)
);

create table public.outside_meals (
  household_id uuid not null references public.households (id) on delete cascade,
  id text not null,
  data jsonb not null,
  date date not null,
  logged_by uuid,
  created_at timestamptz not null default now(),
  primary key (household_id, id)
);

create table public.recipe_feedback (
  household_id uuid not null references public.households (id) on delete cascade,
  recipe_id text not null,
  rating text check (rating in ('love', 'ok', 'dislike')),
  hidden boolean not null default false,
  swapped_away integer not null default 0,
  video_url text check (video_url is null or video_url ~ '^https://(www\.youtube\.com|youtu\.be)/'),
  updated_at timestamptz not null default now(),
  primary key (household_id, recipe_id)
);

create table public.shopping_extras (
  household_id uuid not null references public.households (id) on delete cascade,
  ingredient_id text not null,
  qty numeric not null check (qty >= 0),
  primary key (household_id, ingredient_id)
);

create table public.ai_recipes (
  household_id uuid not null references public.households (id) on delete cascade,
  id text not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  primary key (household_id, id)
);

-- Small whole documents where last-write-wins is fine: preferences, the week plan,
-- weekend-prep checkboxes and household settings.
create table public.household_docs (
  household_id uuid not null references public.households (id) on delete cascade,
  key text not null check (key in ('prefs', 'plan', 'prep_done', 'settings')),
  data jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid,
  primary key (household_id, key)
);

-- Idempotency: an op id is applied at most once, so offline retries are safe.
create table public.applied_ops (
  op_id uuid primary key,
  household_id uuid not null references public.households (id) on delete cascade,
  applied_at timestamptz not null default now()
);

create index on public.meal_history (household_id, created_at desc);
create index on public.outside_meals (household_id, date desc);
create index on public.applied_ops (household_id, applied_at);

-- ---------------------------------------------------------------- membership helpers
create function public.is_member(hid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.household_members where household_id = hid and user_id = auth.uid()
  );
$$;

create function public.my_household_id() returns uuid
language sql stable security definer set search_path = public as $$
  select household_id from public.household_members where user_id = auth.uid();
$$;

-- ---------------------------------------------------------------- row level security
alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.household_invites enable row level security;
alter table public.inventory_items enable row level security;
alter table public.meal_history enable row level security;
alter table public.outside_meals enable row level security;
alter table public.recipe_feedback enable row level security;
alter table public.shopping_extras enable row level security;
alter table public.ai_recipes enable row level security;
alter table public.household_docs enable row level security;
alter table public.applied_ops enable row level security;

create policy "own or co-member profile" on public.profiles for select to authenticated
  using (id = auth.uid() or exists (
    select 1 from public.household_members me
    join public.household_members other on other.household_id = me.household_id
    where me.user_id = auth.uid() and other.user_id = profiles.id
  ));
create policy "update own profile" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "members read household" on public.households for select to authenticated
  using (public.is_member(id));
create policy "members read members" on public.household_members for select to authenticated
  using (public.is_member(household_id));
create policy "members read invites" on public.household_invites for select to authenticated
  using (public.is_member(household_id));

create policy "members read" on public.inventory_items for select to authenticated using (public.is_member(household_id));
create policy "members read" on public.meal_history for select to authenticated using (public.is_member(household_id));
create policy "members read" on public.outside_meals for select to authenticated using (public.is_member(household_id));
create policy "members read" on public.recipe_feedback for select to authenticated using (public.is_member(household_id));
create policy "members read" on public.shopping_extras for select to authenticated using (public.is_member(household_id));
create policy "members read" on public.ai_recipes for select to authenticated using (public.is_member(household_id));
create policy "members read" on public.household_docs for select to authenticated using (public.is_member(household_id));
create policy "members read" on public.applied_ops for select to authenticated using (public.is_member(household_id));

-- ---------------------------------------------------------------- household functions
create function public.create_household(p_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  hid uuid;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  if exists (select 1 from household_members where user_id = uid) then
    raise exception 'already_in_household';
  end if;
  insert into households (name, created_by) values (left(coalesce(nullif(trim(p_name), ''), 'Our kitchen'), 80), uid)
    returning id into hid;
  insert into household_members (household_id, user_id, role) values (hid, uid, 'owner');
  return hid;
end $$;

create function public.rename_household(p_name text) returns void
language plpgsql security definer set search_path = public as $$
declare hid uuid := public.my_household_id();
begin
  if hid is null then raise exception 'not_in_household'; end if;
  update households set name = left(coalesce(nullif(trim(p_name), ''), name), 80) where id = hid;
end $$;

-- 6 characters from an alphabet without look-alikes (no 0/O, 1/I/L), from crypto-random bytes.
create function public.create_invite() returns text
language plpgsql security definer set search_path = public as $$
declare
  hid uuid := public.my_household_id();
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  bytes bytea;
  c text;
begin
  if hid is null then raise exception 'not_in_household'; end if;
  -- Only the newest code stays valid.
  delete from household_invites where household_id = hid and used_at is null;
  loop
    bytes := decode(replace(gen_random_uuid()::text, '-', ''), 'hex');
    c := '';
    for i in 0..5 loop
      c := c || substr(alphabet, (get_byte(bytes, i) % length(alphabet)) + 1, 1);
    end loop;
    exit when not exists (select 1 from household_invites where code = c);
  end loop;
  insert into household_invites (code, household_id, created_by, expires_at)
    values (c, hid, auth.uid(), now() + interval '48 hours');
  return c;
end $$;

-- Leaves the current household: hands ownership on, or deletes the household (and its data)
-- when the caller was the last member.
create function public.leave_household() returns void
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  hid uuid := public.my_household_id();
  was_owner boolean;
  next_owner uuid;
begin
  if hid is null then return; end if;
  select role = 'owner' into was_owner from household_members where household_id = hid and user_id = uid;
  delete from household_members where household_id = hid and user_id = uid;
  if not exists (select 1 from household_members where household_id = hid) then
    delete from households where id = hid;
  elsif was_owner then
    select user_id into next_owner from household_members where household_id = hid order by joined_at limit 1;
    update household_members set role = 'owner' where household_id = hid and user_id = next_owner;
  end if;
end $$;

create function public.join_household(p_code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  inv household_invites%rowtype;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  select * into inv from household_invites where code = upper(trim(p_code)) for update;
  if not found or inv.used_at is not null or inv.expires_at < now() then
    raise exception 'invalid_or_expired_code';
  end if;
  if exists (select 1 from household_members where household_id = inv.household_id and user_id = uid) then
    return inv.household_id;
  end if;
  if (select count(*) from household_members where household_id = inv.household_id) >= 6 then
    raise exception 'household_full';
  end if;
  perform public.leave_household();
  insert into household_members (household_id, user_id, role) values (inv.household_id, uid, 'member');
  update household_invites set used_by = uid, used_at = now() where code = inv.code;
  return inv.household_id;
end $$;

create function public.remove_member(p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
declare hid uuid := public.my_household_id();
begin
  if hid is null then raise exception 'not_in_household'; end if;
  if not exists (select 1 from household_members where household_id = hid and user_id = auth.uid() and role = 'owner') then
    raise exception 'owner_only';
  end if;
  if p_user = auth.uid() then raise exception 'use_leave_household'; end if;
  delete from household_members where household_id = hid and user_id = p_user;
end $$;

-- ---------------------------------------------------------------- data writes
-- p_ops: [{ "id": uuid, "type": "...", ...payload }]. Returns how many were newly applied.
create function public.apply_ops(p_household uuid, p_ops jsonb) returns integer
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  op jsonb;
  n integer := 0;
  inserted integer;
  t text;
  item jsonb;
  d numeric;
begin
  if uid is null or not public.is_member(p_household) then raise exception 'not_a_member'; end if;
  if jsonb_typeof(p_ops) <> 'array' or jsonb_array_length(p_ops) > 500 then raise exception 'bad_ops'; end if;

  for op in select * from jsonb_array_elements(p_ops) loop
    insert into applied_ops (op_id, household_id) values ((op ->> 'id')::uuid, p_household)
      on conflict (op_id) do nothing;
    get diagnostics inserted = row_count;
    continue when inserted = 0;
    n := n + 1;
    t := op ->> 'type';

    if t = 'inv.delta' then
      d := (op ->> 'delta')::numeric;
      if d < 0 then
        update inventory_items set qty = greatest(qty + d, 0), updated_at = now(), updated_by = uid
          where household_id = p_household and ingredient_id = op ->> 'ingredientId';
      elsif d > 0 then
        insert into inventory_items (household_id, ingredient_id, qty, added_on, updated_by)
          values (p_household, op ->> 'ingredientId', d, (op ->> 'addedOn')::date, uid)
          on conflict (household_id, ingredient_id) do update
            set qty = inventory_items.qty + d,
                added_on = coalesce((op ->> 'addedOn')::date, inventory_items.added_on),
                updated_at = now(), updated_by = uid;
      end if;
    elsif t = 'inv.set' then
      insert into inventory_items (household_id, ingredient_id, qty, added_on, updated_by)
        values (p_household, op ->> 'ingredientId', greatest((op ->> 'qty')::numeric, 0), (op ->> 'addedOn')::date, uid)
        on conflict (household_id, ingredient_id) do update
          set qty = excluded.qty, added_on = coalesce(excluded.added_on, inventory_items.added_on),
              updated_at = now(), updated_by = uid;
    elsif t = 'inv.remove' then
      delete from inventory_items where household_id = p_household and ingredient_id = op ->> 'ingredientId';
    elsif t = 'inv.par' then
      update inventory_items set par = (op ->> 'par')::numeric, updated_at = now(), updated_by = uid
        where household_id = p_household and ingredient_id = op ->> 'ingredientId';
    elsif t = 'inv.replace_all' then
      delete from inventory_items where household_id = p_household;
      for item in select * from jsonb_array_elements(op -> 'items') loop
        insert into inventory_items (household_id, ingredient_id, qty, par, added_on, updated_by)
          values (p_household, item ->> 'ingredientId', greatest((item ->> 'qty')::numeric, 0),
                  (item ->> 'par')::numeric, (item ->> 'addedOn')::date, uid);
      end loop;

    elsif t = 'history.add' then
      insert into meal_history (household_id, id, recipe_id, servings, date, course, slot, applied, cooked_by)
        values (p_household, op -> 'entry' ->> 'id', op -> 'entry' ->> 'recipeId',
                (op -> 'entry' ->> 'servings')::numeric, (op -> 'entry' ->> 'date')::date,
                op -> 'entry' ->> 'course', op -> 'entry' -> 'slot',
                coalesce(op -> 'entry' -> 'applied', '[]'::jsonb), uid)
        on conflict do nothing;
    elsif t = 'history.remove' then
      delete from meal_history where household_id = p_household and id = op ->> 'entryId';

    elsif t = 'outside.add' then
      insert into outside_meals (household_id, id, data, date, logged_by)
        values (p_household, op -> 'meal' ->> 'id', op -> 'meal', (op -> 'meal' ->> 'date')::date, uid)
        on conflict do nothing;
    elsif t = 'outside.remove' then
      delete from outside_meals where household_id = p_household and id = op ->> 'mealId';

    elsif t = 'feedback.rating' then
      insert into recipe_feedback (household_id, recipe_id, rating) values (p_household, op ->> 'recipeId', op ->> 'rating')
        on conflict (household_id, recipe_id) do update set rating = excluded.rating, updated_at = now();
    elsif t = 'feedback.hidden' then
      insert into recipe_feedback (household_id, recipe_id, hidden) values (p_household, op ->> 'recipeId', (op ->> 'hidden')::boolean)
        on conflict (household_id, recipe_id) do update set hidden = excluded.hidden, updated_at = now();
    elsif t = 'feedback.swapped' then
      insert into recipe_feedback (household_id, recipe_id, swapped_away) values (p_household, op ->> 'recipeId', 1)
        on conflict (household_id, recipe_id) do update
          set swapped_away = recipe_feedback.swapped_away + 1, updated_at = now();
    elsif t = 'feedback.video' then
      insert into recipe_feedback (household_id, recipe_id, video_url) values (p_household, op ->> 'recipeId', op ->> 'url')
        on conflict (household_id, recipe_id) do update set video_url = excluded.video_url, updated_at = now();

    elsif t = 'shopping.add' then
      for item in select * from jsonb_array_elements(op -> 'items') loop
        insert into shopping_extras (household_id, ingredient_id, qty)
          values (p_household, item ->> 'ingredientId', greatest((item ->> 'qty')::numeric, 0))
          on conflict (household_id, ingredient_id) do update
            set qty = greatest(shopping_extras.qty, excluded.qty);
      end loop;
    elsif t = 'shopping.remove' then
      delete from shopping_extras where household_id = p_household
        and ingredient_id in (select jsonb_array_elements_text(op -> 'ingredientIds'));
    elsif t = 'shopping.clear' then
      delete from shopping_extras where household_id = p_household;

    elsif t = 'ai.add' then
      for item in select * from jsonb_array_elements(op -> 'recipes') loop
        insert into ai_recipes (household_id, id, data) values (p_household, item ->> 'id', item)
          on conflict do nothing;
      end loop;
    elsif t = 'ai.remove' then
      delete from ai_recipes where household_id = p_household and id = op ->> 'recipeId';

    elsif t = 'doc.set' then
      if op -> 'data' is null or op -> 'data' = 'null'::jsonb then
        delete from household_docs where household_id = p_household and key = op ->> 'key';
      else
        insert into household_docs (household_id, key, data, updated_by)
          values (p_household, op ->> 'key', op -> 'data', uid)
          on conflict (household_id, key) do update
            set data = excluded.data, updated_at = now(), updated_by = uid;
      end if;

    elsif t = 'reset' then
      delete from inventory_items where household_id = p_household;
      delete from meal_history where household_id = p_household;
      delete from outside_meals where household_id = p_household;
      delete from recipe_feedback where household_id = p_household;
      delete from shopping_extras where household_id = p_household;
      delete from ai_recipes where household_id = p_household;
      delete from household_docs where household_id = p_household;
    else
      raise exception 'unknown_op: %', t;
    end if;
  end loop;
  return n;
end $$;

-- Everything a device needs in one consistent read: one SQL statement = one snapshot, so the
-- data and "which of my pending ops are already applied" always agree.
create function public.household_snapshot(p_household uuid, p_pending uuid[] default '{}')
returns jsonb
language sql stable security definer set search_path = public as $$
  select case when not public.is_member(p_household) then null else jsonb_build_object(
    'inventory', coalesce((select jsonb_agg(jsonb_build_object(
        'ingredient_id', ingredient_id, 'qty', qty, 'par', par, 'added_on', added_on))
      from inventory_items where household_id = p_household), '[]'::jsonb),
    'history', coalesce((select jsonb_agg(h order by h.created_at desc) from (
        select id, recipe_id, servings, date, course, slot, applied, created_at
        from meal_history where household_id = p_household
        order by created_at desc limit 500) h), '[]'::jsonb),
    'outside', coalesce((select jsonb_agg(jsonb_build_object('data', o.data) order by o.date desc, o.created_at desc) from (
        select data, date, created_at from outside_meals where household_id = p_household
        order by date desc, created_at desc limit 500) o), '[]'::jsonb),
    'feedback', coalesce((select jsonb_agg(jsonb_build_object(
        'recipe_id', recipe_id, 'rating', rating, 'hidden', hidden,
        'swapped_away', swapped_away, 'video_url', video_url))
      from recipe_feedback where household_id = p_household), '[]'::jsonb),
    'shopping', coalesce((select jsonb_agg(jsonb_build_object('ingredient_id', ingredient_id, 'qty', qty))
      from shopping_extras where household_id = p_household), '[]'::jsonb),
    'ai', coalesce((select jsonb_agg(jsonb_build_object('data', a.data) order by a.created_at desc) from (
        select data, created_at from ai_recipes where household_id = p_household
        order by created_at desc limit 60) a), '[]'::jsonb),
    'docs', coalesce((select jsonb_agg(jsonb_build_object('key', key, 'data', data))
      from household_docs where household_id = p_household), '[]'::jsonb),
    'applied', coalesce((select jsonb_agg(op_id) from applied_ops
      where household_id = p_household and op_id = any (p_pending)), '[]'::jsonb)
  ) end;
$$;

-- Tidy up: keep idempotency records for 30 days.
create function public.prune_applied_ops() returns void
language sql security definer set search_path = public as $$
  delete from public.applied_ops where applied_at < now() - interval '30 days';
$$;

-- ---------------------------------------------------------------- grants
revoke all on function public.apply_ops(uuid, jsonb) from public, anon;
revoke all on function public.create_household(text) from public, anon;
revoke all on function public.rename_household(text) from public, anon;
revoke all on function public.create_invite() from public, anon;
revoke all on function public.join_household(text) from public, anon;
revoke all on function public.leave_household() from public, anon;
revoke all on function public.remove_member(uuid) from public, anon;
revoke all on function public.household_snapshot(uuid, uuid[]) from public, anon;
revoke all on function public.prune_applied_ops() from public, anon, authenticated;
grant execute on function public.apply_ops(uuid, jsonb) to authenticated;
grant execute on function public.create_household(text) to authenticated;
grant execute on function public.rename_household(text) to authenticated;
grant execute on function public.create_invite() to authenticated;
grant execute on function public.join_household(text) to authenticated;
grant execute on function public.leave_household() to authenticated;
grant execute on function public.remove_member(uuid) to authenticated;
grant execute on function public.household_snapshot(uuid, uuid[]) to authenticated;

-- ---------------------------------------------------------------- realtime
-- Partners get live updates; Realtime applies the SELECT policies above.
alter publication supabase_realtime add table
  public.inventory_items, public.meal_history, public.outside_meals, public.recipe_feedback,
  public.shopping_extras, public.ai_recipes, public.household_docs, public.household_members,
  public.households;
