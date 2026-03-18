/**
 * goal-exam.tsx — "Pick Your Target"
 *
 * Light teal-washed variant. Fully self-contained.
 * Editorial header, clean exam selection grid with animated
 * selection state, selected detail card that slides in.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import {
    Animated,
    Dimensions,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';

import { useOnboardingV2 } from '@/app/(onboarding-v2)/state';
import { ONBOARDING_FOOTER_METRICS as FOOTER } from '@/app/components/onboarding-v2/footerMetrics';
import { useAppAlert } from '@/app/components/ui/AppAlert';
import { availableExams } from '@/app/data';
import { getCountryByCode } from '@/app/data/countries';
import { getBlueprintByExamCode } from '@/app/data/examBlueprints';
import { getGlobalExamCatalogForCountry, getPrimaryExamCatalogForCountry } from '@/app/data/examCatalogByCountry';
import { resolveAppLanguage, t } from '@/app/i18n';
import { getLocalizedExamName } from '@/app/i18n/examNames';
import { examRequiresTrack, getBaseExamId, getExamTrackConfig, getTrackFromExamId } from '@/app/utils/examTrackUtils';
import {
    trackOnboardingStepBack,
    trackOnboardingStepContinue,
    trackOnboardingStepValidationFail,
    trackOnboardingStepView,
} from '@/app/utils/onboardingV2Analytics';

// ── Palette ──────────────────────────────────────────────────────────────────
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
  tealText: '#0D9488',

  // Cards unselected
  cardBg: '#FFFFFF',
  cardBorder: 'rgba(15,23,42,0.07)',
  cardTitle: '#0F172A',
  cardSub: '#64748B',

  // Cards selected
  selBg: 'rgba(13,148,136,0.08)',
  selBorder: '#0D9488',
  selTitle: '#042F2E',
  selSub: '#0F766E',

  // Detail card
  detailBg: '#FFFFFF',
  detailBorder: 'rgba(13,148,136,0.18)',

  // Nav
  backBg: 'rgba(0,0,0,0.04)',
  backBorder: 'rgba(0,0,0,0.06)',
  backArrow: '#0F766E',
  brand: '#0D9488',

  // CTA
  btnA: '#0D9488',
  btnB: '#0F766E',
  btnShadow: '#0D9488',
  footer: 'rgba(240,253,251,0.95)',
  footerBorder: 'rgba(13,148,136,0.10)',

  progress: 18,
};

export default function OnboardingV2GoalExamScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const { showAlert } = useAppAlert();
  const { draft, updateDraft } = useOnboardingV2();
  const lang = resolveAppLanguage({
    countryDefaultLanguage: getCountryByCode(draft.countryCode)?.defaultLanguage ?? null,
  });
  useEffect(() => { void trackOnboardingStepView('goal_exam'); }, []);

  const entrance = useRef(new Animated.Value(0)).current;
  const detailAnim = useRef(new Animated.Value(0)).current;
  const ctaFade = useRef(new Animated.Value(0)).current;
  const ctaScale = useRef(new Animated.Value(1)).current;
  const orbPulse = useRef(new Animated.Value(0.92)).current;

  // Per-exam press scale
  const examScales = useRef<Animated.Value[]>([]);
  const getExamScale = (idx: number) => {
    if (!examScales.current[idx]) {
      examScales.current[idx] = new Animated.Value(1);
    }
    return examScales.current[idx];
  };

  const examSections = useMemo(() => {
    const primaryCatalog = getPrimaryExamCatalogForCountry(draft.countryCode);
    const globalCatalog = getGlobalExamCatalogForCountry(draft.countryCode);
    const legacyMap = new Map(availableExams.map((e) => [e.id, e]));
    const mapCatalogEntry = (entry: any) => {
      const legacy = legacyMap.get(entry.examCode);
      const localizedName = getLocalizedExamName(entry.examCode, lang, legacy?.name || entry.examName);
      return {
        id: entry.examCode,
        name: localizedName,
        fullName: legacy?.fullName || localizedName,
        canonicalName: entry.examName,
        category: entry.category,
      };
    };
    const primary = primaryCatalog.map((entry) => mapCatalogEntry(entry));
    const global = globalCatalog.map((entry) => mapCatalogEntry(entry));

    if (primary.length > 0) {
      return {
        primary,
        global,
      };
    }

    return {
      primary: availableExams.map((e) => ({
      ...e,
      name: getLocalizedExamName(e.id, lang, e.name),
      fullName: getLocalizedExamName(e.id, lang, e.fullName || e.name),
      canonicalName: e.name,
      category: 'university' as const,
      })),
      global: [],
    };
  }, [draft.countryCode, lang]);

  const examOptions = useMemo(() => [...examSections.primary, ...examSections.global], [examSections]);

  const selectedBaseExamId = getBaseExamId(draft.examId);
  const selectedTrack = getTrackFromExamId(draft.examId);
  const selectionComplete = Boolean(draft.examId);
  const useThreeColumnGrid = !isTablet && examSections.primary.length > 6;
  const useCompactPrimaryCards = !useThreeColumnGrid;
  const isCompactPhone = Dimensions.get('window').width <= 390;
  const selectedTrackConfig = getExamTrackConfig(selectedBaseExamId);

  const applyExamSelection = (nextExamId: string, displayName?: string) => {
    const blueprint = getBlueprintByExamCode(nextExamId);
    const nextSubjectIntensity: Record<string, number> = {};

    if (blueprint?.subjects?.length) {
      blueprint.subjects.forEach((subject) => {
        const bias = subject.intensityBias ?? 0;
        const baseLevel = bias >= 0.12 ? 2 : bias <= -0.12 ? 0 : 1;
        nextSubjectIntensity[subject.label] = baseLevel;
      });
    }

    updateDraft({
      examId: nextExamId,
      examName: displayName || getLocalizedExamName(nextExamId, undefined, nextExamId),
      targetMetricType: 'score',
      targetValueRaw: '',
      targetValueNormalized: 0,
      targetScore: '',
      subjectIntensity: nextSubjectIntensity,
    });
  };

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(orbPulse, { toValue: 1.08, duration: 3800, useNativeDriver: true }),
        Animated.timing(orbPulse, { toValue: 0.92, duration: 3800, useNativeDriver: true }),
      ])
    ).start();
    Animated.timing(entrance, { toValue: 1, duration: 440, useNativeDriver: true }).start();
    Animated.timing(ctaFade, { toValue: 1, duration: 440, delay: 300, useNativeDriver: true }).start();
  // Intentionally mount-only entrance animations.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Animate detail card when selection changes
  useEffect(() => {
    if (draft.examId) {
      Animated.spring(detailAnim, { toValue: 1, damping: 20, stiffness: 200, useNativeDriver: true }).start();
    } else {
      Animated.timing(detailAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start();
    }
  // detailAnim is stable ref; animate only when exam selection changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.examId]);

  const handleSelect = (exam: any, idx: number) => {
    // Spring press animation
    Animated.sequence([
      Animated.spring(getExamScale(idx), { toValue: 0.95, damping: 20, stiffness: 400, useNativeDriver: true }),
      Animated.spring(getExamScale(idx), { toValue: 1, damping: 16, stiffness: 300, useNativeDriver: true }),
    ]).start();
    if (examRequiresTrack(exam.id)) {
      updateDraft({
        examId: exam.id,
        examName: exam.canonicalName || exam.name,
        targetMetricType: 'score',
        targetValueRaw: '',
        targetValueNormalized: 0,
        targetScore: '',
        subjectIntensity: {},
      });
      return;
    }

    applyExamSelection(exam.id, exam.canonicalName || exam.name);
  };

  const handleBack = () => {
    void trackOnboardingStepBack('goal_exam');
    router.back();
  };

  const handleContinue = () => {
    if (!draft.examId) {
      void trackOnboardingStepValidationFail('goal_exam', ['examId'], 'Exam selection required');
      showAlert(t('onboarding.goal_exam.alert_title', { lang }), t('onboarding.goal_exam.alert_body', { lang }));
      return;
    }
    void trackOnboardingStepContinue('goal_exam');
    router.push(examRequiresTrack(draft.examId) && !selectedTrack ? '/(onboarding-v2)/goal-track' : '/(onboarding-v2)/goal-date');
  };

  const pressIn = () => Animated.spring(ctaScale, { toValue: 0.97, damping: 20, stiffness: 400, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(ctaScale, { toValue: 1, damping: 18, stiffness: 360, useNativeDriver: true }).start();

  const selectedExam = (examOptions || []).find(e => e.id === selectedBaseExamId);
  const selectedDisplayName = selectionComplete
    ? getLocalizedExamName(draft.examId, lang, draft.examName || selectedExam?.name || '')
    : selectedExam?.name;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      <LinearGradient colors={[C.bg0, C.bg1, C.bg2, C.bg3]} locations={[0,0.35,0.70,1]} style={StyleSheet.absoluteFill} />

      {/* Orbs */}
      <Animated.View style={[styles.orbA, isTablet && styles.orbATablet, { backgroundColor: C.orbA, transform:[{scale: orbPulse}] }]} />
      <View style={[styles.orbB, isTablet && styles.orbBTablet, { backgroundColor: C.orbB }]} />

      {/* Grid */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {[0,1,2,3,4,5,6].map(i => (
          <View key={`v${i}`} style={{ position:'absolute', top:0, bottom:0, left:`${i*16.6}%`, width:StyleSheet.hairlineWidth, backgroundColor:C.grid }} />
        ))}
        {[0,1,2,3,4,5,6,7].map(i => (
          <View key={`h${i}`} style={{ position:'absolute', left:0, right:0, top:`${i*12.5}%`, height:StyleSheet.hairlineWidth, backgroundColor:C.grid }} />
        ))}
      </View>

      {/* ── Content ─────────────────────────────────────────── */}
      <Animated.View style={[styles.inner, isTablet && styles.innerTablet, { opacity: entrance }]}>

        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={[styles.backBtn, isTablet && styles.backBtnTablet, { backgroundColor: C.backBg, borderColor: C.backBorder }]}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Text style={[styles.backArrow, isTablet && styles.backArrowTablet, { color: C.backArrow }]}>‹</Text>
          </TouchableOpacity>
          <View style={styles.brandRow}>
            <View style={[styles.brandMark, { backgroundColor: C.brand }]} />
            <Text style={[styles.brandText, isTablet && styles.brandTextTablet, { color: C.brand }]}>StudyMap</Text>
          </View>
          <View style={styles.backBtn} />
        </View>

        {/* Progress */}
        <View style={[styles.progressTrack, { backgroundColor: C.tealSoft }]}>
          <View style={[styles.progressFill, { width: `${C.progress}%` }]}>
            <LinearGradient colors={[C.btnA, C.btnB]} start={{x:0,y:0}} end={{x:1,y:0}} style={StyleSheet.absoluteFill} />
            <View style={styles.progressSheen} />
          </View>
        </View>
        <Text style={[styles.stepLabel, isTablet && styles.stepLabelTablet, { color: C.labelMuted }]}>
          {t('common.step_of', { lang, params: { current: 3, total: 13 } })}
        </Text>

        {/* Title */}
        <Text style={[styles.title, isTablet && styles.titleTablet, { color: C.title }]}>{t('onboarding.goal_exam.title', { lang })}</Text>
        <Text style={[styles.sub, isTablet && styles.subTablet, { color: C.sub }]}>{t('onboarding.goal_exam.subtitle', { lang })}</Text>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, isTablet && styles.scrollContentTablet]}
        >
          {/* Exam grid */}
          <View style={[styles.examGrid, isTablet && styles.examGridTablet]}>
            {examSections.primary.map((exam, idx) => {
              const selected = selectedBaseExamId === exam.id;
              return (
                <Animated.View
                  key={exam.id}
                  style={[
                    { transform: [{ scale: getExamScale(idx) }] },
                    useThreeColumnGrid ? styles.examCellThree : styles.examCellTwo,
                    isTablet && (useThreeColumnGrid ? styles.examCellThreeTablet : styles.examCellTwoTablet),
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.examCard,
                      isTablet && styles.examCardTablet,
                      useCompactPrimaryCards && styles.examCardPrimaryCompact,
                      useThreeColumnGrid && styles.examCardCompact,
                      selected
                        ? { backgroundColor: C.selBg, borderColor: C.selBorder, borderWidth: 1.5 }
                        : { backgroundColor: C.cardBg, borderColor: C.cardBorder, borderWidth: 1 },
                    ]}
                    onPress={() => handleSelect(exam, idx)}
                    activeOpacity={0.85}
                  >
                    {/* Selected indicator */}
                    {selected && (
                      <View style={[styles.selectedDot, { backgroundColor: C.teal }]}>
                        <Text style={styles.selectedDotText}>✓</Text>
                      </View>
                    )}

                    {/* Teal top accent on selected */}
                    {selected && (
                      <LinearGradient
                        colors={[C.btnA, C.btnB]}
                        start={{x:0,y:0}} end={{x:1,y:0}}
                        style={styles.examAccentBar}
                      />
                    )}

                    <Text style={[
                      styles.examName,
                      isTablet && styles.examNameTablet,
                      useCompactPrimaryCards && styles.examNamePrimaryCompact,
                      useThreeColumnGrid && styles.examNameCompact,
                      useThreeColumnGrid && isCompactPhone && styles.examNameCompactPhone,
                      { color: selected ? C.selTitle : C.cardTitle },
                    ]}
                    numberOfLines={useThreeColumnGrid ? 2 : 3}
                    adjustsFontSizeToFit={useThreeColumnGrid}
                    minimumFontScale={0.82}
                    >
                      {exam.name}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>

          {examSections.global.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionLabel, { color: C.labelMuted }]}>
                  {t('onboarding.goal_exam.global_title', { lang, fallback: lang === 'tr' ? 'ULUSLARARASI SINAVLAR' : 'INTERNATIONAL EXAMS' })}
                </Text>
                <Text style={[styles.sectionHint, { color: C.sub }]}>
                  {t(
                    'onboarding.goal_exam.global_subtitle',
                    {
                      lang,
                      fallback: lang === 'tr'
                        ? 'Birçok ülkede geçerli dil sınavları'
                        : 'Widely recognized language exams',
                    }
                  )}
                </Text>
              </View>
              <View style={[styles.examGrid, isTablet && styles.examGridTablet]}>
                {examSections.global.map((exam, idx) => {
                  const selected = selectedBaseExamId === exam.id;
                  const scaleIndex = examSections.primary.length + idx;
                  return (
                    <Animated.View
                      key={exam.id}
                      style={[
                        { transform: [{ scale: getExamScale(scaleIndex) }] },
                        styles.examCellTwo,
                        isTablet && styles.examCellTwoTablet,
                      ]}
                    >
                      <TouchableOpacity
                        style={[
                          styles.examCard,
                          isTablet && styles.examCardTablet,
                          styles.examCardGlobal,
                          selected
                            ? { backgroundColor: C.selBg, borderColor: C.selBorder, borderWidth: 1.5 }
                            : { backgroundColor: C.cardBg, borderColor: C.cardBorder, borderWidth: 1 },
                        ]}
                        onPress={() => handleSelect(exam, scaleIndex)}
                        activeOpacity={0.85}
                      >
                        {selected && (
                          <View style={[styles.selectedDot, { backgroundColor: C.teal }]}>
                            <Text style={styles.selectedDotText}>✓</Text>
                          </View>
                        )}
                        {selected && (
                          <LinearGradient
                            colors={[C.btnA, C.btnB]}
                            start={{x:0,y:0}} end={{x:1,y:0}}
                            style={styles.examAccentBar}
                          />
                        )}
                        <Text
                          style={[styles.examName, isTablet && styles.examNameTablet, styles.examNameGlobal, { color: selected ? C.selTitle : C.cardTitle }]}
                          numberOfLines={2}
                          adjustsFontSizeToFit
                          minimumFontScale={0.9}
                        >
                          {exam.name}
                        </Text>
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })}
              </View>
            </>
          )}

          {/* Selected exam detail card */}
          {!selectedExam && (
            <View style={[styles.placeholderCard, { backgroundColor: C.detailBg, borderColor: C.detailBorder }]}>
              <Text style={[styles.placeholderTitle, isTablet && styles.placeholderTitleTablet, { color: C.title }]}>{t('onboarding.goal_exam.placeholder_title', { lang })}</Text>
              <Text style={[styles.placeholderText, isTablet && styles.placeholderTextTablet, { color: C.labelMuted }]}>
                {t('onboarding.goal_exam.placeholder_text', { lang })}
              </Text>
            </View>
          )}
          {selectedExam && (
            <Animated.View
              style={[
                styles.detailCard,
                isTablet && styles.detailCardTablet,
                { backgroundColor: C.detailBg, borderColor: C.detailBorder },
                {
                  opacity: detailAnim,
                  transform: [{
                    translateY: detailAnim.interpolate({ inputRange:[0,1], outputRange:[10,0] }),
                  }],
                },
              ]}
            >
              <LinearGradient
                colors={[C.btnA, C.btnB]}
                start={{x:0,y:0}} end={{x:1,y:0}}
                style={styles.detailBar}
              />
              <View style={styles.detailInner}>
                <View style={styles.detailHeader}>
                  <View>
                    <Text style={[styles.detailLabel, isTablet && styles.detailLabelTablet, { color: C.label }]}>{t('onboarding.goal_exam.selected', { lang }).toUpperCase()}</Text>
                    <Text style={[styles.detailName, isTablet && styles.detailNameTablet, { color: C.title }]}>{selectedExam.name}</Text>
                  </View>
                  <View style={[styles.detailCheck, { backgroundColor: C.tealSoft, borderColor: C.tealBorder }]}>
                    <Text style={[styles.detailCheckText, { color: C.teal }]}>✓</Text>
                  </View>
                </View>
                <Text style={[styles.detailNote, isTablet && styles.detailNoteTablet, { color: C.labelMuted }]}>
                  {examRequiresTrack(selectedExam.id)
                    ? t(selectedTrackConfig?.subtitleKey ?? 'onboarding.goal_exam.track_subtitle_ayt', { lang })
                    : t('onboarding.goal_exam.detail_note', { lang })}
                </Text>
              </View>
            </Animated.View>
          )}

          <View style={{ height: FOOTER.ctaHeight + FOOTER.paddingTop + FOOTER.paddingBottom + 8 }} />
        </ScrollView>
      </Animated.View>

      {/* ── Footer ──────────────────────────────────────────── */}
      <Animated.View
        style={[styles.footer, isTablet && styles.footerTablet, { backgroundColor: C.footer, borderTopColor: C.footerBorder, opacity: ctaFade }]}
      >
        <Animated.View style={{ transform: [{ scale: ctaScale }] }}>
          <TouchableOpacity
            style={[styles.cta, isTablet && styles.ctaTablet, !selectionComplete && styles.ctaDisabled]}
            onPress={handleContinue}
            onPressIn={pressIn}
            onPressOut={pressOut}
            activeOpacity={1}
          >
            {!!selectionComplete && (
              <LinearGradient colors={[C.btnA, C.btnB]} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFill} />
            )}
            {!!selectionComplete && <View style={styles.ctaSheen} />}
            <Text style={[styles.ctaText, isTablet && styles.ctaTextTablet, !selectionComplete && styles.ctaTextDisabled]}>
              {selectionComplete
                ? t('onboarding.goal_exam.cta_prefix', { lang, params: { exam: selectedDisplayName ?? draft.examName } })
                : t('onboarding.goal_exam.cta_default', { lang })}
            </Text>
            {!!selectionComplete && <Text style={[styles.ctaArrow, isTablet && styles.ctaArrowTablet]}>→</Text>}
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0FDFB' },
  orbA: { position:'absolute', width:280, height:280, borderRadius:999, top:-80, right:-110 },
  orbB: { position:'absolute', width:180, height:180, borderRadius:999, bottom:180, left:-80 },
  orbATablet: { width: 380, height: 380, top: -40, right: -70 },
  orbBTablet: { width: 240, height: 240, bottom: 220, left: -60 },

  inner: { flex: 1, paddingTop: 9 },
  innerTablet: { paddingTop: 18, maxWidth: 1040, width:'100%', alignSelf:'center', justifyContent:'space-between' },

  headerRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:15, paddingHorizontal:21 },
  backBtn: { width:36, height:36, borderRadius:11, borderWidth:1, justifyContent:'center', alignItems:'center' },
  backBtnTablet: { width:46, height:46, borderRadius:14 },
  backArrow: { fontSize:26, fontWeight:'300', lineHeight:30, marginTop:-1 },
  backArrowTablet: { fontSize:30, lineHeight:34 },
  brandRow: { flexDirection:'row', alignItems:'center', gap:6 },
  brandMark: { width:7, height:7, borderRadius:2 },
  brandText: { fontSize:14, fontWeight:'800', letterSpacing:0.4 },
  brandTextTablet: { fontSize:18 },

  progressTrack: { height:3, borderRadius:999, overflow:'hidden', marginBottom:6, marginHorizontal:21 },
  progressFill: { height:'100%', borderRadius:999, overflow:'hidden' },
  progressSheen: { position:'absolute', top:0, left:0, right:0, height:'50%', backgroundColor:'rgba(255,255,255,0.28)' },
  stepLabel: { fontSize:9, fontWeight:'600', letterSpacing:0.8, textTransform:'uppercase', marginBottom:15, opacity:0.7, paddingHorizontal:21 },
  stepLabelTablet: { fontSize:14, marginBottom:14 },

  title: { fontSize:31, fontWeight:'900', lineHeight:36, letterSpacing:-0.7, marginBottom:7, paddingHorizontal:21 },
  titleTablet: { fontSize:68, lineHeight:72, paddingHorizontal:32, maxWidth:900 },
  sub: { fontSize:13, lineHeight:20, fontWeight:'400', marginBottom:17, paddingHorizontal:21 },
  subTablet: { fontSize:25, lineHeight:35, paddingHorizontal:32, marginBottom:30, maxWidth:940 },

  scrollContent: { paddingHorizontal: 21 },
  scrollContentTablet: { paddingHorizontal: 32, paddingBottom: 180 },
  sectionHeader: { marginBottom: 10, marginTop: 2 },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.9, textTransform: 'uppercase', marginBottom: 3 },
  sectionHint: { fontSize: 11, lineHeight: 16, fontWeight: '500' },

  // Exam grid
  examGrid: { flexDirection:'row', flexWrap:'wrap', gap:10, marginBottom:11 },
  examGridTablet: { gap:16, marginBottom:20 },
  examCellTwo: { width: '48%' },
  examCellThree: { width: '31.4%' },
  examCellTwoTablet: { width: '48.9%' },
  examCellThreeTablet: { width: '32.2%' },
  examCard: {
    borderRadius:14,
    minHeight: 80,
    paddingHorizontal: 11,
    paddingVertical: 10,
    justifyContent: 'center',
    overflow:'hidden',
    shadowColor:'#0D9488',
    shadowOffset:{width:0,height:2},
    shadowOpacity:0.08,
    shadowRadius:8,
    elevation:2,
  },
  examCardTablet: {
    borderRadius:22,
    minHeight:148,
    paddingHorizontal:20,
    paddingVertical:20,
  },
  examCardCompact: {
    minHeight: 74,
    paddingHorizontal: 9,
    paddingVertical: 10,
  },
  examCardPrimaryCompact: {
    minHeight: 78,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  examCardGlobal: {
    minHeight: 78,
  },
  examAccentBar: { position:'absolute', top:0, left:0, right:0, height:2 },
  selectedDot: {
    position: 'absolute',
    top:10,
    right:10,
    width:20,
    height:20,
    borderRadius:10,
    alignItems:'center',
    justifyContent:'center',
  },
  selectedDotText: { color:'#fff', fontSize:10, fontWeight:'800' },
  examName: { fontSize:15, fontWeight:'900', letterSpacing:-0.2, marginTop:1, lineHeight: 18 },
  examNameTablet: { fontSize:24, lineHeight:29 },
  examNamePrimaryCompact: { fontSize: 15, lineHeight: 19, letterSpacing: -0.25 },
  examNameCompact: { fontSize: 14, lineHeight: 17, letterSpacing: -0.3 },
  examNameCompactPhone: { fontSize: 13, lineHeight: 16 },
  examNameGlobal: { fontSize: 15, lineHeight: 19 },

  // Placeholder card
  placeholderCard: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 10,
    marginBottom: 8,
  },
  placeholderTitle: { fontSize: 12, fontWeight: '800', marginBottom: 2 },
  placeholderTitleTablet: { fontSize: 20, marginBottom: 6 },
  placeholderText: { fontSize: 10.5, fontWeight: '500', lineHeight: 14 },
  placeholderTextTablet: { fontSize: 16, lineHeight: 24 },

  // Detail card
  detailCard: {
    borderWidth:1,
    borderRadius:17,
    overflow:'hidden',
    marginBottom:4,
    shadowColor:'#0D9488',
    shadowOffset:{width:0,height:6},
    shadowOpacity:0.10,
    shadowRadius:16,
    elevation:4,
  },
  detailCardTablet: { borderRadius:26, marginBottom:12 },
  detailBar: { height:3 },
  detailInner: { paddingHorizontal: 13, paddingVertical: 9, gap: 2 },
  detailHeader: { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start' },
  detailLabel: { fontSize:9, fontWeight:'700', letterSpacing:1.1, textTransform:'uppercase', marginBottom:2 },
  detailLabelTablet: { fontSize: 12, marginBottom: 4 },
  detailName: { fontSize:17, fontWeight:'900', letterSpacing:-0.3, lineHeight: 20 },
  detailNameTablet: { fontSize: 36, lineHeight: 40 },
  detailCheck: { width:26, height:26, borderRadius:8, borderWidth:1, alignItems:'center', justifyContent:'center' },
  detailCheckText: { fontSize:14, fontWeight:'700' },
  detailFull: { fontSize:10.5, fontWeight:'500', lineHeight: 13 },
  detailNote: { fontSize:9.5, lineHeight:13, fontWeight:'400' },
  detailNoteTablet: { fontSize: 16, lineHeight: 24 },

  // Footer
  footer: {
    position:'absolute', left:0, right:0, bottom:0,
    paddingHorizontal:21, paddingTop:6, paddingBottom:36,
    borderTopWidth:StyleSheet.hairlineWidth,
  },
  footerTablet: { paddingHorizontal:36, paddingTop:18, paddingBottom:52 },
  cta: {
    height:48, borderRadius:FOOTER.ctaRadius, flexDirection:'row',
    alignItems:'center', justifyContent:'center',
    overflow:'hidden', gap:8,
    shadowColor:'#0D9488', shadowOffset:{width:0,height:6},
    shadowOpacity:0.26, shadowRadius:16, elevation:8,
  },
  ctaTablet: { height:72, borderRadius:22 },
  ctaDisabled: {
    backgroundColor:'rgba(148,163,184,0.18)',
    shadowOpacity:0, elevation:0,
  },
  ctaSheen: { position:'absolute', top:0, left:0, right:0, height:'44%', backgroundColor:'rgba(255,255,255,0.13)' },
  ctaText: { color:'#fff', fontSize:16, fontWeight:'800', letterSpacing:0.2 },
  ctaTextTablet: { fontSize:24 },
  ctaTextDisabled: { color:'rgba(100,116,139,0.55)' },
  ctaArrow: { color:'rgba(255,255,255,0.78)', fontSize:17 },
  ctaArrowTablet: { fontSize:22 },
});
