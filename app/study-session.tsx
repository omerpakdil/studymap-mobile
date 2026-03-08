import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  AppState,
  Dimensions,
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
import { getLocalizedTaskTitle } from '@/app/i18n/taskContent';
import { getLocalizedSubjectName } from '@/app/i18n/subjectNames';
import NotificationService from '@/app/utils/notificationService';
import { requestReview, trackCompletedStudySession } from '@/app/utils/reviewPrompt';

const { width, height } = Dimensions.get('window');
const isIOS = Platform.OS === 'ios';
const isTablet = width >= 768;

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
  const clamp = Math.min(1, Math.max(0, progress));
  const angle = clamp * 360;
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      {/* Track */}
      <View style={{
        position: 'absolute', width: size, height: size,
        borderRadius: size / 2, borderWidth: strokeWidth,
        borderColor: 'rgba(148,163,184,0.18)',
      }} />
      {/* Fill arc */}
      <View style={{
        position: 'absolute', width: size, height: size,
        borderRadius: size / 2, borderWidth: strokeWidth,
        borderColor: 'transparent',
        borderTopColor: color,
        borderRightColor: angle >= 90 ? color : 'transparent',
        borderBottomColor: angle >= 180 ? color : 'transparent',
        borderLeftColor: angle >= 270 ? color : 'transparent',
        transform: [{ rotate: '-90deg' }],
      }} />
      {/* Inner glow ring — decoration only, no background fill */}
      <View style={{
        position: 'absolute', width: size - strokeWidth * 2 - 10,
        height: size - strokeWidth * 2 - 10,
        borderRadius: (size - strokeWidth * 2 - 10) / 2,
        borderWidth: 1, borderColor: `${color}30`,
        backgroundColor: 'transparent',
      }} />
      {/* Children sit on top */}
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
  const [showExitModal, setShowExitModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'timer' | 'notes'>('timer');

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const backgroundTimeRef = useRef<number | null>(null);
  const isRunningRef = useRef(false);

  // Animations
  const fadeIn = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-20)).current;
  const ringPulse = useRef(new Animated.Value(1)).current;
  const tabAnim = useRef(new Animated.Value(1)).current;
  const notesHeight = useRef(new Animated.Value(180)).current;
  const completionScale = useRef(new Animated.Value(0.7)).current;
  const completionOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(headerSlide, { toValue: 0, useNativeDriver: true, tension: 80 }),
    ]).start();
    loadSessionData();
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
        const elapsed = Math.floor((Date.now() - backgroundTimeRef.current) / 1000);
        setTimeLeft((prev) => {
          const next = Math.max(0, prev - elapsed);
          if (next === 0) completeTimer();
          return next;
        });
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

  const getStorageKeys = () => {
    const id = params?.taskId || 'default';
    return { notes: `session_notes_${id}`, completed: `session_completed_${id}`, completionTime: `session_completion_time_${id}` };
  };

  const loadSessionData = async () => {
    try {
      const keys = getStorageKeys();
      const [n, c] = await Promise.all([AsyncStorage.getItem(keys.notes), AsyncStorage.getItem(keys.completed)]);
      if (n) setNotes(n);
      if (c === 'true') setIsSessionCompleted(true);
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

  const startTimer = () => {
    if (timerState === 'completed') return;
    setTimerState('running');
    isRunningRef.current = true;
    if (timerState === 'idle') NotificationService.startBreakReminders?.();
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { completeTimer(); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const pauseTimer = () => {
    setTimerState('paused');
    isRunningRef.current = false;
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const resetTimer = () => {
    pauseTimer();
    setTimerState('idle');
    setTimeLeft(focusDuration * 60);
  };

  const completeTimer = () => {
    pauseTimer();
    setTimerState('completed');
    showAlert(ts('time_up_title', 'Time is up!'), ts('time_up_body', 'Great focus session!'));
  };

  const handleSessionComplete = async () => {
    pauseTimer();
    setIsSessionCompleted(true);
    await saveCompletion();
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
                        size={isTablet ? 220 : 190}
                        strokeWidth={isTablet ? 14 : 11}
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
                  <View style={styles.metaChip}>
                    <Ionicons name="time-outline" size={14} color={S.teal} />
                    <Text style={styles.metaChipText}>{ts('planned_minutes', '{minutes}m planned', { minutes: focusDuration })}</Text>
                  </View>
                  <View style={styles.metaChip}>
                    <Ionicons name="book-outline" size={14} color={S.teal} />
                    <Text style={styles.metaChipText}>{subjectLabel}</Text>
                  </View>
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
                    <Text style={[styles.ctrlSecondaryText, { color: S.teal }]}>{focusDuration}m</Text>
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
                <Text style={styles.modalSub}>{ts('select_focus_duration', 'Select how long to focus')}</Text>
              </View>
            </View>
            <View style={styles.durationGrid}>
              {[[5,15,25],[30,45,60]].map((row, ri) => (
                <View key={ri} style={styles.durationRow}>
                  {row.map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[styles.durationCell, d === focusDuration && styles.durationCellActive]}
                      onPress={() => changeDuration(d)}
                    >
                      <Text style={[styles.durationNum, d === focusDuration && { color: '#fff' }]}>{d}</Text>
                      <Text style={[styles.durationUnit, d === focusDuration && { color: 'rgba(255,255,255,0.75)' }]}>{ts('min_short', 'min')}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </View>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowDurationModal(false)}>
              <Text style={styles.modalCloseBtnText}>{ts('cancel', 'Cancel')}</Text>
            </TouchableOpacity>
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
                <Text style={styles.completionEyebrow}>{ts('session_complete_upper', 'SESSION COMPLETE')}</Text>
                <Text style={styles.completionTitle}>{subjectLabel}</Text>
                <Text style={styles.completionSub}>{sessionType.label} · {ts('planned_minutes', '{minutes}m planned', { minutes: focusDuration })}</Text>
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
                {notes.length > 20 ? ts('completion_msg_notes', 'Great note-taking - review soon to lock in retention.') : ts('completion_msg_no_notes', 'Try taking notes next time to boost recall.')}
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
                    await trackCompletedStudySession();
                    await requestReview();
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
            <View style={[styles.exitIconBox, { backgroundColor: isSessionCompleted ? S.tealLt : S.amberLt }]}>
              <Ionicons name={isSessionCompleted ? 'checkmark-circle' : 'warning-outline'} size={28} color={isSessionCompleted ? S.teal : S.amber} />
            </View>
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
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18,
    paddingTop: isIOS ? 4 : 12, paddingBottom: 12,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: S.card,
    borderWidth: 1, borderColor: S.cardBorder,
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
    shadowColor: S.teal, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
  },
  headerMid: { flex: 1, minWidth: 0 },
  headerSubject: { fontSize: 19, fontWeight: '800', color: S.ink, marginBottom: 4, flexShrink: 1 },
  headerMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  typePill: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
    borderWidth: 1,
  },
  typePillText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  headerDot: { fontSize: 13, color: S.muted, fontWeight: '600' },
  headerDuration: { fontSize: 12, fontWeight: '600', color: S.sub },
  doneChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: S.tealLt, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 7,
    borderWidth: 1, borderColor: `${S.teal}20`,
  },
  doneChipDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: S.teal },
  doneChipText: { fontSize: 12, fontWeight: '700', color: S.tealDk },
  moreBtn: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: S.card,
    borderWidth: 1, borderColor: S.cardBorder, justifyContent: 'center', alignItems: 'center',
  },

  // Tab
  tabRow: {
    flexDirection: 'row', marginHorizontal: 18, marginBottom: 16,
    backgroundColor: S.card, borderRadius: 14, padding: 4,
    borderWidth: 1, borderColor: S.cardBorder,
    shadowColor: S.teal, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 2,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, minWidth: 0,
  },
  tabActive: { backgroundColor: S.tealGlow, shadowColor: S.teal, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 12, fontWeight: '600', color: S.muted, flexShrink: 1, minWidth: 0 },
  tabTextActive: { color: S.teal },

  // Scroll
  scroll: { paddingHorizontal: 18, paddingBottom: isIOS ? 110 : 90 },

  // Timer Tab
  timerTab: { gap: 14 },

  // Ring Card
  ringCard: {
    borderRadius: 24, overflow: 'hidden',
    shadowColor: '#0F766E', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.28, shadowRadius: 20, elevation: 14,
  },
  ringGradient: { paddingVertical: 32, paddingHorizontal: 24, alignItems: 'center' },
  ringBlob1: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.07)', top: -50, right: -40 },
  ringBlob2: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.05)', bottom: -20, left: 40 },
  ringInner: { alignItems: 'center', justifyContent: 'center' },
  ringTime: { fontSize: isTablet ? 48 : 42, fontWeight: '900', color: '#FFFFFF', letterSpacing: -2, textShadowColor: 'rgba(0,0,0,0.15)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  ringStateBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 8, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
  },
  ringStateDot: { width: 7, height: 7, borderRadius: 4 },
  ringStateText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  ringBar: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 20, width: '100%', maxWidth: 260 },
  ringBarTrack: { flex: 1, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.22)', overflow: 'hidden' },
  ringBarFill: { height: 5, borderRadius: 3, backgroundColor: '#fff' },
  ringBarPct: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.85)', minWidth: 32, textAlign: 'right' },

  // Meta row
  metaRow: { flexDirection: 'row', gap: 10 },
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: S.card, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9,
    borderWidth: 1, borderColor: S.cardBorder, flex: 1, justifyContent: 'center',
    shadowColor: S.teal, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1,
  },
  metaChipText: { fontSize: 12, fontWeight: '600', color: S.sub, flexShrink: 1 },

  // Controls
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginVertical: 4 },
  ctrlSecondary: {
    alignItems: 'center', gap: 5, backgroundColor: S.card,
    paddingHorizontal: 20, paddingVertical: 14, borderRadius: 16,
    borderWidth: 1, borderColor: S.cardBorder, minWidth: 72,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  ctrlSecondaryText: { fontSize: 11, fontWeight: '700', color: S.sub, textTransform: 'uppercase', letterSpacing: 0.4 },
  ctrlMain: {
    borderRadius: 38,
    shadowColor: S.tealDk, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.38, shadowRadius: 16, elevation: 12,
  },
  ctrlMainGrad: { width: 76, height: 76, borderRadius: 38, justifyContent: 'center', alignItems: 'center' },

  // Complete
  completeBtn: {
    backgroundColor: S.tealLt, borderRadius: 16,
    borderWidth: 1, borderColor: `${S.teal}25`, overflow: 'hidden',
    shadowColor: S.teal, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 6, elevation: 2,
  },
  completeBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  completeBtnText: { fontSize: 14, fontWeight: '700', color: S.teal },

  // Notes Tab
  notesTab: { gap: 14 },
  notesCard: {
    backgroundColor: S.card, borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: S.cardBorder,
    shadowColor: S.teal, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  notesCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  notesCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  notesIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  notesCardTitle: { fontSize: 14, fontWeight: '700', color: S.ink },
  notesCardSub: { fontSize: 12, color: S.muted, marginTop: 1 },
  notesCountBadge: { borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4 },
  notesCountText: { fontSize: 11, fontWeight: '700' },
  notesInput: {
    borderWidth: 1.5, borderRadius: 12, padding: 14,
    fontSize: 15, lineHeight: 22, color: S.ink,
    backgroundColor: S.bg1, fontFamily: isIOS ? 'Georgia' : 'serif',
  },
  tipsTitle: { fontSize: 12, fontWeight: '800', color: S.muted, textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 },
  tipCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: S.card, borderRadius: 12, padding: 13,
    borderWidth: 1, borderColor: S.cardBorder,
  },
  tipIcon: { width: 32, height: 32, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  tipText: { flex: 1, fontSize: 13, color: S.sub, lineHeight: 18 },
  notesCompleteBtn: { borderRadius: 16, overflow: 'hidden', shadowColor: S.tealDk, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.28, shadowRadius: 12, elevation: 8 },
  notesCompleteBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, paddingVertical: 16 },
  notesCompleteBtnText: { fontSize: 15, fontWeight: '800', color: '#fff', letterSpacing: 0.2 },

  // Modals overlay
  overlay: { flex: 1, backgroundColor: 'rgba(2,6,23,0.42)', justifyContent: 'flex-end', padding: 16 },

  // Duration modal
  modalCard: {
    backgroundColor: S.card, borderRadius: 22, padding: 20,
    borderWidth: 1, borderColor: S.cardBorder,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 10,
  },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: S.track, alignSelf: 'center', marginBottom: 18 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  modalIconBox: { width: 44, height: 44, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  modalTitle: { fontSize: 17, fontWeight: '800', color: S.ink },
  modalSub: { fontSize: 12, color: S.muted, marginTop: 2 },
  durationGrid: { gap: 10, marginBottom: 20 },
  durationRow: { flexDirection: 'row', gap: 10 },
  durationCell: {
    flex: 1,
    paddingVertical: 20, borderRadius: 16,
    alignItems: 'center', backgroundColor: S.bg1,
    borderWidth: 1.5, borderColor: S.cardBorder,
  },
  durationCellActive: { backgroundColor: S.teal, borderColor: S.teal },
  durationNum: { fontSize: 22, fontWeight: '900', color: S.ink },
  durationUnit: { fontSize: 11, fontWeight: '600', color: S.muted, marginTop: 2 },
  modalCloseBtn: {
    height: 46, borderRadius: 13, backgroundColor: S.bg1,
    borderWidth: 1, borderColor: S.cardBorder, alignItems: 'center', justifyContent: 'center',
  },
  modalCloseBtnText: { fontSize: 14, fontWeight: '700', color: S.sub },

  // Completion modal
  completionCard: {
    backgroundColor: S.card, borderRadius: 24,
    borderWidth: 1, borderColor: S.cardBorder, overflow: 'hidden', width: '100%',
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 12,
  },
  completionAccentBar: { height: 4, width: '100%' },
  completionBody: { padding: 24 },
  completionTitleBlock: { marginBottom: 20 },
  completionEyebrow: { fontSize: 10, fontWeight: '800', color: S.teal, letterSpacing: 1.4, marginBottom: 8 },
  completionTitle: { fontSize: 24, fontWeight: '900', color: S.ink, marginBottom: 4, letterSpacing: -0.5 },
  completionSub: { fontSize: 13, color: S.sub, fontWeight: '500' },
  completionDivider: { height: StyleSheet.hairlineWidth, backgroundColor: S.cardBorder, marginBottom: 20 },
  completionStats: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  completionStatItem: { flex: 1, alignItems: 'center' },
  completionStatDivider: { width: StyleSheet.hairlineWidth, height: 36, backgroundColor: S.cardBorder },
  completionStatVal: { fontSize: 22, fontWeight: '900', color: S.ink, letterSpacing: -0.5, marginBottom: 3 },
  completionStatLbl: { fontSize: 11, fontWeight: '600', color: S.muted, textTransform: 'uppercase', letterSpacing: 0.4 },
  completionMsg: { fontSize: 13, color: S.sub, lineHeight: 19, marginBottom: 22, paddingHorizontal: 2 },
  completionActions: { flexDirection: 'row', gap: 10 },
  completionSecBtn: {
    flex: 0.8, height: 48, borderRadius: 13, backgroundColor: S.bg1,
    borderWidth: 1, borderColor: S.cardBorder, justifyContent: 'center', alignItems: 'center',
  },
  completionSecBtnText: { fontSize: 14, fontWeight: '700', color: S.sub },
  completionPrimBtn: { flex: 1.5, borderRadius: 13, overflow: 'hidden' },
  completionPrimBtnGrad: { height: 48, justifyContent: 'center', alignItems: 'center' },
  completionPrimBtnText: { fontSize: 14, fontWeight: '800', color: '#fff' },

  // Exit modal
  exitCard: {
    backgroundColor: S.card, borderRadius: 22, padding: 24, alignItems: 'center',
    borderWidth: 1, borderColor: S.cardBorder,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 10,
  },
  exitIconBox: { width: 60, height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  exitTitle: { fontSize: 18, fontWeight: '800', color: S.ink, marginBottom: 8 },
  exitMsg: { fontSize: 13, color: S.sub, textAlign: 'center', lineHeight: 19, marginBottom: 22 },
  exitActions: { flexDirection: 'row', gap: 12, width: '100%' },
  exitCancelBtn: {
    flex: 1, height: 48, borderRadius: 13, backgroundColor: S.bg1,
    borderWidth: 1, borderColor: S.cardBorder, justifyContent: 'center', alignItems: 'center',
  },
  exitCancelText: { fontSize: 14, fontWeight: '700', color: S.sub },
  exitConfirmBtn: { flex: 1.3, borderRadius: 13, overflow: 'hidden' },
  exitConfirmGrad: { height: 48, justifyContent: 'center', alignItems: 'center' },
  exitConfirmText: { fontSize: 14, fontWeight: '800', color: '#fff' },
});
