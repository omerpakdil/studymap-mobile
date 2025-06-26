// Example Components
// Demonstrates how to use the StudyMap theme system

import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    useColors,
    useSpacing,
    useTheme,
    useThemedStyles,
    useThemeMode,
    useTypography,
} from '../index';

// Example 1: Basic themed component
export const ThemedCard: React.FC<{
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  variant?: 'elevated' | 'bordered' | 'gradient';
}> = ({ title, subtitle, children, variant = 'elevated' }) => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createCardStyles);

  return (
    <View style={[styles.card, styles[variant]]}>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {children}
    </View>
  );
};

const createCardStyles = (theme: any) =>
  StyleSheet.create({
    card: {
      ...theme.components.card.base,
      backgroundColor: theme.colors.neutral[0],
      borderColor: theme.colors.neutral[200],
    },
    elevated: {
      ...theme.components.card.variants.elevated,
    },
    bordered: {
      ...theme.components.card.variants.bordered,
    },
    gradient: {
      ...theme.components.card.variants.gradient,
      backgroundColor: theme.colors.primary[50],
    },
    title: {
      ...theme.typography.styles.h4,
      color: theme.colors.neutral[900],
      marginBottom: theme.spacing[2],
    },
    subtitle: {
      ...theme.typography.styles.bodySm,
      color: theme.colors.neutral[600],
      marginBottom: theme.spacing[3],
    },
  });

// Example 2: Themed button with variants
export const ThemedButton: React.FC<{
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}> = ({ title, onPress, variant = 'primary', size = 'md', disabled = false }) => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createButtonStyles);

  const buttonStyle = [
    styles.button,
    styles[variant],
    styles[size],
    disabled && styles.disabled,
  ];

  const textStyle = [
    styles.text,
    styles[`${variant}Text`],
    disabled && styles.disabledText,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={textStyle}>{title}</Text>
    </TouchableOpacity>
  );
};

const createButtonStyles = (theme: any) =>
  StyleSheet.create({
    button: {
      ...theme.components.button.base,
      justifyContent: 'center',
      alignItems: 'center',
    },
    // Sizes
    sm: theme.components.button.sizes.sm,
    md: theme.components.button.sizes.md,
    lg: theme.components.button.sizes.lg,
    // Variants
    primary: {
      backgroundColor: theme.colors.primary[500],
      borderColor: theme.colors.primary[500],
    },
    secondary: {
      backgroundColor: 'transparent',
      borderColor: theme.colors.primary[500],
      borderWidth: 1,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
    },
    danger: {
      backgroundColor: theme.colors.error[500],
      borderColor: theme.colors.error[500],
    },
    disabled: {
      opacity: 0.5,
    },
    // Text styles
    text: {
      fontFamily: theme.typography.fontFamily.primary,
      fontWeight: '500',
      textAlign: 'center',
    },
    primaryText: {
      color: theme.colors.neutral[0],
    },
    secondaryText: {
      color: theme.colors.primary[500],
    },
    ghostText: {
      color: theme.colors.primary[500],
    },
    dangerText: {
      color: theme.colors.neutral[0],
    },
    disabledText: {
      opacity: 0.7,
    },
  });

// Example 3: Study progress card using theme
export const StudyProgressCard: React.FC<{
  subject: string;
  progress: number;
  totalHours: number;
  completedHours: number;
}> = ({ subject, progress, totalHours, completedHours }) => {
  const colors = useColors();
  const spacing = useSpacing();
  const typography = useTypography();

  return (
    <View
      style={{
        backgroundColor: colors.neutral[0],
        borderRadius: 16,
        padding: spacing[4],
        marginBottom: spacing[3],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing[3],
        }}
      >
        <Text
          style={{
            ...typography.styles.h4,
            color: colors.neutral[900],
          }}
        >
          {subject}
        </Text>
        <Text
          style={{
            ...typography.styles.label,
            color: colors.primary[500],
          }}
        >
          {progress}%
        </Text>
      </View>

      {/* Progress bar */}
      <View
        style={{
          height: 8,
          backgroundColor: colors.neutral[200],
          borderRadius: 4,
          marginBottom: spacing[2],
        }}
      >
        <View
          style={{
            height: '100%',
            width: `${progress}%`,
            backgroundColor: colors.primary[500],
            borderRadius: 4,
          }}
        />
      </View>

      {/* Stats */}
      <Text
        style={{
          ...typography.styles.bodySm,
          color: colors.neutral[600],
        }}
      >
        {completedHours} of {totalHours} hours completed
      </Text>
    </View>
  );
};

