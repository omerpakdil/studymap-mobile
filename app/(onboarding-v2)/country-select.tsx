import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  ImageStyle,
  SafeAreaView,
  StyleProp,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useOnboardingV2 } from '@/app/(onboarding-v2)/state';
import { useAppAlert } from '@/app/components/ui/AppAlert';
import { getCountryByCode, getInitialCountry, getInitialLanguage, supportedCountries } from '@/app/data/countries';
import { resolveAppLanguage, t } from '@/app/i18n';
import {
  trackOnboardingStepBack,
  trackOnboardingStepContinue,
  trackOnboardingStepValidationFail,
  trackOnboardingStepView,
} from '@/app/utils/onboardingV2Analytics';
import CountryFlag from 'react-native-country-flag';

const C = {
  bg0: '#F0FDFB', bg1: '#ECFDF8', bg2: '#F3FFFE', bg3: '#FAFFFE',
  orbA: 'rgba(20,184,166,0.14)', orbB: 'rgba(52,211,153,0.10)',
  grid: 'rgba(0,0,0,0.028)',
  title: '#042F2E', sub: '#115E59',
  labelMuted: 'rgba(15,118,110,0.45)',
  teal: '#0D9488', tealDark: '#0F766E',
  tealSoft: 'rgba(13,148,136,0.07)',
  cardBg: '#FFFFFF',
  backBg: 'rgba(0,0,0,0.04)', backBorder: 'rgba(0,0,0,0.06)',
  backArrow: '#0F766E', brand: '#0D9488',
  btnA: '#0D9488', btnB: '#0F766E',
  footer: 'rgba(245,254,252,0.97)', footerBorder: 'rgba(13,148,136,0.08)',
};

// react-native-country-flag UK→GB
const toIso = (code: string) => code === 'UK' ? 'GB' : code;

function FlagIcon({ code, size = 24, style }: { code: string; size?: number; style?: StyleProp<ImageStyle> }) {
  const w = Math.round(size * 1.6);
  const h = size;
  const normalized = toIso(code).toUpperCase();

  // Keep CountryFlag as primary renderer. Fallback only for IN/ID.
  if (normalized === 'ID') {
    return (
      <View style={[styles.flagBase, { width: w, height: h }, style]}>
        <View style={styles.flagIdTop} />
        <View style={styles.flagIdBottom} />
      </View>
    );
  }

  if (normalized === 'IN') {
    const chakraSize = Math.max(4, Math.round(h * 0.22));
    return (
      <View style={[styles.flagBase, { width: w, height: h }, style]}>
        <View style={styles.flagInTop} />
        <View style={styles.flagInMiddle}>
          <View
            style={[
              styles.flagInChakra,
              { width: chakraSize, height: chakraSize, borderRadius: chakraSize / 2 },
            ]}
          />
        </View>
        <View style={styles.flagInBottom} />
      </View>
    );
  }

  return <CountryFlag isoCode={normalized} size={size} style={style} />;
}

