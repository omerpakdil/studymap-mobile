import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  AppState,
  Dimensions,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppAlert } from '@/app/components/ui/AppAlert';
import { resolveAppLanguage, t } from '@/app/i18n';
import { getLocalizedSubjectName } from '@/app/i18n/subjectNames';
import { getLocalizedTaskTitle } from '@/app/i18n/taskContent';
import { formatMinutesCompact, getMinuteUnitShort } from '@/app/i18n/unitFormat';
import { saveStudySessionFeedback } from '@/app/utils/focusSessionFeedback';
import {
  loadPreferredFocusDuration,
  savePreferredFocusDuration,
} from '@/app/utils/focusSessionPreferences';
import NotificationService from '@/app/utils/notificationService';
import { requestReview, trackCompletedStudySession } from '@/app/utils/reviewPrompt';
import { useLofiPlayer } from '@/app/utils/lofiPlayer';
import { playSessionEnd, playSessionStart, unloadSessionSound } from '@/app/utils/sessionSounds';
import {
  clearTaskCompletion,
  markTaskComplete,
  updateTaskProgress,
} from '@/app/utils/studyProgramStorage';
import type { SessionOutcome, StudyTask } from '@/app/utils/studyTypes';

const { width, height } = Dimensions.get('window');
const isIOS = Platform.OS === 'ios';
const isTablet = width >= 768;
const FOCUS_PRESETS = [
  { minutes: 25, labelKey: 'preset_quick_25', fallback: 'Quick 25' },
  { minutes: 45, labelKey: 'preset_standard_45', fallback: 'Focus 45' },
  { minutes: 60, labelKey: 'preset_deep_60', fallback: 'Deep 60' },
  { minutes: 90, labelKey: 'preset_deep_90', fallback: 'Deep 90' },
] as const;

// ─── Design tokens (mirrors dashboard palette) ──────────────────────────────
const S = {
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
  tealLt: 'rgba(15,157,140,0.10)',
  tealGlow: 'rgba(15,157,140,0.22)',
  green: '#16A34A',
  greenLt: 'rgba(22,163,74,0.10)',
  amber: '#D97706',
  amberLt: 'rgba(217,119,6,0.10)',
  rose: '#E11D48',
};

type TimerState = 'idle' | 'running' | 'paused' | 'completed';
type SessionType = 'Practice' | 'Study' | 'Review';

