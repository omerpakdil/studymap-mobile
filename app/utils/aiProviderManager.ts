import AsyncStorage from '@react-native-async-storage/async-storage';
import { OnboardingData } from './onboardingData';

// Import both AI providers
import {
    ContentItem,
    generateStudyContent as generateContentWithClaude,
    generateStudyProgram as generateWithClaude,
    StudyProgram,
    StudyTask,
} from './claudeStudyGenerator';

import {
    generateStudyContentWithGemini,
    generateStudyProgramWithGemini,
} from './geminiStudyGenerator';

// AI Provider types
export type AIProvider = 'claude' | 'gemini';

// Storage key for AI provider preference
const AI_PROVIDER_KEY = 'preferred_ai_provider';

// Default provider
const DEFAULT_PROVIDER: AIProvider = 'gemini';

/**
 * Get the currently selected AI provider from storage
 */
export const getCurrentAIProvider = async (): Promise<AIProvider> => {
  try {
    const stored = await AsyncStorage.getItem(AI_PROVIDER_KEY);
    return (stored as AIProvider) || DEFAULT_PROVIDER;
  } catch (error) {
    console.log('Error getting AI provider preference:', error);
    return DEFAULT_PROVIDER;
  }
};

/**
 * Set the preferred AI provider and save to storage
 */
export const setAIProvider = async (provider: AIProvider): Promise<void> => {
  try {
    await AsyncStorage.setItem(AI_PROVIDER_KEY, provider);
    console.log(`🤖 AI Provider set to: ${provider.toUpperCase()}`);
  } catch (error) {
    console.error('Error setting AI provider:', error);
  }
};

/**
 * Get available AI providers
 */
export const getAvailableProviders = (): { id: AIProvider; name: string; description: string; icon: string }[] => {
  return [
    {
      id: 'claude',
      name: 'Claude (Anthropic)',
      description: 'Advanced reasoning and analysis capabilities',
      icon: '🧠'
    },
    {
      id: 'gemini',
      name: 'Gemini (Google)',
      description: 'Multimodal AI with strong creative abilities',
      icon: '✨'
    }
  ];
};

// Progress callback type for chunk generation
export type ProgressCallback = (status: string, current: number, total: number) => void;

/**
 * Generate study program using the current AI provider
 */
export const generateStudyProgram = async (
  onboardingData: OnboardingData,
  onProgress?: ProgressCallback,
  forceProvider?: AIProvider
): Promise<StudyProgram | null> => {
  try {
    const provider = forceProvider || await getCurrentAIProvider();
    
    console.log(`🤖 Generating study program with ${provider.toUpperCase()}`);
    
    switch (provider) {
      case 'claude':
        return await generateWithClaude(onboardingData);
      case 'gemini':
        return await generateStudyProgramWithGemini(onboardingData, onProgress);
      default:
        console.warn(`Unknown AI provider: ${provider}, falling back to Claude`);
        return await generateWithClaude(onboardingData);
    }
  } catch (error) {
    console.error(`❌ Error generating study program with AI provider:`, error);
    return null;
  }
};



/**
 * Generate study content using the current AI provider
 */
export const generateStudyContent = async (params: {
  examId: string;
  subject: string;
  topic: string;
  sessionType: 'Practice' | 'Study' | 'Review';
  duration: number;
}, forceProvider?: AIProvider): Promise<ContentItem[]> => {
  try {
    const provider = forceProvider || await getCurrentAIProvider();
    
    console.log(`🤖 Generating study content with ${provider.toUpperCase()}`);
    
    switch (provider) {
      case 'claude':
        return await generateContentWithClaude(params);
      case 'gemini':
        return await generateStudyContentWithGemini(params);
      default:
        console.warn(`Unknown AI provider: ${provider}, falling back to Claude`);
        return await generateContentWithClaude(params);
    }
  } catch (error) {
    console.error(`❌ Error generating study content:`, error);
    
    // Return empty array on error - the study session will handle this
    return [];
  }
};

