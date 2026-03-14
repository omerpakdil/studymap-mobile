import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useOnboardingV2 } from '@/app/(onboarding-v2)/state';
import { ONBOARDING_FOOTER_METRICS as FOOTER } from '@/app/components/onboarding-v2/footerMetrics';
import { getCountryByCode } from '@/app/data/countries';
import type { SupportedLanguage } from '@/app/i18n';
import { resolveAppLanguage, t } from '@/app/i18n';
import { getMinuteUnitShort } from '@/app/i18n/unitFormat';
import {
  trackOnboardingStepBack,
  trackOnboardingStepContinue,
  trackOnboardingStepView,
} from '@/app/utils/onboardingV2Analytics';

const C = {
  bg0: '#FAFBFC', bg1: '#F4F6F8', bg2: '#EEF1F4', bg3: '#F8FAFB',
  orbA: 'rgba(15,157,140,0.09)', orbB: 'rgba(100,116,139,0.06)',
  grid: 'rgba(0,0,0,0.028)',
  title: '#0F172A', sub: '#475569',
  labelMuted: 'rgba(15,157,140,0.40)',
  teal: '#0F9D8C', tealDk: '#0B7A6E',
  tealSoft: 'rgba(15,157,140,0.09)', tealBorder: 'rgba(15,157,140,0.22)',
  cardBg: '#FFFFFF', cardBorder: 'rgba(15,23,42,0.07)',
  backBg: 'rgba(0,0,0,0.04)', backBorder: 'rgba(0,0,0,0.06)',
  backArrow: '#64748B', brand: '#0F9D8C',
  footer: 'transparent', footerBorder: 'rgba(15,23,42,0.07)',
};

const OPTIONS = [
  { id: 25 as const, key: 'quick', title: 'Quick 25', desc: 'Fast reset blocks with low friction.' },
  { id: 45 as const, key: 'standard', title: 'Standard 45', desc: 'Balanced sessions for most study days.' },
  { id: 60 as const, key: 'deep', title: 'Deep 60', desc: 'Longer focus blocks with fewer switches.' },
  { id: 90 as const, key: 'extended', title: 'Extended 90', desc: 'Deep-work sessions for heavy days.' },
];

