import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { useTheme } from '@/themes';

const { width, height } = Dimensions.get('window');
const isIOS = Platform.OS === 'ios';

// Learning style types
const learningStyles = [
  {
    id: 'visual',
    name: 'Visual Learner',
    icon: '👁️',
    color: '#3B82F6',
    gradient: ['#3B82F6', '#1D4ED8'] as const,
    description: 'Learn best through images, diagrams, and visual aids',
    characteristics: [
      'Remember faces better than names',
      'Prefer charts and graphs',
      'Like colorful presentations',
      'Think in pictures'
    ],
    studyMethods: ['Mind maps', 'Flashcards', 'Diagrams', 'Color coding']
  },
  {
    id: 'auditory',
    name: 'Auditory Learner',
    icon: '🎧',
    color: '#10B981',
    gradient: ['#10B981', '#059669'] as const,
    description: 'Learn best through listening and verbal instruction',
    characteristics: [
      'Remember names better than faces',
      'Enjoy discussions and debates',
      'Learn from lectures',
      'Think out loud'
    ],
    studyMethods: ['Audio recordings', 'Group discussions', 'Reading aloud', 'Music while studying']
  },
  {
    id: 'kinesthetic',
    name: 'Kinesthetic Learner',
    icon: '🤲',
    color: '#F59E0B',
    gradient: ['#F59E0B', '#D97706'] as const,
    description: 'Learn best through hands-on activities and movement',
    characteristics: [
      'Learn by doing',
      'Need to move while thinking',
      'Use gestures when talking',
      'Prefer practical activities'
    ],
    studyMethods: ['Practice exercises', 'Walking while studying', 'Physical models', 'Lab experiments']
  },
  {
    id: 'reading',
    name: 'Reading/Writing Learner',
    icon: '📚',
    color: '#8B5CF6',
    gradient: ['#8B5CF6', '#7C3AED'] as const,
    description: 'Learn best through reading and writing activities',
    characteristics: [
      'Love reading and writing',
      'Take detailed notes',
      'Prefer text-based information',
      'Learn from lists and definitions'
    ],
    studyMethods: ['Note-taking', 'Reading textbooks', 'Writing summaries', 'Making lists']
  }
];

// Quiz questions to determine learning style
const quizQuestions = [
  {
    id: 1,
    question: "When learning something new, you prefer to:",
    options: [
      { id: 'visual', text: 'See diagrams and visual examples', icon: '📊' },
      { id: 'auditory', text: 'Listen to explanations and discussions', icon: '🗣️' },
      { id: 'kinesthetic', text: 'Try it yourself hands-on', icon: '✋' },
      { id: 'reading', text: 'Read detailed instructions', icon: '📖' }
    ]
  },
  {
    id: 2,
    question: "When studying for an exam, you:",
    options: [
      { id: 'visual', text: 'Create colorful mind maps and charts', icon: '🎨' },
      { id: 'auditory', text: 'Record yourself reading and listen back', icon: '🎙️' },
      { id: 'kinesthetic', text: 'Walk around while reviewing', icon: '🚶' },
      { id: 'reading', text: 'Make detailed written notes', icon: '✍️' }
    ]
  },
  {
    id: 3,
    question: "In a classroom, you learn best when:",
    options: [
      { id: 'visual', text: 'Teacher uses slides and visual aids', icon: '💻' },
      { id: 'auditory', text: 'Teacher explains concepts verbally', icon: '👨‍🏫' },
      { id: 'kinesthetic', text: 'You can participate in activities', icon: '🎯' },
      { id: 'reading', text: 'You have textbooks to read', icon: '📚' }
    ]
  },
  {
    id: 4,
    question: "When remembering information, you:",
    options: [
      { id: 'visual', text: 'Picture it in your mind', icon: '🧠' },
      { id: 'auditory', text: 'Repeat it out loud', icon: '🔊' },
      { id: 'kinesthetic', text: 'Associate it with actions', icon: '💪' },
      { id: 'reading', text: 'Write it down multiple times', icon: '📝' }
    ]
  },
  {
    id: 5,
    question: "Your ideal study environment includes:",
    options: [
      { id: 'visual', text: 'Good lighting and visual materials', icon: '💡' },
      { id: 'auditory', text: 'Background music or discussion', icon: '🎵' },
      { id: 'kinesthetic', text: 'Space to move around', icon: '🏃' },
      { id: 'reading', text: 'Quiet space with books', icon: '📖' }
    ]
  }
];

interface QuizAnswers {
  [questionId: number]: string;
}

