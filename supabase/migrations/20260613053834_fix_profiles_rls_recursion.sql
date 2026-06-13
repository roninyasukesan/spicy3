-- Remove legacy policies that query public.profiles from a policy on the
-- same table. PostgreSQL evaluates those queries through RLS again, causing
-- error 42P17 (infinite recursion).
alter table public.profiles enable row level security;

drop policy if exists "Admins can do everything on profiles" on public.profiles;
drop policy if exists "Admins can manage profiles" on public.profiles;
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "Public read profiles" on public.profiles;
drop policy if exists "Users can insert own profiles" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can update own profiles" on public.profiles;
drop policy if exists "profiles_public_read" on public.profiles;
drop policy if exists "profiles_owner_insert" on public.profiles;
drop policy if exists "profiles_owner_update" on public.profiles;
drop policy if exists "profiles_owner_delete" on public.profiles;

create policy "profiles_public_read"
on public.profiles
for select
to anon, authenticated
using (true);

create policy "profiles_owner_insert"
on public.profiles
for insert
to authenticated
with check (
  (select auth.uid()) = id
  and (user_id is null or (select auth.uid()) = user_id)
  and coalesce(role, 'client') in ('client', 'model', 'modelo')
  and coalesce(plan_tier, 'free') = 'free'
  and coalesce(is_verified, false) = false
);

create policy "profiles_owner_update"
on public.profiles
for update
to authenticated
using (
  (select auth.uid()) = id
  or (select auth.uid()) = user_id
)
with check (
  (select auth.uid()) = id
  or (select auth.uid()) = user_id
);

create policy "profiles_owner_delete"
on public.profiles
for delete
to authenticated
using (
  (select auth.uid()) = id
  or (select auth.uid()) = user_id
);

-- Public profile reads are intentionally available to search visitors.
grant select on public.profiles to anon, authenticated;

-- Remove broad write grants left by early prototypes. Sensitive fields such
-- as role, plan_tier and is_verified remain writable only by server-side
-- service-role operations.
revoke insert, update, delete on public.profiles from anon;
revoke insert, update, delete on public.profiles from authenticated;

grant insert (
  id,
  user_id,
  email,
  role,
  name,
  display_name,
  phone,
  city,
  price,
  price_range,
  image_url,
  age,
  bio,
  services,
  fetishes,
  exclusions,
  gallery,
  gallery_items,
  characteristics,
  stories,
  voice_url
) on public.profiles to authenticated;

grant update (
  name,
  display_name,
  phone,
  city,
  price,
  price_range,
  image_url,
  age,
  bio,
  services,
  fetishes,
  exclusions,
  gallery,
  gallery_items,
  characteristics,
  stories,
  voice_url
) on public.profiles to authenticated;

grant delete on public.profiles to authenticated;
