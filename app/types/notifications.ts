import { SupportedLanguage } from '@/app/i18n';

export type NotificationChannel = 'local' | 'remote';

export type NotificationType =
  | 'session_upcoming'
  | 'session_start_now'
  | 'session_recovery'
  | 'daily_wrap'
  | 'weekly_plan_ready'
  | 'break_reminder'
  | 'streak_risk'
  | 'referral_reward'
  | 'trial_ending'
  | 'billing_issue';

export type NotificationCategory =
  | 'study_reminders'
  | 'plan_summaries'
  | 'progress_nudges'
  | 'premium_updates'
  | 'referral_updates'
  | 'break_reminders';

export interface NotificationPreferences {
  studyReminders: boolean;
  planSummaries: boolean;
  progressNudges: boolean;
  premiumUpdates: boolean;
  referralUpdates: boolean;
  breakReminders: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  preferredStudyTime: string;
  upcomingLeadMinutes: number;
  recoveryDelayMinutes: number;
  dailyWrapTime: string;
  weeklyPlanDay: number;
  weeklyPlanTime: string;
}

export interface NotificationContextPayload {
  taskId?: string;
  subject?: string;
  examType?: string;
  taskType?: string;
  deepLink?: string;
  remainingTasksCount?: number;
  totalMinutesLeft?: number;
  source?: 'planner' | 'subscription' | 'referral' | 'system';
  [key: string]: string | number | boolean | undefined;
}

export interface PlannedNotification {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  channel: NotificationChannel;
  scheduledFor: string;
  title: string;
  body: string;
  locale: SupportedLanguage;
  payload: NotificationContextPayload;
}

export interface LocalNotificationPlanInput {
  now?: Date;
  lang: SupportedLanguage;
  examType?: string;
}
