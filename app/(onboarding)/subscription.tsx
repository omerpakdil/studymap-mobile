import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Modal,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../../themes';
import {
    checkIntroEligibility,
    getSubscriptionOfferings,
    initializeRevenueCat,
    purchasePackage,
    restorePurchases
} from '../utils/subscriptionManager';

const { width, height } = Dimensions.get('window');

export default function SubscriptionScreen() {
  const { colors } = useTheme();
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
  const [isIntroEligible, setIsIntroEligible] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeSubscription();
  }, []);

  const initializeSubscription = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Initialize RevenueCat
      const initialized = await initializeRevenueCat();
      if (!initialized) {
        setError('Unable to initialize payment system. Please check your internet connection.');
        return;
      }

      // Check intro eligibility
      const eligible = await checkIntroEligibility();
      setIsIntroEligible(eligible);

      // Get available offerings
      const availableOfferings = await getSubscriptionOfferings();
      if (!availableOfferings || availableOfferings.availablePackages.length === 0) {
        setError('No subscription options available. Please try again later.');
        return;
      }

      setOfferings(availableOfferings);
      
      // Auto-select the most popular package (typically annual)
      const popularPackage = availableOfferings.availablePackages.find(pkg => 
        pkg.packageType === 'ANNUAL'
      ) || availableOfferings.availablePackages[0];
      
      setSelectedPackage(popularPackage);
      
    } catch (error: any) {
      console.error('❌ Subscription initialization error:', error);
      setError('Failed to load subscription options. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedPackage) {
      Alert.alert('Error', 'Please select a subscription plan.');
      return;
    }

    console.log('💳 Starting purchase process...');
    setPurchasing(true);
    setError(null);
    
    try {
      const subscriptionStatus = await purchasePackage(selectedPackage);
      
      if (subscriptionStatus.isActive) {
        console.log('🎉 Purchase successful!');
        setShowSuccessModal(true);
      } else {
        throw new Error('Purchase completed but subscription not activated');
      }
    } catch (error: any) {
      console.error('❌ Purchase failed:', error);
      
      let errorMessage = 'Purchase failed. Please try again.';
      
      if (error.message.includes('cancelled')) {
        errorMessage = 'Purchase was cancelled.';
      } else if (error.message.includes('pending')) {
        errorMessage = 'Payment is pending approval. You will receive access once approved.';
      } else if (error.message.includes('not available')) {
        errorMessage = 'This subscription is not available in your region.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Purchase Failed', errorMessage);
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    try {
      setLoading(true);
      const restoredStatus = await restorePurchases();
      
      if (restoredStatus.isActive) {
        Alert.alert(
          'Subscription Restored',
          'Your subscription has been restored successfully!',
          [{ text: 'OK', onPress: () => router.replace('/(tabs)/dashboard') }]
        );
      } else {
        Alert.alert(
          'No Subscription Found',
          'No active subscription found to restore. If you believe this is an error, please contact support.'
        );
      }
    } catch (error: any) {
      console.error('❌ Restore failed:', error);
      Alert.alert(
        'Restore Failed',
        'Unable to restore subscription. Please try again or contact support if the issue persists.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessModalClose = async () => {
    console.log('🔄 Modal close button pressed');
    setShowSuccessModal(false);
    
    // Small delay to allow modal to close
    await new Promise(resolve => setTimeout(resolve, 300));
    
    console.log('🚀 Navigating to dashboard...');
    try {
      router.replace('/(tabs)/dashboard');
      console.log('✅ Navigation command executed');
    } catch (error) {
      console.error('❌ Navigation error:', error);
      // Fallback to push navigation
      router.push('/(tabs)/dashboard');
    }
  };

  const formatPrice = (packageItem: PurchasesPackage): string => {
    return packageItem.product.priceString;
  };

  const getPackageTitle = (packageItem: PurchasesPackage): string => {
    switch (packageItem.packageType) {
      case 'ANNUAL':
        return 'Annual Plan';
      case 'MONTHLY':
        return 'Monthly Plan';
      case 'WEEKLY':
        return 'Weekly Plan';
      default:
        return packageItem.product.title || 'Subscription Plan';
    }
  };

  const getPackageSubtitle = (packageItem: PurchasesPackage): string => {
    switch (packageItem.packageType) {
      case 'ANNUAL':
        return 'Best Value';
      case 'MONTHLY':
        return 'Flexible';
      case 'WEEKLY':
        return 'Trial';
      default:
        return 'Premium Access';
    }
  };

  const isPackagePopular = (packageItem: PurchasesPackage): boolean => {
    return packageItem.packageType === 'ANNUAL';
  };

  const getMonthlyEquivalent = (packageItem: PurchasesPackage): string | null => {
    if (packageItem.packageType === 'ANNUAL') {
      // Calculate monthly equivalent for annual plans
      const price = packageItem.product.price;
      const monthlyPrice = price / 12;
      return `Only $${monthlyPrice.toFixed(2)}/month`;
    }
    return null;
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.primary[500] }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>
            {error ? 'Retrying...' : 'Loading subscription options...'}
          </Text>
          {error && (
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={initializeSubscription}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  if (error && !offerings) {
    return (
      <View style={[styles.container, { backgroundColor: colors.primary[500] }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Connection Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={initializeSubscription}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary[600]} />
      
      {/* Header with Gradient */}
      <LinearGradient
        colors={[colors.primary[500], colors.primary[600], colors.primary[700]]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumIcon}>👑</Text>
              <Text style={styles.premiumText}>PREMIUM</Text>
            </View>
            
            <Text style={styles.title}>StudyMap Premium</Text>
            <Text style={styles.subtitle}>
              Unlock AI-powered personalized learning
            </Text>
            
            {/* Quick Features */}
            <View style={styles.quickFeatures}>
              <View style={styles.featureRow}>
                <Text style={styles.featureIcon}>🎯</Text>
                <Text style={styles.featureText}>Personal AI Tutor</Text>
              </View>
              <View style={styles.featureRow}>
                <Text style={styles.featureIcon}>📊</Text>
                <Text style={styles.featureText}>Advanced Analytics</Text>
              </View>
              <View style={styles.featureRow}>
                <Text style={styles.featureIcon}>⚡</Text>
                <Text style={styles.featureText}>Unlimited Access</Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Content */}
      <View style={[styles.content, { backgroundColor: colors.neutral[50] }]}>
        {/* Pricing Cards */}
        {offerings && (
          <View style={styles.pricingContainer}>
            {offerings.availablePackages.map((packageItem) => {
              const isSelected = selectedPackage?.identifier === packageItem.identifier;
              const isPopular = isPackagePopular(packageItem);
              const monthlyEquivalent = getMonthlyEquivalent(packageItem);
              
              return (
                <TouchableOpacity
                  key={packageItem.identifier}
                  style={[
                    styles.pricingCard,
                    { backgroundColor: colors.neutral[0] },
                    isSelected && { 
                      borderColor: colors.primary[500],
                      backgroundColor: colors.primary[50],
                      transform: [{ scale: 1.02 }]
                    }
                  ]}
                  onPress={() => setSelectedPackage(packageItem)}
                  activeOpacity={0.8}
                >
                  {isPopular && (
                    <View style={[styles.popularBadge, { backgroundColor: colors.secondary[500] }]}>
                      <Text style={styles.popularText}>MOST POPULAR</Text>
                    </View>
                  )}
                  
                  <View style={styles.cardContent}>
                    <Text style={[styles.planName, { color: colors.neutral[700] }]}>
                      {getPackageTitle(packageItem)}
                    </Text>
                    <Text style={[styles.planSubtitle, { color: colors.neutral[500] }]}>
                      {getPackageSubtitle(packageItem)}
                    </Text>
                    
                    <View style={styles.priceContainer}>
                      <View style={styles.priceRow}>
                        <Text style={[styles.price, { color: colors.primary[600] }]}>
                          {formatPrice(packageItem)}
                        </Text>
                        <Text style={[styles.period, { color: colors.neutral[500] }]}>
                          /{packageItem.packageType.toLowerCase()}
                        </Text>
                      </View>
                    </View>
                    
                    {monthlyEquivalent && (
                      <Text style={[styles.monthlyEquivalent, { color: colors.neutral[500] }]}>
                        {monthlyEquivalent}
                      </Text>
                    )}

                    {isIntroEligible && packageItem.product.introPrice && (
                      <View style={[styles.introBadge, { backgroundColor: colors.accent[500] }]}>
                        <Text style={styles.introText}>
                          {packageItem.product.introPrice.periodNumberOfUnits} {packageItem.product.introPrice.periodUnit} FREE
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  {isSelected && (
                    <View style={[styles.selectedIndicator, { backgroundColor: colors.primary[500] }]}>
                      <Text style={styles.checkIcon}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Premium Features List */}
        <View style={styles.featuresContainer}>
          <Text style={[styles.featuresTitle, { color: colors.neutral[700] }]}>
            Premium Features
          </Text>
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Text style={styles.checkmark}>✓</Text>
              <Text style={[styles.featureText, { color: colors.neutral[600] }]}>
                Full personalized study program
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.checkmark}>✓</Text>
              <Text style={[styles.featureText, { color: colors.neutral[600] }]}>
                Advanced AI content generation
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.checkmark}>✓</Text>
              <Text style={[styles.featureText, { color: colors.neutral[600] }]}>
                Detailed analytics & progress tracking
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.checkmark}>✓</Text>
              <Text style={[styles.featureText, { color: colors.neutral[600] }]}>
                Priority customer support
              </Text>
            </View>
          </View>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <TouchableOpacity
            style={[
              styles.subscribeButton,
              { backgroundColor: colors.primary[500] },
              (purchasing || !selectedPackage) && { opacity: 0.7 }
            ]}
            onPress={handlePurchase}
            disabled={purchasing || !selectedPackage}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.primary[400], colors.primary[500], colors.primary[600]]}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {purchasing ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Start Premium</Text>
                  {isIntroEligible && selectedPackage?.product.introPrice && (
                    <Text style={styles.buttonSubtext}>
                      {selectedPackage.product.introPrice.periodNumberOfUnits} {selectedPackage.product.introPrice.periodUnit} free trial
                    </Text>
                  )}
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.restoreButton} onPress={handleRestore}>
            <Text style={[styles.restoreText, { color: colors.neutral[500] }]}>
              Restore purchases
            </Text>
          </TouchableOpacity>
        </View>

        {/* Terms */}
        <Text style={[styles.terms, { color: colors.neutral[400] }]}>
          Subscription automatically renews. Cancel anytime in settings.
        </Text>
      </View>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleSuccessModalClose}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.neutral[0] }]}>
            <LinearGradient
              colors={[colors.primary[500], colors.primary[600]]}
              style={styles.modalHeader}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.successIconContainer}>
                <Text style={styles.successIcon}>🎉</Text>
              </View>
            </LinearGradient>
            
            <View style={styles.modalBody}>
              <Text style={[styles.modalTitle, { color: colors.neutral[800] }]}>
                Welcome to Premium!
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.neutral[600] }]}>
                Your subscription is now active. Unlock your full learning potential!
              </Text>
              
              <View style={styles.modalFeatures}>
                <View style={styles.modalFeatureItem}>
                  <Text style={styles.modalFeatureIcon}>✨</Text>
                  <Text style={[styles.modalFeatureText, { color: colors.neutral[700] }]}>
                    AI-powered study plans
                  </Text>
                </View>
                <View style={styles.modalFeatureItem}>
                  <Text style={styles.modalFeatureIcon}>📈</Text>
                  <Text style={[styles.modalFeatureText, { color: colors.neutral[700] }]}>
                    Advanced progress tracking
                  </Text>
                </View>
                <View style={styles.modalFeatureItem}>
                  <Text style={styles.modalFeatureIcon}>🎯</Text>
                  <Text style={[styles.modalFeatureText, { color: colors.neutral[700] }]}>
                    Personalized learning path
                  </Text>
                </View>
              </View>
            </View>
            
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.primary[500] }]}
              onPress={handleSuccessModalClose}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.primary[400], colors.primary[500], colors.primary[600]]}
                style={styles.modalButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.modalButtonText}>Get Started</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
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
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  errorMessage: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    paddingBottom: 20,
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  premiumIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  premiumText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  quickFeatures: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 300,
    alignSelf: 'center',
  },
  featureRow: {
    alignItems: 'center',
    marginHorizontal: 12,
  },
  featureIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  featureText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -15,
  },
  pricingContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  pricingCard: {
    flex: 1,
    padding: 18,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    left: 0,
    right: 0,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  popularText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cardContent: {
    alignItems: 'center',
    marginTop: 8,
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  planSubtitle: {
    fontSize: 12,
    marginBottom: 8,
  },
  priceContainer: {
    alignItems: 'center',
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 22,
    fontWeight: '800',
  },
  period: {
    fontSize: 12,
    marginLeft: 2,
  },
  monthlyEquivalent: {
    fontSize: 11,
    textAlign: 'center',
  },
  introBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 4,
  },
  introText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 16,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  featuresList: {
    paddingHorizontal: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkmark: {
    color: '#22C55E',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 12,
    width: 20,
  },
  ctaSection: {
    marginBottom: 10,
    marginTop: -10,
  },
  subscribeButton: {
    borderRadius: 16,
    marginBottom: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonGradient: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  buttonSubtext: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  restoreText: {
    fontSize: 14,
    fontWeight: '500',
  },
  terms: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 20,
    marginBottom: 40,
    marginTop: -10,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    borderRadius: 24,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeader: {
    paddingTop: 30,
    paddingBottom: 20,
    alignItems: 'center',
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIcon: {
    fontSize: 40,
  },
  modalBody: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalFeatures: {
    width: '100%',
  },
  modalFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  modalFeatureIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
  },
  modalFeatureText: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  modalButton: {
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 16,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalButtonGradient: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
}); 