# StudyMap - Design System & Component Library

## 1. Design Foundation

### 1.1 Design Principles
- **Clarity**: Clear visual hierarchy and intuitive information architecture
- **Consistency**: Unified design language across all touchpoints
- **Accessibility**: Inclusive design for all users and abilities
- **Performance**: Optimized for mobile-first responsive experiences
- **Delight**: Thoughtful micro-interactions and meaningful animations

### 1.2 Brand Identity
```
Brand Personality:
- Intelligent & Trustworthy
- Modern & Progressive  
- Supportive & Encouraging
- Achievement-Oriented
- Globally Accessible
```

## 2. Color System

### 2.1 Primary Color Palette
```css
/* Primary Colors */
--primary-50:  #EEF2FF;
--primary-100: #E0E7FF;
--primary-200: #C7D2FE;
--primary-300: #A5B4FC;
--primary-400: #818CF8;
--primary-500: #6366F1;  /* Primary Brand */
--primary-600: #4F46E5;
--primary-700: #4338CA;
--primary-800: #3730A3;
--primary-900: #312E81;

/* Secondary Colors */
--secondary-50:  #F5F3FF;
--secondary-100: #EDE9FE;
--secondary-200: #DDD6FE;
--secondary-300: #C4B5FD;
--secondary-400: #A78BFA;
--secondary-500: #8B5CF6;  /* Secondary Brand */
--secondary-600: #7C3AED;
--secondary-700: #6D28D9;
--secondary-800: #5B21B6;
--secondary-900: #4C1D95;
```

### 2.2 Semantic Colors
```css
/* Success */
--success-50:  #ECFDF5;
--success-100: #D1FAE5;
--success-500: #10B981;  /* Primary Success */
--success-600: #059669;
--success-700: #047857;

/* Warning */
--warning-50:  #FFFBEB;
--warning-100: #FEF3C7;
--warning-500: #F59E0B;  /* Primary Warning */
--warning-600: #D97706;
--warning-700: #B45309;

/* Error */
--error-50:  #FEF2F2;
--error-100: #FEE2E2;
--error-500: #EF4444;  /* Primary Error */
--error-600: #DC2626;
--error-700: #B91C1C;

/* Info */
--info-50:  #EFF6FF;
--info-100: #DBEAFE;
--info-500: #3B82F6;  /* Primary Info */
--info-600: #2563EB;
--info-700: #1D4ED8;
```

### 2.3 Neutral Colors
```css
/* Light Theme Neutrals */
--neutral-0:   #FFFFFF;  /* Pure White */
--neutral-50:  #F9FAFB;  /* Background Light */
--neutral-100: #F3F4F6;  /* Surface Light */
--neutral-200: #E5E7EB;  /* Border Light */
--neutral-300: #D1D5DB;  /* Divider */
--neutral-400: #9CA3AF;  /* Text Disabled */
--neutral-500: #6B7280;  /* Text Secondary */
--neutral-600: #4B5563;  /* Text Primary */
--neutral-700: #374151;  /* Text Strong */
--neutral-800: #1F2937;  /* Text Emphasis */
--neutral-900: #111827;  /* Text Maximum */

/* Dark Theme Neutrals */
--dark-neutral-0:   #000000;  /* Pure Black */
--dark-neutral-50:  #0F172A;  /* Background Dark */
--dark-neutral-100: #1E293B;  /* Surface Dark */
--dark-neutral-200: #334155;  /* Border Dark */
--dark-neutral-300: #475569;  /* Divider Dark */
--dark-neutral-400: #64748B;  /* Text Disabled Dark */
--dark-neutral-500: #94A3B8;  /* Text Secondary Dark */
--dark-neutral-600: #CBD5E1;  /* Text Primary Dark */
--dark-neutral-700: #E2E8F0;  /* Text Strong Dark */
--dark-neutral-800: #F1F5F9;  /* Text Emphasis Dark */
--dark-neutral-900: #F8FAFC;  /* Text Maximum Dark */
```

### 2.4 Gradient System
```css
/* Primary Gradients */
.gradient-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.gradient-secondary {
  background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%);
}

/* Success Gradient */
.gradient-success {
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
}

/* Subtle Backgrounds */
.gradient-subtle {
  background: linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%);
}

/* Dark Mode Gradients */
.gradient-dark {
  background: linear-gradient(135deg, #1F2937 0%, #111827 100%);
}
```

## 3. Typography System

