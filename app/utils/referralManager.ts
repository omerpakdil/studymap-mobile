import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases from 'react-native-purchases';
import { devLog, reportError } from './logger';
import { isRevenueCatUninitializedError } from './revenueCatSafe';

import { supabase, DatabaseReferralStats } from './supabase';

// Storage keys
const REFERRAL_CODE_KEY = 'user_referral_code';
const REFERRAL_TRIAL_KEY = 'referral_trial_status';
const USED_REFERRAL_CODE_KEY = 'used_referral_code';
const TEMP_APP_USER_ID_KEY = 'temp_app_user_id';
const REFERRAL_CODE_LENGTH = 6;

// Types
export interface ReferralTrial {
  code: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  referrerId: string;
}

export interface ReferralStats {
  totalReferrals: number;
  successfulReferrals: number;
  totalDaysEarned: number;
  pendingDays: number;
}

const createRandomReferralCode = (): string => {
  // Excluded confusing chars: I, O, 0, 1
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < REFERRAL_CODE_LENGTH; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const normalizeReferralCode = (code: string): string => code.trim().toUpperCase();

/**
 * Get current user's RevenueCat ID
 */
const getCurrentUserId = async (): Promise<string> => {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.originalAppUserId;
  } catch (error) {
    if (!isRevenueCatUninitializedError(error)) {
      reportError('❌ Error getting user ID:', error);
    }

    const existingTempId = await AsyncStorage.getItem(TEMP_APP_USER_ID_KEY);
    if (existingTempId) {
      return existingTempId;
    }
    // Fallback: generate a stable temporary ID
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    await AsyncStorage.setItem(TEMP_APP_USER_ID_KEY, tempId);
    return tempId;
  }
};

/**
 * Generate a unique referral code
 */
export const generateReferralCode = async (): Promise<string> => {
  try {
    // Check if user already has a code
    const existingCode = await AsyncStorage.getItem(REFERRAL_CODE_KEY);
    if (existingCode) {
      return existingCode;
    }

    const code = createRandomReferralCode();

    await AsyncStorage.setItem(REFERRAL_CODE_KEY, code);

    devLog('✅ Referral code generated:', code);
    return code;
  } catch (error) {
    reportError('❌ Error generating referral code:', error);
    throw error;
  }
};

/**
 * Get user's referral code
 */
export const getReferralCode = async (): Promise<string | null> => {
  try {
    const code = await AsyncStorage.getItem(REFERRAL_CODE_KEY);
    return code;
  } catch (error) {
    reportError('❌ Error getting referral code:', error);
    return null;
  }
};

/**
 * Register user in Supabase with referral code
 */
export const registerUserWithReferralCode = async (): Promise<string> => {
  try {
    const userId = await getCurrentUserId();

    // Check if user already exists in Supabase
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('referral_code')
      .eq('user_id', userId)
      .single();

    if (existingUser && !fetchError) {
      // User exists, save code locally
      await AsyncStorage.setItem(REFERRAL_CODE_KEY, existingUser.referral_code);
      devLog('✅ User already registered with code:', existingUser.referral_code);
      return existingUser.referral_code;
    }

    let code = (await AsyncStorage.getItem(REFERRAL_CODE_KEY)) || createRandomReferralCode();
    for (let attempt = 0; attempt < 5; attempt++) {
      const { error } = await supabase
        .from('users')
        .upsert(
          {
            user_id: userId,
            referral_code: code,
          },
          { onConflict: 'user_id' }
        );

      if (!error) {
        await AsyncStorage.setItem(REFERRAL_CODE_KEY, code);
        devLog('✅ User registered in Supabase with code:', code);
        return code;
      }

      reportError(`❌ Supabase upsert error (attempt ${attempt + 1}):`, error);
      code = createRandomReferralCode();
    }

    // Fallback to local code if Supabase fails repeatedly
    await AsyncStorage.setItem(REFERRAL_CODE_KEY, code);
    return code;
  } catch (error) {
    reportError('❌ Error registering user:', error);
    // Fallback to local code generation
    return await generateReferralCode();
  }
};

/**
 * Validate referral code (checks Supabase)
 */
export const validateReferralCode = async (code: string): Promise<boolean> => {
  try {
    const normalizedCode = normalizeReferralCode(code);
    if (!normalizedCode || normalizedCode.length !== REFERRAL_CODE_LENGTH) {
      return false;
    }

    // Check if code exists in Supabase
    const { data, error } = await supabase
      .from('users')
      .select('referral_code, user_id')
      .eq('referral_code', normalizedCode)
      .single();

    if (error || !data) {
      devLog('❌ Code not found in Supabase:', code);
      return false;
    }

    // Check if it's not the user's own code
    const currentUserId = await getCurrentUserId();
    if (data.user_id === currentUserId) {
      devLog('❌ Cannot use own referral code');
      return false;
    }

    // Check if user already used a referral code
    const usedCode = await AsyncStorage.getItem(USED_REFERRAL_CODE_KEY);
    if (usedCode) {
      devLog('❌ User already used a referral code');
      return false;
    }

    devLog('✅ Referral code is valid:', code);
    return true;
  } catch (error) {
    reportError('❌ Error validating referral code:', error);
    return false;
  }
};

