import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
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
  const [timeLeft, setTimeLeft] = useState(parseInt(params?.duration || '25') * 60); // seconds
  const [isRunning, setIsRunning] = useState(false);
  const [timerState, setTimerState] = useState<TimerState>('study');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Duration settings
  const [focusDuration, setFocusDuration] = useState(parseInt(params?.duration || '25')); // minutes
  const [showDurationModal, setShowDurationModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  // Content state
  const [currentContentIndex, setCurrentContentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);

  // Notes state
  const [notes, setNotes] = useState('');
  const [isSessionCompleted, setIsSessionCompleted] = useState(false);

  // Storage functions
  const getStorageKeys = () => {
    const taskId = params?.taskId || 'default';
    return {
      notes: `session_notes_${taskId}`,
      completed: `session_completed_${taskId}`,
      completionTime: `session_completion_time_${taskId}`,
    };
  };

  const loadSessionData = async () => {
    try {
      const keys = getStorageKeys();
      const [savedNotes, completionStatus] = await Promise.all([
        AsyncStorage.getItem(keys.notes),
        AsyncStorage.getItem(keys.completed),
      ]);
      
      if (savedNotes) {
        setNotes(savedNotes);
      }
      
      if (completionStatus === 'true') {
        setIsSessionCompleted(true);
      }
    } catch (error) {
      console.log('Error loading session data:', error);
    }
  };

  const saveNotes = async (noteText: string) => {
    try {
      const keys = getStorageKeys();
      await AsyncStorage.setItem(keys.notes, noteText);
    } catch (error) {
      console.log('Error saving notes:', error);
    }
  };

  const saveCompletionStatus = async (completed: boolean) => {
    try {
      const keys = getStorageKeys();
      await AsyncStorage.setItem(keys.completed, completed.toString());
      if (completed) {
        await AsyncStorage.setItem(keys.completionTime, new Date().toISOString());
      }
    } catch (error) {
      console.log('Error saving completion status:', error);
    }
  };

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
      setTimeLeft(focusDuration * 60);
    } else if (timerState === 'break') {
      setTimeLeft(5 * 60);
    } else if (timerState === 'longBreak') {
      setTimeLeft(15 * 60);
    }
  };

  const changeFocusDuration = (minutes: number) => {
    setFocusDuration(minutes);
    if (timerState === 'study') {
      setTimeLeft(minutes * 60);
      pauseTimer();
    }
    setShowDurationModal(false);
  };

  const openDurationModal = () => {
    setShowDurationModal(true);
  };

  const handleTimerComplete = () => {
    pauseTimer();
    setTimerState('completed');
    Alert.alert('Timer Complete!', 'Focus session finished. Great job! 🎉');
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
    setIsSessionCompleted(true);
    saveCompletionStatus(true);
    setShowCompletionModal(true);
  };

  const resetSession = async () => {
    try {
      const keys = getStorageKeys();
      await AsyncStorage.multiRemove([keys.completed, keys.completionTime]);
      setIsSessionCompleted(false);
      resetTimer();
    } catch (error) {
      console.log('Error resetting session:', error);
    }
  };

  const exitSession = () => {
    setShowExitModal(true);
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

  // Load session data on mount
  useEffect(() => {
    loadSessionData();
  }, []);

  // Auto-save notes when they change
  useEffect(() => {
    if (notes) {
      saveNotes(notes);
    }
  }, [notes]);

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
          style={[styles.timerButton, { backgroundColor: colors.warning[100] }]}
          onPress={openDurationModal}
        >
          <Text style={[styles.timerButtonText, { color: colors.warning[700] }]}>{focusDuration}m</Text>
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
    </View>
  );

  const renderContent = () => (
    <View style={styles.contentContainer}>
      <View style={styles.contentHeader}>
        <Text style={[styles.contentSubject, { color: colors.primary[600] }]}>
          {params?.subject} • {params?.topic}
        </Text>
        <Text style={[styles.contentType, { color: colors.neutral[500] }]}>
          📝 Focus & Notes
        </Text>
      </View>

      {/* Notes Panel */}
      <View style={[styles.notesContainer, { backgroundColor: colors.neutral[0] }]}>
        <Text style={[styles.sectionTitle, { color: colors.neutral[900] }]}>
          {isSessionCompleted ? '✅ Study Notes (Completed)' : '📝 Study Notes'}
        </Text>
        
        <TextInput
          style={[
            styles.notesInput,
            {
              backgroundColor: colors.neutral[50],
              borderColor: colors.neutral[200],
              color: colors.neutral[900],
            }
          ]}
          placeholder="Take notes during your study session..."
          placeholderTextColor={colors.neutral[400]}
          value={notes}
          onChangeText={setNotes}
          multiline
          textAlignVertical="top"
        />
      </View>

      {/* Complete Session Button */}
      {!isSessionCompleted ? (
        <TouchableOpacity
          style={[styles.completeButton, { backgroundColor: colors.success[500] }]}
          onPress={handleSessionComplete}
        >
          <Text style={styles.completeButtonText}>Complete Session 🎉</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.completeButton, { backgroundColor: colors.primary[500] }]}
          onPress={() => router.back()}
        >
          <Text style={styles.completeButtonText}>Back to Dashboard 📚</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderDurationModal = () => {
    const presetDurations = [5, 15, 25, 30, 45, 60];
    
    return (
      <Modal
        visible={showDurationModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDurationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.neutral[0] }]}>
            <Text style={[styles.modalTitle, { color: colors.neutral[900] }]}>
              ⏱️ Set Focus Duration
            </Text>
            
            <Text style={[styles.modalSubtitle, { color: colors.neutral[600] }]}>
              Choose how long you want to focus
            </Text>

            <View style={styles.presetGrid}>
              {presetDurations.map((duration) => (
                <TouchableOpacity
                  key={duration}
                  style={[
                    styles.presetButton,
                    {
                      backgroundColor: duration === focusDuration ? colors.primary[500] : colors.neutral[100],
                      borderColor: duration === focusDuration ? colors.primary[500] : colors.neutral[200],
                    }
                  ]}
                  onPress={() => changeFocusDuration(duration)}
                >
                  <Text style={[
                    styles.presetButtonText,
                    { color: duration === focusDuration ? '#FFFFFF' : colors.neutral[700] }
                  ]}>
                    {duration}m
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.neutral[100] }]}
                onPress={() => setShowDurationModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.neutral[700] }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderCompletionModal = () => {
    const notesLength = notes.trim().length;
    const focusMinutes = parseInt(params?.duration || '25');
    const focusSeconds = focusMinutes * 60;
    const actualStudyTime = focusSeconds - timeLeft;
    const totalStudyTime = formatTime(actualStudyTime > 0 ? actualStudyTime : focusSeconds);
    
    return (
      <Modal
        visible={showCompletionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCompletionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.completionModalContent, { backgroundColor: colors.neutral[0] }]}>
            {/* Success Animation/Icon */}
            <View style={[styles.successCircle, { backgroundColor: colors.success[100] }]}>
              <Text style={styles.successIcon}>🎉</Text>
            </View>
            
            {/* Title */}
            <Text style={[styles.completionTitle, { color: colors.neutral[900] }]}>
              Session Complete!
            </Text>
            
            {/* Subtitle */}
            <Text style={[styles.completionSubtitle, { color: colors.neutral[600] }]}>
              Great focus session! Here's what you accomplished:
            </Text>

            {/* Stats Cards */}
            <View style={styles.statsContainer}>
              <View style={[styles.statCard, { backgroundColor: colors.primary[50] }]}>
                <Text style={styles.statIcon}>⏱️</Text>
                <Text style={[styles.statNumber, { color: colors.primary[700] }]}>
                  {totalStudyTime}
                </Text>
                <Text style={[styles.statLabel, { color: colors.primary[600] }]}>
                  Focused Time
                </Text>
              </View>
              
              <View style={[styles.statCard, { backgroundColor: colors.success[50] }]}>
                <Text style={styles.statIcon}>📝</Text>
                <Text style={[styles.statNumber, { color: colors.success[700] }]}>
                  {notesLength}
                </Text>
                <Text style={[styles.statLabel, { color: colors.success[600] }]}>
                  Note Characters
                </Text>
              </View>
            </View>

            {/* Message */}
            <Text style={[styles.completionMessage, { color: colors.neutral[700] }]}>
              {notesLength > 0 
                ? "Excellent note-taking! Your insights will help with retention." 
                : "Consider taking notes next time to improve retention and recall."}
            </Text>

            {/* Action Buttons */}
            <View style={styles.completionActions}>
              <TouchableOpacity
                style={[styles.completionButton, styles.secondaryButton, { borderColor: colors.neutral[200] }]}
                onPress={() => setShowCompletionModal(false)}
              >
                <Text style={[styles.completionButtonText, { color: colors.neutral[700] }]}>
                  Review Session
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.completionButton, styles.primaryButton, { backgroundColor: colors.primary[500] }]}
                onPress={() => {
                  setShowCompletionModal(false);
                  router.back();
                }}
              >
                <Text style={[styles.completionButtonText, { color: '#FFFFFF' }]}>
                  Back to Dashboard
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderExitModal = () => (
    <Modal
      visible={showExitModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowExitModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.exitModalContent, { backgroundColor: colors.neutral[0] }]}>
          {/* Icon */}
          <View style={[styles.exitIconContainer, { backgroundColor: colors.warning[100] }]}>
            <Text style={styles.exitIcon}>⚠️</Text>
          </View>
          
          {/* Title & Message */}
          <Text style={[styles.exitModalTitle, { color: colors.neutral[900] }]}>
            {isSessionCompleted ? 'Session Options' : 'Exit Study Session?'}
          </Text>
          
          <Text style={[styles.exitModalMessage, { color: colors.neutral[600] }]}>
            {isSessionCompleted 
              ? 'This session is already completed. What would you like to do?'
              : 'Your progress will be saved. Are you sure you want to exit?'
            }
          </Text>

          {/* Actions */}
          <View style={styles.exitModalActions}>
            {isSessionCompleted ? (
              <>
                <TouchableOpacity
                  style={[styles.exitModalButton, styles.secondaryButton]}
                  onPress={() => {
                    setShowExitModal(false);
                    resetSession();
                  }}
                >
                  <Text style={[styles.exitModalButtonText, { color: colors.neutral[700] }]}>
                    Reset Session
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.exitModalButton, styles.primaryButton, { backgroundColor: colors.primary[500] }]}
                  onPress={() => {
                    setShowExitModal(false);
                    router.back();
                  }}
                >
                  <Text style={[styles.exitModalButtonText, { color: '#FFFFFF' }]}>
                    Back to Dashboard
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.exitModalButton, styles.secondaryButton]}
                  onPress={() => setShowExitModal(false)}
                >
                  <Text style={[styles.exitModalButtonText, { color: colors.neutral[700] }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.exitModalButton, styles.dangerButton, { backgroundColor: '#EF4444' }]}
                  onPress={() => {
                    setShowExitModal(false);
                    router.back();
                  }}
                >
                  <Text style={[styles.exitModalButtonText, { color: '#FFFFFF' }]}>
                    Exit Session
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
          
          {/* Cancel Button for completed state */}
          {isSessionCompleted && (
            <TouchableOpacity
              style={styles.exitModalCancelButton}
              onPress={() => setShowExitModal(false)}
            >
              <Text style={[styles.exitModalCancelText, { color: colors.neutral[500] }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );

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
            {isSessionCompleted ? '✅ Completed Session' : 'Study Session'}
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

      {/* Duration Modal */}
      {renderDurationModal()}

      {/* Completion Modal */}
      {renderCompletionModal()}

      {/* Exit Modal */}
      {renderExitModal()}
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
    gap: 12,
    marginBottom: 20,
    justifyContent: 'center',
  },
  timerButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    minWidth: 70,
    alignItems: 'center',
  },
  timerButtonText: {
    fontSize: 16,
    fontWeight: '600',
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
  contentType: {
    fontSize: 14,
  },

  // Notes Styles
  notesContainer: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  notesInput: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  completeButton: {
    padding: 16,
    borderRadius: 24,
    alignItems: 'center',
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Duration Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  presetButton: {
    width: '30%',
    padding: 12,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    alignItems: 'center',
  },
  presetButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Completion Modal Styles
  completionModalContent: {
    width: '85%',
    maxWidth: 400,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successIcon: {
    fontSize: 48,
    fontWeight: '700',
  },
  completionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  completionSubtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  completionMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  completionActions: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  completionButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E5E5',
  },
  primaryButton: {
    borderWidth: 0,
  },
  completionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Exit Modal Styles
  exitModalContent: {
    width: '80%',
    maxWidth: 400,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  exitIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  exitIcon: {
    fontSize: 24,
    fontWeight: '700',
  },
  exitModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  exitModalMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  exitModalActions: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  exitModalButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  exitModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  exitModalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  exitModalCancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  dangerButton: {
    borderWidth: 0,
  },
}); 