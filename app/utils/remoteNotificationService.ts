import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { getDeviceLanguage, getPersistedAppLanguage, resolveAppLanguage } from '@/app/i18n';
import { NotificationPreferences, PlannedNotification } from '@/app/types/notifications';
import { getAppUserId } from '@/app/utils/appUserId';
import { getDateFormatByLanguage, parseDate } from '@/app/utils/localeDate';
import { supabase } from '@/app/utils/supabase';

/**
 * Converts a localized exam date string (e.g. "13.05.2026") to ISO date string
 * ("2026-05-13") for Supabase timestamptz fields.
 * If the value is already ISO-like or parseable by Date, it's returned as-is.
 */
function toISOExamDate(raw: string): string | null {
  if (!raw) return null;

  // Already ISO / full ISO datetime — return the date portion
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }

  // Localized format (DD.MM.YYYY, DD/MM/YYYY, MM/DD/YYYY, etc.)
  const lang = resolveAppLanguage();
  const { order } = getDateFormatByLanguage(lang);
  const parsed = parseDate(raw, order);
  if (parsed && !isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }

  return null;
}

const getProjectId = (): string | null => {
  const easProjectId =
    Constants.easConfig?.projectId ??
    (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId;
  return typeof easProjectId === 'string' && easProjectId.length > 0 ? easProjectId : null;
};

export const getExpoPushToken = async (): Promise<string | null> => {
  const projectId = getProjectId();
  if (!projectId) return null;

  try {
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
  } catch {
    return null;
  }
};

export const syncPushToken = async (): Promise<string | null> => {
  const expoPushToken = await getExpoPushToken();
  if (!expoPushToken) return null;

  const userId = await getAppUserId();
  const locale = getPersistedAppLanguage() ?? getDeviceLanguage();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const { error } = await supabase.from('push_tokens').upsert(
    {
      user_id: userId,
      expo_push_token: expoPushToken,
      platform: Platform.OS,
      locale,
      timezone,
      is_active: true,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: 'expo_push_token' }
  );

  if (error) {
    throw error;
  }

  return expoPushToken;
};

export const syncRemoteNotificationPreferences = async (
  preferences: NotificationPreferences
): Promise<void> => {
  const userId = await getAppUserId();
  const locale = getPersistedAppLanguage() ?? getDeviceLanguage();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const { error } = await supabase.from('notification_preferences').upsert(
    {
      user_id: userId,
      study_reminders: preferences.studyReminders,
      plan_summaries: preferences.planSummaries,
      progress_nudges: preferences.progressNudges,
      premium_updates: preferences.premiumUpdates,
      referral_updates: preferences.referralUpdates,
      break_reminders: preferences.breakReminders,
      quiet_hours_start: preferences.quietHoursStart,
      quiet_hours_end: preferences.quietHoursEnd,
      preferred_study_time: preferences.preferredStudyTime,
      upcoming_lead_minutes: preferences.upcomingLeadMinutes,
      recovery_delay_minutes: preferences.recoveryDelayMinutes,
      daily_wrap_time: preferences.dailyWrapTime,
      weekly_plan_day: preferences.weeklyPlanDay,
      weekly_plan_time: preferences.weeklyPlanTime,
      locale,
      timezone,
    },
    { onConflict: 'user_id' }
  );

  if (error) {
    throw error;
  }
};

export const trackRemoteNotificationEvent = async (
  status: 'planned' | 'sent' | 'delivered' | 'opened' | 'failed' | 'cancelled',
  item: Pick<PlannedNotification, 'type' | 'channel' | 'title' | 'body' | 'payload' | 'scheduledFor'>
): Promise<void> => {
  const userId = await getAppUserId();

  const { error } = await supabase.from('notification_events').insert({
    user_id: userId,
    notification_type: item.type,
    notification_channel: item.channel,
    notification_status: status,
    title: item.title,
    body: item.body,
    payload: item.payload,
    scheduled_for: item.scheduledFor,
  });

  if (error) {
    throw error;
  }
};

export interface NotificationStateSyncInput {
  studyStreak?: number;
  completedTasks?: number;
  planUpdatedAt?: string | null;
  lastOpenedAt?: string | null;
  lastStudySessionAt?: string | null;
  nextExamDate?: string | null;
}

export const syncRemoteNotificationState = async (
  input: NotificationStateSyncInput
): Promise<void> => {
  const userId = await getAppUserId();
  const locale = getPersistedAppLanguage() ?? getDeviceLanguage();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const payload = {
    user_id: userId,
    locale,
    timezone,
    ...(typeof input.studyStreak === 'number' ? { study_streak: input.studyStreak } : {}),
    ...(typeof input.completedTasks === 'number' ? { completed_tasks: input.completedTasks } : {}),
    ...(input.planUpdatedAt ? { plan_updated_at: input.planUpdatedAt } : {}),
    ...(input.lastOpenedAt ? { last_opened_at: input.lastOpenedAt } : {}),
    ...(input.lastStudySessionAt ? { last_study_session_at: input.lastStudySessionAt } : {}),
    ...(input.nextExamDate ? { next_exam_date: toISOExamDate(input.nextExamDate) } : {}),
  };

  const { error } = await supabase.from('notification_state').upsert(payload, { onConflict: 'user_id' });
  if (error) {
    throw error;
  }
};
