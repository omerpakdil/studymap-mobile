import AsyncStorage from '@react-native-async-storage/async-storage';
import { StudyProgram, StudyTask } from './claudeStudyGenerator';

// Storage keys
const STORAGE_KEYS = {
  STUDY_PROGRAM: 'study_program',
  DAILY_TASKS: 'daily_tasks',
  TASK_COMPLETIONS: 'task_completions',
  PROGRAM_PROGRESS: 'program_progress',
};

// Save study program
export const saveStudyProgram = async (program: StudyProgram): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.STUDY_PROGRAM, JSON.stringify(program));
    console.log('✅ Study program saved successfully');
  } catch (error) {
    console.error('❌ Error saving study program:', error);
    throw error;
  }
};

// Load study program
export const loadStudyProgram = async (): Promise<StudyProgram | null> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.STUDY_PROGRAM);
    if (data) {
      const program = JSON.parse(data);
      console.log('✅ Study program loaded successfully');
      return program;
    }
    return null;
  } catch (error) {
    console.error('❌ Error loading study program:', error);
    return null;
  }
};

// Save daily tasks
export const saveDailyTasks = async (tasks: StudyTask[]): Promise<void> => {
  try {
    // Debug: Check completed status of tasks being saved
    const completedTasks = tasks.filter(task => task.completed === true);
    if (completedTasks.length > 0) {
      console.log('⚠️ WARNING: Saving tasks with completed=true:', completedTasks.map(t => ({ id: t.id, subject: t.subject, completed: t.completed })));
    }
    console.log(`🔍 Debug: Saving ${tasks.length} tasks, ${completedTasks.length} already completed`);
    
    await AsyncStorage.setItem(STORAGE_KEYS.DAILY_TASKS, JSON.stringify(tasks));
    console.log(`✅ ${tasks.length} daily tasks saved successfully`);
  } catch (error) {
    console.error('❌ Error saving daily tasks:', error);
    throw error;
  }
};

// Load daily tasks
export const loadDailyTasks = async (): Promise<StudyTask[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_TASKS);
    if (data) {
      const tasks = JSON.parse(data);
      const completedTasks = tasks.filter((task: StudyTask) => task.completed === true);
      if (completedTasks.length > 0) {
        console.log('⚠️ WARNING: Loaded tasks with completed=true:', completedTasks.map((t: StudyTask) => ({ id: t.id, subject: t.subject, completed: t.completed })));
      }
      console.log(`🔍 Debug: Loaded ${tasks.length} tasks, ${completedTasks.length} already completed`);
      return tasks;
    }
    return [];
  } catch (error) {
    console.error('❌ Error loading daily tasks:', error);
    return [];
  }
};

// Get tasks for specific date
export const getTasksForDate = async (date: string): Promise<StudyTask[]> => {
  try {
    const allTasks = await loadDailyTasks();
    return allTasks.filter(task => task.date === date);
  } catch (error) {
    console.error('❌ Error getting tasks for date:', error);
    return [];
  }
};

// Get tasks for current week
export const getWeeklyTasks = async (): Promise<StudyTask[]> => {
  try {
    const allTasks = await loadDailyTasks();
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
    
    const startDateString = startOfWeek.toISOString().split('T')[0];
    const endDateString = endOfWeek.toISOString().split('T')[0];
    
    return allTasks.filter(task => task.date >= startDateString && task.date <= endDateString);
  } catch (error) {
    console.error('❌ Error getting weekly tasks:', error);
    return [];
  }
};