/**
 * Apply referral code and create referral record
 */
export const applyReferralCode = async (code: string): Promise<boolean> => {
  try {
    const normalizedCode = normalizeReferralCode(code);
    if (!normalizedCode || normalizedCode.length !== REFERRAL_CODE_LENGTH) {
      throw new Error('Invalid referral code format');
    }

    const existingUsedCode = await AsyncStorage.getItem(USED_REFERRAL_CODE_KEY);
    if (existingUsedCode) {
      if (existingUsedCode === normalizedCode) {
        devLog('ℹ️ Referral code already applied for this user');
        return true;
      }
      throw new Error('A referral code was already used');
    }

    const currentUserId = await getCurrentUserId();
    const ownCode = await registerUserWithReferralCode();

    const isValid = await validateReferralCode(normalizedCode);
    if (!isValid) {
      throw new Error('Invalid referral code');
    }

    // Get referrer info
    const { data: referrerData, error: referrerError } = await supabase
      .from('users')
      .select('user_id, referral_code')
      .eq('referral_code', normalizedCode)
      .single();

    if (referrerError || !referrerData) {
      throw new Error('Referrer not found');
    }

    const now = new Date();
    const extensionEndDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Upsert user row + update referral extension in one operation
    const { error: updateError } = await supabase
      .from('users')
      .upsert(
        {
          user_id: currentUserId,
          referral_code: ownCode,
          referral_extension_end_date: extensionEndDate.toISOString(),
          referral_used_code: normalizedCode,
        },
        { onConflict: 'user_id' }
      );

    if (updateError) {
      reportError('❌ Failed to update referral extension:', updateError);
    } else {
      devLog('✅ Referral extension saved to Supabase');
    }

    // Create referral record in Supabase
    const { error: referralError } = await supabase
      .from('referrals')
      .upsert(
        {
          referrer_code: normalizedCode,
          referrer_user_id: referrerData.user_id,
          referee_user_id: currentUserId,
          status: 'trial_started',
          trial_start_date: now.toISOString(),
          trial_end_date: extensionEndDate.toISOString(),
        },
        { onConflict: 'referee_user_id' }
      );

    if (referralError) {
      reportError('❌ Failed to create referral in Supabase:', referralError);
      // Continue with local trial even if Supabase fails
    } else {
      devLog('✅ Referral record created in Supabase');
    }

    // Update local trial status
    const trial: ReferralTrial = {
      code: normalizedCode,
      startDate: now.toISOString(),
      endDate: extensionEndDate.toISOString(),
      isActive: true,
      referrerId: referrerData.user_id,
    };

    await AsyncStorage.setItem(REFERRAL_TRIAL_KEY, JSON.stringify(trial));
    await AsyncStorage.setItem(USED_REFERRAL_CODE_KEY, normalizedCode);

    devLog('✅ Referral code applied successfully');
    devLog('🎁 7-day extension activated until:', extensionEndDate.toISOString());

    return true;
  } catch (error) {
    reportError('❌ Error applying referral code:', error);
    throw error;
  }
};

/**
 * Check if user has an active referral trial (checks Supabase extension)
 */
export const hasActiveReferralTrial = async (): Promise<boolean> => {
  try {
    const currentUserId = await getCurrentUserId();

    // First check Supabase for referral extension
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('referral_extension_end_date')
      .eq('user_id', currentUserId)
      .single();

    if (!userError && userData?.referral_extension_end_date) {
      const now = new Date();
      const extensionEnd = new Date(userData.referral_extension_end_date);

      if (extensionEnd > now) {
        devLog('✅ Active referral extension in Supabase');
        return true;
      }
    }

    // Fallback: Check local storage (legacy support)
    const trialStr = await AsyncStorage.getItem(REFERRAL_TRIAL_KEY);
    if (!trialStr) {
      return false;
    }

    const trial: ReferralTrial = JSON.parse(trialStr);

    // Check if trial has expired
    const now = new Date();
    const endDate = new Date(trial.endDate);

    if (now > endDate) {
      trial.isActive = false;
      await AsyncStorage.setItem(REFERRAL_TRIAL_KEY, JSON.stringify(trial));
      return false;
    }

    return trial.isActive;
  } catch (error) {
    reportError('❌ Error checking referral trial:', error);
    return false;
  }
};

