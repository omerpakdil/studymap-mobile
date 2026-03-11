import AsyncStorage from '@react-native-async-storage/async-storage';
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

import { useOnboardingV2 } from '@/app/(onboarding-v2)/state';
import { ONBOARDING_FOOTER_METRICS as FOOTER } from '@/app/components/onboarding-v2/footerMetrics';
import { getCountryByCode } from '@/app/data/countries';
import { resolveAppLanguage, t } from '@/app/i18n';
import { trackOnboardingStepBack, trackOnboardingStepContinue, trackOnboardingStepView } from '@/app/utils/onboardingV2Analytics';

const C = {
  bg0:'#080C0B', bg1:'#0C1210', bg2:'#0F1A18', bg3:'#080C0B',
  orbA:'rgba(20,184,166,0.22)', orbB:'rgba(52,211,153,0.12)',
  title:'#ECFDF5', sub:'rgba(167,243,208,0.62)', muted:'rgba(148,163,184,0.58)',
  teal:'#2DD4BF', tealDk:'#14B8A6', tealDk2:'#0F9D8C', tealSoft:'rgba(45,212,191,0.12)', tealBorder:'rgba(45,212,191,0.24)',
  card:'rgba(255,255,255,0.04)', cardBorder:'rgba(255,255,255,0.08)',
  err:'#F87171',
};

export default function OnboardingV2AccountScreen() {
  const { draft } = useOnboardingV2();
  const lang = resolveAppLanguage({
    countryDefaultLanguage: getCountryByCode(draft.countryCode)?.defaultLanguage ?? null,
  });
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const entrance = useRef(new Animated.Value(0)).current;
  const ctaScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    void trackOnboardingStepView('account');
    Animated.timing(entrance, { toValue: 1, duration: 420, useNativeDriver: true }).start();
  // Mount-only entrance animation; ref is stable.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

  const persistAndFinish = async () => {
    const fn = firstName.trim();
    const ln = lastName.trim();
    const em = email.trim().toLowerCase();

    if (!fn || !ln || !em) {
      setError(t('onboarding.account.error_all_fields', { lang, fallback: 'Please complete all fields.' }));
      return;
    }
    if (!isValidEmail(em)) {
      setError(t('onboarding.account.error_valid_email', { lang, fallback: 'Please enter a valid email.' }));
      return;
    }

    try {
      setSaving(true);
      setError('');
      const user = {
        firstName: fn,
        lastName: ln,
        email: em,
        fullName: `${fn} ${ln}`,
        createdAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem('user_info', JSON.stringify(user));
      void trackOnboardingStepContinue('account');
      router.replace('/(tabs)/dashboard');
    } catch {
      setError(t('onboarding.account.error_save', { lang, fallback: 'Could not save your profile. Try again.' }));
    } finally {
      setSaving(false);
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
              void trackOnboardingStepBack('account');
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
            <Text style={s.stepTxt}>{t('onboarding.account.final_step', { lang, fallback: 'Final step' })}</Text>
          </View>
        </View>

        <View style={s.hero}>
          <Text style={s.kicker}>{t('onboarding.account.kicker', { lang, fallback: 'Account' })}</Text>
          <Text style={s.title}>{t('onboarding.account.title', { lang, fallback: 'Save your profile.' })}</Text>
          <Text style={s.sub}>
            {t('onboarding.account.subtitle', {
              lang,
              fallback: 'Your plan is ready. Add your details so we can personalize your dashboard and reminders.',
            })}
          </Text>
        </View>

        <View style={s.card}>
          <View style={s.row}>
            <View style={s.half}>
              <Text style={s.label}>{t('onboarding.account.first_name', { lang, fallback: 'First name' })}</Text>
              <TextInput
                value={firstName}
                onChangeText={(t) => { setFirstName(t); setError(''); }}
                placeholder={t('onboarding.account.first_name_placeholder', { lang, fallback: 'Alex' })}
                placeholderTextColor="rgba(148,163,184,0.55)"
                autoCapitalize="words"
                style={s.input}
              />
            </View>
            <View style={s.half}>
              <Text style={s.label}>{t('onboarding.account.last_name', { lang, fallback: 'Last name' })}</Text>
              <TextInput
                value={lastName}
                onChangeText={(t) => { setLastName(t); setError(''); }}
                placeholder={t('onboarding.account.last_name_placeholder', { lang, fallback: 'Morgan' })}
                placeholderTextColor="rgba(148,163,184,0.55)"
                autoCapitalize="words"
                style={s.input}
              />
            </View>
          </View>
          <Text style={s.label}>{t('onboarding.account.email', { lang, fallback: 'Email' })}</Text>
          <TextInput
            value={email}
            onChangeText={(t) => { setEmail(t); setError(''); }}
            placeholder={t('onboarding.account.email_placeholder', { lang, fallback: 'you@example.com' })}
            placeholderTextColor="rgba(148,163,184,0.55)"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={s.input}
          />
          {!!error && <Text style={s.errText}>{error}</Text>}
        </View>
      </Animated.View>

      <View style={s.footer}>
        <Animated.View style={{ transform: [{ scale: ctaScale }] }}>
          <TouchableOpacity
            style={[s.cta, saving && { opacity: 0.7 }]}
            onPress={persistAndFinish}
            onPressIn={pressIn}
            onPressOut={pressOut}
            disabled={saving}
            activeOpacity={1}
          >
            <LinearGradient colors={[C.tealDk, C.tealDk2]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            {saving
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={s.ctaTxt}>{t('onboarding.account.continue_dashboard', { lang, fallback: 'Continue to Dashboard' })}</Text>}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080C0B' },
  orbA: { position: 'absolute', width: 300, height: 300, borderRadius: 999, top: -90, right: -110 },
  orbB: { position: 'absolute', width: 190, height: 190, borderRadius: 999, bottom: 180, left: -90 },
  inner: { flex: 1, paddingHorizontal: 22, paddingTop: 8, paddingBottom: 170 },

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
  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.7, textTransform: 'uppercase', color: C.muted, marginBottom: 6 },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.tealBorder,
    backgroundColor: 'rgba(8,12,11,0.48)',
    paddingHorizontal: 12,
    color: C.title,
    fontSize: 15,
    fontWeight: '600',
  },
  errText: { color: C.err, fontSize: 12, fontWeight: '600', marginTop: 4 },

  footer: { position: 'absolute', left: 0, right: 0, bottom:0, paddingHorizontal: 22, paddingTop: FOOTER.paddingTop, paddingBottom: FOOTER.paddingBottom, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.tealBorder, backgroundColor: 'rgba(8,12,11,0.95)' },
  cta: { height: FOOTER.ctaHeight, borderRadius: FOOTER.ctaRadius, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  ctaTxt: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.15 },
});
