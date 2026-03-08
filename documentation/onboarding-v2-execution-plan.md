# Onboarding V2 Execution Plan

## 1) Scope and Success Metrics
- Primary goal: increase onboarding completion and purchase conversion without AI providers.
- Secondary goal: improve plan quality confidence before paywall with transparent rule-based logic.

### Core KPIs
- Onboarding completion rate (`splash -> success`)
- Paywall view rate (`plan_preview -> paywall`)
- Purchase conversion (`paywall_view -> purchase_success`)
- Early retention (D1 users with at least one completed study session)

## 2) Device-Responsive Strategy (All iPhone Classes)

### Device Classes
- Compact: 4.7" (SE class)
- Small modern: 5.4" (mini class)
- Standard: 6.1" (11/12/13/14/15/16 base+Pro class)
- Large: 6.7"+ (Pro Max/Plus class)

### Layout Rules
- Always use safe area top/bottom.
- Vertical overflow must scroll (never clip CTA).
- Primary CTA fixed near bottom thumb-zone with minimum 16px safe margin.
- Tap target minimum `44x44`.
- Horizontal padding tokens by class:
  - Compact: 14
  - Small/Standard: 18
  - Large: 22

### Typography Rules
- Headline max 2 lines, fallback smaller size on compact class.
- Body text line-height at least 1.35x font-size.
- Do not use dense text blocks longer than 4 lines per card.

## 3) Funnel and Event Schema

### Global Event Parameters
- `step_id`
- `session_id`
- `variant_id`
- `device_class`
- `locale`

### Step Events
- `onboarding_step_view`
- `onboarding_step_continue`
- `onboarding_step_back`
- `onboarding_step_validation_fail`
- `onboarding_step_exit`

### Commercial Events
- `paywall_view`
- `purchase_start`
- `purchase_success`
- `purchase_fail`

### Reliability Events
- `onboarding_draft_save_fail`
- `onboarding_draft_load_fail`
- `plan_preview_generation_fail`

## 4) Screen-by-Screen Backlog

## Splash (`/(onboarding-v2)/splash`)
### UI Components
- Hero gradient/background layer
- Value proposition headline
- 2-3 trust bullets
- Primary CTA (`Start`)
- Secondary CTA (`Already have account` optional)

### Validation Rules
- No form validation; only route transition safety.

### Required Events
- `onboarding_step_view` (`step_id=splash`)
- `onboarding_step_continue` on CTA

### Acceptance Criteria
- First meaningful paint below 1.5s on warm start.
- Headline and CTA fully visible on SE without overlap.

## Value Proof (`/(onboarding-v2)/value-proof`)
### UI Components
- Proof metric cards
- Differentiation cards
- Continue CTA

### Validation Rules
- No hard validation.

### Required Events
- `onboarding_step_view` (`step_id=value_proof`)
- `onboarding_step_continue`

### Acceptance Criteria
- Cards remain readable across all classes.
- No clipped icon/text on compact devices.

## Goal Setup (`/(onboarding-v2)/goal-setup`)
### UI Components
- Exam selector grid/list
- Date input (`MM/DD/YYYY`)
- Target score input
- Intensity selector cards

### Validation Rules
- `examId` required
- `examDate` must be complete + parseable
- `targetScore` non-empty
- Intensity defaults to `moderate` if untouched

### Required Events
- `onboarding_step_view` (`step_id=goal_setup`)
- `onboarding_step_validation_fail` with failing fields
- `onboarding_step_continue`

### Acceptance Criteria
- Continue action is blocked with clear validation feedback until valid.
- Keyboard does not hide focused input or CTA.

## Schedule (`/(onboarding-v2)/schedule`)
### UI Components
- Weekday pills (Mon-Sun)
- Day slot list (early_morning/morning/afternoon/evening/night)
- Selected days helper

### Validation Rules
- Minimum 2 configured days
- Each configured day must have at least 1 slot
- Empty schedule blocks continue

