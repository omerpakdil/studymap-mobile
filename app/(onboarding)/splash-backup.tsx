import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  View,
} from 'react-native';

import { Text } from '@/components';
import { useTheme } from '@/themes';

const { width, height } = Dimensions.get('window');

// Neural network node positions for sophisticated animation
const createNeuralNodes = () => {
  const nodes = [];
  const nodeCount = 12;
  const centerX = width / 2;
  const centerY = height / 2 + 40; // Neural network merkezi biraz aşağıda
  
  for (let i = 0; i < nodeCount; i++) {
    const angle = (i * Math.PI * 2) / nodeCount;
    const radius = 140 + Math.sin(i * 0.7) * 30; // Daha moderate radius
    nodes.push({
      id: i,
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
      delay: i * 100,
    });
  }
  return nodes;
};

export default function SplashScreen() {
  const { colors, spacing } = useTheme();
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const brandOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const neuralOpacity = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;
  
  const nodes = createNeuralNodes();
  const nodeAnimations = useRef(
    nodes.map(() => ({
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    // Sophisticated animation sequence
    const animationSequence = Animated.sequence([
      // 1. Neural network appears
      Animated.timing(neuralOpacity, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      
      // 2. Neural nodes animate in staggered
      Animated.stagger(50, 
        nodeAnimations.map((anim) =>
          Animated.parallel([
            Animated.timing(anim.scale, {
              toValue: 1,
              duration: 600,
              easing: Easing.elastic(1.2),
              useNativeDriver: true,
            }),
            Animated.timing(anim.opacity, {
              toValue: 0.8,
              duration: 600,
              useNativeDriver: true,
            }),
          ])
        )
      ),
      
      // 3. Logo appears with elegant scale
      Animated.parallel([
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.back(1.7)),
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      
      // 4. Brand text slides in
      Animated.timing(brandOpacity, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      
      // 5. Tagline appears
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      
      // 6. Progress bar fills
      Animated.timing(progressWidth, {
        toValue: width * 0.6,
        duration: 1000,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
    ]);

    animationSequence.start();

    // Navigate to welcome after animation completes
    const timer = setTimeout(() => {
      router.replace('/(onboarding)/welcome');
    }, 4500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient
      colors={['#0F172A', '#1E293B', '#334155']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Neural Network Background */}
      <Animated.View 
        style={[
          styles.neuralContainer,
          { opacity: neuralOpacity }
        ]}
      >
        {nodes.map((node, index) => (
          <Animated.View
            key={node.id}
            style={[
              styles.neuralNode,
              {
                left: node.x - 6,
                top: node.y - 6,
                transform: [{ scale: nodeAnimations[index].scale }],
                opacity: nodeAnimations[index].opacity,
              },
            ]}
          />
        ))}
        
        {/* Connection lines */}
        <View style={styles.connectionsContainer}>
          {nodes.map((node, i) => {
            if (i < nodes.length - 1) {
              const nextNode = nodes[i + 1];
              const distance = Math.sqrt(
                Math.pow(nextNode.x - node.x, 2) + Math.pow(nextNode.y - node.y, 2)
              );
              const angle = Math.atan2(nextNode.y - node.y, nextNode.x - node.x);
              
              return (
                <View
                  key={`line-${i}`}
                  style={[
                    styles.connectionLine,
                    {
                      left: node.x,
                      top: node.y,
                      width: distance,
                      transform: [{ rotate: `${angle}rad` }],
                    },
                  ]}
                />
              );
            }
            return null;
          })}
        </View>
      </Animated.View>

      {/* Main Content */}
      <View style={styles.contentContainer}>
        {/* Logo Section */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [{ scale: logoScale }],
              opacity: logoOpacity,
            },
          ]}
        >
          <View style={styles.logoSymbol}>
            <LinearGradient
              colors={['#60A5FA', '#3B82F6', '#1D4ED8']}
              style={styles.logoGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.logoText}>S</Text>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Brand Name */}
        <Animated.View
          style={[
            styles.brandContainer,
            { opacity: brandOpacity }
          ]}
        >
          <Text style={{
            ...styles.brandText,
            color: colors.neutral[0]
          }}>
            StudyMap
          </Text>
          <View style={styles.brandUnderline} />
        </Animated.View>

        {/* Tagline */}
        <Animated.Text
          style={{
            ...styles.tagline,
            opacity: taglineOpacity,
            color: colors.neutral[400]
          }}
        >
          AI-Powered Learning Intelligence
        </Animated.Text>
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={[
          styles.progressTrack,
          { backgroundColor: colors.neutral[700] }
        ]}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressWidth,
                backgroundColor: colors.primary[400],
              },
            ]}
          />
        </View>
        
        <Text style={{
          ...styles.loadingText,
          color: colors.neutral[500]
        }}>
          Preparing your journey...
        </Text>
      </View>

      {/* Ambient Light Effects */}
      <View style={styles.ambientContainer}>
        <LinearGradient
          colors={['rgba(59, 130, 246, 0.1)', 'transparent']}
          style={[styles.ambientLight, styles.ambientLight1]}
        />
        <LinearGradient
          colors={['rgba(96, 165, 250, 0.08)', 'transparent']}
          style={[styles.ambientLight, styles.ambientLight2]}
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  neuralContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  neuralNode: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(96, 165, 250, 0.6)',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  connectionsContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  connectionLine: {
    position: 'absolute',
    height: 1,
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    transformOrigin: '0 50%',
  },
  contentContainer: {
    alignItems: 'center',
    zIndex: 10,
    marginTop: -60,
  },
  logoContainer: {
    marginBottom: 32,
  },
  logoSymbol: {
    width: 100,
    height: 100,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
    marginBottom: 8,
  },
  logoGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    lineHeight: 56,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 12,
  },
  brandText: {
    fontSize: 32,
    fontWeight: '300',
    letterSpacing: 2,
    marginBottom: 12,
    lineHeight: 40,
    textAlign: 'center',
  },
  brandUnderline: {
    width: 60,
    height: 2,
    backgroundColor: '#3B82F6',
    borderRadius: 1,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 80,
    alignItems: 'center',
    width: '100%',
  },
  progressTrack: {
    width: width * 0.6,
    height: 2,
    borderRadius: 1,
    marginBottom: 16,
  },
  progressBar: {
    height: 2,
    borderRadius: 1,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  ambientContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  ambientLight: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  ambientLight1: {
    top: -100,
    left: -50,
  },
  ambientLight2: {
    bottom: -100,
    right: -50,
  },
}); 