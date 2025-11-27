import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('⚠️ Supabase credentials not configured');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

// Database Types
export interface DatabaseUser {
  id: string;
  user_id: string;
  referral_code: string;
  referred_by?: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseReferral {
  id: string;
  referrer_code: string;
  referrer_user_id: string;
  referee_user_id: string;
  status: 'trial_started' | 'subscribed' | 'expired';
  trial_start_date?: string;
  trial_end_date?: string;
  subscribed_at?: string;
  created_at: string;
}

export interface DatabaseReferralStats {
  referral_code: string;
  user_id: string;
  total_referrals: number;
  successful_referrals: number;
  total_days_earned: number;
}

// Database helper functions
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    if (error) {
      console.error('❌ Supabase connection error:', error);
      return false;
    }
    console.log('✅ Supabase connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    return false;
  }
};

export default supabase;
