import { OnboardingData } from './onboardingData';

// Import Gemini AI provider
import {
    ContentItem,
    generateStudyContentWithGemini,
    generateStudyProgramWithGemini,
    StudyProgram,
    StudyTask,
} from './geminiStudyGenerator';

/**
 * Simple provider identifier used until multi-provider selection is available.
 * Keeping this async maintains parity with future storage-backed implementations.
 */
const DEFAULT_PROVIDER = 'gemini' as const;

export type AIProvider = typeof DEFAULT_PROVIDER;

export const getCurrentAIProvider = async (): Promise<AIProvider> => DEFAULT_PROVIDER;

// Progress callback type for chunk generation
export type ProgressCallback = (status: string, current: number, total: number) => void;

/**
 * Generate study program using Gemini AI
 */
export const generateStudyProgram = async (
  onboardingData: OnboardingData,
  onProgress?: ProgressCallback
): Promise<StudyProgram | null> => {
  try {
    console.log('🤖 Generating study program with Gemini AI');
    return await generateStudyProgramWithGemini(onboardingData, onProgress);
  } catch (error) {
    console.error('❌ Error generating study program with Gemini:', error);
    return null;
  }
};

/**
 * Generate study content using Gemini AI
 */
export const generateStudyContent = async (params: {
  examId: string;
  subject: string;
  sessionType: 'Practice' | 'Study' | 'Review';
  duration: number;
}): Promise<ContentItem[]> => {
  try {
    console.log('🤖 Generating study content with Gemini AI');
    return await generateStudyContentWithGemini(params);
  } catch (error) {
    console.error('❌ Error generating study content with Gemini:', error);
    // Return empty array on error - the study session will handle this
    return [];
  }
};

/**
 * Test Gemini AI connectivity
 */
export const testAIProvider = async (): Promise<{ success: boolean; message: string }> => {
  try {
    console.log('🧪 Testing Gemini AI connectivity...');

    const testParams = {
      examId: 'sat',
      subject: 'Mathematics',
      sessionType: 'Practice' as const,
      duration: 30
    };

    const content = await generateStudyContent(testParams);

    if (content && content.length > 0) {
      return {
        success: true,
        message: 'Gemini AI is working correctly'
      };
    } else {
      return {
        success: false,
        message: 'Gemini AI returned empty content'
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Gemini AI test failed: ${error}`
    };
  }
};

/**
 * Get Gemini AI status and health
 */
export const getAIProviderStatus = async (): Promise<{
  available: boolean;
  lastTested: string;
}> => {
  // Simple availability check based on API key
  const geminiAvailable = process.env.EXPO_PUBLIC_GOOGLE_API_KEY &&
                         process.env.EXPO_PUBLIC_GOOGLE_API_KEY !== 'your-google-api-key-here';

  return {
    available: Boolean(geminiAvailable),
    lastTested: new Date().toISOString()
  };
};

// Re-export types for convenience
export type { ContentItem, StudyProgram, StudyTask };
