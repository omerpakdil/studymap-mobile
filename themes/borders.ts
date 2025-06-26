// Border System
// Border radius and border utilities for StudyMap

import { BorderRadius } from './types';

// Base border radius scale
const borders: BorderRadius = {
  none: 0,     // 0px - no radius
  sm: 4,       // 4px - small elements
  md: 8,       // 8px - buttons, inputs
  lg: 12,      // 12px - cards, modals
  xl: 16,      // 16px - large cards
  '2xl': 20,   // 20px - special components
  '3xl': 24,   // 24px - hero elements
  '4xl': 32,   // 32px - very large elements
  full: 9999,  // Full circle/pill shape
};

// Component-specific border radius
export const componentBorders = {
  // Buttons
  button: {
    small: borders.md,      // 8px
    medium: borders.lg,     // 12px
    large: borders.xl,      // 16px
    pill: borders.full,     // Full rounded
  },
  
  // Cards
  card: {
    default: borders.lg,    // 12px
    large: borders.xl,      // 16px
    rounded: borders['2xl'], // 20px
  },
  
  // Inputs
  input: {
    default: borders.md,    // 8px
    rounded: borders.lg,    // 12px
  },
  
  // Modals
  modal: {
    default: borders.xl,    // 16px
    large: borders['2xl'],  // 20px
    bottomSheet: {
      top: borders['2xl'],  // 20px top corners only
      bottom: borders.none, // 0px bottom corners
    },
  },
  
  // Navigation
  navigation: {
    tabBar: borders.none,   // 0px
    tabButton: borders.lg,  // 12px
    fab: borders.full,      // Full circle
  },
  
  // Study components
  study: {
    progressRing: borders.full,     // Full circle
    achievementBadge: borders.lg,   // 12px
    calendarCell: borders.md,       // 8px
    timerCard: borders['2xl'],      // 20px
    subjectChip: borders.full,      // Pill shape
  },
  
  // Images and avatars
  image: {
    avatar: borders.full,   // Full circle
    thumbnail: borders.md,  // 8px
    hero: borders.xl,       // 16px
  },
  
  // Badges and chips
  badge: {
    default: borders.md,    // 8px
    rounded: borders.lg,    // 12px
    pill: borders.full,     // Full rounded
  },
  
  // Lists and dividers
  list: {
    item: borders.md,       // 8px
    section: borders.lg,    // 12px
  },
};

// Border width scale
export const borderWidths = {
  none: 0,
  thin: 0.5,    // Hairline border
  default: 1,   // Standard border
  thick: 2,     // Emphasis border
  heavy: 4,     // Strong emphasis
};

// Border styles for different states
export const borderStyles = {
  // Default borders
  default: {
    borderWidth: borderWidths.default,
    borderStyle: 'solid' as const,
  },
  
  // Focus states
  focus: {
    borderWidth: borderWidths.thick,
    borderStyle: 'solid' as const,
  },
  
  // Error states
  error: {
    borderWidth: borderWidths.default,
    borderStyle: 'solid' as const,
  },
  
  // Success states
  success: {
    borderWidth: borderWidths.default,
    borderStyle: 'solid' as const,
  },
  
  // Disabled states
  disabled: {
    borderWidth: borderWidths.default,
    borderStyle: 'solid' as const,
    opacity: 0.5,
  },
  
  // Dashed borders
  dashed: {
    borderWidth: borderWidths.default,
    borderStyle: 'dashed' as const,
  },
  
  // Dotted borders
  dotted: {
    borderWidth: borderWidths.default,
    borderStyle: 'dotted' as const,
  },
};

// Utility functions for border radius
export const createBorderRadius = (
  topLeft?: keyof BorderRadius,
  topRight?: keyof BorderRadius,
  bottomRight?: keyof BorderRadius,
  bottomLeft?: keyof BorderRadius
) => ({
  borderTopLeftRadius: topLeft ? borders[topLeft] : undefined,
  borderTopRightRadius: topRight ? borders[topRight] : undefined,
  borderBottomRightRadius: bottomRight ? borders[bottomRight] : undefined,
  borderBottomLeftRadius: bottomLeft ? borders[bottomLeft] : undefined,
});

// Common border radius patterns
export const borderPatterns = {
  // All corners
  all: (radius: keyof BorderRadius) => ({
    borderRadius: borders[radius],
  }),
  
  // Top corners only
  top: (radius: keyof BorderRadius) => ({
    borderTopLeftRadius: borders[radius],
    borderTopRightRadius: borders[radius],
  }),
  
  // Bottom corners only
  bottom: (radius: keyof BorderRadius) => ({
    borderBottomLeftRadius: borders[radius],
    borderBottomRightRadius: borders[radius],
  }),
  
  // Left corners only
  left: (radius: keyof BorderRadius) => ({
    borderTopLeftRadius: borders[radius],
    borderBottomLeftRadius: borders[radius],
  }),
  
  // Right corners only
  right: (radius: keyof BorderRadius) => ({
    borderTopRightRadius: borders[radius],
    borderBottomRightRadius: borders[radius],
  }),
  
  // Diagonal patterns
  topLeftBottomRight: (radius: keyof BorderRadius) => ({
    borderTopLeftRadius: borders[radius],
    borderBottomRightRadius: borders[radius],
  }),
  
  topRightBottomLeft: (radius: keyof BorderRadius) => ({
    borderTopRightRadius: borders[radius],
    borderBottomLeftRadius: borders[radius],
  }),
};

// Border utilities for layout
export const borderUtilities = {
  // Add border to specific sides
  top: (width: keyof typeof borderWidths = 'default') => ({
    borderTopWidth: borderWidths[width],
  }),
  
  right: (width: keyof typeof borderWidths = 'default') => ({
    borderRightWidth: borderWidths[width],
  }),
  
  bottom: (width: keyof typeof borderWidths = 'default') => ({
    borderBottomWidth: borderWidths[width],
  }),
  
  left: (width: keyof typeof borderWidths = 'default') => ({
    borderLeftWidth: borderWidths[width],
  }),
  
  // Horizontal borders
  horizontal: (width: keyof typeof borderWidths = 'default') => ({
    borderTopWidth: borderWidths[width],
    borderBottomWidth: borderWidths[width],
  }),
  
  // Vertical borders
  vertical: (width: keyof typeof borderWidths = 'default') => ({
    borderLeftWidth: borderWidths[width],
    borderRightWidth: borderWidths[width],
  }),
  
  // All borders
  all: (width: keyof typeof borderWidths = 'default') => ({
    borderWidth: borderWidths[width],
  }),
};

// Clipping and overflow utilities
export const clippingStyles = {
  // Clip to border radius
  clip: {
    overflow: 'hidden' as const,
  },
  
  // Visible overflow
  visible: {
    overflow: 'visible' as const,
  },
  
  // Scroll overflow
  scroll: {
    overflow: 'scroll' as const,
  },
};

// Interactive border animations
export const interactiveBorders = {
  // Hover effects
  hover: {
    scale: 1.02,
    borderWidth: borderWidths.thick,
  },
  
  // Press effects
  press: {
    scale: 0.98,
    borderWidth: borderWidths.default,
  },
  
  // Focus effects
  focus: {
    borderWidth: borderWidths.thick,
    scale: 1.01,
  },
};

export default borders; 