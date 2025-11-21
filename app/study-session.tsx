import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import { generateStudyContent } from '@/app/utils/aiProviderManager';
import NotificationService from '@/app/utils/notificationService';
import { loadExamData } from '@/app/utils/onboardingData';
import { requestReview, trackCompletedStudySession } from '@/app/utils/reviewPrompt';
import { useTheme } from '@/themes';

const { width } = Dimensions.get('window');
const isIOS = Platform.OS === 'ios';
const isTablet = width >= 768;

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
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  topic?: string;
};

type PassageContent = {
  id: number;
  type: 'passage';
  passage: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  topic?: string;
};

type PromptContent = {
  id: number;
  type: 'prompt';
  prompt: string;
  sampleAnswer?: string;
  tips?: string[];
  topic?: string;
};

type ContentItem = QuestionContent | PassageContent | PromptContent;

export default function StudySessionScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{
    taskId: string;
    subject: string;
    topic: string;
    type: string;
    duration: string;
    title?: string;
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
  const [isNotesFocused, setIsNotesFocused] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const notesHeightAnim = useRef(new Animated.Value(160)).current;

  // Content state
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loadingContent, setLoadingContent] = useState(true);
  const [currentContentIndex, setCurrentContentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);

  // Notes state
  const [notes, setNotes] = useState('');
  const [isSessionCompleted, setIsSessionCompleted] = useState(false);

  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
    });
    
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      // Add a small delay to ensure keyboard is fully hidden
      setTimeout(() => {
        setIsKeyboardVisible(false);
        setIsNotesFocused(false);
      }, 100);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  // Handle notes height animation based on keyboard state only
  useEffect(() => {
    let targetHeight = 160; // Default large size
    
    if (isKeyboardVisible) {
      // When keyboard is visible, make it small
      targetHeight = 80;
    } else {
      // When keyboard is hidden, always make it large (regardless of content)
      targetHeight = 160;
    }
    
    Animated.timing(notesHeightAnim, {
      toValue: targetHeight,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isKeyboardVisible]);

  // Load Claude-generated content
  const loadContent = async () => {
    try {
      setLoadingContent(true);
      
      if (!params?.subject) {
        console.warn('Missing subject for content generation');
        setContent([]);
        return;
      }

      // Load exam data to get examId
      const examData = await loadExamData();
      if (!examData?.id) {
        throw new Error('No exam data found. Please complete onboarding first.');
      }

      console.log('🧠 Generating exam-specific content for:', {
        examId: examData.id,
        subject: params.subject,
        topic: 'General',
        type: params.type
      });

      const generatedContent = await generateStudyContent({
        examId: examData.id,
        subject: params.subject,
        topic: 'General',
        sessionType: params.type as SessionType,
        duration: focusDuration
      });

      setContent(generatedContent);
      console.log(`✅ Generated ${generatedContent.length} content items`);
      
    } catch (error) {
      console.error('❌ Error generating content:', error);
      
      // Fallback to basic content structure
      const fallbackContent: ContentItem[] = [
        {
          id: 1,
          type: 'question',
          question: `What is a key concept in ${params.subject}?`,
          options: [
            'Understanding the fundamental principles',
            'Memorizing all formulas',
            'Speed over accuracy',
            'Avoiding practice problems'
          ],
          correct: 0,
          explanation: 'Understanding fundamental principles is crucial for mastering any topic.',
          difficulty: 'Medium',
          topic: 'General'
        }
      ];
      
      setContent(fallbackContent);
    } finally {
      setLoadingContent(false);
    }
  };

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

  // Initialize component
  useEffect(() => {
    loadContent();
    loadSessionData();
  }, []);

  const currentContent = content[currentContentIndex];

  // Timer functions
  const startTimer = () => {
    setIsRunning(true);
    
    // Schedule break reminder if this is a study session and we're just starting
    if (timerState === 'study' && timeLeft === focusDuration * 60) {
      NotificationService.startBreakReminders();
    }
    
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

  // Auto-save notes when they change (including empty string)
  useEffect(() => {
    saveNotes(notes);
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
          <View style={styles.timerButtonContent}>
            <Ionicons 
              name={isRunning ? 'pause' : 'play'} 
              size={20} 
              color="white" 
              style={{ marginRight: 8 }} 
            />
            <Text style={[styles.timerButtonText, { color: '#FFFFFF' }]}>
              {isRunning ? 'Pause' : 'Start'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderContent = () => (
    <View style={styles.contentContainer}>
      <View style={styles.contentHeader}>
        <Text style={[styles.contentSubject, { color: colors.primary[600] }]}>
          {params?.subject}
        </Text>
        <Text style={[styles.contentType, { color: colors.neutral[500] }]}>
          Focus & Notes
        </Text>
      </View>

      {/* Notes Panel */}
      <View style={[styles.notesContainer, { backgroundColor: colors.neutral[0] }]}>
        <View style={styles.sectionTitleContainer}>
          {isSessionCompleted ? (
            <Ionicons name="checkmark-circle" size={20} color={colors.success[600]} style={{ marginRight: 8 }} />
          ) : (
            <Ionicons name="document-text" size={20} color={colors.primary[600]} style={{ marginRight: 8 }} />
          )}
          <Text style={[styles.sectionTitle, { color: colors.neutral[900] }]}>
            {isSessionCompleted ? 'Study Notes (Completed)' : 'Study Notes'}
          </Text>
        </View>
        
        <Animated.View
          style={{
            height: notesHeightAnim,
          }}
        >
          <TextInput
            style={[
              styles.notesInput,
              {
                backgroundColor: colors.neutral[50],
                borderColor: isNotesFocused || notes.length > 0 ? colors.primary[300] : colors.neutral[200],
                color: colors.neutral[900],
                flex: 1,
              }
            ]}
            placeholder="Take notes during your study session..."
            placeholderTextColor={colors.neutral[400]}
            value={notes}
            onChangeText={setNotes}
            onFocus={() => setIsNotesFocused(true)}
            onBlur={() => setIsNotesFocused(false)}
            multiline
            textAlignVertical="top"
            scrollEnabled={true}
            keyboardType="default"
            returnKeyType="default"
            blurOnSubmit={false}
            autoCorrect={true}
            spellCheck={true}
          />
        </Animated.View>
      </View>

      {/* Complete Session Button */}
      {!isSessionCompleted ? (
        <TouchableOpacity
          style={[styles.completeButton, { backgroundColor: colors.success[500] }]}
          onPress={handleSessionComplete}
        >
          <View style={styles.completeButtonContent}>
            <Ionicons name="checkmark-circle" size={20} color="white" style={{ marginRight: 8 }} />
            <Text style={styles.completeButtonText}>Complete Session</Text>
          </View>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.completeButton, { backgroundColor: colors.primary[500] }]}
          onPress={() => router.back()}
        >
          <View style={styles.completeButtonContent}>
            <Ionicons name="home" size={20} color="white" style={{ marginRight: 8 }} />
            <Text style={styles.completeButtonText}>Back to Dashboard</Text>
          </View>
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
            <View style={styles.modalTitleContainer}>
              <Ionicons name="timer" size={24} color={colors.primary[600]} style={{ marginRight: 8 }} />
              <Text style={[styles.modalTitle, { color: colors.neutral[900] }]}>
                Set Focus Duration
              </Text>
            </View>
            
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
              <Ionicons name="trophy" size={48} color={colors.success[600]} />
            </View>
            
            {/* Title */}
            <Text style={[styles.completionTitle, { color: colors.neutral[900] }]}>
              Session Complete!
            </Text>
            
            {/* Subtitle */}
            <Text style={[styles.completionSubtitle, { color: colors.neutral[600] }]}>
              Great focus session! Here&apos;s what you accomplished:
            </Text>

            {/* Stats Cards */}
            <View style={styles.statsContainer}>
              <View style={[styles.statCard, { backgroundColor: colors.primary[50] }]}>
                <Ionicons name="time" size={24} color={colors.primary[600]} style={styles.statIcon} />
                <Text style={[styles.statNumber, { color: colors.primary[700] }]}>
                  {totalStudyTime}
                </Text>
                <Text style={[styles.statLabel, { color: colors.primary[600] }]}>
                  Focused Time
                </Text>
              </View>
              
              <View style={[styles.statCard, { backgroundColor: colors.success[50] }]}>
                <Ionicons name="document-text" size={24} color={colors.success[600]} style={styles.statIcon} />
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
                onPress={async () => {
                  setShowCompletionModal(false);

                  // Track completed study session
                  await trackCompletedStudySession();

                  // Request review if conditions are met
                  await requestReview();

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
            <Ionicons name="warning" size={32} color={colors.warning[600]} />
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
    <View style={[styles.container, { backgroundColor: colors.neutral[50] }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.neutral[50]} />
      
      {/* Header - Fixed */}
      <SafeAreaView>
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.exitButton, { backgroundColor: colors.neutral[100] }]}
            onPress={exitSession}
          >
            <Text style={[styles.exitButtonText, { color: colors.neutral[700] }]}>✕</Text>
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <View style={styles.headerTitleContainer}>
              {isSessionCompleted ? (
                <Ionicons name="checkmark-circle" size={24} color={colors.success[600]} style={{ marginRight: 8 }} />
              ) : (
                <Ionicons name="book" size={24} color={colors.primary[600]} style={{ marginRight: 8 }} />
              )}
              <Text style={[styles.headerTitle, { color: colors.neutral[900] }]}>
                {isSessionCompleted ? 'Completed Session' : 'Study Session'}
              </Text>
            </View>
            <Text style={[styles.headerSubtitle, { color: colors.neutral[600] }]}>
              {params?.type} • {params?.duration} min planned
            </Text>
          </View>
        </View>

        {/* Timer Section - Fixed */}
        {renderTimer()}
      </SafeAreaView>

      {/* Content Section with Keyboard Avoiding */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={true}
          keyboardDismissMode="interactive"
        >
          {renderContent()}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Duration Modal */}
      {renderDurationModal()}

      {/* Completion Modal */}
      {renderCompletionModal()}

      {/* Exit Modal */}
      {renderExitModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: isTablet ? 40 : 20,
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
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
  },

  // Timer Styles
  timerContainer: {
    alignItems: 'center',
    paddingVertical: isTablet ? 32 : 20,
    paddingHorizontal: isTablet ? 40 : 20,
  },
  timerCircle: {
    width: isTablet ? 200 : 160,
    height: isTablet ? 200 : 160,
    borderRadius: isTablet ? 100 : 80,
    borderWidth: isTablet ? 8 : 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: isTablet ? 28 : 20,
  },
  timerText: {
    fontSize: isTablet ? 42 : 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  timerLabel: {
    fontSize: isTablet ? 18 : 14,
    fontWeight: '500',
  },
  timerControls: {
    flexDirection: 'row',
    gap: isTablet ? 16 : 12,
    marginBottom: isTablet ? 28 : 20,
    justifyContent: 'center',
  },
  timerButton: {
    paddingHorizontal: isTablet ? 28 : 20,
    paddingVertical: isTablet ? 16 : 12,
    borderRadius: isTablet ? 28 : 24,
    minWidth: isTablet ? 90 : 70,
    alignItems: 'center',
  },
  timerButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerButtonText: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: '600',
  },

  // Content Styles
  contentContainer: {
    flex: 1,
    paddingHorizontal: isTablet ? 20 : 0,
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
    padding: isTablet ? 24 : 16,
    borderRadius: isTablet ? 16 : 12,
    marginBottom: isTablet ? 28 : 20,
  },
  sectionTitle: {
    fontSize: isTablet ? 22 : 18,
    fontWeight: '700',
    marginBottom: isTablet ? 12 : 8,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  notesInput: {
    padding: isTablet ? 20 : 16,
    borderWidth: 1.5,
    borderRadius: isTablet ? 14 : 12,
    fontSize: isTablet ? 18 : 16,
    lineHeight: isTablet ? 28 : 24,
    textAlignVertical: 'top',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  completeButton: {
    padding: isTablet ? 20 : 16,
    borderRadius: isTablet ? 28 : 24,
    alignItems: 'center',
  },
  completeButtonText: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  completeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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