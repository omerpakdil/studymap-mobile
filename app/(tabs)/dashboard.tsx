import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect as useFocusEffectNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StudyTask } from '@/app/utils/claudeStudyGenerator';
import NotificationService from '@/app/utils/notificationService';
import { trackAppSession } from '@/app/utils/reviewPrompt';
import {
  calculateDailyProgress,
  getDailyMotivationQuote,
  getProgramMetadata,
  getSubjectProgress,
  getTasksForDate
} from '@/app/utils/studyProgramStorage';
import { hasPremiumAccess } from '@/app/utils/subscriptionManager';
import { getReferralTrial, getReferralTrialDaysRemaining } from '@/app/utils/referralManager';
import { useTheme } from '@/themes';

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
  const [userName, setUserName] = useState<string>('');

  // Real data states
  const [programMetadata, setProgramMetadata] = useState<any>(null);
  const [todayTasks, setTodayTasks] = useState<StudyTask[]>([]);
  const [subjectProgress, setSubjectProgress] = useState<any>({});
  const [dailyProgress, setDailyProgress] = useState({ completed: 0, total: 0, minutes: 0 });
  const [loading, setLoading] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState(false);

  // Task completion tracking
  const [taskCompletions, setTaskCompletions] = useState<Record<string, boolean>>({});

  // Referral trial tracking
  const [referralTrial, setReferralTrial] = useState<any>(null);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState(0);
  const [showTrialWarning, setShowTrialWarning] = useState(false);
  
  // Load referral trial data
  const loadTrialData = async () => {
    try {
      const trial = await getReferralTrial();
      const daysRemaining = await getReferralTrialDaysRemaining();

      setReferralTrial(trial);
      setTrialDaysRemaining(daysRemaining);

      // Show warning if trial has ≤2 days remaining
      if (trial && trial.isActive && daysRemaining <= 2) {
        setShowTrialWarning(true);
      } else {
        setShowTrialWarning(false);
      }

      console.log('📊 Trial data loaded:', { daysRemaining, isActive: trial?.isActive });
    } catch (error) {
      console.error('❌ Error loading trial data:', error);
    }
  };

  // Check subscription status on component mount
  const checkSubscriptionStatus = async () => {
    try {
      // Development bypass - only active in __DEV__ mode
      if (__DEV__) {
        console.log('🚧 DEV MODE: Bypassing subscription check for development');
        return true;
      }

      // Check if we just came from successful subscription
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const skipCheck = await AsyncStorage.getItem('skip_subscription_check');

      if (skipCheck === 'true') {
        console.log('✅ Skipping subscription check - user just subscribed');
        // Clear the flag for next time
        await AsyncStorage.removeItem('skip_subscription_check');
        return true;
      }

      // Production: Check actual subscription status
      const hasSubscription = await hasPremiumAccess();
      if (!hasSubscription) {
        // Check if user has expired trial
        const trial = await getReferralTrial();
        const hasExpiredTrial = trial && !trial.isActive;

        if (hasExpiredTrial) {
          // Hard block: Trial expired, must subscribe
          Alert.alert(
            '🎓 Trial Ended',
            'Your 7-day free trial has ended. Subscribe now to continue accessing your personalized study plan.',
            [
              {
                text: 'Subscribe Now',
                onPress: () => {
                  router.replace('/(onboarding)/subscription');
                }
              }
            ],
            { cancelable: false }
          );
          // Force redirect after alert
          setTimeout(() => {
            router.replace('/(onboarding)/subscription');
          }, 100);
        } else {
          // No trial at all, redirect immediately
          router.replace('/(onboarding)/subscription');
        }
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error checking subscription status:', error);
      // In production, deny access on error for security
      if (!__DEV__) {
        router.replace('/(onboarding)/subscription');
        return false;
      }
      return true; // Allow access in dev mode if check fails
    }
  };

  // Load user info
  const loadUserInfo = async () => {
    try {
      const userInfoStr = await AsyncStorage.getItem('user_info');
      if (userInfoStr) {
        const userInfo = JSON.parse(userInfoStr);
        setUserName(userInfo.firstName || '');
      }
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  };

  // Load real data from Claude-generated program
  const loadDashboardData = async (isInitialLoad: boolean = false) => {
    try {
      setLoading(true);

      // Load trial data first (before subscription check)
      await loadTrialData();

      // Check subscription first
      const hasValidSubscription = await checkSubscriptionStatus();
      // Note: We allow users to stay even without subscription (soft paywall)

      // Only check/initialize notifications on first app load, not on every focus
      if (isInitialLoad) {
        // Check notification permission without reinitializing
        const hasPermission = NotificationService.hasNotificationPermission();
        setNotificationPermission(hasPermission);

        // Only initialize if not already initialized
        if (!hasPermission) {
          const initialized = await NotificationService.initialize();
          setNotificationPermission(initialized);
        }
      }

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
        dailyProgress: dailyProg,
        notificationPermission: isInitialLoad ? notificationPermission : 'skipped'
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
    loadUserInfo();
    loadDashboardData(true); // Initial load with notification check
    trackAppSession(); // Track app session for review prompt
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
      case 'practice': return 'create-outline';
      case 'study': return 'book-outline';
      case 'review': return 'refresh-outline';
      case 'quiz': return 'bulb-outline';
      default: return 'document-text-outline';
    }
  };

  const getTaskTypeColor = (type: string) => {
    switch (type) {
      case 'practice': return colors.warning[600];
      case 'study': return colors.primary[600];
      case 'review': return colors.success[600];
      case 'quiz': return colors.secondary[600];
      default: return colors.neutral[600];
    }
  };

  const handleStartStudySession = (task: StudyTask) => {
    router.push({
      pathname: '/study-session' as any,
      params: {
        taskId: task.id,
        subject: task.subject,
        type: task.type,
        duration: task.duration.toString(),
        title: task.title,
      },
    });
  };

  const handleNotificationPress = () => {
    if (!notificationPermission) {
      Alert.alert(
        'Notifications Disabled',
        'Enable notifications in your device settings to receive study reminders and motivational quotes.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => {
            // On real devices, this would open device settings
            Alert.alert('Info', 'Please go to Settings > StudyMap > Notifications to enable.');
          }}
        ]
      );
    } else {
      router.push('/(tabs)/profile');
    }
  };

  const focusEffectCallback = useCallback(() => {
    loadDashboardData(false); // Subsequent loads without notification init
  }, []);

  useFocusEffectNavigation(focusEffectCallback);

  // Show loading state
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primary[50] }}>
        <LinearGradient
          colors={[colors.primary[400], colors.primary[500], colors.primary[600]]}
          style={{ width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <ActivityIndicator size="large" color="#fff" />
        </LinearGradient>
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.primary[700], marginBottom: 8, textAlign: 'center' }}>
          Preparing your dashboard...
        </Text>
        <Text style={{ fontSize: 15, color: colors.neutral[500], textAlign: 'center', maxWidth: 260 }}>
          Please wait while we load your personalized study data.
        </Text>
      </View>
    );
  }

  // Calculate real metrics
  const completedTasks = Object.values(taskCompletions).filter(Boolean).length;

  // Calculate daily goal minutes from today's actual tasks
  const todayGoalMinutes = todayTasks.reduce((total, task) => total + task.duration, 0);
  const progressPercentage = todayGoalMinutes > 0 ? Math.min(100, (dailyProgress.minutes / todayGoalMinutes) * 100) : 0;

  // Render trial warning banner
  const renderTrialWarningBanner = () => {
    if (!showTrialWarning || !referralTrial || !referralTrial.isActive) {
      return null;
    }

    const isLastDay = trialDaysRemaining === 1;
    const bannerColor = isLastDay ? colors.error : colors.warning;

    return (
      <View style={[styles.trialWarningBanner, { backgroundColor: bannerColor[50], borderColor: bannerColor[200] }]}>
        <View style={styles.trialWarningContent}>
          <Ionicons
            name={isLastDay ? "alert-circle" : "time-outline"}
            size={24}
            color={bannerColor[600]}
            style={styles.trialWarningIcon}
          />
          <View style={styles.trialWarningText}>
            <Text style={[styles.trialWarningTitle, { color: bannerColor[800] }]}>
              {isLastDay ? '⏰ Last Day of Trial!' : `⏰ ${trialDaysRemaining} Days Left`}
            </Text>
            <Text style={[styles.trialWarningSubtitle, { color: bannerColor[700] }]}>
              {isLastDay
                ? 'Your free trial ends today. Subscribe to keep learning!'
                : `Your trial ends soon. Subscribe to continue your study plan.`}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.trialWarningButton, { backgroundColor: bannerColor[600] }]}
          onPress={() => router.push('/(onboarding)/subscription')}
        >
          <Text style={styles.trialWarningButtonText}>Subscribe Now</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.neutral[50] }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.neutral[50]} translucent={false} />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.neutral[600] }]}>
            {greeting}{userName && `, ${userName}`}! 👋
          </Text>
          <Text style={[styles.headerTitle, { color: colors.neutral[900] }]}>
            Ready to crush your {programMetadata.examType?.toUpperCase()}?
          </Text>
        </View>
        <TouchableOpacity style={[styles.notificationButton, { backgroundColor: colors.neutral[100] }]} onPress={handleNotificationPress}>
          <Text style={styles.notificationIcon}>
            {notificationPermission ? '🔔' : '🔕'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Trial Warning Banner */}
      {renderTrialWarningBanner()}

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
              <Ionicons name="checkmark-circle" size={28} color={colors.success[600]} style={styles.statIcon} />
              <Text style={[styles.statValue, { color: colors.success[700] }]}>
                {completedTasks}/{todayTasks.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.success[600] }]}>
                Tasks Done
              </Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.warning[50] }]}>
              <Ionicons name="time" size={28} color={colors.warning[600]} style={styles.statIcon} />
              <Text style={[styles.statValue, { color: colors.warning[700] }]}>
                {dailyProgress.minutes}m
              </Text>
              <Text style={[styles.statLabel, { color: colors.warning[600] }]}>
                Studied Today
              </Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.primary[50] }]}>
              <Ionicons name="flame" size={28} color={colors.primary[600]} style={styles.statIcon} />
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
                              Today&apos;s Study Plan
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
                <Ionicons name="checkmark-done-circle" size={48} color={colors.success[600]} style={{ marginBottom: 12 }} />
                <Text style={[styles.noTasksTitle, { color: colors.neutral[600] }]}>
                  No tasks scheduled for today!
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
                      <Ionicons 
                        name={getTaskTypeIcon(task.type) as any} 
                        size={18} 
                        color={getTaskTypeColor(task.type)} 
                      />
                    </View>
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
          <Ionicons name="star" size={32} color={colors.success[600]} style={styles.motivationIcon} />
          <Text style={[styles.motivationQuote, { color: colors.success[800] }]}>
            {getDailyMotivationQuote()}
          </Text>
          <Text style={[styles.motivationAuthor, { color: colors.success[600] }]}>
            — Daily Motivation
          </Text>
        </View>

        {/* Bottom Spacing - Account for tab bar */}
        <View style={{ height: Platform.OS === 'ios' ? 100 : 88 }} />
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
    paddingTop: isIOS ? 12: 20,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
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
  statIcon: {
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

  // Trial warning banner styles
  trialWarningBanner: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  trialWarningContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  trialWarningIcon: {
    marginRight: 12,
  },
  trialWarningText: {
    flex: 1,
  },
  trialWarningTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  trialWarningSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  trialWarningButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  trialWarningButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
}); 