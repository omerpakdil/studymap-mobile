import type { SupportedLanguage } from '@/app/i18n';

export type DateOrder = 'MDY' | 'DMY' | 'YMD';
export type DateFormatConfig = {
  order: DateOrder;
  separator: '/' | '.';
};

export const getDateFormatByLanguage = (lang: SupportedLanguage): DateFormatConfig => {
  if (lang === 'en') return { order: 'MDY', separator: '/' };
  if (lang === 'ja' || lang === 'ko' || lang === 'zh-Hans') return { order: 'YMD', separator: '/' };
  return { order: 'DMY', separator: '.' };
};

export const getDateTokens = (order: DateOrder): [string, string, string] => {
  if (order === 'YMD') return ['YYYY', 'MM', 'DD'];
  if (order === 'DMY') return ['DD', 'MM', 'YYYY'];
  return ['MM', 'DD', 'YYYY'];
};

export const formatDateValue = (date: Date, order: DateOrder, separator: '/' | '.'): string => {
  const yyyy = String(date.getFullYear());
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  if (order === 'YMD') return `${yyyy}${separator}${mm}${separator}${dd}`;
  if (order === 'DMY') return `${dd}${separator}${mm}${separator}${yyyy}`;
  return `${mm}${separator}${dd}${separator}${yyyy}`;
};

export const formatDateInput = (text: string, order: DateOrder, separator: '/' | '.') => {
  const cleaned = text.replace(/\D/g, '');
  if (order === 'YMD') {
    if (cleaned.length <= 4) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 4)}${separator}${cleaned.slice(4)}`;
    return `${cleaned.slice(0, 4)}${separator}${cleaned.slice(4, 6)}${separator}${cleaned.slice(6, 8)}`;
  }
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 4) return `${cleaned.slice(0, 2)}${separator}${cleaned.slice(2)}`;
  return `${cleaned.slice(0, 2)}${separator}${cleaned.slice(2, 4)}${separator}${cleaned.slice(4, 8)}`;
};

export const parseDate = (value: string, order: DateOrder): Date | null => {
  const parts = value.split(/\D+/).map(Number);
  let dd = 0;
  let mm = 0;
  let yyyy = 0;
  if (order === 'YMD') {
    [yyyy, mm, dd] = parts;
  } else if (order === 'DMY') {
    [dd, mm, yyyy] = parts;
  } else {
    [mm, dd, yyyy] = parts;
  }

  if (!mm || !dd || !yyyy || yyyy < 1000) return null;
  const d = new Date(yyyy, mm - 1, dd);
  if (d.getFullYear() !== yyyy || d.getMonth() !== mm - 1 || d.getDate() !== dd) return null;
  return d;
};

