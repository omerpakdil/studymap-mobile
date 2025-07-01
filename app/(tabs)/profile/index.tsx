import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';


import NotificationService from '@/app/utils/notificationService';
import { clearOnboardingData, loadCompleteOnboardingData } from '@/app/utils/onboardingData';
import { calculateWeeklyProgress, clearStudyProgramData, getProgramMetadata, getStudyStreak } from '@/app/utils/studyProgramStorage';
import { useTheme } from '@/themes';

const { width } = Dimensions.get('window');
const isIOS = Platform.OS === 'ios';

export default function ProfileScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  
  // Real data states
  const [programMetadata, setProgramMetadata] = useState<any>(null);
  const [onboardingData, setOnboardingData] = useState<any>(null);
  const [studyStreak, setStudyStreak] = useState(0);
  const [weeklyProgress, setWeeklyProgress] = useState({ completed: 0, total: 0, hours: 0 });
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [notificationPermission, setNotificationPermission] = useState(false);
  

  
  // Settings states
  const [reminderSettings, setReminderSettings] = useState({
    dailyReminder: true,
    studyTime: '09:00',
    breakReminder: true,
    weeklyReport: true,
    motivationalQuotes: true,
    reminderFrequency: 'minimal',
  });
  const [privacySettings, setPrivacySettings] = useState({
    analytics: true,
    dataSharing: false,
    marketing: false,
  });

  // Load real user data from Claude-generated program
  const loadUserData = async (isInitialLoad: boolean = false) => {
    try {
      setLoading(true);
      
      // Only check/initialize notifications on first app load, not on every focus
      if (isInitialLoad) {
        // Check notification permission without reinitializing
        const hasPermission = NotificationService.hasNotificationPermission();
        setNotificationPermission(hasPermission);
        
        // Only initialize if not already initialized
        if (!hasPermission) {
          const initialized = await NotificationService.initialize();
          setNotificationPermission(initialized);
        }
      }
      
      // Load user info from AsyncStorage
      const userInfoStr = await AsyncStorage.getItem('user_info');
      if (userInfoStr) {
        setUserInfo(JSON.parse(userInfoStr));
      }

      // Load all user data
      const [metadata, onboarding, streak, weekly] = await Promise.all([
        getProgramMetadata(),
        loadCompleteOnboardingData(),
        getStudyStreak(),
        calculateWeeklyProgress()
      ]);
      
      setProgramMetadata(metadata);
      setOnboardingData(onboarding);
      setStudyStreak(streak);
      setWeeklyProgress(weekly);

      // Load reminder settings from notification service
      const notificationSettings = NotificationService.getSettings();
      setReminderSettings(notificationSettings);

      // Load and sync reminder frequency from onboarding data
      if (onboarding?.goalsData?.reminderFrequency) {
        const currentFrequency = onboarding.goalsData.reminderFrequency;
        
        // Update local state
        setReminderSettings(prev => ({
          ...prev,
          reminderFrequency: currentFrequency as 'minimal' | 'moderate' | 'frequent'
        }));
        
        // Sync with notification service if different
        if (notificationSettings.reminderFrequency !== currentFrequency) {
          await NotificationService.syncReminderFrequency(currentFrequency);
        }
      }

      // Load privacy settings
      const privacyStr = await AsyncStorage.getItem('privacy_settings');
      if (privacyStr) {
        setPrivacySettings(JSON.parse(privacyStr));
      }
      
      console.log('👤 Profile data loaded:', {
        examType: metadata?.examType,
        streak: streak,
        weeklyHours: weekly.hours,
        learningStyle: onboarding?.learningStyleData?.primaryStyle,
        notificationPermission: isInitialLoad ? notificationPermission : 'skipped',
        reminderSettings: 'loaded from service',
        privacySettings: privacyStr ? 'loaded' : 'default'
      });
      
    } catch (error) {
      console.error('❌ Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserData(true); // Initial load with notification check
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUserData(false); // Subsequent loads without notification init
    }, [])
  );

  const handleEditProfile = () => {
    router.push('/profile/edit');
  };


  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
          Alert.alert('Account Deletion', 'Account deletion feature will be implemented soon.');
        }}
      ]
    );
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'Send us an email at support@studymap.app or visit our help center.',
      [{ text: 'OK' }]
    );
  };

  const handleStudyTimePress = () => {
    const timeOptions = [
      '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
      '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
      '18:00', '19:00', '20:00', '21:00', '22:00'
    ];

    Alert.alert(
      'Select Study Time',
      'Choose your preferred time for daily study reminders',
      [
        ...timeOptions.map(time => ({
          text: time,
          onPress: () => updateReminderSetting('studyTime', time as string),
        })),
        { text: 'Cancel', style: 'cancel' }
      ],
      { cancelable: true }
    );
  };

  const handleResetOnboarding = () => {
    Alert.alert(
      'Reset Onboarding',
      'This will clear all your onboarding data and study program. You\'ll need to complete the onboarding process again.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await clearOnboardingData();
              await clearStudyProgramData();
              await AsyncStorage.removeItem('user_info');
              await AsyncStorage.removeItem('reminder_settings');
              await AsyncStorage.removeItem('privacy_settings');
              Alert.alert(
                'Reset Complete',
                'All data has been cleared. Please restart the app to begin the onboarding process again.',
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('Error resetting onboarding:', error);
              Alert.alert(
                'Reset Failed',
                'There was an error resetting your data. Please try again.',
                [{ text: 'OK' }]
              );
            }
          }
        }
      ]
    );
  };

  const updateReminderSetting = async (key: keyof typeof reminderSettings, value: boolean | string) => {
    try {
      const newSettings = {
        ...reminderSettings,
        [key]: value
      };
      
      // Update state
      setReminderSettings(newSettings);
      
      // Update notification service (handles AsyncStorage and scheduling)
      await NotificationService.updateSettings({ [key]: value });
      
      console.log(`✅ Reminder setting updated: ${key} = ${value}`);
    } catch (error) {
      console.error('❌ Error saving reminder setting:', error);
      
      // Revert state on error
      setReminderSettings(prev => prev);
      
      Alert.alert(
        'Error',
        'Failed to save reminder setting. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const updatePrivacySetting = async (key: keyof typeof privacySettings, value: boolean) => {
    try {
      const newSettings = {
        ...privacySettings,
        [key]: value
      };
      
      // Update state
      setPrivacySettings(newSettings);
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('privacy_settings', JSON.stringify(newSettings));
      
      console.log(`✅ Privacy setting updated: ${key} = ${value}`);
    } catch (error) {
      console.error('❌ Error saving privacy setting:', error);
      
      // Revert state on error
      setPrivacySettings(prev => prev);
      
      Alert.alert(
        'Error',
        'Failed to save privacy setting. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };



  // Show loading state
  if (loading || !programMetadata || !onboardingData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.neutral[50] }]}>
        <View style={[styles.loadingContainer, { justifyContent: 'center', alignItems: 'center', flex: 1 }]}>
          <Text style={[styles.loadingText, { color: colors.neutral[600] }]}>
            👤 Loading your profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderUserHeader = () => (
    <View style={[styles.userHeaderCard, { backgroundColor: colors.neutral[0] }]}>
      <LinearGradient
        colors={[colors.primary[500], colors.primary[600]] as const}
        style={styles.userHeaderGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              👤
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>
              {userInfo?.fullName || 'Study Buddy'}
            </Text>
            <Text style={styles.userEmail}>
              {userInfo?.email || 'student@studymap.app'}
            </Text>
            <Text style={styles.userExam}>
              {programMetadata.examType?.toUpperCase()} • {programMetadata.daysRemaining} days left
            </Text>
          </View>
        </View>
        
        <View style={styles.userStats}>
          <View style={styles.statItem}>
            <Text style={styles.userStatValue}>{studyStreak}</Text>
            <Text style={styles.userStatLabel}>Day Streak</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.userStatValue}>{programMetadata.completedTasks}</Text>
            <Text style={styles.userStatLabel}>Sessions</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.userStatValue}>{weeklyProgress.hours}h</Text>
            <Text style={styles.userStatLabel}>This Week</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  const renderSettingsSection = (title: string, items: any[]) => (
    <View style={[styles.settingsSection, { backgroundColor: colors.neutral[0] }]}>
      <Text style={[styles.sectionTitle, { color: colors.neutral[900] }]}>
        {title}
      </Text>
      {items.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.settingsItem,
            index < items.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.neutral[100] }
          ]}
          onPress={item.onPress}
          disabled={item.type === 'switch'}
        >
          <View style={styles.settingsItemLeft}>
            <Text style={styles.settingsIcon}>{item.icon}</Text>
            <View>
              <Text style={[styles.settingsTitle, { color: colors.neutral[900] }]}>
                {item.title}
              </Text>
              {item.subtitle && (
                <Text style={[styles.settingsSubtitle, { color: colors.neutral[600] }]}>
                  {item.subtitle}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.settingsItemRight}>
            {item.type === 'switch' ? (
              <Switch
                value={item.value}
                onValueChange={item.onChange || item.onToggle}
                trackColor={{ false: colors.neutral[300], true: colors.primary[500] }}
                thumbColor={item.value ? '#FFFFFF' : '#FFFFFF'}
              />
            ) : item.type === 'info' ? (
              <Text style={[styles.settingsValue, { color: colors.neutral[600] }]}>
                {item.value}
              </Text>
            ) : (
              <Text style={[styles.settingsArrow, { color: colors.neutral[400] }]}>
                →
              </Text>
            )}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );



  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.neutral[50] }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.neutral[50]} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.neutral[900] }]}>
          👤 Profile
        </Text>
        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: colors.neutral[100] }]}
          onPress={handleEditProfile}
        >
          <Text style={[styles.editButtonText, { color: colors.neutral[700] }]}>
            Edit
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* User Header */}
        {renderUserHeader()}

        {/* Stats Overview */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.neutral[900] }]}>
            Study Stats
          </Text>
          
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: colors.primary[50] }]}>
              <Text style={[styles.statValue, { color: colors.primary[700] }]}>
                {studyStreak}
              </Text>
              <Text style={[styles.statLabel, { color: colors.primary[600] }]}>
                Day Streak
              </Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: colors.secondary[50] }]}>
              <Text style={[styles.statValue, { color: colors.secondary[700] }]}>
                {Math.round(weeklyProgress.hours)}h
              </Text>
              <Text style={[styles.statLabel, { color: colors.secondary[600] }]}>
                This Week
              </Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: colors.accent[50] }]}>
              <Text style={[styles.statValue, { color: colors.accent[700] }]}>
                {programMetadata?.daysRemaining || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.accent[600] }]}>
                Days Left
              </Text>
            </View>
          </View>
        </View>



        {/* Preferences Section */}
        {renderSettingsSection('Study Preferences', [
          {
            title: 'Daily Study Reminders',
            subtitle: 'Get notified when it\'s time to study',
            type: 'switch',
            value: reminderSettings.dailyReminder,
            onChange: (value: boolean) => updateReminderSetting('dailyReminder', value as boolean),
          },
          {
            icon: '⏰',
            title: 'Study Time',
            subtitle: `Daily reminder at ${reminderSettings.studyTime}`,
            onPress: handleStudyTimePress,
          },
          {
            icon: '🔔',
            title: 'Reminder Frequency',
            subtitle: reminderSettings.reminderFrequency === 'minimal' ? 'Weekly check-ins' : 
                     reminderSettings.reminderFrequency === 'moderate' ? 'Daily reminders' : 
                     'Multiple daily reminders',
            type: 'info',
            value: '',
            onPress: () => {
              Alert.alert(
                'Edit Reminder Frequency',
                'To change your reminder frequency, go to Profile > Edit Profile > Reminder Settings.',
                [{ text: 'OK' }]
              );
            },
          },
        ])}

        {/* Notification Settings */}
        {renderSettingsSection('Notifications', [
          {
            icon: '☕',
            title: 'Break Reminders',
            subtitle: 'Pomodoro break notifications',
            type: 'switch',
            value: reminderSettings.breakReminder,
            onChange: (value: boolean) => updateReminderSetting('breakReminder', value as boolean),
          },
          {
            icon: '📊',
            title: 'Weekly Reports',
            subtitle: 'Progress summary every Sunday',
            type: 'switch',
            value: reminderSettings.weeklyReport,
            onChange: (value: boolean) => updateReminderSetting('weeklyReport', value as boolean),
          },
          {
            icon: '✨',
            title: 'Motivational Quotes',
            subtitle: 'Daily inspiration',
            type: 'switch',
            value: reminderSettings.motivationalQuotes,
            onChange: (value: boolean) => updateReminderSetting('motivationalQuotes', value as boolean),
          },
        ])}

        {/* Privacy & Data */}
        {renderSettingsSection('Privacy & Data', [
          {
            icon: '📈',
            title: 'Usage Analytics',
            subtitle: 'Help improve the app',
            type: 'switch',
            value: privacySettings.analytics,
            onChange: (value: boolean) => updatePrivacySetting('analytics', value),
          },
          {
            icon: '🤝',
            title: 'Data Sharing',
            subtitle: 'Share with partners',
            type: 'switch',
            value: privacySettings.dataSharing,
            onChange: (value: boolean) => updatePrivacySetting('dataSharing', value),
          },
          {
            icon: '📧',
            title: 'Marketing Emails',
            subtitle: 'Tips and updates',
            type: 'switch',
            value: privacySettings.marketing,
            onChange: (value: boolean) => updatePrivacySetting('marketing', value),
          },
        ])}

        {/* Account & Support */}
        {renderSettingsSection('Account & Support', [
          {
            icon: '📱',
            title: 'App Version',
            subtitle: '1.0.0 (Build 1)',
            type: 'info',
            value: '',
          },
          {
            icon: '❓',
            title: 'Help & Support',
            subtitle: 'Contact us or browse FAQs',
            onPress: handleContactSupport,
          },
          {
            icon: '⭐',
            title: 'Rate StudyMap',
            subtitle: 'Share your feedback',
            onPress: () => Alert.alert('Rate App', 'Rating feature coming soon!'),
          },
          {
            icon: '🗑️',
            title: 'Delete Account',
            subtitle: 'Permanently delete your account',
            onPress: handleDeleteAccount,
          },
        ])}

        {/* Developer */}
        {renderSettingsSection('Developer', [
          {
            icon: '🔄',
            title: 'Reset Onboarding',
            subtitle: 'Clear all data and restart onboarding',
            onPress: handleResetOnboarding,
          },
        ])}

        {/* Member Since */}
        <View style={styles.memberSince}>
          <Text style={[styles.memberSinceText, { color: colors.neutral[500] }]}>
            Member since {formatDate(programMetadata?.createdAt || new Date().toISOString())}
          </Text>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: isIOS ? 8 : 16,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  // User Header
  userHeaderCard: {
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  userHeaderGradient: {
    borderRadius: 16,
    padding: 24,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 2,
  },
  userExam: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  userStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  userStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userStatLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  
  // Settings Sections
  settingsSection: {
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsIcon: {
    fontSize: 20,
    marginRight: 16,
    width: 24,
    textAlign: 'center',
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingsSubtitle: {
    fontSize: 14,
    lineHeight: 18,
  },
  settingsItemRight: {
    marginLeft: 16,
  },
  settingsValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  settingsArrow: {
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Member Since
  memberSince: {
    alignItems: 'center',
    paddingVertical: 20,
    marginTop: 10,
  },
  memberSinceText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  
  // Loading States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  
  // Stats Section
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
   
   // AI Provider Section
   section: {
     padding: 20,
   },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  settingsCard: {
    borderRadius: 16,
    padding: 20,
  },
  providerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 12,
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerIcon: {
    fontSize: 20,
    marginRight: 16,
  },
  providerDetails: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  providerDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  providerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  currentIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  testButton: {
    padding: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 12,
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  helpCard: {
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  helpText: {
    fontSize: 14,
    lineHeight: 18,
  },
}); 