const COPY: Record<SupportedLanguage, {
  title: string;
  subtitle: string;
  options: Record<'quick' | 'standard' | 'deep' | 'extended', { label: string; desc: string }>;
}> = {
  en: {
    title: 'What session length\nfits you best?',
    subtitle: 'This helps us calculate realistic weekly sessions before we set intensity.',
    options: {
      quick: { label: 'Quick 25', desc: 'Fast reset blocks with low friction.' },
      standard: { label: 'Standard 45', desc: 'Balanced sessions for most study days.' },
      deep: { label: 'Deep 60', desc: 'Longer focus blocks with fewer switches.' },
      extended: { label: 'Extended 90', desc: 'Deep-work sessions for heavy days.' },
    },
  },
  tr: {
    title: 'Sana en uygun\noturum süresi ne?',
    subtitle: 'Yoğunluğu belirlemeden önce haftalık oturum sayısını buna göre hesaplıyoruz.',
    options: {
      quick: { label: 'Hızlı 25', desc: 'Düşük sürtünmeli, kısa reset blokları.' },
      standard: { label: 'Standart 45', desc: 'Çoğu çalışma günü için dengeli süre.' },
      deep: { label: 'Derin 60', desc: 'Daha az geçişle daha uzun odak blokları.' },
      extended: { label: 'Uzun 90', desc: 'Ağır günler için derin çalışma seansları.' },
    },
  },
  de: {
    title: 'Welche Sitzungsdauer\npasst am besten?',
    subtitle: 'So berechnen wir realistische Wochen-Sitzungen, bevor wir die Intensität festlegen.',
    options: {
      quick: { label: 'Kurz 25', desc: 'Kurze Blöcke mit wenig Reibung.' },
      standard: { label: 'Standard 45', desc: 'Ausgewogene Sitzungen für die meisten Lerntage.' },
      deep: { label: 'Tief 60', desc: 'Längere Fokusblöcke mit weniger Wechseln.' },
      extended: { label: 'Lang 90', desc: 'Deep-Work-Sessions für schwere Tage.' },
    },
  },
  fr: {
    title: 'Quelle durée de session\nte convient le mieux ?',
    subtitle: 'Nous calculons d abord des sessions hebdomadaires réalistes avant de fixer l intensité.',
    options: {
      quick: { label: 'Rapide 25', desc: 'Blocs courts avec très peu de friction.' },
      standard: { label: 'Standard 45', desc: 'Durée équilibrée pour la plupart des journées.' },
      deep: { label: 'Profond 60', desc: 'Blocs plus longs avec moins de bascules.' },
      extended: { label: 'Long 90', desc: 'Sessions profondes pour les journées lourdes.' },
    },
  },
  ja: {
    title: '自分に合う\nセッション時間は？',
    subtitle: '強度を決める前に、この設定で現実的な週次セッション数を計算します。',
    options: {
      quick: { label: 'クイック 25', desc: '切り替えやすい短い集中ブロックです。' },
      standard: { label: '標準 45', desc: '多くの学習日に合うバランス型です。' },
      deep: { label: '集中 60', desc: '切り替えを減らした長めの集中ブロックです。' },
      extended: { label: '長時間 90', desc: '重い日に向く深い学習セッションです。' },
    },
  },
  ko: {
    title: '나에게 맞는\n세션 길이는?',
    subtitle: '강도를 정하기 전에 이 값을 기준으로 주간 세션 수를 계산합니다.',
    options: {
      quick: { label: '퀵 25', desc: '부담 없이 들어가기 좋은 짧은 블록입니다.' },
      standard: { label: '스탠다드 45', desc: '대부분의 공부일에 맞는 균형 잡힌 길이입니다.' },
      deep: { label: '딥 60', desc: '전환이 적은 더 긴 집중 블록입니다.' },
      extended: { label: '롱 90', desc: '무거운 날에 맞는 깊은 작업 세션입니다.' },
    },
  },
  'zh-Hans': {
    title: '哪种学习时长\n最适合你？',
    subtitle: '在设置强度之前，我们会先按这个时长估算每周会有多少学习场次。',
    options: {
      quick: { label: '快速 25', desc: '进入门槛低的短学习块。' },
      standard: { label: '标准 45', desc: '适合大多数学习日的平衡时长。' },
      deep: { label: '深度 60', desc: '切换更少、连续更长的专注块。' },
      extended: { label: '长时 90', desc: '适合重负荷日的深度学习。' },
    },
  },
  ar: {
    title: 'ما مدة الجلسة\nالأنسب لك؟',
    subtitle: 'نستخدم هذا الخيار لحساب عدد الجلسات الأسبوعية الواقعي قبل تحديد الشدة.',
    options: {
      quick: { label: 'سريع 25', desc: 'جلسات قصيرة وسهلة البدء.' },
      standard: { label: 'قياسي 45', desc: 'مدة متوازنة لمعظم أيام الدراسة.' },
      deep: { label: 'عميق 60', desc: 'تركيز أطول مع تبديل أقل.' },
      extended: { label: 'طويل 90', desc: 'جلسات عميقة للأيام الثقيلة.' },
    },
  },
  hi: {
    title: 'तुम्हारे लिए सही\nसेशन लंबाई क्या है?',
    subtitle: 'इंटेंसिटी तय करने से पहले हम इसी आधार पर साप्ताहिक सेशन गिनते हैं।',
    options: {
      quick: { label: 'क्विक 25', desc: 'कम घर्षण वाले छोटे ब्लॉक।' },
      standard: { label: 'स्टैंडर्ड 45', desc: 'ज्यादातर दिनों के लिए संतुलित अवधि।' },
      deep: { label: 'डीप 60', desc: 'कम स्विच के साथ लंबे फोकस ब्लॉक।' },
      extended: { label: 'लॉन्ग 90', desc: 'भारी दिनों के लिए गहरे अध्ययन सत्र।' },
    },
  },
  id: {
    title: 'Durasi sesi seperti apa\nyang paling pas?',
    subtitle: 'Kami memakainya untuk menghitung jumlah sesi mingguan yang realistis sebelum intensitas ditetapkan.',
    options: {
      quick: { label: 'Cepat 25', desc: 'Blok pendek yang mudah dimulai.' },
      standard: { label: 'Standar 45', desc: 'Durasi seimbang untuk sebagian besar hari belajar.' },
      deep: { label: 'Fokus 60', desc: 'Blok fokus lebih panjang dengan lebih sedikit perpindahan.' },
      extended: { label: 'Panjang 90', desc: 'Sesi mendalam untuk hari yang berat.' },
    },
  },
  'pt-BR': {
    title: 'Qual duração de sessão\ne combina mais com você?',
    subtitle: 'Usamos isso para calcular sessões semanais realistas antes de definir a intensidade.',
    options: {
      quick: { label: 'Rápido 25', desc: 'Blocos curtos com baixo atrito.' },
      standard: { label: 'Padrão 45', desc: 'Duração equilibrada para a maioria dos dias.' },
      deep: { label: 'Profundo 60', desc: 'Blocos mais longos com menos trocas.' },
      extended: { label: 'Longo 90', desc: 'Sessões profundas para dias pesados.' },
    },
  },
};

