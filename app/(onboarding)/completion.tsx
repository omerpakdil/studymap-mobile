import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Animated,
    Dimensions,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { loadCompleteOnboardingData, markOnboardingComplete } from '@/app/utils/onboardingData';
import { useTheme } from '@/themes';
import { generateStudyProgram } from '@/utils/aiStudyGenerator';
import { saveDailyTasks, saveStudyProgram } from '@/utils/studyProgramStorage';

const { width } = Dimensions.get('window');
const isIOS = Platform.OS === 'ios';

const achievements = [
  { id: 1, icon: '🎯', title: 'Learning Style', description: 'Personalized approach set' },
  { id: 2, icon: '📚', title: 'Subject Selection', description: 'Focus areas chosen' },
  { id: 3, icon: '📅', title: 'Study Schedule', description: 'Perfect timing planned' },
  { id: 4, icon: '🏆', title: 'Goals Defined', description: 'Success targets locked' },
];

export default function CompletionScreen() {
  const { colors } = useTheme();
  const [isGeneratingProgram, setIsGeneratingProgram] = useState(false);
  const [programGenerated, setProgramGenerated] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [animationValues] = useState({
    scale: new Animated.Value(0),
    opacity: new Animated.Value(0),
    achievements: achievements.map(() => new Animated.Value(0)),
  });

  useEffect(() => {
    // Start main animation
    Animated.sequence([
      Animated.parallel([
        Animated.spring(animationValues.scale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(animationValues.opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      // Animate achievements one by one
      Animated.stagger(200, 
        animationValues.achievements.map(value =>
          Animated.spring(value, {
            toValue: 1,
            tension: 80,
            friction: 8,
            useNativeDriver: true,
          })
        )
      ),
    ]).start();

    // Start AI program generation after animation
    generateAIStudyProgram();
  }, []);

  const generateAIStudyProgram = async () => {
    try {
      setIsGeneratingProgram(true);
      setGenerationError(null);
      
      // Mark onboarding as complete
      await markOnboardingComplete();
      
      // Load complete onboarding data
      const onboardingData = await loadCompleteOnboardingData();
      console.log('Onboarding data loaded:', {
        hasExamData: !!onboardingData.examData,
        hasGoalsData: !!onboardingData.goalsData,
        hasProficiency: Object.keys(onboardingData.topicProficiency).length > 0,
        hasSchedule: Object.keys(onboardingData.scheduleData).length > 0,
        examDate: onboardingData.goalsData?.examDate
      });
      
      // Generate AI study program
      const studyProgram = await generateStudyProgram(onboardingData);
      
      if (studyProgram) {
        // Save the generated program
        await saveStudyProgram(studyProgram);
        await saveDailyTasks(studyProgram.dailyTasks);
        
        console.log('AI Study Program Generated Successfully:', {
          examType: studyProgram.examType,
          totalTasks: studyProgram.dailyTasks.length,
          weeklyHours: studyProgram.weeklyHours,
          subjects: Object.keys(studyProgram.subjectAllocation),
        });
        
        setProgramGenerated(true);
      } else {
        console.warn('Failed to generate study program');
        setGenerationError('Unable to generate study program. Please check your exam date and try again.');
      }
    } catch (error) {
      console.error('Error generating AI study program:', error);
      let errorMessage = 'An unexpected error occurred while generating your study program.';
      
      if (error instanceof Error) {
        if (error.message.includes('Date')) {
          errorMessage = 'Invalid exam date format. Please check your exam date and try again.';
        } else if (error.message.includes('proficiency')) {
          errorMessage = 'Missing assessment data. Please complete the knowledge assessment.';
        }
      }
      
      setGenerationError(errorMessage);
    } finally {
      setIsGeneratingProgram(false);
    }
  };

  const handleGetStarted = () => {
    if (generationError) {
      // Retry generation
      generateAIStudyProgram();
    } else {
      // Navigate to main app dashboard
      router.replace('/(tabs)/dashboard');
    }
  };

  const getStatusMessage = () => {
    if (isGeneratingProgram) {
      return {
        title: '🧠 Generating Your Study Plan',
        description: 'AI is analyzing your assessment and creating a personalized study program...',
      };
    } else if (generationError) {
      return {
        title: '⚠️ Generation Failed',
        description: generationError,
      };
    } else if (programGenerated) {
      return {
        title: '🚀 Ready to Launch',
        description: 'Your AI-powered study plan is optimized and ready. Time to start your journey to success!',
      };
    } else {
      return {
        title: '🚀 Ready to Launch',
        description: 'Your personalized study plan is being prepared...',
      };
    }
  };

  const statusMessage = getStatusMessage();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.neutral[50] }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.neutral[50]} />
      
      {/* Content */}
      <View style={styles.content}>
        {/* Success Icon */}
        <Animated.View 
          style={[
            styles.iconContainer,
            {
              transform: [{ scale: animationValues.scale }],
              opacity: animationValues.opacity,
            }
          ]}
        >
          <View style={[styles.successCircle, { backgroundColor: colors.success[500] }]}>
            <Text style={styles.successIcon}>✓</Text>
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.View style={{ opacity: animationValues.opacity }}>
          <Text style={[styles.title, { color: colors.neutral[900] }]}>
            You're All Set!
          </Text>
        </Animated.View>

        {/* Subtitle */}
        <Animated.View style={{ opacity: animationValues.opacity }}>
          <Text style={[styles.subtitle, { color: colors.neutral[600] }]}>
            Your personalized study journey is ready to begin. Let's achieve your goals together!
          </Text>
        </Animated.View>

        {/* Achievements */}
        <View style={styles.achievementsContainer}>
          <Text style={[styles.achievementsTitle, { color: colors.neutral[800] }]}>
            Setup Complete
          </Text>
          
          <View style={styles.achievementsList}>
            {achievements.map((achievement, index) => (
              <Animated.View
                key={achievement.id}
                style={[
                  styles.achievementItem,
                  {
                    backgroundColor: colors.neutral[0],
                    borderColor: colors.neutral[200],
                    transform: [
                      {
                        scale: animationValues.achievements[index],
                      },
                      {
                        translateX: animationValues.achievements[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [-50, 0],
                        }),
                      },
                    ],
                    opacity: animationValues.achievements[index],
                  }
                ]}
              >
                <View style={[styles.achievementIcon, { backgroundColor: colors.success[50] }]}>
                  <Text style={styles.achievementEmoji}>{achievement.icon}</Text>
                </View>
                <View style={styles.achievementContent}>
                  <Text style={[styles.achievementTitle, { color: colors.neutral[800] }]}>
                    {achievement.title}
                  </Text>
                  <Text style={[styles.achievementDesc, { color: colors.neutral[600] }]}>
                    {achievement.description}
                  </Text>
                </View>
                <View style={[styles.checkmark, { backgroundColor: colors.success[500] }]}>
                  <Text style={styles.checkmarkIcon}>✓</Text>
                </View>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* AI Generation Status */}
        <View style={[
          styles.statsContainer, 
          { 
            backgroundColor: isGeneratingProgram 
              ? colors.warning[50] 
              : generationError 
                ? colors.error[50] 
                : colors.primary[50], 
            borderColor: isGeneratingProgram 
              ? colors.warning[200] 
              : generationError 
                ? colors.error[200] 
                : colors.primary[200] 
          }
        ]}>
          <View style={styles.statsContent}>
            <Text style={[
              styles.statsTitle, 
              { 
                color: isGeneratingProgram 
                  ? colors.warning[800] 
                  : generationError 
                    ? colors.error[800] 
                    : colors.primary[800] 
              }
            ]}>
              {statusMessage.title}
            </Text>
            <Text style={[
              styles.statsDesc, 
              { 
                color: isGeneratingProgram 
                  ? colors.warning[600] 
                  : generationError 
                    ? colors.error[600] 
                    : colors.primary[600] 
              }
            ]}>
              {statusMessage.description}
            </Text>
            {isGeneratingProgram && (
              <View style={styles.loadingIndicator}>
                <View style={[styles.loadingDot, { backgroundColor: colors.warning[500] }]} />
                <View style={[styles.loadingDot, { backgroundColor: colors.warning[500] }]} />
                <View style={[styles.loadingDot, { backgroundColor: colors.warning[500] }]} />
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Bottom Action */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={[
            styles.getStartedButton, 
            { 
              backgroundColor: (programGenerated && !isGeneratingProgram) 
                ? colors.primary[500] 
                : generationError 
                  ? colors.warning[500]
                  : colors.neutral[300],
              opacity: isGeneratingProgram ? 0.6 : 1,
            }
          ]}
          onPress={handleGetStarted}
          activeOpacity={0.9}
          disabled={isGeneratingProgram}
        >
          <Text style={[
            styles.getStartedButtonText,
            { 
              color: (programGenerated && !isGeneratingProgram) || generationError
                ? colors.neutral[0] 
                : colors.neutral[500] 
            }
          ]}>
            {isGeneratingProgram 
              ? 'Generating...' 
              : generationError 
                ? 'Retry Generation'
                : 'Start Learning'
            }
          </Text>
          {!isGeneratingProgram && (
            <Text style={[
              styles.buttonArrow,
              { 
                color: (programGenerated && !isGeneratingProgram) || generationError
                  ? colors.neutral[0] 
                  : colors.neutral[500] 
              }
            ]}>
              →
            </Text>
          )}
        </TouchableOpacity>
        
        <Text style={[styles.footerText, { color: colors.neutral[500] }]}>
          You can always adjust your preferences in settings
        </Text>
      </View>

      {/* Background Gradient */}
      <LinearGradient
        colors={[
          'rgba(34, 197, 94, 0.03)',
          'transparent',
          'rgba(99, 102, 241, 0.03)',
        ]}
        style={styles.backgroundGradient}
        pointerEvents="none"
      />

      {/* Confetti Effect */}
      <View style={styles.confettiContainer} pointerEvents="none">
        {[...Array(8)].map((_, i) => (
          <Animated.View
            key={i}
            style={[
              styles.confetti,
              {
                left: `${(i * 12) + 10}%`,
                backgroundColor: i % 2 === 0 ? colors.primary[400] : colors.success[400],
                transform: [
                  {
                    translateY: animationValues.opacity.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-20, 10],
                    }),
                  },
                  {
                    rotate: animationValues.opacity.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', `${(i * 45)}deg`],
                    }),
                  },
                ],
                opacity: animationValues.opacity.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, 1, 0.3],
                }),
              }
            ]}
          />
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 20,
  },
  successCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 6,
  },
  successIcon: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  achievementsContainer: {
    width: '100%',
    marginBottom: 20,
  },
  achievementsTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  achievementsList: {
    gap: 8,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  achievementIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  achievementEmoji: {
    fontSize: 14,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 1,
  },
  achievementDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkIcon: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  statsContainer: {
    width: '100%',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  statsContent: {
    alignItems: 'center',
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  statsDesc: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
  loadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  loadingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 2,
  },
  bottomSection: {
    paddingHorizontal: 20,
    paddingBottom: isIOS ? 30 : 16,
    paddingTop: 12,
    alignItems: 'center',
  },
  getStartedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 10,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
    marginBottom: 8,
  },
  getStartedButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginRight: 6,
  },
  buttonArrow: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    zIndex: -1,
  },
  confetti: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    top: 50,
  },
}); 