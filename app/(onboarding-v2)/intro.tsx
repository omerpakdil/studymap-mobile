/**
 * intro.tsx — "First Impression"
 *
 * Fully self-contained dark screen — does NOT use OnboardingScaffold.
 * Colors are hardcoded so nothing can override them.
 * Dark teal-ink background, crisp white headline, teal accents.
 */
import { useOnboardingV2 } from '@/app/(onboarding-v2)/state';
import { resolveAppLanguage, t } from '@/app/i18n';
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

// ── Hardcoded palette (no theme dependency) ──────────────────────────────────
const C = {
  bg0: '#080C0B',
  bg1: '#0C1210',
  bg2: '#0F1A18',
  bg3: '#080C0B',
  orbA: 'rgba(20,184,166,0.30)',
  orbB: 'rgba(52,211,153,0.16)',
  headline: '#ECFDF5',          // near-white green tint
  sub: 'rgba(167,243,208,0.65)',
  badge: '#34D399',
  badgeBg: 'rgba(52,211,153,0.14)',
  badgeBorder: 'rgba(52,211,153,0.22)',
  pillBg: 'rgba(255,255,255,0.05)',
  pillBorder: 'rgba(52,211,153,0.16)',
  pillVal: '#34D399',
  pillLbl: 'rgba(167,243,208,0.55)',
  btnA: '#10B981',
  btnB: '#059669',
  btnShadow: '#10B981',
  btnText: '#fff',
  hint: 'rgba(110,231,183,0.38)',
  grid: 'rgba(255,255,255,0.035)',
  shape: 'rgba(52,211,153,0.18)',
  shapeInner: 'rgba(52,211,153,0.10)',
};

