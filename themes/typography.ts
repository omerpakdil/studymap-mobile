// Typography System
// Font definitions and text styles for StudyMap

import { Platform } from 'react-native';
import { TypographyScale } from './types';

// Platform-specific font families
const fontFamilies = {
  primary: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),
  mono: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
  }),
  display: Platform.select({
    ios: 'SF Pro Display',
    android: 'Roboto',
    default: 'System',
  }),
};

// Base typography scale
const typography: TypographyScale = {
  fontFamily: {
    primary: fontFamilies.primary,
    mono: fontFamilies.mono,
    display: fontFamilies.display,
  },
  
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  
  lineHeight: {
    xs: 16,      // 1.33
    sm: 20,      // 1.43
    base: 24,    // 1.5
    lg: 28,      // 1.56
    xl: 28,      // 1.4
    '2xl': 32,   // 1.33
    '3xl': 36,   // 1.2
    '4xl': 40,   // 1.11
    '5xl': 1,    // Auto
  },
  
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
  },
  
  // Predefined text styles following the design system
  styles: {
    h1: {
      fontFamily: fontFamilies.display,
      fontSize: 36,
      fontWeight: '700',
      lineHeight: 40,
      letterSpacing: -0.72, // -0.02em
    },
    
    h2: {
      fontFamily: fontFamilies.display,
      fontSize: 30,
      fontWeight: '600',
      lineHeight: 36,
      letterSpacing: -0.3, // -0.01em
    },
    
    h3: {
      fontFamily: fontFamilies.primary,
      fontSize: 24,
      fontWeight: '600',
      lineHeight: 32,
      letterSpacing: 0,
    },
    
    h4: {
      fontFamily: fontFamilies.primary,
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 28,
      letterSpacing: 0,
    },
    
    bodyLg: {
      fontFamily: fontFamilies.primary,
      fontSize: 18,
      fontWeight: '400',
      lineHeight: 28,
      letterSpacing: 0,
    },
    
    body: {
      fontFamily: fontFamilies.primary,
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 24,
      letterSpacing: 0,
    },
    
    bodySm: {
      fontFamily: fontFamilies.primary,
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 20,
      letterSpacing: 0,
    },
    
    label: {
      fontFamily: fontFamilies.primary,
      fontSize: 14,
      fontWeight: '500',
      lineHeight: 20,
      letterSpacing: 0.14, // 0.01em
    },
    
    caption: {
      fontFamily: fontFamilies.primary,
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 16,
      letterSpacing: 0.24, // 0.02em
    },
  },
};

// Responsive typography utilities
export const getResponsiveFontSize = (baseSize: number, screenWidth: number) => {
  if (screenWidth >= 768) {
    // Tablet/Desktop - scale up
    return Math.round(baseSize * 1.125);
  } else if (screenWidth <= 375) {
    // Small phones - scale down slightly
    return Math.round(baseSize * 0.9);
  }
  return baseSize;
};

// Text style variants for specific use cases
export const textVariants = {
  // Navigation
  tabLabel: {
    ...typography.styles.caption,
    fontWeight: '500',
    textAlign: 'center' as const,
  },
  
  headerTitle: {
    ...typography.styles.h4,
    fontWeight: '600',
  },
  
  // Buttons
  buttonText: {
    fontFamily: fontFamilies.primary,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
    textAlign: 'center' as const,
  },
  
  buttonTextSmall: {
    fontFamily: fontFamilies.primary,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    textAlign: 'center' as const,
  },
  
  // Cards and components
  cardTitle: {
    ...typography.styles.h4,
    fontWeight: '600',
  },
  
  cardSubtitle: {
    ...typography.styles.bodySm,
    fontWeight: '500',
  },
  
  // Study-specific text styles
  studyScore: {
    fontFamily: fontFamilies.display,
    fontSize: 48,
    fontWeight: '700',
    lineHeight: 56,
    textAlign: 'center' as const,
  },
  
  studyProgress: {
    fontFamily: fontFamilies.primary,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  
  timerText: {
    fontFamily: fontFamilies.mono,
    fontSize: 32,
    fontWeight: '600',
    lineHeight: 40,
    textAlign: 'center' as const,
  },
  
  // Form elements
  inputLabel: {
    ...typography.styles.label,
    fontWeight: '500',
  },
  
  inputText: {
    fontFamily: fontFamilies.primary,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  
  inputError: {
    ...typography.styles.caption,
    fontWeight: '400',
  },
  
  // Lists and data display
  listTitle: {
    ...typography.styles.body,
    fontWeight: '500',
  },
  
  listSubtitle: {
    ...typography.styles.bodySm,
    fontWeight: '400',
  },
  
  // Accessibility text
  screenReaderOnly: {
    position: 'absolute',
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    border: 0,
  },
};

// Text truncation utilities
export const textTruncation = {
  ellipsis: {
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
    whiteSpace: 'nowrap' as const,
  },
  
  multiLineEllipsis: (lines: number) => ({
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
    display: '-webkit-box' as const,
    WebkitLineClamp: lines,
    WebkitBoxOrient: 'vertical' as const,
  }),
};

// Text color utilities (to be used with theme colors)
export const textColorMap = {
  primary: 'neutral.900',
  secondary: 'neutral.600',
  disabled: 'neutral.400',
  success: 'success.600',
  warning: 'warning.600',
  error: 'error.600',
  info: 'info.600',
  inverse: 'neutral.0',
} as const;

export default typography; 