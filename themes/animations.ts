// Animation System
// Motion and timing configurations for StudyMap

import { AnimationConfig } from './types';

// Base animation configuration
const animations: AnimationConfig = {
  timing: {
    fast: 150,      // Quick interactions
    normal: 250,    // Standard transitions
    slow: 400,      // Deliberate animations
    slower: 600,    // Emphasis animations
  },
  
  easing: {
    linear: 'linear',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    sharp: 'cubic-bezier(0.4, 0.0, 0.6, 1)',        // Sharp/snappy
    emphasized: 'cubic-bezier(0.0, 0.0, 0.2, 1)',   // Emphasized/smooth
  },
  
  spring: {
    gentle: {
      damping: 15,
      stiffness: 120,
      mass: 1,
    },
    wobbly: {
      damping: 8,
      stiffness: 180,
      mass: 1,
    },
    stiff: {
      damping: 20,
      stiffness: 300,
      mass: 1,
    },
  },
};

// React Native Animated configurations
export const animatedConfigs = {
  // Timing configs
  timing: {
    fast: {
      duration: animations.timing.fast,
      useNativeDriver: true,
    },
    normal: {
      duration: animations.timing.normal,
      useNativeDriver: true,
    },
    slow: {
      duration: animations.timing.slow,
      useNativeDriver: true,
    },
    layout: {
      duration: animations.timing.normal,
      useNativeDriver: false, // Layout animations can't use native driver
    },
  },
  
  // Spring configs
  spring: {
    gentle: {
      ...animations.spring.gentle,
      useNativeDriver: true,
    },
    wobbly: {
      ...animations.spring.wobbly,
      useNativeDriver: true,
    },
    stiff: {
      ...animations.spring.stiff,
      useNativeDriver: true,
    },
    button: {
      damping: 12,
      stiffness: 200,
      mass: 0.8,
      useNativeDriver: true,
    },
  },
};

// Transition presets for different interactions
export const transitionPresets = {
  // Screen transitions
  screen: {
    fade: {
      duration: animations.timing.normal,
      opacity: { from: 0, to: 1 },
    },
    slideFromRight: {
      duration: animations.timing.normal,
      transform: { translateX: { from: 300, to: 0 } },
    },
    slideFromBottom: {
      duration: animations.timing.normal,
      transform: { translateY: { from: 300, to: 0 } },
    },
    scale: {
      duration: animations.timing.fast,
      transform: { scale: { from: 0.9, to: 1 } },
      opacity: { from: 0, to: 1 },
    },
  },
  
  // Button interactions
  button: {
    press: {
      duration: animations.timing.fast,
      transform: { scale: { from: 1, to: 0.95 } },
    },
    release: {
      duration: animations.timing.fast,
      transform: { scale: { from: 0.95, to: 1 } },
    },
    ripple: {
      duration: animations.timing.normal,
      opacity: { from: 0.2, to: 0 },
      transform: { scale: { from: 0, to: 1 } },
    },
  },
  
  // Card interactions
  card: {
    hover: {
      duration: animations.timing.fast,
      transform: { translateY: { from: 0, to: -2 } },
      shadowOpacity: { from: 0.1, to: 0.15 },
    },
    press: {
      duration: animations.timing.fast,
      transform: { scale: { from: 1, to: 0.98 } },
    },
    flip: {
      duration: animations.timing.slow,
      transform: { rotateY: { from: 0, to: 180 } },
    },
  },
  
  // Modal transitions
  modal: {
    backdrop: {
      duration: animations.timing.normal,
      opacity: { from: 0, to: 0.5 },
    },
    slideUp: {
      duration: animations.timing.normal,
      transform: { translateY: { from: 300, to: 0 } },
    },
    slideDown: {
      duration: animations.timing.normal,
      transform: { translateY: { from: -300, to: 0 } },
    },
    zoom: {
      duration: animations.timing.normal,
      transform: { scale: { from: 0.3, to: 1 } },
      opacity: { from: 0, to: 1 },
    },
  },
  
  // List animations
  list: {
    itemEntry: {
      duration: animations.timing.normal,
      opacity: { from: 0, to: 1 },
      transform: { translateX: { from: -20, to: 0 } },
    },
    itemExit: {
      duration: animations.timing.fast,
      opacity: { from: 1, to: 0 },
      transform: { translateX: { from: 0, to: 20 } },
    },
    stagger: 50, // Delay between items
  },
};