// Mark task as completed
export const markTaskComplete = async (taskId: string, duration?: number): Promise<void> => {
  try {
    const completions = await getTaskCompletions();
    completions[taskId] = {
      completedAt: new Date().toISOString(),
      duration: duration || 0,
    };
    
    await AsyncStorage.setItem(STORAGE_KEYS.TASK_COMPLETIONS, JSON.stringify(completions));
    
    // Update the task in daily tasks
    const tasks = await loadDailyTasks();
    const updatedTasks = tasks.map(task => 
      task.id === taskId ? { ...task, completed: true, progress: 100 } : task
    );
    await saveDailyTasks(updatedTasks);
    
    console.log(`✅ Task ${taskId} marked as completed`);
  } catch (error) {
    console.error('❌ Error marking task complete:', error);
    throw error;
  }
};

// Update task progress
export const updateTaskProgress = async (taskId: string, progress: number): Promise<void> => {
  try {
    const tasks = await loadDailyTasks();
    const updatedTasks = tasks.map(task => 
      task.id === taskId ? { ...task, progress: Math.min(100, Math.max(0, progress)) } : task
    );
    await saveDailyTasks(updatedTasks);
    console.log(`✅ Task ${taskId} progress updated to ${progress}%`);
  } catch (error) {
    console.error('❌ Error updating task progress:', error);
    throw error;
  }
};

// Get task completions
export const getTaskCompletions = async (): Promise<Record<string, { completedAt: string; duration: number }>> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.TASK_COMPLETIONS);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('❌ Error getting task completions:', error);
    return {};
  }
};

// Calculate daily progress
export const calculateDailyProgress = async (date: string): Promise<{ completed: number; total: number; minutes: number }> => {
  try {
    const tasks = await getTasksForDate(date);
    const completions = await getTaskCompletions();
    
    // Also check for session-based completions
    const sessionCompletions: Record<string, boolean> = {};
    for (const task of tasks) {
      const sessionKey = `session_completed_${task.id}`;
      const sessionStatus = await AsyncStorage.getItem(sessionKey);
      sessionCompletions[task.id] = sessionStatus === 'true';
    }
    
    const completedTasks = tasks.filter(task => 
      completions[task.id] || task.completed || sessionCompletions[task.id]
    );
    
    const totalMinutes = completedTasks.reduce((sum, task) => {
      const completion = completions[task.id];
      return sum + (completion?.duration || task.duration);
    }, 0);
    
    console.log('📊 Daily progress debug for', date, ':', {
      totalDailyTasks: tasks.length,
      completedDailyTasks: completedTasks.length,
      totalMinutes
    });
    
    return {
      completed: completedTasks.length,
      total: tasks.length,
      minutes: totalMinutes,
    };
  } catch (error) {
    console.error('❌ Error calculating daily progress:', error);
    return { completed: 0, total: 0, minutes: 0 };
  }
};

// Calculate weekly progress
export const calculateWeeklyProgress = async (): Promise<{ completed: number; total: number; hours: number }> => {
  try {
    const tasks = await getWeeklyTasks();
    const completions = await getTaskCompletions();
    
    // Also check for session-based completions
    const sessionCompletions: Record<string, boolean> = {};
    for (const task of tasks) {
      const sessionKey = `session_completed_${task.id}`;
      const sessionStatus = await AsyncStorage.getItem(sessionKey);
      sessionCompletions[task.id] = sessionStatus === 'true';
    }
    
    const completedTasks = tasks.filter(task => 
      completions[task.id] || task.completed || sessionCompletions[task.id]
    );
    
    const totalHours = completedTasks.reduce((sum, task) => {
      const completion = completions[task.id];
      return sum + (completion?.duration || task.duration);
    }, 0) / 60; // Convert to hours
    
    console.log('📊 Weekly progress debug:', {
      totalWeeklyTasks: tasks.length,
      completedWeeklyTasks: completedTasks.length,
      totalHours: Math.round(totalHours * 10) / 10
    });
    
    return {
      completed: completedTasks.length,
      total: tasks.length,
      hours: Math.round(totalHours * 10) / 10, // Round to 1 decimal
    };
  } catch (error) {
    console.error('❌ Error calculating weekly progress:', error);
    return { completed: 0, total: 0, hours: 0 };
  }
};

