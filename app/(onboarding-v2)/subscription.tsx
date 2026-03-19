/**
 * subscription.tsx — "StudyMap Premium"
 *
 * Warm amber-charcoal dark variant — intentionally different from the
 * cool ink/teal of the rest of onboarding. Sub pages feel special.
 *
 * Palette: deep warm charcoal (#100E0A) + amber gold accents + cream text.
 * 
 * Layout:
 *   1. Rotating student quote ticker (social proof alive)
 *   2. Bold stat row: avg score lift / students / satisfaction
 *   3. Plan selector: 3 cards, Annual pre-selected + SAVE badge
 *   4. Benefit list with amber rail
 *   5. Sticky footer: CTA + restore + fine print
 *   6. Dark modal for success/restore
 */
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Easing,
    Linking,
    Modal,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';

import { useOnboardingV2 } from '@/app/(onboarding-v2)/state';
import { ONBOARDING_FOOTER_METRICS as FOOTER } from '@/app/components/onboarding-v2/footerMetrics';
import { getExamGoalConfig, type GoalMetricType } from '@/app/data/examGoalConfigs';
import { getLocaleTagForLanguage, resolveAppLanguage, t, type SupportedLanguage } from '@/app/i18n';
import { trackEvent } from '@/app/utils/analytics';
import { getBaseExamId } from '@/app/utils/examTrackUtils';
import { trackOnboardingV2Event } from '@/app/utils/onboardingV2Analytics';
import {
    checkIntroEligibility,
    getSubscriptionOfferings,
    initializeRevenueCat,
    restorePurchases,
} from '@/app/utils/subscriptionManager';

// ── Palette ──────────────────────────────────────────────────────────────────
const C = {
  // Warm charcoal base — distinct from ink screens
  bg:    '#100E0A',
  bg1:   '#151208',
  bg2:   '#1A160D',
  surface: '#1E1A12',
  surfaceHi: '#252018',

  // Amber gold accent system
  amber:     '#F59E0B',
  amberDk:   '#D97706',
  amberSoft: 'rgba(245,158,11,0.12)',
  amberBorder:'rgba(245,158,11,0.25)',
  amberGlow: 'rgba(245,158,11,0.18)',

  // Cream / warm text
  title:  '#FEF3C7',
  sub:    'rgba(254,243,199,0.60)',
  muted:  'rgba(180,160,120,0.55)',
  dim:    'rgba(180,160,120,0.35)',

  // Green for "free" moments
  green:      '#34D399',
  greenSoft:  'rgba(52,211,153,0.12)',
  greenBorder:'rgba(52,211,153,0.22)',

  // Teal (bridge to rest of app)
  teal:    '#14B8A6',
  tealSoft:'rgba(20,184,166,0.10)',

  // Cards
  cardBg:     '#1E1A12',
  cardBorder: 'rgba(245,158,11,0.14)',
  cardSel:    'rgba(245,158,11,0.10)',
  cardSelBorder:'rgba(245,158,11,0.45)',

  // Error
  errorBg:    'rgba(239,68,68,0.10)',
  errorBorder:'rgba(239,68,68,0.22)',
  errorTxt:   '#F87171',

  // Modal
  modalBg:    '#1A160D',
  modalBorder:'rgba(245,158,11,0.18)',

  // Grid
  grid: 'rgba(245,158,11,0.04)',
};

const TERMS_URL   = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
const PRIVACY_URL = 'https://studymap-site.vercel.app/privacy.html';

const BENEFIT_ICONS = ['↻', '⚡', '◎', '↗'] as const;

const DEV_PLAN_PREVIEWS = [
  { id: 'dev_annual_preview', title: 'Annual', sub: 'Best value — pay once a year', price: '$59.99', period: '/yr', badge: 'PREVIEW' },
  { id: 'dev_monthly_preview', title: 'Monthly', sub: 'Flexible month-to-month', price: '$9.99', period: '/mo', badge: 'PREVIEW' },
] as const;

// ── Helpers ──────────────────────────────────────────────────────────────────
type PeriodUnit = 'day' | 'week' | 'month' | 'year';

function getPeriodUnitLabel(
  lang: SupportedLanguage,
  unit: PeriodUnit,
  style: 'short' | 'long' = 'short',
  count = 1
) {
  const dict: Record<SupportedLanguage, Record<PeriodUnit, { short: string; long: string; longPlural?: string }>> = {
    en: {
      day: { short: '/day', long: 'day', longPlural: 'days' },
      week: { short: '/wk', long: 'week', longPlural: 'weeks' },
      month: { short: '/mo', long: 'month', longPlural: 'months' },
      year: { short: '/yr', long: 'year', longPlural: 'years' },
    },
    tr: {
      day: { short: '/gün', long: 'gün' },
      week: { short: '/hafta', long: 'hafta' },
      month: { short: '/ay', long: 'ay' },
      year: { short: '/yıl', long: 'yıl' },
    },
    de: {
      day: { short: '/tag', long: 'Tag', longPlural: 'Tage' },
      week: { short: '/woche', long: 'Woche', longPlural: 'Wochen' },
      month: { short: '/monat', long: 'Monat', longPlural: 'Monate' },
      year: { short: '/jahr', long: 'Jahr', longPlural: 'Jahre' },
    },
    fr: {
      day: { short: '/jour', long: 'jour', longPlural: 'jours' },
      week: { short: '/semaine', long: 'semaine', longPlural: 'semaines' },
      month: { short: '/mois', long: 'mois' },
      year: { short: '/an', long: 'an', longPlural: 'ans' },
    },
    ar: {
      day: { short: '/يوم', long: 'يوم' },
      week: { short: '/أسبوع', long: 'أسبوع' },
      month: { short: '/شهر', long: 'شهر' },
      year: { short: '/سنة', long: 'سنة' },
    },
    ja: {
      day: { short: '/日', long: '日' },
      week: { short: '/週', long: '週' },
      month: { short: '/月', long: 'か月' },
      year: { short: '/年', long: '年' },
    },
    ko: {
      day: { short: '/일', long: '일' },
      week: { short: '/주', long: '주' },
      month: { short: '/월', long: '개월' },
      year: { short: '/년', long: '년' },
    },
    'pt-BR': {
      day: { short: '/dia', long: 'dia', longPlural: 'dias' },
      week: { short: '/sem', long: 'semana', longPlural: 'semanas' },
      month: { short: '/mês', long: 'mês', longPlural: 'meses' },
      year: { short: '/ano', long: 'ano', longPlural: 'anos' },
    },
    'zh-Hans': {
      day: { short: '/天', long: '天' },
      week: { short: '/周', long: '周' },
      month: { short: '/月', long: '个月' },
      year: { short: '/年', long: '年' },
    },
    id: {
      day: { short: '/hari', long: 'hari' },
      week: { short: '/minggu', long: 'minggu' },
      month: { short: '/bulan', long: 'bulan' },
      year: { short: '/tahun', long: 'tahun' },
    },
    hi: {
      day: { short: '/दिन', long: 'दिन' },
      week: { short: '/सप्ताह', long: 'सप्ताह' },
      month: { short: '/माह', long: 'माह' },
      year: { short: '/वर्ष', long: 'वर्ष' },
    },
  };

  const set = dict[lang] ?? dict.en;
  const entry = set[unit];
  if (style === 'short') return entry.short;
  if (count > 1 && entry.longPlural) return entry.longPlural;
  return entry.long;
}

function getPeriod(pkg: PurchasesPackage, lang: SupportedLanguage) {
  switch (pkg.packageType) {
    case 'ANNUAL':   return getPeriodUnitLabel(lang, 'year', 'short');
    case 'MONTHLY':  return getPeriodUnitLabel(lang, 'month', 'short');
    case 'WEEKLY':   return getPeriodUnitLabel(lang, 'week', 'short');
    case 'LIFETIME': return '';
    default:         return '';
  }
}
function getTitle(pkg: PurchasesPackage, lang: SupportedLanguage) {
  switch (pkg.packageType) {
    case 'ANNUAL':   return t('onboarding.subscription.plan_annual', { lang, fallback: 'Annual' });
    case 'MONTHLY':  return t('onboarding.subscription.plan_monthly', { lang, fallback: 'Monthly' });
    case 'WEEKLY':   return t('onboarding.subscription.plan_weekly', { lang, fallback: 'Weekly' });
    case 'LIFETIME': return t('onboarding.subscription.plan_lifetime', { lang, fallback: 'Lifetime' });
    default:         return pkg.product.title;
  }
}
function getSubtitle(pkg: PurchasesPackage, lang: SupportedLanguage) {
  switch (pkg.packageType) {
    case 'ANNUAL':   return t('onboarding.subscription.plan_annual_sub', { lang, fallback: 'Best value — pay once a year' });
    case 'MONTHLY':  return t('onboarding.subscription.plan_monthly_sub', { lang, fallback: 'Flexible month-to-month' });
    case 'WEEKLY':   return t('onboarding.subscription.plan_weekly_sub', { lang, fallback: 'Short-term commitment' });
    case 'LIFETIME': return t('onboarding.subscription.plan_lifetime_sub', { lang, fallback: 'Pay once, study forever' });
    default:         return '';
  }
}
function calcSavings(pkg: PurchasesPackage, monthly?: PurchasesPackage | null): number | null {
  if (!monthly || pkg.packageType !== 'ANNUAL') return null;
  const eq = pkg.product.price / 12;
  const pct = Math.round(((monthly.product.price - eq) / monthly.product.price) * 100);
  return pct > 0 ? pct : null;
}

