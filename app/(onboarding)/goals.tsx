import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Dimensions,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { loadExamData, GoalsData as OnboardingGoalsData, saveGoalsData } from '@/app/utils/onboardingData';
import { useTheme } from '@/themes';

const { width } = Dimensions.get('window');
const isIOS = Platform.OS === 'ios';

// Exam-specific score systems
const getTargetScores = (examId: string) => {
  switch (examId) {
    case 'sat':
      return [
        { id: 'good', label: 'Good Score', range: '1200-1350', color: '#10B981', description: 'Solid performance' },
        { id: 'great', label: 'Great Score', range: '1350-1450', color: '#3B82F6', description: 'Above average' },
        { id: 'excellent', label: 'Excellent Score', range: '1450-1550', color: '#8B5CF6', description: 'Top performer' },
        { id: 'perfect', label: 'Perfect Score', range: '1550+', color: '#F59E0B', description: 'Elite level' },
      ];
    case 'gre':
      return [
        { id: 'good', label: 'Good Score', range: '300-310', color: '#10B981', description: 'Solid performance' },
        { id: 'great', label: 'Great Score', range: '310-320', color: '#3B82F6', description: 'Above average' },
        { id: 'excellent', label: 'Excellent Score', range: '320-330', color: '#8B5CF6', description: 'Top performer' },
        { id: 'perfect', label: 'Perfect Score', range: '330+', color: '#F59E0B', description: 'Elite level' },
      ];
    case 'toefl':
      return [
        { id: 'good', label: 'Good Score', range: '80-90', color: '#10B981', description: 'Solid performance' },
        { id: 'great', label: 'Great Score', range: '90-100', color: '#3B82F6', description: 'Above average' },
        { id: 'excellent', label: 'Excellent Score', range: '100-110', color: '#8B5CF6', description: 'Top performer' },
        { id: 'perfect', label: 'Perfect Score', range: '110+', color: '#F59E0B', description: 'Elite level' },
      ];
    case 'ielts':
      return [
        { id: 'good', label: 'Good Score', range: '6.0-6.5', color: '#10B981', description: 'Solid performance' },
        { id: 'great', label: 'Great Score', range: '6.5-7.0', color: '#3B82F6', description: 'Above average' },
        { id: 'excellent', label: 'Excellent Score', range: '7.0-8.0', color: '#8B5CF6', description: 'Top performer' },
        { id: 'perfect', label: 'Perfect Score', range: '8.0+', color: '#F59E0B', description: 'Elite level' },
      ];
    case 'gmat':
      return [
        { id: 'good', label: 'Good Score', range: '600-650', color: '#10B981', description: 'Solid performance' },
        { id: 'great', label: 'Great Score', range: '650-700', color: '#3B82F6', description: 'Above average' },
        { id: 'excellent', label: 'Excellent Score', range: '700-750', color: '#8B5CF6', description: 'Top performer' },
        { id: 'perfect', label: 'Perfect Score', range: '750+', color: '#F59E0B', description: 'Elite level' },
      ];
    case 'lsat':
      return [
        { id: 'good', label: 'Good Score', range: '155-160', color: '#10B981', description: 'Solid performance' },
        { id: 'great', label: 'Great Score', range: '160-165', color: '#3B82F6', description: 'Above average' },
        { id: 'excellent', label: 'Excellent Score', range: '165-170', color: '#8B5CF6', description: 'Top performer' },
        { id: 'perfect', label: 'Perfect Score', range: '170+', color: '#F59E0B', description: 'Elite level' },
      ];
    default:
      return [
        { id: 'good', label: 'Good Score', range: 'Good', color: '#10B981', description: 'Solid performance' },
        { id: 'great', label: 'Great Score', range: 'Great', color: '#3B82F6', description: 'Above average' },
        { id: 'excellent', label: 'Excellent Score', range: 'Excellent', color: '#8B5CF6', description: 'Top performer' },
        { id: 'perfect', label: 'Perfect Score', range: 'Perfect', color: '#F59E0B', description: 'Elite level' },
      ];
  }
};

const studyIntensity = [
  { id: 'relaxed', label: 'Relaxed', hours: '1-2 hours/day', icon: '🌸', description: 'Steady and comfortable' },
  { id: 'moderate', label: 'Moderate', hours: '2-3 hours/day', icon: '📚', description: 'Balanced approach' },
  { id: 'intensive', label: 'Intensive', hours: '3-4 hours/day', icon: '🎯', description: 'Focused and dedicated' },
  { id: 'extreme', label: 'Extreme', hours: '4+ hours/day', icon: '🔥', description: 'Maximum effort' },
];

