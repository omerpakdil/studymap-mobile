/**
 * plan-preview.tsx — "Your Execution Blueprint"
 *
 * Dark ink variant — same as intro/value-proof.
 * 
 * UX narrative: The plan is "built" in front of the user.
 * Loading state: animated progress with 3 build phases shown sequentially.
 * Success state:
 *   - Large feasibility score ring (animated fill)
 *   - 3 KPI cells: weekly hours / total tasks / days active
 *   - Subject breakdown bars (teal fill proportional to intensity)
 *   - First 3 upcoming tasks in a clean list
 *   - Personalization summary strip (4 key settings at a glance)
 */
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';

import { useOnboardingV2 } from '@/app/(onboarding-v2)/state';
import { ONBOARDING_FOOTER_METRICS as FOOTER } from '@/app/components/onboarding-v2/footerMetrics';
import { useAppAlert } from '@/app/components/ui/AppAlert';
import { getCountryByCode } from '@/app/data/countries';
import type { SupportedLanguage } from '@/app/i18n';
import { getLocaleTagForLanguage, resolveAppLanguage, t } from '@/app/i18n';
import { getHourUnitShort } from '@/app/i18n/unitFormat';
import { getLocalizedSubjectName } from '@/app/i18n/subjectNames';
import { getLocalizedTaskTypeLabel } from '@/app/i18n/taskContent';
import {
    persistOnboardingV2ToLegacyStorage,
    toLegacyOnboardingData,
    type OnboardingSnapshotV2,
} from '@/app/utils/onboardingV2';
import {
    trackOnboardingStepBack,
    trackOnboardingStepContinue,
    trackOnboardingStepValidationFail,
    trackOnboardingStepView,
    trackOnboardingV2Event,
} from '@/app/utils/onboardingV2Analytics';
import { generateStudyProgramWithRules } from '@/app/utils/planner/ruleBasedStudyGenerator';
import { syncRemoteNotificationState } from '@/app/utils/remoteNotificationService';
import { saveDailyTasks, saveStudyProgram } from '@/app/utils/studyProgramStorage';
import type { StudyProgram } from '@/app/utils/studyTypes';

// ── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg0:'#080C0B', bg1:'#0C1210', bg2:'#0F1A18', bg3:'#080C0B',
  orbA:'rgba(20,184,166,0.20)', orbB:'rgba(52,211,153,0.10)',
  grid:'rgba(255,255,255,0.025)',
  title:'#ECFDF5', sub:'rgba(167,243,208,0.60)',
  muted:'rgba(148,163,184,0.55)',
  labelMuted:'rgba(45,212,191,0.38)',
  teal:'#2DD4BF', tealDk:'#14B8A6', tealDk2:'#0F9D8C',
  tealSoft:'rgba(45,212,191,0.10)', tealBorder:'rgba(45,212,191,0.20)',
  cardBg:'rgba(255,255,255,0.04)', cardBorder:'rgba(255,255,255,0.08)',
  cardBgSolid:'#111916',
  backBg:'rgba(255,255,255,0.07)', backBorder:'rgba(255,255,255,0.09)',
  backArrow:'rgba(167,243,208,0.65)', brand:'#2DD4BF',
  footer:'rgba(8,12,11,0.96)', footerBorder:'rgba(45,212,191,0.10)',
  green:'#34D399', greenSoft:'rgba(52,211,153,0.12)',
  errorBg:'rgba(239,68,68,0.10)', errorBorder:'rgba(239,68,68,0.22)', errorTxt:'#F87171',
};

