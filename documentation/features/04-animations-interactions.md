# StudyMap - Animation & Interaction Guidelines

## 1. Animation Philosophy

### 1.1 Motion Principles
- **Purposeful**: Every animation serves a functional purpose
- **Natural**: Movements feel organic and physics-based
- **Responsive**: Immediate feedback to user interactions
- **Accessible**: Respects user motion preferences
- **Performant**: 60fps smooth animations with efficient resources

### 1.2 Motion Categories
```
Functional Animations:
├── Navigation Transitions
├── State Changes
├── Loading & Progress
└── Feedback & Validation

Delightful Animations:
├── Micro-interactions
├── Achievement Celebrations
├── Hover & Focus Effects
└── Ambient Animations
```

## 2. Navigation & Page Transitions

### 2.1 Stack Navigation Animations
```typescript
// iOS-Style Slide Transition
const iosSlideTransition = {
  gestureDirection: 'horizontal',
  transitionSpec: {
    open: {
      animation: 'spring',
      config: {
        stiffness: 1000,
        damping: 500,
        mass: 3,
        overshootClamping: true,
        restDisplacementThreshold: 0.01,
        restSpeedThreshold: 0.01,
      },
    },
    close: {
      animation: 'spring',
      config: {
        stiffness: 1000,
        damping: 500,
        mass: 3,
        overshootClamping: true,
        restDisplacementThreshold: 0.01,
        restSpeedThreshold: 0.01,
      },
    },
  },
};

// Android-Style Slide Up Transition
const androidSlideUpTransition = {
  transitionSpec: {
    open: {
      animation: 'timing',
      config: {
        duration: 300,
        easing: Easing.bezier(0.2, 0, 0, 1),
      },
    },
    close: {
      animation: 'timing',
      config: {
        duration: 250,
        easing: Easing.bezier(0.4, 0, 0.6, 1),
      },
    },
  },
};
```

### 2.2 Tab Navigation Animations
```typescript
// Smooth Tab Transitions
const tabAnimation = {
  animation: 'spring',
  config: {
    stiffness: 1000,
    damping: 500,
    mass: 3,
  },
};

// Tab Bar Style with Blur Effect
const tabBarStyle = {
  position: 'absolute',
  backgroundColor: 'rgba(255, 255, 255, 0.85)',
  backdropFilter: 'blur(20px)',
  borderTopWidth: 0,
  elevation: 0,
  shadowOpacity: 0.1,
  shadowRadius: 4,
  shadowOffset: { width: 0, height: -2 },
};
```

### 2.3 Modal & Overlay Animations
- **Bottom Sheet Modal**: Slide up from bottom with spring animation
- **Fade Modal**: Scale and fade in from center
- **Side Panel**: Slide in from left/right with overlay
- **Full Screen**: Zoom transition with blur background

## 3. Micro-Interactions & Feedback

### 3.1 Button Interactions
- **Scale Animation**: Slight scale down (0.95) on press
- **Ripple Effect**: Android-style ripple on touch
- **Color Transition**: Smooth color changes on state
- **Shadow Changes**: Elevation changes on interaction

### 3.2 Toggle & Switch Animations
- **Thumb Movement**: Smooth spring animation between states
- **Color Transition**: Background color morphing
- **Scale Feedback**: Slight scale on interaction
- **Haptic Integration**: Tactile feedback on toggle

### 3.3 Progress & Loading Animations
- **Circular Progress**: Animated stroke with gradient
- **Linear Progress**: Left-to-right fill animation
- **Skeleton Loading**: Shimmer effect placeholder
- **Pulse Animation**: Breathing effect for loading states

## 4. Gesture-Based Interactions

### 4.1 Swipe Gestures
- **Swipe to Complete**: Right swipe marks task complete
- **Swipe to Skip**: Left swipe skips task
- **Pull to Refresh**: Elastic pull gesture
- **Swipe Navigation**: Horizontal swipe between screens

### 4.2 Long Press Interactions
- **Context Menu**: Long press reveals action menu
- **Quick Actions**: Shortcut menu for common tasks
- **Drag to Reorder**: Long press + drag for list reordering
- **Preview**: Long press for content preview

## 5. Achievement & Success Animations

### 5.1 Celebration Animations
- **Confetti Explosion**: Particle animation for major achievements
- **Badge Pop-in**: Scale and rotate animation for new badges
- **Streak Counter**: Bounce animation when streak increases
- **Level Up**: Dramatic scale and glow effect

