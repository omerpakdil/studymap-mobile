import AsyncStorage from '@react-native-async-storage/async-storage';
import { StudyProgram, StudyTask } from './aiStudyGenerator';

// Storage keys
const STORAGE_KEYS = {
  STUDY_PROGRAM: 'study_program',
  DAILY_TASKS: 'daily_tasks',
  TASK_COMPLETIONS: 'task_completions',
  PROGRAM_PROGRESS: 'program_progress',
};

// Study program storage functions
export const saveStudyProgram = async (program: StudyProgram): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.STUDY_PROGRAM, JSON.stringify(program));
    console.log('Study program saved successfully');
  } catch (error) {
    console.error('Error saving study program:', error);
    throw error;
  }
};

export const loadStudyProgram = async (): Promise<StudyProgram | null> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.STUDY_PROGRAM);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error loading study program:', error);
    return null;
  }
};

// Daily tasks management
export const saveDailyTasks = async (tasks: StudyTask[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.DAILY_TASKS, JSON.stringify(tasks));
  } catch (error) {
    console.error('Error saving daily tasks:', error);
    throw error;
  }
};

export const loadDailyTasks = async (): Promise<StudyTask[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_TASKS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading daily tasks:', error);
    return [];
  }
};

// Task completion management
export const markTaskComplete = async (taskId: string): Promise<void> => {
  try {
    const completions = await getTaskCompletions();
    completions[taskId] = {
      completedAt: new Date().toISOString(),
      duration: 0, // Will be updated with actual duration
    };
    await AsyncStorage.setItem(STORAGE_KEYS.TASK_COMPLETIONS, JSON.stringify(completions));
  } catch (error) {
    console.error('Error marking task complete:', error);
    throw error;
  }
};

export const updateTaskCompletion = async (taskId: string, duration: number): Promise<void> => {
  try {
    const completions = await getTaskCompletions();
    if (completions[taskId]) {
      completions[taskId].duration = duration;
      await AsyncStorage.setItem(STORAGE_KEYS.TASK_COMPLETIONS, JSON.stringify(completions));
    }
  } catch (error) {
    console.error('Error updating task completion:', error);
    throw error;
  }
};

export const getTaskCompletions = async (): Promise<Record<string, { completedAt: string; duration: number }>> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.TASK_COMPLETIONS);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Error getting task completions:', error);
    return {};
  }
};

// Get tasks for specific date
export const getTasksForDate = async (date: string): Promise<StudyTask[]> => {
  try {
    const allTasks = await loadDailyTasks();
    const completions = await getTaskCompletions();
    
    return allTasks
      .filter(task => task.date === date)
      .map(task => ({
        ...task,
        completed: !!completions[task.id],
      }));
  } catch (error) {
    console.error('Error getting tasks for date:', error);
    return [];
  }
};

// Get tasks for current week
export const getWeeklyTasks = async (): Promise<StudyTask[]> => {
  try {
    const allTasks = await loadDailyTasks();
    const completions = await getTaskCompletions();
    
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
    
    const startDateString = startOfWeek.toISOString().split('T')[0];
    const endDateString = endOfWeek.toISOString().split('T')[0];
    
    return allTasks
      .filter(task => task.date >= startDateString && task.date <= endDateString)
      .map(task => ({
        ...task,
        completed: !!completions[task.id],
      }));
  } catch (error) {
    console.error('Error getting weekly tasks:', error);
    return [];
  }
};

// Progress calculation functions
export const calculateDailyProgress = async (date?: string): Promise<{ completed: number; total: number; minutes: number }> => {
  try {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const tasks = await getTasksForDate(targetDate);
    const completions = await getTaskCompletions();
    
    const completedTasks = tasks.filter(task => completions[task.id]);
    const totalMinutes = completedTasks.reduce((sum, task) => {
      const completion = completions[task.id];
      return sum + (completion?.duration || task.duration);
    }, 0);
    
    return {
      completed: completedTasks.length,
      total: tasks.length,
      minutes: totalMinutes,
    };
  } catch (error) {
    console.error('Error calculating daily progress:', error);
    return { completed: 0, total: 0, minutes: 0 };
  }
};

export const calculateWeeklyProgress = async (): Promise<{ completed: number; total: number; hours: number }> => {
  try {
    const tasks = await getWeeklyTasks();
    const completions = await getTaskCompletions();
    
    const completedTasks = tasks.filter(task => completions[task.id]);
    const totalHours = completedTasks.reduce((sum, task) => {
      const completion = completions[task.id];
      return sum + (completion?.duration || task.duration);
    }, 0) / 60; // Convert to hours
    
    return {
      completed: completedTasks.length,
      total: tasks.length,
      hours: Math.round(totalHours * 10) / 10, // Round to 1 decimal
    };
  } catch (error) {
    console.error('Error calculating weekly progress:', error);
    return { completed: 0, total: 0, hours: 0 };
  }
};

// Subject-wise progress
export const getSubjectProgress = async (): Promise<Record<string, { completed: number; total: number; hours: number }>> => {
  try {
    const tasks = await loadDailyTasks();
    const completions = await getTaskCompletions();
    
    const progress: Record<string, { completed: number; total: number; hours: number }> = {};
    
    tasks.forEach(task => {
      if (!progress[task.subject]) {
        progress[task.subject] = { completed: 0, total: 0, hours: 0 };
      }
      
      progress[task.subject].total++;
      
      if (completions[task.id]) {
        progress[task.subject].completed++;
        const completion = completions[task.id];
        progress[task.subject].hours += (completion?.duration || task.duration) / 60;
      }
    });
    
    // Round hours to 1 decimal place
    Object.keys(progress).forEach(subject => {
      progress[subject].hours = Math.round(progress[subject].hours * 10) / 10;
    });
    
    return progress;
  } catch (error) {
    console.error('Error calculating subject progress:', error);
    return {};
  }
};

// Study streak calculation
export const getStudyStreak = async (): Promise<number> => {
  try {
    const completions = await getTaskCompletions();
    const today = new Date();
    let streak = 0;
    
    // Check each day going backwards from today
    for (let i = 0; i < 365; i++) { // Max 1 year streak
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateString = checkDate.toISOString().split('T')[0];
      
      const dayTasks = await getTasksForDate(dateString);
      const dayCompletions = dayTasks.filter(task => completions[task.id]);
      
      if (dayCompletions.length > 0) {
        streak++;
      } else if (i > 0) { // Don't break on today if no tasks completed yet
        break;
      }
    }
    
    return streak;
  } catch (error) {
    console.error('Error calculating study streak:', error);
    return 0;
  }
};

// Clear all study program data
export const clearStudyProgramData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    console.log('Study program data cleared');
  } catch (error) {
    console.error('Error clearing study program data:', error);
    throw error;
  }
};

// Program status check
export const isProgramGenerated = async (): Promise<boolean> => {
  try {
    const program = await loadStudyProgram();
    return !!program;
  } catch (error) {
    console.error('Error checking program status:', error);
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
} | null> => {
  try {
    const program = await loadStudyProgram();
    if (!program) return null;
    
    const completions = await getTaskCompletions();
    const examDate = new Date(program.examDate);
    const today = new Date();
    const daysRemaining = Math.max(0, Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    
    const totalTasks = program.dailyTasks.length;
    const completedTasks = program.dailyTasks.filter(task => completions[task.id]).length;
    
    return {
      examType: program.examType,
      startDate: program.startDate,
      examDate: program.examDate,
      daysRemaining,
      totalTasks,
      completedTasks,
    };
  } catch (error) {
    console.error('Error getting program metadata:', error);
    return null;
  }
}; 