// Get subject-wise progress
export const getSubjectProgress = async (): Promise<Record<string, { completed: number; total: number; hours: number; progress: number }>> => {
  try {
    const tasks = await loadDailyTasks();
    const completions = await getTaskCompletions();
    
    // Also check for session-based completions
    const sessionCompletions: Record<string, boolean> = {};
    for (const task of tasks) {
      const sessionKey = `session_completed_${task.id}`;
      const sessionStatus = await AsyncStorage.getItem(sessionKey);
      sessionCompletions[task.id] = sessionStatus === 'true';
    }
    
    const progress: Record<string, { completed: number; total: number; hours: number; progress: number }> = {};
    
    tasks.forEach(task => {
      if (!progress[task.subject]) {
        progress[task.subject] = { completed: 0, total: 0, hours: 0, progress: 0 };
      }
      
      progress[task.subject].total++;
      
      const isTaskCompleted = completions[task.id] || task.completed || sessionCompletions[task.id];
      if (isTaskCompleted) {
        progress[task.subject].completed++;
        const completion = completions[task.id];
        progress[task.subject].hours += (completion?.duration || task.duration) / 60;
      }
    });
    
    // Calculate progress percentage for each subject
    Object.keys(progress).forEach(subject => {
      progress[subject].hours = Math.round(progress[subject].hours * 10) / 10;
      progress[subject].progress = progress[subject].total > 0 
        ? Math.round((progress[subject].completed / progress[subject].total) * 100)
        : 0;
    });
    
    return progress;
  } catch (error) {
    console.error('❌ Error calculating subject progress:', error);
    return {};
  }
};

// Get study streak
export const getStudyStreak = async (): Promise<number> => {
  try {
    const completions = await getTaskCompletions();
    let streak = 0;
    let currentDate = new Date();
    
    while (true) {
      const dateString = currentDate.toISOString().split('T')[0];
      const dayTasks = await getTasksForDate(dateString);
      
      // Check for session-based completions for this day
      const sessionCompletions: Record<string, boolean> = {};
      for (const task of dayTasks) {
        const sessionKey = `session_completed_${task.id}`;
        const sessionStatus = await AsyncStorage.getItem(sessionKey);
        sessionCompletions[task.id] = sessionStatus === 'true';
      }
      
      const dayCompletions = dayTasks.filter(task => 
        completions[task.id] || task.completed || sessionCompletions[task.id]
      );
      
      if (dayCompletions.length > 0) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
      
      // Prevent infinite loop
      if (streak > 365) break;
    }
    
    return streak;
  } catch (error) {
    console.error('❌ Error calculating study streak:', error);
    return 0;
  }
};

// Check if program is generated
export const isProgramGenerated = async (): Promise<boolean> => {
  try {
    const program = await loadStudyProgram();
    return !!program;
  } catch (error) {
    console.error('❌ Error checking program status:', error);
    return false;
  }
};

