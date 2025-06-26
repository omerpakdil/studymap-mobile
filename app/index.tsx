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
      // Small delay to ensure router is ready
      const timeout = setTimeout(() => {
        router.replace('/(onboarding)/splash');
      }, 100);

      return () => clearTimeout(timeout);
    }
  }, [isMounted]);

  // Show nothing while redirecting
  return <View style={{ flex: 1 }} />;
}
