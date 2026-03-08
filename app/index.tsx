import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearOnboardingData, isOnboardingComplete } from '@/app/utils/onboardingData';
import { clearStudyProgramData, isProgramGenerated } from '@/app/utils/studyProgramStorage';
import { hasCachedPremiumAccess, hasEverPremiumAccess } from '@/app/utils/subscriptionManager';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

const ONBOARDING_V2_DRAFT_KEY = 'onboarding_v2_draft';
const USER_INFO_KEY = 'user_info';

export default function HomeScreen() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Mark component as mounted
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      // Check onboarding and program generation status
      checkUserStatus();
    }
  }, [isMounted]);

  const checkUserStatus = async () => {
    try {
      // Small delay to ensure storage is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const onboardingCompleted = await isOnboardingComplete();
      const programExists = await isProgramGenerated();
      const hasSubscription = await hasCachedPremiumAccess();
      const hadPremiumBefore = await hasEverPremiumAccess();
      
      if (__DEV__) {
        console.log('User status check:', { onboardingCompleted, programExists, hasSubscription, hadPremiumBefore });
      }

      if (hasSubscription) {
        router.replace('/(tabs)/dashboard');
        return;
      }

      if (hadPremiumBefore) {
        router.replace('/(onboarding-v2)/subscription');
        return;
      }

      if (onboardingCompleted || programExists) {
        await clearOnboardingData();
        await clearStudyProgramData();
        await AsyncStorage.multiRemove([ONBOARDING_V2_DRAFT_KEY, USER_INFO_KEY]);
      }

      router.replace('/(onboarding-v2)/animated-splash');
    } catch (error) {
    console.error('Error checking user status:', error);
    // Fallback to onboarding
    router.replace('/(onboarding-v2)/animated-splash');
    }
  };

  // Show nothing while redirecting
  return <View style={{ flex: 1 }} />;
}
