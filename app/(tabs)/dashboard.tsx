import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect as useFocusEffectNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    Dimensions,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { StudyTask } from '@/app/utils/claudeStudyGenerator';
import {
    calculateDailyProgress,
    getProgramMetadata,
    getSubjectProgress,
    getTasksForDate
} from '@/app/utils/studyProgramStorage';
import { useTheme } from '@/themes';

const { width } = Dimensions.get('window');
const isIOS = Platform.OS === 'ios';

export default function DashboardScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [greeting] = useState(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  });

  // Real data states
  const [programMetadata, setProgramMetadata] = useState<any>(null);
  const [todayTasks, setTodayTasks] = useState<StudyTask[]>([]);
  const [subjectProgress, setSubjectProgress] = useState<any>({});
  const [dailyProgress, setDailyProgress] = useState({ completed: 0, total: 0, minutes: 0 });
  const [loading, setLoading] = useState(true);

  // Task completion tracking
  const [taskCompletions, setTaskCompletions] = useState<Record<string, boolean>>({});
  
  // Load real data from Claude-generated program
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load program metadata
      const metadata = await getProgramMetadata();
      setProgramMetadata(metadata);
      
      // Load today's tasks
      const today = new Date().toISOString().split('T')[0];
      const tasks = await getTasksForDate(today);
      setTodayTasks(tasks);
      
      // Load subject progress
      const progress = await getSubjectProgress();
      setSubjectProgress(progress);
      
      // Load daily progress
      const dailyProg = await calculateDailyProgress(today);
      setDailyProgress(dailyProg);
      
      console.log('📊 Dashboard data loaded:', {
        tasksToday: tasks.length,
        subjects: Object.keys(progress).length,
        dailyProgress: dailyProg
      });
      
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load task completion status
  const loadTaskCompletions = async () => {
    try {
      const completions: Record<string, boolean> = {};
      
      for (const task of todayTasks) {
        const key = `session_completed_${task.id}`;
        const status = await AsyncStorage.getItem(key);
        completions[task.id] = status === 'true' || task.completed;
      }
      
      setTaskCompletions(completions);
    } catch (error) {
      console.log('Error loading task completions:', error);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (todayTasks.length > 0) {
      loadTaskCompletions();
    }
  }, [todayTasks]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      default: return '➖';
    }
  };

  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case 'practice': return '✏️';
      case 'study': return '📚';
      case 'review': return '🔄';
      case 'quiz': return '🧠';
      default: return '📝';
    }
  };

  const handleStartStudySession = (task: StudyTask) => {
    router.push({
      pathname: '/study-session' as any,
      params: {
        taskId: task.id,
        subject: task.subject,
        topic: task.topic,
        type: task.type,
        duration: task.duration.toString(),
        title: task.title,
      },
    });
  };

  const focusEffectCallback = useCallback(() => {
    loadDashboardData();
  }, []);

  useFocusEffectNavigation(focusEffectCallback);

  // Show loading state
  if (loading || !programMetadata) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.neutral[50] }]}>
        <View style={[styles.loadingContainer, { justifyContent: 'center', alignItems: 'center', flex: 1 }]}>
          <Text style={[styles.loadingText, { color: colors.neutral[600] }]}>
            🧠 Loading your personalized study program...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Calculate real metrics
  const completedTasks = Object.values(taskCompletions).filter(Boolean).length;
  
  // Calculate daily goal minutes from today's actual tasks
  const todayGoalMinutes = todayTasks.reduce((total, task) => total + task.duration, 0);
  const progressPercentage = todayGoalMinutes > 0 ? Math.min(100, (dailyProgress.minutes / todayGoalMinutes) * 100) : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.neutral[50] }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.neutral[50]} />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.neutral[600] }]}>
            {greeting}! 👋
          </Text>
          <Text style={[styles.headerTitle, { color: colors.neutral[900] }]}>
            Ready to crush your {programMetadata.examType?.toUpperCase()}?
          </Text>
        </View>
        <TouchableOpacity style={[styles.notificationButton, { backgroundColor: colors.neutral[100] }]}>
          <Text style={styles.notificationIcon}>🔔</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Progress Overview */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.neutral[900] }]}>
            Progress Overview
          </Text>
          
          {/* Main Progress Card */}
          <View style={[styles.progressCard, { backgroundColor: colors.neutral[0] }]}>
            <LinearGradient
              colors={[colors.primary[500], colors.primary[600]] as const}
              style={styles.progressGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.progressContent}>
                <View style={styles.progressLeft}>
                  <Text style={styles.progressPercentage}>{Math.round(progressPercentage)}%</Text>
                  <Text style={styles.progressLabel}>Daily Goal</Text>
                </View>
                <View style={styles.progressRight}>
                  <View style={styles.progressStat}>
                    <Text style={styles.progressStatValue}>{programMetadata.daysRemaining}</Text>
                    <Text style={styles.progressStatLabel}>Days Left</Text>
                  </View>
                  <View style={styles.progressStat}>
                    <Text style={styles.progressStatValue}>{todayTasks.length > 0 ? Math.round((completedTasks / todayTasks.length) * 100) : 0}%</Text>
                    <Text style={styles.progressStatLabel}>Tasks Done</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <View style={[styles.statCard, { backgroundColor: colors.success[50] }]}>
              <Text style={styles.statEmoji}>🎯</Text>
              <Text style={[styles.statValue, { color: colors.success[700] }]}>
                {completedTasks}/{todayTasks.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.success[600] }]}>
                Tasks Done
              </Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.warning[50] }]}>
              <Text style={styles.statEmoji}>⏱️</Text>
              <Text style={[styles.statValue, { color: colors.warning[700] }]}>
                {dailyProgress.minutes}m
              </Text>
              <Text style={[styles.statLabel, { color: colors.warning[600] }]}>
                Studied Today
              </Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.primary[50] }]}>
              <Text style={styles.statEmoji}>🔥</Text>
              <Text style={[styles.statValue, { color: colors.primary[700] }]}>
                {programMetadata.currentStreak || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.primary[600] }]}>
                Day Streak
              </Text>
            </View>
          </View>
        </View>

        {/* Today's Study Plan */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.neutral[900] }]}>
              Today's Study Plan
            </Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/calendar')}>
              <Text style={[styles.seeAllText, { color: colors.primary[500] }]}>
                View Calendar
              </Text>
            </TouchableOpacity>
          </View>

          {/* Daily Progress Bar */}
          <View style={[styles.dailyProgressContainer, { backgroundColor: colors.neutral[0] }]}>
            <View style={styles.dailyProgressHeader}>
              <Text style={[styles.dailyProgressTitle, { color: colors.neutral[800] }]}>
                Daily Goal Progress
              </Text>
              <Text style={[styles.dailyProgressText, { color: colors.neutral[600] }]}>
                {dailyProgress.minutes}/{todayGoalMinutes} min
              </Text>
            </View>
            <View style={[styles.progressBarBg, { backgroundColor: colors.neutral[200] }]}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { 
                    backgroundColor: colors.primary[500],
                    width: `${Math.min(progressPercentage, 100)}%`
                  }
                ]} 
              />
            </View>
          </View>

          {/* Task List */}
          <View style={styles.taskList}>
            {todayTasks.length === 0 ? (
              <View style={[styles.noTasksContainer, { backgroundColor: colors.neutral[50] }]}>
                <Text style={[styles.noTasksTitle, { color: colors.neutral[600] }]}>
                  🎉 No tasks scheduled for today!
                </Text>
                <Text style={[styles.noTasksText, { color: colors.neutral[500] }]}>
                  Enjoy your free day or check the calendar for upcoming tasks.
                </Text>
              </View>
            ) : (
              todayTasks.map((task, index) => {
              const isCompleted = taskCompletions[task.id] || false;
              return (
                <TouchableOpacity
                  key={task.id}
                  style={[
                    styles.taskItem,
                    { backgroundColor: colors.neutral[0] },
                    isCompleted && { opacity: 0.7 }
                  ]}
                  onPress={() => handleStartStudySession(task)}
                >
                  <View style={styles.taskCheckbox}>
                    {isCompleted ? (
                      <View style={[styles.checkbox, styles.checkboxCompleted, { backgroundColor: colors.success[500] }]}>
                        <Text style={styles.checkmark}>✓</Text>
                      </View>
                    ) : (
                      <View style={[styles.checkbox, { borderColor: colors.neutral[300] }]} />
                    )}
                  </View>
                  
                  <View style={styles.taskContent}>
                    <View style={styles.taskHeader}>
                      <Text style={[styles.taskSubject, { color: colors.neutral[900] }]}>
                        {task.subject}
                      </Text>
                      <Text style={[styles.taskType, { color: colors.neutral[500] }]}>
                        {getTaskTypeIcon(task.type)}
                      </Text>
                    </View>
                    <Text style={[styles.taskTopic, { color: colors.neutral[600] }]}>
                      {task.topic}
                    </Text>
                    <Text style={[styles.taskDuration, { color: colors.neutral[500] }]}>
                      {task.duration} minutes {isCompleted ? '(Completed ✅)' : ''}
                    </Text>
                  </View>
                </TouchableOpacity>
                              );
              })
            )}
          </View>
        </View>

        {/* Recent Performance */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.neutral[900] }]}>
              Recent Performance
            </Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/progress')}>
              <Text style={[styles.seeAllText, { color: colors.primary[500] }]}>
                View Details
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.performanceList}>
            {Object.entries(subjectProgress).map(([subject, progress]: [string, any], index) => (
              <View
                key={index}
                style={[styles.performanceCard, { backgroundColor: colors.neutral[0] }]}
              >
                <View style={styles.performanceLeft}>
                  <Text style={[styles.performanceSubject, { color: colors.neutral[800] }]}>
                    {subject}
                  </Text>
                  <Text style={[styles.performanceScore, { color: colors.neutral[600] }]}>
                    {progress.progress}% completed ({progress.completed}/{progress.total} tasks)
                  </Text>
                </View>
                <View style={styles.performanceRight}>
                  <Text style={styles.performanceTrend}>
                    {progress.progress >= 75 ? '📈' : progress.progress >= 50 ? '➖' : '📉'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Motivational Quote */}
        <View style={[styles.motivationCard, { backgroundColor: colors.success[50], borderColor: colors.success[200] }]}>
          <Text style={styles.motivationIcon}>✨</Text>
          <Text style={[styles.motivationQuote, { color: colors.success[800] }]}>
            "Success is the sum of small efforts repeated day in and day out."
          </Text>
          <Text style={[styles.motivationAuthor, { color: colors.success[600] }]}>
            — Robert Collier
          </Text>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: isIOS ? 8 : 16,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationIcon: {
    fontSize: 18,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressCard: {
    borderRadius: 16,
    marginBottom: 16,
    marginTop: 16, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  progressGradient: {
    borderRadius: 16,
    padding: 20,
  },
  progressContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLeft: {
    alignItems: 'center',
  },
  progressPercentage: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  progressRight: {
    flexDirection: 'row',
    gap: 24,
  },
  progressStat: {
    alignItems: 'center',
  },
  progressStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  progressStatLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  quickStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  dailyProgressContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  dailyProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dailyProgressTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  dailyProgressText: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 8,
    borderRadius: 4,
  },
  taskList: {
    gap: 12,
  },
  taskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  taskCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  taskCheckIcon: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  taskContent: {
    flex: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  taskSubject: {
    fontSize: 15,
    fontWeight: '600',
  },
  taskTypeIcon: {
    fontSize: 16,
  },
  taskTopic: {
    fontSize: 13,
    lineHeight: 18,
  },
  taskRight: {
    alignItems: 'flex-end',
  },
  taskDuration: {
    fontSize: 12,
    fontWeight: '500',
  },
  performanceList: {
    gap: 12,
  },
  performanceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  performanceLeft: {},
  performanceSubject: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  performanceScore: {
    fontSize: 13,
  },
  performanceRight: {},
  performanceTrend: {
    fontSize: 20,
  },
  motivationCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 8,
  },
  motivationIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  motivationQuote: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  motivationAuthor: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  
  // Checkbox styles
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    borderWidth: 0,
  },
  checkmark: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  taskType: {
    fontSize: 12,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '700',
  },
  
  // No tasks styles
  noTasksContainer: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 8,
  },
  noTasksTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  noTasksText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
}); 