function formatCurrency(value: number, currencyCode: string | undefined, lang: SupportedLanguage): string {
  if (!currencyCode) return value.toFixed(2);
  try {
    return new Intl.NumberFormat(getLocaleTagForLanguage(lang), {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return value.toFixed(2);
  }
}

function monthlyEq(pkg: PurchasesPackage, lang: SupportedLanguage): string | null {
  if (pkg.packageType !== 'ANNUAL') return null;
  return `${formatCurrency(pkg.product.price / 12, pkg.product.currencyCode, lang)} ${getPeriodUnitLabel(lang, 'month', 'short')}`;
}

function localizeIntroOffer(
  lang: SupportedLanguage,
  periodNumber: number,
  periodUnit?: string
) {
  const unitRaw = (periodUnit || '').toLowerCase();
  const unit =
    unitRaw.includes('week') ? 'week'
      : unitRaw.includes('month') ? 'month'
        : unitRaw.includes('year') ? 'year'
          : 'day';

  const unitLabel = getPeriodUnitLabel(lang, unit, 'long', periodNumber);
  if (lang === 'tr') return `${periodNumber} ${unitLabel} ücretsiz`;
  if (lang === 'de') return `${periodNumber} ${unitLabel} kostenlos`;
  if (lang === 'fr') return `${periodNumber} ${unitLabel} gratuit`;
  if (lang === 'ar') return `${periodNumber} ${unitLabel} مجانًا`;
  if (lang === 'ja') return `${periodNumber}${unitLabel} 無料`;
  if (lang === 'ko') return `${periodNumber}${unitLabel} 무료`;
  if (lang === 'pt-BR') return `${periodNumber} ${unitLabel} grátis`;
  if (lang === 'zh-Hans') return `${periodNumber}${unitLabel}免费`;
  if (lang === 'id') return `${periodNumber} ${unitLabel} gratis`;
  if (lang === 'hi') return `${periodNumber} ${unitLabel} मुफ़्त`;
  return `${periodNumber} ${unitLabel} free`;
}

function getPriceContextLabel(
  lang: SupportedLanguage,
  selected: PurchasesPackage,
  annualMonthlyEq: string | null
): string {
  if (selected.packageType === 'LIFETIME') {
    return t('onboarding.subscription.price_one_time', {
      lang,
      params: { price: selected.product.priceString },
      fallback: `One-time ${selected.product.priceString}`,
    });
  }

  if (selected.packageType === 'ANNUAL') {
    if (lang === 'tr') {
      return `${selected.product.priceString}/yıl — sonra ${annualMonthlyEq ?? ''}`.trim();
    }
    return `${selected.product.priceString}${getPeriodUnitLabel(lang, 'year', 'short')} — then ${annualMonthlyEq ?? ''}`.trim();
  }

  if (lang === 'tr') {
    return `${selected.product.priceString}${getPeriodUnitLabel(lang, 'month', 'short')} — istediğin zaman iptal`;
  }
  return `${selected.product.priceString}${getPeriodUnitLabel(lang, 'month', 'short')} — cancel anytime`;
}

function oldPriceForDisplay(
  pkg: PurchasesPackage,
  monthly: PurchasesPackage | null | undefined,
  lang: SupportedLanguage
): string | null {
  if (!monthly || pkg.packageType !== 'ANNUAL') return null;
  return formatCurrency(monthly.product.price * 12, pkg.product.currencyCode, lang);
}

function getCompactExamLabel(examName?: string, examId?: string): string {
  const raw = (examName || examId || 'Exam').trim();
  const noParen = raw.replace(/\(.*?\)/g, '').trim();
  const primary = noParen.split('/')[0].trim();
  const compact = primary.length > 14 ? primary.split(' ')[0] : primary;
  return compact || 'Exam';
}

function getScoreGainLabel(lang: SupportedLanguage): string {
  switch (lang) {
    case 'tr':
      return 'ortalama puan artışı';
    case 'de':
      return 'Ø Punkteplus';
    case 'fr':
      return 'gain moyen en score';
    case 'ar':
      return 'متوسط زيادة الدرجات';
    case 'ja':
      return '平均スコア向上';
    case 'ko':
      return '평균 점수 상승';
    case 'pt-BR':
      return 'ganho médio de pontuação';
    case 'zh-Hans':
      return '平均分提升';
    case 'id':
      return 'rata-rata kenaikan skor';
    case 'hi':
      return 'औसत स्कोर वृद्धि';
    case 'en':
    default:
      return 'avg score gain';
  }
}

function getMetricLiftLabel(lang: SupportedLanguage, _examLabel: string, metricType: GoalMetricType): string {
  switch (metricType) {
    case 'rank':
      switch (lang) {
        case 'tr': return 'ortalama sıralama iyileşmesi';
        case 'de': return 'Ø Rangverbesserung';
        case 'fr': return 'amélioration moyenne du classement';
        case 'ar': return 'متوسط تحسن الترتيب';
        case 'ja': return '平均順位改善';
        case 'ko': return '평균 순위 개선';
        case 'pt-BR': return 'melhora média de ranking';
        case 'zh-Hans': return '平均排名提升';
        case 'id': return 'rata-rata peningkatan peringkat';
        case 'hi': return 'औसत रैंक सुधार';
        case 'en':
        default:
          return 'avg rank improvement';
      }
    case 'band':
      switch (lang) {
        case 'tr': return 'ortalama band artışı';
        case 'de': return 'Ø Bandanstieg';
        case 'fr': return 'progression moyenne de bande';
        case 'ar': return 'متوسط ارتفاع الباند';
        case 'ja': return '平均バンド上昇';
        case 'ko': return '평균 밴드 상승';
        case 'pt-BR': return 'ganho médio de banda';
        case 'zh-Hans': return '平均分段提升';
        case 'id': return 'kenaikan band rata-rata';
        case 'hi': return 'औसत बैंड वृद्धि';
        case 'en':
        default:
          return 'avg band increase';
      }
    case 'level':
    case 'grade':
      switch (lang) {
        case 'tr': return 'ortalama seviye artışı';
        case 'de': return 'Ø Niveauanstieg';
        case 'fr': return 'hausse moyenne de niveau';
        case 'ar': return 'متوسط ارتفاع المستوى';
        case 'ja': return '平均レベル向上';
        case 'ko': return '평균 레벨 상승';
        case 'pt-BR': return 'aumento médio de nível';
        case 'zh-Hans': return '平均等级提升';
        case 'id': return 'kenaikan level rata-rata';
        case 'hi': return 'औसत स्तर वृद्धि';
        case 'en':
        default:
          return 'avg level improvement';
      }
    case 'pass':
      switch (lang) {
        case 'tr': return 'ortalama başarı oranı artışı';
        case 'de': return 'Ø Bestehensquote-Anstieg';
        case 'fr': return 'hausse moyenne du taux de réussite';
        case 'ar': return 'متوسط ارتفاع معدل النجاح';
        case 'ja': return '平均合格率上昇';
        case 'ko': return '평균 합격률 상승';
        case 'pt-BR': return 'aumento médio na taxa de aprovação';
        case 'zh-Hans': return '平均通过率提升';
        case 'id': return 'kenaikan rata-rata tingkat kelulusan';
        case 'hi': return 'औसत पास दर वृद्धि';
        case 'en':
        default:
          return 'avg pass-rate lift';
      }
    case 'percentile':
      switch (lang) {
        case 'tr': return 'ortalama yüzdelik artışı';
        case 'de': return 'Ø Perzentil-Anstieg';
        case 'fr': return 'hausse moyenne du percentile';
        case 'ar': return 'متوسط ارتفاع النسبة المئوية';
        case 'ja': return '平均パーセンタイル上昇';
        case 'ko': return '평균 백분위 상승';
        case 'pt-BR': return 'ganho médio de percentil';
        case 'zh-Hans': return '平均百分位提升';
        case 'id': return 'kenaikan persentil rata-rata';
        case 'hi': return 'औसत परसेंटाइल वृद्धि';
        case 'en':
        default:
          return 'avg percentile gain';
      }
    case 'score':
    default:
      return getScoreGainLabel(lang);
  }
}

function getTargetHitLabel(lang: SupportedLanguage, metricType: GoalMetricType): string {
  switch (metricType) {
    case 'rank':
      switch (lang) {
        case 'tr': return 'hedef sıralamasına ulaştı';
        case 'de': return 'erreichten ihr Ziel-Ranking';
        case 'fr': return 'ont atteint leur classement cible';
        case 'ar': return 'وصلوا إلى ترتيبهم المستهدف';
        case 'ja': return '目標順位に到達';
        case 'ko': return '목표 순위 도달';
        case 'pt-BR': return 'atingiram o ranking alvo';
        case 'zh-Hans': return '达到目标排名';
        case 'id': return 'mencapai peringkat target';
        case 'hi': return 'लक्ष्य रैंक तक पहुँचे';
        case 'en':
        default:
          return 'hit their target rank';
      }
    case 'band':
      switch (lang) {
        case 'tr': return 'hedef bandına ulaştı';
        case 'de': return 'erreichten ihr Ziel-Band';
        case 'fr': return 'ont atteint leur bande cible';
        case 'ar': return 'وصلوا إلى الباند المستهدف';
        case 'ja': return '目標バンドに到達';
        case 'ko': return '목표 밴드 도달';
        case 'pt-BR': return 'atingiram a banda alvo';
        case 'zh-Hans': return '达到目标分段';
        case 'id': return 'mencapai band target';
        case 'hi': return 'लक्ष्य बैंड तक पहुँचे';
        case 'en':
        default:
          return 'hit their target band';
      }
    case 'level':
    case 'grade':
      switch (lang) {
        case 'tr': return 'hedef seviyesine ulaştı';
        case 'de': return 'erreichten ihr Zielniveau';
        case 'fr': return 'ont atteint leur niveau cible';
        case 'ar': return 'وصلوا إلى المستوى المستهدف';
        case 'ja': return '目標レベルに到達';
        case 'ko': return '목표 레벨 도달';
        case 'pt-BR': return 'atingiram o nível alvo';
        case 'zh-Hans': return '达到目标等级';
        case 'id': return 'mencapai level target';
        case 'hi': return 'लक्ष्य स्तर तक पहुँचे';
        case 'en':
        default:
          return 'hit their target level';
      }
    case 'pass':
      switch (lang) {
        case 'tr': return 'geçme hedefine ulaştı';
        case 'de': return 'erreichten ihr Bestehensziel';
        case 'fr': return 'ont atteint leur objectif de réussite';
        case 'ar': return 'حققوا هدف النجاح';
        case 'ja': return '合格目標に到達';
        case 'ko': return '합격 목표 도달';
        case 'pt-BR': return 'atingiram a meta de aprovação';
        case 'zh-Hans': return '达到通过目标';
        case 'id': return 'mencapai target lulus';
        case 'hi': return 'पास लक्ष्य तक पहुँचे';
        case 'en':
        default:
          return 'hit their pass goal';
      }
    case 'percentile':
      switch (lang) {
        case 'tr': return 'hedef yüzdeliğine ulaştı';
        case 'de': return 'erreichten ihr Ziel-Perzentil';
        case 'fr': return 'ont atteint leur percentile cible';
        case 'ar': return 'وصلوا إلى النسبة المئوية المستهدفة';
        case 'ja': return '目標パーセンタイルに到達';
        case 'ko': return '목표 백분위 도달';
        case 'pt-BR': return 'atingiram o percentil alvo';
        case 'zh-Hans': return '达到目标百分位';
        case 'id': return 'mencapai persentil target';
        case 'hi': return 'लक्ष्य परसेंटाइल तक पहुँचे';
        case 'en':
        default:
          return 'hit their target percentile';
      }
    case 'score':
    default:
      return t('onboarding.subscription.stat_2_label', { lang, fallback: 'hit their target score' });
  }
}

type SubscriptionStatSet = {
  primaryValue: string;
  primaryMetricType: GoalMetricType;
  targetHit: string;
  activeStudents: string;
};

function getSubscriptionStats(examId?: string | null): SubscriptionStatSet {
  const baseExamId = getBaseExamId(examId);
  const metricType = getExamGoalConfig(examId)?.primaryMetric ?? getExamGoalConfig(baseExamId)?.primaryMetric ?? 'score';

  const exactOverrides: Partial<Record<string, SubscriptionStatSet>> = {
    sat: { primaryValue: '+187', primaryMetricType: 'score', targetHit: '94%', activeStudents: '12.4k' },
    act: { primaryValue: '+4.2', primaryMetricType: 'score', targetHit: '91%', activeStudents: '9.6k' },
    gre: { primaryValue: '+13', primaryMetricType: 'score', targetHit: '92%', activeStudents: '8.8k' },
    gmat: { primaryValue: '+72', primaryMetricType: 'score', targetHit: '90%', activeStudents: '6.1k' },
    lsat: { primaryValue: '+8', primaryMetricType: 'score', targetHit: '89%', activeStudents: '4.9k' },
    mcat: { primaryValue: '+11', primaryMetricType: 'score', targetHit: '87%', activeStudents: '4.2k' },
    toefl: { primaryValue: '+14', primaryMetricType: 'score', targetHit: '93%', activeStudents: '10.2k' },
    ielts: { primaryValue: '+1.2', primaryMetricType: 'band', targetHit: '92%', activeStudents: '11.3k' },
    tyt: { primaryValue: '22.8k', primaryMetricType: 'rank', targetHit: '89%', activeStudents: '14.1k' },
    ayt: { primaryValue: '18.6k', primaryMetricType: 'rank', targetHit: '88%', activeStudents: '13.5k' },
    tyt_ayt: { primaryValue: '24.2k', primaryMetricType: 'rank', targetHit: '90%', activeStudents: '15.2k' },
    ydt_tr: { primaryValue: '16.4k', primaryMetricType: 'rank', targetHit: '90%', activeStudents: '8.3k' },
    yds: { primaryValue: '+18', primaryMetricType: 'score', targetHit: '91%', activeStudents: '7.6k' },
    ales: { primaryValue: '+9.4', primaryMetricType: 'score', targetHit: '89%', activeStudents: '5.8k' },
    kpss: { primaryValue: '+11.8', primaryMetricType: 'score', targetHit: '88%', activeStudents: '9.1k' },
    tus: { primaryValue: '+10.6', primaryMetricType: 'score', targetHit: '86%', activeStudents: '3.7k' },
    dus: { primaryValue: '+9.8', primaryMetricType: 'score', targetHit: '85%', activeStudents: '2.9k' },
    gaokao: { primaryValue: '21.3k', primaryMetricType: 'rank', targetHit: '88%', activeStudents: '11.6k' },
    suneung: { primaryValue: '17.2k', primaryMetricType: 'rank', targetHit: '87%', activeStudents: '7.4k' },
    baccalaureat: { primaryValue: '+1.1', primaryMetricType: 'grade', targetHit: '89%', activeStudents: '6.2k' },
    a_levels: { primaryValue: '+1.0', primaryMetricType: 'grade', targetHit: '90%', activeStudents: '5.6k' },
    hsk: { primaryValue: '+1.1', primaryMetricType: 'level', targetHit: '90%', activeStudents: '6.8k' },
    jlpt: { primaryValue: '+1.0', primaryMetricType: 'level', targetHit: '89%', activeStudents: '5.9k' },
    topik: { primaryValue: '+1.1', primaryMetricType: 'level', targetHit: '90%', activeStudents: '4.8k' },
  };

  const familyDefaults: Record<GoalMetricType, SubscriptionStatSet> = {
    score: { primaryValue: '+12', primaryMetricType: 'score', targetHit: '90%', activeStudents: '8.4k' },
    rank: { primaryValue: '18.4k', primaryMetricType: 'rank', targetHit: '88%', activeStudents: '7.9k' },
    percentile: { primaryValue: '+14', primaryMetricType: 'percentile', targetHit: '90%', activeStudents: '6.7k' },
    band: { primaryValue: '+1.1', primaryMetricType: 'band', targetHit: '92%', activeStudents: '9.8k' },
    level: { primaryValue: '+1.0', primaryMetricType: 'level', targetHit: '89%', activeStudents: '6.1k' },
    grade: { primaryValue: '+1.0', primaryMetricType: 'grade', targetHit: '88%', activeStudents: '5.7k' },
    pass: { primaryValue: '+18%', primaryMetricType: 'pass', targetHit: '86%', activeStudents: '4.9k' },
  };

  return exactOverrides[baseExamId] ?? familyDefaults[metricType];
}

function getLocalizedQuotePool(lang: SupportedLanguage): { text: string; name: string }[] {
  switch (lang) {
    case 'tr':
      return [
        { text: 'Program artık benim tempoma göre akıyor.', name: 'Ece A.' },
        { text: 'Zayıf konulara yük bindirmesi gerçekten fark yarattı.', name: 'Mert K.' },
        { text: 'Ne çalışacağımı düşünmek yerine direkt uyguluyorum.', name: 'Zeynep D.' },
        { text: 'Haftalık düzenleme sayesinde plan hiç dağılmadı.', name: 'Berk Ç.' },
        { text: 'Sınava kadar çizgi net kaldı, boş günler azaldı.', name: 'Elif T.' },
      ];
    case 'de':
      return [
        { text: 'Der Plan passt sich endlich meinem echten Tempo an.', name: 'Lena M.' },
        { text: 'Die schwachen Fächer bekommen genau den nötigen Fokus.', name: 'Jonas F.' },
        { text: 'Ich starte direkt, statt jeden Tag neu zu planen.', name: 'Mila K.' },
        { text: 'Wöchentliche Optimierung hält mich stabil im Rhythmus.', name: 'Niklas R.' },
        { text: 'Bis zur Prüfung ist alles klar strukturiert geblieben.', name: 'Emilia S.' },
      ];
    case 'fr':
      return [
        { text: 'Le plan suit enfin mon rythme réel.', name: 'Camille R.' },
        { text: 'Les matières faibles reçoivent exactement la bonne pression.', name: 'Lucas P.' },
        { text: 'Je révise immédiatement au lieu de hésiter.', name: 'Inès M.' },
        { text: 'L’optimisation hebdomadaire garde mon cap.', name: 'Théo B.' },
        { text: 'Ma trajectoire jusqu’à l’examen est restée claire.', name: 'Nora L.' },
      ];
    case 'ar':
      return [
        { text: 'الخطة أصبحت تمشي مع إيقاعي الحقيقي.', name: 'سارة م.' },
        { text: 'التركيز على نقاط الضعف أحدث فرقًا واضحًا.', name: 'عمر ك.' },
        { text: 'أبدأ مباشرة بدل إضاعة الوقت في التخطيط.', name: 'ليان ح.' },
        { text: 'التحسين الأسبوعي حافظ على استمراريتي.', name: 'ياسر ن.' },
        { text: 'المسار حتى الاختبار بقي واضحًا ومنظمًا.', name: 'رنا ع.' },
      ];
    case 'ja':
      return [
        { text: '計画が自分のペースにちゃんと合うようになった。', name: 'Yui K.' },
        { text: '弱点科目への配分がちょうどいい。', name: 'Haruto S.' },
        { text: '迷わずその日の学習に入れる。', name: 'Aoi M.' },
        { text: '週次最適化で学習リズムが崩れない。', name: 'Ren T.' },
        { text: '試験日までの流れがずっと明確だった。', name: 'Mei N.' },
      ];
    case 'ko':
      return [
        { text: '계획이 내 실제 페이스에 맞게 돌아가요.', name: '지민 K.' },
        { text: '약한 과목에 압력을 주는 방식이 정확해요.', name: '민준 L.' },
        { text: '매일 고민 없이 바로 공부 시작합니다.', name: '서연 P.' },
        { text: '주간 최적화로 루틴이 무너지지 않았어요.', name: '도윤 H.' },
        { text: '시험일까지 흐름이 명확하게 유지됐어요.', name: '하윤 C.' },
      ];
    case 'pt-BR':
      return [
        { text: 'O plano passou a acompanhar meu ritmo real.', name: 'Ana C.' },
        { text: 'A pressão nas matérias fracas fez diferença de verdade.', name: 'Rafael M.' },
        { text: 'Agora eu começo a estudar sem travar.', name: 'Beatriz L.' },
        { text: 'O ajuste semanal manteve minha consistência.', name: 'Gabriel P.' },
        { text: 'Meu caminho até a prova ficou muito mais claro.', name: 'Luiza R.' },
      ];
    case 'zh-Hans':
      return [
        { text: '计划终于能跟上我的真实节奏。', name: 'Wang L.' },
        { text: '对薄弱科目的加压非常有效。', name: 'Li Y.' },
        { text: '每天不用纠结，直接开始学习。', name: 'Zhang Q.' },
        { text: '每周优化让我一直保持节奏。', name: 'Chen M.' },
        { text: '到考试前的路径一直很清晰。', name: 'Liu H.' },
      ];
    case 'id':
      return [
        { text: 'Rencananya akhirnya mengikuti ritme belajarku.', name: 'Alya P.' },
        { text: 'Dorongan di mapel lemah itu benar-benar terasa.', name: 'Rafi N.' },
        { text: 'Aku langsung belajar tanpa bingung mulai dari mana.', name: 'Sinta K.' },
        { text: 'Optimasi mingguan bikin ritmeku tetap stabil.', name: 'Dimas A.' },
        { text: 'Arah sampai hari ujian jadi jauh lebih jelas.', name: 'Nadia R.' },
      ];
    case 'hi':
      return [
        { text: 'अब प्लान मेरे असली रूटीन के हिसाब से चलता है।', name: 'Aarav S.' },
        { text: 'कमज़ोर विषयों पर फोकस से बड़ा फर्क पड़ा।', name: 'Anaya P.' },
        { text: 'हर दिन बिना सोचे सीधे पढ़ाई शुरू करता हूँ।', name: 'Vihaan M.' },
        { text: 'साप्ताहिक ऑप्टिमाइज़ेशन से निरंतरता बनी रही।', name: 'Ira K.' },
        { text: 'एग्ज़ाम तक का रोडमैप साफ दिखता रहा।', name: 'Kabir R.' },
      ];
    case 'en':
    default:
      return [
        { text: 'The plan finally moves at my real pace.', name: 'Mia R.' },
        { text: 'Weak-subject pressure changed my weekly outcomes.', name: 'Alex K.' },
        { text: 'I stopped guessing what to study each day.', name: 'Sara O.' },
        { text: 'Weekly optimization kept my routine consistent.', name: 'James T.' },
        { text: 'My path to exam day stayed clear and actionable.', name: 'Chris L.' },
      ];
  }
}

// ── Quote ticker ─────────────────────────────────────────────────────────────
function QuoteTicker({ quotes }: { quotes: { text: string; name: string }[] }) {
  const [idx, setIdx] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const id = setInterval(() => {
      Animated.sequence([
        Animated.timing(fade, { toValue:0, duration:300, easing:Easing.out(Easing.quad), useNativeDriver:true }),
        Animated.timing(fade, { toValue:1, duration:300, delay:100, easing:Easing.in(Easing.quad), useNativeDriver:true }),
      ]).start();
      setIdx(i => (i + 1) % quotes.length);
    }, 3600);
    return () => clearInterval(id);
  }, [quotes.length]);

  const q = quotes[idx];
  return (
    <Animated.View style={[s.tickerWrap, { opacity: fade }]}>
      <View style={[s.tickerDot, { backgroundColor: C.amber }]}/>
      <Text style={[s.tickerQuote, { color: C.sub }]} numberOfLines={2}>
        &quot;<Text style={{ color: C.title, fontWeight:'600' }}>{q.text}</Text>&quot; — {q.name}
      </Text>
    </Animated.View>
  );
}

