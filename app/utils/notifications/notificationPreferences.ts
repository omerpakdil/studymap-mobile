import AsyncStorage from '@react-native-async-storage/async-storage';

import { NotificationPreferences } from '@/app/types/notifications';

export const NOTIFICATION_PREFERENCES_KEY = 'notification_preferences_v1';
const NOTIFICATION_PREFERENCES_SCHEMA_VERSION_KEY = 'notification_preferences_schema_version';
const NOTIFICATION_PREFERENCES_SCHEMA_VERSION = 2;

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  studyReminders: true,
  planSummaries: true,
  progressNudges: true,
  premiumUpdates: true,
  referralUpdates: true,
  breakReminders: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
  preferredStudyTime: '09:00',
  upcomingLeadMinutes: 10,
  recoveryDelayMinutes: 90,
  dailyWrapTime: '19:45',
  weeklyPlanDay: 1,
  weeklyPlanTime: '18:30',
};

export const loadNotificationPreferences = async (): Promise<NotificationPreferences> => {
  try {
    const versionRaw = await AsyncStorage.getItem(NOTIFICATION_PREFERENCES_SCHEMA_VERSION_KEY);
    const currentVersion = Number(versionRaw ?? '0');
    if (currentVersion < NOTIFICATION_PREFERENCES_SCHEMA_VERSION) {
      await AsyncStorage.setItem(
        NOTIFICATION_PREFERENCES_KEY,
        JSON.stringify(DEFAULT_NOTIFICATION_PREFERENCES)
      );
      await AsyncStorage.setItem(
        NOTIFICATION_PREFERENCES_SCHEMA_VERSION_KEY,
        String(NOTIFICATION_PREFERENCES_SCHEMA_VERSION)
      );
      return DEFAULT_NOTIFICATION_PREFERENCES;
    }

    const raw = await AsyncStorage.getItem(NOTIFICATION_PREFERENCES_KEY);
    if (!raw) return DEFAULT_NOTIFICATION_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<NotificationPreferences>;
    return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...parsed };
  } catch {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }
};

export const saveNotificationPreferences = async (
  next: NotificationPreferences
): Promise<NotificationPreferences> => {
  await AsyncStorage.setItem(NOTIFICATION_PREFERENCES_KEY, JSON.stringify(next));
  await AsyncStorage.setItem(
    NOTIFICATION_PREFERENCES_SCHEMA_VERSION_KEY,
    String(NOTIFICATION_PREFERENCES_SCHEMA_VERSION)
  );
  return next;
};

export const updateNotificationPreferences = async (
  patch: Partial<NotificationPreferences>
): Promise<NotificationPreferences> => {
  const current = await loadNotificationPreferences();
  const next = { ...current, ...patch };
  await saveNotificationPreferences(next);
  return next;
};
