// Color System
// StudyMap harmonious color palette inspired by popular lifestyle & education apps

import { ColorPalette } from './types';

// Light Theme Colors - Lifestyle & Education App Inspired
export const lightColors: ColorPalette = {
  // Primary - Soft Blue (Inspired by Duolingo, Coursera, Khan Academy)
  primary: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6', // Primary Brand - Trustworthy Soft Blue
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },
  
  // Secondary - Coral Peach (Inspired by Instagram, Pinterest, lifestyle apps)
  secondary: {
    50: '#FFF7ED',
    100: '#FFEDD5',
    200: '#FED7AA',
    300: '#FDBA74',
    400: '#FB923C',
    500: '#F97316', // Warm Coral - Friendly & engaging
    600: '#EA580C',
    700: '#C2410C',
    800: '#9A3412',
    900: '#7C2D12',
  },
  
  // Accent - Sage Green (Inspired by Headspace, Calm, wellness apps)
  accent: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E', // Sage Green - Calming & natural
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
  },
  
  success: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
  },
  
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },
  
  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },
  
  // Neutral system - Clean and modern like popular apps
  neutral: {
    0: '#FFFFFF',   // Pure White
    25: '#FEFEFE',  // Soft White
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
    950: '#030712', // Text Ultra
  },
  
  // Moonlit Grey - Cool sophisticated grays (like Apple, Google apps)
  moonlit: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B', // Cool Gray
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },
  
  // Harmonious gradients inspired by successful apps
  gradients: {
    primary: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 50%, #1D4ED8 100%)',
    secondary: 'linear-gradient(135deg, #FB923C 0%, #F97316 50%, #EA580C 100%)',
    ethereal: 'linear-gradient(135deg, #4ADE80 0%, #22C55E 50%, #16A34A 100%)',
    subtle: 'linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)',
    glass: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.2) 100%)',
    sunset: 'linear-gradient(135deg, #3B82F6 0%, #F97316 50%, #22C55E 100%)',
    luxury: 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 25%, #3B82F6 50%, #F97316 75%, #FB923C 100%)',
  },
};

