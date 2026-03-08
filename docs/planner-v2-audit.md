# Planner V2 Audit

## Current generator

Relevant files:
- `app/utils/planner/ruleBasedStudyGenerator.ts`
- `app/utils/planner/plannerInputMapper.ts`
- `app/data/examBlueprints.ts`
- `app/data/examGoalConfigs.ts`

## Primary findings

### 1. Subject planning is too shallow

The planner uses only top-level subject names from onboarding and blueprint labels.

Current behavior:
- `PlannerInput.subjects` is just a list of subject labels.
- `generateTasks()` picks a subject name and emits a generic task title:
  - `"${subject}: Study Session"`
  - `"${subject}: Practice Session"`

Impact:
- The plan does not progress through modules.
- The same subject can repeat without any internal learning path.
- Exam-specific blueprint `modules` and `focusSkills` are currently not used by the generator.

Files:
- `app/utils/planner/plannerInputMapper.ts`
- `app/utils/planner/ruleBasedStudyGenerator.ts`
- `app/data/examBlueprints.ts`

### 2. Session type selection is phase-only, not exam-aware or subject-aware

Current behavior:
- Task type is selected only by `PHASE_CONFIG[phase].typeWeights`.
- Subject type, exam type, module type, and slot length are ignored.

Impact:
- IELTS speaking can receive the same generic type distribution as KPSS or LSAT.
- Reading-heavy, writing-heavy, memory-heavy, and drill-heavy subjects are not differentiated enough.

Files:
- `app/utils/planner/ruleBasedStudyGenerator.ts`

### 3. Task duration logic ignores slot fit and exam rules

Current behavior:
- Duration comes from `PHASE_CONFIG[phase].sessionDuration + durationBias`.
- Then durations are rounded to standard blocks.
- Slot count affects `tasksForDay`, but slot length and task-to-slot fit are not modeled.

Impact:
- A short slot and a long slot can receive the same task duration policy.
- Exam blueprint `recommendedSessionMinutes` is defined but not used.

Files:
- `app/utils/planner/ruleBasedStudyGenerator.ts`
- `app/data/examBlueprints.ts`

### 4. Weekly hour calculation is too coarse

Current behavior:
- Weekly hours are derived from:
  - total selected slots
  - intensity multiplier
  - target pressure multiplier

Ignored inputs:
- exam blueprint min/max hours
- actual slot composition
- time horizon / phase profile

Impact:
- Weekly load is plausible, but not strongly exam-shaped.
- Two exams with very different task structures can get very similar hour outputs.

Files:
- `app/utils/planner/plannerInputMapper.ts`
- `app/data/examBlueprints.ts`

### 5. Phases are global, not exam-specific

Current behavior:
- There are only 4 phases:
  - foundation
  - build
  - consolidation
  - final
- `getPhaseForDay()` uses fixed thresholds.

Ignored inputs:
- blueprint `difficultyCurve`
- exam-specific phase proportions

Impact:
- Language exams, rank exams, and pass/fail professional exams all use the same phase geometry.

Files:
- `app/utils/planner/ruleBasedStudyGenerator.ts`
- `app/data/examBlueprints.ts`

### 6. Priority model is underpowered

Current behavior:
- Subject score uses:
  - subject intensity
  - focus override multiplier
  - freshness boost
  - fatigue penalty

Missing:
- exam weight
- target gap pressure per subject
- module completion state
- weak/strong retention strategy

Impact:
- It rotates subjects reasonably, but does not truly optimize a plan.

Files:
- `app/utils/planner/ruleBasedStudyGenerator.ts`

### 7. Plan output is not explainable enough

Current behavior:
- A task is produced, but there is no machine-readable reason attached.

Impact:
- Hard to debug planner quality.
- Hard to explain to users why a subject/task was scheduled.

Files:
- `app/utils/studyTypes.ts`
- `app/utils/planner/ruleBasedStudyGenerator.ts`

## Recommended Planner V2

## Naming policy

Planner V2 should stay at **module level**, not micro-topic level.

Allowed:
- `Algebra`
- `Reading Comprehension`
- `Organic Chemistry`
- `Grand oral`

Not allowed:
- highly specific subtopics that imply false precision
- fragile topic names that vary by country, board, or curriculum edition

Rule:
- task titles may expose `subject + safe module label`
- planner should not generate deep subtopic names unless curriculum data is proven reliable

### Step 1. Introduce module-aware planning

Add module progression per subject:
- subject -> modules -> tasks

Planner should schedule:
- module study
- module review
- timed drill
- mixed review
- mock

Use blueprint fields already present:
- `modules`
- `focusSkills`

### Step 2. Introduce exam-aware task templates

Add task templates per session type and exam family:
- `topic_study`
- `review_block`
- `timed_drill`
- `mock_set`
- `error_review`
- `speaking_drill`
- `essay_block`
- `memory_recall`

Examples:
- IELTS speaking -> speaking drill + self-review
- LSAT LR -> timed drill + blind review
- KPSS GY-GK -> topic study + mixed question set

### Step 3. Replace phase-only type weights with a scoring model

Candidate task score should combine:
- subject exam weight
- onboarding intensity
- focus override
- recency/freshness
- module urgency
- phase fit
- exam proximity
- slot fit

Then select top tasks per day instead of random weighted picks.

### Step 4. Use blueprint weekly rules for load shaping

Actually consume:
- `minHours`
- `maxHours`
- `minReviewRatio`
- `mockFrequencyDays`
- `recommendedSessionMinutes`

### Step 5. Make phases exam-specific

Use `difficultyCurve` and exam family profiles to generate phase windows.

Examples:
- language exams -> practice earlier
- rank exams -> mocks and timed sections later but longer
- professional pass exams -> review ratio higher

### Step 6. Add weekly rebalance engine

Future weekly adaptation should use:
- completed ratio
- missed ratio
- subject drift
- overload protection
- proximity to exam

### Step 7. Add explainability

Each task should optionally include:
- `reasonCodes`
- `sourceModule`
- `phase`

This enables:
- planner debugging
- user-facing rationale
- analytics

## Recommended implementation order

1. Module-aware task generation
2. Exam-aware task templates
3. Slot-fit duration policy
4. Exam-specific phase engine
5. Scoring-based task selection
6. Weekly rebalance
7. Explainability fields

## First concrete sprint

### Sprint A

Scope:
- extend `PlannerInput`
- introduce module progress state
- replace generic task title generation
- use blueprint modules and recommended minutes

Target outputs:
- more realistic task names
- less repetitive plans
- better exam-specific structure without rewriting the whole planner at once