### Required Events
- `onboarding_step_view` (`step_id=schedule`)
- `onboarding_step_validation_fail` with `selected_days`
- `onboarding_step_continue`

### Acceptance Criteria
- Day/slot toggles are instant and persistent.
- User can return/back and selections remain intact.

## Focus (`/(onboarding-v2)/focus`)
### UI Components
- Subject weight cards/sliders
- Quick presets (`balanced`, `weak-subject boost`, `exam crunch`)
- Normalization hint

### Validation Rules
- At least one subject > 0
- Weights normalized before continue

### Required Events
- `onboarding_step_view` (`step_id=focus`)
- `focus_preset_apply`
- `onboarding_step_continue`

### Acceptance Criteria
- Preset tap updates all weights in one frame.
- Normalization outcome deterministic.

## Learning Style (`/(onboarding-v2)/learning-style`)
### UI Components
- Session length selector
- Break rhythm selector
- Pace selector

### Validation Rules
- All three preferences must have a value (default allowed).

### Required Events
- `onboarding_step_view` (`step_id=learning_style`)
- `onboarding_step_continue`

### Acceptance Criteria
- One-tap defaults available.
- Inputs map cleanly to planner config.

## Plan Preview (`/(onboarding-v2)/plan-preview`)
### UI Components
- One-week preview timeline
- Applied rules summary
- Feasibility score
- Continue to paywall CTA

### Validation Rules
- Preview generation must succeed before continue.
- If failure, show retry/fallback state.

### Required Events
- `onboarding_step_view` (`step_id=plan_preview`)
- `plan_preview_generated`
- `plan_preview_generation_fail`
- `onboarding_step_continue`

### Acceptance Criteria
- Preview uses real onboarding state, not mock.
- Error state actionable and recoverable.

## Paywall (`/(onboarding-v2)/paywall`)
### UI Components
- Personalized headline using target/exam
- Plan benefit bullets
- Product cards/pricing
- Primary purchase CTA
- Restore CTA

### Validation Rules
- Product metadata must be present.
- Disable CTA on missing products and show retry.

### Required Events
- `paywall_view`
- `purchase_start`
- `purchase_success`
- `purchase_fail`

### Acceptance Criteria
- Purchase flow returns to `success` route on completion.
- Restore path works from same screen.

## Success (`/(onboarding-v2)/success`)
### UI Components
- Confirmation hero
- First-week kickoff CTA
- Optional reminder permission prompt

### Validation Rules
- Requires successful purchase or allowed free-path flag.

### Required Events
- `onboarding_step_view` (`step_id=success`)
- `onboarding_complete`

### Acceptance Criteria
- Routes user directly to dashboard/program start.
- Onboarding complete state persists.

## 5) Data Contract and Integration
- Source of truth: `OnboardingV2Draft` in `state.tsx`.
- Persist draft on each update with AsyncStorage.
- Use `persistOnboardingV2ToLegacyStorage(snapshot)` before program generation.
- Program generator must consume:
  - exam + date + target
  - weekly availability (days + slots)
  - subject focus weights
  - learning style preferences

## 6) QA Checklist (Release Gate)
- SE class: no clipped CTA or keyboard overlap.
- Mini class: no headline truncation beyond 2 lines.
- Standard class: smooth 60fps step transitions.
- Pro Max class: no excessive whitespace causing visual imbalance.
- Back navigation keeps user data at every step.
- App kill/reopen restores onboarding draft.
- Analytics events fire once per step view.
- Purchase events include `variant_id` and `device_class`.

## 7) Delivery Order (Implementation)
1. Instrumentation layer + event constants
2. Validation utilities per step
3. Responsive token utility by device class
4. Plan preview real data binding
5. Paywall personalization + restore flow hardening
6. End-to-end QA pass + bugfix sprint

## 8) Definition of Done
- V2 onboarding enabled from app entry.
- No lint errors in onboarding-v2 scope.
- All required step/commercial events emitted.
- QA checklist passed on iPhone class matrix.
- Conversion baseline available for A/B iteration.