// Example 4: Theme toggle component
export const ThemeToggle = () => {
  const { mode, toggleMode } = useThemeMode();
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      style={{
        backgroundColor: theme.colors.neutral[100],
        borderRadius: theme.borders.full,
        padding: theme.spacing[3],
        alignItems: 'center',
        justifyContent: 'center',
        width: 50,
        height: 50,
      }}
      onPress={toggleMode}
    >
      <Text style={{ fontSize: 20 }}>
        {mode === 'dark' || (mode === 'auto' && theme.mode === 'dark') ? '🌙' : '☀️'}
      </Text>
    </TouchableOpacity>
  );
};

// Example 5: Themed input component
export const ThemedInput: React.FC<{
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  label?: string;
}> = ({ placeholder, value, onChangeText, error, label }) => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createInputStyles);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, error && styles.inputError]}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.neutral[400]}
        value={value}
        onChangeText={onChangeText}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const createInputStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      marginBottom: theme.spacing[4],
    },
    label: {
      ...theme.typography.styles.label,
      color: theme.colors.neutral[700],
      marginBottom: theme.spacing[2],
    },
    input: {
      ...theme.components.input.base,
      backgroundColor: theme.colors.neutral[0],
      borderColor: theme.colors.neutral[200],
      color: theme.colors.neutral[900],
    },
    inputError: {
      borderColor: theme.colors.error[500],
    },
    error: {
      ...theme.typography.styles.caption,
      color: theme.colors.error[500],
      marginTop: theme.spacing[1],
    },
  });

// Example 6: Complete screen example
export const ExampleScreen = () => {
  const [inputValue, setInputValue] = React.useState('');
  const spacing = useSpacing();
  const { theme } = useTheme();

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: theme.colors.neutral[50],
      }}
      contentContainerStyle={{
        padding: spacing[4],
      }}
    >
      {/* Header with theme toggle */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing[6],
        }}
      >
        <Text style={theme.typography.styles.h1}>StudyMap Theme</Text>
        <ThemeToggle />
      </View>

      {/* Progress cards */}
      <StudyProgressCard
        subject="Mathematics"
        progress={75}
        totalHours={40}
        completedHours={30}
      />
      <StudyProgressCard
        subject="Physics"
        progress={60}
        totalHours={35}
        completedHours={21}
      />

      {/* Input example */}
      <ThemedInput
        label="Study Goal"
        placeholder="Enter your study goal..."
        value={inputValue}
        onChangeText={setInputValue}
      />

      {/* Card examples */}
      <ThemedCard title="Elevated Card" subtitle="This card uses elevation shadow">
        <Text style={theme.typography.styles.body}>
          This is an example of using the theme system with pre-built component styles.
        </Text>
      </ThemedCard>

      <ThemedCard
        title="Bordered Card"
        subtitle="This card uses border styling"
        variant="bordered"
      >
        <Text style={theme.typography.styles.body}>
          Different card variants provide visual hierarchy and organization.
        </Text>
      </ThemedCard>

      {/* Button examples */}
      <View
        style={{
          marginTop: spacing[4],
          gap: spacing[3],
        }}
      >
        <ThemedButton
          title="Primary Button"
          onPress={() => console.log('Primary pressed')}
          variant="primary"
        />
        <ThemedButton
          title="Secondary Button"
          onPress={() => console.log('Secondary pressed')}
          variant="secondary"
        />
        <ThemedButton
          title="Ghost Button"
          onPress={() => console.log('Ghost pressed')}
          variant="ghost"
        />
        <ThemedButton
          title="Small Button"
          onPress={() => console.log('Small pressed')}
          size="sm"
        />
      </View>
    </ScrollView>
  );
};

export default ExampleScreen; 