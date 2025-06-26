import React from 'react';
import { Text as RNText, TextStyle } from 'react-native';

import { useTheme } from '@/themes';

export interface TextProps {
  children: React.ReactNode;
  variant?: 'display' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'bodyLg' | 'body' | 'bodySm' | 'label' | 'caption' | 'overline' | 'code';
  color?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error' | 'neutral-900' | 'neutral-600' | 'neutral-400' | 'neutral-500' | 'moonlit';
  align?: 'left' | 'center' | 'right';
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
  style?: TextStyle;
}

export const Text: React.FC<TextProps> = ({
  children,
  variant = 'body',
  color = 'neutral-900',
  align = 'left',
  weight,
  style,
}) => {
  const { colors, typography } = useTheme();

  // Get typography style based on variant
  const getVariantStyle = (): TextStyle => {
    return typography.styles[variant] || typography.styles.body;
  };

  // Get color based on color prop
  const getTextColor = (): string => {
    switch (color) {
      case 'primary':
        return colors.primary[500];
      case 'secondary':
        return colors.secondary[500];
      case 'accent':
        return colors.accent[500];
      case 'success':
        return colors.success[500];
      case 'warning':
        return colors.warning[500];
      case 'error':
        return colors.error[500];
      case 'neutral-900':
        return colors.neutral[900];
      case 'neutral-600':
        return colors.neutral[600];
      case 'neutral-500':
        return colors.neutral[500];
      case 'neutral-400':
        return colors.neutral[400];
      case 'moonlit':
        return colors.moonlit[500];
      default:
        return colors.neutral[900];
    }
  };

  // Get font weight
  const getFontWeight = () => {
    if (weight) {
      return typography.fontWeight[weight];
    }
    // Use default weight from variant style
    return getVariantStyle().fontWeight || typography.fontWeight.normal;
  };

  const textStyles = [
    getVariantStyle(),
    {
      color: getTextColor(),
      textAlign: align,
      fontWeight: getFontWeight(),
    },
    style,
  ].filter(Boolean);

  return (
    <RNText style={textStyles}>
      {children}
    </RNText>
  );
};

export default Text; 