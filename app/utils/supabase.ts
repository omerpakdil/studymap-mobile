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
  referral_extension_end_date?: string;
  referral_used_code?: string;
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
  updated_at: string;
}

export interface DatabaseReferralStats {
  referral_code: string;
  user_id: string;
  total_referrals: number;
  successful_referrals: number;
  total_days_earned: number;
}

export interface DatabasePushToken {
  id: string;
  user_id: string;
  expo_push_token: string;
  platform: 'ios' | 'android' | 'web';
  locale?: string;
  timezone?: string;
  is_active: boolean;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseNotificationPreferences {
  id: string;
  user_id: string;
  study_reminders: boolean;
  plan_summaries: boolean;
  progress_nudges: boolean;
  premium_updates: boolean;
  referral_updates: boolean;
  break_reminders: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  preferred_study_time: string;
  upcoming_lead_minutes: number;
  recovery_delay_minutes: number;
  daily_wrap_time: string;
  weekly_plan_day: number;
  weekly_plan_time: string;
  locale?: string;
  timezone?: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseNotificationEvent {
  id: string;
  user_id: string;
  notification_type: string;
  notification_channel: 'local' | 'remote';
  notification_status: 'planned' | 'sent' | 'delivered' | 'opened' | 'failed' | 'cancelled';
  title?: string;
  body?: string;
  payload: Record<string, unknown>;
  scheduled_for?: string;
  delivered_at?: string;
  opened_at?: string;
  created_at: string;
}

export interface DatabaseNotificationState {
  id: string;
  user_id: string;
  locale?: string;
  timezone?: string;
  study_streak: number;
  completed_tasks: number;
  plan_updated_at?: string;
  last_opened_at?: string;
  last_study_session_at?: string;
  next_exam_date?: string;
  created_at: string;
  updated_at: string;
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