export const hasCachedReferralTrial = async (): Promise<boolean> => {
  try {
    const trialStr = await AsyncStorage.getItem(REFERRAL_TRIAL_KEY);
    if (!trialStr) {
      return false;
    }

    const trial: ReferralTrial = JSON.parse(trialStr);
    const now = new Date();
    const endDate = new Date(trial.endDate);

    if (now > endDate) {
      trial.isActive = false;
      await AsyncStorage.setItem(REFERRAL_TRIAL_KEY, JSON.stringify(trial));
      return false;
    }

    return trial.isActive;
  } catch (error) {
    reportError('❌ Error checking cached referral trial:', error);
    return false;
  }
};

/**
 * Get referral trial details
 */
export const getReferralTrial = async (): Promise<ReferralTrial | null> => {
  try {
    const trialStr = await AsyncStorage.getItem(REFERRAL_TRIAL_KEY);
    if (!trialStr) {
      return null;
    }

    const trial: ReferralTrial = JSON.parse(trialStr);

    // Check if still active
    const now = new Date();
    const endDate = new Date(trial.endDate);

    if (now > endDate) {
      trial.isActive = false;
      await AsyncStorage.setItem(REFERRAL_TRIAL_KEY, JSON.stringify(trial));
    }

    return trial;
  } catch (error) {
    reportError('❌ Error getting referral trial:', error);
    return null;
  }
};

/**
 * Get days remaining in referral trial
 */
export const getReferralTrialDaysRemaining = async (): Promise<number> => {
  try {
    const trial = await getReferralTrial();
    if (!trial || !trial.isActive) {
      return 0;
    }

    const now = new Date();
    const endDate = new Date(trial.endDate);
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  } catch (error) {
    reportError('❌ Error getting trial days remaining:', error);
    return 0;
  }
};

/**
 * Get referral stats from Supabase
 */
export const getReferralStats = async (): Promise<ReferralStats> => {
  try {
    const userId = await getCurrentUserId();

    // Get stats from Supabase view
    const { data, error } = await supabase
      .from('referral_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      devLog('ℹ️ No referral stats found, returning defaults');
      return {
        totalReferrals: 0,
        successfulReferrals: 0,
        totalDaysEarned: 0,
        pendingDays: 0,
      };
    }

    const stats = data as DatabaseReferralStats;

    return {
      totalReferrals: stats.total_referrals || 0,
      successfulReferrals: stats.successful_referrals || 0,
      totalDaysEarned: stats.total_days_earned || 0,
      pendingDays: 0, // This is calculated separately in local storage
    };
  } catch (error) {
    reportError('❌ Error getting referral stats:', error);
    return {
      totalReferrals: 0,
      successfulReferrals: 0,
      totalDaysEarned: 0,
      pendingDays: 0,
    };
  }
};

/**
 * Update referral status when user subscribes
 */
export const updateReferralOnSubscription = async (): Promise<void> => {
  try {
    const currentUserId = await getCurrentUserId();

    // Find referral record for this user
    const { data: referralData, error: fetchError } = await supabase
      .from('referrals')
      .select('*')
      .eq('referee_user_id', currentUserId)
      .eq('status', 'trial_started')
      .single();

    if (fetchError || !referralData) {
      devLog('ℹ️ No active referral found for this user');
      return;
    }

    // Update status to subscribed
    const { error: updateError } = await supabase
      .from('referrals')
      .update({
        status: 'subscribed',
        subscribed_at: new Date().toISOString(),
      })
      .eq('id', referralData.id);

    if (updateError) {
      reportError('❌ Failed to update referral status:', updateError);
    } else {
      devLog('✅ Referral status updated to subscribed');
      devLog(`🎉 Referrer ${referralData.referrer_code} earned 7 days!`);
    }
  } catch (error) {
    reportError('❌ Error updating referral on subscription:', error);
  }
};

/**
 * Initialize referral stats (legacy support)
 */
export const initializeReferralStats = async (): Promise<void> => {
  // This function is kept for backward compatibility
  // Stats are now managed in Supabase
  devLog('ℹ️ Referral stats are now managed in Supabase');
};

/**
 * Clear all referral data (for testing)
 */
export const clearReferralData = async (): Promise<void> => {
  if (!__DEV__) {
    return;
  }
  try {
    await AsyncStorage.multiRemove([
      REFERRAL_CODE_KEY,
      REFERRAL_TRIAL_KEY,
      USED_REFERRAL_CODE_KEY,
    ]);
    devLog('✅ Referral data cleared');
  } catch (error) {
    reportError('❌ Error clearing referral data:', error);
  }
};

export default {
  generateReferralCode,
  getReferralCode,
  registerUserWithReferralCode,
  validateReferralCode,
  applyReferralCode,
  hasActiveReferralTrial,
  hasCachedReferralTrial,
  getReferralTrial,
  getReferralTrialDaysRemaining,
  initializeReferralStats,
  getReferralStats,
  updateReferralOnSubscription,
  clearReferralData,
};
