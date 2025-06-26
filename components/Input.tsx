import React, { useState } from 'react';
import { Text, TextInput, TextStyle, View, ViewStyle } from 'react-native';

import { useTheme } from '@/themes';

export interface InputProps {
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  success?: string;
  helperText?: string;  // New helper text prop
  disabled?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  secureTextEntry?: boolean;
  style?: ViewStyle;
  inputStyle?: TextStyle;
}

export const Input: React.FC<InputProps> = ({
  value,
  onChangeText,
  placeholder,
  label,
  error,
  success,
  helperText,
  disabled = false,
  multiline = false,
  numberOfLines = 1,
  keyboardType = 'default',
  secureTextEntry = false,
  style,
  inputStyle,
}) => {
  const { colors, typography, spacing } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  // Container styles
  const containerStyles: ViewStyle = {
    marginBottom: spacing[4],
  };

  // Label styles
  const labelStyles: TextStyle = {
    ...typography.styles.label,
    color: colors.neutral[700],
    marginBottom: spacing[1],
  };

  // Input container styles
  const getInputContainerStyles = (): ViewStyle => {
    const baseStyles: ViewStyle = {
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[3],
      minHeight: 44,
    };

    if (disabled) {
      return {
        ...baseStyles,
        backgroundColor: colors.neutral[100],
        borderColor: colors.neutral[200],
        opacity: 0.6,
      };
    }

    if (error) {
      return {
        ...baseStyles,
        backgroundColor: colors.error[50],
        borderColor: colors.error[500],
        borderWidth: 1,
      };
    }

    if (success) {
      return {
        ...baseStyles,
        backgroundColor: colors.success[50],
        borderColor: colors.success[500],
        borderWidth: 1,
      };
    }

    if (isFocused) {
      return {
        ...baseStyles,
        backgroundColor: colors.primary[50],
        borderColor: colors.primary[500],
        borderWidth: 2,
      };
    }

    return {
      ...baseStyles,
      backgroundColor: colors.neutral[0],
      borderColor: colors.neutral[200],
    };
  };

  // Input text styles
  const getInputTextStyles = (): TextStyle => {
    return {
      ...typography.styles.body,
      color: disabled ? colors.neutral[400] : colors.neutral[900],
      flex: 1,
    };
  };

  // Helper text styles
  const getHelperTextStyles = (): TextStyle => {
    return {
      ...typography.styles.caption,
      color: error ? colors.error[500] : success ? colors.success[500] : colors.neutral[500],
      marginTop: spacing[1],
    };
  };

  const displayHelperText = error || success || helperText;

  return (
    <View style={[containerStyles, style]}>
      {label && (
        <Text style={labelStyles}>
          {label}
        </Text>
      )}
      
      <View style={getInputContainerStyles()}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.neutral[400]}
          editable={!disabled}
          multiline={multiline}
          numberOfLines={numberOfLines}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[getInputTextStyles(), inputStyle]}
        />
      </View>

      {displayHelperText && (
        <Text style={getHelperTextStyles()}>
          {displayHelperText}
        </Text>
      )}
    </View>
  );
};

export default Input; 