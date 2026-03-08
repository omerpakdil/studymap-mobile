import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppAlert } from '@/app/components/ui/AppAlert';
import { resolveAppLanguage, t } from '@/app/i18n';
import { getLocalizedSubjectName } from '@/app/i18n/subjectNames';
import { loadCompleteOnboardingData } from '@/app/utils/onboardingData';
import {
  FOCUS_MAX,
  FOCUS_MIN,
  FocusPresetId,
  SubjectFocusOverrides,
  loadSubjectFocusOverrides,
  loadSubjectFocusPreset,
  saveSubjectFocusOverrides,
  saveSubjectFocusPreset,
} from '@/app/utils/subjectFocusManager';

const isIOS = Platform.OS === 'ios';

const T = {
  bg:      '#F4FAFA',
  card:    '#FFFFFF',
  ink:     '#0A1628',
  sub:     '#4A6270',
  muted:   '#8FA8B2',
  border:  'rgba(15,157,140,0.12)',
  teal:    '#0F9D8C',
  tealDk:  '#0B7A6E',
  tealMid: '#13B5A2',
  tealSoft:'#74CDC3',
  tealLt:  'rgba(15,157,140,0.09)',
  track:   'rgba(148,163,184,0.18)',
};

const PRESETS: { id: FocusPresetId; code: string }[] = [
  { id: 'balanced', code: 'BA' },
  { id: 'weak_recovery', code: 'RE' },
  { id: 'exam_sprint', code: 'SP' },
  { id: 'light_mode', code: 'LI' },
];

// ─── Preset Chip ─────────────────────────────────────────────────────────────
function PresetChip({
  preset, selected, onPress,
}: {
  preset: { id: FocusPresetId; code: string; label: string; desc: string }; selected: boolean; onPress: () => void;
}) {
  const anim = useRef(new Animated.Value(selected ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: selected ? 1 : 0, useNativeDriver: false, tension: 160, friction: 12 }).start();
  }, [selected]);

  const bg     = anim.interpolate({ inputRange: [0, 1], outputRange: ['#F7FBFB', T.teal] });
  const border = anim.interpolate({ inputRange: [0, 1], outputRange: ['rgba(148,163,184,0.28)', T.teal] });

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.78} style={{ flex: 1, minWidth: '44%' }}>
      <Animated.View style={[styles.presetChip, { backgroundColor: bg, borderColor: border }]}>
        {selected && <View style={styles.presetSelectedMark} />}
        <View style={[styles.presetCodePill, selected && styles.presetCodePillSelected]}>
          <Text style={[styles.presetCodeText, selected && styles.presetCodeTextSelected]}>{preset.code}</Text>
        </View>
        <Text style={[styles.presetLabel, selected && { color: '#fff' }]}>{preset.label}</Text>
        <Text style={[styles.presetDesc, selected && { color: 'rgba(255,255,255,0.68)' }]}>{preset.desc}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Subject Row ─────────────────────────────────────────────────────────────
