// Theme Utilities
// Helper functions for theme manipulation and responsive design

import { Dimensions, TextStyle, ViewStyle } from 'react-native';
import { BreakpointConfig, ResponsiveValue, Theme } from './types';

// Get screen dimensions
export const getScreenDimensions = () => {
  const { width, height } = Dimensions.get('window');
  return { width, height };
};

// Default breakpoints
export const defaultBreakpoints: BreakpointConfig = {
  xs: 0,     // Mobile portrait
  sm: 480,   // Mobile landscape
  md: 768,   // Tablet portrait
  lg: 1024,  // Tablet landscape
  xl: 1200,  // Desktop
  '2xl': 1536, // Large desktop
};

// Get current breakpoint
export const getCurrentBreakpoint = (
  width: number = getScreenDimensions().width,
  breakpoints: BreakpointConfig = defaultBreakpoints
): keyof BreakpointConfig => {
  if (width >= breakpoints['2xl']) return '2xl';
  if (width >= breakpoints.xl) return 'xl';
  if (width >= breakpoints.lg) return 'lg';
  if (width >= breakpoints.md) return 'md';
  if (width >= breakpoints.sm) return 'sm';
  return 'xs';
};

// Get responsive value based on current breakpoint
export const getResponsiveValue = <T>(
  value: ResponsiveValue<T> | T,
  width?: number,
  breakpoints?: BreakpointConfig
): T => {
  // If not a responsive value object, return as is
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return value as T;
  }

  const currentBreakpoint = getCurrentBreakpoint(width, breakpoints);
  const responsiveValue = value as ResponsiveValue<T>;

  // Find the value for current breakpoint or the closest smaller one
  const breakpointOrder: (keyof BreakpointConfig)[] = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs'];
  const currentIndex = breakpointOrder.indexOf(currentBreakpoint);

  for (let i = currentIndex; i < breakpointOrder.length; i++) {
    const bp = breakpointOrder[i];
    if (responsiveValue[bp] !== undefined) {
      return responsiveValue[bp] as T;
    }
  }

  // Fallback to any available value
  return (responsiveValue.xs || responsiveValue.sm || responsiveValue.md || 
          responsiveValue.lg || responsiveValue.xl || responsiveValue['2xl']) as T;
};

// Create themed styles factory
export const createThemedStyles = <T extends Record<string, ViewStyle | TextStyle>>(
  styleFactory: (theme: Theme) => T
) => {
  return (theme: Theme): T => styleFactory(theme);
};

// Color manipulation utilities
export const colorUtils = {
  // Convert hex to rgba
  hexToRgba: (hex: string, alpha: number = 1): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return hex;
    
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  },

  // Lighten color
  lighten: (hex: string, amount: number): string => {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * amount);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  },

  // Darken color
  darken: (hex: string, amount: number): string => {
    return colorUtils.lighten(hex, -amount);
  },

  // Get contrast color (black or white)
  getContrastColor: (hex: string): string => {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  },
};

// Spacing utilities
export const spacingUtils = {
  // Convert spacing key to pixel value
  getSpacing: (value: number | string, baseSpacing: number = 4): number => {
    if (typeof value === 'number') {
      return value * baseSpacing;
    }
    
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      return numValue * baseSpacing;
    }
    
    return 0;
  },

  // Create margin utilities
  margin: (value: number) => ({
    margin: value,
  }),

  marginX: (value: number) => ({
    marginHorizontal: value,
  }),

  marginY: (value: number) => ({
    marginVertical: value,
  }),

  marginTop: (value: number) => ({
    marginTop: value,
  }),

  marginRight: (value: number) => ({
    marginRight: value,
  }),

  marginBottom: (value: number) => ({
    marginBottom: value,
  }),

  marginLeft: (value: number) => ({
    marginLeft: value,
  }),

  // Create padding utilities
  padding: (value: number) => ({
    padding: value,
  }),

  paddingX: (value: number) => ({
    paddingHorizontal: value,
  }),

  paddingY: (value: number) => ({
    paddingVertical: value,
  }),

  paddingTop: (value: number) => ({
    paddingTop: value,
  }),

  paddingRight: (value: number) => ({
    paddingRight: value,
  }),

  paddingBottom: (value: number) => ({
    paddingBottom: value,
  }),

  paddingLeft: (value: number) => ({
    paddingLeft: value,
  }),
};

