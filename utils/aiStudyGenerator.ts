import { OnboardingData, TopicProficiency } from '../app/utils/onboardingData';

// Study program types
export interface StudyTask {
  id: string;
  subject: string;
  topic: string;
  type: 'practice' | 'study' | 'review';
  duration: number; // minutes
  difficulty: 'easy' | 'medium' | 'hard';
  priority: 'high' | 'medium' | 'low';
  description: string;
  date: string; // YYYY-MM-DD format
  timeSlot?: string;
  completed: boolean;
  estimatedProgress: number; // percentage
}

export interface StudyProgram {
  userId: string;
  examType: string;
  startDate: string;
  examDate: string;
  totalDays: number;
  weeklyHours: number;
  dailyTasks: StudyTask[];
  subjectAllocation: {
    [subject: string]: {
      totalHours: number;
      weeklyHours: number;
      priority: number;
    };
  };
  generatedAt: string;
}

export interface WeaknessAnalysis {
  criticalWeaknesses: string[]; // topics with proficiency < 2
  moderateWeaknesses: string[]; // topics with proficiency = 2
  strengths: string[]; // topics with proficiency > 3
  recommendedFocus: {
    [topic: string]: {
      currentLevel: number;
      targetLevel: number;
      hoursNeeded: number;
      priority: 'critical' | 'high' | 'medium' | 'low';
    };
  };
}

// Topic metadata for different exams
const EXAM_TOPICS = {
  sat: {
    math: [
      { id: 'algebra', name: 'Algebra & Functions', weight: 35, baseHours: 15 },
      { id: 'geometry', name: 'Geometry & Trigonometry', weight: 25, baseHours: 12 },
      { id: 'statistics', name: 'Statistics & Data Analysis', weight: 25, baseHours: 10 },
      { id: 'advanced', name: 'Advanced Topics', weight: 15, baseHours: 8 },
    ],
    reading: [
      { id: 'comprehension', name: 'Reading Comprehension', weight: 40, baseHours: 12 },
      { id: 'analysis', name: 'Literary Analysis', weight: 30, baseHours: 15 },
      { id: 'grammar', name: 'Grammar & Usage', weight: 20, baseHours: 8 },
      { id: 'rhetoric', name: 'Rhetorical Skills', weight: 10, baseHours: 6 },
    ],
  },
  gre: {
    verbal: [
      { id: 'comprehension', name: 'Reading Comprehension', weight: 40, baseHours: 20 },
      { id: 'vocabulary', name: 'Vocabulary', weight: 30, baseHours: 25 },
      { id: 'reasoning', name: 'Critical Reasoning', weight: 30, baseHours: 15 },
    ],
    quantitative: [
      { id: 'arithmetic', name: 'Arithmetic', weight: 25, baseHours: 12 },
      { id: 'algebra', name: 'Algebra', weight: 30, baseHours: 18 },
      { id: 'geometry', name: 'Geometry', weight: 25, baseHours: 15 },
      { id: 'data_analysis', name: 'Data Analysis', weight: 20, baseHours: 10 },
    ],
    writing: [
      { id: 'analytical', name: 'Analytical Writing', weight: 100, baseHours: 20 },
    ],
  },
};