// Dark Theme Colors - Lifestyle & Education App Inspired
export const darkColors: ColorPalette = {
  // Primary - Brighter blue for dark mode
  primary: {
    50: '#1E3A8A',
    100: '#1E40AF',
    200: '#1D4ED8',
    300: '#2563EB',
    400: '#3B82F6',
    500: '#60A5FA', // Adjusted for dark mode visibility
    600: '#93C5FD',
    700: '#BFDBFE',
    800: '#DBEAFE',
    900: '#EFF6FF',
  },
  
  // Secondary - Warmer coral for dark
  secondary: {
    50: '#7C2D12',
    100: '#9A3412',
    200: '#C2410C',
    300: '#EA580C',
    400: '#F97316',
    500: '#FB923C', // Brighter for dark mode
    600: '#FDBA74',
    700: '#FED7AA',
    800: '#FFEDD5',
    900: '#FFF7ED',
  },
  
  // Accent - Brighter sage green for dark
  accent: {
    50: '#14532D',
    100: '#166534',
    200: '#15803D',
    300: '#16A34A',
    400: '#22C55E',
    500: '#4ADE80', // Brighter for dark mode
    600: '#86EFAC',
    700: '#BBF7D0',
    800: '#DCFCE7',
    900: '#F0FDF4',
  },
  
  success: {
    50: '#14532D',
    100: '#166534',
    200: '#15803D',
    300: '#16A34A',
    400: '#22C55E',
    500: '#4ADE80',
    600: '#86EFAC',
    700: '#BBF7D0',
    800: '#DCFCE7',
    900: '#F0FDF4',
  },
  
  warning: {
    50: '#78350F',
    100: '#92400E',
    200: '#B45309',
    300: '#D97706',
    400: '#F59E0B',
    500: '#FBBF24',
    600: '#FCD34D',
    700: '#FDE68A',
    800: '#FEF3C7',
    900: '#FFFBEB',
  },
  
  error: {
    50: '#7F1D1D',
    100: '#991B1B',
    200: '#B91C1C',
    300: '#DC2626',
    400: '#EF4444',
    500: '#F87171',
    600: '#FCA5A5',
    700: '#FECACA',
    800: '#FEE2E2',
    900: '#FEF2F2',
  },
  
  // Dark neutral system - Modern dark tones
  neutral: {
    0: '#000000',   // Pure Black
    25: '#030712',  // Near Black
    50: '#111827',  // Background Dark
    100: '#1F2937', // Surface Dark
    200: '#374151', // Border Dark
    300: '#4B5563', // Divider Dark
    400: '#6B7280', // Text Disabled Dark
    500: '#9CA3AF', // Text Secondary Dark
    600: '#D1D5DB', // Text Primary Dark
    700: '#E5E7EB', // Text Strong Dark
    800: '#F3F4F6', // Text Emphasis Dark
    900: '#F9FAFB', // Text Maximum Dark
    950: '#FFFFFF', // Text Ultra Dark
  },
  
  // Moonlit Grey for dark mode
  moonlit: {
    50: '#0F172A',
    100: '#1E293B',
    200: '#334155',
    300: '#475569',
    400: '#64748B',
    500: '#94A3B8',
    600: '#CBD5E1',
    700: '#E2E8F0',
    800: '#F1F5F9',
    900: '#F8FAFC',
  },
  
  // Harmonious dark mode gradients
  gradients: {
    primary: 'linear-gradient(135deg, #60A5FA 0%, #93C5FD 50%, #BFDBFE 100%)',
    secondary: 'linear-gradient(135deg, #FB923C 0%, #FDBA74 50%, #FED7AA 100%)',
    ethereal: 'linear-gradient(135deg, #4ADE80 0%, #86EFAC 50%, #BBF7D0 100%)',
    subtle: 'linear-gradient(135deg, #1F2937 0%, #374151 100%)',
    glass: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.1) 100%)',
    sunset: 'linear-gradient(135deg, #60A5FA 0%, #FB923C 50%, #4ADE80 100%)',
    luxury: 'linear-gradient(135deg, #93C5FD 0%, #BFDBFE 25%, #60A5FA 50%, #FDBA74 75%, #FB923C 100%)',
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
  
  // Glass effect colors
  glass: {
    light: 'rgba(255, 255, 255, 0.8)',
    dark: 'rgba(0, 0, 0, 0.8)',
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
  
  divider: {
    light: lightColors.neutral[300],
    dark: darkColors.neutral[300],
  },
};

// Popular app-inspired color combinations
export const popularCombinations = {
  // Duolingo inspired - Blue + Green
  learningFocus: {
    primary: lightColors.primary[500],    // Soft Blue
    secondary: lightColors.accent[500],   // Sage Green
    accent: lightColors.neutral[500],     // Cool Gray
  },
  
  // Instagram/Pinterest inspired - Blue + Coral
  socialEngagement: {
    primary: lightColors.primary[500],    // Soft Blue
    secondary: lightColors.secondary[500], // Coral
    accent: lightColors.moonlit[300],     // Light Gray
  },
  
  // Headspace inspired - Green + Orange/Coral
  wellnessWarmth: {
    primary: lightColors.accent[500],     // Sage Green
    secondary: lightColors.secondary[500], // Coral
    accent: lightColors.primary[300],     // Light Blue
  },
  
  // Modern app style - Cool professional
  modernProfessional: {
    primary: lightColors.primary[600],    // Deep Blue
    secondary: lightColors.moonlit[500],  // Cool Gray
    accent: lightColors.secondary[400],   // Soft Coral
  },
};

export default {
  light: lightColors,
  dark: darkColors,
  semantic: semanticColors,
  popular: popularCombinations,
}; 