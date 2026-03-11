/**
 * goal-date.tsx — "Set Your Anchor"
 *
 * Sand/warm-neutral variant. Compact, no scroll.
 * Large styled date input with live format hint,
 * countdown preview card that appears once date is valid.
 */
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { useOnboardingV2 } from '@/app/(onboarding-v2)/state';
import { ONBOARDING_FOOTER_METRICS as FOOTER } from '@/app/components/onboarding-v2/footerMetrics';
import { useAppAlert } from '@/app/components/ui/AppAlert';
import { getCountryByCode } from '@/app/data/countries';
import { getLocaleTagForLanguage, resolveAppLanguage, t } from '@/app/i18n';
import { formatDateInput, formatDateValue, getDateFormatByLanguage, getDateTokens, parseDate } from '@/app/utils/localeDate';
import {
    trackOnboardingStepBack,
    trackOnboardingStepContinue,
    trackOnboardingStepValidationFail,
    trackOnboardingStepView,
} from '@/app/utils/onboardingV2Analytics';

// ── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg0: '#FDFBF7', bg1: '#F8F4EE', bg2: '#F2EDE5', bg3: '#FAF8F4',
  orbA: 'rgba(13,148,136,0.09)', orbB: 'rgba(180,160,130,0.09)',
  grid: 'rgba(0,0,0,0.028)',
  title: '#1C1208', sub: '#78716C', label: '#0D9488', labelMuted: 'rgba(13,148,136,0.40)',
  teal: '#0D9488', tealDark: '#0F766E',
  tealSoft: 'rgba(13,148,136,0.09)', tealBorder: 'rgba(13,148,136,0.18)',
  // Input
  inputBg: '#FFFFFF', inputBorder: 'rgba(15,23,42,0.10)',
  inputBorderActive: '#0D9488', inputText: '#1C1208', inputPlaceholder: '#A8A29E',
  inputHelper: '#A8A29E', inputError: '#EF4444',
  // Countdown card
  cardBg: '#FFFFFF', cardBorder: 'rgba(13,148,136,0.14)',
  cardTitle: '#1C1208', cardSub: '#78716C',
  // Nav
  backBg: 'rgba(0,0,0,0.04)', backBorder: 'rgba(0,0,0,0.06)',
  backArrow: '#0F766E', brand: '#0D9488',
  // CTA
  btnA: '#0D9488', btnB: '#0F766E',
  footer: 'rgba(253,251,247,0.95)', footerBorder: 'rgba(13,148,136,0.10)',
};

const getDaysUntil = (date: Date): number => {
  const today = new Date(); today.setHours(0,0,0,0);
  return Math.ceil((date.getTime() - today.getTime()) / 86400000);
};

