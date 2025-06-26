// Typography System
// Modern font definitions and text styles for StudyMap - 2025 trends

import { Platform } from 'react-native';
import { TypographyScale } from './types';

// Platform-specific font families - Modern system fonts
const fontFamilies = {
  primary: Platform.select({
    ios: '-apple-system', // Native San Francisco
    android: 'Roboto',
    default: 'System',
  }),
  mono: Platform.select({
    ios: 'SF Mono',
    android: 'Roboto Mono',
    default: 'monospace',
  }),
  display: Platform.select({
    ios: '-apple-system', // SF Pro Display variant
    android: 'Roboto',
    default: 'System',
  }),
  // New: Variable font support for modern browsers
  variable: Platform.select({
    ios: '-apple-system',
    android: 'Roboto Flex',
    default: 'system-ui',
  }),
};

// Modern typography scale - Based on perfect fourth (1.333) ratio
const typography: TypographyScale = {
  fontFamily: {
    primary: fontFamilies.primary,
    mono: fontFamilies.mono,
    display: fontFamilies.display,
    variable: fontFamilies.variable,
  },
  
  fontSize: {
    xs: 11,    // Refined smaller sizes
    sm: 13,
    base: 15,  // Slightly smaller base for better mobile reading
    lg: 17,
    xl: 19,
    '2xl': 23,
    '3xl': 29,
    '4xl': 35,
    '5xl': 47,
    '6xl': 59, // New larger size
  },
  
  fontWeight: {
    light: '300',    // New light weight
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800', // New extra bold
  },
  
  lineHeight: {
    xs: 16,      // 1.45 ratio
    sm: 18,      // 1.38 ratio  
    base: 22,    // 1.47 ratio - improved readability
    lg: 26,      // 1.53 ratio
    xl: 28,      // 1.47 ratio
    '2xl': 32,   // 1.39 ratio
    '3xl': 36,   // 1.24 ratio - tighter for headlines
    '4xl': 42,   // 1.2 ratio
    '5xl': 54,   // 1.15 ratio
    '6xl': 64,   // 1.08 ratio
  },
  
  letterSpacing: {
    tighter: -0.8,  // New tighter option
    tight: -0.4,
    normal: 0,
    wide: 0.4,
    wider: 0.8,     // New wider option
  },
  
  // Modern predefined text styles with refined hierarchy
  styles: {
    // Display text - For hero sections and major headings
    display: {
      fontFamily: fontFamilies.display,
      fontSize: 47,
      fontWeight: '800',
      lineHeight: 54,
      letterSpacing: -0.94, // -0.02em
    },
    
    // Headlines
    h1: {
      fontFamily: fontFamilies.display,
      fontSize: 35,
      fontWeight: '700',
      lineHeight: 42,
      letterSpacing: -0.7, // -0.02em
    },
    
    h2: {
      fontFamily: fontFamilies.display,
      fontSize: 29,
      fontWeight: '600',
      lineHeight: 36,
      letterSpacing: -0.29, // -0.01em
    },
    
    h3: {
      fontFamily: fontFamilies.primary,
      fontSize: 23,
      fontWeight: '600',
      lineHeight: 32,
      letterSpacing: 0,
    },
    
    h4: {
      fontFamily: fontFamilies.primary,
      fontSize: 19,
      fontWeight: '600',
      lineHeight: 28,
      letterSpacing: 0,
    },
    
    h5: {
      fontFamily: fontFamilies.primary,
      fontSize: 17,
      fontWeight: '500',
      lineHeight: 26,
      letterSpacing: 0,
    },
    
    // Body text
    bodyLg: {
      fontFamily: fontFamilies.primary,
      fontSize: 17,
      fontWeight: '400',
      lineHeight: 26,
      letterSpacing: 0,
    },
    
    body: {
      fontFamily: fontFamilies.primary,
      fontSize: 15,
      fontWeight: '400',
      lineHeight: 22,
      letterSpacing: 0,
    },
    
    bodySm: {
      fontFamily: fontFamilies.primary,
      fontSize: 13,
      fontWeight: '400',
      lineHeight: 18,
      letterSpacing: 0,
    },
    
    // Interface text
    label: {
      fontFamily: fontFamilies.primary,
      fontSize: 13,
      fontWeight: '500',
      lineHeight: 18,
      letterSpacing: 0.13, // 0.01em
    },
    
    caption: {
      fontFamily: fontFamilies.primary,
      fontSize: 11,
      fontWeight: '400',
      lineHeight: 16,
      letterSpacing: 0.22, // 0.02em
    },
    
    // New: Interface elements
    overline: {
      fontFamily: fontFamilies.primary,
      fontSize: 11,
      fontWeight: '500',
      lineHeight: 16,
      letterSpacing: 0.88, // 0.08em - uppercase tracking
      textTransform: 'uppercase',
    },
    
    // Code and monospace
    code: {
      fontFamily: fontFamilies.mono,
      fontSize: 13,
      fontWeight: '400',
      lineHeight: 18,
      letterSpacing: 0,
    },
  },
};

