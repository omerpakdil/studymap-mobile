# StudyMap Theme Integration Guide

Quick start guide for integrating the StudyMap theme system into your React Native app.

## Step 1: Wrap Your App

Update your main App component or root component:

```tsx
// App.tsx or index.js
import React from 'react';
import { ThemeProvider } from './themes';
import MainApp from './src/App'; // Your main app component

export default function App() {
  return (
    <ThemeProvider initialMode="auto">
      <MainApp />
    </ThemeProvider>
  );
}
```

## Step 2: Use Theme in Components

### Basic Usage - Colors and Spacing

```tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useColors, useSpacing, useTypography } from './themes';

const MyComponent = () => {
  const colors = useColors();
  const spacing = useSpacing();
  const typography = useTypography();

  return (
    <View style={{
      backgroundColor: colors.neutral[0],
      padding: spacing[4],
      borderRadius: 12,
    }}>
      <Text style={{
        ...typography.styles.h3,
        color: colors.neutral[900],
      }}>
        Hello StudyMap!
      </Text>
    </View>
  );
};
```

### Advanced Usage - Themed Styles Hook

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemedStyles } from './themes';

const MyComponent = () => {
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
    ...theme.typography.styles.h3,
    color: theme.colors.neutral[900],
  },
});
```

## Step 3: Add Dark Mode Toggle

```tsx
import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { useThemeMode, useTheme } from './themes';

const DarkModeToggle = () => {
  const { mode, toggleMode } = useThemeMode();
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      style={{
        backgroundColor: theme.colors.neutral[100],
        padding: theme.spacing[3],
        borderRadius: theme.borders.full,
      }}
      onPress={toggleMode}
    >
      <Text>{theme.isDark ? '🌙' : '☀️'}</Text>
    </TouchableOpacity>
  );
};
```

## Step 4: Use Pre-built Components

The theme includes pre-built component styles:

```tsx
import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { useTheme } from './themes';

const Button = ({ title, onPress, variant = 'primary' }) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      style={[
        theme.components.button.base,
        theme.components.button.sizes.md,
        variant === 'primary' && {
          backgroundColor: theme.colors.primary[500],
        },
      ]}
      onPress={onPress}
    >
      <Text style={{ color: 'white', fontWeight: '500' }}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const Card = ({ children }) => {
  const { theme } = useTheme();

  return (
    <View style={[
      theme.components.card.base,
      theme.components.card.variants.elevated,
      { backgroundColor: theme.colors.neutral[0] }
    ]}>
      {children}
    </View>
  );
};
```

## Step 5: Study-Specific Components

For StudyMap-specific features:

```tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useColors, useSpacing, useTypography } from './themes';

const SubjectChip = ({ subject, color }) => {
  const colors = useColors();
  const spacing = useSpacing();
  const typography = useTypography();

  return (
    <View style={{
      backgroundColor: colors.subjects[color][100],
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[1],
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.subjects[color][300],
    }}>
      <Text style={{
        ...typography.styles.label,
        color: colors.subjects[color][700],
      }}>
        {subject}
      </Text>
    </View>
  );
};

const ProgressRing = ({ progress }) => {
  const { theme } = useTheme();

  return (
    <View style={theme.components.progressRing.container}>
      {/* Your progress ring implementation */}
      <Text style={theme.components.progressRing.text}>
        {progress}%
      </Text>
    </View>
  );
};
```

## Common Patterns

### Responsive Values

```tsx
import { getResponsiveValue } from './themes';

const fontSize = getResponsiveValue({
  xs: 14,
  sm: 16,
  md: 18,
  lg: 20,
});
```

### Platform-Specific Styles

```tsx
import { Platform } from 'react-native';
import { useTheme } from './themes';

const { theme } = useTheme();

const shadow = Platform.select({
  ios: theme.shadows.sm,
  android: { elevation: 2 },
});
```

### Animations

```tsx
import { Animated } from 'react-native';
import { useTheme } from './themes';

const { theme } = useTheme();

Animated.timing(fadeAnim, {
  toValue: 1,
  duration: theme.animations.timing.normal,
  useNativeDriver: true,
}).start();
```

## Tips for Migration

1. **Start Small**: Begin by wrapping your app and using basic colors/spacing
2. **Replace Hardcoded Values**: Gradually replace hardcoded colors and spacing with theme values
3. **Use Component Styles**: Leverage pre-built component styles instead of recreating them
4. **Test Dark Mode**: Ensure your components work in both light and dark themes
5. **Check Examples**: Refer to `themes/examples/ExampleComponents.tsx` for more patterns

## Next Steps

- Explore the full documentation in `themes/README.md`
- Check out example components in `themes/examples/`
- Consider adding AsyncStorage for theme persistence
- Customize colors and spacing for your specific needs

The theme system is designed to grow with your app - start simple and add complexity as needed! 