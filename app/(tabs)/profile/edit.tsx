import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { resolveAppLanguage, t } from '@/app/i18n';
import { GoalsData, loadCompleteOnboardingData, saveGoalsData } from '@/app/utils/onboardingData';

const isIOS = Platform.OS === 'ios';

const T = {
  bg:       '#F4FAFA',
  card:     '#FFFFFF',
  ink:      '#0A1628',
  sub:      '#4A6270',
  muted:    '#8FA8B2',
  border:   'rgba(15,157,140,0.12)',
  teal:     '#0F9D8C',
  tealDk:   '#0B7A6E',
  tealMid:  '#13B5A2',
  tealLt:   'rgba(15,157,140,0.09)',
  rose:     '#E11D48',
  input:    '#F7FBFB',
};

interface UserInfo {
  firstName: string;
  lastName: string;
  email: string;
  fullName: string;
  createdAt: string;
}

// ─── Field ───────────────────────────────────────────────────────────────────
function Field({
  label, value, onChangeText, placeholder, keyboardType, autoCapitalize, error,
}: {
  label: string; value: string; onChangeText: (t: string) => void;
  placeholder?: string; keyboardType?: any; autoCapitalize?: any; error?: string;
}) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const [focused, setFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;
  const labelAnim  = useRef(new Animated.Value(value ? 1 : 0)).current;

  const animateFocus = (to: number) =>
    Animated.spring(borderAnim, { toValue: to, useNativeDriver: false, tension: 160, friction: 12 }).start();

  const animateLabel = (to: number) =>
    Animated.spring(labelAnim, { toValue: to, useNativeDriver: false, tension: 160, friction: 12 }).start();

  useEffect(() => { if (value) animateLabel(1); }, []);

  const handleFocus = () => { setFocused(true); animateFocus(1); animateLabel(1); };
  const handleBlur  = () => { setFocused(false); animateFocus(0); if (!value) animateLabel(0); };

  const borderColor = borderAnim.interpolate({ inputRange: [0, 1], outputRange: [error ? T.rose : 'rgba(148,163,184,0.28)', error ? T.rose : T.teal] });
  const labelTop    = labelAnim.interpolate({ inputRange: [0, 1], outputRange: [17, 7] });
  const labelSize   = labelAnim.interpolate({ inputRange: [0, 1], outputRange: [15, 11] });
  const labelColor  = labelAnim.interpolate({ inputRange: [0, 1], outputRange: [error ? T.rose : 'rgba(100,116,139,0.7)', error ? T.rose : T.teal] });

  return (
    <View style={fieldStyles.wrap}>
      <Animated.View style={[fieldStyles.box, isTablet && fieldStyles.boxTablet, { borderColor }]}>
        <Animated.Text style={[fieldStyles.label, isTablet && fieldStyles.labelTablet, { top: labelTop, fontSize: labelSize, color: labelColor }]}>
          {label}
        </Animated.Text>
        <TextInput
          style={[fieldStyles.input, isTablet && fieldStyles.inputTablet]}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={focused ? placeholder : ''}
          placeholderTextColor="rgba(143,168,178,0.6)"
          keyboardType={keyboardType || 'default'}
          autoCapitalize={autoCapitalize || 'words'}
          autoCorrect={false}
        />
      </Animated.View>
      {error ? (
        <Text style={fieldStyles.errorText}>{error}</Text>
      ) : null}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  box: {
    borderWidth: 1.5, borderRadius: 14, backgroundColor: T.input,
    paddingHorizontal: 16, paddingTop: 22, paddingBottom: 11, position: 'relative',
  },
  boxTablet: {
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 14,
  },
  label: { position: 'absolute', left: 16, fontWeight: '600', zIndex: 1 },
  labelTablet: { left: 20 },
  input: { fontSize: 15, fontWeight: '600', color: T.ink, paddingTop: 2 },
  inputTablet: { fontSize: 19, paddingTop: 4 },
  errorText: { fontSize: 11, fontWeight: '600', color: T.rose, marginTop: 5, marginLeft: 4 },
});

