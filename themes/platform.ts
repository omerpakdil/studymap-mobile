// Platform-specific Styles
// Handling iOS and Android differences in StudyMap

import { Platform, TextStyle, ViewStyle } from 'react-native';
import { PlatformStyles } from './types';

// Platform detection utilities
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';
export const platformVersion = Platform.Version;

// Safe area handling
export const safeAreaStyles = {
  // Status bar heights
  statusBar: Platform.select({
    ios: 44,      // iPhone X+ notch
    android: 24,  // Standard Android
    default: 24,
  }),
  
  // Bottom safe area (home indicator on iOS)
  bottomSafeArea: Platform.select({
    ios: 34,      // iPhone X+ home indicator
    android: 0,   // No home indicator
    default: 0,
  }),
  
  // Tab bar heights including safe area
  tabBarHeight: Platform.select({
    ios: 83,      // 49px tab + 34px safe area
    android: 56,  // Material Design standard
    default: 56,
  }),
  
  // Header heights including status bar
  headerHeight: Platform.select({
    ios: 88,      // 44px header + 44px status bar
    android: 56,  // Material Design standard
    default: 56,
  }),
};

// Typography platform differences
export const platformTypography = {
  // System font families
  fontFamily: Platform.select({
    ios: {
      regular: 'System',
      medium: 'System',
      bold: 'System',
      mono: 'Menlo',
    },
    android: {
      regular: 'Roboto',
      medium: 'Roboto_medium',
      bold: 'Roboto_bold', 
      mono: 'monospace',
    },
    default: {
      regular: 'System',
      medium: 'System',
      bold: 'System',
      mono: 'monospace',
    },
  }),
  
  // Font weight handling
  fontWeight: Platform.select({
    ios: {
      normal: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
    },
    android: {
      normal: 'normal' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: 'bold' as const,
    },
    default: {
      normal: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
    },
  }),
  
  // Line height adjustments
  lineHeightAdjustment: Platform.select({
    ios: 1.0,      // iOS handles line height well
    android: 1.1,  // Android needs slightly more line height
    default: 1.0,
  }),
};

// Shadow and elevation differences
export const platformShadows = {
  // Card shadows
  card: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    android: {
      elevation: 3,
    },
    default: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
  }),
  
  // Button shadows
  button: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    android: {
      elevation: 1,
    },
    default: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
  }),
  
  // Modal shadows
  modal: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
    },
    android: {
      elevation: 8,
    },
    default: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
    },
  }),
};

// Navigation platform differences
export const platformNavigation = {
  // Header styles
  header: Platform.select({
    ios: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderBottomWidth: 0.5,
      borderBottomColor: 'rgba(0, 0, 0, 0.1)',
      backdropFilter: 'blur(10px)', // iOS blur effect
    },
    android: {
      backgroundColor: '#FFFFFF',
      elevation: 4,
      borderBottomWidth: 0,
    },
    default: {
      backgroundColor: '#FFFFFF',
      borderBottomWidth: 0.5,
      borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    },
  }),
  
  // Tab bar styles
  tabBar: Platform.select({
    ios: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderTopWidth: 0.5,
      borderTopColor: 'rgba(0, 0, 0, 0.1)',
      backdropFilter: 'blur(10px)', // iOS blur effect
    },
    android: {
      backgroundColor: '#FFFFFF',
      elevation: 8,
      borderTopWidth: 0,
    },
    default: {
      backgroundColor: '#FFFFFF',
      borderTopWidth: 0.5,
      borderTopColor: 'rgba(0, 0, 0, 0.1)',
    },
  }),
  
  // Status bar handling
  statusBar: Platform.select({
    ios: {
      barStyle: 'dark-content' as const,
      backgroundColor: 'transparent',
    },
    android: {
      barStyle: 'dark-content' as const,
      backgroundColor: '#FFFFFF',
      translucent: false,
    },
    default: {
      barStyle: 'dark-content' as const,
      backgroundColor: 'transparent',
    },
  }),
};