### 3.1 Font Stack
```css
/* Primary Font Family */
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 
                'Roboto', 'Helvetica Neue', Arial, sans-serif;

/* Monospace Font */
--font-mono: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', 
             Consolas, 'Courier New', monospace;

/* Display Font (Optional) */
--font-display: 'Inter Display', var(--font-primary);
```

### 3.2 Type Scale
```css
/* Mobile Type Scale */
--text-xs:   0.75rem;  /* 12px */
--text-sm:   0.875rem; /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg:   1.125rem; /* 18px */
--text-xl:   1.25rem;  /* 20px */
--text-2xl:  1.5rem;   /* 24px */
--text-3xl:  1.875rem; /* 30px */
--text-4xl:  2.25rem;  /* 36px */
--text-5xl:  3rem;     /* 48px */

/* Tablet/Desktop Scale */
@media (min-width: 768px) {
  --text-xs:   0.75rem;  /* 12px */
  --text-sm:   0.875rem; /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg:   1.125rem; /* 18px */
  --text-xl:   1.25rem;  /* 20px */
  --text-2xl:  1.5rem;   /* 24px */
  --text-3xl:  2rem;     /* 32px */
  --text-4xl:  2.5rem;   /* 40px */
  --text-5xl:  3.5rem;   /* 56px */
}
```

### 3.3 Typography Hierarchy
```css
/* Headings */
.text-h1 {
  font-size: var(--text-4xl);
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.text-h2 {
  font-size: var(--text-3xl);
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: -0.01em;
}

.text-h3 {
  font-size: var(--text-2xl);
  font-weight: 600;
  line-height: 1.3;
}

.text-h4 {
  font-size: var(--text-xl);
  font-weight: 600;
  line-height: 1.4;
}

/* Body Text */
.text-body-lg {
  font-size: var(--text-lg);
  font-weight: 400;
  line-height: 1.6;
}

.text-body {
  font-size: var(--text-base);
  font-weight: 400;
  line-height: 1.5;
}

.text-body-sm {
  font-size: var(--text-sm);
  font-weight: 400;
  line-height: 1.4;
}

/* Labels & Captions */
.text-label {
  font-size: var(--text-sm);
  font-weight: 500;
  line-height: 1.4;
  letter-spacing: 0.01em;
}

.text-caption {
  font-size: var(--text-xs);
  font-weight: 400;
  line-height: 1.3;
  letter-spacing: 0.02em;
}
```

## 4. Spacing System

### 4.1 Spacing Scale
```css
/* Base spacing unit: 4px */
--space-0:  0;
--space-1:  0.25rem;  /* 4px */
--space-2:  0.5rem;   /* 8px */
--space-3:  0.75rem;  /* 12px */
--space-4:  1rem;     /* 16px */
--space-5:  1.25rem;  /* 20px */
--space-6:  1.5rem;   /* 24px */
--space-8:  2rem;     /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

### 4.2 Component Spacing
```css
/* Card Spacing */
.card-padding-sm { padding: var(--space-3); }    /* 12px */
.card-padding    { padding: var(--space-4); }    /* 16px */
.card-padding-lg { padding: var(--space-6); }    /* 24px */

/* Section Spacing */
.section-gap-sm { gap: var(--space-4); }         /* 16px */
.section-gap    { gap: var(--space-6); }         /* 24px */
.section-gap-lg { gap: var(--space-8); }         /* 32px */

/* Layout Margins */
.layout-margin-sm { margin: var(--space-4); }    /* 16px */
.layout-margin    { margin: var(--space-6); }    /* 24px */
.layout-margin-lg { margin: var(--space-8); }    /* 32px */
```

## 5. Elevation & Shadow System

### 5.1 Shadow Levels
```css
/* Elevation Shadows */
--shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 
             0 1px 2px 0 rgba(0, 0, 0, 0.06);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 
             0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 
             0 4px 6px -2px rgba(0, 0, 0, 0.05);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 
             0 10px 10px -5px rgba(0, 0, 0, 0.04);

