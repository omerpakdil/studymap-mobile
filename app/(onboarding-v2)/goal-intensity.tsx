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
  View,
} from 'react-native';

import { useOnboardingV2 } from '@/app/(onboarding-v2)/state';
import { getCountryByCode } from '@/app/data/countries';
import { resolveAppLanguage, t } from '@/app/i18n';
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
  footer:'rgba(250,251,252,0.96)', footerBorder:'rgba(15,23,42,0.07)',
};

type IntensityId = 'relaxed' | 'moderate' | 'intensive' | 'extreme';

interface Option {
  id: IntensityId;
  label: string;
  hours: string;
  level: number; // 1-4 intensity scale shown as dots
  totalDots: number;
  desc: string;
  weekLabel: string;
  railA: string;
  railB: string;
  tagText: string;
  recommended?: boolean;
}

const OPTIONS: Option[] = [
  {
    id: 'relaxed',
    label: 'Relaxed',
    hours: '1–2 h/day',
    level: 1,
    totalDots: 4,
    desc: 'Gentle, sustainable pace. Best with 3+ months before your exam.',
    weekLabel: '~5 sessions/week',
    railA: '#10B981', railB: '#059669',
    tagText: 'Low pressure',
  },
  {
    id: 'moderate',
    label: 'Moderate',
    hours: '2–3 h/day',
    level: 2,
    totalDots: 4,
    desc: 'Balanced effort. The most popular intensity — consistent and effective.',
    weekLabel: '~10 sessions/week',
    railA: '#0F9D8C', railB: '#0B7A6E',
    tagText: 'Recommended',
    recommended: true,
  },
  {
    id: 'intensive',
    label: 'Intensive',
    hours: '3–4 h/day',
    level: 3,
    totalDots: 4,
    desc: 'High output. Ideal for 6–8 week sprints before your exam.',
    weekLabel: '~15 sessions/week',
    railA: '#0284C7', railB: '#0369A1',
    tagText: 'High output',
  },
  {
    id: 'extreme',
    label: 'Extreme',
    hours: '4+ h/day',
    level: 4,
    totalDots: 4,
    desc: 'Maximum load. Every available slot used. Study is your top priority.',
    weekLabel: '~20 sessions/week',
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
  const getHours = (id: IntensityId) => t(`onboarding.goal_intensity.${id}.hours`, { lang, fallback: OPTIONS.find(o => o.id === id)?.hours || '' });
  const getDesc = (id: IntensityId) => t(`onboarding.goal_intensity.${id}.desc`, { lang, fallback: OPTIONS.find(o => o.id === id)?.desc || '' });
  const getWeek = (id: IntensityId) => t(`onboarding.goal_intensity.${id}.week`, { lang, fallback: OPTIONS.find(o => o.id === id)?.weekLabel || '' });

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

      <Animated.View style={[styles.inner, { opacity: entrance }]}>

        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: C.backBg, borderColor: C.backBorder }]}
            onPress={() => { void trackOnboardingStepBack('goal_intensity'); router.back(); }}
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

        {/* Progress */}
        <View style={[styles.progressTrack, { backgroundColor: C.tealSoft }]}>
          <View style={[styles.progressFill, { width: '45%' }]}>
            <LinearGradient colors={[C.btnA, C.btnB]} start={{ x:0,y:0 }} end={{ x:1,y:0 }} style={StyleSheet.absoluteFill} />
            <View style={styles.progressSheen} />
          </View>
        </View>
        <Text style={[styles.stepLabel, { color: C.labelMuted }]}>
          {t('common.step_of', { lang, params: { current: 6, total: 12 } })}
        </Text>

        {/* Title */}
        <Text style={[styles.title, { color: C.title }]}>
          {t('onboarding.goal_intensity.title', { lang, fallback: 'How hard do you\nwant to push?' })}
        </Text>
        <Text style={[styles.sub, { color: C.sub }]}>
          {t('onboarding.goal_intensity.subtitle', { lang, fallback: 'We tune session volume and daily load around this setting.' })}
        </Text>

        {/* Intensity cards — full width stacked */}
        <View style={styles.cardList}>
          {OPTIONS.map((opt, i) => {
            const active = draft.studyIntensity === opt.id;
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

                  <View style={styles.cardContent}>
                    {/* Top row: label + hours badge + recommended tag */}
                    <View style={styles.cardTopRow}>
                      <Text style={[styles.cardLabel, { color: active ? opt.railA : C.title }]}>
                        {getLabel(opt.id)}
                      </Text>
                      <View style={styles.cardTopRight}>
                        {opt.recommended && (
                          <View style={[styles.recBadge, { backgroundColor: `${opt.railA}18`, borderColor: `${opt.railA}30` }]}>
                            <Text style={[styles.recText, { color: opt.railA }]}>
                              ★ {t('onboarding.goal_intensity.best_pick', { lang, fallback: 'Best pick' })}
                            </Text>
                          </View>
                        )}
                        <View style={[styles.hoursBadge, { backgroundColor: active ? `${opt.railA}18` : 'rgba(0,0,0,0.05)' }]}>
                          <Text style={[styles.hoursText, { color: active ? opt.railA : C.sub }]}>{getHours(opt.id)}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Session dots visualizer */}
                    <View style={styles.dotsRow}>
                      <SessionDots
                        filled={opt.level}
                        total={opt.totalDots}
                        colorA={opt.railA}
                        colorB={opt.railB}
                        active={active}
                      />
                      <Text style={[styles.weekLabel, { color: active ? opt.railA : C.sub }]}>
                        {getWeek(opt.id)}
                      </Text>
                    </View>

                    {/* Description — only when active */}
                    {active && (
                      <Text style={[styles.cardDesc, { color: C.sub }]}>{getDesc(opt.id)}</Text>
                    )}
                  </View>

                  {/* Check mark */}
                  {active && (
                    <View style={[styles.checkWrap, { backgroundColor: `${opt.railA}18` }]}>
                      <Text style={[styles.checkText, { color: opt.railA }]}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      </Animated.View>

      {/* Footer */}
      <Animated.View style={[styles.footer, { backgroundColor: C.footer, borderTopColor: C.footerBorder, opacity: ctaFade }]}>
        <Animated.View style={{ transform: [{ scale: ctaScale }] }}>
          <TouchableOpacity
            style={[styles.cta, !draft.studyIntensity && styles.ctaDisabled]}
            onPress={() => { void trackOnboardingStepContinue('goal_intensity'); router.push('/(onboarding-v2)/schedule'); }}
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
            <Text style={[styles.ctaText, !draft.studyIntensity && styles.ctaTextDisabled]}>
              {draft.studyIntensity
                ? `${t('common.continue', { lang })} · ${getLabel(draft.studyIntensity)}`
                : t('onboarding.goal_intensity.select_intensity', { lang, fallback: 'Select intensity' })}
            </Text>
            {!!draft.studyIntensity && <Text style={styles.ctaArrow}>→</Text>}
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

  headerRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:14 },
  backBtn: { width:36, height:36, borderRadius:11, borderWidth:1, justifyContent:'center', alignItems:'center' },
  backArrow: { fontSize:26, fontWeight:'300', lineHeight:30, marginTop:-1 },
  brandRow: { flexDirection:'row', alignItems:'center', gap:6 },
  brandMark: { width:7, height:7, borderRadius:2 },
  brandText: { fontSize:14, fontWeight:'800', letterSpacing:0.4 },

  progressTrack: { height:3, borderRadius:999, overflow:'hidden', marginBottom:6 },
  progressFill: { height:'100%', borderRadius:999, overflow:'hidden' },
  progressSheen: { position:'absolute', top:0, left:0, right:0, height:'50%', backgroundColor:'rgba(255,255,255,0.28)' },
  stepLabel: { fontSize:10, fontWeight:'600', letterSpacing:0.9, textTransform:'uppercase', marginBottom:14, opacity:0.65 },

  title: { fontSize:30, fontWeight:'900', lineHeight:36, letterSpacing:-0.7, marginBottom:6 },
  sub: { fontSize:13, lineHeight:19, fontWeight:'400', marginBottom:14 },

  // Cards
  cardList: { gap:10 },
  card: {
    borderRadius:16,
    flexDirection:'row',
    alignItems:'center',
    overflow:'hidden',
    paddingVertical:14,
    paddingRight:14,
  },

  // Left rail
  rail: { width:4, alignSelf:'stretch', borderRadius:2, marginRight:14, marginLeft:0 },

  cardContent: { flex:1, gap:8 },

  cardTopRow: { flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  cardLabel: { fontSize:16, fontWeight:'800', letterSpacing:-0.2 },
  cardTopRight: { flexDirection:'row', alignItems:'center', gap:6 },

  recBadge: { borderWidth:1, borderRadius:6, paddingHorizontal:6, paddingVertical:2 },
  recText: { fontSize:9, fontWeight:'700', letterSpacing:0.4 },
  hoursBadge: { borderRadius:8, paddingHorizontal:8, paddingVertical:4 },
  hoursText: { fontSize:11, fontWeight:'700', letterSpacing:0.2 },

  dotsRow: { flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  weekLabel: { fontSize:10, fontWeight:'600', letterSpacing:0.3 },

  cardDesc: { fontSize:12, lineHeight:17, fontWeight:'400' },

  checkWrap: { width:30, height:30, borderRadius:9, alignItems:'center', justifyContent:'center', marginLeft:8 },
  checkText: { fontSize:15, fontWeight:'700' },

  // Footer
  footer: { position:'absolute', left:0, right:0, bottom:0, paddingHorizontal:22, paddingTop:14, paddingBottom:32, borderTopWidth:StyleSheet.hairlineWidth },
  cta: { height:54, borderRadius:14, flexDirection:'row', alignItems:'center', justifyContent:'center', overflow:'hidden', gap:8,
    shadowColor:'#0F9D8C', shadowOffset:{width:0,height:6}, shadowOpacity:0.26, shadowRadius:16, elevation:8 },
  ctaDisabled: { backgroundColor:'rgba(148,163,184,0.18)', shadowOpacity:0, elevation:0 },
  ctaSheen: { position:'absolute', top:0, left:0, right:0, height:'44%', backgroundColor:'rgba(255,255,255,0.13)' },
  ctaText: { color:'#fff', fontSize:16, fontWeight:'800', letterSpacing:0.2 },
  ctaTextDisabled: { color:'rgba(100,116,139,0.55)' },
  ctaArrow: { color:'rgba(255,255,255,0.78)', fontSize:17 },
});
