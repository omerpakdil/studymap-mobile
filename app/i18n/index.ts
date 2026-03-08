import AsyncStorage from '@react-native-async-storage/async-storage';
import { enMessages, type AppMessages } from '@/app/i18n/messages/en';
import { arMessages } from '@/app/i18n/messages/ar';
import { deMessages } from '@/app/i18n/messages/de';
import { frMessages } from '@/app/i18n/messages/fr';
import { hiMessages } from '@/app/i18n/messages/hi';
import { idMessages } from '@/app/i18n/messages/id';
import { jaMessages } from '@/app/i18n/messages/ja';
import { koMessages } from '@/app/i18n/messages/ko';
import { ptBRMessages } from '@/app/i18n/messages/pt-BR';
import { trMessages } from '@/app/i18n/messages/tr';
import { zhHansMessages } from '@/app/i18n/messages/zh-Hans';
import { NativeModules, Platform } from 'react-native';

export const SUPPORTED_LANGUAGES = [
  'en',
  'zh-Hans',
  'ja',
  'pt-BR',
  'ko',
  'de',
  'tr',
  'ar',
  'fr',
  'id',
  'hi',
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';
const APP_LANGUAGE_STORAGE_KEY = 'app_language_override';
let appLanguageOverride: SupportedLanguage | null = null;

const languageAliases: Record<string, SupportedLanguage> = {
  en: 'en',
  'en-us': 'en',
  'en-gb': 'en',
  'en-ca': 'en',
  'en-au': 'en',
  'en-in': 'en',
  ja: 'ja',
  'ja-jp': 'ja',
  ko: 'ko',
  'ko-kr': 'ko',
  de: 'de',
  'de-de': 'de',
  tr: 'tr',
  'tr-tr': 'tr',
  ar: 'ar',
  'ar-sa': 'ar',
  'ar-ae': 'ar',
  fr: 'fr',
  'fr-fr': 'fr',
  id: 'id',
  'id-id': 'id',
  hi: 'hi',
  'hi-in': 'hi',
  pt: 'pt-BR',
  'pt-br': 'pt-BR',
  'pt-pt': 'pt-BR',
  zh: 'zh-Hans',
  'zh-cn': 'zh-Hans',
  'zh-sg': 'zh-Hans',
  'zh-hans': 'zh-Hans',
};

// Phase-1 message catalog scaffold: non-English locales currently inherit EN.
// Sprint-4 screens can migrate to `t()` now, then localized copy can be filled per language.
const messageCatalog: Record<SupportedLanguage, AppMessages> = {
  en: enMessages,
  'zh-Hans': zhHansMessages,
  ja: jaMessages,
  'pt-BR': ptBRMessages,
  ko: koMessages,
  de: deMessages,
  tr: trMessages,
  ar: arMessages,
  fr: frMessages,
  id: idMessages,
  hi: hiMessages,
};

export const normalizeLocale = (value: string): string => value.replace('_', '-').toLowerCase();

export const isSupportedLanguage = (value: string): value is SupportedLanguage =>
  (SUPPORTED_LANGUAGES as readonly string[]).includes(value);

export const resolveSupportedLanguageOrNull = (value?: string | null): SupportedLanguage | null => {
  if (!value) return null;
  const normalized = normalizeLocale(value);
  const exact = languageAliases[normalized];
  if (exact) return exact;

  const base = normalized.split('-')[0];
  return languageAliases[base] ?? null;
};

export const resolveSupportedLanguage = (value?: string | null): SupportedLanguage =>
  resolveSupportedLanguageOrNull(value) ?? DEFAULT_LANGUAGE;

const getRuntimeLocales = (): string[] => {
  const locales: string[] = [];

  if (Platform.OS === 'ios') {
    const settings = NativeModules.SettingsManager?.settings;
    const preferred = settings?.AppleLanguages;
    if (Array.isArray(preferred)) {
      preferred.forEach((value: unknown) => {
        if (typeof value === 'string' && value.length > 0) locales.push(value);
      });
    }
    if (typeof settings?.AppleLocale === 'string' && settings.AppleLocale.length > 0) {
      locales.push(settings.AppleLocale);
    }
  }

  if (Platform.OS === 'android') {
    const locale = NativeModules.I18nManager?.localeIdentifier;
    if (typeof locale === 'string' && locale.length > 0) locales.push(locale);
  }

  // iOS can expose this from I18nManager in some RN versions as well.
  const genericLocale = NativeModules.I18nManager?.localeIdentifier;
  if (typeof genericLocale === 'string' && genericLocale.length > 0) {
    locales.push(genericLocale);
  }

  locales.push(Intl.DateTimeFormat().resolvedOptions().locale);
  return locales.filter(Boolean);
};

const getRuntimeLocale = (): string => getRuntimeLocales()[0] ?? DEFAULT_LANGUAGE;

const resolveLanguageFromRuntimeLocales = (locales: string[]): SupportedLanguage | null => {
  const first = locales[0];
  const firstResolved = resolveSupportedLanguageOrNull(first);

  if (firstResolved === 'en' && first) {
    const region = normalizeLocale(first).split('-')[1] ?? '';
    const englishRegions = new Set(['us', 'gb', 'ca', 'au', 'in', 'nz', 'ie', 'sg']);
    if (region && !englishRegions.has(region)) {
      for (const locale of locales) {
        const candidate = resolveSupportedLanguageOrNull(locale);
        if (candidate && candidate !== 'en') return candidate;
      }
    }
  }

  if (firstResolved) return firstResolved;
  for (const locale of locales) {
    const candidate = resolveSupportedLanguageOrNull(locale);
    if (candidate) return candidate;
  }
  return null;
};

export const getDeviceLanguage = (): SupportedLanguage => {
  return resolveLanguageFromRuntimeLocales(getRuntimeLocales()) ?? DEFAULT_LANGUAGE;
};

export const getDeviceRegion = (): string => {
  const locale = getRuntimeLocale();
  const parts = normalizeLocale(locale).split('-');
  const region = parts.length > 1 ? parts[parts.length - 1] : 'us';
  return region.toUpperCase();
};

export const resolveAppLanguage = (opts?: {
  explicitLanguage?: string | null;
  deviceLocale?: string | null;
  countryDefaultLanguage?: SupportedLanguage | null;
}): SupportedLanguage => {
  if (appLanguageOverride) return appLanguageOverride;

  const explicit = resolveSupportedLanguageOrNull(opts?.explicitLanguage);
  if (explicit) return explicit;

  const device = opts?.deviceLocale
    ? resolveSupportedLanguageOrNull(opts.deviceLocale)
    : resolveLanguageFromRuntimeLocales(getRuntimeLocales());
  if (device) return device;

  if (opts?.countryDefaultLanguage && isSupportedLanguage(opts.countryDefaultLanguage)) {
    return opts.countryDefaultLanguage;
  }

  return DEFAULT_LANGUAGE;
};

export const getPersistedAppLanguage = (): SupportedLanguage | null => appLanguageOverride;

export const hydrateAppLanguage = async (): Promise<SupportedLanguage | null> => {
  try {
    const raw = await AsyncStorage.getItem(APP_LANGUAGE_STORAGE_KEY);
    const resolved = resolveSupportedLanguageOrNull(raw);
    const device = resolveLanguageFromRuntimeLocales(getRuntimeLocales());

    // Legacy cleanup: previously we auto-persisted language from country selection.
    // If stored override conflicts with current device language, drop it.
    if (resolved && device && resolved !== device) {
      await AsyncStorage.removeItem(APP_LANGUAGE_STORAGE_KEY);
      appLanguageOverride = null;
      return null;
    }

    appLanguageOverride = resolved;
    return resolved;
  } catch {
    appLanguageOverride = null;
    return null;
  }
};

export const persistAppLanguage = async (lang?: string | null): Promise<SupportedLanguage | null> => {
  const resolved = resolveSupportedLanguageOrNull(lang);
  appLanguageOverride = resolved;
  try {
    if (resolved) {
      await AsyncStorage.setItem(APP_LANGUAGE_STORAGE_KEY, resolved);
    } else {
      await AsyncStorage.removeItem(APP_LANGUAGE_STORAGE_KEY);
    }
  } catch {}
  return resolved;
};

const getMessageValue = (lang: SupportedLanguage, key: string): string | null => {
  const tree = messageCatalog[lang] as Record<string, unknown>;
  const parts = key.split('.');
  let current: unknown = tree;

  for (const part of parts) {
    if (typeof current !== 'object' || current === null || !(part in current)) {
      return null;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return typeof current === 'string' ? current : null;
};

const interpolate = (template: string, params?: Record<string, string | number>): string => {
  if (!params) return template;
  return Object.entries(params).reduce(
    (acc, [key, value]) => acc.replaceAll(`{${key}}`, String(value)),
    template
  );
};

export const t = (
  key: string,
  opts?: {
    lang?: SupportedLanguage;
    params?: Record<string, string | number>;
    fallback?: string;
  }
): string => {
  const lang = opts?.lang ?? getDeviceLanguage();
  const direct = getMessageValue(lang, key);
  if (direct) return interpolate(direct, opts?.params);

  const fallbackLang = getMessageValue(DEFAULT_LANGUAGE, key);
  if (fallbackLang) return interpolate(fallbackLang, opts?.params);

  return opts?.fallback ?? key;
};

export const isRtlLanguage = (lang: SupportedLanguage): boolean => lang === 'ar';

export const getLocaleTagForLanguage = (lang: SupportedLanguage): string => {
  switch (lang) {
    case 'tr':
      return 'tr-TR';
    case 'ar':
      return 'ar-SA';
    case 'de':
      return 'de-DE';
    case 'ja':
      return 'ja-JP';
    case 'ko':
      return 'ko-KR';
    case 'pt-BR':
      return 'pt-BR';
    case 'zh-Hans':
      return 'zh-CN';
    case 'fr':
      return 'fr-FR';
    case 'id':
      return 'id-ID';
    case 'hi':
      return 'hi-IN';
    case 'en':
    default:
      return 'en-US';
  }
};
