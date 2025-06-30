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
      return JSON.parse(data);
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
export const calculateDailyProgress = async (date?: string): Promise<{ completed: number; total: number; minutes: number }> => {
  try {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const tasks = await getTasksForDate(targetDate);
    const completions = await getTaskCompletions();
    
    const completedTasks = tasks.filter(task => completions[task.id] || task.completed);
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
    console.error('❌ Error calculating daily progress:', error);
    return { completed: 0, total: 0, minutes: 0 };
  }
};

// Calculate weekly progress
export const calculateWeeklyProgress = async (): Promise<{ completed: number; total: number; hours: number }> => {
  try {
    const tasks = await getWeeklyTasks();
    const completions = await getTaskCompletions();
    
    const completedTasks = tasks.filter(task => completions[task.id] || task.completed);
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
    console.error('❌ Error calculating weekly progress:', error);
    return { completed: 0, total: 0, hours: 0 };
  }
};

// Get subject-wise progress
export const getSubjectProgress = async (): Promise<Record<string, { completed: number; total: number; hours: number; progress: number }>> => {
  try {
    const tasks = await loadDailyTasks();
    const completions = await getTaskCompletions();
    
    const progress: Record<string, { completed: number; total: number; hours: number; progress: number }> = {};
    
    tasks.forEach(task => {
      if (!progress[task.subject]) {
        progress[task.subject] = { completed: 0, total: 0, hours: 0, progress: 0 };
      }
      
      progress[task.subject].total++;
      
      if (completions[task.id] || task.completed) {
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

// Calculate study streak
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
      const dayCompletions = dayTasks.filter(task => completions[task.id] || task.completed);
      
      if (dayCompletions.length > 0) {
        streak++;
      } else if (i > 0) { // Don't break on today if no tasks completed yet
        break;
      }
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
    const completedTasks = program.dailyTasks.filter(task => completions[task.id] || task.completed).length;
    const currentStreak = await getStudyStreak();
    
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