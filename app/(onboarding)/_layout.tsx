import { Stack } from 'expo-router';

import { ThemeProvider } from '@/themes';

export default function OnboardingLayout() {
  return (
    <ThemeProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        }}
      >
        <Stack.Screen 
          name="splash" 
          options={{
            gestureEnabled: false,
          }}
        />
        <Stack.Screen 
          name="welcome" 
          options={{
            gestureEnabled: false,
          }}
        />
        <Stack.Screen name="user-info" />
        <Stack.Screen 
          name="assessment" 
          options={{
            presentation: 'modal',
          }}
        />
        <Stack.Screen name="subject-selection" />
        <Stack.Screen name="learning-style" />
      </Stack>
    </ThemeProvider>
  );
} 