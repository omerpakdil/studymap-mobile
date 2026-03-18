import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect as useFocusEffectNavigation } from '@react-navigation/native';
import * as Device from 'expo-device';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AttachStep } from 'react-native-spotlight-tour';

import { useAppAlert } from '@/app/components/ui/AppAlert';
import { resolveAppLanguage, t } from '@/app/i18n';
import { getLocalizedExamName } from '@/app/i18n/examNames';
import { getLocalizedSubjectName } from '@/app/i18n/subjectNames';
import { formatDaysCompact, formatMinutesCompact, getMinuteUnitShort } from '@/app/i18n/unitFormat';
import { getAdaptiveReviewSignal, type AdaptiveReviewSignal } from '@/app/utils/focusSessionFeedback';
import { getLocalDateKey } from '@/app/utils/localDate';
import NotificationService from '@/app/utils/notificationService';
import { checkPremiumAccess, getTrialStatus } from '@/app/utils/premiumUtils';
import { syncRemoteNotificationState } from '@/app/utils/remoteNotificationService';
import { trackAppSession } from '@/app/utils/reviewPrompt';
import { setCachedPremiumStatus } from '@/app/utils/subscriptionManager';
import {
  adaptSubjectFocusFromPerformance,
  calculateDailyProgress,
  getLatestStudyActivityAt,
  getProgramMetadata,
  getSubjectProgress,
  getTaskCompletions,
  getTasksForDate,
  rebalanceUpcomingTasks,
} from '@/app/utils/studyProgramStorage';
import { StudyTask } from '@/app/utils/studyTypes';

const isIOS = Platform.OS === 'ios';
const PREMIUM_REFRESH_INTERVAL_MS = 12 * 60 * 60 * 1000;
const PREMIUM_REFRESH_KEY = 'last_premium_refresh_at';
const DASH = {
  bg0: '#F6FCFB',
  bg1: '#F0FAF8',
  bg2: '#E8F6F2',
  ink: '#0F172A',
  sub: 'rgba(51,65,85,0.76)',
  muted: 'rgba(100,116,139,0.76)',
  card: '#FFFFFF',
  cardBorder: 'rgba(15,157,140,0.14)',
  track: 'rgba(148,163,184,0.20)',
  teal: '#0F9D8C',
  tealDk: '#0B7A6E',
  green: '#16A34A',
  amber: '#D97706',
  rose: '#E11D48',
};

// ─── Circular Progress Ring ──────────────────────────────────────────────────
function CircularProgress({
  percentage,
  size = 110,
  strokeWidth = 10,
  color,
  bgColor,
  children,
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  bgColor: string;
  children?: React.ReactNode;
}) {
  const clamp = Math.min(100, Math.max(0, percentage));
  const angle = (clamp / 100) * 360;

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      {/* BG track */}
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: bgColor,
        }}
      />
      {/* Arc overlay */}
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: 'transparent',
          borderTopColor: color,
          borderRightColor: angle >= 90 ? color : 'transparent',
          borderBottomColor: angle >= 180 ? color : 'transparent',
          borderLeftColor: angle >= 270 ? color : 'transparent',
          transform: [{ rotate: '-90deg' }],
        }}
      />
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>{children}</View>
    </View>
  );
}

// ─── Subject Progress Bar ────────────────────────────────────────────────────
function SubjectBar({
  subject, progress, completed, total, index, delay = 0,
}: {
  subject: string; progress: number;
  completed: number; total: number; index: number; delay?: number;
}) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const t = setTimeout(() => {
      Animated.timing(widthAnim, { toValue: progress, duration: 700, useNativeDriver: false }).start();
    }, delay);
    return () => clearTimeout(t);
  }, [progress]);

  const animWidth = widthAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });
  const trend = progress >= 75 ? 'trending-up' : progress >= 40 ? 'remove' : 'trending-down';

  return (
    <View style={[styles.subjectRow, isTablet && styles.subjectRowTablet]}>
      <View style={[styles.subjectRowHeader, isTablet && styles.subjectRowHeaderTablet]}>
        <View style={[styles.subjectRowLeft, isTablet && styles.subjectRowLeftTablet]}>
          <View style={[styles.subjectDot, isTablet && styles.subjectDotTablet]}>
            <Text style={[styles.subjectDotTxt, isTablet && styles.subjectDotTxtTablet]}>{index + 1}</Text>
          </View>
          <Text style={[styles.subjectName, isTablet && styles.subjectNameTablet]}>{subject}</Text>
        </View>
        <View style={[styles.subjectRowRight, isTablet && styles.subjectRowRightTablet]}>
          <Ionicons name={trend as any} size={isTablet ? 16 : 13} color={DASH.teal} />
          <Text style={[styles.subjectPct, isTablet && styles.subjectPctTablet]}>{progress}%</Text>
          <Text style={[styles.subjectMeta, isTablet && styles.subjectMetaTablet]}>{completed}/{total}</Text>
        </View>
      </View>
      <View style={[styles.subjectTrack, isTablet && styles.subjectTrackTablet]}>
        <Animated.View style={[styles.subjectFill, isTablet && styles.subjectFillTablet, { width: animWidth }]} />
      </View>
    </View>
  );
}

