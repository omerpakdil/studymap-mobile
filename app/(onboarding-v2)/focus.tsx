/**
 * focus.tsx — "Set Subject Focus"
 *
 * Teal-washed light variant. Compact, no scroll.
 *
 * Layout:
 * - Subject queue: horizontal pill strip showing all subjects.
 *   Active = teal solid, done = teal outline + level label, pending = grey.
 * - Active subject card: large subject name + 4 level selector buttons.
 *   Each level button shows label + short desc. Selected = teal.
 * - Distribution bar: one row per subject, teal fill proportional to level.
 * - Presets: 3 compact chips top-right.
 */
import { getCurriculumByExamId } from '@/app/data';
import { getBlueprintByExamCode } from '@/app/data/examBlueprints';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    SafeAreaView,
    ScrollView,
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
import { resolveAppLanguage, t } from '@/app/i18n';
import { getLocalizedSubjectName } from '@/app/i18n/subjectNames';
import {
    trackOnboardingStepBack,
    trackOnboardingStepContinue,
    trackOnboardingStepValidationFail,
    trackOnboardingStepView,
} from '@/app/utils/onboardingV2Analytics';

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  bg0: '#F0FDFB', bg1: '#ECFDF8', bg2: '#F3FFFE', bg3: '#FAFFFE',
  orbA: 'rgba(20,184,166,0.13)', orbB: 'rgba(52,211,153,0.09)',
  grid: 'rgba(0,0,0,0.026)',
  title:  '#042F2E', sub: '#115E59', muted: '#5EADA6',
  labelMuted: 'rgba(15,118,110,0.40)',
  teal:       '#0D9488', tealDk: '#0F766E',
  tealSoft:   'rgba(13,148,136,0.09)',
  tealBorder: 'rgba(13,148,136,0.20)',
  cardBg:     '#FFFFFF', cardBorder: 'rgba(15,23,42,0.06)',
  backBg:     'rgba(0,0,0,0.04)', backBorder: 'rgba(0,0,0,0.06)',
  backArrow:  '#0F766E', brand: '#0D9488',
  footer:     'transparent', footerBorder: 'rgba(13,148,136,0.10)',
};

// Level definitions — all teal-family, no multi-color
const LEVELS = [
  { id: 0, label: 'Light',     desc: 'Maintenance',     fill: 0.25 },
  { id: 1, label: 'Moderate',  desc: 'Steady load',     fill: 0.50 },
  { id: 2, label: 'High',      desc: 'Priority focus',  fill: 0.75 },
  { id: 3, label: 'Intensive', desc: 'Max pressure',    fill: 1.00 },
] as const;

const PRESETS = [
  { id: 'balanced', label: 'Balanced' },
  { id: 'weak',     label: 'Weak Boost' },
  { id: 'crunch',   label: 'Crunch' },
] as const;

