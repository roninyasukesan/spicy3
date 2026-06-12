create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.profiles add column if not exists public_id uuid default gen_random_uuid();
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists role text default 'client';
alter table public.profiles add column if not exists name text;
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists city text;
alter table public.profiles add column if not exists price text;
alter table public.profiles add column if not exists price_range text;
alter table public.profiles add column if not exists image_url text;
alter table public.profiles add column if not exists age integer;
alter table public.profiles add column if not exists rating numeric default 5;
alter table public.profiles add column if not exists reviews integer default 0;
alter table public.profiles add column if not exists is_verified boolean default false;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists services text[] default '{}';
alter table public.profiles add column if not exists fetishes text[] default '{}';
alter table public.profiles add column if not exists exclusions text[] default '{}';
alter table public.profiles add column if not exists gallery text[] default '{}';
alter table public.profiles add column if not exists gallery_items jsonb default '[]'::jsonb;
alter table public.profiles add column if not exists characteristics jsonb default '{}'::jsonb;
alter table public.profiles add column if not exists stories jsonb default '[]'::jsonb;
alter table public.profiles add column if not exists voice_url text;
alter table public.profiles add column if not exists plan_tier text default 'free';
alter table public.profiles add column if not exists updated_at timestamptz default now();

update public.profiles
set
  public_id = coalesce(public_id, gen_random_uuid()),
  user_id = coalesce(user_id, id),
  name = coalesce(name, display_name),
  display_name = coalesce(display_name, name),
  price = coalesce(price, price_range),
  price_range = coalesce(price_range, price)
where
  public_id is null
  or user_id is null
  or name is null
  or display_name is null
  or price is null
  or price_range is null;

alter table public.profiles alter column public_id set not null;

create unique index if not exists profiles_public_id_idx
  on public.profiles(public_id);
create unique index if not exists profiles_email_idx
  on public.profiles(lower(email))
  where email is not null;
create index if not exists profiles_user_id_idx
  on public.profiles(user_id);

create or replace function public.set_profile_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profile_updated_at on public.profiles;
create trigger set_profile_updated_at
before update on public.profiles
for each row execute function public.set_profile_updated_at();

alter table public.profiles enable row level security;

drop policy if exists "Public read profiles" on public.profiles;
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "profiles_public_read" on public.profiles;
create policy "profiles_public_read"
on public.profiles
for select
to anon, authenticated
using (true);

drop policy if exists "Authenticated insert own profiles" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "profiles_owner_insert" on public.profiles;
create policy "profiles_owner_insert"
on public.profiles
for insert
to authenticated
with check (
  (select auth.uid()) = id
  or (select auth.uid()) = user_id
);

drop policy if exists "Authenticated update own profiles" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "profiles_owner_update" on public.profiles;
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

grant select on public.profiles to anon;
grant select, insert, update on public.profiles to authenticated;
