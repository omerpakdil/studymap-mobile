import { Ionicons } from '@expo/vector-icons';
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
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/themes';
import { applyReferralCode, validateReferralCode } from '@/app/utils/referralManager';

const { width } = Dimensions.get('window');
const isIOS = Platform.OS === 'ios';
const isTablet = width >= 768;

export default function ReferralScreen() {
  const { colors } = useTheme();
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleApplyCode = async () => {
    if (!referralCode.trim()) {
      Alert.alert('Error', 'Please enter a referral code');
      return;
    }

    try {
      setLoading(true);

      // Validate code
      const isValid = await validateReferralCode(referralCode.trim());
      if (!isValid) {
        Alert.alert(
          'Invalid Code',
          'This referral code is invalid or has already been used.'
        );
        setLoading(false);
        return;
      }

      // Apply code
      await applyReferralCode(referralCode.trim());

      // Show success message
      Alert.alert(
        'Success! 🎉',
        '7 days of premium access unlocked! You can now access all features for free.',
        [
          {
            text: 'Start Using',
            onPress: () => router.replace('/(tabs)/dashboard'),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to apply referral code');
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.push('/(onboarding)/subscription');
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
          {/* Skip Button */}
          <View style={styles.skipContainer}>
            <TouchableOpacity
              style={[styles.skipButton, { backgroundColor: colors.neutral[100] }]}
              onPress={handleSkip}
            >
              <Text style={[styles.skipButtonText, { color: colors.neutral[600] }]}>
                Skip
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Header with Gift Icon */}
            <View style={styles.header}>
              <LinearGradient
                colors={[colors.success[400], colors.success[600]]}
                style={styles.iconGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.giftIcon}>🎁</Text>
              </LinearGradient>

              <Text style={[styles.title, { color: colors.neutral[900] }]}>
                Have a Referral Code?
              </Text>

              <Text style={[styles.subtitle, { color: colors.neutral[600] }]}>
                Get 7 days of premium access for free! Enter your friend's referral code below.
              </Text>
            </View>

            {/* Benefits */}
            <View style={styles.benefitsContainer}>
              <View style={[styles.benefitCard, { backgroundColor: colors.primary[50] }]}>
                <Ionicons name="checkmark-circle" size={24} color={colors.primary[600]} />
                <Text style={[styles.benefitText, { color: colors.primary[700] }]}>
                  AI-powered study plans
                </Text>
              </View>

              <View style={[styles.benefitCard, { backgroundColor: colors.success[50] }]}>
                <Ionicons name="checkmark-circle" size={24} color={colors.success[600]} />
                <Text style={[styles.benefitText, { color: colors.success[700] }]}>
                  Unlimited study sessions
                </Text>
              </View>

              <View style={[styles.benefitCard, { backgroundColor: colors.warning[50] }]}>
                <Ionicons name="checkmark-circle" size={24} color={colors.warning[600]} />
                <Text style={[styles.benefitText, { color: colors.warning[700] }]}>
                  Progress tracking & analytics
                </Text>
              </View>
            </View>

            {/* Input Section */}
            <View style={styles.inputSection}>
              <Text style={[styles.inputLabel, { color: colors.neutral[800] }]}>
                Referral Code
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.neutral[50],
                    borderColor: referralCode ? colors.primary[300] : colors.neutral[200],
                    color: colors.neutral[900],
                  },
                ]}
                placeholder="Enter 6-digit code (e.g., S2K4P9)"
                placeholderTextColor={colors.neutral[400]}
                value={referralCode}
                onChangeText={(text) => setReferralCode(text.toUpperCase())}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={6}
                editable={!loading}
              />

              {/* Apply Button */}
              <TouchableOpacity
                style={[
                  styles.applyButton,
                  {
                    backgroundColor: referralCode.length === 6 ? colors.success[500] : colors.neutral[300]
                  }
                ]}
                onPress={handleApplyCode}
                disabled={loading || referralCode.length !== 6}
              >
                <View style={styles.applyButtonContent}>
                  {loading ? (
                    <Text style={styles.applyButtonText}>Verifying...</Text>
                  ) : (
                    <>
                      <Ionicons name="gift" size={20} color="white" style={{ marginRight: 8 }} />
                      <Text style={styles.applyButtonText}>Unlock 7 Days Free</Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>
            </View>

            {/* Info Card */}
            <View style={[styles.infoCard, { backgroundColor: colors.neutral[50] }]}>
              <Ionicons name="information-circle" size={20} color={colors.neutral[500]} />
              <Text style={[styles.infoText, { color: colors.neutral[600] }]}>
                Don't have a code? No problem! You can subscribe or get a code later from the profile section.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Background Gradient */}
      <LinearGradient
        colors={[
          'rgba(34, 197, 94, 0.03)',
          'transparent',
          'rgba(59, 130, 246, 0.03)',
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
  skipContainer: {
    paddingHorizontal: isTablet ? 80 : 20,
    paddingTop: isIOS ? 8 : 16,
    alignItems: 'flex-end',
  },
  skipButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: isTablet ? 80 : 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconGradient: {
    width: isTablet ? 100 : 80,
    height: isTablet ? 100 : 80,
    borderRadius: isTablet ? 50 : 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  giftIcon: {
    fontSize: isTablet ? 48 : 40,
  },
  title: {
    fontSize: isTablet ? 32 : 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: isTablet ? 18 : 16,
    textAlign: 'center',
    lineHeight: isTablet ? 26 : 24,
    paddingHorizontal: 16,
  },
  benefitsContainer: {
    gap: 12,
    marginBottom: 32,
  },
  benefitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: isTablet ? 18 : 14,
    borderRadius: isTablet ? 14 : 12,
    gap: 12,
  },
  benefitText: {
    fontSize: isTablet ? 16 : 15,
    fontWeight: '600',
    flex: 1,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: '600',
    marginBottom: isTablet ? 10 : 8,
  },
  input: {
    height: isTablet ? 60 : 56,
    borderWidth: 2,
    borderRadius: isTablet ? 14 : 12,
    paddingHorizontal: isTablet ? 20 : 16,
    fontSize: isTablet ? 20 : 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 2,
  },
  applyButton: {
    paddingVertical: isTablet ? 18 : 16,
    borderRadius: isTablet ? 14 : 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  applyButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: isTablet ? 18 : 16,
    fontWeight: '700',
  },
  infoCard: {
    flexDirection: 'row',
    padding: isTablet ? 18 : 16,
    borderRadius: isTablet ? 14 : 12,
    gap: 12,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: isTablet ? 15 : 14,
    lineHeight: isTablet ? 22 : 20,
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
