/**
 * AnimatedSplash.tsx — v5 "Clean & Bright"
 *
 * Timeline (~2.5s):
 *  0ms   → Arka plan gradient yumuşar
 *  150ms → İkon scale+fade
 *  550ms → "STUDYMAP" — harfler soldan sağa akar
 *  1050ms→ Tagline belirir
 *  1800ms→ Tüm ekran yukarı lift + fade → onFinish()
 */
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import {
    Animated,
    Easing,
    Image,
    StatusBar,
    StyleSheet,
    useWindowDimensions,
    View,
} from 'react-native';
import { resolveAppLanguage, t } from '@/app/i18n';

interface Props { onFinish?: () => void }

const EASE = Easing.bezier(0.16, 1, 0.3, 1);

// Bitişik wordmark, iki renk katmanı
const WORDS = [
  { chars: ['S','T','U','D','Y'], green: false },
  { chars: ['M','A','P'],         green: true  },
];

export default function AnimatedSplash({ onFinish }: Props) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const lang = resolveAppLanguage();

  // Exit
  const exitOpacity    = useRef(new Animated.Value(1)).current;
  const exitTranslateY = useRef(new Animated.Value(0)).current;

  // Subtle bg orb
  const orbOpacity = useRef(new Animated.Value(0)).current;
  const orbScale   = useRef(new Animated.Value(0.6)).current;

  // Icon
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const iconScale   = useRef(new Animated.Value(0.80)).current;
  const iconTranslateY = useRef(new Animated.Value(10)).current;

  // Per-character anims — flatten all chars
  const allChars = WORDS.flatMap(w => w.chars);
  const charAnims = useRef(
    allChars.map(() => ({
      opacity:    new Animated.Value(0),
      translateY: new Animated.Value(14),
    }))
  ).current;

  // Tagline
  const tagOpacity    = useRef(new Animated.Value(0)).current;
  const tagTranslateY = useRef(new Animated.Value(8)).current;

  const handleFinish = useCallback(() => {
    if (onFinish) { onFinish(); return; }
    router.replace('/(onboarding-v2)/intro');
  }, [onFinish]);

  useEffect(() => {
    // Orb
    Animated.parallel([
      Animated.timing(orbOpacity, { toValue: 1, duration: 1000, delay: 0, useNativeDriver: true }),
      Animated.timing(orbScale,   { toValue: 1, duration: 1200, delay: 0, easing: EASE, useNativeDriver: true }),
    ]).start();

    // Icon
    Animated.parallel([
      Animated.timing(iconOpacity,     { toValue: 1, duration: 500, delay: 150, easing: EASE, useNativeDriver: true }),
      Animated.spring(iconScale,       { toValue: 1, damping: 18, stiffness: 160, delay: 150, useNativeDriver: true }),
      Animated.timing(iconTranslateY,  { toValue: 0, duration: 500, delay: 150, easing: EASE, useNativeDriver: true }),
    ]).start();

    // Characters — stagger 45ms
    charAnims.forEach((a, i) => {
      const d = 550 + i * 45;
      Animated.parallel([
        Animated.timing(a.opacity,     { toValue: 1, duration: 380, delay: d, easing: EASE, useNativeDriver: true }),
        Animated.timing(a.translateY,  { toValue: 0, duration: 380, delay: d, easing: EASE, useNativeDriver: true }),
      ]).start();
    });

    // Tagline
    Animated.parallel([
      Animated.timing(tagOpacity,    { toValue: 1, duration: 500, delay: 1050, easing: EASE, useNativeDriver: true }),
      Animated.timing(tagTranslateY, { toValue: 0, duration: 500, delay: 1050, easing: EASE, useNativeDriver: true }),
    ]).start();

    // Exit
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(exitOpacity, {
          toValue: 0, duration: 450,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(exitTranslateY, {
          toValue: -24, duration: 450,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(handleFinish);
    }, 1900);

    return () => clearTimeout(t);
  // Runs once for splash sequence timing; animated refs are stable.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleFinish]);

  // Flatten index helper
  let charIndex = 0;

  return (
    <Animated.View style={[styles.root, { opacity: exitOpacity, transform: [{ translateY: exitTranslateY }] }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Background */}
      <LinearGradient
        colors={['#080C0B', '#0D1A16', '#0A1510', '#060E0C']}
        locations={[0, 0.35, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Single subtle orb — sadece hafif derinlik için */}
      <Animated.View style={[
        styles.orb,
        isTablet && styles.orbTablet,
        { opacity: orbOpacity, transform: [{ scale: orbScale }] }
      ]} />

      {/* ── İçerik ── */}
      <View style={[styles.center, isTablet && styles.centerTablet]}>

        {/* İkon */}
        <Animated.View style={[
          styles.iconWrap,
          isTablet && styles.iconWrapTablet,
          {
            opacity: iconOpacity,
            transform: [{ scale: iconScale }, { translateY: iconTranslateY }],
          },
        ]}>
          <Image
            source={require('../../assets/images/icon.png')}
            style={[styles.iconImage, isTablet && styles.iconImageTablet]}
            resizeMode="cover"
          />
        </Animated.View>

        {/* Wordmark — STUDYMAP */}
        <View style={[styles.wordRow, isTablet && styles.wordRowTablet]}>
          {WORDS.map((word, wi) => {
            const wordEl = (
              <View key={wi} style={styles.wordGroup}>
                {word.chars.map((char) => {
                  const idx = charIndex++;
                  return (
                    <Animated.Text
                      key={idx}
                      style={[
                        styles.char,
                        isTablet && styles.charTablet,
                        word.green ? styles.charGreen : styles.charWhite,
                        {
                          opacity:   charAnims[idx].opacity,
                          transform: [{ translateY: charAnims[idx].translateY }],
                        },
                      ]}
                    >
                      {char}
                    </Animated.Text>
                  );
                })}
              </View>
            );
            return wordEl;
          })}
        </View>

        {/* Tagline */}
        <Animated.Text style={[
          styles.tagline,
          isTablet && styles.taglineTablet,
          { opacity: tagOpacity, transform: [{ translateY: tagTranslateY }] },
        ]}>
          {t('onboarding.animated_splash.tagline', { lang, fallback: 'adaptive study plans · built for you' })}
        </Animated.Text>

      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#080C0B',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },

  orb: {
    position: 'absolute',
    width: 560,
    height: 560,
    borderRadius: 999,
    alignSelf: 'center',
    top: '50%',
    marginTop: -280,
    backgroundColor: 'rgba(16,185,129,0.09)',
  },
  orbTablet: {
    width: 760,
    height: 760,
    marginTop: -380,
  },

  center: {
    alignItems: 'center',
    gap: 34,
  },
  centerTablet: {
    gap: 44,
  },

  iconWrap: {
    width: 108,
    height: 108,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.30,
    shadowRadius: 16,
    elevation: 10,
  },
  iconWrapTablet: {
    width: 144,
    height: 144,
    borderRadius: 30,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 24,
  },
  iconImage: {
    width: 108,
    height: 108,
  },
  iconImageTablet: {
    width: 144,
    height: 144,
  },

  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  wordRowTablet: {
    transform: [{ scale: 1.08 }],
  },
  wordGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  char: {
    fontSize: 52,
    fontWeight: '900',
    letterSpacing: 2.4,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  charTablet: {
    fontSize: 68,
    letterSpacing: 3,
  },
  charWhite: {
    color: '#ECFDF5',
  },
  charGreen: {
    color: '#34D399',
  },

  tagline: {
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: 1.9,
    textTransform: 'uppercase',
    color: 'rgba(167,243,210,0.55)',
  },
  taglineTablet: {
    fontSize: 16,
    letterSpacing: 2.2,
  },
});
