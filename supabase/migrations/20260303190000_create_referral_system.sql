-- Referral system schema used by onboarding + profile flows
-- Notes:
-- - This app currently uses RevenueCat appUserID as user identity (no Supabase Auth session)
-- - RLS is disabled so client-side writes can function with anon key

create extension if not exists pgcrypto;

-- Generic updated_at trigger function
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  user_id text not null unique,
  referral_code text not null unique,
  referral_extension_end_date timestamptz,
  referral_used_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_referral_code_format check (referral_code ~ '^[A-Z2-9]{6}$')
);

create index if not exists idx_users_user_id on public.users(user_id);
create index if not exists idx_users_referral_code on public.users(referral_code);
create index if not exists idx_users_referral_extension_end_date on public.users(referral_extension_end_date);

drop trigger if exists trg_users_updated_at on public.users;
create trigger trg_users_updated_at
before update on public.users
for each row
execute function public.set_updated_at();

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_code text not null,
  referrer_user_id text not null,
  referee_user_id text not null,
  status text not null default 'trial_started',
  trial_start_date timestamptz,
  trial_end_date timestamptz,
  subscribed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint referrals_status_check check (status in ('trial_started', 'subscribed', 'expired')),
  constraint referrals_referrer_code_fk foreign key (referrer_code) references public.users(referral_code) on update cascade,
  constraint referrals_referee_unique unique (referee_user_id)
);

create index if not exists idx_referrals_referrer_user_id on public.referrals(referrer_user_id);
create index if not exists idx_referrals_referrer_code on public.referrals(referrer_code);
create index if not exists idx_referrals_referee_user_id on public.referrals(referee_user_id);
create index if not exists idx_referrals_status on public.referrals(status);

drop trigger if exists trg_referrals_updated_at on public.referrals;
create trigger trg_referrals_updated_at
before update on public.referrals
for each row
execute function public.set_updated_at();

create or replace view public.referral_stats as
select
  u.referral_code,
  u.user_id,
  count(r.id) as total_referrals,
  count(r.id) filter (where r.status = 'subscribed') as successful_referrals,
  (count(r.id) filter (where r.status = 'subscribed')) * 7 as total_days_earned
from public.users u
left join public.referrals r on r.referrer_user_id = u.user_id
group by u.referral_code, u.user_id;

-- Required for current app architecture (no Supabase-authenticated user)
alter table public.users disable row level security;
alter table public.referrals disable row level security;

grant select, insert, update on public.users to anon, authenticated;
grant select, insert, update on public.referrals to anon, authenticated;
grant select on public.referral_stats to anon, authenticated;
