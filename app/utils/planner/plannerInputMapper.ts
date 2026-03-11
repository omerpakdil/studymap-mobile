import { getCurriculumByExamId } from '@/app/data';
import { getCountryByCode } from '@/app/data/countries';
import { getBlueprintByExamCode, type ExamSubjectBlueprint, type SessionType } from '@/app/data/examBlueprints';
import { resolveAppLanguage } from '@/app/i18n';
import { getDateFormatByLanguage } from '@/app/utils/localeDate';
import type { GoalMetricType } from '@/app/data/examGoalConfigs';
import { getIntensityCapacitySummary, type StudyIntensityId } from '@/app/utils/scheduleCapacity';
import { resolveTargetModel } from '@/app/utils/targetMetric';

import type { OnboardingSnapshotV2 } from '../onboardingV2';

export interface PlannerInput {
  examId: string;
  examName: string;
  examDate: Date;
  startDate: Date;
  totalDays: number;
  subjects: string[];
  subjectBlueprints: ExamSubjectBlueprint[];
  subjectIntensity: Record<string, number>;
  schedule: Record<string, string[]>;
  weeklyHours: number;
  targetMetricType: GoalMetricType;
  targetValueRaw: string;
  targetValueNormalized: number;
  preferredSessionMinutes: 25 | 45 | 60 | 90;
  sessionTypes: SessionType[];
  recommendedSessionMinutes: [number, number];
  minReviewRatio: number;
  mockFrequencyDays: number;
}

const toValidDate = (year: number, month: number, day: number): Date | null => {
  if (
    Number.isNaN(month) ||
    Number.isNaN(day) ||
    Number.isNaN(year) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    year < 1000
  ) {
    return null;
  }
  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }
  return parsed;
};

const parseExamDate = (dateString: string, preferredOrder: 'MDY' | 'DMY' | 'YMD' = 'MDY'): Date | null => {
  if (!dateString?.trim()) return null;
  const raw = dateString.trim();

  // ISO-like inputs (e.g. 2026-08-19 or full ISO timestamp)
  if (raw.includes('-') || raw.includes('T')) {
    const isoDate = new Date(raw);
    if (!Number.isNaN(isoDate.getTime())) {
      return new Date(isoDate.getFullYear(), isoDate.getMonth(), isoDate.getDate());
    }
  }

  const parts = raw.split(/\D+/).filter(Boolean).map((v) => parseInt(v, 10));
  if (parts.length !== 3) return null;

  const [a, b, c] = parts;
  const candidates: [number, number, number][] = [];
  const hasDot = raw.includes('.');

  // YYYY/MM/DD
  if (a >= 1000) {
    candidates.push([a, b, c]);
  }

  // Numeric day/month heuristics
  if (a > 12 && c >= 1000) {
    candidates.push([c, b, a]); // DMY
  }
  if (b > 12 && c >= 1000) {
    candidates.push([c, a, b]); // MDY
  }

  // Ambiguous formats (respect active locale order first)
  if (c >= 1000) {
    if (hasDot) {
      candidates.push([c, b, a]); // D.M.Y
      candidates.push([c, a, b]); // M.D.Y fallback
    } else {
      if (preferredOrder === 'DMY') {
        candidates.push([c, b, a]); // D/M/Y
        candidates.push([c, a, b]); // M/D/Y fallback
      } else {
        candidates.push([c, a, b]); // M/D/Y
        candidates.push([c, b, a]); // D/M/Y fallback
      }
    }
  }

  for (const [year, month, day] of candidates) {
    const parsed = toValidDate(year, month, day);
    if (parsed) return parsed;
  }

  return null;
};

const calculateWeeklyHours = (
  schedule: Record<string, string[]>,
  intensity: OnboardingSnapshotV2['studyIntensity'],
  targetPressure: number
): number => {
  const summary = getIntensityCapacitySummary(
    schedule,
    intensity as StudyIntensityId,
    45,
    targetPressure
  );
  return Math.max(5, Math.min(60, Math.round(summary.weeklyHours)));
};

