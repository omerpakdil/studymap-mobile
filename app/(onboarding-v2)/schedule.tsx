/**
 * schedule.tsx — "Map Your Real Week"
 *
 * Light slate. Compact.
 * Days: full name in a horizontal segmented control — active = teal pill,
 *       configured = teal outline + count dot, empty = plain.
 * Slots: clean rows, single teal accent throughout.
 *        No colored rails, no multi-color theming.
 */
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
import {
    trackOnboardingStepBack,
    trackOnboardingStepContinue,
    trackOnboardingStepValidationFail,
    trackOnboardingStepView,
} from '@/app/utils/onboardingV2Analytics';

const C = {
  bg0: '#FAFBFC', bg1: '#F4F6F8', bg2: '#EEF1F4', bg3: '#F8FAFB',
  orbA: 'rgba(15,157,140,0.09)', orbB: 'rgba(100,116,139,0.06)',
  grid: 'rgba(0,0,0,0.028)',
  title:  '#0F172A',
  sub:    '#64748B',
  muted:  '#94A3B8',
  teal:   '#0F9D8C',
  tealDk: '#0B7A6E',
  tealSoft:   'rgba(15,157,140,0.09)',
  tealBorder: 'rgba(15,157,140,0.22)',
  labelMuted: 'rgba(15,157,140,0.40)',
  cardBg:     '#FFFFFF',
  cardBorder: 'rgba(15,23,42,0.07)',
  backBg:     'rgba(0,0,0,0.04)',
  backBorder: 'rgba(0,0,0,0.06)',
  backArrow:  '#64748B',
  brand:      '#0F9D8C',
  footer:     'transparent',
  footerBorder: 'rgba(15,23,42,0.07)',
};

const DAYS = [
  { id: 'monday' },
  { id: 'tuesday' },
  { id: 'wednesday' },
  { id: 'thursday' },
  { id: 'friday' },
  { id: 'saturday' },
  { id: 'sunday' },
] as const;
type DayId = typeof DAYS[number]['id'];

const SLOTS = [
  { id: 'early_morning', time: '06:00 – 09:00' },
  { id: 'morning', time: '09:00 – 12:00' },
  { id: 'afternoon', time: '12:00 – 17:00' },
  { id: 'evening', time: '17:00 – 21:00' },
  { id: 'night', time: '21:00 – 00:00' },
] as const;
type SlotId = typeof SLOTS[number]['id'];

