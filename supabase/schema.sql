create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid(),
  name text not null,
  city text not null,
  price text not null,
  image_url text,
  age int,
  rating numeric,
  reviews int,
  is_verified boolean default true,
  bio text,
  services text[],
  fetishes text[],
  gallery text[],
  characteristics jsonb,
  created_at timestamp with time zone default now()
);

create index if not exists profiles_city_idx on profiles (city);
create index if not exists profiles_rating_idx on profiles (rating);
create index if not exists profiles_user_id_idx on profiles (user_id);

alter table profiles enable row level security;
create policy "Public read profiles" on profiles
  for select
  using (true);
create policy "Authenticated insert own profiles" on profiles
  for insert
  with check (user_id = auth.uid());
create policy "Authenticated update own profiles" on profiles
  for update
  using (user_id = auth.uid());
