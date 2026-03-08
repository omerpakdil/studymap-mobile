import { Stack } from 'expo-router';

import { OnboardingV2Provider } from './state';

export default function OnboardingV2Layout() {
  return (
    <OnboardingV2Provider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          gestureEnabled: false,
        }}
      >
        <Stack.Screen name="animated-splash" />
        <Stack.Screen name="intro" />
        <Stack.Screen name="splash" />
        <Stack.Screen name="value-proof" />
        <Stack.Screen name="country-select" />
        <Stack.Screen name="goal-exam" />
        <Stack.Screen name="goal-track" />
        <Stack.Screen name="goal-date" />
        <Stack.Screen name="goal-score" />
        <Stack.Screen name="goal-target" />
        <Stack.Screen name="goal-intensity" />
        <Stack.Screen name="goal-setup" />
        <Stack.Screen name="schedule" />
        <Stack.Screen name="focus" />
        <Stack.Screen name="learning-style" />
        <Stack.Screen name="plan-preview" />
        <Stack.Screen name="referral" />
        <Stack.Screen name="paywall" />
        <Stack.Screen name="subscription" />
        <Stack.Screen name="account" />
      </Stack>
    </OnboardingV2Provider>
  );
}
