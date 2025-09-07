import AsyncStorage from '@react-native-async-storage/async-storage';

// Onboarding data types
export interface ExamData {
  id: string;
  name: string;
  fullName: string;
  subjects: string[];
}

export interface TopicProficiency {
  [topicId: string]: number; // 0-4 scale (Beginner to Expert)
}

export interface SubjectIntensity {
  [subjectName: string]: number; // 0-3 scale (Light, Moderate, High, Intensive)
}

export interface GoalsData {
  examDate: string;
  targetScore: string;
  studyIntensity: string; // relaxed, moderate, intensive, extreme
  reminderFrequency: string;
  motivation: string;
}

export interface ScheduleData {
  [day: string]: string[]; // day -> time slots array
}

export interface LearningStyleData {
  primaryStyle: string; // visual, auditory, kinesthetic
  preferences: {
    studyEnvironment: string;
    sessionLength: string;
    breakFrequency: string;
  };
}

export interface OnboardingData {
  examData: ExamData | null;
  topicProficiency: TopicProficiency;
  subjectIntensity: SubjectIntensity;
  goalsData: GoalsData | null;
  scheduleData: ScheduleData;
  learningStyleData: LearningStyleData | null;
  completedAt: string | null;
  isComplete: boolean;
}

// Storage keys
const STORAGE_KEYS = {
  ONBOARDING_DATA: 'onboarding_data',
  EXAM_DATA: 'onboarding_exam',
  TOPIC_PROFICIENCY: 'onboarding_topics',
  SUBJECT_INTENSITY: 'onboarding_subject_intensity',
  GOALS_DATA: 'onboarding_goals',
  SCHEDULE_DATA: 'onboarding_schedule',
  LEARNING_STYLE: 'onboarding_learning_style',
  COMPLETION_STATUS: 'onboarding_complete',
};

// Default empty data
const getDefaultOnboardingData = (): OnboardingData => ({
  examData: null,
  topicProficiency: {},
  subjectIntensity: {},
  goalsData: null,
  scheduleData: {},
  learningStyleData: null,
  completedAt: null,
  isComplete: false,
});

// Save individual onboarding step data
export const saveExamData = async (examData: ExamData): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.EXAM_DATA, JSON.stringify(examData));
  } catch (error) {
    console.error('Error saving exam data:', error);
    throw error;
  }
};

export const saveTopicProficiency = async (topicProficiency: TopicProficiency): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.TOPIC_PROFICIENCY, JSON.stringify(topicProficiency));
  } catch (error) {
    console.error('Error saving topic proficiency:', error);
    throw error;
  }
};

export const saveSubjectIntensity = async (subjectIntensity: SubjectIntensity): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SUBJECT_INTENSITY, JSON.stringify(subjectIntensity));
  } catch (error) {
    console.error('Error saving subject intensity:', error);
    throw error;
  }
};

export const saveGoalsData = async (goalsData: GoalsData): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.GOALS_DATA, JSON.stringify(goalsData));
  } catch (error) {
    console.error('Error saving goals data:', error);
    throw error;
  }
};

export const saveScheduleData = async (scheduleData: ScheduleData): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SCHEDULE_DATA, JSON.stringify(scheduleData));
  } catch (error) {
    console.error('Error saving schedule data:', error);
    throw error;
  }
};

export const saveLearningStyleData = async (learningStyleData: LearningStyleData): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.LEARNING_STYLE, JSON.stringify(learningStyleData));
  } catch (error) {
    console.error('Error saving learning style data:', error);
    throw error;
  }
};

// Load individual data
export const loadExamData = async (): Promise<ExamData | null> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.EXAM_DATA);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error loading exam data:', error);
    return null;
  }
};

export const loadTopicProficiency = async (): Promise<TopicProficiency> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.TOPIC_PROFICIENCY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Error loading topic proficiency:', error);
    return {};
  }
};

export const loadSubjectIntensity = async (): Promise<SubjectIntensity> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SUBJECT_INTENSITY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Error loading subject intensity:', error);
    return {};
  }
};

export const loadGoalsData = async (): Promise<GoalsData | null> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.GOALS_DATA);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error loading goals data:', error);
    return null;
  }
};

export const loadScheduleData = async (): Promise<ScheduleData> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SCHEDULE_DATA);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Error loading schedule data:', error);
    return {};
  }
};

export const loadLearningStyleData = async (): Promise<LearningStyleData | null> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.LEARNING_STYLE);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error loading learning style data:', error);
    return null;
  }
};

// Load complete onboarding data
export const loadCompleteOnboardingData = async (): Promise<OnboardingData> => {
  try {
    const [examData, topicProficiency, subjectIntensity, goalsData, scheduleData, learningStyleData] = await Promise.all([
      loadExamData(),
      loadTopicProficiency(),
      loadSubjectIntensity(),
      loadGoalsData(),
      loadScheduleData(),
      loadLearningStyleData(),
    ]);

    const completionStatus = await AsyncStorage.getItem(STORAGE_KEYS.COMPLETION_STATUS);
    const isComplete = completionStatus === 'true';
    const completedAt = isComplete ? await AsyncStorage.getItem('onboarding_completed_at') : null;

    return {
      examData,
      topicProficiency,
      subjectIntensity,
      goalsData,
      scheduleData,
      learningStyleData,
      completedAt,
      isComplete,
    };
  } catch (error) {
    console.error('Error loading complete onboarding data:', error);
    return getDefaultOnboardingData();
  }
};

// Mark onboarding as complete
export const markOnboardingComplete = async (): Promise<void> => {
  try {
    const now = new Date().toISOString();
    await AsyncStorage.setItem(STORAGE_KEYS.COMPLETION_STATUS, 'true');
    await AsyncStorage.setItem('onboarding_completed_at', now);
  } catch (error) {
    console.error('Error marking onboarding complete:', error);
    throw error;
  }
};

// Clear all onboarding data (for testing/reset)
export const clearOnboardingData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    await AsyncStorage.removeItem('onboarding_completed_at');
  } catch (error) {
    console.error('Error clearing onboarding data:', error);
    throw error;
  }
};

// Utility functions
export const getOnboardingProgress = async (): Promise<number> => {
  try {
    const data = await loadCompleteOnboardingData();
    let completedSteps = 0;
    const totalSteps = 5;

    if (data.examData) completedSteps++;
    if (Object.keys(data.subjectIntensity).length > 0) completedSteps++;
    if (data.goalsData) completedSteps++;
    if (Object.keys(data.scheduleData).length > 0) completedSteps++;
    if (data.learningStyleData) completedSteps++;

    return (completedSteps / totalSteps) * 100;
  } catch (error) {
    console.error('Error calculating onboarding progress:', error);
    return 0;
  }
};

export const isOnboardingComplete = async (): Promise<boolean> => {
  try {
    const status = await AsyncStorage.getItem(STORAGE_KEYS.COMPLETION_STATUS);
    return status === 'true';
  } catch (error) {
    console.error('Error checking onboarding completion:', error);
    return false;
  }
}; 