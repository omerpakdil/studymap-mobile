import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components';
import { useTheme } from '@/themes';

const { width } = Dimensions.get('window');
const isIOS = Platform.OS === 'ios';

export default function UserInfoScreen() {
  const { colors } = useTheme();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isFormValid = firstName.trim() && lastName.trim() && email.trim() && validateEmail(email);

  const handleContinue = async () => {
    if (!isFormValid) return;

    try {
      setLoading(true);

      const userInfo = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        fullName: `${firstName.trim()} ${lastName.trim()}`,
        createdAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem('user_info', JSON.stringify(userInfo));
      
      console.log('✅ User info saved successfully:', userInfo);
      router.push('/(onboarding)/exam-selection');
      
    } catch (error) {
      console.error('❌ Error saving user info:', error);
      Alert.alert('Error', 'Failed to save your information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.neutral[0] }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.neutral[0]} />
      


      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Content */}
          <View style={styles.content}>
            {/* Beautiful Header */}
            <View style={styles.beautifulHeader}>
              {/* Floating Icon */}
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={[colors.primary[400], colors.primary[600]]}
                  style={styles.iconGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.iconEmoji}>👋</Text>
                </LinearGradient>
                
                {/* Decorative Elements */}
                <View style={[styles.decorativeDot, styles.dot1, { backgroundColor: colors.secondary[300] }]} />
                <View style={[styles.decorativeDot, styles.dot2, { backgroundColor: colors.accent[300] }]} />
                <View style={[styles.decorativeDot, styles.dot3, { backgroundColor: colors.primary[200] }]} />
              </View>

              {/* Content */}
              <View style={styles.headerTextContent}>
                <Text style={[styles.greetingText, { color: colors.primary[600] }]}>
                  Nice to meet you!
                </Text>
                <Text style={[styles.mainHeaderTitle, { color: colors.neutral[900] }]}>
                  Let's get started
                </Text>
                <Text style={[styles.headerDescription, { color: colors.neutral[500] }]}>
                  Tell us a bit about yourself so we can create your perfect study plan
                </Text>
              </View>

              {/* Subtle Accent */}
              <View style={[styles.accentLine, { backgroundColor: colors.primary[200] }]} />
            </View>

            {/* Form Section */}
            <View style={styles.formSection}>
              {/* Name Row */}
              <View style={styles.nameRow}>
                <View style={styles.nameInput}>
                  <Text style={[styles.inputLabel, { color: colors.neutral[800] }]}>
                    First Name
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.neutral[50],
                        borderColor: firstName ? colors.primary[300] : colors.neutral[200],
                        color: colors.neutral[900],
                      },
                    ]}
                    placeholder="John"
                    placeholderTextColor={colors.neutral[400]}
                    value={firstName}
                    onChangeText={setFirstName}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.nameInput}>
                  <Text style={[styles.inputLabel, { color: colors.neutral[800] }]}>
                    Last Name
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.neutral[50],
                        borderColor: lastName ? colors.primary[300] : colors.neutral[200],
                        color: colors.neutral[900],
                      },
                    ]}
                    placeholder="Doe"
                    placeholderTextColor={colors.neutral[400]}
                    value={lastName}
                    onChangeText={setLastName}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Email Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.neutral[800] }]}>
                  Email Address
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.neutral[50],
                      borderColor: email && validateEmail(email) 
                        ? colors.success[300] 
                        : email 
                          ? colors.error[300] 
                          : colors.neutral[200],
                      color: colors.neutral[900],
                    },
                  ]}
                  placeholder="john.doe@example.com"
                  placeholderTextColor={colors.neutral[400]}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {email && !validateEmail(email) && (
                  <Text style={[styles.errorText, { color: colors.error[500] }]}>
                    Please enter a valid email address
                  </Text>
                )}
              </View>

              {/* Privacy Notice */}
              <View style={[styles.privacyNotice, { backgroundColor: colors.primary[50] }]}>
                <View style={styles.privacyContent}>
                  <Text style={styles.privacyIcon}>🔒</Text>
                  <Text style={[styles.privacyText, { color: colors.primary[700] }]}>
                    Your information is stored securely on your device and never shared
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        <Button
          variant="primary"
          onPress={handleContinue}
          disabled={loading || !isFormValid}
          style={styles.continueButton}
        >
          {loading ? 'Saving...' : 'Choose Exam'}
        </Button>
      </View>

      {/* Background Gradient */}
      <LinearGradient
        colors={[
          'rgba(59, 130, 246, 0.03)',
          'transparent',
          'rgba(139, 92, 246, 0.03)',
        ]}
        style={styles.backgroundGradient}
        pointerEvents="none"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: isIOS ? 40 : 32,
  },
  // Beautiful Header
  beautifulHeader: {
    alignItems: 'center',
    marginBottom: 36,
    paddingVertical: 8,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  iconEmoji: {
    fontSize: 28,
  },
  decorativeDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.6,
  },
  dot1: {
    top: 8,
    right: -4,
  },
  dot2: {
    bottom: 12,
    left: -8,
  },
  dot3: {
    top: -2,
    left: 18,
  },
  headerTextContent: {
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  greetingText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  mainHeaderTitle: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.8,
    marginVertical: 2,
  },
  headerDescription: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 24,
    marginTop: 4,
  },
  accentLine: {
    width: 40,
    height: 3,
    borderRadius: 2,
    opacity: 0.8,
  },
  formSection: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  nameInput: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.2,
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
  privacyNotice: {
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  privacyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  privacyIcon: {
    fontSize: 20,
  },
  privacyText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: isIOS ? 20 : 20,
  },
  continueButton: {
    width: '100%',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
}); 