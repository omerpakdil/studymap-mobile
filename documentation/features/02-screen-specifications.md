# StudyMap - Screen Specifications & Modern Design Patterns

## 1. Core Screen Architecture

### 1.1 Navigation Structure
```
Tab Navigation (Bottom)
├── Dashboard (Home Icon)
├── Calendar (Calendar Icon) 
├── Progress (Chart Icon)
├── Profile (User Icon)
└── More (Menu Icon)

Stack Navigation (Per Tab)
├── Onboarding Stack
├── Study Session Stack
├── Assessment Stack
└── Settings Stack
```

## 2. Onboarding Screens

### 2.1 Splash Screen
```
Layout: Centered with full-screen background
┌─────────────────────────────┐
│                             │
│        [Gradient BG]        │
│                             │
│          [LOGO]             │
│       StudyMap              │
│                             │
│    [Loading Indicator]      │
│                             │
└─────────────────────────────┘
```

**Design Elements:**
- **Background**: Linear gradient (45°) from `#667eea` to `#764ba2`
- **Logo**: SVG with scale animation (0.8 → 1.0 → 0.95)
- **Typography**: Custom font, 24px, white with 40% opacity
- **Loading**: Minimal spinner with opacity fade-in
- **Animation**: 2s total duration with smooth transitions

### 2.2 Welcome Carousel
```
Screen Layout: Full-screen with bottom navigation
┌─────────────────────────────┐
│        [Hero Image]         │
│                             │
│                             │
│       [Main Title]          │
│     [Description Text]      │
│                             │
│                             │
│     ● ○ ○  [Skip] [Next]    │
└─────────────────────────────┘
```

**Screen 1: Personalized Learning**
- **Hero**: Lottie animation of AI + student interaction
- **Title**: "Learn Smarter, Not Harder"
- **Description**: "AI-powered study plans tailored just for you"
- **Colors**: Primary brand gradient background

**Screen 2: Smart Calendar**
- **Hero**: Animated calendar with tasks appearing
- **Title**: "Your Study Journey Mapped"
- **Description**: "Visual progress tracking from today to exam day"
- **Colors**: Soft blue gradient background

**Screen 3: Success Visualization**
- **Hero**: Growth chart animation with confetti
- **Title**: "Achieve Your Goals"
- **Description**: "Join thousands who've reached their target scores"
- **Colors**: Green success gradient background

### 2.3 Assessment Wizard
```
Progressive Steps Layout:
┌─────────────────────────────┐
│ [Progress Bar: 2/5]         │
│                             │
│     [Question/Content]      │
│                             │
│    [Interactive Elements]   │
│                             │
│                             │
│   [Back]         [Next]     │
└─────────────────────────────┘
```

**Step 1: Knowledge Assessment**
- **Layout**: Subject cards with proficiency sliders
- **Interaction**: Tap card → expand → drag slider
- **Animation**: Card flip reveal, slider thumb bounce
- **Subjects**: Math, English, Science (expandable grid)

**Step 2: Learning Style**
- **Layout**: Visual quiz with illustration cards
- **Interaction**: Tap to select, multi-select allowed
- **Animation**: Card scale on selection, checkmark appear
- **Options**: Visual, Auditory, Kinesthetic, Reading/Writing

**Step 3: Time Availability**
- **Layout**: Weekly calendar grid with time slots
- **Interaction**: Tap slots to select available hours
- **Animation**: Color fill animation, ripple effect
- **Visual**: Heat map visualization of availability

## 3. Main Application Screens

### 3.1 Dashboard (Home)
```
Modern Card-Based Layout:
┌─────────────────────────────┐
│ [Header: Welcome, Alex]     │
│ [Streak: 🔥 5 days]         │
│                             │
│ ┌─────────────────────────┐ │
│ │    Today's Progress     │ │
│ │  [Circular Progress]    │ │
│ │     3/5 Tasks Done      │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │   Quick Start Study     │ │
│ │    [Subject Cards]      │ │
│ └─────────────────────────┘ │
│                             │
│ [Recent Activity Feed]      │
└─────────────────────────────┘
```

**Header Section:**
- **Greeting**: Dynamic based on time of day
- **Streak Counter**: Fire emoji with count animation
- **Notifications**: Bell icon with badge
- **Profile**: Avatar with subtle shadow

**Progress Card:**
- **Design**: Elevated card with rounded corners (16px radius)
- **Progress Ring**: Animated SVG circle with gradient stroke
- **Typography**: Primary metric (large), secondary info (small)
- **Colors**: Success green for completed tasks

**Quick Actions:**
- **Subject Cards**: Horizontal scroll with snap points
- **Card Design**: Icon + subject name + next task time
- **Interaction**: Tap to start immediate study session
- **Animation**: Scale on press, slide in from right

