import { isOnboardingComplete } from '@/app/utils/onboardingData';
import { isProgramGenerated } from '@/app/utils/studyProgramStorage';
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
      
      console.log('User status check:', { onboardingCompleted, programExists });
      
      if (onboardingCompleted && programExists) {
        // User has completed onboarding and AI program is generated
        router.replace('/(tabs)/dashboard');
      } else {
        // User needs to complete onboarding
        router.replace('/(onboarding)/splash');
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