export default function LearningStyleScreen() {
  const { colors } = useTheme();
  const [showIntro, setShowIntro] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswers>({});
  const [showResults, setShowResults] = useState(false);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const currentQuestion = quizQuestions[currentQuestionIndex];
  const totalQuestions = quizQuestions.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  const handleAnswerSelect = (styleId: string) => {
    const newAnswers = {
      ...quizAnswers,
      [currentQuestion.id]: styleId
    };
    setQuizAnswers(newAnswers);

    // Animate to next question with modern slide transition
    if (currentQuestionIndex < totalQuestions - 1) {
      Animated.timing(slideAnim, {
        toValue: -width,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        setCurrentQuestionIndex(prev => prev + 1);
        slideAnim.setValue(width);
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start();
      });
    } else {
      // Calculate results
      calculateResults(newAnswers);
    }
  };

  const calculateResults = (answers: QuizAnswers) => {
    const styleScores: { [key: string]: number } = {
      visual: 0,
      auditory: 0,
      kinesthetic: 0,
      reading: 0
    };

    Object.values(answers).forEach(styleId => {
      styleScores[styleId]++;
    });

    // Get top 2 learning styles
    const sortedStyles = Object.entries(styleScores)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2)
      .map(([styleId]) => styleId);

    setSelectedStyles(sortedStyles);
    setShowResults(true);
  };

  const handleContinue = () => {
    // Navigate to next onboarding step (Schedule Setup)
    router.push('/(onboarding)/schedule');
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      Animated.timing(slideAnim, {
        toValue: width,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        setCurrentQuestionIndex(prev => prev - 1);
        slideAnim.setValue(-width);
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start();
      });
    } else {
      router.back();
    }
  };

  const getSelectedLearningStyles = () => {
    return selectedStyles.map(styleId => 
      learningStyles.find(style => style.id === styleId)
    ).filter(Boolean);
  };



  if (showIntro) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.neutral[50] }]}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.neutral[50]} />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={[styles.backIcon, { color: colors.neutral[600] }]}>←</Text>
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
                      <Text 
            style={[styles.headerTitle, { color: colors.neutral[900] }]}
            numberOfLines={1}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.8}
          >
            Learning Style Assessment
          </Text>
          </View>
          
          <View style={styles.headerRight} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Text style={styles.mainIcon}>🧠</Text>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.neutral[900] }]}>
            Let's Discover Your{'\n'}Learning Style
          </Text>

          {/* Description */}
          <Text style={[styles.description, { color: colors.neutral[600] }]}>
            Understanding how you learn best helps us create a personalized study plan that matches your preferences and maximizes your success.
          </Text>

          {/* Features */}
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: colors.primary[50] }]}>
                <Text style={styles.featureEmoji}>👁️</Text>
              </View>
              <View style={styles.featureContent}>
                <Text style={[styles.featureTitle, { color: colors.neutral[800] }]}>
                  Visual Learning
                </Text>
                <Text style={[styles.featureDesc, { color: colors.neutral[600] }]}>
                  Charts, diagrams, and visual aids
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: colors.success[50] }]}>
                <Text style={styles.featureEmoji}>🎧</Text>
              </View>
              <View style={styles.featureContent}>
                <Text style={[styles.featureTitle, { color: colors.neutral[800] }]}>
                  Auditory Learning
                </Text>
                <Text style={[styles.featureDesc, { color: colors.neutral[600] }]}>
                  Listening and verbal instruction
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: colors.warning[50] }]}>
                <Text style={styles.featureEmoji}>🤲</Text>
              </View>
              <View style={styles.featureContent}>
                <Text style={[styles.featureTitle, { color: colors.neutral[800] }]}>
                  Kinesthetic Learning
                </Text>
                <Text style={[styles.featureDesc, { color: colors.neutral[600] }]}>
                  Hands-on activities and movement
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: colors.primary[50] }]}>
                <Text style={styles.featureEmoji}>📚</Text>
              </View>
              <View style={styles.featureContent}>
                <Text style={[styles.featureTitle, { color: colors.neutral[800] }]}>
                  Reading/Writing Learning
                </Text>
                <Text style={[styles.featureDesc, { color: colors.neutral[600] }]}>
                  Text-based information and notes
                </Text>
              </View>
            </View>
          </View>

          {/* Info Box */}
          <View style={[styles.infoBox, { backgroundColor: colors.primary[50], borderColor: colors.primary[200] }]}>
            <Text style={[styles.infoText, { color: colors.primary[700] }]}>
              💡 This assessment takes about 2 minutes and helps us customize your study experience
            </Text>
          </View>
        </View>

        {/* Bottom Action */}
        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={[styles.continueButton, { backgroundColor: colors.primary[500] }]}
            onPress={() => setShowIntro(false)}
            activeOpacity={0.9}
          >
            <Text style={styles.continueButtonText}>Start Assessment</Text>
          </TouchableOpacity>
        </View>

        {/* Background Gradient */}
        <LinearGradient
          colors={[
            'rgba(99, 102, 241, 0.02)',
            'transparent',
            'rgba(139, 92, 246, 0.02)',
          ]}
          style={styles.backgroundGradient}
          pointerEvents="none"
        />
      </SafeAreaView>
    );
  }

  if (showResults) {
    const primaryStyle = getSelectedLearningStyles()[0];
    const secondaryStyle = getSelectedLearningStyles()[1];

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.neutral[50] }]}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.neutral[50]} />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={[styles.backIcon, { color: colors.neutral[600] }]}>←</Text>
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.neutral[900] }]}>
              Your Learning Style
            </Text>
            <View style={styles.progressInfo}>
              <Text style={[styles.progressText, { color: colors.success[600] }]}>
                Complete ✓
              </Text>
            </View>
          </View>
          
          <View style={styles.headerRight} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Results Header */}
          <View style={styles.resultsHeader}>
            <Text style={[styles.resultsTitle, { color: colors.neutral[900] }]}>
              Perfect! We've identified your learning style
            </Text>
            <Text style={[styles.resultsSubtitle, { color: colors.neutral[600] }]}>
              We'll customize your study experience based on these preferences
            </Text>
          </View>

          {/* Primary Learning Style */}
          <View style={styles.styleSection}>
            <Text style={[styles.sectionTitle, { color: colors.neutral[800] }]}>
              Primary Learning Style
            </Text>
            
            <LinearGradient
              colors={primaryStyle?.gradient || ['#3B82F6', '#1D4ED8'] as const}
              style={styles.primaryStyleCard}
            >
              <View style={styles.styleCardHeader}>
                <Text style={styles.styleIcon}>{primaryStyle?.icon}</Text>
                <Text style={styles.styleName}>{primaryStyle?.name}</Text>
              </View>
              
              <Text style={styles.styleDescription}>
                {primaryStyle?.description}
              </Text>

              <View style={styles.characteristicsSection}>
                <Text style={styles.characteristicsTitle}>Key Characteristics:</Text>
                {primaryStyle?.characteristics.map((char, index) => (
                  <View key={index} style={styles.characteristicItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.characteristicText}>{char}</Text>
                  </View>
                ))}
              </View>
            </LinearGradient>
          </View>

          {/* Secondary Learning Style */}
          {secondaryStyle && (
            <View style={styles.styleSection}>
              <Text style={[styles.sectionTitle, { color: colors.neutral[800] }]}>
                Secondary Learning Style
              </Text>
              
              <View style={[
                styles.secondaryStyleCard,
                { 
                  backgroundColor: colors.neutral[0],
                  borderColor: secondaryStyle.color
                }
              ]}>
                <View style={styles.secondaryHeader}>
                  <View style={[
                    styles.secondaryIconContainer,
                    { backgroundColor: `${secondaryStyle.color}20` }
                  ]}>
                    <Text style={styles.secondaryIcon}>{secondaryStyle.icon}</Text>
                  </View>
                  <View style={styles.secondaryInfo}>
                    <Text style={[styles.secondaryName, { color: colors.neutral[900] }]}>
                      {secondaryStyle.name}
                    </Text>
                    <Text style={[styles.secondaryDescription, { color: colors.neutral[600] }]}>
                      {secondaryStyle.description}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Study Methods Preview */}
          <View style={styles.methodsSection}>
            <Text style={[styles.sectionTitle, { color: colors.neutral[800] }]}>
              Recommended Study Methods
            </Text>
            
            <View style={styles.methodsGrid}>
              {primaryStyle?.studyMethods.map((method, index) => (
                <View 
                  key={index}
                  style={[
                    styles.methodTag,
                    { 
                      backgroundColor: `${primaryStyle.color}15`,
                      borderColor: `${primaryStyle.color}30`
                    }
                  ]}
                >
                  <Text style={[styles.methodText, { color: primaryStyle.color }]}>
                    {method}
                  </Text>
                </View>
              ))}
            </View>
          </View>


        </ScrollView>

        {/* Bottom Action */}
        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={[styles.continueButton, { backgroundColor: colors.primary[500] }]}
            onPress={handleContinue}
            activeOpacity={0.9}
          >
            <Text style={styles.continueButtonText}>Continue to Schedule Setup</Text>
          </TouchableOpacity>
        </View>

        {/* Background Gradient */}
        <LinearGradient
          colors={[
            'rgba(99, 102, 241, 0.02)',
            'transparent',
            'rgba(139, 92, 246, 0.02)',
          ]}
          style={styles.backgroundGradient}
          pointerEvents="none"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.neutral[50] }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.neutral[50]} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={[styles.backIcon, { color: colors.neutral[600] }]}>←</Text>
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text 
            style={[styles.headerTitle, { color: colors.neutral[900] }]}
            numberOfLines={1}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.8}
          >
            Learning Style Assessment
          </Text>
          <View style={styles.progressInfo}>
            <Text style={[styles.progressText, { color: colors.primary[600] }]}>
              {currentQuestionIndex + 1}/{totalQuestions}
            </Text>
            <View style={[styles.progressBar, { backgroundColor: colors.neutral[200] }]}>
              <View style={[
                styles.progressFill,
                { 
                  backgroundColor: colors.primary[500],
                  width: `${progress}%`
                }
              ]} />
            </View>
          </View>
        </View>
        
        <View style={styles.headerRight} />
      </View>

      {/* Question Counter */}
      <View style={styles.questionCounter}>
        <Text style={[styles.counterText, { color: colors.neutral[500] }]}>
          Question {currentQuestionIndex + 1} of {totalQuestions}
        </Text>
      </View>

      {/* Question Content */}
      <Animated.View 
        style={[
          styles.questionContainer,
          {
            transform: [{ translateX: slideAnim }]
          }
        ]}
      >
        <View style={styles.questionHeader}>
          <Text style={[styles.questionText, { color: colors.neutral[900] }]}>
            {currentQuestion.question}
          </Text>
        </View>

        {/* Answer Options */}
        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionCard,
                { 
                  backgroundColor: colors.neutral[0],
                  borderColor: colors.neutral[200]
                }
              ]}
              onPress={() => handleAnswerSelect(option.id)}
              activeOpacity={0.8}
            >
              <View style={styles.optionContent}>
                <View style={[
                  styles.optionIconContainer,
                  { backgroundColor: colors.primary[50] }
                ]}>
                  <Text style={styles.optionIcon}>{option.icon}</Text>
                </View>
                
                <Text style={[styles.optionText, { color: colors.neutral[800] }]}>
                  {option.text}
                </Text>
                
                <View style={[styles.selectCircle, { borderColor: colors.neutral[300] }]}>
                  <View style={styles.selectInner} />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      {/* Background Gradient */}
      <LinearGradient
        colors={[
          'rgba(99, 102, 241, 0.02)',
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: isIOS ? 4 : 8,
    paddingBottom: 8,
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    width: 32,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
    flexShrink: 1,
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressBar: {
    width: 50,
    height: 2,
    borderRadius: 1,
  },
  progressFill: {
    height: 2,
    borderRadius: 1,
  },
  questionCounter: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  counterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  questionContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  questionHeader: {
    marginBottom: 24,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    borderRadius: 12,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionIcon: {
    fontSize: 20,
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  selectCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  resultsHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  resultsTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  resultsSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  styleSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  primaryStyleCard: {
    borderRadius: 16,
    padding: 20,
  },
  styleCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  styleIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  styleName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    flex: 1,
  },
  styleDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
    marginBottom: 16,
  },
  characteristicsSection: {
    marginTop: 8,
  },
  characteristicsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  characteristicItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  bullet: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginRight: 8,
    marginTop: 2,
  },
  characteristicText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
    flex: 1,
  },
  secondaryStyleCard: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 3,
  },
  secondaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  secondaryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  secondaryIcon: {
    fontSize: 20,
  },
  secondaryInfo: {
    flex: 1,
  },
  secondaryName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  secondaryDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  methodsSection: {
    marginBottom: 24,
  },
  methodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  methodTag: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  methodText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bottomSection: {
    paddingHorizontal: 16,
    paddingBottom: isIOS ? 30 : 16,
    paddingTop: 16,
  },
  continueButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  timeCard: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 3,
  },
  timeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  timeIcon: {
    fontSize: 20,
  },
  timeInfo: {
    flex: 1,
  },
  timeName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  timeDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  mainIcon: {
    fontSize: 64,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  featuresContainer: {
    gap: 16,
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureEmoji: {
    fontSize: 20,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  infoBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    fontWeight: '500',
  },
}); 