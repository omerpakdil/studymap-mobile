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
  
  // Settings states
  const [reminderSettings, setReminderSettings] = useState({
    dailyReminder: true,
    studyTime: '09:00',
    breakReminder: true,
    weeklyReport: true,
    motivationalQuotes: true,
  });
  const [privacySettings, setPrivacySettings] = useState({
    analytics: true,
    dataSharing: false,
    marketing: false,
  });

  // Load real user data from Claude-generated program
  const loadUserData = async () => {
    try {
      setLoading(true);
      
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
      
      console.log('👤 Profile data loaded:', {
        examType: metadata?.examType,
        streak: streak,
        weeklyHours: weekly.hours,
        learningStyle: onboarding?.learningStyleData?.primaryStyle
      });
      
    } catch (error) {
      console.error('❌ Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [])
  );

  const handleEditProfile = () => {
    Alert.alert(
      'Edit Profile',
      'Profile editing will be available in the next update.',
      [{ text: 'OK' }]
    );
  };

  const handleEditStudySettings = () => {
    Alert.alert(
      'Study Settings',
      'Study settings editing will be available in the next update.',
      [{ text: 'OK' }]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'Your study data export will be available soon.',
      [{ text: 'OK' }]
    );
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
              Alert.alert(
                'Reset Complete',
                'Onboarding data has been cleared. Please restart the app to begin the onboarding process again.',
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

  const updateReminderSetting = (key: keyof typeof reminderSettings, value: boolean) => {
    setReminderSettings(prev => ({
      ...prev,
      [key]: value
    }));
    // In real app, save to AsyncStorage/API
  };

  const updatePrivacySetting = (key: keyof typeof privacySettings, value: boolean) => {
    setPrivacySettings(prev => ({
      ...prev,
      [key]: value
    }));
    // In real app, save to AsyncStorage/API
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
            <Text style={styles.userName}>Study Buddy</Text>
            <Text style={styles.userEmail}>student@studymap.app</Text>
            <Text style={styles.userExam}>
              {programMetadata.examType?.toUpperCase()} • {programMetadata.daysRemaining} days left
            </Text>
          </View>
        </View>
        
        <View style={styles.userStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{studyStreak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{programMetadata.completedTasks}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{weeklyProgress.hours}h</Text>
            <Text style={styles.statLabel}>This Week</Text>
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
                onValueChange={item.onChange}
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

        {/* Study Settings */}
        {renderSettingsSection('Study Settings', [
          {
            icon: '🎯',
            title: 'Target Exam',
            subtitle: `${programMetadata.examType?.toUpperCase()} • Target Score: ${programMetadata.targetScore}`,
            type: 'info',
            value: formatDate(programMetadata.examDate),
            onPress: handleEditStudySettings,
          },
                      {
              icon: '📚',
              title: 'Focus Subjects',
              subtitle: onboardingData?.examData?.subjects?.join(', ') || 'All subjects',
              onPress: handleEditStudySettings,
            },
            {
              icon: '🧠',
              title: 'Learning Style',
              subtitle: `${onboardingData?.learningStyleData?.primaryStyle || 'Visual'} learner`,
              onPress: handleEditStudySettings,
            },
            {
              icon: '⏰',
              title: 'Study Schedule',
              subtitle: `${onboardingData?.goalsData?.studyIntensity || 'Moderate'} intensity • ${onboardingData?.goalsData?.targetStudyTime || 120} min/day`,
              onPress: handleEditStudySettings,
            },
        ])}

        {/* Notification Settings */}
        {renderSettingsSection('Notifications', [
          {
            icon: '🔔',
            title: 'Daily Study Reminder',
            subtitle: `${reminderSettings.studyTime}`,
            type: 'switch',
            value: reminderSettings.dailyReminder,
            onChange: (value: boolean) => updateReminderSetting('dailyReminder', value),
          },
          {
            icon: '☕',
            title: 'Break Reminders',
            subtitle: 'Pomodoro break notifications',
            type: 'switch',
            value: reminderSettings.breakReminder,
            onChange: (value: boolean) => updateReminderSetting('breakReminder', value),
          },
          {
            icon: '📊',
            title: 'Weekly Reports',
            subtitle: 'Progress summary every Sunday',
            type: 'switch',
            value: reminderSettings.weeklyReport,
            onChange: (value: boolean) => updateReminderSetting('weeklyReport', value),
          },
          {
            icon: '✨',
            title: 'Motivational Quotes',
            subtitle: 'Daily inspiration',
            type: 'switch',
            value: reminderSettings.motivationalQuotes,
            onChange: (value: boolean) => updateReminderSetting('motivationalQuotes', value),
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
          {
            icon: '💾',
            title: 'Export Data',
            subtitle: 'Download your study data',
            onPress: handleExportData,
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
    marginBottom: 24,
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
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
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
}); 