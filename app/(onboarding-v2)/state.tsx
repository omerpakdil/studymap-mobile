import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { GoalMetricType } from '@/app/data/examGoalConfigs';
import { trackOnboardingV2Event } from '@/app/utils/onboardingV2Analytics';

const STORAGE_KEY = 'onboarding_v2_draft';

export interface OnboardingV2Draft {
  countryCode: string;
  countryName: string;
  examId: string;
  examName: string;
  examDate: string;
  targetMetricType: GoalMetricType;
  targetValueRaw: string;
  targetValueNormalized: number;
  targetScore: string;
  studyIntensity: 'relaxed' | 'moderate' | 'intensive' | 'extreme';
  reminderFrequency: 'minimal' | 'moderate' | 'frequent';
  motivation: string;
  weeklyAvailability: Record<string, string[]>;
  scheduleTouched: boolean;
  subjectIntensity: Record<string, number>;
  learningStyle: {
    primaryStyle: 'visual' | 'auditory' | 'kinesthetic';
    preferences: {
      sessionLength: 'short' | 'medium' | 'long';
      breakFrequency: 'low' | 'normal' | 'high';
      studyEnvironment: 'quiet' | 'mixed' | 'ambient';
    };
  };
}

const defaultDraft: OnboardingV2Draft = {
  countryCode: '',
  countryName: '',
  examId: '',
  examName: '',
  examDate: '',
  targetMetricType: 'score',
  targetValueRaw: '',
  targetValueNormalized: 0,
  targetScore: '',
  studyIntensity: 'moderate',
  reminderFrequency: 'moderate',
  motivation: '',
  weeklyAvailability: {},
  scheduleTouched: false,
  subjectIntensity: {},
  learningStyle: {
    primaryStyle: 'visual',
    preferences: {
      sessionLength: 'medium',
      breakFrequency: 'normal',
      studyEnvironment: 'quiet',
    },
  },
};

interface OnboardingV2ContextValue {
  draft: OnboardingV2Draft;
  loading: boolean;
  updateDraft: (partial: Partial<OnboardingV2Draft>) => void;
  resetDraft: () => Promise<void>;
}

const OnboardingV2Context = createContext<OnboardingV2ContextValue | undefined>(undefined);

export function OnboardingV2Provider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<OnboardingV2Draft>(defaultDraft);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDraft = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as OnboardingV2Draft;
          setDraft({ ...defaultDraft, ...parsed });
        }
      } catch (error) {
        console.error('❌ Failed to load onboarding v2 draft:', error);
        void trackOnboardingV2Event('onboarding_draft_load_fail', { reason: String(error) });
      } finally {
        setLoading(false);
      }
    };

    loadDraft();
  }, []);

  const updateDraft = (partial: Partial<OnboardingV2Draft>) => {
    setDraft((prev) => {
      const next = { ...prev, ...partial };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch((error) => {
        console.error('❌ Failed to persist onboarding v2 draft:', error);
        void trackOnboardingV2Event('onboarding_draft_save_fail', { reason: String(error) });
      });
      return next;
    });
  };

  const resetDraft = async () => {
    setDraft(defaultDraft);
    await AsyncStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(
    () => ({ draft, loading, updateDraft, resetDraft }),
    [draft, loading]
  );

  return <OnboardingV2Context.Provider value={value}>{children}</OnboardingV2Context.Provider>;
}

export const useOnboardingV2 = () => {
  const ctx = useContext(OnboardingV2Context);
  if (!ctx) {
    throw new Error('useOnboardingV2 must be used within OnboardingV2Provider');
  }
  return ctx;
};
