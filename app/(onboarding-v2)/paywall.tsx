/**
 * paywall.tsx — "Unlock Full Execution"
 *
 * Dark ink variant. Bold, confident, conversion-focused.
 *
 * Layout:
 * - Large headline anchored to the plan context (exam + target)
 * - 4 feature rows with teal left accent — each shows what premium does
 * - Social proof strip: rating + review count
 * - Price row: trial CTA dominant, skip link below
 * - Trust line at bottom
 */
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
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
import { getCountryByCode } from '@/app/data/countries';
import { resolveAppLanguage, t } from '@/app/i18n';
import { getLocalizedExamName } from '@/app/i18n/examNames';
import {
  trackOnboardingStepBack,
  trackOnboardingStepView,
  trackOnboardingV2Event,
} from '@/app/utils/onboardingV2Analytics';
import { getSubscriptionOfferings, initializeRevenueCat } from '@/app/utils/subscriptionManager';

// ── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg0:'#080C0B', bg1:'#0C1210', bg2:'#0F1A18', bg3:'#080C0B',
  orbA:'rgba(20,184,166,0.22)', orbB:'rgba(52,211,153,0.12)',
  grid:'rgba(255,255,255,0.025)',
  title:'#ECFDF5', sub:'rgba(167,243,208,0.60)',
  muted:'rgba(148,163,184,0.55)',
  labelMuted:'rgba(45,212,191,0.38)',
  teal:'#2DD4BF', tealDk:'#14B8A6', tealDk2:'#0F9D8C',
  tealSoft:'rgba(45,212,191,0.10)', tealBorder:'rgba(45,212,191,0.20)',
  green:'#34D399', greenSoft:'rgba(52,211,153,0.12)', greenBorder:'rgba(52,211,153,0.22)',
  gold:'#FBBF24',
  cardBg:'rgba(255,255,255,0.04)', cardBorder:'rgba(255,255,255,0.08)',
  backBg:'rgba(255,255,255,0.07)', backBorder:'rgba(255,255,255,0.09)',
  backArrow:'rgba(167,243,208,0.65)', brand:'#2DD4BF',
  footer:'rgba(8,12,11,0.96)', footerBorder:'rgba(45,212,191,0.10)',
};

const variant = (process.env.EXPO_PUBLIC_PAYWALL_VARIANT || 'default_v1') as string;

const FEATURES = [
  {
    id: 'adaptive',
  },
  {
    id: 'weak_boost',
  },
  {
    id: 'rhythm',
  },
  {
    id: 'momentum',
  },
] as const;

