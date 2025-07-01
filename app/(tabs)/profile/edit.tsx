import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import NotificationService from '@/app/utils/notificationService';
import { GoalsData, loadCompleteOnboardingData, saveGoalsData } from '@/app/utils/onboardingData';
import { useTheme } from '@/themes';
import { useRouter } from 'expo-router';

const isIOS = Platform.OS === 'ios';

interface UserInfo {
  firstName: string;
  lastName: string;
  email: string;
  fullName: string;
  createdAt: string;
}

export default function ProfileEditScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  
  // User info states
  const [userInfo, setUserInfo] = useState<UserInfo>({
    firstName: '',
    lastName: '',
    email: '',
    fullName: '',
    createdAt: '',
  });
  
  // Goals data states
  const [goalsData, setGoalsData] = useState<GoalsData>({
    examDate: '',
    targetScore: '',
    studyIntensity: 'moderate',
    reminderFrequency: 'moderate',
    motivation: '',
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Validation states
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Load user info
      const userInfoStr = await AsyncStorage.getItem('user_info');
      if (userInfoStr) {
        const userData = JSON.parse(userInfoStr);
        setUserInfo(userData);
      }
      
      // Load onboarding data
      const onboardingData = await loadCompleteOnboardingData();
      if (onboardingData?.goalsData) {
        setGoalsData(onboardingData.goalsData);
      }
      
      console.log('📝 Edit profile data loaded');
    } catch (error) {
      console.error('❌ Error loading edit profile data:', error);
      Alert.alert('Error', 'Failed to load profile data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    // Validate user info
    if (!userInfo.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!userInfo.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!userInfo.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(userInfo.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Reminder frequency is always valid since it has a default value

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors before saving.');
      return;
    }

    try {
      setSaving(true);

      // Update user info
      const updatedUserInfo = {
        ...userInfo,
        firstName: userInfo.firstName.trim(),
        lastName: userInfo.lastName.trim(),
        email: userInfo.email.trim().toLowerCase(),
        fullName: `${userInfo.firstName.trim()} ${userInfo.lastName.trim()}`,
      };
      await AsyncStorage.setItem('user_info', JSON.stringify(updatedUserInfo));

      // Update goals data
      await saveGoalsData(goalsData);

      // Sync reminder frequency with notification service
      await NotificationService.syncReminderFrequency(goalsData.reminderFrequency);

      console.log('✅ Profile updated successfully');
      setShowSuccessModal(true);
    } catch (error) {
      console.error('❌ Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateUserInfo = (field: keyof UserInfo, value: string) => {
    setUserInfo(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const updateGoalsData = (field: keyof GoalsData, value: string) => {
    setGoalsData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    router.back();
  };

  const renderSuccessModal = () => (
    <Modal
      visible={showSuccessModal}
      transparent={true}
      animationType="fade"
      onRequestClose={handleSuccessModalClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.neutral[0] }]}>
          {/* Success Icon */}
          <View style={[styles.successIconContainer, { backgroundColor: colors.success[50] }]}>
            <Text style={styles.successIcon}>✅</Text>
          </View>
          
          {/* Success Title */}
          <Text style={[styles.successTitle, { color: colors.neutral[900] }]}>
            Profile Updated!
          </Text>
          
          {/* Success Message */}
          <Text style={[styles.successMessage, { color: colors.neutral[600] }]}>
            Your profile changes have been saved successfully. The updates will be reflected throughout the app.
          </Text>
          
          {/* Action Button */}
          <TouchableOpacity
            style={[styles.successButton, { backgroundColor: colors.success[500] }]}
            onPress={handleSuccessModalClose}
            activeOpacity={0.8}
          >
            <Text style={styles.successButtonText}>Great!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.neutral[0] }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.neutral[600] }]}>
            Loading profile data...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderInputSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.neutral[900] }]}>
        {title}
      </Text>
      <View style={[styles.sectionCard, { backgroundColor: colors.neutral[0] }]}>
        {children}
      </View>
    </View>
  );

  const renderInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string,
    keyboardType: any = 'default',
    autoCapitalize: any = 'words'
  ) => (
    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, { color: colors.neutral[800] }]}>
        {label}
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.neutral[50],
            borderColor: errors[label.toLowerCase().replace(' ', '')] 
              ? colors.error[300] 
              : value 
                ? colors.primary[300] 
                : colors.neutral[200],
            color: colors.neutral[900],
          },
        ]}
        placeholder={placeholder}
        placeholderTextColor={colors.neutral[400]}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
      />
      {errors[label.toLowerCase().replace(' ', '')] && (
        <Text style={[styles.errorText, { color: colors.error[500] }]}>
          {errors[label.toLowerCase().replace(' ', '')]}
        </Text>
      )}
    </View>
  );

  const renderPickerInput = (
    label: string,
    value: string,
    options: { label: string; value: string; icon: string }[],
    onSelect: (value: string) => void
  ) => (
    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, { color: colors.neutral[800] }]}>
        {label}
      </Text>
      <View style={styles.pickerContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.pickerOption,
              {
                backgroundColor: value === option.value 
                  ? colors.primary[100] 
                  : colors.neutral[50],
                borderColor: value === option.value 
                  ? colors.primary[300] 
                  : colors.neutral[200],
              },
            ]}
            onPress={() => onSelect(option.value)}
          >
            <View style={styles.pickerOptionContent}>
              <Text style={styles.pickerOptionIcon}>{option.icon}</Text>
              <Text
                style={[
                  styles.pickerOptionText,
                  {
                    color: value === option.value 
                      ? colors.primary[700] 
                      : colors.neutral[600],
                    fontWeight: value === option.value ? '600' : '400',
                  },
                ]}
              >
                {option.label}
              </Text>
            </View>
            {value === option.value && (
              <View style={styles.pickerSelectedIndicator}>
                <Text style={styles.pickerCheckIcon}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.neutral[50] }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.neutral[50]} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={[styles.backIcon, { color: colors.neutral[600] }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.neutral[900] }]}>
          Edit Profile
        </Text>
        <TouchableOpacity
          style={[
            styles.saveButton,
            {
              backgroundColor: saving ? colors.neutral[300] : colors.primary[500],
            },
          ]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Personal Information */}
          {renderInputSection('Personal Information', (
            <>
              <View style={styles.nameRow}>
                {renderInput(
                  'First Name',
                  userInfo.firstName,
                  (text) => updateUserInfo('firstName', text),
                  'John'
                )}
                {renderInput(
                  'Last Name',
                  userInfo.lastName,
                  (text) => updateUserInfo('lastName', text),
                  'Doe'
                )}
              </View>
              {renderInput(
                'Email',
                userInfo.email,
                (text) => updateUserInfo('email', text),
                'john.doe@example.com',
                'email-address',
                'none'
              )}
            </>
          ))}

          {/* Reminder Settings */}
          {renderInputSection('Reminder Settings', (
            <>
              {renderPickerInput(
                'Reminder Frequency',
                goalsData.reminderFrequency,
                [
                  { label: 'Minimal - Weekly check-ins', value: 'minimal', icon: '📅' },
                  { label: 'Moderate - Daily reminders', value: 'moderate', icon: '⏰' },
                  { label: 'Frequent - Multiple daily', value: 'frequent', icon: '🔔' },
                ],
                (value) => updateGoalsData('reminderFrequency', value)
              )}
            </>
          ))}
        </ScrollView>
      </KeyboardAvoidingView>

      {renderSuccessModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: isIOS ? 8 : 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  sectionCard: {
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 16,
  },
  inputGroup: {
    marginBottom: 20,
    flex: 1,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
  },
  pickerContainer: {
    gap: 8,
  },
  pickerOption: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  pickerOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerOptionIcon: {
    marginRight: 8,
  },
  pickerOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  pickerSelectedIndicator: {
    position: 'absolute',
    right: 16,
    top: 16,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerCheckIcon: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    padding: 20,
    borderRadius: 12,
    width: '80%',
    maxWidth: 400,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successIcon: {
    fontSize: 40,
    fontWeight: '600',
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 20,
  },
  successButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  successButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 