-- ===========================
-- Ascendancy V4 – Supabase SQL (MVP schema + RLS)
-- ===========================

create extension if not exists "pgcrypto";

create type role_type as enum ('player','chair','staff');
create type bstatus   as enum ('building','active','paused');
create type vscope    as enum ('global','planet');
create type vmeasure  as enum ('legislation','focus','tax');
create type focus_kind as enum ('economy','security','science');

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role role_type not null default 'player',
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);

create table if not exists public.planets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null unique,
  biome text,
  p_industry    int not null default 0,
  p_extraction  int not null default 0,
  p_pop         int not null default 0,
  p_infra       int not null default 0,
  p_admin       int not null default 0,
  main_focus focus_kind default null,
  main_focus_expires_at timestamptz,
  gdp numeric not null default 1000,
  tax_rate numeric not null default 0.15 check (tax_rate >= 0 and tax_rate <= 0.5),
  tax_eff numeric not null default 1.00,
  pop_units int not null default 5,
  happiness int not null default 50,
  build_speed_mod numeric not null default 1.0,
  stockpiles jsonb not null default
    '{"metals":0,"energy":0,"food":0,"rare":0,"alloys":0,"goods":0,"credits":1000}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.buildings (
  id uuid primary key default gen_random_uuid(),
  planet_id uuid not null references public.planets(id) on delete cascade,
  type text not null,
  level int not null default 1,
  status bstatus not null default 'building',
  started_at timestamptz not null default now(),
  completes_at timestamptz not null,
  upkeep jsonb not null default '[]',
  input  jsonb not null default '[]',
  output jsonb not null default '[]'
);
create index if not exists idx_buildings_planet on public.buildings (planet_id);

create table if not exists public.trade_orders (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references auth.users(id) on delete cascade,
  planet_id uuid not null references public.planets(id) on delete cascade,
  offer jsonb not null,
  want  jsonb not null,
  price numeric not null,
  status text not null default 'open',
  created_at timestamptz not null default now()
);
create index if not exists idx_trade_orders_status on public.trade_orders (status);

create table if not exists public.transfers (
  id uuid primary key default gen_random_uuid(),
  from_id uuid not null references auth.users(id) on delete cascade,
  to_id   uuid not null references auth.users(id) on delete cascade,
  amount numeric not null check (amount > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.event_templates (
  id uuid primary key default gen_random_uuid(),
  scope text not null check (scope in ('planet','galactic','both')),
  title text not null,
  description text,
  choices jsonb not null default '[]'
);

create table if not exists public.active_events (
  id uuid primary key default gen_random_uuid(),
  planet_id uuid references public.planets(id) on delete cascade,
  template_id uuid not null references public.event_templates(id) on delete cascade,
  choice_label text,
  started_at timestamptz not null default now(),
  expires_at timestamptz,
  effects_state jsonb not null default '[]'
);
create index if not exists idx_active_events_planet on public.active_events (planet_id);

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  scope vscope not null,
  measure vmeasure not null,
  payload jsonb not null,
  open_at timestamptz not null,
  close_at timestamptz not null,
  result text default null
);

create table if not exists public.vote_ballots (
  vote_id uuid not null references public.votes(id) on delete cascade,
  voter_id uuid not null references auth.users(id) on delete cascade,
  choice text not null,
  cast_at timestamptz not null default now(),
  primary key (vote_id, voter_id)
);

create table if not exists public.federal (
  id int primary key default 1,
  chair_id uuid references auth.users(id) on delete set null,
  tax_rate numeric not null default 0.00,
  pool_credits numeric not null default 0,
  stockpiles jsonb not null default '{"metals":0,"energy":0,"food":0,"rare":0,"alloys":0,"goods":0}'::jsonb,
  fleet jsonb not null default '{"battleship":0,"cruiser":0,"destroyer":0}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.tick_log (
  id uuid primary key default gen_random_uuid(),
  ran_at timestamptz not null default now(),
  duration_ms int,
  aggregates jsonb not null default '{}',
  notes text
);

alter table public.profiles      enable row level security;
alter table public.planets       enable row level security;
alter table public.buildings     enable row level security;
alter table public.trade_orders  enable row level security;
alter table public.transfers     enable row level security;
alter table public.event_templates enable row level security;
alter table public.active_events enable row level security;
alter table public.votes         enable row level security;
alter table public.vote_ballots  enable row level security;
alter table public.federal       enable row level security;
alter table public.tick_log      enable row level security;

drop policy if exists "profiles are self-only" on public.profiles;
drop policy if exists "players select own planet" on public.planets;
drop policy if exists "players insert own planet" on public.planets;
drop policy if exists "players update own planet" on public.planets;
drop policy if exists "buildings select own" on public.buildings;
drop policy if exists "buildings insert own" on public.buildings;
drop policy if exists "buildings update own" on public.buildings;
drop policy if exists "market readable" on public.trade_orders;
drop policy if exists "market self-insert" on public.trade_orders;
drop policy if exists "market self-update" on public.trade_orders;
drop policy if exists "market self-delete" on public.trade_orders;
drop policy if exists "transfers self-select" on public.transfers;
drop policy if exists "transfers self-insert" on public.transfers;
drop policy if exists "events readable" on public.event_templates;
drop policy if exists "active events readable" on public.active_events;
drop policy if exists "votes readable" on public.votes;
drop policy if exists "ballots select self" on public.vote_ballots;
drop policy if exists "ballots insert self" on public.vote_ballots;
drop policy if exists "ballots update self" on public.vote_ballots;
drop policy if exists "federal readable" on public.federal;
drop policy if exists "ticklog readable" on public.tick_log;

create policy "profiles are self-only" on public.profiles
  for select using (auth.uid() = id);

create policy "players select own planet" on public.planets
  for select using (owner_id = auth.uid());

create policy "players insert own planet" on public.planets
  for insert with check (owner_id = auth.uid());

create policy "players update own planet" on public.planets
  for update using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "buildings select own" on public.buildings
  for select using (planet_id in (select id from public.planets where owner_id = auth.uid()));

create policy "buildings insert own" on public.buildings
  for insert with check (planet_id in (select id from public.planets where owner_id = auth.uid()));

create policy "buildings update own" on public.buildings
  for update using (planet_id in (select id from public.planets where owner_id = auth.uid()))
  with check (planet_id in (select id from public.planets where owner_id = auth.uid()));

create policy "market readable" on public.trade_orders
  for select using (true);

create policy "market self-insert" on public.trade_orders
  for insert with check (seller_id = auth.uid());

create policy "market self-update" on public.trade_orders
  for update using (seller_id = auth.uid())
  with check (seller_id = auth.uid());

create policy "market self-delete" on public.trade_orders
  for delete using (seller_id = auth.uid());

create policy "transfers self-select" on public.transfers
  for select using (from_id = auth.uid() or to_id = auth.uid());

create policy "transfers self-insert" on public.transfers
  for insert with check (from_id = auth.uid());

create policy "events readable" on public.event_templates
  for select using (true);

create policy "active events readable" on public.active_events
  for select using (
    planet_id is null
    or planet_id in (select id from public.planets where owner_id = auth.uid())
  );

create policy "votes readable" on public.votes
  for select using (true);

create policy "ballots select self" on public.vote_ballots
  for select using (voter_id = auth.uid());

create policy "ballots insert self" on public.vote_ballots
  for insert with check (voter_id = auth.uid());

create policy "ballots update self" on public.vote_ballots
  for update using (voter_id = auth.uid())
  with check (voter_id = auth.uid());

create policy "federal readable" on public.federal
  for select using (true);

create policy "ticklog readable" on public.tick_log
  for select using (true);
