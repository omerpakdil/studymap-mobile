import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getLocaleTagForLanguage, resolveAppLanguage, t } from '@/app/i18n';
import { getLocalizedTaskTitle } from '@/app/i18n/taskContent';
import { getLocalizedSubjectName } from '@/app/i18n/subjectNames';
import { formatMinutesCompact, getMinuteUnitShort } from '@/app/i18n/unitFormat';
import { getProgramMetadata, loadDailyTasks } from '@/app/utils/studyProgramStorage';
import { StudyTask } from '@/app/utils/studyTypes';

const { width } = Dimensions.get('window');
const isIOS = Platform.OS === 'ios';
const isTablet = width >= 768;

type CalendarView = 'month' | 'week' | 'day';
type CalendarData = { [key: string]: StudyTask[] };

// ─── Design Tokens (match Dashboard) ─────────────────────────────────────────
const C = {
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
  tealLt: 'rgba(45,212,191,0.12)',
};

const getSubjectColor = (subject: string) => {
  const bucket = subject.length % 3;
  const variants = [
    { bg: 'rgba(15,157,140,0.08)', border: '#0F9D8C', text: '#0B7A6E', dot: '#0F9D8C' },
    { bg: 'rgba(15,157,140,0.12)', border: 'rgba(15,157,140,0.75)', text: '#0B7A6E', dot: 'rgba(15,157,140,0.82)' },
    { bg: 'rgba(15,157,140,0.06)', border: 'rgba(15,157,140,0.62)', text: '#0B7A6E', dot: 'rgba(15,157,140,0.74)' },
  ] as const;
  return variants[bucket];
};

const DAY_SHORT_EN = ['S','M','T','W','T','F','S'];

const getTimeBucket = (timeSlot: string): string => {
  const map: Record<string, string> = {
    early_morning: 'early_morning', morning: 'morning',
    afternoon: 'afternoon', evening: 'evening', night: 'night',
  };
  if (map[timeSlot?.toLowerCase()]) return map[timeSlot.toLowerCase()];
  const h = parseInt(timeSlot?.match(/^(\d{1,2})/)?.[1] || '9');
  if (h < 9) return 'early_morning';
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  if (h < 21) return 'evening';
  return 'night';
};

const getTimeIcon = (bucket: string): string => {
  const map: Record<string,string> = {
    early_morning: 'partly-sunny-outline',
    morning: 'sunny-outline',
    afternoon: 'sunny',
    evening: 'moon-outline',
    night: 'moon',
  };
  return map[bucket] || 'time-outline';
};

const getTypeVisual = (type: string) => {
  const t = type.toLowerCase();
  if (t === 'study') {
    return { badge: 'solid', accentWidth: 4, play: 'solid' } as const;
  }
  if (t === 'review') {
    return { badge: 'outline', accentWidth: 3, play: 'outline' } as const;
  }
  if (t === 'quiz') {
    return { badge: 'dashed', accentWidth: 2, play: 'outline' } as const;
  }
  return { badge: 'soft', accentWidth: 3, play: 'solid' } as const; // practice/default
};

// ─── Animated Task Card ───────────────────────────────────────────────────────
function AnimatedTaskCard({ task, isCompleted, onPress, index, subjectLabel, appLang }: {
  task: StudyTask; isCompleted: boolean; onPress: () => void; index: number; subjectLabel: string;
  appLang: ReturnType<typeof resolveAppLanguage>;
}) {
  const translateX = useRef(new Animated.Value(30)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const sc = getSubjectColor(task.subject);
  const timeBucket = getTimeBucket(task.timeSlot || '');
  const timeLabel = t(`tabs.calendar.time.${timeBucket}`, { lang: appLang, fallback: timeBucket });
  const tv = getTypeVisual(task.type);
  const typeLabel = t(`tabs.calendar.task_type.${task.type.toLowerCase()}`, {
    lang: appLang,
    fallback: task.type,
  });
  const taskTitle = getLocalizedTaskTitle(task, appLang);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true, tension: 90, friction: 10, delay: index * 60 }),
      Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true, delay: index * 60 }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ translateX }], opacity }}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.78}
        style={[styles.taskCard, isCompleted && styles.taskCardDone]}
      >
        {/* Color accent bar */}
        <View
          style={[
            styles.taskAccentBar,
            {
              width: tv.accentWidth,
              backgroundColor: tv.badge === 'dashed' ? 'rgba(15,157,140,0.45)' : C.teal,
            },
          ]}
        />

        <View style={styles.taskInner}>
          <View style={styles.taskTop}>
            {/* Subject + type badge */}
            <View style={styles.taskTitleRow}>
              <View style={[styles.taskSubjectDot, { backgroundColor: sc.dot }]} />
              <Text style={[styles.taskSubject, isCompleted && styles.strikeText]}>{subjectLabel}</Text>
              <View
                style={[
                  styles.typeBadge,
                  tv.badge === 'solid' && styles.typeBadgeSolid,
                  tv.badge === 'outline' && styles.typeBadgeOutline,
                  tv.badge === 'dashed' && styles.typeBadgeDashed,
                  tv.badge === 'soft' && styles.typeBadgeSoft,
                ]}
              >
                <View style={[styles.typeBadgeKeyPill, tv.badge === 'solid' ? styles.typeBadgeKeyPillSolid : styles.typeBadgeKeyPillSoft]}>
                  <Text style={[styles.typeBadgeKeyText, tv.badge === 'solid' ? styles.typeBadgeKeyTextSolid : styles.typeBadgeKeyTextTeal]}>
                    {typeLabel.slice(0, 1).toUpperCase()}
                  </Text>
                </View>
                <Text style={[styles.typeBadgeText, tv.badge === 'solid' ? styles.typeBadgeTextSolid : styles.typeBadgeTextTeal]}>
                  {typeLabel}
                </Text>
              </View>
            </View>

            {/* Completed / Play */}
            <View style={styles.taskActionWrap}>
              {isCompleted ? (
                <View style={styles.doneChip}>
                  <Ionicons name="checkmark-circle" size={14} color={C.teal} />
                  <Text style={styles.doneChipText}>{t('tabs.calendar.done', { lang: appLang, fallback: 'Done' })}</Text>
                </View>
              ) : (
                <View style={[styles.playChip, tv.play === 'outline' ? styles.playChipOutline : styles.playChipSolid]}>
                  <Ionicons name="play" size={11} color={tv.play === 'outline' ? C.teal : '#fff'} />
                </View>
              )}
            </View>
          </View>

          {/* Title */}
          <Text style={[styles.taskTitle, isCompleted && styles.strikeText]} numberOfLines={1}>
            {taskTitle}
          </Text>

          {/* Meta row */}
          <View style={styles.taskMeta}>
            <View style={styles.taskMetaItem}>
              <Ionicons name={getTimeIcon(timeBucket) as any} size={12} color={C.muted} />
              <Text style={styles.taskMetaText}>{timeLabel}</Text>
            </View>
            <View style={styles.taskMetaDivider} />
            <View style={styles.taskMetaItem}>
              <Ionicons name="timer-outline" size={12} color={C.muted} />
              <Text style={styles.taskMetaText}>{formatMinutesCompact(task.duration, appLang)}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Month Day Cell ───────────────────────────────────────────────────────────
