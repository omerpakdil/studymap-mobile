import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { Platform } from 'react-native';

import { resolveAppLanguage, t } from '@/app/i18n';
import { trackEvent } from '@/app/utils/analytics';
import {
  buildLocalNotificationPlan,
  cancelScheduledLocalNotificationPlan,
  DEFAULT_NOTIFICATION_PREFERENCES,
  loadNotificationPreferences,
  NotificationType,
  NotificationPreferences,
  scheduleLocalNotificationPlan,
  updateNotificationPreferences,
} from '@/app/utils/notifications';
import {
  syncPushToken,
  syncRemoteNotificationPreferences,
  trackRemoteNotificationEvent,
} from '@/app/utils/remoteNotificationService';
import { loadDailyTasks, loadStudyProgram } from '@/app/utils/studyProgramStorage';

if (Platform.OS === 'ios') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

class NotificationService {
  private static instance: NotificationService;
  private preferences: NotificationPreferences = DEFAULT_NOTIFICATION_PREFERENCES;
  private hasPermission = false;
  private isInitialized = false;
  private isScheduling = false;
  private updateTimeout: ReturnType<typeof setTimeout> | null = null;
  private breakReminderId: string | null = null;
  private notificationResponseListener: Notifications.Subscription | null = null;
  private lastHandledResponseId: string | null = null;
  private readonly knownNotificationTypes: NotificationType[] = [
    'session_upcoming',
    'session_start_now',
    'session_recovery',
    'daily_wrap',
    'weekly_plan_ready',
    'break_reminder',
    'streak_risk',
    'referral_reward',
    'trial_ending',
    'billing_issue',
  ];

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return this.hasPermission;

    if (Platform.OS !== 'ios') {
      this.isInitialized = true;
      return false;
    }

