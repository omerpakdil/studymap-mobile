import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
// Easing kept for card entrance animation
import type { RenderProps } from 'react-native-spotlight-tour';
import type { SupportedLanguage } from '@/app/i18n';
import { markWalkthroughSeen } from '@/app/utils/walkthroughState';
import { DONE_LABELS, NEXT_LABELS, SKIP_LABELS, TOUR_STEPS } from './tourData';

const TOTAL = TOUR_STEPS.length;

interface TourCardProps extends RenderProps {
  lang: SupportedLanguage;
}

export function TourCard({ current, isLast, next, stop, lang }: TourCardProps) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const cardWidth = isTablet ? Math.min(width - 96, 520) : Math.min(width - 32, 380);
  const data = TOUR_STEPS[current];

  const slideY    = useRef(new Animated.Value(24)).current;
  const fade      = useRef(new Animated.Value(0)).current;
  const scale     = useRef(new Animated.Value(0.88)).current;

  useEffect(() => {
    if (!data) return;
    slideY.setValue(24);
    fade.setValue(0);
    scale.setValue(0.88);

    // Card entrance — spring bounce
    Animated.parallel([
      Animated.spring(slideY, { toValue: 0, tension: 55, friction: 7, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, tension: 55, friction: 7, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();

    return () => {};
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  if (!data) return null;

  const handleSkip = async () => { await markWalkthroughSeen(); stop(); };
  const handleNext = async () => {
    if (isLast) { await markWalkthroughSeen(); stop(); }
    else { next(); }
  };


  return (
    <Animated.View style={[s.root, isTablet && s.rootTablet, { width: cardWidth, opacity: fade, transform: [{ translateY: slideY }, { scale }] }]}>
      {/* Card body */}
      <View style={[s.card, isTablet && s.cardTablet, { width: cardWidth }]}>
        {/* Top row: progress + step counter */}
        <View style={[s.topBar, isTablet && s.topBarTablet]}>
          <View style={[s.segsRow, isTablet && s.segsRowTablet]}>
            {Array.from({ length: TOTAL }).map((_, i) => (
              <View
                key={i}
                style={[
                  s.seg,
                  isTablet && s.segTablet,
                  i < current  && s.segDone,
                  i === current && s.segActive,
                ]}
              />
            ))}
          </View>
          <Text style={[s.stepCount, isTablet && s.stepCountTablet]}>{current + 1}<Text style={[s.stepTotal, isTablet && s.stepTotalTablet]}>/{TOTAL}</Text></Text>
        </View>

        {/* Title */}
        <Text style={[s.title, isTablet && s.titleTablet]}>{data.titles[lang] ?? data.titles.en}</Text>

        {/* Description */}
        <Text style={[s.desc, isTablet && s.descTablet]}>{data.descs[lang] ?? data.descs.en}</Text>

        {/* Buttons */}
        <View style={[s.btnRow, isTablet && s.btnRowTablet]}>
          <Pressable
            style={({ pressed }) => [s.skipBtn, isTablet && s.skipBtnTablet, pressed && s.pressed]}
            onPress={handleSkip}
          >
            <Text style={[s.skipTxt, isTablet && s.skipTxtTablet]}>{SKIP_LABELS[lang] ?? SKIP_LABELS.en}</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [s.nextBtn, isTablet && s.nextBtnTablet, pressed && s.pressed]}
            onPress={handleNext}
          >
            <Text style={[s.nextTxt, isTablet && s.nextTxtTablet]}>
              {isLast ? (DONE_LABELS[lang] ?? DONE_LABELS.en) : (NEXT_LABELS[lang] ?? NEXT_LABELS.en)}
            </Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

const TEAL   = '#14B8A6';
const TEAL_DIM = 'rgba(20,184,166,0.18)';
const CARD_BG = 'rgba(8,14,20,0.97)';

const s = StyleSheet.create({
  root: {
    alignItems: 'flex-start',
  },
  rootTablet: {
    alignItems: 'center',
  },

  // ── Card ────────────────────────────────────────
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: TEAL,
    padding: 18,
    shadowColor: TEAL,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 12,
  },
  cardTablet: {
    borderRadius: 24,
    padding: 24,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 24,
    elevation: 14,
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  topBarTablet: {
    marginBottom: 18,
  },
  segsRow: {
    flexDirection: 'row',
    gap: 5,
    flex: 1,
    marginRight: 10,
  },
  segsRowTablet: {
    gap: 7,
    marginRight: 14,
  },
  seg: {
    flex: 1,
    height: 3,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  segTablet: {
    height: 4,
  },
  segDone: {
    backgroundColor: TEAL_DIM,
  },
  segActive: {
    backgroundColor: TEAL,
    shadowColor: TEAL,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  stepCount: {
    fontSize: 13,
    fontWeight: '800',
    color: TEAL,
    letterSpacing: -0.3,
  },
  stepCountTablet: {
    fontSize: 16,
  },
  stepTotal: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(20,184,166,0.55)',
  },
  stepTotalTablet: {
    fontSize: 13,
  },

  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#F1F5F9',
    letterSpacing: -0.4,
    marginBottom: 8,
    lineHeight: 23,
  },
  titleTablet: {
    fontSize: 24,
    lineHeight: 30,
    marginBottom: 12,
  },
  desc: {
    fontSize: 13,
    color: 'rgba(203,213,225,0.82)',
    lineHeight: 20,
    marginBottom: 18,
    fontWeight: '400',
  },
  descTablet: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 22,
  },

  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btnRowTablet: {
    gap: 12,
  },
  skipBtn: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  skipBtnTablet: {
    height: 50,
    paddingHorizontal: 18,
    borderRadius: 14,
  },
  nextBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: TEAL,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: TEAL,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  },
  nextBtnTablet: {
    height: 50,
    borderRadius: 14,
  },
  pressed: { opacity: 0.75 },
  skipTxt: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(203,213,225,0.65)',
  },
  skipTxtTablet: {
    fontSize: 15,
  },
  nextTxt: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.2,
  },
  nextTxtTablet: {
    fontSize: 16,
  },
});
