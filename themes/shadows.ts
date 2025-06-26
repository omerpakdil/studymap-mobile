// Shadow System
// Modern elevation and depth definitions for StudyMap - 2025 trends

import { Platform } from 'react-native';
import { ShadowLevels } from './types';

// iOS shadow styles - Modern soft shadows with natural depth
const iosShadows: ShadowLevels = {
  // Ultra subtle shadow - barely perceptible
  xs: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0.5 },
    shadowOpacity: 0.03,
    shadowRadius: 1,
  },
  
  // Gentle elevation - modern cards
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  
  // Standard elevation - floating elements
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  
  // Prominent elevation - modals, dropdowns
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
  },
  
  // Maximum elevation - overlays
  xl: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
  },
  
  // New: Glass morphism effects
  glass: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
  },
  
  // Dark mode shadows (subtle colored shadows)
  dark: {
    sm: {
      shadowColor: '#FFFFFF',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
    },
    
    md: {
      shadowColor: '#FFFFFF',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
    },
    
    lg: {
      shadowColor: '#FFFFFF',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.16,
      shadowRadius: 16,
    },
    
    glass: {
      shadowColor: '#FFFFFF',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
    },
  },
};

// Android shadow styles (using elevation) - Modern Material 3 inspired
const androidShadows: ShadowLevels = {
  xs: {
    elevation: 1,
  },
  
  sm: {
    elevation: 3,
  },
  
  md: {
    elevation: 6,
  },
  
  lg: {
    elevation: 12,
  },
  
  xl: {
    elevation: 24,
  },
  
  glass: {
    elevation: 4,
  },
  
  // Dark mode shadows (same elevation values)
  dark: {
    sm: {
      elevation: 3,
    },
    
    md: {
      elevation: 6,
    },
    
    lg: {
      elevation: 12,
    },
    
    glass: {
      elevation: 4,
    },
  },
};

// Platform-specific shadow selection
const shadows: ShadowLevels = Platform.select({
  ios: iosShadows,
  android: androidShadows,
  default: iosShadows,
});

// Component-specific shadow presets - Modern design system
export const componentShadows = {
  // Cards - Glass morphism inspired
  card: {
    default: shadows.sm,
    hover: shadows.md,
    pressed: shadows.xs,
    glass: shadows.glass,
  },
  
  // Buttons - Subtle elevation
  button: {
    primary: shadows.sm,
    secondary: shadows.xs,
    floating: shadows.lg,
    ghost: { shadowOpacity: 0 }, // No shadow for ghost buttons
  },
  
  // Modals - Strong depth separation
  modal: {
    backdrop: shadows.xl,
    content: shadows.lg,
    bottomSheet: shadows.md,
    glass: shadows.glass,
  },
  
  // Navigation - Minimal elevation
  navigation: {
    header: shadows.sm,
    tabBar: shadows.glass,
    fab: shadows.lg,
  },
  
  // Study components - Context-specific elevation
  study: {
    progressCard: shadows.sm,
    timerCard: shadows.md,
    achievementBadge: shadows.sm,
    calendarCell: shadows.xs,
    subjectCard: shadows.glass,
  },
};

// Modern shadow utilities
export const createShadowStyle = (
  level: keyof ShadowLevels,
  isDark: boolean = false
) => {
  if (isDark && level in shadows.dark) {
    return shadows.dark[level as keyof typeof shadows.dark];
  }
  return shadows[level];
};

// Advanced shadow generator - Supports modern shadow techniques
export const createCustomShadow = (
  offsetX: number = 0,
  offsetY: number,
  blur: number,
  opacity: number = 0.08,
  color: string = '#000000',
  spread: number = 0 // Not supported on mobile but good for web
) => {
  if (Platform.OS === 'android') {
    // Android elevation approximation
    const elevation = Math.min(Math.max(Math.round(offsetY + blur / 2), 1), 24);
    return { elevation };
  }
  
  return {
    shadowColor: color,
    shadowOffset: { width: offsetX, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: blur,
  };
};

// Glass morphism and modern glow effects
export const glowEffects = {
  // Popular app-inspired brand color glows
  primary: createCustomShadow(0, 0, 16, 0.25, '#3B82F6'),     // Soft Blue
  secondary: createCustomShadow(0, 0, 12, 0.2, '#F97316'),    // Coral
  accent: createCustomShadow(0, 0, 14, 0.22, '#22C55E'),      // Sage Green
  
  // Semantic glows
  success: createCustomShadow(0, 0, 12, 0.2, '#22C55E'),
  warning: createCustomShadow(0, 0, 12, 0.2, '#F59E0B'),
  error: createCustomShadow(0, 0, 12, 0.2, '#EF4444'),
  
  // Popular app interaction states
  focus: createCustomShadow(0, 0, 8, 0.15, '#3B82F6'),        // Soft Blue focus
  hover: createCustomShadow(0, 2, 8, 0.1, '#000000'),
  
  // Lifestyle & Education app inspired glows
  lifestyle: {
    blue: createCustomShadow(0, 0, 20, 0.3, '#3B82F6'),       // Instagram/Coursera blue
    coral: createCustomShadow(0, 0, 16, 0.25, '#F97316'),     // Pinterest/lifestyle coral
    green: createCustomShadow(0, 0, 18, 0.28, '#22C55E'),     // Headspace/wellness green
  },
  
  // Glass effects
  glass: {
    light: createCustomShadow(0, 2, 12, 0.08, '#000000'),
    dark: createCustomShadow(0, 2, 12, 0.12, '#FFFFFF'),
  },
};

// Liquid glass inspired shadows
export const liquidGlassShadows = {
  // Floating glass panels
  panel: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
  },
  
  // Interactive glass surfaces
  interactive: {
    default: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
    },
    hover: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 20,
    },
    pressed: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.02,
      shadowRadius: 4,
    },
  },
  
  // Backdrop blur simulation
  backdrop: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
  },
};

// Inner shadow simulation (using borders and backgrounds)
export const innerShadowStyles = {
  pressed: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(0, 0, 0, 0.05)',
  },
  
  inset: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  // Glass morphism inset
  glassInset: {
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
};

// Multi-layer shadow system for complex depth
export const layeredShadows = {
  // Card with realistic depth
  realisticCard: [
    { // Ambient shadow
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
    },
    { // Directional shadow
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
    },
  ],
  
  // Floating action button
  fab: [
    {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
    },
  ],
};

export default shadows; 