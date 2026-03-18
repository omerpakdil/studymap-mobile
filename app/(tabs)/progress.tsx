import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
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
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getLocaleTagForLanguage, resolveAppLanguage, t } from '@/app/i18n';
import { getLocalizedAchievement } from '@/app/i18n/achievementNames';
import { getLocalizedExamName } from '@/app/i18n/examNames';
import { getLocalizedSubjectName } from '@/app/i18n/subjectNames';
import { formatDaysCompact, formatHoursCompact, formatMinutesCompact } from '@/app/i18n/unitFormat';
import { getAdaptiveReviewSignal, type AdaptiveReviewSignal } from '@/app/utils/focusSessionFeedback';
import { getLocalDateKey } from '@/app/utils/localDate';
import {
  Achievement,
  WeeklyReport,
  calculateDailyProgress,
  calculateWeeklyProgress,
  generateWeeklyReport,
  getLatestWeeklyReport,
  getProgramMetadata,
  getStudyStreak,
  getSubjectProgress,
  getUserAchievements,
} from '@/app/utils/studyProgramStorage';

const { width } = Dimensions.get('window');
const isIOS = Platform.OS === 'ios';
const isTablet = width >= 768;

// ─── Teal-only Design Tokens ──────────────────────────────────────────────────
const C = {
  bg0: '#F6FCFB',
  bg1: '#F0FAF8',
  bg2: '#E8F6F2',
  ink: '#0F172A',
  sub: 'rgba(51,65,85,0.76)',
  muted: 'rgba(100,116,139,0.60)',
  card: '#FFFFFF',
  cardBorder: 'rgba(15,157,140,0.13)',
  track: 'rgba(15,157,140,0.10)',
  t50:  'rgba(45,212,191,0.06)',
  t100: 'rgba(45,212,191,0.12)',
  t200: 'rgba(15,157,140,0.20)',
  t300: 'rgba(15,157,140,0.35)',
  t400: '#5BBDB4',
  t500: '#0F9D8C',
  t600: '#0B7A6E',
  t700: '#085F56',
};

// Subject distinction via opacity levels — same teal, different intensity
const SUBJECT_OPACITIES = [1, 0.72, 0.54, 0.40, 0.28, 0.18];
const subjectOpacityMap: Record<string, number> = {};
let opIdx = 0;
const getSubjectOpacity = (s: string) => {
  if (subjectOpacityMap[s] === undefined) {
    subjectOpacityMap[s] = SUBJECT_OPACITIES[opIdx % SUBJECT_OPACITIES.length];
    opIdx++;
  }
  return subjectOpacityMap[s];
};

// Rarity via teal opacity
const RARITY_OPACITY: Record<string, number> = { common: 0.30, rare: 0.52, epic: 0.75, legendary: 1 };
const RARITY_LABEL: Record<string, string> = { common: 'C', rare: 'R', epic: 'E', legendary: 'L' };

// ─── Animated Bar ─────────────────────────────────────────────────────────────
function AnimBar({ pct, opacity = 1, delay = 0, height = 7 }: {
  pct: number; opacity?: number; delay?: number; height?: number;
}) {
  const w = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const t = setTimeout(() => {
      Animated.timing(w, { toValue: pct, duration: 750, useNativeDriver: false }).start();
    }, delay);
    return () => clearTimeout(t);
  }, [pct]);
  return (
    <View style={[styles.barTrack, { height }]}>
      <Animated.View style={[styles.barFill, {
        height,
        width: w.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
        backgroundColor: C.t500,
        opacity,
      }]} />
    </View>
  );
}

// ─── Dot Bar — segmented progress without icons ───────────────────────────────
function DotBar({ pct, count = 10 }: { pct: number; count?: number }) {
  const filled = Math.round((pct / 100) * count);
  return (
    <View style={styles.dotBarRow}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={[styles.dotBarDot, { backgroundColor: i < filled ? C.t500 : C.track }]} />
      ))}
    </View>
  );
}

// ─── Ring Progress ─────────────────────────────────────────────────────────────
function RingProgress({ pct, size = 110, stroke = 10, children }: {
  pct: number; size?: number; stroke?: number; children?: React.ReactNode;
}) {
  const clamp = Math.min(100, Math.max(0, pct));
  const angle = (clamp / 100) * 360;
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: stroke, borderColor: 'rgba(255,255,255,0.22)' }} />
      <View style={{
        position: 'absolute', width: size, height: size, borderRadius: size / 2,
        borderWidth: stroke, borderColor: 'transparent',
        borderTopColor: 'rgba(255,255,255,0.95)',
        borderRightColor: angle >= 90 ? 'rgba(255,255,255,0.95)' : 'transparent',
        borderBottomColor: angle >= 180 ? 'rgba(255,255,255,0.95)' : 'transparent',
        borderLeftColor: angle >= 270 ? 'rgba(255,255,255,0.95)' : 'transparent',
        transform: [{ rotate: '-90deg' }],
      }} />
      <View style={{ alignItems: 'center' }}>{children}</View>
    </View>
  );
}

// ─── Tiled Stat — large number + accent line, replaces icon pill ──────────────
function TiledStat({ value, label, sub }: { value: string; label: string; sub?: string }) {
  return (
    <View style={styles.tiledStat}>
      <View style={styles.tiledAccentLine} />
      <Text style={styles.tiledValue}>{value}</Text>
      <Text style={styles.tiledLabel}>{label}</Text>
      {sub ? <Text style={styles.tiledSub}>{sub}</Text> : null}
    </View>
  );
}

// ─── Metric Row — inside hero ─────────────────────────────────────────────────
function MetricRow({ items }: { items: { val: string; lbl: string }[] }) {
  return (
    <View style={styles.metricRow}>
      {items.map((it, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.metricItem}>
            <Text style={styles.metricVal}>{it.val}</Text>
            <Text style={styles.metricLbl}>{it.lbl}</Text>
          </View>
          {i < items.length - 1 && <View style={styles.metricDivider} />}
        </View>
      ))}
    </View>
  );
}