export default function OnboardingV2FocusScreen() {
  const { showAlert } = useAppAlert();
  const { draft, updateDraft } = useOnboardingV2();
  const lang = resolveAppLanguage({
    countryDefaultLanguage: getCountryByCode(draft.countryCode)?.defaultLanguage ?? null,
  });
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const [activeSubject, setActiveSubject] = useState('');
  const [animKey, setAnimKey] = useState(0);

  const subjects = useMemo(() => {
    const cur = getCurriculumByExamId(draft.examId || 'sat');
    if (cur?.subjects?.length) return cur.subjects.map(s => s.name);
    const blueprint = getBlueprintByExamCode(draft.examId || 'sat');
    return blueprint?.subjects?.map(s => s.label) || [];
  }, [draft.examId]);

  const subjectIntensity = useMemo(() => draft.subjectIntensity || {}, [draft.subjectIntensity]);
  const shouldScrollSubjects = !isTablet && subjects.length > 4;
  const subjectChipWidth = useMemo(() => {
    const horizontalPadding = 44; // inner paddingHorizontal * 2
    const gap = 7;
    const contentWidth = Math.max(280, width - horizontalPadding);
    if (isTablet) {
      return Math.floor((contentWidth - gap * Math.max(subjects.length - 1, 0)) / Math.max(subjects.length, 1));
    }
    if (subjects.length <= 1) return contentWidth;
    if (subjects.length <= 4) {
      return Math.floor((contentWidth - gap * (subjects.length - 1)) / subjects.length);
    }
    return 118;
  }, [isTablet, subjects.length, width]);

  useEffect(() => { void trackOnboardingStepView('focus'); }, []);

  useEffect(() => {
    if (!subjects.length) return;
    const hasAll = subjects.every(s => typeof subjectIntensity[s] === 'number');
    if (!hasAll) {
      const next = { ...subjectIntensity };
      subjects.forEach(s => { if (typeof next[s] !== 'number') next[s] = 1; });
      updateDraft({ subjectIntensity: next });
    }
    if (!activeSubject || !subjects.includes(activeSubject)) setActiveSubject(subjects[0]);
  // Intentionally rerun when subject list changes; avoids resetting user edits each render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjects]);

  const entrance  = useRef(new Animated.Value(0)).current;
  const ctaFade   = useRef(new Animated.Value(0)).current;
  const ctaScale  = useRef(new Animated.Value(1)).current;
  const cardFade  = useRef(new Animated.Value(1)).current;
  const levelAnims = useRef(LEVELS.map(() => new Animated.Value(0))).current;
  const subjectScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    Animated.timing(entrance, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    Animated.timing(ctaFade,  { toValue: 1, duration: 400, delay: 220, useNativeDriver: true }).start();
    fireLevelAnims();
  // Intentionally mount-only entrance animations.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fireLevelAnims = () => {
    levelAnims.forEach(a => a.setValue(0));
    levelAnims.forEach((a, i) =>
      Animated.timing(a, { toValue: 1, duration: 200, delay: i * 40, useNativeDriver: true }).start()
    );
  };

  const switchSubject = (s: string, idx: number) => {
    Animated.timing(cardFade, { toValue: 0, duration: 70, useNativeDriver: true }).start(() => {
      setActiveSubject(s);
      setAnimKey(k => k + 1);
      Animated.timing(cardFade, { toValue: 1, duration: 150, useNativeDriver: true }).start();
      fireLevelAnims();
      if (shouldScrollSubjects) {
        subjectScrollRef.current?.scrollTo({
          x: Math.max(0, idx - 1) * (subjectChipWidth + 7),
          animated: true,
        });
      }
    });
  };

  const setLevel = (level: number) => {
    if (!activeSubject) return;
    updateDraft({ subjectIntensity: { ...subjectIntensity, [activeSubject]: level } });
  };

  const applyPreset = (preset: string) => {
    if (!subjects.length) return;
    const next: Record<string, number> = {};
    subjects.forEach((s, i) => {
      if (preset === 'balanced')    next[s] = 1;
      else if (preset === 'weak')   next[s] = i === 0 ? 3 : 1;
      else                          next[s] = i <= 1  ? 3 : 2;
    });
    updateDraft({ subjectIntensity: next });
  };

  const activeIdx    = subjects.findIndex(s => s === activeSubject);
  const isLastSubj   = activeIdx >= 0 && activeIdx === subjects.length - 1;
  const activeValue  = typeof subjectIntensity[activeSubject] === 'number' ? subjectIntensity[activeSubject] : 1;
  const activeLevel  = LEVELS.find(l => l.id === activeValue) ?? LEVELS[1];
  const getLevelLabel = (id: number) =>
    t(`onboarding.focus.level_${id}.label`, {
      lang,
      fallback: LEVELS.find((l) => l.id === id)?.label ?? '',
    });
  const getLevelDesc = (id: number) =>
    t(`onboarding.focus.level_${id}.desc`, {
      lang,
      fallback: LEVELS.find((l) => l.id === id)?.desc ?? '',
    });
  const getPresetLabel = (id: string) =>
    t(`onboarding.focus.preset_${id}`, {
      lang,
      fallback: PRESETS.find((p) => p.id === id)?.label ?? id,
    });
  const subjectLabel = (subject: string) =>
    getLocalizedSubjectName(subject, lang, subject, { examCode: draft.examId });

  const avgLevel = useMemo(() => {
    if (!subjects.length) return 0;
    const sum = subjects.reduce((a, s) => a + (subjectIntensity[s] ?? 1), 0);
    return (sum / subjects.length).toFixed(1);
  }, [subjectIntensity, subjects]);
  const configuredCount = useMemo(
    () => subjects.filter((s) => typeof subjectIntensity[s] === 'number').length,
    [subjectIntensity, subjects]
  );

  const handleContinue = () => {
    if (!isLastSubj) {
      switchSubject(subjects[activeIdx + 1], activeIdx + 1);
      return;
    }
    const isValid = subjects.every(s => typeof subjectIntensity[s] === 'number');
    if (!isValid) {
      void trackOnboardingStepValidationFail('focus', ['subjectIntensity'], 'All subjects required');
      showAlert(
        t('onboarding.focus.alert_title', { lang, fallback: 'Missing Focus' }),
        t('onboarding.focus.alert_body', { lang, fallback: 'Please set intensity for all subjects.' })
      );
      return;
    }
    void trackOnboardingStepContinue('focus');
    router.push('/(onboarding-v2)/learning-style');
  };

  const pressIn  = () => Animated.spring(ctaScale, { toValue: 0.97, damping: 20, stiffness: 400, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(ctaScale, { toValue: 1,    damping: 18, stiffness: 360, useNativeDriver: true }).start();

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

      <Animated.View style={[s.inner, isTablet && s.innerTablet,{opacity:entrance}]}>

        {/* Header */}
        <View style={[s.headerRow, isTablet && s.headerRowTablet]}>
          <TouchableOpacity style={[s.backBtn, isTablet && s.backBtnTablet,{backgroundColor:C.backBg,borderColor:C.backBorder}]} onPress={()=>{void trackOnboardingStepBack('focus');router.back();}} activeOpacity={0.7}>
            <Text style={[s.backArrowTxt, isTablet && s.backArrowTxtTablet,{color:C.backArrow}]}>‹</Text>
          </TouchableOpacity>
          <View style={s.brandRow}>
            <View style={[s.brandMark,{backgroundColor:C.brand}]}/>
            <Text style={[s.brandTxt, isTablet && s.brandTxtTablet,{color:C.brand}]}>StudyMap</Text>
          </View>
          <View style={[s.backBtn, isTablet && s.backBtnTablet]}/>
        </View>

        {/* Progress */}
        <View style={[s.progressTrack,{backgroundColor:C.tealSoft}]}>
          <View style={[s.progressFill,{width:'63%'}]}>
            <LinearGradient colors={[C.teal,C.tealDk]} start={{x:0,y:0}} end={{x:1,y:0}} style={StyleSheet.absoluteFill}/>
            <View style={s.progressSheen}/>
          </View>
        </View>
        <Text style={[s.stepLabel, isTablet && s.stepLabelTablet,{color:C.labelMuted}]}>
          {t('common.step_of', { lang, params: { current: 9, total: 13 } })}
        </Text>

        {/* Title row + presets */}
        <View style={[s.titleRow, isTablet && s.titleRowTablet]}>
          <View>
            <Text style={[s.title, isTablet && s.titleTablet,{color:C.title}]}>
              {t('onboarding.focus.title', { lang, fallback: 'Subject focus.' })}
            </Text>
            <Text style={[s.sub, isTablet && s.subTablet,{color:C.sub}]}>
              {t('onboarding.focus.avg_pressure', { lang, fallback: 'Avg pressure' })}:{' '}
              <Text style={{color:C.teal,fontWeight:'800'}}>{avgLevel}/3</Text>
            </Text>
          </View>
          <View style={[s.presetRow, isTablet && s.presetRowTablet]}>
            {PRESETS.map(p => (
              <TouchableOpacity key={p.id} style={[s.presetBtn, isTablet && s.presetBtnTablet,{backgroundColor:C.tealSoft,borderColor:C.tealBorder}]} onPress={()=>applyPreset(p.id)} activeOpacity={0.75}>
                <Text style={[s.presetTxt, isTablet && s.presetTxtTablet,{color:C.teal}]}>{getPresetLabel(p.id)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Subject strip (adapts to subject count) ── */}
        {shouldScrollSubjects ? (
          <ScrollView
            ref={subjectScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.subjectScroll}
          >
            {subjects.map((subj, i) => {
              const isActive  = subj === activeSubject;
              const isDone    = i < activeIdx;
              const lvl       = subjectIntensity[subj] ?? 1;
              const lvlLabel  = getLevelLabel(lvl);
              return (
                <TouchableOpacity
                  key={subj}
                  style={[
                    s.subjectChip,
                    { width: subjectChipWidth },
                    isActive  ? { backgroundColor: C.teal,     borderColor: C.teal }
                    : isDone  ? { backgroundColor: C.tealSoft, borderColor: C.tealBorder }
                    :           { backgroundColor: C.cardBg,   borderColor: C.cardBorder },
                  ]}
                  onPress={() => switchSubject(subj, i)}
                  activeOpacity={0.82}
                >
                  <Text style={[s.subjectChipNum,{color: isActive ? 'rgba(255,255,255,0.70)' : C.muted}]}>{i+1}</Text>
                  <Text style={[s.subjectChipTxt,{color: isActive ? '#fff' : isDone ? C.teal : C.sub}]} numberOfLines={1}>{subjectLabel(subj)}</Text>
                  {isDone && <Text style={[s.subjectChipLvl,{color:C.teal}]}>{lvlLabel}</Text>}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : (
          <View style={[s.subjectRowStatic, isTablet && s.subjectRowStaticTablet]}>
            {subjects.map((subj, i) => {
              const isActive  = subj === activeSubject;
              const isDone    = i < activeIdx;
              const lvl       = subjectIntensity[subj] ?? 1;
              const lvlLabel  = getLevelLabel(lvl);
              return (
                <TouchableOpacity
                  key={subj}
                  style={[
                    s.subjectChip,
                    isTablet && s.subjectChipTablet,
                    { width: subjectChipWidth },
                    isActive  ? { backgroundColor: C.teal,     borderColor: C.teal }
                    : isDone  ? { backgroundColor: C.tealSoft, borderColor: C.tealBorder }
                    :           { backgroundColor: C.cardBg,   borderColor: C.cardBorder },
                  ]}
                  onPress={() => switchSubject(subj, i)}
                  activeOpacity={0.82}
                >
                  <Text style={[s.subjectChipNum, isTablet && s.subjectChipNumTablet,{color: isActive ? 'rgba(255,255,255,0.70)' : C.muted}]}>{i+1}</Text>
                  <Text style={[s.subjectChipTxt, isTablet && s.subjectChipTxtTablet,{color: isActive ? '#fff' : isDone ? C.teal : C.sub}]} numberOfLines={1}>{subjectLabel(subj)}</Text>
                  {isDone && <Text style={[s.subjectChipLvl, isTablet && s.subjectChipLvlTablet,{color:C.teal}]}>{lvlLabel}</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Step pips */}
        <View style={[s.pips, isTablet && s.pipsTablet]}>
          {subjects.map((subj, i) => (
            <View
              key={subj}
              style={[
                s.pip,
                subj === activeSubject       ? { backgroundColor: C.teal, flex: 2 }
                : i < activeIdx              ? { backgroundColor: C.tealBorder }
                :                              { backgroundColor: 'rgba(15,23,42,0.07)' },
              ]}
            />
          ))}
        </View>

        {/* ── Active subject card ── */}
        <Animated.View key={animKey} style={[s.activeCard, isTablet && s.activeCardTablet,{opacity:cardFade}]}>

          {/* Subject name + current level */}
          <View style={[s.activeHeader, isTablet && s.activeHeaderTablet]}>
            <View style={s.activeLeft}>
              <Text style={[s.activeNum, isTablet && s.activeNumTablet,{color:C.muted}]}>{activeIdx + 1} / {subjects.length}</Text>
              <Text style={[s.activeName, isTablet && s.activeNameTablet,{color:C.title}]} numberOfLines={1}>{activeSubject ? subjectLabel(activeSubject) : '—'}</Text>
            </View>
            <View style={[s.activeLevelBadge, isTablet && s.activeLevelBadgeTablet,{backgroundColor:C.tealSoft,borderColor:C.tealBorder}]}>
              <Text style={[s.activeLevelTxt, isTablet && s.activeLevelTxtTablet,{color:C.teal}]}>{getLevelLabel(activeLevel.id)}</Text>
              <Text style={[s.activeLevelDesc, isTablet && s.activeLevelDescTablet,{color:C.muted}]}>{getLevelDesc(activeLevel.id)}</Text>
            </View>
          </View>

          {/* Level buttons */}
          <View style={[s.levelGrid, isTablet && s.levelGridTablet]}>
            {LEVELS.map((lvl, i) => {
              const sel = lvl.id === activeValue;
              return (
                <Animated.View
                  key={lvl.id}
                  style={{
                    flex: 1,
                    opacity: levelAnims[i],
                    transform: [{ translateY: levelAnims[i].interpolate({ inputRange:[0,1], outputRange:[6,0] }) }],
                  }}
                >
                  <TouchableOpacity
                    style={[
                      s.levelBtn,
                      isTablet && s.levelBtnTablet,
                      sel
                        ? { backgroundColor: C.tealSoft, borderColor: C.teal, borderWidth: 1.5,
                            shadowColor: C.teal, shadowOffset:{width:0,height:3}, shadowOpacity:0.18, shadowRadius:8, elevation:4 }
                        : { backgroundColor: C.cardBg, borderColor: C.cardBorder, borderWidth: 1 },
                    ]}
                    onPress={() => setLevel(lvl.id)}
                    activeOpacity={0.82}
                  >
                    {/* Teal top accent on selected */}
                    {sel && (
                      <LinearGradient colors={[C.teal,C.tealDk]} start={{x:0,y:0}} end={{x:1,y:0}} style={s.levelBtnBar}/>
                    )}
                    <Text style={[s.levelBtnLabel, isTablet && s.levelBtnLabelTablet,{color: sel ? C.title : C.sub}]}>{getLevelLabel(lvl.id)}</Text>
                    <Text style={[s.levelBtnDesc, isTablet && s.levelBtnDescTablet, {color: sel ? C.teal   : C.muted}]}>{getLevelDesc(lvl.id)}</Text>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>

        {/* ── Distribution bars ── */}
        <View style={[s.distCard, isTablet && s.distCardTablet,{backgroundColor:C.cardBg,borderColor:C.cardBorder}]}>
          <Text style={[s.distTitle, isTablet && s.distTitleTablet,{color:C.muted}]}>
            {t('onboarding.focus.all_subjects', { lang, fallback: 'All subjects' })}
          </Text>
          <View style={s.distList}>
            {subjects.map(subj => {
              const lvl  = subjectIntensity[subj] ?? 1;
              const fill = LEVELS.find(l => l.id === lvl)?.fill ?? 0.5;
              const isAct = subj === activeSubject;
              return (
                <View key={subj} style={[s.distRow, isTablet && s.distRowTablet]}>
                  <Text style={[s.distLabel, isTablet && s.distLabelTablet,{color: isAct ? C.title : C.sub, fontWeight: isAct ? '700' : '400'}]} numberOfLines={1}>
                    {subjectLabel(subj)}
                  </Text>
                  <View style={[s.distTrack,{backgroundColor:'rgba(13,148,136,0.08)'}]}>
                    <Animated.View
                      style={[
                        s.distFill,
                        { width: `${fill * 100}%`, backgroundColor: isAct ? C.teal : C.tealBorder },
                      ]}
                    />
                  </View>
                  <Text style={[s.distLvlTxt, isTablet && s.distLvlTxtTablet,{color: isAct ? C.teal : C.muted}]}>
                    {getLevelLabel(lvl)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={[s.bottomInsights, isTablet && s.bottomInsightsTablet]}>
          <View style={[s.insightCard, isTablet && s.insightCardTablet,{backgroundColor:C.cardBg,borderColor:C.cardBorder}]}>
            <Text style={[s.insightLabel, isTablet && s.insightLabelTablet,{color:C.muted}]}>
              {t('onboarding.focus.coverage', { lang, fallback: 'Coverage' })}
            </Text>
            <Text style={[s.insightValue, isTablet && s.insightValueTablet,{color:C.title}]}>
              {configuredCount}/{subjects.length}
            </Text>
          </View>
          <View style={[s.insightCard, isTablet && s.insightCardTablet,{backgroundColor:C.cardBg,borderColor:C.cardBorder}]}>
            <Text style={[s.insightLabel, isTablet && s.insightLabelTablet,{color:C.muted}]}>
              {t('onboarding.focus.avg_pressure', { lang, fallback: 'Avg pressure' })}
            </Text>
            <Text style={[s.insightValue, isTablet && s.insightValueTablet,{color:C.teal}]}>{avgLevel}/3</Text>
          </View>
        </View>
        <Text style={[s.bottomHint, isTablet && s.bottomHintTablet,{color:C.muted}]}>
          {t('onboarding.focus.bottom_hint', {
            lang,
            fallback: 'Tap Continue to move through each subject and finalize your focus.',
          })}
        </Text>

      </Animated.View>

      {/* Footer */}
      <Animated.View style={[s.footer, isTablet && s.footerTablet,{backgroundColor:C.footer,borderTopColor:C.footerBorder,opacity:ctaFade}]}>
        <Animated.View style={{transform:[{scale:ctaScale}]}}>
          <TouchableOpacity style={[s.cta, isTablet && s.ctaTablet]} onPress={handleContinue} onPressIn={pressIn} onPressOut={pressOut} activeOpacity={1}>
            <LinearGradient colors={[C.teal,C.tealDk]} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFill}/>
            <View style={s.ctaSheen}/>
            <Text style={[s.ctaTxt, isTablet && s.ctaTxtTablet]}>
              {isLastSubj
                ? t('common.continue', { lang })
                : t('onboarding.focus.next_subject', {
                    lang,
                    params: { subject: subjectLabel(subjects[activeIdx + 1]) },
                    fallback: `Next: ${subjectLabel(subjects[activeIdx + 1])}`,
                  })}
            </Text>
            <Text style={[s.ctaArrow, isTablet && s.ctaArrowTablet]}>→</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:{ flex:1, backgroundColor:'#F0FDFB' },
  orbA:{ position:'absolute', width:260, height:260, borderRadius:999, top:-80, right:-100 },
  orbB:{ position:'absolute', width:160, height:160, borderRadius:999, bottom:200, left:-70 },
  inner:{ flex:1, paddingHorizontal:22, paddingTop:10, paddingBottom:96 },
  innerTablet:{paddingHorizontal:36,paddingTop:20,paddingBottom:126,maxWidth:1100,width:'100%',alignSelf:'center'},

  headerRow:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 },
  headerRowTablet:{marginBottom:18},
  backBtn:{ width:36, height:36, borderRadius:11, borderWidth:1, justifyContent:'center', alignItems:'center' },
  backBtnTablet:{width:48,height:48,borderRadius:14},
  backArrowTxt:{ fontSize:26, fontWeight:'300', lineHeight:30, marginTop:-1 },
  backArrowTxtTablet:{fontSize:32,lineHeight:36},
  brandRow:{ flexDirection:'row', alignItems:'center', gap:6 },
  brandMark:{ width:7, height:7, borderRadius:2 },
  brandTxt:{ fontSize:14, fontWeight:'800', letterSpacing:0.4 },
  brandTxtTablet:{fontSize:18},

  progressTrack:{ height:3, borderRadius:99, overflow:'hidden', marginBottom:6 },
  progressFill:{ height:'100%', borderRadius:99, overflow:'hidden' },
  progressSheen:{ position:'absolute', top:0, left:0, right:0, height:'50%', backgroundColor:'rgba(255,255,255,0.28)' },
  stepLabel:{ fontSize:10, fontWeight:'600', letterSpacing:0.8, textTransform:'uppercase', marginBottom:12, opacity:0.65 },
  stepLabelTablet:{fontSize:13,marginBottom:18},

  titleRow:{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom:13 },
  titleRowTablet:{marginBottom:18},
  title:{ fontSize:26, fontWeight:'900', letterSpacing:-0.6 },
  titleTablet:{fontSize:44,lineHeight:48,maxWidth:520},
  sub:{ fontSize:12, fontWeight:'400', marginTop:3 },
  subTablet:{fontSize:17,marginTop:6},
  presetRow:{ gap:5 },
  presetRowTablet:{gap:8},
  presetBtn:{ borderWidth:1, borderRadius:8, paddingHorizontal:9, paddingVertical:5 },
  presetBtnTablet:{borderRadius:12,paddingHorizontal:14,paddingVertical:9},
  presetTxt:{ fontSize:10, fontWeight:'700' },
  presetTxtTablet:{fontSize:13},

  // Subject scroll
  subjectScroll:{ gap:7, paddingBottom:2, marginBottom:10 },
  subjectRowStatic:{ flexDirection:'row', gap:7, marginBottom:10 },
  subjectRowStaticTablet:{gap:8,marginBottom:14,flexWrap:'nowrap',justifyContent:'space-between'},
  subjectChip:{
    flexDirection:'row', alignItems:'center', gap:5,
    borderWidth:1, borderRadius:20,
    paddingHorizontal:12, paddingVertical:7,
  },
  subjectChipTablet:{paddingHorizontal:10,paddingVertical:14,borderRadius:24,minHeight:64,justifyContent:'center'},
  subjectChipNum:{ fontSize:9, fontWeight:'700' },
  subjectChipNumTablet:{fontSize:11},
  subjectChipTxt:{ flexShrink:1, fontSize:12, fontWeight:'700' },
  subjectChipTxtTablet:{fontSize:16},
  subjectChipLvl:{ fontSize:9, fontWeight:'600' },
  subjectChipLvlTablet:{fontSize:11},

  // Pips
  pips:{ flexDirection:'row', gap:4, marginBottom:12 },
  pipsTablet:{gap:6,marginBottom:16},
  pip:{ flex:1, height:2.5, borderRadius:99 },

  // Active card
  activeCard:{ marginBottom:12, gap:11 },
  activeCardTablet:{marginBottom:16,gap:16},
  activeHeader:{ flexDirection:'row', alignItems:'flex-start', justifyContent:'space-between', gap:12 },
  activeHeaderTablet:{gap:16},
  activeLeft:{ flex:1, gap:2 },
  activeNum:{ fontSize:10, fontWeight:'600', letterSpacing:0.4, textTransform:'uppercase' },
  activeNumTablet:{fontSize:13},
  activeName:{ fontSize:22, fontWeight:'900', letterSpacing:-0.5 },
  activeNameTablet:{fontSize:34,lineHeight:38},
  activeLevelBadge:{ borderWidth:1, borderRadius:12, paddingHorizontal:11, paddingVertical:7, alignItems:'flex-end', gap:1 },
  activeLevelBadgeTablet:{borderRadius:16,paddingHorizontal:14,paddingVertical:10},
  activeLevelTxt:{ fontSize:13, fontWeight:'800' },
  activeLevelTxtTablet:{fontSize:17},
  activeLevelDesc:{ fontSize:10, fontWeight:'400' },
  activeLevelDescTablet:{fontSize:12},

  // Level grid
  levelGrid:{ flexDirection:'row', gap:8 },
  levelGridTablet:{gap:12},
  levelBtn:{
    minHeight:84,
    borderRadius:14, paddingVertical:13, paddingHorizontal:7,
    alignItems:'center', gap:4, overflow:'hidden',
  },
  levelBtnTablet:{minHeight:112,borderRadius:18,paddingVertical:18,paddingHorizontal:12},
  levelBtnBar:{ position:'absolute', top:0, left:0, right:0, height:2 },
  levelBtnLabel:{ fontSize:13, fontWeight:'800', letterSpacing:-0.1 },
  levelBtnLabelTablet:{fontSize:18},
  levelBtnDesc:{ fontSize:10, fontWeight:'500', textAlign:'center', letterSpacing:0.1 },
  levelBtnDescTablet:{fontSize:13,lineHeight:18},

  // Distribution
  distCard:{ marginTop:8, borderWidth:1, borderRadius:14, padding:14, gap:9 },
  distCardTablet:{marginTop:12,borderRadius:18,padding:18,gap:12},
  distTitle:{ fontSize:10, fontWeight:'600', letterSpacing:0.7, textTransform:'uppercase' },
  distTitleTablet:{fontSize:13},
  distList:{ gap:7 },
  distRow:{ flexDirection:'row', alignItems:'center', gap:8 },
  distRowTablet:{gap:12},
  distLabel:{ width:74, fontSize:11 },
  distLabelTablet:{width:124,fontSize:16},
  distTrack:{ flex:1, height:5, borderRadius:99, overflow:'hidden' },
  distFill:{ height:'100%', borderRadius:99 },
  distLvlTxt:{ width:52, fontSize:10, fontWeight:'600', textAlign:'right' },
  distLvlTxtTablet:{width:82,fontSize:13},
  bottomInsights:{ flexDirection:'row', gap:8, marginTop:8 },
  bottomInsightsTablet:{gap:12,marginTop:12},
  insightCard:{ flex:1, borderWidth:1, borderRadius:12, paddingVertical:10, paddingHorizontal:11 },
  insightCardTablet:{borderRadius:16,paddingVertical:14,paddingHorizontal:16},
  insightLabel:{ fontSize:10, fontWeight:'600', letterSpacing:0.5, textTransform:'uppercase' },
  insightLabelTablet:{fontSize:12},
  insightValue:{ marginTop:4, fontSize:17, fontWeight:'900', letterSpacing:-0.2 },
  insightValueTablet:{fontSize:24},
  bottomHint:{ marginTop:8, fontSize:11, lineHeight:15, textAlign:'center' },
  bottomHintTablet:{marginTop:12,fontSize:14,lineHeight:20},

  // Footer
  footer:{ position:'absolute', left:0, right:0, bottom:0, paddingHorizontal:22, paddingTop:6, paddingBottom:36, borderTopWidth:StyleSheet.hairlineWidth, backgroundColor:C.footer, borderTopColor:C.footerBorder },
  footerTablet:{paddingHorizontal:36,paddingTop:16,paddingBottom:42},
  cta:{ height:FOOTER.ctaHeight, borderRadius:FOOTER.ctaRadius, flexDirection:'row', alignItems:'center', justifyContent:'center',
    overflow:'hidden', gap:8, shadowColor:'#0D9488', shadowOffset:{width:0,height:5}, shadowOpacity:0.24, shadowRadius:14, elevation:7 },
  ctaTablet:{height:68,borderRadius:20},
  ctaSheen:{ position:'absolute', top:0, left:0, right:0, height:'44%', backgroundColor:'rgba(255,255,255,0.13)' },
  ctaTxt:{ color:'#fff', fontSize:15, fontWeight:'800', letterSpacing:0.1 },
  ctaTxtTablet:{fontSize:22},
  ctaArrow:{ color:'rgba(255,255,255,0.72)', fontSize:16 },
  ctaArrowTablet:{fontSize:22},
});