const reminderFrequency = [
  { id: 'minimal', label: 'Minimal', frequency: 'Weekly check-ins', icon: '📅' },
  { id: 'moderate', label: 'Moderate', frequency: 'Daily reminders', icon: '⏰' },
  { id: 'frequent', label: 'Frequent', frequency: 'Multiple daily', icon: '🔔' },
];

interface GoalsData {
  examDate: string;
  targetScore: string;
  studyIntensity: string;
  reminderFrequency: string;
  motivation: string;
}

export default function GoalsScreen() {
  const { colors } = useTheme();
  const [showIntro, setShowIntro] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [goalsData, setGoalsData] = useState<GoalsData>({
    examDate: '',
    targetScore: '',
    studyIntensity: '',
    reminderFrequency: '',
    motivation: '',
  });
  const [examData, setExamData] = useState<any>(null);

  // Load exam data on component mount
  React.useEffect(() => {
    const loadExam = async () => {
      try {
        const data = await loadExamData();
        console.log('🔍 Debug: Loaded exam data:', data);
        if (data) {
          setExamData(data);
          console.log('🔍 Debug: Set exam data:', data);
        }
      } catch (error) {
        console.error('Error loading exam data:', error);
      }
    };
    loadExam();
  }, []);

  const totalSteps = 5;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    } else {
      router.back();
    }
  };

  const handleComplete = async () => {
    try {
      // Save goals data
      const goalsForSave: OnboardingGoalsData = {
        examDate: goalsData.examDate,
        targetScore: goalsData.targetScore,
        studyIntensity: goalsData.studyIntensity,
        reminderFrequency: goalsData.reminderFrequency,
        motivation: goalsData.motivation,
      };
      
      await saveGoalsData(goalsForSave);
      console.log('Goals data saved:', goalsForSave);
      
      // Navigate to completion page
      router.push('/(onboarding)/completion');
    } catch (error) {
      console.error('Error saving goals data:', error);
      // Continue anyway for better UX
      router.push('/(onboarding)/completion');
    }
  };

  const formatDateInput = (text: string) => {
    // Remove any non-numeric characters
    const numericOnly = text.replace(/\D/g, '');
    
    // Format as MM/DD/YYYY
    if (numericOnly.length <= 2) {
      return numericOnly;
    } else if (numericOnly.length <= 4) {
      return `${numericOnly.slice(0, 2)}/${numericOnly.slice(2)}`;
    } else {
      return `${numericOnly.slice(0, 2)}/${numericOnly.slice(2, 4)}/${numericOnly.slice(4, 8)}`;
    }
  };

  const validateDate = (dateString: string): { isValid: boolean; message?: string } => {
    if (!dateString || dateString.length < 10) {
      return { isValid: false, message: 'Please enter a complete date (MM/DD/YYYY)' };
    }

    const dateParts = dateString.split('/');
    if (dateParts.length !== 3) {
      return { isValid: false, message: 'Invalid date format' };
    }

    const month = parseInt(dateParts[0], 10);
    const day = parseInt(dateParts[1], 10);
    const year = parseInt(dateParts[2], 10);

    // Basic range validation
    if (month < 1 || month > 12) {
      return { isValid: false, message: 'Month must be between 1-12' };
    }
    if (day < 1 || day > 31) {
      return { isValid: false, message: 'Day must be between 1-31' };
    }
    if (year < 2025 || year > 2030) {
      return { isValid: false, message: 'Year must be between 2025-2030' };
    }

    // Create date and validate
    const examDate = new Date(year, month - 1, day);
    if (examDate.getFullYear() !== year || 
        examDate.getMonth() !== month - 1 || 
        examDate.getDate() !== day) {
      return { isValid: false, message: 'Invalid date (e.g., Feb 30th doesn\'t exist)' };
    }

    // Check if date is in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to compare only dates
    if (examDate <= today) {
      return { isValid: false, message: 'Exam date must be in the future' };
    }

    // Check minimum preparation time (at least 1 week)
    const oneWeekFromNow = new Date(today);
    oneWeekFromNow.setDate(today.getDate() + 7);
    if (examDate < oneWeekFromNow) {
      return { isValid: false, message: 'Please allow at least 1 week for preparation' };
    }

    return { isValid: true };
  };

  const handleDateChange = (text: string) => {
    const formatted = formatDateInput(text);
    setGoalsData(prev => ({ ...prev, examDate: formatted }));
  };

  const getDateValidation = () => {
    if (goalsData.examDate.length === 0) return null;
    return validateDate(goalsData.examDate);
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1: {
        const dateValidation = validateDate(goalsData.examDate);
        return dateValidation.isValid;
      }
      case 2: return goalsData.targetScore.length > 0;
      case 3: return goalsData.studyIntensity.length > 0;
      case 4: return goalsData.reminderFrequency.length > 0;
      case 5: return goalsData.motivation.length > 5;
      default: return false;
    }
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
              Goal Setting
            </Text>
          </View>
          
          <View style={styles.headerRight} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Text style={styles.mainIcon}>🎯</Text>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.neutral[900] }]}>
            Set Your Study{'\n'}Goals & Motivation
          </Text>

          {/* Description */}
          <Text style={[styles.description, { color: colors.neutral[600] }]}>
            Define your target score, exam date, and study preferences. Setting clear goals helps maintain motivation and track your progress effectively.
          </Text>

          {/* Features */}
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: colors.primary[50] }]}>
                <Text style={styles.featureEmoji}>📅</Text>
              </View>
              <View style={styles.featureContent}>
                <Text style={[styles.featureTitle, { color: colors.neutral[800] }]}>
                  Exam Date Planning
                </Text>
                <Text style={[styles.featureDesc, { color: colors.neutral[600] }]}>
                  Set your target date for optimal preparation
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: colors.success[50] }]}>
                <Text style={styles.featureEmoji}>🎯</Text>
              </View>
              <View style={styles.featureContent}>
                <Text style={[styles.featureTitle, { color: colors.neutral[800] }]}>
                  Score Targets
                </Text>
                <Text style={[styles.featureDesc, { color: colors.neutral[600] }]}>
                  Define realistic yet challenging goals
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: colors.warning[50] }]}>
                <Text style={styles.featureEmoji}>💪</Text>
              </View>
              <View style={styles.featureContent}>
                <Text style={[styles.featureTitle, { color: colors.neutral[800] }]}>
                  Study Intensity
                </Text>
                <Text style={[styles.featureDesc, { color: colors.neutral[600] }]}>
                  Choose your preferred study pace
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: colors.primary[50] }]}>
                <Text style={styles.featureEmoji}>🔔</Text>
              </View>
              <View style={styles.featureContent}>
                <Text style={[styles.featureTitle, { color: colors.neutral[800] }]}>
                  Smart Reminders
                </Text>
                <Text style={[styles.featureDesc, { color: colors.neutral[600] }]}>
                  Stay motivated with personalized alerts
                </Text>
              </View>
            </View>
          </View>

          {/* Info Box */}
          <View style={[styles.infoBox, { backgroundColor: colors.success[50], borderColor: colors.success[200] }]}>
            <Text style={[styles.infoText, { color: colors.success[700] }]}>
              🌟 Setting specific goals increases your chance of success by 42%
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
            <Text style={styles.continueButtonText}>Set My Goals</Text>
          </TouchableOpacity>
        </View>

        {/* Background Gradient */}
        <LinearGradient
          colors={[
            'rgba(34, 197, 94, 0.02)',
            'transparent',
            'rgba(99, 102, 241, 0.02)',
          ]}
          style={styles.backgroundGradient}
          pointerEvents="none"
        />
      </SafeAreaView>
    );
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: colors.neutral[900] }]}>
              When is your exam?
            </Text>
            <Text style={[styles.stepDescription, { color: colors.neutral[600] }]}>
              Set your target exam date to create an optimal study timeline
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.neutral[700] }]}>
                Exam Date
              </Text>
              <TextInput
                style={[styles.textInput, { 
                  backgroundColor: colors.neutral[0],
                  borderColor: getDateValidation()?.isValid === false ? colors.error[500] : colors.neutral[200],
                  color: colors.neutral[900]
                }]}
                placeholder="MM/DD/YYYY"
                placeholderTextColor={colors.neutral[400]}
                value={goalsData.examDate}
                onChangeText={handleDateChange}
                keyboardType="numeric"
                maxLength={10}
              />
              {getDateValidation()?.isValid === false && (
                <Text style={[styles.validationMessage, { color: colors.error[600] }]}>
                  {getDateValidation()?.message}
                </Text>
              )}
              {goalsData.examDate.length >= 10 && getDateValidation()?.isValid && (
                <Text style={[styles.validationMessage, { color: colors.success[600] }]}>
                  ✓ Valid exam date
                </Text>
              )}
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: colors.neutral[900] }]}>
              What&apos;s your target score?
            </Text>
            <Text style={[styles.stepDescription, { color: colors.neutral[600] }]}>
              Choose a realistic yet challenging goal to aim for
            </Text>
            
            <View style={styles.optionsContainer}>
              {(() => {
                const examId = examData?.id || examData?.examId || 'sat';
                console.log('🔍 Debug: Current exam data:', examData);
                console.log('🔍 Debug: Using exam ID:', examId);
                const scores = getTargetScores(examId);
                console.log('🔍 Debug: Generated scores:', scores);
                return scores;
              })().map((score) => {
                const isSelected = goalsData.targetScore === score.id;
                
                return (
                  <TouchableOpacity
                    key={score.id}
                    style={[
                      styles.optionCard,
                      {
                        backgroundColor: isSelected ? score.color : colors.neutral[0],
                        borderColor: isSelected ? score.color : colors.neutral[200],
                      }
                    ]}
                    onPress={() => setGoalsData(prev => ({ ...prev, targetScore: score.id }))}
                    activeOpacity={0.8}
                  >
                    <View style={styles.optionContent}>
                      <Text style={[
                        styles.optionLabel,
                        { color: isSelected ? '#FFFFFF' : colors.neutral[800] }
                      ]}>
                        {score.label}
                      </Text>
                      <Text style={[
                        styles.optionRange,
                        { color: isSelected ? 'rgba(255,255,255,0.9)' : colors.primary[600] }
                      ]}>
                        {score.range}
                      </Text>
                      <Text style={[
                        styles.optionDescription,
                        { color: isSelected ? 'rgba(255,255,255,0.8)' : colors.neutral[500] }
                      ]}>
                        {score.description}
                      </Text>
                    </View>
                    {isSelected && (
                      <View style={styles.selectedIndicator}>
                        <Text style={styles.checkIcon}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: colors.neutral[900] }]}>
              How intensively do you want to study?
            </Text>
            <Text style={[styles.stepDescription, { color: colors.neutral[600] }]}>
              Choose a study intensity that matches your schedule and commitment
            </Text>
            
            <View style={styles.optionsContainer}>
              {studyIntensity.map((intensity) => {
                const isSelected = goalsData.studyIntensity === intensity.id;
                
                return (
                  <TouchableOpacity
                    key={intensity.id}
                    style={[
                      styles.optionCard,
                      {
                        backgroundColor: isSelected ? colors.primary[500] : colors.neutral[0],
                        borderColor: isSelected ? colors.primary[500] : colors.neutral[200],
                      }
                    ]}
                    onPress={() => setGoalsData(prev => ({ ...prev, studyIntensity: intensity.id }))}
                    activeOpacity={0.8}
                  >
                    <View style={styles.optionContent}>
                      <View style={styles.optionHeader}>
                        <Text style={styles.optionIcon}>{intensity.icon}</Text>
                        <Text style={[
                          styles.optionLabel,
                          { color: isSelected ? '#FFFFFF' : colors.neutral[800] }
                        ]}>
                          {intensity.label}
                        </Text>
                      </View>
                      <Text style={[
                        styles.optionRange,
                        { color: isSelected ? 'rgba(255,255,255,0.9)' : colors.primary[600] }
                      ]}>
                        {intensity.hours}
                      </Text>
                      <Text style={[
                        styles.optionDescription,
                        { color: isSelected ? 'rgba(255,255,255,0.8)' : colors.neutral[500] }
                      ]}>
                        {intensity.description}
                      </Text>
                    </View>
                    {isSelected && (
                      <View style={styles.selectedIndicator}>
                        <Text style={styles.checkIcon}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: colors.neutral[900] }]}>
              How often should we remind you?
            </Text>
            <Text style={[styles.stepDescription, { color: colors.neutral[600] }]}>
              Choose your preferred reminder frequency to stay on track
            </Text>
            
            <View style={styles.optionsContainer}>
              {reminderFrequency.map((reminder) => {
                const isSelected = goalsData.reminderFrequency === reminder.id;
                
                return (
                  <TouchableOpacity
                    key={reminder.id}
                    style={[
                      styles.optionCard,
                      {
                        backgroundColor: isSelected ? colors.success[500] : colors.neutral[0],
                        borderColor: isSelected ? colors.success[500] : colors.neutral[200],
                      }
                    ]}
                    onPress={() => setGoalsData(prev => ({ ...prev, reminderFrequency: reminder.id }))}
                    activeOpacity={0.8}
                  >
                    <View style={styles.optionContent}>
                      <View style={styles.optionHeader}>
                        <Text style={styles.optionIcon}>{reminder.icon}</Text>
                        <Text style={[
                          styles.optionLabel,
                          { color: isSelected ? '#FFFFFF' : colors.neutral[800] }
                        ]}>
                          {reminder.label}
                        </Text>
                      </View>
                      <Text style={[
                        styles.optionRange,
                        { color: isSelected ? 'rgba(255,255,255,0.9)' : colors.success[600] }
                      ]}>
                        {reminder.frequency}
                      </Text>
                    </View>
                    {isSelected && (
                      <View style={styles.selectedIndicator}>
                        <Text style={styles.checkIcon}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );

      case 5:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: colors.neutral[900] }]}>
              What motivates you?
            </Text>
            <Text style={[styles.stepDescription, { color: colors.neutral[600] }]}>
              Write a personal message to keep you motivated during tough study sessions
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.neutral[700] }]}>
                Your motivation message
              </Text>
              <TextInput
                style={[styles.textArea, { 
                  backgroundColor: colors.neutral[0],
                  borderColor: colors.neutral[200],
                  color: colors.neutral[900]
                }]}
                placeholder="I want to achieve my dream score because..."
                placeholderTextColor={colors.neutral[400]}
                value={goalsData.motivation}
                onChangeText={(text) => setGoalsData(prev => ({ ...prev, motivation: text }))}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
        );

      default:
        return null;
    }
  };

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
            Goal Setting
          </Text>
          <View style={styles.progressInfo}>
            <Text style={[styles.progressText, { color: colors.primary[600] }]}>
              Step {currentStep} of {totalSteps}
            </Text>
            <View style={[styles.progressBar, { backgroundColor: colors.neutral[200] }]}>
              <View style={[
                styles.progressFill,
                { 
                  backgroundColor: colors.primary[500],
                  width: `${(currentStep / totalSteps) * 100}%`
                }
              ]} />
            </View>
          </View>
        </View>
        
        <View style={styles.headerRight} />
      </View>

      {/* Step Content */}
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {renderStepContent()}
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={[
            styles.continueButton, 
            { 
              backgroundColor: isStepValid() ? colors.primary[500] : colors.neutral[300],
              opacity: isStepValid() ? 1 : 0.6
            }
          ]}
          onPress={handleNext}
          disabled={!isStepValid()}
          activeOpacity={0.9}
        >
          <Text style={[
            styles.continueButtonText,
            { color: isStepValid() ? '#FFFFFF' : colors.neutral[500] }
          ]}>
            {currentStep === totalSteps ? 'Complete Setup' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Background Gradient */}
      <LinearGradient
        colors={[
          'rgba(34, 197, 94, 0.02)',
          'transparent',
          'rgba(99, 102, 241, 0.02)',
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
    alignItems: 'center',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  progressBar: {
    width: 60,
    height: 2,
    borderRadius: 1,
  },
  progressFill: {
    height: 2,
    borderRadius: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  mainIcon: {
    fontSize: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 30,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  featuresContainer: {
    gap: 12,
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureEmoji: {
    fontSize: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 1,
  },
  featureDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  infoBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  infoText: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  stepContainer: {
    paddingVertical: 16,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 28,
  },
  stepDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  textArea: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontWeight: '500',
    minHeight: 120,
  },
  optionsContainer: {
    gap: 10,
  },
  optionCard: {
    borderRadius: 10,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 3,
    position: 'relative',
  },
  optionContent: {
    padding: 12,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  optionIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  optionRange: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 3,
  },
  optionDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 12,
    right: 16,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  checkIcon: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  bottomSection: {
    paddingHorizontal: 16,
    paddingBottom: isIOS ? 16 : 16,
    paddingTop: 16,
  },
  continueButton: {
    paddingVertical: 16,
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
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  validationMessage: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
}); 