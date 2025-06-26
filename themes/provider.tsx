// Theme Provider
// React context for theme management and dark mode switching

import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';

import { darkTheme, lightTheme } from './config';
import { Theme, ThemeContextValue, ThemeMode } from './types';

// Theme storage key (for future AsyncStorage integration)
const THEME_STORAGE_KEY = '@studymap_theme_mode';

// Create theme context
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// Theme provider props
interface ThemeProviderProps {
  children: ReactNode;
  initialMode?: ThemeMode;
}

// Theme provider component
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  initialMode = 'auto' 
}) => {
  const [mode, setModeState] = useState<ThemeMode>(initialMode);
  const [systemColorScheme, setSystemColorScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme()
  );

  // Listen to system color scheme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme);
    });

    return () => subscription.remove();
  }, []);

  // Set theme mode (without persistence for now)
  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    // TODO: Add AsyncStorage persistence when package is available
    // AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
  };

  // Toggle between light and dark mode
  const toggleMode = () => {
    const newMode = isDark ? 'light' : 'dark';
    setMode(newMode);
  };

  // Determine if dark mode should be active
  const isDark = mode === 'dark' || (mode === 'auto' && systemColorScheme === 'dark');
  
  // Get current theme based on mode
  const theme: Theme = isDark ? darkTheme : lightTheme;

  // Context value
  const contextValue: ThemeContextValue = {
    theme,
    mode,
    setMode,
    toggleMode,
    isDark,
    colors: theme.colors,
    spacing: theme.spacing,
    typography: theme.typography,
    shadows: theme.shadows,
    borders: theme.borders,
    components: theme.components,
    animations: theme.animations,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook to use theme context
export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
};

// Hook to get current colors
export const useColors = () => {
  const { colors } = useTheme();
  return colors;
};

// Hook to get current spacing
export const useSpacing = () => {
  const { spacing } = useTheme();
  return spacing;
};

// Hook to get current typography
export const useTypography = () => {
  const { typography } = useTheme();
  return typography;
};

// Hook to check if dark mode is active
export const useIsDark = () => {
  const { isDark } = useTheme();
  return isDark;
};

// Hook to get theme mode controls
export const useThemeMode = () => {
  const { mode, setMode, toggleMode } = useTheme();
  return { mode, setMode, toggleMode };
};

// HOC for components that need theme
export const withTheme = <P extends object>(
  Component: React.ComponentType<P & { theme: Theme }>
) => {
  const ThemedComponent = (props: P) => {
    const { theme } = useTheme();
    return <Component {...props} theme={theme} />;
  };
  
  ThemedComponent.displayName = `withTheme(${Component.displayName || Component.name})`;
  return ThemedComponent;
};

// Hook for component-specific themed styles
export const useThemedStyles = <T extends Record<string, any>>(
  styleFactory: (theme: Theme) => T
): T => {
  const { theme } = useTheme();
  return React.useMemo(() => styleFactory(theme), [theme, styleFactory]);
};

// Export types for external use
export type { Theme, ThemeContextValue, ThemeMode };
