/**
 * splash.tsx — "Momentum Board"
 *
 * Light slate variant. Fully self-contained — no theme dependency.
 * All colors hardcoded. Floating hero card with teal accent bar,
 * animated KPI tiles, clean proof rows, social proof strip.
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

import { resolveAppLanguage, t } from '@/app/i18n';
import { trackOnboardingStepContinue, trackOnboardingStepView } from '@/app/utils/onboardingV2Analytics';

// ── Hardcoded palette ────────────────────────────────────────────────────────
const C = {
  bg0: '#F8FAFB',
  bg1: '#F2F6F8',
  bg2: '#EBF0F4',
  bg3: '#F6F9FA',
  orbA: 'rgba(15,157,140,0.09)',
  orbB: 'rgba(100,116,139,0.06)',
  orbC: 'rgba(15,157,140,0.06)',
  grid: 'rgba(0,0,0,0.032)',

  // Typography
  title: '#0F172A',
  sub: '#475569',
  label: '#0F766E',

  // Teal accent family
  teal: '#0F9D8C',
  tealDark: '#0B7A6E',
  tealSoft: 'rgba(15,157,140,0.09)',
  tealBorder: 'rgba(15,157,140,0.14)',
  tealText: '#0F9D8C',

  // Cards
  card: '#FFFFFF',
  cardBorder: 'rgba(15,23,42,0.07)',
  cardShadow: 'rgba(15,157,140,0.10)',

  // CTA
  btnA: '#0F9D8C',
  btnB: '#0B7A6E',
  btnShadow: '#0F9D8C',

  // Footer
  footer: 'rgba(248,250,251,0.94)',
};

export default function OnboardingV2SplashScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const lang = resolveAppLanguage();
  const PROOF = [
    {
      title: t('onboarding.splash.proof_1_title', { lang, fallback: 'Fits your real week' }),
      body: t('onboarding.splash.proof_1_body', { lang, fallback: 'Choose exact days and time windows - we map around your life.' }),
    },
    {
      title: t('onboarding.splash.proof_2_title', { lang, fallback: 'Balanced by intensity' }),
      body: t('onboarding.splash.proof_2_body', { lang, fallback: 'Load distributed by subject difficulty and exam proximity.' }),
    },
    {
      title: t('onboarding.splash.proof_3_title', { lang, fallback: 'Adapts as you go' }),
      body: t('onboarding.splash.proof_3_body', { lang, fallback: 'Missed a session or weak on a topic? Plan rebalances automatically — your exam date stays fixed.' }),
    },
  ];
  const KPIS = [
    { val: t('onboarding.splash.kpi_1_value', { lang, fallback: '60s' }), lbl: t('onboarding.splash.kpi_1_label', { lang, fallback: 'to configure' }) },
    { val: t('onboarding.splash.kpi_2_value', { lang, fallback: 'Daily' }), lbl: t('onboarding.splash.kpi_2_label', { lang, fallback: 'task list' }) },
    { val: t('onboarding.splash.kpi_3_value', { lang, fallback: '∞' }), lbl: t('onboarding.splash.kpi_3_label', { lang, fallback: 'adapts weekly' }) },
  ];

  useEffect(() => { void trackOnboardingStepView('splash'); }, []);

  const scrollFade = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(20)).current;
  const floatY = useRef(new Animated.Value(0)).current;
  const proofAnims = useRef(PROOF.map(() => new Animated.Value(0))).current;
  const kpiAnims = useRef(KPIS.map(() => new Animated.Value(0))).current;
  const socialFade = useRef(new Animated.Value(0)).current;
  const ctaFade = useRef(new Animated.Value(0)).current;
  const ctaScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Scroll content fade-in
    Animated.timing(scrollFade, { toValue: 1, duration: 440, useNativeDriver: true }).start();

    // Hero card slides up
    Animated.spring(cardSlide, { toValue: 0, damping: 22, stiffness: 160, useNativeDriver: true }).start();

    // KPI tiles stagger
    kpiAnims.forEach((a, i) =>
      Animated.timing(a, { toValue: 1, duration: 340, delay: 300 + i * 90, useNativeDriver: true }).start()
    );

    // Proof rows stagger
    proofAnims.forEach((a, i) =>
      Animated.timing(a, { toValue: 1, duration: 340, delay: 550 + i * 100, useNativeDriver: true }).start()
    );

    Animated.timing(socialFade, { toValue: 1, duration: 340, delay: 880, useNativeDriver: true }).start();
    Animated.timing(ctaFade, { toValue: 1, duration: 340, delay: 1000, useNativeDriver: true }).start();

    // Gentle hero card float
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, { toValue: -6, duration: 2800, useNativeDriver: true }),
        Animated.timing(floatY, { toValue: 0, duration: 2800, useNativeDriver: true }),
      ])
    ).start();
  // Mount-only hero animation setup; refs are stable.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleContinue = () => {
    void trackOnboardingStepContinue('splash');
    router.push('/(onboarding-v2)/value-proof');
  };

  const pressCta = () =>
    Animated.sequence([
      Animated.spring(ctaScale, { toValue: 0.97, damping: 20, stiffness: 400, useNativeDriver: true }),
      Animated.spring(ctaScale, { toValue: 1, damping: 18, stiffness: 360, useNativeDriver: true }),
    ]).start();

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      {/* Background */}
      <LinearGradient
        colors={[C.bg0, C.bg1, C.bg2, C.bg3]}
        locations={[0, 0.35, 0.70, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Soft orbs */}
      <View style={[styles.orbA, isTablet && styles.orbATablet, { backgroundColor: C.orbA }]} />
      <View style={[styles.orbB, isTablet && styles.orbBTablet, { backgroundColor: C.orbB }]} />
      <View style={[styles.orbC, isTablet && styles.orbCTablet, { backgroundColor: C.orbC }]} />

      {/* Fine grid */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {[0,1,2,3,4,5,6].map(i => (
          <View key={`v${i}`} style={{ position:'absolute', top:0, bottom:0, left:`${i*16.6}%`, width:StyleSheet.hairlineWidth, backgroundColor:C.grid }} />
        ))}
        {[0,1,2,3,4,5,6,7].map(i => (
          <View key={`h${i}`} style={{ position:'absolute', left:0, right:0, top:`${i*12.5}%`, height:StyleSheet.hairlineWidth, backgroundColor:C.grid }} />
        ))}
      </View>

      {/* ── Fixed body (no scroll) ─────────────────────────── */}
      <Animated.View style={[styles.flex, { opacity: scrollFade }]}>
        <View style={[styles.scrollContent, isTablet && styles.scrollContentTablet]}>
          {/* Header row */}
          <View style={[styles.headerRow, isTablet && styles.headerRowTablet]}>
            <View style={[styles.brandRow, isTablet && styles.brandRowTablet]}>
              <View style={[styles.brandMark, isTablet && styles.brandMarkTablet, { backgroundColor: C.teal }]} />
              <Text style={[styles.brandText, isTablet && styles.brandTextTablet, { color: C.teal }]}>StudyMap</Text>
            </View>
          </View>

          {/* Page title */}
          <Text style={[styles.pageTitle, isTablet && styles.pageTitleTablet, { color: C.title }]}>
            {t('onboarding.splash.title', { lang, fallback: "Build the plan\nyou'll actually keep." })}
          </Text>
          <Text style={[styles.pageSub, isTablet && styles.pageSubTablet, { color: C.sub }]}>
            {t('onboarding.splash.subtitle', {
              lang,
              fallback: 'Adaptive system for real schedules - personalized, measurable, ready in 60 seconds.',
            })}
          </Text>

          {/* ── Hero card ─────────────────────────────────── */}
          <Animated.View
            style={[
              styles.heroCard,
              isTablet && styles.heroCardTablet,
              {
                transform: [
                  { translateY: Animated.add(cardSlide, floatY) },
                ],
              },
            ]}
          >
            {/* Teal accent top bar */}
            <LinearGradient
              colors={[C.btnA, C.btnB]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.accentBar}
            />

            <View style={[styles.heroInner, isTablet && styles.heroInnerTablet]}>
              <Text style={[styles.heroLabel, isTablet && styles.heroLabelTablet, { color: C.label }]}>
                {t('onboarding.splash.hero_label', { lang, fallback: 'WHAT YOU GET' })}
              </Text>
              <Text style={[styles.heroHeadline, isTablet && styles.heroHeadlineTablet, { color: C.title }]}>
                {t('onboarding.splash.hero_headline', { lang, fallback: 'A score-moving plan built for your exact schedule.' })}
              </Text>

              {/* KPI tiles */}
              <View style={[styles.kpiRow, isTablet && styles.kpiRowTablet]}>
                {KPIS.map((k, i) => (
                  <Animated.View
                    key={k.val}
                    style={[
                      styles.kpi,
                      isTablet && styles.kpiTablet,
                      { backgroundColor: C.tealSoft, opacity: kpiAnims[i] },
                      {
                        transform: [{
                          translateY: kpiAnims[i].interpolate({ inputRange:[0,1], outputRange:[10,0] }),
                        }],
                      },
                    ]}
                  >
                    {/* Top accent line */}
                    <View style={[styles.kpiLine, { backgroundColor: C.teal }]} />
                    <Text style={[styles.kpiVal, isTablet && styles.kpiValTablet, { color: C.tealText }]}>{k.val}</Text>
                    <Text style={[styles.kpiLbl, isTablet && styles.kpiLblTablet, { color: C.sub }]}>{k.lbl}</Text>
                  </Animated.View>
                ))}
              </View>
            </View>
          </Animated.View>

          {/* ── Proof rows ─────────────────────────────── */}
          <View style={[styles.proofList, isTablet && styles.proofListTablet]}>
            {PROOF.map((p, i) => (
            <Animated.View
              key={p.title}
              style={[
                styles.proofRow,
                isTablet && styles.proofRowTablet,
                { borderColor: C.cardBorder, backgroundColor: C.card },
                  {
                    opacity: proofAnims[i],
                    transform: [{
                      translateX: proofAnims[i].interpolate({ inputRange:[0,1], outputRange:[12,0] }),
                    }],
                  },
                ]}
              >
                <View style={[styles.proofLead, isTablet && styles.proofLeadTablet]}>
                  <Text style={[styles.proofLeadNum, isTablet && styles.proofLeadNumTablet, { color: C.tealText }]}>0{i + 1}</Text>
                  <View style={[styles.proofLeadBars, isTablet && styles.proofLeadBarsTablet]}>
                    <View style={[styles.proofLeadBar, isTablet && styles.proofLeadBarTablet, { backgroundColor: C.tealText, opacity: 0.9 }]} />
                    <View style={[styles.proofLeadBar, isTablet && styles.proofLeadBarTablet, { backgroundColor: C.tealText, opacity: 0.55 }]} />
                  </View>
                </View>
                <View style={styles.proofCopy}>
                  <Text style={[styles.proofTitle, isTablet && styles.proofTitleTablet, { color: C.title }]}>{p.title}</Text>
                  <Text style={[styles.proofBody, isTablet && styles.proofBodyTablet, { color: C.sub }]}>{p.body}</Text>
                </View>
                {/* Teal right accent */}
                <View style={[styles.proofAccent, isTablet && styles.proofAccentTablet, { backgroundColor: C.tealSoft }]}>
                  <Text style={[styles.proofAccentText, isTablet && styles.proofAccentTextTablet, { color: C.tealText }]}>✓</Text>
                </View>
              </Animated.View>
            ))}
          </View>

          {/* ── Social proof ───────────────────────────── */}
          <Animated.View
            style={[
              styles.social,
              isTablet && styles.socialTablet,
              { borderColor: C.tealBorder, backgroundColor: C.card, opacity: socialFade },
            ]}
          >
            <View style={styles.avatarStack}>
              {[C.teal, '#0B8C7C', '#0D9488', C.tealDark].map((c, i) => (
                <View
                  key={i}
                  style={[
                    styles.ava,
                    { backgroundColor: c, marginLeft: i === 0 ? 0 : -10 },
                  ]}
                >
                  <Text style={[styles.avaText, isTablet && styles.avaTextTablet]}>
                    {['S', 'M', 'R', '+'][i]}
                  </Text>
                </View>
              ))}
            </View>
            <View style={styles.socialCopy}>
              <Text style={[styles.socialBold, isTablet && styles.socialBoldTablet, { color: C.title }]}>
                {t('onboarding.splash.social_bold', { lang, fallback: '12,400+ students' })}
              </Text>
              <Text style={[styles.socialSub, isTablet && styles.socialSubTablet, { color: C.sub }]}>
                {t('onboarding.splash.social_sub', { lang, fallback: 'improved scores with StudyMap' })}
              </Text>
            </View>
            <View style={[styles.ratingBadge, isTablet && styles.ratingBadgeTablet, { backgroundColor: C.tealSoft }]}>
              <Text style={[styles.ratingText, isTablet && styles.ratingTextTablet, { color: C.tealText }]}>★ 4.9</Text>
            </View>
          </Animated.View>

          {/* Bottom spacer for footer */}
          <View style={{ height: 72 }} />
        </View>
      </Animated.View>

      {/* ── Sticky footer CTA ─────────────────────────── */}
      <Animated.View
        style={[
          styles.footer,
          isTablet && styles.footerTablet,
          { backgroundColor: C.footer, opacity: ctaFade },
        ]}
      >
        <Animated.View style={{ transform: [{ scale: ctaScale }] }}>
          <TouchableOpacity
            style={[styles.cta, isTablet && styles.ctaTablet]}
            onPress={() => { pressCta(); handleContinue(); }}
            activeOpacity={1}
          >
            <LinearGradient
              colors={[C.btnA, C.btnB]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.ctaSheen} />
            <Text style={[styles.ctaText, isTablet && styles.ctaTextTablet]}>{t('onboarding.splash.cta', { lang, fallback: 'Start In 60 Seconds' })}</Text>
            <Text style={[styles.ctaArrow, isTablet && styles.ctaArrowTablet]}>→</Text>
          </TouchableOpacity>
        </Animated.View>
        <Text style={[styles.ctaHint, isTablet && styles.ctaHintTablet, { color: C.sub }]}>
          {t('onboarding.splash.cta_hint', { lang, fallback: 'Set up in 60s · Built for your exam' })}
        </Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFB',
  },
  flex: { flex: 1 },

  scrollContent: {
    paddingHorizontal: 19,
    paddingTop: 6,
  },
  scrollContentTablet: {
    paddingHorizontal: 36,
    paddingTop: 34,
    paddingBottom: 164,
    maxWidth: 1080,
    width: '100%',
    alignSelf: 'center',
  },

  // Orbs
  orbA: { position:'absolute', width:280, height:280, borderRadius:999, top:-80, right:-110 },
  orbB: { position:'absolute', width:200, height:200, borderRadius:999, top:320, left:-100 },
  orbC: { position:'absolute', width:180, height:180, borderRadius:999, bottom:160, right:-90 },
  orbATablet: { width: 420, height: 420, top: -120, right: -140 },
  orbBTablet: { width: 280, height: 280, top: 420, left: -120 },
  orbCTablet: { width: 240, height: 240, bottom: 220, right: -110 },

  // Header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 13,
    paddingTop: 2,
  },
  headerRowTablet: { marginBottom: 24, paddingTop: 8 },
  brandRow: { flexDirection:'row', alignItems:'center', gap:6 },
  brandRowTablet: { gap: 8 },
  brandMark: { width:7, height:7, borderRadius:2 },
  brandMarkTablet: { width: 10, height: 10, borderRadius: 3 },
  brandText: { fontSize:14, fontWeight:'800', letterSpacing:0.4 },
  brandTextTablet: { fontSize: 18, letterSpacing: 0.5 },

  // Title
  pageTitle: {
    fontSize: 31,
    fontWeight: '900',
    lineHeight: 36,
    letterSpacing: -0.8,
    marginBottom: 8,
  },
  pageTitleTablet: {
    fontSize: 68,
    lineHeight: 74,
    marginBottom: 17,
    maxWidth: 880,
  },
  pageSub: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '400',
    marginBottom: 14,
  },
  pageSubTablet: {
    fontSize: 25,
    lineHeight: 35,
    marginBottom: 27,
    maxWidth: 920,
  },

  // Hero card
  heroCard: {
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(15,157,140,0.13)',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    marginBottom: 13,
    shadowColor: '#0F9D8C',
    shadowOffset: { width:0, height:6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  heroCardTablet: {
    borderRadius: 27,
    marginBottom: 23,
  },
  accentBar: { height: 3 },
  heroInner: { padding: 13 },
  heroInnerTablet: { padding: 28 },
  heroLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  heroLabelTablet: { fontSize: 14, marginBottom: 8 },
  heroHeadline: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
    letterSpacing: -0.2,
    marginBottom: 10,
  },
  heroHeadlineTablet: {
    fontSize: 32,
    lineHeight: 40,
    marginBottom: 19,
    maxWidth: 760,
  },

  // KPI
  kpiRow: { flexDirection:'row', gap:7 },
  kpiRowTablet: { gap: 14 },
  kpi: {
    flex: 1,
    borderRadius: 11,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 4,
    overflow: 'hidden',
  },
  kpiTablet: {
    borderRadius: 19,
    paddingVertical: 21,
    paddingHorizontal: 15,
    gap: 7,
  },
  kpiLine: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 2,
    borderRadius: 99,
  },
  kpiVal: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginTop: 3,
  },
  kpiValTablet: { fontSize: 32, marginTop: 4 },
  kpiLbl: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  kpiLblTablet: { fontSize: 14, lineHeight: 19 },

  // Proof
  proofList: { gap: 8, marginBottom: 11 },
  proofListTablet: { gap: 14, marginBottom: 18 },
  proofRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderWidth: 1,
    borderRadius: 13,
    padding: 11,
    shadowColor: '#000',
    shadowOffset: { width:0, height:1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  proofRowTablet: {
    gap: 14,
    borderRadius: 21,
    padding: 19,
  },
  proofLead: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.tealSoft,
    borderWidth: 1,
    borderColor: C.tealBorder,
    gap: 2,
    flexShrink: 0,
  },
  proofLeadTablet: {
    width: 48,
    height: 48,
    borderRadius: 14,
    gap: 3,
  },
  proofLeadNum: { fontSize: 10, fontWeight: '800', lineHeight: 11, letterSpacing: 0.3 },
  proofLeadNumTablet: { fontSize: 13, lineHeight: 14 },
  proofLeadBars: { width: 14, gap: 2 },
  proofLeadBarsTablet: { width: 18, gap: 3 },
  proofLeadBar: { height: 2, borderRadius: 2 },
  proofLeadBarTablet: { height: 3, borderRadius: 3 },
  proofCopy: { flex: 1, gap: 2 },
  proofTitle: { fontSize: 13, fontWeight: '700', letterSpacing: -0.1 },
  proofTitleTablet: { fontSize: 18, lineHeight: 24 },
  proofBody: { fontSize: 11, lineHeight: 15, fontWeight: '400' },
  proofBodyTablet: { fontSize: 15, lineHeight: 22 },
  proofAccent: {
    width: 22,
    height: 22,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  proofAccentTablet: { width: 28, height: 28, borderRadius: 9 },
  proofAccentText: { fontSize: 12, fontWeight: '700' },
  proofAccentTextTablet: { fontSize: 15 },

  // Social
  social: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderWidth: 1,
    borderRadius: 13,
    padding: 11,
  },
  socialTablet: {
    gap: 14,
    borderRadius: 21,
    padding: 19,
  },
  avatarStack: { flexDirection:'row' },
  ava: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avaText: { color:'#fff', fontSize:9, fontWeight:'800' },
  avaTextTablet: { fontSize: 11 },
  socialCopy: { flex:1, gap:2 },
  socialBold: { fontSize:12, fontWeight:'700' },
  socialBoldTablet: { fontSize: 16 },
  socialSub: { fontSize:11, fontWeight:'400' },
  socialSubTablet: { fontSize: 14, lineHeight: 20 },
  ratingBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 99,
  },
  ratingBadgeTablet: { paddingVertical: 6, paddingHorizontal: 10 },
  ratingText: { fontSize:10, fontWeight:'800' },
  ratingTextTablet: { fontSize: 13 },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 6,
    left: 0,
    right: 0,
    paddingHorizontal: 19,
    paddingTop: 10,
    paddingBottom: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(15,23,42,0.07)',
    gap: 8,
  },
  footerTablet: {
    bottom: 10,
    paddingHorizontal: 36,
    paddingTop: 16,
    paddingBottom: 34,
    gap: 10,
  },
  cta: {
    height: 52,
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    gap: 8,
    shadowColor: '#0F9D8C',
    shadowOffset: { width:0, height:6 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 8,
  },
  ctaTablet: {
    height: 72,
    borderRadius: 21,
  },
  ctaSheen: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: '44%',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  ctaText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  ctaTextTablet: { fontSize: 24 },
  ctaArrow: {
    color: 'rgba(255,255,255,0.80)',
    fontSize: 17,
  },
  ctaArrowTablet: { fontSize: 24 },
  ctaHint: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.2,
    opacity: 0.65,
  },
  ctaHintTablet: { fontSize: 14, lineHeight: 20 },
});
