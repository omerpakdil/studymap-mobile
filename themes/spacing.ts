// Spacing System
// Consistent spacing scale and layout utilities for StudyMap

import { SpacingScale } from './types';

// Base spacing scale (4px base unit)
const spacing: SpacingScale = {
  0: 0,     // 0px
  1: 4,     // 4px
  2: 8,     // 8px
  3: 12,    // 12px
  4: 16,    // 16px
  5: 20,    // 20px
  6: 24,    // 24px
  8: 32,    // 32px
  10: 40,   // 40px
  12: 48,   // 48px
  16: 64,   // 64px
  20: 80,   // 80px
  24: 96,   // 96px
};

// Layout spacing presets
export const layoutSpacing = {
  // Screen margins
  screenHorizontal: spacing[4],  // 16px
  screenVertical: spacing[6],    // 24px
  
  // Container spacing
  containerPadding: {
    small: spacing[4],    // 16px
    medium: spacing[6],   // 24px
    large: spacing[8],    // 32px
  },
  
  // Section spacing
  sectionGap: {
    small: spacing[4],    // 16px
    medium: spacing[6],   // 24px
    large: spacing[8],    // 32px
    xLarge: spacing[12],  // 48px
  },
  
  // Component spacing
  componentGap: {
    tight: spacing[2],    // 8px
    normal: spacing[3],   // 12px
    relaxed: spacing[4],  // 16px
    loose: spacing[6],    // 24px
  },
};

// Card and component padding
export const componentPadding = {
  card: {
    small: spacing[3],    // 12px
    medium: spacing[4],   // 16px
    large: spacing[6],    // 24px
  },
  
  button: {
    small: {
      horizontal: spacing[3],  // 12px
      vertical: spacing[2],    // 8px
    },
    medium: {
      horizontal: spacing[4],  // 16px
      vertical: spacing[3],    // 12px
    },
    large: {
      horizontal: spacing[6],  // 24px
      vertical: spacing[4],    // 16px
    },
  },
  
  input: {
    horizontal: spacing[4],  // 16px
    vertical: spacing[3],    // 12px
  },
  
  modal: {
    small: spacing[4],    // 16px
    medium: spacing[6],   // 24px
    large: spacing[8],    // 32px
  },
};

// Navigation spacing
export const navigationSpacing = {
  tabBar: {
    height: 80,
    paddingHorizontal: spacing[4],  // 16px
    paddingVertical: spacing[2],    // 8px
  },
  
  header: {
    height: 56,
    paddingHorizontal: spacing[4],  // 16px
  },
  
  statusBar: {
    height: 44, // iOS default
  },
  
  safeArea: {
    top: 44,    // iOS default
    bottom: 34, // iOS default with home indicator
  },
};

// Study-specific spacing
export const studySpacing = {
  // Calendar component
  calendar: {
    cellPadding: spacing[2],     // 8px
    cellMargin: spacing[1],      // 4px
    headerPadding: spacing[4],   // 16px
  },
  
  // Progress indicators
  progress: {
    ringStroke: 8,               // 8px stroke width
    ringPadding: spacing[4],     // 16px
    barHeight: 8,                // 8px height
    barPadding: spacing[2],      // 8px
  },
  
  // Study session
  session: {
    timerPadding: spacing[8],    // 32px
    contentPadding: spacing[6],  // 24px
    controlsPadding: spacing[4], // 16px
  },
  
  // Achievement badges
  achievement: {
    padding: spacing[3],         // 12px
    margin: spacing[2],          // 8px
    iconSize: 32,                // 32px
  },
};

// Responsive spacing utilities
export const getResponsiveSpacing = (baseValue: number, screenWidth: number) => {
  if (screenWidth >= 768) {
    // Tablet/Desktop - increase spacing
    return Math.round(baseValue * 1.25);
  } else if (screenWidth <= 375) {
    // Small phones - decrease spacing slightly
    return Math.round(baseValue * 0.875);
  }
  return baseValue;
};

// Common spacing patterns
export const spacingPatterns = {
  // List item spacing
  listItem: {
    paddingVertical: spacing[3],     // 12px
    paddingHorizontal: spacing[4],   // 16px
    marginBottom: spacing[1],        // 4px
  },
  
  // Form field spacing
  formField: {
    marginBottom: spacing[4],        // 16px
    labelMarginBottom: spacing[2],   // 8px
    errorMarginTop: spacing[1],      // 4px
  },
  
  // Card spacing
  cardSpacing: {
    padding: spacing[4],             // 16px
    marginBottom: spacing[4],        // 16px
    marginHorizontal: spacing[4],    // 16px
  },
  
  // Button group spacing
  buttonGroup: {
    gap: spacing[3],                 // 12px
    marginVertical: spacing[4],      // 16px
  },
  
  // Icon spacing
  iconSpacing: {
    small: spacing[2],               // 8px
    medium: spacing[3],              // 12px
    large: spacing[4],               // 16px
  },
};

// Layout utilities
export const createSpacingUtilities = (scale: SpacingScale) => ({
  // Margin utilities
  m: (value: keyof SpacingScale) => ({ margin: scale[value] }),
  mt: (value: keyof SpacingScale) => ({ marginTop: scale[value] }),
  mr: (value: keyof SpacingScale) => ({ marginRight: scale[value] }),
  mb: (value: keyof SpacingScale) => ({ marginBottom: scale[value] }),
  ml: (value: keyof SpacingScale) => ({ marginLeft: scale[value] }),
  mx: (value: keyof SpacingScale) => ({ 
    marginLeft: scale[value], 
    marginRight: scale[value] 
  }),
  my: (value: keyof SpacingScale) => ({ 
    marginTop: scale[value], 
    marginBottom: scale[value] 
  }),
  
  // Padding utilities
  p: (value: keyof SpacingScale) => ({ padding: scale[value] }),
  pt: (value: keyof SpacingScale) => ({ paddingTop: scale[value] }),
  pr: (value: keyof SpacingScale) => ({ paddingRight: scale[value] }),
  pb: (value: keyof SpacingScale) => ({ paddingBottom: scale[value] }),
  pl: (value: keyof SpacingScale) => ({ paddingLeft: scale[value] }),
  px: (value: keyof SpacingScale) => ({ 
    paddingLeft: scale[value], 
    paddingRight: scale[value] 
  }),
  py: (value: keyof SpacingScale) => ({ 
    paddingTop: scale[value], 
    paddingBottom: scale[value] 
  }),
  
  // Gap utilities (for Flexbox)
  gap: (value: keyof SpacingScale) => ({ gap: scale[value] }),
  rowGap: (value: keyof SpacingScale) => ({ rowGap: scale[value] }),
  columnGap: (value: keyof SpacingScale) => ({ columnGap: scale[value] }),
});

// Create spacing utilities with the default scale
export const spacingUtils = createSpacingUtilities(spacing);

// Touch target sizes (accessibility)
export const touchTargets = {
  minimum: 44,      // 44px minimum touch target
  comfortable: 48,  // 48px comfortable touch target
  large: 56,        // 56px large touch target
};

// Safe area constants
export const safeAreaConstants = {
  statusBarHeight: {
    ios: 44,
    android: 24,
  },
  
  tabBarHeight: {
    ios: 83,    // 49px tab bar + 34px safe area
    android: 56,
  },
  
  headerHeight: {
    ios: 88,    // 44px header + 44px status bar
    android: 56,
  },
};

export default spacing; 