export default function OnboardingV2GoalDateScreen() {
  const { showAlert } = useAppAlert();
  const { draft, updateDraft } = useOnboardingV2();
  const lang = resolveAppLanguage({
    countryDefaultLanguage: getCountryByCode(draft.countryCode)?.defaultLanguage ?? null,
  });
  const appLocale = getLocaleTagForLanguage(lang);
  const dateFormat = useMemo(() => getDateFormatByLanguage(lang), [lang]);
  const dateOrder = dateFormat.order;
  const dateSeparator = dateFormat.separator;
  const [tokenA, tokenB, tokenC] = useMemo(() => getDateTokens(dateOrder), [dateOrder]);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerTempDate, setPickerTempDate] = useState(new Date());
  useEffect(() => { void trackOnboardingStepView('goal_date'); }, []);

  const entrance = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  const ctaFade = useRef(new Animated.Value(0)).current;
  const ctaScale = useRef(new Animated.Value(1)).current;
  const inputFocused = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entrance, { toValue: 1, duration: 440, useNativeDriver: true }).start();
    Animated.timing(ctaFade, { toValue: 1, duration: 440, delay: 300, useNativeDriver: true }).start();
  // Entrance animations are mount-only; refs are stable.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validation = useMemo(() => {
    if (!draft.examDate || draft.examDate.length < 10) return { valid: false, reason: '' };
    const parsed = parseDate(draft.examDate, dateOrder);
    if (!parsed) return { valid: false, reason: t('onboarding.goal_date.invalid_date', { lang }) };
    const today = new Date(); today.setHours(0,0,0,0);
    if (parsed <= today) return { valid: false, reason: t('onboarding.goal_date.future_required', { lang }) };
    return { valid: true, reason: '', date: parsed, days: getDaysUntil(parsed) };
  }, [draft.examDate, lang, dateOrder]);

  useEffect(() => {
    if (!draft.examDate) return;
    const normalized = formatDateInput(draft.examDate, dateOrder, dateSeparator);
    if (normalized !== draft.examDate) updateDraft({ examDate: normalized });
  }, [dateOrder, dateSeparator, draft.examDate, updateDraft]);

  // Animate countdown card
  useEffect(() => {
    Animated.spring(cardAnim, {
      toValue: validation.valid ? 1 : 0,
      damping: 22, stiffness: 200, useNativeDriver: true,
    }).start();
  // cardAnim is a stable ref; rerun only when validity toggles.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validation.valid]);

  const handleContinue = () => {
    if (!validation.valid) {
      const reason = validation.reason || t('onboarding.goal_date.invalid_default', { lang });
      void trackOnboardingStepValidationFail('goal_date', ['examDate'], reason);
      showAlert(t('onboarding.goal_date.invalid_title', { lang }), reason);
      return;
    }
    void trackOnboardingStepContinue('goal_date');
    router.push('/(onboarding-v2)/goal-score');
  };

  const pressIn = () => Animated.spring(ctaScale, { toValue: 0.97, damping: 20, stiffness: 400, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(ctaScale, { toValue: 1, damping: 18, stiffness: 360, useNativeDriver: true }).start();

  const weeksLeft = validation.valid ? Math.floor((validation.days ?? 0) / 7) : 0;
  const minSelectableDate = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 1);
    return d;
  }, []);
  const resolvedPickerDate = useMemo(() => {
    const parsed = draft.examDate ? parseDate(draft.examDate, dateOrder) : null;
    if (parsed && parsed >= minSelectableDate) return parsed;
    return minSelectableDate;
  }, [draft.examDate, dateOrder, minSelectableDate]);

  const openPicker = () => {
    setPickerTempDate(resolvedPickerDate);
    setShowPicker(true);
  };

  const onPickerChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === 'dismissed') {
      if (Platform.OS !== 'ios') setShowPicker(false);
      return;
    }
    if (!selectedDate) return;
    const normalized = new Date(selectedDate);
    normalized.setHours(12, 0, 0, 0);
    if (Platform.OS === 'ios') {
      setPickerTempDate(normalized);
      return;
    }
    updateDraft({ examDate: formatDateValue(normalized, dateOrder, dateSeparator) });
    setShowPicker(false);
  };

  const confirmPicker = () => {
    updateDraft({ examDate: formatDateValue(pickerTempDate, dateOrder, dateSeparator) });
    setShowPicker(false);
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={[C.bg0,C.bg1,C.bg2,C.bg3]} locations={[0,0.35,0.70,1]} style={StyleSheet.absoluteFill} />
      <View style={[styles.orbA, { backgroundColor: C.orbA }]} />
      <View style={[styles.orbB, { backgroundColor: C.orbB }]} />
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {[0,1,2,3,4,5,6].map(i=><View key={`v${i}`} style={{position:'absolute',top:0,bottom:0,left:`${i*16.6}%`,width:StyleSheet.hairlineWidth,backgroundColor:C.grid}}/>)}
        {[0,1,2,3,4,5,6,7].map(i=><View key={`h${i}`} style={{position:'absolute',left:0,right:0,top:`${i*12.5}%`,height:StyleSheet.hairlineWidth,backgroundColor:C.grid}}/>)}
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS==='ios'?'padding':undefined} keyboardVerticalOffset={8}>
        <Animated.View style={[styles.inner, { opacity: entrance }]}>

          {/* Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity style={[styles.backBtn,{backgroundColor:C.backBg,borderColor:C.backBorder}]} onPress={()=>{void trackOnboardingStepBack('goal_date');router.back();}} activeOpacity={0.7}>
              <Text style={[styles.backArrow,{color:C.backArrow}]}>‹</Text>
            </TouchableOpacity>
            <View style={styles.brandRow}>
              <View style={[styles.brandMark,{backgroundColor:C.brand}]}/>
              <Text style={[styles.brandText,{color:C.brand}]}>StudyMap</Text>
            </View>
            <View style={styles.backBtn}/>
          </View>

          {/* Progress */}
          <View style={[styles.progressTrack,{backgroundColor:C.tealSoft}]}>
            <View style={[styles.progressFill,{width:'27%'}]}>
              <LinearGradient colors={[C.btnA,C.btnB]} start={{x:0,y:0}} end={{x:1,y:0}} style={StyleSheet.absoluteFill}/>
              <View style={styles.progressSheen}/>
            </View>
          </View>
          <Text style={[styles.stepLabel,{color:C.labelMuted}]}>
            {t('common.step_of', { lang, params: { current: 4, total: 13 } })}
          </Text>

          {/* Title */}
          <Text style={[styles.title,{color:C.title}]}>{t('onboarding.goal_date.title', { lang })}</Text>
          <Text style={[styles.sub,{color:C.sub}]}>{t('onboarding.goal_date.subtitle', { lang })}</Text>

          {/* Date input card */}
          <View style={[styles.inputCard,{backgroundColor:C.inputBg,borderColor:C.inputBorder}]}>
            <LinearGradient colors={[C.btnA,C.btnB]} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.inputCardBar}/>
            <View style={styles.inputCardInner}>
              <Text style={[styles.inputLabel,{color:C.label}]}>{t('onboarding.goal_date.input_label', { lang }).toUpperCase()}</Text>
              <TouchableOpacity
                activeOpacity={0.86}
                onPress={openPicker}
                onPressIn={() => Animated.timing(inputFocused,{toValue:1,duration:120,useNativeDriver:false}).start()}
                onPressOut={() => Animated.timing(inputFocused,{toValue:0,duration:200,useNativeDriver:false}).start()}
                style={[
                  styles.dateInputButton,
                  { borderColor: C.inputBorder },
                  validation.valid && { borderColor: C.tealBorder, backgroundColor: C.tealSoft },
                  draft.examDate.length === 10 && !validation.valid && { borderColor: 'rgba(239,68,68,0.25)' },
                ]}
              >
                <Text
                  style={[
                    styles.dateInput,
                    { color: draft.examDate ? C.inputText : C.inputPlaceholder },
                    validation.valid && { color: C.tealDark },
                    draft.examDate.length === 10 && !validation.valid && { color: C.inputError },
                  ]}
                >
                  {draft.examDate || `${tokenA} ${dateSeparator} ${tokenB} ${dateSeparator} ${tokenC}`}
                </Text>
                <Text style={styles.dateInputIcon}>⌄</Text>
              </TouchableOpacity>
              {/* Format helper */}
              <View style={styles.formatHints}>
                {[tokenA, tokenB, tokenC].map((s,i) => (
                  <View key={s} style={styles.formatChip}>
                    <Text
                      style={[
                        styles.formatText,
                        { color: C.inputHelper },
                        i === 2 ? styles.formatTextYear : styles.formatTextShort,
                      ]}
                    >
                      {s}
                    </Text>
                    {i<2 && <Text style={[styles.formatSlash,{color:C.inputBorder}]}>{dateSeparator}</Text>}
                  </View>
                ))}
              </View>
            </View>

            {/* Error */}
            {draft.examDate.length === 10 && !validation.valid && (
              <View style={styles.errorRow}>
                <Text style={[styles.errorText,{color:C.inputError}]}>⚠ {validation.reason}</Text>
              </View>
            )}
          </View>

          {/* Countdown card — appears when date valid */}
          <Animated.View
            style={[
              styles.countdownCard,
              {backgroundColor:C.cardBg, borderColor:C.cardBorder},
              {
                opacity: cardAnim,
                transform:[{ translateY: cardAnim.interpolate({inputRange:[0,1],outputRange:[12,0]}) }],
              },
            ]}
            pointerEvents={validation.valid ? 'auto' : 'none'}
          >
            <View style={styles.countdownRow}>
              <View style={styles.countdownStat}>
                <Text style={[styles.countdownNum,{color:C.teal}]}>{validation.days ?? 0}</Text>
                <Text style={[styles.countdownLbl,{color:C.sub}]}>{t('onboarding.goal_date.days_left', { lang })}</Text>
              </View>
              <View style={[styles.countdownDivider,{backgroundColor:C.tealSoft}]}/>
              <View style={styles.countdownStat}>
                <Text style={[styles.countdownNum,{color:C.teal}]}>{weeksLeft}</Text>
                <Text style={[styles.countdownLbl,{color:C.sub}]}>{t('onboarding.goal_date.study_weeks', { lang })}</Text>
              </View>
              <View style={[styles.countdownDivider,{backgroundColor:C.tealSoft}]}/>
              <View style={styles.countdownStat}>
                <Text style={[styles.countdownNum,{color:C.teal}]}>✓</Text>
                <Text style={[styles.countdownLbl,{color:C.sub}]}>{t('onboarding.goal_date.date_locked', { lang })}</Text>
              </View>
            </View>
          </Animated.View>

          {/* Tip */}
          <View style={[styles.tip,{backgroundColor:C.tealSoft,borderColor:C.tealBorder}]}>
            <View style={[styles.tipRail,{backgroundColor:C.teal}]} />
            <View style={styles.tipBody}>
              <View style={[styles.tipBadge,{backgroundColor:'rgba(13,148,136,0.14)',borderColor:C.tealBorder}]}>
                <Text style={[styles.tipBadgeText,{color:C.tealDark}]}>{t('onboarding.goal_date.tip', { lang }).toUpperCase()}</Text>
              </View>
              <Text style={[styles.tipText,{color:C.sub}]}>
                {t('onboarding.goal_date.tip_body', { lang })}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Footer */}
        <Animated.View style={[styles.footer,{backgroundColor:C.footer,borderTopColor:C.footerBorder,opacity:ctaFade}]}>
          <Animated.View style={{transform:[{scale:ctaScale}]}}>
            <TouchableOpacity style={[styles.cta,!validation.valid&&styles.ctaDisabled]} onPress={handleContinue} onPressIn={pressIn} onPressOut={pressOut} activeOpacity={1}>
              {validation.valid&&<LinearGradient colors={[C.btnA,C.btnB]} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFill}/>}
              {validation.valid&&<View style={styles.ctaSheen}/>}
              <Text style={[styles.ctaText,!validation.valid&&styles.ctaTextDisabled]}>{t('common.continue', { lang })}</Text>
              {validation.valid&&<Text style={styles.ctaArrow}>→</Text>}
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>

      <Modal
        visible={showPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPicker(false)}
      >
        <Pressable style={styles.pickerBackdrop} onPress={() => setShowPicker(false)}>
          <Pressable style={styles.pickerSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.pickerHandle} />
            <View style={styles.pickerHeader}>
              <TouchableOpacity onPress={() => setShowPicker(false)} style={styles.pickerHeaderBtn}>
                <Text style={styles.pickerHeaderBtnText}>{t('onboarding.goal_date.picker_cancel', { lang })}</Text>
              </TouchableOpacity>
              <Text style={styles.pickerHeaderTitle}>{t('onboarding.goal_date.picker_title', { lang })}</Text>
              <TouchableOpacity onPress={confirmPicker} style={[styles.pickerHeaderBtn, styles.pickerHeaderBtnPrimary]}>
                <Text style={[styles.pickerHeaderBtnText, styles.pickerHeaderBtnTextPrimary]}>{t('onboarding.goal_date.picker_confirm', { lang })}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.pickerBody}>
              <DateTimePicker
                value={Platform.OS === 'ios' ? pickerTempDate : resolvedPickerDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
                locale={appLocale}
                minimumDate={minSelectableDate}
                onChange={onPickerChange}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:{flex:1,backgroundColor:'#FDFBF7'},
  flex:{flex:1},
  orbA:{position:'absolute',width:260,height:260,borderRadius:999,top:-80,right:-100},
  orbB:{position:'absolute',width:180,height:180,borderRadius:999,bottom:200,left:-80},
  inner:{flex:1,paddingHorizontal:22,paddingTop:10,paddingBottom:110},
  headerRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:16},
  backBtn:{width:36,height:36,borderRadius:11,borderWidth:1,justifyContent:'center',alignItems:'center'},
  backArrow:{fontSize:26,fontWeight:'300',lineHeight:30,marginTop:-1},
  brandRow:{flexDirection:'row',alignItems:'center',gap:6},
  brandMark:{width:7,height:7,borderRadius:2},
  brandText:{fontSize:14,fontWeight:'800',letterSpacing:0.4},
  progressTrack:{height:3,borderRadius:999,overflow:'hidden',marginBottom:7},
  progressFill:{height:'100%',borderRadius:999,overflow:'hidden'},
  progressSheen:{position:'absolute',top:0,left:0,right:0,height:'50%',backgroundColor:'rgba(255,255,255,0.28)'},
  stepLabel:{fontSize:10,fontWeight:'600',letterSpacing:0.9,textTransform:'uppercase',marginBottom:18,opacity:0.65},
  title:{fontSize:33,fontWeight:'900',lineHeight:39,letterSpacing:-0.8,marginBottom:8},
  sub:{fontSize:14,lineHeight:21,fontWeight:'400',marginBottom:22},

  // Input card
  inputCard:{borderRadius:20,borderWidth:1,overflow:'hidden',marginBottom:14,
    shadowColor:'#000',shadowOffset:{width:0,height:2},shadowOpacity:0.05,shadowRadius:8,elevation:3},
  inputCardBar:{height:3},
  inputCardInner:{padding:18,gap:8},
  inputLabel:{fontSize:10,fontWeight:'700',letterSpacing:1.3,textTransform:'uppercase'},
  dateInputButton:{minHeight:68,borderRadius:14,borderWidth:1,paddingHorizontal:14,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8},
  dateInput:{fontSize:38,fontWeight:'900',letterSpacing:2,textAlign:'center',paddingVertical:8},
  dateInputIcon:{fontSize:18,color:'#0F766E',marginTop:2},
  formatHints:{flexDirection:'row',justifyContent:'center',alignItems:'center',gap:0,opacity:0.5},
  formatChip:{flexDirection:'row',alignItems:'center'},
  formatText:{fontSize:11,fontWeight:'600',letterSpacing:1,textAlign:'center'},
  formatTextShort:{width:26},
  formatTextYear:{width:42},
  formatSlash:{fontSize:14,fontWeight:'300',marginHorizontal:2},
  errorRow:{paddingHorizontal:18,paddingBottom:14},
  errorText:{fontSize:12,fontWeight:'600'},

  // Countdown
  countdownCard:{borderRadius:16,borderWidth:1,overflow:'hidden',marginBottom:14,
    shadowColor:'#0D9488',shadowOffset:{width:0,height:4},shadowOpacity:0.08,shadowRadius:12,elevation:3},
  countdownRow:{flexDirection:'row',alignItems:'center',paddingVertical:16,paddingHorizontal:12},
  countdownStat:{flex:1,alignItems:'center',gap:4},
  countdownNum:{fontSize:24,fontWeight:'900',letterSpacing:-0.6},
  countdownLbl:{fontSize:10,fontWeight:'500',textTransform:'uppercase',letterSpacing:0.4},
  countdownDivider:{width:1,height:32},

  // Tip
  tip:{flexDirection:'row',alignItems:'stretch',gap:10,borderWidth:1,borderRadius:14,padding:13},
  tipRail:{width:3,borderRadius:2},
  tipBody:{flex:1,gap:7},
  tipBadge:{alignSelf:'flex-start',height:20,paddingHorizontal:9,borderRadius:10,borderWidth:1,alignItems:'center',justifyContent:'center'},
  tipBadgeText:{fontSize:10,fontWeight:'800',letterSpacing:0.8,textTransform:'uppercase'},
  tipText:{fontSize:12,lineHeight:18,fontWeight:'500'},

  // Footer
  footer:{position:'absolute',left:0,right:0,bottom:0,paddingHorizontal:22,paddingTop:16,paddingBottom:12,borderTopWidth:StyleSheet.hairlineWidth,backgroundColor:C.footer,borderTopColor:C.footerBorder},
  cta:{height:FOOTER.ctaHeight,borderRadius:FOOTER.ctaRadius,flexDirection:'row',alignItems:'center',justifyContent:'center',overflow:'hidden',gap:8,
    shadowColor:'#0D9488',shadowOffset:{width:0,height:6},shadowOpacity:0.26,shadowRadius:16,elevation:8},
  ctaDisabled:{backgroundColor:'rgba(148,163,184,0.18)',shadowOpacity:0,elevation:0},
  ctaSheen:{position:'absolute',top:0,left:0,right:0,height:'44%',backgroundColor:'rgba(255,255,255,0.13)'},
  ctaText:{color:'#fff',fontSize:16,fontWeight:'800',letterSpacing:0.2},
  ctaTextDisabled:{color:'rgba(100,116,139,0.55)'},
  ctaArrow:{color:'rgba(255,255,255,0.78)',fontSize:17},

  // Picker modal
  pickerBackdrop:{flex:1,backgroundColor:'rgba(15,23,42,0.25)',justifyContent:'flex-end'},
  pickerSheet:{backgroundColor:'#FDFBF7',borderTopLeftRadius:22,borderTopRightRadius:22,paddingTop:10,paddingBottom:20,borderTopWidth:1,borderColor:'rgba(13,148,136,0.18)'},
  pickerHandle:{alignSelf:'center',width:38,height:4,borderRadius:3,backgroundColor:'rgba(15,23,42,0.16)',marginBottom:12},
  pickerHeader:{paddingHorizontal:16,flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:6},
  pickerHeaderTitle:{fontSize:15,fontWeight:'700',color:'#1C1208'},
  pickerHeaderBtn:{height:34,paddingHorizontal:12,borderRadius:10,justifyContent:'center',alignItems:'center',backgroundColor:'rgba(0,0,0,0.05)'},
  pickerHeaderBtnPrimary:{backgroundColor:'rgba(13,148,136,0.14)',borderWidth:1,borderColor:'rgba(13,148,136,0.22)'},
  pickerHeaderBtnText:{fontSize:12,fontWeight:'700',color:'#475569'},
  pickerHeaderBtnTextPrimary:{color:'#0F766E'},
  pickerBody:{alignItems:'center'},
});