    try {
      this.hasPermission = await this.requestPermissions();
      this.preferences = await loadNotificationPreferences();

      if (this.hasPermission) {
        await this.syncRemoteState();
        this.setupNotificationResponseListener();
        await this.handleInitialNotificationResponse();
        await this.scheduleAllNotifications();
      }

      this.isInitialized = true;
      return this.hasPermission;
    } catch (error) {
      console.error('Notification init failed:', error);
      this.isInitialized = true;
      return false;
    }
  }

  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  }

  async loadPreferences(): Promise<NotificationPreferences> {
    this.preferences = await loadNotificationPreferences();
    if (this.hasPermission) {
      await this.syncRemoteState();
    }
    return { ...this.preferences };
  }

  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  async updatePreferences(patch: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    this.preferences = await updateNotificationPreferences(patch);
    if (this.hasPermission) {
      await this.syncRemoteState();
    }

    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }

    this.updateTimeout = setTimeout(async () => {
      await this.scheduleAllNotifications();
    }, 400);

    return { ...this.preferences };
  }

  async scheduleAllNotifications(): Promise<void> {
    if (!this.hasPermission || this.isScheduling) return;

    try {
      this.isScheduling = true;
      this.preferences = await loadNotificationPreferences();
      const tasks = await loadDailyTasks();
      const studyProgram = await loadStudyProgram();
      const plan = buildLocalNotificationPlan({
        tasks,
        now: new Date(),
        lang: resolveAppLanguage(),
        preferences: this.preferences,
        examType: studyProgram?.examType,
      });
      await scheduleLocalNotificationPlan(plan);
    } catch (error) {
      console.error('Notification scheduling failed:', error);
    } finally {
      this.isScheduling = false;
    }
  }

  async startBreakReminders(): Promise<void> {
    if (!this.hasPermission || !this.preferences.breakReminders) return;

    try {
      await this.stopBreakReminders();
      const lang = resolveAppLanguage();
      this.breakReminderId = await Notifications.scheduleNotificationAsync({
        content: {
          title: t('tabs.profile.break_push_title', {
            lang,
            fallback: 'Study break',
          }),
          body: t('tabs.profile.break_push_body', {
            lang,
            fallback: 'You have been focused for 25 minutes. Take a short reset before the next block.',
          }),
          data: {
            notificationType: 'break_reminder',
            notificationChannel: 'local',
            deepLink: '/(tabs)/dashboard',
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 25 * 60,
        },
      });
    } catch (error) {
      console.error('Break reminder scheduling failed:', error);
    }
  }

  async stopBreakReminders(): Promise<void> {
    if (!this.breakReminderId) return;
    await Notifications.cancelScheduledNotificationAsync(this.breakReminderId);
    this.breakReminderId = null;
  }

  async showInstantNotification(title: string, body: string, allowInDevelopment = false): Promise<void> {
    if (!this.hasPermission) return;
    if (!allowInDevelopment && __DEV__) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { notificationType: 'instant', notificationChannel: 'local' },
      },
      trigger: null,
    });
  }

  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    return Notifications.getAllScheduledNotificationsAsync();
  }

  async cancelAllNotifications(): Promise<void> {
    await cancelScheduledLocalNotificationPlan();
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  private async syncRemoteState(): Promise<void> {
    try {
      await Promise.all([
        syncPushToken(),
        syncRemoteNotificationPreferences(this.preferences),
      ]);
    } catch (error) {
      console.error('Remote notification sync failed:', error);
    }
  }

  private setupNotificationResponseListener(): void {
    if (this.notificationResponseListener) {
      this.notificationResponseListener.remove();
    }

    this.notificationResponseListener = Notifications.addNotificationResponseReceivedListener(response => {
      void this.handleNotificationResponse(response);
    });
  }

  private async handleInitialNotificationResponse(): Promise<void> {
    try {
      const initialResponse = await Notifications.getLastNotificationResponseAsync();
      if (initialResponse) {
        await this.handleNotificationResponse(initialResponse);
      }
    } catch (error) {
      console.error('Initial notification response handling failed:', error);
    }
  }

  private async handleNotificationResponse(
    response: Notifications.NotificationResponse
  ): Promise<void> {
    const request = response.notification.request;
    const responseId = request.identifier;
    if (this.lastHandledResponseId === responseId) return;
    this.lastHandledResponseId = responseId;

    const rawData = request.content.data ?? {};
    const data = rawData as Record<string, string | number | boolean | undefined>;
    const notificationType =
      typeof data.notificationType === 'string' &&
      this.knownNotificationTypes.includes(data.notificationType as NotificationType)
        ? (data.notificationType as NotificationType)
        : null;
    const notificationChannel = typeof data.notificationChannel === 'string' ? data.notificationChannel : 'local';
    const deepLink = typeof data.deepLink === 'string' ? data.deepLink : '/(tabs)/dashboard';
    const payload = Object.fromEntries(Object.entries(data));

    try {
      await trackEvent('notification_opened', {
        notification_type: notificationType,
        notification_channel: notificationChannel,
        deep_link: deepLink,
        action_identifier: response.actionIdentifier,
        ...payload,
      });

      if (notificationChannel === 'remote' && notificationType) {
        await trackRemoteNotificationEvent('opened', {
          type: notificationType,
          channel: 'remote',
          title: request.content.title ?? '',
          body: request.content.body ?? '',
          payload,
          scheduledFor: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Notification opened tracking failed:', error);
    }

    try {
      router.push(deepLink as any);
    } catch {
      try {
        router.push('/(tabs)/dashboard');
      } catch {}
    }
  }

  cleanup(): void {
    if (this.notificationResponseListener) {
      this.notificationResponseListener.remove();
      this.notificationResponseListener = null;
    }
  }

  hasNotificationPermission(): boolean {
    return this.hasPermission;
  }

  async syncStudyTimeFromSchedule(scheduleData: any): Promise<void> {
    if (!scheduleData || Object.keys(scheduleData).length === 0) return;

    try {
      const timeSlotCounts: Record<string, number> = {};
      Object.values(scheduleData).forEach(timeSlots => {
        if (Array.isArray(timeSlots)) {
          timeSlots.forEach(slot => {
            timeSlotCounts[String(slot)] = (timeSlotCounts[String(slot)] || 0) + 1;
          });
        }
      });

      const mostCommonSlot = Object.entries(timeSlotCounts)
        .sort(([, a], [, b]) => b - a)[0]?.[0];

      const slotToTime: Record<string, string> = {
        early_morning: '07:00',
        morning: '10:00',
        afternoon: '14:00',
        evening: '18:00',
        night: '21:00',
      };

      const preferredTime = slotToTime[mostCommonSlot];
      if (preferredTime && preferredTime !== this.preferences.preferredStudyTime) {
        await this.updatePreferences({ preferredStudyTime: preferredTime });
      }
    } catch (error) {
      console.error('Study time sync failed:', error);
    }
  }
}

export default NotificationService.getInstance();
