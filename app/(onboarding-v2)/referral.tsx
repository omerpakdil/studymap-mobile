import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { getCountryByCode } from '@/app/data/countries';
import { useOnboardingV2 } from '@/app/(onboarding-v2)/state';
import { resolveAppLanguage, t } from '@/app/i18n';
import { trackOnboardingStepBack, trackOnboardingStepContinue, trackOnboardingStepView } from '@/app/utils/onboardingV2Analytics';
import { applyReferralCode } from '@/app/utils/referralManager';

const C = {
  bg0:'#080C0B', bg1:'#0C1210', bg2:'#0F1A18', bg3:'#080C0B',
  orbA:'rgba(20,184,166,0.22)', orbB:'rgba(52,211,153,0.12)',
  title:'#ECFDF5', sub:'rgba(167,243,208,0.62)', muted:'rgba(148,163,184,0.58)',
  teal:'#2DD4BF', tealDk:'#14B8A6', tealDk2:'#0F9D8C', tealSoft:'rgba(45,212,191,0.12)', tealBorder:'rgba(45,212,191,0.24)',
  card:'rgba(255,255,255,0.04)', cardBorder:'rgba(255,255,255,0.08)',
  err:'#F87171', errBg:'rgba(248,113,113,0.10)', errBorder:'rgba(248,113,113,0.24)',
};

