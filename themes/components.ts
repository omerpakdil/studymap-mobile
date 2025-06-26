// Component Styles
// Pre-built component styles combining all theme elements

import borders from './borders';
import shadows from './shadows';
import spacing from './spacing';
import { ComponentStyles } from './types';

const components: ComponentStyles = {
  // Button styles
  button: {
    base: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: borders.lg,
      ...shadows.sm,
    },
    
    sizes: {
      sm: {
        paddingHorizontal: spacing[3],  // 12px
        paddingVertical: spacing[2],    // 8px
        minHeight: 32,
      },
      
      md: {
        paddingHorizontal: spacing[4],  // 16px
        paddingVertical: spacing[3],    // 12px
        minHeight: 44,
      },
      
      lg: {
        paddingHorizontal: spacing[6],  // 24px
        paddingVertical: spacing[4],    // 16px
        minHeight: 52,
      },
      
      xl: {
        paddingHorizontal: spacing[8],  // 32px
        paddingVertical: spacing[5],    // 20px
        minHeight: 60,
      },
    },
    
    variants: {
      primary: {
        // Colors will be applied by theme provider
      },
      
      secondary: {
        borderWidth: 1,
      },
      
      ghost: {
        backgroundColor: 'transparent',
        ...shadows.xs,
      },
      
      danger: {
        // Error colors will be applied by theme provider
      },
    },
  },
  
  // Card styles
  card: {
    base: {
      backgroundColor: 'white', // Will be themed
      borderRadius: borders.lg,
      padding: spacing[4],        // 16px
      ...shadows.sm,
    },
    
    variants: {
      elevated: {
        ...shadows.md,
      },
      
      bordered: {
        borderWidth: 1,
        ...shadows.xs,
      },
      
      gradient: {
        // Gradient background will be applied by theme provider
        borderWidth: 0,
      },
      
      progress: {
        borderRadius: borders.xl,   // 16px
        padding: spacing[5],        // 20px
        ...shadows.md,
      },
    },
  },
  
  // Input styles
  input: {
    base: {
      borderRadius: borders.md,     // 8px
      paddingHorizontal: spacing[4], // 16px
      paddingVertical: spacing[3],   // 12px
      borderWidth: 1,
      fontSize: 16,
      lineHeight: 24,
      minHeight: 44,
    },
    
    states: {
      focus: {
        borderWidth: 2,
        ...shadows.sm,
      },
      
      error: {
        borderWidth: 1,
      },
      
      success: {
        borderWidth: 1,
      },
      
      disabled: {
        opacity: 0.6,
      },
    },
    
    withIcon: {
      paddingLeft: spacing[10],     // 40px (for icon space)
    },
  },
  
  // Badge styles
  badge: {
    base: {
      paddingHorizontal: spacing[2], // 8px
      paddingVertical: spacing[1],   // 4px
      borderRadius: borders.md,      // 8px
      fontSize: 12,
      fontWeight: '500',
      textAlign: 'center',
      overflow: 'hidden',
    },
    
    variants: {
      primary: {
        // Primary colors will be applied by theme provider
      },
      
      secondary: {
        // Secondary colors will be applied by theme provider
      },
      
      success: {
        // Success colors will be applied by theme provider
      },
      
      warning: {
        // Warning colors will be applied by theme provider
      },
      
      error: {
        // Error colors will be applied by theme provider
      },
      
      neutral: {
        // Neutral colors will be applied by theme provider
      },
    },
  },
  
  // Modal styles
  modal: {
    backdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    
    content: {
      backgroundColor: 'white', // Will be themed
      borderRadius: borders.xl, // 16px
      padding: spacing[6],      // 24px
      margin: spacing[4],       // 16px
      maxWidth: '90%',
      maxHeight: '80%',
      ...shadows.xl,
    },
    
    bottomSheet: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'white', // Will be themed
      borderTopLeftRadius: borders['2xl'],  // 20px
      borderTopRightRadius: borders['2xl'], // 20px
      paddingTop: spacing[2],    // 8px
      paddingHorizontal: spacing[4], // 16px
      paddingBottom: spacing[8], // 32px (safe area)
      ...shadows.lg,
    },
    
    centered: {
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'white', // Will be themed
      borderRadius: borders.xl, // 16px
      padding: spacing[6],      // 24px
      ...shadows.xl,
    },
  },
  
  // Navigation styles
  navigation: {
    tabBar: {
      flexDirection: 'row',
      backgroundColor: 'white', // Will be themed
      borderTopWidth: 1,
      paddingBottom: spacing[2], // 8px (safe area handled separately)
      paddingTop: spacing[2],    // 8px
      ...shadows.md,
    },
    
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'white',  // Will be themed
      paddingHorizontal: spacing[4], // 16px
      height: 56,
      borderBottomWidth: 1,
      ...shadows.sm,
    },
    
    tabIndicator: {
      position: 'absolute',
      bottom: 0,
      height: 2,
      borderRadius: 1,
      // Color will be applied by theme provider
    },
  },
};

