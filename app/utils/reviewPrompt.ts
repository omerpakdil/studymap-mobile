import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';

/**
 * Smart Review Prompt Manager
 * Requests App Store reviews at strategic moments without being annoying
 */

const REVIEW_PROMPT_KEYS = {
  LAST_PROMPT_DATE: 'last_review_prompt_date',
  REVIEW_PROMPTED_COUNT: 'review_prompted_count',
  USER_SESSIONS_COUNT: 'user_sessions_count',
  FIRST_SESSION_DATE: 'first_session_date',
  STUDY_SESSIONS_COMPLETED: 'study_sessions_completed',
};

const REVIEW_PROMPT_CONFIG = {
  MIN_DAYS_BETWEEN_PROMPTS: 30, // Don't ask more than once per month
  MIN_SESSIONS_BEFORE_FIRST_PROMPT: 3, // Wait for 3 app sessions
  MIN_DAYS_BEFORE_FIRST_PROMPT: 3, // Wait at least 3 days after install
  MAX_PROMPTS_TOTAL: 3, // Maximum times to ever ask
  MIN_COMPLETED_STUDY_SESSIONS: 1, // At least 1 completed study session
};

/**
 * Check if we should show the review prompt
 */
export async function shouldPromptForReview(): Promise<boolean> {
  try {
    // Check if StoreReview is available (iOS only)
    const isAvailable = await StoreReview.isAvailableAsync();
    if (!isAvailable) {
      return false;
    }

    // Get stored data
    const [
      lastPromptDate,
      promptCount,
      sessionsCount,
      firstSessionDate,
      completedStudySessions,
    ] = await Promise.all([
      AsyncStorage.getItem(REVIEW_PROMPT_KEYS.LAST_PROMPT_DATE),
      AsyncStorage.getItem(REVIEW_PROMPT_KEYS.REVIEW_PROMPTED_COUNT),
      AsyncStorage.getItem(REVIEW_PROMPT_KEYS.USER_SESSIONS_COUNT),
      AsyncStorage.getItem(REVIEW_PROMPT_KEYS.FIRST_SESSION_DATE),
      AsyncStorage.getItem(REVIEW_PROMPT_KEYS.STUDY_SESSIONS_COMPLETED),
    ]);

    const promptCountNum = parseInt(promptCount || '0', 10);
    const sessionsCountNum = parseInt(sessionsCount || '0', 10);
    const completedStudySessionsNum = parseInt(completedStudySessions || '0', 10);

    // Check 1: Don't exceed max prompts
    if (promptCountNum >= REVIEW_PROMPT_CONFIG.MAX_PROMPTS_TOTAL) {
      console.log('📊 Review: Max prompts reached');
      return false;
    }

    // Check 2: Minimum sessions requirement
    if (sessionsCountNum < REVIEW_PROMPT_CONFIG.MIN_SESSIONS_BEFORE_FIRST_PROMPT) {
      console.log('📊 Review: Not enough sessions yet');
      return false;
    }

    // Check 3: User must have completed at least one study session
    if (completedStudySessionsNum < REVIEW_PROMPT_CONFIG.MIN_COMPLETED_STUDY_SESSIONS) {
      console.log('📊 Review: No completed study sessions yet');
      return false;
    }

    // Check 4: Minimum days since install
    if (firstSessionDate) {
      const daysSinceInstall = (Date.now() - parseInt(firstSessionDate, 10)) / (1000 * 60 * 60 * 24);
      if (daysSinceInstall < REVIEW_PROMPT_CONFIG.MIN_DAYS_BEFORE_FIRST_PROMPT) {
        console.log('📊 Review: Too soon after install');
        return false;
      }
    }

    // Check 5: Minimum days since last prompt
    if (lastPromptDate) {
      const daysSinceLastPrompt = (Date.now() - parseInt(lastPromptDate, 10)) / (1000 * 60 * 60 * 24);
      if (daysSinceLastPrompt < REVIEW_PROMPT_CONFIG.MIN_DAYS_BETWEEN_PROMPTS) {
        console.log('📊 Review: Too soon since last prompt');
        return false;
      }
    }

    console.log('✅ Review: All conditions met, will prompt');
    return true;
  } catch (error) {
    console.error('❌ Error checking review prompt conditions:', error);
    return false;
  }
}

