import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { Dimensions, Platform, StyleSheet, View } from 'react-native';

import { useTheme } from '@/themes';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary[500],
        tabBarInactiveTintColor: colors.neutral[400],
        tabBarAllowFontScaling: false,
        ...(Platform.OS === 'android' && {
          tabBarHideOnKeyboard: true,
          tabBarKeyboardHidesTabBar: true,
        }),
        tabBarStyle: {
          backgroundColor: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.9)' : colors.neutral[0],
          borderTopWidth: 0,
          paddingBottom: Platform.OS === 'ios' ? (isTablet ? 40 : 28) : 16,
          paddingHorizontal: isTablet ? 80 : 20,
          height: Platform.OS === 'ios' ? (isTablet ? 100 : 88) : (isTablet ? 88 : 76),
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -8 },
          shadowOpacity: 0.12,
          shadowRadius: 24,
          elevation: 20,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        },
        tabBarItemStyle: {
          paddingVertical: isTablet ? 10 : 6,
          backgroundColor: 'transparent',
          borderRadius: 0,
          margin: 0,
          marginHorizontal: 0,
          overflow: 'hidden',
          ...Platform.select({
            android: {
              rippleColor: 'transparent',
              borderless: false,
            },
            ios: {
              activeOpacity: 1,
            },
          }),
        },
        tabBarLabelStyle: {
          fontSize: isTablet ? 13 : 10,
          fontWeight: '600',
          marginTop: isTablet ? 8 : 6,
          letterSpacing: 0.3,
        },
        tabBarIconStyle: {
          marginBottom: 0,
        },
        tabBarBackground: () => (
          Platform.OS === 'ios' ? (
            <BlurView 
              intensity={80} 
              tint="light" 
              style={StyleSheet.absoluteFill}
            />
          ) : null
        ),
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused, color }) => (
            <ModernTabIcon 
              name="dashboard" 
              focused={focused} 
              color={color}
              activeColor={colors.primary[500]}
              inactiveColor={colors.neutral[400]}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ focused, color }) => (
            <ModernTabIcon 
              name="calendar" 
              focused={focused} 
              color={color}
              activeColor={colors.primary[500]}
              inactiveColor={colors.neutral[400]}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ focused, color }) => (
            <ModernTabIcon 
              name="progress" 
              focused={focused} 
              color={color}
              activeColor={colors.primary[500]}
              inactiveColor={colors.neutral[400]}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color }) => (
            <ModernTabIcon 
              name="profile" 
              focused={focused} 
              color={color}
              activeColor={colors.primary[500]}
              inactiveColor={colors.neutral[400]}
            />
          ),
        }}
      />
    </Tabs>
  );
}

interface ModernTabIconProps {
  name: string;
  focused: boolean;
  color: string;
  activeColor: string;
  inactiveColor: string;
}

function ModernTabIcon({ name, focused, color, activeColor, inactiveColor }: ModernTabIconProps) {
  const getIconName = (): keyof typeof Ionicons.glyphMap => {
    switch (name) {
      case 'dashboard':
        return focused ? 'home' : 'home-outline';
      case 'calendar':
        return focused ? 'calendar' : 'calendar-outline';
      case 'progress':
        return focused ? 'stats-chart' : 'stats-chart-outline';
      case 'profile':
        return focused ? 'person' : 'person-outline';
      default:
        return 'apps-outline';
    }
  };

  return (
    <View style={styles.iconContainer}>
      <Ionicons
        name={getIconName()}
        size={isTablet ? 28 : 24}
        color={focused ? activeColor : inactiveColor}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
  },
  tabButton: {
    backgroundColor: 'transparent !important' as any,
    borderRadius: 0,
  },
}); 