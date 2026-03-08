/**
 * StudyMap Onboarding V2 — "Clean Slate" Design System
 *
 * Aesthetic: Minimal & Neutral base (warm whites, cool grays, slate)
 * with Teal / Emerald as the single bold accent family.
 * Light-first. Sophisticated. No purple anywhere.
 */

export type DeviceClass =
  | 'iphone_compact'
  | 'iphone_small'
  | 'iphone_standard'
  | 'iphone_large';

export interface OnboardingV2Tokens {
  deviceClass: DeviceClass;
  horizontalPadding: number;
  headlineSize: number;
  subtitleSize: number;
  cardRadius: number;
  maxContentWidth?: number;
  headlineLineHeight: number;
  contentGap: number;
}

export const isCompactOnboardingDevice = (width: number) => width <= 350;

export type OnboardingV2BackgroundVariant =
  | 'slate'       // cool white → pale grey → faint teal wash   (default)
  | 'fog'         // pure white → light grey → barely-blue       (airy)
  | 'graphite'    // warm charcoal → deep slate                  (premium dark)
  | 'teal'        // teal-tinted white → seafoam                 (accent-forward)
  | 'sand'        // warm cream → stone                          (earthy)
  | 'ink';        // near-black → dark teal-slate                (editorial dark)

export type OnboardingV2BackgroundMotif =
  | 'grid'
  | 'topography'
  | 'dots'
  | 'diagonals'
  | 'none';

export interface BackgroundConfig {
  gradient: [string, string, string, string];
  orbA: string;
  orbB: string;
  orbC: string;
  highlight: string;
  motif: OnboardingV2BackgroundMotif;
  mist: string;
  accent: string;
  accentSoft: string;
  shimmer: string;
  cardGlass: string;
  cardBorder: string;
  btnGradientA: string;
  btnGradientB: string;
  titleColor: string;
  subtitleColor: string;
  brandColor: string;
  backArrowColor: string;
  isDark: boolean;
}

export const onboardingV2Backgrounds: Record<
  OnboardingV2BackgroundVariant,
  BackgroundConfig