// Input and form platform differences
export const platformInputs = {
  // Text input styles
  textInput: Platform.select({
    ios: {
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    android: {
      borderBottomWidth: 1,
      borderRadius: 0,
      paddingHorizontal: 0,
      paddingVertical: 8,
    },
    default: {
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
  }),
  
  // Button styles
  button: Platform.select({
    ios: {
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    android: {
      borderRadius: 4,
      paddingHorizontal: 24,
      paddingVertical: 12,
      textTransform: 'uppercase' as const,
    },
    default: {
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
  }),
  
  // Switch styles
  switch: Platform.select({
    ios: {
      transform: [{ scale: 0.8 }], // iOS switches are larger by default
    },
    android: {
      transform: [{ scale: 1.0 }],
    },
    default: {
      transform: [{ scale: 0.8 }],
    },
  }),
};

// Animation platform differences
export const platformAnimations = {
  // Screen transitions
  screenTransition: Platform.select({
    ios: {
      gestureEnabled: true,
      cardStyleInterpolator: 'forHorizontalIOS' as const,
      transitionSpec: {
        open: { animation: 'spring', config: { stiffness: 1000, damping: 500, mass: 3 } },
        close: { animation: 'spring', config: { stiffness: 1000, damping: 500, mass: 3 } },
      },
    },
    android: {
      gestureEnabled: false,
      cardStyleInterpolator: 'forFadeFromBottomAndroid' as const,
      transitionSpec: {
        open: { animation: 'timing', config: { duration: 150 } },
        close: { animation: 'timing', config: { duration: 150 } },
      },
    },
    default: {
      gestureEnabled: true,
      cardStyleInterpolator: 'forHorizontalIOS' as const,
    },
  }),
  
  // Modal transitions
  modalTransition: Platform.select({
    ios: {
      animationType: 'slide' as const,
      presentationStyle: 'pageSheet' as const,
    },
    android: {
      animationType: 'fade' as const,
      transparent: true,
    },
    default: {
      animationType: 'slide' as const,
    },
  }),
};

// Haptic feedback platform differences
export const platformHaptics = {
  // Impact feedback
  impact: Platform.select({
    ios: {
      light: 'impactLight',
      medium: 'impactMedium', 
      heavy: 'impactHeavy',
    },
    android: {
      light: 'clockTick',
      medium: 'contextClick',
      heavy: 'keyboardTap',
    },
    default: {
      light: 'impactLight',
      medium: 'impactMedium',
      heavy: 'impactHeavy',
    },
  }),
  
  // Selection feedback
  selection: Platform.select({
    ios: 'selection',
    android: 'contextClick',
    default: 'selection',
  }),
  
  // Notification feedback
  notification: Platform.select({
    ios: {
      success: 'notificationSuccess',
      warning: 'notificationWarning',
      error: 'notificationError',
    },
    android: {
      success: 'effectTick',
      warning: 'effectClick',
      error: 'effectHeavyClick',
    },
    default: {
      success: 'notificationSuccess',
      warning: 'notificationWarning',
      error: 'notificationError',
    },
  }),
};

// Utility functions for platform styles
export const createPlatformStyle = <T extends ViewStyle | TextStyle>(
  iosStyle: T,
  androidStyle: T,
  defaultStyle?: T
): T => {
  return Platform.select({
    ios: iosStyle,
    android: androidStyle,
    default: defaultStyle || iosStyle,
  }) as T;
};

export const createPlatformStyles = <T extends Record<string, ViewStyle | TextStyle>>(
  styles: {
    ios: T;
    android: T;
    default?: T;
  }
): T => {
  return Platform.select({
    ios: styles.ios,
    android: styles.android,
    default: styles.default || styles.ios,
  }) as T;
};

// Platform-specific component adjustments
export const platformComponents = {
  // TouchableOpacity vs TouchableNativeFeedback
  touchable: Platform.select({
    ios: 'TouchableOpacity',
    android: 'TouchableNativeFeedback',
    default: 'TouchableOpacity',
  }),
  
  // Picker component
  picker: Platform.select({
    ios: 'ActionSheet',
    android: 'Picker',
    default: 'ActionSheet',
  }),
  
  // Date picker
  datePicker: Platform.select({
    ios: 'DatePickerIOS',
    android: 'DatePickerAndroid',
    default: 'DatePickerIOS',
  }),
  
  // Alert component
  alert: Platform.select({
    ios: 'ActionSheet',
    android: 'Alert',
    default: 'ActionSheet',
  }),
};

// Default platform styles object
const platformStyles: PlatformStyles = {
  ios: {
    fontSize: 16,
    fontFamily: 'System',
    borderRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  
  android: {
    fontSize: 16,
    fontFamily: 'Roboto',
    borderRadius: 4,
    elevation: 2,
  },
  
  default: {
    fontSize: 16,
    fontFamily: 'System',
    borderRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
};

export default platformStyles; 