// ─── Animated Ring ────────────────────────────────────────────────────────────
// Uses two half-clip technique for smooth continuous rotation:
//   right clip: fills 0→50% by rotating top+right arc from -180° to 0°
//   left  clip: fills 50→100% by rotating bottom+left arc from -180° to 0°
function TimerRing({
  progress,
  size,
  strokeWidth,
  color,
  children,
}: {
  progress: number; // 0–1
  size: number;
  strokeWidth: number;
  color: string;
  children?: React.ReactNode;
}) {
  const animProgress = useRef(new Animated.Value(progress)).current;

  useEffect(() => {
    Animated.timing(animProgress, {
      toValue: progress,
      duration: 950,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  }, [progress]);

  const half = size / 2;
  const innerSize = size - strokeWidth * 2 - 10;
  const capRadius = half - strokeWidth / 2;
  const capDotSize = strokeWidth + 2;

  // Correct offset: borderTopColor starts at 315° (not 0°), so we shift by +45°
  // Right arc (borderTop+Right covers 315°→135°):
  //   at -135° rotation → arc lands at 180°→360° (left half) → invisible through right clip
  //   at  +45° rotation → arc lands at 0°→180°   (right half) → fully visible ✓
  const rightRotation = animProgress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['-135deg', '45deg', '45deg'],
  });

  // Left arc (borderBottom+Left covers 135°→315°):
  //   at -135° rotation → arc lands at 0°→180°   (right half) → invisible through left clip
  //   at  +45° rotation → arc lands at 180°→360° (left half)  → fully visible ✓
  const leftRotation = animProgress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['-135deg', '-135deg', '45deg'],
  });

  // Cap dot sweeps from 12 o'clock (0°) clockwise to full circle (360°)
  const capRotation = animProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Fade in cap dot once progress starts
  const capOpacity = animProgress.interpolate({
    inputRange: [0, 0.008],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>

      {/* Track ring */}
      <View style={{
        position: 'absolute', width: size, height: size,
        borderRadius: half, borderWidth: strokeWidth,
        borderColor: 'rgba(148,163,184,0.18)',
      }} />

      {/* Right clip — draws arc from 12 o'clock to 6 o'clock (0→50%) */}
      <View style={{
        position: 'absolute', left: half, top: 0,
        width: half, height: size, overflow: 'hidden',
      }}>
        <Animated.View style={{
          position: 'absolute', left: -half, top: 0,
          width: size, height: size, borderRadius: half,
          borderWidth: strokeWidth,
          borderTopColor: color, borderRightColor: color,
          borderBottomColor: 'transparent', borderLeftColor: 'transparent',
          transform: [{ rotate: rightRotation }],
        }} />
      </View>

      {/* Left clip — draws arc from 6 o'clock to 12 o'clock (50→100%) */}
      <View style={{
        position: 'absolute', left: 0, top: 0,
        width: half, height: size, overflow: 'hidden',
      }}>
        <Animated.View style={{
          position: 'absolute', left: 0, top: 0,
          width: size, height: size, borderRadius: half,
          borderWidth: strokeWidth,
          borderBottomColor: color, borderLeftColor: color,
          borderTopColor: 'transparent', borderRightColor: 'transparent',
          transform: [{ rotate: leftRotation }],
        }} />
      </View>

      {/* Cap dot — moves at the tip of the arc */}
      <Animated.View style={{
        position: 'absolute', width: size, height: size,
        alignItems: 'center', opacity: capOpacity,
        transform: [{ rotate: capRotation }],
      }}>
        <View style={{
          width: capDotSize, height: capDotSize,
          borderRadius: capDotSize / 2,
          backgroundColor: color,
          marginTop: half - capRadius - capDotSize / 2,
          shadowColor: '#fff',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.7,
          shadowRadius: 3,
        }} />
      </Animated.View>

      {/* Start dot — fixed at 12 o'clock */}
      <View style={{
        position: 'absolute',
        width: capDotSize, height: capDotSize,
        borderRadius: capDotSize / 2,
        backgroundColor: 'rgba(255,255,255,0.4)',
        top: half - capRadius - capDotSize / 2,
        left: half - capDotSize / 2,
      }} />

      {/* Inner glow ring */}
      <View style={{
        position: 'absolute', width: innerSize, height: innerSize,
        borderRadius: innerSize / 2,
        borderWidth: 1, borderColor: `${color}30`,
        backgroundColor: 'transparent',
      }} />

      {/* Children */}
      <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function StudySessionScreen() {
  const { showAlert } = useAppAlert();
  const router = useRouter();
  const params = useLocalSearchParams<{
    taskId: string;
    subject: string;
    topic: string;
    type: string;
    duration: string;
    title?: string;
    examCode?: string;
  }>();

  const totalSeconds = parseInt(params?.duration || '25') * 60;
  const [focusDuration, setFocusDuration] = useState(parseInt(params?.duration || '25'));
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [notes, setNotes] = useState('');
  const [isSessionCompleted, setIsSessionCompleted] = useState(false);
  const [isNotesFocused, setIsNotesFocused] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [showDurationModal, setShowDurationModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showOutcomeModal, setShowOutcomeModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showLofiModal, setShowLofiModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'timer' | 'notes'>('timer');
  const [lastOutcome, setLastOutcome] = useState<SessionOutcome | null>(null);

  const {
    isPlaying: lofiPlaying,
    isLoading: lofiLoading,
    toggle: toggleLofi,
    stop: stopLofi,
    channels: lofiChannels,
    activeChannel,
    changeChannel,
  } = useLofiPlayer();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const backgroundTimeRef = useRef<number | null>(null);
  const sessionEndAtRef = useRef<number | null>(null);
  const isRunningRef = useRef(false);

  // Animations
  const fadeIn = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-20)).current;
  const ringPulse = useRef(new Animated.Value(1)).current;
  const audioPulse = useRef(new Animated.Value(1)).current;
  const tabAnim = useRef(new Animated.Value(1)).current;
  const notesHeight = useRef(new Animated.Value(180)).current;
  const completionScale = useRef(new Animated.Value(0.7)).current;
  const completionOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(headerSlide, { toValue: 0, useNativeDriver: true, tension: 80 }),
    ]).start();
    void loadSessionData();
    return () => { void unloadSessionSound(); void stopLofi(); };
  }, []);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setIsKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      setTimeout(() => { setIsKeyboardVisible(false); setIsNotesFocused(false); }, 100);
    });
    return () => { show.remove(); hide.remove(); };
  }, []);

  useEffect(() => {
    Animated.timing(notesHeight, {
      toValue: isKeyboardVisible ? 90 : 180,
      duration: 280, useNativeDriver: false,
    }).start();
  }, [isKeyboardVisible]);

  // Background timer
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if ((state === 'background' || state === 'inactive') && isRunningRef.current) {
        backgroundTimeRef.current = Date.now();
      } else if (state === 'active' && isRunningRef.current && backgroundTimeRef.current) {
        const next = getRemainingSeconds();
        if (next === 0) {
          completeTimer();
        } else {
          setTimeLeft(next);
        }
        backgroundTimeRef.current = null;
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => { return () => { if (intervalRef.current) clearInterval(intervalRef.current); }; }, []);
  useEffect(() => { saveNotes(notes); }, [notes]);

  // Ring pulse when running
  useEffect(() => {
    if (timerState === 'running') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(ringPulse, { toValue: 1.015, duration: 1200, useNativeDriver: true }),
          Animated.timing(ringPulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [timerState]);

  useEffect(() => {
    if (!lofiPlaying) {
      audioPulse.setValue(1);
      return;
    }

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(audioPulse, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(audioPulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [audioPulse, lofiPlaying]);

  const getStorageKeys = () => {
    const id = params?.taskId || 'default';
    return { notes: `session_notes_${id}`, completed: `session_completed_${id}`, completionTime: `session_completion_time_${id}` };
  };

  const loadSessionData = async () => {
    try {
      const keys = getStorageKeys();
      const [n, c, preferredDuration] = await Promise.all([
        AsyncStorage.getItem(keys.notes),
        AsyncStorage.getItem(keys.completed),
        loadPreferredFocusDuration({
          examCode: typeof params?.examCode === 'string' ? params.examCode : undefined,
          subject: params?.subject,
          type: typeof params?.type === 'string' ? params.type : undefined,
        }),
      ]);
      if (n) setNotes(n);
      if (c === 'true') setIsSessionCompleted(true);
      const validPresetMinutes = FOCUS_PRESETS.map((p) => p.minutes);
      if (preferredDuration && validPresetMinutes.includes(preferredDuration as typeof FOCUS_PRESETS[number]['minutes']) && preferredDuration !== focusDuration) {
        setFocusDuration(preferredDuration);
        setTimeLeft(preferredDuration * 60);
      }
    } catch {}
  };

  const saveNotes = async (text: string) => {
    try { await AsyncStorage.setItem(getStorageKeys().notes, text); } catch {}
  };

  const saveCompletion = async () => {
    try {
      const keys = getStorageKeys();
      await AsyncStorage.setItem(keys.completed, 'true');
      await AsyncStorage.setItem(keys.completionTime, new Date().toISOString());
    } catch {}
  };

  const clearCompletion = async () => {
    try {
      const keys = getStorageKeys();
      await AsyncStorage.multiRemove([keys.completed, keys.completionTime]);
    } catch {}
  };

  const startTimer = () => {
    if (timerState === 'completed') return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimerState('running');
    isRunningRef.current = true;
    sessionEndAtRef.current = Date.now() + timeLeft * 1000;
    if (timerState === 'idle') {
      playSessionStart();
      NotificationService.startBreakReminders?.();
    }
    intervalRef.current = setInterval(() => {
      const next = getRemainingSeconds();
      if (next <= 0) {
        completeTimer();
        return;
      }
      setTimeLeft(next);
    }, 1000);
  };

  const pauseTimer = () => {
    const next = getRemainingSeconds();
    setTimerState('paused');
    isRunningRef.current = false;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    sessionEndAtRef.current = null;
    if (next > 0) setTimeLeft(next);
  };

  const resetTimer = () => {
    pauseTimer();
    setTimerState('idle');
    setTimeLeft(focusDuration * 60);
    backgroundTimeRef.current = null;
    sessionEndAtRef.current = null;
  };

  const completeTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    isRunningRef.current = false;
    sessionEndAtRef.current = null;
    backgroundTimeRef.current = null;
    setTimeLeft(0);
    setTimerState('completed');
    stopLofi().then(() => {
      playSessionEnd();
      showAlert(ts('time_up_title', 'Time is up!'), ts('time_up_body', 'Great focus session!'));
    });
  };

  const handleSessionComplete = async () => {
    pauseTimer();
    setShowOutcomeModal(true);
  };

  const handleOutcomeSelect = async (outcome: SessionOutcome) => {
    const actualMinutes = Math.max(1, Math.round((focusDuration * 60 - timeLeft) / 60));
    const partialProgress = Math.min(95, Math.max(15, Math.round((actualMinutes / Math.max(1, focusDuration)) * 100)));

    await saveStudySessionFeedback({
      taskId: params?.taskId || 'default',
      sessionId: `${params?.taskId || 'default'}_${Date.now()}`,
      subject: params?.subject || 'Study Session',
      examCode: typeof params?.examCode === 'string' ? params.examCode : undefined,
      outcome,
      plannedMinutes: focusDuration,
      actualMinutes,
      completed: outcome !== 'incomplete',
      noteLength: notes.trim().length,
      createdAt: new Date().toISOString(),
    });

    if (params?.taskId) {
      if (outcome === 'incomplete') {
        await clearTaskCompletion(params.taskId, partialProgress);
        await updateTaskProgress(params.taskId, partialProgress);
        await clearCompletion();
      } else {
        await markTaskComplete(params.taskId, focusDuration);
        await saveCompletion();
      }
    }

    setShowOutcomeModal(false);
    setLastOutcome(outcome);
    setIsSessionCompleted(outcome !== 'incomplete');
    Animated.parallel([
      Animated.spring(completionScale, { toValue: 1, useNativeDriver: true, tension: 70, friction: 8 }),
      Animated.timing(completionOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
    setShowCompletionModal(true);
  };

  const changeDuration = (mins: number) => {
    setFocusDuration(mins);
    setTimeLeft(mins * 60);
    setTimerState('idle');
    if (intervalRef.current) clearInterval(intervalRef.current);
    isRunningRef.current = false;
    setShowDurationModal(false);
    void savePreferredFocusDuration(
      {
        examCode: typeof params?.examCode === 'string' ? params.examCode : undefined,
        subject: params?.subject,
        type: typeof params?.type === 'string' ? params.type : undefined,
      },
      mins
    );
  };

  const switchTab = (next: 'timer' | 'notes') => {
    if (next === activeTab) return;
    Animated.timing(tabAnim, { toValue: 0, duration: 100, useNativeDriver: true }).start(() => {
      setActiveTab(next);
      tabAnim.setValue(0);
      Animated.spring(tabAnim, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 240 }).start();
    });
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const getRemainingSeconds = () => {
    if (!sessionEndAtRef.current) return timeLeft;
    return Math.max(0, Math.ceil((sessionEndAtRef.current - Date.now()) / 1000));
  };

  const progress = 1 - timeLeft / (focusDuration * 60);
  const progressPct = Math.round(progress * 100);
  const appLang = resolveAppLanguage();
  const ts = (key: string, fallback: string, params?: Record<string, string | number>) =>
    t(`study_session.${key}`, { lang: appLang, fallback, params });
  const subjectLabel = getLocalizedSubjectName(
    params?.subject,
    appLang,
    params?.subject || 'Study Session',
    { examCode: typeof params?.examCode === 'string' ? params.examCode : null }
  );
  const localizedTaskTitle = getLocalizedTaskTitle(
    {
      subject: params?.subject || 'Study Session',
      type: ((params?.type || 'study').toLowerCase() as StudyTask['type']),
    },
    appLang,
    typeof params?.examCode === 'string' ? params.examCode : null
  );

  const typeMap: Record<string, { color: string; icon: string; label: string }> = {
    practice: { color: S.teal, icon: 'create-outline', label: ts('type_practice', 'Practice') },
    study: { color: '#6366F1', icon: 'book-outline', label: ts('type_study', 'Study') },
    review: { color: S.amber, icon: 'refresh-outline', label: ts('type_review', 'Review') },
    quiz: { color: '#EC4899', icon: 'bulb-outline', label: ts('type_quiz', 'Quiz') },
  };
  const sessionType = typeMap[(params?.type || 'study').toLowerCase()] || typeMap.study;

  const timerColor = timerState === 'completed' ? S.teal
    : timerState === 'paused' ? S.amber
    : sessionType.color;
  const localizedPresets = FOCUS_PRESETS.map((preset) => ({
    ...preset,
    label: ts(preset.labelKey, preset.fallback),
  }));
  const activePreset = localizedPresets.find((preset) => preset.minutes === focusDuration);
  const localizedLofiChannels = lofiChannels.map((channel) => ({
    ...channel,
    title:
      channel.id === 'ambient'
        ? ts('lofi_channel_ambient', 'Ambient')
        : channel.id === 'lofi'
          ? ts('lofi_channel_lofi', 'Lofi')
          : ts('lofi_channel_deep', 'Deep Focus'),
    description:
      channel.id === 'ambient'
        ? ts('lofi_channel_ambient_sub', 'Soft ambient radio')
        : channel.id === 'lofi'
          ? ts('lofi_channel_lofi_sub', 'Chill lofi radio')
          : ts('lofi_channel_deep_sub', 'Drone-based deep focus'),
  }));
  const activeLofiLabel = localizedLofiChannels.find((channel) => channel.id === activeChannel.id)?.title ?? activeChannel.label;
  const completionIsPartial = lastOutcome === 'incomplete';
  const completionMessage = completionIsPartial
    ? ts('completion_msg_partial', 'Partial progress saved. The planner will shorten or repeat this work if needed.')
    : lastOutcome === 'hard'
      ? ts('completion_msg_hard', 'Marked hard. The planner will bring this subject back sooner with extra review.')
      : lastOutcome === 'easy'
        ? ts('completion_msg_easy', 'Marked easy. The planner can keep your next review a little lighter.')
        : notes.length > 20
          ? ts('completion_msg_notes', 'Good session. Your notes will help the next review land faster.')
          : ts('completion_msg_no_notes', 'Session saved. Add a few notes next time to improve recall.');

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <LinearGradient colors={[S.bg0, S.bg1, S.bg2]} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} />

      {/* Decorative orbs */}
      <View style={styles.orbA} />
      <View style={styles.orbB} />

      {/* ── Header ── */}
      <Animated.View style={[styles.header, { opacity: fadeIn, transform: [{ translateY: headerSlide }] }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setShowExitModal(true)}>
          <Ionicons name="chevron-back" size={20} color={S.ink} />
        </TouchableOpacity>

        <View style={styles.headerMid}>
          <Text style={styles.headerSubject} numberOfLines={1}>{localizedTaskTitle}</Text>
          <View style={styles.headerMetaRow}>
            <View style={[styles.typePill, { backgroundColor: S.tealLt, borderColor: `${S.teal}25` }]}>
              <Text style={[styles.typePillText, { color: S.teal }]}>{sessionType.label.toUpperCase()}</Text>
            </View>
            <Text style={styles.headerDot}>·</Text>
            <Text style={styles.headerDuration}>{ts('duration_min', '{minutes} min', { minutes: focusDuration })}</Text>
          </View>
        </View>

        {isSessionCompleted ? (
          <View style={styles.doneChip}>
            <View style={styles.doneChipDot} />
            <Text style={styles.doneChipText}>{ts('done', 'Done')}</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.moreBtn} onPress={() => setShowDurationModal(true)}>
            <Ionicons name="ellipsis-horizontal" size={18} color={S.sub} />
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* ── Tab Toggle ── */}
      <Animated.View style={[styles.tabRow, { opacity: fadeIn }]}>
        {(['timer', 'notes'] as const).map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, activeTab === t && styles.tabActive]} onPress={() => switchTab(t)}>
            <Ionicons name={t === 'timer' ? 'timer-outline' : 'document-text-outline'} size={15} color={activeTab === t ? S.teal : '#94A3B8'} />
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]} numberOfLines={1} ellipsizeMode="tail">
              {t === 'timer' ? ts('tab_timer', 'Focus Timer') : ts('tab_notes', 'Study Notes')}
            </Text>
          </TouchableOpacity>
        ))}
      </Animated.View>

      {/* ── Content ── */}
      <KeyboardAvoidingView behavior={isIOS ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Animated.View style={{ opacity: tabAnim, transform: [{ translateY: tabAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }}>

            {/* ═══ TIMER TAB ═══ */}
            {activeTab === 'timer' && (
              <View style={styles.timerTab}>

                {/* Hero ring card */}
                <View style={styles.ringCard}>
                  <LinearGradient
                    colors={['#0F766E', '#0F9D8C', '#14B8A6']}
                    style={styles.ringGradient}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.ringBlob1} />
                    <View style={styles.ringBlob2} />

                    <Animated.View style={{ transform: [{ scale: ringPulse }] }}>
                      <TimerRing
                        progress={progress}
                        size={isTablet ? 338 : 190}
                        strokeWidth={isTablet ? 18 : 11}
                        color="rgba(255,255,255,0.95)"
                      >
                        <View style={styles.ringInner}>
                          <Text style={styles.ringTime}>{formatTime(timeLeft)}</Text>
                          <View style={[styles.ringStateBadge, {
                            backgroundColor: timerState === 'running'
                              ? 'rgba(255,255,255,0.25)'
                              : 'rgba(255,255,255,0.15)',
                          }]}>
                            <View style={[styles.ringStateDot, {
                              backgroundColor: timerState === 'running' ? '#4ADE80'
                                : timerState === 'paused' ? '#FCD34D'
                                : timerState === 'completed' ? '#2DD4BF'
                                : 'rgba(255,255,255,0.5)',
                            }]} />
                            <Text style={styles.ringStateText}>
                              {timerState === 'running'
                                ? ts('state_focusing', 'Focusing')
                                : timerState === 'paused'
                                  ? ts('state_paused', 'Paused')
                                  : timerState === 'completed'
                                    ? ts('state_done', 'Done')
                                    : ts('state_ready', 'Ready')}
                            </Text>
                          </View>
                        </View>
                      </TimerRing>
                    </Animated.View>

                    {/* Mini progress bar */}
                    <View style={styles.ringBar}>
                      <View style={styles.ringBarTrack}>
                        <View style={[styles.ringBarFill, { width: `${progressPct}%` as any }]} />
                      </View>
                      <Text style={styles.ringBarPct}>{progressPct}%</Text>
                    </View>
                  </LinearGradient>
                </View>

                {/* Session meta chips */}
                <View style={styles.metaRow}>
                  <View style={styles.metaCard}>
                    <View style={styles.metaIconWrap}>
                      <Ionicons name="time-outline" size={14} color={S.teal} />
                    </View>
                    <View style={styles.metaTextWrap}>
                      <Text style={styles.metaLabel}>{ts('focus_duration', 'Focus Duration')}</Text>
                      <Text style={styles.metaValue}>{formatMinutesCompact(focusDuration, appLang)}</Text>
                    </View>
                  </View>
                  <View style={styles.metaCard}>
                    <View style={styles.metaIconWrap}>
                      <Ionicons name="book-outline" size={14} color={S.teal} />
                    </View>
                    <View style={styles.metaTextWrap}>
                      <Text style={styles.metaLabel}>{ts('subject', 'Subject')}</Text>
                      <Text style={styles.metaValue} numberOfLines={1}>{subjectLabel}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.audioCard}>
                  <View style={styles.audioCardLeft}>
                    <TouchableOpacity
                      style={[styles.audioToggle, lofiPlaying && styles.audioToggleActive]}
                      onPress={() => void toggleLofi()}
                      activeOpacity={0.82}
                    >
                      <Ionicons
                        name={
                          lofiLoading
                            ? 'ellipsis-horizontal'
                            : lofiPlaying
                              ? 'pause'
                              : 'play'
                        }
                        size={isTablet ? 18 : 16}
                        color={lofiPlaying ? '#FFFFFF' : S.teal}
                      />
                    </TouchableOpacity>
                    <View style={styles.audioMeta}>
                      <View style={styles.audioTitleRow}>
                        <Animated.View
                          style={[
                            styles.audioTitleIcon,
                            lofiPlaying && [styles.audioTitleIconActive, { transform: [{ scale: audioPulse }] }],
                          ]}
                        >
                          <Ionicons
                            name={lofiPlaying ? 'headset' : 'headset-outline'}
                            size={isTablet ? 14 : 12}
                            color={lofiPlaying ? S.teal : S.muted}
                          />
                        </Animated.View>
                        <Text style={styles.audioTitle}>{ts('focus_audio', 'Focus Audio')}</Text>
                      </View>
                      <Text style={styles.audioSub} numberOfLines={1}>
                        {activeLofiLabel} · {lofiPlaying ? ts('audio_state_playing', 'Playing') : ts('audio_state_off', 'Off')}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.audioChangeBtn}
                    onPress={() => setShowLofiModal(true)}
                    activeOpacity={0.82}
                  >
                    <View style={styles.audioChangeIcon}>
                      <Ionicons name="options-outline" size={isTablet ? 16 : 14} color={S.teal} />
                    </View>
                    <Text style={styles.audioChangeText}>{ts('change_audio', 'Channels')}</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.presetRow}>
                  {localizedPresets.map((preset) => {
                    const selected = preset.minutes === focusDuration;
                    return (
                      <TouchableOpacity
                        key={preset.minutes}
                        style={[styles.presetChip, selected && styles.presetChipActive]}
                        onPress={() => changeDuration(preset.minutes)}
                        activeOpacity={0.82}
                      >
                        <Text
                          style={[styles.presetChipText, selected && styles.presetChipTextActive]}
                          numberOfLines={1}
                        >{preset.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Controls */}
                <View style={styles.controls}>
                  {/* Reset */}
                  <TouchableOpacity style={styles.ctrlSecondary} onPress={resetTimer}>
                    <Ionicons name="refresh" size={18} color={S.sub} />
                    <Text style={styles.ctrlSecondaryText}>{ts('reset', 'Reset')}</Text>
                  </TouchableOpacity>

                  {/* Main play/pause */}
                  <TouchableOpacity
                    style={styles.ctrlMain}
                    onPress={timerState === 'running' ? pauseTimer : startTimer}
                    activeOpacity={0.82}
                    disabled={timerState === 'completed'}
                  >
                    <LinearGradient
                      colors={['#0F766E', '#0F9D8C']}
                      style={styles.ctrlMainGrad}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    >
                      <Ionicons name={timerState === 'running' ? 'pause' : 'play'} size={28} color="#fff" />
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Duration */}
                  <TouchableOpacity style={styles.ctrlSecondary} onPress={() => setShowDurationModal(true)}>
                    <Ionicons name="timer-outline" size={18} color={S.teal} />
                    <Text style={[styles.ctrlSecondaryText, { color: S.teal }]}>{formatMinutesCompact(focusDuration, appLang)}</Text>
                  </TouchableOpacity>
                </View>

                {/* Complete button */}
                {!isSessionCompleted ? (
                  <TouchableOpacity style={styles.completeBtn} onPress={handleSessionComplete} activeOpacity={0.82}>
                    <View style={styles.completeBtnInner}>
                      <Ionicons name="checkmark-circle-outline" size={18} color={S.teal} />
                      <Text style={styles.completeBtnText}>{ts('mark_complete', 'Mark as Complete')}</Text>
                    </View>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.completeBtn, { backgroundColor: S.tealLt, borderColor: `${S.teal}30` }]}
                    onPress={() => router.back()}
                    activeOpacity={0.82}
                  >
                    <View style={styles.completeBtnInner}>
                      <Ionicons name="checkmark-circle" size={18} color={S.teal} />
                      <Text style={[styles.completeBtnText, { color: S.tealDk }]}>{ts('session_complete_back', 'Session Complete - Go Back')}</Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* ═══ NOTES TAB ═══ */}
            {activeTab === 'notes' && (
              <View style={styles.notesTab}>

                {/* Notes card */}
                <View style={styles.notesCard}>
                  <View style={styles.notesCardHeader}>
                    <View style={styles.notesCardLeft}>
                      <View style={[styles.notesIcon, { backgroundColor: S.tealLt }]}>
                        <Ionicons name="document-text-outline" size={16} color={S.teal} />
                      </View>
                      <View>
                        <Text style={styles.notesCardTitle}>{ts('session_notes', 'Session Notes')}</Text>
                        <Text style={styles.notesCardSub}>{notes.length > 0 ? ts('characters_count', '{count} characters', { count: notes.length }) : ts('start_typing', 'Start typing...')}</Text>
                      </View>
                    </View>
                    {notes.length > 0 && (
                      <View style={[styles.notesCountBadge, { backgroundColor: S.tealLt }]}>
                        <Text style={[styles.notesCountText, { color: S.teal }]}>{ts('words_count', '{count} words', { count: notes.split(' ').filter(Boolean).length })}</Text>
                      </View>
                    )}
                  </View>

                  <Animated.View style={{ height: notesHeight, marginTop: 12 }}>
                    <TextInput
                      style={[styles.notesInput, {
                        borderColor: isNotesFocused ? `${S.teal}60` : S.cardBorder,
                        flex: 1,
                      }]}
                      placeholder={ts('notes_placeholder', 'Jot down key ideas, formulas, insights...')}
                      placeholderTextColor={S.muted}
                      value={notes}
                      onChangeText={setNotes}
                      onFocus={() => setIsNotesFocused(true)}
                      onBlur={() => setIsNotesFocused(false)}
                      multiline
                      textAlignVertical="top"
                      scrollEnabled
                      autoCorrect
                      blurOnSubmit={false}
                    />
                  </Animated.View>
                </View>

                {/* Quick insight cards */}
                <Text style={styles.tipsTitle}>{ts('tips_title', 'Study Tips')}</Text>
                {[
                  { icon: 'bulb-outline', text: ts('tip_1', 'Write in your own words to reinforce memory.'), color: S.amber },
                  { icon: 'repeat-outline', text: ts('tip_2', 'Revisit these notes before your next session.'), color: S.teal },
                  { icon: 'checkmark-circle-outline', text: ts('tip_3', 'Mark session complete once you finish.'), color: S.teal },
                ].map((tip, i) => (
                  <View key={i} style={styles.tipCard}>
                    <View style={[styles.tipIcon, { backgroundColor: `${tip.color}12` }]}>
                      <Ionicons name={tip.icon as any} size={16} color={tip.color} />
                    </View>
                    <Text style={styles.tipText}>{tip.text}</Text>
                  </View>
                ))}

                {/* Complete / back */}
                {!isSessionCompleted ? (
                  <TouchableOpacity style={styles.notesCompleteBtn} onPress={handleSessionComplete} activeOpacity={0.82}>
                    <LinearGradient colors={['#0F766E', '#0F9D8C']} style={styles.notesCompleteBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                      <Ionicons name="checkmark-circle" size={18} color="#fff" />
                      <Text style={styles.notesCompleteBtnText}>{ts('complete_session', 'Complete Session')}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={[styles.notesCompleteBtn, { marginTop: 0 }]} onPress={() => router.back()} activeOpacity={0.82}>
                    <LinearGradient colors={['#0F766E', '#0F9D8C']} style={styles.notesCompleteBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                      <Ionicons name="home-outline" size={18} color="#fff" />
                      <Text style={styles.notesCompleteBtnText}>{ts('back_dashboard', 'Back to Dashboard')}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Duration Modal ── */}
      <Modal visible={showDurationModal} transparent animationType="fade" onRequestClose={() => setShowDurationModal(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowDurationModal(false)}>
          <Pressable style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View style={[styles.modalIconBox, { backgroundColor: S.tealLt }]}>
                <Ionicons name="timer-outline" size={22} color={S.teal} />
              </View>
              <View>
                <Text style={styles.modalTitle}>{ts('focus_duration', 'Focus Duration')}</Text>
                <Text style={styles.modalSub}>{ts('select_focus_duration', 'Pick the block that matches your energy and workload')}</Text>
              </View>
            </View>
            <View style={styles.durationGrid}>
              {[[15,25],[45,60],[90]].map((row, ri) => (
                <View key={ri} style={styles.durationRow}>
                  {row.map((d) => {
                    const preset = localizedPresets.find((item) => item.minutes === d);
                    return (
                    <TouchableOpacity
                      key={d}
                      style={[styles.durationCell, d === focusDuration && styles.durationCellActive]}
                      onPress={() => changeDuration(d)}
                    >
                      <Text style={[styles.durationNum, d === focusDuration && { color: '#fff' }]}>{d}</Text>
                      <Text style={[styles.durationUnit, d === focusDuration && { color: 'rgba(255,255,255,0.75)' }]}>{getMinuteUnitShort(appLang)}</Text>
                      {preset ? (
                        <Text style={[styles.durationPresetLabel, d === focusDuration && { color: 'rgba(255,255,255,0.82)' }]}>{preset.label}</Text>
                      ) : null}
                    </TouchableOpacity>
                  );})}
                </View>
              ))}
            </View>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowDurationModal(false)}>
              <Text style={styles.modalCloseBtnText}>{ts('cancel', 'Cancel')}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Lofi Channel Modal ── */}
      <Modal visible={showLofiModal} transparent animationType="fade" onRequestClose={() => setShowLofiModal(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowLofiModal(false)}>
          <Pressable style={styles.lofiModalCard}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View style={[styles.modalIconBox, { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
                <Ionicons name="musical-notes-outline" size={22} color="#2DD4BF" />
              </View>
              <View>
                <Text style={styles.lofiModalTitle}>{ts('lofi_modal_title', 'Focus Radio')}</Text>
                <Text style={styles.lofiModalSub}>{ts('lofi_modal_sub', 'Pick the channel that fits this session')}</Text>
              </View>
            </View>

            <View style={styles.lofiChannelList}>
              {localizedLofiChannels.map((channel) => {
                const selected = channel.id === activeChannel.id;
                return (
                  <TouchableOpacity
                    key={channel.id}
                    style={[styles.lofiChannelCard, selected && styles.lofiChannelCardActive]}
                    onPress={() => {
                      void changeChannel(channel.id);
                      setShowLofiModal(false);
                    }}
                    activeOpacity={0.82}
                  >
                    <View style={styles.lofiChannelMeta}>
                      <View style={[styles.lofiChannelIcon, selected && styles.lofiChannelIconActive]}>
                        <Ionicons
                          name={channel.id === 'deep' ? 'radio-outline' : channel.id === 'ambient' ? 'moon-outline' : 'musical-note-outline'}
                          size={18}
                          color={selected ? S.teal : '#FFFFFF'}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.lofiChannelTitle}>{channel.title}</Text>
                        <Text style={styles.lofiChannelSub}>{channel.description}</Text>
                      </View>
                    </View>
                    <View style={[styles.lofiChannelRadio, selected && styles.lofiChannelRadioActive]}>
                      {selected ? <View style={styles.lofiChannelRadioDot} /> : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Completion Modal ── */}
      <Modal visible={showOutcomeModal} transparent animationType="fade" onRequestClose={() => setShowOutcomeModal(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowOutcomeModal(false)}>
          <Pressable style={styles.outcomeCard}>
            <View style={styles.modalHandle} />
            <Text style={styles.outcomeEyebrow}>{ts('feedback_upper', 'SESSION FEEDBACK')}</Text>
            <Text style={styles.outcomeTitle}>{ts('feedback_title', 'How did this session feel?')}</Text>
            <Text style={styles.outcomeSub}>
              {ts('feedback_sub', 'Your answer adjusts review timing and future session load.')}
            </Text>

            <View style={styles.outcomeGrid}>
              {([
                { id: 'easy',       label: ts('feedback_easy',       'Easy'),          color: S.teal },
                { id: 'okay',       label: ts('feedback_okay',       'Okay'),          color: '#64748B' },
                { id: 'hard',       label: ts('feedback_hard',       'Hard'),          color: S.amber },
                { id: 'incomplete', label: ts('feedback_incomplete', "Didn't finish"), color: S.rose },
              ] as const).map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.outcomeBtn, { borderColor: `${item.color}35`, backgroundColor: `${item.color}0C` }]}
                  onPress={() => void handleOutcomeSelect(item.id)}
                  activeOpacity={0.82}
                >
                  <Text style={[styles.outcomeBtnText, { color: item.color }]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Completion Modal ── */}
      <Modal visible={showCompletionModal} transparent animationType="fade" onRequestClose={() => setShowCompletionModal(false)}>
        <Pressable style={styles.overlay} onPress={() => {}}>
          <Animated.View style={[styles.completionCard, { opacity: completionOpacity, transform: [{ scale: completionScale }] }]}>

            {/* Top accent bar */}
            <LinearGradient colors={['#0F766E', '#0F9D8C', '#2DD4BF']} style={styles.completionAccentBar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />

            <View style={styles.completionBody}>
              {/* Title block */}
              <View style={styles.completionTitleBlock}>
                <Text style={styles.completionEyebrow}>
                  {completionIsPartial
                    ? ts('session_saved_upper', 'SESSION SAVED')
                    : ts('session_complete_upper', 'SESSION COMPLETE')}
                </Text>
                <Text style={styles.completionTitle}>{subjectLabel}</Text>
                <Text style={styles.completionSub}>
                  {sessionType.label} · {activePreset?.label ?? `${formatMinutesCompact(focusDuration, appLang)} ${ts('focus_duration', 'Focus Duration').toLowerCase()}`}
                </Text>
              </View>

              {/* Divider */}
              <View style={styles.completionDivider} />

              {/* Stats */}
              <View style={styles.completionStats}>
                <View style={styles.completionStatItem}>
                  <Text style={styles.completionStatVal}>{formatTime(focusDuration * 60 - timeLeft > 0 ? focusDuration * 60 - timeLeft : focusDuration * 60)}</Text>
                  <Text style={styles.completionStatLbl}>{ts('time_focused', 'Time focused')}</Text>
                </View>
                <View style={styles.completionStatDivider} />
                <View style={styles.completionStatItem}>
                  <Text style={styles.completionStatVal}>{notes.split(' ').filter(Boolean).length}</Text>
                  <Text style={styles.completionStatLbl}>{ts('words_noted', 'Words noted')}</Text>
                </View>
                <View style={styles.completionStatDivider} />
                <View style={styles.completionStatItem}>
                  <Text style={[styles.completionStatVal, { color: S.teal }]}>{progressPct}%</Text>
                  <Text style={styles.completionStatLbl}>{ts('completed', 'Completed')}</Text>
                </View>
              </View>

              {/* Message */}
              <Text style={styles.completionMsg}>
                {completionMessage}
              </Text>

              {/* Actions */}
              <View style={styles.completionActions}>
                <TouchableOpacity style={styles.completionSecBtn} onPress={() => setShowCompletionModal(false)}>
                  <Text style={styles.completionSecBtnText}>{ts('stay', 'Stay')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.completionPrimBtn}
                  onPress={async () => {
                    setShowCompletionModal(false);
                    if (!completionIsPartial) {
                      await trackCompletedStudySession();
                      await requestReview();
                    }
                    router.back();
                  }}
                  activeOpacity={0.82}
                >
                  <LinearGradient colors={['#0F766E', '#0F9D8C']} style={styles.completionPrimBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Text style={styles.completionPrimBtnText}>{ts('back_dashboard', 'Back to Dashboard')}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* ── Exit Modal ── */}
      <Modal visible={showExitModal} transparent animationType="fade" onRequestClose={() => setShowExitModal(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowExitModal(false)}>
          <Pressable style={styles.exitCard}>
            <View style={styles.modalHandle} />
            <Text style={styles.exitTitle}>{isSessionCompleted ? ts('session_complete', 'Session Complete') : ts('exit_session', 'Exit Session?')}</Text>
            <Text style={styles.exitMsg}>
              {isSessionCompleted ? ts('exit_msg_completed', 'Your session is saved. Return to dashboard?') : ts('exit_msg', 'Your notes are auto-saved. Exit anytime.')}
            </Text>
            <View style={styles.exitActions}>
              <TouchableOpacity style={styles.exitCancelBtn} onPress={() => setShowExitModal(false)}>
                <Text style={styles.exitCancelText}>{ts('stay', 'Stay')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.exitConfirmBtn}
                onPress={() => { setShowExitModal(false); router.back(); }}
              >
                <LinearGradient
                  colors={isSessionCompleted ? ['#0F766E', '#0F9D8C'] : ['#0F766E', '#0F9D8C']}
                  style={styles.exitConfirmGrad}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.exitConfirmText}>{isSessionCompleted ? ts('go_dashboard', 'Go to Dashboard') : ts('exit', 'Exit')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: S.bg0 },
  orbA: { position: 'absolute', width: 280, height: 280, borderRadius: 140, top: -90, right: -120, backgroundColor: 'rgba(45,212,191,0.12)' },
  orbB: { position: 'absolute', width: 200, height: 200, borderRadius: 100, bottom: 100, left: -100, backgroundColor: 'rgba(52,211,153,0.08)' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: isTablet ? 22 : 18,
    paddingTop: isIOS ? (isTablet ? 14 : 4) : (isTablet ? 22 : 12), paddingBottom: isTablet ? 22 : 12,
  },
  backBtn: {
    width: isTablet ? 46 : 38, height: isTablet ? 46 : 38, borderRadius: isTablet ? 23 : 19, backgroundColor: S.card,
    borderWidth: 1, borderColor: S.cardBorder,
    justifyContent: 'center', alignItems: 'center', marginRight: isTablet ? 18 : 14,
    shadowColor: S.teal, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
  },
  headerMid: { flex: 1, minWidth: 0 },
  headerSubject: { fontSize: isTablet ? 34 : 19, fontWeight: '800', color: S.ink, marginBottom: 4, flexShrink: 1 },
  headerMetaRow: { flexDirection: 'row', alignItems: 'center', gap: isTablet ? 10 : 7 },
  typePill: {
    paddingHorizontal: isTablet ? 12 : 8, paddingVertical: isTablet ? 5 : 3, borderRadius: isTablet ? 9 : 6,
    borderWidth: 1,
  },
  typePillText: { fontSize: isTablet ? 12 : 10, fontWeight: '800', letterSpacing: 0.8 },
  headerDot: { fontSize: isTablet ? 16 : 13, color: S.muted, fontWeight: '600' },
  headerDuration: { fontSize: isTablet ? 16 : 12, fontWeight: '600', color: S.sub },
  doneChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: S.tealLt, borderRadius: isTablet ? 13 : 10, paddingHorizontal: isTablet ? 14 : 11, paddingVertical: isTablet ? 9 : 7,
    borderWidth: 1, borderColor: `${S.teal}20`,
  },
  doneChipDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: S.teal },
  doneChipText: { fontSize: isTablet ? 14 : 12, fontWeight: '700', color: S.tealDk },
  moreBtn: {
    width: isTablet ? 46 : 38, height: isTablet ? 46 : 38, borderRadius: isTablet ? 23 : 19, backgroundColor: S.card,
    borderWidth: 1, borderColor: S.cardBorder, justifyContent: 'center', alignItems: 'center',
  },

  // Tab
  tabRow: {
    flexDirection: 'row', marginHorizontal: isTablet ? 22 : 18, marginBottom: isTablet ? 26 : 16,
    backgroundColor: S.card, borderRadius: isTablet ? 18 : 14, padding: isTablet ? 6 : 4,
    borderWidth: 1, borderColor: S.cardBorder,
    shadowColor: S.teal, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 2,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: isTablet ? 8 : 6, paddingVertical: isTablet ? 14 : 10, borderRadius: isTablet ? 13 : 10, minWidth: 0,
  },
  tabActive: { backgroundColor: S.tealGlow, shadowColor: S.teal, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: isTablet ? 16 : 12, fontWeight: '600', color: S.muted, flexShrink: 1, minWidth: 0 },
  tabTextActive: { color: S.teal },

  // Scroll
  scroll: { paddingHorizontal: isTablet ? 24 : 18, paddingBottom: isIOS ? (isTablet ? 150 : 110) : (isTablet ? 120 : 90) },

  // Timer Tab
  timerTab: { gap: isTablet ? 10 : 14 },

  // Ring Card
  ringCard: {
    borderRadius: isTablet ? 30 : 24, overflow: 'hidden',
    shadowColor: '#0F766E', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.28, shadowRadius: 20, elevation: 14,
    minHeight: isTablet ? 620 : undefined,
  },
  ringGradient: { paddingVertical: isTablet ? 62 : 32, paddingHorizontal: isTablet ? 36 : 24, alignItems: 'center', justifyContent: isTablet ? 'center' : 'flex-start' },
  ringBlob1: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.07)', top: -50, right: -40 },
  ringBlob2: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.05)', bottom: -20, left: 40 },
  ringInner: { alignItems: 'center', justifyContent: 'center' },
  ringTime: { fontSize: isTablet ? 82 : 42, fontWeight: '900', color: '#FFFFFF', letterSpacing: -2, textShadowColor: 'rgba(0,0,0,0.15)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  ringStateBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: isTablet ? 16 : 8, paddingHorizontal: isTablet ? 22 : 14, paddingVertical: isTablet ? 11 : 6, borderRadius: isTablet ? 24 : 20,
  },
  ringStateDot: { width: 7, height: 7, borderRadius: 4 },
  ringStateText: { fontSize: isTablet ? 20 : 13, fontWeight: '700', color: '#FFFFFF' },
  ringBar: { flexDirection: 'row', alignItems: 'center', gap: isTablet ? 14 : 10, marginTop: isTablet ? 58 : 20, width: '100%', maxWidth: isTablet ? 560 : 260 },
  ringBarTrack: { flex: 1, height: isTablet ? 8 : 5, borderRadius: isTablet ? 4 : 3, backgroundColor: 'rgba(255,255,255,0.22)', overflow: 'hidden' },
  ringBarFill: { height: isTablet ? 8 : 5, borderRadius: isTablet ? 4 : 3, backgroundColor: '#fff' },
  ringBarPct: { fontSize: isTablet ? 16 : 12, fontWeight: '700', color: 'rgba(255,255,255,0.85)', minWidth: isTablet ? 44 : 32, textAlign: 'right' },

  // Meta row
  metaRow: { flexDirection: 'row', gap: isTablet ? 18 : 10 },
  metaCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: isTablet ? 12 : 10,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderRadius: isTablet ? 18 : 12,
    paddingHorizontal: isTablet ? 16 : 12,
    paddingVertical: isTablet ? 12 : 9,
    borderWidth: 1,
    borderColor: 'rgba(15,157,140,0.10)',
  },
  metaIconWrap: {
    width: isTablet ? 32 : 26,
    height: isTablet ? 32 : 26,
    borderRadius: isTablet ? 16 : 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,157,140,0.08)',
    flexShrink: 0,
  },
  metaTextWrap: { flex: 1, minWidth: 0 },
  metaLabel: {
    fontSize: isTablet ? 12 : 10,
    fontWeight: '800',
    color: S.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  metaValue: {
    marginTop: 3,
    fontSize: isTablet ? 18 : 13,
    fontWeight: '700',
    color: S.ink,
    flexShrink: 1,
  },
  audioCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: isTablet ? 16 : 10,
    backgroundColor: S.card, borderRadius: isTablet ? 22 : 16, paddingHorizontal: isTablet ? 18 : 14, paddingVertical: isTablet ? 15 : 12,
    borderWidth: 1, borderColor: 'rgba(15,157,140,0.18)',
    shadowColor: S.teal, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 2,
  },
  audioCardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: isTablet ? 14 : 10, minWidth: 0 },
  audioToggle: {
    width: isTablet ? 48 : 38, height: isTablet ? 48 : 38, borderRadius: isTablet ? 24 : 19,
    alignItems: 'center', justifyContent: 'center', backgroundColor: S.tealLt, borderWidth: 1, borderColor: `${S.teal}20`,
  },
  audioToggleActive: {
    backgroundColor: S.teal, borderColor: S.teal,
    shadowColor: S.teal, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.22, shadowRadius: 12, elevation: 4,
  },
  audioMeta: { flex: 1, minWidth: 0 },
  audioTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  audioTitleIcon: {
    width: isTablet ? 24 : 20, height: isTablet ? 24 : 20, borderRadius: isTablet ? 12 : 10,
    alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(148,163,184,0.12)',
  },
  audioTitleIconActive: { backgroundColor: 'rgba(15,157,140,0.12)' },
  audioTitle: { fontSize: isTablet ? 17 : 13, fontWeight: '800', color: S.ink },
  audioSub: { marginTop: 4, fontSize: isTablet ? 14 : 11, fontWeight: '600', color: S.muted },
  audioChangeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0,
    paddingHorizontal: isTablet ? 14 : 10, paddingVertical: isTablet ? 11 : 9,
    borderRadius: isTablet ? 16 : 12, backgroundColor: S.bg1, borderWidth: 1, borderColor: 'rgba(15,157,140,0.14)',
  },
  audioChangeIcon: {
    width: isTablet ? 28 : 22, height: isTablet ? 28 : 22, borderRadius: isTablet ? 14 : 11,
    alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15,157,140,0.10)',
  },
  audioChangeText: { fontSize: isTablet ? 15 : 12, fontWeight: '800', color: S.teal },
  presetRow: { flexDirection: 'row', gap: isTablet ? 12 : 5 },
  presetChip: {
    flex: 1,
    paddingHorizontal: 8, paddingVertical: isTablet ? 20 : 11, borderRadius: isTablet ? 18 : 12,
    borderWidth: 1, borderColor: S.cardBorder, backgroundColor: S.card,
    alignItems: 'center', justifyContent: 'center',
  },
  presetChipActive: { backgroundColor: S.tealLt, borderColor: `${S.teal}40` },
  presetChipText: { fontSize: isTablet ? 16 : 11, fontWeight: '700', color: S.sub, textAlign: 'center' },
  presetChipTextActive: { color: S.tealDk },

  // Controls
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: isTablet ? 36 : 20, marginVertical: isTablet ? 16 : 4 },
  ctrlSecondary: {
    alignItems: 'center', gap: 5, backgroundColor: S.card,
    paddingHorizontal: isTablet ? 28 : 20, paddingVertical: isTablet ? 20 : 14, borderRadius: isTablet ? 22 : 16,
    borderWidth: 1, borderColor: S.cardBorder, minWidth: isTablet ? 102 : 72,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  ctrlSecondaryText: { fontSize: isTablet ? 15 : 11, fontWeight: '700', color: S.sub, textTransform: 'uppercase', letterSpacing: 0.4 },
  ctrlMain: {
    borderRadius: isTablet ? 52 : 38,
    shadowColor: S.tealDk, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.38, shadowRadius: 16, elevation: 12,
  },
  ctrlMainGrad: { width: isTablet ? 104 : 76, height: isTablet ? 104 : 76, borderRadius: isTablet ? 52 : 38, justifyContent: 'center', alignItems: 'center' },

  // Complete
  completeBtn: {
    backgroundColor: S.tealLt, borderRadius: isTablet ? 22 : 16,
    borderWidth: 1, borderColor: `${S.teal}25`, overflow: 'hidden',
    shadowColor: S.teal, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 6, elevation: 2,
  },
  completeBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: isTablet ? 22 : 14 },
  completeBtnText: { fontSize: isTablet ? 20 : 14, fontWeight: '700', color: S.teal },

  // Notes Tab
  notesTab: { gap: isTablet ? 30 : 14 },
  notesCard: {
    backgroundColor: S.card, borderRadius: isTablet ? 22 : 18, padding: isTablet ? 20 : 16,
    borderWidth: 1, borderColor: S.cardBorder,
    shadowColor: S.teal, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
    minHeight: isTablet ? 560 : undefined,
  },
  notesCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  notesCardLeft: { flexDirection: 'row', alignItems: 'center', gap: isTablet ? 14 : 10 },
  notesIcon: { width: isTablet ? 48 : 36, height: isTablet ? 48 : 36, borderRadius: isTablet ? 14 : 10, justifyContent: 'center', alignItems: 'center' },
  notesCardTitle: { fontSize: isTablet ? 22 : 14, fontWeight: '700', color: S.ink },
  notesCardSub: { fontSize: isTablet ? 17 : 12, color: S.muted, marginTop: 1 },
  notesCountBadge: { borderRadius: isTablet ? 13 : 10, paddingHorizontal: isTablet ? 13 : 9, paddingVertical: isTablet ? 7 : 4 },
  notesCountText: { fontSize: isTablet ? 14 : 11, fontWeight: '700' },
  notesInput: {
    borderWidth: 1.5, borderRadius: isTablet ? 18 : 12, padding: isTablet ? 22 : 14,
    fontSize: isTablet ? 21 : 15, lineHeight: isTablet ? 31 : 22, color: S.ink,
    backgroundColor: S.bg1, fontFamily: isIOS ? 'Georgia' : 'serif',
  },
  tipsTitle: { fontSize: isTablet ? 16 : 12, fontWeight: '800', color: S.muted, textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 },
  tipCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: S.card, borderRadius: isTablet ? 18 : 12, padding: isTablet ? 18 : 13,
    borderWidth: 1, borderColor: S.cardBorder,
  },
  tipIcon: { width: isTablet ? 42 : 32, height: isTablet ? 42 : 32, borderRadius: isTablet ? 12 : 9, justifyContent: 'center', alignItems: 'center' },
  tipText: { flex: 1, fontSize: isTablet ? 18 : 13, color: S.sub, lineHeight: isTablet ? 25 : 18 },
  notesCompleteBtn: { borderRadius: 16, overflow: 'hidden', shadowColor: S.tealDk, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.28, shadowRadius: 12, elevation: 8 },
  notesCompleteBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, paddingVertical: isTablet ? 22 : 16 },
  notesCompleteBtnText: { fontSize: isTablet ? 20 : 15, fontWeight: '800', color: '#fff', letterSpacing: 0.2 },

  outcomeCard: {
    width: isTablet ? '78%' : '90%', alignSelf: 'center', backgroundColor: S.card, borderRadius: isTablet ? 32 : 28,
    paddingHorizontal: isTablet ? 24 : 18, paddingTop: isTablet ? 18 : 14, paddingBottom: isTablet ? 24 : 18, borderWidth: 1, borderColor: S.cardBorder,
  },
  outcomeEyebrow: { fontSize: isTablet ? 13 : 11, fontWeight: '800', letterSpacing: 1.2, color: S.teal, marginTop: 6 },
  outcomeTitle: { fontSize: isTablet ? 28 : 22, lineHeight: isTablet ? 34 : 28, fontWeight: '800', color: S.ink, marginTop: 8 },
  outcomeSub: { fontSize: isTablet ? 16 : 13, lineHeight: isTablet ? 24 : 20, color: S.sub, marginTop: 6 },
  outcomeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: isTablet ? 14 : 10, marginTop: isTablet ? 22 : 18 },
  outcomeBtn: {
    width: '48%', borderRadius: isTablet ? 18 : 16, paddingHorizontal: 12, paddingVertical: isTablet ? 22 : 18,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
  outcomeBtnText: { fontSize: isTablet ? 18 : 15, fontWeight: '700', color: S.ink, textAlign: 'center' },

  // Modals overlay
  overlay: { flex: 1, backgroundColor: 'rgba(2,6,23,0.42)', justifyContent: 'flex-end', padding: 16 },

  // Duration modal
  modalCard: {
    backgroundColor: S.card, borderRadius: isTablet ? 26 : 22, padding: isTablet ? 26 : 20,
    borderWidth: 1, borderColor: S.cardBorder,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 10,
  },
  modalHandle: { width: isTablet ? 44 : 36, height: 4, borderRadius: 2, backgroundColor: S.track, alignSelf: 'center', marginBottom: 18 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: isTablet ? 16 : 12, marginBottom: isTablet ? 24 : 20 },
  modalIconBox: { width: isTablet ? 52 : 44, height: isTablet ? 52 : 44, borderRadius: isTablet ? 15 : 13, justifyContent: 'center', alignItems: 'center' },
  modalTitle: { fontSize: isTablet ? 22 : 17, fontWeight: '800', color: S.ink },
  modalSub: { fontSize: isTablet ? 15 : 12, color: S.muted, marginTop: 2 },
  durationGrid: { gap: isTablet ? 14 : 10, marginBottom: isTablet ? 24 : 20 },
  durationRow: { flexDirection: 'row', gap: isTablet ? 14 : 10 },
  durationCell: {
    flex: 1,
    paddingVertical: isTablet ? 24 : 20, borderRadius: isTablet ? 20 : 16,
    alignItems: 'center', backgroundColor: S.bg1,
    borderWidth: 1.5, borderColor: S.cardBorder,
  },
  durationCellActive: { backgroundColor: S.teal, borderColor: S.teal },
  durationNum: { fontSize: isTablet ? 28 : 22, fontWeight: '900', color: S.ink },
  durationUnit: { fontSize: isTablet ? 13 : 11, fontWeight: '600', color: S.muted, marginTop: 2 },
  durationPresetLabel: { fontSize: isTablet ? 13 : 11, fontWeight: '700', color: S.sub, marginTop: 6 },
  modalCloseBtn: {
    height: isTablet ? 52 : 46, borderRadius: isTablet ? 16 : 13, backgroundColor: S.bg1,
    borderWidth: 1, borderColor: S.cardBorder, alignItems: 'center', justifyContent: 'center',
  },
  modalCloseBtnText: { fontSize: isTablet ? 17 : 14, fontWeight: '700', color: S.sub },
  lofiModalCard: {
    backgroundColor: '#081512', borderTopLeftRadius: isTablet ? 30 : 22, borderTopRightRadius: isTablet ? 30 : 22,
    paddingHorizontal: isTablet ? 28 : 20, paddingTop: isTablet ? 18 : 14, paddingBottom: isTablet ? 28 : 22,
    borderWidth: 1, borderColor: 'rgba(45,212,191,0.16)',
    shadowColor: '#000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 16,
  },
  lofiModalTitle: { fontSize: isTablet ? 24 : 20, fontWeight: '900', color: '#FFFFFF' },
  lofiModalSub: { marginTop: 4, fontSize: isTablet ? 16 : 13, color: 'rgba(226,232,240,0.72)' },
  lofiChannelList: { marginTop: isTablet ? 22 : 16, gap: isTablet ? 14 : 10 },
  lofiChannelCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    borderRadius: isTablet ? 20 : 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)', paddingHorizontal: isTablet ? 18 : 14, paddingVertical: isTablet ? 18 : 14,
  },
  lofiChannelCardActive: { borderColor: 'rgba(45,212,191,0.45)', backgroundColor: 'rgba(45,212,191,0.10)' },
  lofiChannelMeta: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: isTablet ? 14 : 10 },
  lofiChannelIcon: {
    width: isTablet ? 42 : 34, height: isTablet ? 42 : 34, borderRadius: isTablet ? 21 : 17,
    backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center',
  },
  lofiChannelIconActive: { backgroundColor: 'rgba(255,255,255,0.9)' },
  lofiChannelTitle: { fontSize: isTablet ? 18 : 15, fontWeight: '800', color: '#FFFFFF' },
  lofiChannelSub: { marginTop: 3, fontSize: isTablet ? 15 : 12, color: 'rgba(226,232,240,0.68)' },
  lofiChannelRadio: {
    width: isTablet ? 26 : 22, height: isTablet ? 26 : 22, borderRadius: isTablet ? 13 : 11,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.28)', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  lofiChannelRadioActive: { borderColor: '#2DD4BF', backgroundColor: 'rgba(45,212,191,0.12)' },
  lofiChannelRadioDot: { width: isTablet ? 10 : 8, height: isTablet ? 10 : 8, borderRadius: isTablet ? 5 : 4, backgroundColor: '#2DD4BF' },

  // Completion modal
  completionCard: {
    backgroundColor: S.card, borderRadius: isTablet ? 28 : 24,
    borderWidth: 1, borderColor: S.cardBorder, overflow: 'hidden', width: '100%',
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 12,
  },
  completionAccentBar: { height: 4, width: '100%' },
  completionBody: { padding: isTablet ? 30 : 24 },
  completionTitleBlock: { marginBottom: isTablet ? 24 : 20 },
  completionEyebrow: { fontSize: isTablet ? 12 : 10, fontWeight: '800', color: S.teal, letterSpacing: 1.4, marginBottom: 8 },
  completionTitle: { fontSize: isTablet ? 30 : 24, fontWeight: '900', color: S.ink, marginBottom: 4, letterSpacing: -0.5 },
  completionSub: { fontSize: isTablet ? 16 : 13, color: S.sub, fontWeight: '500' },
  completionDivider: { height: StyleSheet.hairlineWidth, backgroundColor: S.cardBorder, marginBottom: isTablet ? 24 : 20 },
  completionStats: { flexDirection: 'row', alignItems: 'center', marginBottom: isTablet ? 24 : 20 },
  completionStatItem: { flex: 1, alignItems: 'center' },
  completionStatDivider: { width: StyleSheet.hairlineWidth, height: isTablet ? 44 : 36, backgroundColor: S.cardBorder },
  completionStatVal: { fontSize: isTablet ? 28 : 22, fontWeight: '900', color: S.ink, letterSpacing: -0.5, marginBottom: 3 },
  completionStatLbl: { fontSize: isTablet ? 13 : 11, fontWeight: '600', color: S.muted, textTransform: 'uppercase', letterSpacing: 0.4 },
  completionMsg: { fontSize: isTablet ? 16 : 13, color: S.sub, lineHeight: isTablet ? 24 : 19, marginBottom: isTablet ? 26 : 22, paddingHorizontal: 2 },
  completionActions: { flexDirection: 'row', gap: isTablet ? 14 : 10 },
  completionSecBtn: {
    flex: 0.8, height: isTablet ? 56 : 48, borderRadius: isTablet ? 16 : 13, backgroundColor: S.bg1,
    borderWidth: 1, borderColor: S.cardBorder, justifyContent: 'center', alignItems: 'center',
  },
  completionSecBtnText: { fontSize: isTablet ? 17 : 14, fontWeight: '700', color: S.sub },
  completionPrimBtn: { flex: 1.5, borderRadius: isTablet ? 16 : 13, overflow: 'hidden' },
  completionPrimBtnGrad: { height: isTablet ? 56 : 48, justifyContent: 'center', alignItems: 'center' },
  completionPrimBtnText: { fontSize: isTablet ? 17 : 14, fontWeight: '800', color: '#fff' },

  // Exit modal
  exitCard: {
    backgroundColor: S.card, borderRadius: isTablet ? 26 : 22, padding: isTablet ? 30 : 24, alignItems: 'center',
    borderWidth: 1, borderColor: S.cardBorder,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 10,
  },
  exitIconBox: { width: isTablet ? 72 : 60, height: isTablet ? 72 : 60, borderRadius: isTablet ? 22 : 18, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  exitTitle: { fontSize: isTablet ? 24 : 18, fontWeight: '800', color: S.ink, marginBottom: 8 },
  exitMsg: { fontSize: isTablet ? 16 : 13, color: S.sub, textAlign: 'center', lineHeight: isTablet ? 24 : 19, marginBottom: isTablet ? 26 : 22 },
  exitActions: { flexDirection: 'row', gap: isTablet ? 14 : 12, width: '100%' },
  exitCancelBtn: {
    flex: 1, height: isTablet ? 56 : 48, borderRadius: isTablet ? 16 : 13, backgroundColor: S.bg1,
    borderWidth: 1, borderColor: S.cardBorder, justifyContent: 'center', alignItems: 'center',
  },
  exitCancelText: { fontSize: isTablet ? 17 : 14, fontWeight: '700', color: S.sub },
  exitConfirmBtn: { flex: 1.3, borderRadius: isTablet ? 16 : 13, overflow: 'hidden' },
  exitConfirmGrad: { height: isTablet ? 56 : 48, justifyContent: 'center', alignItems: 'center' },
  exitConfirmText: { fontSize: isTablet ? 17 : 14, fontWeight: '800', color: '#fff' },
});