> = {
  slate: {
    gradient: ['#FAFBFC', '#F4F6F8', '#EEF1F4', '#F8FAFB'],
    orbA: 'rgba(15,157,140,0.10)',
    orbB: 'rgba(100,116,139,0.07)',
    orbC: 'rgba(15,157,140,0.07)',
    highlight: 'rgba(255,255,255,0.90)',
    motif: 'grid',
    mist: 'rgba(255,255,255,0.18)',
    accent: '#0F9D8C',
    accentSoft: 'rgba(15,157,140,0.09)',
    shimmer: 'rgba(100,116,139,0.10)',
    cardGlass: 'rgba(255,255,255,0.88)',
    cardBorder: 'rgba(15,23,42,0.07)',
    btnGradientA: '#0F9D8C',
    btnGradientB: '#0B7A6E',
    titleColor: '#0F172A',
    subtitleColor: '#475569',
    brandColor: '#0F9D8C',
    backArrowColor: '#64748B',
    isDark: false,
  },
  fog: {
    gradient: ['#FFFFFF', '#F8FAFB', '#F1F5F9', '#FAFCFE'],
    orbA: 'rgba(13,148,136,0.08)',
    orbB: 'rgba(148,163,184,0.06)',
    orbC: 'rgba(52,211,153,0.07)',
    highlight: 'rgba(255,255,255,0.95)',
    motif: 'dots',
    mist: 'rgba(255,255,255,0.12)',
    accent: '#0D9488',
    accentSoft: 'rgba(13,148,136,0.09)',
    shimmer: 'rgba(148,163,184,0.08)',
    cardGlass: 'rgba(255,255,255,0.92)',
    cardBorder: 'rgba(15,23,42,0.06)',
    btnGradientA: '#0D9488',
    btnGradientB: '#0F766E',
    titleColor: '#0F172A',
    subtitleColor: '#64748B',
    brandColor: '#0D9488',
    backArrowColor: '#94A3B8',
    isDark: false,
  },
  graphite: {
    gradient: ['#141414', '#1C1C1C', '#1E2422', '#181818'],
    orbA: 'rgba(20,184,166,0.22)',
    orbB: 'rgba(52,211,153,0.14)',
    orbC: 'rgba(15,157,140,0.12)',
    highlight: 'rgba(20,184,166,0.14)',
    motif: 'topography',
    mist: 'rgba(0,0,0,0.18)',
    accent: '#2DD4BF',
    accentSoft: 'rgba(45,212,191,0.14)',
    shimmer: 'rgba(45,212,191,0.09)',
    cardGlass: 'rgba(255,255,255,0.05)',
    cardBorder: 'rgba(45,212,191,0.14)',
    btnGradientA: '#14B8A6',
    btnGradientB: '#0F9D8C',
    titleColor: '#F1F5F9',
    subtitleColor: 'rgba(203,213,225,0.68)',
    brandColor: '#2DD4BF',
    backArrowColor: 'rgba(148,163,184,0.70)',
    isDark: true,
  },
  teal: {
    gradient: ['#F0FDFB', '#ECFDF8', '#F5FFFE', '#FAFFFE'],
    orbA: 'rgba(20,184,166,0.16)',
    orbB: 'rgba(52,211,153,0.12)',
    orbC: 'rgba(13,148,136,0.09)',
    highlight: 'rgba(255,255,255,0.80)',
    motif: 'diagonals',
    mist: 'rgba(255,255,255,0.22)',
    accent: '#0D9488',
    accentSoft: 'rgba(13,148,136,0.10)',
    shimmer: 'rgba(20,184,166,0.11)',
    cardGlass: 'rgba(255,255,255,0.82)',
    cardBorder: 'rgba(13,148,136,0.11)',
    btnGradientA: '#0D9488',
    btnGradientB: '#0F766E',
    titleColor: '#042F2E',
    subtitleColor: '#115E59',
    brandColor: '#0F766E',
    backArrowColor: '#0F766E',
    isDark: false,
  },
  sand: {
    gradient: ['#FDFBF7', '#F8F4EE', '#F2EDE5', '#FAF8F4'],
    orbA: 'rgba(13,148,136,0.09)',
    orbB: 'rgba(180,160,130,0.09)',
    orbC: 'rgba(13,148,136,0.06)',
    highlight: 'rgba(255,255,255,0.85)',
    motif: 'dots',
    mist: 'rgba(255,255,255,0.20)',
    accent: '#0D9488',
    accentSoft: 'rgba(13,148,136,0.09)',
    shimmer: 'rgba(180,160,130,0.11)',
    cardGlass: 'rgba(255,255,255,0.85)',
    cardBorder: 'rgba(100,80,50,0.08)',
    btnGradientA: '#0D9488',
    btnGradientB: '#0F766E',
    titleColor: '#1C1208',
    subtitleColor: '#78716C',
    brandColor: '#0D9488',
    backArrowColor: '#A8A29E',
    isDark: false,
  },
  ink: {
    gradient: ['#080C0B', '#0C1210', '#0F1A18', '#080C0B'],
    orbA: 'rgba(20,184,166,0.26)',
    orbB: 'rgba(52,211,153,0.15)',
    orbC: 'rgba(6,95,70,0.28)',
    highlight: 'rgba(45,212,191,0.11)',
    motif: 'grid',
    mist: 'rgba(0,0,0,0.20)',
    accent: '#34D399',
    accentSoft: 'rgba(52,211,153,0.13)',
    shimmer: 'rgba(52,211,153,0.09)',
    cardGlass: 'rgba(255,255,255,0.04)',
    cardBorder: 'rgba(52,211,153,0.13)',
    btnGradientA: '#10B981',
    btnGradientB: '#059669',
    titleColor: '#ECFDF5',
    subtitleColor: 'rgba(167,243,208,0.62)',
    brandColor: '#34D399',
    backArrowColor: 'rgba(110,231,183,0.58)',
    isDark: true,
  },
};

export const onboardingV2Palette = {
  bgTop: '#FAFBFC',
  bgMid: '#F4F6F8',
  bgBottom: '#EEF1F4',
  ink: '#0F172A',
  mutedInk: '#475569',
  accentTeal: '#0F9D8C',
  accentBlue: '#0D9488',
  accentOrange: '#F97316',
  accentGreen: '#10B981',
  card: 'rgba(255,255,255,0.88)',
  cardBorder: 'rgba(15,23,42,0.07)',
};

export const getOnboardingV2Tokens = (width: number): OnboardingV2Tokens => {
  if (width <= 320) {
    return { deviceClass: 'iphone_compact', horizontalPadding: 16, headlineSize: 27, subtitleSize: 14, cardRadius: 18, headlineLineHeight: 1.16, contentGap: 10 };
  }
  if (width < 380) {
    return { deviceClass: 'iphone_small', horizontalPadding: 18, headlineSize: 30, subtitleSize: 15, cardRadius: 20, headlineLineHeight: 1.15, contentGap: 12 };
  }
  if (width < 430) {
    return { deviceClass: 'iphone_standard', horizontalPadding: 20, headlineSize: 32, subtitleSize: 16, cardRadius: 22, headlineLineHeight: 1.13, contentGap: 14 };
  }
  return { deviceClass: 'iphone_large', horizontalPadding: 24, headlineSize: 35, subtitleSize: 17, cardRadius: 24, maxContentWidth: 440, headlineLineHeight: 1.11, contentGap: 16 };
};
