import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Clipboard,
  Dimensions,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppAlert } from '@/app/components/ui/AppAlert';
import { getLocaleTagForLanguage, resolveAppLanguage, t } from '@/app/i18n';
import { getLocalizedExamName } from '@/app/i18n/examNames';
import { formatHoursCompact } from '@/app/i18n/unitFormat';
import NotificationService from '@/app/utils/notificationService';
import { NotificationPreferences } from '@/app/utils/notifications';
import { clearOnboardingData, loadCompleteOnboardingData } from '@/app/utils/onboardingData';
import {
  getReferralStats,
  getReferralTrial,
  getReferralTrialDaysRemaining,
  registerUserWithReferralCode,
} from '@/app/utils/referralManager';
import {
  calculateWeeklyProgress,
  clearStudyProgramData,
  getProgramMetadata,
  getStudyStreak,
} from '@/app/utils/studyProgramStorage';

const { width } = Dimensions.get('window');
const isIOS = Platform.OS === 'ios';

const T = {
  bg:         '#F4FAFA',
  card:       '#FFFFFF',
  ink:        '#0A1628',
  sub:        '#4A6270',
  muted:      '#8FA8B2',
  border:     'rgba(15,157,140,0.12)',
  teal:       '#0F9D8C',
  tealDk:     '#0B7A6E',
  tealMid:    '#13B5A2',
  tealLt:     'rgba(15,157,140,0.09)',
  tealGlow:   'rgba(15,157,140,0.18)',
  glass:      'rgba(255,255,255,0.72)',
  track:      'rgba(148,163,184,0.18)',
};

const TERMS_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
const PRIVACY_URL = 'https://studymap-site.vercel.app/privacy.html';
const MANAGE_URL = 'https://apps.apple.com/account/subscriptions';
const APP_STORE_URL = process.env.EXPO_PUBLIC_APP_STORE_URL || 'https://apps.apple.com/app/id6748285218';

// ─── Stat Tile ───────────────────────────────────────────────────────────────
function StatTile({ value, label, delay = 0 }: { value: string; label: string; delay?: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    setTimeout(() => {
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 9 }).start();
    }, delay);
  }, []);
  return (
    <Animated.View style={[styles.statTile, { opacity: anim, transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }] }]}>
      <Text style={styles.statTileVal}>{value}</Text>
      <Text style={styles.statTileLbl}>{label}</Text>
    </Animated.View>
  );
}