function SubjectRow({
  subject, subjectLabel, value, contributionPercent, onValue, index, shareLabel,
}: {
  subject: string; subjectLabel: string; value: number; contributionPercent: number;
  onValue: (v: number) => void; index: number; shareLabel: string;
}) {
  const slideIn = useRef(new Animated.Value(24)).current;
  const fadeIn  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(slideIn, { toValue: 0, useNativeDriver: true, tension: 75, friction: 9 }),
        Animated.timing(fadeIn, { toValue: 1, duration: 280, useNativeDriver: true }),
      ]).start();
    }, index * 70);
  }, []);

  const isPos = value > 0;
  const isNeg = value < 0;
  const color = isPos ? T.tealDk : isNeg ? T.tealSoft : T.teal;
  const badgeBg = isPos ? 'rgba(15,157,140,0.14)' : isNeg ? 'rgba(15,157,140,0.08)' : T.tealLt;

  return (
    <Animated.View style={[styles.subRow, { transform: [{ translateX: slideIn }], opacity: fadeIn }]}>
      {/* Left accent */}
      <View style={[styles.subAccent, { backgroundColor: color }]} />

      <View style={styles.subBody}>
        {/* Top */}
        <View style={styles.subTop}>
          <View style={styles.subLeft}>
            <View style={styles.subIndex}>
              <Text style={styles.subIndexText}>{index + 1}</Text>
            </View>
            <Text style={styles.subName}>{subjectLabel}</Text>
          </View>
          <View style={[styles.subBadge, { backgroundColor: badgeBg }]}>
            <Text style={[styles.subBadgeText, { color }]}>
              {value > 0 ? '+' : ''}{value}%
            </Text>
          </View>
        </View>

        {/* Slider */}
        <View style={styles.sliderRow}>
          <Text style={styles.sliderEdge}>−30</Text>
          <View style={styles.sliderTrack}>
            <View style={styles.sliderCenter} />
            <Slider
              style={styles.slider}
              minimumValue={FOCUS_MIN}
              maximumValue={FOCUS_MAX}
              value={value}
              step={5}
              minimumTrackTintColor={color}
              maximumTrackTintColor={T.track}
              thumbTintColor={T.teal}
              onValueChange={onValue}
            />
          </View>
          <Text style={styles.sliderEdge}>+30</Text>
        </View>

        {/* Share bar */}
        <View style={styles.shareRow}>
          <Text style={styles.shareLabel}>{shareLabel}</Text>
          <View style={styles.shareTrack}>
            <View style={[styles.shareFill, { width: `${Math.max(2, contributionPercent)}%` as any, backgroundColor: T.teal }]} />
          </View>
          <Text style={styles.shareVal}>{contributionPercent}%</Text>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function FocusWeightsScreen() {
  const { showAlert } = useAppAlert();
  const router = useRouter();
  const appLang = resolveAppLanguage();
  const tp = (key: string, fallback: string, params?: Record<string, string | number>) =>
    t(`tabs.profile.focus.${key}`, { lang: appLang, fallback, params });
  const [examCode, setExamCode] = useState<string | null>(null);
  const localizeSubject = (subject: string) =>
    getLocalizedSubjectName(subject, appLang, subject, { examCode });

  const [loading,       setLoading]      = useState(true);
  const [saving,        setSaving]       = useState(false);
  const [subjects,      setSubjects]     = useState<string[]>([]);
  const [baseIntensity, setBaseIntensity]= useState<Record<string, number>>({});
  const [overrides,     setOverrides]    = useState<SubjectFocusOverrides>({});
  const [activePreset,  setActivePreset] = useState<FocusPresetId>('balanced');

  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 420, useNativeDriver: true }).start();
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const onboarding = await loadCompleteOnboardingData();
      const intensity  = onboarding?.subjectIntensity || {};
      setExamCode(onboarding?.examData?.id ?? null);
      const subjectList = Object.keys(intensity);
      if (!subjectList.length) {
        showAlert(
          tp('no_subjects_title', 'No Subjects'),
          tp('no_subjects_body', 'Complete onboarding first.')
        );
        router.back();
        return;
      }

      const [existingOverrides, savedPreset] = await Promise.all([
        loadSubjectFocusOverrides(), loadSubjectFocusPreset(),
      ]);
      setSubjects(subjectList);
      setBaseIntensity(intensity);
      const seeded: SubjectFocusOverrides = {};
      subjectList.forEach(s => { seeded[s] = existingOverrides[s] || 0; });
      setOverrides(seeded);
      setActivePreset(savedPreset);
    } catch {
      showAlert(tp('error_title', 'Error'), tp('error_load', 'Could not load focus weights.'));
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const buildPreset = (preset: FocusPresetId): SubjectFocusOverrides => {
    const sorted = [...subjects].sort((a, b) => (baseIntensity[a] ?? 1) - (baseIntensity[b] ?? 1));
    const next: SubjectFocusOverrides = {};
    if (preset === 'balanced')      { sorted.forEach(s => { next[s] = 0; }); return next; }
    if (preset === 'weak_recovery') { sorted.forEach((s, i) => { next[s] = i < Math.ceil(sorted.length / 2) ? 15 : -10; }); return next; }
    if (preset === 'exam_sprint')   { sorted.forEach((s, i) => { next[s] = i === 0 ? 25 : i === 1 ? 15 : -5; }); return next; }
    sorted.forEach((s, i) => { next[s] = i < Math.ceil(sorted.length / 2) ? 5 : -15; });
    return next;
  };

  const applyPreset = (id: FocusPresetId) => { setActivePreset(id); setOverrides(buildPreset(id)); };

  const handleSave = async () => {
    try {
      setSaving(true);
      await Promise.all([saveSubjectFocusOverrides(overrides), saveSubjectFocusPreset(activePreset)]);
      showAlert(tp('saved_title', 'Saved'), tp('saved_body', 'Focus weights updated.'));
      router.back();
    } catch {
      showAlert(tp('error_title', 'Error'), tp('error_save', 'Could not save focus weights.'));
    } finally {
      setSaving(false);
    }
  };

  const contribution = useMemo(() => {
    const raw = subjects.map(s => {
      const base = (baseIntensity[s] ?? 1) + 1;
      const adj  = Math.max(0.1, base * (1 + (overrides[s] || 0) / 100));
      return { subject: s, adjusted: adj };
    });
    const total = raw.reduce((sum, r) => sum + r.adjusted, 0);
    return raw.map(r => ({ subject: r.subject, percent: total > 0 ? Math.round((r.adjusted / total) * 100) : 0 }));
  }, [subjects, baseIntensity, overrides]);

  const getContrib = (s: string) => contribution.find(c => c.subject === s)?.percent || 0;
  const activePresetLabel = tp(
    `preset_${activePreset}_label`,
    activePreset === 'balanced'
      ? 'Balanced'
      : activePreset === 'weak_recovery'
        ? 'Recovery'
        : activePreset === 'exam_sprint'
          ? 'Sprint'
          : 'Light'
  );

  if (loading) {
    return (
      <View style={styles.loadWrap}>
        <LinearGradient colors={[T.bg, '#EAF6F4']} style={StyleSheet.absoluteFill} />
        <LinearGradient colors={[T.tealDk, T.tealMid]} style={styles.loadOrb} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <ActivityIndicator size="large" color="#fff" />
        </LinearGradient>
        <Text style={styles.loadTitle}>{tp('loading_title', 'Loading focus controls...')}</Text>
      </View>
    );
  }

  // Distribution summary for header pill
  const positiveCount = subjects.filter(s => (overrides[s] || 0) > 0).length;
  const negativeCount = subjects.filter(s => (overrides[s] || 0) < 0).length;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <LinearGradient colors={[T.bg, '#EAF6F4', T.bg]} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} />
      <View style={styles.orbA} />
      <View style={styles.orbB} />

      {/* ── Header ── */}
      <Animated.View style={[styles.header, { opacity: headerAnim }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.75}>
          <Text style={styles.backBtnText} numberOfLines={1}>{tp('back', 'Back')}</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerKicker}>{tp('header_kicker', 'Preferences')}</Text>
          <Text style={styles.headerTitle}>{tp('header_title', 'Focus Weights')}</Text>
        </View>
        <TouchableOpacity
          style={styles.resetBtn}
          onPress={() => { const r: SubjectFocusOverrides = {}; subjects.forEach(s => { r[s] = 0; }); setOverrides(r); setActivePreset('balanced'); }}
          activeOpacity={0.75}
        >
          <Text style={styles.resetBtnText}>{tp('reset', 'Reset')}</Text>
        </TouchableOpacity>
      </Animated.View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Summary Strip ── */}
        <View style={styles.summaryStrip}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryVal}>{subjects.length}</Text>
            <Text style={styles.summaryLbl}>{tp('summary_subjects', 'Subjects')}</Text>
          </View>
          <View style={styles.summaryDiv} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryVal, { color: T.tealDk }]}>{positiveCount}</Text>
            <Text style={styles.summaryLbl}>{tp('summary_boosted', 'Boosted')}</Text>
          </View>
          <View style={styles.summaryDiv} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryVal, { color: T.tealSoft }]}>{negativeCount}</Text>
            <Text style={styles.summaryLbl}>{tp('summary_reduced', 'Reduced')}</Text>
          </View>
          <View style={styles.summaryDiv} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryVal, { color: T.teal }]}>{activePresetLabel}</Text>
            <Text style={styles.summaryLbl}>{tp('summary_preset', 'Preset')}</Text>
          </View>
        </View>

        {/* ── Info ── */}
        <View style={styles.infoBanner}>
          <View style={styles.infoDot} />
          <Text style={styles.infoText}>
            {tp('info_text', 'Adjust each subject -30% to +30%. The planner uses these preferences for scheduling and weekly adaptation.')}
          </Text>
        </View>

        {/* ── Presets ── */}
        <View style={styles.block}>
          <View style={styles.blockHeader}>
            <View style={styles.blockDot} />
            <Text style={styles.blockTitle}>{tp('quick_presets', 'Quick Presets')}</Text>
          </View>
          <View style={styles.presetGrid}>
            {PRESETS.map(p => (
              <PresetChip
                key={p.id}
                preset={{
                  ...p,
                  label: tp(
                    `preset_${p.id}_label`,
                    p.id === 'balanced'
                      ? 'Balanced'
                      : p.id === 'weak_recovery'
                        ? 'Recovery'
                        : p.id === 'exam_sprint'
                          ? 'Sprint'
                          : 'Light'
                  ),
                  desc: tp(
                    `preset_${p.id}_desc`,
                    p.id === 'balanced'
                      ? 'Equal across all subjects'
                      : p.id === 'weak_recovery'
                        ? 'Boost weaker subjects'
                        : p.id === 'exam_sprint'
                          ? 'Max on top priority'
                          : 'Ease back on heavy loads'
                  ),
                }}
                selected={activePreset === p.id}
                onPress={() => applyPreset(p.id)}
              />
            ))}
          </View>
        </View>

        {/* ── Sliders ── */}
        <View style={styles.block}>
          <View style={styles.blockHeader}>
            <View style={[styles.blockDot, { backgroundColor: T.tealMid }]} />
            <Text style={styles.blockTitle}>{tp('subject_weights', 'Subject Weights')}</Text>
            <View style={styles.subjectCount}>
              <Text style={styles.subjectCountText}>{subjects.length}</Text>
            </View>
          </View>
          <View style={styles.slidersCard}>
            {subjects.map((subject, i) => (
              <View key={subject}>
                {i > 0 && <View style={styles.subDivider} />}
                <SubjectRow
                  subject={subject}
                  subjectLabel={localizeSubject(subject)}
                  value={overrides[subject] || 0}
                  contributionPercent={getContrib(subject)}
                  onValue={v => setOverrides(p => ({ ...p, [subject]: Math.max(FOCUS_MIN, Math.min(FOCUS_MAX, v)) }))}
                  index={i}
                  shareLabel={tp('plan_share', 'Plan share')}
                />
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[T.tealDk, T.tealMid]}
            style={styles.saveBtnGrad}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            {saving
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.saveBtnText}>{tp('save', 'Save Focus Weights')}</Text>
            }
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: isIOS ? 112 : 90 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  orbA: { position: 'absolute', width: 240, height: 240, borderRadius: 120, top: -80, right: -90, backgroundColor: 'rgba(19,181,162,0.10)' },
  orbB: { position: 'absolute', width: 180, height: 180, borderRadius: 90, bottom: 180, left: -90, backgroundColor: 'rgba(15,157,140,0.07)' },

  loadWrap:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadOrb:   { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 18, shadowColor: T.teal, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.28, shadowRadius: 14, elevation: 8 },
  loadTitle: { fontSize: 18, fontWeight: '700', color: T.ink },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingTop: isIOS ? 6 : 14, paddingBottom: 14,
  },
  backBtn: {
    minWidth: 52, height: 38, borderRadius: 12, backgroundColor: T.tealLt,
    paddingHorizontal: 10,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: T.border,
  },
  backBtnText: { fontSize: 11, fontWeight: '800', color: T.tealDk, includeFontPadding: false },
  headerKicker: { fontSize: 10, fontWeight: '700', color: T.muted, letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 2 },
  headerTitle:  { fontSize: 22, fontWeight: '800', color: T.ink, letterSpacing: -0.3 },
  resetBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: T.card, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: T.border,
  },
  resetBtnText: { fontSize: 12, fontWeight: '700', color: T.muted },

  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 10 },

  // Summary
  summaryStrip: {
    flexDirection: 'row', backgroundColor: T.card, borderRadius: 16, borderWidth: 1, borderColor: T.border,
    marginBottom: 14, overflow: 'hidden',
    shadowColor: T.teal, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  summaryItem: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  summaryDiv:  { width: StyleSheet.hairlineWidth, backgroundColor: T.border, marginVertical: 10 },
  summaryVal:  { fontSize: 17, fontWeight: '900', color: T.ink, marginBottom: 2, letterSpacing: -0.2 },
  summaryLbl:  { fontSize: 10, fontWeight: '600', color: T.muted, textTransform: 'uppercase', letterSpacing: 0.4 },

  // Info
  infoBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: T.tealLt, borderRadius: 13, paddingHorizontal: 14, paddingVertical: 12,
    marginBottom: 20, borderWidth: 1, borderColor: T.border,
  },
  infoDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: T.teal, marginTop: 4 },
  infoText: { flex: 1, fontSize: 12, color: T.sub, lineHeight: 18, fontWeight: '500' },

  // Block
  block: { marginBottom: 20 },
  blockHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  blockDot:    { width: 7, height: 7, borderRadius: 4, backgroundColor: T.teal },
  blockTitle:  { flex: 1, fontSize: 13, fontWeight: '800', color: T.sub, textTransform: 'uppercase', letterSpacing: 0.6 },
  subjectCount: { backgroundColor: T.tealLt, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: T.border },
  subjectCountText: { fontSize: 11, fontWeight: '800', color: T.teal },

  // Preset chips
  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  presetChip: {
    borderRadius: 16, borderWidth: 1.5, padding: 14, position: 'relative', overflow: 'hidden',
  },
  presetSelectedMark: { position: 'absolute', top: 0, right: 0, width: 0, height: 0, borderTopWidth: 28, borderRightWidth: 28, borderTopColor: 'rgba(255,255,255,0.18)', borderRightColor: 'rgba(255,255,255,0.18)', borderStyle: 'solid' },
  presetCodePill: { alignSelf: 'flex-start', minWidth: 30, paddingHorizontal: 8, height: 20, borderRadius: 10, backgroundColor: T.tealLt, borderWidth: 1, borderColor: T.border, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  presetCodePillSelected: { backgroundColor: 'rgba(255,255,255,0.18)', borderColor: 'rgba(255,255,255,0.28)' },
  presetCodeText: { fontSize: 10, fontWeight: '800', color: T.tealDk, letterSpacing: 0.4 },
  presetCodeTextSelected: { color: '#fff' },
  presetLabel:  { fontSize: 14, fontWeight: '800', color: T.ink, marginBottom: 2 },
  presetDesc:   { fontSize: 11, color: T.muted, lineHeight: 15 },

  // Sliders card
  slidersCard: {
    backgroundColor: T.card, borderRadius: 18, borderWidth: 1, borderColor: T.border, overflow: 'hidden',
    shadowColor: T.teal, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  subDivider: { height: StyleSheet.hairlineWidth, backgroundColor: T.border },

  // Subject row
  subRow: { flexDirection: 'row' },
  subAccent: { width: 3 },
  subBody:  { flex: 1, padding: 15 },
  subTop:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  subLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  subIndex: { width: 24, height: 24, borderRadius: 8, backgroundColor: T.tealLt, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: T.border },
  subIndexText: { fontSize: 11, fontWeight: '800', color: T.teal },
  subName: { fontSize: 15, fontWeight: '700', color: T.ink },
  subBadge: { borderRadius: 9, paddingHorizontal: 10, paddingVertical: 4 },
  subBadgeText: { fontSize: 13, fontWeight: '800' },

  sliderRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sliderEdge:   { width: 26, fontSize: 10, fontWeight: '700', color: T.muted, textAlign: 'center' },
  sliderTrack:  { flex: 1, position: 'relative', justifyContent: 'center' },
  sliderCenter: { position: 'absolute', alignSelf: 'center', width: 1.5, height: 10, backgroundColor: 'rgba(148,163,184,0.5)', zIndex: 1 },
  slider:       { width: '100%', height: 36 },

  shareRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  shareLabel: { fontSize: 11, fontWeight: '600', color: T.muted, width: 60 },
  shareTrack: { flex: 1, height: 5, borderRadius: 3, backgroundColor: T.track, overflow: 'hidden' },
  shareFill:  { height: 5, borderRadius: 3 },
  shareVal:   { fontSize: 12, fontWeight: '800', color: T.teal, width: 32, textAlign: 'right' },

  saveBtn: {
    borderRadius: 17, overflow: 'hidden',
    shadowColor: T.tealDk, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.30, shadowRadius: 12, elevation: 8,
  },
  saveBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, height: 54 },
  saveBtnText: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 0.1 },
});
