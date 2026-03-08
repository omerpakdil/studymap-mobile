import AsyncStorage from '@react-native-async-storage/async-storage';

export const SUBJECT_FOCUS_KEY = 'subject_focus_overrides_v1';
export const SUBJECT_FOCUS_PRESET_KEY = 'subject_focus_preset_v1';
export const FOCUS_MIN = -30;
export const FOCUS_MAX = 30;

export type SubjectFocusOverrides = Record<string, number>;
export type FocusPresetId = 'balanced' | 'weak_recovery' | 'exam_sprint' | 'light_mode';

const clamp = (value: number): number => Math.max(FOCUS_MIN, Math.min(FOCUS_MAX, value));

export const sanitizeOverrides = (input: SubjectFocusOverrides): SubjectFocusOverrides => {
  const sanitized: SubjectFocusOverrides = {};
  Object.keys(input).forEach((subject) => {
    const value = Number(input[subject]);
    if (!Number.isNaN(value)) {
      sanitized[subject] = clamp(value);
    }
  });
  return sanitized;
};

export const loadSubjectFocusOverrides = async (): Promise<SubjectFocusOverrides> => {
  try {
    const raw = await AsyncStorage.getItem(SUBJECT_FOCUS_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as SubjectFocusOverrides;
    return sanitizeOverrides(parsed || {});
  } catch (error) {
    console.error('❌ Error loading subject focus overrides:', error);
    return {};
  }
};

export const saveSubjectFocusOverrides = async (
  overrides: SubjectFocusOverrides
): Promise<void> => {
  try {
    const sanitized = sanitizeOverrides(overrides);
    await AsyncStorage.setItem(SUBJECT_FOCUS_KEY, JSON.stringify(sanitized));
  } catch (error) {
    console.error('❌ Error saving subject focus overrides:', error);
    throw error;
  }
};

export const getSubjectFocusMultiplier = (
  subject: string,
  overrides: SubjectFocusOverrides
): number => {
  const boostPercent = overrides[subject] || 0;
  return Math.max(0.5, Math.min(1.5, 1 + boostPercent / 100));
};

export const loadSubjectFocusPreset = async (): Promise<FocusPresetId> => {
  try {
    const raw = await AsyncStorage.getItem(SUBJECT_FOCUS_PRESET_KEY);
    if (!raw) return 'balanced';

    if (
      raw === 'balanced' ||
      raw === 'weak_recovery' ||
      raw === 'exam_sprint' ||
      raw === 'light_mode'
    ) {
      return raw;
    }

    return 'balanced';
  } catch (error) {
    console.error('❌ Error loading subject focus preset:', error);
    return 'balanced';
  }
};

export const saveSubjectFocusPreset = async (preset: FocusPresetId): Promise<void> => {
  try {
    await AsyncStorage.setItem(SUBJECT_FOCUS_PRESET_KEY, preset);
  } catch (error) {
    console.error('❌ Error saving subject focus preset:', error);
    throw error;
  }
};
