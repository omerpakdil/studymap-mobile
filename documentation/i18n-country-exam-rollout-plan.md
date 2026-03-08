# i18n + Country-Based Exam Blueprint Rollout Plan

## Goal
Build a scalable localization and country-aware exam system so onboarding and plan generation adapt to:
- user language (auto-detected, overrideable)
- user country (auto-detected, confirm/edit)
- selected exam blueprint (subjects + weekly planning rules)

## Scope
- 11 languages: `en`, `zh-Hans`, `ja`, `pt-BR`, `ko`, `de`, `tr`, `ar`, `fr`, `id`, `hi` (+ `en-IN` copy variant)
- 13 countries: `US`, `CN`, `JP`, `IN`, `BR`, `KR`, `DE`, `UK`, `ID`, `FR`, `CA`, `TR`, `SA`
- Country-based exam catalogs
- Exam-specific subject blueprints powering planner generation

## Product Rules
1. Language is auto-detected from device locale.
2. Country is auto-detected from device region and confirmed/edited in onboarding.
3. Exam list is filtered by selected country.
4. Study plan is generated from selected exam blueprint.
5. No hardcoded UI text; all strings come from i18n keys.

## Architecture

### i18n
- Stack: `i18next`, `react-i18next`, `expo-localization`
- Fallback chain:
  - Language: `user_override > device_locale > base_lang > en`
  - Country: `user_selected_country > device_region > US`
- RTL support required for `ar`

### Data Layer
- `app/data/countries.ts`
- `app/data/examCatalogByCountry.ts`
- `app/data/examBlueprints.ts`
- `app/i18n/locales/{lang}/{namespace}.json`

### Planner Inputs/Outputs
- Inputs: `countryCode`, `examCode`, `examCategory`, `targetDate`, `targetScore`, `weeklyAvailability`
- Outputs: `subjectDistribution`, `weeklySessions`, `sessionTypes`, `reviewCadence`

## V1 Country Exam Coverage (5-6 exams each)

### CN
Gaokao, Kaoyan, Guokao, China CPA, National Bar, HSK

### JP
Common Test, elite university track exams, National Bar, Civil Service, JLPT, Medical Licensing

### IN
JEE, NEET, UPSC, CAT, GATE, CA Final

### BR
ENEM, Vestibular, OAB, ENADE, IELTS, TOEFL

### KR
Suneung, GSAT, PSAT, Bar Exam, TOPIK, Medical Licensing

### DE
Abitur, Staatsexamen, TestDaF, NC-track prep, Steuerberaterprüfung, Zweites Staatsexamen

### UK
A-Levels, UCAT/BMAT-track, LNAT, SQE, ACCA/ICAEW, IELTS

### ID
UTBK-SNBT, CPNS (SKD/SKB), UKMPPD, CPA Indonesia, IELTS, TOEFL

### FR
Baccalauréat, Concours Grandes Écoles, Polytechnique track, INSP/ENA track, CRFPA/Barreau, DELF/DALF

### CA
MCAT, LSAT, MCCQE, CPA Canada, NCA/Bar, IELTS/TOEFL

### TR
YKS (TYT/AYT/YDT), KPSS, ALES, YDS/YÖKDİL, DUS, TUS

### SA
Qudrat, Tahsili, SCFHS exams, Saudi Bar, CMA Saudi, IELTS/TOEFL

### US
Existing catalog already present; only map into new architecture.

## Exam Blueprint Model (V1)
Each exam blueprint includes:
- `subjects[]`: `id`, `labelKey`, `weight`
- `sessionTypes[]`: `study`, `review`, `practice`, `quiz`, `mock`
- `weeklyRules`: `minHours`, `maxHours`, `minReviewRatio`, `mockFrequency`
- `difficultyCurve`: `foundationWeeks`, `buildWeeks`, `peakWeeks`

## Updated Onboarding Flow
1. animated-splash
2. intro
3. country-select (auto-detected + confirm/edit)
4. goal-exam (country-filtered + categories)
5. goal-date
6. goal-score
7. goal-intensity
8. schedule
9. focus
10. learning-style
11. plan-preview
12. referral
13. paywall
14. account

## Sprint Plan

### Sprint 1 (Foundation)
1. i18n setup + locale resolver
2. data scaffolding for country/exam/blueprints
3. country-select screen + onboarding state wiring

### Sprint 2 (Planner Integration)
1. country-driven `goal-exam`
2. blueprint-based subject distribution
3. blueprint summary in `plan-preview`

### Sprint 3 (Onboarding Localization)
1. localize all onboarding-v2 screens (11 languages)
2. RTL pass for Arabic
3. overflow fixes for long languages

### Sprint 4 (Core App Localization)
1. localize dashboard/calendar/progress/profile
2. localize alerts/errors/empty states
3. add settings for language/country override

### Sprint 5 (Monetization + QA)
1. locale-country paywall copy calibration
2. conversion analytics by locale/country/exam
3. full QA matrix and release prep

## QA Matrix
- Devices: iPhone SE, 13/14, Pro Max
- Languages: all 11
- Countries: all 13
- Checks: text overflow, RTL, fallbacks, country-exam correctness, planner subject correctness

## KPI Tracking
1. country confirm completion rate
2. exam select drop-off
3. onboarding completion by `country+language`
4. paywall view -> trial start
5. trial -> paid conversion
6. D7 retention by `country+language+exam`

## Risks / Mitigations
1. Translation delays -> staged rollout + English fallback
2. Wrong country detection -> explicit confirm/edit step
3. Catalog complexity -> strict V1 cap (5-6 exams/country)
4. RTL regressions -> dedicated Arabic QA checklist

## Immediate Next Action
Start Sprint 1 implementation:
1. i18n core
2. country/exam/blueprint data files
3. country-select screen + state integration
