/**
 * goal-intensity.tsx — "Set Your Pace" — v2
 *
 * Slate light variant. Full-width stacked intensity cards.
 * Each card shows: colored left rail, label + hours badge,
 * horizontal session-dot visualizer, description.
 * Selected card expands with animated height + teal shadow.
 * Zero wasted space — content fills the screen.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
    Animated,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';

import { useOnboardingV2 } from '@/app/(onboarding-v2)/state';
import { ONBOARDING_FOOTER_METRICS as FOOTER } from '@/app/components/onboarding-v2/footerMetrics';
import { getCountryByCode } from '@/app/data/countries';
import { getLocaleTagForLanguage, resolveAppLanguage, t } from '@/app/i18n';
import { getIntensityCapacitySummary } from '@/app/utils/scheduleCapacity';
import {
    trackOnboardingStepBack,
    trackOnboardingStepContinue,
    trackOnboardingStepView,
} from '@/app/utils/onboardingV2Analytics';

// ── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg0:'#FAFBFC', bg1:'#F4F6F8', bg2:'#EEF1F4', bg3:'#F8FAFB',
  orbA:'rgba(15,157,140,0.09)', orbB:'rgba(100,116,139,0.06)',
  grid:'rgba(0,0,0,0.030)',
  title:'#0F172A', sub:'#475569',
  labelMuted:'rgba(15,157,140,0.38)',
  teal:'#0F9D8C', tealSoft:'rgba(15,157,140,0.09)',
  cardBg:'#FFFFFF', cardBorder:'rgba(15,23,42,0.07)',
  backBg:'rgba(0,0,0,0.04)', backBorder:'rgba(0,0,0,0.06)',
  backArrow:'#64748B', brand:'#0F9D8C',
  btnA:'#0F9D8C', btnB:'#0B7A6E',
  footer:'transparent', footerBorder:'rgba(15,23,42,0.07)',
};

type IntensityId = 'relaxed' | 'moderate' | 'intensive' | 'extreme';

interface Option {
  id: IntensityId;
  label: string;
  ratio: number;
  level: number; // 1-4 intensity scale shown as dots
  totalDots: number;
  desc: string;
  railA: string;
  railB: string;
  tagText: string;
  recommended?: boolean;
}

const OPTIONS: Option[] = [
  {
    id: 'relaxed',
    label: 'Relaxed',
    ratio: 0.25,
    level: 1,
    totalDots: 4,
    desc: 'Gentle, sustainable pace. Best with 3+ months before your exam.',
    railA: '#10B981', railB: '#059669',
    tagText: 'Low pressure',
  },
  {
    id: 'moderate',
    label: 'Moderate',
    ratio: 0.50,
    level: 2,
    totalDots: 4,
    desc: 'Balanced effort. The most popular intensity — consistent and effective.',
    railA: '#0F9D8C', railB: '#0B7A6E',
    tagText: 'Recommended',
    recommended: true,
  },
  {
    id: 'intensive',
    label: 'Intensive',
    ratio: 0.75,
    level: 3,
    totalDots: 4,
    desc: 'High output. Ideal for 6–8 week sprints before your exam.',
    railA: '#0284C7', railB: '#0369A1',
    tagText: 'High output',
  },
  {
    id: 'extreme',
    label: 'Extreme',
    ratio: 0.95,
    level: 4,
    totalDots: 4,
    desc: 'Maximum load. Every available slot used. Study is your top priority.',
    railA: '#DC2626', railB: '#B91C1C',
    tagText: 'Max effort',
  },
];

function SessionDots({ filled, total, colorA, colorB, active }: {
  filled: number; total: number; colorA: string; colorB: string; active: boolean;
}) {
  return (
    <View style={dotStyles.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            dotStyles.dot,
            i < filled && active
              ? { backgroundColor: colorA, opacity: 1 - i * 0.08 }
              : { backgroundColor: 'rgba(0,0,0,0.08)' },
          ]}
        />
      ))}
    </View>
  );
}

const dotStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5 },
});

export default function OnboardingV2GoalIntensityScreen() {
  const { draft, updateDraft } = useOnboardingV2();
  const lang = resolveAppLanguage({
    countryDefaultLanguage: getCountryByCode(draft.countryCode)?.defaultLanguage ?? null,
  });
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  useEffect(() => { void trackOnboardingStepView('goal_intensity'); }, []);

  const entrance = useRef(new Animated.Value(0)).current;
  const ctaFade = useRef(new Animated.Value(0)).current;
  const ctaScale = useRef(new Animated.Value(1)).current;
  const cardAnims = useRef(OPTIONS.map(() => new Animated.Value(0))).current;
  const cardScales = useRef(OPTIONS.map(() => new Animated.Value(1))).current;

  useEffect(() => {
    Animated.timing(entrance, { toValue: 1, duration: 420, useNativeDriver: true }).start();
    OPTIONS.forEach((_, i) =>
      Animated.timing(cardAnims[i], { toValue: 1, duration: 340, delay: 200 + i * 70, useNativeDriver: true }).start()
    );
    Animated.timing(ctaFade, { toValue: 1, duration: 340, delay: 500, useNativeDriver: true }).start();
  // Entrance sequence should run once on mount; refs are stable.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = (id: IntensityId, idx: number) => {
    Animated.sequence([
      Animated.spring(cardScales[idx], { toValue: 0.975, damping: 18, stiffness: 500, useNativeDriver: true }),
      Animated.spring(cardScales[idx], { toValue: 1, damping: 14, stiffness: 300, useNativeDriver: true }),
    ]).start();
    updateDraft({ studyIntensity: id });
  };

  const pressIn = () => Animated.spring(ctaScale, { toValue: 0.97, damping: 20, stiffness: 400, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(ctaScale, { toValue: 1, damping: 18, stiffness: 360, useNativeDriver: true }).start();

  const selectedOpt = OPTIONS.find(o => o.id === draft.studyIntensity);
  const getLabel = (id: IntensityId) => t(`onboarding.goal_intensity.${id}.label`, { lang, fallback: OPTIONS.find(o => o.id === id)?.label || id });
  const getDesc = (id: IntensityId) => t(`onboarding.goal_intensity.${id}.desc`, { lang, fallback: OPTIONS.find(o => o.id === id)?.desc || '' });
  const formatNumber = (value: number) =>
    new Intl.NumberFormat(getLocaleTagForLanguage(lang), {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={[C.bg0, C.bg1, C.bg2, C.bg3]} locations={[0, 0.35, 0.70, 1]} style={StyleSheet.absoluteFill} />
      <View style={[styles.orbA, { backgroundColor: C.orbA }]} />
      <View style={[styles.orbB, { backgroundColor: C.orbB }]} />

      {/* Grid */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {[0,1,2,3,4,5,6].map(i => <View key={`v${i}`} style={{ position:'absolute',top:0,bottom:0,left:`${i*16.6}%`,width:StyleSheet.hairlineWidth,backgroundColor:C.grid }} />)}
        {[0,1,2,3,4,5,6,7].map(i => <View key={`h${i}`} style={{ position:'absolute',left:0,right:0,top:`${i*12.5}%`,height:StyleSheet.hairlineWidth,backgroundColor:C.grid }} />)}
      </View>

      <Animated.View style={[styles.inner, isTablet && styles.innerTablet, { opacity: entrance }]}>

        {/* Header */}
        <View style={[styles.headerRow, isTablet && styles.headerRowTablet]}>
          <TouchableOpacity
            style={[styles.backBtn, isTablet && styles.backBtnTablet, { backgroundColor: C.backBg, borderColor: C.backBorder }]}
            onPress={() => { void trackOnboardingStepBack('goal_intensity'); router.back(); }}
            activeOpacity={0.7}
          >
            <Text style={[styles.backArrow, isTablet && styles.backArrowTablet, { color: C.backArrow }]}>‹</Text>
          </TouchableOpacity>
          <View style={styles.brandRow}>
            <View style={[styles.brandMark, { backgroundColor: C.brand }]} />
            <Text style={[styles.brandText, isTablet && styles.brandTextTablet, { color: C.brand }]}>StudyMap</Text>
          </View>
          <View style={[styles.backBtn, isTablet && styles.backBtnTablet]} />
        </View>

        {/* Progress */}
        <View style={[styles.progressTrack, { backgroundColor: C.tealSoft }]}>
          <View style={[styles.progressFill, { width: '45%' }]}>
            <LinearGradient colors={[C.btnA, C.btnB]} start={{ x:0,y:0 }} end={{ x:1,y:0 }} style={StyleSheet.absoluteFill} />
            <View style={styles.progressSheen} />
          </View>
        </View>
        <Text style={[styles.stepLabel, isTablet && styles.stepLabelTablet, { color: C.labelMuted }]}>
          {t('common.step_of', { lang, params: { current: 8, total: 13 } })}
        </Text>

        {/* Title */}
        <Text style={[styles.title, isTablet && styles.titleTablet, { color: C.title }]}>
          {t('onboarding.goal_intensity.title', { lang, fallback: 'How hard do you\nwant to push?' })}
        </Text>
        <Text style={[styles.sub, isTablet && styles.subTablet, { color: C.sub }]}>
          {t('onboarding.goal_intensity.subtitle', { lang, fallback: 'We tune session volume and daily load around this setting.' })}
        </Text>

        {/* Intensity cards — full width stacked */}
        <View style={[styles.cardList, isTablet && styles.cardListTablet]}>
          {OPTIONS.map((opt, i) => {
            const active = draft.studyIntensity === opt.id;
            const capacity = getIntensityCapacitySummary(
              draft.weeklyAvailability || {},
              opt.id,
              draft.preferredSessionMinutes,
              draft.targetValueNormalized || 0
            );
            return (
              <Animated.View
                key={opt.id}
                style={[
                  { opacity: cardAnims[i], transform: [{ scale: cardScales[i] }, { translateX: cardAnims[i].interpolate({ inputRange:[0,1], outputRange:[16,0] }) }] },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.card,
                    isTablet && styles.cardTablet,
                    active
                      ? { backgroundColor: `${opt.railA}0E`, borderColor: opt.railA, borderWidth: 1.5,
                          shadowColor: opt.railA, shadowOffset:{width:0,height:6}, shadowOpacity:0.18, shadowRadius:16, elevation:6 }
                      : { backgroundColor: C.cardBg, borderColor: C.cardBorder, borderWidth: 1,
                          shadowColor:'#000', shadowOffset:{width:0,height:1}, shadowOpacity:0.04, shadowRadius:4, elevation:1 },
                  ]}
                  onPress={() => handleSelect(opt.id, i)}
                  activeOpacity={0.88}
                >
                  {/* Colored left rail */}
                  <LinearGradient
                    colors={[opt.railA, opt.railB]}
                    start={{ x:0,y:0 }} end={{ x:0,y:1 }}
                    style={[styles.rail, { opacity: active ? 1 : 0.30 }]}
                  />

                  <View style={[styles.cardContent, isTablet && styles.cardContentTablet]}>
                    {/* Top row: label + rec badge (left stack) | hours badge (right) */}
                    <View style={[styles.cardTopRow, isTablet && styles.cardTopRowTablet]}>
                      <View style={styles.cardTopLeft}>
                        <Text style={[styles.cardLabel, isTablet && styles.cardLabelTablet, { color: active ? opt.railA : C.title }]}>
                          {getLabel(opt.id)}
                        </Text>
                        {opt.recommended && (
                          <View style={[styles.recBadge, isTablet && styles.recBadgeTablet, { backgroundColor: `${opt.railA}18`, borderColor: `${opt.railA}30` }]}>
                            <Text style={[styles.recText, isTablet && styles.recTextTablet, { color: opt.railA }]}>
                              ★ {t('onboarding.goal_intensity.best_pick', { lang, fallback: 'Best pick' })}
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={[styles.hoursBadge, isTablet && styles.hoursBadgeTablet, { backgroundColor: active ? `${opt.railA}18` : 'rgba(0,0,0,0.05)' }]}>
                        <Text style={[styles.hoursText, isTablet && styles.hoursTextTablet, { color: active ? opt.railA : C.sub }]}>
                          {t('onboarding.goal_intensity.planned_weekly', {
                            lang,
                            params: { hours: formatNumber(capacity.weeklyHours) },
                            fallback: `Uses ~${formatNumber(capacity.weeklyHours)} h/week`,
                          })}
                        </Text>
                      </View>
                    </View>

                    {/* Session dots visualizer */}
                    <View style={[styles.dotsRow, isTablet && styles.dotsRowTablet]}>
                      <SessionDots
                        filled={opt.level}
                        total={opt.totalDots}
                        colorA={opt.railA}
                        colorB={opt.railB}
                        active={active}
                      />
                      <Text style={[styles.weekLabel, isTablet && styles.weekLabelTablet, { color: active ? opt.railA : C.sub }]}>
                        {t('onboarding.goal_intensity.sessions', {
                          lang,
                          params: { count: capacity.sessionsPerWeek },
                          fallback: `~${capacity.sessionsPerWeek} sessions/week`,
                        })}
                      </Text>
                    </View>

                    <Text style={[styles.capacityLine, isTablet && styles.capacityLineTablet, { color: active ? opt.railA : C.sub }]}>
                      {t('onboarding.goal_intensity.available_weekly', {
                        lang,
                        params: {
                          hours: formatNumber(capacity.availableWeeklyHours),
                        },
                        fallback: `Based on ${formatNumber(capacity.availableWeeklyHours)} h available`,
                      })}
                    </Text>

                    {/* Description — only when active */}
                    {active && (
                      <Text style={[styles.cardDesc, isTablet && styles.cardDescTablet, { color: C.sub }]}>{getDesc(opt.id)}</Text>
                    )}
                  </View>

                  {/* Check mark */}
                  {active && (
                    <View style={[styles.checkWrap, isTablet && styles.checkWrapTablet, { backgroundColor: `${opt.railA}18` }]}>
                      <Text style={[styles.checkText, isTablet && styles.checkTextTablet, { color: opt.railA }]}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      </Animated.View>

      {/* Footer */}
      <Animated.View style={[styles.footer, isTablet && styles.footerTablet, { backgroundColor: C.footer, borderTopColor: C.footerBorder, opacity: ctaFade }]}>
        <Animated.View style={{ transform: [{ scale: ctaScale }] }}>
          <TouchableOpacity
            style={[styles.cta, isTablet && styles.ctaTablet, !draft.studyIntensity && styles.ctaDisabled]}
            onPress={() => { void trackOnboardingStepContinue('goal_intensity'); router.push('/(onboarding-v2)/focus'); }}
            onPressIn={pressIn}
            onPressOut={pressOut}
            activeOpacity={1}
          >
            {!!draft.studyIntensity && (
              <LinearGradient
                colors={[selectedOpt?.railA ?? C.btnA, selectedOpt?.railB ?? C.btnB]}
                start={{ x:0,y:0 }} end={{ x:1,y:1 }}
                style={StyleSheet.absoluteFill}
              />
            )}
            {!!draft.studyIntensity && <View style={styles.ctaSheen} />}
            <Text style={[styles.ctaText, isTablet && styles.ctaTextTablet, !draft.studyIntensity && styles.ctaTextDisabled]}>
              {draft.studyIntensity
                ? `${t('common.continue', { lang })} · ${getLabel(draft.studyIntensity)}`
                : t('onboarding.goal_intensity.select_intensity', { lang, fallback: 'Select intensity' })}
            </Text>
            {!!draft.studyIntensity && <Text style={[styles.ctaArrow, isTablet && styles.ctaArrowTablet]}>→</Text>}
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex:1, backgroundColor:'#FAFBFC' },
  orbA: { position:'absolute', width:240, height:240, borderRadius:999, top:-70, right:-90 },
  orbB: { position:'absolute', width:160, height:160, borderRadius:999, bottom:180, left:-70 },
  inner: { flex:1, paddingHorizontal:22, paddingTop:10, paddingBottom:110 },
  innerTablet:{paddingHorizontal:36,paddingTop:20,paddingBottom:132,maxWidth:980,width:'100%',alignSelf:'center'},

  headerRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:14 },
  headerRowTablet:{marginBottom:18},
  backBtn: { width:36, height:36, borderRadius:11, borderWidth:1, justifyContent:'center', alignItems:'center' },
  backBtnTablet:{width:48,height:48,borderRadius:14},
  backArrow: { fontSize:26, fontWeight:'300', lineHeight:30, marginTop:-1 },
  backArrowTablet:{fontSize:32,lineHeight:36},
  brandRow: { flexDirection:'row', alignItems:'center', gap:6 },
  brandMark: { width:7, height:7, borderRadius:2 },
  brandText: { fontSize:14, fontWeight:'800', letterSpacing:0.4 },
  brandTextTablet:{fontSize:18},

  progressTrack: { height:3, borderRadius:999, overflow:'hidden', marginBottom:6 },
  progressFill: { height:'100%', borderRadius:999, overflow:'hidden' },
  progressSheen: { position:'absolute', top:0, left:0, right:0, height:'50%', backgroundColor:'rgba(255,255,255,0.28)' },
  stepLabel: { fontSize:10, fontWeight:'600', letterSpacing:0.9, textTransform:'uppercase', marginBottom:14, opacity:0.65 },
  stepLabelTablet:{fontSize:13,marginBottom:18},

  title: { fontSize:30, fontWeight:'900', lineHeight:36, letterSpacing:-0.7, marginBottom:6 },
  titleTablet:{fontSize:54,lineHeight:60,marginBottom:10,maxWidth:720},
  sub: { fontSize:13, lineHeight:19, fontWeight:'400', marginBottom:14 },
  subTablet:{fontSize:21,lineHeight:30,marginBottom:20,maxWidth:840},

  // Cards
  cardList: { gap:10 },
  cardListTablet:{gap:14},
  card: {
    borderRadius:16,
    flexDirection:'row',
    alignItems:'center',
    overflow:'hidden',
    paddingVertical:14,
    paddingRight:14,
  },
  cardTablet:{borderRadius:20,paddingVertical:18,paddingRight:18},

  // Left rail
  rail: { width:4, alignSelf:'stretch', borderRadius:2, marginRight:14, marginLeft:0 },

  cardContent: { flex:1, gap:8 },
  cardContentTablet:{gap:10},

  cardTopRow: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', gap:8 },
  cardTopRowTablet:{gap:14},
  cardLabel: { fontSize:16, fontWeight:'800', letterSpacing:-0.2 },
  cardLabelTablet:{fontSize:22},
  cardTopLeft: { flexDirection:'column', alignItems:'flex-start', gap:4, flex:1 },

  recBadge: { borderWidth:1, borderRadius:6, paddingHorizontal:6, paddingVertical:2 },
  recBadgeTablet:{borderRadius:9,paddingHorizontal:10,paddingVertical:5},
  recText: { fontSize:9, fontWeight:'700', letterSpacing:0.4 },
  recTextTablet:{fontSize:12},
  hoursBadge: { borderRadius:8, paddingHorizontal:8, paddingVertical:4 },
  hoursBadgeTablet:{borderRadius:12,paddingHorizontal:12,paddingVertical:8},
  hoursText: { fontSize:10, fontWeight:'700', letterSpacing:0.1 },
  hoursTextTablet:{fontSize:13},

  dotsRow: { flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  dotsRowTablet:{marginTop:2},
  weekLabel: { fontSize:10, fontWeight:'600', letterSpacing:0.3 },
  weekLabelTablet:{fontSize:13},
  capacityLine: { fontSize:11, fontWeight:'700', marginTop:-2 },
  capacityLineTablet:{fontSize:14,marginTop:0},

  cardDesc: { fontSize:12, lineHeight:17, fontWeight:'400' },
  cardDescTablet:{fontSize:15,lineHeight:22},

  checkWrap: { width:30, height:30, borderRadius:9, alignItems:'center', justifyContent:'center', marginLeft:8 },
  checkWrapTablet:{width:38,height:38,borderRadius:12},
  checkText: { fontSize:15, fontWeight:'700' },
  checkTextTablet:{fontSize:20},

  // Footer
  footer: { position:'absolute', left:0, right:0, bottom:0, paddingHorizontal:22, paddingTop:6, paddingBottom:36, borderTopWidth:StyleSheet.hairlineWidth, backgroundColor:C.footer, borderTopColor:C.footerBorder },
  footerTablet:{paddingHorizontal:36,paddingTop:16,paddingBottom:42},
  cta: { height:FOOTER.ctaHeight, borderRadius:FOOTER.ctaRadius, flexDirection:'row', alignItems:'center', justifyContent:'center', overflow:'hidden', gap:8,
    shadowColor:'#0F9D8C', shadowOffset:{width:0,height:6}, shadowOpacity:0.26, shadowRadius:16, elevation:8 },
  ctaTablet:{height:68,borderRadius:20},
  ctaDisabled: { backgroundColor:'rgba(148,163,184,0.18)', shadowOpacity:0, elevation:0 },
  ctaSheen: { position:'absolute', top:0, left:0, right:0, height:'44%', backgroundColor:'rgba(255,255,255,0.13)' },
  ctaText: { color:'#fff', fontSize:16, fontWeight:'800', letterSpacing:0.2 },
  ctaTextTablet:{fontSize:22},
  ctaTextDisabled: { color:'rgba(100,116,139,0.55)' },
  ctaArrow: { color:'rgba(255,255,255,0.78)', fontSize:17 },
  ctaArrowTablet:{fontSize:22},
});