### 5.2 Progress Celebrations
- **Milestone Reached**: Special animation at progress milestones
- **Daily Goal**: Completion animation with visual feedback
- **Study Streak**: Fire emoji with bounce animation
- **Perfect Score**: Star burst animation

## 6. Loading & Skeleton States

### 6.1 Skeleton Screen Animations
- **Shimmer Effect**: Moving gradient across skeleton elements
- **Pulse Loading**: Breathing opacity animation
- **Staggered Loading**: Sequential appearance of elements
- **Wave Animation**: Ripple effect across loading areas

### 6.2 Content Loading Patterns
- **Progressive Loading**: Content appears as it loads
- **Placeholder States**: Meaningful placeholders during load
- **Error States**: Gentle error animations with retry options
- **Empty States**: Illustrated empty states with call-to-action

## 7. Study Session Animations

### 7.1 Timer Animations
- **Countdown Ring**: Circular progress showing remaining time
- **Focus Mode**: Breathing animation during study sessions
- **Break Timer**: Different color and rhythm for breaks
- **Session Complete**: Celebration animation when done

### 7.2 Content Interactions
- **Card Flip**: Smooth flip for flashcards
- **Question Reveal**: Sequential reveal of question parts
- **Answer Feedback**: Immediate visual feedback on answers
- **Progress Update**: Smooth progress bar updates

## 8. Calendar & Planning Animations

### 8.1 Calendar Interactions
- **Date Selection**: Ripple effect on date selection
- **View Transitions**: Smooth zoom between month/week/day views
- **Event Animations**: Slide in new events and tasks
- **Progress Visualization**: Animated heat map for study progress

### 8.2 Task Management
- **Task Creation**: Slide down animation for new tasks
- **Completion**: Checkmark animation with strikethrough
- **Reordering**: Smooth drag and drop with ghost preview
- **Deletion**: Swipe to delete with confirmation

## 9. Performance Guidelines

### 9.1 Animation Performance
- **60fps Target**: Maintain smooth 60fps for all animations
- **GPU Acceleration**: Use transform properties for hardware acceleration
- **Memory Management**: Properly cleanup animation resources
- **Batch Updates**: Group related animations together

### 9.2 Reduced Motion Support
- **System Preference**: Respect `prefers-reduced-motion` setting
- **Alternative Feedback**: Provide non-motion feedback options
- **Essential Motion**: Keep only functionally necessary animations
- **Graceful Degradation**: Fallback to instant transitions

## 10. Animation Timing & Easing

### 10.1 Duration Guidelines
- **Micro-interactions**: 100-200ms
- **Component Transitions**: 200-300ms
- **Page Transitions**: 300-500ms
- **Loading States**: 800-1200ms loops

### 10.2 Easing Functions
- **Ease-out**: For entering animations (cubic-bezier(0, 0, 0.2, 1))
- **Ease-in**: For exiting animations (cubic-bezier(0.4, 0, 1, 1))
- **Spring**: For interactive elements (damping: 15, stiffness: 150)
- **Linear**: For loading and progress animations

## 11. Haptic Feedback Integration

### 11.1 iOS Haptics
- **Impact Light**: Button taps and toggles
- **Impact Medium**: Success actions and confirmations
- **Impact Heavy**: Important actions and errors
- **Selection**: Picker and slider interactions

### 11.2 Android Vibration
- **Short Pulse**: Quick confirmation feedback
- **Double Pulse**: Error or warning feedback
- **Long Pulse**: Success or completion feedback
- **Pattern Vibration**: Custom patterns for achievements

## 12. Accessibility Considerations

### 12.1 Visual Accessibility
- **High Contrast**: Ensure animations work in high contrast mode
- **Color Independence**: Don't rely solely on color for animation feedback
- **Focus Indicators**: Clear focus states with animation
- **Screen Reader**: Announce animation state changes

### 12.2 Motor Accessibility
- **Touch Targets**: Minimum 44px touch targets for interactive elements
- **Gesture Alternatives**: Provide button alternatives for gestures
- **Timing Controls**: Allow users to adjust animation speed
- **Voice Control**: Support voice commands for interactions

---

*This animation guide provides comprehensive guidelines for creating engaging, accessible, and performant animations throughout the StudyMap application.* 