// AI Analysis Functions
export const analyzeWeaknesses = (topicProficiency: TopicProficiency, examType: string): WeaknessAnalysis => {
  const criticalWeaknesses: string[] = [];
  const moderateWeaknesses: string[] = [];
  const strengths: string[] = [];
  const recommendedFocus: WeaknessAnalysis['recommendedFocus'] = {};

  // Get exam topics
  const examTopics = EXAM_TOPICS[examType as keyof typeof EXAM_TOPICS];
  if (!examTopics) {
    console.warn(`Unknown exam type: ${examType}`);
    return { criticalWeaknesses, moderateWeaknesses, strengths, recommendedFocus };
  }

  // Analyze each subject
  Object.values(examTopics).flat().forEach(topic => {
    const proficiency = topicProficiency[topic.id] || 0;
    const topicName = topic.name;

    // Categorize by weakness level
    if (proficiency < 2) {
      criticalWeaknesses.push(topicName);
    } else if (proficiency === 2) {
      moderateWeaknesses.push(topicName);
    } else if (proficiency >= 3) {
      strengths.push(topicName);
    }

    // Calculate recommended focus
    let targetLevel = 4; // Aim for expert level
    let priority: 'critical' | 'high' | 'medium' | 'low' = 'medium';
    
    if (proficiency < 2) {
      priority = 'critical';
      targetLevel = 3; // First get to good level
    } else if (proficiency === 2) {
      priority = 'high';
      targetLevel = 4;
    } else if (proficiency === 3) {
      priority = 'medium';
      targetLevel = 4;
    } else {
      priority = 'low';
      targetLevel = 4;
    }

    // Estimate hours needed (exponential increase for higher levels)
    const levelDifference = targetLevel - proficiency;
    const baseHoursPerLevel = topic.baseHours / 4; // Distribute base hours across 4 levels
    const hoursNeeded = Math.max(0, levelDifference * baseHoursPerLevel * (1.5 ** levelDifference));

    recommendedFocus[topic.id] = {
      currentLevel: proficiency,
      targetLevel,
      hoursNeeded: Math.round(hoursNeeded),
      priority,
    };
  });

  return { criticalWeaknesses, moderateWeaknesses, strengths, recommendedFocus };
};

export const calculateStudyIntensity = (intensityLevel: string): { dailyHours: number; sessionsPerDay: number } => {
  switch (intensityLevel) {
    case 'relaxed':
      return { dailyHours: 1.5, sessionsPerDay: 1 };
    case 'moderate':
      return { dailyHours: 2.5, sessionsPerDay: 2 };
    case 'intensive':
      return { dailyHours: 3.5, sessionsPerDay: 2 };
    case 'extreme':
      return { dailyHours: 4.5, sessionsPerDay: 3 };
    default:
      return { dailyHours: 2.5, sessionsPerDay: 2 };
  }
};

// Helper function to safely parse MM/DD/YYYY date format
const parseExamDate = (dateString: string): Date | null => {
  try {
    if (!dateString || dateString.trim() === '') {
      return null;
    }

    // Handle MM/DD/YYYY format
    const dateParts = dateString.trim().split('/');
    if (dateParts.length === 3) {
      const month = parseInt(dateParts[0], 10);
      const day = parseInt(dateParts[1], 10);
      const year = parseInt(dateParts[2], 10);

      // Validate date parts
      if (isNaN(month) || isNaN(day) || isNaN(year)) {
        console.warn('Invalid date parts:', { month, day, year });
        return null;
      }

      if (month < 1 || month > 12 || day < 1 || day > 31 || year < 2024 || year > 2030) {
        console.warn('Date out of valid range:', { month, day, year });
        return null;
      }

      // Create date using Date constructor with year, month-1, day
      const parsedDate = new Date(year, month - 1, day);
      
      // Verify the date was created correctly (handles invalid dates like Feb 30)
      if (parsedDate.getFullYear() !== year || 
          parsedDate.getMonth() !== month - 1 || 
          parsedDate.getDate() !== day) {
        console.warn('Invalid date created:', { original: dateString, parsed: parsedDate });
        return null;
      }

      return parsedDate;
    }

    // Fallback: try direct parsing
    const fallbackDate = new Date(dateString);
    if (isNaN(fallbackDate.getTime())) {
      console.warn('Unable to parse date:', dateString);
      return null;
    }

    return fallbackDate;
  } catch (error) {
    console.error('Error parsing exam date:', error, dateString);
    return null;
  }
};

