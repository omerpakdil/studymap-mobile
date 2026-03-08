import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useOnboardingV2 } from '@/app/(onboarding-v2)/state';
import { useAppAlert } from '@/app/components/ui/AppAlert';
import { getBlueprintByExamCode } from '@/app/data/examBlueprints';
import { getCountryByCode } from '@/app/data/countries';
import { resolveAppLanguage, t } from '@/app/i18n';
import { getLocalizedExamName } from '@/app/i18n/examNames';
import { buildFinalExamId, getBaseExamId, getExamTrackConfig, getExamTrackOptions, getTrackFromExamId, type TrackId } from '@/app/utils/examTrackUtils';
import {
  trackOnboardingStepBack,
  trackOnboardingStepContinue,
  trackOnboardingStepValidationFail,
  trackOnboardingStepView,
} from '@/app/utils/onboardingV2Analytics';

const C = {
  bg0: '#F0FDFB',
  bg1: '#ECFDF8',
  bg2: '#F3FFFE',
  bg3: '#FAFFFE',
  orbA: 'rgba(20,184,166,0.14)',
  orbB: 'rgba(52,211,153,0.10)',
  grid: 'rgba(0,0,0,0.028)',
  title: '#042F2E',
  sub: '#115E59',
  label: '#0F766E',
  labelMuted: 'rgba(15,118,110,0.45)',
  teal: '#0D9488',
  tealDark: '#0F766E',
  tealSoft: 'rgba(13,148,136,0.09)',
  tealBorder: 'rgba(13,148,136,0.20)',
  cardBg: '#FFFFFF',
  cardBorder: 'rgba(15,23,42,0.07)',
  cardTitle: '#0F172A',
  cardSub: '#64748B',
  selBg: 'rgba(13,148,136,0.08)',
  selBorder: '#0D9488',
  selTitle: '#042F2E',
  selSub: '#0F766E',
  backBg: 'rgba(0,0,0,0.04)',
  backBorder: 'rgba(0,0,0,0.06)',
  backArrow: '#0F766E',
  brand: '#0D9488',
  btnA: '#0D9488',
  btnB: '#0F766E',
  footer: 'rgba(240,253,251,0.95)',
  footerBorder: 'rgba(13,148,136,0.10)',
};

