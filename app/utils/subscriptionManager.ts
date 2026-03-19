import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases, { CustomerInfo, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import { devLog, devWarn, reportError } from './logger';

import { hasActiveReferralTrial, hasCachedReferralTrial, updateReferralOnSubscription } from './referralManager';

const SUBSCRIPTION_STATUS_KEY = 'subscription_status';
const PREMIUM_HISTORY_KEY = 'premium_history_status';
const SUBSCRIPTION_BYPASS_ENABLED =
  __DEV__ && process.env.EXPO_PUBLIC_BYPASS_PREMIUM === 'true';
let revenueCatConfigured = false;
let revenueCatInitPromise: Promise<boolean> | null = null;
let offeringsRequestPromise: Promise<PurchasesOffering | null> | null = null;
let cachedOfferings: PurchasesOffering | null = null;

// Universal RevenueCat API key from environment variables
const REVENUECAT_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;

export interface SubscriptionStatus {
  isActive: boolean;
  type?: 'monthly' | 'annual' | 'weekly' | 'lifetime';
  expiresDate?: string;
  willRenew?: boolean;
  productId?: string;
}

export const getCachedSubscriptionStatus = async (): Promise<SubscriptionStatus> => {
  const localStatus = await AsyncStorage.getItem(SUBSCRIPTION_STATUS_KEY);
  return {
    isActive: localStatus === 'active',
  };
};

export const hasEverPremiumAccess = async (): Promise<boolean> => {
  try {
    return (await AsyncStorage.getItem(PREMIUM_HISTORY_KEY)) === 'true';
  } catch (error) {
    reportError('❌ Error reading premium history:', error);
    return false;
  }
};

const markPremiumHistory = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(PREMIUM_HISTORY_KEY, 'true');
  } catch (error) {
    reportError('❌ Error persisting premium history:', error);
  }
};

/**
 * Initialize RevenueCat with universal API key
 */
export const initializeRevenueCat = async (): Promise<boolean> => {
  if (revenueCatConfigured) {
    return true;
  }

  if (revenueCatInitPromise) {
    return revenueCatInitPromise;
  }

  revenueCatInitPromise = (async () => {
  try {
    if (__DEV__) {
      const preview = REVENUECAT_API_KEY ? `${REVENUECAT_API_KEY.slice(0, 6)}…` : 'undefined';
      devLog('🔑 Using RevenueCat key (dev):', preview);
    }
    
    if (!REVENUECAT_API_KEY || REVENUECAT_API_KEY === 'your-api-key-here') {
      devWarn('⚠️ RevenueCat API key not configured');
      return false;
    }

    await Purchases.configure({
      apiKey: REVENUECAT_API_KEY,
      appUserID: undefined, // Let RevenueCat generate anonymous user ID
    });

    revenueCatConfigured = true;

    if (__DEV__) {
      devLog('✅ RevenueCat initialized successfully');
    }
    return true;
  } catch (error) {
    reportError('❌ RevenueCat initialization error:', error);
    return false;
  } finally {
    revenueCatInitPromise = null;
  }
  })();

  return revenueCatInitPromise;
};

/**
 * Sync purchases manually when needed (restore/subscription screen/purchase recovery).
 * Do not call at app startup to avoid unnecessary App Store auth prompts.
 */
export const syncRevenueCatPurchases = async (): Promise<void> => {
  try {
    const ok = await initializeRevenueCat();
    if (!ok) return;
    await Purchases.syncPurchases();
  } catch (error) {
    reportError('❌ RevenueCat sync error:', error);
  }
};

/**
 * Get available subscription offerings from RevenueCat
 */
export const getSubscriptionOfferings = async (): Promise<PurchasesOffering | null> => {
  if (cachedOfferings) {
    return cachedOfferings;
  }

  if (offeringsRequestPromise) {
    return offeringsRequestPromise;
  }

  offeringsRequestPromise = (async () => {
  try {
    const ok = await initializeRevenueCat();
    if (!ok) return null;

    if (__DEV__) {
      devLog('🔍 Fetching offerings from RevenueCat...');
    }
    const offerings = await Purchases.getOfferings();

    if (__DEV__) {
      devLog('📦 Raw offerings response:', JSON.stringify({
        current: offerings.current?.identifier,
        all: Object.keys(offerings.all),
      }));
    }

    if (offerings.current !== null) {
      if (__DEV__) {
        devLog('📦 Current offering identifier:', offerings.current.identifier);
        devLog('📦 Available packages count:', offerings.current.availablePackages.length);
      }

      // Log each package details
      if (__DEV__) {
        offerings.current.availablePackages.forEach((pkg, index) => {
          devLog(`📦 Package ${index + 1}:`, {
            identifier: pkg.identifier,
            packageType: pkg.packageType,
            productId: pkg.product.identifier,
            title: pkg.product.title,
            priceString: pkg.product.priceString,
          });
        });
      }

      cachedOfferings = offerings.current;
      return offerings.current;
    } else {
      devWarn('⚠️ No current offering found!');
      devWarn('⚠️ All offerings:', Object.keys(offerings.all));

      // Try to get 'default' offering explicitly
      if (offerings.all['default']) {
        devLog('✅ Found "default" offering, using that instead');
        cachedOfferings = offerings.all['default'];
        return offerings.all['default'];
      }

      return null;
    }
  } catch (error) {
    reportError('❌ Error fetching offerings:', error);
    return null;
  } finally {
    offeringsRequestPromise = null;
  }
  })();

  return offeringsRequestPromise;
};

