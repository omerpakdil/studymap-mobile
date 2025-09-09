import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Linking,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';


import NotificationService from '@/app/utils/notificationService';
import { clearOnboardingData, loadCompleteOnboardingData } from '@/app/utils/onboardingData';
import { calculateWeeklyProgress, clearStudyProgramData, getProgramMetadata, getStudyStreak } from '@/app/utils/studyProgramStorage';
import { useTheme } from '@/themes';

const { width } = Dimensions.get('window');
const isIOS = Platform.OS === 'ios';

const reminderFrequencyOptions = [
  { id: 'minimal', label: 'Minimal', frequency: 'Weekly check-ins', icon: '📅' },
  { id: 'moderate', label: 'Moderate', frequency: 'Daily reminders', icon: '⏰' },
  { id: 'frequent', label: 'Frequent', frequency: 'Multiple daily', icon: '🔔' },
];

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
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStudyTimeModal, setShowStudyTimeModal] = useState(false);
  const [pendingStudyTime, setPendingStudyTime] = useState('09:00');
  

  
  // Settings states
  const [reminderSettings, setReminderSettings] = useState({
    dailyReminder: false,
    studyTime: '09:00',
    breakReminder: false,
    weeklyReport: false,
    motivationalQuotes: false,
    reminderFrequency: 'minimal',
  });
  const [privacySettings, setPrivacySettings] = useState({
    analytics: false,
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

      // Sync study time from schedule data if not manually set
      if (onboarding?.scheduleData && Object.keys(onboarding.scheduleData).length > 0) {
        const scheduleEntries = Object.entries(onboarding.scheduleData);
        if (scheduleEntries.length > 0) {
          // Find the most common time slot to determine preferred study time
          const timeSlotCounts: {[key: string]: number} = {};
          scheduleEntries.forEach(([day, timeSlots]) => {
            (timeSlots as string[]).forEach(slot => {
              timeSlotCounts[slot] = (timeSlotCounts[slot] || 0) + 1;
            });
          });
          
          const mostCommonSlot = Object.entries(timeSlotCounts)
            .sort(([,a], [,b]) => b - a)[0]?.[0];
          
          // Map time slots to notification times
          const slotToTime: {[key: string]: string} = {
            'early_morning': '07:00',
            'morning': '10:00', 
            'afternoon': '14:00',
            'evening': '18:00',
            'night': '21:00'
          };
          
          const preferredTime = slotToTime[mostCommonSlot] || '09:00';
          
          // Only sync if notification service has default time (not user-customized)
          if (notificationSettings.studyTime === '09:00' && preferredTime !== '09:00') {
            await NotificationService.updateSettings({ studyTime: preferredTime });
            setReminderSettings(prev => ({ ...prev, studyTime: preferredTime }));
            console.log(`✅ Study time synced from schedule: ${preferredTime}`);
          }
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
    setShowDeleteModal(true);
  };

  const handleContactSupport = () => {
    setShowSupportModal(true);
  };

  const handleRateApp = () => {
    setShowRateModal(true);
  };

  const openAppStore = () => {
    const appStoreUrl = Platform.OS === 'ios' 
      ? 'https://apps.apple.com/app/studymap' 
      : 'https://play.google.com/store/apps/details?id=com.studymap.app';
    
    Linking.openURL(appStoreUrl).catch(() => {
      Alert.alert('Error', 'Could not open app store. Please try again later.');
    });
  };

  const openEmail = () => {
    const emailUrl = 'mailto:support@studymap.app?subject=StudyMap Support Request';
    Linking.openURL(emailUrl).catch(() => {
      Alert.alert('Error', 'Could not open email app. Please contact us at support@studymap.app');
    });
  };

  const performDeleteAccount = async () => {
    try {
      // Clear all data
      await clearOnboardingData();
      await clearStudyProgramData();
      await AsyncStorage.removeItem('user_info');
      await AsyncStorage.removeItem('reminder_settings');
      await AsyncStorage.removeItem('privacy_settings');
      
      Alert.alert(
        'Account Deleted',
        'Your account and all data have been permanently deleted. Please restart the app.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error deleting account:', error);
      Alert.alert(
        'Delete Failed',
        'There was an error deleting your account. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleStudyTimePress = () => {
    setPendingStudyTime(reminderSettings.studyTime);
    setShowStudyTimeModal(true);
  };

  // Generate all times in 30 min intervals
  const allTimes = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2).toString().padStart(2, '0');
    const min = i % 2 === 0 ? '00' : '30';
    return `${hour}:${min}`;
  });

  const handleStudyTimeSave = () => {
    updateReminderSetting('studyTime', pendingStudyTime);
    setShowStudyTimeModal(false);
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

  // Modern Toggle Component with Animation
  const ModernToggle = ({ value, onToggle }: { value: boolean; onToggle: (newValue: boolean) => void }) => {
    const [animatedValue] = useState(new Animated.Value(value ? 1 : 0));

    useEffect(() => {
      Animated.timing(animatedValue, {
        toValue: value ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }, [value]);

    const translateX = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [2, 22],
    });

    const backgroundColor = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [colors.neutral[300], colors.primary[500]],
    });

    const shadowOpacity = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.3],
    });

    return (
      <View style={styles.modernToggleContainer}>
        <TouchableOpacity
          onPress={() => onToggle(!value)}
          activeOpacity={0.8}
          style={styles.modernToggleWrapper}
        >
          <Animated.View
            style={[
              styles.modernToggle,
              { 
                backgroundColor,
                shadowOpacity,
                shadowColor: colors.primary[500]
              }
            ]}
          >
            <Animated.View
              style={[
                styles.modernToggleThumb,
                {
                  backgroundColor: '#FFFFFF',
                  transform: [{ translateX }],
                }
              ]}
            >
              {value && (
                <Animated.View style={{ opacity: animatedValue }}>
                  <Text style={styles.modernToggleCheck}>✓</Text>
                </Animated.View>
              )}
            </Animated.View>
          </Animated.View>
        </TouchableOpacity>
      </View>
    );
  };

  // Show loading state
  if (loading || !programMetadata || !onboardingData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.primary[50], flex: 1 }]}> 
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <LinearGradient
            colors={[colors.primary[400], colors.primary[500], colors.primary[600]]}
            style={{ width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <ActivityIndicator size="large" color="#fff" />
          </LinearGradient>
          <Text style={{ fontSize: 20, fontWeight: '700', color: colors.primary[700], marginBottom: 8, textAlign: 'center' }}>
            Loading your profile...
          </Text>
          <Text style={{ fontSize: 15, color: colors.neutral[500], textAlign: 'center', maxWidth: 260 }}>
            Please wait while we prepare your personalized data.
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
            <Ionicons name="person" size={48} color={colors.primary[600]} />
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
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.neutral[900] }]}>
        {title}
      </Text>
      {items.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.settingsItem,
            { backgroundColor: colors.neutral[0], borderBottomColor: colors.neutral[100] }
          ]}
          onPress={item.onPress}
          disabled={item.type === 'switch'}
          activeOpacity={item.type === 'switch' ? 1 : 0.7}
        >
          <View style={styles.settingsItemLeft}>
            {item.icon && (
              typeof item.icon === 'string' ? (
                <Text style={styles.settingsIcon}>{item.icon}</Text>
              ) : (
                <View style={styles.settingsIconContainer}>
                  {item.icon}
                </View>
              )
            )}
            <View style={styles.settingsTextContainer}>
              <Text style={[styles.settingsTitle, { color: colors.neutral[800] }]}>
                {item.title}
              </Text>
              {item.subtitle && (
                <Text style={[styles.settingsSubtitle, { color: colors.neutral[500] }]}>
                  {item.subtitle}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.settingsItemRight}>
            {item.type === 'switch' ? (
              <ModernToggle
                value={item.value}
                onToggle={item.onChange || item.onToggle}
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
        <View style={styles.headerTitleContainer}>
          <Ionicons name="person-circle" size={24} color={colors.primary[600]} style={{ marginRight: 8 }} />
          <Text style={[styles.headerTitle, { color: colors.neutral[900] }]}>
            Profile
          </Text>
        </View>
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
            icon: <Ionicons name="time" size={20} color={colors.primary[600]} />,
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
            onPress: () => setShowReminderModal(true),
          },
        ])}

        {/* Notification Settings */}
        {renderSettingsSection('Notifications', [
          {
            icon: <Ionicons name="cafe" size={20} color={colors.warning[600]} />,
            title: 'Break Reminders',
            subtitle: 'Pomodoro break notifications',
            type: 'switch',
            value: reminderSettings.breakReminder,
            onChange: (value: boolean) => updateReminderSetting('breakReminder', value as boolean),
          },
          {
            icon: <Ionicons name="bar-chart" size={20} color={colors.success[600]} />,
            title: 'Weekly Reports',
            subtitle: 'Progress summary every Sunday',
            type: 'switch',
            value: reminderSettings.weeklyReport,
            onChange: (value: boolean) => updateReminderSetting('weeklyReport', value as boolean),
          },
          {
            icon: <Ionicons name="star" size={20} color={colors.secondary[600]} />,
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
            icon: <Ionicons name="trending-up" size={20} color={colors.primary[600]} />,
            title: 'Usage Analytics',
            subtitle: 'Help improve the app',
            type: 'switch',
            value: privacySettings.analytics,
            onChange: (value: boolean) => updatePrivacySetting('analytics', value),
          },
          {
            icon: <Ionicons name="people" size={20} color={colors.warning[600]} />,
            title: 'Data Sharing',
            subtitle: 'Share with partners',
            type: 'switch',
            value: privacySettings.dataSharing,
            onChange: (value: boolean) => updatePrivacySetting('dataSharing', value),
          },
          {
            icon: <Ionicons name="mail" size={20} color={colors.primary[600]} />,
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
            icon: <Ionicons name="phone-portrait" size={20} color={colors.neutral[600]} />,
            title: 'App Version',
            subtitle: '1.0.0 (Build 1)',
            type: 'info',
            value: '',
          },
          {
            icon: <Ionicons name="help-circle" size={20} color={colors.primary[600]} />,
            title: 'Help & Support',
            subtitle: 'Contact us or browse FAQs',
            onPress: handleContactSupport,
          },
          {
            icon: <Ionicons name="star-outline" size={20} color={colors.warning[600]} />,
            title: 'Rate StudyMap',
            subtitle: 'Share your feedback',
            onPress: handleRateApp,
          },
          {
            icon: <Ionicons name="trash" size={20} color={colors.error[600]} />,
            title: 'Delete Account',
            subtitle: 'Permanently delete your account',
            onPress: handleDeleteAccount,
          },
        ])}

        {/* Developer */}
        {renderSettingsSection('Developer', [
          {
            icon: <Ionicons name="refresh" size={20} color={colors.neutral[600]} />,
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

        {/* Bottom Spacing - Account for tab bar */}
        <View style={{ height: Platform.OS === 'ios' ? 100 : 88 }} />
      </ScrollView>

      {/* Reminder Frequency Modal */}
      <Modal
        visible={showReminderModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReminderModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.neutral[0] }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.neutral[900] }]}>
                Reminder Frequency
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.neutral[600] }]}>
                Choose how often you&apos;d like to receive study reminders
              </Text>
            </View>

            {/* Reminder Options */}
            <View style={styles.modalOptionsContainer}>
              {reminderFrequencyOptions.map((option) => {
                const isSelected = reminderSettings.reminderFrequency === option.id;
                
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.modalOptionCard,
                      {
                        backgroundColor: isSelected ? colors.success[500] : colors.neutral[0],
                        borderColor: isSelected ? colors.success[500] : colors.neutral[200],
                      }
                    ]}
                    onPress={() => {
                      updateReminderSetting('reminderFrequency', option.id);
                      setShowReminderModal(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.modalOptionContent}>
                      <View style={styles.modalOptionHeader}>
                        <Text style={styles.modalOptionIcon}>{option.icon}</Text>
                        <Text style={[
                          styles.modalOptionLabel,
                          { color: isSelected ? '#FFFFFF' : colors.neutral[800] }
                        ]}>
                          {option.label}
                        </Text>
                      </View>
                      <Text style={[
                        styles.modalOptionFrequency,
                        { color: isSelected ? 'rgba(255,255,255,0.9)' : colors.success[600] }
                      ]}>
                        {option.frequency}
                      </Text>
                    </View>
                    {isSelected && (
                      <View style={styles.modalSelectedIndicator}>
                        <Text style={styles.modalCheckIcon}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancelButton, { backgroundColor: colors.neutral[100] }]}
                onPress={() => setShowReminderModal(false)}
                activeOpacity={0.8}
              >
                <Text style={[styles.modalCancelText, { color: colors.neutral[700], textAlign: 'center' }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Help & Support Modal */}
      <Modal
        visible={showSupportModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSupportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.neutral[0] }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.neutral[900] }]}>
                Help & Support
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.neutral[600] }]}>
                Get help with StudyMap or contact our support team
              </Text>
            </View>

            {/* Support Options */}
            <View style={styles.modalOptionsContainer}>
              <TouchableOpacity
                style={[styles.modalSupportOption, { backgroundColor: colors.primary[50] }]}
                onPress={() => {
                  setShowSupportModal(false);
                  openEmail();
                }}
                activeOpacity={0.8}
              >
                <View style={styles.modalSupportContent}>
                  <Text style={styles.modalSupportIcon}>📧</Text>
                  <View style={styles.modalSupportText}>
                    <Text style={[styles.modalSupportTitle, { color: colors.primary[700] }]}>
                      Email Support
                    </Text>
                    <Text style={[styles.modalSupportDesc, { color: colors.primary[600] }]}>
                      support@studymap.app
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSupportOption, { backgroundColor: colors.secondary[50] }]}
                onPress={() => {
                  setShowSupportModal(false);
                  Alert.alert('Help Center', 'Visit our help center at help.studymap.app for FAQs and guides.');
                }}
                activeOpacity={0.8}
              >
                <View style={styles.modalSupportContent}>
                  <Text style={styles.modalSupportIcon}>❓</Text>
                  <View style={styles.modalSupportText}>
                    <Text style={[styles.modalSupportTitle, { color: colors.secondary[700] }]}>
                      Help Center
                    </Text>
                    <Text style={[styles.modalSupportDesc, { color: colors.secondary[600] }]}>
                      FAQs and guides
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSupportOption, { backgroundColor: colors.accent[50] }]}
                onPress={() => {
                  setShowSupportModal(false);
                  Alert.alert('Bug Report', 'Thank you for helping us improve! Please email us at support@studymap.app with details about the issue.');
                }}
                activeOpacity={0.8}
              >
                <View style={styles.modalSupportContent}>
                  <Text style={styles.modalSupportIcon}>🐛</Text>
                  <View style={styles.modalSupportText}>
                    <Text style={[styles.modalSupportTitle, { color: colors.accent[700] }]}>
                      Report Bug
                    </Text>
                    <Text style={[styles.modalSupportDesc, { color: colors.accent[600] }]}>
                      Help us improve the app
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancelButton, { backgroundColor: colors.neutral[100] }]}
                onPress={() => setShowSupportModal(false)}
                activeOpacity={0.8}
              >
                <Text style={[styles.modalCancelText, { color: colors.neutral[700], textAlign: 'center' }]}>
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Rate StudyMap Modal */}
      <Modal
        visible={showRateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.neutral[0] }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalRateIcon}>⭐</Text>
              <Text style={[styles.modalTitle, { color: colors.neutral[900] }]}>
                Rate StudyMap
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.neutral[600] }]}>
                Help others discover StudyMap by sharing your experience
              </Text>
            </View>

            {/* Rating Content */}
            <View style={styles.modalRateContent}>
              <Text style={[styles.modalRateText, { color: colors.neutral[700] }]}>
                If you&apos;re enjoying StudyMap, we&apos;d love your feedback on the app store! 
                Your review helps us improve and reach more students.
              </Text>
            </View>

            {/* Modal Actions */}
            <View style={styles.modalRateActions}>
              <TouchableOpacity
                style={[styles.modalCancelButton, { backgroundColor: colors.neutral[100], flex: 1, marginRight: 8 }]}
                onPress={() => setShowRateModal(false)}
                activeOpacity={0.8}
              >
                <Text style={[styles.modalCancelText, { color: colors.neutral[700], textAlign: 'center' }]}>
                  Maybe Later
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalRateButton, { backgroundColor: colors.primary[500], flex: 1, marginLeft: 8 }]}
                onPress={() => {
                  setShowRateModal(false);
                  openAppStore();
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.modalRateButtonText, { color: '#FFFFFF', textAlign: 'center' }]}>
                  Rate App
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.neutral[0] }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalDeleteIcon}>⚠️</Text>
              <Text style={[styles.modalTitle, { color: colors.error[700] }]}>
                Delete Account
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.neutral[600] }]}>
                This action cannot be undone
              </Text>
            </View>

            {/* Warning Content */}
            <View style={styles.modalDeleteContent}>
              <View style={[styles.modalDeleteWarning, { backgroundColor: colors.error[50] }]}>
                <Text style={[styles.modalDeleteWarningText, { color: colors.error[700] }]}>
                  ⚠️ All your data will be permanently deleted:
                </Text>
                <View style={styles.modalDeleteList}>
                  <Text style={[styles.modalDeleteItem, { color: colors.error[600] }]}>
                    • Study progress and achievements
                  </Text>
                  <Text style={[styles.modalDeleteItem, { color: colors.error[600] }]}>
                    • Personal information and preferences
                  </Text>
                  <Text style={[styles.modalDeleteItem, { color: colors.error[600] }]}>
                    • Study schedules and reminders
                  </Text>
                </View>
              </View>
            </View>

            {/* Modal Actions */}
            <View style={styles.modalDeleteActions}>
              <TouchableOpacity
                style={[styles.modalCancelButton, { backgroundColor: colors.neutral[100], flex: 1, marginRight: 8 }]}
                onPress={() => setShowDeleteModal(false)}
                activeOpacity={0.8}
              >
                <Text style={[styles.modalCancelText, { color: colors.neutral[700], textAlign: 'center' }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalDeleteButton, { backgroundColor: colors.error[500], flex: 1, marginLeft: 8 }]}
                onPress={() => {
                  setShowDeleteModal(false);
                  Alert.alert(
                    'Final Confirmation',
                    'Are you absolutely sure you want to delete your account? This action cannot be undone.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete Forever', style: 'destructive', onPress: performDeleteAccount }
                    ]
                  );
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.modalDeleteButtonText, { color: '#FFFFFF', textAlign: 'center' }]}>
                  Delete Account
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Study Time Modal */}
      <Modal
        visible={showStudyTimeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStudyTimeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.neutral[0], maxHeight: '85%' }]}>  
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.neutral[900] }]}>⏰ Select Study Time</Text>
              <Text style={[styles.modalSubtitle, { color: colors.neutral[600] }]}>Choose your preferred time for daily study reminders</Text>
            </View>
            {/* Time Grid */}
            <ScrollView style={{ maxHeight: 320 }} contentContainerStyle={styles.timeGridContainer} showsVerticalScrollIndicator={false}>
              <View style={styles.timeGridRowWrap}>
                {allTimes.map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.timeGridCell,
                      pendingStudyTime === time && { backgroundColor: colors.primary[500], borderColor: colors.primary[500] }
                    ]}
                    onPress={() => setPendingStudyTime(time)}
                    activeOpacity={0.8}
                  >
                    <Text style={{ color: pendingStudyTime === time ? '#fff' : colors.neutral[800], fontWeight: '600' }}>{time}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            {/* Modal Actions */}
            <View style={[styles.modalActions, { flexDirection: 'row', gap: 12, marginTop: 8 }]}> 
              <TouchableOpacity
                style={[styles.modalCancelButton, { backgroundColor: colors.neutral[100], flex: 1 }]}
                onPress={() => setShowStudyTimeModal(false)}
                activeOpacity={0.8}
              >
                <Text style={[styles.modalCancelText, { color: colors.neutral[700], textAlign: 'center' }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalCancelButton, { backgroundColor: colors.primary[500], flex: 1 }]}
                onPress={handleStudyTimeSave}
                activeOpacity={0.8}
              >
                <Text style={[styles.modalCancelText, { color: '#fff', textAlign: 'center', fontWeight: '700' }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  settingsIconContainer: {
    marginRight: 16,
    width: 24,
    alignItems: 'center',
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  modalOptionsContainer: {
    marginBottom: 20,
    gap: 12,
  },
  modalOptionCard: {
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 12,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 3,
  },
  modalOptionContent: {
    paddingRight: 24,
  },
  modalOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalOptionIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  modalOptionLabel: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  modalOptionFrequency: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalSelectedIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modalCheckIcon: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  modalCancelButton: {
    padding: 16,
    borderRadius: 12,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalSupportOption: {
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 12,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 3,
  },
  modalSupportContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalSupportIcon: {
    fontSize: 20,
    marginRight: 16,
  },
  modalSupportText: {
    flex: 1,
  },
  modalSupportTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  modalSupportDesc: {
    fontSize: 14,
    lineHeight: 18,
  },
  modalRateIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  modalRateContent: {
    padding: 20,
  },
  modalRateText: {
    fontSize: 14,
    lineHeight: 18,
  },
  modalRateActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  modalRateButton: {
    padding: 16,
    borderRadius: 12,
  },
  modalRateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalDeleteIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  modalDeleteContent: {
    padding: 20,
  },
  modalDeleteWarning: {
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 12,
  },
  modalDeleteWarningText: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalDeleteList: {
    marginLeft: 16,
  },
  modalDeleteItem: {
    fontSize: 14,
    lineHeight: 18,
  },
  modalDeleteActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  modalDeleteButton: {
    padding: 16,
    borderRadius: 12,
  },
  modalDeleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Modern Toggle Styles
  modernToggleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  modernToggleWrapper: {
    padding: 4, // Increase touch target
  },
  modernToggle: {
    width: 52,
    height: 30,
    borderRadius: 15,
    padding: 3,
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
  modernToggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  modernToggleCheck: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
  },
  settingsTextContainer: {
    flex: 1,
  },
  timeOptionsContainer: {
    marginBottom: 20,
    gap: 12,
  },
  timeOptionCard: {
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 12,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 3,
  },
  timeOptionContent: {
    paddingRight: 24,
  },
  timeOptionLabel: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  timeGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  timeGridRowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  timeGridCell: {
    width: 70,
    height: 38,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
  },
}); 