export default function OnboardingV2ReferralScreen() {
  const { draft } = useOnboardingV2();
  const lang = resolveAppLanguage({
    countryDefaultLanguage: getCountryByCode(draft.countryCode)?.defaultLanguage ?? null,
  });
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const CODE_LENGTH = 6;
  const entrance = useRef(new Animated.Value(0)).current;
  const ctaScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    void trackOnboardingStepView('referral');
    Animated.timing(entrance, { toValue: 1, duration: 420, useNativeDriver: true }).start();
  }, [entrance]);

  const normalizedCode = code.trim().toUpperCase();

  const goNext = () => {
    void trackOnboardingStepContinue('referral');
    router.push('/(onboarding-v2)/paywall');
  };

  const handleContinue = async () => {
    if (!normalizedCode) {
      goNext();
      return;
    }

    try {
      setLoading(true);
      setError('');
      const ok = await applyReferralCode(normalizedCode);
      if (!ok) {
        setError(t('onboarding.referral.error_apply', { lang, fallback: 'Code could not be applied. Check and try again.' }));
        return;
      }
      goNext();
    } catch {
      setError(t('onboarding.referral.error_invalid', { lang, fallback: 'Code is invalid or unavailable right now.' }));
    } finally {
      setLoading(false);
    }
  };

  const pressIn = () => Animated.spring(ctaScale, { toValue: 0.97, damping: 20, stiffness: 400, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(ctaScale, { toValue: 1, damping: 18, stiffness: 360, useNativeDriver: true }).start();

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={[C.bg0, C.bg1, C.bg2, C.bg3]} locations={[0, 0.3, 0.65, 1]} style={StyleSheet.absoluteFill} />
      <View style={[s.orbA, { backgroundColor: C.orbA }]} />
      <View style={[s.orbB, { backgroundColor: C.orbB }]} />

      <Animated.View style={[s.inner, { opacity: entrance }]}>
        <View style={s.headerRow}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => {
              void trackOnboardingStepBack('referral');
              router.back();
            }}
            activeOpacity={0.7}
          >
            <Text style={s.backTxt}>‹</Text>
          </TouchableOpacity>
          <View style={s.brandRow}>
            <View style={s.brandDot} />
            <Text style={s.brandTxt}>StudyMap</Text>
          </View>
          <View style={s.stepPill}>
            <Text style={s.stepTxt}>{t('onboarding.referral.optional', { lang, fallback: 'Optional' })}</Text>
          </View>
        </View>

        <View style={s.hero}>
          <Text style={s.kicker}>{t('onboarding.referral.kicker', { lang, fallback: 'Referral' })}</Text>
          <Text style={s.title}>{t('onboarding.referral.title', { lang, fallback: 'Have a friend code?' })}</Text>
          <Text style={s.sub}>
            {t('onboarding.referral.subtitle', {
              lang,
              fallback: 'Enter it now to unlock extra trial days. You can also skip and continue.',
            })}
          </Text>
        </View>

        <View style={s.card}>
          <Text style={s.inputLabel}>{t('onboarding.referral.input_label', { lang, fallback: 'Referral code' })}</Text>
          <TextInput
            value={normalizedCode}
            onChangeText={(t) => { setCode(t.replace(/[^a-zA-Z0-9]/g, '').slice(0, CODE_LENGTH)); setError(''); }}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={CODE_LENGTH}
            placeholder={t('onboarding.referral.placeholder', { lang, fallback: 'ABC123' })}
            placeholderTextColor="rgba(148,163,184,0.55)"
            style={[s.input, !!error && s.inputErr]}
          />
          {!!error && (
            <View style={s.errBox}>
              <Text style={s.errTxt}>{error}</Text>
            </View>
          )}
          <Text style={s.helper}>{t('onboarding.referral.tip', { lang, fallback: 'Tip: Codes are usually 6 characters.' })}</Text>
        </View>
      </Animated.View>

      <View style={s.footer}>
        <Animated.View style={{ transform: [{ scale: ctaScale }] }}>
          <TouchableOpacity
            style={[s.cta, loading && { opacity: 0.7 }]}
            onPress={handleContinue}
            onPressIn={pressIn}
            onPressOut={pressOut}
            disabled={loading}
            activeOpacity={1}
          >
            <LinearGradient colors={[C.tealDk, C.tealDk2]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.ctaTxt}>{t('common.continue', { lang })}</Text>}
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity style={s.skipBtn} onPress={goNext} activeOpacity={0.7}>
          <Text style={s.skipTxt}>{t('onboarding.referral.skip', { lang, fallback: 'Skip for now' })}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080C0B' },
  orbA: { position: 'absolute', width: 300, height: 300, borderRadius: 999, top: -90, right: -110 },
  orbB: { position: 'absolute', width: 190, height: 190, borderRadius: 999, bottom: 180, left: -90 },
  inner: { flex: 1, paddingHorizontal: 22, paddingTop: 8, paddingBottom: 190 },

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 11, borderWidth: 1, borderColor: C.cardBorder, backgroundColor: C.card, justifyContent: 'center', alignItems: 'center' },
  backTxt: { fontSize: 26, fontWeight: '300', lineHeight: 30, marginTop: -1, color: 'rgba(167,243,208,0.75)' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brandDot: { width: 7, height: 7, borderRadius: 2, backgroundColor: C.teal },
  brandTxt: { fontSize: 14, fontWeight: '800', letterSpacing: 0.4, color: C.teal },
  stepPill: { borderWidth: 1, borderColor: C.tealBorder, borderRadius: 99, backgroundColor: C.tealSoft, paddingHorizontal: 10, paddingVertical: 5 },
  stepTxt: { fontSize: 11, fontWeight: '700', color: C.teal },

  hero: { marginTop: 8, marginBottom: 18, gap: 6 },
  kicker: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: C.teal },
  title: { fontSize: 34, fontWeight: '900', lineHeight: 39, letterSpacing: -0.8, color: C.title },
  sub: { fontSize: 13, lineHeight: 19, color: C.sub },

  card: { backgroundColor: C.card, borderColor: C.cardBorder, borderWidth: 1, borderRadius: 16, padding: 14, gap: 8 },
  inputLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.7, textTransform: 'uppercase', color: C.muted },
  input: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.tealBorder,
    backgroundColor: 'rgba(8,12,11,0.48)',
    paddingHorizontal: 14,
    color: C.title,
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  inputErr: { borderColor: C.err },
  helper: { fontSize: 11, color: C.muted },
  errBox: { backgroundColor: C.errBg, borderWidth: 1, borderColor: C.errBorder, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  errTxt: { color: C.err, fontSize: 12, fontWeight: '600' },

  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 22, paddingTop: 12, paddingBottom: 22, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.tealBorder, backgroundColor: 'rgba(8,12,11,0.95)', gap: 8 },
  cta: { height: 52, borderRadius: 13, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  ctaTxt: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.15 },
  skipBtn: { alignItems: 'center', paddingVertical: 2 },
  skipTxt: { color: C.muted, fontSize: 12, fontWeight: '500' },
});
