import { isOnboardingComplete } from '@/app/utils/onboardingData';
import { isProgramGenerated } from '@/app/utils/studyProgramStorage';
import { hasPremiumAccess } from '@/app/utils/subscriptionManager';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

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
      const hasSubscription = await hasPremiumAccess();
      
      console.log('User status check:', { onboardingCompleted, programExists, hasSubscription });
      
      if (!onboardingCompleted) {
        // User needs to complete onboarding
        router.replace('/(onboarding)/splash');
      } else if (!programExists) {
        // User completed onboarding but no program generated yet (shouldn't happen normally)
        router.replace('/(onboarding)/splash');
      } else if (!hasSubscription) {
        // User completed onboarding and has program but no subscription
        router.replace('/(onboarding)/subscription');
      } else {
        // User has completed everything and has subscription
        router.replace('/(tabs)/dashboard');
      }
    } catch (error) {
      console.error('Error checking user status:', error);
      // Fallback to onboarding
      router.replace('/(onboarding)/splash');
    }
  };

  // Show nothing while redirecting
  return <View style={{ flex: 1 }} />;
}