export default function OnboardingV2ScheduleScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const { showAlert } = useAppAlert();
  const { draft, updateDraft } = useOnboardingV2();
  const lang = resolveAppLanguage({
    countryDefaultLanguage: getCountryByCode(draft.countryCode)?.defaultLanguage ?? null,
  });
  const [activeDay, setActiveDay] = useState<DayId>('monday');
  const [animKey, setAnimKey] = useState(0);
  const didClearDefaults = useRef(false);

  const entrance  = useRef(new Animated.Value(0)).current;
  const ctaFade   = useRef(new Animated.Value(0)).current;
  const ctaScale  = useRef(new Animated.Value(1)).current;
  const listFade  = useRef(new Animated.Value(1)).current;
  const slotAnims = useRef(SLOTS.map(() => new Animated.Value(0))).current;
  const dayScrollRef = useRef<ScrollView>(null);

  useEffect(() => { void trackOnboardingStepView('schedule'); }, []);
  useEffect(() => {
    Animated.timing(entrance, { toValue: 1, duration: 380, useNativeDriver: true }).start();
    Animated.timing(ctaFade,  { toValue: 1, duration: 380, delay: 200, useNativeDriver: true }).start();
    fireSlots();
  // Mount-only entrance/slot animations; refs are stable.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fireSlots = () => {
    slotAnims.forEach(a => a.setValue(0));
    slotAnims.forEach((a, i) =>
      Animated.timing(a, { toValue: 1, duration: 200, delay: i * 40, useNativeDriver: true }).start()
    );
  };

  const schedule  = useMemo(() => draft.weeklyAvailability || {}, [draft.weeklyAvailability]);
  const daySlots  = (schedule[activeDay] || []) as SlotId[];
  const dayIdx    = DAYS.findIndex(d => d.id === activeDay);
  const isLastDay = dayIdx === DAYS.length - 1;

  useEffect(() => {
    if (didClearDefaults.current) return;
    if (draft.scheduleTouched) return;
    const hasPrefilled = Object.values(schedule).some((v) => Array.isArray(v) && v.length > 0);
    if (!hasPrefilled) return;
    didClearDefaults.current = true;
    updateDraft({ weeklyAvailability: {}, scheduleTouched: false });
  }, [draft.scheduleTouched, schedule, updateDraft]);

  const configuredDays = useMemo(
    () => Object.values(schedule).filter(v => v?.length > 0).length,
    [schedule]
  );
  const getDayLabel = (day: DayId) =>
    t(`onboarding.schedule.day.${day}`, { lang, fallback: day });
  const getSlotLabel = (slot: SlotId) =>
    t(`onboarding.schedule.slot.${slot}`, { lang, fallback: slot });

  const changeDay = (id: DayId, idx: number) => {
    Animated.timing(listFade, { toValue: 0, duration: 60, useNativeDriver: true }).start(() => {
      setActiveDay(id);
      setAnimKey(k => k + 1);
      Animated.timing(listFade, { toValue: 1, duration: 140, useNativeDriver: true }).start();
      fireSlots();
      // Scroll active day into view
      dayScrollRef.current?.scrollTo({ x: Math.max(0, idx - 1) * 88, animated: true });
    });
  };

  const toggle = (slotId: SlotId) => {
    const next = daySlots.includes(slotId)
      ? daySlots.filter(s => s !== slotId)
      : [...daySlots, slotId];
    updateDraft({ weeklyAvailability: { ...schedule, [activeDay]: next }, scheduleTouched: true });
  };

  const applyTemplate = (tpl: 'weekday' | 'balanced') => {
    const next: Record<string, string[]> = {};
    DAYS.forEach(d => {
      if (tpl === 'weekday')
        next[d.id] = ['monday','tuesday','wednesday','thursday','friday'].includes(d.id) ? ['evening'] : [];
      else {
        if (['monday','wednesday','friday'].includes(d.id))  next[d.id] = ['evening'];
        else if (['tuesday','thursday'].includes(d.id))      next[d.id] = ['morning'];
        else                                                  next[d.id] = ['afternoon'];
      }
    });
    updateDraft({ weeklyAvailability: next, scheduleTouched: true });
  };

  const handleContinue = () => {
    if (!isLastDay) { changeDay(DAYS[dayIdx + 1].id, dayIdx + 1); return; }
    if (configuredDays < 2) {
      void trackOnboardingStepValidationFail('schedule', ['weeklyAvailability'], 'Min 2 days');
      showAlert(
        t('onboarding.schedule.alert_title', { lang, fallback: 'Need More Days' }),
        t('onboarding.schedule.alert_body', { lang, fallback: 'Please select at least 2 study days.' })
      );
      return;
    }
    void trackOnboardingStepContinue('schedule');
    router.push('/(onboarding-v2)/session-length');
  };

  const pressIn  = () => Animated.spring(ctaScale, { toValue: 0.97, damping: 20, stiffness: 400, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(ctaScale, { toValue: 1,    damping: 18, stiffness: 360, useNativeDriver: true }).start();

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={[C.bg0,C.bg1,C.bg2,C.bg3]} locations={[0,0.35,0.70,1]} style={StyleSheet.absoluteFill}/>
      <View style={[s.orbA, isTablet && s.orbATablet,{backgroundColor:C.orbA}]}/>
      <View style={[s.orbB, isTablet && s.orbBTablet,{backgroundColor:C.orbB}]}/>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {[0,1,2,3,4,5,6].map(i=><View key={i} style={{position:'absolute',top:0,bottom:0,left:`${i*16.6}%`,width:StyleSheet.hairlineWidth,backgroundColor:C.grid}}/>)}
        {[0,1,2,3,4,5,6,7].map(i=><View key={i} style={{position:'absolute',left:0,right:0,top:`${i*12.5}%`,height:StyleSheet.hairlineWidth,backgroundColor:C.grid}}/>)}
      </View>

      <Animated.View style={[s.inner, isTablet && s.innerTablet,{opacity:entrance}]}>

        {/* Header */}
        <View style={s.headerRow}>
          <TouchableOpacity style={[s.backBtn, isTablet && s.backBtnTablet,{backgroundColor:C.backBg,borderColor:C.backBorder}]} onPress={()=>{void trackOnboardingStepBack('schedule');router.back();}} activeOpacity={0.7}>
            <Text style={[s.backArrowTxt, isTablet && s.backArrowTxtTablet,{color:C.backArrow}]}>‹</Text>
          </TouchableOpacity>
          <View style={s.brandRow}>
            <View style={[s.brandMark,{backgroundColor:C.brand}]}/>
            <Text style={[s.brandTxt, isTablet && s.brandTxtTablet,{color:C.brand}]}>StudyMap</Text>
          </View>
          <View style={s.backBtn}/>
        </View>

        {/* Progress */}
        <View style={[s.progressTrack,{backgroundColor:C.tealSoft}]}>
          <View style={[s.progressFill,{width:'54%'}]}>
            <LinearGradient colors={[C.teal,C.tealDk]} start={{x:0,y:0}} end={{x:1,y:0}} style={StyleSheet.absoluteFill}/>
            <View style={s.progressSheen}/>
          </View>
        </View>
        <Text style={[s.stepLabel, isTablet && s.stepLabelTablet,{color:C.labelMuted}]}>
          {t('common.step_of', { lang, params: { current: 6, total: 13 } })}
        </Text>

        {/* Title + quick fill */}
        <View style={[s.titleRow, isTablet && s.titleRowTablet]}>
          <Text style={[s.title, isTablet && s.titleTablet,{color:C.title}]}>
            {t('onboarding.schedule.title', { lang, fallback: 'When are you\navailable?' })}
          </Text>
          <View style={[s.tplCol, isTablet && s.tplColTablet]}>
            <TouchableOpacity style={[s.tplBtn, isTablet && s.tplBtnTablet,{borderColor:C.tealBorder,backgroundColor:C.tealSoft}]} onPress={()=>applyTemplate('weekday')} activeOpacity={0.75}>
              <Text style={[s.tplTxt, isTablet && s.tplTxtTablet,{color:C.teal}]}>
                {t('onboarding.schedule.template_weekday', { lang, fallback: 'Weekday eve' })}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.tplBtn, isTablet && s.tplBtnTablet,{borderColor:C.tealBorder,backgroundColor:C.tealSoft}]} onPress={()=>applyTemplate('balanced')} activeOpacity={0.75}>
              <Text style={[s.tplTxt, isTablet && s.tplTxtTablet,{color:C.teal}]}>
                {t('onboarding.schedule.template_balanced', { lang, fallback: 'Balanced' })}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Day selector ── */}
        {isTablet ? (
          <View style={s.dayGridTablet}>
            {DAYS.map((d, i) => {
              const isActive = d.id === activeDay;
              const count    = (schedule[d.id] || []).length;
              const hasDone  = count > 0;
              return (
                <TouchableOpacity
                  key={d.id}
                  style={[
                    s.dayChip,
                    s.dayChipGridTablet,
                    isActive  ? { backgroundColor: C.teal,     borderColor: C.teal }
                    : hasDone ? { backgroundColor: C.tealSoft, borderColor: C.tealBorder }
                    :           { backgroundColor: C.cardBg,   borderColor: C.cardBorder },
                  ]}
                  onPress={() => changeDay(d.id as DayId, i)}
                  activeOpacity={0.8}
                >
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                    style={[
                      s.dayChipTxt,
                      s.dayChipTxtTablet,
                      { color: isActive ? '#fff' : hasDone ? C.teal : C.sub },
                    ]}
                  >
                    {getDayLabel(d.id)}
                  </Text>
                  {hasDone && (
                    <View style={[
                      s.countBadge,
                      s.countBadgeTablet,
                      { backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : C.tealBorder },
                    ]}>
                      <Text style={[s.countBadgeTxt, s.countBadgeTxtTablet, { color: isActive ? '#fff' : C.teal }]}>
                        {count}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <ScrollView
            ref={dayScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.dayScroll}
          >
            {DAYS.map((d, i) => {
              const isActive = d.id === activeDay;
              const count    = (schedule[d.id] || []).length;
              const hasDone  = count > 0;
              return (
                <TouchableOpacity
                  key={d.id}
                  style={[
                    s.dayChip,
                    isActive  ? { backgroundColor: C.teal,     borderColor: C.teal }
                    : hasDone ? { backgroundColor: C.tealSoft, borderColor: C.tealBorder }
                    :           { backgroundColor: C.cardBg,   borderColor: C.cardBorder },
                  ]}
                  onPress={() => changeDay(d.id as DayId, i)}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    s.dayChipTxt,
                    { color: isActive ? '#fff' : hasDone ? C.teal : C.sub },
                  ]}>
                    {getDayLabel(d.id)}
                  </Text>
                  {hasDone && (
                    <View style={[
                      s.countBadge,
                      { backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : C.tealBorder },
                    ]}>
                      <Text style={[s.countBadgeTxt, { color: isActive ? '#fff' : C.teal }]}>
                        {count}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Week progress pips (non-interactive indicator) */}
        <View style={[s.pips, isTablet && s.pipsTablet]}>
          {DAYS.map(d => (
            <View
              key={d.id}
              style={[
                s.pip,
                d.id === activeDay                    ? { backgroundColor: C.teal, flex: 2 }
                : (schedule[d.id]||[]).length > 0     ? { backgroundColor: C.tealBorder }
                :                                       { backgroundColor: 'rgba(15,23,42,0.07)' },
              ]}
            />
          ))}
        </View>

        {/* Active day label + slot count */}
        <Animated.View style={[s.dayHeader, isTablet && s.dayHeaderTablet,{opacity:listFade}]}>
          <Text style={[s.dayLabel, isTablet && s.dayLabelTablet,{color:C.title}]}>
            {getDayLabel(activeDay)}
          </Text>
          <Text style={[s.dayCount, isTablet && s.dayCountTablet,{color:daySlots.length>0?C.teal:C.muted}]}>
            {daySlots.length > 0
              ? t('onboarding.schedule.slots_selected', {
                  lang,
                  params: { count: daySlots.length },
                  fallback: `${daySlots.length} slots selected`,
                })
              : t('onboarding.schedule.no_slots', { lang, fallback: 'No slots yet' })}
          </Text>
        </Animated.View>

        {/* ── Slot rows ── */}
        <Animated.View key={animKey} style={[s.slotList, isTablet && s.slotListTablet,{opacity:listFade}]}>
          {SLOTS.map((slot,i) => {
            const sel = daySlots.includes(slot.id as SlotId);
            return (
              <Animated.View
                key={slot.id}
                style={{
                  opacity: slotAnims[i],
                  transform:[{translateY: slotAnims[i].interpolate({inputRange:[0,1],outputRange:[5,0]})}],
                }}
              >
                <TouchableOpacity
                  style={[
                    s.slotRow,
                    isTablet && s.slotRowTablet,
                    sel
                      ? { backgroundColor: C.tealSoft, borderColor: C.teal, borderWidth: 1.5,
                          shadowColor: C.teal, shadowOffset:{width:0,height:2}, shadowOpacity:0.12, shadowRadius:8, elevation:3 }
                      : { backgroundColor: C.cardBg, borderColor: C.cardBorder, borderWidth: 1 },
                  ]}
                  onPress={()=>toggle(slot.id as SlotId)}
                  activeOpacity={0.82}
                >
                  <View style={s.slotBody}>
                    <Text style={[s.slotLbl, isTablet && s.slotLblTablet,{color: sel ? C.title : C.sub}]}>
                      {getSlotLabel(slot.id)}
                    </Text>
                    <Text style={[s.slotTime, isTablet && s.slotTimeTablet,{color: sel ? C.teal : C.muted}]}>{slot.time}</Text>
                  </View>
                  <View style={[
                    s.checkbox,
                    isTablet && s.checkboxTablet,
                    sel
                      ? {backgroundColor:C.teal, borderColor:C.teal}
                      : {backgroundColor:'transparent', borderColor:C.cardBorder},
                  ]}>
                    {sel && <Text style={s.checkmark}>✓</Text>}
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </Animated.View>

        <Text style={[s.note, isTablet && s.noteTablet,{color:C.muted}]}>
          {t('onboarding.schedule.configured_days', {
            lang,
            params: { count: configuredDays, total: 7 },
            fallback: `${configuredDays} of 7 days configured`,
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
              {isLastDay
                ? t('common.continue', { lang })
                : t('onboarding.schedule.next_day', {
                    lang,
                    params: { day: getDayLabel(DAYS[dayIdx + 1].id) },
                    fallback: `Next: ${getDayLabel(DAYS[dayIdx + 1].id)}`,
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
  root:{ flex:1, backgroundColor:'#FAFBFC' },
  orbA:{ position:'absolute', width:250, height:250, borderRadius:999, top:-70, right:-90 },
  orbB:{ position:'absolute', width:160, height:160, borderRadius:999, bottom:180, left:-70 },
  orbATablet:{ width:360, height:360, top:-40, right:-60 },
  orbBTablet:{ width:240, height:240, bottom:160, left:-50 },
  inner:{ flex:1, paddingHorizontal:22, paddingTop:10, paddingBottom:110 },
  innerTablet:{ paddingHorizontal:40, paddingTop:18, paddingBottom:144, maxWidth:980, width:'100%', alignSelf:'center', justifyContent:'space-between' },

  headerRow:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 },
  backBtn:{ width:36, height:36, borderRadius:11, borderWidth:1, justifyContent:'center', alignItems:'center' },
  backBtnTablet:{ width:46, height:46, borderRadius:14 },
  backArrowTxt:{ fontSize:26, fontWeight:'300', lineHeight:30, marginTop:-1 },
  backArrowTxtTablet:{ fontSize:30, lineHeight:34 },
  brandRow:{ flexDirection:'row', alignItems:'center', gap:6 },
  brandMark:{ width:7, height:7, borderRadius:2 },
  brandTxt:{ fontSize:14, fontWeight:'800', letterSpacing:0.4 },
  brandTxtTablet:{ fontSize:18 },

  progressTrack:{ height:3, borderRadius:99, overflow:'hidden', marginBottom:6 },
  progressFill:{ height:'100%', borderRadius:99, overflow:'hidden' },
  progressSheen:{ position:'absolute', top:0, left:0, right:0, height:'50%', backgroundColor:'rgba(255,255,255,0.28)' },
  stepLabel:{ fontSize:10, fontWeight:'600', letterSpacing:0.8, textTransform:'uppercase', marginBottom:12, opacity:0.65 },
  stepLabelTablet:{ fontSize:13, marginBottom:16 },

  titleRow:{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 },
  titleRowTablet:{ marginBottom:26, gap:28 },
  title:{ fontSize:27, fontWeight:'900', lineHeight:33, letterSpacing:-0.6 },
  titleTablet:{ fontSize:56, lineHeight:60, maxWidth:560 },
  tplCol:{ gap:5, alignItems:'flex-end' },
  tplColTablet:{ gap:12 },
  tplBtn:{ borderWidth:1, borderRadius:8, paddingHorizontal:10, paddingVertical:5 },
  tplBtnTablet:{ borderRadius:12, paddingHorizontal:16, paddingVertical:9 },
  tplTxt:{ fontSize:10, fontWeight:'700' },
  tplTxtTablet:{ fontSize:14 },

  // Day scroll
  dayScroll:{ gap:7, paddingRight:4, paddingBottom:2, marginBottom:10 },
  dayScrollTablet:{ gap:10, paddingBottom:4, marginBottom:16 },
  dayGridTablet:{ flexDirection:'row', gap:12, marginBottom:18 },
  dayChip:{
    flexDirection:'row', alignItems:'center', gap:6,
    borderWidth:1, borderRadius:20,
    paddingHorizontal:14, paddingVertical:8,
    shadowColor:'#000', shadowOffset:{width:0,height:1}, shadowOpacity:0.04, shadowRadius:3, elevation:1,
  },
  dayChipTablet:{ borderRadius:24, paddingHorizontal:20, paddingVertical:12, gap:8 },
  dayChipGridTablet:{ flex:1, minWidth:0, justifyContent:'center', alignItems:'center', paddingHorizontal:10, paddingVertical:18 },
  dayChipTxt:{ fontSize:13, fontWeight:'700' },
  dayChipTxtTablet:{ fontSize:18 },
  countBadge:{ width:17, height:17, borderRadius:99, alignItems:'center', justifyContent:'center' },
  countBadgeTablet:{ width:22, height:22 },
  countBadgeTxt:{ fontSize:9, fontWeight:'900' },
  countBadgeTxtTablet:{ fontSize:11 },

  // Pips
  pips:{ flexDirection:'row', gap:4, marginBottom:12 },
  pipsTablet:{ gap:8, marginBottom:18 },
  pip:{ flex:1, height:2.5, borderRadius:99 },

  // Day header
  dayHeader:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:10 },
  dayHeaderTablet:{ marginBottom:18 },
  dayLabel:{ fontSize:16, fontWeight:'800', letterSpacing:-0.2 },
  dayLabelTablet:{ fontSize:28 },
  dayCount:{ fontSize:12, fontWeight:'500' },
  dayCountTablet:{ fontSize:16 },

  // Slots
  slotList:{ gap:7 },
  slotListTablet:{ gap:12 },
  slotRow:{
    flexDirection:'row', alignItems:'center',
    borderRadius:14, paddingHorizontal:16, paddingVertical:13, gap:12,
  },
  slotRowTablet:{ borderRadius:20, paddingHorizontal:22, paddingVertical:18, gap:18, minHeight:84 },
  slotBody:{ flex:1, gap:2 },
  slotLbl:{ fontSize:14, fontWeight:'700', letterSpacing:-0.1 },
  slotLblTablet:{ fontSize:21 },
  slotTime:{ fontSize:11, fontWeight:'400' },
  slotTimeTablet:{ fontSize:15 },
  checkbox:{ width:24, height:24, borderRadius:7, borderWidth:1.5, alignItems:'center', justifyContent:'center' },
  checkboxTablet:{ width:32, height:32, borderRadius:10 },
  checkmark:{ color:'#fff', fontSize:13, fontWeight:'800' },

  note:{ marginTop:12, fontSize:11, textAlign:'center', fontWeight:'400' },
  noteTablet:{ marginTop:20, fontSize:15 },

  footer:{ position:'absolute', left:0, right:0, bottom:0, paddingHorizontal:22, paddingTop:6, paddingBottom:36, borderTopWidth:StyleSheet.hairlineWidth, backgroundColor:C.footer, borderTopColor:C.footerBorder },
  footerTablet:{ paddingHorizontal:40, paddingTop:16, paddingBottom:48 },
  cta:{ height:FOOTER.ctaHeight, borderRadius:FOOTER.ctaRadius, flexDirection:'row', alignItems:'center', justifyContent:'center',
    overflow:'hidden', gap:8, shadowColor:'#0F9D8C', shadowOffset:{width:0,height:5}, shadowOpacity:0.24, shadowRadius:14, elevation:7 },
  ctaTablet:{ height:66, borderRadius:20 },
  ctaSheen:{ position:'absolute', top:0, left:0, right:0, height:'44%', backgroundColor:'rgba(255,255,255,0.13)' },
  ctaTxt:{ color:'#fff', fontSize:15, fontWeight:'800', letterSpacing:0.1 },
  ctaTxtTablet:{ fontSize:22 },
  ctaArrow:{ color:'rgba(255,255,255,0.72)', fontSize:16 },
  ctaArrowTablet:{ fontSize:22 },
});
