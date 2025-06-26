// Theme Configuration
// Complete light and dark theme objects for StudyMap

import animations from './animations';
import borders from './borders';
import { darkColors, lightColors } from './colors';
import components from './components';
import shadows from './shadows';
import spacing from './spacing';
import { Theme } from './types';
import typography from './typography';
import { defaultBreakpoints } from './utils';

// Light theme configuration
export const lightTheme: Theme = {
  mode: 'light',
  colors: lightColors,
  typography,
  spacing,
  shadows,
  borders,
  animations,
  components,
  breakpoints: defaultBreakpoints,
};

// Dark theme configuration
export const darkTheme: Theme = {
  mode: 'dark',
  colors: darkColors,
  typography,
  spacing,
  shadows,
  borders,
  animations,
  components,
  breakpoints: defaultBreakpoints,
};

// Default theme (light)
export const defaultTheme = lightTheme;

// Theme configurations for easy switching
export const themes = {
  light: lightTheme,
  dark: darkTheme,
} as const;

// Theme configuration options
export const themeConfig = {
  // Animation settings
  animations: {
    enabled: true,
    reducedMotion: false,
    duration: {
      fast: 150,
      normal: 250,
      slow: 400,
    },
  },
  
  // Typography settings
  typography: {
    scale: 1, // Font scaling factor
    fontLoadingStrategy: 'swap', // Font loading strategy
  },
  
  // Color settings
  colors: {
    useSystemAccentColor: false, // Use system accent color if available
    highContrast: false, // High contrast mode
  },
  
  // Layout settings
  layout: {
    containerMaxWidth: 1200, // Max container width
    gridColumns: 12, // Grid system columns
  },
  
  // Developer settings
  development: {
    showThemeDebugger: false, // Show theme debugger
    logThemeChanges: false, // Log theme changes
  },
};

// Platform-specific theme overrides
export const platformThemeOverrides = {
  // iOS specific overrides
  ios: {
    typography: {
      fontFamily: {
        primary: 'SF Pro Text',
        display: 'SF Pro Display',
      },
    },
    shadows: {
      // iOS shadows tend to be more subtle
      card: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
    },
  },
  
  // Android specific overrides
  android: {
    typography: {
      fontFamily: {
        primary: 'Roboto',
        display: 'Roboto',
      },
    },
    shadows: {
      // Android uses elevation instead of shadows
      card: {
        elevation: 2,
      },
    },
  },
};

// Theme validation
export const validateTheme = (theme: any): theme is Theme => {
  const requiredKeys: (keyof Theme)[] = [
    'mode',
    'colors', 
    'typography',
    'spacing',
    'shadows',
    'borders',
    'animations',
    'components',
    'breakpoints',
  ];
  
  return requiredKeys.every(key => key in theme);
};

// Create custom theme by merging with base theme
export const createCustomTheme = (
  baseTheme: Theme,
  overrides: Partial<Theme>
): Theme => {
  return {
    ...baseTheme,
    ...overrides,
    colors: {
      ...baseTheme.colors,
      ...overrides.colors,
    },
    typography: {
      ...baseTheme.typography,
      ...overrides.typography,
    },
    spacing: {
      ...baseTheme.spacing,
      ...overrides.spacing,
    },
    shadows: {
      ...baseTheme.shadows,
      ...overrides.shadows,
    },
    borders: {
      ...baseTheme.borders,
      ...overrides.borders,
    },
    animations: {
      ...baseTheme.animations,
      ...overrides.animations,
    },
    components: {
      ...baseTheme.components,
      ...overrides.components,
    },
    breakpoints: {
      ...baseTheme.breakpoints,
      ...overrides.breakpoints,
    },
  };
};

// Theme presets for quick setup
export const themePresets = {
  // Minimal theme with reduced visual elements
  minimal: createCustomTheme(lightTheme, {
    shadows: {
      ...lightTheme.shadows,
      sm: { shadowOpacity: 0 },
      md: { shadowOpacity: 0 },
      lg: { shadowOpacity: 0 },
      xl: { shadowOpacity: 0 },
    },
    borders: {
      ...lightTheme.borders,
      lg: 4,
      xl: 4,
    },
  }),
  
  // High contrast theme for accessibility
  highContrast: createCustomTheme(lightTheme, {
    colors: {
      ...lightTheme.colors,
      primary: {
        ...lightTheme.colors.primary,
        500: '#000000',
      },
      neutral: {
        ...lightTheme.colors.neutral,
        600: '#000000',
        700: '#000000',
        800: '#000000',
        900: '#000000',
      },
    },
  }),
  
  // Colorful theme with vibrant colors
  vibrant: createCustomTheme(lightTheme, {
    colors: {
      ...lightTheme.colors,
      primary: {
        ...lightTheme.colors.primary,
        500: '#FF6B35',
      },
      secondary: {
        ...lightTheme.colors.secondary,
        500: '#F7931E',
      },
    },
  }),
};

// Export theme metadata
export const themeMetadata = {
  version: '1.0.0',
  lastUpdated: new Date().toISOString(),
  supportedPlatforms: ['ios', 'android', 'web'],
  features: [
    'Dark mode support',
    'Responsive design',
    'Accessibility compliant',
    'Platform-specific optimizations',
    'Animation system',
    'Component variants',
  ],
}; 