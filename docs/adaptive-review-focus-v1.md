# Adaptive Review + Focus Feedback V1

## Goal

StudyMap should stop being only a planner and start becoming an adaptive execution system.

V1 adds a feedback loop after each study session:

1. user starts a task
2. user finishes or exits the focus block
3. user gives a short outcome signal
4. StudyMap schedules smarter review pressure
5. the next generated plan uses that signal

This sits on top of the current rule-based planner. It does not replace the planner.

## What exists today

### Already present

1. `study-session.tsx`
   - timer
   - notes
   - session completion modal

2. planner adaptation
   - weekly rebalance
   - overdue carry
   - completion-rate-based subject boost

3. task model
   - `StudyTask`
   - `study/practice/review/quiz`

### Missing

1. no session-level learning outcome
2. no review scheduling from user difficulty
3. no per-task retention signal
4. no explicit "did not finish" vs "finished but hard" distinction
5. no focus analytics beyond completion

## Product decision

V1 should add one short post-session question:

- `Easy`
- `Okay`
- `Hard`
- `Didn't finish`

This is the core signal.

Notes:

1. No free-form rating scale.
2. No 1-10 score.
3. No "topic" discussion in UI.
4. Feedback happens after a focus block, not before.

## Why this matters

Current planner adapts around workload.
V1 makes it adapt around learning difficulty.

That changes the product from:

- "I planned your week"

to:

- "I noticed where you struggled and adjusted your review automatically"

## V1 user flow

### A. Starting a session

Entry points:

1. dashboard task card
2. calendar task card
3. future deep link from reminders

Session opens in `study-session.tsx`.

### B. During session

The screen keeps:

1. timer
2. notes
3. complete session CTA

V1 adds:

1. selected focus preset
   - `Quick 25`
   - `Standard 45`
   - `Deep 60`
   - `Deep 90`

These are optional presets, not a full redesign.

### C. Ending a session

When the user taps `Complete Session`, show outcome sheet:

1. `Easy`
2. `Okay`
3. `Hard`
4. `Didn't finish`

Optional secondary toggles:

1. `Need review soon`
2. `Want shorter block next time`

V1 can ship without the secondary toggles. The primary 4 options are enough.

### D. Planner reaction

The chosen outcome writes a feedback record.
That record increases or decreases review pressure.

Examples:

1. `Easy`
   - no urgent review
   - slower follow-up

2. `Okay`
   - normal review schedule

3. `Hard`
   - faster review insertion
   - slightly higher review weight for that subject

4. `Didn't finish`
   - carry-forward
   - shorter next block if needed
   - strong short-term review bias

## Data model

### New record: `StudySessionFeedback`

Suggested shape:

```ts
type SessionOutcome = 'easy' | 'okay' | 'hard' | 'incomplete';

type StudySessionFeedback = {
  taskId: string;
  sessionId: string;
  subject: string;
  examCode?: string;
  outcome: SessionOutcome;
  plannedMinutes: number;
  actualMinutes: number;
  completed: boolean;
  createdAt: string;
  noteLength?: number;
};
```

### Storage

V1 local:

- AsyncStorage key: `study_session_feedback_v1`

Later:

- sync to Supabase for cross-device continuity

## Planner integration

### New derived profile: `ReviewPressureProfile`

Per subject:

```ts
type ReviewPressureProfile = Record<string, {
  hardCount: number;
  incompleteCount: number;
  easyCount: number;
  recentOutcomeScore: number;
  shortTermReviewBoost: number;
  shorterBlockBias: number;
}>;
```

### Outcome weights

Recommended first-pass weights:

1. `easy` = `-0.15`
2. `okay` = `0`
3. `hard` = `+0.45`
4. `incomplete` = `+0.70`

### How it affects planning

For a subject with recent hard/incomplete outcomes:

1. boost `review`
2. mild boost `practice`
3. reduce long `study` blocks if incomplete repeats
4. prefer sooner re-entry

### Time windows

V1 review timing policy:

1. `hard`
   - review ideally within `1-3 days`

2. `incomplete`
   - re-entry within `1-2 days`

3. `okay`
   - normal planner cadence

4. `easy`
   - no urgency boost

## Focus mode scope

V1 does not require a brand new mode.
It upgrades the existing `study-session` screen.

### Focus Mode V1 includes

1. timer presets
2. outcome sheet after completion
3. actual minutes tracking
4. interruption-safe completion state

### Not in V1

1. app blocking
2. white noise / ambient sound
3. deep distraction controls
4. live widget / live activity

Those are V2 or later.

## UI changes

### `study-session.tsx`

Add:

1. preset selector above timer or in duration modal
2. session completion bottom sheet
3. outcome chips with very low cognitive load

Keep:

1. overall visual style
2. notes tab
3. completion success modal

### Dashboard / calendar

No major UI change required for V1.

Optional later:

1. tiny "review due soon" badge
2. "adapted" marker on rescheduled tasks

## Notifications connection

This should later connect to the new notification system.

Examples:

1. after `hard`
   - "A short review block is ready tomorrow."

2. after repeated `incomplete`
   - "We shortened your next block to make re-entry easier."

Not required for V1 implementation.

## Analytics

Track:

1. `focus_session_started`
2. `focus_session_completed`
3. `focus_session_outcome_selected`
4. `focus_session_duration_changed`
5. `adaptive_review_boost_applied`

Minimum payload:

1. `exam_code`
2. `subject`
3. `task_type`
4. `planned_minutes`
5. `actual_minutes`
6. `outcome`

## Rollout plan

### Sprint 1

Add feedback data model and storage.

Scope:

1. `StudySessionFeedback` type
2. AsyncStorage helpers
3. actual minutes capture
4. completion outcome sheet

### Sprint 2

Integrate review pressure into planner.

Scope:

1. derive `ReviewPressureProfile`
2. boost `review/practice`
3. shorten block bias after incomplete streaks
4. explainability hook for "extra review due to recent difficulty"

### Sprint 3

Polish focus UX.

Scope:

1. duration presets
2. resume behavior
3. analytics
4. optional dashboard markers

## Technical integration points

### Files to touch first

1. `app/study-session.tsx`
2. `app/utils/studyTypes.ts`
3. `app/utils/studyProgramStorage.ts`
4. `app/utils/planner/ruleBasedStudyGenerator.ts`

### Suggested new files

1. `app/utils/focusSessionFeedback.ts`
2. `app/types/focus.ts`

## V1 success criteria

1. User can finish a session and choose an outcome in under 3 seconds.
2. Planner can increase short-term review when difficulty is high.
3. Repeated incomplete sessions result in shorter re-entry blocks.
4. No new scroll-heavy UI is introduced.
5. Existing study plan generation stays deterministic and debuggable.

## Recommendation

Build this in order:

1. feedback data capture
2. planner review pressure integration
3. focus timer preset polish

That order gives the biggest product lift with the lowest implementation risk.
