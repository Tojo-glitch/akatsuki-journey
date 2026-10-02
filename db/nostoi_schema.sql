-- ==============================================================================
--  NOSTOI™ MASTER DATABASE & STORAGE SCHEMA
--  Copy-paste this into Supabase Dashboard -> SQL Editor -> Click RUN
-- ==============================================================================

-- 1. Create Tables
create table if not exists public.nostoi_patterns (
  id text primary key,
  category text not null,
  pair text not null,
  timeframe text not null,
  session text not null,
  image_url text not null,
  notes text,
  created_at bigint not null default (extract(epoch from now()) * 1000)::bigint
);

create table if not exists public.nostoi_trades (
  id text primary key,
  date text not null,
  pair text not null,
  timeframe text not null,
  session text not null,
  setup text not null,
  direction text not null default 'buy',
  result text not null default 'win',
  r_multiple numeric default 2.0,
  image_url text not null,
  notes text,
  created_at bigint not null default (extract(epoch from now()) * 1000)::bigint
);

create table if not exists public.nostoi_comments (
  id text primary key,
  trade_id text not null,
  author_name text not null,
  avatar_url text,
  content text not null,
  created_at bigint not null default (extract(epoch from now()) * 1000)::bigint
);

create table if not exists public.nostoi_settings (
  id text primary key default 'default',
  settings_json jsonb not null,
  updated_at bigint not null default (extract(epoch from now()) * 1000)::bigint
);

-- 2. Enable Row Level Security (RLS) & Public Policies
alter table public.nostoi_patterns enable row level security;
alter table public.nostoi_trades enable row level security;
alter table public.nostoi_comments enable row level security;
alter table public.nostoi_settings enable row level security;

create policy "Allow all read patterns" on public.nostoi_patterns for select using (true);
create policy "Allow all insert patterns" on public.nostoi_patterns for insert with check (true);
create policy "Allow all update patterns" on public.nostoi_patterns for update using (true);
create policy "Allow all delete patterns" on public.nostoi_patterns for delete using (true);

create policy "Allow all read trades" on public.nostoi_trades for select using (true);
create policy "Allow all insert trades" on public.nostoi_trades for insert with check (true);
create policy "Allow all update trades" on public.nostoi_trades for update using (true);
create policy "Allow all delete trades" on public.nostoi_trades for delete using (true);

create policy "Allow all read comments" on public.nostoi_comments for select using (true);
create policy "Allow all insert comments" on public.nostoi_comments for insert with check (true);

create policy "Allow all read settings" on public.nostoi_settings for select using (true);
create policy "Allow all insert/update settings" on public.nostoi_settings for all using (true);

-- 3. Storage Bucket for Chart Uploads
insert into storage.buckets (id, name, public) 
values ('nostoi-charts', 'nostoi-charts', true)
on conflict (id) do nothing;

create policy "Public Access to Nostoi Charts" 
on storage.objects for select using (bucket_id = 'nostoi-charts');

create policy "Allow Chart Uploads" 
on storage.objects for insert with check (bucket_id = 'nostoi-charts');
