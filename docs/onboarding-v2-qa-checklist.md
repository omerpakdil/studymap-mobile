# Onboarding V2 QA Checklist (iPhone)

## Test Matrix
- iPhone SE (2nd/3rd gen) - 375x667
- iPhone 13/14/15 - 390x844
- iPhone 13/14/15 Pro Max - 430x932

## Global Checks (All Screens)
- No clipped text in any language (en, tr, de, ar, ja, ko, pt-BR, zh-Hans)
- No unexpected horizontal overflow
- No CTA/button text truncation
- No layout jump on first render
- No overlap with notch/dynamic island/home indicator
- No unexpected scroll on screens intended to be fully visible

## Flow Order Check
- `animated-splash` appears before intro
- `intro` -> `splash` -> onboarding steps follow expected sequence
- No route dead-end in onboarding flow

## Screen-by-Screen Checks

### 1) Intro / Splash
- Headline + subtitle fully visible
- Main CTA always visible without scroll
- Brand/icon asset appears correctly (no white frame/background artifact)

### 2) Value Proof
- Cards fully visible
- No compressed or overlapping card texts
- Continue CTA visible

### 3) Choose Country
- Country list spacing consistent
- Selected state clear
- Continue disabled until selection

### 4) Choose Target Exam
- Grid spacing consistent (no oversized empty gaps)
- Card subtitles meaningful and readable
- Continue disabled until selection

### 5) Goal Date
- Date input placeholders aligned (`MM / DD / YYYY`)
- No year wrap issue (`YYYY` line-break bug)
- Validation alerts shown correctly

### 6) Goal Score / Rank
- Target input and quick-select chips fit without clipping
- Bottom keyboard area does not hide CTA
- On submit, next step routing correct

### 7) Goal Intensity
- Exactly 4 options visible
- Option cards balanced in size
- Selection state clear, no overflowed description

### 8) Schedule (Map Your Real Week)
- Default: no preselected day/slot after fresh onboarding start
- Continue goes day-by-day, final day advances screen
- Day selector UI balanced and readable
- Slot rows use teal-only selection system (no mixed random colors)
- No icon collision in slot action area

### 9) Subject Focus
- Subject count adapts to exam (3/4/5/6...)
- No large dead whitespace in mid/lower area
- Subject tabs remain readable with long names
- Continue label is proper gerund (`...ing`) format

### 10) Learning Rhythm
- Step-by-step selection works in order
- Compact layout; no unnecessary scroll
- Final continue transitions correctly

### 11) Plan Preview
- KPI block, subject distribution, first sessions fit cleanly
- Long localized labels do not clip
- CTA remains visible and readable on SE size
- Continue to premium works

### 12) Paywall
- Hero + plan + CTA visible without broken layout
- No mandatory scroll for critical purchase controls
- Monthly/Annual/Weekly cards render correctly
- Price + trial strings do not overlap in footer
- `Start 7-Day Free Trial` CTA scales on narrow screens
- Dev-only controls hidden in real user flow

### 13) Subscription
- All localized strings render (no fallback key text visible)
- Plan cards: title/subtitle/badges do not collide
- Footer legal row wraps gracefully
- Restore / Terms / Privacy actions tappable
- Success/restore modals display and route correctly

### 14) Referral
- Code apply flow works (valid/invalid)
- Supabase validation result reflected in UI
- Skip path works and keeps flow intact

### 15) Account
- First name, last name, email validation works
- Save persists and routes to dashboard
- No placeholder/avatar fallback glitches (`?` issue)

## Data/State Checks
- Fresh app launch starts clean onboarding state
- Previous onboarding answers do not auto-fill unexpectedly after reset
- Clearing onboarding data truly resets steps and defaults

## i18n Checks
- Arabic layout remains readable (no severe breakage in RTL-like content)
- Long German/Turkish strings do not break CTA/footer
- CJK strings (ja/zh-Hans/ko) remain vertically balanced

## Analytics & Purchase Checks
- Paywall view/start/success events fire once
- Subscription restore success/fail events correct
- Onboarding step view/continue/back events match route transitions

## Exit Criteria
- All critical blockers fixed:
  - Flow break
  - CTA inaccessible
  - Text clipping on key conversion screens (paywall/subscription)
  - Wrong default selections in schedule/subject steps
- No P0/P1 visual regressions on SE + 390x844 + Pro Max