const EXPLAIN_COPY: Record<SupportedLanguage, {
  title: string;
  type: Record<'study' | 'practice' | 'review' | 'quiz', string>;
  phase: Record<'foundation' | 'build' | 'consolidation' | 'final', string>;
  summary: (subjectLabel: string, typeLabel: string) => string;
  reasonPhase: (phaseLabel: string, typeLabel: string) => string;
  reasonSubject: (subjectLabel: string) => string;
  reasonRebalance: (subjectLabel: string) => string;
  reasonOverdue: (subjectLabel: string) => string;
  reasonOverload: string;
}> = {
  en: {
    title: 'Why this plan',
    type: { study: 'Study', practice: 'Practice', review: 'Review', quiz: 'Quiz' },
    phase: { foundation: 'Foundation', build: 'Build', consolidation: 'Consolidation', final: 'Final' },
    summary: (subjectLabel, typeLabel) => `First focus: ${subjectLabel} through ${typeLabel.toLowerCase()}.`,
    reasonPhase: (phaseLabel, typeLabel) => `${phaseLabel} phase pushes ${typeLabel.toLowerCase()} work right now.`,
    reasonSubject: (subjectLabel) => `${subjectLabel} moved up based on focus and exam weighting.`,
    reasonRebalance: (subjectLabel) => `${subjectLabel} was boosted to recover weaker recent performance.`,
    reasonOverdue: (subjectLabel) => `${subjectLabel} has delayed tasks that need to be absorbed back in.`,
    reasonOverload: 'Load was softened to avoid overpacking the week.',
  },
  tr: {
    title: 'Bu plan neden böyle',
    type: { study: 'Çalışma', practice: 'Pratik', review: 'Tekrar', quiz: 'Kontrol' },
    phase: { foundation: 'Temel', build: 'Gelişim', consolidation: 'Pekiştirme', final: 'Final' },
    summary: (subjectLabel, typeLabel) => `İlk odak: ${subjectLabel} · ${typeLabel}.`,
    reasonPhase: (phaseLabel, typeLabel) => `${phaseLabel} aşaması şu anda ${typeLabel.toLowerCase()} görevini öne çıkarıyor.`,
    reasonSubject: (subjectLabel) => `${subjectLabel}, odak ve sınav ağırlığına göre öne çıktı.`,
    reasonRebalance: (subjectLabel) => `${subjectLabel}, son performansı dengelemek için güçlendirildi.`,
    reasonOverdue: (subjectLabel) => `${subjectLabel} içinde geri alınması gereken gecikmiş görevler var.`,
    reasonOverload: 'Hafta aşırı dolmasın diye yük biraz yumuşatıldı.',
  },
  de: {
    title: 'Warum dieser Plan',
    type: { study: 'Lernen', practice: 'Praxis', review: 'Wiederholung', quiz: 'Check' },
    phase: { foundation: 'Grundlage', build: 'Aufbau', consolidation: 'Festigung', final: 'Finale' },
    summary: (subjectLabel, typeLabel) => `Erster Fokus: ${subjectLabel} · ${typeLabel}.`,
    reasonPhase: (phaseLabel, typeLabel) => `Die ${phaseLabel}-Phase priorisiert jetzt ${typeLabel.toLowerCase()}.`,
    reasonSubject: (subjectLabel) => `${subjectLabel} wurde anhand von Fokus und Prüfungsgewichtung vorgezogen.`,
    reasonRebalance: (subjectLabel) => `${subjectLabel} wurde verstärkt, um schwächere letzte Leistung auszugleichen.`,
    reasonOverdue: (subjectLabel) => `Für ${subjectLabel} gibt es offene verspätete Aufgaben.`,
    reasonOverload: 'Die Wochenlast wurde etwas reduziert, um Überladung zu vermeiden.',
  },
  fr: {
    title: 'Pourquoi ce plan',
    type: { study: 'Étude', practice: 'Pratique', review: 'Révision', quiz: 'Quiz' },
    phase: { foundation: 'Base', build: 'Montée', consolidation: 'Consolidation', final: 'Final' },
    summary: (subjectLabel, typeLabel) => `Premier focus : ${subjectLabel} · ${typeLabel}.`,
    reasonPhase: (phaseLabel, typeLabel) => `La phase ${phaseLabel.toLowerCase()} met en avant ${typeLabel.toLowerCase()} maintenant.`,
    reasonSubject: (subjectLabel) => `${subjectLabel} remonte selon le focus et le poids de l examen.`,
    reasonRebalance: (subjectLabel) => `${subjectLabel} a été renforcé pour corriger une baisse récente.`,
    reasonOverdue: (subjectLabel) => `${subjectLabel} a des tâches en retard à réintégrer.`,
    reasonOverload: 'La charge a été allégée pour ne pas surcharger la semaine.',
  },
  ja: {
    title: 'このプランの理由',
    type: { study: '学習', practice: '演習', review: '復習', quiz: '確認' },
    phase: { foundation: '基礎', build: '強化', consolidation: '定着', final: '直前' },
    summary: (subjectLabel, typeLabel) => `最初の焦点: ${subjectLabel}・${typeLabel}`,
    reasonPhase: (phaseLabel, typeLabel) => `${phaseLabel}段階では今は${typeLabel}を優先します。`,
    reasonSubject: (subjectLabel) => `${subjectLabel}は重点度と試験比重から優先されました。`,
    reasonRebalance: (subjectLabel) => `${subjectLabel}は最近の弱さを補うために強めています。`,
    reasonOverdue: (subjectLabel) => `${subjectLabel}には取り戻す必要のある遅れた課題があります。`,
    reasonOverload: '週の負荷が重くなりすぎないよう少し軽くしています。',
  },
  ko: {
    title: '이 계획을 만든 이유',
    type: { study: '학습', practice: '연습', review: '복습', quiz: '점검' },
    phase: { foundation: '기초', build: '강화', consolidation: '정착', final: '마무리' },
    summary: (subjectLabel, typeLabel) => `첫 초점: ${subjectLabel} · ${typeLabel}`,
    reasonPhase: (phaseLabel, typeLabel) => `${phaseLabel} 단계에서는 지금 ${typeLabel} 작업이 우선입니다.`,
    reasonSubject: (subjectLabel) => `${subjectLabel}이 현재 집중도와 시험 비중 때문에 올라왔습니다.`,
    reasonRebalance: (subjectLabel) => `${subjectLabel}은 최근 약한 수행을 보완하도록 강화되었습니다.`,
    reasonOverdue: (subjectLabel) => `${subjectLabel}에는 다시 흡수해야 할 지연 과제가 있습니다.`,
    reasonOverload: '주간 부담이 너무 커지지 않도록 강도를 조금 낮췄습니다.',
  },
  'zh-Hans': {
    title: '这份计划的依据',
    type: { study: '学习', practice: '练习', review: '复习', quiz: '检测' },
    phase: { foundation: '基础', build: '提升', consolidation: '巩固', final: '冲刺' },
    summary: (subjectLabel, typeLabel) => `首个重点：${subjectLabel} · ${typeLabel}`,
    reasonPhase: (phaseLabel, typeLabel) => `${phaseLabel}阶段会优先安排${typeLabel}类任务。`,
    reasonSubject: (subjectLabel) => `${subjectLabel}会因为当前重点和考试权重而被提前安排。`,
    reasonRebalance: (subjectLabel) => `${subjectLabel}被加强，用来修复最近较弱的表现。`,
    reasonOverdue: (subjectLabel) => `${subjectLabel}有需要重新吸收的延迟任务。`,
    reasonOverload: '为了避免本周过载，整体负荷已略微放缓。',
  },
  ar: {
    title: 'لماذا هذه الخطة',
    type: { study: 'مذاكرة', practice: 'تدريب', review: 'مراجعة', quiz: 'اختبار' },
    phase: { foundation: 'الأساس', build: 'البناء', consolidation: 'التثبيت', final: 'النهائي' },
    summary: (subjectLabel, typeLabel) => `التركيز الأول: ${subjectLabel} · ${typeLabel}`,
    reasonPhase: (phaseLabel, typeLabel) => `مرحلة ${phaseLabel} تدفع الآن نحو مهام ${typeLabel}.`,
    reasonSubject: (subjectLabel) => `تم رفع ${subjectLabel} حسب التركيز ووزن الامتحان.`,
    reasonRebalance: (subjectLabel) => `تم تعزيز ${subjectLabel} لتعويض الأداء الأضعف مؤخراً.`,
    reasonOverdue: (subjectLabel) => `هناك مهام متأخرة في ${subjectLabel} يجب استيعابها من جديد.`,
    reasonOverload: 'تم تخفيف الحمل قليلاً حتى لا يصبح الأسبوع مزدحماً أكثر من اللازم.',
  },
  hi: {
    title: 'यह योजना क्यों',
    type: { study: 'अध्ययन', practice: 'अभ्यास', review: 'रिव्यू', quiz: 'जांच' },
    phase: { foundation: 'बेस', build: 'बिल्ड', consolidation: 'कंसोलिडेशन', final: 'फाइनल' },
    summary: (subjectLabel, typeLabel) => `पहला फोकस: ${subjectLabel} · ${typeLabel}`,
    reasonPhase: (phaseLabel, typeLabel) => `${phaseLabel} चरण में अभी ${typeLabel.toLowerCase()} कार्य को प्राथमिकता दी गई है।`,
    reasonSubject: (subjectLabel) => `${subjectLabel} फोकस और परीक्षा वेटिंग के आधार पर ऊपर आया है।`,
    reasonRebalance: (subjectLabel) => `${subjectLabel} को हाल की कमजोर प्रगति की भरपाई के लिए बढ़ाया गया है।`,
    reasonOverdue: (subjectLabel) => `${subjectLabel} में कुछ विलंबित कार्य हैं जिन्हें वापस समेटना है।`,
    reasonOverload: 'सप्ताह को ज्यादा भारी होने से बचाने के लिए लोड थोड़ा नरम रखा गया है।',
  },
  id: {
    title: 'Mengapa rencana ini',
    type: { study: 'Belajar', practice: 'Latihan', review: 'Tinjauan', quiz: 'Cek' },
    phase: { foundation: 'Dasar', build: 'Build', consolidation: 'Konsolidasi', final: 'Final' },
    summary: (subjectLabel, typeLabel) => `Fokus pertama: ${subjectLabel} · ${typeLabel}.`,
    reasonPhase: (phaseLabel, typeLabel) => `Fase ${phaseLabel.toLowerCase()} sedang memprioritaskan tugas ${typeLabel.toLowerCase()}.`,
    reasonSubject: (subjectLabel) => `${subjectLabel} naik karena fokus saat ini dan bobot ujian.`,
    reasonRebalance: (subjectLabel) => `${subjectLabel} diperkuat untuk memulihkan performa terbaru yang lebih lemah.`,
    reasonOverdue: (subjectLabel) => `${subjectLabel} punya tugas tertunda yang perlu diserap kembali.`,
    reasonOverload: 'Beban dibuat sedikit lebih ringan agar minggu ini tidak terlalu padat.',
  },
  'pt-BR': {
    title: 'Por que este plano',
    type: { study: 'Estudo', practice: 'Prática', review: 'Revisão', quiz: 'Checagem' },
    phase: { foundation: 'Base', build: 'Construção', consolidation: 'Consolidação', final: 'Final' },
    summary: (subjectLabel, typeLabel) => `Primeiro foco: ${subjectLabel} · ${typeLabel}.`,
    reasonPhase: (phaseLabel, typeLabel) => `A fase ${phaseLabel.toLowerCase()} prioriza ${typeLabel.toLowerCase()} agora.`,
    reasonSubject: (subjectLabel) => `${subjectLabel} subiu com base no foco atual e no peso do exame.`,
    reasonRebalance: (subjectLabel) => `${subjectLabel} recebeu reforço para recuperar desempenho recente mais fraco.`,
    reasonOverdue: (subjectLabel) => `${subjectLabel} tem tarefas atrasadas que precisam voltar para o plano.`,
    reasonOverload: 'A carga foi suavizada para a semana não ficar pesada demais.',
  },
};


