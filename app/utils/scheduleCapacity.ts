import { ENABLE_TARGET_PRESSURE_ADJUSTMENTS } from '@/app/utils/planner/featureFlags';

export type StudyIntensityId = 'relaxed' | 'moderate' | 'intensive' | 'extreme';

// Each selected availability block counts as 3 hours of usable study capacity.
// This keeps onboarding math simple and matches the product rule shown to users.
export const SLOT_STUDY_CAPACITY_MINUTES: Record<string, number> = {
  early_morning: 180,
  morning: 180,
  afternoon: 180,
  evening: 180,
  night: 180,
};

export const INTENSITY_LOAD_RATIO: Record<StudyIntensityId, number> = {
  relaxed: 0.3,
  moderate: 0.5,
  intensive: 0.7,
  extreme: 0.9,
};

export const INTENSITY_SESSION_BLOCK_MINUTES: Record<StudyIntensityId, number> = {
  relaxed: 35,
  moderate: 45,
  intensive: 50,
  extreme: 60,
};

export const getWeeklyAvailableStudyMinutes = (schedule: Record<string, string[]>): number => {
  return getSelectedSlotCount(schedule) * 180;
};

export const getDailyAvailableStudyMinutes = (schedule: Record<string, string[]>): number[] => {
  return Object.values(schedule || {})
    .map((slots) => (slots?.length ?? 0) * 180)
    .filter((minutes) => minutes > 0);
};

export const getSelectedSlotCount = (schedule: Record<string, string[]>): number => {
  return Object.values(schedule || {}).reduce((sum, slots) => sum + (slots?.length ?? 0), 0);
};

export const getIntensityCapacitySummary = (
  schedule: Record<string, string[]>,
  intensity: StudyIntensityId,
  preferredSessionMinutes?: number,
  targetPressure = 0
) => {
  const ratio = INTENSITY_LOAD_RATIO[intensity];
  const weeklyAvailableMinutes = getWeeklyAvailableStudyMinutes(schedule);
  const dailyAvailableMinutes = getDailyAvailableStudyMinutes(schedule);
  const activeDays = Math.max(1, dailyAvailableMinutes.length || 3);
  const effectivePressure = ENABLE_TARGET_PRESSURE_ADJUSTMENTS
    ? Math.min(1, Math.max(0, targetPressure))
    : 0;
  const pressureMultiplier = 0.92 + effectivePressure * 0.22;
  const weeklyMinutes = Math.max(30, Math.round(weeklyAvailableMinutes * ratio * pressureMultiplier));
  const dailyMinutes = dailyAvailableMinutes.length > 0
    ? dailyAvailableMinutes.map((minutes) => Math.max(30, Math.round(minutes * ratio)))
    : [Math.round(150 * ratio), Math.round(150 * ratio), Math.round(150 * ratio)];

  const roundToHalfHour = (minutes: number) => Math.round(minutes / 30) * 30;
  const roundedWeeklyMinutes = roundToHalfHour(weeklyMinutes);
  const roundedDailyMinutes = dailyMinutes.map(roundToHalfHour);

  return {
    ratio,
    percent: Math.round(ratio * 100),
    availableWeeklyMinutes: weeklyAvailableMinutes,
    availableWeeklyHours: weeklyAvailableMinutes / 60,
    weeklyMinutes: roundedWeeklyMinutes,
    weeklyHours: roundedWeeklyMinutes / 60,
    averageDailyHours: roundedWeeklyMinutes / 60 / activeDays,
    minDailyHours: Math.min(...roundedDailyMinutes) / 60,
    maxDailyHours: Math.max(...roundedDailyMinutes) / 60,
    sessionsPerWeek: Math.max(
      1,
      Math.round(roundedWeeklyMinutes / (preferredSessionMinutes || INTENSITY_SESSION_BLOCK_MINUTES[intensity]))
    ),
    activeDays,
  };
};
