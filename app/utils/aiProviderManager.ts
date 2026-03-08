import { OnboardingData } from './onboardingData';
import { generateStudyProgramWithRules, type ProgressCallback } from './planner/ruleBasedStudyGenerator';
import type { StudyProgram, StudyTask } from './studyTypes';
import { generateStudyContent as generateLocalStudyContent, type ContentItem } from './contentGenerator';

const DEFAULT_PROVIDER = 'rule_engine' as const;

export type AIProvider = typeof DEFAULT_PROVIDER;

export const getCurrentAIProvider = async (): Promise<AIProvider> => DEFAULT_PROVIDER;

export type { ProgressCallback };

export const generateStudyProgram = async (
  onboardingData: OnboardingData,
  onProgress?: ProgressCallback
): Promise<StudyProgram | null> => {
  try {
    console.log('Generating study program with rule engine');
    return await generateStudyProgramWithRules(onboardingData, onProgress);
  } catch (error) {
    console.error('Error generating study program with rules:', error);
    return null;
  }
};

export const generateStudyContent = async (params: {
  examId: string;
  subject: string;
  topic?: string;
  sessionType: 'Practice' | 'Study' | 'Review';
  duration: number;
}): Promise<ContentItem[]> => {
  try {
    return await generateLocalStudyContent({
      examId: params.examId,
      subject: params.subject,
      sessionType: params.sessionType,
      duration: params.duration,
    });
  } catch (error) {
    console.error('Error generating study content:', error);
    return [];
  }
};

export const testAIProvider = async (): Promise<{ success: boolean; message: string }> => ({
  success: true,
  message: 'Rule-based engine is active',
});

export const getAIProviderStatus = async (): Promise<{
  available: boolean;
  lastTested: string;
}> => ({
  available: true,
  lastTested: new Date().toISOString(),
});

export type { ContentItem, StudyProgram, StudyTask };
