// Theme Type Definitions
// Comprehensive type system for StudyMap theming

import { TextStyle, ViewStyle } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'auto';

export interface ColorPalette {
  // Primary Colors
  primary: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  
  // Secondary Colors
  secondary: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  
  // Accent Colors (New)
  accent: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  
  // Semantic Colors (Extended)
  success: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  
  warning: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  
  error: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  
  // Neutral Colors (Extended)
  neutral: {
    0: string;
    25: string;   // New
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
    950: string;  // New
  };
  
  // Moonlit Colors (New trend color)
  moonlit: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  
  // Gradient Definitions (Extended)
  gradients: {
    primary: string;
    secondary: string;
    ethereal: string;     // New
    subtle: string;
    glass: string;        // New
    sunset: string;       // New
    luxury: string;       // New premium gradient
  };
}

export interface TypographyScale {
  fontFamily: {
    primary: string;
    mono: string;
    display?: string;
    variable?: string;  // New variable font
  };
  
  fontSize: {
    xs: number;
    sm: number;
    base: number;
    lg: number;
    xl: number;
    '2xl': number;
    '3xl': number;
    '4xl': number;
    '5xl': number;
    '6xl': number;     // New size
  };
  
  fontWeight: {
    light: '300';      // New light weight
    normal: '400';
    medium: '500';
    semibold: '600';
    bold: '700';
    extrabold: '800';  // New extra bold
  };
  
  lineHeight: {
    xs: number;
    sm: number;
    base: number;
    lg: number;
    xl: number;
    '2xl': number;
    '3xl': number;
    '4xl': number;
    '5xl': number;
    '6xl': number;     // New line height
  };
  
  letterSpacing: {
    tighter: number;   // New tighter option
    tight: number;
    normal: number;
    wide: number;
    wider: number;     // New wider option
  };
  
  // Predefined text styles (expanded)
  styles: {
    display: TextStyle;  // New display style
    h1: TextStyle;
    h2: TextStyle;
    h3: TextStyle;
    h4: TextStyle;
    h5: TextStyle;       // New h5
    bodyLg: TextStyle;
    body: TextStyle;
    bodySm: TextStyle;
    label: TextStyle;
    caption: TextStyle;
    overline: TextStyle; // New overline style
    code: TextStyle;     // New code style
  };
}

export interface SpacingScale {
  0: number;
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
  6: number;
  8: number;
  10: number;
  12: number;
  16: number;
  20: number;
  24: number;
}

export interface ShadowLevels {
  xs: ViewStyle;
  sm: ViewStyle;
  md: ViewStyle;
  lg: ViewStyle;
  xl: ViewStyle;
  glass: ViewStyle;   // New glass effect
  
  // Dark mode shadows
  dark: {
    sm: ViewStyle;
    md: ViewStyle;
    lg: ViewStyle;
    glass: ViewStyle; // New glass effect for dark mode
  };
}

export interface BorderRadius {
  none: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
  '3xl': number;
  '4xl': number;
  full: number;
}

export interface AnimationConfig {
  timing: {
    fast: number;
    normal: number;
    slow: number;
    slower: number;
  };
  
  easing: {
    linear: string;
    easeIn: string;
    easeOut: string;
    easeInOut: string;
    sharp: string;
    emphasized: string;
  };
  
  spring: {
    gentle: {
      damping: number;
      stiffness: number;
      mass: number;
    };
    wobbly: {
      damping: number;
      stiffness: number;
      mass: number;
    };
    stiff: {
      damping: number;
      stiffness: number;
      mass: number;
    };
  };
}

export interface ComponentStyles {
  button: {
    base: ViewStyle;
    sizes: {
      sm: ViewStyle;
      md: ViewStyle;
      lg: ViewStyle;
      xl: ViewStyle;
    };
    variants: {
      primary: ViewStyle;
      secondary: ViewStyle;
      ghost: ViewStyle;
      danger: ViewStyle;
    };
  };
  
  card: {
    base: ViewStyle;
    variants: {
      elevated: ViewStyle;
      bordered: ViewStyle;
      gradient: ViewStyle;
      progress: ViewStyle;
    };
  };
  
  input: {
    base: ViewStyle & TextStyle;
    states: {
      focus: ViewStyle;
      error: ViewStyle;
      success: ViewStyle;
      disabled: ViewStyle;
    };
    withIcon: ViewStyle;
  };
  
  badge: {
    base: ViewStyle & TextStyle;
    variants: {
      primary: ViewStyle & TextStyle;
      secondary: ViewStyle & TextStyle;
      success: ViewStyle & TextStyle;
      warning: ViewStyle & TextStyle;
      error: ViewStyle & TextStyle;
      neutral: ViewStyle & TextStyle;
    };
  };
  
  modal: {
    backdrop: ViewStyle;
    content: ViewStyle;
    bottomSheet: ViewStyle;
    centered: ViewStyle;
  };
  
  navigation: {
    tabBar: ViewStyle;
    header: ViewStyle;
    tabIndicator: ViewStyle;
  };
}

export interface BreakpointConfig {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
}

export interface ResponsiveValue<T> {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  '2xl'?: T;
}

export interface Theme {
  mode: ThemeMode;
  colors: ColorPalette;
  typography: TypographyScale;
  spacing: SpacingScale;
  shadows: ShadowLevels;
  borders: BorderRadius;
  animations: AnimationConfig;
  components: ComponentStyles;
  breakpoints: BreakpointConfig;
}

// Utility types
export type ColorKey = keyof ColorPalette;
export type SpacingKey = keyof SpacingScale;
export type ShadowKey = keyof ShadowLevels;
export type BorderKey = keyof BorderRadius;
export type TypographyStyleKey = keyof TypographyScale['styles'];
export type ComponentKey = keyof ComponentStyles;

// Platform-specific types
export interface PlatformStyles {
  ios: ViewStyle & TextStyle;
  android: ViewStyle & TextStyle;
  default: ViewStyle & TextStyle;
}

// Theme context types
export interface ThemeContextValue {
  theme: Theme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  isDark: boolean;
  colors: ColorPalette;
  spacing: SpacingScale;
  typography: TypographyScale;
  shadows: ShadowLevels;
  borders: BorderRadius;
  components: ComponentStyles;
  animations: AnimationConfig;
} 