// ─── Achievement Card ─────────────────────────────────────────────────────────
function AchievCard({
  a,
  index,
  categoryLabel,
  unlockedLabel,
  localizedTitle,
  localizedDescription,
}: {
  a: Achievement;
  index: number;
  categoryLabel: string;
  unlockedLabel: string;
  localizedTitle: string;
  localizedDescription: string;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(14)).current;
  const op = RARITY_OPACITY[a.rarity] ?? 0.30;
  const cardW = isTablet ? (width - 40 - 18) / 2 : (width - 40 - 12) / 2;
  const code = a.title
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');

  useEffect(() => {
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 90, friction: 10 }),
      ]).start();
    }, index * 45);
    return () => clearTimeout(t);
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }], width: cardW, marginBottom: 12 }}>
      <View style={[
        styles.achCard,
        a.unlocked
          ? {
              borderColor: 'rgba(15,157,140,0.46)',
              backgroundColor: 'rgba(45,212,191,0.18)',
              shadowColor: C.t500,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.16,
              shadowRadius: 8,
              elevation: 3,
            }
          : {
              borderColor: `rgba(15,157,140,${op * 0.22})`,
              backgroundColor: C.t50,
              opacity: 0.58,
            },
      ]}>
        {/* Rarity stamp — small teal square, opacity = rarity level */}
        <View style={styles.achTopRow}>
          <View style={[styles.achRarityStamp, { backgroundColor: `rgba(15,157,140,${op})` }]}>
            <Text style={styles.achRarityGlyph}>{RARITY_LABEL[a.rarity]}</Text>
          </View>
          <View style={styles.achCategoryPill}>
            <Text style={styles.achCategoryText}>{categoryLabel}</Text>
          </View>
        </View>

        <View style={styles.achCodeRow}>
          <View style={[styles.achCodePill, a.unlocked && styles.achCodePillUnlocked]}>
            <Text style={[styles.achCodeText, a.unlocked && styles.achCodeTextUnlocked]}>{code || 'AC'}</Text>
          </View>
          {a.unlocked && (
            <View style={styles.achUnlockedPill}>
              <Text style={styles.achUnlockedText}>{unlockedLabel}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.achTitle, { color: a.unlocked ? C.ink : C.muted }]} numberOfLines={2}>
          {localizedTitle}
        </Text>
        <Text style={styles.achDesc} numberOfLines={2}>{localizedDescription}</Text>

        {/* Dot bar: full if unlocked, partial if locked */}
        <DotBar pct={a.unlocked ? 100 : Math.min(100, (a.progress / a.requirement) * 100)} count={8} />

        {!a.unlocked && (
          <Text style={styles.achProgress}>{a.progress}/{a.requirement}</Text>
        )}
      </View>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ProgressScreen() {
  const { tab } = useLocalSearchParams();
  const [selectedTab, setSelectedTab] = useState<'overview' | 'subjects' | 'achievements' | 'weekly'>('overview');
  const [programMetadata, setProgramMetadata] = useState<any>(null);
  const [subjectProgress, setSubjectProgress] = useState<any>({});
  const [weeklyProgress, setWeeklyProgress] = useState({ completed: 0, total: 0, hours: 0 });
  const [dailyProgress, setDailyProgress] = useState({ completed: 0, total: 0, minutes: 0 });
  const [studyStreak, setStudyStreak] = useState(0);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null);
  const [adaptiveReviewSignal, setAdaptiveReviewSignal] = useState<AdaptiveReviewSignal | null>(null);
  const [loading, setLoading] = useState(true);

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-10)).current;
  const tabAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(headerSlide, { toValue: 0, useNativeDriver: true, tension: 80 }),
    ]).start();
  }, []);

  const overallProgress = programMetadata?.totalTasks > 0
    ? Math.round((programMetadata.completedTasks / programMetadata.totalTasks) * 100) : 0;
  const appLang = resolveAppLanguage();
  const appLocale = getLocaleTagForLanguage(appLang);
  const examType = getLocalizedExamName(programMetadata?.examType, appLang, programMetadata?.examType || 'EXAM');
  const subjectLabel = (subject: string) =>
    getLocalizedSubjectName(subject, appLang, subject, { examCode: programMetadata?.examType });
  const tp = (key: string, fallback: string, params?: Record<string, string | number>) =>
    t(`tabs.progress.${key}`, { lang: appLang, fallback, params });

  const loadProgressData = async () => {
    try {
      setLoading(true);
      const today = getLocalDateKey();
      const [metadata, subjects, weekly, daily, streak, userAchievements, latestReport, adaptiveSignal] = await Promise.all([
        getProgramMetadata(), getSubjectProgress(), calculateWeeklyProgress(),
        calculateDailyProgress(today), getStudyStreak(), getUserAchievements(), getLatestWeeklyReport(), getAdaptiveReviewSignal(),
      ]);
      setProgramMetadata(metadata);
      setSubjectProgress(subjects);
      setWeeklyProgress(weekly);
      setDailyProgress(daily);
      setStudyStreak(streak);
      setAchievements(userAchievements);
      setWeeklyReport(latestReport);
      setAdaptiveReviewSignal(adaptiveSignal);
      const { checkDailyGoalCompletion, checkWeeklyGoalCompletion } = await import('@/app/utils/studyProgramStorage');
      await checkDailyGoalCompletion(today);
      await checkWeeklyGoalCompletion();
    } catch (e) {
      console.error(tp('load_error_log', 'Progress load error:'), e);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadProgressData(); }, []);
  useEffect(() => {
    if (tab && typeof tab === 'string' && ['overview','subjects','achievements','weekly'].includes(tab))
      setSelectedTab(tab as any);
  }, [tab]);
  useFocusEffect(useCallback(() => { loadProgressData(); }, []));

  const switchTab = (next: typeof selectedTab) => {
    if (next === selectedTab) return;
    Animated.timing(tabAnim, { toValue: 0, duration: 100, useNativeDriver: true }).start(() => {
      setSelectedTab(next);
      tabAnim.setValue(0);
      Animated.spring(tabAnim, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 250 }).start();
    });
  };

  // ─── Loading ──────────────────────────────────────────────────────────────────
  if (loading || !programMetadata) {
    return (
      <View style={styles.loadWrap}>
        <LinearGradient colors={[C.bg0, C.bg1, C.bg2]} style={StyleSheet.absoluteFill} />
        <LinearGradient colors={[C.t600, C.t500]} style={styles.loadBall} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.loaderSquare1} />
          <View style={styles.loaderSquare2} />
          <View style={styles.loaderSquare3} />
        </LinearGradient>
        <Text style={styles.loadTitle}>{tp('loading_title', 'Loading analytics...')}</Text>
        <Text style={styles.loadSub}>{tp('loading_subtitle', 'Crunching your data')}</Text>
      </View>
    );
  }

  // ─── Overview ─────────────────────────────────────────────────────────────────
  const renderOverview = () => {
    const weeklyPct = weeklyProgress.total > 0
      ? Math.round((weeklyProgress.completed / weeklyProgress.total) * 100) : 0;
    const dailyPct = dailyProgress.total > 0
      ? Math.round((dailyProgress.completed / dailyProgress.total) * 100) : 0;
    const subjectEntries = Object.entries(subjectProgress) as [string, any][];
    const weakest = subjectEntries.length > 0
      ? subjectEntries.reduce((p, c) => c[1].progress < p[1].progress ? c : p) : null;
    const strongest = subjectEntries.length > 0
      ? subjectEntries.reduce((p, c) => c[1].progress > p[1].progress ? c : p) : null;
    const adaptiveSubjects = (adaptiveReviewSignal?.affectedSubjects || []).map((subject) => subjectLabel(subject));

    return (
      <View style={{ gap: isTablet ? 20 : 14 }}>
        {/* Hero */}
        <View style={styles.heroCard}>
          <LinearGradient colors={['#0F766E', '#0F9D8C', '#2DD4BF']} style={styles.heroGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <View style={styles.heroBlob1} />
            <View style={styles.heroBlob2} />
            <View style={styles.heroRow}>
              <RingProgress pct={overallProgress} size={isTablet ? 146 : 110} stroke={isTablet ? 12 : 10}>
                <Text style={styles.ringPct}>{overallProgress}%</Text>
                <Text style={styles.ringLabel}>{tp('overall', 'Overall')}</Text>
              </RingProgress>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroRightTitle}>{tp('study_progress', 'Study Progress')}</Text>
                <MetricRow items={[
                  { val: String(programMetadata.daysRemaining), lbl: tp('days_left', 'Days Left') },
                  { val: String(programMetadata.completedTasks), lbl: tp('done', 'Done') },
                  { val: formatDaysCompact(studyStreak, appLang), lbl: tp('streak', 'Streak') },
                ]} />
                <View style={styles.heroMiniWrap}>
                  <View style={styles.heroMiniTrack}>
                    <View style={[styles.heroMiniFill, { width: `${overallProgress}%` as any }]} />
                  </View>
                  <Text style={styles.heroMiniText}>{programMetadata.completedTasks}/{programMetadata.totalTasks}</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* 4 tiled stats — large numbers with accent line, no icons */}
        <View style={styles.tiledRow}>
          <TiledStat value={`${studyStreak}`} label={tp('day_streak', 'Day Streak')} sub={tp('days', 'days')} />
          <TiledStat value={formatHoursCompact(weeklyProgress.hours, appLang)} label={tp('this_week', 'This Week')} sub={tp('studied', 'studied')} />
          <TiledStat value={formatMinutesCompact(dailyProgress.minutes, appLang)} label={tp('today', 'Today')} sub={tp('logged', 'logged')} />
          <TiledStat value={formatHoursCompact(programMetadata.weeklyHours || 15, appLang)} label={tp('goal', 'Goal')} sub={tp('weekly', 'weekly')} />
        </View>

        {/* Dual progress */}
        <View style={styles.dualCard}>
          <View style={styles.dualHalf}>
            <View style={styles.dualHeader}>
              <Text style={styles.dualTitle}>{tp('this_week', 'This Week')}</Text>
              <Text style={styles.dualPct}>{weeklyPct}%</Text>
            </View>
            <AnimBar pct={weeklyPct} delay={0} />
            <DotBar pct={weeklyPct} count={10} />
            <Text style={styles.dualSub}>
              {tp('tasks_progress', '{completed}/{total} tasks', {
                completed: weeklyProgress.completed,
                total: weeklyProgress.total,
              })}
            </Text>
          </View>
          <View style={styles.dualDivider} />
          <View style={styles.dualHalf}>
            <View style={styles.dualHeader}>
              <Text style={styles.dualTitle}>{tp('today', 'Today')}</Text>
              <Text style={styles.dualPct}>{dailyPct}%</Text>
            </View>
            <AnimBar pct={dailyPct} delay={120} />
            <DotBar pct={dailyPct} count={10} />
            <Text style={styles.dualSub}>
              {`${formatMinutesCompact(dailyProgress.minutes, appLang)} ${tp('studied', 'studied').toLowerCase()}`}
            </Text>
          </View>
        </View>

        {adaptiveReviewSignal?.active && (
          <View style={styles.insightStrip}>
            <View style={styles.insightAccent} />
            <View style={{ flex: 1 }}>
              <Text style={styles.insightTag}>{tp('adaptive_review_title', 'ADAPTIVE REVIEW')}</Text>
              <Text style={styles.insightBody}>
                {adaptiveSubjects.length <= 1
                  ? tp('adaptive_review_line_one', '{subject} is getting extra short-term review after recent friction.', {
                      subject: adaptiveSubjects[0] || tp('adaptive_review_subject_generic', 'A subject'),
                    })
                  : tp('adaptive_review_line_multi', '{subjects} are getting extra short-term review after recent friction.', {
                      subjects: adaptiveSubjects.slice(0, 2).join(' · '),
                    })}
              </Text>
            </View>
            <Text style={styles.insightBigNum}>{adaptiveReviewSignal.hardCount + adaptiveReviewSignal.incompleteCount}</Text>
          </View>
        )}

        {/* Insight strips — typographic, no icons */}
        {weakest && weakest[1].progress < 60 && (
          <View style={styles.insightStrip}>
            <View style={styles.insightAccent} />
            <View style={{ flex: 1 }}>
              <Text style={styles.insightTag}>{tp('focus_area', 'FOCUS AREA')}</Text>
              <Text style={styles.insightBody}>
                {tp('weak_subject_line', '{subject} is at {progress}% — needs more attention', {
                  subject: subjectLabel(weakest[0]),
                  progress: weakest[1].progress,
                })}
              </Text>
            </View>
            <Text style={styles.insightBigNum}>{weakest[1].progress}%</Text>
          </View>
        )}
        {strongest && strongest[1].progress > 75 && (
          <View style={[styles.insightStrip, styles.insightStripFilled]}>
            <View style={[styles.insightAccent, { opacity: 0 }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.insightTag, { color: 'rgba(255,255,255,0.65)' }]}>{tp('top_subject', 'TOP SUBJECT')}</Text>
              <Text style={[styles.insightBody, { color: 'rgba(255,255,255,0.9)' }]}>
                {tp('top_subject_line', '{subject} leading at {progress}%', {
                  subject: subjectLabel(strongest[0]),
                  progress: strongest[1].progress,
                })}
              </Text>
            </View>
            <Text style={[styles.insightBigNum, { color: '#fff' }]}>{strongest[1].progress}%</Text>
          </View>
        )}
        {studyStreak >= 7 && (
          <View style={styles.insightStrip}>
            <View style={styles.insightAccent} />
            <View style={{ flex: 1 }}>
              <Text style={styles.insightTag}>{tp('streak_upper', 'STREAK')}</Text>
              <Text style={styles.insightBody}>
                {tp('streak_line', '{days} consecutive days — keep going', { days: studyStreak })}
              </Text>
            </View>
            <Text style={styles.insightBigNum}>{formatDaysCompact(studyStreak, appLang)}</Text>
          </View>
        )}
        {programMetadata.daysRemaining <= 30 && (
          <View style={styles.insightStrip}>
            <View style={styles.insightAccent} />
            <View style={{ flex: 1 }}>
              <Text style={styles.insightTag}>{tp('countdown', 'COUNTDOWN')}</Text>
              <Text style={styles.insightBody}>
                {tp('countdown_line', '{days} days until {exam}', {
                  days: programMetadata.daysRemaining,
                  exam: examType,
                })}
              </Text>
            </View>
            <Text style={styles.insightBigNum}>{formatDaysCompact(programMetadata.daysRemaining, appLang)}</Text>
          </View>
        )}
      </View>
    );
  };

  // ─── Subjects ─────────────────────────────────────────────────────────────────
  const renderSubjects = () => {
    const entries = Object.entries(subjectProgress) as [string, any][];
    if (entries.length === 0) return (
      <View style={styles.emptyWrap}>
        <View style={styles.emptyGlyph}>
          <View style={[styles.emptyGlyphBar, { width: 40, opacity: 1 }]} />
          <View style={[styles.emptyGlyphBar, { width: 28, opacity: 0.55 }]} />
          <View style={[styles.emptyGlyphBar, { width: 16, opacity: 0.28 }]} />
        </View>
        <Text style={styles.emptyTitle}>{tp('no_subject_data_title', 'No subject data yet')}</Text>
        <Text style={styles.emptyText}>{tp('no_subject_data_body', 'Complete study sessions to see per-subject analytics.')}</Text>
      </View>
    );

    const sorted = [...entries].sort((a, b) => b[1].progress - a[1].progress);
    const maxPct = Math.max(...sorted.map(([, p]) => p.progress), 1);

    return (
      <View style={{ gap: 12 }}>
        <View style={styles.subjHeader}>
          <Text style={styles.subjHeaderTitle}>
            {tp('subjects_count', '{count} Subjects', { count: entries.length })}
          </Text>
          <View style={styles.subjHeaderBadge}>
            <Text style={styles.subjHeaderBadgeText}>
              {tp('subjects_on_track', '{count} on track', {
                count: entries.filter(([, p]) => p.progress >= 75).length,
              })}
            </Text>
          </View>
        </View>

        {/* Comparative bar chart */}
        <View style={styles.barChartCard}>
          <Text style={styles.barChartTitle}>{tp('completion_by_subject', 'Completion by Subject')}</Text>
          {sorted.map(([subject, prog], i) => {
            const op = getSubjectOpacity(subject);
            const relPct = (prog.progress / maxPct) * 100;
            return (
              <View key={subject} style={styles.barChartRow}>
                <Text style={styles.barChartLabel} numberOfLines={1}>{subjectLabel(subject)}</Text>
                <View style={styles.barChartTrackWrap}>
                  <AnimBar pct={relPct} opacity={op} delay={i * 70} height={10} />
                </View>
                <Text style={[styles.barChartPct, { opacity: Math.max(op, 0.55) }]}>{prog.progress}%</Text>
              </View>
            );
          })}
        </View>

        {/* Individual cards */}
        {sorted.map(([subject, prog], i) => {
          const op = getSubjectOpacity(subject);
          return (
            <View key={subject} style={styles.subjCard}>
              <View style={[styles.subjAccent, { backgroundColor: `rgba(15,157,140,${op})` }]} />
              <View style={styles.subjBody}>
                <View style={styles.subjTopRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={[styles.subjRankBox, { backgroundColor: `rgba(15,157,140,${op * 0.15})` }]}>
                      <Text style={[styles.subjRankText, { color: `rgba(15,157,140,${Math.max(op, 0.6)})` }]}>#{i + 1}</Text>
                    </View>
                    <Text style={styles.subjName}>{subjectLabel(subject)}</Text>
                  </View>
                  <Text style={[styles.subjPct, { opacity: Math.max(op, 0.6) }]}>{prog.progress}%</Text>
                </View>
                <AnimBar pct={prog.progress} opacity={op} delay={i * 60} />
                <DotBar pct={prog.progress} count={12} />
                <View style={styles.subjMeta}>
                  <Text style={styles.subjMetaText}>
                    {tp('tasks_progress', '{completed}/{total} tasks', {
                      completed: prog.completed,
                      total: prog.total,
                    })}
                  </Text>
                  <View style={styles.subjMetaDot} />
                  <Text style={styles.subjMetaText}>
                    {tp('hours_studied', '{hours}h studied', { hours: prog.hours || 0 })}
                  </Text>
                  <View style={styles.subjMetaDot} />
                  <Text style={[styles.subjMetaText, { color: prog.progress >= 75 ? C.t500 : C.muted }]}>
                    {prog.progress >= 75
                      ? tp('status_on_track', 'On Track')
                      : prog.progress >= 40
                        ? tp('status_in_progress', 'In Progress')
                        : tp('status_needs_focus', 'Needs Focus')}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  // ─── Achievements ─────────────────────────────────────────────────────────────
  const renderAchievements = () => {
    const unlocked = achievements.filter(a => a.unlocked).length;
    const pct = achievements.length > 0 ? Math.round((unlocked / achievements.length) * 100) : 0;
    const byCategory = achievements.reduce((acc, a) => {
      if (!acc[a.category]) acc[a.category] = [];
      acc[a.category].push(a);
      return acc;
    }, {} as Record<string, Achievement[]>);
    const catBadgeLabel: Record<string, string> = {
      streak: tp('cat_badge_streak', 'STREAK'),
      time: tp('cat_badge_time', 'TIME'),
      tasks: tp('cat_badge_tasks', 'TASKS'),
      subjects: tp('cat_badge_subject', 'SUBJECT'),
      milestones: tp('cat_badge_goal', 'GOAL'),
    };
    const catLabel: Record<string, string> = {
      streak: tp('cat_streak', 'Study Streaks'),
      time: tp('cat_time', 'Time Milestones'),
      tasks: tp('cat_tasks', 'Task Achievements'),
      subjects: tp('cat_subjects', 'Subject Mastery'),
      milestones: tp('cat_milestones', 'Goal Achievements'),
    };

    return (
      <View style={{ gap: 16 }}>
        {/* Hero */}
        <View style={styles.heroCard}>
          <LinearGradient colors={['#0F766E', '#0F9D8C', '#2DD4BF']} style={styles.heroGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <View style={styles.heroBlob1} />
            <View style={styles.achHeroRow}>
              <View>
                <Text style={styles.achHeroBig}>{unlocked}</Text>
                <Text style={styles.achHeroSub}>
                  {tp('of_badges', 'of {count} badges', { count: achievements.length })}
                </Text>
              </View>
              <RingProgress pct={pct} size={isTablet ? 118 : 86} stroke={isTablet ? 11 : 9}>
                <Text style={styles.achRingPct}>{pct}%</Text>
              </RingProgress>
            </View>
            {/* 20-segment dot strip */}
            <View style={[styles.dotBarRow, { marginTop: 10 }]}>
              {Array.from({ length: 20 }).map((_, i) => (
                <View key={i} style={[
                  styles.dotBarDot,
                  { flex: 1, height: 4, borderRadius: 2, backgroundColor: i < Math.round((pct / 100) * 20) ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.22)' },
                ]} />
              ))}
            </View>
          </LinearGradient>
        </View>

        {Object.entries(byCategory).map(([cat, achs]) => {
          const catUnlocked = achs.filter(a => a.unlocked).length;
          return (
            <View key={cat}>
              <View style={styles.catHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {/* Square glyph — no icon */}
                  <View style={styles.catGlyph}>
                    <View style={styles.catGlyphInner} />
                  </View>
                  <Text style={styles.catTitle}>{catLabel[cat] || cat}</Text>
                </View>
                <View style={styles.catCountPill}>
                  <Text style={styles.catCountText}>{catUnlocked}/{achs.length}</Text>
                </View>
              </View>
              <View style={styles.achGrid}>
                {achs.map((a, i) => {
                  const loc = getLocalizedAchievement(a.id, appLang);
                  return (
                    <AchievCard
                      key={a.id}
                      a={a}
                      index={i}
                      categoryLabel={catBadgeLabel[cat] || cat.toUpperCase()}
                      unlockedLabel={tp('unlocked', 'Unlocked')}
                      localizedTitle={loc.title}
                      localizedDescription={loc.description}
                    />
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  // ─── Weekly Report ────────────────────────────────────────────────────────────
  const renderWeekly = () => {
    if (!weeklyReport) return (
      <View style={styles.emptyWrap}>
        <View style={styles.emptyGlyph}>
          <View style={[styles.emptyGlyphBar, { width: 40, opacity: 1 }]} />
          <View style={[styles.emptyGlyphBar, { width: 28, opacity: 0.55 }]} />
          <View style={[styles.emptyGlyphBar, { width: 16, opacity: 0.28 }]} />
        </View>
        <Text style={styles.emptyTitle}>{tp('no_report_title', 'No report yet')}</Text>
        <Text style={styles.emptyText}>{tp('no_report_body', 'Complete some study sessions to generate your first weekly report.')}</Text>
        <TouchableOpacity
          style={styles.genBtn}
          onPress={async () => {
            try { setLoading(true); setWeeklyReport(await generateWeeklyReport()); }
            catch {} finally { setLoading(false); }
          }}
        >
          <Text style={styles.genBtnText}>{tp('generate_report', 'Generate Report')}</Text>
        </TouchableOpacity>
      </View>
    );

    const fmt = (d: string) => new Date(d).toLocaleDateString(appLocale, { month: 'short', day: 'numeric' });

    return (
      <View style={{ gap: 14 }}>
        {/* Hero */}
        <View style={styles.heroCard}>
          <LinearGradient colors={['#0F766E', '#0F9D8C', '#2DD4BF']} style={styles.heroGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <View style={styles.heroBlob1} />
            <Text style={styles.weeklyKicker}>
              {tp('week_number', 'Week {num}', { num: weeklyReport.weekNumber })}
            </Text>
            <Text style={styles.weeklyDates}>{fmt(weeklyReport.weekStart)} – {fmt(weeklyReport.weekEnd)}</Text>
            <MetricRow items={[
              { val: `${weeklyReport.summary.completionRate}%`, lbl: tp('completion', 'Completion') },
              { val: formatHoursCompact(weeklyReport.summary.hoursStudied, appLang), lbl: tp('hours', 'Hours') },
              { val: formatDaysCompact(weeklyReport.achievements.streakDays, appLang), lbl: tp('streak', 'Streak') },
              { val: String(weeklyReport.achievements.newBadges.length), lbl: tp('badges', 'Badges') },
            ]} />
          </LinearGradient>
        </View>

        {/* Subject breakdown */}
        <View style={styles.weekSection}>
          <View style={styles.weekSectionHeader}>
            <View style={styles.tripleLineGlyph}>
              <View style={styles.tripleLineA} />
              <View style={[styles.tripleLineA, { width: 10, opacity: 0.55 }]} />
              <View style={[styles.tripleLineA, { width: 6, opacity: 0.28 }]} />
            </View>
            <Text style={styles.weekSectionTitle}>{tp('subject_breakdown', 'Subject Breakdown')}</Text>
          </View>
          {Object.entries(weeklyReport.subjectBreakdown).map(([sub, data]: [string, any], i) => {
            const op = getSubjectOpacity(sub);
            return (
              <View key={sub} style={styles.weekSubRow}>
                <Text style={styles.weekSubName} numberOfLines={1}>{subjectLabel(sub)}</Text>
                <View style={{ flex: 1, marginHorizontal: 10 }}>
                  <AnimBar pct={data.progress} opacity={op} delay={i * 60} height={8} />
                </View>
                <Text style={[styles.weekSubPct, { opacity: Math.max(op, 0.5) }]}>{data.progress}%</Text>
              </View>
            );
          })}
        </View>

        {/* Strong points */}
        {weeklyReport.achievements.strongPoints.length > 0 && (
          <View style={styles.weekSection}>
            <View style={styles.weekSectionHeader}>
              <View style={styles.tripleLineGlyph}>
                <View style={styles.tripleLineA} />
                <View style={[styles.tripleLineA, { width: 10, opacity: 0.55 }]} />
                <View style={[styles.tripleLineA, { width: 6, opacity: 0.28 }]} />
              </View>
              <Text style={styles.weekSectionTitle}>{tp('strong_points', 'Strong Points')}</Text>
            </View>
            {weeklyReport.achievements.strongPoints.map((pt: string, i: number) => (
              <View key={i} style={styles.weekListRow}>
                <View style={styles.weekListDash} />
                <Text style={styles.weekListText}>{subjectLabel(pt)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Improvement */}
        {weeklyReport.achievements.improvementAreas.length > 0 && (
          <View style={[styles.weekSection, { opacity: 0.75 }]}>
            <View style={styles.weekSectionHeader}>
              <View style={styles.tripleLineGlyph}>
                <View style={[styles.tripleLineA, { opacity: 0.45 }]} />
                <View style={[styles.tripleLineA, { width: 10, opacity: 0.28 }]} />
                <View style={[styles.tripleLineA, { width: 6, opacity: 0.16 }]} />
              </View>
              <Text style={[styles.weekSectionTitle, { color: C.sub }]}>{tp('areas_to_improve', 'Areas to Improve')}</Text>
            </View>
            {weeklyReport.achievements.improvementAreas.map((a: string, i: number) => (
              <View key={i} style={styles.weekListRow}>
                <View style={[styles.weekListDash, { opacity: 0.4 }]} />
                <Text style={[styles.weekListText, { color: C.muted }]}>{subjectLabel(a)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Next week goals */}
        <View style={styles.weekSection}>
          <View style={styles.weekSectionHeader}>
            <View style={styles.tripleLineGlyph}>
              <View style={styles.tripleLineA} />
              <View style={[styles.tripleLineA, { width: 10, opacity: 0.55 }]} />
              <View style={[styles.tripleLineA, { width: 6, opacity: 0.28 }]} />
            </View>
            <Text style={styles.weekSectionTitle}>{tp('next_week_goals', 'Next Week Goals')}</Text>
          </View>
          <View style={styles.goalsRow}>
            <View style={styles.goalBlock}>
              <Text style={styles.goalBlockVal}>{weeklyReport.nextWeekGoals.targetHours}h</Text>
              <Text style={styles.goalBlockLbl}>{tp('target_hours', 'Target Hours')}</Text>
            </View>
            {weeklyReport.nextWeekGoals.focusSubjects.map((s: string) => (
              <View key={s} style={[styles.goalBlock, styles.goalBlockSub]}>
                <Text style={[styles.goalBlockVal, { fontSize: 13 }]}>{subjectLabel(s)}</Text>
                <Text style={styles.goalBlockLbl}>{tp('focus', 'Focus')}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const TABS = [
    { key: 'overview',     label: tp('tab_overview', 'Overview') },
    { key: 'subjects',     label: tp('tab_subjects', 'Subjects') },
    { key: 'achievements', label: tp('tab_badges', 'Badges') },
    { key: 'weekly',       label: tp('tab_weekly', 'Weekly') },
  ] as const;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <LinearGradient colors={[C.bg0, C.bg1, C.bg2]} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
      <View style={styles.bgOrbA} />
      <View style={styles.bgOrbB} />

      {/* Header */}
      <Animated.View style={[styles.header, { opacity: headerOpacity, transform: [{ translateY: headerSlide }] }]}>
        <View>
          <Text style={styles.headerKicker}>{tp('header_kicker', 'StudyMap Analytics')}</Text>
          <Text style={styles.headerTitle}>{tp('header_title', 'Progress')}</Text>
          <Text style={styles.headerSub}>
            {tp('focused_on', 'Focused on')} <Text style={styles.headerExam}>{examType}</Text>
          </Text>
        </View>
        {/* Streak badge: numbers + dot strip, no icon */}
        <View style={styles.streakBadge}>
          <Text style={styles.streakBadgeNum}>{studyStreak}</Text>
          <Text style={styles.streakBadgeLbl}>{tp('day_streak_small', 'day streak')}</Text>
          <View style={styles.streakDotRow}>
            {Array.from({ length: Math.min(studyStreak, 7) }).map((_, i) => (
              <View key={i} style={[styles.streakDot, { opacity: 1 - i * 0.1 }]} />
            ))}
          </View>
        </View>
      </Animated.View>

      {/* Tab row */}
      <View style={styles.tabRow}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            onPress={() => switchTab(t.key)}
            style={[styles.tabBtn, selectedTab === t.key && styles.tabBtnActive]}
            activeOpacity={0.78}
          >
            {selectedTab === t.key && <View style={styles.tabActiveLine} />}
            <Text style={[styles.tabBtnText, selectedTab === t.key && styles.tabBtnTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={{
          opacity: tabAnim,
          transform: [{ translateY: tabAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
        }}>
          {selectedTab === 'overview'     && renderOverview()}
          {selectedTab === 'subjects'     && renderSubjects()}
          {selectedTab === 'achievements' && renderAchievements()}
          {selectedTab === 'weekly'       && renderWeekly()}
        </Animated.View>
        <View style={{ height: isIOS ? 110 : 92 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg0 },
  bgOrbA: { position: 'absolute', width: 260, height: 260, borderRadius: 130, top: -80, right: -100, backgroundColor: 'rgba(45,212,191,0.14)' },
  bgOrbB: { position: 'absolute', width: 220, height: 220, borderRadius: 110, bottom: 120, left: -110, backgroundColor: 'rgba(52,211,153,0.10)' },

  loadWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadBall: { width: 78, height: 78, borderRadius: 39, justifyContent: 'center', alignItems: 'center', marginBottom: 20, shadowColor: C.t500, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8 },
  loaderSquare1: { position: 'absolute', width: 32, height: 32, borderRadius: 4, borderWidth: 2, borderColor: 'rgba(255,255,255,0.8)' },
  loaderSquare2: { position: 'absolute', width: 20, height: 20, borderRadius: 3, borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)' },
  loaderSquare3: { position: 'absolute', width: 8, height: 8, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.9)' },
  loadTitle: { fontSize: isTablet ? 28 : 20, fontWeight: '700', color: C.ink, marginBottom: 5 },
  loadSub: { fontSize: isTablet ? 18 : 14, color: C.sub },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: isIOS ? (isTablet ? 10 : 6) : (isTablet ? 18 : 14), paddingBottom: isTablet ? 18 : 14 },
  headerKicker: { fontSize: isTablet ? 16 : 10, fontWeight: '700', color: C.muted, letterSpacing: isTablet ? 1.6 : 1.1, textTransform: 'uppercase', marginBottom: isTablet ? 6 : 4 },
  headerTitle: { fontSize: isTablet ? 40 : 22, fontWeight: '800', color: C.ink, lineHeight: isTablet ? 46 : 27 },
  headerSub: { marginTop: 2, fontSize: isTablet ? 20 : 12, fontWeight: '500', color: C.sub },
  headerExam: { color: C.t500, fontWeight: '800' },

  streakBadge: { alignItems: 'center', backgroundColor: C.t100, borderRadius: isTablet ? 20 : 14, borderWidth: 1, borderColor: C.cardBorder, paddingHorizontal: isTablet ? 18 : 12, paddingVertical: isTablet ? 14 : 8 },
  streakBadgeNum: { fontSize: isTablet ? 34 : 22, fontWeight: '900', color: C.t600, lineHeight: isTablet ? 38 : 26 },
  streakBadgeLbl: { fontSize: isTablet ? 13 : 9, fontWeight: '600', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  streakDotRow: { flexDirection: 'row', gap: 3, marginTop: 4 },
  streakDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.t500 },

  tabRow: { flexDirection: 'row', marginHorizontal: 20, marginBottom: isTablet ? 26 : 16, backgroundColor: C.card, borderRadius: isTablet ? 18 : 12, padding: isTablet ? 8 : 4, borderWidth: 1, borderColor: C.cardBorder },
  tabBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: isTablet ? 16 : 9, borderRadius: isTablet ? 13 : 9, gap: 3 },
  tabBtnActive: { backgroundColor: C.t100 },
  tabActiveLine: { width: 16, height: 2, borderRadius: 1, backgroundColor: C.t500 },
  tabBtnText: { fontSize: isTablet ? 17 : 11, fontWeight: '600', color: C.muted },
  tabBtnTextActive: { color: C.t500, fontWeight: '700' },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: isTablet ? 8 : 4, paddingBottom: isTablet ? 36 : 0 },

  heroCard: { borderRadius: isTablet ? 30 : 22, overflow: 'hidden', marginBottom: 4, shadowColor: C.t500, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.28, shadowRadius: 18, elevation: 12, minHeight: isTablet ? 280 : undefined },
  heroGradient: { padding: isTablet ? 36 : 20 },
  heroBlob1: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.07)', top: -40, right: -30 },
  heroBlob2: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.05)', bottom: -20, left: 60 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: isTablet ? 24 : 18 },
  heroRightTitle: { fontSize: isTablet ? 18 : 13, fontWeight: '600', color: 'rgba(255,255,255,0.85)', marginBottom: isTablet ? 14 : 10 },
  heroMiniWrap: { flexDirection: 'row', alignItems: 'center', gap: isTablet ? 12 : 8, marginTop: isTablet ? 14 : 10 },
  heroMiniTrack: { flex: 1, height: isTablet ? 6 : 4, borderRadius: isTablet ? 3 : 2, backgroundColor: 'rgba(255,255,255,0.25)', overflow: 'hidden' },
  heroMiniFill: { height: isTablet ? 6 : 4, borderRadius: isTablet ? 3 : 2, backgroundColor: '#fff' },
  heroMiniText: { fontSize: isTablet ? 14 : 11, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },
  ringPct: { fontSize: isTablet ? 30 : 22, fontWeight: '800', color: '#fff' },
  ringLabel: { fontSize: isTablet ? 14 : 11, fontWeight: '500', color: 'rgba(255,255,255,0.8)' },

  metricRow: { flexDirection: 'row', alignItems: 'center', marginTop: isTablet ? 2 : 0 },
  metricItem: { flex: 1, alignItems: 'center' },
  metricVal: { fontSize: isTablet ? 24 : 17, fontWeight: '800', color: '#fff' },
  metricLbl: { fontSize: isTablet ? 13 : 10, fontWeight: '500', color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  metricDivider: { width: 1, height: isTablet ? 34 : 24, backgroundColor: 'rgba(255,255,255,0.25)' },

  tiledRow: { flexDirection: 'row', gap: isTablet ? 14 : 8, flexWrap: isTablet ? 'wrap' : 'nowrap' },
  tiledStat: {
    ...(isTablet ? { flexBasis: '48.8%', maxWidth: '48.8%' } : { flex: 1 }),
    minHeight: isTablet ? 144 : undefined,
    backgroundColor: C.card,
    borderRadius: isTablet ? 18 : 14,
    padding: isTablet ? 20 : 12,
    borderWidth: 1,
    borderColor: C.cardBorder,
    gap: 2,
    shadowColor: C.t500,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1
  },
  tiledAccentLine: { width: 18, height: 3, borderRadius: 2, backgroundColor: C.t500, marginBottom: 4 },
  tiledValue: { fontSize: isTablet ? 30 : 17, fontWeight: '900', color: C.ink, letterSpacing: -0.3 },
  tiledLabel: { fontSize: isTablet ? 14 : 10, fontWeight: '700', color: C.sub, textTransform: 'uppercase', letterSpacing: 0.3 },
  tiledSub: { fontSize: isTablet ? 13 : 9, color: C.muted },

  dualCard: { flexDirection: 'row', backgroundColor: C.card, borderRadius: isTablet ? 20 : 16, borderWidth: 1, borderColor: C.cardBorder, padding: isTablet ? 26 : 16, minHeight: isTablet ? 190 : undefined, shadowColor: C.t500, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 2 },
  dualHalf: { flex: 1, gap: isTablet ? 10 : 6, justifyContent: isTablet ? 'center' : 'flex-start' },
  dualDivider: { width: 1, backgroundColor: C.cardBorder, marginHorizontal: isTablet ? 18 : 14 },
  dualHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dualTitle: { fontSize: isTablet ? 16 : 12, fontWeight: '700', color: C.ink },
  dualPct: { fontSize: isTablet ? 20 : 14, fontWeight: '800', color: C.t500 },
  dualSub: { fontSize: isTablet ? 13 : 10, color: C.muted, fontWeight: '500' },

  barTrack: { borderRadius: 4, backgroundColor: C.track, overflow: 'hidden' },
  barFill: { borderRadius: 4 },

  dotBarRow: { flexDirection: 'row', gap: 3, marginTop: 4 },
  dotBarDot: { width: 5, height: 5, borderRadius: 3 },

  insightStrip: { flexDirection: 'row', alignItems: 'center', gap: isTablet ? 16 : 12, backgroundColor: C.card, borderRadius: isTablet ? 18 : 14, borderWidth: 1, borderColor: C.cardBorder, padding: isTablet ? 22 : 14, minHeight: isTablet ? 120 : undefined, shadowColor: C.t500, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  insightStripFilled: { backgroundColor: C.t500, borderColor: C.t500 },
  insightAccent: { width: 3, alignSelf: 'stretch', backgroundColor: C.t500, borderRadius: 2 },
  insightTag: { fontSize: isTablet ? 11 : 9, fontWeight: '800', color: C.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 3 },
  insightBody: { fontSize: isTablet ? 17 : 13, color: C.sub, lineHeight: isTablet ? 24 : 18 },
  insightHighlight: { fontWeight: '700', color: C.ink },
  insightBigNum: { fontSize: isTablet ? 30 : 22, fontWeight: '900', color: C.t500, letterSpacing: -0.5 },

  subjHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  subjHeaderTitle: { fontSize: isTablet ? 22 : 16, fontWeight: '800', color: C.ink },
  subjHeaderBadge: { backgroundColor: C.t100, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  subjHeaderBadgeText: { fontSize: isTablet ? 14 : 11, fontWeight: '700', color: C.t600 },

  barChartCard: { backgroundColor: C.card, borderRadius: isTablet ? 20 : 16, borderWidth: 1, borderColor: C.cardBorder, padding: isTablet ? 20 : 16, shadowColor: C.t500, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 5, elevation: 2 },
  barChartTitle: { fontSize: isTablet ? 14 : 11, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: isTablet ? 18 : 14 },
  barChartRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  barChartLabel: { width: isTablet ? 110 : 74, fontSize: isTablet ? 14 : 11, fontWeight: '600', color: C.sub },
  barChartTrackWrap: { flex: 1 },
  barChartPct: { width: isTablet ? 52 : 36, fontSize: isTablet ? 14 : 11, fontWeight: '700', color: C.t500, textAlign: 'right' },

  subjCard: { flexDirection: 'row', alignItems: 'stretch', backgroundColor: C.card, borderRadius: isTablet ? 18 : 14, borderWidth: 1, borderColor: C.cardBorder, overflow: 'hidden', shadowColor: C.t500, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 5, elevation: 2 },
  subjAccent: { width: 4, alignSelf: 'stretch' },
  subjBody: { flex: 1, padding: isTablet ? 18 : 13, gap: isTablet ? 10 : 7 },
  subjTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subjRankBox: { width: isTablet ? 34 : 26, height: isTablet ? 34 : 26, borderRadius: isTablet ? 9 : 7, justifyContent: 'center', alignItems: 'center' },
  subjRankText: { fontSize: isTablet ? 13 : 10, fontWeight: '800', color: C.t500 },
  subjName: { fontSize: isTablet ? 19 : 14, fontWeight: '700', color: C.ink },
  subjPct: { fontSize: isTablet ? 22 : 15, fontWeight: '800', color: C.t500 },
  subjMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  subjMetaText: { fontSize: isTablet ? 14 : 11, color: C.muted, fontWeight: '500' },
  subjMetaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: C.track },

  achHeroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  achHeroBig: { fontSize: isTablet ? 66 : 52, fontWeight: '900', color: '#fff', lineHeight: isTablet ? 72 : 56 },
  achHeroSub: { fontSize: isTablet ? 18 : 13, fontWeight: '500', color: 'rgba(255,255,255,0.8)' },
  achRingPct: { fontSize: isTablet ? 20 : 15, fontWeight: '800', color: '#fff' },

  catHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  catGlyph: { width: 22, height: 22, borderRadius: 6, backgroundColor: C.t100, justifyContent: 'center', alignItems: 'center' },
  catGlyphInner: { width: 8, height: 8, borderRadius: 2, backgroundColor: C.t500 },
  catTitle: { fontSize: isTablet ? 17 : 13, fontWeight: '700', color: C.ink },
  catCountPill: { backgroundColor: C.t100, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 3 },
  catCountText: { fontSize: isTablet ? 14 : 11, fontWeight: '700', color: C.t600 },
  achGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },

  achCard: { borderRadius: 14, borderWidth: 1.5, padding: 12, gap: 5 },
  achTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 1 },
  achRarityStamp: { alignSelf: 'flex-start', width: 18, height: 18, borderRadius: 4, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  achRarityGlyph: { fontSize: 9, fontWeight: '900', color: '#fff' },
  achCategoryPill: { backgroundColor: C.t100, borderWidth: 1, borderColor: C.cardBorder, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },
  achCategoryText: { fontSize: 8, fontWeight: '700', color: C.t600, letterSpacing: 0.45, textTransform: 'uppercase' },
  achCodeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  achCodePill: { alignSelf: 'flex-start', minWidth: 34, paddingHorizontal: 8, height: 20, borderRadius: 10, backgroundColor: C.t100, borderWidth: 1, borderColor: C.cardBorder, justifyContent: 'center', alignItems: 'center', marginTop: 1 },
  achCodePillUnlocked: { backgroundColor: C.t500, borderColor: C.t500 },
  achCodeText: { fontSize: 10, fontWeight: '800', color: C.t600, letterSpacing: 0.5 },
  achCodeTextUnlocked: { color: '#FFFFFF' },
  achUnlockedPill: { backgroundColor: 'rgba(15,157,140,0.16)', borderWidth: 1, borderColor: 'rgba(15,157,140,0.30)', borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },
  achUnlockedText: { fontSize: 8, fontWeight: '800', color: C.t600, letterSpacing: 0.3, textTransform: 'uppercase' },
  achTitle: { fontSize: isTablet ? 15 : 12, fontWeight: '700', lineHeight: isTablet ? 20 : 16 },
  achDesc: { fontSize: isTablet ? 12 : 10, color: C.muted, lineHeight: isTablet ? 17 : 13, marginTop: 1, minHeight: isTablet ? 34 : 26 },
  achProgress: { fontSize: isTablet ? 11 : 9, color: C.muted, fontWeight: '500', marginTop: 2 },

  weeklyKicker: { fontSize: isTablet ? 13 : 10, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  weeklyDates: { fontSize: isTablet ? 26 : 18, fontWeight: '800', color: '#fff', marginBottom: isTablet ? 18 : 14 },

  weekSection: { backgroundColor: C.card, borderRadius: isTablet ? 20 : 16, padding: isTablet ? 20 : 16, borderWidth: 1, borderColor: C.cardBorder, shadowColor: C.t500, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 5, elevation: 2 },
  weekSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  weekSectionTitle: { fontSize: isTablet ? 17 : 13, fontWeight: '700', color: C.ink },

  tripleLineGlyph: { gap: 3, justifyContent: 'center' },
  tripleLineA: { width: 14, height: 2, borderRadius: 1, backgroundColor: C.t500 },

  weekSubRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 11 },
  weekSubName: { width: isTablet ? 110 : 80, fontSize: isTablet ? 14 : 11, fontWeight: '600', color: C.sub },
  weekSubPct: { width: isTablet ? 46 : 34, fontSize: isTablet ? 14 : 11, fontWeight: '700', color: C.t500, textAlign: 'right' },

  weekListRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  weekListDash: { width: 12, height: 2, borderRadius: 1, backgroundColor: C.t500, marginTop: 9 },
  weekListText: { flex: 1, fontSize: isTablet ? 17 : 13, color: C.sub, lineHeight: isTablet ? 24 : 20 },

  goalsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  goalBlock: { backgroundColor: C.t100, borderRadius: isTablet ? 16 : 12, paddingHorizontal: isTablet ? 18 : 14, paddingVertical: isTablet ? 14 : 10 },
  goalBlockSub: { backgroundColor: C.t50, borderWidth: 1, borderColor: C.cardBorder },
  goalBlockVal: { fontSize: isTablet ? 24 : 18, fontWeight: '800', color: C.t600 },
  goalBlockLbl: { fontSize: isTablet ? 12 : 9, fontWeight: '600', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },

  emptyWrap: { alignItems: 'center', paddingTop: 40, paddingBottom: 20 },
  emptyGlyph: { gap: 6, alignItems: 'flex-start', marginBottom: 20 },
  emptyGlyphBar: { height: 5, borderRadius: 3, backgroundColor: C.t500 },
  emptyTitle: { fontSize: isTablet ? 22 : 17, fontWeight: '700', color: C.ink, marginBottom: 6 },
  emptyText: { fontSize: isTablet ? 16 : 13, color: C.sub, textAlign: 'center', lineHeight: isTablet ? 23 : 19, marginBottom: 20 },
  genBtn: { backgroundColor: C.t500, paddingHorizontal: 22, paddingVertical: 13, borderRadius: 13 },
  genBtnText: { fontSize: isTablet ? 18 : 14, fontWeight: '700', color: '#fff' },
});