/**
 * Test AI provider connectivity
 */
export const testAIProvider = async (provider: AIProvider): Promise<{ success: boolean; message: string }> => {
  try {
    console.log(`🧪 Testing ${provider.toUpperCase()} connectivity...`);
    
    const testParams = {
      examId: 'sat',
      subject: 'Math',
      topic: 'Algebra',
      sessionType: 'Practice' as const,
      duration: 30
    };
    
    const content = await generateStudyContent(testParams, provider);
    
    if (content && content.length > 0) {
      return {
        success: true,
        message: `${provider.toUpperCase()} is working correctly`
      };
    } else {
      return {
        success: false,
        message: `${provider.toUpperCase()} returned empty content`
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `${provider.toUpperCase()} test failed: ${error}`
    };
  }
};

/**
 * Compare AI providers by generating sample content
 */
export const compareAIProviders = async (params: {
  examId: string;
  subject: string;
  topic: string;
  sessionType: 'Practice' | 'Study' | 'Review';
  duration: number;
}): Promise<{
  claude: { content: ContentItem[]; time: number; success: boolean };
  gemini: { content: ContentItem[]; time: number; success: boolean };
}> => {
  const results = {
    claude: { content: [] as ContentItem[], time: 0, success: false },
    gemini: { content: [] as ContentItem[], time: 0, success: false }
  };

  // Test Claude
  try {
    const startTime = Date.now();
    const claudeContent = await generateStudyContent(params, 'claude');
    results.claude = {
      content: claudeContent,
      time: Date.now() - startTime,
      success: claudeContent.length > 0
    };
  } catch (error) {
    console.error('Claude comparison test failed:', error);
  }

  // Test Gemini
  try {
    const startTime = Date.now();
    const geminiContent = await generateStudyContent(params, 'gemini');
    results.gemini = {
      content: geminiContent,
      time: Date.now() - startTime,
      success: geminiContent.length > 0
    };
  } catch (error) {
    console.error('Gemini comparison test failed:', error);
  }

  return results;
};

/**
 * Get AI provider status and health
 */
export const getAIProviderStatus = async (): Promise<{
  current: AIProvider;
  providers: {
    claude: { available: boolean; lastTested?: string };
    gemini: { available: boolean; lastTested?: string };
  };
}> => {
  const current = await getCurrentAIProvider();
  
  // Simple availability check based on API keys
  const claudeAvailable = process.env.ANTHROPIC_API_KEY !== 'your-anthropic-api-key-here';
  const geminiAvailable = process.env.GOOGLE_API_KEY !== 'your-google-api-key-here';
  
  return {
    current,
    providers: {
      claude: { 
        available: claudeAvailable,
        lastTested: new Date().toISOString()
      },
      gemini: { 
        available: geminiAvailable,
        lastTested: new Date().toISOString()
      }
    }
  };
};

/**
 * Smart provider selection based on task type and availability
 */
export const selectOptimalProvider = async (taskType: 'study_program' | 'content_generation'): Promise<AIProvider> => {
  const status = await getAIProviderStatus();
  
  // If current provider is available, use it
  if (
    (status.current === 'claude' && status.providers.claude.available) ||
    (status.current === 'gemini' && status.providers.gemini.available)
  ) {
    return status.current;
  }
  
  // Otherwise, select the first available provider
  if (status.providers.claude.available) return 'claude';
  if (status.providers.gemini.available) return 'gemini';
  
  // Fallback to default (will use mock data)
  return DEFAULT_PROVIDER;
};

/**
 * Auto-switch to working provider if current one fails
 */
export const autoSwitchProvider = async (): Promise<AIProvider> => {
  const current = await getCurrentAIProvider();
  const alternative: AIProvider = current === 'claude' ? 'gemini' : 'claude';
  
  console.log(`🔄 Auto-switching from ${current} to ${alternative}`);
  await setAIProvider(alternative);
  
  return alternative;
};

// Re-export types for convenience
export type { ContentItem, StudyProgram, StudyTask };
