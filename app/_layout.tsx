import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import '../global-polyfill';

import { AppAlertProvider } from '@/app/components/ui/AppAlert';
import { hydrateAppLanguage } from '@/app/i18n';
import { ThemeProvider } from "@/themes";

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      try {
        await hydrateAppLanguage();
      } catch (error) {
        console.error('❌ Failed to initialize RevenueCat:', error);
      } finally {
        setReady(true);
      }
    };

    initApp();
  }, []);

  if (!ready) return null;

  return (
    <ThemeProvider initialMode="auto">
      <AppAlertProvider>
        <Stack screenOptions={{ headerShown: false }} />
        <StatusBar style="auto" />
      </AppAlertProvider>
    </ThemeProvider>
  );
}