// ─── Slim Toggle ─────────────────────────────────────────────────────────────
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: value ? 1 : 0, useNativeDriver: false, tension: 160, friction: 12 }).start();
  }, [value]);
  const bg  = anim.interpolate({ inputRange: [0, 1], outputRange: ['#D1DCE2', T.teal] });
  const tx  = anim.interpolate({ inputRange: [0, 1], outputRange: [2, 22] });
  return (
    <TouchableOpacity onPress={() => onChange(!value)} activeOpacity={0.85} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
      <Animated.View style={[styles.toggle, { backgroundColor: bg }]}>
        <Animated.View style={[styles.toggleThumb, { transform: [{ translateX: tx }] }]} />
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionLabel({ title }: { title: string }) {
  return (
    <View style={styles.sectionLabelRow}>
      <Text style={styles.sectionLabelText}>{title}</Text>
    </View>
  );
}

// ─── Setting Row ─────────────────────────────────────────────────────────────
function SettingRow({
  icon, title, subtitle, right, onPress, danger, last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
  last?: boolean;
}) {
  return (
    <>
      <TouchableOpacity
        style={styles.settingRow}
        onPress={onPress}
        activeOpacity={onPress ? 0.65 : 1}
        disabled={!onPress}
      >
        <View style={[styles.settingIconWrap, danger && styles.settingIconDanger]}>
          <Ionicons name={icon} size={16} color={danger ? '#E11D48' : T.teal} />
        </View>
        <View style={styles.settingBody}>
          <Text style={[styles.settingTitle, danger && { color: '#E11D48' }]}>{title}</Text>
          {subtitle ? <Text style={styles.settingSubtitle}>{subtitle}</Text> : null}
        </View>
        {right ?? (onPress ? <Ionicons name="chevron-forward" size={14} color={T.muted} /> : null)}
      </TouchableOpacity>
      {!last && <View style={styles.rowLine} />}
    </>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const { showAlert } = useAppAlert();
  const router = useRouter();
  const appLang = resolveAppLanguage();
  const appLocale = getLocaleTagForLanguage(appLang);
  const tp = (key: string, fallback: string, params?: Record<string, string | number>) =>
    t(`tabs.profile.${key}`, { lang: appLang, fallback, params });
  const appVersion = Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? '2.0.0';
  const appBuild = Constants.expoConfig?.ios?.buildNumber ?? Constants.nativeBuildVersion ?? '35';

  const [programMetadata, setProgramMetadata]   = useState<any>(null);
  const [onboardingData,  setOnboardingData]     = useState<any>(null);
  const [studyStreak,     setStudyStreak]        = useState(0);
  const [weeklyProgress,  setWeeklyProgress]     = useState({ completed: 0, total: 0, hours: 0 });
  const [loading,         setLoading]            = useState(true);
  const [userInfo,        setUserInfo]           = useState<any>(null);

  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    studyReminders: false,
    planSummaries: false,
    progressNudges: false,
    premiumUpdates: false,
    referralUpdates: false,
    breakReminders: false,
    quietHoursStart: '21:30',
    quietHoursEnd: '07:30',
    preferredStudyTime: '09:00',
    upcomingLeadMinutes: 15,
    recoveryDelayMinutes: 45,
    dailyWrapTime: '20:15',
    weeklyPlanDay: 1,
    weeklyPlanTime: '18:00',
  });
  const [privacySettings, setPrivacySettings] = useState({
    analytics: false, dataSharing: false, marketing: false,
  });

  const [referralCode,      setReferralCode]       = useState<string | null>(null);
  const [referralStats,     setReferralStats]       = useState({ totalReferrals: 0, successfulReferrals: 0, totalDaysEarned: 0 });
  const [referralTrial,     setReferralTrial]       = useState<any>(null);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState(0);

  const [showStudyTimeModal, setShowStudyTimeModal] = useState(false);
  const [showDeleteModal,    setShowDeleteModal]    = useState(false);
  const [pendingStudyTime,   setPendingStudyTime]   = useState('09:00');

  const scrollY    = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const loadUserData = async (isInitialLoad = false) => {
    try {
      setLoading(true);
      if (isInitialLoad) {
        const hasPerm = NotificationService.hasNotificationPermission();
        if (!hasPerm) await NotificationService.initialize();
      }
      const uStr = await AsyncStorage.getItem('user_info');
      if (uStr) setUserInfo(JSON.parse(uStr));

      const [metadata, onboarding, streak, weekly] = await Promise.all([
        getProgramMetadata(), loadCompleteOnboardingData(), getStudyStreak(), calculateWeeklyProgress(),
      ]);
      setProgramMetadata(metadata);
      setOnboardingData(onboarding);
      setStudyStreak(streak);
      setWeeklyProgress(weekly);

      const prefs = await NotificationService.loadPreferences();
      setNotificationPrefs(prefs);

      const ps = await AsyncStorage.getItem('privacy_settings');
      if (ps) setPrivacySettings(JSON.parse(ps));

      const code  = await registerUserWithReferralCode();
      setReferralCode(code);
      const stats = await getReferralStats();
      setReferralStats(stats);
      const trial = await getReferralTrial();
      setReferralTrial(trial);
      if (trial?.isActive) setTrialDaysRemaining(await getReferralTrialDaysRemaining());
    } catch (e) {
      console.error('Profile load error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUserData(true); }, []);
  useFocusEffect(useCallback(() => { loadUserData(false); }, []));

  const updateNotificationPref = async <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    setNotificationPrefs(p => ({ ...p, [key]: value }));
    const next = await NotificationService.updatePreferences({ [key]: value });
    setNotificationPrefs(next);
  };
  const updatePrivacy = async (key: string, value: boolean) => {
    const next = { ...privacySettings, [key]: value };
    setPrivacySettings(next as any);
    await AsyncStorage.setItem('privacy_settings', JSON.stringify(next));
  };

  const handleDeleteAccount = async () => {
    await clearOnboardingData();
    await clearStudyProgramData();
    await AsyncStorage.multiRemove([
      'user_info',
      'reminder_settings',
      'privacy_settings',
      'notification_preferences_v1',
      'scheduled_local_notifications_v1',
    ]);
    showAlert(
      tp('alert_deleted_title', 'Account Deleted'),
      tp('alert_deleted_body', 'All data removed. Please restart the app.')
    );
  };

  const allTimes = Array.from({ length: 48 }, (_, i) => {
    const h = Math.floor(i / 2).toString().padStart(2, '0');
    const m = i % 2 === 0 ? '00' : '30';
    return `${h}:${m}`;
  });

  if (loading || !programMetadata || !onboardingData) {
    return (
      <View style={styles.loadWrap}>
        <LinearGradient colors={[T.bg, '#E8F6F2']} style={StyleSheet.absoluteFill} />
        <LinearGradient colors={[T.tealDk, T.tealMid]} style={styles.loadOrb} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <ActivityIndicator size="large" color="#fff" />
        </LinearGradient>
        <Text style={styles.loadTitle}>{tp('loading_title', 'Loading profile...')}</Text>
        <Text style={styles.loadSub}>{tp('loading_subtitle', 'Just a moment')}</Text>
      </View>
    );
  }

  const initials = (() => {
    const first = (userInfo?.firstName || '').trim();
    const last = (userInfo?.lastName || '').trim();
    if (first) return `${first[0]}${last ? last[0] : ''}`.toUpperCase();

    const full = (userInfo?.fullName || '').trim();
    if (full) {
      const parts = full.split(/\s+/).filter(Boolean);
      const a = parts[0]?.[0] || '';
      const b = parts[1]?.[0] || '';
      if (a || b) return `${a}${b}`.toUpperCase();
    }

    const email = (userInfo?.email || '').trim();
    if (email) return email[0].toUpperCase();

    return 'SM';
  })();
  const examType = getLocalizedExamName(programMetadata?.examType, appLang, programMetadata?.examType || 'EXAM');
  const daysLeft   = programMetadata?.daysRemaining || 0;
  const examStatusText = (() => {
    const passed: Record<string, string> = {
      en: 'Exam passed',
      tr: 'Sınav geçti',
      de: 'Prüfung vorbei',
      fr: 'Examen passé',
      ja: '試験終了',
      ko: '시험 종료',
      'zh-Hans': '考试已过',
      ar: 'انتهى الاختبار',
      hi: 'परीक्षा गुजर गई',
      id: 'Ujian lewat',
      'pt-BR': 'Prova passada',
    };

    if (daysLeft < 0) return passed[appLang] ?? passed.en;
    return tp('days_left_short', `${daysLeft}d left`, { days: daysLeft });
  })();
  const totalTasks = programMetadata?.completedTasks || 0;
  // Header parallax
  const heroScale = scrollY.interpolate({ inputRange: [-60, 0, 60], outputRange: [1.08, 1, 0.94], extrapolate: 'clamp' });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Ambient BG */}
      <LinearGradient colors={[T.bg, '#EAF6F4', '#F4FAFA']} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} />
      <View style={styles.orbA} />
      <View style={styles.orbB} />

      {/* ── Top bar ── */}
      <Animated.View style={[styles.topBar, { opacity: headerAnim }]}>
        <View>
          <Text style={styles.topKicker}>{tp('top_kicker', 'StudyMap')}</Text>
          <Text style={styles.topTitle}>{tp('top_title', 'Profile')}</Text>
        </View>
        <TouchableOpacity
          style={styles.editChip}
          onPress={() => router.push('/profile/edit')}
          activeOpacity={0.75}
        >
          <Ionicons name="pencil-outline" size={13} color={T.teal} />
          <Text style={styles.editChipText}>{tp('edit_button', 'Edit')}</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
      >
        {/* ── Hero Identity ── */}
        <Animated.View style={{ transform: [{ scale: heroScale }] }}>
          <View style={styles.heroCard}>
            <LinearGradient
              colors={['#0C7A6E', '#0F9D8C', '#18C4AF']}
              style={styles.heroGrad}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              {/* Decorative rings */}
              <View style={styles.heroRingA} />
              <View style={styles.heroRingB} />
              <View style={styles.heroRingC} />

              {/* Top row: avatar + info */}
              <View style={styles.heroIdentity}>
                <View style={styles.avatarWrap}>
                  <View style={styles.avatarRingOuter}>
                    <View style={styles.avatarInner}>
                      <Text style={styles.avatarInitials}>{initials}</Text>
                    </View>
                  </View>
                  <View style={styles.avatarBadge}>
                    <View style={styles.avatarBadgeDot} />
                  </View>
                </View>

                <View style={styles.heroMeta}>
                  <Text style={styles.heroName}>{userInfo?.fullName || tp('study_buddy', 'Study Buddy')}</Text>
                  <Text style={styles.heroEmail}>{userInfo?.email || ''}</Text>
                  <View style={styles.examChipRow}>
                    <View style={[styles.examChip, styles.examChipPrimary]}>
                      <Text style={styles.examChipText} numberOfLines={2}>{examType}</Text>
                    </View>
                    <View style={styles.examChip}>
                      <Text style={styles.examChipText}>{examStatusText}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Stats strip */}
              <View style={styles.statsStrip}>
                <StatTile value={`${studyStreak}`}                   label={tp('streak', 'Streak')}   delay={0} />
                <View style={styles.statsDiv} />
                <StatTile value={`${totalTasks}`}                    label={tp('sessions', 'Sessions')} delay={80} />
                <View style={styles.statsDiv} />
                <StatTile value={formatHoursCompact(Math.round(weeklyProgress.hours), appLang)} label={tp('this_week', 'This week')} delay={160} />
              </View>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* ── Referral Trial Banner ── */}
        {referralTrial?.isActive && (
          <View style={styles.trialBanner}>
            <View style={[styles.trialIcon, { backgroundColor: 'rgba(22,163,74,0.12)' }]}>
              <Ionicons name="gift-outline" size={15} color="#16A34A" />
            </View>
            <Text style={styles.trialText}>
              {tp('trial_active', 'Premium trial active')} · <Text style={{ fontWeight: '800', color: '#166534' }}>
                {tp('trial_days_left', '{days} days left', { days: trialDaysRemaining })}
              </Text>
            </Text>
          </View>
        )}

        {/* ── Referral ── */}
        <View style={styles.block}>
          <SectionLabel title={tp('section_invite', 'Invite & Earn')} />

          <View style={styles.referralCard}>
            <LinearGradient colors={['#0B7A6E', '#0F9D8C']} style={styles.referralGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <View style={styles.referralGradOrb} />
              <Text style={styles.referralLabel}>{tp('your_referral_code', 'Your Referral Code')}</Text>
              <Text style={styles.referralCode}>{referralCode || '——'}</Text>
              <Text style={styles.referralHint}>{tp('referral_hint', 'Friends get 7 days of premium for free')}</Text>
              <View style={styles.referralActions}>
                <TouchableOpacity
                  style={styles.referralBtn}
                  onPress={() => {
                    Clipboard.setString(referralCode ?? '');
                    showAlert(
                      tp('copied_title', 'Copied!'),
                      tp('copied_body', 'Code "{code}" copied.', { code: referralCode ?? '' })
                    );
                  }}
                >
                  <Ionicons name="copy-outline" size={13} color="#fff" />
                  <Text style={styles.referralBtnText}>{tp('copy', 'Copy')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.referralBtn}
                  onPress={() => {
                    const message = tp(
                      'share_body',
                      'Use my code "{code}" for 7 days free on StudyMap! {url}',
                      { code: referralCode ?? '', url: APP_STORE_URL }
                    );
                    void Share.share({ message });
                  }}
                >
                  <Ionicons name="share-outline" size={13} color="#fff" />
                  <Text style={styles.referralBtnText}>{tp('share', 'Share')}</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>

            {/* Stat row */}
            <View style={styles.referralStats}>
              {[
                { val: referralStats.totalReferrals,      lbl: tp('invited', 'Invited') },
                { val: referralStats.successfulReferrals, lbl: tp('subscribed', 'Subscribed') },
                { val: referralStats.totalDaysEarned,     lbl: tp('days_earned', 'Days Earned') },
              ].map((s, i) => (
                <View key={i} style={[styles.refStat, i > 0 && styles.refStatBorder]}>
                  <Text style={styles.refStatVal}>{s.val}</Text>
                  <Text style={styles.refStatLbl}>{s.lbl}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ── Study Preferences ── */}
        <View style={styles.block}>
          <SectionLabel title={tp('section_study_preferences', 'Study Preferences')} />
          <View style={styles.settingsCard}>
            <SettingRow
              icon="options-outline"
              title={tp('focus_weights', 'Focus Weights')}
              subtitle={tp('focus_weights_sub', 'Adjust subject priority')}
              onPress={() => router.push('/profile/focus')}
            />
            <SettingRow
              icon="notifications-outline"
              title={tp('daily_reminders', 'Study Reminders')}
              subtitle={tp('daily_reminders_sub', 'Reminders before and at your study blocks')}
              right={<Toggle value={notificationPrefs.studyReminders} onChange={v => updateNotificationPref('studyReminders', v)} />}
            />
            <SettingRow
              icon="time-outline"
              title={tp('study_time', 'Study Time')}
              subtitle={tp('study_time_sub', 'Primary reminder time: {time}', { time: notificationPrefs.preferredStudyTime })}
              onPress={() => { setPendingStudyTime(notificationPrefs.preferredStudyTime); setShowStudyTimeModal(true); }}
              last
            />
          </View>
        </View>

        {/* ── Notifications ── */}
        <View style={styles.block}>
          <SectionLabel title={tp('section_notifications', 'Notifications')} />
          <View style={styles.settingsCard}>
            <SettingRow
              icon="cafe-outline"
              title={tp('break_reminders', 'Break Reminders')}
              subtitle={tp('break_reminders_sub', 'Pomodoro break alerts')}
              right={<Toggle value={notificationPrefs.breakReminders} onChange={v => updateNotificationPref('breakReminders', v)} />}
            />
            <SettingRow
              icon="bar-chart-outline"
              title={tp('weekly_reports', 'Plan Summaries')}
              subtitle={tp('weekly_reports_sub', 'Daily wrap-ups and refreshed weekly schedule updates')}
              right={<Toggle value={notificationPrefs.planSummaries} onChange={v => updateNotificationPref('planSummaries', v)} />}
            />
            <SettingRow
              icon="star-outline"
              title={tp('motivational_quotes', 'Progress Nudges')}
              subtitle={tp('motivational_quotes_sub', 'Catch-up nudges when you drift off plan')}
              right={<Toggle value={notificationPrefs.progressNudges} onChange={v => updateNotificationPref('progressNudges', v)} />}
            />
            <SettingRow
              icon="card-outline"
              title={tp('premium_updates', 'Premium Updates')}
              subtitle={tp('premium_updates_sub', 'Trial, billing and subscription status')}
              right={<Toggle value={notificationPrefs.premiumUpdates} onChange={v => updateNotificationPref('premiumUpdates', v)} />}
            />
            <SettingRow
              icon="gift-outline"
              title={tp('referral_updates', 'Referral Updates')}
              subtitle={tp('referral_updates_sub', 'Rewards and referral status changes')}
              right={<Toggle value={notificationPrefs.referralUpdates} onChange={v => updateNotificationPref('referralUpdates', v)} />}
              last
            />
          </View>
        </View>

        {/* ── Privacy ── */}
        <View style={styles.block}>
          <SectionLabel title={tp('section_privacy', 'Privacy & Data')} />
          <View style={styles.settingsCard}>
            <SettingRow
              icon="trending-up-outline"
              title={tp('usage_analytics', 'Usage Analytics')}
              subtitle={tp('usage_analytics_sub', 'Help improve the app')}
              right={<Toggle value={privacySettings.analytics} onChange={v => updatePrivacy('analytics', v)} />}
            />
            <SettingRow
              icon="people-outline"
              title={tp('data_sharing', 'Data Sharing')}
              subtitle={tp('data_sharing_sub', 'Share with partners')}
              right={<Toggle value={privacySettings.dataSharing} onChange={v => updatePrivacy('dataSharing', v)} />}
            />
            <SettingRow
              icon="mail-outline"
              title={tp('marketing_emails', 'Marketing Emails')}
              subtitle={tp('marketing_emails_sub', 'Tips and updates')}
              right={<Toggle value={privacySettings.marketing} onChange={v => updatePrivacy('marketing', v)} />}
              last
            />
          </View>
        </View>

        {/* ── Account ── */}
        <View style={styles.block}>
          <SectionLabel title={tp('section_account', 'Account')} />
          <View style={styles.settingsCard}>
            <SettingRow
              icon="card-outline"
              title={tp('manage_subscription', 'Manage Subscription')}
              subtitle={tp('manage_subscription_sub', 'Update or cancel your plan')}
              onPress={() => Linking.openURL(MANAGE_URL).catch(() => {})}
            />
            <SettingRow
              icon="help-circle-outline"
              title={tp('help_support', 'Help & Support')}
              subtitle="callousity@gmail.com"
              onPress={() => showAlert(
                tp('support_title', 'Support'),
                tp('support_body', 'Email us at callousity@gmail.com'),
                [
                  { text: tp('email', 'Email'), onPress: () => Linking.openURL('mailto:callousity@gmail.com').catch(() => {}) },
                  { text: tp('cancel', 'Cancel'), style: 'cancel' },
                ]
              )}
            />
            <SettingRow
              icon="star-half-outline"
              title={tp('rate_studymap', 'Rate StudyMap')}
              subtitle={tp('rate_studymap_sub', 'Share your feedback')}
              onPress={() => showAlert(
                tp('rate_studymap', 'Rate StudyMap'),
                tp('rate_prompt', 'Enjoying the app?'),
                [
                  { text: tp('maybe_later', 'Maybe Later'), style: 'cancel' },
                  { text: tp('rate_now', 'Rate Now'), onPress: () => Linking.openURL(APP_STORE_URL).catch(() => {}) },
                ]
              )}
            />
            {__DEV__ && (
              <SettingRow
                icon="refresh-circle-outline"
                title={tp('reset_app_data_dev', 'Reset App Data (Dev)')}
                onPress={async () => { await AsyncStorage.clear(); router.replace('/(onboarding-v2)/animated-splash'); }}
              />
            )}
            <SettingRow
              icon="trash-outline"
              title={tp('delete_account', 'Delete Account')}
              subtitle={tp('delete_account_sub', 'Permanently remove all data')}
              onPress={() => setShowDeleteModal(true)}
              danger
              last
            />
          </View>
        </View>

        {/* ── App Info ── */}
        <View style={styles.appInfoRow}>
          <LinearGradient colors={[T.tealDk, T.tealMid]} style={styles.appLogo} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Ionicons name="book" size={17} color="#fff" />
          </LinearGradient>
          <View>
            <Text style={styles.appInfoName}>{tp('app_name', 'StudyMap')}</Text>
            <Text style={styles.appInfoVer}>
              {tp('app_version', `Version ${appVersion} · Build ${appBuild}`, { version: appVersion, build: appBuild })}
            </Text>
          </View>
          <View style={styles.appInfoBadge}>
            <Text style={styles.appInfoBadgeText}>{tp('latest', 'Latest')}</Text>
          </View>
        </View>

        {/* ── Legal ── */}
        <View style={styles.legalRow}>
          <TouchableOpacity onPress={() => Linking.openURL(TERMS_URL).catch(() => {})}>
            <Text style={styles.legalLink}>{tp('terms_of_use', 'Terms of Use')}</Text>
          </TouchableOpacity>
          <View style={styles.legalDot} />
          <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_URL).catch(() => {})}>
            <Text style={styles.legalLink}>{tp('privacy_policy', 'Privacy Policy')}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.memberSince}>
          {tp('member_since', 'Member since')} {new Date(programMetadata?.createdAt || Date.now()).toLocaleDateString(appLocale, { year: 'numeric', month: 'long' })}
        </Text>

        <View style={{ height: isIOS ? 110 : 92 }} />
      </Animated.ScrollView>

      {/* ── Study Time Modal ── */}
      <Modal visible={showStudyTimeModal} transparent animationType="fade" onRequestClose={() => setShowStudyTimeModal(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowStudyTimeModal(false)}>
          <Pressable style={[styles.sheet, { maxHeight: '76%' }]}>
            <View style={styles.sheetPill} />
            <Text style={styles.sheetTitle}>{tp('study_time', 'Study Time')}</Text>
            <Text style={styles.sheetSub}>{tp('study_time_modal_sub', 'Choose your daily reminder time')}</Text>
            <ScrollView style={{ maxHeight: 260, marginTop: 16 }} showsVerticalScrollIndicator={false}>
              <View style={styles.timeGrid}>
                {allTimes.map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.timeCell, pendingStudyTime === t && styles.timeCellSel]}
                    onPress={() => setPendingStudyTime(t)}
                  >
                    <Text style={[styles.timeCellText, pendingStudyTime === t && { color: '#fff' }]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <View style={styles.sheetBtns}>
              <TouchableOpacity style={styles.sheetCancel2} onPress={() => setShowStudyTimeModal(false)}>
                <Text style={styles.sheetCancelText}>{tp('cancel', 'Cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sheetSave} onPress={() => { void updateNotificationPref('preferredStudyTime', pendingStudyTime); setShowStudyTimeModal(false); }}>
                <Text style={styles.sheetSaveText}>{tp('save', 'Save')}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Delete Modal ── */}
      <Modal visible={showDeleteModal} transparent animationType="fade" onRequestClose={() => setShowDeleteModal(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowDeleteModal(false)}>
          <Pressable style={styles.sheet}>
            <View style={styles.sheetPill} />
            <View style={styles.deleteIcon}>
              <Ionicons name="warning-outline" size={26} color="#E11D48" />
            </View>
            <Text style={[styles.sheetTitle, { color: '#E11D48', marginTop: 12 }]}>{tp('delete_account', 'Delete Account')}</Text>
            <Text style={styles.sheetSub}>{tp('delete_modal_sub', 'This permanently removes all your data and cannot be undone.')}</Text>
            <View style={styles.deleteList}>
              {[
                tp('delete_item_1', 'Study progress & achievements'),
                tp('delete_item_2', 'Personal information'),
                tp('delete_item_3', 'Schedules & reminders'),
              ].map(item => (
                <View key={item} style={styles.deleteListRow}>
                  <View style={styles.deleteListDot} />
                  <Text style={styles.deleteListText}>{item}</Text>
                </View>
              ))}
            </View>
            <View style={styles.sheetBtns}>
              <TouchableOpacity style={styles.sheetCancel2} onPress={() => setShowDeleteModal(false)}>
                <Text style={styles.sheetCancelText}>{tp('cancel', 'Cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => {
                  setShowDeleteModal(false);
                  showAlert(tp('final_confirmation', 'Final Confirmation'), tp('final_confirmation_sub', 'Are you absolutely sure?'), [
                    { text: tp('cancel', 'Cancel'), style: 'cancel' },
                    { text: tp('delete_forever', 'Delete Forever'), style: 'destructive', onPress: handleDeleteAccount },
                  ]);
                }}
              >
                <Text style={styles.deleteBtnText}>{tp('delete', 'Delete')}</Text>
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
  container:  { flex: 1, backgroundColor: T.bg },
  orbA: { position: 'absolute', width: 280, height: 280, borderRadius: 140, top: -100, right: -120, backgroundColor: 'rgba(19,181,162,0.10)' },
  orbB: { position: 'absolute', width: 200, height: 200, borderRadius: 100, bottom: 160, left: -100, backgroundColor: 'rgba(15,157,140,0.07)' },

  loadWrap:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadOrb:   { width: 76, height: 76, borderRadius: 38, justifyContent: 'center', alignItems: 'center', marginBottom: 20, shadowColor: T.teal, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.32, shadowRadius: 16, elevation: 10 },
  loadTitle: { fontSize: 19, fontWeight: '700', color: T.ink, marginBottom: 4 },
  loadSub:   { fontSize: 13, color: T.sub },

  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 22, paddingTop: isIOS ? 6 : 14, paddingBottom: 12,
  },
  topKicker:    { fontSize: 10, fontWeight: '700', color: T.muted, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 3 },
  topTitle:     { fontSize: 24, fontWeight: '800', color: T.ink, letterSpacing: -0.4 },
  editChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: T.tealLt, borderRadius: 22, paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: T.border,
  },
  editChipText: { fontSize: 13, fontWeight: '700', color: T.teal },

  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 4 },

  // Hero
  heroCard: {
    borderRadius: 24, overflow: 'hidden', marginBottom: 14,
    shadowColor: T.tealDk, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.22, shadowRadius: 20, elevation: 14,
  },
  heroGrad: { padding: 22, paddingBottom: 0, overflow: 'hidden' },

  heroRingA: { position: 'absolute', width: 220, height: 220, borderRadius: 110, top: -90, right: -70, borderWidth: 40, borderColor: 'rgba(255,255,255,0.06)' },
  heroRingB: { position: 'absolute', width: 160, height: 160, borderRadius: 80, top: -30, right: 40, borderWidth: 20, borderColor: 'rgba(255,255,255,0.05)' },
  heroRingC: { position: 'absolute', width: 100, height: 100, borderRadius: 50, bottom: 10, left: -20, borderWidth: 15, borderColor: 'rgba(255,255,255,0.07)' },

  heroIdentity: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, marginBottom: 22 },

  avatarWrap:       { position: 'relative' },
  avatarRingOuter:  { width: 66, height: 66, borderRadius: 33, padding: 3, backgroundColor: 'rgba(255,255,255,0.25)' },
  avatarInner:      { flex: 1, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.94)', justifyContent: 'center', alignItems: 'center' },
  avatarInitials:   { fontSize: 24, fontWeight: '800', color: T.tealDk },
  avatarBadge:      { position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: '#22C55E', borderWidth: 2.5, borderColor: T.tealDk, justifyContent: 'center', alignItems: 'center' },
  avatarBadgeDot:   { width: 5, height: 5, borderRadius: 3, backgroundColor: '#fff' },

  heroMeta:       { flex: 1, paddingTop: 4 },
  heroName:       { fontSize: 19, fontWeight: '800', color: '#fff', marginBottom: 3, letterSpacing: -0.2 },
  heroEmail:      { fontSize: 12, color: 'rgba(255,255,255,0.72)', marginBottom: 9 },
  examChipRow:    { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: 6, alignSelf: 'flex-start', maxWidth: '100%' },
  examChip:       { backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start', maxWidth: '100%' },
  examChipPrimary:{ maxWidth: '100%' },
  examChipText:   { fontSize: 11, fontWeight: '700', color: '#fff', flexShrink: 1 },

  statsStrip: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.14)', paddingVertical: 14, paddingHorizontal: 6, marginHorizontal: -22, marginTop: 4 },
  statsDiv:   { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  statTile:   { flex: 1, alignItems: 'center' },
  statTileVal: { fontSize: 21, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  statTileLbl: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.68)', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.4 },

  // Trial banner
  trialBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F0FDF4', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11,
    marginBottom: 14, borderWidth: 1, borderColor: 'rgba(22,163,74,0.2)',
  },
  trialIcon: { width: 30, height: 30, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  trialText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#166534' },

  // Block / sections
  block: { marginBottom: 14 },

  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, marginBottom: 8 },
  sectionLabelText: { fontSize: 11, fontWeight: '700', color: T.muted, textTransform: 'uppercase', letterSpacing: 0.9 },

  // Referral card
  referralCard: {
    borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: T.border,
    shadowColor: T.tealDk, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.14, shadowRadius: 12, elevation: 6,
  },
  referralGrad: { padding: 20, overflow: 'hidden' },
  referralGradOrb: { position: 'absolute', width: 150, height: 150, borderRadius: 75, right: -40, top: -40, backgroundColor: 'rgba(255,255,255,0.07)' },
  referralLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  referralCode:  { fontSize: 38, fontWeight: '900', color: '#fff', letterSpacing: 7, marginBottom: 6 },
  referralHint:  { fontSize: 12, color: 'rgba(255,255,255,0.72)', marginBottom: 16, lineHeight: 17 },
  referralActions: { flexDirection: 'row', gap: 10 },
  referralBtn:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 38, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.18)' },
  referralBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  referralStats: { flexDirection: 'row', backgroundColor: T.card },
  refStat: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  refStatBorder: { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: T.border },
  refStatVal: { fontSize: 20, fontWeight: '900', color: T.ink, marginBottom: 2 },
  refStatLbl: { fontSize: 10, fontWeight: '600', color: T.muted, textTransform: 'uppercase', letterSpacing: 0.4 },

  // Settings card
  settingsCard: {
    backgroundColor: T.card, borderRadius: 18, borderWidth: 1, borderColor: T.border, overflow: 'hidden',
    shadowColor: T.teal, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  settingRow:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 13 },
  settingIconWrap:  { width: 34, height: 34, borderRadius: 10, backgroundColor: T.tealLt, justifyContent: 'center', alignItems: 'center' },
  settingIconDanger:{ backgroundColor: 'rgba(225,29,72,0.10)' },
  settingBody:      { flex: 1 },
  settingTitle:     { fontSize: 14, fontWeight: '700', color: T.ink },
  settingSubtitle:  { fontSize: 12, color: T.muted, marginTop: 1.5, fontWeight: '500' },
  rowLine:          { height: StyleSheet.hairlineWidth, backgroundColor: T.border, marginLeft: 63 },

  // Toggle
  toggle: { width: 48, height: 26, borderRadius: 13, justifyContent: 'center' },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.16, shadowRadius: 2, elevation: 2 },

  // App info
  appInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 13, backgroundColor: T.card, borderRadius: 16, borderWidth: 1, borderColor: T.border, padding: 15, marginBottom: 12 },
  appLogo: { width: 40, height: 40, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  appInfoName: { fontSize: 14, fontWeight: '800', color: T.ink, marginBottom: 2 },
  appInfoVer:  { fontSize: 11, color: T.muted, fontWeight: '500' },
  appInfoBadge: { marginLeft: 'auto', backgroundColor: T.tealLt, borderRadius: 7, paddingHorizontal: 9, paddingVertical: 3, borderWidth: 1, borderColor: T.border },
  appInfoBadgeText: { fontSize: 11, fontWeight: '700', color: T.teal },

  // Legal
  legalRow:    { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16, marginBottom: 8 },
  legalLink:   { fontSize: 12, fontWeight: '600', color: T.muted },
  legalDot:    { width: 3, height: 3, borderRadius: 2, backgroundColor: T.muted },
  memberSince: { textAlign: 'center', fontSize: 12, color: T.muted, fontStyle: 'italic', marginBottom: 8 },

  // Overlay / sheet
  overlay: { flex: 1, backgroundColor: 'rgba(5,15,25,0.45)', justifyContent: 'flex-end', padding: 14 },
  sheet: {
    backgroundColor: '#fff', borderRadius: 24, padding: 22,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 14,
  },
  sheetPill:     { width: 34, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', alignSelf: 'center', marginBottom: 18 },
  sheetTitle:    { fontSize: 18, fontWeight: '800', color: T.ink, textAlign: 'center', marginBottom: 4 },
  sheetSub:      { fontSize: 13, color: T.sub, textAlign: 'center', lineHeight: 18 },
  sheetCancel:   { marginTop: 12, height: 46, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  sheetCancelText: { fontSize: 14, fontWeight: '700', color: T.sub },
  sheetBtns:     { flexDirection: 'row', gap: 10, marginTop: 16 },
  sheetCancel2:  { flex: 1, height: 46, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  sheetSave:     { flex: 1, height: 46, borderRadius: 12, backgroundColor: T.teal, justifyContent: 'center', alignItems: 'center' },
  sheetSaveText: { fontSize: 14, fontWeight: '800', color: '#fff' },

  // Freq options
  freqOpt:      { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1.5, borderColor: T.border, backgroundColor: '#F8FAFC', padding: 14 },
  freqOptSel:   { backgroundColor: T.teal, borderColor: T.teal },
  freqOptLabel: { fontSize: 14, fontWeight: '700', color: T.ink },
  freqOptSub:   { fontSize: 12, color: T.muted, marginTop: 1 },
  freqSelPill:  { backgroundColor: 'rgba(255,255,255,0.20)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.30)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  freqSelText:  { fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 0.3, textTransform: 'uppercase' },

  // Time grid
  timeGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', paddingVertical: 4 },
  timeCell:      { width: 66, height: 36, borderRadius: 10, borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  timeCellSel:   { backgroundColor: T.teal, borderColor: T.teal },
  timeCellText:  { fontSize: 13, fontWeight: '600', color: T.ink },

  // Delete
  deleteIcon:     { width: 58, height: 58, borderRadius: 29, backgroundColor: 'rgba(225,29,72,0.10)', justifyContent: 'center', alignItems: 'center', alignSelf: 'center' },
  deleteList:     { backgroundColor: '#FFF1F2', borderRadius: 12, padding: 14, marginTop: 14, gap: 7 },
  deleteListRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  deleteListDot:  { width: 5, height: 5, borderRadius: 3, backgroundColor: '#E11D48' },
  deleteListText: { fontSize: 13, color: '#9F1239', fontWeight: '500' },
  deleteBtn:      { flex: 1, height: 46, borderRadius: 12, backgroundColor: '#E11D48', justifyContent: 'center', alignItems: 'center' },
  deleteBtnText:  { fontSize: 14, fontWeight: '800', color: '#fff' },
});
