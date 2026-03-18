/**
 * OnboardingScaffold.tsx — "Clean Slate" edition
 * Minimal neutral + teal accent. Light-first with two dark variants.
 */
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import {
  BackgroundConfig,
  getOnboardingV2Tokens,
  onboardingV2Backgrounds,
  OnboardingV2BackgroundVariant,
} from '@/app/components/onboarding-v2/designSystem';
import { ONBOARDING_FOOTER_METRICS as FOOTER } from '@/app/components/onboarding-v2/footerMetrics';

interface OnboardingScaffoldProps {
  title: string;
  subtitle?: string;
  progress?: number;
  stepLabel?: string;
  onBack?: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  scrollable?: boolean;
  backgroundVariant?: OnboardingV2BackgroundVariant;
}

export function OnboardingScaffold({
  title,
  subtitle,
  progress,
  stepLabel,
  onBack,
  children,
  footer,
  scrollable = true,
  backgroundVariant = 'slate',
}: OnboardingScaffoldProps) {
  const { width } = useWindowDimensions();
  const tokens = getOnboardingV2Tokens(width);
  const isTablet = tokens.deviceClass === 'tablet';
  const bg = onboardingV2Backgrounds[backgroundVariant] ?? onboardingV2Backgrounds.slate ?? Object.values(onboardingV2Backgrounds)[0];

  // Entrance
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 480, useNativeDriver: true }),
      Animated.spring(slideUp, { toValue: 0, damping: 24, stiffness: 180, useNativeDriver: true }),
    ]).start();
  }, []);

  // Progress
  const progressAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (typeof progress === 'number') {
      Animated.spring(progressAnim, {
        toValue: Math.max(2, Math.min(100, progress)),
        damping: 28,
        stiffness: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [progress]);

  const hp = tokens.horizontalPadding;

  const body = (
    <Animated.View
      style={[
        styles.inner,
        {
          paddingHorizontal: hp,
          maxWidth: tokens.maxContentWidth,
          alignSelf: 'center',
          width: '100%',
          paddingTop: isTablet ? 26 : 10,
          paddingBottom: isTablet ? 182 : 140,
          opacity: fadeIn,
          transform: [{ translateY: slideUp }],
        },
      ]}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={[
            styles.backBtn,
            isTablet && styles.backBtnTablet,
            bg.isDark ? styles.backBtnDark : styles.backBtnLight,
            { opacity: onBack ? 1 : 0 },
          ]}
          onPress={onBack}
          disabled={!onBack}
          activeOpacity={0.65}
        >
          <Text style={[styles.backArrow, { color: bg.backArrowColor }]}>‹</Text>
        </TouchableOpacity>

        <View style={styles.brandRow}>
          <View style={[styles.brandMark, { backgroundColor: bg.accent }]} />
          <Text style={[styles.brandText, isTablet && styles.brandTextTablet, { color: bg.brandColor }]}>StudyMap</Text>
        </View>

        <View style={styles.backBtn} />
      </View>

      {/* Progress */}
      {typeof progress === 'number' && (
        <View style={styles.progressSection}>
          {!!stepLabel && (
            <Text style={[styles.stepLabel, { color: bg.subtitleColor }]}>{stepLabel}</Text>
          )}
          <View style={[styles.progressTrack, { backgroundColor: bg.shimmer }]}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            >
              <LinearGradient
                colors={[bg.btnGradientA, bg.btnGradientB]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.progressSheen} />
            </Animated.View>
          </View>
        </View>
      )}

      {/* Title */}
      <Text
        style={[
          styles.title,
          {
            color: bg.titleColor,
            fontSize: tokens.headlineSize,
            lineHeight: tokens.headlineSize * tokens.headlineLineHeight,
          },
        ]}
      >
        {title}
      </Text>

      {/* Subtitle */}
      {!!subtitle && (
        <Text style={[styles.subtitle, isTablet && styles.subtitleTablet, { color: bg.subtitleColor, fontSize: tokens.subtitleSize }]}>
          {subtitle}
        </Text>
      )}

      {/* Content */}
      <View style={[styles.content, { gap: tokens.contentGap }]}>{children}</View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={bg.isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      <LinearGradient
        colors={bg.gradient}
        locations={[0, 0.35, 0.70, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Orbs */}
      <View style={[styles.orb, styles.orbA, { backgroundColor: bg.orbA }]} />
      <View style={[styles.orb, styles.orbB, { backgroundColor: bg.orbB }]} />
      <View style={[styles.orb, styles.orbC, { backgroundColor: bg.orbC }]} />

      {/* Motif */}
      <MotifLayer motif={bg.motif as any} isDark={bg.isDark} accent={bg.accent} />

      {/* Mist */}
      <View style={[styles.mist, { backgroundColor: bg.mist }]} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        {scrollable ? (
          <ScrollView
            style={styles.flex}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 12 }}
          >
            {body}
          </ScrollView>
        ) : (
          <View style={styles.flex}>{body}</View>
        )}

        {footer && (
          <View
            style={[
              styles.footer,
              isTablet && styles.footerTablet,
              {
                paddingHorizontal: hp,
                backgroundColor: bg.isDark
                  ? 'rgba(8,12,11,0.88)'
                  : 'rgba(255,255,255,0.90)',
                borderTopColor: bg.cardBorder,
              },
            ]}
          >
            {footer}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ── Motif ──────────────────────────────────────────────────────────────── */

function MotifLayer({
  motif,
  isDark,
  accent,
}: {
  motif: 'grid' | 'topography' | 'dots' | 'diagonals' | 'none';
  isDark: boolean;
  accent: string;
}) {
  const lineColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.035)';
  const dotColor = isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.07)';

  if (motif === 'grid') {
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {[0,1,2,3,4,5,6].map(i => (
          <View key={`v${i}`} style={{ position:'absolute', top:0, bottom:0, left:`${i*16.6}%`, width:1, backgroundColor:lineColor }} />
        ))}
        {[0,1,2,3,4,5,6,7,8].map(i => (
          <View key={`h${i}`} style={{ position:'absolute', left:0, right:0, top:`${i*12.5}%`, height:1, backgroundColor:lineColor }} />
        ))}
      </View>
    );
  }

  if (motif === 'topography') {
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {[0,1,2,3,4].map(i => (
          <View key={i} style={{
            position:'absolute',
            width: 300 + i * 70,
            height: 300 + i * 70,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: lineColor,
            top: `${5 + i * 8}%`,
            left: `${-20 + i * 6}%`,
          }} />
        ))}
      </View>
    );
  }

  if (motif === 'dots') {
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {Array.from({length:6}).map((_,r) =>
          Array.from({length:5}).map((_,c) => (
            <View key={`${r}${c}`} style={{
              position:'absolute',
              width: 2,
              height: 2,
              borderRadius: 1,
              backgroundColor: dotColor,
              top: `${15 + r * 14}%`,
              left: `${10 + c * 20}%`,
            }} />
          ))
        )}
      </View>
    );
  }

  if (motif === 'diagonals') {
    return (
      <View style={[StyleSheet.absoluteFill, { opacity: 0.6 }]} pointerEvents="none">
        {[0,1,2,3].map(i => (
          <View key={i} style={{
            position:'absolute',
            width: '200%',
            height: 1,
            backgroundColor: lineColor,
            transform: [{ rotate: '-28deg' }],
            left: -200,
            top: 120 + i * 110,
          }} />
        ))}
      </View>
    );
  }

  return null;
}

