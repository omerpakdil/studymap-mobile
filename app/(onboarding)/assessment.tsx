import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { getCurriculumByExamId } from '@/app/data';
import { loadExamData, saveSubjectIntensity } from '@/app/utils/onboardingData';
import { useTheme } from '@/themes';

const { width } = Dimensions.get('window');
const isIOS = Platform.OS === 'ios';
const isTablet = width >= 768;

// Study intensity levels for subjects
const intensityLevels = [
  { 
    value: 0, 
    label: 'Light', 
    color: '#10B981', 
    description: 'Basic review',
    icon: '🌱',
    percentage: '20%'
  },
  { 
    value: 1, 
    label: 'Moderate', 
    color: '#3B82F6', 
    description: 'Balanced focus',
    icon: '📚',
    percentage: '40%'
  },
  { 
    value: 2, 
    label: 'High', 
    color: '#F59E0B', 
    description: 'Strong emphasis',
    icon: '🔥',
    percentage: '60%'
  },
  { 
    value: 3, 
    label: 'Intensive', 
    color: '#EF4444', 
    description: 'Maximum focus',
    icon: '💪',
    percentage: '80%'
  }
];

// Subject gradients and icons mapping
const subjectStyles = {
  math: { icon: '🔢', gradient: ['#3B82F6', '#1D4ED8'] },
  mathematics: { icon: '🔢', gradient: ['#3B82F6', '#1D4ED8'] },
  reading: { icon: '📖', gradient: ['#10B981', '#059669'] },
  writing: { icon: '✍️', gradient: ['#8B5CF6', '#7C3AED'] },
  verbal: { icon: '🗣️', gradient: ['#F59E0B', '#D97706'] },
  quantitative: { icon: '📊', gradient: ['#3B82F6', '#1D4ED8'] },
  analytical_writing: { icon: '📝', gradient: ['#8B5CF6', '#7C3AED'] },
  'analytical writing assessment': { icon: '📝', gradient: ['#8B5CF6', '#7C3AED'] },
  integrated_reasoning: { icon: '🧠', gradient: ['#EF4444', '#DC2626'] },
  'integrated reasoning': { icon: '🧠', gradient: ['#EF4444', '#DC2626'] },
  listening: { icon: '👂', gradient: ['#06B6D4', '#0891B2'] },
  speaking: { icon: '🎤', gradient: ['#F59E0B', '#D97706'] },
  logical_reasoning: { icon: '⚖️', gradient: ['#8B5CF6', '#7C3AED'] },
  'logical reasoning': { icon: '⚖️', gradient: ['#8B5CF6', '#7C3AED'] },
  reading_comprehension: { icon: '📖', gradient: ['#10B981', '#059669'] },
  'reading comprehension': { icon: '📖', gradient: ['#10B981', '#059669'] },
  analytical_reasoning: { icon: '🧩', gradient: ['#EF4444', '#DC2626'] },
  'analytical reasoning': { icon: '🧩', gradient: ['#EF4444', '#DC2626'] },
  'writing and language': { icon: '✍️', gradient: ['#8B5CF6', '#7C3AED'] },
  default: { icon: '📚', gradient: ['#6B7280', '#4B5563'] }
};

interface SubjectIntensity {
  [subjectName: string]: number;
}

interface ExtendedSubjectData {
  name: string;
  icon: string;
  gradient: string[];
  totalHours: number;
  description: string;
}

