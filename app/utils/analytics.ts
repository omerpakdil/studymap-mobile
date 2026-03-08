import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '@/app/utils/supabase';

type AnalyticsProvider = 'console' | 'supabase';

interface AnalyticsEventPayload {
  [key: string]: unknown;
}

interface PrivacySettings {
  analytics?: boolean;
}

const PRIVACY_SETTINGS_KEY = 'privacy_settings';
const INSTALLATION_ID_KEY = 'analytics_installation_id';

let cachedPrivacy: PrivacySettings | null = null;
let cachedPrivacyAt = 0;
const PRIVACY_CACHE_TTL_MS = 10_000;

const resolveProvider = (): AnalyticsProvider => {
  const raw = process.env.EXPO_PUBLIC_ANALYTICS_PROVIDER;
  if (raw === 'supabase') return 'supabase';
  return 'console';
};

const getInstallationId = async (): Promise<string> => {
  try {
    const existing = await AsyncStorage.getItem(INSTALLATION_ID_KEY);
    if (existing) return existing;

    const next = `inst_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    await AsyncStorage.setItem(INSTALLATION_ID_KEY, next);
    return next;
  } catch {
    return `inst_fallback_${Date.now()}`;
  }
};

const isAnalyticsAllowed = async (): Promise<boolean> => {
  const now = Date.now();
  if (cachedPrivacy && now - cachedPrivacyAt < PRIVACY_CACHE_TTL_MS) {
    if (typeof cachedPrivacy.analytics === 'boolean') return cachedPrivacy.analytics;
    return true;
  }

  try {
    const raw = await AsyncStorage.getItem(PRIVACY_SETTINGS_KEY);
    if (!raw) return true;
    const parsed = JSON.parse(raw) as PrivacySettings;
    cachedPrivacy = parsed;
    cachedPrivacyAt = now;
    if (typeof parsed.analytics === 'boolean') return parsed.analytics;
    return true;
  } catch {
    return true;
  }
};

const sendToSupabase = async (
  eventName: string,
  payload: AnalyticsEventPayload
): Promise<void> => {
  const { error } = await supabase.from('analytics_events').insert({
    event_name: eventName,
    payload,
    created_at: new Date().toISOString(),
  });

  if (error) {
    throw error;
  }
};

const getErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === 'string' && maybeMessage.length > 0) return maybeMessage;
    try {
      return JSON.stringify(error);
    } catch {}
  }
  return 'Unknown analytics error';
};

export async function trackEvent(
  eventName: string,
  payload: AnalyticsEventPayload = {}
): Promise<void> {
  const allowed = await isAnalyticsAllowed();
  if (!allowed) return;

  const installationId = await getInstallationId();
  const provider = resolveProvider();
  const enrichedPayload: AnalyticsEventPayload = {
    ...payload,
    installation_id: installationId,
  };

  try {
    if (provider === 'supabase') {
      await sendToSupabase(eventName, enrichedPayload);
    } else {
      console.log(`[ANALYTICS] ${eventName}`, enrichedPayload);
    }
  } catch (error) {
    const reason = getErrorMessage(error);
    if (__DEV__) {
      console.warn(`[ANALYTICS_WARN] ${eventName}: ${reason}`);
      console.log(`[ANALYTICS_FALLBACK] ${eventName}`, enrichedPayload);
    }
  }
}
