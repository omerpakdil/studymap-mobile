import React from 'react';
import { View, ViewStyle } from 'react-native';

import { useTheme } from '@/themes';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'bordered' | 'gradient' | 'progress' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'elevated',
  padding = 'md',
  style,
}) => {
  const { colors, spacing, shadows, borders } = useTheme();

  // Base card styles
  const baseStyles: ViewStyle = {
    borderRadius: borders.lg,
    backgroundColor: colors.neutral[0],
  };

  // Padding styles
  const getPaddingStyles = (): ViewStyle => {
    switch (padding) {
      case 'none':
        return {};
      case 'sm':
        return { padding: spacing[2] };
      case 'md':
        return { padding: spacing[4] };
      case 'lg':
        return { padding: spacing[6] };
      default:
        return { padding: spacing[4] };
    }
  };

  // Variant-specific styles
  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          ...shadows.md,
        };
      case 'bordered':
        return {
          borderWidth: 1,
          borderColor: colors.neutral[200],
          ...shadows.xs,
        };
      case 'gradient':
        return {
          // Modern gradient background
          backgroundColor: colors.primary[500],
          borderWidth: 0,
          ...shadows.lg,
        };
      case 'progress':
        return {
          borderRadius: borders.xl,
          padding: spacing[5],
          ...shadows.md,
        };
      case 'glass':
        return {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.2)',
          ...shadows.glass,
        };
      default:
        return {};
    }
  };

  const cardStyles = [
    baseStyles,
    getPaddingStyles(),
    getVariantStyles(),
    style,
  ].filter(Boolean);

  return (
    <View style={cardStyles}>
      {children}
    </View>
  );
};

export default Card; 