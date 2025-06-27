import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    Alert,
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

const { width } = Dimensions.get('window');
const isIOS = Platform.OS === 'ios';

// Timer states
type TimerState = 'study' | 'break' | 'longBreak' | 'paused' | 'completed';

// Session types
type SessionType = 'Practice' | 'Study' | 'Review';

// Content type definitions
type QuestionContent = {
  id: number;
  type: 'question';
  question: string;
  options: string[];
  correct: number;
  explanation: string;
};

type PassageContent = {
  id: number;
  type: 'passage';
  passage: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
};

type PromptContent = {
  id: number;
  type: 'prompt';
  prompt: string;
  sampleAnswer?: string;
  tips?: string[];
};

type ContentItem = QuestionContent | PassageContent | PromptContent;

// Mock content data - will be replaced with real content later
const mockContent: Record<string, Record<string, ContentItem[]>> = {
  Math: {
    Algebra: [
      {
        id: 1,
        type: 'question',
        question: 'Solve for x: 2x + 5 = 17',
        options: ['x = 6', 'x = 8', 'x = 12', 'x = 11'],
        correct: 0,
        explanation: 'Subtract 5 from both sides: 2x = 12, then divide by 2: x = 6'
      },
      {
        id: 2,
        type: 'question',
        question: 'If y = 3x + 2, what is y when x = 4?',
        options: ['y = 14', 'y = 12', 'y = 10', 'y = 16'],
        correct: 0,
        explanation: 'Substitute x = 4: y = 3(4) + 2 = 12 + 2 = 14'
      },
    ],
    Geometry: [
      {
        id: 3,
        type: 'question',
        question: 'What is the area of a circle with radius 5?',
        options: ['25π', '10π', '5π', '15π'],
        correct: 0,
        explanation: 'Area = πr² = π(5)² = 25π'
      },
    ],
  },
  Verbal: {
    'Reading Comprehension': [
      {
        id: 4,
        type: 'passage',
        passage: 'The ancient Greeks believed that the four elements - earth, air, fire, and water - were the fundamental building blocks of all matter...',
        question: 'According to the passage, how many elements did the ancient Greeks identify?',
        options: ['Three', 'Four', 'Five', 'Six'],
        correct: 1,
        explanation: 'The passage clearly states "four elements - earth, air, fire, and water"'
      },
    ],
  },
  Writing: {
    Essays: [
      {
        id: 5,
        type: 'prompt',
        prompt: 'Write a thesis statement for an essay about the importance of renewable energy.',
        sampleAnswer: 'Renewable energy sources are essential for combating climate change, reducing dependence on fossil fuels, and ensuring sustainable economic growth for future generations.',
        tips: ['Be specific and arguable', 'Include your main points', 'Keep it concise but comprehensive']
      },
    ],
  },
};