export default function OnboardingV2PaywallScreen() {
  const { draft } = useOnboardingV2();
  const { width, height } = useWindowDimensions();
  const isNarrow = width <= 390;
  const isTight = height <= 850;
  const lang = resolveAppLanguage({
    countryDefaultLanguage: getCountryByCode(draft.countryCode)?.defaultLanguage ?? null,
  });

  const hasExam = Boolean(draft.examId || draft.examName);
  const examLabel = hasExam
    ? getLocalizedExamName(draft.examId, lang, draft.examName)
    : t('onboarding.paywall.exam_generic', { lang, fallback: 'your exam' });
  const targetLabel = draft.targetScore?.trim() ? draft.targetScore : null;
  const examHeadline = !hasExam
    ? t('onboarding.paywall.headline_generic', { lang, fallback: 'Your exam plan is ready.' })
    : t('onboarding.paywall.headline_with_exam', {
        lang,
        params: { exam: `${examLabel}${targetLabel ? ` · ${targetLabel}` : ''}` },
        fallback: `Your ${examLabel}${targetLabel ? ` · ${targetLabel}` : ''} plan is ready.`,
      });
  const localizedFeatures = FEATURES.map((feature) => ({
    id: feature.id,
    title: t(`onboarding.paywall.feature_${feature.id}_title`, {
      lang,
      fallback: feature.id,
    }),
    desc: t(`onboarding.paywall.feature_${feature.id}_desc`, {
      lang,
      fallback: feature.id,
    }),
  }));
  const [priceLine, setPriceLine] = useState<string | null>(null);

  const fallbackPriceLine = useMemo(
    () => t('onboarding.paywall.price_line', {
      lang,
      fallback: lang === 'tr' ? 'Sonra abonelik devam eder · İstediğin zaman iptal' : 'Then subscription continues · Cancel anytime',
    }),
    [lang]
  );

  useEffect(() => {
    void trackOnboardingStepView('paywall');
    void trackOnboardingV2Event('paywall_view', { step_id:'paywall', variant_id:variant });
    void (async () => {
      try {
        const ok = await initializeRevenueCat();
        if (!ok) return;
        const offering = await getSubscriptionOfferings();
        const monthly = offering?.availablePackages.find((pkg) => pkg.packageType === 'MONTHLY') ?? null;
        if (!monthly) return;
        setPriceLine(
          lang === 'tr'
            ? `Sonra ${monthly.product.priceString}/ay · İstediğin zaman iptal`
            : `Then ${monthly.product.priceString}/month · Cancel anytime`
        );
      } catch {}
    })();
  }, [lang]);

  const entrance = useRef(new Animated.Value(0)).current;
  const ctaScale = useRef(new Animated.Value(1)).current;
  const rowAnims = useRef(FEATURES.map(() => new Animated.Value(0))).current;
  const orbPulse = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.timing(entrance, { toValue:1, duration:440, useNativeDriver:true }).start();
    FEATURES.forEach((_, i) =>
      Animated.timing(rowAnims[i], { toValue:1, duration:280, delay:300+i*70, useNativeDriver:true }).start()
    );
    Animated.loop(
      Animated.sequence([
        Animated.timing(orbPulse, { toValue:1.12, duration:4200, useNativeDriver:true }),
        Animated.timing(orbPulse, { toValue:0.92, duration:4200, useNativeDriver:true }),
      ])
    ).start();
  // Mount-only entrance/orb loop animations; refs are stable.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStartTrial = () => {
    void trackOnboardingV2Event('purchase_start', { step_id:'paywall', variant_id:variant });
    router.replace(`/(onboarding-v2)/subscription?source=onboarding_v2&entry_step=paywall&variant_id=${variant}`);
  };

  const pressIn  = () => Animated.spring(ctaScale, { toValue:0.97, damping:20, stiffness:400, useNativeDriver:true }).start();
  const pressOut = () => Animated.spring(ctaScale, { toValue:1,    damping:18, stiffness:360, useNativeDriver:true }).start();

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent"/>
      <LinearGradient colors={[C.bg0,C.bg1,C.bg2,C.bg3]} locations={[0,0.3,0.65,1]} style={StyleSheet.absoluteFill}/>

      {/* Breathing orbs */}
      <Animated.View style={[s.orbA, { backgroundColor:C.orbA, transform:[{scale:orbPulse}] }]}/>
      <View style={[s.orbB, { backgroundColor:C.orbB }]}/>

      {/* Grid */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {[0,1,2,3,4,5].map(i=><View key={i} style={{position:'absolute',top:0,bottom:0,left:`${i*20}%`,width:StyleSheet.hairlineWidth,backgroundColor:C.grid}}/>)}
        {[0,1,2,3,4,5,6].map(i=><View key={i} style={{position:'absolute',left:0,right:0,top:`${i*15}%`,height:StyleSheet.hairlineWidth,backgroundColor:C.grid}}/>)}
      </View>

      <Animated.View style={[s.inner, (isNarrow || isTight) && s.innerTight, { opacity:entrance }]}>

        {/* Header */}
        <View style={s.headerRow}>
          <TouchableOpacity style={[s.backBtn,{backgroundColor:C.backBg,borderColor:C.backBorder}]} onPress={()=>{void trackOnboardingStepBack('paywall');router.back();}} activeOpacity={0.7}>
            <Text style={[s.backArrowTxt,{color:C.backArrow}]}>‹</Text>
          </TouchableOpacity>
          <View style={s.brandRow}>
            <View style={[s.brandMark,{backgroundColor:C.brand}]}/>
            <Text style={[s.brandTxt,{color:C.brand}]}>StudyMap</Text>
          </View>
          {/* Free trial badge top-right */}
          <View style={[s.freeBadge,{backgroundColor:C.greenSoft,borderColor:C.greenBorder}]}>
            <Text style={[s.freeBadgeTxt,{color:C.green}]} numberOfLines={1}>
              {t('onboarding.paywall.free_trial_badge', { lang, fallback: '7 days free' })}
            </Text>
          </View>
        </View>

        {/* Progress */}
        <View style={[s.progressTrack,{backgroundColor:C.tealSoft}]}>
          <View style={[s.progressFill,{width:'95%'}]}>
            <LinearGradient colors={[C.tealDk,C.tealDk2]} start={{x:0,y:0}} end={{x:1,y:0}} style={StyleSheet.absoluteFill}/>
            <View style={s.progressSheen}/>
          </View>
        </View>
        <Text style={[s.stepLabel,{color:C.labelMuted}]}>
          {t('common.step_of', { lang, params: { current: 11, total: 12 } })}
        </Text>

        {/* ── Hero headline ── */}
        <View style={[s.heroSection, isNarrow && s.heroSectionNarrow]}>
          <Text style={[s.eyebrow,{color:C.teal}]}>
            {examHeadline}
          </Text>
          <Text style={[s.headline,{color:C.title}, isNarrow && s.headlineNarrow]}>
            {t('onboarding.paywall.title_line_1', { lang, fallback: 'Now make it' })}{'\n'}
            <Text style={{color:C.teal}}>
              {t('onboarding.paywall.title_line_2', { lang, fallback: 'stick.' })}
            </Text>
          </Text>
          <Text style={[s.heroSub,{color:C.sub}]}>
            {t('onboarding.paywall.subtitle', {
              lang,
              fallback: 'Premium keeps your plan sharp - adapting each week as you progress.',
            })}
          </Text>
        </View>

        {/* ── Feature rows ── */}
        <View style={s.featureList}>
          {localizedFeatures.map((feat, i) => (
            <Animated.View
              key={feat.id}
              style={{
                opacity: rowAnims[i],
                transform:[{ translateX: rowAnims[i].interpolate({ inputRange:[0,1], outputRange:[12,0] }) }],
              }}
            >
              <View style={[s.featureRow,{backgroundColor:C.cardBg,borderColor:C.cardBorder}]}>
                {/* Teal left rail */}
                <LinearGradient colors={[C.tealDk,C.tealDk2]} start={{x:0,y:0}} end={{x:0,y:1}} style={s.featureRail}/>
                <View style={s.featureBody}>
                  <Text style={[s.featureTitle,{color:C.title}]} numberOfLines={2}>{feat.title}</Text>
                  <Text style={[s.featureDesc,{color:C.muted}]} numberOfLines={2}>{feat.desc}</Text>
                </View>
                <View style={[s.featureCheck,{backgroundColor:C.tealSoft,borderColor:C.tealBorder}]}>
                  <Text style={[s.featureCheckTxt,{color:C.teal}]}>✓</Text>
                </View>
              </View>
            </Animated.View>
          ))}
        </View>

        {/* ── Social proof ── */}
        <View style={[s.proofRow,{backgroundColor:C.cardBg,borderColor:C.cardBorder}]}>
          <View style={s.stars}>
            {[0,1,2,3,4].map(i=>(
              <Text key={i} style={[s.star,{color:C.gold}]}>★</Text>
            ))}
          </View>
          <Text style={[s.proofTxt,{color:C.sub}]}>
            <Text style={{color:C.title,fontWeight:'800'}}>4.9</Text>
            {'  '}·{'  '}
            <Text style={{color:C.title,fontWeight:'700'}}>12,400+</Text>{' '}
            {t('onboarding.paywall.social_proof', { lang, fallback: 'students reached their target' })}
          </Text>
        </View>

      </Animated.View>

      {/* ── Footer ── */}
      <View style={[s.footer, (isNarrow || isTight) && s.footerTight, {backgroundColor:C.footer,borderTopColor:C.footerBorder}]}>

        {/* Price context */}
        <View style={[s.priceRow, isNarrow && s.priceRowNarrow]}>
          <Text style={[s.priceThen,{color:C.muted}]}>
            {priceLine || fallbackPriceLine}
          </Text>
          <Text style={[s.priceFree,{color:C.green}]}>
            {t('onboarding.paywall.free_trial_badge', { lang, fallback: '7 days free' })}
          </Text>
        </View>

        {/* Primary CTA */}
        <Animated.View style={{transform:[{scale:ctaScale}]}}>
          <TouchableOpacity style={s.cta} onPress={handleStartTrial} onPressIn={pressIn} onPressOut={pressOut} activeOpacity={1}>
            <LinearGradient colors={[C.tealDk,C.tealDk2]} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFill}/>
            <View style={s.ctaSheen}/>
            <Text style={s.ctaTxt} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.86}>
              {t('onboarding.paywall.start_trial', { lang, fallback: 'Start Free Trial' })}
            </Text>
            <Text style={s.ctaArrow}>→</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Trust */}
        <Text style={[s.trust,{color:C.labelMuted}]} numberOfLines={2}>
          {t('onboarding.paywall.trust', { lang, fallback: 'Secure billing · Restore purchases anytime' })}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:{ flex:1, backgroundColor:'#080C0B' },
  orbA:{ position:'absolute', width:320, height:320, borderRadius:999, top:-100, right:-130 },
  orbB:{ position:'absolute', width:200, height:200, borderRadius:999, bottom:220, left:-90 },
  inner:{ flex:1, paddingHorizontal:22, paddingTop:8, paddingBottom:220 },
  innerTight:{ paddingTop:4, paddingBottom:206 },

  headerRow:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:10 },
  backBtn:{ width:36, height:36, borderRadius:11, borderWidth:1, justifyContent:'center', alignItems:'center' },
  backArrowTxt:{ fontSize:26, fontWeight:'300', lineHeight:30, marginTop:-1 },
  brandRow:{ flexDirection:'row', alignItems:'center', gap:6 },
  brandMark:{ width:7, height:7, borderRadius:2 },
  brandTxt:{ fontSize:14, fontWeight:'800', letterSpacing:0.4 },
  freeBadge:{ borderWidth:1, borderRadius:99, paddingHorizontal:10, paddingVertical:5 },
  freeBadgeTxt:{ fontSize:11, fontWeight:'700' },

  progressTrack:{ height:3, borderRadius:99, overflow:'hidden', marginBottom:6 },
  progressFill:{ height:'100%', borderRadius:99, overflow:'hidden' },
  progressSheen:{ position:'absolute', top:0, left:0, right:0, height:'50%', backgroundColor:'rgba(255,255,255,0.20)' },
  stepLabel:{ fontSize:10, fontWeight:'600', letterSpacing:0.8, textTransform:'uppercase', marginBottom:10, opacity:0.65 },

  // Hero
  heroSection:{ gap:4, marginBottom:14 },
  heroSectionNarrow:{ marginBottom:10 },
  eyebrow:{ fontSize:11, fontWeight:'600', letterSpacing:0.2 },
  headline:{ fontSize:34, fontWeight:'900', lineHeight:39, letterSpacing:-1 },
  headlineNarrow:{ fontSize:32, lineHeight:36 },
  heroSub:{ fontSize:12, lineHeight:17, fontWeight:'400' },

  // Features
  featureList:{ gap:7, marginBottom:10 },
  featureRow:{
    flexDirection:'row', alignItems:'center',
    borderWidth:1, borderRadius:13, overflow:'hidden',
    paddingRight:10, paddingVertical:10,
  },
  featureRail:{ width:3, alignSelf:'stretch', marginRight:11 },
  featureBody:{ flex:1, gap:3 },
  featureTitle:{ fontSize:13, fontWeight:'700', letterSpacing:-0.1 },
  featureDesc:{ fontSize:10, fontWeight:'400', lineHeight:14 },
  featureCheck:{ width:24, height:24, borderRadius:8, borderWidth:1, alignItems:'center', justifyContent:'center' },
  featureCheckTxt:{ fontSize:12, fontWeight:'700' },

  // Proof
  proofRow:{
    flexDirection:'row', alignItems:'center', gap:10,
    borderWidth:1, borderRadius:12,
    paddingHorizontal:12, paddingVertical:9,
  },
  stars:{ flexDirection:'row', gap:1 },
  star:{ fontSize:11 },
  proofTxt:{ flex:1, fontSize:11, fontWeight:'400' },

  // Footer
  footer:{
    position:'absolute', left:0, right:0, bottom:0,
    paddingHorizontal:22, paddingTop:10, paddingBottom:22,
    borderTopWidth:StyleSheet.hairlineWidth, gap:8,
  },
  footerTight:{ paddingTop:8, paddingBottom:16, gap:6 },
  priceRow:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', gap:8 },
  priceRowNarrow:{ alignItems:'flex-start' },
  priceThen:{ fontSize:10, fontWeight:'400', flex:1 },
  priceFree:{ fontSize:11, fontWeight:'700', flexShrink:1, textAlign:'right' },

  cta:{ height:52, borderRadius:13, flexDirection:'row', alignItems:'center', justifyContent:'center',
    overflow:'hidden', gap:8, shadowColor:'#14B8A6', shadowOffset:{width:0,height:8},
    shadowOpacity:0.36, shadowRadius:20, elevation:10 },
  ctaSheen:{ position:'absolute', top:0, left:0, right:0, height:'44%', backgroundColor:'rgba(255,255,255,0.11)' },
  ctaTxt:{ color:'#fff', fontSize:16, fontWeight:'800', letterSpacing:0.1, flexShrink:1, textAlign:'center' },
  ctaArrow:{ color:'rgba(255,255,255,0.72)', fontSize:17 },

  trust:{ textAlign:'center', fontSize:9, fontWeight:'400', letterSpacing:0.2 },
});