/* Dark Mode Shadows */
--shadow-dark-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.3);
--shadow-dark-md: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
--shadow-dark-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
```

### 5.2 Component Elevation
```css
.elevation-0 { box-shadow: none; }
.elevation-1 { box-shadow: var(--shadow-xs); }
.elevation-2 { box-shadow: var(--shadow-sm); }
.elevation-3 { box-shadow: var(--shadow-md); }
.elevation-4 { box-shadow: var(--shadow-lg); }
.elevation-5 { box-shadow: var(--shadow-xl); }
```

## 6. Border Radius System

### 6.1 Radius Scale
```css
--radius-none: 0;
--radius-sm:   0.125rem;  /* 2px */
--radius-md:   0.25rem;   /* 4px */
--radius-lg:   0.375rem;  /* 6px */
--radius-xl:   0.5rem;    /* 8px */
--radius-2xl:  0.75rem;   /* 12px */
--radius-3xl:  1rem;      /* 16px */
--radius-4xl:  1.5rem;    /* 24px */
--radius-full: 9999px;    /* Circle */
```

### 6.2 Component Radius
```css
.btn-radius     { border-radius: var(--radius-2xl); }  /* 12px */
.card-radius    { border-radius: var(--radius-3xl); }  /* 16px */
.input-radius   { border-radius: var(--radius-xl); }   /* 8px */
.avatar-radius  { border-radius: var(--radius-full); } /* Circle */
.modal-radius   { border-radius: var(--radius-4xl); }  /* 24px */
```

## 7. Component Specifications

### 7.1 Button System
```css
/* Base Button */
.btn-base {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-primary);
  font-weight: 500;
  border-radius: var(--radius-2xl);
  transition: all 0.15s ease;
  cursor: pointer;
  border: none;
  outline: none;
}

/* Button Sizes */
.btn-sm {
  height: 2rem;        /* 32px */
  padding: 0 0.75rem;  /* 12px */
  font-size: var(--text-sm);
  min-width: 4rem;     /* 64px */
}

.btn-md {
  height: 2.5rem;      /* 40px */
  padding: 0 1rem;     /* 16px */
  font-size: var(--text-base);
  min-width: 5rem;     /* 80px */
}

.btn-lg {
  height: 3rem;        /* 48px */
  padding: 0 1.5rem;   /* 24px */
  font-size: var(--text-lg);
  min-width: 6rem;     /* 96px */
}

.btn-xl {
  height: 3.5rem;      /* 56px */
  padding: 0 2rem;     /* 32px */
  font-size: var(--text-xl);
  min-width: 7rem;     /* 112px */
}

/* Button Variants */
.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: var(--shadow-sm);
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: var(--shadow-sm);
}

.btn-secondary {
  background: transparent;
  color: var(--primary-600);
  border: 2px solid var(--primary-600);
}

.btn-ghost {
  background: transparent;
  color: var(--neutral-600);
}

.btn-ghost:hover {
  background: var(--neutral-100);
}
```

### 7.2 Card System
```css
/* Base Card */
.card-base {
  background: var(--neutral-0);
  border-radius: var(--radius-3xl);
  padding: var(--space-4);
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
}

.card-base:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* Card Variants */
.card-elevated {
  box-shadow: var(--shadow-lg);
}

.card-bordered {
  border: 1px solid var(--neutral-200);
  box-shadow: none;
}

.card-gradient {
  background: linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%);
}

/* Progress Card */
.progress-card {
  position: relative;
  overflow: hidden;
}

.progress-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transform: scaleX(var(--progress, 0));
  transform-origin: left;
  transition: transform 0.3s ease;
}
```

### 7.3 Input System
```css
/* Base Input */
.input-base {
  width: 100%;
  height: 3rem;        /* 48px */
  padding: 0 var(--space-4);
  font-family: var(--font-primary);
  font-size: var(--text-base);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-xl);
  background: var(--neutral-0);
  transition: all 0.15s ease;
  outline: none;
}

