create table if not exists runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  date date not null,
  distance_km numeric not null,
  duration_seconds integer not null,
  effort integer,
  notes text,
  source text default 'manual',
  strava_activity_id text,
  created_at timestamptz default now()
);

alter table runs enable row level security;

create policy "Users can read their own runs" on runs
for select using (auth.uid() = user_id);

create policy "Users can insert their own runs" on runs
for insert with check (auth.uid() = user_id);

create policy "Users can update their own runs" on runs
for update using (auth.uid() = user_id);

create table if not exists strava_tokens (
  athlete_id text primary key,
  access_token text not null,
  refresh_token text not null,
  expires_at integer,
  created_at timestamptz default now()
);
