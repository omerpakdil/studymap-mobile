-- Notification infrastructure for local + remote delivery
-- Uses RevenueCat app user id (text) as user identity in current architecture.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  expo_push_token text not null unique,
  platform text not null default 'ios',
  locale text,
  timezone text,
  is_active boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint push_tokens_platform_check check (platform in ('ios', 'android', 'web')),
  constraint push_tokens_user_token_unique unique (user_id, expo_push_token)
);

create index if not exists idx_push_tokens_user_id on public.push_tokens(user_id);
create index if not exists idx_push_tokens_is_active on public.push_tokens(is_active);

drop trigger if exists trg_push_tokens_updated_at on public.push_tokens;
create trigger trg_push_tokens_updated_at
before update on public.push_tokens
for each row
execute function public.set_updated_at();

create table if not exists public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id text not null unique,
  study_reminders boolean not null default true,
  plan_summaries boolean not null default true,
  progress_nudges boolean not null default true,
  premium_updates boolean not null default true,
  referral_updates boolean not null default true,
  break_reminders boolean not null default true,
  quiet_hours_start text not null default '21:30',
  quiet_hours_end text not null default '07:30',
  preferred_study_time text not null default '09:00',
  upcoming_lead_minutes integer not null default 15,
  recovery_delay_minutes integer not null default 45,
  daily_wrap_time text not null default '20:15',
  weekly_plan_day integer not null default 1,
  weekly_plan_time text not null default '18:00',
  locale text,
  timezone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_preferences_weekly_plan_day_check check (weekly_plan_day between 0 and 6),
  constraint notification_preferences_upcoming_lead_check check (upcoming_lead_minutes between 5 and 120),
  constraint notification_preferences_recovery_delay_check check (recovery_delay_minutes between 10 and 240)
);

drop trigger if exists trg_notification_preferences_updated_at on public.notification_preferences;
create trigger trg_notification_preferences_updated_at
before update on public.notification_preferences
for each row
execute function public.set_updated_at();

create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  notification_type text not null,
  notification_channel text not null,
  notification_status text not null,
  title text,
  body text,
  payload jsonb not null default '{}'::jsonb,
  scheduled_for timestamptz,
  delivered_at timestamptz,
  opened_at timestamptz,
  created_at timestamptz not null default now(),
  constraint notification_events_channel_check check (notification_channel in ('local', 'remote')),
  constraint notification_events_status_check check (notification_status in ('planned', 'sent', 'delivered', 'opened', 'failed', 'cancelled'))
);

create index if not exists idx_notification_events_user_id on public.notification_events(user_id);
create index if not exists idx_notification_events_type on public.notification_events(notification_type);
create index if not exists idx_notification_events_status on public.notification_events(notification_status);
create index if not exists idx_notification_events_created_at on public.notification_events(created_at desc);

alter table public.push_tokens disable row level security;
alter table public.notification_preferences disable row level security;
alter table public.notification_events disable row level security;

grant select, insert, update on public.push_tokens to anon, authenticated;
grant select, insert, update on public.notification_preferences to anon, authenticated;
grant select, insert, update on public.notification_events to anon, authenticated;