// Typography utilities
export const typographyUtils = {
  // Scale font size based on screen size
  scaleFont: (baseSize: number, scaleFactor: number = 1): number => {
    const { width } = getScreenDimensions();
    const scale = width / 375; // Base on iPhone X width
    return Math.round(baseSize * scale * scaleFactor);
  },

  // Get line height for font size
  getLineHeight: (fontSize: number, ratio: number = 1.4): number => {
    return Math.round(fontSize * ratio);
  },

  // Create text style with automatic line height
  createTextStyle: (fontSize: number, fontWeight: string = '400'): TextStyle => ({
    fontSize,
    fontWeight: fontWeight as any,
    lineHeight: typographyUtils.getLineHeight(fontSize),
  }),
};

// Animation utilities
export const animationUtils = {
  // Create spring config
  createSpring: (tension: number = 300, friction: number = 30) => ({
    tension,
    friction,
    useNativeDriver: true,
  }),

  // Create timing config
  createTiming: (duration: number = 250) => ({
    duration,
    useNativeDriver: true,
  }),

  // Stagger animations
  createStagger: (animations: any[], delay: number = 100) => {
    return animations.map((animation, index) => ({
      ...animation,
      delay: index * delay,
    }));
  },
};

// Layout utilities
export const layoutUtils = {
  // Flexbox utilities
  flex: (value: number = 1): ViewStyle => ({ flex: value }),
  
  row: (): ViewStyle => ({ flexDirection: 'row' }),
  
  column: (): ViewStyle => ({ flexDirection: 'column' }),
  
  center: (): ViewStyle => ({
    justifyContent: 'center',
    alignItems: 'center',
  }),
  
  spaceBetween: (): ViewStyle => ({
    justifyContent: 'space-between',
  }),
  
  spaceAround: (): ViewStyle => ({
    justifyContent: 'space-around',
  }),
  
  spaceEvenly: (): ViewStyle => ({
    justifyContent: 'space-evenly',
  }),

  // Absolute positioning
  absolute: (options: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  } = {}): ViewStyle => ({
    position: 'absolute',
    ...options,
  }),

  // Full size
  fullSize: (): ViewStyle => ({
    width: '100%',
    height: '100%',
  }),

  // Square
  square: (size: number): ViewStyle => ({
    width: size,
    height: size,
  }),

  // Circle
  circle: (size: number): ViewStyle => ({
    width: size,
    height: size,
    borderRadius: size / 2,
  }),
};

// Debug utilities
export const debugUtils = {
  // Add colored border for debugging layouts
  debugBorder: (color: string = 'red'): ViewStyle => ({
    borderWidth: 1,
    borderColor: color,
  }),

  // Add background color for debugging
  debugBackground: (color: string = 'rgba(255, 0, 0, 0.1)'): ViewStyle => ({
    backgroundColor: color,
  }),

  // Log theme values
  logTheme: (theme: Theme) => {
    console.log('Theme:', {
      mode: theme.mode,
      colors: Object.keys(theme.colors),
      spacing: theme.spacing,
      typography: Object.keys(theme.typography.styles),
    });
  },
};

// Performance utilities
export const performanceUtils = {
  // Memoize style objects
  memoizeStyles: <T extends Record<string, any>>(styles: T): T => {
    // In production, you might want to use a more sophisticated memoization
    return styles;
  },

  // Check if native driver can be used for a property
  canUseNativeDriver: (property: string): boolean => {
    const nativeDriverProperties = [
      'opacity',
      'transform',
      'translateX',
      'translateY',
      'scale',
      'rotate',
      'rotateX',
      'rotateY',
      'rotateZ',
      'perspective',
      'scaleX',
      'scaleY',
    ];
    
    return nativeDriverProperties.includes(property);
  },
};

// Theme validation utilities
export const validationUtils = {
  // Validate theme structure
  validateTheme: (theme: any): theme is Theme => {
    const requiredKeys = ['mode', 'colors', 'typography', 'spacing', 'shadows', 'borders'];
    return requiredKeys.every(key => key in theme);
  },

  // Validate color format
  isValidColor: (color: string): boolean => {
    // Check hex color
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
      return true;
    }
    
    // Check rgb/rgba
    if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+)?\s*\)$/.test(color)) {
      return true;
    }
    
    // Check named colors (basic)
    const namedColors = ['transparent', 'black', 'white', 'red', 'green', 'blue'];
    return namedColors.includes(color.toLowerCase());
  },
};

// Export all utilities
export const themeUtils = {
  color: colorUtils,
  spacing: spacingUtils,
  typography: typographyUtils,
  animation: animationUtils,
  layout: layoutUtils,
  debug: debugUtils,
  performance: performanceUtils,
  validation: validationUtils,
}; 