### 3.2 Calendar Interface
```
Multi-View Calendar Layout:
┌─────────────────────────────┐
│ [Month/Week/Day Toggle]     │
│                             │
│     [Calendar View]         │
│                             │
│                             │
│                             │
│                             │
│ [Task Summary Card]         │
└─────────────────────────────┘
```

**Month View:**
- **Grid**: 7x6 grid with proper spacing
- **Date Cells**: Circular with progress indicators
- **Progress Dots**: Small colored dots for different subjects
- **Interaction**: Tap date → slide up day detail

**Week View:**
- **Timeline**: Hour-based timeline with study blocks
- **Study Blocks**: Color-coded by subject with rounded corners
- **Interaction**: Tap block → edit, long press → drag to reschedule
- **Animation**: Smooth transitions between weeks

**Day View:**
- **Layout**: Vertical timeline with detailed tasks
- **Task Cards**: Material design cards with elevation
- **Progress**: Checkbox with checkmark animation
- **Time Slots**: Clear time indicators with divider lines

### 3.3 Daily Study Session
```
Immersive Study Interface:
┌─────────────────────────────┐
│ [Timer: 25:00] [Pause] [X]  │
│                             │
│                             │
│      [Content Area]         │
│                             │
│                             │
│                             │
│ [Progress Bar]              │
│ [Previous] [1/10] [Next]    │
└─────────────────────────────┘
```

**Timer Component:**
- **Design**: Large circular timer with animated progress ring
- **States**: Study time (25min), break time (5min), long break (15min)
- **Colors**: Blue for focus, green for break, orange for warning
- **Animation**: Smooth countdown with pulsing effect

**Content Area:**
- **Adaptive Layout**: Adjusts based on content type
- **Question Cards**: Swipeable with smooth transitions
- **Practice Problems**: Step-by-step solution reveal
- **Video Content**: Full-screen capable with controls

**Progress Tracking:**
- **Bottom Bar**: Shows session progress (questions completed)
- **Visual Feedback**: Immediate feedback on answers
- **Achievement**: Celebration animation on session completion

### 3.4 Progress Analytics
```
Data Visualization Dashboard:
┌─────────────────────────────┐
│ [Time Period Selector]      │
│                             │
│ ┌─────────────────────────┐ │
│ │     Overall Score       │ │
│ │   [Radial Progress]     │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │   Subject Breakdown     │ │
│ │    [Bar Chart]          │ │
│ └─────────────────────────┘ │
│                             │
│ [Study Streak Heatmap]      │
└─────────────────────────────┘
```

**Analytics Cards:**
- **Overall Score**: Large radial progress with percentage
- **Subject Breakdown**: Animated bar chart with color coding
- **Time Analytics**: Line chart showing study hours over time
- **Achievement Badges**: Grid of unlocked achievements

**Interactive Elements:**
- **Time Filters**: Segmented control (Week/Month/All Time)
- **Chart Interactions**: Tap bars/points for detailed tooltips
- **Export Options**: Share progress as image or PDF

## 4. Component Library

### 4.1 Buttons
```css
Primary Button:
- Background: Linear gradient (#667eea, #764ba2)
- Border Radius: 12px
- Height: 48px
- Typography: 16px, semi-bold, white
- Animation: Scale (0.95) on press, ripple effect

Secondary Button:
- Background: Transparent
- Border: 2px solid primary color
- Text Color: Primary color
- Same dimensions and animations as primary

Icon Button:
- Size: 44x44px (minimum touch target)
- Background: Circle with 22px radius
- Icon: 24x24px centered
- States: Default, pressed, disabled
```

### 4.2 Cards
```css
Standard Card:
- Background: White (#FFFFFF)
- Border Radius: 16px
- Shadow: 0 4px 12px rgba(0,0,0,0.1)
- Padding: 16px
- Animation: Lift on press (translateY: -2px)

Progress Card:
- Enhanced with gradient border
- Internal progress elements
- Real-time data updates
- Micro-animations on value changes
```

### 4.3 Form Elements
```css
Input Field:
- Height: 48px
- Border Radius: 8px
- Border: 1px solid #E5E5E5
- Focus State: Primary color border, shadow
- Error State: Red border, shake animation
- Success State: Green border, checkmark icon

Slider:
- Track Height: 4px
- Thumb Size: 24x24px
- Active Thumb: 28x28px with shadow
- Colors: Track (gray), Progress (primary)
- Animation: Smooth thumb movement, haptic feedback
```

## 5. Animation Specifications

### 5.1 Page Transitions
```javascript
// Stack Navigation
const slideTransition = {
  cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
  transitionSpec: {
    open: TransitionSpecs.TransitionIOSSpec,
    close: TransitionSpecs.TransitionIOSSpec,
  },
}

// Tab Navigation
const tabTransition = {
  tabBarStyle: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.9)',
    backdropFilter: 'blur(10px)',
  },
  animation: 'spring',
  config: {
    stiffness: 1000,
    damping: 500,
    mass: 3,
  },
}
```