export default function OnboardingV2GoalTrackScreen() {
  const { showAlert } = useAppAlert();
  const { draft, updateDraft } = useOnboardingV2();
  const lang = resolveAppLanguage({
    countryDefaultLanguage: getCountryByCode(draft.countryCode)?.defaultLanguage ?? null,
  });
  const baseExamId = getBaseExamId(draft.examId);
  const trackConfig = useMemo(() => getExamTrackConfig(baseExamId), [baseExamId]);
  const trackOptions = useMemo(() => getExamTrackOptions(baseExamId), [baseExamId]);
  const entrance = useRef(new Animated.Value(0)).current;
  const ctaFade = useRef(new Animated.Value(0)).current;
  const ctaScale = useRef(new Animated.Value(1)).current;
  const orbPulse = useRef(new Animated.Value(0.92)).current;
  const selectedTrack = useMemo<TrackId | null>(() => getTrackFromExamId(draft.examId), [draft.examId]);

  useEffect(() => {
    void trackOnboardingStepView('goal_track');
    if (!trackOptions.length) {
      router.replace('/(onboarding-v2)/goal-exam');
      return;
    }
    Animated.loop(
      Animated.sequence([
        Animated.timing(orbPulse, { toValue: 1.08, duration: 3800, useNativeDriver: true }),
        Animated.timing(orbPulse, { toValue: 0.92, duration: 3800, useNativeDriver: true }),
      ])
    ).start();
    Animated.timing(entrance, { toValue: 1, duration: 440, useNativeDriver: true }).start();
    Animated.timing(ctaFade, { toValue: 1, duration: 440, delay: 260, useNativeDriver: true }).start();
  // mount only
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseExamId, trackOptions.length]);

  const applyTrack = (trackId: TrackId) => {
    const nextExamId = buildFinalExamId(baseExamId, trackId);
    const blueprint = getBlueprintByExamCode(nextExamId);
    const nextSubjectIntensity: Record<string, number> = {};

    blueprint?.subjects?.forEach((subject) => {
      const bias = subject.intensityBias ?? 0;
      nextSubjectIntensity[subject.label] = bias >= 0.12 ? 2 : bias <= -0.12 ? 0 : 1;
    });

    updateDraft({
      examId: nextExamId,
      examName: getLocalizedExamName(nextExamId, undefined, nextExamId),
      targetMetricType: 'score',
      targetValueRaw: '',
      targetValueNormalized: 0,
      targetScore: '',
      subjectIntensity: nextSubjectIntensity,
    });
  };

  const handleContinue = () => {
    if (!selectedTrack) {
      void trackOnboardingStepValidationFail('goal_track', ['examTrack'], 'Track selection required');
      showAlert(
        t(trackConfig?.alertTitleKey ?? 'onboarding.goal_exam.track_alert_title', { lang }),
        t(trackConfig?.alertBodyKey ?? 'onboarding.goal_exam.track_alert_body', { lang })
      );
      return;
    }
    void trackOnboardingStepContinue('goal_track', { track_id: selectedTrack, exam_id: draft.examId });
    router.push('/(onboarding-v2)/goal-date');
  };

  const pressIn = () => Animated.spring(ctaScale, { toValue: 0.97, damping: 20, stiffness: 400, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(ctaScale, { toValue: 1, damping: 18, stiffness: 360, useNativeDriver: true }).start();
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={[C.bg0, C.bg1, C.bg2, C.bg3]} locations={[0, 0.35, 0.7, 1]} style={StyleSheet.absoluteFill} />
      <Animated.View style={[styles.orbA, { backgroundColor: C.orbA, transform: [{ scale: orbPulse }] }]} />
      <View style={[styles.orbB, { backgroundColor: C.orbB }]} />

      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <View key={`v${i}`} style={{ position: 'absolute', top: 0, bottom: 0, left: `${i * 16.6}%`, width: StyleSheet.hairlineWidth, backgroundColor: C.grid }} />
        ))}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <View key={`h${i}`} style={{ position: 'absolute', left: 0, right: 0, top: `${i * 12.5}%`, height: StyleSheet.hairlineWidth, backgroundColor: C.grid }} />
        ))}
      </View>

      <Animated.View style={[styles.inner, { opacity: entrance }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: C.backBg, borderColor: C.backBorder }]}
            onPress={() => {
              void trackOnboardingStepBack('goal_track');
              router.back();
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.backArrow, { color: C.backArrow }]}>‹</Text>
          </TouchableOpacity>
          <View style={styles.brandRow}>
            <View style={[styles.brandMark, { backgroundColor: C.brand }]} />
            <Text style={[styles.brandText, { color: C.brand }]}>StudyMap</Text>
          </View>
          <View style={styles.backBtn} />
        </View>

        <View style={[styles.progressTrack, { backgroundColor: C.tealSoft }]}>
          <View style={[styles.progressFill, { width: '18%' }]}>
            <LinearGradient colors={[C.btnA, C.btnB]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
            <View style={styles.progressSheen} />
          </View>
        </View>
        <Text style={[styles.stepLabel, { color: C.labelMuted }]}>
          {t('common.step_of', { lang, params: { current: 3, total: 12 } })}
        </Text>

        <Text style={[styles.title, styles.titleCompact, { color: C.title }]}>
          {t(trackConfig?.titleKey ?? 'onboarding.goal_exam.track_title', { lang })}
        </Text>
        <Text style={[styles.sub, styles.subCompact, { color: C.sub }]}>
          {t(trackConfig?.subtitleKey ?? 'onboarding.goal_exam.track_subtitle_ayt', { lang })}
        </Text>
        <View style={styles.trackList}>
          {trackOptions.map((option, index) => {
            const trackId = option.id;
            const selected = selectedTrack === trackId;

            return (
              <TouchableOpacity
                key={option.examCode}
                style={[
                  styles.trackCard,
                  selected
                    ? { backgroundColor: C.selBg, borderColor: C.selBorder, borderWidth: 1.5 }
                    : { backgroundColor: C.cardBg, borderColor: C.cardBorder, borderWidth: 1 },
                ]}
                onPress={() => applyTrack(trackId)}
                activeOpacity={0.86}
              >
                {selected && (
                  <LinearGradient
                    colors={[C.btnA, C.btnB]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.trackAccent}
                  />
                )}
                <View style={styles.trackHeader}>
                  <Text style={[styles.trackIndex, { color: selected ? C.teal : C.labelMuted }]}>
                    {index + 1}
                  </Text>
                  {selected ? (
                    <View style={[styles.trackCheck, { backgroundColor: C.tealSoft, borderColor: C.tealBorder }]}>
                      <Text style={[styles.trackCheckText, { color: C.teal }]}>✓</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={[styles.trackName, { color: selected ? C.selTitle : C.cardTitle }]}>
                  {t(option?.labelKey ?? 'common.select', { lang })}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>

      <Animated.View style={[styles.footer, { backgroundColor: C.footer, borderTopColor: C.footerBorder, opacity: ctaFade }]}>
        <Animated.View style={{ transform: [{ scale: ctaScale }] }}>
          <TouchableOpacity
            style={[styles.cta, !selectedTrack && styles.ctaDisabled]}
            onPress={handleContinue}
            onPressIn={pressIn}
            onPressOut={pressOut}
            activeOpacity={1}
          >
            {!!selectedTrack && <LinearGradient colors={[C.btnA, C.btnB]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />}
            {!!selectedTrack && <View style={styles.ctaSheen} />}
            <Text style={[styles.ctaText, !selectedTrack && styles.ctaTextDisabled]}>
              {selectedTrack ? t('common.continue', { lang }) : t('common.select', { lang })}
            </Text>
            {!!selectedTrack && <Text style={styles.ctaArrow}>→</Text>}
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0FDFB' },
  orbA: { position: 'absolute', width: 280, height: 280, borderRadius: 999, top: -80, right: -110 },
  orbB: { position: 'absolute', width: 180, height: 180, borderRadius: 999, bottom: 180, left: -80 },
  inner: { flex: 1, paddingTop: 9, paddingHorizontal: 21 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  backBtn: { width: 36, height: 36, borderRadius: 11, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  backArrow: { fontSize: 26, fontWeight: '300', lineHeight: 30, marginTop: -1 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brandMark: { width: 7, height: 7, borderRadius: 2 },
  brandText: { fontSize: 14, fontWeight: '800', letterSpacing: 0.4 },
  progressTrack: { height: 3, borderRadius: 999, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', borderRadius: 999, overflow: 'hidden' },
  progressSheen: { position: 'absolute', top: 0, left: 0, right: 0, height: '50%', backgroundColor: 'rgba(255,255,255,0.28)' },
  stepLabel: { fontSize: 9, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12, opacity: 0.7 },
  title: { fontSize: 31, fontWeight: '900', lineHeight: 36, letterSpacing: -0.7, marginBottom: 7 },
  titleCompact: { fontSize: 28, lineHeight: 32, marginBottom: 5 },
  sub: { fontSize: 13, lineHeight: 20, fontWeight: '400', marginBottom: 18 },
  subCompact: { fontSize: 12, lineHeight: 18, marginBottom: 12 },
  trackList: { gap: 10, flex: 1 },
  trackCard: {
    minHeight: 96,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 11,
    overflow: 'hidden',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  trackAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 3 },
  trackHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  trackIndex: { fontSize: 13, fontWeight: '800' },
  trackCheck: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  trackCheckText: { fontSize: 12, fontWeight: '800' },
  trackName: { fontSize: 18, fontWeight: '900', letterSpacing: -0.3, lineHeight: 22 },
  footer: { paddingHorizontal: 21, paddingTop: 9, paddingBottom: 14, borderTopWidth: 1 },
  cta: {
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexDirection: 'row',
    gap: 8,
  },
  ctaDisabled: { backgroundColor: 'rgba(13,148,136,0.12)' },
  ctaSheen: { position: 'absolute', top: 0, left: 0, right: 0, height: '48%', backgroundColor: 'rgba(255,255,255,0.15)' },
  ctaText: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', letterSpacing: -0.3 },
  ctaTextDisabled: { color: 'rgba(15,118,110,0.45)' },
  ctaArrow: { color: '#FFFFFF', fontSize: 19, fontWeight: '900', marginTop: -1 },
});
