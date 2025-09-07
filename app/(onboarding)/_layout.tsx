import { Stack } from 'expo-router';

import { ThemeProvider } from '@/themes';

export default function OnboardingLayout() {
  return (
    <ThemeProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          gestureEnabled: false,
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
        <Stack.Screen 
          name="user-info" 
          options={{
            gestureEnabled: false,
          }}
        />
        <Stack.Screen 
          name="exam-selection" 
          options={{
            gestureEnabled: false,
          }}
        />
        <Stack.Screen 
          name="assessment" 
          options={{
            presentation: 'card',
            gestureEnabled: false,
          }}
        />
        <Stack.Screen 
          name="subject-selection" 
          options={{
            gestureEnabled: false,
          }}
        />
        <Stack.Screen 
          name="learning-style" 
          options={{
            gestureEnabled: false,
          }}
        />
        <Stack.Screen 
          name="schedule" 
          options={{
            gestureEnabled: false,
          }}
        />
        <Stack.Screen 
          name="goals" 
          options={{
            gestureEnabled: false,
          }}
        />
        <Stack.Screen 
          name="subscription" 
          options={{
            gestureEnabled: false,
          }}
        />
        <Stack.Screen 
          name="completion" 
          options={{
            gestureEnabled: false,
          }}
        />
      </Stack>
    </ThemeProvider>
  );
} 