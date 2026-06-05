create table if not exists runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  run_date date not null,
  distance_km numeric not null,
  moving_time_seconds integer not null,
  effort integer,
  notes text,
  source text default 'manual',
  strava_activity_id bigint unique,
  created_at timestamptz default now()
);
alter table runs enable row level security;
create policy "Users can manage own runs" on runs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create table if not exists strava_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  access_token text not null,
  refresh_token text not null,
  expires_at bigint not null,
  athlete_id bigint,
  updated_at timestamptz default now()
);
alter table strava_tokens enable row level security;
create policy "Users can manage own strava tokens" on strava_tokens for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