export default function AssessmentScreen() {
  const { colors } = useTheme();
  const [showIntro, setShowIntro] = useState(true);
  const [subjectIntensity, setSubjectIntensity] = useState<SubjectIntensity>({});
  const [currentSubjectIndex, setCurrentSubjectIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [examSubjects, setExamSubjects] = useState<ExtendedSubjectData[]>([]);
  const [loading, setLoading] = useState(true);
  
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadExamSubjects();
  }, []);

  const loadExamSubjects = async () => {
    try {
      const examData = await loadExamData();
      if (!examData) {
        console.error('No exam data found, redirecting to exam selection');
        router.push('/(onboarding)/exam-selection');
        return;
      }

      const curriculum = getCurriculumByExamId(examData.id);
      if (!curriculum) {
        console.error('No curriculum found for exam:', examData.id);
        router.back();
        return;
      }

      // Transform curriculum subjects to our component structure
      const transformedSubjects: ExtendedSubjectData[] = curriculum.subjects.map(subject => {
        const subjectStyleKey = subject.name.toLowerCase().replace(/\s+/g, '_');
        const subjectStyle = subjectStyles[subjectStyleKey as keyof typeof subjectStyles] || 
                           subjectStyles[subject.name.toLowerCase() as keyof typeof subjectStyles] ||
                           { icon: '📚', gradient: ['#6B7280', '#4B5563'] };
        
        return {
          name: subject.name,
          icon: subjectStyle.icon,
          gradient: subjectStyle.gradient,
          totalHours: subject.totalHours,
          description: subject.description
        };
      });

      setExamSubjects(transformedSubjects);
      setLoading(false);
    } catch (error) {
      console.error('Error loading exam subjects:', error);
      router.back();
    }
  };


  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.neutral[50] }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.neutral[600] }]}>
            Loading subjects...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // If no subjects loaded yet, show loading
  if (examSubjects.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.neutral[50] }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.neutral[600] }]}>
            Loading subjects...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentSubject = examSubjects[currentSubjectIndex];
  const totalSubjects = examSubjects.length;
  const progress = ((currentSubjectIndex + 1) / totalSubjects) * 100;
  const currentValue = currentSubject ? subjectIntensity[currentSubject.name] : undefined;
  const isAssessed = currentValue !== undefined;

  const handleIntensityChange = (value: number) => {
    if (!currentSubject) return;
    setSubjectIntensity(prev => ({
      ...prev,
      [currentSubject.name]: value,
    }));
  };

  const navigateToNext = () => {
    if (isAnimating) return;
    
    if (currentSubjectIndex < totalSubjects - 1) {
      setIsAnimating(true);
      Animated.timing(slideAnim, {
        toValue: -width,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setCurrentSubjectIndex(prev => prev + 1);
        slideAnim.setValue(width);
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start(() => setIsAnimating(false));
      });
    }
  };

  const navigateToPrevious = () => {
    if (isAnimating) return;
    
    if (currentSubjectIndex > 0) {
      setIsAnimating(true);
      Animated.timing(slideAnim, {
        toValue: width,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setCurrentSubjectIndex(prev => prev - 1);
        slideAnim.setValue(-width);
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start(() => setIsAnimating(false));
      });
    }
  };

  const jumpToSubject = (index: number) => {
    if (isAnimating || index === currentSubjectIndex) return;
    setCurrentSubjectIndex(index);
  };

  const getAssessedCount = () => {
    return Object.keys(subjectIntensity).length;
  };

  const handleContinue = async () => {
    const assessedCount = getAssessedCount();
    if (assessedCount >= Math.min(3, totalSubjects)) {
      try {
        // Save subject intensity data
        await saveSubjectIntensity(subjectIntensity);
        console.log('Subject intensity saved:', subjectIntensity);
        
        router.push('/(onboarding)/learning-style');
      } catch (error) {
        console.error('Error saving subject intensity:', error);
        // Continue anyway for better UX
        router.push('/(onboarding)/learning-style');
      }
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
              Study Intensity Assessment
            </Text>
          </View>
          
          <View style={styles.headerRight} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Text style={styles.mainIcon}>📊</Text>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.neutral[900] }]}>
            Set Study Intensity{'\n'}for Each Subject
          </Text>

          {/* Description */}
          <Text style={[styles.description, { color: colors.neutral[600] }]}>
            Tell us how much focus you want to put on each subject. This will help us allocate your study time effectively across all areas.
          </Text>

          {/* Features */}
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: colors.primary[50] }]}>
                <Text style={styles.featureEmoji}>⚖️</Text>
              </View>
              <View style={styles.featureContent}>
                <Text style={[styles.featureTitle, { color: colors.neutral[800] }]}>
                  Smart Time Allocation
                </Text>
                <Text style={[styles.featureDesc, { color: colors.neutral[600] }]}>
                  Distribute study hours effectively
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: colors.success[50] }]}>
                <Text style={styles.featureEmoji}>🎯</Text>
              </View>
              <View style={styles.featureContent}>
                <Text style={[styles.featureTitle, { color: colors.neutral[800] }]}>
                  Focused Learning
                </Text>
                <Text style={[styles.featureDesc, { color: colors.neutral[600] }]}>
                  Prioritize subjects that matter most
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: colors.warning[50] }]}>
                <Text style={styles.featureEmoji}>📈</Text>
              </View>
              <View style={styles.featureContent}>
                <Text style={[styles.featureTitle, { color: colors.neutral[800] }]}>
                  Optimized Progress
                </Text>
                <Text style={[styles.featureDesc, { color: colors.neutral[600] }]}>
                  Maximize improvement in key areas
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: colors.primary[50] }]}>
                <Text style={styles.featureEmoji}>🔄</Text>
              </View>
              <View style={styles.featureContent}>
                <Text style={[styles.featureTitle, { color: colors.neutral[800] }]}>
                  Flexible Adjustment
                </Text>
                <Text style={[styles.featureDesc, { color: colors.neutral[600] }]}>
                  Change intensity anytime later
                </Text>
              </View>
            </View>
          </View>

          {/* Info Box */}
          <View style={[styles.infoBox, { backgroundColor: colors.primary[50], borderColor: colors.primary[200] }]}>
            <Text style={[styles.infoText, { color: colors.primary[700] }]}>
              💡 This will take about 2-3 minutes to complete.
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
            <Text style={styles.continueButtonText}>Set Subject Intensity</Text>
          </TouchableOpacity>
        </View>

        {/* Background Gradient */}
        <LinearGradient
          colors={[
            'rgba(59, 130, 246, 0.02)',
            'transparent',
            'rgba(99, 102, 241, 0.02)',
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
            Study Intensity Assessment
          </Text>
          <View style={styles.progressInfo}>
            <Text style={[styles.progressText, { color: colors.primary[600] }]}>
              {currentSubjectIndex + 1}/{totalSubjects}
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

      {/* Subject Dots */}
      <View style={styles.subjectDots}>
        {examSubjects.map((_, index) => {
          const isActive = index === currentSubjectIndex;
          const isAssessedSubject = subjectIntensity[examSubjects[index].name] !== undefined;
          
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: isActive 
                    ? colors.primary[500] 
                    : isAssessedSubject 
                      ? colors.success[500]
                      : colors.neutral[300],
                  transform: [{ scale: isActive ? 1.1 : 1 }]
                }
              ]}
              onPress={() => jumpToSubject(index)}
              activeOpacity={0.7}
            />
          );
        })}
      </View>

      {/* Main Content */}
      <Animated.View 
        style={[
          styles.contentContainer,
          { transform: [{ translateX: slideAnim }] }
        ]}
      >
        {/* Subject Header */}
        <LinearGradient
          colors={[currentSubject.gradient[0], currentSubject.gradient[1], `${currentSubject.gradient[1]}80`]}
          style={styles.subjectHeader}
        >
          <Text style={styles.subjectIcon}>{currentSubject.icon}</Text>
          <Text style={styles.subjectName}>{currentSubject.name}</Text>
          <Text style={styles.subjectDescription}>{currentSubject.description}</Text>
          
          <View style={styles.subjectMeta}>
            <View style={styles.metaItem}>
              <Text style={styles.metaValue}>{currentSubject.totalHours}h</Text>
              <Text style={styles.metaLabel}>Total Hours</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Assessment Question */}
        <Text style={[styles.assessmentTitle, { color: colors.neutral[900] }]}>
          How much focus should we put on this subject?
        </Text>
        
        {/* Intensity Level Cards */}
        <View style={styles.intensityContainer}>
          {intensityLevels.map((level, index) => {
            const isSelected = currentValue === level.value;
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.intensityCard,
                  {
                    backgroundColor: isSelected ? level.color : colors.neutral[0],
                    borderColor: isSelected ? level.color : colors.neutral[200],
                    transform: [{ scale: isSelected ? 1.02 : 1 }]
                  }
                ]}
                onPress={() => handleIntensityChange(level.value)}
                activeOpacity={0.9}
              >
                <View style={styles.cardContent}>
                  <View style={styles.cardLeft}>
                    <Text style={styles.cardIcon}>{level.icon}</Text>
                    {isSelected && (
                      <View style={styles.selectedIndicator}>
                        <Text style={styles.checkIcon}>✓</Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.cardRight}>
                    <Text style={[
                      styles.cardLabel,
                      { color: isSelected ? '#FFFFFF' : colors.neutral[800] }
                    ]}>
                      {level.label}
                    </Text>
                    <Text style={[
                      styles.cardDescription, 
                      { color: isSelected ? 'rgba(255,255,255,0.9)' : colors.neutral[500] }
                    ]}>
                      {level.description}
                    </Text>
                  </View>
                  
                  <View style={styles.cardPercentage}>
                    <Text style={[
                      styles.percentageText,
                      { color: isSelected ? '#FFFFFF' : colors.neutral[600] }
                    ]}>
                      {level.percentage}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary[600] }]}>
              {getAssessedCount()}/{totalSubjects}
            </Text>
            <Text style={[styles.statLabel, { color: colors.neutral[500] }]}>
              Done
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.success[600] }]}>
              {Math.round(progress)}%
            </Text>
            <Text style={[styles.statLabel, { color: colors.neutral[500] }]}>
              Progress
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Bottom Navigation */}
      <View style={styles.bottomSection}>
        <View style={styles.navigationButtons}>
          <TouchableOpacity
            style={[
              styles.navButton,
              styles.prevButton,
              { 
                backgroundColor: currentSubjectIndex > 0 ? colors.neutral[200] : colors.neutral[100],
                opacity: currentSubjectIndex > 0 ? 1 : 0.5
              }
            ]}
            onPress={navigateToPrevious}
            disabled={currentSubjectIndex === 0 || isAnimating}
          >
            <Text style={[styles.navButtonText, { color: colors.neutral[700] }]}>
              ←
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navButton,
              styles.mainButton,
              { 
                backgroundColor: currentSubjectIndex < totalSubjects - 1 
                  ? colors.primary[500] 
                  : colors.success[500]
              }
            ]}
            onPress={currentSubjectIndex < totalSubjects - 1 ? navigateToNext : handleContinue}
            disabled={isAnimating}
          >
            <Text style={styles.mainButtonText}>
              {currentSubjectIndex < totalSubjects - 1 ? 'Next →' : 'Complete'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Background Gradient */}
      <LinearGradient
        colors={[
          'rgba(59, 130, 246, 0.02)',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
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
  subjectDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: isTablet ? 80 : 16,
    justifyContent: isTablet ? 'center' : 'flex-start',
  },
  subjectHeader: {
    borderRadius: isTablet ? 20 : 16,
    padding: isTablet ? 24 : 16,
    marginBottom: isTablet ? 24 : 16,
    alignItems: 'center',
  },
  subjectIcon: {
    fontSize: isTablet ? 48 : 32,
    marginBottom: isTablet ? 12 : 8,
  },
  subjectName: {
    fontSize: isTablet ? 26 : 20,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  subjectDescription: {
    fontSize: isTablet ? 16 : 13,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: isTablet ? 22 : 18,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  subjectMeta: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  metaItem: {
    alignItems: 'center',
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  metaLabel: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  assessmentTitle: {
    fontSize: isTablet ? 20 : 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: isTablet ? 20 : 16,
    letterSpacing: -0.1,
  },
  intensityContainer: {
    marginBottom: isTablet ? 20 : 12,
    gap: isTablet ? 12 : 8,
  },
  intensityCard: {
    borderRadius: isTablet ? 16 : 12,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: isTablet ? 16 : 12,
    position: 'relative',
  },
  cardLeft: {
    marginRight: 12,
    minWidth: 38,
    alignItems: 'center',
    position: 'relative',
  },
  cardIcon: {
    fontSize: isTablet ? 28 : 22,
  },
  cardRight: {
    flex: 1,
  },
  cardLabel: {
    fontSize: isTablet ? 18 : 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  cardDescription: {
    fontSize: isTablet ? 14 : 11,
    fontWeight: '500',
    lineHeight: isTablet ? 18 : 15,
  },
  cardPercentage: {
    marginLeft: 8,
    alignItems: 'center',
    minWidth: 32,
  },
  percentageText: {
    fontSize: isTablet ? 16 : 12,
    fontWeight: '700',
  },
  selectedIndicator: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
  },
  checkIcon: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '500',
  },
  bottomSection: {
    paddingHorizontal: 16,
    paddingBottom: isIOS ? 4 : 16,
    paddingTop: 8,
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  navButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prevButton: {
    width: 44,
  },
  mainButton: {
    flex: 1,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  mainButtonText: {
    fontSize: 14,
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
  content: {
    flex: 1,
    paddingHorizontal: isTablet ? 80 : 24,
    paddingTop: 16,
    justifyContent: isTablet ? 'center' : 'flex-start',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  mainIcon: {
    fontSize: isTablet ? 72 : 56,
  },
  title: {
    fontSize: isTablet ? 32 : 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: isTablet ? 42 : 34,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: isTablet ? 18 : 15,
    textAlign: 'center',
    lineHeight: isTablet ? 26 : 22,
    marginBottom: 24,
  },
  featuresContainer: {
    gap: 12,
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureEmoji: {
    fontSize: 18,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: isTablet ? 17 : 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: isTablet ? 15 : 13,
    lineHeight: isTablet ? 20 : 18,
  },
  infoBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    fontWeight: '500',
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
    color: '#FFFFFF',
  },
}); 