const toSnapshot = (draft: ReturnType<typeof useOnboardingV2>['draft']): OnboardingSnapshotV2 => ({
  countryCode:       draft.countryCode,
  countryName:       draft.countryName,
  examId:            draft.examId,
  examName:          draft.examName,
  examDate:          draft.examDate,
  targetMetricType:  draft.targetMetricType,
  targetValueRaw:    draft.targetValueRaw,
  targetValueNormalized: draft.targetValueNormalized,
  targetScore:       draft.targetScore,
  preferredSessionMinutes: draft.preferredSessionMinutes,
  studyIntensity:    draft.studyIntensity,
  reminderFrequency: draft.reminderFrequency,
  motivation:        draft.motivation,
  subjectIntensity:  draft.subjectIntensity,
  weeklyAvailability:draft.weeklyAvailability,
  learningStyle:     draft.learningStyle,
  createdAt:         new Date().toISOString(),
});

// ── Animated score ring ───────────────────────────────────────────────────────
function ScoreRing({ score, color }: { score: number; color: string }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: score / 100, duration: 1200, delay: 200, useNativeDriver: false }).start();
  // anim is a stable ref; rerun only when score changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score]);

  const size = 88;
  const stroke = 6;

  // We fake a ring with a border-radius view + rotation trick (SVG not available without expo-svg)
  // Instead: animated border approach
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Background ring */}
      <View style={{
        position: 'absolute', width: size, height: size, borderRadius: size/2,
        borderWidth: stroke, borderColor: 'rgba(255,255,255,0.07)',
      }}/>
      {/* Foreground arc — approximated with a colored shadow + clip */}
      <Animated.View style={{
        position:'absolute', width:size, height:size, borderRadius:size/2,
        borderWidth: stroke, borderColor: color,
        opacity: anim.interpolate({ inputRange:[0,1], outputRange:[0.3, 1] }),
        transform:[{ rotate: anim.interpolate({ inputRange:[0,1], outputRange:['-90deg','270deg'] }) }],
      }}/>
      {/* Score number */}
      <Text style={{ fontSize: 22, fontWeight:'900', color, letterSpacing:-0.6 }}>{score}</Text>
      <Text style={{ fontSize: 9, fontWeight:'600', color:'rgba(255,255,255,0.35)', letterSpacing:0.5 }}>/ 100</Text>
    </View>
  );
}

