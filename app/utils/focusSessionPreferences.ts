import AsyncStorage from '@react-native-async-storage/async-storage';

import { devLog, reportError } from './logger';
import type { StudyTask } from './studyTypes';

const STORAGE_KEY = 'focus_session_preferences_v1';

type FocusSessionPreferenceMap = Record<string, number>;

type FocusSessionPreferenceInput = {
  examCode?: string;
  subject?: string;
  type?: StudyTask['type'] | string;
};

const normalizePart = (value?: string | null): string =>
  (value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');

const buildKeys = ({ examCode, subject, type }: FocusSessionPreferenceInput): string[] => {
  const normalizedExamCode = normalizePart(examCode);
  const normalizedSubject = normalizePart(subject);
  const normalizedType = normalizePart(type);

  return [
    ['exact', normalizedExamCode, normalizedSubject, normalizedType].filter(Boolean).join(':'),
    ['subject_type', normalizedSubject, normalizedType].filter(Boolean).join(':'),
    ['type', normalizedType].filter(Boolean).join(':'),
  ].filter(Boolean);
};

const loadPreferenceMap = async (): Promise<FocusSessionPreferenceMap> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    reportError('❌ Error loading focus session preferences:', error);
    return {};
  }
};

export const loadPreferredFocusDuration = async (
  input: FocusSessionPreferenceInput
): Promise<number | null> => {
  try {
    const preferences = await loadPreferenceMap();
    for (const key of buildKeys(input)) {
      const value = preferences[key];
      if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
        return value;
      }
    }
    return null;
  } catch (error) {
    reportError('❌ Error resolving preferred focus duration:', error);
    return null;
  }
};

export const savePreferredFocusDuration = async (
  input: FocusSessionPreferenceInput,
  minutes: number
): Promise<void> => {
  try {
    const preferences = await loadPreferenceMap();
    const keys = buildKeys(input);
    if (keys.length === 0) return;

    const next = { ...preferences };
    keys.forEach((key) => {
      next[key] = minutes;
    });

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    devLog('✅ Focus session preference saved:', { keys, minutes });
  } catch (error) {
    reportError('❌ Error saving focus session preference:', error);
  }
};