const getRecommendedSessionRange = (
  preferredSessionMinutes: 25 | 45 | 60 | 90,
  blueprintRange?: [number, number]
): [number, number] => {
  const defaultRange: [number, number] = blueprintRange ?? [45, 90];
  const min = Math.max(defaultRange[0], preferredSessionMinutes - 10);
  const max = Math.min(defaultRange[1], preferredSessionMinutes + 15);
  return [Math.min(min, preferredSessionMinutes), Math.max(max, preferredSessionMinutes)];
};

const getNextStudyDay = (schedule: Record<string, string[]>, from: Date): Date => {
  const studyDays = Object.keys(schedule).filter((day) => (schedule[day] || []).length > 0);
  if (studyDays.length === 0) return new Date(from);

  const map: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };

  const dayNumbers = studyDays.map((d) => map[d.toLowerCase()]).filter((n) => n !== undefined);
  const current = new Date(from);

  if (dayNumbers.includes(current.getDay())) return current;

  for (let i = 1; i <= 7; i += 1) {
    const next = new Date(current);
    next.setDate(current.getDate() + i);
    if (dayNumbers.includes(next.getDay())) return next;
  }

  return current;
};

export const mapOnboardingV2ToPlannerInput = (snapshot: OnboardingSnapshotV2): PlannerInput => {
  const lang = resolveAppLanguage({
    countryDefaultLanguage: getCountryByCode(snapshot.countryCode)?.defaultLanguage ?? null,
  });
  const preferredOrder = getDateFormatByLanguage(lang).order;
  const examDate = parseExamDate(snapshot.examDate, preferredOrder);
  if (!examDate) {
    throw new Error('Invalid exam date format.');
  }

  const today = new Date();
  const totalDays = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (totalDays <= 0) {
    throw new Error('Exam date must be in the future.');
  }

  const curriculum = getCurriculumByExamId(snapshot.examId);
  const blueprint = getBlueprintByExamCode(snapshot.examId);
  const subjects = curriculum?.subjects.map((subject) => subject.name)
    || blueprint?.subjects.map((subject) => subject.label)
    || [];
  const subjectBlueprints = blueprint?.subjects ?? subjects.map((subject) => ({
    id: subject.toLowerCase().replace(/\W+/g, '_'),
    label: subject,
    weight: 1 / Math.max(1, subjects.length),
    intensityBias: 0,
    modules: [subject.toLowerCase().replace(/\W+/g, '_')],
    focusSkills: ['consistency'],
  }));

  if (subjects.length === 0) {
    throw new Error(`No curriculum found for exam id: ${snapshot.examId}`);
  }

  const target = resolveTargetModel(snapshot.examId, snapshot.targetValueRaw || snapshot.targetScore);
  const targetValueNormalized = typeof snapshot.targetValueNormalized === 'number'
    ? snapshot.targetValueNormalized
    : target.normalized;

  return {
    examId: snapshot.examId,
    examName: snapshot.examName,
    examDate,
    startDate: getNextStudyDay(snapshot.weeklyAvailability, today),
    totalDays,
    subjects,
    subjectBlueprints,
    subjectIntensity: snapshot.subjectIntensity,
    schedule: snapshot.weeklyAvailability,
    weeklyHours: calculateWeeklyHours(snapshot.weeklyAvailability, snapshot.studyIntensity, targetValueNormalized),
    targetMetricType: snapshot.targetMetricType || target.metricType,
    targetValueRaw: snapshot.targetValueRaw || snapshot.targetScore || target.raw,
    targetValueNormalized,
    preferredSessionMinutes: snapshot.preferredSessionMinutes,
    sessionTypes: blueprint?.sessionTypes ?? ['study', 'review', 'practice', 'quiz'],
    recommendedSessionMinutes: getRecommendedSessionRange(
      snapshot.preferredSessionMinutes,
      blueprint?.weeklyRules.recommendedSessionMinutes
    ),
    minReviewRatio: blueprint?.weeklyRules.minReviewRatio ?? 0.25,
    mockFrequencyDays: blueprint?.weeklyRules.mockFrequencyDays ?? 14,
  };
};
