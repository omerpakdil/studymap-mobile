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
  TouchableOpacity,
  View
} from 'react-native';

import { Text } from '@/components';
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
  const titleScaleAnim = useRef(new Animated.Value(0.8)).current;
  const featureAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const ctaAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start main animations sequence
    Animated.sequence([
      // Initial fade and slide
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
      ]),
      // Title scale animation
      Animated.spring(titleScaleAnim, {
        toValue: 1,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }),
      // Staggered feature cards animation
      Animated.stagger(150, 
        featureAnims.map(anim =>
          Animated.spring(anim, {
            toValue: 1,
            tension: 60,
            friction: 8,
            useNativeDriver: true,
          })
        )
      ),
      // CTA button animation
      Animated.spring(ctaAnim, {
        toValue: 1,
        tension: 70,
        friction: 9,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous pulse animation for AI brain
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Continuous rotation for neural network
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 25000,
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
          {/* Modern Welcome Text */}
          <Animated.View 
            style={[
              styles.welcomeTextContainer,
              {
                transform: [{ scale: titleScaleAnim }],
                opacity: fadeAnim,
              }
            ]}
          >
            <Text style={[styles.welcomeLabel, { color: colors.primary[600] }]}>
              WELCOME TO THE FUTURE
            </Text>
            <View style={styles.titleContainer}>
              <Text style={[styles.title, { color: colors.neutral[900] }]}>
                StudyMap
              </Text>
              <LinearGradient
                colors={[colors.primary[500], colors.secondary[500], colors.accent[500]]}
                style={styles.aiGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.aiText}>AI</Text>
              </LinearGradient>
            </View>
          </Animated.View>
          
          <Text style={[styles.subtitle, { color: colors.neutral[600] }]}>
            Transform your study habits with personalized learning plans. 
            <Text style={[styles.subtitleAccent, { color: colors.primary[600] }]}> Achieve more, stress less.</Text>
          </Text>

          {/* Modern Feature Cards */}
          <View style={styles.featureGrid}>
            {[
              {
                emoji: '🎯',
                title: 'Smart Plans',
                description: 'Personalized study schedules that work',
                backgroundColor: colors.neutral[0],
                borderColor: colors.primary[100],
                shadowColor: colors.primary[500],
                iconBg: colors.primary[50],
              },
              {
                emoji: '📊',
                title: 'Analytics',
                description: 'Track progress with insights',
                backgroundColor: colors.neutral[0],
                borderColor: colors.secondary[100],
                shadowColor: colors.secondary[500],
                iconBg: colors.secondary[50],
              },
              {
                emoji: '🚀',
                title: 'Goals',
                description: 'Achieve targets faster',
                backgroundColor: colors.neutral[0],
                borderColor: colors.accent[100],
                shadowColor: colors.accent[500],
                iconBg: colors.accent[50],
              },
            ].map((feature, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.featureCard,
                  {
                    backgroundColor: feature.backgroundColor,
                    borderColor: feature.borderColor,
                    shadowColor: feature.shadowColor,
                    opacity: featureAnims[index],
                    transform: [
                      {
                        scale: featureAnims[index],
                      },
                      {
                        translateY: featureAnims[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <View style={[styles.featureIcon, { backgroundColor: feature.iconBg }]}>
                  <Text style={styles.featureEmoji}>{feature.emoji}</Text>
                </View>
                <Text style={[styles.featureTitle, { color: colors.neutral[800] }]}>
                  {feature.title}
                </Text>
                <Text style={[styles.featureDesc, { color: colors.neutral[600] }]}>
                  {feature.description}
                </Text>
              </Animated.View>
            ))}
          </View>
        </View>
      </Animated.View>

      {/* Bottom Action Section */}
      <Animated.View 
        style={[
          styles.bottomSection,
          {
            opacity: ctaAnim,
            transform: [
              {
                translateY: ctaAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.ctaButton, { backgroundColor: colors.primary[500] }]}
          onPress={handleGetStarted}
          activeOpacity={0.9}
        >
          <Text style={styles.ctaText}>Get Started</Text>
          <Text style={styles.ctaArrow}>→</Text>
        </TouchableOpacity>

        <View style={styles.disclaimerContainer}>
          <View style={styles.disclaimerRow}>
            <View style={[styles.bulletPoint, { backgroundColor: colors.primary[400] }]} />
            <Text style={[styles.disclaimer, { color: colors.neutral[500] }]}>
              Personalized learning
            </Text>
          </View>
          <View style={styles.disclaimerRow}>
            <View style={[styles.bulletPoint, { backgroundColor: colors.primary[400] }]} />
            <Text style={[styles.disclaimer, { color: colors.neutral[500] }]}>
              Track your progress
            </Text>
          </View>
        </View>
      </Animated.View>

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
    paddingTop: isIOS ? 60 : 50,
  },
  visualSection: {
    height: 140,
    width: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
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
    width: 120,
    height: 120,
  },
  middleRing: {
    width: 90,
    height: 90,
    borderColor: 'rgba(139, 92, 246, 0.25)',
  },
  innerRing: {
    width: 55,
    height: 55,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  brainCenter: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 10,
  },
  brainIcon: {
    fontSize: 24,
  },
  dataPoints: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  dataPoint: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  point1: {
    top: 18,
    left: 42,
  },
  point2: {
    top: 38,
    right: 26,
  },
  point3: {
    bottom: 34,
    left: 26,
  },
  point4: {
    bottom: 18,
    right: 42,
  },
  contentSection: {
    alignItems: 'center',
    maxWidth: width - 48,
    marginBottom: 48,
  },
  welcomeTextContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
    opacity: 0.8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 52,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  aiGradient: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    lineHeight: 36,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 26,
    textAlign: 'center',
    fontWeight: '400',
    marginBottom: 32,
    opacity: 0.85,
    paddingHorizontal: 8,
  },
  subtitleAccent: {
    fontWeight: '600',
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    maxWidth: 340,
  },
  featureCard: {
    width: (width - 80) / 3,
    minWidth: 100,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureEmoji: {
    fontSize: 18,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 14,
    opacity: 0.8,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: isIOS ? 20 : 20,
    alignItems: 'center',
  },
  ctaButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    gap: 8,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  ctaArrow: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  disclaimerContainer: {
    alignItems: 'center',
    gap: 6,
  },
  disclaimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bulletPoint: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  disclaimer: {
    fontSize: 13,
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