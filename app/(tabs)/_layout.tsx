import { Tabs } from 'expo-router';
import { Platform, Text } from 'react-native';

import { useTheme } from '@/themes';

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary[500],
        tabBarInactiveTintColor: colors.neutral[400],
        tabBarStyle: {
          backgroundColor: colors.neutral[0],
          borderTopColor: colors.neutral[200],
          borderTopWidth: 1,
          paddingTop: Platform.OS === 'ios' ? 4 : 8,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          height: Platform.OS === 'ios' ? 84 : 68,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="dashboard" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="calendar" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="progress" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="profile" focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

interface TabIconProps {
  name: string;
  focused: boolean;
  color: string;
}

function TabIcon({ name, focused, color }: TabIconProps) {
  const getIcon = () => {
    switch (name) {
      case 'dashboard':
        return focused ? '🏠' : '🏠';
      case 'calendar':
        return focused ? '📅' : '📅';
      case 'progress':
        return focused ? '📊' : '📊';
      case 'profile':
        return focused ? '👤' : '👤';
      default:
        return '📱';
    }
  };

  return (
    <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.7 }}>
      {getIcon()}
    </Text>
  );
} 