/**
 * Purchase a subscription package
 */
export const purchasePackage = async (packageToPurchase: PurchasesPackage): Promise<SubscriptionStatus> => {
  try {
    const ok = await initializeRevenueCat();
    if (!ok) throw new Error('Payment system is not available');

    if (__DEV__) {
      devLog('💳 Starting purchase for package:', packageToPurchase.identifier);
    }
    
    const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);

    // Debug: Log customerInfo details
    if (__DEV__) {
      devLog('🔍 CustomerInfo after purchase:', {
        allEntitlements: Object.keys(customerInfo.entitlements.all),
        activeEntitlements: Object.keys(customerInfo.entitlements.active),
        allPurchasedProductIds: customerInfo.allPurchasedProductIdentifiers,
        activeSubscriptions: customerInfo.activeSubscriptions
      });
    }

    const isActive = customerInfo.entitlements.active['premium'] !== undefined;
    
    if (isActive) {
      const entitlement = customerInfo.entitlements.active['premium'];

      // Update local storage
      await AsyncStorage.setItem(SUBSCRIPTION_STATUS_KEY, 'active');
      await markPremiumHistory();

      const subscriptionType = getSubscriptionType(packageToPurchase.identifier);

      // Update referral status in Supabase (if user was referred)
      try {
        await updateReferralOnSubscription();
      } catch (referralError) {
        reportError('⚠️ Error updating referral status:', referralError);
        // Don't fail the purchase if referral update fails
      }

      if (__DEV__) {
        devLog('✅ Purchase successful!');
      }

      return {
        isActive: true,
        type: subscriptionType,
        expiresDate: entitlement.expirationDate || undefined,
        willRenew: entitlement.willRenew,
        productId: packageToPurchase.identifier,
      };
    } else {
      throw new Error('Purchase completed but entitlement not found');
    }
  } catch (error: any) {
    reportError('❌ Purchase failed:', error);
    
    // Handle specific RevenueCat errors
    if (error.code === 'PURCHASE_CANCELLED') {
      throw new Error('Purchase was cancelled by user');
    } else if (error.code === 'PAYMENT_PENDING') {
      throw new Error('Payment is pending approval');
    } else if (error.code === 'PRODUCT_NOT_AVAILABLE') {
      throw new Error('Product is not available for purchase');
    } else {
      throw new Error(error.message || 'Purchase failed. Please try again.');
    }
  }
};

/**
 * Check current subscription status
 */
export const getSubscriptionStatus = async (): Promise<SubscriptionStatus> => {
  try {
    const ok = await initializeRevenueCat();
    if (!ok) {
      const localStatus = await AsyncStorage.getItem(SUBSCRIPTION_STATUS_KEY);
      return { isActive: localStatus === 'active' };
    }

    // Always verify with RevenueCat for the most current status
    const customerInfo = await Purchases.getCustomerInfo();
    
    const isActive = customerInfo.entitlements.active['premium'] !== undefined;
    
    if (isActive) {
      const entitlement = customerInfo.entitlements.active['premium'];
      
      // Update local storage
      await AsyncStorage.setItem(SUBSCRIPTION_STATUS_KEY, 'active');
      await markPremiumHistory();
      
      return {
        isActive: true,
        expiresDate: entitlement.expirationDate || undefined,
        willRenew: entitlement.willRenew,
        productId: entitlement.productIdentifier,
      };
    } else {
      // Update local storage
      await AsyncStorage.setItem(SUBSCRIPTION_STATUS_KEY, 'inactive');
      
      return {
        isActive: false,
      };
    }
  } catch (error) {
    reportError('❌ Error checking subscription status:', error);
    
    // Fallback to local storage if RevenueCat fails
    const localStatus = await AsyncStorage.getItem(SUBSCRIPTION_STATUS_KEY);
    return {
      isActive: localStatus === 'active',
    };
  }
};

/**
 * Check if user has premium access
 * Checks both subscription and referral trial status
 */
export const hasPremiumAccess = async (): Promise<boolean> => {
  if (SUBSCRIPTION_BYPASS_ENABLED) {
    devLog('🚧 Subscription check temporarily bypassed');
    return true;
  }

  // 1. Check RevenueCat subscription
  const status = await getSubscriptionStatus();
  if (status.isActive) {
    if (__DEV__) {
      devLog('✅ Has active subscription');
    }
    return true;
  }

  // 2. Check referral trial
  const hasReferralTrial = await hasActiveReferralTrial();
  if (hasReferralTrial) {
    await markPremiumHistory();
    if (__DEV__) {
      devLog('🎁 Has active referral trial');
    }
    return true;
  }

  if (__DEV__) {
    devLog('❌ No premium access');
  }
  return false;
};