.input-base:focus {
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.input-base:disabled {
  background: var(--neutral-50);
  color: var(--neutral-400);
  cursor: not-allowed;
}

/* Input States */
.input-error {
  border-color: var(--error-500);
}

.input-error:focus {
  border-color: var(--error-500);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.input-success {
  border-color: var(--success-500);
}

/* Input with Icon */
.input-with-icon {
  position: relative;
}

.input-with-icon input {
  padding-left: 3rem; /* 48px */
}

.input-icon {
  position: absolute;
  left: var(--space-4);
  top: 50%;
  transform: translateY(-50%);
  color: var(--neutral-400);
  width: 1.25rem;
  height: 1.25rem;
}
```

### 7.4 Badge System
```css
/* Base Badge */
.badge-base {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  font-size: var(--text-xs);
  font-weight: 500;
  border-radius: var(--radius-full);
  line-height: 1;
}

/* Badge Variants */
.badge-primary {
  background: var(--primary-100);
  color: var(--primary-800);
}

.badge-success {
  background: var(--success-100);
  color: var(--success-800);
}

.badge-warning {
  background: var(--warning-100);
  color: var(--warning-800);
}

.badge-error {
  background: var(--error-100);
  color: var(--error-800);
}

.badge-neutral {
  background: var(--neutral-100);
  color: var(--neutral-800);
}

/* Badge with dot */
.badge-dot {
  padding-left: 0.375rem;
}

.badge-dot::before {
  content: '';
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 50%;
  background: currentColor;
  margin-right: 0.25rem;
}
```

## 8. Animation & Motion System

### 8.1 Timing Functions
```css
/* Easing Curves */
--ease-linear:     cubic-bezier(0, 0, 1, 1);
--ease-in:         cubic-bezier(0.4, 0, 1, 1);
--ease-out:        cubic-bezier(0, 0, 0.2, 1);
--ease-in-out:     cubic-bezier(0.4, 0, 0.2, 1);
--ease-sharp:      cubic-bezier(0.4, 0, 0.6, 1);
--ease-emphasized: cubic-bezier(0.2, 0, 0, 1);

/* Duration Scale */
--duration-fast:    150ms;
--duration-normal:  200ms;
--duration-slow:    300ms;
--duration-slower:  500ms;
```

### 8.2 Animation Utilities
```css
/* Fade Transitions */
.fade-enter {
  opacity: 0;
  transform: translateY(10px);
  transition: all var(--duration-normal) var(--ease-out);
}

.fade-enter-active {
  opacity: 1;
  transform: translateY(0);
}

/* Scale Transitions */
.scale-enter {
  opacity: 0;
  transform: scale(0.95);
  transition: all var(--duration-fast) var(--ease-out);
}

.scale-enter-active {
  opacity: 1;
  transform: scale(1);
}

/* Slide Transitions */
.slide-enter {
  transform: translateX(100%);
  transition: transform var(--duration-normal) var(--ease-emphasized);
}

.slide-enter-active {
  transform: translateX(0);
}
```

### 8.3 Loading States
```css
/* Skeleton Animation */
@keyframes skeleton-loading {
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--neutral-200) 25%,
    var(--neutral-100) 50%,
    var(--neutral-200) 75%
  );
  background-size: 200px 100%;
  animation: skeleton-loading 1.5s infinite;
}

/* Pulse Animation */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Spin Animation */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.spin {
  animation: spin 1s linear infinite;
}
```

## 9. Responsive Design Tokens

### 9.1 Breakpoint System
```css
/* Breakpoint Variables */
--breakpoint-xs: 475px;
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
--breakpoint-2xl: 1536px;

/* Media Query Mixins */
@custom-media --xs (min-width: 475px);
@custom-media --sm (min-width: 640px);
@custom-media --md (min-width: 768px);
@custom-media --lg (min-width: 1024px);
@custom-media --xl (min-width: 1280px);
@custom-media --2xl (min-width: 1536px);
```

### 9.2 Container System
```css
.container {
  width: 100%;
  margin: 0 auto;
  padding: 0 var(--space-4);
}

@media (--sm) {
  .container {
    max-width: 640px;
  }
}

@media (--md) {
  .container {
    max-width: 768px;
    padding: 0 var(--space-6);
  }
}

@media (--lg) {
  .container {
    max-width: 1024px;
    padding: 0 var(--space-8);
  }
}

@media (--xl) {
  .container {
    max-width: 1280px;
  }
}
```

## 10. Accessibility Guidelines

### 10.1 Color Contrast
```css
/* Ensure WCAG AA compliance (4.5:1 for normal text, 3:1 for large text) */

/* High Contrast Alternatives */
.high-contrast {
  --text-contrast-normal: #000000;
  --text-contrast-large: #1F2937;
  --bg-contrast: #FFFFFF;
  --border-contrast: #374151;
}

/* Focus Indicators */
.focus-visible {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 10.2 Touch Targets
```css
/* Minimum touch target size: 44x44px */
.touch-target {
  min-width: 2.75rem;   /* 44px */
  min-height: 2.75rem;  /* 44px */
  position: relative;
}

/* Expanded touch area for small elements */
.touch-target::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  min-width: 2.75rem;
  min-height: 2.75rem;
}
```

---

*This design system serves as the single source of truth for all visual and interaction design decisions in the StudyMap application, ensuring consistency, accessibility, and maintainability across all platforms.* 