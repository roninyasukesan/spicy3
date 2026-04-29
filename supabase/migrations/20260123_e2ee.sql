create table if not exists user_keys (
  user_id uuid primary key references profiles(id) on delete cascade,
  public_key text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table user_keys enable row level security;
create policy "Public user keys are viewable by everyone"
  on user_keys for select
  using (true);
create policy "Users can insert own key"
  on user_keys for insert
  with check (auth.uid() = user_id);
create policy "Users can update own key"
  on user_keys for update
  using (auth.uid() = user_id);

alter table if exists messages add column if not exists encrypted_data text;
alter table if exists messages alter column content drop not null;
