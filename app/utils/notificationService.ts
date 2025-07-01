import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Notification configuration
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationSettings {
  dailyReminder: boolean;
  breakReminder: boolean;
  weeklyReport: boolean;
  motivationalQuotes: boolean;
  studyTime: string;
  reminderFrequency: 'minimal' | 'moderate' | 'frequent';
}

export interface ScheduledNotification {
  id: string;
  type: 'daily' | 'break' | 'weekly' | 'motivational';
  title: string;
  body: string;
  scheduledTime: Date;
}

// Default settings
const DEFAULT_SETTINGS: NotificationSettings = {
  dailyReminder: true,
  breakReminder: true,
  weeklyReport: true,
  motivationalQuotes: true,
  studyTime: '09:00',
  reminderFrequency: 'moderate',
};

// Motivational quotes for daily inspiration
const MOTIVATIONAL_QUOTES = [
  "Success is the sum of small efforts repeated day in and day out. 📚",
  "The expert in anything was once a beginner. Keep going! 🌟",
  "Don't wait for opportunity. Create it through consistent study. 💪",
  "Every study session brings you closer to your goals. 🎯",
  "Knowledge is power. Keep building yours today! ⚡",
  "Small progress is still progress. You've got this! 🚀",
  "Your future self will thank you for studying today. 📖",
  "Consistency beats perfection. Study a little every day. ⭐",
  "Turn your dreams into plans, and your plans into reality. 💭",
  "The best time to plant a tree was 20 years ago. The second best time is now. 🌱"
];

