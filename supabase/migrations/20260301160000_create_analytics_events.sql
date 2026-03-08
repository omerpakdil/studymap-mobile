-- Analytics event sink for client-side event tracking
-- Used by app/utils/analytics.ts when EXPO_PUBLIC_ANALYTICS_PROVIDER=supabase

create extension if not exists pgcrypto;

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_event_name_idx
  on public.analytics_events (event_name);

create index if not exists analytics_events_created_at_idx
  on public.analytics_events (created_at desc);

create index if not exists analytics_events_payload_gin_idx
  on public.analytics_events using gin (payload);

alter table public.analytics_events enable row level security;

-- Allow mobile clients to insert events with anon/authenticated keys.
drop policy if exists "Allow analytics insert" on public.analytics_events;
create policy "Allow analytics insert"
  on public.analytics_events
  for insert
  to anon, authenticated
  with check (true);