/* ── Primary CTA ───────────────────────────────────────────────────────── */

export function PrimaryAction({
  label,
  onPress,
  disabled,
  backgroundVariant = 'slate',
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  backgroundVariant?: OnboardingV2BackgroundVariant;
}) {
  const bg = onboardingV2Backgrounds[backgroundVariant] ?? onboardingV2Backgrounds.slate ?? Object.values(onboardingV2Backgrounds)[0];
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.97, damping: 22, stiffness: 400, useNativeDriver: true }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, damping: 20, stiffness: 360, useNativeDriver: true }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[styles.primaryBtn, disabled && styles.primaryBtnDisabled]}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={disabled}
        activeOpacity={1}
      >
        {!disabled && (
          <LinearGradient
            colors={[bg.btnGradientA, bg.btnGradientB]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}
        {!disabled && <View style={styles.btnSheen} />}
        <Text style={[styles.primaryBtnText, disabled && styles.primaryBtnTextDisabled]}>
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

/* ── GlassCard ─────────────────────────────────────────────────────────── */

export function GlassCard({
  children,
  backgroundVariant = 'slate',
  style,
}: {
  children: React.ReactNode;
  backgroundVariant?: OnboardingV2BackgroundVariant;
  style?: object;
}) {
  const bg = onboardingV2Backgrounds[backgroundVariant] ?? onboardingV2Backgrounds.slate ?? Object.values(onboardingV2Backgrounds)[0];
  const { width } = useWindowDimensions();
  const tokens = getOnboardingV2Tokens(width);
  return (
    <View
      style={[
        styles.glassCard,
        {
          backgroundColor: bg.cardGlass,
          borderColor: bg.cardBorder,
          borderRadius: tokens.cardRadius,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/* ── Styles ─────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1 },
  inner: { paddingTop: 10, paddingBottom: 140 },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnTablet: {
    width: 46,
    height: 46,
    borderRadius: 14,
  },
  backBtnLight: {
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  backBtnDark: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  backArrow: {
    fontSize: 26,
    fontWeight: '300',
    lineHeight: 30,
    marginTop: -1,
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandMark: {
    width: 7,
    height: 7,
    borderRadius: 2,
  },
  brandText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  brandTextTablet: {
    fontSize: 17,
  },

  progressSection: {
    gap: 7,
    marginBottom: 22,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    opacity: 0.65,
  },
  progressTrack: {
    height: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.28)',
  },

  title: {
    fontWeight: '800',
    letterSpacing: -0.6,
    marginBottom: 8,
  },
  subtitle: {
    fontWeight: '400',
    lineHeight: 23,
    marginBottom: 24,
    letterSpacing: 0.1,
  },
  subtitleTablet: {
    lineHeight: 32,
    marginBottom: 34,
    maxWidth: 760,
  },
  content: {},

  orb: { position: 'absolute', borderRadius: 999 },
  orbA: { width: 280, height: 280, top: -90, right: -110 },
  orbB: { width: 220, height: 220, top: 300, left: -110 },
  orbC: { width: 200, height: 200, bottom: 170, right: -100 },

  mist: { ...StyleSheet.absoluteFillObject },

  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom:0,
    paddingTop: FOOTER.paddingTop,
    paddingBottom: FOOTER.paddingBottom,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerTablet: {
    paddingTop: 14,
    paddingBottom: 46,
  },

  primaryBtn: {
    height: FOOTER.ctaHeight,
    borderRadius: FOOTER.ctaRadius,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#0F9D8C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryBtnDisabled: {
    backgroundColor: 'rgba(148,163,184,0.22)',
    shadowOpacity: 0,
    elevation: 0,
  },
  btnSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '46%',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  primaryBtnTextDisabled: {
    color: 'rgba(100,116,139,0.60)',
  },

  glassCard: {
    borderWidth: 1,
    padding: 16,
    overflow: 'hidden',
  },
});
