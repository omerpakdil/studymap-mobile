import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View
} from 'react-native';

import { Button, Text } from '@/components';
import { useTheme } from '@/themes';

const { width, height } = Dimensions.get('window');
const isIOS = Platform.OS === 'ios';

export default function WelcomeScreen() {
  const { colors } = useTheme();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous pulse animation for AI brain
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Continuous rotation for neural network
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const handleGetStarted = () => {
    router.push('/user-info');
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.neutral[0] }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.neutral[0]} />
      


      {/* Main Content */}
      <Animated.View 
        style={[
          styles.mainContent,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* AI Brain Visualization */}
        <View style={styles.visualSection}>
          {/* Rotating Neural Network Background */}
          <Animated.View
            style={[
              styles.neuralNetwork,
              {
                transform: [{ rotate: rotateInterpolate }],
              },
            ]}
          >
            <View style={[styles.neuralRing, styles.outerRing]} />
            <View style={[styles.neuralRing, styles.middleRing]} />
            <View style={[styles.neuralRing, styles.innerRing]} />
          </Animated.View>

          {/* Pulsing AI Brain Center */}
          <Animated.View
            style={[
              styles.brainCenter,
              {
                transform: [{ scale: pulseAnim }],
                backgroundColor: colors.primary[500],
              },
            ]}
          >
            <Text style={styles.brainIcon}>🧠</Text>
          </Animated.View>

          {/* Floating Data Points */}
          <View style={styles.dataPoints}>
            <View style={[styles.dataPoint, styles.point1, { backgroundColor: colors.primary[300] }]} />
            <View style={[styles.dataPoint, styles.point2, { backgroundColor: colors.secondary[400] }]} />
            <View style={[styles.dataPoint, styles.point3, { backgroundColor: colors.accent[400] }]} />
            <View style={[styles.dataPoint, styles.point4, { backgroundColor: colors.primary[400] }]} />
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.contentSection}>
                     <Text style={{
             ...styles.title,
             color: colors.neutral[900]
           }}>
             Welcome to
           </Text>
          <LinearGradient
            colors={[colors.primary[600], colors.primary[400]]}
            style={styles.titleGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.titleAccent}>StudyMap AI</Text>
          </LinearGradient>
          
          <Text style={{
            ...styles.subtitle,
            color: colors.neutral[600]
          }}>
            Your intelligent study companion that adapts to your learning style and maximizes your success.
          </Text>

          {/* Feature Pills */}
          <View style={styles.featurePills}>
            <View style={{
              ...styles.pill,
              backgroundColor: colors.primary[50]
            }}>
              <Text style={{
                ...styles.pillText,
                color: colors.primary[700]
              }}>
                🎯 Personalized Plans
              </Text>
            </View>
            <View style={{
              ...styles.pill,
              backgroundColor: colors.secondary[50]
            }}>
              <Text style={{
                ...styles.pillText,
                color: colors.secondary[700]
              }}>
                📊 Smart Analytics
              </Text>
            </View>
            <View style={{
              ...styles.pill,
              backgroundColor: colors.accent[50]
            }}>
              <Text style={{
                ...styles.pillText,
                color: colors.accent[700]
              }}>
                🚀 Goal Achievement
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Bottom Action Section */}
      <View style={styles.bottomSection}>
        <Button
          variant="primary"
          onPress={handleGetStarted}
          style={styles.ctaButton}
        >
          Start Your AI Journey
        </Button>
        
        <Text style={{
          ...styles.disclaimer,
          color: colors.neutral[500]
        }}>
          Free to start • Powered by advanced AI
        </Text>
      </View>

      {/* Background Gradient */}
      <LinearGradient
        colors={[
          'rgba(59, 130, 246, 0.02)',
          'transparent',
          'rgba(139, 92, 246, 0.02)',
        ]}
        style={styles.backgroundGradient}
        pointerEvents="none"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: isIOS ? 40 : 40,
  },
  visualSection: {
    height: 180,
    width: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  neuralNetwork: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  neuralRing: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 100,
  },
  outerRing: {
    width: 160,
    height: 160,
  },
  middleRing: {
    width: 120,
    height: 120,
    borderColor: 'rgba(139, 92, 246, 0.25)',
  },
  innerRing: {
    width: 70,
    height: 70,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  brainCenter: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
    zIndex: 10,
  },
  brainIcon: {
    fontSize: 28,
  },
  dataPoints: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  dataPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  point1: {
    top: 25,
    left: 55,
  },
  point2: {
    top: 50,
    right: 35,
  },
  point3: {
    bottom: 45,
    left: 35,
  },
  point4: {
    bottom: 25,
    right: 55,
  },
  contentSection: {
    alignItems: 'center',
    maxWidth: 320,
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '300',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 40,
    paddingVertical: 4,
  },
  titleGradient: {
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 20,
  },
  titleAccent: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 44,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    fontWeight: '400',
    marginBottom: 24,
    opacity: 0.9,
  },
  featurePills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: isIOS ? 30 : 30,
    alignItems: 'center',
  },
  ctaButton: {
    width: '100%',
    paddingVertical: 18,
    marginBottom: 16,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  disclaimer: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '400',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
}); 