export const hasCachedPremiumAccess = async (): Promise<boolean> => {
  if (SUBSCRIPTION_BYPASS_ENABLED) {
    devLog('🚧 Subscription check temporarily bypassed');
    return true;
  }

  const status = await getCachedSubscriptionStatus();
  if (status.isActive) {
    if (__DEV__) {
      devLog('✅ Has cached active subscription');
    }
    return true;
  }

  const hasReferralTrial = await hasCachedReferralTrial();
  if (hasReferralTrial) {
    await markPremiumHistory();
    if (__DEV__) {
      devLog('🎁 Has active referral trial');
    }
    return true;
  }

  if (__DEV__) {
    devLog('❌ No cached premium access');
  }
  return false;
};

/**
 * Restore purchases
 */
export const restorePurchases = async (): Promise<SubscriptionStatus> => {
  try {
    const ok = await initializeRevenueCat();
    if (!ok) throw new Error('Payment system is not available');

    devLog('🔄 Restoring purchases...');
    const customerInfo = await Purchases.restorePurchases();
    
    if (customerInfo.entitlements.active['premium']) {
      await AsyncStorage.setItem(SUBSCRIPTION_STATUS_KEY, 'active');
      await markPremiumHistory();
      
      const entitlement = customerInfo.entitlements.active['premium'];
      devLog('✅ Purchases restored successfully');
      
      return {
        isActive: true,
        expiresDate: entitlement.expirationDate || undefined,
        willRenew: entitlement.willRenew,
        productId: entitlement.productIdentifier,
      };
    } else {
      await AsyncStorage.setItem(SUBSCRIPTION_STATUS_KEY, 'inactive');
      devLog('ℹ️ No active subscriptions found to restore');
      
      return {
        isActive: false,
      };
    }
  } catch (error) {
    reportError('❌ Error restoring purchases:', error);
    throw error;
  }
};

/**
 * Set subscription status manually (for testing or offline scenarios)
 */
export const setSubscriptionStatus = async (status: 'active' | 'inactive'): Promise<void> => {
  if (!__DEV__) {
    return;
  }
  await AsyncStorage.setItem(SUBSCRIPTION_STATUS_KEY, status);
  devLog('🧪 Manual subscription status set to:', status);
};

/**
 * Clear subscription status
 */
export const clearSubscriptionStatus = async (): Promise<void> => {
  await AsyncStorage.removeItem(SUBSCRIPTION_STATUS_KEY);
};

export const setCachedPremiumStatus = async (status: 'active' | 'inactive'): Promise<void> => {
  await AsyncStorage.setItem(SUBSCRIPTION_STATUS_KEY, status);
  if (status === 'active') {
    await markPremiumHistory();
  }
};

/**
 * Get user subscription details
 */
export const getSubscriptionDetails = async (): Promise<CustomerInfo | null> => {
  try {
    const ok = await initializeRevenueCat();
    if (!ok) return null;

    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo;
  } catch (error) {
    reportError('❌ Error getting subscription details:', error);
    return null;
  }
};

/**
 * Helper function to determine subscription type from package identifier
 */
const getSubscriptionType = (packageId: string): 'monthly' | 'annual' | 'weekly' | 'lifetime' => {
  if (packageId.includes('annual') || packageId.includes('yearly')) {
    return 'annual';
  } else if (packageId.includes('weekly')) {
    return 'weekly';
  } else if (packageId.includes('lifetime') || packageId.includes('permanent')) {
    return 'lifetime';
  } else {
    return 'monthly';
  }
};

/**
 * Check if user is eligible for intro pricing
 */
export const checkIntroEligibility = async (): Promise<boolean> => {
  try {
    const ok = await initializeRevenueCat();
    if (!ok) return true;

    const customerInfo = await Purchases.getCustomerInfo();
    
    // User is eligible for intro pricing if they haven't had any previous subscriptions
    const hasHadSubscription = Object.keys(customerInfo.allPurchaseDates).length > 0;
    
    return !hasHadSubscription;
  } catch (error) {
    reportError('❌ Error checking intro eligibility:', error);
    return true; // Default to eligible if check fails
  }
};

export default {
  initializeRevenueCat,
  syncRevenueCatPurchases,
  getSubscriptionOfferings,
  purchasePackage,
  getCachedSubscriptionStatus,
  getSubscriptionStatus,
  hasCachedPremiumAccess,
  hasEverPremiumAccess,
  hasPremiumAccess,
  restorePurchases,
  setSubscriptionStatus,
  setCachedPremiumStatus,
  clearSubscriptionStatus,
  getSubscriptionDetails,
  checkIntroEligibility,
}; 