// Get program metadata
export const getProgramMetadata = async (): Promise<{
  examType: string;
  startDate: string;
  examDate: string;
  daysRemaining: number;
  totalTasks: number;
  completedTasks: number;
  weeklyHours: number;
  currentStreak: number;
} | null> => {
  try {
    const program = await loadStudyProgram();
    if (!program) return null;
    
    const completions = await getTaskCompletions();
    
    // Also check for session-based completions
    const sessionCompletions: Record<string, boolean> = {};
    for (const task of program.dailyTasks) {
      const sessionKey = `session_completed_${task.id}`;
      const sessionStatus = await AsyncStorage.getItem(sessionKey);
      sessionCompletions[task.id] = sessionStatus === 'true';
    }
    
    // Safely parse exam date
    const today = new Date();
    let daysRemaining = 0;
    
    try {
      // Handle different date formats (YYYY-MM-DD or MM/DD/YYYY)
      let examDate: Date;
      if (program.examDate.includes('/')) {
        // MM/DD/YYYY format
        const [month, day, year] = program.examDate.split('/').map(Number);
        examDate = new Date(year, month - 1, day);
      } else {
        // YYYY-MM-DD format
        examDate = new Date(program.examDate);
      }
      
      if (!isNaN(examDate.getTime())) {
        daysRemaining = Math.max(0, Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
      }
      
    } catch (error) {
      console.warn('Error parsing exam date:', program.examDate);
      daysRemaining = 0;
    }
    
    const totalTasks = program.dailyTasks.length;
    const completedTasks = program.dailyTasks.filter(task => 
      completions[task.id] || task.completed || sessionCompletions[task.id]
    ).length;
    const currentStreak = await getStudyStreak();
    
    console.log('📊 Task completion debug:', {
      totalTasks,
      completedFromStorage: program.dailyTasks.filter(task => completions[task.id]).length,
      completedFromTaskStatus: program.dailyTasks.filter(task => task.completed).length,
      completedFromSessions: program.dailyTasks.filter(task => sessionCompletions[task.id]).length,
      totalCompleted: completedTasks,
      sessionKeys: Object.keys(sessionCompletions).filter(key => sessionCompletions[key])
    });
    
    return {
      examType: program.examType,
      startDate: program.startDate,
      examDate: program.examDate,
      daysRemaining,
      totalTasks,
      completedTasks,
      weeklyHours: program.weeklyHours,
      currentStreak,
    };
  } catch (error) {
    console.error('❌ Error getting program metadata:', error);
    return null;
  }
};

// Clear all study program data
export const clearStudyProgramData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    console.log('✅ Study program data cleared');
  } catch (error) {
    console.error('❌ Error clearing study program data:', error);
    throw error;
  }
};

// Achievement system types and data
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'streak' | 'time' | 'tasks' | 'subjects' | 'milestones';
  requirement: number;
  unit: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

