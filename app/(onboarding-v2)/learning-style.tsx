/**
 * learning-style.tsx — "Tune Your Rhythm"
 *
 * Light slate variant. 5 sub-steps, each full-screen.
 * Step indicator: segmented bar + step name.
 * Options: large full-width cards, left rail accent, label + desc.
 * Summary strip at bottom updates live.
 * Single teal accent family throughout.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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
import { getCountryByCode } from '@/app/data/countries';
import { resolveAppLanguage, t } from '@/app/i18n';
import {
  trackOnboardingStepBack,
  trackOnboardingStepContinue,
  trackOnboardingStepView,
} from '@/app/utils/onboardingV2Analytics';

// ── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg0: '#FAFBFC', bg1: '#F4F6F8', bg2: '#EEF1F4', bg3: '#F8FAFB',
  orbA: 'rgba(15,157,140,0.09)', orbB: 'rgba(100,116,139,0.06)',
  grid: 'rgba(0,0,0,0.028)',
  title:  '#0F172A', sub: '#475569', muted: '#94A3B8',
  labelMuted: 'rgba(15,157,140,0.40)',
  teal:   '#0F9D8C', tealDk: '#0B7A6E',
  tealSoft:   'rgba(15,157,140,0.09)',
  tealBorder: 'rgba(15,157,140,0.22)',
  cardBg:     '#FFFFFF',
  cardBorder: 'rgba(15,23,42,0.07)',
  backBg:     'rgba(0,0,0,0.04)',
  backBorder: 'rgba(0,0,0,0.06)',
  backArrow:  '#64748B',
  brand:      '#0F9D8C',
  footer:     'rgba(250,251,252,0.97)',
  footerBorder: 'rgba(15,23,42,0.07)',
};

type StepId = 'primary_style' | 'reminder_frequency' | 'session_length' | 'break_frequency' | 'study_environment';

interface Option { id: string; label: string; desc: string }
interface Step { id: StepId; title: string; question: string; options: Option[] }

const STEPS: Step[] = [
  {
    id: 'primary_style',
    title: 'Learning Style',
    question: 'How do you absorb information best?',
    options: [
      { id: 'visual',       label: 'Visual',       desc: 'Maps, structures, and pattern-based learning.' },
      { id: 'auditory',     label: 'Auditory',     desc: 'Explanation-first with verbal recall.' },
      { id: 'kinesthetic',  label: 'Kinesthetic',  desc: 'Practice-first through active problem solving.' },
    ],
  },
  {
    id: 'reminder_frequency',
    title: 'Reminder Cadence',
    question: 'How often should we nudge you?',
    options: [
      { id: 'minimal',   label: 'Minimal',   desc: 'Only essential reminders. You self-direct.' },
      { id: 'moderate',  label: 'Moderate',  desc: 'Balanced daily check-ins.' },
      { id: 'frequent',  label: 'Frequent',  desc: 'High-frequency accountability prompts.' },
    ],
  },
  {
    id: 'session_length',
    title: 'Session Length',
    question: 'What study block length works best for you?',
    options: [
      { id: 'short',  label: 'Short',    desc: '20–30 min blocks with frequent resets.' },
      { id: 'medium', label: 'Balanced', desc: '45–60 min sessions with steady load.' },
      { id: 'long',   label: 'Deep',     desc: '90 min+ focused blocks for depth.' },
    ],
  },
  {
    id: 'break_frequency',
    title: 'Break Rhythm',
    question: 'How often should breaks appear?',
    options: [
      { id: 'low',    label: 'Fewer Breaks',    desc: 'Longer continuous focus windows.' },
      { id: 'normal', label: 'Standard Breaks', desc: 'Breaks after every session block.' },
      { id: 'high',   label: 'More Breaks',     desc: 'Frequent recovery between blocks.' },
    ],
  },
  {
    id: 'study_environment',
    title: 'Environment',
    question: 'Where and how do you focus best?',
    options: [
      { id: 'quiet',   label: 'Silent Focus',   desc: 'Low-noise, distraction-free setup.' },
      { id: 'mixed',   label: 'Mixed Setup',    desc: 'Switch between quiet and ambient.' },
      { id: 'ambient', label: 'Ambient Sound',  desc: 'Background sound aids concentration.' },
    ],
  },
];

const SUMMARY_LABELS: Record<string, string> = {
  visual:'Visual', auditory:'Auditory', kinesthetic:'Kinesthetic',
  minimal:'Minimal', moderate:'Moderate', frequent:'Frequent',
  short:'Short', medium:'Balanced', long:'Deep',
  low:'Fewer', normal:'Standard', high:'More',
  quiet:'Silent', mixed:'Mixed', ambient:'Ambient',
};

export default function OnboardingV2LearningStyleScreen() {
  const { draft, updateDraft } = useOnboardingV2();
  const lang = resolveAppLanguage({
    countryDefaultLanguage: getCountryByCode(draft.countryCode)?.defaultLanguage ?? null,
  });
  const [stepIdx, setStepIdx] = useState(0);
  const [animKey, setAnimKey] = useState(0);

  const entrance   = useRef(new Animated.Value(0)).current;
  const ctaFade    = useRef(new Animated.Value(0)).current;
  const ctaScale   = useRef(new Animated.Value(1)).current;
  const contentFade = useRef(new Animated.Value(1)).current;
  const optAnims   = useRef(STEPS[0].options.map(() => new Animated.Value(0))).current;

  useEffect(() => { void trackOnboardingStepView('learning_style'); }, []);
  useEffect(() => {
    Animated.timing(entrance, { toValue:1, duration:400, useNativeDriver:true }).start();
    Animated.timing(ctaFade,  { toValue:1, duration:400, delay:220, useNativeDriver:true }).start();
    fireOpts();
  // Entrance/options animations are mount-only; refs/functions are stable for this flow.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fireOpts = (count = 3) => {
    optAnims.forEach(a => a.setValue(0));
    optAnims.slice(0, count).forEach((a, i) =>
      Animated.timing(a, { toValue:1, duration:220, delay: i*55, useNativeDriver:true }).start()
    );
  };

  const activeStep = STEPS[stepIdx];
  const isLastStep = stepIdx === STEPS.length - 1;
  const getStepTitle = (step: Step) =>
    t(`onboarding.learning_style.step_${step.id}.title`, { lang, fallback: step.title });
  const getStepQuestion = (step: Step) =>
    t(`onboarding.learning_style.step_${step.id}.question`, { lang, fallback: step.question });
  const getOptionLabel = (step: Step, opt: Option) =>
    t(`onboarding.learning_style.step_${step.id}.opt_${opt.id}.label`, { lang, fallback: opt.label });
  const getOptionDesc = (step: Step, opt: Option) =>
    t(`onboarding.learning_style.step_${step.id}.opt_${opt.id}.desc`, { lang, fallback: opt.desc });
  const getSummaryLabel = (value: string) =>
    t(`onboarding.learning_style.value_${value}`, { lang, fallback: SUMMARY_LABELS[value] ?? value });

  const getValue = (id: StepId): string => {
    if (id === 'primary_style')      return draft.learningStyle?.primaryStyle ?? '';
    if (id === 'reminder_frequency') return draft.reminderFrequency ?? '';
    if (id === 'session_length')     return draft.learningStyle?.preferences?.sessionLength ?? '';
    if (id === 'break_frequency')    return draft.learningStyle?.preferences?.breakFrequency ?? '';
    return draft.learningStyle?.preferences?.studyEnvironment ?? '';
  };

  const setValue = (id: StepId, val: string) => {
    const ls = draft.learningStyle ?? { primaryStyle: 'visual', preferences: {} };
    if (id === 'primary_style')
      updateDraft({ learningStyle: { ...ls, primaryStyle: val as any } });
    else if (id === 'reminder_frequency')
      updateDraft({ reminderFrequency: val as any });
    else
      updateDraft({ learningStyle: { ...ls, preferences: { ...ls.preferences, [
        id === 'session_length' ? 'sessionLength' :
        id === 'break_frequency' ? 'breakFrequency' : 'studyEnvironment'
      ]: val } } });
  };

  const transition = (nextIdx: number) => {
    Animated.timing(contentFade, { toValue:0, duration:80, useNativeDriver:true }).start(() => {
      setStepIdx(nextIdx);
      setAnimKey(k => k+1);
      Animated.timing(contentFade, { toValue:1, duration:160, useNativeDriver:true }).start();
      fireOpts(STEPS[nextIdx].options.length);
    });
  };

  const handleBack = () => {
    if (stepIdx > 0) { transition(stepIdx - 1); return; }
    void trackOnboardingStepBack('learning_style');
    router.back();
  };

  const handleContinue = () => {
    if (!isLastStep) { transition(stepIdx + 1); return; }
    void trackOnboardingStepContinue('learning_style');
    router.push('/(onboarding-v2)/plan-preview');
  };

  const pressIn  = () => Animated.spring(ctaScale, { toValue:0.97, damping:20, stiffness:400, useNativeDriver:true }).start();
  const pressOut = () => Animated.spring(ctaScale, { toValue:1,    damping:18, stiffness:360, useNativeDriver:true }).start();

  const currentValue = getValue(activeStep.id);

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={[C.bg0,C.bg1,C.bg2,C.bg3]} locations={[0,0.35,0.70,1]} style={StyleSheet.absoluteFill}/>
      <View style={[s.orbA,{backgroundColor:C.orbA}]}/>
      <View style={[s.orbB,{backgroundColor:C.orbB}]}/>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {[0,1,2,3,4,5,6].map(i=><View key={i} style={{position:'absolute',top:0,bottom:0,left:`${i*16.6}%`,width:StyleSheet.hairlineWidth,backgroundColor:C.grid}}/>)}
        {[0,1,2,3,4,5,6,7].map(i=><View key={i} style={{position:'absolute',left:0,right:0,top:`${i*12.5}%`,height:StyleSheet.hairlineWidth,backgroundColor:C.grid}}/>)}
      </View>

      <Animated.View style={[s.inner, { opacity: entrance }]}>

        {/* ── Header ── */}
        <View style={s.headerRow}>
          <TouchableOpacity style={[s.backBtn,{backgroundColor:C.backBg,borderColor:C.backBorder}]} onPress={handleBack} activeOpacity={0.7}>
            <Text style={[s.backArrow,{color:C.backArrow}]}>‹</Text>
          </TouchableOpacity>
          <View style={s.brandRow}>
            <View style={[s.brandMark,{backgroundColor:C.brand}]}/>
            <Text style={[s.brandTxt,{color:C.brand}]}>StudyMap</Text>
          </View>
          <View style={s.backBtn}/>
        </View>

        {/* ── Outer progress bar (overall onboarding) ── */}
        <View style={[s.progressTrack,{backgroundColor:C.tealSoft}]}>
          <View style={[s.progressFill,{width:'72%'}]}>
            <LinearGradient colors={[C.teal,C.tealDk]} start={{x:0,y:0}} end={{x:1,y:0}} style={StyleSheet.absoluteFill}/>
            <View style={s.progressSheen}/>
          </View>
        </View>
        <Text style={[s.stepLabel,{color:C.labelMuted}]}>
          {t('common.step_of', { lang, params: { current: 9, total: 12 } })}
        </Text>

        {/* ── Title ── */}
        <Text style={[s.title,{color:C.title}]}>
          {t('onboarding.learning_style.title', { lang, fallback: 'Learning\nrhythm.' })}
        </Text>

        {/* ── Inner step segmented bar ── */}
        <View style={s.segRow}>
          {STEPS.map((st, i) => {
            const done   = i < stepIdx;
            const active = i === stepIdx;
            return (
              <View
                key={st.id}
                style={[
                  s.seg,
                  active ? { backgroundColor: C.teal, flex: 2 }
                  : done  ? { backgroundColor: C.tealBorder }
                  :         { backgroundColor: 'rgba(15,23,42,0.07)' },
                ]}
              />
            );
          })}
        </View>

        {/* ── Animated content block ── */}
        <Animated.View key={animKey} style={[s.contentBlock, { opacity: contentFade }]}>

          {/* Step header */}
          <View style={s.stepHeader}>
            <View style={s.stepHeaderLeft}>
              <Text style={[s.stepCounter,{color:C.muted}]}>{stepIdx+1} / {STEPS.length}</Text>
              <Text style={[s.stepTitle,{color:C.title}]}>{getStepTitle(activeStep)}</Text>
            </View>
            {currentValue ? (
              <View style={[s.currentBadge,{backgroundColor:C.tealSoft,borderColor:C.tealBorder}]}>
                <Text style={[s.currentBadgeTxt,{color:C.teal}]}>
                  {getSummaryLabel(currentValue)}
                </Text>
              </View>
            ) : (
              <View style={[s.currentBadge,{backgroundColor:'rgba(15,23,42,0.04)',borderColor:C.cardBorder}]}>
                <Text style={[s.currentBadgeTxt,{color:C.muted}]}>
                  {t('onboarding.learning_style.not_set', { lang, fallback: 'Not set' })}
                </Text>
              </View>
            )}
          </View>

          {/* Question */}
          <Text style={[s.question,{color:C.sub}]}>{getStepQuestion(activeStep)}</Text>

          {/* ── Option cards ── */}
          <View style={s.optList}>
            {activeStep.options.map((opt, i) => {
              const sel = currentValue === opt.id;
              return (
                <Animated.View
                  key={opt.id}
                  style={{
                    opacity: optAnims[i] ?? new Animated.Value(1),
                    transform:[{ translateY: (optAnims[i] ?? new Animated.Value(1)).interpolate({inputRange:[0,1],outputRange:[8,0]}) }],
                  }}
                >
                  <TouchableOpacity
                    style={[
                      s.optCard,
                      sel
                        ? { backgroundColor: C.tealSoft, borderColor: C.teal, borderWidth:1.5,
                            shadowColor:C.teal, shadowOffset:{width:0,height:3}, shadowOpacity:0.15, shadowRadius:10, elevation:4 }
                        : { backgroundColor: C.cardBg,   borderColor: C.cardBorder, borderWidth:1 },
                    ]}
                    onPress={() => setValue(activeStep.id, opt.id)}
                    activeOpacity={0.85}
                  >
                    {/* Teal left rail when selected */}
                    <LinearGradient
                      colors={[C.teal, C.tealDk]}
                      start={{x:0,y:0}} end={{x:0,y:1}}
                      style={[s.optRail, { opacity: sel ? 1 : 0.18 }]}
                    />
                    <View style={s.optBody}>
                      <Text style={[s.optLabel,{color: sel ? C.title : C.sub}]}>{getOptionLabel(activeStep, opt)}</Text>
                      <Text style={[s.optDesc,{color: sel ? C.teal : C.muted}]}>{getOptionDesc(activeStep, opt)}</Text>
                    </View>
                    {/* Radio */}
                    <View style={[
                      s.radio,
                      sel
                        ? {backgroundColor:C.teal, borderColor:C.teal}
                        : {backgroundColor:'transparent', borderColor:C.cardBorder},
                    ]}>
                      {sel && <View style={s.radioDot}/>}
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>

        {/* ── Summary strip ── */}
        <View style={[s.summary,{backgroundColor:C.cardBg,borderColor:C.cardBorder}]}>
          <Text style={[s.summaryTitle,{color:C.muted}]}>
            {t('onboarding.learning_style.summary_title', { lang, fallback: 'Your profile so far' })}
          </Text>
          <View style={s.summaryChips}>
            {STEPS.map(st => {
              const val = getValue(st.id);
              const set = !!val;
              return (
                <View
                  key={st.id}
                  style={[
                    s.summaryChip,
                    set
                      ? {backgroundColor:C.tealSoft, borderColor:C.tealBorder}
                      : {backgroundColor:'rgba(15,23,42,0.03)', borderColor:C.cardBorder},
                  ]}
                >
                  <Text style={[s.summaryChipLbl,{color:C.muted}]}>{getStepTitle(st)}</Text>
                  <Text style={[s.summaryChipVal,{color: set ? C.teal : C.muted}]}>
                    {set ? getSummaryLabel(val) : '—'}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

      </Animated.View>

      {/* ── Footer ── */}
      <Animated.View style={[s.footer,{backgroundColor:C.footer,borderTopColor:C.footerBorder,opacity:ctaFade}]}>
        <Animated.View style={{transform:[{scale:ctaScale}]}}>
          <TouchableOpacity
            style={[s.cta, !currentValue && s.ctaDisabled]}
            onPress={handleContinue}
            onPressIn={pressIn}
            onPressOut={pressOut}
            activeOpacity={1}
          >
            {!!currentValue && <LinearGradient colors={[C.teal,C.tealDk]} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFill}/>}
            {!!currentValue && <View style={s.ctaSheen}/>}
            <Text style={[s.ctaTxt, !currentValue && s.ctaTxtDisabled]}>
              {isLastStep
                ? t('onboarding.learning_style.build_plan', { lang, fallback: 'Build My Plan' })
                : t('onboarding.learning_style.next_step', {
                    lang,
                    params: { step: getStepTitle(STEPS[stepIdx + 1]) },
                    fallback: `Next: ${getStepTitle(STEPS[stepIdx + 1])}`,
                  })}
            </Text>
            {!!currentValue && <Text style={s.ctaArrow}>→</Text>}
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:{ flex:1, backgroundColor:'#FAFBFC' },
  orbA:{ position:'absolute', width:260, height:260, borderRadius:999, top:-80, right:-100 },
  orbB:{ position:'absolute', width:160, height:160, borderRadius:999, bottom:200, left:-70 },
  inner:{ flex:1, paddingHorizontal:22, paddingTop:10, paddingBottom:110 },

  headerRow:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 },
  backBtn:{ width:36, height:36, borderRadius:11, borderWidth:1, justifyContent:'center', alignItems:'center' },
  backArrow:{ fontSize:26, fontWeight:'300', lineHeight:30, marginTop:-1 },
  brandRow:{ flexDirection:'row', alignItems:'center', gap:6 },
  brandMark:{ width:7, height:7, borderRadius:2 },
  brandTxt:{ fontSize:14, fontWeight:'800', letterSpacing:0.4 },

  progressTrack:{ height:3, borderRadius:99, overflow:'hidden', marginBottom:6 },
  progressFill:{ height:'100%', borderRadius:99, overflow:'hidden' },
  progressSheen:{ position:'absolute', top:0, left:0, right:0, height:'50%', backgroundColor:'rgba(255,255,255,0.28)' },
  stepLabel:{ fontSize:10, fontWeight:'600', letterSpacing:0.8, textTransform:'uppercase', marginBottom:12, opacity:0.65 },

  title:{ fontSize:30, fontWeight:'900', lineHeight:36, letterSpacing:-0.7, marginBottom:12 },

  // Inner step bar
  segRow:{ flexDirection:'row', gap:5, marginBottom:16 },
  seg:{ flex:1, height:4, borderRadius:99 },

  contentBlock:{ gap:12 },

  // Step header
  stepHeader:{ flexDirection:'row', alignItems:'flex-start', justifyContent:'space-between', gap:12 },
  stepHeaderLeft:{ flex:1, gap:2 },
  stepCounter:{ fontSize:10, fontWeight:'600', letterSpacing:0.6, textTransform:'uppercase' },
  stepTitle:{ fontSize:20, fontWeight:'900', letterSpacing:-0.4 },
  currentBadge:{ borderWidth:1, borderRadius:10, paddingHorizontal:11, paddingVertical:6, alignSelf:'flex-start' },
  currentBadgeTxt:{ fontSize:12, fontWeight:'700' },

  question:{ fontSize:14, lineHeight:20, fontWeight:'400', marginBottom:2 },

  // Options
  optList:{ gap:8 },
  optCard:{
    flexDirection:'row', alignItems:'center',
    borderRadius:15, overflow:'hidden',
    paddingRight:14, paddingVertical:14,
  },
  optRail:{ width:3, alignSelf:'stretch', marginRight:14 },
  optBody:{ flex:1, gap:3 },
  optLabel:{ fontSize:15, fontWeight:'700', letterSpacing:-0.1 },
  optDesc:{ fontSize:12, fontWeight:'400', lineHeight:17 },
  radio:{ width:22, height:22, borderRadius:11, borderWidth:1.5, alignItems:'center', justifyContent:'center' },
  radioDot:{ width:8, height:8, borderRadius:4, backgroundColor:'#fff' },

  // Summary
  summary:{ borderWidth:1, borderRadius:14, padding:12, gap:8, marginTop:12 },
  summaryTitle:{ fontSize:10, fontWeight:'600', letterSpacing:0.6, textTransform:'uppercase' },
  summaryChips:{ flexDirection:'row', flexWrap:'wrap', gap:6 },
  summaryChip:{ width:'48%', borderWidth:1, borderRadius:10, paddingHorizontal:10, paddingVertical:7, gap:2 },
  summaryChipLbl:{ fontSize:9, fontWeight:'600', letterSpacing:0.4, textTransform:'uppercase' },
  summaryChipVal:{ fontSize:12, fontWeight:'700' },

  // Footer
  footer:{ position:'absolute', left:0, right:0, bottom:0, paddingHorizontal:22, paddingTop:12, paddingBottom:32, borderTopWidth:StyleSheet.hairlineWidth },
  cta:{ height:52, borderRadius:13, flexDirection:'row', alignItems:'center', justifyContent:'center',
    overflow:'hidden', gap:8, shadowColor:'#0F9D8C', shadowOffset:{width:0,height:5}, shadowOpacity:0.24, shadowRadius:14, elevation:7 },
  ctaDisabled:{ backgroundColor:'rgba(148,163,184,0.18)', shadowOpacity:0, elevation:0 },
  ctaSheen:{ position:'absolute', top:0, left:0, right:0, height:'44%', backgroundColor:'rgba(255,255,255,0.13)' },
  ctaTxt:{ color:'#fff', fontSize:15, fontWeight:'800', letterSpacing:0.1 },
  ctaTxtDisabled:{ color:'rgba(100,116,139,0.50)' },
  ctaArrow:{ color:'rgba(255,255,255,0.72)', fontSize:16 },
});
