// StudyMap Theme System
// Central export point for all theme-related modules

export { default as animations } from './animations';
export { default as borders } from './borders';
export { default as colors } from './colors';
export { default as components } from './components';
export { default as platformStyles } from './platform';
export {
    ThemeProvider, useColors, useIsDark, useSpacing, useTheme, useThemedStyles, useThemeMode, useTypography, withTheme,
    type Theme
} from './provider';
export { default as shadows } from './shadows';
export { default as spacing } from './spacing';
export { default as typography } from './typography';

// Theme types
export type {
    AnimationConfig, BorderRadius, ColorPalette, ComponentStyles, ShadowLevels, SpacingScale, ThemeMode, TypographyScale
} from './types';

// Utility functions
export { createThemedStyles, getResponsiveValue } from './utils';

// Default theme configurations
export { darkTheme, lightTheme } from './config';