export const generateStudyProgram = async (onboardingData: OnboardingData): Promise<StudyProgram | null> => {
  try {
    const { examData, topicProficiency, goalsData, scheduleData, learningStyleData } = onboardingData;

    if (!examData || !goalsData || !topicProficiency) {
      console.warn('Insufficient onboarding data for program generation');
      return null;
    }

    // Parse exam date safely
    const examDate = parseExamDate(goalsData.examDate);
    if (!examDate) {
      console.error('Invalid exam date format:', goalsData.examDate);
      return null;
    }

    const startDate = new Date();
    const totalDays = Math.ceil((examDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    if (totalDays <= 0) {
      console.warn('Exam date is in the past or today');
      return null;
    }

    console.log('Study program generation:', {
      examDate: examDate.toDateString(),
      totalDays,
      examType: examData.id,
      intensity: goalsData.studyIntensity
    });

    // Analyze weaknesses
    const weaknessAnalysis = analyzeWeaknesses(topicProficiency, examData.id);

    // Calculate study intensity
    const { dailyHours, sessionsPerDay } = calculateStudyIntensity(goalsData.studyIntensity);
    const weeklyHours = dailyHours * 7; // Assuming daily study

    // Calculate subject allocation based on weaknesses
    const subjectAllocation: StudyProgram['subjectAllocation'] = {};
    const totalWeeklyHours = weeklyHours;

    // Allocate more time to critical weaknesses
    const priorityMultipliers = {
      critical: 2.0,
      high: 1.5,
      medium: 1.0,
      low: 0.5,
    };

    let totalPriorityScore = 0;
    Object.entries(weaknessAnalysis.recommendedFocus).forEach(([topicId, focus]) => {
      totalPriorityScore += priorityMultipliers[focus.priority];
    });

    // Distribute hours based on priority
    Object.entries(weaknessAnalysis.recommendedFocus).forEach(([topicId, focus]) => {
      const subject = getSubjectForTopic(topicId, examData.id);
      if (!subject) return;

      const priorityRatio = priorityMultipliers[focus.priority] / totalPriorityScore;
      const allocatedHours = totalWeeklyHours * priorityRatio;

      if (!subjectAllocation[subject]) {
        subjectAllocation[subject] = {
          totalHours: 0,
          weeklyHours: 0,
          priority: 0,
        };
      }

      subjectAllocation[subject].weeklyHours += allocatedHours;
      subjectAllocation[subject].totalHours += allocatedHours * (totalDays / 7);
      subjectAllocation[subject].priority = Math.max(
        subjectAllocation[subject].priority,
        getPriorityScore(focus.priority)
      );
    });

    // Generate daily tasks
    const dailyTasks = generateDailyTasks(
      weaknessAnalysis,
      examData,
      goalsData,
      scheduleData,
      totalDays,
      dailyHours,
      sessionsPerDay
    );

    const studyProgram: StudyProgram = {
      userId: 'current_user', // Would be actual user ID in real app
      examType: examData.id,
      startDate: startDate.toISOString().split('T')[0],
      examDate: examDate.toISOString().split('T')[0],
      totalDays,
      weeklyHours,
      dailyTasks,
      subjectAllocation,
      generatedAt: new Date().toISOString(),
    };

    return studyProgram;
  } catch (error) {
    console.error('Error generating study program:', error);
    return null;
  }
};

const generateDailyTasks = (
  weaknessAnalysis: WeaknessAnalysis,
  examData: any,
  goalsData: any,
  scheduleData: any,
  totalDays: number,
  dailyHours: number,
  sessionsPerDay: number
): StudyTask[] => {
  const tasks: StudyTask[] = [];
  const startDate = new Date();

  // Generate tasks for each day
  for (let day = 0; day < Math.min(totalDays, 30); day++) { // Limit to 30 days for initial generation
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + day);
    const dateString = currentDate.toISOString().split('T')[0];
    const dayOfWeek = currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    // Check if user has time slots for this day
    const daySchedule = scheduleData[dayOfWeek] || [];
    if (daySchedule.length === 0) continue; // Skip days with no available time

    // Create sessions for the day
    for (let session = 0; session < Math.min(sessionsPerDay, daySchedule.length); session++) {
      const sessionDuration = Math.round((dailyHours * 60) / sessionsPerDay); // minutes per session

      // Select topic based on priority and rotation
      const priorityTopics = Object.entries(weaknessAnalysis.recommendedFocus)
        .filter(([_, focus]) => focus.priority === 'critical' || focus.priority === 'high')
        .map(([topicId, _]) => topicId);

      const selectedTopicId = priorityTopics[session % priorityTopics.length] || Object.keys(weaknessAnalysis.recommendedFocus)[0];
      const topicFocus = weaknessAnalysis.recommendedFocus[selectedTopicId];

      if (!selectedTopicId || !topicFocus) continue;

      // Determine task type based on proficiency level
      let taskType: StudyTask['type'] = 'study';
      let difficulty: StudyTask['difficulty'] = 'medium';

      if (topicFocus.currentLevel < 2) {
        taskType = 'study';
        difficulty = 'easy';
      } else if (topicFocus.currentLevel === 2) {
        taskType = day % 2 === 0 ? 'study' : 'practice';
        difficulty = 'medium';
      } else {
        taskType = day % 3 === 0 ? 'review' : 'practice';
        difficulty = 'medium';
      }

      const task: StudyTask = {
        id: `task_${dateString}_${session}`,
        subject: getSubjectForTopic(selectedTopicId, examData.id) || 'General',
        topic: getTopicName(selectedTopicId, examData.id) || selectedTopicId,
        type: taskType,
        duration: sessionDuration,
        difficulty,
        priority: topicFocus.priority === 'critical' ? 'high' : topicFocus.priority,
        description: generateTaskDescription(selectedTopicId, taskType, topicFocus.currentLevel),
        date: dateString,
        timeSlot: daySchedule[session % daySchedule.length],
        completed: false,
        estimatedProgress: Math.round((sessionDuration / (topicFocus.hoursNeeded * 60)) * 100),
      };

      tasks.push(task);
    }
  }

  return tasks;
};

// Helper functions
const getSubjectForTopic = (topicId: string, examType: string): string | null => {
  const examTopics = EXAM_TOPICS[examType as keyof typeof EXAM_TOPICS];
  if (!examTopics) return null;

  for (const [subject, topics] of Object.entries(examTopics)) {
    if (topics.some(topic => topic.id === topicId)) {
      return subject.charAt(0).toUpperCase() + subject.slice(1);
    }
  }
  return null;
};

const getTopicName = (topicId: string, examType: string): string | null => {
  const examTopics = EXAM_TOPICS[examType as keyof typeof EXAM_TOPICS];
  if (!examTopics) return null;

  for (const topics of Object.values(examTopics)) {
    const topic = topics.find(t => t.id === topicId);
    if (topic) return topic.name;
  }
  return null;
};

const getPriorityScore = (priority: string): number => {
  switch (priority) {
    case 'critical': return 4;
    case 'high': return 3;
    case 'medium': return 2;
    case 'low': return 1;
    default: return 2;
  }
};

const generateTaskDescription = (topicId: string, taskType: string, currentLevel: number): string => {
  const baseDescriptions = {
    study: 'Review core concepts and learn new material',
    practice: 'Complete practice problems and exercises', 
    review: 'Reinforce learned concepts and identify gaps',
  };

  const levelModifiers = {
    0: 'Focus on basic fundamentals',
    1: 'Build foundational understanding',
    2: 'Strengthen core knowledge',
    3: 'Advanced practice and refinement',
    4: 'Mastery-level challenges',
  };

  return `${baseDescriptions[taskType as keyof typeof baseDescriptions]}. ${levelModifiers[currentLevel as keyof typeof levelModifiers]}.`;
}; 