### 5.2 Micro-Animations
```javascript
// Progress Ring Animation
const progressAnimation = useSharedValue(0);

const animatedProps = useAnimatedProps(() => ({
  strokeDashoffset: circumference * (1 - progressAnimation.value),
}));

// Loading States
const skeletonAnimation = {
  duration: 1000,
  easing: Easing.inOut(Easing.ease),
  iterations: -1,
  direction: 'alternate',
}

// Success Feedback
const successFeedback = {
  scale: withSequence(
    withTiming(1.2, { duration: 150 }),
    withTiming(1, { duration: 150 })
  ),
  opacity: withSequence(
    withTiming(0.8, { duration: 75 }),
    withTiming(1, { duration: 75 })
  ),
}
```

### 5.3 Gesture Animations
```javascript
// Swipe to Complete
const swipeGesture = Gesture.Pan()
  .onUpdate((event) => {
    translationX.value = event.translationX;
  })
  .onEnd((event) => {
    if (event.translationX > SWIPE_THRESHOLD) {
      // Complete task animation
      translationX.value = withTiming(SCREEN_WIDTH);
      opacity.value = withTiming(0);
    } else {
      // Return to original position
      translationX.value = withSpring(0);
    }
  });

// Pull to Refresh
const refreshGesture = {
  onGestureEvent: ({ nativeEvent }) => {
    if (nativeEvent.translationY > REFRESH_THRESHOLD) {
      triggerRefresh();
    }
  },
  refreshAnimation: withSequence(
    withTiming(1, { duration: 200 }),
    withTiming(0, { duration: 800 })
  ),
}
```

## 6. Responsive Design System

### 6.1 Breakpoints
```javascript
const breakpoints = {
  xs: 0,     // Small phones
  sm: 576,   // Large phones
  md: 768,   // Small tablets
  lg: 992,   // Large tablets
  xl: 1200,  // Desktop
};

const useResponsive = () => {
  const { width } = useWindowDimensions();
  
  return {
    isSmall: width < breakpoints.sm,
    isMedium: width >= breakpoints.sm && width < breakpoints.lg,
    isLarge: width >= breakpoints.lg,
  };
};
```

### 6.2 Adaptive Layouts
```javascript
// Dashboard Card Grid
const cardGrid = {
  xs: { columns: 1, gap: 12 },
  sm: { columns: 2, gap: 16 },
  lg: { columns: 3, gap: 20 },
};

// Typography Scale
const typography = {
  xs: { h1: 24, h2: 20, body: 14 },
  sm: { h1: 28, h2: 24, body: 16 },
  lg: { h1: 32, h2: 28, body: 18 },
};

// Spacing Scale
const spacing = {
  xs: { padding: 12, margin: 8 },
  sm: { padding: 16, margin: 12 },
  lg: { padding: 24, margin: 16 },
};
```

### 6.3 Platform Adaptations
```javascript
// iOS Specific
const iosStyles = StyleSheet.create({
  safeArea: {
    paddingTop: Platform.OS === 'ios' ? getStatusBarHeight() : 0,
  },
  navigation: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    backdropFilter: 'blur(10px)',
  },
  haptics: Platform.OS === 'ios' ? 'impactLight' : null,
});

// Android Specific
const androidStyles = StyleSheet.create({
  safeArea: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  navigation: {
    elevation: 8,
    backgroundColor: '#FFFFFF',
  },
  ripple: Platform.OS === 'android' ? 'rgba(0,0,0,0.1)' : null,
});
```

## 7. Dark Mode Support

### 7.1 Color Scheme
```javascript
const lightTheme = {
  primary: '#667eea',
  secondary: '#764ba2',
  background: '#FFFFFF',
  surface: '#F8F9FA',
  text: '#1A1A1A',
  textSecondary: '#6B7280',
  border: '#E5E5E5',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
};

const darkTheme = {
  primary: '#8B8CF6',
  secondary: '#A78BFA',
  background: '#111827',
  surface: '#1F2937',
  text: '#F9FAFB',
  textSecondary: '#D1D5DB',
  border: '#374151',
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
};
```

### 7.2 Dynamic Theming
```javascript
const useTheme = () => {
  const colorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(colorScheme === 'dark');
  
  useEffect(() => {
    setIsDark(colorScheme === 'dark');
  }, [colorScheme]);
  
  return {
    colors: isDark ? darkTheme : lightTheme,
    isDark,
    toggleTheme: () => setIsDark(!isDark),
  };
};
```

---

*This screen specification document provides the detailed blueprint for implementing modern, responsive, and accessible user interfaces in the StudyMap application.* 