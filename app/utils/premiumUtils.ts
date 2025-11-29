import Purchases from 'react-native-purchases';
import { supabase } from './supabase';
import { hasActiveReferralTrial, getReferralTrialDaysRemaining } from './referralManager';

export type PremiumSource =
  | 'subscription'
  | 'app_store_trial'
  | 'referral_extension'
  | 'none';

export interface PremiumStatus {
  hasAccess: boolean;
  source: PremiumSource;
  daysRemaining?: number;
  expirationDate?: string;
  isInTrial?: boolean;
}

/**
 * Get current user's RevenueCat ID
 */
const getCurrentUserId = async (): Promise<string> => {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.originalAppUserId;
  } catch (error) {
    console.error('❌ Error getting user ID:', error);
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return tempId;
  }
};

/**
 * HYBRID PREMIUM ACCESS CHECK
 * Checks: RevenueCat (App Store trial + subscription) + Supabase (referral extension)
 */
export const checkPremiumAccess = async (): Promise<PremiumStatus> => {
  try {
    // 1. Check RevenueCat (App Store trial or active subscription)
    const customerInfo = await Purchases.getCustomerInfo();
    const hasRevenueCatAccess = customerInfo.entitlements.active['premium'] !== undefined;

    if (hasRevenueCatAccess) {
      const entitlement = customerInfo.entitlements.active['premium'];
      const isInTrial = entitlement.periodType === 'trial';

      console.log('✅ Premium access via RevenueCat:', isInTrial ? 'Trial' : 'Subscription');

      // Calculate days remaining if in trial
      let daysRemaining: number | undefined;
      if (isInTrial && entitlement.expirationDate) {
        const now = new Date();
        const expiration = new Date(entitlement.expirationDate);
        const diffTime = expiration.getTime() - now.getTime();
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      return {
        hasAccess: true,
        source: isInTrial ? 'app_store_trial' : 'subscription',
        daysRemaining,
        expirationDate: entitlement.expirationDate || undefined,
        isInTrial,
      };
    }

    // 2. Check Supabase referral extension (only if no RevenueCat access)
    const hasReferralExtension = await hasActiveReferralTrial();

    if (hasReferralExtension) {
      const daysRemaining = await getReferralTrialDaysRemaining();

      console.log('✅ Premium access via referral extension');

      return {
        hasAccess: true,
        source: 'referral_extension',
        daysRemaining,
        isInTrial: true,
      };
    }

    // 3. No premium access
    console.log('❌ No premium access');
    return {
      hasAccess: false,
      source: 'none',
    };
  } catch (error) {
    console.error('❌ Error checking premium access:', error);
    return {
      hasAccess: false,
      source: 'none',
    };
  }
};

/**
 * Get trial status for UI display
 */
export const getTrialStatus = async (): Promise<{
  inTrial: boolean;
  trialType: 'app_store' | 'referral_extension' | null;
  daysRemaining: number;
  expirationDate?: string;
  showWarning: boolean; // Show warning if 3 days or less remaining
}> => {
  try {
    const premiumStatus = await checkPremiumAccess();

    if (!premiumStatus.hasAccess || !premiumStatus.isInTrial) {
      return {
        inTrial: false,
        trialType: null,
        daysRemaining: 0,
        showWarning: false,
      };
    }

    const daysRemaining = premiumStatus.daysRemaining || 0;
    const showWarning = daysRemaining <= 3 && daysRemaining > 0;

    return {
      inTrial: true,
      trialType: premiumStatus.source === 'app_store_trial' ? 'app_store' : 'referral_extension',
      daysRemaining,
      expirationDate: premiumStatus.expirationDate,
      showWarning,
    };
  } catch (error) {
    console.error('❌ Error getting trial status:', error);
    return {
      inTrial: false,
      trialType: null,
      daysRemaining: 0,
      showWarning: false,
    };
  }
};

/**
 * Check if user should see subscription paywall
 */
export const shouldShowPaywall = async (): Promise<boolean> => {
  const status = await checkPremiumAccess();
  return !status.hasAccess;
};

/**
 * Get premium access message for UI
 */
export const getPremiumAccessMessage = async (): Promise<string> => {
  const status = await checkPremiumAccess();

  if (!status.hasAccess) {
    return 'No premium access';
  }

  switch (status.source) {
    case 'subscription':
      return 'Active subscription';
    case 'app_store_trial':
      return `Trial: ${status.daysRemaining || 0} days remaining`;
    case 'referral_extension':
      return `Referral trial: ${status.daysRemaining || 0} days remaining`;
    default:
      return 'Premium access';
  }
};

export default {
  checkPremiumAccess,
  getTrialStatus,
  shouldShowPaywall,
  getPremiumAccessMessage,
};
