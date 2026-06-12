create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text default 'client',
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where (
      p.id = auth.uid()
      or to_jsonb(p) ->> 'user_id' = auth.uid()::text
    )
      and to_jsonb(p) ->> 'role' = 'admin'
  );
$$;

create or replace function public.owns_profile(target_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = target_profile_id
      and (
        p.id = auth.uid()
        or to_jsonb(p) ->> 'user_id' = auth.uid()::text
      )
  );
$$;

create table if not exists public.profile_media (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  drive_file_id text not null unique,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null default 0 check (size_bytes >= 0),
  media_type text not null check (
    media_type in ('photo', 'story', 'video', 'audio', 'document')
  ),
  position integer not null default 0 check (position >= 0),
  visibility text not null default 'public' check (
    visibility in ('public', 'subscriber', 'private')
  ),
  is_cover boolean not null default false,
  is_blurred boolean not null default false,
  status text not null default 'processing' check (
    status in ('processing', 'ready', 'failed')
  ),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profile_media_profile_position_idx
  on public.profile_media(profile_id, media_type, position);

create index if not exists profile_media_visibility_idx
  on public.profile_media(visibility, status);

create unique index if not exists profile_media_one_cover_idx
  on public.profile_media(profile_id)
  where is_cover = true and media_type = 'photo';

create or replace function public.set_profile_media_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profile_media_updated_at on public.profile_media;
create trigger set_profile_media_updated_at
before update on public.profile_media
for each row execute function public.set_profile_media_updated_at();

alter table public.profile_media enable row level security;

drop policy if exists "profile_media_public_read" on public.profile_media;
create policy "profile_media_public_read"
on public.profile_media
for select
to anon, authenticated
using (
  visibility = 'public'
  and status = 'ready'
  and (expires_at is null or expires_at > now())
);

drop policy if exists "profile_media_owner_read" on public.profile_media;
create policy "profile_media_owner_read"
on public.profile_media
for select
to authenticated
using (public.owns_profile(profile_id) or public.is_admin());

drop policy if exists "profile_media_owner_insert" on public.profile_media;
create policy "profile_media_owner_insert"
on public.profile_media
for insert
to authenticated
with check (public.owns_profile(profile_id) or public.is_admin());

drop policy if exists "profile_media_owner_update" on public.profile_media;
create policy "profile_media_owner_update"
on public.profile_media
for update
to authenticated
using (public.owns_profile(profile_id) or public.is_admin())
with check (public.owns_profile(profile_id) or public.is_admin());

drop policy if exists "profile_media_owner_delete" on public.profile_media;
create policy "profile_media_owner_delete"
on public.profile_media
for delete
to authenticated
using (public.owns_profile(profile_id) or public.is_admin());

revoke all on function public.is_admin() from public, anon;
revoke all on function public.owns_profile(uuid) from public, anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.owns_profile(uuid) to authenticated;

revoke all on public.profile_media from anon;
grant select on public.profile_media to anon;
grant select, insert, update, delete on public.profile_media to authenticated;