// Define all achievements
export const ACHIEVEMENTS: Omit<Achievement, 'unlocked' | 'unlockedAt' | 'progress'>[] = [
  // Streak Achievements
  {
    id: 'first_day',
    title: 'Getting Started',
    description: 'Complete your first study session',
    icon: '🎯',
    category: 'streak',
    requirement: 1,
    unit: 'day',
    rarity: 'common'
  },
  {
    id: 'week_warrior',
    title: 'Week Warrior',
    description: 'Study for 7 consecutive days',
    icon: '🔥',
    category: 'streak',
    requirement: 7,
    unit: 'days',
    rarity: 'rare'
  },
  {
    id: 'study_machine',
    title: 'Study Machine',
    description: 'Study for 30 consecutive days',
    icon: '⚡',
    category: 'streak',
    requirement: 30,
    unit: 'days',
    rarity: 'epic'
  },
  {
    id: 'legendary_scholar',
    title: 'Legendary Scholar',
    description: 'Study for 100 consecutive days',
    icon: '👑',
    category: 'streak',
    requirement: 100,
    unit: 'days',
    rarity: 'legendary'
  },

  // Time Achievements
  {
    id: 'first_hour',
    title: 'First Hour',
    description: 'Study for 1 hour total',
    icon: '⏰',
    category: 'time',
    requirement: 60,
    unit: 'minutes',
    rarity: 'common'
  },
  {
    id: 'study_enthusiast',
    title: 'Study Enthusiast',
    description: 'Study for 10 hours total',
    icon: '📚',
    category: 'time',
    requirement: 600,
    unit: 'minutes',
    rarity: 'common'
  },
  {
    id: 'time_master',
    title: 'Time Master',
    description: 'Study for 50 hours total',
    icon: '🕐',
    category: 'time',
    requirement: 3000,
    unit: 'minutes',
    rarity: 'rare'
  },
  {
    id: 'study_marathon',
    title: 'Study Marathon',
    description: 'Study for 100 hours total',
    icon: '🏃‍♂️',
    category: 'time',
    requirement: 6000,
    unit: 'minutes',
    rarity: 'epic'
  },

  // Task Achievements
  {
    id: 'task_starter',
    title: 'Task Starter',
    description: 'Complete 10 tasks',
    icon: '✅',
    category: 'tasks',
    requirement: 10,
    unit: 'tasks',
    rarity: 'common'
  },
  {
    id: 'task_crusher',
    title: 'Task Crusher',
    description: 'Complete 50 tasks',
    icon: '💪',
    category: 'tasks',
    requirement: 50,
    unit: 'tasks',
    rarity: 'rare'
  },
  {
    id: 'task_master',
    title: 'Task Master',
    description: 'Complete 200 tasks',
    icon: '🎖️',
    category: 'tasks',
    requirement: 200,
    unit: 'tasks',
    rarity: 'epic'
  },

  // Subject Achievements
  {
    id: 'subject_explorer',
    title: 'Subject Explorer',
    description: 'Study 3 different subjects',
    icon: '🧭',
    category: 'subjects',
    requirement: 3,
    unit: 'subjects',
    rarity: 'common'
  },
  {
    id: 'well_rounded',
    title: 'Well Rounded',
    description: 'Get 50% progress in all subjects',
    icon: '🌟',
    category: 'subjects',
    requirement: 50,
    unit: 'percent',
    rarity: 'rare'
  },

  // Weekly Goals
  {
    id: 'weekly_hero',
    title: 'Weekly Hero',
    description: 'Complete 5 weekly goals',
    icon: '🏆',
    category: 'milestones',
    requirement: 5,
    unit: 'weeks',
    rarity: 'rare'
  },
  {
    id: 'consistency_king',
    title: 'Consistency King',
    description: 'Complete 12 weekly goals',
    icon: '👑',
    category: 'milestones',
    requirement: 12,
    unit: 'weeks',
    rarity: 'epic'
  },

  // Daily Goals
  {
    id: 'daily_achiever',
    title: 'Daily Achiever',
    description: 'Complete 10 daily goals',
    icon: '🎯',
    category: 'milestones',
    requirement: 10,
    unit: 'days',
    rarity: 'common'
  },
  {
    id: 'goal_destroyer',
    title: 'Goal Destroyer',
    description: 'Complete 50 daily goals',
    icon: '💥',
    category: 'milestones',
    requirement: 50,
    unit: 'days',
    rarity: 'epic'
  }
];