export default function OnboardingV2IntroScreen() {
  const { resetDraft } = useOnboardingV2();
  const lang = resolveAppLanguage();
  const WORDS = [
    t('onboarding.intro.word_1', { lang, fallback: 'Your' }),
    t('onboarding.intro.word_2', { lang, fallback: 'smartest' }),
    t('onboarding.intro.word_3', { lang, fallback: 'study' }),
    t('onboarding.intro.word_4', { lang, fallback: 'plan' }),
    t('onboarding.intro.word_5', { lang, fallback: 'starts' }),
    t('onboarding.intro.word_6', { lang, fallback: 'here.' }),
  ];
  const wordAnims = useRef(WORDS.map(() => new Animated.Value(0))).current;
  const subFade = useRef(new Animated.Value(0)).current;
  const statsFade = useRef(new Animated.Value(0)).current;
  const ctaSlide = useRef(new Animated.Value(24)).current;
  const ctaFade = useRef(new Animated.Value(0)).current;
  const shapeRotate = useRef(new Animated.Value(0)).current;
  const orbPulse = useRef(new Animated.Value(0.90)).current;

  useEffect(() => {
    // Always start onboarding from a clean state.
    void resetDraft();

    // Orb breathe
    Animated.loop(
      Animated.sequence([
        Animated.timing(orbPulse, { toValue: 1.08, duration: 3400, useNativeDriver: true }),
        Animated.timing(orbPulse, { toValue: 0.90, duration: 3400, useNativeDriver: true }),
      ])
    ).start();

    // Slow shape rotation
    Animated.loop(
      Animated.timing(shapeRotate, { toValue: 1, duration: 20000, useNativeDriver: true })
    ).start();

    // Staggered word reveals
    wordAnims.forEach((a, i) =>
      Animated.timing(a, {
        toValue: 1,
        duration: 400,
        delay: 150 + i * 100,
        useNativeDriver: true,
      }).start()
    );

    Animated.timing(subFade, { toValue: 1, duration: 400, delay: 800, useNativeDriver: true }).start();
    Animated.timing(statsFade, { toValue: 1, duration: 400, delay: 1000, useNativeDriver: true }).start();
    Animated.parallel([
      Animated.timing(ctaFade, { toValue: 1, duration: 400, delay: 1200, useNativeDriver: true }),
      Animated.spring(ctaSlide, { toValue: 0, damping: 20, stiffness: 150, delay: 1200, useNativeDriver: true }),
    ]).start();
  // Initial hero animation sequence; refs are stable for mount lifecycle.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetDraft]);

  const spin = shapeRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Background gradient */}
      <LinearGradient
        colors={[C.bg0, C.bg1, C.bg2, C.bg3]}
        locations={[0, 0.3, 0.65, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Orbs */}
      <Animated.View
        style={[styles.orbA, { backgroundColor: C.orbA, transform: [{ scale: orbPulse }] }]}
      />
      <View style={[styles.orbB, { backgroundColor: C.orbB }]} />

      {/* Rotating geometric shape */}
      <Animated.View style={[styles.shapeWrap, { transform: [{ rotate: spin }] }]}>
        <View style={[styles.shape, { borderColor: C.shape }]} />
        <View style={[styles.shapeInner, { borderColor: C.shapeInner }]} />
      </Animated.View>

      {/* Fine grid lines */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {[0, 1, 2, 3, 4, 5].map(i => (
          <View
            key={`v${i}`}
            style={{
              position: 'absolute', top: 0, bottom: 0,
              left: `${i * 20}%`, width: StyleSheet.hairlineWidth,
              backgroundColor: C.grid,
            }}
          />
        ))}
        {[0, 1, 2, 3, 4, 5, 6].map(i => (
          <View
            key={`h${i}`}
            style={{
              position: 'absolute', left: 0, right: 0,
              top: `${i * 15}%`, height: StyleSheet.hairlineWidth,
              backgroundColor: C.grid,
            }}
          />
        ))}
      </View>

      {/* ── Main content ───────────────────────────────── */}
      <View style={styles.content}>

        {/* Badge */}
        <View style={[styles.badge, { backgroundColor: C.badgeBg, borderColor: C.badgeBorder }]}>
          <View style={[styles.badgeDot, { backgroundColor: C.badge }]} />
          <Text style={[styles.badgeText, { color: C.badge }]}>
            {t('onboarding.intro.badge', { lang, fallback: 'STUDYMAP' })}
          </Text>
        </View>

        {/* Headline */}
        <View style={styles.headlineWrap}>
          {WORDS.map((word, i) => (
            <Animated.Text
              key={i}
              style={[
                styles.headWord,
                { color: C.headline },
                {
                  opacity: wordAnims[i],
                  transform: [{
                    translateY: wordAnims[i].interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  }],
                },
              ]}
            >
              {word}{' '}
            </Animated.Text>
          ))}
        </View>

        {/* Subtitle */}
        <Animated.Text style={[styles.sub, { color: C.sub, opacity: subFade }]}>
          {t('onboarding.intro.subtitle', {
            lang,
            fallback: 'Adaptive plans built around your schedule - not a generic template.',
          })}
        </Animated.Text>

        {/* Stat pills */}
        <Animated.View style={[styles.statsRow, { opacity: statsFade }]}>
          {[
            { v: t('onboarding.intro.stat_1_value', { lang, fallback: '60s' }), l: t('onboarding.intro.stat_1_label', { lang, fallback: 'Setup' }) },
            { v: t('onboarding.intro.stat_2_value', { lang, fallback: '7-day' }), l: t('onboarding.intro.stat_2_label', { lang, fallback: 'Preview' }) },
            { v: t('onboarding.intro.stat_3_value', { lang, fallback: '∞' }), l: t('onboarding.intro.stat_3_label', { lang, fallback: 'Adapts' }) },
          ].map(s => (
            <View
              key={s.v}
              style={[styles.pill, { backgroundColor: C.pillBg, borderColor: C.pillBorder }]}
            >
              <Text style={[styles.pillVal, { color: C.pillVal }]}>{s.v}</Text>
              <Text style={[styles.pillLbl, { color: C.pillLbl }]}>{s.l}</Text>
            </View>
          ))}
        </Animated.View>
      </View>

      {/* ── CTA ────────────────────────────────────────── */}
      <Animated.View
        style={[styles.ctaWrap, { opacity: ctaFade, transform: [{ translateY: ctaSlide }] }]}
      >
        <TouchableOpacity
          style={styles.cta}
          onPress={() => router.replace('/(onboarding-v2)/splash')}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={[C.btnA, C.btnB]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.ctaSheen} />
          <Text style={[styles.ctaText, { color: C.btnText }]}>
            {t('onboarding.intro.cta', { lang, fallback: 'Get Started' })}
          </Text>
          <Text style={[styles.ctaArrow, { color: 'rgba(255,255,255,0.75)' }]}>→</Text>
        </TouchableOpacity>

        <Text style={[styles.hint, { color: C.hint }]}>
          {t('onboarding.intro.hint', { lang, fallback: 'Free to explore · No card required' })}
        </Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#080C0B', // fallback — must be dark
  },

  orbA: {
    position: 'absolute',
    width: 360,
    height: 360,
    borderRadius: 999,
    top: -110,
    right: -140,
  },
  orbB: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 999,
    bottom: 110,
    left: -100,
  },

  shapeWrap: {
    position: 'absolute',
    top: '14%',
    right: '-8%',
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shape: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 44,
    borderWidth: 1.5,
  },
  shapeInner: {
    position: 'absolute',
    width: 136,
    height: 136,
    borderRadius: 30,
    borderWidth: 1,
  },

  content: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 26,
    paddingBottom: 18,
  },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 99,
    paddingVertical: 5,
    paddingHorizontal: 12,
    gap: 7,
    marginBottom: 20,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },

  headlineWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  headWord: {
    fontSize: 46,
    fontWeight: '900',
    lineHeight: 54,
    letterSpacing: -1.4,
  },

  sub: {
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '400',
    marginBottom: 24,
    maxWidth: 310,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 32,
  },
  pill: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    gap: 4,
  },
  pillVal: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  pillLbl: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },

  ctaWrap: {
    paddingHorizontal: 26,
    paddingBottom: 32,
    gap: 12,
  },
  cta: {
    height: 56,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    gap: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.40,
    shadowRadius: 20,
    elevation: 10,
  },
  ctaSheen: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: '44%',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  ctaText: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  ctaArrow: {
    fontSize: 18,
    fontWeight: '500',
  },
  hint: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});
