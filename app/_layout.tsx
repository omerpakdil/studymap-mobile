import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import '../global-polyfill';

import { ThemeProvider } from "@/themes";
import { initializeRevenueCat } from "./utils/subscriptionManager";

export default function RootLayout() {
  useEffect(() => {
    // Initialize RevenueCat on app startup
    const initSubscriptions = async () => {
      try {
        console.log('🚀 Initializing RevenueCat...');
        await initializeRevenueCat();
      } catch (error) {
        console.error('❌ Failed to initialize RevenueCat:', error);
      }
    };

    initSubscriptions();
  }, []);

  return (
    <ThemeProvider initialMode="auto">
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