## 9) Analytics Integration Notes
- Runtime tracking helper: `app/utils/analytics.ts`
- Onboarding event mapper: `app/utils/onboardingV2Analytics.ts`
- Provider env:
  - `EXPO_PUBLIC_ANALYTICS_PROVIDER=console` (default)
  - `EXPO_PUBLIC_ANALYTICS_PROVIDER=supabase`
- If Supabase provider is used, create table `analytics_events` with:
  - `id` uuid primary key default `gen_random_uuid()`
  - `event_name` text not null
  - `payload` jsonb not null
  - `created_at` timestamptz not null default `now()`

## 10) Phase 4 Closure Status
- Completed: responsive scaffold upgraded with iPhone class spacing and keyboard-safe layout.
- Completed: goal date validation hardened (invalid/past dates blocked).
- Completed: focus step upgraded with quick presets and normalization action.
- Completed: learning-style step now captures session length, break rhythm, and environment.
- Completed: plan-preview now has retry flow and feasibility score output.
- Completed: paywall now supports personalization (`examName`, `targetScore`) and variant routing.
- Completed: purchase tracking now includes `purchase_start/success/fail`, restore outcomes, and `variant_id`.
- Completed: Supabase migration added at `supabase/migrations/20260301160000_create_analytics_events.sql`.

## 11) Manual QA Matrix (Release Blocking)
- iPhone SE class: verify title wraps <=2 lines and footer CTA remains visible while keyboard is open.
- iPhone mini class: verify schedule day pills wrap correctly and no horizontal overflow.
- iPhone 6.1 class: verify focus presets + slider updates persist on back navigation.
- iPhone Pro Max class: verify paywall cards do not look sparse and target chip remains aligned.
- Purchase flow: verify `purchase_start` then `purchase_success` or `purchase_fail` appears in `analytics_events`.
- Restore flow: verify restore success/failure emits tracked events and correct modal behavior.

## 12) Supabase Funnel SQL (Ready To Run)
- Last events:
```sql
select event_name, created_at, payload
from public.analytics_events
order by created_at desc
limit 100;
```

- Step views by step id (last 7 days):
```sql
select
  payload->>'step_id' as step_id,
  count(*) as view_count
from public.analytics_events
where event_name = 'onboarding_step_view'
  and created_at >= now() - interval '7 days'
group by 1
order by view_count desc;
```

- Continue rate by step (view vs continue):
```sql
with views as (
  select payload->>'step_id' as step_id, count(*) as c
  from public.analytics_events
  where event_name = 'onboarding_step_view'
    and created_at >= now() - interval '7 days'
  group by 1
),
continues as (
  select payload->>'step_id' as step_id, count(*) as c
  from public.analytics_events
  where event_name = 'onboarding_step_continue'
    and created_at >= now() - interval '7 days'
  group by 1
)
select
  v.step_id,
  v.c as views,
  coalesce(c.c, 0) as continues,
  round((coalesce(c.c, 0)::numeric / nullif(v.c, 0)) * 100, 2) as continue_rate_pct
from views v
left join continues c on c.step_id = v.step_id
order by v.c desc;
```

- Purchase conversion by paywall variant (last 7 days):
```sql
with starts as (
  select coalesce(payload->>'variant_id', 'unknown') as variant_id, count(*) as c
  from public.analytics_events
  where event_name = 'purchase_start'
    and created_at >= now() - interval '7 days'
  group by 1
),
success as (
  select coalesce(payload->>'variant_id', 'unknown') as variant_id, count(*) as c
  from public.analytics_events
  where event_name = 'purchase_success'
    and created_at >= now() - interval '7 days'
  group by 1
)
select
  s.variant_id,
  s.c as purchase_start_count,
  coalesce(u.c, 0) as purchase_success_count,
  round((coalesce(u.c, 0)::numeric / nullif(s.c, 0)) * 100, 2) as purchase_success_rate_pct
from starts s
left join success u on u.variant_id = s.variant_id
order by s.c desc;
```
