// Color System
// StudyMap color palette for light and dark themes

import { ColorPalette } from './types';

// Light Theme Colors
export const lightColors: ColorPalette = {
  primary: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#6366F1', // Primary Brand
    600: '#4F46E5',
    700: '#4338CA',
    800: '#3730A3',
    900: '#312E81',
  },
  
  secondary: {
    50: '#F5F3FF',
    100: '#EDE9FE',
    200: '#DDD6FE',
    300: '#C4B5FD',
    400: '#A78BFA',
    500: '#8B5CF6', // Secondary Brand
    600: '#7C3AED',
    700: '#6D28D9',
    800: '#5B21B6',
    900: '#4C1D95',
  },
  
  success: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    500: '#10B981', // Primary Success
    600: '#059669',
    700: '#047857',
  },
  
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    500: '#F59E0B', // Primary Warning
    600: '#D97706',
    700: '#B45309',
  },
  
  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    500: '#EF4444', // Primary Error
    600: '#DC2626',
    700: '#B91C1C',
  },
  
  info: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    500: '#3B82F6', // Primary Info
    600: '#2563EB',
    700: '#1D4ED8',
  },
  
  neutral: {
    0: '#FFFFFF',   // Pure White
    50: '#F9FAFB',  // Background Light
    100: '#F3F4F6', // Surface Light
    200: '#E5E7EB', // Border Light
    300: '#D1D5DB', // Divider
    400: '#9CA3AF', // Text Disabled
    500: '#6B7280', // Text Secondary
    600: '#4B5563', // Text Primary
    700: '#374151', // Text Strong
    800: '#1F2937', // Text Emphasis
    900: '#111827', // Text Maximum
  },
  
  gradients: {
    primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    secondary: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
    success: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    subtle: 'linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)',
  },
};

// Dark Theme Colors
export const darkColors: ColorPalette = {
  primary: {
    50: '#312E81',
    100: '#3730A3',
    200: '#4338CA',
    300: '#4F46E5',
    400: '#6366F1',
    500: '#8B8CF6', // Primary Brand (lighter for dark theme)
    600: '#A5B4FC',
    700: '#C7D2FE',
    800: '#E0E7FF',
    900: '#EEF2FF',
  },
  
  secondary: {
    50: '#4C1D95',
    100: '#5B21B6',
    200: '#6D28D9',
    300: '#7C3AED',
    400: '#8B5CF6',
    500: '#A78BFA', // Secondary Brand (lighter for dark theme)
    600: '#C4B5FD',
    700: '#DDD6FE',
    800: '#EDE9FE',
    900: '#F5F3FF',
  },
  
  success: {
    50: '#047857',
    100: '#059669',
    500: '#34D399', // Primary Success (lighter for dark theme)
    600: '#6EE7B7',
    700: '#A7F3D0',
  },
  
  warning: {
    50: '#B45309',
    100: '#D97706',
    500: '#FBBF24', // Primary Warning (lighter for dark theme)
    600: '#FCD34D',
    700: '#FDE68A',
  },
  
  error: {
    50: '#B91C1C',
    100: '#DC2626',
    500: '#F87171', // Primary Error (lighter for dark theme)
    600: '#FCA5A5',
    700: '#FECACA',
  },
  
  info: {
    50: '#1D4ED8',
    100: '#2563EB',
    500: '#60A5FA', // Primary Info (lighter for dark theme)
    600: '#93C5FD',
    700: '#BFDBFE',
  },
  
  neutral: {
    0: '#000000',   // Pure Black
    50: '#0F172A',  // Background Dark
    100: '#1E293B', // Surface Dark
    200: '#334155', // Border Dark
    300: '#475569', // Divider Dark
    400: '#64748B', // Text Disabled Dark
    500: '#94A3B8', // Text Secondary Dark
    600: '#CBD5E1', // Text Primary Dark
    700: '#E2E8F0', // Text Strong Dark
    800: '#F1F5F9', // Text Emphasis Dark
    900: '#F8FAFC', // Text Maximum Dark
  },
  
  gradients: {
    primary: 'linear-gradient(135deg, #8B8CF6 0%, #A78BFA 100%)',
    secondary: 'linear-gradient(135deg, #A78BFA 0%, #8B8CF6 100%)',
    success: 'linear-gradient(135deg, #34D399 0%, #6EE7B7 100%)',
    subtle: 'linear-gradient(135deg, #1F2937 0%, #111827 100%)',
  },
};

// Semantic color mappings for easy access
export const semanticColors = {
  // Background colors
  background: {
    light: lightColors.neutral[0],
    dark: darkColors.neutral[50],
  },
  
  surface: {
    light: lightColors.neutral[50],
    dark: darkColors.neutral[100],
  },
  
  // Text colors
  text: {
    primary: {
      light: lightColors.neutral[900],
      dark: darkColors.neutral[900],
    },
    secondary: {
      light: lightColors.neutral[600],
      dark: darkColors.neutral[600],
    },
    disabled: {
      light: lightColors.neutral[400],
      dark: darkColors.neutral[400],
    },
  },
  
  // Border colors
  border: {
    light: lightColors.neutral[200],
    dark: darkColors.neutral[200],
  },
  
  // Status colors (consistent across themes)
  status: {
    success: lightColors.success[500],
    warning: lightColors.warning[500],
    error: lightColors.error[500],
    info: lightColors.info[500],
  },
};

// Study-specific color mappings
export const studyColors = {
  // Subject color coding
  subjects: {
    math: '#FF6B6B',      // Red
    science: '#4ECDC4',   // Teal
    english: '#45B7D1',   // Blue
    history: '#96CEB4',   // Green
    language: '#FFEAA7',  // Yellow
    arts: '#DDA0DD',      // Purple
    default: lightColors.neutral[400],
  },
  
  // Progress indicators
  progress: {
    excellent: lightColors.success[500],   // 90-100%
    good: '#22C55E',                       // 80-89%
    average: lightColors.warning[500],     // 70-79%
    poor: '#EF4444',                       // 60-69%
    failing: lightColors.error[600],       // <60%
  },
  
  // Study session states
  session: {
    active: lightColors.primary[500],
    break: lightColors.warning[500],
    complete: lightColors.success[500],
    overdue: lightColors.error[500],
  },
  
  // Calendar heat map
  heatmap: {
    none: lightColors.neutral[100],
    low: lightColors.primary[100],
    medium: lightColors.primary[300],
    high: lightColors.primary[500],
    very_high: lightColors.primary[700],
  },
};

// Export default colors (light theme)
const colors = lightColors;
export default colors; 