// ─── Freq Option ─────────────────────────────────────────────────────────────
function FreqOption({
  id, label, sub, selected, onPress,
}: {
  id: string; label: string; sub: string;
  selected: boolean; onPress: () => void;
}) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const anim = useRef(new Animated.Value(selected ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: selected ? 1 : 0, useNativeDriver: false, tension: 160, friction: 12 }).start();
  }, [selected]);

  const bg     = anim.interpolate({ inputRange: [0, 1], outputRange: ['#F7FBFB', T.teal] });
  const border = anim.interpolate({ inputRange: [0, 1], outputRange: ['rgba(148,163,184,0.28)', T.teal] });

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Animated.View style={[styles.freqOpt, isTablet && styles.freqOptTablet, { backgroundColor: bg, borderColor: border }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.freqOptLabel, isTablet && styles.freqOptLabelTablet, selected && { color: '#fff' }]}>{label}</Text>
          <Text style={[styles.freqOptSub, isTablet && styles.freqOptSubTablet, selected && { color: 'rgba(255,255,255,0.7)' }]}>{sub}</Text>
        </View>
        {selected && (
          <View style={[styles.freqCheck, isTablet && styles.freqCheckTablet]} />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ProfileEditScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const appLang = resolveAppLanguage();
  const tp = (key: string, fallback: string, params?: Record<string, string | number>) =>
    t(`tabs.profile.edit.${key}`, { lang: appLang, fallback, params });

  const [userInfo, setUserInfo] = useState<UserInfo>({
    firstName: '', lastName: '', email: '', fullName: '', createdAt: '',
  });
  const [goalsData, setGoalsData] = useState<GoalsData>({
    examDate: '', targetScore: '', studyIntensity: 'moderate',
    reminderFrequency: 'moderate', motivation: '',
  });
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors,      setErrors]      = useState<Record<string, string>>({});

  const headerAnim  = useRef(new Animated.Value(0)).current;
  const successAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 420, useNativeDriver: true }).start();
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const str = await AsyncStorage.getItem('user_info');
      if (str) setUserInfo(JSON.parse(str));
      const onboarding = await loadCompleteOnboardingData();
      if (onboarding?.goalsData) setGoalsData(onboarding.goalsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!userInfo.firstName.trim()) e.firstName = tp('required', 'Required');
    if (!userInfo.lastName.trim())  e.lastName  = tp('required', 'Required');
    if (!userInfo.email.trim())     e.email     = tp('required', 'Required');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userInfo.email)) e.email = tp('invalid_email', 'Invalid email');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      setSaving(true);
      const updated = {
        ...userInfo,
        firstName: userInfo.firstName.trim(),
        lastName:  userInfo.lastName.trim(),
        email:     userInfo.email.trim().toLowerCase(),
        fullName:  `${userInfo.firstName.trim()} ${userInfo.lastName.trim()}`,
      };
      await AsyncStorage.setItem('user_info', JSON.stringify(updated));
      await saveGoalsData(goalsData);

      setShowSuccess(true);
      Animated.spring(successAnim, { toValue: 1, useNativeDriver: true, tension: 90, friction: 9 }).start();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadWrap}>
        <LinearGradient colors={[T.bg, '#EAF6F4']} style={StyleSheet.absoluteFill} />
        <LinearGradient colors={[T.tealDk, T.tealMid]} style={styles.loadOrb} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <ActivityIndicator size="large" color="#fff" />
        </LinearGradient>
        <Text style={styles.loadTitle}>{tp('loading_title', 'Loading profile...')}</Text>
      </View>
    );
  }

  const initials = userInfo.firstName
    ? `${userInfo.firstName[0]}${userInfo.lastName?.[0] || ''}`.toUpperCase()
    : '?';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <LinearGradient colors={[T.bg, '#EAF6F4', T.bg]} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} />
      <View style={styles.orbA} />

      {/* ── Header ── */}
      <Animated.View style={[styles.header, isTablet && styles.headerTablet, { opacity: headerAnim }]}>
        <TouchableOpacity style={[styles.backBtn, isTablet && styles.backBtnTablet]} onPress={() => router.back()} activeOpacity={0.75}>
          <Text style={[styles.backBtnText, isTablet && styles.backBtnTextTablet]}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerKicker, isTablet && styles.headerKickerTablet]}>{tp('header_kicker', 'Profile')}</Text>
          <Text style={[styles.headerTitle, isTablet && styles.headerTitleTablet]}>{tp('header_title', 'Edit Info')}</Text>
        </View>
        <TouchableOpacity
          style={[styles.saveBtn, isTablet && styles.saveBtnTablet, saving && { opacity: 0.55 }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={[styles.saveBtnText, isTablet && styles.saveBtnTextTablet]}>{tp('save', 'Save')}</Text>
          }
        </TouchableOpacity>
      </Animated.View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={isIOS ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, isTablet && styles.scrollContentTablet]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Avatar preview ── */}
          <View style={[styles.avatarSection, isTablet && styles.avatarSectionTablet]}>
            <LinearGradient colors={[T.tealDk, T.tealMid]} style={[styles.avatarCircle, isTablet && styles.avatarCircleTablet]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={[styles.avatarInitials, isTablet && styles.avatarInitialsTablet]}>{initials || '?'}</Text>
            </LinearGradient>
            <View style={styles.avatarInfo}>
              <Text style={[styles.avatarName, isTablet && styles.avatarNameTablet]}>{userInfo.fullName || `${userInfo.firstName} ${userInfo.lastName}`.trim() || tp('your_name', 'Your Name')}</Text>
              <Text style={[styles.avatarHint, isTablet && styles.avatarHintTablet]}>{tp('avatar_hint', 'Changes apply immediately')}</Text>
            </View>
          </View>

          {/* ── Personal Info ── */}
          <View style={[styles.block, isTablet && styles.blockTablet]}>
            <View style={[styles.blockHeader, isTablet && styles.blockHeaderTablet]}>
              <View style={[styles.blockDot, isTablet && styles.blockDotTablet]} />
              <Text style={[styles.blockTitle, isTablet && styles.blockTitleTablet]}>{tp('section_personal_info', 'Personal Information')}</Text>
            </View>
            <View style={[styles.card, isTablet && styles.cardTablet]}>
              <View style={{ flexDirection: 'row', gap: isTablet ? 16 : 12 }}>
                <View style={{ flex: 1 }}>
                  <Field
                    label={tp('first_name', 'First Name')}
                    value={userInfo.firstName}
                    onChangeText={t => { setUserInfo(p => ({ ...p, firstName: t })); setErrors(p => ({ ...p, firstName: '' })); }}
                    placeholder={tp('first_name_placeholder', 'John')}
                    error={errors.firstName}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Field
                    label={tp('last_name', 'Last Name')}
                    value={userInfo.lastName}
                    onChangeText={t => { setUserInfo(p => ({ ...p, lastName: t })); setErrors(p => ({ ...p, lastName: '' })); }}
                    placeholder={tp('last_name_placeholder', 'Doe')}
                    error={errors.lastName}
                  />
                </View>
              </View>
              <Field
                label={tp('email_address', 'Email Address')}
                value={userInfo.email}
                onChangeText={t => { setUserInfo(p => ({ ...p, email: t })); setErrors(p => ({ ...p, email: '' })); }}
                placeholder={tp('email_placeholder', 'john@example.com')}
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email}
              />
            </View>
          </View>

          {/* ── Reminder Frequency ── */}
          <View style={[styles.block, isTablet && styles.blockTablet]}>
            <View style={[styles.blockHeader, isTablet && styles.blockHeaderTablet]}>
              <View style={[styles.blockDot, isTablet && styles.blockDotTablet]} />
              <Text style={[styles.blockTitle, isTablet && styles.blockTitleTablet]}>{tp('section_reminder_frequency', 'Reminder Frequency')}</Text>
            </View>
            <View style={[styles.card, isTablet && styles.cardTablet]}>
              <Text style={[styles.freqHint, isTablet && styles.freqHintTablet]}>{tp('frequency_hint', 'How often should we send study reminders?')}</Text>
              <View style={{ gap: isTablet ? 12 : 9, marginTop: isTablet ? 8 : 4 }}>
                {[
                  { id: 'minimal',  label: tp('freq_minimal', 'Minimal'),  sub: tp('freq_minimal_sub', 'Weekly check-ins') },
                  { id: 'moderate', label: tp('freq_moderate', 'Moderate'), sub: tp('freq_moderate_sub', 'Daily reminders')  },
                  { id: 'frequent', label: tp('freq_frequent', 'Frequent'), sub: tp('freq_frequent_sub', 'Multiple daily')   },
                ].map(opt => (
                  <FreqOption
                    key={opt.id}
                    {...opt}
                    selected={goalsData.reminderFrequency === opt.id}
                    onPress={() => setGoalsData(p => ({ ...p, reminderFrequency: opt.id }))}
                  />
                ))}
              </View>
            </View>
          </View>

          <View style={{ height: isIOS ? (isTablet ? 140 : 110) : (isTablet ? 120 : 92) }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Success Modal ── */}
      <Modal visible={showSuccess} transparent animationType="fade" onRequestClose={() => { setShowSuccess(false); router.back(); }}>
        <Pressable style={styles.overlay} onPress={() => { setShowSuccess(false); router.back(); }}>
          <Pressable style={[styles.successSheet, isTablet && styles.successSheetTablet]}>
            <Animated.View
              style={{
                alignItems: 'center',
                opacity: successAnim,
                transform: [{ scale: successAnim.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] }) }],
              }}
            >
              {/* Checkmark */}
              <View style={[styles.successOrbWrap, isTablet && styles.successOrbWrapTablet]}>
                <LinearGradient colors={[T.tealDk, T.tealMid]} style={[styles.successOrb, isTablet && styles.successOrbTablet]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <View style={styles.successOrbDot} />
                </LinearGradient>
                <View style={[styles.successRing, isTablet && styles.successRingTablet]} />
              </View>

              <Text style={[styles.successTitle, isTablet && styles.successTitleTablet]}>{tp('saved_title', 'Saved!')}</Text>
              <Text style={[styles.successSub, isTablet && styles.successSubTablet]}>{tp('saved_sub', 'Your profile has been updated successfully.')}</Text>

              <TouchableOpacity
                style={[styles.successBtn, isTablet && styles.successBtnTablet]}
                onPress={() => { setShowSuccess(false); router.back(); }}
                activeOpacity={0.8}
              >
                <LinearGradient colors={[T.tealDk, T.tealMid]} style={[styles.successBtnGrad, isTablet && styles.successBtnGradTablet]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={[styles.successBtnText, isTablet && styles.successBtnTextTablet]}>{tp('continue', 'Continue')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  orbA: { position: 'absolute', width: 240, height: 240, borderRadius: 120, top: -70, right: -90, backgroundColor: 'rgba(19,181,162,0.10)' },

  loadWrap:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadOrb:   { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 18, shadowColor: T.teal, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.28, shadowRadius: 14, elevation: 8 },
  loadTitle: { fontSize: 18, fontWeight: '700', color: T.ink },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingTop: isIOS ? 6 : 14, paddingBottom: 14,
  },
  headerTablet: { gap: 18, paddingHorizontal: 28, paddingTop: isIOS ? 12 : 18, paddingBottom: 18 },
  backBtn: {
    width: 38, height: 38, borderRadius: 12, backgroundColor: T.tealLt,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: T.border,
  },
  backBtnTablet: { width: 48, height: 48, borderRadius: 15 },
  backBtnText: { fontSize: 22, fontWeight: '300', color: T.teal, lineHeight: 26, marginTop: -2 },
  backBtnTextTablet: { fontSize: 28, lineHeight: 32 },
  headerKicker: { fontSize: 10, fontWeight: '700', color: T.muted, letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 2 },
  headerKickerTablet: { fontSize: 12, marginBottom: 4, letterSpacing: 1.3 },
  headerTitle:  { fontSize: 22, fontWeight: '800', color: T.ink, letterSpacing: -0.3 },
  headerTitleTablet: { fontSize: 30, letterSpacing: -0.5 },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: T.teal, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10,
    shadowColor: T.teal, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.30, shadowRadius: 8, elevation: 6,
  },
  saveBtnTablet: { borderRadius: 15, paddingHorizontal: 20, paddingVertical: 13 },
  saveBtnText: { fontSize: 14, fontWeight: '800', color: '#fff' },
  saveBtnTextTablet: { fontSize: 17 },

  scrollContent: { paddingHorizontal: 20, paddingTop: 6 },
  scrollContentTablet: { paddingHorizontal: 28, paddingTop: 10, maxWidth: 980, alignSelf: 'center', width: '100%' },

  // Avatar section
  avatarSection: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 26, paddingVertical: 6 },
  avatarSectionTablet: { gap: 22, marginBottom: 34, paddingVertical: 10 },
  avatarCircle:  { width: 60, height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', shadowColor: T.tealDk, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.24, shadowRadius: 10, elevation: 6 },
  avatarCircleTablet: { width: 84, height: 84, borderRadius: 26 },
  avatarInitials: { fontSize: 22, fontWeight: '900', color: '#fff' },
  avatarInitialsTablet: { fontSize: 30 },
  avatarInfo:   {},
  avatarName:   { fontSize: 18, fontWeight: '800', color: T.ink, letterSpacing: -0.2 },
  avatarNameTablet: { fontSize: 26, letterSpacing: -0.3 },
  avatarHint:   { fontSize: 12, color: T.muted, marginTop: 3, fontWeight: '500' },
  avatarHintTablet: { fontSize: 15, marginTop: 5 },

  // Block
  block: { marginBottom: 22 },
  blockTablet: { marginBottom: 30 },
  blockHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  blockHeaderTablet: { gap: 10, marginBottom: 16 },
  blockDot:    { width: 7, height: 7, borderRadius: 4, backgroundColor: T.teal },
  blockDotTablet: { width: 9, height: 9, borderRadius: 5 },
  blockTitle:  { fontSize: 13, fontWeight: '800', color: T.sub, textTransform: 'uppercase', letterSpacing: 0.6 },
  blockTitleTablet: { fontSize: 15, letterSpacing: 0.8 },

  card: {
    backgroundColor: T.card, borderRadius: 18, borderWidth: 1, borderColor: T.border,
    padding: 16,
    shadowColor: T.teal, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  cardTablet: { borderRadius: 22, padding: 22 },

  freqHint: { fontSize: 12, color: T.muted, fontWeight: '500', marginBottom: 14 },
  freqHintTablet: { fontSize: 15, marginBottom: 18 },
  freqOpt: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 13, borderWidth: 1.5, padding: 15,
  },
  freqOptTablet: { gap: 16, borderRadius: 16, padding: 20 },
  freqOptLabel: { fontSize: 14, fontWeight: '700', color: T.ink, marginBottom: 2 },
  freqOptLabelTablet: { fontSize: 18, marginBottom: 4 },
  freqOptSub:   { fontSize: 12, color: T.muted },
  freqOptSubTablet: { fontSize: 15 },
  freqCheck:    { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.5)' },
  freqCheckTablet: { width: 12, height: 12, borderRadius: 6 },

  // Overlay + success
  overlay: { flex: 1, backgroundColor: 'rgba(5,15,25,0.45)', justifyContent: 'flex-end', padding: 14 },
  successSheet: {
    backgroundColor: '#fff', borderRadius: 26, padding: 30, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 14,
  },
  successSheetTablet: { alignSelf: 'center', width: 620, borderRadius: 30, padding: 38 },
  successOrbWrap: { position: 'relative', marginBottom: 22, width: 80, height: 80, alignItems: 'center', justifyContent: 'center' },
  successOrbWrapTablet: { marginBottom: 28, width: 96, height: 96 },
  successOrb:  { width: 72, height: 72, borderRadius: 22, justifyContent: 'center', alignItems: 'center', shadowColor: T.teal, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.30, shadowRadius: 14, elevation: 8 },
  successOrbTablet: { width: 86, height: 86, borderRadius: 26 },
  successOrbDot: { width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.9)' },
  successRing: { position: 'absolute', width: 80, height: 80, borderRadius: 24, borderWidth: 2, borderColor: T.tealLt },
  successRingTablet: { width: 96, height: 96, borderRadius: 28 },
  successTitle: { fontSize: 24, fontWeight: '900', color: T.ink, marginBottom: 8, letterSpacing: -0.4 },
  successTitleTablet: { fontSize: 30, marginBottom: 10 },
  successSub:   { fontSize: 14, color: T.sub, textAlign: 'center', lineHeight: 20, marginBottom: 28 },
  successSubTablet: { fontSize: 17, lineHeight: 25, marginBottom: 34 },
  successBtn:   { width: '100%', borderRadius: 15, overflow: 'hidden', shadowColor: T.teal, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 10, elevation: 6 },
  successBtnTablet: { borderRadius: 18 },
  successBtnGrad: { height: 52, justifyContent: 'center', alignItems: 'center' },
  successBtnGradTablet: { height: 60 },
  successBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  successBtnTextTablet: { fontSize: 18 },
});
