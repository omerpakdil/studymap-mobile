import React from 'react';
import { ActivityIndicator, Text, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';

import { useTheme } from '@/themes';

export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  onPress,
  style,
  textStyle,
}) => {
  const { colors, typography, spacing, shadows, components } = useTheme();

  // Base button styles from theme
  const baseStyles = components.button.base;
  const sizeStyles = components.button.sizes[size];

  // Variant-specific styles
  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: disabled ? colors.neutral[300] : colors.primary[500],
        };
      case 'secondary':
        return {
          backgroundColor: colors.neutral[0],
          borderWidth: 1,
          borderColor: disabled ? colors.neutral[300] : colors.primary[500],
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
        };
      case 'danger':
        return {
          backgroundColor: disabled ? colors.neutral[300] : colors.error[500],
        };
      default:
        return {};
    }
  };

  // Text color based on variant
  const getTextColor = (): string => {
    if (disabled) return colors.neutral[400];
    
    switch (variant) {
      case 'primary':
      case 'danger':
        return colors.neutral[0]; // White text
      case 'secondary':
        return colors.primary[500];
      case 'ghost':
        return colors.primary[500];
      default:
        return colors.neutral[900];
    }
  };

  // Text size based on button size
  const getTextStyle = (): TextStyle => {
    switch (size) {
      case 'sm':
        return typography.styles.bodySm;
      case 'md':
        return typography.styles.body;
      case 'lg':
        return typography.styles.bodyLg;
      case 'xl':
        return typography.styles.h4;
      default:
        return typography.styles.body;
    }
  };

  const buttonStyles = [
    baseStyles,
    sizeStyles,
    getVariantStyles(),
    fullWidth ? { width: '100%' as const } : undefined,
    disabled ? { opacity: 0.6 } : undefined,
    style,
  ].filter(Boolean);

  const textStyles = [
    getTextStyle(),
    {
      color: getTextColor(),
      fontWeight: '600' as const,
    },
    textStyle,
  ].filter(Boolean);

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={getTextColor()} 
        />
      ) : (
        <Text style={textStyles}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export default Button; 