# StudyMap Theme System

A comprehensive, type-safe theme system for React Native applications built with Expo. This theme system provides consistent design tokens, dark mode support, responsive utilities, and platform-specific optimizations.

## Features

- 🎨 **Complete Design System**: Colors, typography, spacing, shadows, borders, and animations
- 🌙 **Dark Mode Support**: Automatic system detection with manual override
- 📱 **Platform Optimized**: iOS and Android specific styles and behaviors
- 📐 **Responsive Design**: Breakpoint-based responsive utilities
- ♿ **Accessibility First**: WCAG AA compliant with reduced motion support
- 🎭 **Component Variants**: Pre-built component styles with multiple variants
- 🚀 **Performance Optimized**: Native driver animations and memoized styles
- 📚 **TypeScript Support**: Fully typed for excellent developer experience

## Quick Start

### 1. Wrap your app with ThemeProvider

```tsx
import React from 'react';
import { ThemeProvider } from './themes';
import App from './App';

export default function Root() {
  return (
    <ThemeProvider initialMode="auto">
      <App />
    </ThemeProvider>
  );
}
```

### 2. Use theme in your components

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme, useThemedStyles } from './themes';

const MyComponent = () => {
  const { colors, spacing } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello StudyMap!</Text>
    </View>
  );
};

const createStyles = (theme) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.neutral[0],
    padding: theme.spacing[4],
    borderRadius: theme.borders.lg,
    ...theme.shadows.sm,
  },
  title: {
    ...theme.typography.styles.h2,
    color: theme.colors.neutral[900],
  },
});
```

## Theme Structure

### Colors

The color system includes primary, secondary, semantic, and neutral colors with a full scale from 50 to 900.

```tsx
import { useColors } from './themes';

const colors = useColors();

// Primary brand colors
colors.primary[500]  // Main brand color
colors.primary[600]  // Darker variant
colors.primary[400]  // Lighter variant

// Semantic colors
colors.success[500]  // Success green
colors.warning[500]  // Warning orange
colors.error[500]    // Error red
colors.info[500]     // Info blue

// Neutral colors
colors.neutral[0]    // White
colors.neutral[900]  // Black
colors.neutral[500]  // Gray

// Gradients
colors.gradients.primary    // Primary gradient
colors.gradients.secondary  // Secondary gradient
```

### Typography

Typography includes font families, sizes, weights, and pre-defined text styles.

```tsx
import { useTypography } from './themes';

const typography = useTypography();

// Font families
typography.fontFamily.primary   // System/Roboto
typography.fontFamily.mono      // Menlo/monospace
typography.fontFamily.display   // SF Pro Display/Roboto

// Font sizes
typography.fontSize.xs    // 12px
typography.fontSize.sm    // 14px
typography.fontSize.base  // 16px
typography.fontSize.lg    // 18px

// Pre-defined styles
typography.styles.h1      // Heading 1
typography.styles.h2      // Heading 2
typography.styles.body    // Body text
typography.styles.caption // Caption text
```

### Spacing

Spacing uses a 4px base unit with consistent scale.

```tsx
import { useSpacing } from './themes';

const spacing = useSpacing();

spacing[0]   // 0px
spacing[1]   // 4px
spacing[2]   // 8px
spacing[4]   // 16px
spacing[6]   // 24px
spacing[8]   // 32px
```

## Component Usage Examples

### Buttons

```tsx
import { useTheme } from './themes';

const Button = ({ variant = 'primary', size = 'md', children }) => {
  const { theme } = useTheme();
  
  const buttonStyle = [
    theme.components.button.base,
    theme.components.button.sizes[size],
    theme.components.button.variants[variant],
    // Apply colors based on variant
    variant === 'primary' && {
      backgroundColor: theme.colors.primary[500],
    },
  ];

  return (
    <TouchableOpacity style={buttonStyle}>
      <Text style={{ color: 'white' }}>{children}</Text>
    </TouchableOpacity>
  );
};
```

### Cards

```tsx
const Card = ({ variant = 'elevated', children }) => {
  const { theme } = useTheme();
  
  const cardStyle = [
    theme.components.card.base,
    theme.components.card.variants[variant],
    {
      backgroundColor: theme.colors.neutral[0],
      borderColor: theme.colors.neutral[200],
    }
  ];

  return (
    <View style={cardStyle}>
      {children}
    </View>
  );
};
```

### Study-specific Components

```tsx
const ProgressRing = ({ progress }) => {
  const { theme } = useTheme();
  
  return (
    <View style={theme.components.progressRing.container}>
      {/* Progress ring implementation */}
      <Text style={theme.components.progressRing.text}>
        {progress}%
      </Text>
    </View>
  );
};
```

## Dark Mode

### Automatic Detection

```tsx
// The theme automatically follows system preference
<ThemeProvider initialMode="auto">
  <App />
</ThemeProvider>
```

### Manual Control

```tsx
import { useThemeMode } from './themes';

