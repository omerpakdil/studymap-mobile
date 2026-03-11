import AsyncStorage from '@react-native-async-storage/async-storage';

import { devLog, reportError } from './logger';
import type { StudySessionFeedback } from './studyTypes';

const STORAGE_KEY = 'study_session_feedback_v1';

export type AdaptiveReviewSignal = {
  active: boolean;
  hardCount: number;
  incompleteCount: number;
  affectedSubjects: string[];
  recentCount: number;
};

export const loadStudySessionFeedback = async (): Promise<StudySessionFeedback[]> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    reportError('❌ Error loading study session feedback:', error);
    return [];
  }
};

export const saveStudySessionFeedback = async (entry: StudySessionFeedback): Promise<void> => {
  try {
    const existing = await loadStudySessionFeedback();
    const next = [entry, ...existing].slice(0, 500);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    devLog('✅ Study session feedback saved:', {
      taskId: entry.taskId,
      outcome: entry.outcome,
      actualMinutes: entry.actualMinutes,
    });
  } catch (error) {
    reportError('❌ Error saving study session feedback:', error);
    throw error;
  }
};

export const getAdaptiveReviewSignal = async (
  lookbackDays = 14
): Promise<AdaptiveReviewSignal> => {
  try {
    const feedback = await loadStudySessionFeedback();
    if (!feedback.length) {
      return { active: false, hardCount: 0, incompleteCount: 0, affectedSubjects: [], recentCount: 0 };
    }

    const cutoff = Date.now() - lookbackDays * 24 * 60 * 60 * 1000;
    const relevant = feedback.filter((entry) => {
      const createdAt = new Date(entry.createdAt).getTime();
      return Number.isFinite(createdAt) && createdAt >= cutoff;
    });

    const pressureEntries = relevant.filter(
      (entry) => entry.outcome === 'hard' || entry.outcome === 'incomplete'
    );

    const subjectCounts = pressureEntries.reduce<Record<string, number>>((acc, entry) => {
      acc[entry.subject] = (acc[entry.subject] || 0) + 1;
      return acc;
    }, {});

    const maxSubjectPressure = Math.max(0, ...Object.values(subjectCounts));
    const hardCount = pressureEntries.filter((entry) => entry.outcome === 'hard').length;
    const incompleteCount = pressureEntries.filter((entry) => entry.outcome === 'incomplete').length;

    const affectedSubjects = Object.entries(subjectCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([subject]) => subject)
      .slice(0, 3);

    // Do not surface adaptive review too early.
    // Require either repeated pressure on the same subject after enough sessions,
    // or a clearer overall pattern across recent sessions.
    const active =
      pressureEntries.length >= 3 ||
      (pressureEntries.length >= 2 && maxSubjectPressure >= 2 && relevant.length >= 4);

    return {
      active,
      hardCount,
      incompleteCount,
      affectedSubjects,
      recentCount: relevant.length,
    };
  } catch (error) {
    reportError('❌ Error getting adaptive review signal:', error);
    return { active: false, hardCount: 0, incompleteCount: 0, affectedSubjects: [], recentCount: 0 };
  }
};