// Study-specific component styles
export const studyComponents = {
  // Progress ring
  progressRing: {
    container: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    
    ring: {
      transform: [{ rotate: '-90deg' }], // Start from top
    },
    
    text: {
      position: 'absolute' as const,
      fontSize: 24,
      fontWeight: '700',
      textAlign: 'center' as const,
    },
  },
  
  // Timer card
  timerCard: {
    container: {
      backgroundColor: 'white', // Will be themed
      borderRadius: borders['2xl'], // 20px
      padding: spacing[8],          // 32px
      alignItems: 'center',
      ...shadows.md,
    },
    
    timer: {
      fontSize: 48,
      fontWeight: '700',
      fontFamily: 'monospace',
      textAlign: 'center' as const,
      marginBottom: spacing[4], // 16px
    },
    
    controls: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      width: '100%',
      marginTop: spacing[6], // 24px
    },
  },
  
  // Achievement badge
  achievementBadge: {
    container: {
      alignItems: 'center',
      padding: spacing[3],      // 12px
      borderRadius: borders.lg, // 12px
      backgroundColor: 'white', // Will be themed
      ...shadows.sm,
    },
    
    icon: {
      width: 32,
      height: 32,
      marginBottom: spacing[2], // 8px
    },
    
    text: {
      fontSize: 12,
      fontWeight: '500',
      textAlign: 'center' as const,
    },
  },
  
  // Calendar cell
  calendarCell: {
    base: {
      width: 40,
      height: 40,
      borderRadius: borders.md, // 8px
      alignItems: 'center',
      justifyContent: 'center',
      margin: spacing[1],       // 4px
    },
    
    today: {
      borderWidth: 2,
    },
    
    selected: {
      ...shadows.sm,
    },
    
    hasEvents: {
      borderBottomWidth: 2,
    },
  },
  
  // Subject chip
  subjectChip: {
    container: {
      paddingHorizontal: spacing[3], // 12px
      paddingVertical: spacing[1],   // 4px
      borderRadius: borders.full,    // Pill shape
      marginRight: spacing[2],       // 8px
      marginBottom: spacing[2],      // 8px
    },
    
    text: {
      fontSize: 12,
      fontWeight: '500',
      color: 'white',
    },
  },
  
  // Study session card
  sessionCard: {
    container: {
      backgroundColor: 'white', // Will be themed
      borderRadius: borders.lg, // 12px
      padding: spacing[4],      // 16px
      marginBottom: spacing[3], // 12px
      ...shadows.sm,
    },
    
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing[3], // 12px
    },
    
    title: {
      fontSize: 16,
      fontWeight: '600',
    },
    
    duration: {
      fontSize: 14,
      fontWeight: '500',
    },
    
    description: {
      fontSize: 14,
      lineHeight: 20,
      marginBottom: spacing[3], // 12px
    },
    
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
  },
};

// Layout component styles
export const layoutComponents = {
  // Screen container
  screen: {
    flex: 1,
    backgroundColor: 'white', // Will be themed
  },
  
  // Safe area wrapper
  safeArea: {
    flex: 1,
    paddingTop: 44, // Status bar height (iOS)
  },
  
  // Content container
  container: {
    flex: 1,
    paddingHorizontal: spacing[4], // 16px
  },
  
  // Section
  section: {
    marginBottom: spacing[6], // 24px
  },
  
  // Divider
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB', // Will be themed
    marginVertical: spacing[4],  // 16px
  },
  
  // Spacer
  spacer: {
    flex: 1,
  },
  
  // Row layout
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  // Column layout
  column: {
    flexDirection: 'column',
  },
  
  // Center layout
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
};

// Form component styles
export const formComponents = {
  // Form field wrapper
  field: {
    marginBottom: spacing[4], // 16px
  },
  
  // Label
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: spacing[2], // 8px
  },
  
  // Error text
  error: {
    fontSize: 12,
    marginTop: spacing[1], // 4px
  },
  
  // Help text
  help: {
    fontSize: 12,
    marginTop: spacing[1], // 4px
  },
  
  // Field group
  group: {
    marginBottom: spacing[6], // 24px
  },
  
  // Checkbox/Radio wrapper
  checkboxWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3], // 12px
  },
  
  // Checkbox/Radio
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    marginRight: spacing[3], // 12px
    alignItems: 'center',
    justifyContent: 'center',
  },
};

export default components; 