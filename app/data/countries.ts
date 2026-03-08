import { getDeviceRegion, resolveAppLanguage, SupportedLanguage } from '@/app/i18n';

export interface CountryDefinition {
  code: string;
  name: string;
  defaultLanguage: SupportedLanguage;
  supportedLanguages: SupportedLanguage[];
}

export const supportedCountries: CountryDefinition[] = [
  { code: 'US', name: 'United States', defaultLanguage: 'en', supportedLanguages: ['en'] },
  { code: 'CN', name: 'China', defaultLanguage: 'zh-Hans', supportedLanguages: ['zh-Hans', 'en'] },
  { code: 'JP', name: 'Japan', defaultLanguage: 'ja', supportedLanguages: ['ja', 'en'] },
  { code: 'IN', name: 'India', defaultLanguage: 'hi', supportedLanguages: ['hi', 'en'] },
  { code: 'BR', name: 'Brazil', defaultLanguage: 'pt-BR', supportedLanguages: ['pt-BR', 'en'] },
  { code: 'KR', name: 'South Korea', defaultLanguage: 'ko', supportedLanguages: ['ko', 'en'] },
  { code: 'DE', name: 'Germany', defaultLanguage: 'de', supportedLanguages: ['de', 'en'] },
  { code: 'UK', name: 'United Kingdom', defaultLanguage: 'en', supportedLanguages: ['en'] },
  { code: 'ID', name: 'Indonesia', defaultLanguage: 'id', supportedLanguages: ['id', 'en'] },
  { code: 'FR', name: 'France', defaultLanguage: 'fr', supportedLanguages: ['fr', 'en'] },
  { code: 'CA', name: 'Canada', defaultLanguage: 'en', supportedLanguages: ['en', 'fr'] },
  { code: 'TR', name: 'Turkey', defaultLanguage: 'tr', supportedLanguages: ['tr', 'en'] },
  { code: 'SA', name: 'Saudi Arabia', defaultLanguage: 'ar', supportedLanguages: ['ar', 'en'] },
];

const countryMap = new Map(supportedCountries.map((c) => [c.code, c]));

export const getCountryByCode = (code?: string | null): CountryDefinition | null => {
  if (!code) return null;
  return countryMap.get(code.toUpperCase()) ?? null;
};

export const getInitialCountry = (): CountryDefinition => {
  const region = getDeviceRegion();
  return getCountryByCode(region) ?? getCountryByCode('US')!;
};

export const getInitialLanguage = (countryCode?: string): SupportedLanguage => {
  const country = getCountryByCode(countryCode || getInitialCountry().code);
  return resolveAppLanguage({
    countryDefaultLanguage: country?.defaultLanguage ?? null,
  });
};
