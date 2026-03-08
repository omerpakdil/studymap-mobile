import { Dimensions, Platform } from 'react-native';
import { trackEvent } from '@/app/utils/analytics';

export type OnboardingV2StepId =
  | 'intro'
  | 'splash'
  | 'value_proof'
  | 'country_select'
  | 'goal_setup'
  | 'goal_exam'
  | 'goal_track'
  | 'goal_date'
  | 'goal_score'
  | 'goal_target'
  | 'goal_intensity'
  | 'schedule'
  | 'focus'
  | 'learning_style'
  | 'plan_preview'
  | 'referral'
  | 'paywall'
  | 'account'
  | 'success';

type OnboardingV2EventName =
  | 'onboarding_step_view'
  | 'onboarding_step_continue'
  | 'onboarding_step_back'
  | 'onboarding_step_validation_fail'
  | 'paywall_view'
  | 'purchase_start'
  | 'purchase_success'
  | 'purchase_fail'
  | 'onboarding_draft_save_fail'
  | 'onboarding_draft_load_fail'
  | 'plan_preview_generated'
  | 'plan_preview_generation_fail'
  | 'onboarding_complete';

interface OnboardingV2EventPayload {
  step_id?: OnboardingV2StepId;
  reason?: string;
  fields?: string[];
  variant_id?: string;
  [key: string]: unknown;
}

const sessionId = `ov2_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const getDeviceClass = () => {
  const { width, height } = Dimensions.get('window');
  const shortest = Math.min(width, height);

  if (shortest <= 320) return 'iphone_compact';
  if (shortest <= 375) return 'iphone_small';
  if (shortest <= 390) return 'iphone_standard';
  return 'iphone_large';
};

export async function trackOnboardingV2Event(
  event: OnboardingV2EventName,
  payload: OnboardingV2EventPayload = {}
): Promise<void> {
  try {
    const eventPayload = {
      ...payload,
      session_id: sessionId,
      device_class: getDeviceClass(),
      platform: Platform.OS,
      timestamp: new Date().toISOString(),
    };

    await trackEvent(event, eventPayload);
  } catch (error) {
    console.error('❌ Failed to track onboarding v2 event:', error);
  }
}

export const trackOnboardingStepView = (stepId: OnboardingV2StepId) =>
  trackOnboardingV2Event('onboarding_step_view', { step_id: stepId });

export const trackOnboardingStepContinue = (
  stepId: OnboardingV2StepId,
  payload: OnboardingV2EventPayload = {}
) => trackOnboardingV2Event('onboarding_step_continue', { step_id: stepId, ...payload });

export const trackOnboardingStepBack = (stepId: OnboardingV2StepId) =>
  trackOnboardingV2Event('onboarding_step_back', { step_id: stepId });

export const trackOnboardingStepValidationFail = (
  stepId: OnboardingV2StepId,
  fields: string[],
  reason: string
) => trackOnboardingV2Event('onboarding_step_validation_fail', { step_id: stepId, fields, reason });
