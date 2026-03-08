import type { OnboardingData } from './onboardingData';
import { availableExams } from '@/app/data';
import type { GoalMetricType } from '@/app/data/examGoalConfigs';
import { resolveTargetModel } from '@/app/utils/targetMetric';
import {
  markOnboardingComplete,
  saveExamData,
  saveGoalsData,
  saveLearningStyleData,
  saveScheduleData,
  saveSubjectIntensity,
} from './onboardingData';

export type StudyIntensity = 'relaxed' | 'moderate' | 'intensive' | 'extreme';

export interface WeeklyAvailability {
  [day: string]: string[];
}

export interface OnboardingSnapshotV2 {
  countryCode: string;
  countryName: string;
  examId: string;
  examName: string;
  examDate: string;
  targetMetricType: GoalMetricType;
  targetValueRaw: string;
  targetValueNormalized: number;
  targetScore: string;
  studyIntensity: StudyIntensity;
  reminderFrequency: string;
  motivation: string;
  subjectIntensity: Record<string, number>;
  weeklyAvailability: WeeklyAvailability;
  learningStyle: OnboardingData['learningStyleData'];
  createdAt: string;
}

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

export const validateOnboardingV2 = (snapshot: OnboardingSnapshotV2): ValidationResult => {
  if (!snapshot.countryCode) {
    return { valid: false, reason: 'Missing country selection' };
  }

  if (!snapshot.examId || !snapshot.examName) {
    return { valid: false, reason: 'Missing exam selection' };
  }

  if (!snapshot.examDate) {
    return { valid: false, reason: 'Missing exam date' };
  }

  if (!(snapshot.targetValueRaw || snapshot.targetScore)) {
    return { valid: false, reason: 'Missing target metric value' };
  }

  if (Object.keys(snapshot.weeklyAvailability).length === 0) {
    return { valid: false, reason: 'Missing weekly availability' };
  }

  if (Object.keys(snapshot.subjectIntensity).length === 0) {
    return { valid: false, reason: 'Missing subject intensity data' };
  }

  return { valid: true };
};

export const migrateLegacyOnboardingToV2 = (legacy: OnboardingData): OnboardingSnapshotV2 => {
  const studyIntensity = (legacy.goalsData?.studyIntensity || 'moderate') as StudyIntensity;
  const examId = legacy.examData?.id || 'sat';
  const legacyTarget = legacy.goalsData?.targetScore || '';
  const targetModel = resolveTargetModel(examId, legacyTarget);

  return {
    countryCode: 'US',
    countryName: 'United States',
    examId,
    examName: legacy.examData?.name || 'SAT',
    examDate: legacy.goalsData?.examDate || '',
    targetMetricType: targetModel.metricType,
    targetValueRaw: targetModel.raw,
    targetValueNormalized: targetModel.normalized,
    targetScore: legacyTarget,
    studyIntensity,
    reminderFrequency: legacy.goalsData?.reminderFrequency || 'moderate',
    motivation: legacy.goalsData?.motivation || '',
    subjectIntensity: legacy.subjectIntensity || {},
    weeklyAvailability: legacy.scheduleData || {},
    learningStyle: legacy.learningStyleData || null,
    createdAt: legacy.completedAt || new Date().toISOString(),
  };
};

export const toLegacyOnboardingData = (snapshot: OnboardingSnapshotV2): OnboardingData => {
  const selectedExam = availableExams.find((exam) => exam.id === snapshot.examId);

  return {
    examData: {
      id: snapshot.examId,
      name: snapshot.examName,
      fullName: selectedExam?.fullName || snapshot.examName,
      subjects: Object.keys(snapshot.subjectIntensity),
    },
    subjectIntensity: snapshot.subjectIntensity,
    goalsData: {
      examDate: snapshot.examDate,
      targetScore: snapshot.targetValueRaw || snapshot.targetScore,
      studyIntensity: snapshot.studyIntensity,
      reminderFrequency: snapshot.reminderFrequency,
      motivation: snapshot.motivation,
    },
    scheduleData: snapshot.weeklyAvailability,
    learningStyleData: snapshot.learningStyle || null,
    completedAt: snapshot.createdAt || new Date().toISOString(),
    isComplete: true,
  };
};

export const persistOnboardingV2ToLegacyStorage = async (
  snapshot: OnboardingSnapshotV2
): Promise<void> => {
  const selectedExam = availableExams.find((exam) => exam.id === snapshot.examId);

  await saveExamData({
    id: snapshot.examId,
    name: snapshot.examName,
    fullName: selectedExam?.fullName || snapshot.examName,
    subjects: Object.keys(snapshot.subjectIntensity),
  });

  await saveSubjectIntensity(snapshot.subjectIntensity);
  await saveScheduleData(snapshot.weeklyAvailability);
  await saveGoalsData({
    examDate: snapshot.examDate,
    targetScore: snapshot.targetValueRaw || snapshot.targetScore,
    studyIntensity: snapshot.studyIntensity,
    reminderFrequency: snapshot.reminderFrequency,
    motivation: snapshot.motivation,
  });

  if (snapshot.learningStyle) {
    await saveLearningStyleData(snapshot.learningStyle);
  }

  await markOnboardingComplete();
};