export default function StudySessionScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{
    taskId: string;
    subject: string;
    topic: string;
    type: string;
    duration: string;
  }>();

  // Timer state
  const [timerState, setTimerState] = useState<TimerState>('study');
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [currentSession, setCurrentSession] = useState(1);
  const [totalSessions, setTotalSessions] = useState(4);

  // Content state
  const [currentContentIndex, setCurrentContentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Get content for current subject/topic
  const getContent = () => {
    const subject = params?.subject as keyof typeof mockContent;
    const topic = params?.topic as keyof typeof mockContent[typeof subject];
    return mockContent[subject]?.[topic] || [];
  };

  const content = getContent();
  const currentContent = content[currentContentIndex];

  // Timer functions
  const startTimer = () => {
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimerComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const pauseTimer = () => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const resetTimer = () => {
    pauseTimer();
    if (timerState === 'study') {
      setTimeLeft(25 * 60);
    } else if (timerState === 'break') {
      setTimeLeft(5 * 60);
    } else if (timerState === 'longBreak') {
      setTimeLeft(15 * 60);
    }
  };

  const handleTimerComplete = () => {
    pauseTimer();
    
    if (timerState === 'study') {
      if (currentSession % 4 === 0) {
        // Long break after 4 sessions
        setTimerState('longBreak');
        setTimeLeft(15 * 60);
      } else {
        // Short break
        setTimerState('break');
        setTimeLeft(5 * 60);
      }
      Alert.alert('Study Session Complete!', 'Time for a break. Great job! 🎉');
    } else {
      // Break complete, start next study session
      setTimerState('study');
      setTimeLeft(25 * 60);
      setCurrentSession(prev => prev + 1);
      Alert.alert('Break Over!', 'Ready for the next study session? 💪');
    }
  };

  const handleAnswer = (answerIndex: number) => {
    if (selectedAnswer !== null) return; // Already answered
    
    setSelectedAnswer(answerIndex);
    setShowExplanation(true);
    setTotalAnswered(prev => prev + 1);
    
    if ('correct' in currentContent && currentContent.correct === answerIndex) {
      setCorrectAnswers(prev => prev + 1);
    }
  };

  const nextContent = () => {
    if (currentContentIndex < content.length - 1) {
      setCurrentContentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      // Session complete
      handleSessionComplete();
    }
  };

  const previousContent = () => {
    if (currentContentIndex > 0) {
      setCurrentContentIndex(prev => prev - 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  const handleSessionComplete = () => {
    pauseTimer();
    setTimerState('completed');
    
    const accuracy = totalAnswered > 0 ? Math.round((correctAnswers / totalAnswered) * 100) : 0;
    
    Alert.alert(
      'Session Complete! 🎉',
      `Great work! You got ${correctAnswers}/${totalAnswered} questions right (${accuracy}% accuracy).`,
      [
        { text: 'Review Session', onPress: () => {} },
        { text: 'Back to Dashboard', onPress: () => router.back() },
      ]
    );
  };

  const exitSession = () => {
    Alert.alert(
      'Exit Study Session?',
      'Your progress will be saved. Are you sure you want to exit?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Exit', onPress: () => router.back() },
      ]
    );
  };

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get timer color based on state
  const getTimerColor = () => {
    switch (timerState) {
      case 'study': return colors.primary[500];
      case 'break': return colors.success[500];
      case 'longBreak': return colors.warning[500];
      default: return colors.neutral[500];
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const renderTimer = () => (
    <View style={styles.timerContainer}>
      <View style={[styles.timerCircle, { borderColor: getTimerColor() }]}>
        <Text style={[styles.timerText, { color: getTimerColor() }]}>
          {formatTime(timeLeft)}
        </Text>
        <Text style={[styles.timerLabel, { color: colors.neutral[600] }]}>
          {timerState === 'study' ? 'Focus Time' : 
           timerState === 'break' ? 'Short Break' : 
           timerState === 'longBreak' ? 'Long Break' : 'Completed'}
        </Text>
      </View>
      
      <View style={styles.timerControls}>
        <TouchableOpacity
          style={[styles.timerButton, { backgroundColor: colors.neutral[100] }]}
          onPress={resetTimer}
        >
          <Text style={[styles.timerButtonText, { color: colors.neutral[700] }]}>Reset</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.timerButton, { backgroundColor: getTimerColor() }]}
          onPress={isRunning ? pauseTimer : startTimer}
        >
          <Text style={[styles.timerButtonText, { color: '#FFFFFF' }]}>
            {isRunning ? 'Pause' : 'Start'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.sessionProgress}>
        <Text style={[styles.sessionText, { color: colors.neutral[600] }]}>
          Session {currentSession} of {totalSessions}
        </Text>
        <View style={styles.sessionDots}>
          {Array.from({ length: totalSessions }, (_, i) => (
            <View
              key={i}
              style={[
                styles.sessionDot,
                {
                  backgroundColor: i < currentSession 
                    ? colors.success[500] 
                    : i === currentSession - 1 
                    ? getTimerColor() 
                    : colors.neutral[200]
                }
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );

  const renderContent = () => {
    if (!currentContent) {
      return (
        <View style={styles.noContentContainer}>
          <Text style={[styles.noContentText, { color: colors.neutral[500] }]}>
            📚 No content available for this topic yet
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.contentContainer}>
        <View style={styles.contentHeader}>
          <Text style={[styles.contentSubject, { color: colors.primary[600] }]}>
            {params?.subject} • {params?.topic}
          </Text>
          <Text style={[styles.contentProgress, { color: colors.neutral[500] }]}>
            {currentContentIndex + 1} / {content.length}
          </Text>
        </View>

        <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
          {currentContent.type === 'question' && (
            <View style={styles.questionContainer}>
              <Text style={[styles.questionText, { color: colors.neutral[900] }]}>
                {currentContent.question}
              </Text>
              
                             <View style={styles.optionsContainer}>
                 {'options' in currentContent && currentContent.options?.map((option: string, index: number) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.optionButton,
                                             {
                         backgroundColor: selectedAnswer === index 
                           ? ('correct' in currentContent && index === currentContent.correct ? colors.success[100] : colors.error[100])
                           : colors.neutral[50],
                         borderColor: selectedAnswer === index 
                           ? ('correct' in currentContent && index === currentContent.correct ? colors.success[500] : colors.error[500])
                           : colors.neutral[200],
                       }
                    ]}
                    onPress={() => handleAnswer(index)}
                    disabled={selectedAnswer !== null}
                  >
                    <Text style={[
                      styles.optionText,
                                             {
                         color: selectedAnswer === index 
                           ? ('correct' in currentContent && index === currentContent.correct ? colors.success[700] : colors.error[700])
                           : colors.neutral[800]
                       }
                    ]}>
                      {String.fromCharCode(65 + index)}. {option}
                    </Text>
                                         {selectedAnswer !== null && 'correct' in currentContent && index === currentContent.correct && (
                       <Text style={styles.correctIcon}>✓</Text>
                     )}
                     {selectedAnswer === index && 'correct' in currentContent && index !== currentContent.correct && (
                       <Text style={styles.incorrectIcon}>✗</Text>
                     )}
                  </TouchableOpacity>
                ))}
              </View>

                             {showExplanation && 'explanation' in currentContent && (
                 <View style={[styles.explanationContainer, { backgroundColor: colors.primary[50] }]}>
                   <Text style={[styles.explanationLabel, { color: colors.primary[700] }]}>
                     Explanation:
                   </Text>
                   <Text style={[styles.explanationText, { color: colors.primary[600] }]}>
                     {currentContent.explanation}
                   </Text>
                 </View>
               )}
            </View>
          )}

          {currentContent.type === 'passage' && (
            <View style={styles.passageContainer}>
              <Text style={[styles.passageText, { color: colors.neutral[800] }]}>
                {currentContent.passage}
              </Text>
              
              <Text style={[styles.questionText, { color: colors.neutral[900] }]}>
                {currentContent.question}
              </Text>
              
              {/* Similar options rendering as above */}
            </View>
          )}

          {currentContent.type === 'prompt' && (
            <View style={styles.promptContainer}>
              <Text style={[styles.promptText, { color: colors.neutral[900] }]}>
                {currentContent.prompt}
              </Text>
              
              {currentContent.sampleAnswer && (
                <View style={[styles.sampleContainer, { backgroundColor: colors.success[50] }]}>
                  <Text style={[styles.sampleLabel, { color: colors.success[700] }]}>
                    Sample Answer:
                  </Text>
                  <Text style={[styles.sampleText, { color: colors.success[600] }]}>
                    {currentContent.sampleAnswer}
                  </Text>
                </View>
              )}

              {currentContent.tips && (
                <View style={[styles.tipsContainer, { backgroundColor: colors.warning[50] }]}>
                  <Text style={[styles.tipsLabel, { color: colors.warning[700] }]}>
                    Writing Tips:
                  </Text>
                  {currentContent.tips.map((tip, index) => (
                    <Text key={index} style={[styles.tipText, { color: colors.warning[600] }]}>
                      • {tip}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          )}
        </ScrollView>

        <View style={styles.contentNavigation}>
          <TouchableOpacity
            style={[
              styles.navButton,
              {
                backgroundColor: currentContentIndex > 0 ? colors.neutral[100] : colors.neutral[50],
                opacity: currentContentIndex > 0 ? 1 : 0.5,
              }
            ]}
            onPress={previousContent}
            disabled={currentContentIndex === 0}
          >
            <Text style={[styles.navButtonText, { color: colors.neutral[700] }]}>Previous</Text>
          </TouchableOpacity>

          <View style={styles.accuracyDisplay}>
            <Text style={[styles.accuracyText, { color: colors.neutral[600] }]}>
              {correctAnswers}/{totalAnswered} correct
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.navButton,
              {
                backgroundColor: showExplanation || currentContent.type === 'prompt' 
                  ? colors.primary[500] 
                  : colors.neutral[200],
                opacity: showExplanation || currentContent.type === 'prompt' ? 1 : 0.5,
              }
            ]}
            onPress={nextContent}
            disabled={!showExplanation && currentContent.type !== 'prompt'}
          >
            <Text style={[
              styles.navButtonText, 
              { 
                color: showExplanation || currentContent.type === 'prompt' 
                  ? '#FFFFFF' 
                  : colors.neutral[500] 
              }
            ]}>
              {currentContentIndex === content.length - 1 ? 'Complete' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.neutral[50] }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.neutral[50]} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.exitButton, { backgroundColor: colors.neutral[100] }]}
          onPress={exitSession}
        >
          <Text style={[styles.exitButtonText, { color: colors.neutral[700] }]}>✕</Text>
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.neutral[900] }]}>
            Study Session
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.neutral[600] }]}>
            {params?.type} • {params?.duration} min planned
          </Text>
        </View>
      </View>

      {/* Timer Section */}
      {renderTimer()}

      {/* Content Section */}
      {renderContent()}
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
    paddingHorizontal: 20,
    paddingTop: isIOS ? 8 : 16,
    paddingBottom: 16,
  },
  exitButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  exitButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
  },

  // Timer Styles
  timerContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  timerCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  timerText: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  timerLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  timerControls: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  timerButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    minWidth: 80,
    alignItems: 'center',
  },
  timerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  sessionProgress: {
    alignItems: 'center',
  },
  sessionText: {
    fontSize: 14,
    marginBottom: 8,
  },
  sessionDots: {
    flexDirection: 'row',
    gap: 8,
  },
  sessionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Content Styles
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  contentSubject: {
    fontSize: 16,
    fontWeight: '600',
  },
  contentProgress: {
    fontSize: 14,
  },
  contentScroll: {
    flex: 1,
  },
  noContentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noContentText: {
    fontSize: 16,
    textAlign: 'center',
  },

  // Question Styles
  questionContainer: {
    marginBottom: 20,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
    marginBottom: 20,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  optionButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    flex: 1,
  },
  correctIcon: {
    fontSize: 18,
    color: '#10B981',
    fontWeight: '700',
  },
  incorrectIcon: {
    fontSize: 18,
    color: '#EF4444',
    fontWeight: '700',
  },
  explanationContainer: {
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  explanationLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 14,
    lineHeight: 20,
  },

  // Passage Styles
  passageContainer: {
    marginBottom: 20,
  },
  passageText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },

  // Prompt Styles
  promptContainer: {
    marginBottom: 20,
  },
  promptText: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
    marginBottom: 20,
  },
  sampleContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sampleLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  sampleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  tipsContainer: {
    padding: 16,
    borderRadius: 12,
  },
  tipsLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },

  // Navigation Styles
  contentNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  navButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    minWidth: 80,
    alignItems: 'center',
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  accuracyDisplay: {
    alignItems: 'center',
  },
  accuracyText: {
    fontSize: 12,
    fontWeight: '500',
  },
}); 