// Get user achievements with progress
export const getUserAchievements = async (): Promise<Achievement[]> => {
  try {
    // Get current stats
    const [metadata, weeklyProgress, studyStreak] = await Promise.all([
      getProgramMetadata(),
      calculateWeeklyProgress(),
      getStudyStreak()
    ]);

    // Get saved achievements
    const savedAchievements = await AsyncStorage.getItem('user_achievements');
    const userAchievements: Record<string, { unlocked: boolean; unlockedAt?: string }> = 
      savedAchievements ? JSON.parse(savedAchievements) : {};

    // Calculate total study time
    const tasks = await loadDailyTasks();
    const completions = await getTaskCompletions();
    const totalMinutes = tasks.reduce((sum, task) => {
      const completion = completions[task.id];
      if (completion || task.completed) {
        return sum + (completion?.duration || task.duration);
      }
      return sum;
    }, 0);

    // Calculate subject progress
    const subjectProgress = await getSubjectProgress();
    const subjects = Object.keys(subjectProgress);
    const allSubjectsAbove50 = subjects.length > 0 && 
      subjects.every(subject => subjectProgress[subject].progress >= 50);

    // Get weekly/daily goal completions
    const weeklyGoalsCompleted = await getWeeklyGoalsCompleted();
    const dailyGoalsCompleted = await getDailyGoalsCompleted();

    // Calculate progress for each achievement
    const achievements: Achievement[] = ACHIEVEMENTS.map(achievement => {
      let progress = 0;
      
      switch (achievement.id) {
        case 'first_day':
        case 'week_warrior':
        case 'study_machine':
        case 'legendary_scholar':
          progress = studyStreak;
          break;
          
        case 'first_hour':
        case 'study_enthusiast':
        case 'time_master':
        case 'study_marathon':
          progress = totalMinutes;
          break;
          
        case 'task_starter':
        case 'task_crusher':
        case 'task_master':
          progress = metadata?.completedTasks || 0;
          break;
          
        case 'subject_explorer':
          progress = subjects.length;
          break;
          
        case 'well_rounded':
          progress = allSubjectsAbove50 ? 100 : 0;
          break;
          
        case 'weekly_hero':
        case 'consistency_king':
          progress = weeklyGoalsCompleted;
          break;
          
        case 'daily_achiever':
        case 'goal_destroyer':
          progress = dailyGoalsCompleted;
          break;
      }

      const unlocked = userAchievements[achievement.id]?.unlocked || progress >= achievement.requirement;
      
      return {
        ...achievement,
        progress: Math.min(progress, achievement.requirement),
        unlocked,
        unlockedAt: userAchievements[achievement.id]?.unlockedAt
      };
    });

    // Check for newly unlocked achievements
    await checkAndUnlockAchievements(achievements, userAchievements);

    return achievements;
  } catch (error) {
    console.error('❌ Error getting user achievements:', error);
    return ACHIEVEMENTS.map(achievement => ({
      ...achievement,
      progress: 0,
      unlocked: false
    }));
  }
};

// Check for newly unlocked achievements
const checkAndUnlockAchievements = async (
  achievements: Achievement[], 
  userAchievements: Record<string, { unlocked: boolean; unlockedAt?: string }>
) => {
  const newlyUnlocked: Achievement[] = [];
  const updatedAchievements = { ...userAchievements };

  achievements.forEach(achievement => {
    if (!userAchievements[achievement.id]?.unlocked && achievement.progress >= achievement.requirement) {
      updatedAchievements[achievement.id] = {
        unlocked: true,
        unlockedAt: new Date().toISOString()
      };
      newlyUnlocked.push(achievement);
    }
  });

  if (newlyUnlocked.length > 0) {
    await AsyncStorage.setItem('user_achievements', JSON.stringify(updatedAchievements));
    console.log('🎉 New achievements unlocked:', newlyUnlocked.map(a => a.title));
  }
};

// Helper functions to get goal completion counts
const getWeeklyGoalsCompleted = async (): Promise<number> => {
  try {
    const completedWeeks = await AsyncStorage.getItem('weekly_goals_completed');
    return completedWeeks ? parseInt(completedWeeks) : 0;
  } catch (error) {
    return 0;
  }
};

const getDailyGoalsCompleted = async (): Promise<number> => {
  try {
    const completedDays = await AsyncStorage.getItem('daily_goals_completed');
    return completedDays ? parseInt(completedDays) : 0;
  } catch (error) {
    return 0;
  }
};

// Mark weekly goal as completed
export const markWeeklyGoalCompleted = async () => {
  try {
    const current = await getWeeklyGoalsCompleted();
    await AsyncStorage.setItem('weekly_goals_completed', (current + 1).toString());
  } catch (error) {
    console.error('Error marking weekly goal completed:', error);
  }
};

// Mark daily goal as completed
export const markDailyGoalCompleted = async () => {
  try {
    const current = await getDailyGoalsCompleted();
    await AsyncStorage.setItem('daily_goals_completed', (current + 1).toString());
  } catch (error) {
    console.error('Error marking daily goal completed:', error);
  }
};