// ── Bar fill (for subject breakdown) ─────────────────────────────────────────
function BarFill({ fill, delay }: { fill: number; delay: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: fill, duration: 700, delay, useNativeDriver: false }).start();
  // anim is a stable ref; rerun on fill updates.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fill]);
  return (
    <View style={{ flex:1, height:4, borderRadius:99, backgroundColor:'rgba(255,255,255,0.07)', overflow:'hidden' }}>
      <Animated.View style={{
        height:'100%', borderRadius:99,
        width: anim.interpolate({ inputRange:[0,1], outputRange:['0%','100%'] }),
        backgroundColor: C.teal,
      }}/>
    </View>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function OnboardingV2PlanPreviewScreen() {
  const { showAlert } = useAppAlert();
  const { draft } = useOnboardingV2();
  const { width, height } = useWindowDimensions();
  const isNarrow = width <= 390;
  const isTight = height <= 850;
  const lang = resolveAppLanguage({
    countryDefaultLanguage: getCountryByCode(draft.countryCode)?.defaultLanguage ?? null,
  });
  const [phase, setPhase] = useState(0);
  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);
  const [program, setProgram] = useState<StudyProgram | null>(null);

  const entrance  = useRef(new Animated.Value(0)).current;
  const ctaFade   = useRef(new Animated.Value(0)).current;
  const ctaScale  = useRef(new Animated.Value(1)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => { void trackOnboardingStepView('plan_preview'); }, []);
  useEffect(() => {
    Animated.timing(entrance, { toValue:1, duration:420, useNativeDriver:true }).start();
    Animated.timing(ctaFade,  { toValue:1, duration:420, delay:240, useNativeDriver:true }).start();
  // entrance animations should only run once.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const snapshot = useMemo(() => toSnapshot(draft), [draft]);
  const buildPhases = useMemo(
    () => [
      t('onboarding.plan_preview.build_phase_1', { lang, fallback: 'Mapping your weekly availability...' }),
      t('onboarding.plan_preview.build_phase_2', { lang, fallback: 'Calibrating subject pressure levels...' }),
      t('onboarding.plan_preview.build_phase_3', { lang, fallback: 'Sequencing tasks and breaks...' }),
    ],
    [lang]
  );

  // Cycle through build phases while loading
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => setPhase(p => (p + 1) % buildPhases.length), 1200);
    return () => clearInterval(interval);
  }, [buildPhases.length, loading]);

  const buildPreview = useCallback(async () => {
    try {
      setLoading(true);
      setProgram(null);
      const legacy = toLegacyOnboardingData(snapshot);
      const generated = await generateStudyProgramWithRules(legacy);
      setProgram(generated);
      void trackOnboardingV2Event('plan_preview_generated', {
        step_id: 'plan_preview',
        weekly_hours: generated?.weeklyHours || 0,
        total_tasks: generated?.dailyTasks.length || 0,
        target_metric_type: snapshot.targetMetricType,
        target_value_raw: snapshot.targetValueRaw || snapshot.targetScore,
        target_value_normalized: snapshot.targetValueNormalized,
      });
      // Animate content in
      Animated.spring(contentAnim, { toValue:1, damping:22, stiffness:180, useNativeDriver:true }).start();
    } catch (e) {
      console.error('plan_preview error', e);
      void trackOnboardingV2Event('plan_preview_generation_fail', {
        step_id:'plan_preview',
        reason:String(e),
        target_metric_type: snapshot.targetMetricType,
        target_value_raw: snapshot.targetValueRaw || snapshot.targetScore,
      });
    } finally {
      setLoading(false);
    }
  // contentAnim is a stable ref; callback should refresh on snapshot changes only.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot]);

  useEffect(() => { void buildPreview(); }, [buildPreview]);

  const feasibility = useMemo(() => {
    if (!program) return 0;
    const target = Math.max(1, Object.keys(snapshot.weeklyAvailability || {}).length * 4);
    const ratio  = Math.min(1, program.weeklyHours / target);
    return Math.max(52, Math.round(60 + ratio * 35));
  }, [program, snapshot.weeklyAvailability]);

  const scoreColor = feasibility >= 85 ? C.green : feasibility >= 70 ? C.teal : '#FBBF24';

  const activeDays = useMemo(() => {
    if (!snapshot.weeklyAvailability) return 0;
    return Object.values(snapshot.weeklyAvailability).filter(v => v?.length > 0).length;
  }, [snapshot.weeklyAvailability]);

  const handleContinue = async () => {
    if (!program) {
      void trackOnboardingStepValidationFail('plan_preview', ['generatedProgram'], 'Not ready');
      showAlert(
        t('onboarding.plan_preview.alert_not_ready_title', { lang, fallback: 'Plan Not Ready' }),
        t('onboarding.plan_preview.alert_not_ready_body', { lang, fallback: 'Please wait until your plan is ready.' })
      );
      return;
    }
    try {
      setFinalizing(true);
      await persistOnboardingV2ToLegacyStorage(snapshot);
      await saveStudyProgram(program);
      await saveDailyTasks(program.dailyTasks);
      void syncRemoteNotificationState({
        studyStreak: 0,
        completedTasks: 0,
        planUpdatedAt: new Date().toISOString(),
        lastOpenedAt: new Date().toISOString(),
        nextExamDate: program.examDate || null,
      });
      void trackOnboardingStepContinue('plan_preview', {
        target_metric_type: snapshot.targetMetricType,
        target_value_raw: snapshot.targetValueRaw || snapshot.targetScore,
        target_value_normalized: snapshot.targetValueNormalized,
      });
      router.push('/(onboarding-v2)/referral');
    } catch {
      showAlert(
        t('onboarding.plan_preview.alert_error_title', { lang, fallback: 'Error' }),
        t('onboarding.plan_preview.alert_error_body', { lang, fallback: 'Could not save your plan. Please try again.' })
      );
    } finally {
      setFinalizing(false);
    }
  };

  const pressIn  = () => Animated.spring(ctaScale, { toValue:0.97, damping:20, stiffness:400, useNativeDriver:true }).start();
  const pressOut = () => Animated.spring(ctaScale, { toValue:1,    damping:18, stiffness:360, useNativeDriver:true }).start();

  // Subject breakdown — top 4
  const subjectRows = useMemo(() => {
    if (!program?.subjectBreakdown) return [];
    return Object.entries(program.subjectBreakdown)
      .map(([name, breakdown]) => ({ name, hours: breakdown.weeklyHours }))
      .sort((a,b) => b.hours - a.hours)
      .slice(0, 4);
  }, [program]);

  const maxSubjectHours = subjectRows[0]?.hours || 1;
  const explainabilityTask = useMemo(
    () => program?.dailyTasks.find((task) => task.explainability) ?? null,
    [program]
  );

  const targetMetricLabel: Record<string, string> = {
    score: t('onboarding.plan_preview.metric_score', { lang, fallback: 'Score' }),
    rank: t('onboarding.plan_preview.metric_rank', { lang, fallback: 'Rank' }),
    percentile: t('onboarding.plan_preview.metric_percentile', { lang, fallback: 'Percentile' }),
    band: t('onboarding.plan_preview.metric_band', { lang, fallback: 'Band' }),
    level: t('onboarding.plan_preview.metric_level', { lang, fallback: 'Level' }),
    grade: t('onboarding.plan_preview.metric_grade', { lang, fallback: 'Grade' }),
    pass: t('onboarding.plan_preview.metric_pass', { lang, fallback: 'Outcome' }),
  };
  const targetMetricTone: Record<string, string> = {
    score: t('onboarding.plan_preview.tone_score', { lang, fallback: 'Performance target' }),
    rank: t('onboarding.plan_preview.tone_rank', { lang, fallback: 'Lower is better' }),
    percentile: t('onboarding.plan_preview.tone_percentile', { lang, fallback: 'Higher is better' }),
    band: t('onboarding.plan_preview.tone_band', { lang, fallback: 'Proficiency target' }),
    level: t('onboarding.plan_preview.tone_level', { lang, fallback: 'Proficiency target' }),
    grade: t('onboarding.plan_preview.tone_grade', { lang, fallback: 'Academic target' }),
    pass: t('onboarding.plan_preview.tone_pass', { lang, fallback: 'Pass-focused plan' }),
  };
  const targetMetric = draft.targetMetricType || 'score';
  const rawTargetValue = draft.targetValueRaw || draft.targetScore || '-';
  const targetMetricDisplay = targetMetricLabel[targetMetric] || t('onboarding.plan_preview.target', { lang, fallback: 'Target' });
  const targetValueDisplay = targetMetric === 'percentile' && rawTargetValue !== '-'
    ? `${rawTargetValue}%`
    : rawTargetValue;
  const targetPillDisplay = `${targetMetricDisplay}: ${targetValueDisplay}`;
  const targetSummaryText = `${targetMetricTone[targetMetric] || t('onboarding.plan_preview.custom_target', { lang, fallback: 'Custom target' })} · ${targetMetricDisplay} ${targetValueDisplay}`;

  const localizeProfileValue = (value?: string | null): string | null => {
    if (!value) return null;
    const key = String(value);
    const fromIntensity = t(`onboarding.goal_intensity.${key}.label`, { lang, fallback: '' });
    if (fromIntensity) return fromIntensity;
    const fromLearningStyle = t(`onboarding.learning_style.value_${key}`, { lang, fallback: '' });
    if (fromLearningStyle) return fromLearningStyle;
    return key;
  };
  const subjectLabel = useCallback(
    (subject: string) => getLocalizedSubjectName(subject, lang, subject, { examCode: draft.examId }),
    [draft.examId, lang]
  );
  const explainCopy = EXPLAIN_COPY[lang] ?? EXPLAIN_COPY.en;
  const hourUnit = getHourUnitShort(lang);
  const formatHourValue = useCallback((value: number) => {
    const normalized = Math.round(value * 10) / 10;
    const hasFraction = Math.abs(normalized - Math.round(normalized)) >= 0.05;
    return new Intl.NumberFormat(getLocaleTagForLanguage(lang), {
      minimumFractionDigits: hasFraction ? 1 : 0,
      maximumFractionDigits: hasFraction ? 1 : 0,
    }).format(normalized);
  }, [lang]);
  const localizedExplainability = useMemo(() => {
    if (!explainabilityTask?.explainability) return null;
    const signals = explainabilityTask.explainability.signals;
    const localizedSubject = subjectLabel(explainabilityTask.subject);
    const localizedType = explainCopy.type[explainabilityTask.type];
    const phaseLabel = explainCopy.phase[signals.phase];
    const reasons = [
      explainCopy.reasonPhase(phaseLabel, localizedType),
      explainCopy.reasonSubject(localizedSubject),
    ];

    if ((signals.rebalanceBoost ?? 0) > 0.2) {
      reasons.push(explainCopy.reasonRebalance(localizedSubject));
    }
    if ((signals.overdueCarry ?? 0) > 0) {
      reasons.push(explainCopy.reasonOverdue(localizedSubject));
    }
    if ((signals.overloadRisk ?? 0) > 0.3) {
      reasons.push(explainCopy.reasonOverload);
    }

    return {
      title: explainCopy.title,
      summary: explainCopy.summary(localizedSubject, localizedType),
      reasons,
    };
  }, [explainCopy, explainabilityTask, subjectLabel]);

  // Personalization pills
  const personalPills = [
    {
      label: t('onboarding.plan_preview.pill_style', { lang, fallback: 'Style' }),
      val: localizeProfileValue(draft.learningStyle?.primaryStyle),
    },
    {
      label: t('onboarding.plan_preview.pill_intensity', { lang, fallback: 'Intensity' }),
      val: localizeProfileValue(draft.studyIntensity),
    },
    {
      label: t('onboarding.plan_preview.pill_reminders', { lang, fallback: 'Reminders' }),
      val: localizeProfileValue(draft.reminderFrequency),
    },
    {
      label: t('onboarding.plan_preview.pill_sessions', { lang, fallback: 'Sessions' }),
      val: localizeProfileValue(draft.learningStyle?.preferences?.sessionLength),
    },
    {
      label: t('onboarding.plan_preview.pill_target', { lang, fallback: 'Target' }),
      val: targetPillDisplay,
    },
  ].filter(p => p.val);

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent"/>
      <LinearGradient colors={[C.bg0,C.bg1,C.bg2,C.bg3]} locations={[0,0.3,0.65,1]} style={StyleSheet.absoluteFill}/>
      <View style={[s.orbA,{backgroundColor:C.orbA}]}/>
      <View style={[s.orbB,{backgroundColor:C.orbB}]}/>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {[0,1,2,3,4,5].map(i=><View key={i} style={{position:'absolute',top:0,bottom:0,left:`${i*20}%`,width:StyleSheet.hairlineWidth,backgroundColor:C.grid}}/>)}
        {[0,1,2,3,4,5,6].map(i=><View key={i} style={{position:'absolute',left:0,right:0,top:`${i*15}%`,height:StyleSheet.hairlineWidth,backgroundColor:C.grid}}/>)}
      </View>

      <Animated.View style={[s.inner, (isNarrow || isTight) && s.innerTight, {opacity:entrance}]}>

        {/* Header */}
        <View style={s.headerRow}>
          <TouchableOpacity style={[s.backBtn,{backgroundColor:C.backBg,borderColor:C.backBorder}]} onPress={()=>{void trackOnboardingStepBack('plan_preview');router.back();}} activeOpacity={0.7}>
            <Text style={[s.backArrow,{color:C.backArrow}]}>‹</Text>
          </TouchableOpacity>
          <View style={s.brandRow}>
            <View style={[s.brandMark,{backgroundColor:C.brand}]}/>
            <Text style={[s.brandTxt,{color:C.brand}]}>StudyMap</Text>
          </View>
          <View style={s.backBtn}/>
        </View>

        {/* Progress */}
        <View style={[s.progressTrack,{backgroundColor:C.tealSoft}]}>
          <View style={[s.progressFill,{width:'86%'}]}>
            <LinearGradient colors={[C.tealDk,C.tealDk2]} start={{x:0,y:0}} end={{x:1,y:0}} style={StyleSheet.absoluteFill}/>
            <View style={s.progressSheen}/>
          </View>
        </View>
        <Text style={[s.stepLabel,{color:C.labelMuted}]}>
          {t('common.step_of', { lang, params: { current: 11, total: 13 } })}
        </Text>

        {/* Title */}
        <Text style={[s.title,{color:C.title}, isNarrow && s.titleNarrow]} numberOfLines={2}>
          {t('onboarding.plan_preview.title', { lang, fallback: 'Your execution\nblueprint.' })}
        </Text>

        {/* ── Loading state ── */}
        {loading && (
          <View style={[s.loadCard,{backgroundColor:C.cardBg,borderColor:C.cardBorder}]}>
            <ActivityIndicator size="small" color={C.teal}/>
            <View style={s.loadCopy}>
              <Text style={[s.loadTitle,{color:C.title}]}>
                {t('onboarding.plan_preview.building', { lang, fallback: 'Building your plan...' })}
              </Text>
              <Text style={[s.loadPhase,{color:C.sub}]}>{buildPhases[phase]}</Text>
            </View>
            {/* Phase dots */}
            <View style={s.phaseDots}>
              {buildPhases.map((_,i)=>(
                <View key={i} style={[s.phaseDot,{backgroundColor: i<=phase ? C.teal : 'rgba(255,255,255,0.12)'}]}/>
              ))}
            </View>
          </View>
        )}

        {/* ── Error state ── */}
        {!loading && !program && (
          <View style={[s.loadCard,{backgroundColor:C.errorBg,borderColor:C.errorBorder,gap:10}]}>
            <Text style={[s.loadTitle,{color:C.errorTxt}]}>
              {t('onboarding.plan_preview.error_title', { lang, fallback: "Couldn't generate preview" })}
            </Text>
            <Text style={[s.loadPhase,{color:C.errorTxt,opacity:0.75}]}>
              {t('onboarding.plan_preview.error_body', { lang, fallback: 'Check your exam date and schedule settings.' })}
            </Text>
            <TouchableOpacity style={[s.retryBtn,{backgroundColor:C.errorBorder}]} onPress={()=>void buildPreview()} activeOpacity={0.8}>
              <Text style={[s.retryTxt,{color:C.errorTxt}]}>{t('common.retry', { lang })}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Success state ── */}
        {!loading && !!program && (
          <Animated.View style={[s.successWrap,{
            opacity: contentAnim,
            transform:[{translateY:contentAnim.interpolate({inputRange:[0,1],outputRange:[16,0]})}],
          }]}>

            {/* ── Hero: score + KPIs ── */}
            <View style={[s.heroCard,{backgroundColor:C.cardBg,borderColor:C.cardBorder}]}>
              <LinearGradient colors={[C.tealDk,C.tealDk2]} start={{x:0,y:0}} end={{x:1,y:0}} style={s.heroBar}/>
              <View style={s.heroInner}>
                {/* Ring */}
                <ScoreRing score={feasibility} color={scoreColor}/>
                {/* KPIs */}
                <View style={s.kpiCol}>
                  {[
                    { val:`${formatHourValue(program.weeklyHours)}${hourUnit}`, lbl:t('onboarding.plan_preview.kpi_weekly_load', { lang, fallback: 'weekly load' }) },
                    { val:`${program.dailyTasks.length}`,  lbl:t('onboarding.plan_preview.kpi_total_tasks', { lang, fallback: 'total tasks' }) },
                    { val:`${activeDays}`, lbl:t('onboarding.plan_preview.kpi_study_days', { lang, fallback: 'study days' }) },
                  ].map((k,i)=>(
                    <View key={i} style={s.kpiItem}>
                      <Text style={[s.kpiVal,{color:C.title}]}>{k.val}</Text>
                      <Text style={[s.kpiLbl,{color:C.muted}]} numberOfLines={2}>{k.lbl}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View style={[s.feasRow,{borderTopColor:'rgba(255,255,255,0.06)'}]}>
                <View style={[s.feasDot,{backgroundColor:scoreColor}]}/>
                <Text style={[s.feasTxt,{color:C.sub}]}>
                  {feasibility >= 85
                    ? t('onboarding.plan_preview.feasibility_high', { lang, fallback: 'Highly achievable - schedule and load are well balanced.' })
                    : feasibility >= 70
                      ? t('onboarding.plan_preview.feasibility_mid', { lang, fallback: 'Good fit. Minor adjustments could further optimize.' })
                      : t('onboarding.plan_preview.feasibility_low', { lang, fallback: 'Tight schedule. Consider more study days or lighter intensity.' })}
                </Text>
              </View>
            </View>

            {/* ── Subject breakdown ── */}
            {subjectRows.length > 0 && (
              <View style={[s.card,{backgroundColor:C.cardBg,borderColor:C.cardBorder}]}>
                <Text style={[s.cardTitle,{color:C.muted}]}>
                  {t('onboarding.plan_preview.subject_distribution', { lang, fallback: 'Subject distribution' })}
                </Text>
                <View style={s.subjectList}>
                  {subjectRows.map(({name,hours},i)=>(
                    <View key={name} style={s.subjectRow}>
                      <Text style={[s.subjectName,{color:C.sub}, isNarrow && s.subjectNameNarrow]} numberOfLines={1}>{subjectLabel(name)}</Text>
                      <BarFill fill={hours/maxSubjectHours} delay={300+i*80}/>
                      <Text style={[s.subjectHrs,{color:C.teal}]}>{formatHourValue(hours)}{hourUnit}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* ── First tasks ── */}
            <View style={[s.card,{backgroundColor:C.cardBg,borderColor:C.cardBorder}]}>
              <Text style={[s.cardTitle,{color:C.muted}]}>
                {t('onboarding.plan_preview.first_sessions', { lang, fallback: 'First sessions' })}
              </Text>
              <View style={s.taskList}>
                {program.dailyTasks.slice(0,3).map((task,i)=>(
                  <View key={task.id} style={[s.taskRow,{borderTopColor:'rgba(255,255,255,0.05)', borderTopWidth: i===0?0:StyleSheet.hairlineWidth}]}>
                    <View style={[s.taskDot,{backgroundColor:C.tealSoft,borderColor:C.tealBorder}]}>
                      <Text style={[s.taskDotTxt,{color:C.teal}]}>{i+1}</Text>
                    </View>
                    <View style={s.taskBody}>
                      <Text style={[s.taskSubject,{color:C.title}]} numberOfLines={1}>{subjectLabel(task.subject)}</Text>
                      <Text style={[s.taskMeta,{color:C.muted}]} numberOfLines={1}>
                        {task.date?.slice(5)} · {task.timeSlot} · {getLocalizedTaskTypeLabel(task.type, lang)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* ── Personalization summary ── */}
            {personalPills.length > 0 && (
              <View style={[s.card,{backgroundColor:C.cardBg,borderColor:C.cardBorder}]}>
                <Text style={[s.cardTitle,{color:C.muted}]}>
                  {t('onboarding.plan_preview.personalized', { lang, fallback: 'Personalized for you' })}
                </Text>
                <Text style={[s.targetSummary,{color:C.sub}]} numberOfLines={2}>{targetSummaryText}</Text>
                {localizedExplainability && (
                  <View style={s.explainCompact}>
                    <Text style={[s.explainMiniTitle,{color:C.title}]} numberOfLines={1}>
                      {localizedExplainability.title} · {localizedExplainability.summary}
                    </Text>
                    {localizedExplainability.reasons.slice(0, 2).map((reason, index) => (
                      <View key={`${index}-${reason}`} style={s.explainMiniRow}>
                        <View style={[s.explainMiniDot,{backgroundColor:C.teal}]}/>
                        <Text style={[s.explainMiniTxt,{color:C.sub}]} numberOfLines={2}>{reason}</Text>
                      </View>
                    ))}
                  </View>
                )}
                <View style={s.pillsWrap}>
                  {personalPills.map(p=>(
                    <View key={p.label} style={[s.pill,{backgroundColor:C.tealSoft,borderColor:C.tealBorder}]}>
                      <Text style={[s.pillLbl,{color:C.muted}]} numberOfLines={1}>{p.label}</Text>
                      <Text style={[s.pillVal,{color:C.teal}]} numberOfLines={2}>{p.val}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

          </Animated.View>
        )}
      </Animated.View>

      {/* Footer */}
      <Animated.View style={[s.footer, (isNarrow || isTight) && s.footerTight, {backgroundColor:C.footer,borderTopColor:C.footerBorder,opacity:ctaFade}]}>
        <Animated.View style={{transform:[{scale:ctaScale}]}}>
          <TouchableOpacity
            style={[s.cta, (loading||finalizing||!program)&&s.ctaDisabled]}
            onPress={handleContinue}
            onPressIn={pressIn}
            onPressOut={pressOut}
            disabled={loading||finalizing||!program}
            activeOpacity={1}
          >
            {!loading&&!finalizing&&!!program&&(
              <LinearGradient colors={[C.tealDk,C.tealDk2]} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFill}/>
            )}
            {!loading&&!finalizing&&!!program&&<View style={s.ctaSheen}/>}
            {(loading||finalizing) && <ActivityIndicator size="small" color={C.teal} style={{marginRight:8}}/>}
            <Text
              style={[s.ctaTxt,!(!!program)&&s.ctaTxtDisabled]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.86}
            >
              {finalizing
                ? t('onboarding.plan_preview.saving', { lang, fallback: 'Saving plan...' })
                : loading
                  ? t('onboarding.plan_preview.building', { lang, fallback: 'Building your plan...' })
                  : t('onboarding.plan_preview.continue_premium', { lang, fallback: 'Continue to Premium' })}
            </Text>
            {!loading&&!finalizing&&!!program&&<Text style={s.ctaArrow}>→</Text>}
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:{ flex:1, backgroundColor:'#080C0B' },
  orbA:{ position:'absolute', width:280, height:280, borderRadius:999, top:-80, right:-110 },
  orbB:{ position:'absolute', width:180, height:180, borderRadius:999, bottom:160, left:-80 },
  inner:{ flex:1, paddingHorizontal:22, paddingTop:6, paddingBottom:88 },
  innerTight:{ paddingTop:4, paddingBottom:84 },

  headerRow:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:8 },
  backBtn:{ width:36, height:36, borderRadius:11, borderWidth:1, justifyContent:'center', alignItems:'center' },
  backArrow:{ fontSize:26, fontWeight:'300', lineHeight:30, marginTop:-1 },
  brandRow:{ flexDirection:'row', alignItems:'center', gap:6 },
  brandMark:{ width:7, height:7, borderRadius:2 },
  brandTxt:{ fontSize:14, fontWeight:'800', letterSpacing:0.4 },

  progressTrack:{ height:3, borderRadius:99, overflow:'hidden', marginBottom:6 },
  progressFill:{ height:'100%', borderRadius:99, overflow:'hidden' },
  progressSheen:{ position:'absolute', top:0, left:0, right:0, height:'50%', backgroundColor:'rgba(255,255,255,0.20)' },
  stepLabel:{ fontSize:10, fontWeight:'600', letterSpacing:0.8, textTransform:'uppercase', marginBottom:8, opacity:0.65 },

  title:{ fontSize:22, fontWeight:'900', lineHeight:27, letterSpacing:-0.4, marginBottom:4 },
  titleNarrow:{ fontSize:20, lineHeight:24 },

  // Loading
  loadCard:{ borderWidth:1, borderRadius:16, padding:14, gap:9, alignItems:'center' },
  loadCopy:{ alignItems:'center', gap:4 },
  loadTitle:{ fontSize:15, fontWeight:'800', letterSpacing:-0.2 },
  loadPhase:{ fontSize:11, fontWeight:'400', textAlign:'center' },
  phaseDots:{ flexDirection:'row', gap:6 },
  phaseDot:{ width:6, height:6, borderRadius:3 },
  retryBtn:{ borderRadius:10, paddingHorizontal:16, paddingVertical:8 },
  retryTxt:{ fontSize:13, fontWeight:'700' },

  // Success
  successWrap:{ gap:3 },

  // Hero card
  heroCard:{ borderWidth:1, borderRadius:14, overflow:'hidden' },
  heroBar:{ height:3 },
  heroInner:{ flexDirection:'row', alignItems:'center', padding:8, gap:8 },
  kpiCol:{ flex:1, gap:2 },
  kpiItem:{ flexDirection:'row', alignItems:'baseline', gap:6 },
  kpiVal:{ fontSize:15, fontWeight:'900', letterSpacing:-0.3 },
  kpiLbl:{ fontSize:9, fontWeight:'400', flex:1 },
  feasRow:{ flexDirection:'row', alignItems:'flex-start', gap:8, paddingHorizontal:9, paddingVertical:6, borderTopWidth:1 },
  feasDot:{ width:6, height:6, borderRadius:3, marginTop:4, flexShrink:0 },
  feasTxt:{ flex:1, fontSize:10, fontWeight:'400', lineHeight:15 },

  // Generic card
  card:{ borderWidth:1, borderRadius:13, padding:6, gap:4 },
  cardTitle:{ fontSize:10, fontWeight:'600', letterSpacing:0.7, textTransform:'uppercase' },

  // Subjects
  subjectList:{ gap:4 },
  subjectRow:{ flexDirection:'row', alignItems:'center', gap:7 },
  subjectName:{ width:72, fontSize:12, fontWeight:'500' },
  subjectNameNarrow:{ width:62, fontSize:11 },
  subjectHrs:{ width:28, fontSize:11, fontWeight:'700', textAlign:'right' },

  // Tasks
  taskList:{ gap:0 },
  taskRow:{ flexDirection:'row', alignItems:'center', gap:7, paddingVertical:5 },
  taskDot:{ width:18, height:18, borderRadius:6, borderWidth:1, alignItems:'center', justifyContent:'center', flexShrink:0 },
  taskDotTxt:{ fontSize:10, fontWeight:'800' },
  taskBody:{ flex:1, gap:1 },
  taskSubject:{ fontSize:12, fontWeight:'700', letterSpacing:-0.1 },
  taskMeta:{ fontSize:10, fontWeight:'400' },

  // Explainability
  explainCompact:{ gap:3, paddingTop:1, marginBottom:0 },
  explainMiniTitle:{ fontSize:9, fontWeight:'700', lineHeight:12 },
  explainMiniRow:{ flexDirection:'row', alignItems:'flex-start', gap:6 },
  explainMiniDot:{ width:4, height:4, borderRadius:2, marginTop:5, flexShrink:0 },
  explainMiniTxt:{ flex:1, fontSize:8, fontWeight:'500', lineHeight:11 },

  // Pills
  pillsWrap:{ flexDirection:'row', flexWrap:'wrap', gap:5 },
  pill:{ borderWidth:1, borderRadius:10, paddingHorizontal:8, paddingVertical:4, gap:1, minWidth:'22%' },
  pillLbl:{ fontSize:9, fontWeight:'600', letterSpacing:0.4, textTransform:'uppercase' },
  pillVal:{ fontSize:12, fontWeight:'700', textTransform:'capitalize' },
  targetSummary:{ fontSize:9, fontWeight:'500', marginTop:-1, marginBottom:0, lineHeight:13 },

  // Footer
  footer:{ position:'absolute', left:0, right:0, bottom:0, paddingHorizontal:22, paddingTop:6, paddingBottom:36, borderTopWidth:StyleSheet.hairlineWidth, backgroundColor:C.footer, borderTopColor:C.footerBorder },
  footerTight:{ paddingTop:FOOTER.tightPaddingTop, paddingBottom:FOOTER.tightPaddingBottom },
  cta:{ height:FOOTER.ctaHeight, borderRadius:FOOTER.ctaRadius, flexDirection:'row', alignItems:'center', justifyContent:'center',
    overflow:'hidden', gap:8, shadowColor:'#14B8A6', shadowOffset:{width:0,height:6}, shadowOpacity:0.32, shadowRadius:16, elevation:8 },
  ctaDisabled:{ backgroundColor:'rgba(100,116,139,0.14)', shadowOpacity:0, elevation:0 },
  ctaSheen:{ position:'absolute', top:0, left:0, right:0, height:'44%', backgroundColor:'rgba(255,255,255,0.10)' },
  ctaTxt:{ color:'#fff', fontSize:15, fontWeight:'800', letterSpacing:0.1, flexShrink:1, textAlign:'center' },
  ctaTxtDisabled:{ color:'rgba(100,116,139,0.40)' },
  ctaArrow:{ color:'rgba(255,255,255,0.72)', fontSize:17 },
});