export default function OnboardingV2CountrySelectScreen() {
  const { showAlert } = useAppAlert();
  const { draft, updateDraft } = useOnboardingV2();

  const entrance  = useRef(new Animated.Value(0)).current;
  const ctaFade   = useRef(new Animated.Value(0)).current;
  const ctaScale  = useRef(new Animated.Value(1)).current;
  const orbPulse  = useRef(new Animated.Value(0.92)).current;
  const featScale = useRef(new Animated.Value(0.96)).current;
  const featOpacity = useRef(new Animated.Value(0)).current;

  // Grid chip anims — keep dynamic with country catalog size
  const chipAnims = useRef(
    Array.from({ length: supportedCountries.length }, () => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(12),
    }))
  ).current;

  useEffect(() => {
    void trackOnboardingStepView('country_select');

    Animated.loop(
      Animated.sequence([
        Animated.timing(orbPulse, { toValue: 1.08, duration: 3800, useNativeDriver: true }),
        Animated.timing(orbPulse, { toValue: 0.92, duration: 3800, useNativeDriver: true }),
      ])
    ).start();

    Animated.timing(entrance, { toValue: 1, duration: 380, useNativeDriver: true }).start();
    Animated.timing(ctaFade,  { toValue: 1, duration: 380, delay: 180, useNativeDriver: true }).start();

    // Featured card
    Animated.parallel([
      Animated.timing(featOpacity, { toValue: 1, duration: 380, delay: 100, useNativeDriver: true }),
      Animated.spring(featScale, { toValue: 1, damping: 16, stiffness: 160, delay: 100, useNativeDriver: true }),
    ]).start();

    // Grid chips stagger
    chipAnims.forEach((a, i) => {
      const d = 180 + i * 40;
      Animated.parallel([
        Animated.timing(a.opacity,    { toValue: 1, duration: 280, delay: d, useNativeDriver: true }),
        Animated.timing(a.translateY, { toValue: 0, duration: 280, delay: d, useNativeDriver: true }),
      ]).start();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!draft.countryCode) {
      const detected = getInitialCountry();
      updateDraft({ countryCode: detected.code, countryName: detected.name });
    }
  }, [draft.countryCode, updateDraft]);

  const detectedCountry = useMemo(() => getInitialCountry(), []);
  const deviceLanguage = useMemo(() => getInitialLanguage(detectedCountry.code), [detectedCountry.code]);
  const otherCountries  = useMemo(
    () => supportedCountries
      .filter(c => c.code !== detectedCountry.code)
      .sort((a, b) => {
        const aLangMatch = a.supportedLanguages.includes(deviceLanguage);
        const bLangMatch = b.supportedLanguages.includes(deviceLanguage);
        if (aLangMatch !== bLangMatch) return aLangMatch ? -1 : 1;
        return a.name.localeCompare(b.name);
      }),
    [detectedCountry.code, deviceLanguage]
  );

  const selectCountry = (code: string, name: string) => {
    updateDraft({ countryCode: code, countryName: name, examId: '', examName: '' });
  };

  const handleContinue = () => {
    if (!draft.countryCode) {
      void trackOnboardingStepValidationFail('country_select', ['countryCode'], 'Country required');
      showAlert(
        t('onboarding.country_select.alert_title', { lang }),
        t('onboarding.country_select.alert_body', { lang })
      );
      return;
    }
    void trackOnboardingStepContinue('country_select');
    router.push('/(onboarding-v2)/goal-exam');
  };

  const pressIn  = () => Animated.spring(ctaScale, { toValue: 0.97, damping: 20, stiffness: 400, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(ctaScale, { toValue: 1,    damping: 18, stiffness: 360, useNativeDriver: true }).start();

  const selectedName = supportedCountries.find(c => c.code === draft.countryCode)?.name ?? '';
  const detectedSelected = draft.countryCode === detectedCountry.code;
  const lang = resolveAppLanguage({
    countryDefaultLanguage: getCountryByCode(draft.countryCode || detectedCountry.code)?.defaultLanguage ?? null,
  });

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      <LinearGradient colors={[C.bg0, C.bg1, C.bg2, C.bg3]} locations={[0,0.35,0.70,1]} style={StyleSheet.absoluteFill} />
      <Animated.View style={[styles.orbA, { backgroundColor: C.orbA, transform:[{ scale: orbPulse }] }]} />
      <View style={[styles.orbB, { backgroundColor: C.orbB }]} />

      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {[0,1,2,3,4,5,6].map(i => (
          <View key={`v${i}`} style={{ position:'absolute', top:0, bottom:0, left:`${i*16.6}%`, width:StyleSheet.hairlineWidth, backgroundColor:C.grid }} />
        ))}
        {[0,1,2,3,4,5,6,7].map(i => (
          <View key={`h${i}`} style={{ position:'absolute', left:0, right:0, top:`${i*12.5}%`, height:StyleSheet.hairlineWidth, backgroundColor:C.grid }} />
        ))}
      </View>

      <Animated.View style={[styles.inner, { opacity: entrance }]}>

        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: C.backBg, borderColor: C.backBorder }]}
            onPress={() => { void trackOnboardingStepBack('country_select'); router.back(); }}
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
          <View style={[styles.progressFill, { width: '9%' }]}>
            <LinearGradient colors={[C.btnA, C.btnB]} start={{x:0,y:0}} end={{x:1,y:0}} style={StyleSheet.absoluteFill} />
            <View style={styles.progressSheen} />
          </View>
        </View>
        <Text style={[styles.stepLabel, { color: C.labelMuted }]}>
          {t('common.step_of', { lang, params: { current: 2, total: 12 } })}
        </Text>
        <Text style={[styles.title, { color: C.title }]}>{t('onboarding.country_select.title', { lang })}</Text>
        <Text style={[styles.sub, { color: C.sub }]}>{t('onboarding.country_select.subtitle', { lang })}</Text>

        {/* ── Detected featured card ── */}
        <Animated.View style={{ opacity: featOpacity, transform: [{ scale: featScale }], marginBottom: 12 }}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => selectCountry(detectedCountry.code, detectedCountry.name)}
            style={[
              styles.featCard,
              detectedSelected
                ? { borderColor: C.teal, borderWidth: 1.5 }
                : { borderColor: 'rgba(15,23,42,0.08)', borderWidth: 1 },
            ]}
          >
            {/* Subtle teal wash when selected */}
            {detectedSelected && (
              <LinearGradient
                colors={['rgba(13,148,136,0.10)', 'rgba(13,148,136,0.04)']}
                start={{x:0,y:0}} end={{x:1,y:1}}
                style={StyleSheet.absoluteFill}
              />
            )}

            <View style={styles.featLeft}>
              {/* Detected pill */}
              <View style={[styles.featPill, { backgroundColor: detectedSelected ? 'rgba(13,148,136,0.14)' : 'rgba(15,23,42,0.05)' }]}>
                <View style={[styles.featPillDot, { backgroundColor: C.teal }]} />
                <Text style={[styles.featPillText, { color: detectedSelected ? C.teal : '#64748B' }]}>
                  {t('onboarding.country_select.detected_location', { lang })}
                </Text>
              </View>

              <View style={styles.featNameRow}>
                <FlagIcon code={detectedCountry.code} size={28} />
                <Text style={[styles.featName, { color: detectedSelected ? C.teal : C.title }]}>
                  {detectedCountry.name}
                </Text>
              </View>
            </View>

            {/* Check */}
            <View style={[
              styles.featCheck,
              detectedSelected
                ? { backgroundColor: C.teal, borderColor: C.teal }
                : { backgroundColor: 'transparent', borderColor: 'rgba(15,23,42,0.14)' },
            ]}>
              {detectedSelected && <Text style={styles.featCheckMark}>✓</Text>}
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* ── Other countries label ── */}
        <Text style={[styles.sectionLabel, { color: C.labelMuted }]}>{t('onboarding.country_select.other_countries', { lang })}</Text>

        {/* ── 3-column chip grid ── */}
        <View style={styles.chipGrid}>
          {otherCountries.map((country, i) => {
            const sel = draft.countryCode === country.code;
            return (
              <Animated.View
                key={country.code}
                style={[
                  styles.chipWrap,
                  { opacity: chipAnims[i]?.opacity ?? 1, transform: [{ translateY: chipAnims[i]?.translateY ?? 0 }] },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.chip,
                    sel
                      ? { borderColor: C.teal, borderWidth: 1.5, backgroundColor: 'rgba(13,148,136,0.07)' }
                      : { borderColor: 'rgba(15,23,42,0.08)', borderWidth: 1, backgroundColor: C.cardBg },
                  ]}
                  onPress={() => selectCountry(country.code, country.name)}
                  activeOpacity={0.78}
                >
                  {sel && (
                    <LinearGradient
                      colors={[C.btnA, C.btnB]}
                      start={{x:0,y:0}} end={{x:1,y:0}}
                      style={styles.chipTopBar}
                    />
                  )}
                  <FlagIcon code={country.code} size={24} />
                  <Text
                    style={[styles.chipName, sel && { color: C.teal, fontWeight: '700' }]}
                    numberOfLines={1}
                  >
                    {country.name}
                  </Text>
                  {sel && (
                    <View style={styles.chipCheckBadge}>
                      <Text style={styles.chipCheckText}>✓</Text>
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
            style={[styles.cta, !draft.countryCode && styles.ctaDisabled]}
            onPress={handleContinue}
            onPressIn={pressIn}
            onPressOut={pressOut}
            activeOpacity={1}
          >
            {!!draft.countryCode && (
              <LinearGradient colors={[C.btnA, C.btnB]} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFill} />
            )}
            {!!draft.countryCode && <View style={styles.ctaSheen} />}
            <Text style={[styles.ctaText, !draft.countryCode && styles.ctaTextDisabled]}>
              {draft.countryCode
                ? t('onboarding.country_select.cta_prefix', { lang, params: { country: selectedName } })
                : t('onboarding.country_select.cta_default', { lang })}
            </Text>
            {!!draft.countryCode && <Text style={styles.ctaArrow}>→</Text>}
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0FDFB' },
  orbA: { position:'absolute', width:300, height:300, borderRadius:999, top:-90, right:-120 },
  orbB: { position:'absolute', width:200, height:200, borderRadius:999, bottom:160, left:-90 },

  inner: { flex: 1, paddingTop: 9, paddingHorizontal: 18 },

  headerRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:14 },
  backBtn: { width:36, height:36, borderRadius:11, borderWidth:1, justifyContent:'center', alignItems:'center' },
  backArrow: { fontSize:26, fontWeight:'300', lineHeight:30, marginTop:-1 },
  brandRow: { flexDirection:'row', alignItems:'center', gap:6 },
  brandMark: { width:7, height:7, borderRadius:2 },
  brandText: { fontSize:14, fontWeight:'800', letterSpacing:0.4 },

  progressTrack: { height:3, borderRadius:999, overflow:'hidden', marginBottom:6 },
  progressFill: { height:'100%', borderRadius:999, overflow:'hidden' },
  progressSheen: { position:'absolute', top:0, left:0, right:0, height:'50%', backgroundColor:'rgba(255,255,255,0.28)' },
  stepLabel: { fontSize:9, fontWeight:'600', letterSpacing:0.8, textTransform:'uppercase', marginBottom:13, opacity:0.7 },

  title: { fontSize:30, fontWeight:'900', lineHeight:35, letterSpacing:-0.7, marginBottom:5 },
  sub: { fontSize:13, lineHeight:19, fontWeight:'400', marginBottom:16 },

  // ── Featured card
  featCard: {
    borderRadius: 16,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    overflow: 'hidden',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 12,
    elevation: 3,
  },
  featLeft: { flex: 1, gap: 7 },
  featPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 99,
  },
  featPillDot: { width: 5, height: 5, borderRadius: 99 },
  featPillText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  featNameRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featFlag: { fontSize: 28 },
  featName: { fontSize: 20, fontWeight: '900', letterSpacing: -0.4 },
  featCheck: {
    width: 26, height: 26, borderRadius: 13,
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  featCheckMark: { color: '#fff', fontSize: 12, fontWeight: '900' },

  // ── Section label
  sectionLabel: {
    fontSize: 10, fontWeight: '700',
    letterSpacing: 0.9, textTransform: 'uppercase',
    marginBottom: 9,
  },

  // ── Chip grid — 3 kolon
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipWrap: { width: '31%' },
  chip: {
    borderRadius: 13,
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 10,
    paddingHorizontal: 4,
    gap: 5,
    overflow: 'hidden',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  chipTopBar: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 2.5,
  },
  chipFlag: { fontSize: 22 },
  chipName: {
    fontSize: 11, fontWeight: '600',
    color: '#334155', textAlign: 'center',
    letterSpacing: -0.1,
  },
  chipCheckBadge: {
    position: 'absolute', bottom: 5, right: 5,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: '#0D9488',
    alignItems: 'center', justifyContent: 'center',
  },
  chipCheckText: { color: '#fff', fontSize: 8, fontWeight: '900' },
  flagBase: {
    overflow: 'hidden',
    borderRadius: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(15,23,42,0.16)',
    backgroundColor: '#fff',
  },
  flagIdTop: { flex: 1, backgroundColor: '#CE1126' },
  flagIdBottom: { flex: 1, backgroundColor: '#FFFFFF' },
  flagInTop: { flex: 1, backgroundColor: '#FF9933' },
  flagInMiddle: { flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  flagInBottom: { flex: 1, backgroundColor: '#138808' },
  flagInChakra: { borderWidth: 1, borderColor: '#1A4AA1', backgroundColor: 'transparent' },

  // ── Footer
  footer: {
    position:'absolute', left:0, right:0, bottom:0,
    paddingHorizontal:18, paddingTop:12, paddingBottom:29,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cta: {
    height:54, borderRadius:14, flexDirection:'row',
    alignItems:'center', justifyContent:'center',
    overflow:'hidden', gap:8,
    shadowColor:'#0D9488', shadowOffset:{width:0,height:6},
    shadowOpacity:0.28, shadowRadius:18, elevation:8,
  },
  ctaDisabled: { backgroundColor:'rgba(148,163,184,0.15)', shadowOpacity:0, elevation:0 },
  ctaSheen: { position:'absolute', top:0, left:0, right:0, height:'44%', backgroundColor:'rgba(255,255,255,0.13)' },
  ctaText: { color:'#fff', fontSize:15, fontWeight:'800', letterSpacing:0.1 },
  ctaTextDisabled: { color:'rgba(100,116,139,0.50)' },
  ctaArrow: { color:'rgba(255,255,255,0.80)', fontSize:17 },
});
