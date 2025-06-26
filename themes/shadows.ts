// Shadow System
// Elevation and depth definitions for StudyMap

import { Platform } from 'react-native';
import { ShadowLevels } from './types';

// iOS shadow styles
const iosShadows: ShadowLevels = {
  xs: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
  },
  
  xl: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 25,
  },
  
  // Dark mode shadows (lighter, more subtle)
  dark: {
    sm: {
      shadowColor: '#FFFFFF',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
    },
    
    md: {
      shadowColor: '#FFFFFF',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
    },
    
    lg: {
      shadowColor: '#FFFFFF',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.2,
      shadowRadius: 15,
    },
  },
};

// Android shadow styles (using elevation)
const androidShadows: ShadowLevels = {
  xs: {
    elevation: 1,
  },
  
  sm: {
    elevation: 2,
  },
  
  md: {
    elevation: 4,
  },
  
  lg: {
    elevation: 8,
  },
  
  xl: {
    elevation: 16,
  },
  
  // Dark mode shadows (same elevation values)
  dark: {
    sm: {
      elevation: 2,
    },
    
    md: {
      elevation: 4,
    },
    
    lg: {
      elevation: 8,
    },
  },
};

// Platform-specific shadow selection
const shadows: ShadowLevels = Platform.select({
  ios: iosShadows,
  android: androidShadows,
  default: iosShadows,
});

// Component-specific shadow presets
export const componentShadows = {
  // Cards
  card: {
    default: shadows.sm,
    hover: shadows.md,
    pressed: shadows.xs,
  },
  
  // Buttons
  button: {
    primary: shadows.sm,
    secondary: shadows.xs,
    floating: shadows.lg,
  },
  
  // Modals
  modal: {
    backdrop: shadows.xl,
    content: shadows.lg,
    bottomSheet: shadows.md,
  },
  
  // Navigation
  navigation: {
    header: shadows.sm,
    tabBar: shadows.md,
    fab: shadows.lg,
  },
  
  // Study components
  study: {
    progressCard: shadows.sm,
    timerCard: shadows.md,
    achievementBadge: shadows.sm,
    calendarCell: shadows.xs,
  },
};

// Shadow utilities
export const createShadowStyle = (
  level: keyof ShadowLevels,
  isDark: boolean = false
) => {
  if (isDark && level in shadows.dark) {
    return shadows.dark[level as keyof typeof shadows.dark];
  }
  return shadows[level];
};

// Custom shadow generator
export const createCustomShadow = (
  offsetX: number = 0,
  offsetY: number,
  blur: number,
  opacity: number = 0.1,
  color: string = '#000000'
) => {
  if (Platform.OS === 'android') {
    // Android doesn't support custom shadows, use closest elevation
    const elevation = Math.min(Math.max(Math.round(offsetY / 2), 1), 16);
    return { elevation };
  }
  
  return {
    shadowColor: color,
    shadowOffset: { width: offsetX, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: blur,
  };
};

// Glow effects (using colored shadows)
export const glowEffects = {
  primary: createCustomShadow(0, 0, 10, 0.3, '#6366F1'),
  success: createCustomShadow(0, 0, 10, 0.3, '#10B981'),
  warning: createCustomShadow(0, 0, 10, 0.3, '#F59E0B'),
  error: createCustomShadow(0, 0, 10, 0.3, '#EF4444'),
  
  // Subtle glow for focus states
  focus: createCustomShadow(0, 0, 8, 0.2, '#6366F1'),
};

// Inner shadow simulation (using borders and backgrounds)
export const innerShadowStyles = {
  pressed: {
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    borderLeftColor: 'rgba(0, 0, 0, 0.1)',
  },
  
  inset: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  
  well: {
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.15)',
    borderLeftColor: 'rgba(0, 0, 0, 0.15)',
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
};

// Animation-friendly shadow presets
export const animatedShadows = {
  // For button press animations
  button: {
    rest: shadows.sm,
    pressed: shadows.xs,
    hover: shadows.md,
  },
  
  // For card interactions
  card: {
    rest: shadows.sm,
    hover: shadows.md,
    active: shadows.lg,
  },
  
  // For floating action buttons
  fab: {
    rest: shadows.lg,
    pressed: shadows.md,
    hover: shadows.xl,
  },
};

// Shadow removal utility
export const noShadow = {
  shadowOpacity: 0,
  elevation: 0,
};

// Text shadow utilities (iOS only)
export const textShadows = {
  subtle: {
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  
  strong: {
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  
  glow: {
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
};

export default shadows; 