function DayCell({ day, isToday, isSelected, tasks, completions, onPress }: {
  day: Date; isToday: boolean; isSelected: boolean;
  tasks: StudyTask[]; completions: Record<string,boolean>; onPress: () => void;
}) {
  const completed = tasks.filter(t => completions[t.id] || t.completed).length;
  const progress = tasks.length > 0 ? (completed / tasks.length) * 100 : 0;
  const allDone = tasks.length > 0 && progress === 100;
  const uniqueSubjects = [...new Set(tasks.map(t => t.subject))].slice(0, 3);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={styles.dayCellWrapper}>
      <View style={[
        styles.dayCell,
        isSelected && styles.dayCellSelected,
        isToday && !isSelected && styles.dayCellToday,
        tasks.length > 0 && !isSelected && { borderWidth: 1, borderColor: C.cardBorder },
      ]}>
        <Text style={[
          styles.dayCellNum,
          isToday && styles.dayCellNumToday,
          isSelected && styles.dayCellNumSelected,
        ]}>
          {day.getDate()}
        </Text>

        {tasks.length > 0 && (
          <View style={styles.dayCellIndicators}>
            {/* Mini progress bar */}
            <View style={styles.dayMiniTrack}>
              <View style={[
                styles.dayMiniFill,
                {
                  width: `${progress}%` as any,
                  backgroundColor: C.teal,
                }
              ]} />
            </View>
            {/* Subject dots */}
            <View style={styles.daySubjectDots}>
              {uniqueSubjects.map((s, i) => (
                <View key={i} style={[styles.daySubjectDot, { backgroundColor: getSubjectColor(s).dot }]} />
              ))}
            </View>
          </View>
        )}

        {allDone && (
          <Ionicons name="checkmark-circle" size={10} color={C.teal} style={{ marginTop: 1 }} />
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyDay({ title, message }: { title: string; message: string }) {
  return (
    <View style={styles.emptyWrap}>
      <LinearGradient colors={[C.tealLt, 'rgba(45,212,191,0.04)']} style={styles.emptyBox}>
        <View style={styles.emptyIconRing}>
          <Ionicons name="calendar-outline" size={28} color={C.teal} />
        </View>
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.emptyText}>{message}</Text>
      </LinearGradient>
    </View>
  );
}

// ─── Main Calendar Screen ─────────────────────────────────────────────────────
export default function CalendarScreen() {
  const router = useRouter();
  const appLang = resolveAppLanguage();
  const appLocale = getLocaleTagForLanguage(appLang);
  const dayShort = [
    t('tabs.calendar.day_short.sun', { lang: appLang, fallback: DAY_SHORT_EN[0] }),
    t('tabs.calendar.day_short.mon', { lang: appLang, fallback: DAY_SHORT_EN[1] }),
    t('tabs.calendar.day_short.tue', { lang: appLang, fallback: DAY_SHORT_EN[2] }),
    t('tabs.calendar.day_short.wed', { lang: appLang, fallback: DAY_SHORT_EN[3] }),
    t('tabs.calendar.day_short.thu', { lang: appLang, fallback: DAY_SHORT_EN[4] }),
    t('tabs.calendar.day_short.fri', { lang: appLang, fallback: DAY_SHORT_EN[5] }),
    t('tabs.calendar.day_short.sat', { lang: appLang, fallback: DAY_SHORT_EN[6] }),
  ];
  const [programMetadata, setProgramMetadata] = useState<any>(null);
  const subjectLabel = (subject: string) =>
    getLocalizedSubjectName(subject, appLang, subject, { examCode: programMetadata?.examType });
  const [currentView, setCurrentView] = useState<CalendarView>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<CalendarData>({});
  const [loading, setLoading] = useState(true);
  const [taskCompletions, setTaskCompletions] = useState<Record<string, boolean>>({});

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-8)).current;
  const viewAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(headerSlide, { toValue: 0, useNativeDriver: true, tension: 80 }),
    ]).start();
  }, []);

  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      const [allTasks, metadata] = await Promise.all([loadDailyTasks(), getProgramMetadata()]);
      const tasksByDate: CalendarData = {};
      allTasks.forEach((task: StudyTask) => {
        if (!tasksByDate[task.date]) tasksByDate[task.date] = [];
        tasksByDate[task.date].push(task);
      });
      setProgramMetadata(metadata);
      setCalendarData(tasksByDate);
    } catch (e) {
      console.error(t('tabs.calendar.load_error_log', { lang: appLang, fallback: 'Calendar load error:' }), e);
    } finally {
      setLoading(false);
    }
  };

  const loadTaskCompletions = async () => {
    try {
      const completions: Record<string, boolean> = {};
      const allTasks = Object.values(calendarData).flat();
      for (const task of allTasks) {
        const val = await AsyncStorage.getItem(`session_completed_${task.id}`);
        completions[task.id] = val === 'true' || task.completed;
      }
      setTaskCompletions(completions);
    } catch {}
  };

  useEffect(() => { loadCalendarData(); }, []);
  useEffect(() => { if (Object.keys(calendarData).length > 0) loadTaskCompletions(); }, [calendarData]);
  useFocusEffect(useCallback(() => { loadCalendarData(); }, []));

  const getDateTasks = (date: Date) => calendarData[formatDate(date)] || [];

  const getMonthStats = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    let totalTasks = 0, completedTasks = 0, studyDays = 0;
    Object.entries(calendarData).forEach(([dateStr, tasks]) => {
      const d = new Date(dateStr);
      if (d.getFullYear() === year && d.getMonth() === month) {
        if (tasks.length > 0) studyDays++;
        totalTasks += tasks.length;
        completedTasks += tasks.filter(t => taskCompletions[t.id] || t.completed).length;
      }
    });
    return { totalTasks, completedTasks, studyDays };
  };

  const navigateDate = (dir: 'prev' | 'next') => {
    const d = new Date(selectedDate);
    const delta = dir === 'next' ? 1 : -1;
    if (currentView === 'month') d.setMonth(d.getMonth() + delta);
    else if (currentView === 'week') d.setDate(d.getDate() + delta * 7);
    else d.setDate(d.getDate() + delta);
    setSelectedDate(d);
  };

  const switchView = (next: CalendarView) => {
    if (next === currentView) return;
    Animated.timing(viewAnim, { toValue: 0, duration: 100, useNativeDriver: true }).start(() => {
      setCurrentView(next);
      viewAnim.setValue(0);
      Animated.spring(viewAnim, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 250 }).start();
    });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1);
    firstDay.setHours(12);
    const startDow = firstDay.getDay();
    const days: (Date | null)[] = [];
    for (let i = 0; i < startDow; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const day = new Date(year, month, d);
      day.setHours(12);
      days.push(day);
    }
    while (days.length % 7 !== 0) days.push(null);
    return days;
  };

  const getWeekDays = (date: Date) => {
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  };

  // ── Hero Header ──────────────────────────────────────────────────────────────
  const renderHeroHeader = () => {
    const { totalTasks, completedTasks, studyDays } = getMonthStats();
    const pct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    let title = '';
    if (currentView === 'month') {
      title = new Intl.DateTimeFormat(appLocale, { month: 'long', year: 'numeric' }).format(selectedDate);
    } else if (currentView === 'week') {
      const wk = getWeekDays(selectedDate);
      const startLabel = new Intl.DateTimeFormat(appLocale, { day: 'numeric', month: 'short' }).format(wk[0]);
      const endLabel = new Intl.DateTimeFormat(appLocale, { day: 'numeric', month: 'short' }).format(wk[6]);
      title = `${startLabel} – ${endLabel}`;
    } else {
      title = new Intl.DateTimeFormat(appLocale, { day: 'numeric', month: 'long' }).format(selectedDate);
    }

    return (
      <Animated.View style={{ opacity: headerOpacity, transform: [{ translateY: headerSlide }] }}>
        <View style={styles.heroCard}>
          <LinearGradient
            colors={['#0F766E', '#0F9D8C', '#2DD4BF']}
            style={styles.heroGradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            <View style={styles.heroBlob1} />
            <View style={styles.heroBlob2} />

            {/* Navigation row */}
            <View style={styles.heroNavRow}>
              <TouchableOpacity onPress={() => navigateDate('prev')} style={styles.heroNavBtn}>
                <Ionicons name="chevron-back" size={18} color="rgba(255,255,255,0.9)" />
              </TouchableOpacity>
              <View style={styles.heroTitleBlock}>
                <Text style={styles.heroKicker}>{t('tabs.calendar.kicker', { lang: appLang, fallback: 'Study Calendar' })}</Text>
                <Text style={styles.heroTitle}>{title}</Text>
              </View>
              <TouchableOpacity onPress={() => navigateDate('next')} style={styles.heroNavBtn}>
                <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.9)" />
              </TouchableOpacity>
            </View>

            {/* Stats row (only month view) */}
            {currentView === 'month' && (
              <View style={styles.heroStatsRow}>
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatVal}>{studyDays}</Text>
                  <Text style={styles.heroStatLbl}>{t('tabs.calendar.study_days', { lang: appLang, fallback: 'Study Days' })}</Text>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatVal}>{completedTasks}/{totalTasks}</Text>
                  <Text style={styles.heroStatLbl}>{t('tabs.calendar.tasks_done', { lang: appLang, fallback: 'Tasks Done' })}</Text>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatVal}>{pct}%</Text>
                  <Text style={styles.heroStatLbl}>{t('tabs.calendar.completion', { lang: appLang, fallback: 'Completion' })}</Text>
                </View>

                {/* Progress bar */}
                <View style={styles.heroProgressWrap}>
                  <View style={styles.heroProgressTrack}>
                    <Animated.View style={[styles.heroProgressFill, { width: `${pct}%` as any }]} />
                  </View>
                </View>
              </View>
            )}

            {/* Day stats */}
            {currentView === 'day' && (() => {
              const dayTasks = getDateTasks(selectedDate);
              const done = dayTasks.filter(t => taskCompletions[t.id] || t.completed).length;
              const mins = dayTasks.reduce((s, t) => s + t.duration, 0);
              return (
                <View style={styles.heroStatsRow}>
                  <View style={styles.heroStat}>
                    <Text style={styles.heroStatVal}>{dayTasks.length}</Text>
                    <Text style={styles.heroStatLbl}>{t('tabs.calendar.sessions', { lang: appLang, fallback: 'Sessions' })}</Text>
                  </View>
                  <View style={styles.heroStatDivider} />
                  <View style={styles.heroStat}>
                    <Text style={styles.heroStatVal}>{done}</Text>
                    <Text style={styles.heroStatLbl}>{t('tabs.calendar.completed', { lang: appLang, fallback: 'Completed' })}</Text>
                  </View>
                  <View style={styles.heroStatDivider} />
                  <View style={styles.heroStat}>
                    <Text style={styles.heroStatVal}>{mins}{getMinuteUnitShort(appLang)}</Text>
                    <Text style={styles.heroStatLbl}>{t('tabs.calendar.total', { lang: appLang, fallback: 'Total' })}</Text>
                  </View>
                </View>
              );
            })()}
          </LinearGradient>
        </View>

        {/* View toggle pills */}
        <View style={styles.viewToggleWrap}>
          {(['month', 'week', 'day'] as CalendarView[]).map((v) => (
            <TouchableOpacity
              key={v}
              onPress={() => switchView(v)}
              style={[styles.viewToggleBtn, currentView === v && styles.viewToggleBtnActive]}
              activeOpacity={0.78}
            >
              <Ionicons
                name={v === 'month' ? 'calendar' : v === 'week' ? 'list' : 'today'}
                size={13}
                color={currentView === v ? C.teal : C.muted}
              />
              <Text style={[styles.viewToggleText, currentView === v && styles.viewToggleTextActive]}>
                {t(`tabs.calendar.view.${v}`, { lang: appLang, fallback: v.charAt(0).toUpperCase() + v.slice(1) })}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    );
  };

  // ── Month View ───────────────────────────────────────────────────────────────
  const renderMonthView = () => {
    const days = getDaysInMonth(selectedDate);
    const weeks: (Date | null)[][] = [];
    for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

    return (
      <View style={styles.monthWrap}>
        {/* Day name headers */}
        <View style={styles.monthDayHeaders}>
          {dayShort.map((d, i) => (
            <Text key={i} style={styles.monthDayHeaderText}>{d}</Text>
          ))}
        </View>

        {/* Grid */}
        {weeks.map((week, wi) => (
          <View key={wi} style={styles.monthWeekRow}>
            {week.map((day, di) => {
              if (!day) return <View key={di} style={styles.monthEmptyCell} />;
              const isToday = formatDate(day) === formatDate(new Date());
              const isSelected = formatDate(day) === formatDate(selectedDate);
              const tasks = getDateTasks(day);
              return (
                <DayCell
                  key={di}
                  day={day}
                  isToday={isToday}
                  isSelected={isSelected}
                  tasks={tasks}
                  completions={taskCompletions}
                    onPress={() => {
                      setSelectedDate(day);
                      if (tasks.length > 0) switchView('day');
                    }}
                />
              );
            })}
          </View>
        ))}

        {/* Selected day peek */}
        {(() => {
          const tasks = getDateTasks(selectedDate);
          if (tasks.length === 0) return null;
          return (
            <View style={styles.monthPeekCard}>
              <View style={styles.monthPeekHeader}>
                <View style={styles.monthPeekLeft}>
                  <View style={styles.monthPeekDot} />
                  <Text style={styles.monthPeekDate}>
                    {new Intl.DateTimeFormat(appLocale, { weekday: 'short', day: 'numeric', month: 'long' }).format(selectedDate)}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => switchView('day')} style={styles.monthPeekLink}>
                  <Text style={styles.monthPeekLinkText}>{t('tabs.calendar.see_all', { lang: appLang, fallback: 'See all' })}</Text>
                  <Ionicons name="chevron-forward" size={12} color={C.teal} />
                </TouchableOpacity>
              </View>
              {tasks.slice(0, 2).map((task, i) => {
                const sc = getSubjectColor(task.subject);
                const done = taskCompletions[task.id] || task.completed;
                return (
                  <TouchableOpacity
                    key={i}
                    onPress={() => router.push({ pathname: '/study-session' as any, params: { taskId: task.id, subject: task.subject, type: task.type, duration: task.duration.toString(), title: task.title, examCode: programMetadata?.examType } })}
                    style={[styles.peekTask, { backgroundColor: sc.bg, borderLeftColor: C.teal }]}
                    activeOpacity={0.78}
                  >
                    <Text style={[styles.peekTaskSubject, { color: C.tealDk }, done && styles.strikeText]}>{subjectLabel(task.subject)}</Text>
                    <Text style={[styles.peekTaskDuration, { color: C.tealDk }]}>{formatMinutesCompact(task.duration, appLang)}</Text>
                    {done && <Ionicons name="checkmark-circle" size={14} color={C.teal} />}
                  </TouchableOpacity>
                );
              })}
              {tasks.length > 2 && (
                <Text style={styles.monthPeekMore}>
                  {t('tabs.calendar.more_sessions', {
                    lang: appLang,
                    params: { count: tasks.length - 2 },
                    fallback: `+${tasks.length - 2} more sessions`,
                  })}
                </Text>
              )}
            </View>
          );
        })()}
      </View>
    );
  };

  // ── Week View ────────────────────────────────────────────────────────────────
  const renderWeekView = () => {
    const weekDays = getWeekDays(selectedDate);
    const todayStr = formatDate(new Date());

    return (
      <View style={styles.weekWrap}>
        {/* Day selector strip */}
        <View style={styles.weekStrip}>
          {weekDays.map((day, i) => {
            const isToday = formatDate(day) === todayStr;
            const isSel = formatDate(day) === formatDate(selectedDate);
            const tasks = getDateTasks(day);
            const hasTasks = tasks.length > 0;

            return (
              <TouchableOpacity
                key={i}
                onPress={() => setSelectedDate(day)}
                activeOpacity={0.78}
                style={styles.weekStripDay}
              >
                <Text style={[styles.weekStripDayName, isSel && { color: C.teal }]}>
                  {dayShort[day.getDay()]}
                </Text>
                <View style={[
                  styles.weekStripDayNum,
                  isSel && styles.weekStripDayNumActive,
                  isToday && !isSel && styles.weekStripDayNumToday,
                ]}>
                  <Text style={[
                    styles.weekStripDayNumText,
                    isSel && { color: '#fff' },
                    isToday && !isSel && { color: C.teal },
                  ]}>
                    {day.getDate()}
                  </Text>
                </View>
                {hasTasks && (
                  <View style={[styles.weekStripDot, { backgroundColor: C.teal }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Tasks for selected day */}
        <ScrollView
          style={styles.weekTaskScroll}
          contentContainerStyle={{ paddingBottom: isIOS ? 110 : 92, paddingTop: 12 }}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          <View style={styles.weekDayLabel}>
            <Ionicons name="calendar-outline" size={14} color={C.teal} />
            <Text style={styles.weekDayLabelText}>
              {new Intl.DateTimeFormat(appLocale, { weekday: 'short', day: 'numeric', month: 'long' }).format(selectedDate)}
            </Text>
          </View>

          {(() => {
            const tasks = getDateTasks(selectedDate);
            if (tasks.length === 0) {
              return (
                <EmptyDay
                  title={t('tabs.calendar.rest_day', { lang: appLang, fallback: 'Rest Day' })}
                  message={t('tabs.calendar.empty_week', { lang: appLang, fallback: 'No sessions for this day. Take it easy or catch up on review.' })}
                />
              );
            }
            return tasks.map((task, i) => (
              <AnimatedTaskCard
                key={task.id}
                task={task}
                subjectLabel={subjectLabel(task.subject)}
                isCompleted={taskCompletions[task.id] || task.completed}
                onPress={() => router.push({ pathname: '/study-session' as any, params: { taskId: task.id, subject: task.subject, type: task.type, duration: task.duration.toString(), title: task.title, examCode: programMetadata?.examType } })}
                appLang={appLang}
                index={i}
              />
            ));
          })()}
        </ScrollView>
      </View>
    );
  };

  // ── Day View ─────────────────────────────────────────────────────────────────
  const renderDayView = () => {
    const tasks = getDateTasks(selectedDate);
    const completedCount = tasks.filter(t => taskCompletions[t.id] || t.completed).length;
    const totalMins = tasks.reduce((s, t) => s + t.duration, 0);
    const pct = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

    return (
      <ScrollView
        style={styles.dayScroll}
        contentContainerStyle={{ paddingBottom: isIOS ? 110 : 92, paddingTop: 4 }}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {tasks.length > 0 && (
          <View style={styles.dayProgressCard}>
            <View style={styles.dayProgressRow}>
              <View>
                <Text style={styles.dayProgressLabel}>{t('tabs.calendar.todays_goal', { lang: appLang, fallback: "Today's Goal" })}</Text>
                <Text style={styles.dayProgressSub}>
                  {t('tabs.calendar.day_progress', {
                    lang: appLang,
                    params: { completed: completedCount, total: tasks.length, minutes: totalMins },
                    fallback: `${completedCount} of ${tasks.length} complete · ${formatMinutesCompact(totalMins, appLang)} total`,
                  })}
                </Text>
              </View>
              <View style={[styles.dayProgressBadge, { backgroundColor: pct === 100 ? 'rgba(45,212,191,0.16)' : C.tealLt }]}>
                {pct === 100 ? (
                  <>
                    <Ionicons name="checkmark-done-circle" size={13} color={C.teal} />
                    <Text style={[styles.dayProgressBadgeText, { color: C.tealDk }]}>{t('tabs.calendar.done_bang', { lang: appLang, fallback: 'Done!' })}</Text>
                  </>
                ) : (
                  <Text style={[styles.dayProgressBadgeText, { color: C.teal }]}>{pct}%</Text>
                )}
              </View>
            </View>
            <View style={styles.dayProgressTrack}>
              <View style={[styles.dayProgressFill, {
                width: `${pct}%` as any,
                backgroundColor: C.teal,
              }]} />
            </View>
          </View>
        )}

        {tasks.length === 0 ? (
          <EmptyDay
            title={t('tabs.calendar.rest_day', { lang: appLang, fallback: 'Rest Day' })}
            message={t('tabs.calendar.empty_day', { lang: appLang, fallback: "No study sessions planned. Great time to rest or browse tomorrow's plan." })}
          />
        ) : (
          <View style={{ gap: 10 }}>
            {tasks.map((task, i) => (
              <AnimatedTaskCard
                key={task.id}
                task={task}
                subjectLabel={subjectLabel(task.subject)}
                isCompleted={taskCompletions[task.id] || task.completed}
                onPress={() => router.push({ pathname: '/study-session' as any, params: { taskId: task.id, subject: task.subject, type: task.type, duration: task.duration.toString(), title: task.title, examCode: programMetadata?.examType } })}
                appLang={appLang}
                index={i}
              />
            ))}
          </View>
        )}
      </ScrollView>
    );
  };

  // ─── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.loadWrap}>
        <LinearGradient colors={[C.bg0, C.bg1, C.bg2]} style={StyleSheet.absoluteFill} />
        <LinearGradient colors={[C.tealDk, C.teal]} style={styles.loadBall} start={{ x:0,y:0 }} end={{ x:1,y:1 }}>
          <Ionicons name="calendar" size={28} color="#fff" />
        </LinearGradient>
        <Text style={styles.loadTitle}>{t('tabs.calendar.loading_title', { lang: appLang, fallback: 'Building your calendar...' })}</Text>
        <Text style={styles.loadSub}>{t('tabs.calendar.loading_subtitle', { lang: appLang, fallback: 'Organizing your schedule' })}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top','left','right']}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <LinearGradient colors={[C.bg0, C.bg1, C.bg2]} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
      <View style={styles.bgOrbA} />
      <View style={styles.bgOrbB} />

      <ScrollView
        style={styles.rootScroll}
        contentContainerStyle={styles.rootScrollContent}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {renderHeroHeader()}

        <Animated.View style={{
          opacity: viewAnim,
          transform: [{ translateY: viewAnim.interpolate({ inputRange: [0,1], outputRange: [10,0] }) }],
        }}>
          {currentView === 'month' && renderMonthView()}
          {currentView === 'week' && renderWeekView()}
          {currentView === 'day' && renderDayView()}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const CELL_SIZE = (width - 40 - 32) / 7; // padding 20 each side + 2 per cell

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg0 },
  bgOrbA: { position: 'absolute', width: 260, height: 260, borderRadius: 130, top: -80, right: -100, backgroundColor: 'rgba(45,212,191,0.14)' },
  bgOrbB: { position: 'absolute', width: 220, height: 220, borderRadius: 110, bottom: 120, left: -110, backgroundColor: 'rgba(52,211,153,0.10)' },

  loadWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadBall: { width: 78, height: 78, borderRadius: 39, justifyContent: 'center', alignItems: 'center', marginBottom: 20, shadowColor: C.teal, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8 },
  loadTitle: { fontSize: 20, fontWeight: '700', color: C.ink, marginBottom: 5 },
  loadSub: { fontSize: 14, color: C.sub },

  rootScroll: { flex: 1 },
  rootScrollContent: { paddingHorizontal: 20, paddingTop: isIOS ? 6 : 14, paddingBottom: isIOS ? 120 : 100 },

  // ── Hero ──
  heroCard: {
    borderRadius: 22, overflow: 'hidden', marginBottom: 14,
    shadowColor: '#0F9D8C', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.28, shadowRadius: 18, elevation: 12,
  },
  heroGradient: { padding: 20, paddingTop: 18 },
  heroBlob1: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.07)', top: -40, right: -30 },
  heroBlob2: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.05)', bottom: -20, left: 60 },
  heroNavRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  heroNavBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center', alignItems: 'center',
  },
  heroTitleBlock: { flex: 1, alignItems: 'center' },
  heroKicker: {
    fontSize: isTablet ? 13 : 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: isTablet ? 1.4 : 1.1,
    textTransform: 'uppercase',
    marginBottom: isTablet ? 5 : 3
  },
  heroTitle: { fontSize: isTablet ? 28 : 20, fontWeight: '800', color: '#fff' },
  heroStatsRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatVal: { fontSize: 18, fontWeight: '800', color: '#fff' },
  heroStatLbl: { fontSize: 10, fontWeight: '500', color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  heroStatDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.25)' },
  heroProgressWrap: { width: '100%', marginTop: 12 },
  heroProgressTrack: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.25)', overflow: 'hidden' },
  heroProgressFill: { height: 4, borderRadius: 2, backgroundColor: '#fff' },

  // ── View Toggle ──
  viewToggleWrap: {
    flexDirection: 'row',
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  viewToggleBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 8, borderRadius: 9,
  },
  viewToggleBtnActive: {
    backgroundColor: C.tealLt,
    shadowColor: C.teal, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.12, shadowRadius: 3, elevation: 1,
  },
  viewToggleText: { fontSize: isTablet ? 16 : 12, fontWeight: '600', color: C.muted },
  viewToggleTextActive: { color: C.teal },

  // ── Month View ──
  monthWrap: { gap: 4 },
  monthDayHeaders: { flexDirection: 'row', marginBottom: 6 },
  monthDayHeaderText: {
    flex: 1, textAlign: 'center', fontSize: isTablet ? 15 : 11, fontWeight: '700',
    color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  monthWeekRow: { flexDirection: 'row', marginBottom: 2 },
  monthEmptyCell: { flex: 1, height: CELL_SIZE + 4 },

  dayCellWrapper: { flex: 1 },
  dayCell: {
    margin: 1, borderRadius: 10, padding: 4,
    height: CELL_SIZE + 4, alignItems: 'center',
    backgroundColor: 'transparent',
  },
  dayCellToday: { backgroundColor: 'rgba(15,157,140,0.08)' },
  dayCellSelected: { backgroundColor: C.teal },
  dayCellNum: { fontSize: isTablet ? 18 : 13, fontWeight: '600', color: C.ink, marginBottom: 2 },
  dayCellNumToday: { color: C.teal, fontWeight: '800' },
  dayCellNumSelected: { color: '#fff', fontWeight: '800' },
  dayCellIndicators: { alignItems: 'center', width: '100%' },
  dayMiniTrack: { width: 18, height: 3, borderRadius: 1.5, backgroundColor: 'rgba(148,163,184,0.3)', overflow: 'hidden', marginBottom: 2 },
  dayMiniFill: { height: 3, borderRadius: 1.5 },
  daySubjectDots: { flexDirection: 'row', gap: 2, justifyContent: 'center' },
  daySubjectDot: { width: 4, height: 4, borderRadius: 2 },

  // ── Month peek card ──
  monthPeekCard: {
    marginTop: isTablet ? 14 : 12, backgroundColor: C.card, borderRadius: isTablet ? 18 : 16, padding: isTablet ? 15 : 14,
    borderWidth: 1, borderColor: C.cardBorder,
    shadowColor: C.teal, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  monthPeekHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: isTablet ? 11 : 10 },
  monthPeekLeft: { flexDirection: 'row', alignItems: 'center', gap: isTablet ? 8 : 7 },
  monthPeekDot: { width: isTablet ? 10 : 7, height: isTablet ? 10 : 7, borderRadius: isTablet ? 5 : 4, backgroundColor: C.teal },
  monthPeekDate: { fontSize: isTablet ? 17 : 13, fontWeight: '700', color: C.ink },
  monthPeekLink: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  monthPeekLinkText: { fontSize: isTablet ? 15 : 12, fontWeight: '600', color: C.teal },
  peekTask: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: isTablet ? 12 : 10, borderRadius: isTablet ? 12 : 10, borderLeftWidth: 3, marginBottom: isTablet ? 8 : 6,
  },
  peekTaskSubject: { flex: 1, fontSize: isTablet ? 17 : 13, fontWeight: '600' },
  peekTaskDuration: { fontSize: isTablet ? 15 : 12, fontWeight: '500' },
  monthPeekMore: { fontSize: isTablet ? 15 : 12, color: C.muted, textAlign: 'center', paddingTop: isTablet ? 6 : 4 },

  // ── Week View ──
  weekWrap: { flex: 1 },
  weekStrip: {
    flexDirection: 'row',
    backgroundColor: C.card,
    borderRadius: isTablet ? 22 : 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
    padding: isTablet ? 14 : 8,
    marginBottom: isTablet ? 20 : 14,
    shadowColor: C.teal, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 1,
  },
  weekStripDay: { flex: 1, alignItems: 'center', gap: isTablet ? 8 : 4 },
  weekStripDayName: {
    fontSize: isTablet ? 18 : 10,
    fontWeight: '700',
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: isTablet ? 0.7 : 0.4,
  },
  weekStripDayNum: {
    width: isTablet ? 52 : 30,
    height: isTablet ? 52 : 30,
    borderRadius: isTablet ? 26 : 15,
    justifyContent: 'center',
    alignItems: 'center'
  },
  weekStripDayNumActive: { backgroundColor: C.teal },
  weekStripDayNumToday: { backgroundColor: C.tealLt },
  weekStripDayNumText: { fontSize: isTablet ? 26 : 14, fontWeight: '700', color: C.ink },
  weekStripDot: { width: isTablet ? 8 : 5, height: isTablet ? 8 : 5, borderRadius: isTablet ? 4 : 3 },

  weekTaskScroll: { flex: 1 },
  weekDayLabel: { flexDirection: 'row', alignItems: 'center', gap: isTablet ? 10 : 6, marginBottom: isTablet ? 18 : 12 },
  weekDayLabelText: { fontSize: isTablet ? 26 : 14, fontWeight: '700', color: C.ink },

  // ── Day View ──
  dayScroll: { flex: 1 },
  dayProgressCard: {
    backgroundColor: C.card, borderRadius: isTablet ? 20 : 14, borderWidth: 1, borderColor: C.cardBorder,
    padding: isTablet ? 22 : 14, marginBottom: isTablet ? 20 : 14,
    shadowColor: C.teal, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 5, elevation: 2,
  },
  dayProgressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: isTablet ? 14 : 10 },
  dayProgressLabel: { fontSize: isTablet ? 22 : 14, fontWeight: '700', color: C.ink },
  dayProgressSub: { fontSize: isTablet ? 16 : 12, color: C.sub, marginTop: isTablet ? 6 : 2, lineHeight: isTablet ? 22 : undefined },
  dayProgressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: isTablet ? 6 : 4,
    borderRadius: isTablet ? 12 : 8,
    paddingHorizontal: isTablet ? 14 : 10,
    paddingVertical: isTablet ? 8 : 4
  },
  dayProgressBadgeText: { fontSize: isTablet ? 16 : 12, fontWeight: '700' },
  dayProgressTrack: { height: isTablet ? 10 : 7, borderRadius: isTablet ? 6 : 4, backgroundColor: C.track, overflow: 'hidden' },
  dayProgressFill: { height: isTablet ? 10 : 7, borderRadius: isTablet ? 6 : 4 },

  // ── Task Card ──
  taskCard: {
    flexDirection: 'row', alignItems: 'stretch',
    backgroundColor: C.card, borderRadius: isTablet ? 18 : 14, borderWidth: 1, borderColor: C.cardBorder,
    overflow: 'hidden',
    shadowColor: C.teal, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 2,
    marginBottom: isTablet ? 8 : 2,
  },
  taskCardDone: { opacity: 0.6 },
  taskAccentBar: { width: 4, alignSelf: 'stretch' },
  taskInner: { flex: 1, padding: isTablet ? 18 : 12, paddingLeft: isTablet ? 18 : 12 },
  taskTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: isTablet ? 8 : 5 },
  taskTitleRow: { flexDirection: 'row', alignItems: 'center', gap: isTablet ? 10 : 7, flex: 1, minWidth: 0, paddingRight: 8 },
  taskActionWrap: { marginLeft: 8, paddingLeft: 2 },
  taskSubjectDot: { width: isTablet ? 10 : 7, height: isTablet ? 10 : 7, borderRadius: isTablet ? 5 : 4 },
  taskSubject: { fontSize: isTablet ? 20 : 14, fontWeight: '700', color: C.ink, flex: 1 },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: isTablet ? 5 : 3,
    paddingHorizontal: isTablet ? 10 : 7,
    paddingVertical: isTablet ? 5 : 3,
    borderRadius: isTablet ? 9 : 6,
    borderWidth: 1
  },
  typeBadgeSolid: { backgroundColor: C.teal, borderColor: C.teal },
  typeBadgeOutline: { backgroundColor: '#FFFFFF', borderColor: 'rgba(15,157,140,0.35)' },
  typeBadgeDashed: { backgroundColor: '#FFFFFF', borderColor: 'rgba(15,157,140,0.45)', borderStyle: 'dashed' },
  typeBadgeSoft: { backgroundColor: C.tealLt, borderColor: 'rgba(15,157,140,0.20)' },
  typeBadgeKeyPill: {
    minWidth: isTablet ? 18 : 14,
    height: isTablet ? 18 : 14,
    borderRadius: isTablet ? 9 : 7,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2
  },
  typeBadgeKeyPillSolid: { backgroundColor: 'rgba(255,255,255,0.20)' },
  typeBadgeKeyPillSoft: { backgroundColor: 'rgba(15,157,140,0.14)' },
  typeBadgeKeyText: { fontSize: isTablet ? 10 : 8, fontWeight: '800', letterSpacing: 0.3 },
  typeBadgeKeyTextSolid: { color: '#FFFFFF' },
  typeBadgeKeyTextTeal: { color: C.tealDk },
  typeBadgeText: { fontSize: isTablet ? 13 : 10, fontWeight: '600', textTransform: 'capitalize' },
  typeBadgeTextSolid: { color: '#FFFFFF' },
  typeBadgeTextTeal: { color: C.tealDk },
  taskTitle: { fontSize: isTablet ? 16 : 12, color: C.sub, marginBottom: isTablet ? 10 : 7 },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: isTablet ? 12 : 8 },
  taskMetaItem: { flexDirection: 'row', alignItems: 'center', gap: isTablet ? 6 : 4 },
  taskMetaText: { fontSize: isTablet ? 14 : 11, color: C.muted, fontWeight: '500' },
  taskMetaDivider: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: C.track },
  doneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: isTablet ? 6 : 4,
    backgroundColor: 'rgba(45,212,191,0.14)',
    borderRadius: isTablet ? 10 : 8,
    paddingHorizontal: isTablet ? 10 : 8,
    paddingVertical: isTablet ? 6 : 4
  },
  doneChipText: { fontSize: isTablet ? 14 : 11, fontWeight: '700', color: C.tealDk },
  playChip: {
    width: isTablet ? 36 : 28,
    height: isTablet ? 36 : 28,
    borderRadius: isTablet ? 11 : 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1
  },
  playChipSolid: { backgroundColor: C.teal, borderColor: C.teal },
  playChipOutline: { backgroundColor: '#FFFFFF', borderColor: 'rgba(15,157,140,0.35)' },
  strikeText: { textDecorationLine: 'line-through', color: C.muted },

  // ── Empty ──
  emptyWrap: { paddingTop: 12 },
  emptyBox: {
    borderRadius: 18, padding: 30, alignItems: 'center',
    borderWidth: 1, borderColor: C.cardBorder,
  },
  emptyIconRing: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(15,157,140,0.10)', borderWidth: 1, borderColor: C.cardBorder,
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: C.ink, marginBottom: 6 },
  emptyText: { fontSize: 13, color: C.sub, textAlign: 'center', lineHeight: 19 },
});
