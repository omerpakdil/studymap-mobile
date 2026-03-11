/**
 * value-proof.tsx — "Why This Works"
 *
 * Dark ink variant (near-black + emerald). Fully self-contained.
 * Large animated metric board, feature cards with left accent bars,
 * bottom teaser note. No theme dependency.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { ONBOARDING_FOOTER_METRICS as FOOTER } from '@/app/components/onboarding-v2/footerMetrics';
import { resolveAppLanguage, t } from '@/app/i18n';
import {
    trackOnboardingStepBack,
    trackOnboardingStepContinue,
    trackOnboardingStepView,
} from '@/app/utils/onboardingV2Analytics';

// ── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg0: '#080C0B',
  bg1: '#0C1210',
  bg2: '#0F1A18',
  bg3: '#080C0B',
  title: '#ECFDF5',
  sub: 'rgba(167,243,208,0.62)',
  label: '#34D399',
  labelMuted: 'rgba(110,231,183,0.50)',
  grid: 'rgba(255,255,255,0.03)',
  orbA: 'rgba(20,184,166,0.22)',
  orbB: 'rgba(52,211,153,0.12)',

  // Metric board
  boardBg: 'rgba(255,255,255,0.04)',
  boardBorder: 'rgba(52,211,153,0.14)',
  metricVal: '#34D399',
  metricLbl: 'rgba(167,243,208,0.55)',
  divider: 'rgba(52,211,153,0.10)',

  // Feature cards
  cardBg: 'rgba(255,255,255,0.04)',
  cardBorder: 'rgba(52,211,153,0.10)',

  // Accent bars (one per card)
  accent0: '#14B8A6',
  accent1: '#10B981',
  accent2: '#34D399',

  // Bottom note
  noteBg: 'rgba(52,211,153,0.07)',
  noteBorder: 'rgba(52,211,153,0.16)',

  // Nav
  backBg: 'rgba(255,255,255,0.07)',
  backBorder: 'rgba(255,255,255,0.09)',
  backArrow: 'rgba(167,243,208,0.65)',
  brand: '#34D399',

  // CTA
  btnA: '#10B981',
  btnB: '#059669',
  btnShadow: '#10B981',
  footer: 'rgba(8,12,11,0.92)',
  footerBorder: 'rgba(52,211,153,0.10)',
};

export default function OnboardingV2ValueProofScreen() {
  const lang = resolveAppLanguage();
  const METRICS = [
    { value: '7', label: t('onboarding.value_proof.metric_execution_preview', { lang }) },
    { value: '3', label: t('onboarding.value_proof.metric_balancing_layers', { lang }) },
    { value: '100%', label: t('onboarding.value_proof.metric_availability_based', { lang }) },
  ];
  const CARDS = [
    {
      accent: C.accent0,
      title: t('onboarding.value_proof.card_schedule_title', { lang }),
      body: t('onboarding.value_proof.card_schedule_body', { lang }),
    },
    {
      accent: C.accent1,
      title: t('onboarding.value_proof.card_pressure_title', { lang }),
      body: t('onboarding.value_proof.card_pressure_body', { lang }),
    },
    {
      accent: C.accent2,
      title: t('onboarding.value_proof.card_execution_title', { lang }),
      body: t('onboarding.value_proof.card_execution_body', { lang }),
    },
  ];

  useEffect(() => { void trackOnboardingStepView('value_proof'); }, []);

  const entrance = useRef(new Animated.Value(0)).current;
  const metricAnims = useRef(METRICS.map(() => new Animated.Value(0))).current;
  const cardAnims = useRef(CARDS.map(() => new Animated.Value(0))).current;
  const noteFade = useRef(new Animated.Value(0)).current;
  const ctaFade = useRef(new Animated.Value(0)).current;
  const ctaScale = useRef(new Animated.Value(1)).current;
  const orbPulse = useRef(new Animated.Value(0.88)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(orbPulse, { toValue: 1.10, duration: 3600, useNativeDriver: true }),
        Animated.timing(orbPulse, { toValue: 0.88, duration: 3600, useNativeDriver: true }),
      ])
    ).start();

    Animated.timing(entrance, { toValue: 1, duration: 440, useNativeDriver: true }).start();

    metricAnims.forEach((a, i) =>
      Animated.spring(a, { toValue: 1, damping: 22, stiffness: 160, delay: 200 + i * 100, useNativeDriver: true }).start()
    );
    cardAnims.forEach((a, i) =>
      Animated.timing(a, { toValue: 1, duration: 360, delay: 420 + i * 100, useNativeDriver: true }).start()
    );
    Animated.timing(noteFade, { toValue: 1, duration: 360, delay: 780, useNativeDriver: true }).start();
    Animated.timing(ctaFade, { toValue: 1, duration: 360, delay: 900, useNativeDriver: true }).start();
  // Intentionally mount-only entrance timeline.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBack = () => {
    void trackOnboardingStepBack('value_proof');
    router.back();
  };
  const handleContinue = () => {
    void trackOnboardingStepContinue('value_proof');
    router.push('/(onboarding-v2)/country-select');
  };

  const pressIn = () => Animated.spring(ctaScale, { toValue: 0.97, damping: 20, stiffness: 400, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(ctaScale, { toValue: 1, damping: 18, stiffness: 360, useNativeDriver: true }).start();

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <LinearGradient colors={[C.bg0, C.bg1, C.bg2, C.bg3]} locations={[0, 0.3, 0.65, 1]} style={StyleSheet.absoluteFill} />

      {/* Orbs */}
      <Animated.View style={[styles.orbA, { backgroundColor: C.orbA, transform: [{ scale: orbPulse }] }]} />
      <View style={[styles.orbB, { backgroundColor: C.orbB }]} />

      {/* Grid */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {[0,1,2,3,4,5].map(i => (
          <View key={`v${i}`} style={{ position:'absolute', top:0, bottom:0, left:`${i*20}%`, width:StyleSheet.hairlineWidth, backgroundColor:C.grid }} />
        ))}
        {[0,1,2,3,4,5,6].map(i => (
          <View key={`h${i}`} style={{ position:'absolute', left:0, right:0, top:`${i*15}%`, height:StyleSheet.hairlineWidth, backgroundColor:C.grid }} />
        ))}
      </View>

      {/* ── Content ─────────────────────────────────────────── */}
      <Animated.View style={[styles.inner, { opacity: entrance }]}>

        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: C.backBg, borderColor: C.backBorder }]}
            onPress={handleBack}
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

        {/* Progress bar */}
        <View style={[styles.progressTrack, { backgroundColor: C.divider }]}>
          <View style={styles.progressFill}>
            <LinearGradient colors={[C.btnA, C.btnB]} start={{ x:0,y:0 }} end={{ x:1,y:0 }} style={StyleSheet.absoluteFill} />
          </View>
        </View>
        <Text style={[styles.stepLabel, { color: C.labelMuted }]}>
          {t('common.step_of', { lang, params: { current: 1, total: 13 } })}
        </Text>

        {/* Title */}
        <Text style={[styles.title, { color: C.title }]}>{t('onboarding.value_proof.title', { lang })}</Text>
        <Text style={[styles.sub, { color: C.sub }]}>
          {t('onboarding.value_proof.subtitle', { lang })}
        </Text>

        {/* Metric board */}
        <View style={[styles.board, { backgroundColor: C.boardBg, borderColor: C.boardBorder }]}>
          {METRICS.map((m, i) => (
            <React.Fragment key={m.value}>
              <Animated.View
                style={[
                  styles.metricCell,
                  {
                    opacity: metricAnims[i],
                    transform: [{
                      translateY: metricAnims[i].interpolate({ inputRange:[0,1], outputRange:[12,0] }),
                    }],
                  },
                ]}
              >
                <Text style={[styles.metricVal, { color: C.metricVal }]}>{m.value}</Text>
                <Text style={[styles.metricLbl, { color: C.metricLbl }]}>{m.label}</Text>
              </Animated.View>
              {i < METRICS.length - 1 && (
                <View style={[styles.metricDivider, { backgroundColor: C.divider }]} />
              )}
            </React.Fragment>
          ))}
        </View>

        {/* Feature cards */}
        <View style={styles.cardList}>
          {CARDS.map((card, i) => (
            <Animated.View
              key={card.title}
              style={[
                styles.card,
                { backgroundColor: C.cardBg, borderColor: C.cardBorder },
                {
                  opacity: cardAnims[i],
                  transform: [{
                    translateX: cardAnims[i].interpolate({ inputRange:[0,1], outputRange:[14,0] }),
                  }],
                },
              ]}
            >
              <View style={[styles.cardAccent, { backgroundColor: card.accent }]} />
              <View style={styles.cardBody}>
                <Text style={[styles.cardTitle, { color: C.title }]}>{card.title}</Text>
                <Text style={[styles.cardText, { color: C.sub }]}>{card.body}</Text>
              </View>
              <View style={[styles.cardTag, { backgroundColor: card.accent + '20' }]}>
                <Text style={[styles.cardTagText, { color: card.accent }]}>✓</Text>
              </View>
            </Animated.View>
          ))}
        </View>

        {/* Bottom note */}
        <Animated.View style={[styles.note, { backgroundColor: C.noteBg, borderColor: C.noteBorder, opacity: noteFade }]}>
          <Text style={[styles.noteEmoji]}>→</Text>
          <Text style={[styles.noteText, { color: C.sub }]}>
            {t('onboarding.value_proof.note', { lang })}
          </Text>
        </Animated.View>
      </Animated.View>

      {/* ── Footer CTA ──────────────────────────────────────── */}
      <Animated.View
        style={[styles.footer, { backgroundColor: C.footer, borderTopColor: C.footerBorder, opacity: ctaFade }]}
      >
        <Animated.View style={{ transform: [{ scale: ctaScale }] }}>
          <TouchableOpacity
            style={styles.cta}
            onPress={handleContinue}
            onPressIn={pressIn}
            onPressOut={pressOut}
            activeOpacity={1}
          >
            <LinearGradient colors={[C.btnA, C.btnB]} start={{ x:0,y:0 }} end={{ x:1,y:1 }} style={StyleSheet.absoluteFill} />
            <View style={styles.ctaSheen} />
            <Text style={styles.ctaText}>{t('common.continue', { lang })}</Text>
            <Text style={styles.ctaArrow}>→</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080C0B' },
  orbA: { position:'absolute', width:300, height:300, borderRadius:999, top:-80, right:-120 },
  orbB: { position:'absolute', width:200, height:200, borderRadius:999, bottom:160, left:-90 },

  inner: { flex: 1, paddingHorizontal: 21, paddingTop: 9, paddingBottom: 104 },

  // Header
  headerRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: 14 },
  backBtn: { width:36, height:36, borderRadius:11, borderWidth:1, justifyContent:'center', alignItems:'center' },
  backArrow: { fontSize:26, fontWeight:'300', lineHeight:30, marginTop:-1 },
  brandRow: { flexDirection:'row', alignItems:'center', gap:6 },
  brandMark: { width:7, height:7, borderRadius:2 },
  brandText: { fontSize:14, fontWeight:'800', letterSpacing:0.4 },

  // Progress
  progressTrack: { height:3, borderRadius:999, overflow:'hidden', marginBottom:7 },
  progressFill: { width:'9%', height:'100%', borderRadius:999, overflow:'hidden' },
  stepLabel: { fontSize:9, fontWeight:'600', letterSpacing:0.8, textTransform:'uppercase', marginBottom:15, opacity:0.65 },

  // Title
  title: { fontSize:31, fontWeight:'900', lineHeight:36, letterSpacing:-0.7, marginBottom:7 },
  sub: { fontSize:13, lineHeight:20, fontWeight:'400', marginBottom:17 },

  // Board
  board: {
    flexDirection:'row',
    alignItems:'stretch',
    borderWidth:1,
    borderRadius:16,
    paddingVertical:14,
    paddingHorizontal:8,
    marginBottom:13,
  },
  metricCell: { flex:1, alignItems:'center', justifyContent:'center', paddingHorizontal:4 },
  metricVal: { fontSize:24, fontWeight:'900', letterSpacing:-0.7, lineHeight:28 },
  metricLbl: { fontSize:10, fontWeight:'500', textAlign:'center', lineHeight:14, marginTop:3, letterSpacing:0.2 },
  metricDivider: { width:1, marginVertical:6 },

  // Cards
  cardList: { gap:8, marginBottom:13 },
  card: {
    flexDirection:'row',
    alignItems:'center',
    borderWidth:1,
    borderRadius:14,
    padding:13,
    gap:10,
  },
  cardAccent: { width:3, borderRadius:99, alignSelf:'stretch', minHeight:36 },
  cardBody: { flex:1, gap:4 },
  cardTitle: { fontSize:14, fontWeight:'800', letterSpacing:-0.1 },
  cardText: { fontSize:11, lineHeight:17, fontWeight:'400' },
  cardTag: { width:26, height:26, borderRadius:8, alignItems:'center', justifyContent:'center' },
  cardTagText: { fontSize:12, fontWeight:'700' },

  // Note
  note: {
    flexDirection:'row',
    alignItems:'flex-start',
    gap:10,
    borderWidth:1,
    borderRadius:13,
    padding:11,
  },
  noteEmoji: { fontSize:14, color:'#34D399', marginTop:1 },
  noteText: { flex:1, fontSize:11, lineHeight:17, fontWeight:'400' },

  // Footer
  footer: {
    position:'absolute', left:0, right:0, bottom:0,
    paddingHorizontal:21, paddingTop:6, paddingBottom:36,
    borderTopWidth:StyleSheet.hairlineWidth,
  },
  cta: {
    height:48, borderRadius:FOOTER.ctaRadius, flexDirection:'row',
    alignItems:'center', justifyContent:'center',
    overflow:'hidden', gap:8,
    shadowColor:'#10B981', shadowOffset:{width:0,height:6},
    shadowOpacity:0.36, shadowRadius:16, elevation:8,
  },
  ctaSheen: { position:'absolute', top:0, left:0, right:0, height:'44%', backgroundColor:'rgba(255,255,255,0.12)' },
  ctaText: { color:'#fff', fontSize:15, fontWeight:'800', letterSpacing:0.2 },
  ctaArrow: { color:'rgba(255,255,255,0.75)', fontSize:16 },
});