// Check and mark daily goal completion
export const checkDailyGoalCompletion = async (date: string) => {
  try {
    const dailyProgress = await calculateDailyProgress(date);
    const dailyGoalKey = `daily_goal_${date}`;
    const alreadyMarked = await AsyncStorage.getItem(dailyGoalKey);
    
    // If all daily tasks are completed and not already marked
    if (dailyProgress.total > 0 && dailyProgress.completed >= dailyProgress.total && !alreadyMarked) {
      await AsyncStorage.setItem(dailyGoalKey, 'true');
      await markDailyGoalCompleted();
      console.log('🎯 Daily goal completed for', date);
    }
  } catch (error) {
    console.error('Error checking daily goal completion:', error);
  }
};

// Check and mark weekly goal completion
export const checkWeeklyGoalCompletion = async () => {
  try {
    const weeklyProgress = await calculateWeeklyProgress();
    const weekStart = getWeekStart(new Date()).toISOString().split('T')[0];
    const weeklyGoalKey = `weekly_goal_${weekStart}`;
    const alreadyMarked = await AsyncStorage.getItem(weeklyGoalKey);
    
    // If weekly target hours are met and not already marked
    const weeklyTarget = (await loadStudyProgram())?.weeklyHours || 15;
    if (weeklyProgress.hours >= weeklyTarget && !alreadyMarked) {
      await AsyncStorage.setItem(weeklyGoalKey, 'true');
      await markWeeklyGoalCompleted();
      console.log('🏆 Weekly goal completed for week of', weekStart);
    }
  } catch (error) {
    console.error('Error checking weekly goal completion:', error);
  }
};

// Helper function to get week start date
const getWeekStart = (date: Date): Date => {
  const day = date.getDay();
  const diff = date.getDate() - day;
  return new Date(date.setDate(diff));
};

