import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases, { CustomerInfo } from 'react-native-purchases';

const SUBSCRIPTION_STATUS_KEY = 'subscription_status';
const REVENUECAT_API_KEY = 'your_revenuecat_api_key'; // Bu değeri gerçek API key ile değiştirin

export interface SubscriptionStatus {
  isActive: boolean;
  type?: 'monthly' | 'annual' | 'weekly';
  expiresDate?: string;
  willRenew?: boolean;
}

/**
 * Initialize RevenueCat if not already initialized
 */
export const initializeRevenueCat = async (): Promise<boolean> => {
  try {
    await Purchases.configure({
      apiKey: REVENUECAT_API_KEY,
    });
    return true;
  } catch (error) {
    console.error('RevenueCat initialization error:', error);
    return false;
  }
};

/**
 * Check current subscription status
 */
export const getSubscriptionStatus = async (): Promise<SubscriptionStatus> => {
  try {
    // First check local storage
    const localStatus = await AsyncStorage.getItem(SUBSCRIPTION_STATUS_KEY);
    
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
      };
    } else {
      // Update local storage
      await AsyncStorage.setItem(SUBSCRIPTION_STATUS_KEY, 'inactive');
      
      return {
        isActive: false,
      };
    }
  } catch (error) {
    console.error('Error checking subscription status:', error);
    
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
    const customerInfo = await Purchases.restorePurchases();
    
    if (customerInfo.entitlements.active['premium']) {
      await AsyncStorage.setItem(SUBSCRIPTION_STATUS_KEY, 'active');
      
      const entitlement = customerInfo.entitlements.active['premium'];
      return {
        isActive: true,
        expiresDate: entitlement.expirationDate || undefined,
        willRenew: entitlement.willRenew,
      };
    } else {
      await AsyncStorage.setItem(SUBSCRIPTION_STATUS_KEY, 'inactive');
      return {
        isActive: false,
      };
    }
  } catch (error) {
    console.error('Error restoring purchases:', error);
    throw error;
  }
};

/**
 * Set subscription status manually (for testing or offline scenarios)
 */
export const setSubscriptionStatus = async (status: 'active' | 'inactive'): Promise<void> => {
  await AsyncStorage.setItem(SUBSCRIPTION_STATUS_KEY, status);
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
    console.error('Error getting subscription details:', error);
    return null;
  }
};

export default {
  initializeRevenueCat,
  getSubscriptionStatus,
  hasPremiumAccess,
  restorePurchases,
  setSubscriptionStatus,
  clearSubscriptionStatus,
  getSubscriptionDetails,
}; 