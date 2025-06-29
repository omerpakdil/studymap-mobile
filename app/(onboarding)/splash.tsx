import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';

import { Text } from '@/components';
import { useTheme } from '@/themes';

const { width, height } = Dimensions.get('window');
const isIOS = Platform.OS === 'ios';

export default function SplashScreen() {
  const { colors } = useTheme();
  
  // Logo animasyonları
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoRotation = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  
  // Metin animasyonları
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(30)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  
  // Arka plan animasyonları
  const backgroundOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Progress animasyonu
  const progressOpacity = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Status bar ayarı
    StatusBar.setBarStyle('light-content', true);
    if (!isIOS) {
      StatusBar.setBackgroundColor('transparent', true);
      StatusBar.setTranslucent(true);
    }

    // Pulse animasyonu (sürekli)
    const pulseAnimation = Animated.loop(
      Animated.sequence([
                 Animated.timing(pulseAnim, {
           toValue: 1.1,
           duration: 2000,
           easing: Easing.inOut(Easing.sin),
           useNativeDriver: true,
         }),
         Animated.timing(pulseAnim, {
           toValue: 1,
           duration: 2000,
           easing: Easing.inOut(Easing.sin),
           useNativeDriver: true,
         }),
      ])
    );

    // Ana animasyon sekansı
    const mainSequence = Animated.sequence([
      // 1. Arka plan fade in
      Animated.timing(backgroundOpacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),

      // 2. Logo scale in with rotation
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 1200,
          easing: Easing.elastic(1.2),
          useNativeDriver: true,
        }),
        Animated.timing(logoRotation, {
          toValue: 1,
          duration: 1500,
          easing: Easing.out(Easing.back(1.7)),
          useNativeDriver: true,
        }),
      ]),

      // 3. Title slide up
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(titleSlide, {
          toValue: 0,
          duration: 800,
          easing: Easing.out(Easing.back(1.7)),
          useNativeDriver: true,
        }),
      ]),

      // 4. Subtitle fade in
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),

      // 5. Progress bar appear and fill
      Animated.parallel([
        Animated.timing(progressOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(progressWidth, {
          toValue: width * 0.7,
          duration: 2000,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
      ]),
    ]);

    // Animasyonları başlat
    pulseAnimation.start();
    mainSequence.start();

    // Welcome ekranına git
    const timer = setTimeout(() => {
      router.replace('/(onboarding)/welcome');
    }, 4500);

    return () => {
      clearTimeout(timer);
      pulseAnimation.stop();
    };
  }, []);

  const logoRotationInterpolate = logoRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Gradient Background */}
      <Animated.View style={[styles.backgroundContainer, { opacity: backgroundOpacity }]}>
        <LinearGradient
          colors={[colors.primary[800], colors.primary[600], colors.primary[700]]}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        
        {/* Glow effect */}
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.1)', 'transparent']}
          style={styles.glowOverlay}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Main Content Container */}
      <View style={styles.contentContainer}>
        
        {/* Logo Container */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [
                { scale: Animated.multiply(logoScale, pulseAnim) },
                { rotate: logoRotationInterpolate },
              ],
            },
          ]}
        >
          {/* Outer glow ring */}
          <View style={[styles.glowRing, { borderColor: colors.warning[400] }]} />
          
          {/* Logo background */}
          <LinearGradient
            colors={[colors.neutral[0], colors.neutral[100]]}
            style={styles.logoBackground}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
                         {/* StudyMap Custom Logo */}
             <View style={styles.logoContent}>
               {/* Map base */}
               <View style={[styles.mapBase, { backgroundColor: colors.primary[500] }]} />
               
               {/* Route lines */}
               <View style={styles.routeLines}>
                 <View style={[styles.routeLine, styles.route1, { backgroundColor: colors.warning[400] }]} />
                 <View style={[styles.routeLine, styles.route2, { backgroundColor: colors.warning[400] }]} />
                 <View style={[styles.routeLine, styles.route3, { backgroundColor: colors.warning[400] }]} />
               </View>
               
               {/* Location pins */}
               <View style={styles.locationPins}>
                 <View style={[styles.pin, styles.pin1, { backgroundColor: colors.error[500] }]} />
                 <View style={[styles.pin, styles.pin2, { backgroundColor: colors.success[500] }]} />
                 <View style={[styles.pin, styles.pin3, { backgroundColor: colors.warning[500] }]} />
               </View>
               
               {/* Center symbol */}
               <View style={[styles.centerSymbol, { backgroundColor: colors.neutral[0] }]}>
                 <Text style={styles.symbolText}>S</Text>
               </View>
             </View>
          </LinearGradient>
        </Animated.View>

        {/* Brand Title */}
        <Animated.View
          style={[
            styles.titleContainer,
            {
              opacity: titleOpacity,
              transform: [{ translateY: titleSlide }],
            },
          ]}
        >
                     <Text style={{
             ...styles.brandTitle,
             color: colors.neutral[0],
           }}>
             StudyMap
           </Text>
          <View style={[styles.titleUnderline, { backgroundColor: colors.warning[400] }]} />
        </Animated.View>

        {/* Subtitle */}
        <Animated.Text
          style={[
            styles.subtitle,
            {
              opacity: subtitleOpacity,
              color: colors.neutral[200],
            },
          ]}
        >
          Your Personal Learning Journey
        </Animated.Text>

      </View>

      {/* Progress Section */}
      <Animated.View 
        style={[
          styles.progressSection,
          { opacity: progressOpacity }
        ]}
      >
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressWidth,
                backgroundColor: colors.warning[400],
              },
            ]}
          />
        </View>
        
                 <Text style={{
           ...styles.loadingText,
           color: colors.neutral[300],
         }}>
           Preparing your study experience...
         </Text>
      </Animated.View>

      {/* Decorative Elements */}
      <View style={styles.decorativeElements}>
        {/* Floating circles */}
        <Animated.View 
          style={[
            styles.floatingCircle,
            styles.circle1,
            { 
              opacity: backgroundOpacity,
              transform: [{ scale: pulseAnim }]
            }
          ]}
        />
        <Animated.View 
          style={[
            styles.floatingCircle,
            styles.circle2,
            { 
              opacity: backgroundOpacity,
              transform: [{ scale: pulseAnim }]
            }
          ]}
        />
        <Animated.View 
          style={[
            styles.floatingCircle,
            styles.circle3,
            { 
              opacity: backgroundOpacity,
              transform: [{ scale: pulseAnim }]
            }
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E40AF',
  },
  backgroundContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  gradient: {
    flex: 1,
  },
  glowOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    marginBottom: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: '#F59E0B',
    opacity: 0.3,
  },
  logoBackground: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  logoContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: 80,
    height: 80,
  },
  mapBase: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    opacity: 0.1,
  },
  routeLines: {
    position: 'absolute',
    width: 80,
    height: 80,
  },
  routeLine: {
    position: 'absolute',
    height: 3,
    borderRadius: 1.5,
  },
  route1: {
    width: 40,
    top: 25,
    left: 10,
    transform: [{ rotate: '30deg' }],
  },
  route2: {
    width: 35,
    top: 45,
    left: 20,
    transform: [{ rotate: '-15deg' }],
  },
  route3: {
    width: 30,
    top: 35,
    left: 35,
    transform: [{ rotate: '60deg' }],
  },
  locationPins: {
    position: 'absolute',
    width: 80,
    height: 80,
  },
  pin: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowColor: 'rgba(0,0,0,0.3)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 2,
  },
  pin1: {
    top: 20,
    left: 15,
  },
  pin2: {
    top: 50,
    left: 55,
  },
  pin3: {
    top: 35,
    left: 35,
  },
  centerSymbol: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(0,0,0,0.2)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 3,
  },
  symbolText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#3B82F6',
    textAlign: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 15,
    minHeight: 80,
  },
  brandTitle: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 42,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  titleUnderline: {
    width: 100,
    height: 4,
    borderRadius: 2,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
    letterSpacing: 0.5,
    textAlign: 'center',
    lineHeight: 24,
  },
  progressSection: {
    position: 'absolute',
    bottom: 80 + (isIOS ? 34 : 0),
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    marginBottom: 20,
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 4,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  decorativeElements: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  },
  floatingCircle: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 150,
  },
  circle1: {
    width: 300,
    height: 300,
    top: -150,
    right: -150,
  },
  circle2: {
    width: 200,
    height: 200,
    bottom: -100,
    left: -100,
  },
  circle3: {
    width: 150,
    height: 150,
    top: height * 0.2,
    left: -75,
  },
}); 