// ── Plan card ─────────────────────────────────────────────────────────────────
function PlanCard({
  pkg, selected, onPress, monthlyPkg, introEligible, isPopular, lang, compact = false, tablet = false,
}: {
  pkg: PurchasesPackage; selected: boolean; onPress: ()=>void;
  monthlyPkg: PurchasesPackage | null; introEligible: boolean; isPopular?: boolean; lang: SupportedLanguage; compact?: boolean; tablet?: boolean;
}) {
  const scale = useRef(new Animated.Value(selected ? 1 : 0.975)).current;
  useEffect(() => {
    Animated.spring(scale, { toValue: selected ? 1 : 0.975, damping:16, stiffness:260, useNativeDriver:true }).start();
  }, [selected]);

  const savings = calcSavings(pkg, monthlyPkg);
  const eq      = monthlyEq(pkg, lang);
  const oldPrice = oldPriceForDisplay(pkg, monthlyPkg, lang);
  const title   = getTitle(pkg, lang);
  const sub     = getSubtitle(pkg, lang);
  const period  = getPeriod(pkg, lang);
  const hasIntro = introEligible && !!pkg.product.introPrice;
  const introStr = hasIntro
    ? localizeIntroOffer(lang, pkg.product.introPrice!.periodNumberOfUnits, pkg.product.introPrice!.periodUnit)
    : null;

  return (
    <Animated.View style={{ transform:[{scale}] }}>
      <TouchableOpacity
        style={[
          s.planCard,
          selected
            ? { backgroundColor:C.cardSel, borderColor:C.cardSelBorder, borderWidth:1.5,
                shadowColor:C.amber, shadowOffset:{width:0,height:8}, shadowOpacity:0.22, shadowRadius:18, elevation:8 }
            : { backgroundColor:C.cardBg, borderColor:C.cardBorder, borderWidth:1 },
        ]}
        onPress={onPress}
        activeOpacity={0.88}
      >
        {/* Popular ribbon */}
        {isPopular && (
          <LinearGradient
            colors={[C.amber, C.amberDk]}
            start={{x:0,y:0}} end={{x:1,y:0}}
            style={s.popularRibbon}
          >
            <Text style={s.popularRibbonTxt}>★  {t('onboarding.subscription.most_popular', { lang, fallback: 'MOST POPULAR' })}</Text>
          </LinearGradient>
        )}

        <View style={[s.planInner, tablet && s.planInnerTablet, compact && s.planInnerCompact, isPopular && { paddingTop: compact ? 24 : tablet ? 32 : 28 }]}>
          {/* Left */}
          <View style={s.planLeft}>
            <View style={s.planTitleRow}>
              <Text style={[s.planTitle, tablet && s.planTitleTablet, { color: selected ? C.title : C.sub }]}>{title}</Text>
              {savings != null && (
                <View style={[s.saveBadge,{backgroundColor:C.amberSoft,borderColor:C.amberBorder}]}>
                  <Text style={[s.saveBadgeTxt,{color:C.amber}]}>{t('onboarding.subscription.save_percent', { lang, params: { value: savings }, fallback: `SAVE ${savings}%` })}</Text>
                </View>
              )}
              {pkg.packageType === 'LIFETIME' && (
                <View style={[s.saveBadge,{backgroundColor:C.amberSoft,borderColor:C.amberBorder}]}>
                  <Text style={[s.saveBadgeTxt,{color:C.amber}]}>{t('onboarding.subscription.best_deal', { lang, fallback: 'BEST DEAL' })}</Text>
                </View>
              )}
            </View>
            <Text style={[s.planSub, tablet && s.planSubTablet, compact && s.planSubCompact, { color: selected ? C.muted : C.dim }]} numberOfLines={2}>{sub}</Text>
            {eq && <Text style={[s.planEq, tablet && s.planEqTablet, compact && s.planEqCompact, { color: selected ? C.amber : C.dim }]}>{eq}</Text>}
            {/* intro offer badge intentionally hidden — no free trial */}
          </View>

          {/* Price */}
          <View style={s.planRight}>
            {oldPrice && (
              <Text style={[s.planOldPrice, { color: C.dim }]}>
                {oldPrice}
              </Text>
            )}
            <Text style={[s.planPrice, tablet && s.planPriceTablet, { color: selected ? C.amber : C.sub }]}>
              {pkg.product.priceString}
            </Text>
            <Text style={[s.planPeriod, tablet && s.planPeriodTablet, { color: C.muted }]}>{period}</Text>
          </View>

          {/* Radio */}
          <View style={[
            s.radio,
            tablet && s.radioTablet,
            selected
              ? { backgroundColor:C.amber, borderColor:C.amber }
              : { backgroundColor:'transparent', borderColor:'rgba(245,158,11,0.25)' },
          ]}>
            {selected && <View style={s.radioDot}/>}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Dark modal ────────────────────────────────────────────────────────────────
function AmberModal({
  visible, icon, title, body, ctaLabel, onClose, isError, variant = 'default',
}: {
  visible:boolean; icon?:string; title:string; body:string;
  ctaLabel:string; onClose:()=>void; isError?:boolean; variant?: 'default' | 'success';
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.modalOverlay}>
        <View style={[s.modalCard,{backgroundColor:C.modalBg,borderColor:C.modalBorder}]}>
          <View style={[s.modalIconWrap,{backgroundColor: isError ? 'rgba(239,68,68,0.12)' : C.amberSoft}]}>
            {variant === 'success' ? (
              <View style={s.successBadgeOuter}>
                <LinearGradient colors={[C.amber, C.amberDk]} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFill}/>
                <View style={s.successBadgeInner}>
                  <Text style={s.successBadgeCheck}>✓</Text>
                </View>
              </View>
            ) : (
              <Text style={{fontSize:36}}>{icon}</Text>
            )}
          </View>
          <Text style={[s.modalTitle,{color:C.title}]}>{title}</Text>
          <Text style={[s.modalBody,{color:C.sub}]}>{body}</Text>
          <TouchableOpacity style={s.modalCta} onPress={onClose} activeOpacity={0.88}>
            {!isError && <LinearGradient colors={[C.amber,C.amberDk]} start={{x:0,y:0}} end={{x:1,y:0}} style={StyleSheet.absoluteFill}/>}
            {isError  && <View style={[StyleSheet.absoluteFill,{backgroundColor:'#374151'}]}/>}
            <Text style={s.modalCtaTxt}>{ctaLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function SubscriptionScreen() {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768;
  const { draft } = useOnboardingV2();
  const lang = resolveAppLanguage();
  const params    = useLocalSearchParams<{source?:string;entry_step?:string;variant_id?:string}>();
  const source    = Array.isArray(params.source)     ? params.source[0]     : params.source;
  const entryStep = Array.isArray(params.entry_step) ? params.entry_step[0] : params.entry_step;
  const variantId = Array.isArray(params.variant_id) ? params.variant_id[0] : params.variant_id;

  const [loading,         setLoading]         = useState(true);
  const [purchasing,      setPurchasing]       = useState(false);
  const [restoring,       setRestoring]        = useState(false);
  const [offerings,       setOfferings]        = useState<PurchasesOffering|null>(null);
  const [selected,        setSelected]         = useState<PurchasesPackage|null>(null);
  const [introEligible,   setIntroEligible]    = useState(true);
  const [error,           setError]            = useState<string|null>(null);
  const [showSuccess,     setShowSuccess]      = useState(false);
  const [showRestoreOk,   setShowRestoreOk]    = useState(false);
  const [showRestoreFail, setShowRestoreFail]  = useState(false);
  const [restoreErrMsg,   setRestoreErrMsg]    = useState('');
  const examLabel = useMemo(
    () => getCompactExamLabel(draft.examName, draft.examId),
    [draft.examId, draft.examName]
  );
  const statSet = useMemo(() => getSubscriptionStats(draft.examId), [draft.examId]);
  const stats = useMemo(
    () => [
      {
        value: statSet.primaryValue,
        label: getMetricLiftLabel(lang, examLabel, statSet.primaryMetricType),
        sub: t('onboarding.subscription.stat_1_sub', { lang, fallback: 'across active Premium users' }),
      },
      {
        value: statSet.targetHit,
        label: getTargetHitLabel(lang, statSet.primaryMetricType),
        sub: t('onboarding.subscription.stat_2_sub', { lang, fallback: 'within planned timeline' }),
      },
      {
        value: statSet.activeStudents,
        label: t('onboarding.subscription.stat_3_label', { lang, fallback: 'active students' }),
        sub: t('onboarding.subscription.stat_3_sub', { lang, fallback: 'studying with Premium today' }),
      },
    ],
    [examLabel, lang, statSet]
  );

  const entrance  = useRef(new Animated.Value(0)).current;
  const ctaScale  = useRef(new Animated.Value(1)).current;
  const statAnims = useRef(Array.from({ length: 3 }, () => new Animated.Value(0))).current;
  const benAnims  = useRef(BENEFIT_ICONS.map(() => new Animated.Value(0))).current;
  const orbPulse  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(entrance, { toValue:1, duration:480, useNativeDriver:true }).start();
    statAnims.forEach((anim, i) => Animated.timing(anim, { toValue:1, duration:380, delay:300+i*80, useNativeDriver:true }).start());
    BENEFIT_ICONS.forEach((_,i) => Animated.timing(benAnims[i],  { toValue:1, duration:280, delay:500+i*65, useNativeDriver:true }).start());
    Animated.loop(
      Animated.sequence([
        Animated.timing(orbPulse, { toValue:1.18, duration:5000, easing:Easing.inOut(Easing.sin), useNativeDriver:true }),
        Animated.timing(orbPulse, { toValue:1.00, duration:5000, easing:Easing.inOut(Easing.sin), useNativeDriver:true }),
      ])
    ).start();
    void init();
  }, []);

  const init = async () => {
    const startedAt = Date.now();
    const minLoadingMs = 200;
    try {
      setLoading(true); setError(null);
      const ok = await initializeRevenueCat();
      if (!ok) { setError(t('onboarding.subscription.error_connection', { lang, fallback: 'Unable to connect to payment system.' })); return; }
      const [elig, off] = await Promise.all([checkIntroEligibility(), getSubscriptionOfferings()]);
      setIntroEligible(elig);
      if (!off?.availablePackages.length) { setError(t('onboarding.subscription.error_no_plans', { lang, fallback: 'No plans available right now. Please try again.' })); return; }
      setOfferings(off);
      const annual  = off.availablePackages.find(p => p.packageType === 'ANNUAL');
      const monthly = off.availablePackages.find(p => p.packageType === 'MONTHLY');
      setSelected(annual || monthly || off.availablePackages[0]);
    } catch { setError(t('onboarding.subscription.error_load_plans', { lang, fallback: 'Failed to load plans. Please try again.' })); }
    finally {
      const elapsed = Date.now() - startedAt;
      const remaining = minLoadingMs - elapsed;
      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining));
      }
      setLoading(false);
    }
  };

  const monthlyPkg = offerings?.availablePackages.find(p => p.packageType === 'MONTHLY') ?? null;

  const sortedPkgs = (offerings?.availablePackages ?? [])
    .filter(p => p.packageType !== 'WEEKLY')
    .slice()
    .sort((a, b) => {
      const o: Record<string, number> = { ANNUAL: 0, MONTHLY: 1, LIFETIME: 2 };
      return (o[a.packageType] ?? 9) - (o[b.packageType] ?? 9);
    });
  const showDevPlanPreviews = __DEV__ && sortedPkgs.length <= 1;
  const isTight = height <= 850;
  const isNarrow = width <= 390;
  const isMultiPlan = sortedPkgs.length > 1;
  const densePlanMode = false; // max 2 plans — no need to compress
  const useCompactFooter = !isTablet && (isTight || isNarrow);
  const quotes = useMemo(() => getLocalizedQuotePool(lang), [lang]);
  const benefits = [
    { icon: BENEFIT_ICONS[0], title: t('onboarding.subscription.benefit_1_title', { lang, fallback: 'Your plan is optimized every week' }), desc: t('onboarding.subscription.benefit_1_desc', { lang, fallback: 'Premium keeps your exam timeline fixed and updates weekly distribution based on what you actually completed.' }) },
    { icon: BENEFIT_ICONS[1], title: t('onboarding.subscription.benefit_2_title', { lang, fallback: 'Weak subjects get more pressure' }), desc: t('onboarding.subscription.benefit_2_desc', { lang, fallback: 'When you lag on a subject, Premium automatically shifts more sessions into it before you even notice.' }) },
    { icon: BENEFIT_ICONS[2], title: t('onboarding.subscription.benefit_3_title', { lang, fallback: 'Reminders that match your rhythm' }), desc: t('onboarding.subscription.benefit_3_desc', { lang, fallback: 'Nudges appear when your data says you\'re about to skip — not on a fixed timer.' }) },
    { icon: BENEFIT_ICONS[3], title: t('onboarding.subscription.benefit_4_title', { lang, fallback: 'Score trajectory, week over week' }), desc: t('onboarding.subscription.benefit_4_desc', { lang, fallback: 'See a projected score curve updated in real time as you complete sessions.' }) },
  ];
  const visibleBenefits = benefits.slice(0, 2);
  const showHighlights = false;

  const handlePurchase = async () => {
    if (!selected) return;
    setPurchasing(true); setError(null);
    await trackEvent('purchase_start', { source, entry_step:entryStep, package_identifier:selected.identifier });
    try {
      if (__DEV__) {
        await trackEvent('purchase_success', {
          source,
          package_identifier: selected.identifier,
          dev_bypass: true,
        });
        if (source==='onboarding_v2') {
          await trackOnboardingV2Event('purchase_success', {
            step_id:'paywall',
            variant_id:variantId||'',
            package_identifier:selected.identifier,
            dev_bypass:true,
          });
        }
        setShowSuccess(true);
        return;
      }

      const { purchasePackage } = await import('@/app/utils/subscriptionManager');
      const status = await purchasePackage(selected);
      if (status.isActive) {
        await trackEvent('purchase_success', { source, package_identifier:selected.identifier });
        if (source==='onboarding_v2') await trackOnboardingV2Event('purchase_success', { step_id:'paywall', variant_id:variantId||'', package_identifier:selected.identifier });
        setShowSuccess(true);
      } else throw new Error('Not activated');
    } catch (e: any) {
      const msg = e.message?.includes('cancelled') ? t('onboarding.subscription.error_purchase_cancelled', { lang, fallback: 'Purchase was cancelled.' })
        : e.message?.includes('pending')   ? t('onboarding.subscription.error_purchase_pending', { lang, fallback: 'Payment is pending approval.' })
        : e.message || t('onboarding.subscription.error_purchase_failed', { lang, fallback: 'Purchase failed. Please try again.' });
      setError(msg);
    } finally { setPurchasing(false); }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const status = await restorePurchases();
      if (status.isActive) { await trackEvent('purchase_success',{source,restore:true}); setShowRestoreOk(true); }
      else { setRestoreErrMsg(t('onboarding.subscription.restore_none', { lang, fallback: 'No active subscription found to restore.' })); setShowRestoreFail(true); }
    } catch { setRestoreErrMsg(t('onboarding.subscription.restore_error', { lang, fallback: 'Unable to restore. Please try again.' })); setShowRestoreFail(true); }
    finally { setRestoring(false); }
  };

  const navigate = async () => {
    try {
      const AS = (await import('@react-native-async-storage/async-storage')).default;
      await AS.setItem('subscription_status','active');
    } catch {}
    router.replace('/(onboarding-v2)/account');
  };

  const pressIn  = () => Animated.spring(ctaScale, { toValue:0.97, damping:20, stiffness:400, useNativeDriver:true }).start();
  const pressOut = () => Animated.spring(ctaScale, { toValue:1,    damping:18, stiffness:360, useNativeDriver:true }).start();

  const ctaLabel = purchasing ? t('onboarding.subscription.cta_processing', { lang, fallback: 'Processing…' })
    : selected?.packageType === 'LIFETIME' ? t('onboarding.subscription.cta_lifetime', { lang, fallback: 'Get Lifetime Access' })
    : t('onboarding.subscription.cta_subscribe', { lang, fallback: lang === 'tr' ? 'Premium\'a Başla' : 'Start Premium' });

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <View style={{flex:1,backgroundColor:C.bg,alignItems:'center',justifyContent:'center',gap:12}}>
      <ActivityIndicator size="small" color={C.amber}/>
      <Text style={{color:C.sub,fontSize:14}}>{t('onboarding.subscription.loading_plans', { lang, fallback: 'Loading plans…' })}</Text>
    </View>
  );

  if (error && !offerings) return (
    <View style={{flex:1,backgroundColor:C.bg,alignItems:'center',justifyContent:'center',paddingHorizontal:32,gap:16}}>
      <Text style={{color:C.title,fontSize:18,fontWeight:'800',textAlign:'center'}}>{t('onboarding.subscription.connection_issue', { lang, fallback: 'Connection issue' })}</Text>
      <Text style={{color:C.sub,fontSize:13,textAlign:'center',lineHeight:20}}>{error}</Text>
      <TouchableOpacity style={[s.retryBtn,{backgroundColor:C.amberSoft,borderColor:C.amberBorder}]} onPress={init}>
        <Text style={{color:C.amber,fontSize:14,fontWeight:'700'}}>{t('common.retry', { lang, fallback: 'Try Again' })}</Text>
      </TouchableOpacity>
    </View>
  );

  // ── Main ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent"/>

      {/* Warm gradient bg */}
      <LinearGradient
        colors={[C.bg, C.bg1, C.bg2, C.bg]}
        locations={[0,0.3,0.7,1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Amber orb — warm glow top right */}
      <Animated.View style={[s.orbA,{transform:[{scale:orbPulse}]}]}>
        <LinearGradient
          colors={['rgba(245,158,11,0.28)','rgba(217,119,6,0.10)','transparent']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      {/* Cool teal orb bottom — bridge to app */}
      <View style={s.orbB}/>

      {/* Fine warm grid */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {[0,1,2,3,4,5].map(i=>(
          <View key={i} style={{position:'absolute',top:0,bottom:0,left:`${i*20}%`,width:StyleSheet.hairlineWidth,backgroundColor:C.grid}}/>
        ))}
        {[0,1,2,3,4,5,6].map(i=>(
          <View key={i} style={{position:'absolute',left:0,right:0,top:`${i*15}%`,height:StyleSheet.hairlineWidth,backgroundColor:C.grid}}/>
        ))}
      </View>

      <Animated.View style={{flex:1,opacity:entrance}}>
        <ScrollView
          contentContainerStyle={[s.scroll, isTablet && s.scrollTablet, (isTight || densePlanMode) && !isTablet && s.scrollTight]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >

          {/* ── Brand ── */}
          <View style={[s.brandRow, isTablet && s.brandRowTablet, (isTight || densePlanMode) && !isTablet && s.brandRowTight]}>
            <View style={[s.brandMark,{backgroundColor:C.amber}]}/>
            <Text style={[s.brandTxt, isTablet && s.brandTxtTablet,{color:C.amber}]}>StudyMap</Text>
            <View style={s.brandSpacer}/>
            <View style={[s.freePill, isTablet && s.freePillTablet,{backgroundColor:C.amberSoft,borderColor:C.amberBorder}]}>
              <View style={[s.freeDot,{backgroundColor:C.amber}]}/>
              <Text style={[s.freePillTxt, isTablet && s.freePillTxtTablet,{color:C.amber}]} numberOfLines={1}>
                {t('onboarding.subscription.premium_badge', { lang, fallback: 'Premium' })}
              </Text>
            </View>
          </View>

          {/* ── Hero ── */}
          <View style={[s.heroSection, isTablet && s.heroSectionTablet, (isTight || densePlanMode) && !isTablet && s.heroSectionTight]}>
            <Text style={[s.heroEyebrow,{color:C.amber}]}>{t('onboarding.subscription.hero_eyebrow', { lang, fallback: 'Premium Plan' })}</Text>
            <Text style={[s.heroHeadline,{color:C.title}, isTablet && s.heroHeadlineTablet, (isTight || densePlanMode) && !isTablet && s.heroHeadlineTight]}>
              {t('onboarding.subscription.hero_headline_1', { lang, fallback: 'Score higher.' })}{'\n'}
              <Text style={{color:C.amber}}>{t('onboarding.subscription.hero_headline_2', { lang, fallback: 'Every week.' })}</Text>
            </Text>
            <Text style={[s.heroBody,{color:C.sub}, isTablet && s.heroBodyTablet, (isTight || densePlanMode) && !isTablet && s.heroBodyTight]}>
              {t('onboarding.subscription.hero_body', { lang, fallback: 'Most study apps give you a static plan and wish you luck. StudyMap Premium keeps your exam timeline and optimizes your plan weekly from real performance.' })}
            </Text>
          </View>

          {/* ── Quote ticker ── */}
          {!isTight && (
            <View style={[s.tickerCard, isTablet && s.tickerCardTablet, {backgroundColor:C.surface,borderColor:C.cardBorder}]}>
              <QuoteTicker quotes={quotes}/>
            </View>
          )}

          {/* ── Stats row ── */}
          <View style={[s.statRow, isTablet && s.statRowTablet, densePlanMode && !isTablet && s.statRowCompact]}>
            {stats.map((stat,i)=>(
              <Animated.View
                key={stat.label}
                style={[
                  s.statCell,
                  isTablet && s.statCellTablet,
                  densePlanMode && s.statCellCompact,
                  {backgroundColor:C.surface,borderColor:C.cardBorder},
                  {
                    opacity: statAnims[i],
                    transform:[{translateY:statAnims[i].interpolate({inputRange:[0,1],outputRange:[10,0]})}],
                  },
                ]}
              >
                <Text style={[s.statVal, isTablet && s.statValTablet,{color:C.amber}]}>{stat.value}</Text>
                <Text style={[s.statLabel, isTablet && s.statLabelTablet,{color:C.sub}]}>{stat.label}</Text>
                <Text style={[s.statSub, isTablet && s.statSubTablet,{color:C.dim}]}>{stat.sub}</Text>
              </Animated.View>
            ))}
          </View>

          {/* ── Plan cards ── */}
          <Text style={[s.sectionLabel,{color:C.muted}]}>{t('onboarding.subscription.choose_plan', { lang, fallback: 'Choose your plan' })}</Text>
          <View style={[s.planList, isTablet && s.planListTablet, isMultiPlan && !isTablet && s.planListCompact]}>
            {sortedPkgs.map(pkg=>(
              <PlanCard
                key={pkg.identifier}
                pkg={pkg}
                selected={selected?.identifier===pkg.identifier}
                onPress={()=>setSelected(pkg)}
                monthlyPkg={monthlyPkg}
                introEligible={introEligible}
                isPopular={pkg.packageType==='ANNUAL'}
                compact={isMultiPlan}
                tablet={isTablet}
                lang={lang}
              />
            ))}
          </View>
          {showDevPlanPreviews && (
            <View style={s.devPreviewList}>
              {DEV_PLAN_PREVIEWS.map((p) => (
                <View key={p.id} style={[s.devPreviewCard,{backgroundColor:C.surface,borderColor:C.cardBorder}]}>
                  <View style={s.devPreviewLeft}>
                    <View style={s.devPreviewTitleRow}>
                      <Text style={[s.devPreviewTitle,{color:C.sub}]}>{p.title}</Text>
                      <View style={[s.devPreviewBadge,{backgroundColor:C.amberSoft,borderColor:C.amberBorder}]}>
                        <Text style={[s.devPreviewBadgeTxt,{color:C.amber}]}>{t('onboarding.subscription.preview_badge', { lang, fallback: p.badge })}</Text>
                      </View>
                    </View>
                    <Text style={[s.devPreviewSub,{color:C.dim}]}>{p.sub}</Text>
                  </View>
                  <View style={s.devPreviewRight}>
                    <Text style={[s.devPreviewPrice,{color:C.sub}]}>{p.price}</Text>
                    <Text style={[s.devPreviewPeriod,{color:C.muted}]}>{p.period}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {showHighlights && (
            <>
              <Text style={[s.sectionLabel,{color:C.muted}]}>{t('onboarding.subscription.premium_highlights', { lang, fallback: 'Premium highlights' })}</Text>
              <View style={[s.benefitCard, isTablet && s.benefitCardTablet, {backgroundColor:C.surface,borderColor:C.cardBorder}]}>
                {visibleBenefits.map((b,i)=>(
                  <Animated.View
                    key={b.title}
                    style={{
                      opacity: benAnims[i],
                      transform:[{translateX:benAnims[i].interpolate({inputRange:[0,1],outputRange:[12,0]})}],
                    }}
                  >
                    <View style={[s.benRow,i>0&&{borderTopColor:'rgba(245,158,11,0.07)',borderTopWidth:StyleSheet.hairlineWidth}]}>
                      <LinearGradient
                        colors={[C.amber,C.amberDk]}
                        start={{x:0,y:0}} end={{x:0,y:1}}
                        style={s.benRail}
                      />
                      <View style={s.benIcon}>
                        <Text style={[s.benIconTxt,{color:C.amber}]}>{b.icon}</Text>
                      </View>
                      <View style={s.benBody}>
                        <Text style={[s.benTitle,{color:C.title}]}>{b.title}</Text>
                      </View>
                    </View>
                  </Animated.View>
                ))}
              </View>
            </>
          )}

          {/* Error banner */}
          {error && offerings && (
            <View style={[s.errBanner,{backgroundColor:C.errorBg,borderColor:C.errorBorder}]}>
              <Text style={[s.errTxt,{color:C.errorTxt}]}>{error}</Text>
            </View>
          )}

          <View style={{height:isTablet ? 214 : (isTight || densePlanMode) ? 122 : 182}}/>
        </ScrollView>
      </Animated.View>

      {/* ── Sticky footer ── */}
      <View style={[s.footer, isTablet && s.footerTablet, useCompactFooter && s.footerTight,{backgroundColor:'rgba(16,14,10,0.97)',borderTopColor:'rgba(245,158,11,0.12)'}]}>
        {/* Price context */}
        {selected && !purchasing && (
          <View style={[s.priceCtxRow, isTablet && s.priceCtxRowTablet, useCompactFooter && s.priceCtxRowCompact]}>
            <Text style={[s.priceCtxMain,{color:C.sub}]}>
              {getPriceContextLabel(lang, selected, monthlyEq(selected, lang))}
            </Text>
          </View>
        )}

        {/* CTA */}
        <Animated.View style={{transform:[{scale:ctaScale}]}}>
          <TouchableOpacity
            style={[s.cta, isTablet && s.ctaTablet, (purchasing||!selected)&&s.ctaDim]}
            onPress={handlePurchase}
            onPressIn={pressIn}
            onPressOut={pressOut}
            disabled={purchasing||!selected}
            activeOpacity={1}
          >
            {!purchasing&&!!selected&&(
              <LinearGradient
                colors={[C.amber,C.amberDk]}
                start={{x:0,y:0}} end={{x:1,y:1}}
                style={StyleSheet.absoluteFill}
              />
            )}
            {!purchasing&&!!selected&&<View style={s.ctaSheen}/>}
            {purchasing&&<ActivityIndicator size="small" color={C.amber} style={{marginRight:8}}/>}
            <Text
              style={[s.ctaTxt, isTablet && s.ctaTxtTablet, (purchasing||!selected)&&s.ctaTxtDim]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.86}
            >
              {ctaLabel}
            </Text>
            {!purchasing&&!!selected&&<Text style={[s.ctaArrow, isTablet && s.ctaArrowTablet]}>→</Text>}
          </TouchableOpacity>
        </Animated.View>

        {/* Restore + legal */}
        <View style={[s.legalRow, isTablet && s.legalRowTablet, useCompactFooter && s.legalRowTight]}>
          <TouchableOpacity onPress={handleRestore} disabled={restoring} activeOpacity={0.7}>
            {restoring
              ? <ActivityIndicator size="small" color={C.muted}/>
              : <Text style={[s.legalLink,{color:C.muted}]}>{t('onboarding.subscription.restore', { lang, fallback: 'Restore' })}</Text>
            }
          </TouchableOpacity>
          <Text style={[s.dot,{color:C.dim}]}>·</Text>
          <TouchableOpacity onPress={()=>Linking.openURL(TERMS_URL)} activeOpacity={0.7}>
            <Text style={[s.legalLink,{color:C.muted}]}>{t('onboarding.subscription.terms', { lang, fallback: 'Terms' })}</Text>
          </TouchableOpacity>
          <Text style={[s.dot,{color:C.dim}]}>·</Text>
          <TouchableOpacity onPress={()=>Linking.openURL(PRIVACY_URL)} activeOpacity={0.7}>
            <Text style={[s.legalLink,{color:C.muted}]}>{t('onboarding.subscription.privacy', { lang, fallback: 'Privacy' })}</Text>
          </TouchableOpacity>
        </View>
        {!useCompactFooter && (
          <Text style={[s.autoRenew,{color:C.dim}]}>
            {t('onboarding.subscription.auto_renew', { lang, fallback: 'Auto-renews unless cancelled 24h before period ends' })}
          </Text>
        )}
      </View>

      {/* ── Modals ── */}
      <AmberModal
        visible={showSuccess}
        variant="success"
        title={t('onboarding.subscription.modal_success_title', { lang, fallback: 'Premium activated!' })}
        body={t('onboarding.subscription.modal_success_body', { lang, fallback: 'Your plan is now optimized weekly from real performance while your exam timeline stays fixed. First update happens this Sunday.' })}
        ctaLabel={t('onboarding.subscription.modal_success_cta', { lang, fallback: 'Let\'s go →' })}
        onClose={()=>{ setShowSuccess(false); void navigate(); }}
      />
      <AmberModal
        visible={showRestoreOk}
        icon="✅"
        title={t('onboarding.subscription.modal_restore_title', { lang, fallback: 'Subscription restored' })}
        body={t('onboarding.subscription.modal_restore_body', { lang, fallback: 'Your Premium access is back. Welcome back — your plan is ready.' })}
        ctaLabel={t('common.continue', { lang, fallback: 'Continue' })}
        onClose={()=>{ setShowRestoreOk(false); void navigate(); }}
      />
      <AmberModal
        visible={showRestoreFail}
        icon="⚠️"
        title={t('onboarding.subscription.modal_restore_fail_title', { lang, fallback: 'Nothing to restore' })}
        body={restoreErrMsg}
        ctaLabel={t('onboarding.subscription.modal_got_it', { lang, fallback: 'Got it' })}
        isError
        onClose={()=>{ setShowRestoreFail(false); setRestoreErrMsg(''); }}
      />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:{ flex:1, backgroundColor:C.bg },
  orbA:{ position:'absolute', width:400, height:400, borderRadius:999, top:-160, right:-160, overflow:'hidden' },
  orbB:{ position:'absolute', width:180, height:180, borderRadius:999, bottom:240, left:-80, backgroundColor:'rgba(20,184,166,0.08)' },
  scroll:{ paddingHorizontal:22, paddingTop:34, paddingBottom:16 },
  scrollTablet:{ paddingHorizontal:38, paddingTop:28, paddingBottom:28 },
  scrollTight:{ paddingTop:18, paddingBottom:8 },
  devSkip:{ position:'absolute', top:56, right:22, zIndex:99 },

  brandRow:{ flexDirection:'row', alignItems:'center', gap:7, marginBottom:16 },
  brandRowTight:{ marginBottom:10 },
  brandRowTablet:{ marginBottom:16 },
  brandMark:{ width:7, height:7, borderRadius:2 },
  brandTxt:{ fontSize:14, fontWeight:'800', letterSpacing:0.4 },
  brandTxtTablet:{ fontSize:18 },
  brandSpacer:{ flex:1 },
  freePill:{ flexDirection:'row', alignItems:'center', gap:5, borderWidth:1, borderRadius:99, paddingHorizontal:9, paddingVertical:4 },
  freePillTablet:{ paddingHorizontal:14, paddingVertical:7, gap:7 },
  freeDot:{ width:5, height:5, borderRadius:3 },
  freePillTxt:{ fontSize:10, fontWeight:'700' },
  freePillTxtTablet:{ fontSize:13 },

  heroSection:{ gap:6, marginBottom:14 },
  heroSectionTight:{ gap:3, marginBottom:7 },
  heroSectionTablet:{ gap:12, marginBottom:30 },
  heroEyebrow:{ fontSize:11, fontWeight:'600', letterSpacing:0.5, textTransform:'uppercase' },
  heroHeadline:{ fontSize:38, fontWeight:'900', lineHeight:43, letterSpacing:-1 },
  heroHeadlineTight:{ fontSize:34, lineHeight:38 },
  heroHeadlineTablet:{ fontSize:60, lineHeight:64, letterSpacing:-1.6 },
  heroBody:{ fontSize:13, lineHeight:20, fontWeight:'400' },
  heroBodyTight:{ fontSize:11, lineHeight:15 },
  heroBodyTablet:{ fontSize:21, lineHeight:31, maxWidth:900 },

  tickerCard:{ borderWidth:1, borderRadius:13, paddingHorizontal:12, paddingVertical:7, marginBottom:8 },
  tickerCardTablet:{ borderRadius:18, paddingHorizontal:20, paddingVertical:14, marginBottom:18 },
  tickerWrap:{ flexDirection:'row', alignItems:'flex-start', gap:8 },
  tickerDot:{ width:6, height:6, borderRadius:3, marginTop:5, flexShrink:0 },
  tickerQuote:{ flex:1, fontSize:11, lineHeight:16, fontWeight:'400', fontStyle:'italic' },

  statRow:{ flexDirection:'row', gap:9, marginBottom:18 },
  statRowCompact:{ marginBottom:8, gap:7 },
  statRowTablet:{ gap:16, marginBottom:30 },
  statCell:{ flex:1, borderWidth:1, borderRadius:13, paddingHorizontal:9, paddingVertical:12, gap:4, alignItems:'center', justifyContent:'flex-start', minHeight:100 },
  statCellTablet:{ borderRadius:18, paddingHorizontal:14, paddingVertical:18, gap:7, minHeight:132 },
  statCellCompact:{ paddingVertical:8, paddingHorizontal:8, borderRadius:11, minHeight:90 },
  statVal:{ fontSize:22, fontWeight:'900', letterSpacing:-0.4 },
  statValTablet:{ fontSize:28, lineHeight:32 },
  statLabel:{ fontSize:12, fontWeight:'600', textAlign:'center', lineHeight:16, flexShrink:1 },
  statLabelTablet:{ fontSize:15, lineHeight:20 },
  statSub:{ fontSize:9, textAlign:'center', lineHeight:13, flexShrink:1 },
  statSubTablet:{ fontSize:11, lineHeight:16 },

  sectionLabel:{ fontSize:10, fontWeight:'600', letterSpacing:0.7, textTransform:'uppercase', marginBottom:6 },

  planList:{ gap:12, marginBottom:18 },
  planListCompact:{ gap:6, marginBottom:8 },
  planListTablet:{ gap:18, marginBottom:30 },
  devPreviewList:{ gap:8, marginBottom:12 },
  devPreviewCard:{ borderWidth:1, borderRadius:14, paddingHorizontal:12, paddingVertical:11, flexDirection:'row', alignItems:'center', gap:10 },
  devPreviewLeft:{ flex:1, gap:2 },
  devPreviewTitleRow:{ flexDirection:'row', alignItems:'center', gap:7 },
  devPreviewTitle:{ fontSize:13, fontWeight:'700' },
  devPreviewBadge:{ borderWidth:1, borderRadius:6, paddingHorizontal:6, paddingVertical:2 },
  devPreviewBadgeTxt:{ fontSize:9, fontWeight:'800', letterSpacing:0.5 },
  devPreviewSub:{ fontSize:10, fontWeight:'400' },
  devPreviewRight:{ alignItems:'flex-end' },
  devPreviewPrice:{ fontSize:16, fontWeight:'800', letterSpacing:-0.2 },
  devPreviewPeriod:{ fontSize:10, fontWeight:'500' },
  planCard:{ borderRadius:18, overflow:'hidden' },
  popularRibbon:{ height:24, alignItems:'center', justifyContent:'center' },
  popularRibbonTxt:{ fontSize:11, fontWeight:'800', color:'#000', letterSpacing:0.8 },
  planInner:{ flexDirection:'row', alignItems:'center', paddingHorizontal:14, paddingVertical:16, gap:10 },
  planInnerTablet:{ paddingHorizontal:22, paddingVertical:24, gap:16 },
  planInnerCompact:{ paddingHorizontal:11, paddingVertical:10, gap:7 },
  planLeft:{ flex:1, gap:4 },
  planTitleRow:{ flexDirection:'row', alignItems:'center', gap:8, flexWrap:'wrap' },
  planTitle:{ fontSize:16, fontWeight:'800', letterSpacing:-0.2 },
  planTitleTablet:{ fontSize:24, lineHeight:28 },
  saveBadge:{ borderWidth:1, borderRadius:6, paddingHorizontal:7, paddingVertical:2 },
  saveBadgeTxt:{ fontSize:9, fontWeight:'800', letterSpacing:0.5 },
  planSub:{ fontSize:11, fontWeight:'400', lineHeight:15 },
  planSubTablet:{ fontSize:16, lineHeight:23 },
  planSubCompact:{ lineHeight:13 },
  planEq:{ fontSize:11, fontWeight:'600' },
  planEqTablet:{ fontSize:15, lineHeight:20 },
  planEqCompact:{ fontSize:9 },
  introBadge:{ alignSelf:'flex-start', borderWidth:1, borderRadius:7, paddingHorizontal:7, paddingVertical:3, marginTop:2 },
  introTxt:{ fontSize:9, fontWeight:'700' },
  planRight:{ alignItems:'flex-end', gap:1, minWidth:78, flexShrink:0 },
  planOldPrice:{ fontSize:11, fontWeight:'700', textDecorationLine:'line-through' },
  planPrice:{ fontSize:21, fontWeight:'900', letterSpacing:-0.3 },
  planPriceTablet:{ fontSize:34, lineHeight:38 },
  planPeriod:{ fontSize:11 },
  planPeriodTablet:{ fontSize:15, lineHeight:20 },
  radio:{ width:22, height:22, borderRadius:11, borderWidth:1.5, alignItems:'center', justifyContent:'center', flexShrink:0 },
  radioTablet:{ width:28, height:28, borderRadius:14 },
  radioDot:{ width:9, height:9, borderRadius:4.5, backgroundColor:'#000' },

  benefitCard:{ borderWidth:1, borderRadius:15, overflow:'hidden', marginBottom:10 },
  benefitCardTablet:{ borderRadius:20, marginBottom:20 },
  benRow:{ flexDirection:'row', alignItems:'center', paddingRight:12, paddingVertical:10 },
  benRail:{ width:3, alignSelf:'stretch', marginRight:0 },
  benIcon:{ width:34, alignItems:'center' },
  benIconTxt:{ fontSize:15, fontWeight:'700' },
  benBody:{ flex:1, gap:2 },
  benTitle:{ fontSize:13, fontWeight:'700', letterSpacing:-0.1 },
  benDesc:{ fontSize:10, fontWeight:'400', lineHeight:14 },

  errBanner:{ borderWidth:1, borderRadius:12, padding:12, marginBottom:10 },
  errTxt:{ fontSize:12, fontWeight:'500', textAlign:'center' },
  retryBtn:{ borderWidth:1, borderRadius:12, paddingHorizontal:24, paddingVertical:12 },

  footer:{ position:'absolute', left:0, right:0, bottom:0, paddingHorizontal:22, paddingTop:10, paddingBottom:18, borderTopWidth:StyleSheet.hairlineWidth, gap:7 },
  footerTight:{ paddingTop:8, paddingBottom:14, gap:5 },
  footerTablet:{ paddingHorizontal:38, paddingTop:18, paddingBottom:28, gap:14 },
  priceCtxRow:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', gap:8 },
  priceCtxRowCompact:{ alignItems:'flex-start' },
  priceCtxRowTablet:{ alignItems:'center' },
  priceCtxMain:{ fontSize:11, fontWeight:'400', flex:1, marginRight:8 },
  priceCtxFree:{ fontSize:12, fontWeight:'700', flexShrink:1, textAlign:'right' },
  cta:{ height:FOOTER.ctaHeight, borderRadius:FOOTER.ctaRadius, flexDirection:'row', alignItems:'center', justifyContent:'center',
    overflow:'hidden', gap:8, shadowColor:C.amber, shadowOffset:{width:0,height:8}, shadowOpacity:0.38, shadowRadius:20, elevation:10 },
  ctaTablet:{ height:72, borderRadius:24, gap:10 },
  ctaDim:{ backgroundColor:'rgba(100,80,40,0.18)', shadowOpacity:0, elevation:0 },
  ctaSheen:{ position:'absolute', top:0, left:0, right:0, height:'44%', backgroundColor:'rgba(255,255,255,0.12)' },
  ctaTxt:{ color:'#000', fontSize:15, fontWeight:'900', letterSpacing:0.1 },
  ctaTxtTablet:{ fontSize:22 },
  ctaTxtDim:{ color:'rgba(180,160,120,0.40)' },
  ctaArrow:{ color:'rgba(0,0,0,0.50)', fontSize:16 },
  ctaArrowTablet:{ fontSize:24 },
  legalRow:{ flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, flexWrap:'wrap' },
  legalRowTight:{ gap:6 },
  legalRowTablet:{ gap:12 },
  legalLink:{ fontSize:11, fontWeight:'500' },
  dot:{ fontSize:12 },
  autoRenew:{ textAlign:'center', fontSize:9, letterSpacing:0.2 },

  modalOverlay:{ flex:1, backgroundColor:'rgba(0,0,0,0.78)', justifyContent:'center', alignItems:'center', paddingHorizontal:28 },
  modalCard:{ width:'100%', borderRadius:22, borderWidth:1, padding:28, alignItems:'center', gap:12 },
  modalIconWrap:{ width:70, height:70, borderRadius:20, alignItems:'center', justifyContent:'center', marginBottom:4 },
  successBadgeOuter:{ width:44, height:44, borderRadius:22, overflow:'hidden', alignItems:'center', justifyContent:'center',
    shadowColor:C.amber, shadowOffset:{width:0,height:5}, shadowOpacity:0.35, shadowRadius:10, elevation:6 },
  successBadgeInner:{ width:28, height:28, borderRadius:14, backgroundColor:'rgba(0,0,0,0.22)', alignItems:'center', justifyContent:'center' },
  successBadgeCheck:{ color:'#FFF7E6', fontSize:17, fontWeight:'900', marginTop:-1 },
  modalTitle:{ fontSize:22, fontWeight:'900', textAlign:'center', letterSpacing:-0.4 },
  modalBody:{ fontSize:13, lineHeight:20, textAlign:'center', fontWeight:'400' },
  modalCta:{ width:'100%', height:52, borderRadius:13, overflow:'hidden', alignItems:'center', justifyContent:'center', marginTop:8 },
  modalCtaTxt:{ color:'#000', fontSize:16, fontWeight:'800' },
});