/**
 * Request a review from the user
 */
export async function requestReview(): Promise<void> {
  try {
    const shouldPrompt = await shouldPromptForReview();

    if (!shouldPrompt) {
      return;
    }

    console.log('🌟 Requesting App Store review...');

    // Request the review
    await StoreReview.requestReview();

    // Update tracking data
    const promptCount = await AsyncStorage.getItem(REVIEW_PROMPT_KEYS.REVIEW_PROMPTED_COUNT);
    const newCount = parseInt(promptCount || '0', 10) + 1;

    await Promise.all([
      AsyncStorage.setItem(REVIEW_PROMPT_KEYS.LAST_PROMPT_DATE, Date.now().toString()),
      AsyncStorage.setItem(REVIEW_PROMPT_KEYS.REVIEW_PROMPTED_COUNT, newCount.toString()),
    ]);

    console.log(`✅ Review prompted (${newCount}/${REVIEW_PROMPT_CONFIG.MAX_PROMPTS_TOTAL} total)`);
  } catch (error) {
    console.error('❌ Error requesting review:', error);
  }
}

/**
 * Track app session (call on app launch)
 */
export async function trackAppSession(): Promise<void> {
  try {
    const [sessionsCount, firstSessionDate] = await Promise.all([
      AsyncStorage.getItem(REVIEW_PROMPT_KEYS.USER_SESSIONS_COUNT),
      AsyncStorage.getItem(REVIEW_PROMPT_KEYS.FIRST_SESSION_DATE),
    ]);

    const newCount = parseInt(sessionsCount || '0', 10) + 1;
    await AsyncStorage.setItem(REVIEW_PROMPT_KEYS.USER_SESSIONS_COUNT, newCount.toString());

    // Set first session date if not set
    if (!firstSessionDate) {
      await AsyncStorage.setItem(REVIEW_PROMPT_KEYS.FIRST_SESSION_DATE, Date.now().toString());
    }

    console.log(`📊 App session tracked: ${newCount} total sessions`);
  } catch (error) {
    console.error('❌ Error tracking app session:', error);
  }
}

/**
 * Track completed study session
 */
export async function trackCompletedStudySession(): Promise<void> {
  try {
    const completedSessions = await AsyncStorage.getItem(REVIEW_PROMPT_KEYS.STUDY_SESSIONS_COMPLETED);
    const newCount = parseInt(completedSessions || '0', 10) + 1;
    await AsyncStorage.setItem(REVIEW_PROMPT_KEYS.STUDY_SESSIONS_COMPLETED, newCount.toString());

    console.log(`📚 Study session completed: ${newCount} total`);
  } catch (error) {
    console.error('❌ Error tracking study session:', error);
  }
}

/**
 * Reset review prompt data (for testing only)
 */
export async function resetReviewPromptData(): Promise<void> {
  if (!__DEV__) {
    console.warn('⚠️ Reset only allowed in development mode');
    return;
  }

  await Promise.all([
    AsyncStorage.removeItem(REVIEW_PROMPT_KEYS.LAST_PROMPT_DATE),
    AsyncStorage.removeItem(REVIEW_PROMPT_KEYS.REVIEW_PROMPTED_COUNT),
    AsyncStorage.removeItem(REVIEW_PROMPT_KEYS.USER_SESSIONS_COUNT),
    AsyncStorage.removeItem(REVIEW_PROMPT_KEYS.FIRST_SESSION_DATE),
    AsyncStorage.removeItem(REVIEW_PROMPT_KEYS.STUDY_SESSIONS_COMPLETED),
  ]);

  console.log('🔄 Review prompt data reset');
}
