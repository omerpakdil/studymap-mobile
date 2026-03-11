import type { SupportedLanguage } from '@/app/i18n';

const MINUTE_UNIT: Record<SupportedLanguage, string> = {
  en: 'm',
  tr: 'dk',
  de: 'Min',
  fr: 'min',
  ja: '分',
  ko: '분',
  'zh-Hans': '分',
  ar: 'د',
  hi: 'मि',
  id: 'mnt',
  'pt-BR': 'min',
};

const HOUR_UNIT: Record<SupportedLanguage, string> = {
  en: 'h',
  tr: 'sa',
  de: 'Std',
  fr: 'h',
  ja: '時間',
  ko: '시간',
  'zh-Hans': '小时',
  ar: 'س',
  hi: 'घं',
  id: 'jam',
  'pt-BR': 'h',
};

const DAY_UNIT: Record<SupportedLanguage, string> = {
  en: 'd',
  tr: 'g',
  de: 'T',
  fr: 'j',
  ja: '日',
  ko: '일',
  'zh-Hans': '天',
  ar: 'ي',
  hi: 'दि',
  id: 'h',
  'pt-BR': 'd',
};

export const getMinuteUnitShort = (lang: SupportedLanguage): string => MINUTE_UNIT[lang] || MINUTE_UNIT.en;

export const getHourUnitShort = (lang: SupportedLanguage): string => HOUR_UNIT[lang] || HOUR_UNIT.en;

export const getDayUnitShort = (lang: SupportedLanguage): string => DAY_UNIT[lang] || DAY_UNIT.en;

export const formatMinutesCompact = (value: number, lang: SupportedLanguage): string =>
  `${value}${getMinuteUnitShort(lang)}`;

export const formatHoursCompact = (value: number, lang: SupportedLanguage): string =>
  `${value}${getHourUnitShort(lang)}`;

export const formatDaysCompact = (value: number, lang: SupportedLanguage): string =>
  `${value}${getDayUnitShort(lang)}`;

