/**
 * goal-score.tsx — "Name Your Number"
 *
 * Graphite dark variant. Compact, no scroll.
 * Oversized score input, exam-aware range hint card,
 * animated validation state.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import { useOnboardingV2 } from '@/app/(onboarding-v2)/state';
import { ONBOARDING_FOOTER_METRICS as FOOTER } from '@/app/components/onboarding-v2/footerMetrics';
import { useAppAlert } from '@/app/components/ui/AppAlert';
import { getCountryByCode } from '@/app/data/countries';
import { getExamGoalConfig } from '@/app/data/examGoalConfigs';
import { resolveAppLanguage, t } from '@/app/i18n';
import { getLocalizedExamName } from '@/app/i18n/examNames';
import {
  trackOnboardingStepBack,
  trackOnboardingStepContinue,
  trackOnboardingStepValidationFail,
  trackOnboardingStepView,
} from '@/app/utils/onboardingV2Analytics';
import { resolveTargetModel } from '@/app/utils/targetMetric';

// ── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg0: '#141414', bg1: '#1C1C1C', bg2: '#1E2422', bg3: '#181818',
  orbA: 'rgba(20,184,166,0.22)', orbB: 'rgba(52,211,153,0.12)',
  grid: 'rgba(255,255,255,0.03)',
  title: '#F1F5F9', sub: 'rgba(203,213,225,0.68)',
  label: '#2DD4BF', labelMuted: 'rgba(45,212,191,0.38)',
  teal: '#2DD4BF', tealDark: '#14B8A6',
  tealSoft: 'rgba(45,212,191,0.10)', tealBorder: 'rgba(45,212,191,0.18)',
  inputBg: 'rgba(255,255,255,0.05)',
  inputBorder: 'rgba(45,212,191,0.16)', inputBorderActive: '#2DD4BF',
  inputText: '#F1F5F9', inputPlaceholder: 'rgba(148,163,184,0.40)',
  cardBg: 'rgba(255,255,255,0.04)', cardBorder: 'rgba(45,212,191,0.12)',
  backBg: 'rgba(255,255,255,0.07)', backBorder: 'rgba(255,255,255,0.09)',
  backArrow: 'rgba(167,243,208,0.65)', brand: '#2DD4BF',
  btnA: '#14B8A6', btnB: '#0F9D8C',
  footer: 'transparent', footerBorder: 'rgba(45,212,191,0.10)',
};

export default function OnboardingV2GoalScoreScreen() {
  const { showAlert } = useAppAlert();
  const { draft, updateDraft } = useOnboardingV2();
  const lang = resolveAppLanguage({
    countryDefaultLanguage: getCountryByCode(draft.countryCode)?.defaultLanguage ?? null,
  });
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  useEffect(() => { void trackOnboardingStepView('goal_score'); }, []);

  const entrance = useRef(new Animated.Value(0)).current;
  const ctaFade = useRef(new Animated.Value(0)).current;
  const ctaScale = useRef(new Animated.Value(1)).current;
  const validAnim = useRef(new Animated.Value(0)).current;
  const orbPulse = useRef(new Animated.Value(0.90)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(orbPulse,{toValue:1.10,duration:3800,useNativeDriver:true}),
        Animated.timing(orbPulse,{toValue:0.90,duration:3800,useNativeDriver:true}),
      ])
    ).start();
    Animated.timing(entrance,{toValue:1,duration:440,useNativeDriver:true}).start();
    Animated.timing(ctaFade,{toValue:1,duration:440,delay:300,useNativeDriver:true}).start();
    // Intentionally mount-only entrance animations.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goalConfig = useMemo(() => {
    if (!draft.examId) return null;
    return getExamGoalConfig(draft.examId);
  }, [draft.examId]);
  const quickPicks = goalConfig?.ui.quickPicks ?? [];
  const isNumericTarget = goalConfig?.input.kind === 'numeric';
  const selectableOptions = goalConfig?.input.kind === 'level' || goalConfig?.input.kind === 'pass'
    ? goalConfig.input.options
    : quickPicks.map((p) => String(p));
  const numericInput = goalConfig?.input.kind === 'numeric' ? goalConfig.input : null;

  const isValid = useMemo(() => {
    const value = draft.targetScore.trim();
    if (!value || !goalConfig) return false;

    if (goalConfig.input.kind === 'numeric') {
      const parsed = Number(value);
      if (Number.isNaN(parsed)) return false;
      return parsed >= goalConfig.input.min && parsed <= goalConfig.input.max;
    }

    if (goalConfig.input.kind === 'level' || goalConfig.input.kind === 'pass') {
      return goalConfig.input.options.includes(value);
    }

    return false;
  }, [draft.targetScore, goalConfig]);

  useEffect(() => {
    if (!goalConfig) return;
    if (goalConfig.input.kind === 'pass' && !draft.targetScore) {
      persistTarget(goalConfig.input.options[0] ?? 'Pass');
      return;
    }
    if (
      (goalConfig.input.kind === 'level' || goalConfig.input.kind === 'pass')
      && draft.targetScore
      && !goalConfig.input.options.includes(draft.targetScore)
    ) {
      persistTarget('');
    }
  // Keep stored target aligned when metric type/options change by exam.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.targetScore, goalConfig]);

  useEffect(() => {
    Animated.spring(validAnim,{toValue:isValid?1:0,damping:22,stiffness:200,useNativeDriver:true}).start();
    // validAnim is a stable ref; rerun only on validity toggle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValid]);

  const labelByMetric: Record<string, string> = {
    score: t('onboarding.goal_score.target_score', { lang }),
    rank: t('onboarding.goal_score.target_rank', { lang }),
    percentile: t('onboarding.goal_score.target_percentile', { lang }),
    band: t('onboarding.goal_score.target_band', { lang }),
    level: t('onboarding.goal_score.target_level', { lang }),
    grade: t('onboarding.goal_score.target_grade', { lang }),
    pass: t('onboarding.goal_score.target_outcome', { lang }),
  };
  const titleByMetric: Record<string, string> = {
    score: t('onboarding.goal_score.title_score', { lang }),
    rank: t('onboarding.goal_score.title_rank', { lang }),
    percentile: t('onboarding.goal_score.title_percentile', { lang }),
    band: t('onboarding.goal_score.title_band', { lang }),
    level: t('onboarding.goal_score.title_level', { lang }),
    grade: t('onboarding.goal_score.title_grade', { lang }),
    pass: t('onboarding.goal_score.title_pass', { lang }),
  };
  const subtitleByMetric: Record<string, string> = {
    rank: t('onboarding.goal_score.subtitle_rank', { lang }),
    pass: t('onboarding.goal_score.subtitle_pass', { lang }),
  };
  const label = labelByMetric[goalConfig?.primaryMetric ?? 'score'] ?? t('common.select', { lang });
  const examDisplayName = getLocalizedExamName(draft.examId, lang, draft.examName || draft.examId || '');
  const inputMode = numericInput && numericInput.step < 1 ? 'decimal-pad' : 'number-pad';
  const noteText = goalConfig?.primaryMetric === 'rank'
    ? t('onboarding.goal_score.note_rank', { lang })
    : goalConfig?.primaryMetric === 'pass'
      ? t('onboarding.goal_score.note_pass', { lang })
      : t('onboarding.goal_score.note_default', { lang });

  const persistTarget = (value: string) => {
    const target = resolveTargetModel(draft.examId, value);
    updateDraft({
      targetScore: value,
      targetMetricType: target.metricType,
      targetValueRaw: target.raw,
      targetValueNormalized: target.normalized,
    });
  };

  const handleTargetChange = (raw: string) => {
    if (!isNumericTarget) {
      persistTarget(raw);
      return;
    }
    const sanitized = inputMode === 'decimal-pad'
      ? raw.replace(/[^0-9.]/g, '')
      : raw.replace(/[^0-9]/g, '');
    persistTarget(sanitized);
  };

  const handleContinue = () => {
    if (!isValid) {
      void trackOnboardingStepValidationFail('goal_score',['targetScore'],'Score required');
      showAlert(
        t('onboarding.goal_score.missing_title', { lang }),
        t('onboarding.goal_score.missing_body', { lang })
      );
      return;
    }
    void trackOnboardingStepContinue('goal_score', {
      target_metric_type: draft.targetMetricType,
      target_value_raw: draft.targetValueRaw || draft.targetScore,
      target_value_normalized: draft.targetValueNormalized,
    });
    router.push('/(onboarding-v2)/schedule');
  };

  const pressIn = () => Animated.spring(ctaScale,{toValue:0.97,damping:20,stiffness:400,useNativeDriver:true}).start();
  const pressOut = () => Animated.spring(ctaScale,{toValue:1,damping:18,stiffness:360,useNativeDriver:true}).start();

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent"/>
      <LinearGradient colors={[C.bg0,C.bg1,C.bg2,C.bg3]} locations={[0,0.3,0.65,1]} style={StyleSheet.absoluteFill}/>
      <Animated.View style={[styles.orbA,{backgroundColor:C.orbA,transform:[{scale:orbPulse}]}]}/>
      <View style={[styles.orbB,{backgroundColor:C.orbB}]}/>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {[0,1,2,3,4,5].map(i=><View key={`v${i}`} style={{position:'absolute',top:0,bottom:0,left:`${i*20}%`,width:StyleSheet.hairlineWidth,backgroundColor:C.grid}}/>)}
        {[0,1,2,3,4,5,6].map(i=><View key={`h${i}`} style={{position:'absolute',left:0,right:0,top:`${i*15}%`,height:StyleSheet.hairlineWidth,backgroundColor:C.grid}}/>)}
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS==='ios'?'padding':undefined} keyboardVerticalOffset={8}>
        <Animated.View style={[styles.inner, isTablet && styles.innerTablet,{opacity:entrance}]}>

          {/* Header */}
          <View style={[styles.headerRow, isTablet && styles.headerRowTablet]}>
            <TouchableOpacity style={[styles.backBtn, isTablet && styles.backBtnTablet,{backgroundColor:C.backBg,borderColor:C.backBorder}]} onPress={()=>{void trackOnboardingStepBack('goal_score');router.back();}} activeOpacity={0.7}>
              <Text style={[styles.backArrow, isTablet && styles.backArrowTablet,{color:C.backArrow}]}>‹</Text>
            </TouchableOpacity>
            <View style={styles.brandRow}>
              <View style={[styles.brandMark,{backgroundColor:C.brand}]}/>
              <Text style={[styles.brandText, isTablet && styles.brandTextTablet,{color:C.brand}]}>StudyMap</Text>
            </View>
            <View style={[styles.backBtn, isTablet && styles.backBtnTablet]}/>
          </View>

          {/* Progress */}
          <View style={[styles.progressTrack,{backgroundColor:C.tealSoft}]}>
            <View style={[styles.progressFill,{width:'36%'}]}>
              <LinearGradient colors={[C.btnA,C.btnB]} start={{x:0,y:0}} end={{x:1,y:0}} style={StyleSheet.absoluteFill}/>
              <View style={styles.progressSheen}/>
            </View>
          </View>
          <Text style={[styles.stepLabel, isTablet && styles.stepLabelTablet,{color:C.labelMuted}]}>
            {t('common.step_of', { lang, params: { current: 5, total: 13 } })}
          </Text>

          {/* Title */}
          <Text style={[styles.title, isTablet && styles.titleTablet,{color:C.title}]}>
            {titleByMetric[goalConfig?.primaryMetric ?? 'score'] ?? t('onboarding.goal_score.title_score', { lang })}
          </Text>
          <Text style={[styles.sub, isTablet && styles.subTablet,{color:C.sub}]}>
            {subtitleByMetric[goalConfig?.primaryMetric ?? ''] ?? t('onboarding.goal_score.subtitle_default', { lang })}
          </Text>

          {/* Metric input */}
          <View style={[styles.inputWrap, isTablet && styles.inputWrapTablet,{backgroundColor:C.inputBg,borderColor:isValid?C.inputBorderActive:C.inputBorder}]}>
            <LinearGradient colors={[C.btnA,C.btnB]} start={{x:0,y:0}} end={{x:1,y:0}} style={[styles.inputBar,{opacity:isValid?1:0.3}]}/>
            <View style={[styles.inputInner, isTablet && styles.inputInnerTablet]}>
              <Text style={[styles.inputLabel, isTablet && styles.inputLabelTablet,{color:C.label}]}>{label.toUpperCase()}</Text>
              {isNumericTarget ? (
                <View style={styles.inputRow}>
                  <TextInput
                    value={draft.targetScore}
                    onChangeText={handleTargetChange}
                    placeholder={quickPicks.length ? `e.g. ${quickPicks[Math.min(2, quickPicks.length - 1)]}` : t('onboarding.goal_score.enter_target', { lang })}
                    placeholderTextColor={C.inputPlaceholder}
                    keyboardType={inputMode}
                    style={[styles.scoreInput, isTablet && styles.scoreInputTablet,{color:isValid?C.teal:C.inputText}]}
                    returnKeyType="done"
                  />
                  {isValid && (
                    <Animated.View style={[styles.checkBadge,{backgroundColor:C.tealSoft,opacity:validAnim,transform:[{scale:validAnim}]}]}>
                      <Text style={[styles.checkText,{color:C.teal}]}>✓</Text>
                    </Animated.View>
                  )}
                </View>
              ) : (
                <View style={[styles.optionGrid, isTablet && styles.optionGridTablet]}>
                  {selectableOptions.map((option) => {
                    const selected = draft.targetScore === option;
                    return (
                      <TouchableOpacity
                        key={option}
                        style={[
                          styles.optionChip,
                          isTablet && styles.optionChipTablet,
                          { borderColor: selected ? C.teal : C.cardBorder, backgroundColor: selected ? C.tealSoft : 'rgba(255,255,255,0.04)' },
                        ]}
                        onPress={() => persistTarget(option)}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.optionChipText, isTablet && styles.optionChipTextTablet, { color: selected ? C.teal : C.sub }]}>{option}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Range hint */}
              {isNumericTarget && numericInput && (
                <Text style={[styles.rangeHint,{color:C.labelMuted}]}>
                  {t('onboarding.goal_score.range', {
                    lang,
                    params: { exam: examDisplayName, min: numericInput.min, max: numericInput.max },
                  })}
                </Text>
              )}
            </View>
          </View>

          {/* Quick-select chips (exam-aware) */}
          {!!quickPicks.length && isNumericTarget && (
            <View style={[styles.chipsRow, isTablet && styles.chipsRowTablet]}>
              <Text style={[styles.chipsLabel, isTablet && styles.chipsLabelTablet,{color:C.labelMuted}]}>{t('onboarding.goal_score.quick_select', { lang })}</Text>
              <View style={[styles.chips, isTablet && styles.chipsTablet]}>
                {quickPicks.map(pick => {
                  const active = draft.targetScore === String(pick);
                  return (
                    <TouchableOpacity
                      key={String(pick)}
                      style={[styles.chip, isTablet && styles.chipTablet,{backgroundColor:active?C.tealSoft:'rgba(255,255,255,0.04)',borderColor:active?C.teal:C.cardBorder}]}
                      onPress={()=>persistTarget(String(pick))}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.chipText, isTablet && styles.chipTextTablet,{color:active?C.teal:C.sub}]}>{pick}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Context note */}
          <View style={[styles.note, isTablet && styles.noteTablet,{backgroundColor:C.cardBg,borderColor:C.cardBorder}]}>
            <Text style={styles.noteIcon}>→</Text>
            <Text style={[styles.noteText,{color:C.sub}]}>{noteText}</Text>
          </View>
        </Animated.View>

        {/* Footer */}
      <Animated.View
          style={[
            styles.footer,
            isTablet && styles.footerTablet,
            {
              backgroundColor:C.footer,
              borderTopColor:C.footerBorder,
              opacity:ctaFade,
            },
          ]}
        >
          <Animated.View style={{transform:[{scale:ctaScale}]}}>
            <TouchableOpacity style={[styles.cta, isTablet && styles.ctaTablet,!isValid&&styles.ctaDisabled]} onPress={handleContinue} onPressIn={pressIn} onPressOut={pressOut} activeOpacity={1}>
              {isValid&&<LinearGradient colors={[C.btnA,C.btnB]} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFill}/>}
              {isValid&&<View style={styles.ctaSheen}/>}
              <Text style={[styles.ctaText, isTablet && styles.ctaTextTablet,!isValid&&styles.ctaTextDisabled]}>{t('common.continue', { lang })}</Text>
              {isValid&&<Text style={[styles.ctaArrow, isTablet && styles.ctaArrowTablet]}>→</Text>}
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:{flex:1,backgroundColor:'#141414'},
  flex:{flex:1},
  orbA:{position:'absolute',width:300,height:300,borderRadius:999,top:-90,right:-120},
  orbB:{position:'absolute',width:200,height:200,borderRadius:999,bottom:160,left:-90},
  inner:{flex:1,paddingHorizontal:22,paddingTop:10,paddingBottom:110},
  innerTablet:{paddingHorizontal:36,paddingTop:20,paddingBottom:140,maxWidth:980,width:'100%',alignSelf:'center'},
  headerRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:16},
  headerRowTablet:{marginBottom:20},
  backBtn:{width:36,height:36,borderRadius:11,borderWidth:1,justifyContent:'center',alignItems:'center'},
  backBtnTablet:{width:48,height:48,borderRadius:14},
  backArrow:{fontSize:26,fontWeight:'300',lineHeight:30,marginTop:-1},
  backArrowTablet:{fontSize:32,lineHeight:36},
  brandRow:{flexDirection:'row',alignItems:'center',gap:6},
  brandMark:{width:7,height:7,borderRadius:2},
  brandText:{fontSize:14,fontWeight:'800',letterSpacing:0.4},
  brandTextTablet:{fontSize:18},
  progressTrack:{height:3,borderRadius:999,overflow:'hidden',marginBottom:7},
  progressFill:{height:'100%',borderRadius:999,overflow:'hidden'},
  progressSheen:{position:'absolute',top:0,left:0,right:0,height:'50%',backgroundColor:'rgba(255,255,255,0.22)'},
  stepLabel:{fontSize:10,fontWeight:'600',letterSpacing:0.9,textTransform:'uppercase',marginBottom:18,opacity:0.65},
  stepLabelTablet:{fontSize:14,marginBottom:20},
  title:{fontSize:33,fontWeight:'900',lineHeight:39,letterSpacing:-0.8,marginBottom:8},
  titleTablet:{fontSize:62,lineHeight:68,marginBottom:14,maxWidth:820},
  sub:{fontSize:14,lineHeight:21,fontWeight:'400',marginBottom:22},
  subTablet:{fontSize:24,lineHeight:34,marginBottom:30,maxWidth:900},

  inputWrap:{borderRadius:20,borderWidth:1,overflow:'hidden',marginBottom:14,
    shadowColor:'#2DD4BF',shadowOffset:{width:0,height:4},shadowOpacity:0.12,shadowRadius:16,elevation:4},
  inputWrapTablet:{borderRadius:26,marginBottom:20},
  inputBar:{height:3},
  inputInner:{padding:18,gap:6},
  inputInnerTablet:{padding:32,gap:12},
  inputLabel:{fontSize:10,fontWeight:'700',letterSpacing:1.3,textTransform:'uppercase'},
  inputLabelTablet:{fontSize:14},
  inputRow:{flexDirection:'row',alignItems:'center',gap:10},
  scoreInput:{flex:1,fontSize:44,fontWeight:'900',letterSpacing:-1,paddingVertical:6},
  scoreInputTablet:{fontSize:68,paddingVertical:10},
  checkBadge:{width:36,height:36,borderRadius:12,alignItems:'center',justifyContent:'center'},
  checkText:{fontSize:18,fontWeight:'700'},
  optionGrid:{flexDirection:'row',flexWrap:'wrap',gap:8,paddingTop:4},
  optionGridTablet:{gap:14,paddingTop:10},
  optionChip:{
    minWidth:'31%',
    flexGrow:1,
    borderWidth:1,
    borderRadius:12,
    paddingVertical:11,
    paddingHorizontal:10,
    alignItems:'center',
  },
  optionChipTablet:{borderRadius:18,paddingVertical:18,paddingHorizontal:16},
  optionChipText:{fontSize:14,fontWeight:'700'},
  optionChipTextTablet:{fontSize:20},
  rangeHint:{fontSize:11,fontWeight:'500',letterSpacing:0.2},

  chipsRow:{marginBottom:14,gap:8},
  chipsRowTablet:{marginBottom:20,gap:12},
  chipsLabel:{fontSize:10,fontWeight:'600',letterSpacing:0.8,textTransform:'uppercase'},
  chipsLabelTablet:{fontSize:14},
  chips:{flexDirection:'row',gap:8},
  chipsTablet:{gap:12},
  chip:{flex:1,borderWidth:1,borderRadius:12,paddingVertical:10,alignItems:'center'},
  chipTablet:{borderRadius:18,paddingVertical:17},
  chipText:{fontSize:14,fontWeight:'700'},
  chipTextTablet:{fontSize:20},

  note:{flexDirection:'row',alignItems:'flex-start',gap:10,borderWidth:1,borderRadius:14,padding:13},
  noteTablet:{borderRadius:20,padding:20,marginTop:6},
  noteIcon:{fontSize:14,color:'#2DD4BF',marginTop:1},
  noteText:{flex:1,fontSize:12,lineHeight:18,fontWeight:'400'},

  footer:{position:'absolute',left:0,right:0,bottom:0,paddingHorizontal:22,paddingTop:16,paddingBottom:12,borderTopWidth:StyleSheet.hairlineWidth,backgroundColor:C.footer,borderTopColor:C.footerBorder},
  footerTablet:{paddingHorizontal:40,paddingTop:20,paddingBottom:46},
  cta:{height:FOOTER.ctaHeight,borderRadius:FOOTER.ctaRadius,flexDirection:'row',alignItems:'center',justifyContent:'center',overflow:'hidden',gap:8,
    shadowColor:'#14B8A6',shadowOffset:{width:0,height:6},shadowOpacity:0.32,shadowRadius:16,elevation:8},
  ctaTablet:{height:72,borderRadius:22},
  ctaDisabled:{backgroundColor:'rgba(100,116,139,0.14)',shadowOpacity:0,elevation:0},
  ctaSheen:{position:'absolute',top:0,left:0,right:0,height:'44%',backgroundColor:'rgba(255,255,255,0.12)'},
  ctaText:{color:'#fff',fontSize:16,fontWeight:'800',letterSpacing:0.2},
  ctaTextTablet:{fontSize:24},
  ctaTextDisabled:{color:'rgba(100,116,139,0.40)'},
  ctaArrow:{color:'rgba(255,255,255,0.78)',fontSize:17},
  ctaArrowTablet:{fontSize:22},
});
