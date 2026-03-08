# Onboarding V2 Creative Direction (Phase 1)

## Objective
Create a premium-first, conversion-oriented onboarding language that feels intentional and modern, while staying readable and fast on all iPhone classes.

## Visual Direction
- Mood: editorial + product clarity (not playful, not generic SaaS)
- Core palette: warm paper background + electric blue + burnt orange + grounded green
- Card language: frosted translucent surfaces with soft border contrast
- Motion: staged entrance + gentle float on hero composition

## Responsive Rules
- Device classes:
  - `iphone_compact` (<=320)
  - `iphone_small` (321-379)
  - `iphone_standard` (380-429)
  - `iphone_large` (>=430)
- Tokens controlled by `getOnboardingV2Tokens(width)`
- Horizontal spacing: `14 / 16 / 18 / 22`
- Headline size: `26 / 29 / 32 / 34`

## Components Introduced
- `app/components/onboarding-v2/designSystem.ts`
  - `onboardingV2Palette`
  - `getOnboardingV2Tokens(width)`
- `OnboardingScaffold`
  - now uses token-driven layout
  - gradient atmosphere + decorative orbs
  - keyboard-safe footer area for form screens

## Reference Screen Delivered
- `/(onboarding-v2)/splash`
  - rebuilt hero hierarchy
  - value metrics row
  - proof bullets
  - entrance and floating animation

## Next Phase (Phase 2)
Apply this language to:
- `value-proof`
- `goal-setup`

Focus in phase 2:
- stronger card hierarchy
- tighter copy rhythm
- animation parity with splash

## Phase 2 Delivery
- `value-proof` rebuilt as a proof board:
  - metric board with hard claims
  - structured proof cards with accent rails
  - clear transition note into target setup
- `goal-setup` rebuilt as premium form stack:
  - separated exam/date/score/intensity cards
  - stronger selection states
  - clearer visual hierarchy for conversion momentum

## Phase 3 Delivery
- `schedule` rebuilt as execution planner:
  - summary metrics (`configured days`, `total slots`, `active day slots`)
  - quick templates (`Weekday Evenings`, `Balanced Week`)
  - upgraded day selection + slot cards
- `focus` rebuilt as pressure control panel:
  - profile summary (`avg intensity`)
  - quick presets + normalize action
  - upgraded subject slider cards with stronger hierarchy

## Phase 4 Delivery
- `learning-style` rebuilt with premium preference stack:
  - primary style cards with stronger selected states
  - reminder cadence, session length, break rhythm, environment as grouped sections
- `plan-preview` rebuilt as execution dashboard:
  - plan metrics panel
  - feasibility score panel
  - first 7-day timeline panel
  - retry flow and finalize flow preserved

## Phase 5 Delivery
- `paywall` rebuilt as premium conversion page:
  - variant-aware value copy
  - personalized exam/target framing
  - offer card + trust strip + clearer CTA hierarchy
  - purchase routing and event tracking preserved
- `success` rebuilt as activation handoff:
  - clear “plan activated” confirmation
  - immediate next-step guidance
  - onboarding completion tracking preserved

## Phase 6 Delivery (Responsive + Polish)
- Compact device hardening added to high-risk layouts:
  - `splash` KPI area stacks on compact widths
  - `value-proof` metric board switches to vertical mode on compact widths
  - `plan-preview` KPI row stacks on compact widths
  - `paywall` offer header stacks on compact widths
- Full onboarding-v2 lint pass completed after polish changes.

## Phase 6 Remaining Manual QA (Device Run)
- iPhone SE/mini:
  - verify no clipped text in hero sections
  - verify CTA bar remains reachable with keyboard open on form screens
- iPhone 6.1 / Pro Max:
  - verify visual balance (no excessive whitespace or squeezed cards)
  - verify card rhythm and animation smoothness through full flow
- Purchase edge checks:
  - paywall -> purchase start
  - success / fail / restore branches
  - confirm events in `analytics_events`
