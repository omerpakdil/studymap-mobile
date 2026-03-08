import { SupportedLanguage } from '@/app/i18n';
import {
  NotificationPreferences,
  PlannedNotification,
} from '@/app/types/notifications';
import {
  buildDailyWrapContent,
  buildSessionRecoveryContent,
  buildSessionStartContent,
  buildSessionUpcomingContent,
  buildWeeklyPlanReadyContent,
} from '@/app/utils/notifications/notificationContent';
import {
  addMinutes,
  applyClockTime,
  getTaskStartDate,
  getTaskStartDateForNotifications,
  isSameDay,
  isWithinQuietHours,
  nextAllowedDate,
} from '@/app/utils/notifications/notificationTime';
import { StudyTask } from '@/app/utils/studyTypes';

export interface BuildLocalNotificationPlanInput {
  tasks: StudyTask[];
  now?: Date;
  lang: SupportedLanguage;
  preferences: NotificationPreferences;
  examType?: string;
}

const MAX_PROACTIVE_PER_DAY = 2;

const sortByDate = (tasks: StudyTask[]): StudyTask[] =>
  [...tasks].sort((a, b) => getTaskStartDate(a).getTime() - getTaskStartDate(b).getTime());

const buildId = (type: string, suffix: string): string => `notif_${type}_${suffix}`;

const canUseDate = (candidate: Date, now: Date): boolean =>
  candidate.getTime() > now.getTime();

export const buildLocalNotificationPlan = ({
  tasks,
  now = new Date(),
  lang,
  preferences,
  examType,
}: BuildLocalNotificationPlanInput): PlannedNotification[] => {
  const sortedTasks = sortByDate(tasks).filter(task => !task.completed);
  const plan: PlannedNotification[] = [];
  const perDayCounters = new Map<string, number>();

  const reserveForDay = (dateKey: string): boolean => {
    const next = (perDayCounters.get(dateKey) ?? 0) + 1;
    if (next > MAX_PROACTIVE_PER_DAY) return false;
    perDayCounters.set(dateKey, next);
    return true;
  };

  for (const task of sortedTasks) {
    const start = getTaskStartDateForNotifications(task, preferences.preferredStudyTime);
    const dateKey = task.date;

    if (preferences.studyReminders) {
      const upcomingAt = nextAllowedDate(
        addMinutes(start, -preferences.upcomingLeadMinutes),
        preferences.quietHoursStart,
        preferences.quietHoursEnd
      );

      if (
        canUseDate(upcomingAt, now) &&
        !isWithinQuietHours(upcomingAt, preferences.quietHoursStart, preferences.quietHoursEnd) &&
        reserveForDay(dateKey)
      ) {
        const content = buildSessionUpcomingContent(task, preferences.upcomingLeadMinutes, lang, examType);
        plan.push({
          id: buildId('session_upcoming', task.id),
          type: 'session_upcoming',
          category: 'study_reminders',
          channel: 'local',
          scheduledFor: upcomingAt.toISOString(),
          title: content.title,
          body: content.body,
          locale: lang,
          payload: {
            taskId: task.id,
            subject: task.subject,
            examType,
            taskType: task.type,
            deepLink: '/(tabs)/dashboard',
            source: 'planner',
          },
        });
      }

      const startNowAt = nextAllowedDate(
        start,
        preferences.quietHoursStart,
        preferences.quietHoursEnd
      );
      if (canUseDate(startNowAt, now) && reserveForDay(dateKey)) {
        const content = buildSessionStartContent(task, lang, examType);
        plan.push({
          id: buildId('session_start_now', task.id),
          type: 'session_start_now',
          category: 'study_reminders',
          channel: 'local',
          scheduledFor: startNowAt.toISOString(),
          title: content.title,
          body: content.body,
          locale: lang,
          payload: {
            taskId: task.id,
            subject: task.subject,
            examType,
            taskType: task.type,
            deepLink: '/(tabs)/dashboard',
            source: 'planner',
          },
        });
      }

      const recoveryAt = nextAllowedDate(
        addMinutes(start, preferences.recoveryDelayMinutes),
        preferences.quietHoursStart,
        preferences.quietHoursEnd
      );
      const isTodayTask = isSameDay(start, now);
      if (isTodayTask && canUseDate(recoveryAt, now) && reserveForDay(dateKey)) {
        const content = buildSessionRecoveryContent(task, lang, examType);
        plan.push({
          id: buildId('session_recovery', task.id),
          type: 'session_recovery',
          category: 'progress_nudges',
          channel: 'local',
          scheduledFor: recoveryAt.toISOString(),
          title: content.title,
          body: content.body,
          locale: lang,
          payload: {
            taskId: task.id,
            subject: task.subject,
            examType,
            taskType: task.type,
            deepLink: '/(tabs)/dashboard',
            source: 'planner',
          },
        });
      }
    }
  }

  if (preferences.planSummaries) {
    const todayKey = now.toISOString().slice(0, 10);
    const todayTasks = sortedTasks.filter(task => task.date === todayKey);
    if (todayTasks.length > 0) {
      const totalMinutesLeft = todayTasks.reduce((sum, task) => sum + task.duration, 0);
      const wrapAt = nextAllowedDate(
        applyClockTime(now, preferences.dailyWrapTime),
        preferences.quietHoursStart,
        preferences.quietHoursEnd
      );
      if (canUseDate(wrapAt, now)) {
        const content = buildDailyWrapContent(todayTasks.length, totalMinutesLeft, lang);
        plan.push({
          id: buildId('daily_wrap', todayKey),
          type: 'daily_wrap',
          category: 'plan_summaries',
          channel: 'local',
          scheduledFor: wrapAt.toISOString(),
          title: content.title,
          body: content.body,
          locale: lang,
          payload: {
            remainingTasksCount: todayTasks.length,
            totalMinutesLeft,
            examType,
            deepLink: '/(tabs)/dashboard',
            source: 'planner',
          },
        });
      }
    }

    const weeklyBase = new Date(now);
    const dayDelta = (preferences.weeklyPlanDay - weeklyBase.getDay() + 7) % 7;
    weeklyBase.setDate(weeklyBase.getDate() + dayDelta);
    const weeklyAt = nextAllowedDate(
      applyClockTime(weeklyBase, preferences.weeklyPlanTime),
      preferences.quietHoursStart,
      preferences.quietHoursEnd
    );
    if (canUseDate(weeklyAt, now)) {
      const upcomingWeekSessions = sortedTasks.filter(task => {
        const start = getTaskStartDate(task);
        const diff = start.getTime() - now.getTime();
        return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
      }).length;
      const content = buildWeeklyPlanReadyContent(examType, upcomingWeekSessions, lang);
      plan.push({
        id: buildId('weekly_plan_ready', weeklyAt.toISOString().slice(0, 10)),
        type: 'weekly_plan_ready',
        category: 'plan_summaries',
        channel: 'local',
        scheduledFor: weeklyAt.toISOString(),
        title: content.title,
        body: content.body,
        locale: lang,
        payload: {
          examType,
          deepLink: '/(tabs)/dashboard',
          source: 'planner',
        },
      });
    }
  }

  return plan.sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor));
};