export default function OnboardingV2SessionLengthScreen() {
  const { draft, updateDraft } = useOnboardingV2();
  const lang = resolveAppLanguage({
    countryDefaultLanguage: getCountryByCode(draft.countryCode)?.defaultLanguage ?? null,
  });

  const entrance = useRef(new Animated.Value(0)).current;
  const ctaFade = useRef(new Animated.Value(0)).current;
  const ctaScale = useRef(new Animated.Value(1)).current;
  const cardAnims = useRef(OPTIONS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    void trackOnboardingStepView('session_length');
    Animated.timing(entrance, { toValue: 1, duration: 380, useNativeDriver: true }).start();
    cardAnims.forEach((anim, i) => {
      Animated.timing(anim, { toValue: 1, duration: 220, delay: 140 + i * 50, useNativeDriver: true }).start();
    });
    Animated.timing(ctaFade, { toValue: 1, duration: 320, delay: 360, useNativeDriver: true }).start();
  // mount-only
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = useMemo(
    () => OPTIONS.find((opt) => opt.id === draft.preferredSessionMinutes) ?? OPTIONS[1],
    [draft.preferredSessionMinutes]
  );
  const copy = COPY[lang] ?? COPY.en;

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={[C.bg0, C.bg1, C.bg2, C.bg3]} locations={[0, 0.35, 0.7, 1]} style={StyleSheet.absoluteFill} />
      <View style={[s.orbA, { backgroundColor: C.orbA }]} />
      <View style={[s.orbB, { backgroundColor: C.orbB }]} />
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {[0,1,2,3,4,5,6].map(i => <View key={`v${i}`} style={{ position:'absolute', top:0, bottom:0, left:`${i*16.6}%`, width:StyleSheet.hairlineWidth, backgroundColor:C.grid }} />)}
        {[0,1,2,3,4,5,6,7].map(i => <View key={`h${i}`} style={{ position:'absolute', left:0, right:0, top:`${i*12.5}%`, height:StyleSheet.hairlineWidth, backgroundColor:C.grid }} />)}
      </View>

      <Animated.View style={[s.inner, { opacity: entrance }]}>
        <View style={s.headerRow}>
          <TouchableOpacity
            style={[s.backBtn, { backgroundColor: C.backBg, borderColor: C.backBorder }]}
            onPress={() => { void trackOnboardingStepBack('session_length'); router.back(); }}
            activeOpacity={0.7}
          >
            <Text style={[s.backArrow, { color: C.backArrow }]}>‹</Text>
          </TouchableOpacity>
          <View style={s.brandRow}>
            <View style={[s.brandMark, { backgroundColor: C.brand }]} />
            <Text style={[s.brandText, { color: C.brand }]}>StudyMap</Text>
          </View>
          <View style={s.backBtn} />
        </View>

        <View style={[s.progressTrack, { backgroundColor: C.tealSoft }]}>
          <View style={[s.progressFill, { width: '54%' }]}>
            <LinearGradient colors={[C.teal, C.tealDk]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
          </View>
        </View>
        <Text style={[s.stepLabel, { color: C.labelMuted }]}>
          {t('common.step_of', { lang, params: { current: 7, total: 13 } })}
        </Text>

        <Text style={[s.title, { color: C.title }]}>
          {copy.title}
        </Text>
        <Text style={[s.sub, { color: C.sub }]}>
          {copy.subtitle}
        </Text>

        <View style={s.cardList}>
          {OPTIONS.map((opt, i) => {
            const active = opt.id === selected.id;
            return (
              <Animated.View
                key={opt.id}
                style={{
                  opacity: cardAnims[i],
                  transform: [{ translateY: cardAnims[i].interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
                }}
              >
                <TouchableOpacity
                  style={[
                    s.card,
                    active
                      ? { backgroundColor: C.tealSoft, borderColor: C.teal, borderWidth: 1.5 }
                      : { backgroundColor: C.cardBg, borderColor: C.cardBorder, borderWidth: 1 },
                  ]}
                  onPress={() => updateDraft({ preferredSessionMinutes: opt.id })}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={[C.teal, C.tealDk]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={[s.rail, { opacity: active ? 1 : 0.2 }]}
                  />
                  <View style={s.cardBody}>
                    <View style={s.topRow}>
                      <Text style={[s.cardTitle, { color: active ? C.tealDk : C.title }]}>
                        {copy.options[opt.key].label}
                      </Text>
                      <View style={[s.badge, { backgroundColor: active ? `${C.teal}18` : 'rgba(0,0,0,0.05)' }]}>
                        <Text style={[s.badgeText, { color: active ? C.tealDk : C.sub }]}>{opt.id} {getMinuteUnitShort(lang)}</Text>
                      </View>
                    </View>
                    <Text style={[s.cardDesc, { color: C.sub }]}>
                      {copy.options[opt.key].desc}
                    </Text>
                  </View>
                  {active && (
                    <View style={s.checkWrap}>
                      <Text style={s.checkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      </Animated.View>

      <Animated.View style={[s.footer, { opacity: ctaFade, backgroundColor: C.footer, borderTopColor: C.footerBorder }]}>
        <Animated.View style={{ transform: [{ scale: ctaScale }] }}>
          <TouchableOpacity
            style={s.cta}
            onPress={() => { void trackOnboardingStepContinue('session_length'); router.push('/(onboarding-v2)/goal-intensity'); }}
            onPressIn={() => Animated.spring(ctaScale, { toValue: 0.97, damping: 20, stiffness: 400, useNativeDriver: true }).start()}
            onPressOut={() => Animated.spring(ctaScale, { toValue: 1, damping: 18, stiffness: 360, useNativeDriver: true }).start()}
            activeOpacity={1}
          >
            <LinearGradient colors={[C.teal, C.tealDk]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            <Text style={s.ctaText}>
              {t('common.continue', { lang })} · {selected.id} {getMinuteUnitShort(lang)}
            </Text>
            <Text style={s.ctaArrow}>→</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FAFBFC' },
  inner: { flex: 1, paddingHorizontal: 22, paddingTop: 10, paddingBottom: 110 },
  orbA: { position: 'absolute', width: 240, height: 240, borderRadius: 999, top: -70, right: -90 },
  orbB: { position: 'absolute', width: 160, height: 160, borderRadius: 999, bottom: 180, left: -70 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 11, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  backArrow: { fontSize: 26, fontWeight: '300', lineHeight: 30, marginTop: -1 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brandMark: { width: 7, height: 7, borderRadius: 2 },
  brandText: { fontSize: 14, fontWeight: '800', letterSpacing: 0.4 },
  progressTrack: { height: 3, borderRadius: 999, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', borderRadius: 999, overflow: 'hidden' },
  stepLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.9, textTransform: 'uppercase', marginBottom: 14, opacity: 0.65 },
  title: { fontSize: 30, fontWeight: '900', lineHeight: 36, letterSpacing: -0.7, marginBottom: 6 },
  sub: { fontSize: 13, lineHeight: 19, fontWeight: '400', marginBottom: 16 },
  cardList: { gap: 10 },
  card: { borderRadius: 16, flexDirection: 'row', alignItems: 'center', overflow: 'hidden', paddingVertical: 14, paddingRight: 14 },
  rail: { width: 4, alignSelf: 'stretch', borderRadius: 2, marginRight: 14 },
  cardBody: { flex: 1, gap: 6 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.1 },
  cardDesc: { fontSize: 12, lineHeight: 17 },
  checkWrap: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: `${C.teal}18`, marginLeft: 8 },
  checkText: { color: C.tealDk, fontSize: 14, fontWeight: '700' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 22, paddingTop: 6, paddingBottom: 36, borderTopWidth: StyleSheet.hairlineWidth },
  cta: { height: FOOTER.ctaHeight, borderRadius: FOOTER.ctaRadius, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, overflow: 'hidden' },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },
  ctaArrow: { color: 'rgba(255,255,255,0.78)', fontSize: 17 },
});