// Daily motivation quotes collection
export const MOTIVATION_QUOTES = [
  // Success & Achievement
  "Success is the sum of small efforts repeated day in and day out. 💪",
  "Every expert was once a beginner. Keep going! 🌟",
  "Your only limit is your mind. Break through today! 🧠",
  "Progress, not perfection, is the goal. 📈",
  "The future belongs to those who believe in the beauty of their dreams. ✨",
  "Champions are made when nobody's watching. 🏆",
  "Excellence is not a skill, it's an attitude. 🎯",
  "Success starts with self-discipline. 💯",
  "Every accomplishment starts with the decision to try. 🚀",
  "Your potential is endless. Unlock it today! 🔓",

  // Study & Learning
  "Education is the most powerful weapon you can use to change the world. 📚",
  "The beautiful thing about learning is that no one can take it away from you. 🎓",
  "Study while others are sleeping; work while others are loafing. 📖",
  "Knowledge is power, but knowledge applied is even more powerful. ⚡",
  "Every page you read brings you closer to your goals. 📄",
  "Learning never exhausts the mind. Keep studying! 🧠",
  "The more you read, the more things you will know. 📚",
  "Intelligence plus character—that is the goal of true education. 🎯",
  "Study hard, dream big, achieve more! 🌟",
  "Today's preparation determines tomorrow's achievement. 📊",

  // Persistence & Hard Work
  "Don't watch the clock; do what it does. Keep going. ⏰",
  "Hard work beats talent when talent doesn't work hard. 💪",
  "The difference between ordinary and extraordinary is practice. 🎯",
  "Persistence is the twin sister of excellence. 🌟",
  "Small steps every day lead to big changes every year. 👣",
  "Keep going. Everything you need will come to you at the right time. ⏳",
  "Winners never quit, and quitters never win. 🏆",
  "The only impossible journey is the one you never begin. 🚀",
  "Consistency is the mother of mastery. 📈",
  "Rome wasn't built in a day, but they were laying bricks every hour. 🧱",

  // Motivation & Inspiration
  "Believe you can and you're halfway there. 💫",
  "The only way to do great work is to love what you do. ❤️",
  "You are capable of amazing things. Prove it today! 🌟",
  "Every morning brings new potential, but only if you make the most of it. 🌅",
  "Your attitude determines your direction. Choose positivity! 🧭",
  "Dream big, work hard, stay focused, and surround yourself with good people. 🎯",
  "The secret to getting ahead is getting started. 🏁",
  "You don't have to be great to get started, but you have to get started to be great. 🚀",
  "Motivation gets you started. Habit keeps you going. 🔄",
  "Be yourself; everyone else is already taken. Be amazing! ✨",

  // Growth & Learning
  "Growth begins at the end of your comfort zone. 🌱",
  "Every mistake is a step forward in disguise. 📚",
  "Challenge yourself, that's the only way you grow. 💪",
  "The expert in anything was once a beginner. 🎯",
  "Learning is a treasure that will follow its owner everywhere. 💎",
  "Invest in yourself. It pays the best interest. 💰",
  "Knowledge is like a garden: if it is not cultivated, it cannot be harvested. 🌿",
  "The capacity to learn is a gift; the ability to learn is a skill. 🎁",
  "Education is not preparation for life; education is life itself. 🌟",
  "A mind that is stretched by new experiences can never go back to its old dimensions. 🧠",

  // Focus & Determination
  "Focus on your goal. Don't look in any direction but ahead. 🎯",
  "Concentration and mental toughness are the margins of victory. 💪",
  "Where focus goes, energy flows and results show. ⚡",
  "Discipline is choosing between what you want now and what you want most. 🎯",
  "Stay focused and never give up. Your breakthrough is just around the corner. 🚀",
  "The successful warrior is the average person with laser-like focus. ⚔️",
  "Concentration is the secret of strength. 💪",
  "Focus on the step in front of you, not the whole staircase. 👣",
  "Clarity of mind means clarity of passion. 🧠",
  "Single-minded concentration in the direction of your dreams. 🌟",

  // Time & Opportunity
  "Time is what we want most, but what we use worst. Use it wisely! ⏰",
  "The best time to plant a tree was 20 years ago. The second best time is now. 🌳",
  "Don't wait for opportunity. Create it. 🛠️",
  "Time flies, but memories last forever. Make them count! ⏳",
  "Today is the first day of the rest of your life. Make it amazing! 🌅",
  "Yesterday is history, tomorrow is a mystery, today is a gift. 🎁",
  "The future depends on what you do today. 🔮",
  "Time you enjoy wasting is not wasted time, but time spent studying is invested time. 📚",
  "Procrastination is the thief of time. Take action now! ⚡",
  "Every moment is a fresh beginning. Start strong! 🌟",

  // Exam & Test Prep
  "Exam preparation is not about luck; it's about preparation meeting opportunity. 📝",
  "Your test score doesn't define you, but your effort does. 💪",
  "Prepare like you've never won, perform like you've never lost. 🏆",
  "Confidence comes from preparation. Study well, test well! 📚",
  "Every question you practice brings you closer to exam success. ❓",
  "Stay calm, stay focused, and trust your preparation. 🧘",
  "The exam is just a stepping stone to your dreams. Cross it confidently! 🌉",
  "Preparation prevents poor performance. You've got this! 🎯",
  "Your future self will thank you for the effort you put in today. 🙏",
  "Success in exams = Preparation + Practice + Positive mindset. ✅",

  // Weekend & Motivation
  "Weekends are for recharging, but also for getting ahead. 🔋",
  "Use this weekend to set yourself up for a successful week ahead. 📅",
  "Rest when you're weary. Refresh and renew yourself. But never quit! 💫",
  "Sunday planning prevents Monday panic. Prepare to excel! 📊",
  "Make today so awesome that yesterday gets jealous! 😎"
];

// Get daily motivation quote based on current date
export const getDailyMotivationQuote = (): string => {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  
  // Use day of year to get consistent daily quote
  const quoteIndex = dayOfYear % MOTIVATION_QUOTES.length;
  return MOTIVATION_QUOTES[quoteIndex];
}; 