class NotificationService {
  private static instance: NotificationService;
  private settings: NotificationSettings = DEFAULT_SETTINGS;
  private hasPermission: boolean = false;
  private isInitialized: boolean = false;
  private isScheduling: boolean = false;
  private updateTimeout: ReturnType<typeof setTimeout> | null = null;
  private breakReminderId: string | null = null;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize(): Promise<boolean> {
    // Prevent multiple initializations
    if (this.isInitialized) {
      return this.hasPermission;
    }

    try {
      console.log('📱 Initializing notification service...');
      
      // Request permissions
      this.hasPermission = await this.requestPermissions();
      
      if (this.hasPermission) {
        // Load settings
        await this.loadSettings();
        
        // Schedule notifications for future delivery (no immediate notifications)
        await this.scheduleAllNotifications();
        
        this.isInitialized = true;
        console.log('✅ Notification service initialized - future notifications scheduled');
        return true;
      }
      
      this.isInitialized = true;
      console.log('❌ Notification permissions denied - no notifications will be sent');
      return false;
    } catch (error) {
      console.error('❌ Error initializing notification service:', error);
      this.isInitialized = true; // Mark as initialized even on error to prevent retries
      return false;
    }
  }

  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.log('📱 Notifications only work on physical devices');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('❌ Failed to get push token for push notification!');
      return false;
    }

    // Configure notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('study-reminders', {
        name: 'Study Reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });

      await Notifications.setNotificationChannelAsync('motivational', {
        name: 'Motivational Quotes',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4CAF50',
      });
    }

    return true;
  }

  async loadSettings(): Promise<void> {
    try {
      const reminderSettingsStr = await AsyncStorage.getItem('reminder_settings');
      if (reminderSettingsStr) {
        const reminderSettings = JSON.parse(reminderSettingsStr);
        this.settings = { ...DEFAULT_SETTINGS, ...reminderSettings };
      }
    } catch (error) {
      console.error('❌ Error loading notification settings:', error);
    }
  }

  async updateSettings(newSettings: Partial<NotificationSettings>): Promise<void> {
    try {
      this.settings = { ...this.settings, ...newSettings };
      
      // Save to AsyncStorage immediately
      await AsyncStorage.setItem('reminder_settings', JSON.stringify(this.settings));
      
      console.log('✅ Notification settings updated:', newSettings);

      // Debounce notification rescheduling to avoid excessive calls
      if (this.updateTimeout) {
        clearTimeout(this.updateTimeout);
      }

      this.updateTimeout = setTimeout(async () => {
        console.log('🔄 Rescheduling notifications after settings change...');
        await this.scheduleAllNotifications();
      }, 1000); // Wait 1 second before rescheduling

    } catch (error) {
      console.error('❌ Error updating notification settings:', error);
    }
  }

  async scheduleAllNotifications(): Promise<void> {
    if (!this.hasPermission) {
      console.log('⚠️ No notification permission, skipping scheduling');
      return;
    }

    // Prevent concurrent scheduling
    if (this.isScheduling) {
      console.log('⚠️ Notification scheduling already in progress, skipping');
      return;
    }

    try {
      this.isScheduling = true;
      console.log('📅 Setting up future notification schedule (no immediate notifications)...');

      // Cancel all existing notifications
      await Notifications.cancelAllScheduledNotificationsAsync();

      let scheduledCount = 0;
      const activeSettings = [];

      // Schedule ONLY if user has enabled each setting
      if (this.settings.dailyReminder === true) {
        await this.scheduleDailyReminders();
        scheduledCount++;
        activeSettings.push('Daily Study Reminders');
      } else {
        console.log('⚪ Daily study reminders disabled by user');
      }

      if (this.settings.motivationalQuotes === true) {
        await this.scheduleMotivationalQuotes();
        scheduledCount++;
        activeSettings.push('Daily Motivation');
      } else {
        console.log('⚪ Motivational quotes disabled by user');
      }

      if (this.settings.weeklyReport === true) {
        await this.scheduleWeeklyReports();
        scheduledCount++;
        activeSettings.push('Weekly Progress Report');
      } else {
        console.log('⚪ Weekly reports disabled by user');
      }

      if (scheduledCount === 0) {
        console.log('📵 No future notifications scheduled - all features disabled by user');
      } else {
        console.log(`✅ Future notification schedule set: ${activeSettings.join(', ')}`);
        console.log('🕐 These notifications will be delivered at their scheduled times, not immediately');
      }

    } catch (error) {
      console.error('❌ Error scheduling notifications:', error);
    } finally {
      this.isScheduling = false;
    }
  }

  private async scheduleDailyReminders(): Promise<void> {
    const [hours, minutes] = this.settings.studyTime.split(':').map(Number);
    
    if (this.settings.reminderFrequency === 'minimal') {
      // Weekly reminders - every Sunday at user's preferred time
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📚 Weekly Study Check-in',
          body: `Time for your weekly study session. Let's review your goals and plan ahead!`,
          data: { type: 'weekly_reminder' },
        },
        trigger: {
          weekday: 1, // Sunday
          hour: hours,
          minute: minutes,
          repeats: true,
        } as any,
      });
      console.log(`📅 Weekly study reminder scheduled for Sundays at ${this.settings.studyTime}`);
      
    } else if (this.settings.reminderFrequency === 'moderate') {
      // Daily reminders - once per day at user's preferred time
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📚 Daily Study Time',
          body: `Your daily study session is ready. Let's achieve your goals!`,
          data: { type: 'daily_reminder' },
        },
        trigger: {
          hour: hours,
          minute: minutes,
          repeats: true,
        } as any,
      });
      console.log(`📅 Daily study reminder scheduled for ${this.settings.studyTime} every day`);
      
    } else if (this.settings.reminderFrequency === 'frequent') {
      // Multiple daily reminders - 3 times per day
      const reminderTimes = [
        { hour: hours, minute: minutes, title: 'Morning Study Session', body: 'Start your day with focused learning!' },
        { hour: (hours + 6) % 24, minute: minutes, title: 'Afternoon Study Break', body: 'Time for your afternoon study session!' },
        { hour: (hours + 12) % 24, minute: minutes, title: 'Evening Review', body: 'End your day by reviewing what you\'ve learned!' },
      ];

      for (let i = 0; i < reminderTimes.length; i++) {
        const reminder = reminderTimes[i];
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `📚 ${reminder.title}`,
            body: reminder.body,
            data: { type: 'frequent_reminder', session: i + 1 },
          },
          trigger: {
            hour: reminder.hour,
            minute: reminder.minute,
            repeats: true,
          } as any,
        });
      }
      console.log(`📅 Frequent study reminders scheduled - 3 times daily starting at ${this.settings.studyTime}`);
    }
  }

  private async scheduleMotivationalQuotes(): Promise<void> {
    // Schedule ONE motivational quote every day at 8 AM
    const today = new Date();
    const randomQuote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '✨ Daily Motivation',
        body: randomQuote,
        data: { type: 'motivational' },
      },
      trigger: {
        hour: 8,
        minute: 0,
        repeats: true, // This will repeat every day at 8:00 AM
      } as any,
    });

    console.log('🌟 Daily motivational quote scheduled for 8:00 AM every day');
  }

  private async scheduleWeeklyReports(): Promise<void> {
    // Schedule ONE weekly report every Sunday at 6 PM
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📊 Weekly Progress Report',
        body: 'Your weekly study summary is ready! Check your achievements and plan for the upcoming week.',
        data: { type: 'weekly_report' },
      },
      trigger: {
        weekday: 1, // 1 = Sunday (starts from Sunday = 1)
        hour: 18,
        minute: 0,
        repeats: true, // This will repeat every Sunday at 6:00 PM
      } as any,
    });

    console.log('📈 Weekly progress report scheduled for Sundays at 6:00 PM');
  }

  async startBreakReminders(): Promise<void> {
    if (!this.hasPermission || !this.settings.breakReminder) {
      console.log('⚠️ Break reminders not available (permission or setting disabled)');
      return;
    }

    try {
      // Stop any existing break reminders
      await this.stopBreakReminders();

      // Schedule a break reminder for 25 minutes from now
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Study Break Time! 🧠",
          body: "You've been studying for 25 minutes. Take a 5-minute break to refresh your mind.",
          data: { type: 'break_reminder' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 25 * 60, // 25 minutes
        },
      });

      this.breakReminderId = 'break_reminder_active';
      console.log('⏱️ Break reminder set for 25 minutes during active study session');
    } catch (error) {
      console.error('❌ Error starting break reminders:', error);
    }
  }

  async stopBreakReminders(): Promise<void> {
    if (this.breakReminderId) {
      await Notifications.cancelScheduledNotificationAsync(this.breakReminderId);
      this.breakReminderId = null;
      console.log('⏹️ Break reminders stopped');
    }
  }

  async showInstantNotification(title: string, body: string, allowInDevelopment: boolean = false): Promise<void> {
    if (!this.hasPermission) {
      console.log('⚠️ Cannot show instant notification - no permission');
      return;
    }

    // Prevent accidental notifications during development unless explicitly allowed
    if (!allowInDevelopment && __DEV__) {
      console.log('🚫 Instant notification blocked in development mode:', { title, body });
      console.log('💡 Use allowInDevelopment=true if this notification is intentional');
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { type: 'instant' },
        },
        trigger: null, // Show immediately
      });

      console.log('📱 Instant notification sent:', title);
    } catch (error) {
      console.error('❌ Error sending instant notification:', error);
    }
  }

  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    console.log(`📋 Currently scheduled notifications: ${scheduled.length}`);
    
    scheduled.forEach((notification, index) => {
      const trigger = notification.trigger as any;
      console.log(`  ${index + 1}. ${notification.content.title} - Type: ${notification.content.data?.type}`);
      
      if (trigger.hour !== undefined) {
        console.log(`     Scheduled: Daily at ${trigger.hour}:${trigger.minute?.toString().padStart(2, '0')}`);
      } else if (trigger.weekday !== undefined) {
        console.log(`     Scheduled: Weekly on ${trigger.weekday === 1 ? 'Sunday' : 'Day ' + trigger.weekday} at ${trigger.hour}:${trigger.minute?.toString().padStart(2, '0')}`);
      } else if (trigger.seconds !== undefined) {
        console.log(`     Scheduled: In ${Math.round(trigger.seconds / 60)} minutes`);
      }
    });
    
    return scheduled;
  }

  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('🔕 All notifications cancelled');
  }

  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  hasNotificationPermission(): boolean {
    return this.hasPermission;
  }

  // Sync reminder frequency from onboarding data
async syncReminderFrequency(reminderFrequency: string): Promise<void> {
    const service = NotificationService.getInstance();
    
    if (reminderFrequency && ['minimal', 'moderate', 'frequent'].includes(reminderFrequency)) {
      await service.updateSettings({ 
        reminderFrequency: reminderFrequency as 'minimal' | 'moderate' | 'frequent' 
      });
      console.log(`✅ Notification reminder frequency synced: ${reminderFrequency}`);
    }
  }
}

export default NotificationService.getInstance(); 