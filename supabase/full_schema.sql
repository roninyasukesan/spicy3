-- Enable necessary extensions
create extension if not exists pgcrypto;
create extension if not exists postgis; -- For future geolocation features

-- 1. PROFILES (Public and Private Data)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique, -- Synced from auth.users via trigger (optional but useful)
  role text default 'client' check (role in ('client', 'model', 'admin')),
  
  -- Public Display Info
  display_name text,
  slug text unique,
  bio text,
  city text,
  neighborhood text,
  state text,
  country text default 'Brasil',
  location geography(Point), -- PostGIS point
  
  -- Model Specifics
  price_range text,
  age integer,
  height text,
  body_type text,
  ethnicity text,
  hair_color text,
  eyes_color text,
  
  -- Arrays for tags
  services text[],
  fetishes text[],
  exclusions text[],
  
  -- Metadata
  is_verified boolean default false,
  is_featured boolean default false,
  plan_tier text default 'free' check (plan_tier in ('free', 'gold', 'diamond')),
  
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Indexes for search performance
create index if not exists profiles_city_idx on profiles(city);
create index if not exists profiles_services_idx on profiles using gin(services);
create index if not exists profiles_fetishes_idx on profiles using gin(fetishes);
create index if not exists profiles_location_idx on profiles using gist(location);

-- RLS for Profiles
alter table profiles enable row level security;

-- Everyone can read profiles
create policy "Public profiles are viewable by everyone"
  on profiles for select
  using (true);

-- Users can insert their own profile
create policy "Users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- 2. MEDIA GALLERY (Photos/Videos)
create table if not exists media_gallery (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade not null,
  url text not null,
  type text default 'image' check (type in ('image', 'video')),
  is_private boolean default false, -- True = Paid/Subscribers only
  is_cover boolean default false,
  blur_level integer default 0,
  
  created_at timestamp with time zone default now()
);

alter table media_gallery enable row level security;

create policy "Public media is viewable by everyone"
  on media_gallery for select
  using (is_private = false);

create policy "Private media viewable by owner"
  on media_gallery for select
  using (auth.uid() = profile_id);

create policy "Owners can manage their media"
  on media_gallery for all
  using (auth.uid() = profile_id);

-- 3. VERIFICATIONS (KYC)
create table if not exists verifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade not null,
  document_front_url text,
  document_back_url text,
  selfie_url text,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table verifications enable row level security;

create policy "Users can view their own verification status"
  on verifications for select
  using (auth.uid() = profile_id);

create policy "Users can insert verification request"
  on verifications for insert
  with check (auth.uid() = profile_id);

-- (Admins would need a separate policy or bypass RLS)

-- 4. REVIEWS
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  model_id uuid references profiles(id) on delete cascade not null,
  author_id uuid references profiles(id) on delete set null, -- Nullable if user deletes account
  rating integer check (rating >= 1 and rating <= 5),
  comment text,
  is_approved boolean default false, -- Moderation
  created_at timestamp with time zone default now()
);

alter table reviews enable row level security;

create policy "Reviews are viewable by everyone"
  on reviews for select
  using (true);

create policy "Authenticated users can create reviews"
  on reviews for insert
  with check (auth.uid() = author_id);

-- 5. CONVERSATIONS (Chat)
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  participant_a uuid references profiles(id) not null,
  participant_b uuid references profiles(id) not null,
  last_message_at timestamp with time zone default now(),
  unique(participant_a, participant_b)
);

alter table conversations enable row level security;

create policy "Users can view their conversations"
  on conversations for select
  using (auth.uid() = participant_a or auth.uid() = participant_b);

-- 6. MESSAGES
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade not null,
  sender_id uuid references profiles(id) not null,
  content text not null,
  is_read boolean default false,
  created_at timestamp with time zone default now()
);

alter table messages enable row level security;

create policy "Users can view messages in their conversations"
  on messages for select
  using (
    exists (
      select 1 from conversations c
      where c.id = messages.conversation_id
      and (c.participant_a = auth.uid() or c.participant_b = auth.uid())
    )
  );

create policy "Users can send messages to their conversations"
  on messages for insert
  with check (
    auth.uid() = sender_id and
    exists (
      select 1 from conversations c
      where c.id = messages.conversation_id
      and (c.participant_a = auth.uid() or c.participant_b = auth.uid())
    )
  );

-- 7. FAVORITES (Likes/Bookmarks)
create table if not exists favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  model_id uuid references profiles(id) on delete cascade not null,
  created_at timestamp with time zone default now(),
  unique(user_id, model_id)
);

alter table favorites enable row level security;

create policy "Users can view their own favorites"
  on favorites for select
  using (auth.uid() = user_id);

create policy "Users can add favorites"
  on favorites for insert
  with check (auth.uid() = user_id);

create policy "Users can remove favorites"
  on favorites for delete
  using (auth.uid() = user_id);
