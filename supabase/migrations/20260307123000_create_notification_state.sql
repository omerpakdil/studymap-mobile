create table if not exists public.notification_state (
  id uuid primary key default gen_random_uuid(),
  user_id text not null unique,
  locale text,
  timezone text,
  study_streak integer not null default 0,
  completed_tasks integer not null default 0,
  plan_updated_at timestamptz,
  last_opened_at timestamptz,
  last_study_session_at timestamptz,
  next_exam_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_state_study_streak_check check (study_streak >= 0),
  constraint notification_state_completed_tasks_check check (completed_tasks >= 0)
);

create index if not exists idx_notification_state_user_id on public.notification_state(user_id);
create index if not exists idx_notification_state_last_opened_at on public.notification_state(last_opened_at desc);
create index if not exists idx_notification_state_last_study_session_at on public.notification_state(last_study_session_at desc);
create index if not exists idx_notification_state_plan_updated_at on public.notification_state(plan_updated_at desc);

drop trigger if exists trg_notification_state_updated_at on public.notification_state;
create trigger trg_notification_state_updated_at
before update on public.notification_state
for each row
execute function public.set_updated_at();

alter table public.notification_state disable row level security;
grant select, insert, update on public.notification_state to anon, authenticated;

