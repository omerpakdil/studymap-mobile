import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases, { CustomerInfo, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';

const SUBSCRIPTION_STATUS_KEY = 'subscription_status';

// Universal RevenueCat API key from environment variables
const REVENUECAT_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;

export interface SubscriptionStatus {
  isActive: boolean;
  type?: 'monthly' | 'annual' | 'weekly';
  expiresDate?: string;
  willRenew?: boolean;
  productId?: string;
}

/**
 * Initialize RevenueCat with universal API key
 */
export const initializeRevenueCat = async (): Promise<boolean> => {
  try {
    console.log('🔑 Using API Key:', REVENUECAT_API_KEY);
    console.log('🔑 Key type:', REVENUECAT_API_KEY?.substring(0, 5));
    
    if (!REVENUECAT_API_KEY || REVENUECAT_API_KEY === 'your-api-key-here') {
      console.warn('⚠️ RevenueCat API key not configured');
      return false;
    }

    await Purchases.configure({
      apiKey: REVENUECAT_API_KEY,
      appUserID: undefined, // Let RevenueCat generate anonymous user ID
    });
    
    // Force sync with App Store
    console.log('🔄 Syncing with App Store...');
    await Purchases.syncPurchases();

    console.log('✅ RevenueCat initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ RevenueCat initialization error:', error);
    return false;
  }
};

/**
 * Get available subscription offerings from RevenueCat
 */
export const getSubscriptionOfferings = async (): Promise<PurchasesOffering | null> => {
  try {
    const offerings = await Purchases.getOfferings();
    
    if (offerings.current !== null) {
      console.log('📦 Available offerings:', offerings.current.availablePackages.length);
      return offerings.current;
    } else {
      console.warn('⚠️ No subscription offerings available');
      return null;
    }
  } catch (error) {
    console.error('❌ Error fetching offerings:', error);
    return null;
  }
};

/**
 * Purchase a subscription package
 */
export const purchasePackage = async (packageToPurchase: PurchasesPackage): Promise<SubscriptionStatus> => {
  try {
    console.log('💳 Starting purchase for package:', packageToPurchase.identifier);
    
    const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
    
    const isActive = customerInfo.entitlements.active['premium'] !== undefined;
    
    if (isActive) {
      const entitlement = customerInfo.entitlements.active['premium'];
      
      // Update local storage
      await AsyncStorage.setItem(SUBSCRIPTION_STATUS_KEY, 'active');
      
      const subscriptionType = getSubscriptionType(packageToPurchase.identifier);
      
      console.log('✅ Purchase successful!');
      
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
    console.error('❌ Purchase failed:', error);
    
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
    // Always verify with RevenueCat for the most current status
    const customerInfo = await Purchases.getCustomerInfo();
    
    const isActive = customerInfo.entitlements.active['premium'] !== undefined;
    
    if (isActive) {
      const entitlement = customerInfo.entitlements.active['premium'];
      
      // Update local storage
      await AsyncStorage.setItem(SUBSCRIPTION_STATUS_KEY, 'active');
      
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
    console.error('❌ Error checking subscription status:', error);
    
    // Fallback to local storage if RevenueCat fails
    const localStatus = await AsyncStorage.getItem(SUBSCRIPTION_STATUS_KEY);
    return {
      isActive: localStatus === 'active',
    };
  }
};

/**
 * Check if user has premium access
 */
export const hasPremiumAccess = async (): Promise<boolean> => {
  const status = await getSubscriptionStatus();
  return status.isActive;
};

/**
 * Restore purchases
 */
export const restorePurchases = async (): Promise<SubscriptionStatus> => {
  try {
    console.log('🔄 Restoring purchases...');
    const customerInfo = await Purchases.restorePurchases();
    
    if (customerInfo.entitlements.active['premium']) {
      await AsyncStorage.setItem(SUBSCRIPTION_STATUS_KEY, 'active');
      
      const entitlement = customerInfo.entitlements.active['premium'];
      console.log('✅ Purchases restored successfully');
      
      return {
        isActive: true,
        expiresDate: entitlement.expirationDate || undefined,
        willRenew: entitlement.willRenew,
        productId: entitlement.productIdentifier,
      };
    } else {
      await AsyncStorage.setItem(SUBSCRIPTION_STATUS_KEY, 'inactive');
      console.log('ℹ️ No active subscriptions found to restore');
      
      return {
        isActive: false,
      };
    }
  } catch (error) {
    console.error('❌ Error restoring purchases:', error);
    throw error;
  }
};

/**
 * Set subscription status manually (for testing or offline scenarios)
 */
export const setSubscriptionStatus = async (status: 'active' | 'inactive'): Promise<void> => {
  await AsyncStorage.setItem(SUBSCRIPTION_STATUS_KEY, status);
  console.log('🧪 Manual subscription status set to:', status);
};

/**
 * Clear subscription status
 */
export const clearSubscriptionStatus = async (): Promise<void> => {
  await AsyncStorage.removeItem(SUBSCRIPTION_STATUS_KEY);
};

/**
 * Get user subscription details
 */
export const getSubscriptionDetails = async (): Promise<CustomerInfo | null> => {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo;
  } catch (error) {
    console.error('❌ Error getting subscription details:', error);
    return null;
  }
};

/**
 * Helper function to determine subscription type from package identifier
 */
const getSubscriptionType = (packageId: string): 'monthly' | 'annual' | 'weekly' => {
  if (packageId.includes('annual') || packageId.includes('yearly')) {
    return 'annual';
  } else if (packageId.includes('weekly')) {
    return 'weekly';
  } else {
    return 'monthly';
  }
};

/**
 * Check if user is eligible for intro pricing
 */
export const checkIntroEligibility = async (): Promise<boolean> => {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    
    // User is eligible for intro pricing if they haven't had any previous subscriptions
    const hasHadSubscription = Object.keys(customerInfo.allPurchaseDates).length > 0;
    
    return !hasHadSubscription;
  } catch (error) {
    console.error('❌ Error checking intro eligibility:', error);
    return true; // Default to eligible if check fails
  }
};

export default {
  initializeRevenueCat,
  getSubscriptionOfferings,
  purchasePackage,
  getSubscriptionStatus,
  hasPremiumAccess,
  restorePurchases,
  setSubscriptionStatus,
  clearSubscriptionStatus,
  getSubscriptionDetails,
  checkIntroEligibility,
}; 