const ThemeToggle = () => {
  const { mode, toggleMode, setMode } = useThemeMode();
  
  return (
    <TouchableOpacity onPress={toggleMode}>
      <Text>{mode === 'dark' ? '🌙' : '☀️'}</Text>
    </TouchableOpacity>
  );
};
```

## Responsive Design

### Breakpoint-based Styling

```tsx
import { getResponsiveValue, useTheme } from './themes';

const ResponsiveComponent = () => {
  const { theme } = useTheme();
  
  const fontSize = getResponsiveValue({
    xs: 14,
    sm: 16,
    md: 18,
    lg: 20,
  });
  
  return (
    <Text style={{ fontSize }}>
      Responsive text
    </Text>
  );
};
```

## Animations

### Pre-built Animation Configs

```tsx
import { useTheme } from './themes';
import { Animated } from 'react-native';

const AnimatedButton = () => {
  const { theme } = useTheme();
  const scaleAnim = new Animated.Value(1);
  
  const pressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.95,
      duration: theme.animations.timing.fast,
      useNativeDriver: true,
    }).start();
  };
  
  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      {/* Button content */}
    </Animated.View>
  );
};
```

## Platform-specific Styling

```tsx
import { createPlatformStyle } from './themes';

const platformStyle = createPlatformStyle(
  // iOS style
  {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  // Android style
  {
    elevation: 3,
  }
);
```

## Custom Themes

### Creating Custom Themes

```tsx
import { createCustomTheme, lightTheme } from './themes';

const customTheme = createCustomTheme(lightTheme, {
  colors: {
    ...lightTheme.colors,
    primary: {
      ...lightTheme.colors.primary,
      500: '#FF6B35', // Custom primary color
    },
  },
});
```

### Theme Presets

```tsx
import { themePresets } from './themes';

// Use pre-built theme variations
const minimalTheme = themePresets.minimal;
const highContrastTheme = themePresets.highContrast;
const vibrantTheme = themePresets.vibrant;
```

## Best Practices

### 1. Use Theme Hooks

```tsx
// ✅ Good
const { colors, spacing } = useTheme();

// ❌ Avoid hardcoded values
const styles = {
  padding: 16,
  backgroundColor: '#6366F1',
};
```

### 2. Leverage Component Styles

```tsx
// ✅ Use pre-built component styles
const styles = [
  theme.components.button.base,
  theme.components.button.sizes.md,
];

// ❌ Don't recreate existing patterns
const customButton = {
  paddingHorizontal: 16,
  paddingVertical: 12,
  borderRadius: 8,
  // ... duplicating theme values
};
```

### 3. Responsive Design

```tsx
// ✅ Use responsive utilities
const fontSize = getResponsiveValue({
  xs: theme.typography.fontSize.sm,
  md: theme.typography.fontSize.lg,
});

// ❌ Fixed sizes for all screens
const fontSize = 16;
```

### 4. Platform Optimization

```tsx
// ✅ Use platform-specific styles
const shadow = Platform.select({
  ios: theme.shadows.sm,
  android: { elevation: 2 },
});

// ❌ iOS-only styles on Android
const shadow = theme.shadows.sm; // Won't work well on Android
```

## Accessibility

The theme system includes built-in accessibility features:

- High contrast color options
- Reduced motion support
- Touch target sizes (44px minimum)
- Screen reader compatible text styles
- WCAG AA compliant color contrasts

```tsx
// Reduced motion support
const { animations } = useTheme();
const duration = animations.timing.normal; // Automatically adjusts for reduced motion
```

## Performance Tips

1. **Use Native Driver**: Animations automatically use native driver when possible
2. **Memoize Styles**: Use `useThemedStyles` hook for automatic memoization
3. **Platform Optimization**: Styles are automatically optimized per platform
4. **Tree Shaking**: Import only what you need

```tsx
// ✅ Specific imports
import { useColors, useSpacing } from './themes';

// ❌ Full theme import when only colors needed
import { useTheme } from './themes';
```

## TypeScript Support

The theme system is fully typed:

```tsx
// All theme values are typed
const colors: ColorPalette = useColors();
const spacing: SpacingScale = useSpacing();

// Component styles are typed
const styles: ComponentStyles = theme.components;

// Responsive values are typed
const responsiveValue: ResponsiveValue<number> = {
  xs: 14,
  md: 18,
};
```

## Debugging

Enable theme debugging in development:

```tsx
import { themeConfig } from './themes';

// Enable in development
themeConfig.development.showThemeDebugger = true;
themeConfig.development.logThemeChanges = true;
```

## Migration Guide

If you're migrating from a custom theme system:

1. Map your existing colors to the new color scale
2. Convert spacing values to the 4px base system
3. Update component styles to use theme tokens
4. Replace hardcoded values with theme references
5. Add responsive breakpoints where needed

This theme system provides a solid foundation for building consistent, accessible, and maintainable React Native applications with StudyMap's design language. 