// ─── Task Card ───────────────────────────────────────────────────────────────
function TaskCard({
  task, isCompleted, displayDuration, onPress, typeColor, typeIcon, typeLabel, index, subjectLabel, doneLabel, appLang,
}: {
  task: StudyTask; isCompleted: boolean; onPress: () => void;
  displayDuration: number;
  typeColor: string; typeIcon: string; typeLabel: string; index: number; subjectLabel: string; doneLabel: string; appLang: ReturnType<typeof resolveAppLanguage>;
}) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const translateY = useRef(new Animated.Value(18)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 9 }),
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    }, index * 75);
    return () => clearTimeout(t);
  }, []);

  return (
    <Animated.View style={{ transform: [{ translateY }], opacity }}>
      <TouchableOpacity
        style={[styles.taskCard, isTablet && styles.taskCardTablet, isCompleted && styles.taskCardDone]}
        onPress={onPress}
        activeOpacity={0.78}
      >
        <View style={[styles.taskAccent, isTablet && styles.taskAccentTablet, { backgroundColor: isCompleted ? DASH.teal : typeColor }]} />

        <View style={[
          styles.taskCircle,
          isTablet && styles.taskCircleTablet,
          isCompleted
            ? { backgroundColor: DASH.teal, borderColor: DASH.teal }
            : { backgroundColor: typeColor + '15', borderColor: typeColor + '80' },
        ]}>
          {isCompleted && <Ionicons name="checkmark" size={isTablet ? 16 : 13} color="#fff" />}
        </View>

        <View style={styles.taskBody}>
          <Text style={[styles.taskSubject, isTablet && styles.taskSubjectTablet, isCompleted && styles.taskSubjectDone]}>
            {subjectLabel}
          </Text>
          <View style={[styles.taskMeta, isTablet && styles.taskMetaTablet]}>
            <View style={[styles.taskBadge, isTablet && styles.taskBadgeTablet, { backgroundColor: typeColor + '18' }]}>
              <Ionicons name={typeIcon as any} size={isTablet ? 13 : 11} color={typeColor} />
              <Text style={[styles.taskBadgeText, isTablet && styles.taskBadgeTextTablet, { color: typeColor }]}>{typeLabel}</Text>
            </View>
            <Text style={[styles.taskDuration, isTablet && styles.taskDurationTablet]}>{formatMinutesCompact(displayDuration, appLang)}</Text>
          </View>
        </View>

            {isCompleted ? (
              <View style={[styles.doneTag, isTablet && styles.doneTagTablet]}>
                <Ionicons name="checkmark-circle" size={isTablet ? 15 : 13} color={DASH.teal} />
                <Text style={[styles.doneTagText, isTablet && styles.doneTagTextTablet]}>{doneLabel}</Text>
              </View>
            ) : (
              <View style={[styles.playBtn, isTablet && styles.playBtnTablet, { backgroundColor: typeColor }]}>
                <Ionicons name="play" size={isTablet ? 16 : 13} color="#fff" />
              </View>
            )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const { showAlert } = useAppAlert();
  const router = useRouter();
  const appLang = resolveAppLanguage();

  const [greeting] = useState(() => {
    const h = new Date().getHours();
    if (h < 12) return t('tabs.dashboard.greeting_morning', { lang: appLang, fallback: 'Good morning' });
    if (h < 18) return t('tabs.dashboard.greeting_afternoon', { lang: appLang, fallback: 'Good afternoon' });
    return t('tabs.dashboard.greeting_evening', { lang: appLang, fallback: 'Good evening' });
  });

  const [userName, setUserName] = useState('');
  const [programMetadata, setProgramMetadata] = useState<any>(null);
  const [todayTasks, setTodayTasks] = useState<StudyTask[]>([]);
  const [subjectProgress, setSubjectProgress] = useState<any>({});
  const [dailyProgress, setDailyProgress] = useState({ completed: 0, total: 0, minutes: 0 });
  const [loading, setLoading] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState(false);
  const [taskCompletions, setTaskCompletions] = useState<Record<string, { completed: boolean; duration?: number }>>({});
  const [trialDaysRemaining, setTrialDaysRemaining] = useState(0);
  const [showTrialWarning, setShowTrialWarning] = useState(false);
  const [adaptiveReviewSignal, setAdaptiveReviewSignal] = useState<AdaptiveReviewSignal | null>(null);
  const [activeTab, setActiveTab] = useState<'tasks' | 'subjects'>('tasks');
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [metricSheet, setMetricSheet] = useState<{ visible: boolean; title: string; value: string; lines: string[] }>({
    visible: false,
    title: '',
    value: '',
    lines: [],
  });

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-10)).current;
  const tabAnim = useRef(new Animated.Value(1)).current;
  const premiumRefreshInFlight = useRef(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(headerTranslateY, { toValue: 0, useNativeDriver: true, tension: 80 }),
    ]).start();
  }, []);

  const loadTrialData = async () => {
    try {
      const s = await getTrialStatus();
      setTrialDaysRemaining(s.daysRemaining);
      setShowTrialWarning(s.showWarning);
    } catch {}
  };

  const checkSubscriptionStatus = async () => {
    try {
      if (__DEV__) return true;
      const ps = await checkPremiumAccess();
      if (!ps.hasAccess) {
        showAlert(
          t('tabs.dashboard.premium_required_title', { lang: appLang, fallback: 'Premium Required' }),
          t('tabs.dashboard.premium_required_body', { lang: appLang, fallback: 'Subscribe to access your personalized study plan. Start with a 7-day free trial!' }),
          [{ text: t('tabs.dashboard.start_free_trial', { lang: appLang, fallback: 'Start Free Trial' }), onPress: () => router.replace('/(onboarding-v2)/subscription') }],
          { cancelable: false }
        );
        setTimeout(() => router.replace('/(onboarding-v2)/subscription'), 100);
        return false;
      }
      return true;
    } catch {
      if (!__DEV__) { router.replace('/(onboarding-v2)/subscription'); return false; }
      return true;
    }
  };

  const refreshPremiumAccessInBackground = useCallback(async () => {
    if (__DEV__ || premiumRefreshInFlight.current) return;

    try {
      const lastRefresh = await AsyncStorage.getItem(PREMIUM_REFRESH_KEY);
      const now = Date.now();
      if (lastRefresh && now - Number(lastRefresh) < PREMIUM_REFRESH_INTERVAL_MS) {
        return;
      }

      premiumRefreshInFlight.current = true;
      await AsyncStorage.setItem(PREMIUM_REFRESH_KEY, String(now));

      const premiumStatus = await checkPremiumAccess();
      await setCachedPremiumStatus(premiumStatus.hasAccess ? 'active' : 'inactive');

      if (!premiumStatus.hasAccess) {
        router.replace('/(onboarding-v2)/subscription');
      }
    } catch {
      // Intentionally silent: dashboard should stay usable if refresh fails.
    } finally {
      premiumRefreshInFlight.current = false;
    }
  }, [router]);

  const loadUserInfo = async () => {
    try {
      const str = await AsyncStorage.getItem('user_info');
      if (str) setUserName(JSON.parse(str).firstName || '');
    } catch {}
  };

  const loadDashboardData = async (isInitialLoad = false) => {
    try {
      setLoading(true);
      const today = getLocalDateKey();
      await loadTrialData();
      await checkSubscriptionStatus();

      if (isInitialLoad) {
        const permissionSettings = await Notifications.getPermissionsAsync();
        setNotificationPermission(permissionSettings.granted);
        if (permissionSettings.granted) {
          setNotificationPermission(await NotificationService.initialize());
        }
      }

      const lastRebalance = await AsyncStorage.getItem('last_rebalance_date');
      if (lastRebalance !== today) {
        await rebalanceUpcomingTasks({ fromDate: today, maxTasksPerDay: 5 });
        await AsyncStorage.setItem('last_rebalance_date', today);
      }

      const yr = new Date().getFullYear();
      const isoWeekKey = `${yr}-W${Math.ceil(
        ((Date.now() - new Date(yr, 0, 1).getTime()) / 86400000 + new Date(yr, 0, 1).getDay() + 1) / 7
      )}`;
      const lastWeek = await AsyncStorage.getItem('last_focus_adapt_week');
      if (lastWeek !== isoWeekKey) {
        await adaptSubjectFocusFromPerformance({ fromDate: today, lookbackDays: 21, futureWindowDays: 21, maxSwaps: 10 });
        await AsyncStorage.setItem('last_focus_adapt_week', isoWeekKey);
      }

      const [metadata, tasks, progress, dailyProg, adaptiveSignal] = await Promise.all([
        getProgramMetadata(), getTasksForDate(today), getSubjectProgress(), calculateDailyProgress(today), getAdaptiveReviewSignal(),
      ]);
      setProgramMetadata(metadata);
      setTodayTasks(tasks);
      setSubjectProgress(progress);
      setDailyProgress(dailyProg);
      setAdaptiveReviewSignal(adaptiveSignal);
      if (metadata) {
        const lastStudySessionAt = await getLatestStudyActivityAt();
        void syncRemoteNotificationState({
          studyStreak: metadata.currentStreak,
          completedTasks: metadata.completedTasks,
          planUpdatedAt: new Date().toISOString(),
          lastOpenedAt: new Date().toISOString(),
          lastStudySessionAt,
          nextExamDate: metadata.examDate || null,
        });
      }
    } catch (e) {
      console.error('❌ Dashboard load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadTaskCompletions = async () => {
    try {
      const storedCompletions = await getTaskCompletions();
      const completions: Record<string, { completed: boolean; duration?: number }> = {};
      for (const task of todayTasks) {
        const val = await AsyncStorage.getItem(`session_completed_${task.id}`);
        const stored = storedCompletions[task.id];
        completions[task.id] = {
          completed: val === 'true' || task.completed || !!stored,
          duration: stored?.duration,
        };
      }
      setTaskCompletions(completions);
    } catch {}
  };

  useEffect(() => { loadUserInfo(); loadDashboardData(true); trackAppSession(); }, []);
  useEffect(() => { if (todayTasks.length > 0) loadTaskCompletions(); }, [todayTasks]);
  useEffect(() => { setShowAllTasks(false); }, [todayTasks]);
  useFocusEffectNavigation(useCallback(() => {
    loadDashboardData(false);
    void refreshPremiumAccessInBackground();
  }, [refreshPremiumAccessInBackground]));
  useEffect(() => {
    const timer = setTimeout(() => {
      void refreshPremiumAccessInBackground();
    }, 1500);

    return () => clearTimeout(timer);
  }, [refreshPremiumAccessInBackground]);

  const getTypeIcon = (type: string) => {
    const map: Record<string,string> = { practice:'create-outline', study:'book-outline', review:'refresh-outline', quiz:'bulb-outline' };
    return map[type] || 'document-text-outline';
  };
  const getTypeColor = (type: string) => {
    const map: Record<string,string> = { practice:DASH.teal, study:DASH.teal, review:DASH.teal, quiz:DASH.teal };
    return map[type] || DASH.teal;
  };
  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      practice: t('tabs.dashboard.task_type_practice', { lang: appLang, fallback: 'Practice' }),
      study: t('tabs.dashboard.task_type_study', { lang: appLang, fallback: 'Study' }),
      review: t('tabs.dashboard.task_type_review', { lang: appLang, fallback: 'Review' }),
      quiz: t('tabs.dashboard.task_type_quiz', { lang: appLang, fallback: 'Quiz' }),
    };
    return map[type] || type;
  };

  const handleStartSession = (task: StudyTask) => {
    router.push({
      pathname: '/study-session' as any,
      params: {
        taskId: task.id,
        subject: task.subject,
        type: task.type,
        duration: task.duration.toString(),
        title: task.title,
        examCode: programMetadata?.examType,
      },
    });
  };

  const handleNotificationPress = useCallback(async () => {
    if (!Device.isDevice) {
      showAlert(
        t('tabs.dashboard.notifications_simulator_title', { lang: appLang, fallback: 'Simulator limitation' }),
        t('tabs.dashboard.notifications_simulator_body', { lang: appLang, fallback: 'Notification permission prompts do not run in the iOS simulator. Test this on a real device.' })
      );
      return;
    }

    const permissionSettings = await Notifications.getPermissionsAsync();
    setNotificationPermission(permissionSettings.granted);

    if (permissionSettings.granted) {
      router.push('/(tabs)/profile');
      return;
    }

    if (permissionSettings.canAskAgain) {
      const granted = await NotificationService.initialize();
      setNotificationPermission(granted);

      if (granted) {
        router.push('/(tabs)/profile');
        return;
      }
    }

    showAlert(
      t('tabs.dashboard.notifications_disabled_title', { lang: appLang, fallback: 'Notifications Disabled' }),
      t('tabs.dashboard.notifications_disabled_body', { lang: appLang, fallback: 'Enable notifications in device settings.' })
    );

    await Linking.openSettings().catch(() => {});
  }, [appLang, router, showAlert]);

  const switchTab = (next: 'tasks' | 'subjects') => {
    if (next === activeTab) return;
    Animated.timing(tabAnim, { toValue: 0, duration: 110, useNativeDriver: true }).start(() => {
      setActiveTab(next);
      tabAnim.setValue(0);
      Animated.spring(tabAnim, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 240 }).start();
    });
  };

  const openMetricSheet = (label: string, value: string) => {
    const tasksLabel = t('tabs.dashboard.metric_tasks', { lang: appLang, fallback: 'Tasks' });
    const studiedLabel = t('tabs.dashboard.metric_studied', { lang: appLang, fallback: 'Studied' });
    const streakLabel = t('tabs.dashboard.metric_streak', { lang: appLang, fallback: 'Streak' });
    const lines =
      label === tasksLabel
        ? [
          t('tabs.dashboard.sheet_tasks_line_1', { lang: appLang, params: { completed: completedTasks, total: todayTasks.length }, fallback: `Completed ${completedTasks} of ${todayTasks.length}` }),
          t('tabs.dashboard.sheet_tasks_line_2', { lang: appLang, fallback: 'Tap a task to start instantly.' }),
        ]
        : label === studiedLabel
          ? [
            t('tabs.dashboard.sheet_studied_line_1', { lang: appLang, params: { minutes: dailyProgress.minutes }, fallback: `${dailyProgress.minutes} minutes logged today` }),
            t('tabs.dashboard.sheet_studied_line_2', { lang: appLang, params: { target: todayGoalMins }, fallback: `Target: ${todayGoalMins} minutes` }),
          ]
          : label === streakLabel
            ? [
              t('tabs.dashboard.sheet_streak_line_1', { lang: appLang, params: { days: currentStreak }, fallback: `Current consistency: ${currentStreak} day streak` }),
              t('tabs.dashboard.sheet_streak_line_2', { lang: appLang, fallback: 'Keep one session daily to extend it.' }),
            ]
            : [
              t('tabs.dashboard.sheet_done_line_1', { lang: appLang, params: { value: taskPct }, fallback: `Task completion is ${taskPct}%` }),
              t('tabs.dashboard.sheet_done_line_2', { lang: appLang, fallback: 'Finish remaining tasks to hit 100%.' }),
            ];
    setMetricSheet({ visible: true, title: label, value, lines });
  };

  // ── Loading ──
  if (loading) {
    return (
      <View style={styles.loadWrap}>
        <LinearGradient colors={[DASH.bg0, DASH.bg1, DASH.bg2]} style={StyleSheet.absoluteFill} />
        <LinearGradient colors={[DASH.tealDk, DASH.teal]} style={styles.loadBall} start={{ x:0,y:0 }} end={{ x:1,y:1 }}>
          <ActivityIndicator size="large" color="#fff" />
        </LinearGradient>
        <Text style={styles.loadTitle}>{t('tabs.dashboard.loading_title', { lang: appLang, fallback: 'Loading your plan...' })}</Text>
        <Text style={styles.loadSub}>{t('tabs.dashboard.loading_subtitle', { lang: appLang, fallback: 'Personalizing your experience' })}</Text>
      </View>
    );
  }

  // ── Derived ──
  const completedTasks = Object.values(taskCompletions).filter((entry) => entry?.completed).length;
  const todayGoalMins = todayTasks.reduce((t, tk) => t + tk.duration, 0);
  const progressPct = todayGoalMins > 0 ? Math.min(100, (dailyProgress.minutes / todayGoalMins) * 100) : 0;
  const taskPct = todayTasks.length > 0 ? Math.round((completedTasks / todayTasks.length) * 100) : 0;
  const examType = getLocalizedExamName(programMetadata?.examType, appLang, programMetadata?.examType || 'EXAM');
  const subjectLabel = (subject: string) =>
    getLocalizedSubjectName(subject, appLang, subject, { examCode: programMetadata?.examType });
  const doneLabel = t('tabs.dashboard.metric_done', { lang: appLang, fallback: 'Done' });
  const daysRemaining = programMetadata?.daysRemaining || 0;
  const currentStreak = programMetadata?.currentStreak || 0;
  const subjectEntries = Object.entries(subjectProgress);
  const initialVisibleTaskCount = adaptiveReviewSignal?.active ? 1 : 2;
  const canCollapseTasks = todayTasks.length > initialVisibleTaskCount;
  const visibleTasks = canCollapseTasks && !showAllTasks ? todayTasks.slice(0, initialVisibleTaskCount) : todayTasks;
  const hiddenTaskCount = Math.max(0, todayTasks.length - visibleTasks.length);
  const isEmptyTasksState = activeTab === 'tasks' && todayTasks.length === 0;
  const adaptiveSubjects = (adaptiveReviewSignal?.affectedSubjects || []).map((subject) => subjectLabel(subject));
  const adaptiveReviewLine = adaptiveReviewSignal?.active
    ? adaptiveSubjects.length <= 1
      ? t('tabs.dashboard.adaptive_review_line_one', {
          lang: appLang,
          params: { subject: adaptiveSubjects[0] || t('tabs.dashboard.adaptive_review_subject_generic', { lang: appLang, fallback: 'A subject' }) },
          fallback: '{subject} is getting extra short-term review after recent friction.',
        })
      : t('tabs.dashboard.adaptive_review_line_multi', {
          lang: appLang,
          params: { subjects: adaptiveSubjects.slice(0, 2).join(' · ') },
          fallback: '{subjects} are getting extra short-term review after recent friction.',
        })
    : null;

  return (
    <SafeAreaView style={styles.container} edges={['top','left','right']}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <LinearGradient colors={[DASH.bg0, DASH.bg1, DASH.bg2]} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
      <View style={styles.bgOrbA} />
      <View style={styles.bgOrbB} />

      {/* ── Header ── */}
      <Animated.View style={[styles.header, isTablet && styles.headerTablet, { opacity: headerOpacity, transform: [{ translateY: headerTranslateY }] }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.greetingKicker, isTablet && styles.greetingKickerTablet]}>{t('tabs.dashboard.kicker', { lang: appLang, fallback: 'StudyMap Dashboard' })}</Text>
          <Text style={[styles.headerTitle, isTablet && styles.headerTitleTablet]} numberOfLines={1}>
            {greeting}
          </Text>
          {!!userName && (
            <Text style={[styles.headerName, isTablet && styles.headerNameTablet]} numberOfLines={1}>
              {userName}
            </Text>
          )}
          <Text style={[styles.headerSub, isTablet && styles.headerSubTablet]}>
            {t('tabs.dashboard.focused_on', { lang: appLang, fallback: 'Focused on' })}{' '}
            <Text style={styles.headerExam}>{examType}</Text>
          </Text>
        </View>
        <View style={[styles.headerRight, isTablet && styles.headerRightTablet]}>
          <View style={[styles.streakPill, isTablet && styles.streakPillTablet]}>
            <View style={[styles.streakDot, isTablet && styles.streakDotTablet]} />
            <Text style={[styles.streakTxt, isTablet && styles.streakTxtTablet]}>{t('tabs.dashboard.metric_streak', { lang: appLang, fallback: 'Streak' })}</Text>
            <Text style={[styles.streakNum, isTablet && styles.streakNumTablet]}>{formatDaysCompact(currentStreak, appLang)}</Text>
          </View>
          <TouchableOpacity
            style={[styles.notifBtn, isTablet && styles.notifBtnTablet]}
            onPress={() => void handleNotificationPress()}
          >
            <Ionicons
              name={Device.isDevice ? (notificationPermission ? 'notifications' : 'notifications-off-outline') : 'notifications-outline'}
              size={isTablet ? 24 : 20}
              color={Device.isDevice ? (notificationPermission ? DASH.teal : '#94A3B8') : DASH.teal}
            />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* ── Trial Banner ── */}
      {showTrialWarning && (
        <TouchableOpacity
          style={[styles.trialBanner, { backgroundColor: trialDaysRemaining === 1 ? '#FEF2F2' : '#FFFBEB' }]}
          onPress={() => router.push('/(onboarding-v2)/subscription')}
          activeOpacity={0.85}
        >
          <Ionicons
            name={trialDaysRemaining === 1 ? 'alert-circle' : 'time-outline'}
            size={17}
            color={trialDaysRemaining === 1 ? '#EF4444' : '#F59E0B'}
          />
          <Text style={[styles.trialText, { color: trialDaysRemaining === 1 ? '#B91C1C' : '#92400E' }]}>
            {trialDaysRemaining === 1
              ? t('tabs.dashboard.trial_last_day', { lang: appLang, fallback: 'Last day of trial! Subscribe now →' })
              : t('tabs.dashboard.trial_days_left', {
                lang: appLang,
                params: { days: trialDaysRemaining },
                fallback: `${trialDaysRemaining} days left in your trial → Subscribe`,
              })}
          </Text>
        </TouchableOpacity>
      )}

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, isTablet && styles.scrollContentTablet]} showsVerticalScrollIndicator={false}>

        {/* ── Hero Card ── */}
        <View style={[styles.heroCard, isTablet && styles.heroCardTablet]}>
          <LinearGradient
            colors={['#0F766E','#0F9D8C','#2DD4BF']}
            style={[styles.heroGradient, isTablet && styles.heroGradientTablet]}
            start={{ x:0, y:0 }} end={{ x:1, y:1 }}
          >
            <View style={[styles.heroBlob1, isTablet && styles.heroBlob1Tablet]} />
            <View style={[styles.heroBlob2, isTablet && styles.heroBlob2Tablet]} />
            <View style={[styles.heroRow, isTablet && styles.heroRowTablet]}>
              {/* Circular progress */}
              <CircularProgress
                percentage={progressPct} size={isTablet ? 148 : 108} strokeWidth={isTablet ? 12 : 9}
                color="rgba(255,255,255,0.95)" bgColor="rgba(255,255,255,0.22)"
              >
                <Text style={[styles.heroCirclePct, isTablet && styles.heroCirclePctTablet]}>{Math.round(progressPct)}%</Text>
                <Text style={[styles.heroCircleLabel, isTablet && styles.heroCircleLabelTablet]}>{t('tabs.dashboard.daily', { lang: appLang, fallback: 'Daily' })}</Text>
              </CircularProgress>

              {/* Right stats */}
              <View style={styles.heroStats}>
                <Text style={[styles.heroStatsTitle, isTablet && styles.heroStatsTitleTablet]}>{t('tabs.dashboard.todays_progress', { lang: appLang, fallback: "Today's Progress" })}</Text>
                <View style={[styles.heroStatRow, isTablet && styles.heroStatRowTablet]}>
                  <View style={styles.heroStat}>
                    <Text style={[styles.heroStatVal, isTablet && styles.heroStatValTablet]}>{dailyProgress.minutes}<Text style={[styles.heroStatUnit, isTablet && styles.heroStatUnitTablet]}>{getMinuteUnitShort(appLang)}</Text></Text>
                    <Text style={[styles.heroStatLbl, isTablet && styles.heroStatLblTablet]}>{t('tabs.dashboard.metric_studied', { lang: appLang, fallback: 'Studied' })}</Text>
                  </View>
                  <View style={[styles.heroStatSep, isTablet && styles.heroStatSepTablet]} />
                  <View style={styles.heroStat}>
                    <Text style={[styles.heroStatVal, isTablet && styles.heroStatValTablet]}>{todayGoalMins}<Text style={[styles.heroStatUnit, isTablet && styles.heroStatUnitTablet]}>{getMinuteUnitShort(appLang)}</Text></Text>
                    <Text style={[styles.heroStatLbl, isTablet && styles.heroStatLblTablet]}>{t('tabs.dashboard.goal', { lang: appLang, fallback: 'Goal' })}</Text>
                  </View>
                  <View style={[styles.heroStatSep, isTablet && styles.heroStatSepTablet]} />
                  <View style={styles.heroStat}>
                    <Text style={[styles.heroStatVal, isTablet && styles.heroStatValTablet]}>{daysRemaining}</Text>
                    <Text style={[styles.heroStatLbl, isTablet && styles.heroStatLblTablet]}>{t('tabs.dashboard.days_left', { lang: appLang, fallback: 'Days Left' })}</Text>
                  </View>
                </View>
                {/* Tasks mini bar */}
                <View style={[styles.heroMiniBar, isTablet && styles.heroMiniBarTablet]}>
                  <View style={[styles.heroMiniTrack, isTablet && styles.heroMiniTrackTablet]}>
                    <View style={[styles.heroMiniFill, isTablet && styles.heroMiniFillTablet, { width: `${taskPct}%` as any }]} />
                  </View>
                  <Text style={[styles.heroMiniText, isTablet && styles.heroMiniTextTablet]}>
                    {t('tabs.dashboard.tasks_count', {
                      lang: appLang,
                      params: { completed: completedTasks, total: todayTasks.length },
                      fallback: `${completedTasks}/${todayTasks.length} tasks`,
                    })}
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* ── Stat Pills ── */}
        <View style={[styles.metricsBoard, isTablet && styles.metricsBoardTablet]}>
          {[
            { label: t('tabs.dashboard.metric_tasks', { lang: appLang, fallback: 'Tasks' }), value: `${completedTasks}/${todayTasks.length}` },
            { label: t('tabs.dashboard.metric_studied', { lang: appLang, fallback: 'Studied' }), value: formatMinutesCompact(dailyProgress.minutes, appLang) },
            { label: t('tabs.dashboard.metric_streak', { lang: appLang, fallback: 'Streak' }), value: formatDaysCompact(currentStreak, appLang) },
            { label: t('tabs.dashboard.metric_done', { lang: appLang, fallback: 'Done' }), value: `${taskPct}%` },
          ].map((m, i) => (
            <TouchableOpacity
              key={m.label}
              style={[styles.metricCell, isTablet && styles.metricCellTablet, i > 0 && styles.metricCellSep]}
              onPress={() => openMetricSheet(m.label, m.value)}
              activeOpacity={0.78}
            >
              <Text
                style={[styles.metricLabel, isTablet && styles.metricLabelTablet]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.72}
              >
                {m.label}
              </Text>
              <Text style={[styles.metricValue, isTablet && styles.metricValueTablet]}>{m.value}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Tab Toggle ── */}
        <View style={[styles.tabRow, isTablet && styles.tabRowTablet]}>
          <AttachStep index={1}>
            <TouchableOpacity
              style={[styles.tab, isTablet && styles.tabTablet, activeTab === 'tasks' && styles.tabActive]}
              onPress={() => switchTab('tasks')}
            >
              <Ionicons name="list" size={isTablet ? 18 : 15} color={activeTab === 'tasks' ? DASH.teal : '#94A3B8'} />
              <Text style={[styles.tabText, isTablet && styles.tabTextTablet, activeTab === 'tasks' && styles.tabTextActive]}>
                {t('tabs.dashboard.tab_today_plan', { lang: appLang, fallback: "Today's Plan" })}
              </Text>
            </TouchableOpacity>
          </AttachStep>
          <TouchableOpacity
            style={[styles.tab, isTablet && styles.tabTablet, activeTab === 'subjects' && styles.tabActive]}
            onPress={() => switchTab('subjects')}
          >
            <Ionicons name="bar-chart" size={isTablet ? 18 : 15} color={activeTab === 'subjects' ? DASH.teal : '#94A3B8'} />
            <Text style={[styles.tabText, isTablet && styles.tabTextTablet, activeTab === 'subjects' && styles.tabTextActive]}>
              {t('tabs.dashboard.tab_subjects', { lang: appLang, fallback: 'Subjects' })}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Tasks Tab ── */}
        <Animated.View
          style={{
            opacity: tabAnim,
            transform: [{ translateY: tabAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
          }}
        >
        {activeTab === 'tasks' && (
          <>
            {/* Daily goal bar */}
            <View style={[styles.goalCard, isTablet && styles.goalCardTablet]}>
              <View style={[styles.goalCardRow, isTablet && styles.goalCardRowTablet]}>
                <View>
                  <Text style={[styles.goalCardTitle, isTablet && styles.goalCardTitleTablet]}>{t('tabs.dashboard.daily_goal', { lang: appLang, fallback: 'Daily Goal' })}</Text>
                  <Text style={[styles.goalCardSub, isTablet && styles.goalCardSubTablet]}>
                    {t('tabs.dashboard.minutes_progress', {
                      lang: appLang,
                      params: { done: dailyProgress.minutes, total: todayGoalMins },
                      fallback: `${dailyProgress.minutes} of ${todayGoalMins} minutes`,
                    })}
                  </Text>
                </View>
                <View style={[styles.goalBadge, isTablet && styles.goalBadgeTablet, { backgroundColor: progressPct >= 100 ? 'rgba(45,212,191,0.18)' : 'rgba(45,212,191,0.12)' }]}>
                  {progressPct >= 100 ? (
                    <View style={styles.goalBadgeDoneRow}>
                      <Ionicons name="checkmark-done-circle" size={isTablet ? 16 : 13} color={DASH.teal} />
                      <Text style={[styles.goalBadgeText, isTablet && styles.goalBadgeTextTablet, { color: DASH.tealDk }]}>
                        {t('tabs.dashboard.metric_done', { lang: appLang, fallback: 'Done' })}
                      </Text>
                    </View>
                  ) : (
                    <Text style={[styles.goalBadgeText, isTablet && styles.goalBadgeTextTablet, { color: DASH.tealDk }]}>
                      {`${Math.round(progressPct)}%`}
                    </Text>
                  )}
                </View>
              </View>
            <View style={[styles.goalTrack, isTablet && styles.goalTrackTablet]}>
              <View style={[styles.goalFill, isTablet && styles.goalFillTablet, { width: `${Math.min(progressPct, 100)}%` as any }]} />
            </View>
          </View>

            {adaptiveReviewSignal?.active && adaptiveReviewLine ? (
              <View style={[styles.adaptCard, isTablet && styles.adaptCardTablet]}>
                <View style={[styles.adaptAccent, isTablet && styles.adaptAccentTablet]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.adaptTag, isTablet && styles.adaptTagTablet]}>
                    {t('tabs.dashboard.adaptive_review_title', { lang: appLang, fallback: 'ADAPTIVE REVIEW' })}
                  </Text>
                  <Text style={[styles.adaptBody, isTablet && styles.adaptBodyTablet]}>{adaptiveReviewLine}</Text>
                </View>
                <Text style={[styles.adaptCount, isTablet && styles.adaptCountTablet]}>{adaptiveReviewSignal.hardCount + adaptiveReviewSignal.incompleteCount}</Text>
              </View>
            ) : null}

            {/* Tasks */}
            {todayTasks.length === 0 ? (
              <View style={[styles.emptyCard, isTablet && styles.emptyCardTablet]}>
                <View style={[styles.emptyIconBox, isTablet && styles.emptyIconBoxTablet]}>
                  <View style={styles.emptyGlyphBarA} />
                  <View style={styles.emptyGlyphBarB} />
                </View>
                <Text style={[styles.emptyTitle, isTablet && styles.emptyTitleTablet]}>{t('tabs.dashboard.empty_all_clear', { lang: appLang, fallback: 'All clear for today' })}</Text>
                <Text style={[styles.emptySub, isTablet && styles.emptySubTablet]}>{t('tabs.dashboard.empty_no_sessions', { lang: appLang, fallback: "No sessions left. You can review tomorrow's plan now." })}</Text>
                <View style={styles.emptyList}>
                  <View style={styles.emptyListRow}>
                    <View style={styles.emptyListDot} />
                    <Text style={[styles.emptyListText, isTablet && styles.emptyListTextTablet]}>{t('tabs.dashboard.empty_queue_done', { lang: appLang, fallback: "Today's queue is completed" })}</Text>
                  </View>
                  <View style={styles.emptyListRow}>
                    <View style={styles.emptyListDot} />
                    <Text style={[styles.emptyListText, isTablet && styles.emptyListTextTablet]}>{t('tabs.dashboard.empty_next_ready', { lang: appLang, fallback: 'Next sessions are ready on Calendar' })}</Text>
                  </View>
                </View>
                <TouchableOpacity style={[styles.emptyBtn, isTablet && styles.emptyBtnTablet]} onPress={() => router.push('/(tabs)/calendar')}>
                  <Ionicons name="calendar-outline" size={isTablet ? 18 : 15} color={DASH.teal} />
                  <Text style={[styles.emptyBtnText, isTablet && styles.emptyBtnTextTablet]}>{t('tabs.dashboard.view_calendar', { lang: appLang, fallback: 'View Calendar' })}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ gap: isTablet ? 10 : 7 }}>
                {visibleTasks.map((task, i) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    subjectLabel={subjectLabel(task.subject)}
                    isCompleted={taskCompletions[task.id]?.completed || false}
                    displayDuration={
                      taskCompletions[task.id]?.completed && taskCompletions[task.id]?.duration
                        ? taskCompletions[task.id].duration as number
                        : task.duration
                    }
                    onPress={() => handleStartSession(task)}
                    typeColor={getTypeColor(task.type)}
                    typeIcon={getTypeIcon(task.type)}
                    typeLabel={getTypeLabel(task.type)}
                    doneLabel={doneLabel}
                    appLang={appLang}
                    index={i}
                  />
                ))}
                {canCollapseTasks && (
                  <TouchableOpacity
                    style={[styles.expandTasksRow, isTablet && styles.expandTasksRowTablet]}
                    onPress={() => setShowAllTasks((p) => !p)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.expandTasksText, isTablet && styles.expandTasksTextTablet]}>
                      {showAllTasks
                        ? t('tabs.dashboard.show_less', { lang: appLang, fallback: 'Show less' })
                        : t('tabs.dashboard.continue_with_next_tasks', {
                          lang: appLang,
                          params: { count: hiddenTaskCount },
                          fallback: `Continue with next ${hiddenTaskCount} task${hiddenTaskCount > 1 ? 's' : ''}`,
                        })}
                    </Text>
                    <Ionicons
                      name={showAllTasks ? 'chevron-up' : 'chevron-down'}
                      size={isTablet ? 16 : 14}
                      color={DASH.teal}
                    />
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={[styles.linkRow, isTablet && styles.linkRowTablet, styles.calendarLinkRow]} onPress={() => router.push('/(tabs)/calendar')}>
                  <Ionicons name="calendar-outline" size={isTablet ? 16 : 14} color={DASH.teal} />
                  <Text style={[styles.linkRowText, isTablet && styles.linkRowTextTablet]}>{t('tabs.dashboard.view_full_calendar', { lang: appLang, fallback: 'View full calendar' })}</Text>
                  <Ionicons name="chevron-forward" size={isTablet ? 15 : 13} color={DASH.teal} />
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {/* ── Subjects Tab ── */}
        {activeTab === 'subjects' && (
          <>
            {subjectEntries.length === 0 ? (
              <View style={[styles.emptyCard, isTablet && styles.emptyCardTablet]}>
                <Text style={[styles.emptyTitle, isTablet && styles.emptyTitleTablet]}>{t('tabs.dashboard.empty_no_data', { lang: appLang, fallback: 'No data yet' })}</Text>
                <Text style={[styles.emptySub, isTablet && styles.emptySubTablet]}>{t('tabs.dashboard.empty_complete_sessions', { lang: appLang, fallback: 'Complete study sessions to see per-subject progress.' })}</Text>
              </View>
            ) : (
              <View style={[styles.subjectsCard, isTablet && styles.subjectsCardTablet]}>
                {subjectEntries.map(([sub, prog]: [string, any], idx) => (
                  <SubjectBar
                    key={sub}
                    subject={subjectLabel(sub)}
                    progress={prog.progress}
                    completed={prog.completed}
                    total={prog.total}
                    index={idx}
                    delay={idx * 90}
                  />
                ))}
                <TouchableOpacity style={[styles.linkRow, isTablet && styles.linkRowTablet]} onPress={() => router.push('/(tabs)/progress')}>
                  <Ionicons name="stats-chart-outline" size={isTablet ? 16 : 14} color={DASH.teal} />
                  <Text style={[styles.linkRowText, isTablet && styles.linkRowTextTablet]}>{t('tabs.dashboard.view_detailed_progress', { lang: appLang, fallback: 'View detailed progress' })}</Text>
                  <Ionicons name="chevron-forward" size={isTablet ? 15 : 13} color={DASH.teal} />
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
        </Animated.View>

        <View style={{ height: isIOS ? (isEmptyTasksState ? 62 : 90) : (isEmptyTasksState ? 54 : 78) }} />
      </ScrollView>

      <Modal visible={metricSheet.visible} transparent animationType="fade" onRequestClose={() => setMetricSheet((p) => ({ ...p, visible: false }))}>
        <Pressable style={styles.sheetOverlay} onPress={() => setMetricSheet((p) => ({ ...p, visible: false }))}>
          <Pressable style={styles.sheetCard}>
            <View style={styles.sheetTop}>
              <Text style={styles.sheetTitle}>{metricSheet.title}</Text>
              <Text style={styles.sheetValue}>{metricSheet.value}</Text>
            </View>
            <View style={styles.sheetList}>
              {metricSheet.lines.map((line) => (
                <View key={line} style={styles.sheetLineRow}>
                  <View style={styles.sheetDot} />
                  <Text style={styles.sheetLine}>{line}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={styles.sheetBtn} onPress={() => setMetricSheet((p) => ({ ...p, visible: false }))}>
              <Text style={styles.sheetBtnTxt}>{t('tabs.dashboard.close', { lang: appLang, fallback: 'Close' })}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DASH.bg0 },
  bgOrbA: { position: 'absolute', width: 260, height: 260, borderRadius: 130, top: -80, right: -100, backgroundColor: 'rgba(45,212,191,0.14)' },
  bgOrbB: { position: 'absolute', width: 220, height: 220, borderRadius: 110, bottom: 120, left: -110, backgroundColor: 'rgba(52,211,153,0.10)' },

  // Loading
  loadWrap: { flex: 1, backgroundColor: DASH.bg0, justifyContent: 'center', alignItems: 'center' },
  loadBall: { width: 78, height: 78, borderRadius: 39, justifyContent: 'center', alignItems: 'center', marginBottom: 20, shadowColor: DASH.teal, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8 },
  loadTitle: { fontSize: 20, fontWeight: '700', color: DASH.ink, marginBottom: 5 },
  loadSub: { fontSize: 14, color: DASH.sub },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: isIOS ? 6 : 14, paddingBottom: 10, backgroundColor: 'transparent',
  },
  headerTablet: {
    paddingHorizontal: 36,
    paddingTop: isIOS ? 14 : 20,
    paddingBottom: 18,
    maxWidth: 1180,
    width: '100%',
    alignSelf: 'center',
  },
  greetingKicker: { fontSize: 10, fontWeight: '700', color: DASH.muted, letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 4 },
  greetingKickerTablet: { fontSize: 13, marginBottom: 7 },
  headerTitle: { fontSize: 21, fontWeight: '800', color: DASH.ink, lineHeight: 25 },
  headerTitleTablet: { fontSize: 33, lineHeight: 37 },
  headerName: { marginTop: 1, fontSize: 20, fontWeight: '800', color: DASH.ink, lineHeight: 24 },
  headerNameTablet: { fontSize: 31, lineHeight: 35, marginTop: 3 },
  headerSub: { marginTop: 1, fontSize: 12, fontWeight: '500', color: DASH.sub },
  headerSubTablet: { marginTop: 5, fontSize: 16, lineHeight: 22 },
  headerExam: { color: DASH.teal, fontWeight: '800' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerRightTablet: { gap: 14 },
  streakPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(45,212,191,0.12)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: DASH.cardBorder,
  },
  streakPillTablet: { borderRadius: 26, paddingHorizontal: 16, paddingVertical: 9, gap: 8 },
  streakDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: DASH.teal },
  streakDotTablet: { width: 9, height: 9, borderRadius: 5 },
  streakTxt: { fontSize: 10, fontWeight: '700', color: DASH.sub, letterSpacing: 0.4, textTransform: 'uppercase' },
  streakTxtTablet: { fontSize: 12 },
  streakNum: { fontSize: 12, fontWeight: '800', color: DASH.ink },
  streakNumTablet: { fontSize: 16 },
  notifBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: DASH.card, borderWidth: 1, borderColor: DASH.cardBorder, justifyContent: 'center', alignItems: 'center' },
  notifBtnTablet: { width: 50, height: 50, borderRadius: 25 },

  // Trial
  trialBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 20, marginBottom: 12, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
  },
  trialText: { fontSize: 13, fontWeight: '600', flex: 1 },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 2 },
  scrollContentTablet: { paddingHorizontal: 36, paddingTop: 10, paddingBottom: 128, maxWidth: 1180, width: '100%', alignSelf: 'center' },

  // Hero Card
  heroCard: {
    borderRadius: 22, overflow: 'hidden', marginBottom: 12,
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.28, shadowRadius: 18, elevation: 12,
  },
  heroCardTablet: { borderRadius: 30, marginBottom: 20 },
  heroGradient: { padding: 19 },
  heroGradientTablet: { padding: 32 },
  heroBlob1: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.07)', top: -40, right: -30 },
  heroBlob1Tablet: { width: 220, height: 220, borderRadius: 110, top: -56, right: -40 },
  heroBlob2: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.05)', bottom: -20, left: 60 },
  heroBlob2Tablet: { width: 140, height: 140, borderRadius: 70, bottom: -30, left: 90 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 17 },
  heroRowTablet: { gap: 32 },
  heroCirclePct: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  heroCirclePctTablet: { fontSize: 33, lineHeight: 37 },
  heroCircleLabel: { fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.8)' },
  heroCircleLabelTablet: { fontSize: 14 },
  heroStats: { flex: 1 },
  heroStatsTitle: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.85)', marginBottom: 10 },
  heroStatsTitleTablet: { fontSize: 20, marginBottom: 16 },
  heroStatRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  heroStatRowTablet: { marginBottom: 16 },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatVal: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  heroStatValTablet: { fontSize: 31 },
  heroStatUnit: { fontSize: 13, fontWeight: '600' },
  heroStatUnitTablet: { fontSize: 18 },
  heroStatLbl: { fontSize: 10, fontWeight: '500', color: 'rgba(255,255,255,0.75)', marginTop: 1 },
  heroStatLblTablet: { fontSize: 13, marginTop: 2 },
  heroStatSep: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.3)' },
  heroStatSepTablet: { height: 40 },
  heroMiniBar: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroMiniBarTablet: { gap: 10 },
  heroMiniTrack: { flex: 1, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.25)', overflow: 'hidden' },
  heroMiniTrackTablet: { height: 7, borderRadius: 4 },
  heroMiniFill: { height: 5, borderRadius: 3, backgroundColor: '#FFF' },
  heroMiniFillTablet: { height: 7, borderRadius: 4 },
  heroMiniText: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.9)', minWidth: 52, textAlign: 'right' },
  heroMiniTextTablet: { fontSize: 15, minWidth: 78 },

  // Metrics Board
  metricsBoard: {
    flexDirection: 'row',
    marginBottom: 12,
    borderRadius: 14,
    backgroundColor: DASH.card,
    borderWidth: 1,
    borderColor: DASH.cardBorder,
    overflow: 'hidden',
  },
  metricsBoardTablet: { marginBottom: 18, borderRadius: 20 },
  metricCell: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  metricCellTablet: { paddingVertical: 18, paddingHorizontal: 14, gap: 6 },
  metricCellSep: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: DASH.cardBorder,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: DASH.sub,
    textTransform: 'uppercase',
    letterSpacing: 0.45,
    textAlign: 'center',
    width: '100%',
  },
  metricLabelTablet: { fontSize: 13, letterSpacing: 0.6 },
  metricValue: {
    fontSize: 17,
    fontWeight: '900',
    color: DASH.ink,
    letterSpacing: -0.2,
  },
  metricValueTablet: { fontSize: 26 },

  // Tab
  tabRow: {
    flexDirection: 'row', backgroundColor: DASH.card, borderRadius: 12, paddingVertical: 4, paddingHorizontal: 8, marginBottom: 10, borderWidth: 1, borderColor: DASH.cardBorder,
  },
  tabRowTablet: { borderRadius: 18, paddingVertical: 7, paddingHorizontal: 12, marginBottom: 16 },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 9,
  },
  tabTablet: { gap: 8, paddingVertical: 13, paddingHorizontal: 18, borderRadius: 14 },
  tabActive: {
    backgroundColor: 'rgba(45,212,191,0.12)',
    shadowColor: DASH.teal, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.14, shadowRadius: 4, elevation: 2,
  },
  tabText: { fontSize: 13, fontWeight: '600', color: DASH.muted },
  tabTextTablet: { fontSize: 17 },
  tabTextActive: { color: DASH.teal },

  // Goal Card
  goalCard: {
    backgroundColor: DASH.card, borderWidth: 1, borderColor: DASH.cardBorder, borderRadius: 14, padding: 12, marginBottom: 8,
    shadowColor: DASH.teal, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  goalCardTablet: { borderRadius: 20, padding: 20, marginBottom: 14 },
  goalCardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  goalCardRowTablet: { marginBottom: 14 },
  goalCardTitle: { fontSize: 14, fontWeight: '700', color: DASH.ink },
  goalCardTitleTablet: { fontSize: 19 },
  goalCardSub: { fontSize: 12, color: DASH.sub, marginTop: 2 },
  goalCardSubTablet: { fontSize: 16, lineHeight: 22, marginTop: 4 },
  goalBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  goalBadgeTablet: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  goalBadgeDoneRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  goalBadgeText: { fontSize: 12, fontWeight: '700' },
  goalBadgeTextTablet: { fontSize: 16 },
  goalTrack: { height: 8, borderRadius: 4, backgroundColor: DASH.track, overflow: 'hidden' },
  goalTrackTablet: { height: 10, borderRadius: 5 },
  goalFill: { height: 8, borderRadius: 4, backgroundColor: DASH.teal },
  goalFillTablet: { height: 10, borderRadius: 5 },
  adaptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: DASH.card,
    borderWidth: 1,
    borderColor: DASH.cardBorder,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 10,
    shadowColor: DASH.teal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  adaptCardTablet: { gap: 16, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 16, marginBottom: 16 },
  adaptAccent: { width: 3, alignSelf: 'stretch', backgroundColor: DASH.teal, borderRadius: 2 },
  adaptAccentTablet: { width: 4, borderRadius: 3 },
  adaptTag: { fontSize: 9, fontWeight: '800', color: DASH.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 3 },
  adaptTagTablet: { fontSize: 12, marginBottom: 4 },
  adaptBody: { fontSize: 13, color: DASH.sub, lineHeight: 18 },
  adaptBodyTablet: { fontSize: 17, lineHeight: 23 },
  adaptCount: { fontSize: 22, fontWeight: '900', color: DASH.teal, letterSpacing: -0.5 },
  adaptCountTablet: { fontSize: 30 },

  // Task Card
  taskCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: DASH.card, borderWidth: 1, borderColor: DASH.cardBorder, borderRadius: 14, overflow: 'hidden',
    shadowColor: DASH.teal, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
    paddingRight: 14, paddingVertical: 10,
  },
  taskCardTablet: { borderRadius: 20, paddingRight: 20, paddingVertical: 16 },
  taskCardDone: { opacity: 0.62 },
  taskAccent: { width: 4, alignSelf: 'stretch', marginRight: 14 },
  taskAccentTablet: { width: 5, marginRight: 16 },
  taskCircle: {
    width: 26, height: 26, borderRadius: 13, borderWidth: 2,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  taskCircleTablet: { width: 34, height: 34, borderRadius: 17, marginRight: 15 },
  taskBody: { flex: 1 },
  taskSubject: { fontSize: 15, fontWeight: '700', color: DASH.ink, marginBottom: 4 },
  taskSubjectTablet: { fontSize: 20, marginBottom: 6 },
  taskSubjectDone: { textDecorationLine: 'line-through', color: DASH.muted },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  taskMetaTablet: { gap: 10 },
  taskBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  taskBadgeTablet: { gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8 },
  taskBadgeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  taskBadgeTextTablet: { fontSize: 14 },
  taskDuration: { fontSize: 12, color: DASH.muted, fontWeight: '500' },
  taskDurationTablet: { fontSize: 15 },
  doneTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(45,212,191,0.16)',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  doneTagTablet: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, gap: 5 },
  doneTagText: { fontSize: 12, fontWeight: '700', color: DASH.tealDk },
  doneTagTextTablet: { fontSize: 15 },
  playBtn: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  playBtnTablet: { width: 40, height: 40, borderRadius: 13 },

  // Expand Tasks
  expandTasksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(45,212,191,0.10)',
    borderWidth: 1,
    borderColor: DASH.cardBorder,
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  expandTasksRowTablet: { borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, gap: 8 },
  expandTasksText: { fontSize: 12, fontWeight: '700', color: DASH.tealDk, letterSpacing: 0.1 },
  expandTasksTextTablet: { fontSize: 15 },

  // Link Row
  linkRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 7,
  },
  linkRowTablet: { gap: 8, paddingVertical: 10 },
  calendarLinkRow: { marginTop: 0 },
  linkRowText: { fontSize: 13, fontWeight: '600', color: DASH.teal },
  linkRowTextTablet: { fontSize: 16 },

  // Empty
  emptyCard: { backgroundColor: DASH.card, borderWidth: 1, borderColor: DASH.cardBorder, borderRadius: 16, paddingHorizontal: 20, paddingVertical: 18, alignItems: 'center' },
  emptyCardTablet: { borderRadius: 22, paddingHorizontal: 30, paddingVertical: 26 },
  emptyIconBox: { width: 64, height: 64, borderRadius: 16, borderWidth: 1, borderColor: DASH.cardBorder, backgroundColor: 'rgba(45,212,191,0.08)', justifyContent: 'center', alignItems: 'center', marginBottom: 10, gap: 6 },
  emptyIconBoxTablet: { width: 78, height: 78, borderRadius: 18, marginBottom: 14 },
  emptyGlyphBarA: { width: 30, height: 4, borderRadius: 2, backgroundColor: DASH.teal },
  emptyGlyphBarB: { width: 22, height: 4, borderRadius: 2, backgroundColor: 'rgba(45,212,191,0.45)' },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: DASH.ink, marginBottom: 5 },
  emptyTitleTablet: { fontSize: 22, marginBottom: 8 },
  emptySub: { fontSize: 12, color: DASH.sub, textAlign: 'center', lineHeight: 17, marginBottom: 10 },
  emptySubTablet: { fontSize: 16, lineHeight: 23, marginBottom: 15 },
  emptyList: { width: '100%', gap: 4, marginBottom: 10 },
  emptyListRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  emptyListDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: DASH.teal },
  emptyListText: { fontSize: 11.5, color: DASH.sub, fontWeight: '500' },
  emptyListTextTablet: { fontSize: 15 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(45,212,191,0.12)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10 },
  emptyBtnTablet: { gap: 8, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  emptyBtnText: { fontSize: 12, fontWeight: '600', color: DASH.teal },
  emptyBtnTextTablet: { fontSize: 15 },

  // Subjects
  subjectsCard: {
    backgroundColor: DASH.card, borderWidth: 1, borderColor: DASH.cardBorder, borderRadius: 16, padding: 16,
    shadowColor: DASH.teal, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  subjectsCardTablet: { borderRadius: 22, padding: 24 },
  subjectRow: { marginBottom: 12, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: DASH.cardBorder },
  subjectRowTablet: { marginBottom: 18, paddingBottom: 18 },
  subjectRowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  subjectRowHeaderTablet: { marginBottom: 10 },
  subjectRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  subjectRowLeftTablet: { gap: 10 },
  subjectDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: DASH.cardBorder, backgroundColor: 'rgba(45,212,191,0.10)', justifyContent: 'center', alignItems: 'center' },
  subjectDotTablet: { width: 24, height: 24, borderRadius: 12 },
  subjectDotTxt: { fontSize: 10, fontWeight: '800', color: DASH.teal },
  subjectDotTxtTablet: { fontSize: 12 },
  subjectName: { fontSize: 13, fontWeight: '600', color: DASH.ink },
  subjectNameTablet: { fontSize: 18 },
  subjectRowRight: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  subjectRowRightTablet: { gap: 7 },
  subjectPct: { fontSize: 12, fontWeight: '700', color: DASH.teal },
  subjectPctTablet: { fontSize: 15 },
  subjectMeta: { fontSize: 11, color: DASH.muted, fontWeight: '500' },
  subjectMetaTablet: { fontSize: 14 },
  subjectTrack: { height: 7, borderRadius: 4, backgroundColor: DASH.track, overflow: 'hidden' },
  subjectTrackTablet: { height: 9, borderRadius: 5 },
  subjectFill: { height: 7, borderRadius: 4, backgroundColor: DASH.teal },
  subjectFillTablet: { height: 9, borderRadius: 5 },

  // Metric Sheet
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2,6,23,0.40)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  sheetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: DASH.cardBorder,
    padding: 16,
    gap: 12,
  },
  sheetTop: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  sheetTitle: { fontSize: 14, fontWeight: '700', color: DASH.sub },
  sheetValue: { fontSize: 24, fontWeight: '900', color: DASH.ink, letterSpacing: -0.4 },
  sheetList: { gap: 8 },
  sheetLineRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sheetDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: DASH.teal },
  sheetLine: { flex: 1, fontSize: 13, lineHeight: 18, color: DASH.sub },
  sheetBtn: {
    marginTop: 2,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,157,140,0.12)',
  },
  sheetBtnTxt: { fontSize: 14, fontWeight: '800', color: DASH.teal },
});