// Study-specific animations
export const studyAnimations = {
  // Progress animations
  progress: {
    ring: {
      duration: animations.timing.slow,
      strokeDasharray: { from: 0, to: 100 },
    },
    bar: {
      duration: animations.timing.slow,
      width: { from: '0%', to: '100%' },
    },
    number: {
      duration: animations.timing.slow,
      // Counter animation (handled separately)
    },
  },
  
  // Timer animations
  timer: {
    tick: {
      duration: 1000,
      transform: { scale: [1, 1.05, 1] },
    },
    finish: {
      duration: animations.timing.slower,
      transform: { scale: [1, 1.2, 1] },
      opacity: [1, 0.8, 1],
    },
    warning: {
      duration: animations.timing.fast,
      backgroundColor: 'pulse',
    },
  },
  
  // Achievement animations
  achievement: {
    unlock: {
      duration: animations.timing.slower,
      transform: { 
        scale: [0, 1.2, 1],
        rotate: [0, 360],
      },
      opacity: [0, 1],
    },
    badge: {
      duration: animations.timing.normal,
      transform: { scale: [0.8, 1] },
      opacity: [0, 1],
    },
    streak: {
      duration: animations.timing.fast,
      transform: { scale: [1, 1.1, 1] },
    },
  },
  
  // Calendar animations
  calendar: {
    cellSelect: {
      duration: animations.timing.fast,
      transform: { scale: [1, 0.95, 1] },
      backgroundColor: 'highlight',
    },
    monthTransition: {
      duration: animations.timing.normal,
      transform: { translateX: [300, 0] },
    },
    heatmapFill: {
      duration: animations.timing.slow,
      opacity: [0, 1],
      stagger: 20,
    },
  },
  
  // Task completion
  task: {
    complete: {
      duration: animations.timing.normal,
      transform: { scale: [1, 1.05, 1] },
      opacity: [1, 0.7],
    },
    checkmark: {
      duration: animations.timing.normal,
      strokeDasharray: [0, 100],
    },
    swipeComplete: {
      duration: animations.timing.normal,
      transform: { translateX: [0, 100] },
      opacity: [1, 0],
    },
  },
};

// Gesture-based animations
export const gestureAnimations = {
  // Swipe gestures
  swipe: {
    threshold: 50,        // Minimum swipe distance
    velocity: 0.5,        // Minimum velocity
    snapBackDuration: animations.timing.fast,
    completeDuration: animations.timing.normal,
  },
  
  // Pull to refresh
  pullToRefresh: {
    threshold: 60,        // Pull distance to trigger
    snapBackDuration: animations.timing.normal,
    indicatorScale: { from: 0, to: 1 },
  },
  
  // Long press
  longPress: {
    duration: 500,        // Hold duration
    scaleEffect: { from: 1, to: 0.95 },
    hapticFeedback: true,
  },
  
  // Pinch to zoom
  pinch: {
    minScale: 0.5,
    maxScale: 3,
    snapBackDuration: animations.timing.normal,
  },
};

// Loading and skeleton animations
export const loadingAnimations = {
  // Spinner
  spinner: {
    duration: 1000,
    rotate: [0, 360],
    repeat: -1, // Infinite
  },
  
  // Pulse
  pulse: {
    duration: 1500,
    opacity: [0.5, 1, 0.5],
    repeat: -1,
  },
  
  // Shimmer/Skeleton
  shimmer: {
    duration: 1500,
    transform: { translateX: [-100, 100] },
    repeat: -1,
  },
  
  // Wave
  wave: {
    duration: 2000,
    transform: { translateY: [0, -10, 0] },
    repeat: -1,
    stagger: 100,
  },
  
  // Progress bar
  progressBar: {
    duration: animations.timing.slow,
    width: ['0%', '100%'],
  },
};

// Accessibility and reduced motion
export const accessibilityAnimations = {
  // Reduced motion alternatives
  reducedMotion: {
    duration: 0,          // Instant transitions
    useNativeDriver: false,
  },
  
  // Focus indicators
  focus: {
    duration: animations.timing.fast,
    borderColor: 'highlight',
    borderWidth: [1, 2],
  },
  
  // Screen reader announcements
  announcement: {
    duration: animations.timing.fast,
    opacity: [0, 1, 0],
  },
};

// Animation utilities
export const animationUtils = {
  // Create staggered animations
  createStagger: (items: number, delay: number = 50) => 
    Array.from({ length: items }, (_, index) => index * delay),
  
  // Sequence multiple animations
  sequence: (animations: any[]) => ({
    type: 'sequence',
    animations,
  }),
  
  // Parallel animations
  parallel: (animations: any[]) => ({
    type: 'parallel',
    animations,
  }),
  
  // Loop animation
  loop: (animation: any, iterations: number = -1) => ({
    type: 'loop',
    animation,
    iterations,
  }),
  
  // Reverse animation
  reverse: (animation: any) => ({
    ...animation,
    reverse: true,
  }),
};

// Performance considerations
export const performanceConfig = {
  // Native driver compatibility
  nativeDriverSupported: [
    'opacity',
    'transform',
    'translateX',
    'translateY',
    'scale',
    'rotate',
    'rotateX',
    'rotateY',
    'rotateZ',
  ],
  
  // Layout animation properties (require JS thread)
  layoutProperties: [
    'width',
    'height',
    'top',
    'left',
    'right',
    'bottom',
    'margin',
    'padding',
  ],
  
  // Optimize for 60fps
  targetFPS: 60,
  frameTime: 16.67, // 1000ms / 60fps
};

export default animations; 