// Responsive typography utilities - Improved scaling
export const getResponsiveFontSize = (baseSize: number, screenWidth: number) => {
  if (screenWidth >= 1024) {
    // Desktop - scale up more
    return Math.round(baseSize * 1.25);
  } else if (screenWidth >= 768) {
    // Tablet - moderate scale up
    return Math.round(baseSize * 1.15);
  } else if (screenWidth <= 320) {
    // Very small phones - scale down
    return Math.round(baseSize * 0.85);
  } else if (screenWidth <= 375) {
    // Small phones - slight scale down
    return Math.round(baseSize * 0.92);
  }
  return baseSize;
};

// Modern text style variants for specific use cases
export const textVariants = {
  // Navigation elements
  tabLabel: {
    ...typography.styles.caption,
    fontWeight: '500',
    textAlign: 'center' as const,
    letterSpacing: 0.5,
  },
  
  headerTitle: {
    ...typography.styles.h4,
    fontWeight: '600',
    letterSpacing: -0.19,
  },
  
  // Button text styles
  buttonText: {
    fontFamily: fontFamilies.primary,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
    textAlign: 'center' as const,
    letterSpacing: 0.15,
  },
  
  buttonTextSmall: {
    fontFamily: fontFamilies.primary,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    textAlign: 'center' as const,
    letterSpacing: 0.13,
  },
  
  buttonTextLarge: {
    fontFamily: fontFamilies.primary,
    fontSize: 17,
    fontWeight: '500',
    lineHeight: 26,
    textAlign: 'center' as const,
    letterSpacing: 0.17,
  },
  
  // Card components
  cardTitle: {
    ...typography.styles.h4,
    fontWeight: '600',
    letterSpacing: -0.19,
  },
  
  cardSubtitle: {
    ...typography.styles.bodySm,
    fontWeight: '400',
    letterSpacing: 0,
  },
  
  cardMeta: {
    ...typography.styles.caption,
    fontWeight: '400',
    letterSpacing: 0.22,
  },
  
  // Study-specific typography
  studyTimer: {
    fontFamily: fontFamilies.mono,
    fontSize: 35,
    fontWeight: '700',
    lineHeight: 42,
    letterSpacing: -0.35,
    textAlign: 'center' as const,
  },
  
  studyScore: {
    fontFamily: fontFamilies.display,
    fontSize: 23,
    fontWeight: '600',
    lineHeight: 32,
    letterSpacing: -0.23,
    textAlign: 'center' as const,
  },
  
  subjectLabel: {
    ...typography.styles.overline,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
  },
  
  // Progress indicators
  progressLabel: {
    fontFamily: fontFamilies.primary,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
    letterSpacing: 0.11,
  },
  
  progressValue: {
    fontFamily: fontFamilies.mono,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
    letterSpacing: 0,
  },
  
  // Accessibility helpers
  screenReaderOnly: {
    position: 'absolute',
    left: -10000,
    width: 1,
    height: 1,
    overflow: 'hidden',
  },
};

// Text color utilities for better semantic meaning
export const textColors = {
  primary: 'rgba(0, 0, 0, 0.87)',    // High emphasis
  secondary: 'rgba(0, 0, 0, 0.6)',   // Medium emphasis  
  disabled: 'rgba(0, 0, 0, 0.38)',   // Disabled/low emphasis
  hint: 'rgba(0, 0, 0, 0.38)',       // Placeholder text
  
  // Dark mode colors
  primaryDark: 'rgba(255, 255, 255, 0.87)',
  secondaryDark: 'rgba(255, 255, 255, 0.6)',
  disabledDark: 'rgba(255, 255, 255, 0.38)',
  hintDark: 'rgba(255, 255, 255, 0.38)',
};

// Modern line height utilities
export const lineHeightScale = {
  none: 1,
  tight: 1.1,
  snug: 1.2,
  normal: 1.47,  // Golden ratio based
  relaxed: 1.6,
  loose: 2,
};

// Font weight utilities mapped to numeric values
export const fontWeightMap = {
  thin: '100',
  extralight: '200',
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
};

export default typography; 