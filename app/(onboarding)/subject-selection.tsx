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

import { getCurriculumByExamId, type ExamCurriculum, type TopicData } from '@/app/data';
import { loadExamData, saveTopicProficiency } from '@/app/utils/onboardingData';
import { useTheme } from '@/themes';

const { width, height } = Dimensions.get('window');
const isIOS = Platform.OS === 'ios';

// Compact proficiency levels
const proficiencyLevels = [
  { 
    value: 0, 
    label: 'Beginner', 
    color: '#EF4444', 
    description: 'Need help',
    icon: '🌱'
  },
  { 
    value: 1, 
    label: 'Basic', 
    color: '#F59E0B', 
    description: 'Some gaps',
    icon: '📚'
  },
  { 
    value: 2, 
    label: 'Good', 
    color: '#3B82F6', 
    description: 'Solid base',
    icon: '💡'
  },
  { 
    value: 3, 
    label: 'Strong', 
    color: '#10B981', 
    description: 'Confident',
    icon: '🎯'
  },
  { 
    value: 4, 
    label: 'Expert', 
    color: '#8B5CF6', 
    description: 'Master',
    icon: '👑'
  },
];

// Subject gradients and icons mapping
const subjectStyles = {
  math: { icon: '🔢', gradient: ['#3B82F6', '#1D4ED8'] },
  reading: { icon: '📖', gradient: ['#10B981', '#059669'] },
  writing: { icon: '✍️', gradient: ['#8B5CF6', '#7C3AED'] },
  verbal: { icon: '🗣️', gradient: ['#F59E0B', '#D97706'] },
  quantitative: { icon: '📊', gradient: ['#3B82F6', '#1D4ED8'] },
  analytical_writing: { icon: '📝', gradient: ['#8B5CF6', '#7C3AED'] },
  integrated_reasoning: { icon: '🧠', gradient: ['#EF4444', '#DC2626'] },
  listening: { icon: '👂', gradient: ['#06B6D4', '#0891B2'] },
  speaking: { icon: '🎤', gradient: ['#F59E0B', '#D97706'] },
  logical_reasoning: { icon: '⚖️', gradient: ['#8B5CF6', '#7C3AED'] },
  reading_comprehension: { icon: '📖', gradient: ['#10B981', '#059669'] },
  analytical_reasoning: { icon: '🧩', gradient: ['#EF4444', '#DC2626'] }
};

interface TopicProficiency {
  [topicId: string]: number;
}

interface ExtendedTopicData extends TopicData {
  subjectName: string;
  subjectIcon: string;
  subjectGradient: string[];
  weight: number;
}

export default function SubjectSelectionScreen() {
  const { colors } = useTheme();
  const [showIntro, setShowIntro] = useState(true);
  const [topicProficiency, setTopicProficiency] = useState<TopicProficiency>({});
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [curriculum, setCurriculum] = useState<ExamCurriculum | null>(null);
  const [allTopics, setAllTopics] = useState<ExtendedTopicData[]>([]);
  const [loading, setLoading] = useState(true);
  
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadCurriculumData();
  }, []);

  const loadCurriculumData = async () => {
    try {
      const examData = await loadExamData();
      if (!examData) {
        console.error('No exam data found');
        router.back();
        return;
      }

      const curriculumData = getCurriculumByExamId(examData.id);
      if (!curriculumData) {
        console.error('No curriculum found for exam:', examData.id);
        router.back();
        return;
      }

      setCurriculum(curriculumData);
      
      // Transform curriculum data to match our component structure
      const transformedTopics: ExtendedTopicData[] = [];
      
      curriculumData.subjects.forEach(subject => {
        const subjectStyle = subjectStyles[subject.id as keyof typeof subjectStyles] || 
                           { icon: '📚', gradient: ['#6B7280', '#4B5563'] };
        
        subject.topics.forEach(topic => {
          transformedTopics.push({
            ...topic,
            subjectName: subject.name,
            subjectIcon: subjectStyle.icon,
            subjectGradient: subjectStyle.gradient,
            weight: Math.round((topic.estimatedHours / subject.totalHours) * 100)
          });
        });
      });

      setAllTopics(transformedTopics);
      setLoading(false);
    } catch (error) {
      console.error('Error loading curriculum data:', error);
      router.back();
    }
  };

  if (loading || !curriculum) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.neutral[50] }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.neutral[600] }]}>
            Loading curriculum...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentTopic = allTopics[currentTopicIndex];
  const totalTopics = allTopics.length;
  const progress = ((currentTopicIndex + 1) / totalTopics) * 100;

  const handleProficiencyChange = (value: number) => {
    setTopicProficiency(prev => ({
      ...prev,
      [currentTopic.id]: value,
    }));
  };

  const navigateToNext = () => {
    if (isAnimating) return;
    
    if (currentTopicIndex < totalTopics - 1) {
      setIsAnimating(true);
      Animated.timing(slideAnim, {
        toValue: -width,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setCurrentTopicIndex(prev => prev + 1);
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
    
    if (currentTopicIndex > 0) {
      setIsAnimating(true);
      Animated.timing(slideAnim, {
        toValue: width,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setCurrentTopicIndex(prev => prev - 1);
        slideAnim.setValue(-width);
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start(() => setIsAnimating(false));
      });
    }
  };

  const jumpToTopic = (index: number) => {
    if (isAnimating || index === currentTopicIndex) return;
    setCurrentTopicIndex(index);
  };

  const getAssessedCount = () => {
    return Object.keys(topicProficiency).length;
  };

  const getEstimatedStudyHours = () => {
    let totalHours = 0;
    Object.entries(topicProficiency).forEach(([topicId, level]) => {
      const topic = allTopics.find(t => t.id === topicId);
      if (topic && level <= 2) {
        const multiplier = level === 0 ? 1 : level === 1 ? 0.8 : 0.6;
        totalHours += topic.estimatedHours * multiplier;
      }
    });
    return Math.round(totalHours);
  };

  const handleContinue = async () => {
    const assessedCount = getAssessedCount();
    if (assessedCount >= 4) {
      try {
        // Save topic proficiency data
        await saveTopicProficiency(topicProficiency);
        console.log('Topic proficiency saved:', topicProficiency);
        
        router.push('/(onboarding)/learning-style');
      } catch (error) {
        console.error('Error saving topic proficiency:', error);
        // Continue anyway for better UX
        router.push('/(onboarding)/learning-style');
      }
    }
  };

  const currentValue = topicProficiency[currentTopic.id];
  const isAssessed = currentValue !== undefined;

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
            Knowledge Assessment
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
            Assess Your{'\n'}Knowledge Level
          </Text>

          {/* Description */}
          <Text style={[styles.description, { color: colors.neutral[600] }]}>
            Help us understand your current knowledge in each subject area. This assessment will customize your study plan to focus on areas where you need the most improvement.
          </Text>

          {/* Features */}
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: colors.primary[50] }]}>
                <Text style={styles.featureEmoji}>🎯</Text>
              </View>
              <View style={styles.featureContent}>
                <Text style={[styles.featureTitle, { color: colors.neutral[800] }]}>
                  Personalized Focus
                </Text>
                <Text style={[styles.featureDesc, { color: colors.neutral[600] }]}>
                  Study what you need most
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: colors.success[50] }]}>
                <Text style={styles.featureEmoji}>📊</Text>
              </View>
              <View style={styles.featureContent}>
                <Text style={[styles.featureTitle, { color: colors.neutral[800] }]}>
                  Progress Tracking
                </Text>
                <Text style={[styles.featureDesc, { color: colors.neutral[600] }]}>
                  Monitor improvement over time
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: colors.warning[50] }]}>
                <Text style={styles.featureEmoji}>⏰</Text>
              </View>
              <View style={styles.featureContent}>
                <Text style={[styles.featureTitle, { color: colors.neutral[800] }]}>
                  Time Optimization
                </Text>
                <Text style={[styles.featureDesc, { color: colors.neutral[600] }]}>
                  Efficient study time allocation
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: colors.primary[50] }]}>
                <Text style={styles.featureEmoji}>🏆</Text>
              </View>
              <View style={styles.featureContent}>
                <Text style={[styles.featureTitle, { color: colors.neutral[800] }]}>
                  Targeted Practice
                </Text>
                <Text style={[styles.featureDesc, { color: colors.neutral[600] }]}>
                  Focus on weak areas first
                </Text>
              </View>
            </View>
          </View>

          {/* Info Box */}
          <View style={[styles.infoBox, { backgroundColor: colors.success[50], borderColor: colors.success[200] }]}>
            <Text style={[styles.infoText, { color: colors.success[700] }]}>
              ✨ This assessment takes about 3-5 minutes and greatly improves your study efficiency
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.neutral[50] }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.neutral[50]} />
      
      {/* Ultra Compact Header */}
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
            Knowledge Assessment
          </Text>
          <View style={styles.progressInfo}>
            <Text style={[styles.progressText, { color: colors.primary[600] }]}>
              {currentTopicIndex + 1}/{totalTopics}
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

      {/* Mini Topic Dots */}
      <View style={styles.topicDots}>
        {allTopics.map((_, index) => {
          const isActive = index === currentTopicIndex;
          const isAssessedTopic = topicProficiency[allTopics[index].id] !== undefined;
          
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: isActive 
                    ? colors.primary[500] 
                    : isAssessedTopic 
                      ? colors.success[500]
                      : colors.neutral[300],
                  transform: [{ scale: isActive ? 1.1 : 1 }]
                }
              ]}
              onPress={() => jumpToTopic(index)}
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
        {/* Compact Topic Header */}
        <LinearGradient
          colors={[currentTopic.subjectGradient[0], currentTopic.subjectGradient[1], `${currentTopic.subjectGradient[1]}80`]}
          style={styles.topicHeader}
        >
          <View style={styles.subjectBadge}>
            <Text style={styles.subjectIcon}>{currentTopic.subjectIcon}</Text>
            <Text style={styles.subjectName}>{currentTopic.subjectName}</Text>
          </View>

          <Text style={styles.topicName}>{currentTopic.name}</Text>
          <Text style={styles.topicDescription}>{currentTopic.description}</Text>
          
          <View style={styles.topicMeta}>
            <View style={styles.metaItem}>
              <Text style={styles.metaValue}>{currentTopic.weight}%</Text>
              <Text style={styles.metaLabel}>Weight</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaValue}>{currentTopic.estimatedHours}h</Text>
              <Text style={styles.metaLabel}>Study</Text>
            </View>
            <View style={styles.metaItem}>
              <View style={styles.badgeContainer}>
                <View style={[
                  styles.difficultyBadge,
                  { backgroundColor: 
                    currentTopic.difficulty === 'easy' ? colors.success[100] :
                    currentTopic.difficulty === 'medium' ? colors.warning[100] :
                    colors.error[100]
                  }
                ]}>
                  <Text style={[
                    styles.difficultyText,
                    { color: 
                      currentTopic.difficulty === 'easy' ? colors.success[700] :
                      currentTopic.difficulty === 'medium' ? colors.warning[700] :
                      colors.error[700]
                    }
                  ]}>
                    {currentTopic.difficulty.charAt(0).toUpperCase() + currentTopic.difficulty.slice(1)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Assessment Question */}
        <Text style={[styles.assessmentTitle, { color: colors.neutral[900] }]}>
          How well do you know this topic?
        </Text>
        
        {/* Horizontal Proficiency Cards */}
        <View style={styles.proficiencyContainer}>
          {proficiencyLevels.map((level, index) => {
            const isSelected = currentValue === level.value;
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.proficiencyCard,
                  {
                    backgroundColor: isSelected ? level.color : colors.neutral[0],
                    borderColor: isSelected ? level.color : colors.neutral[200],
                    transform: [{ scale: isSelected ? 1.02 : 1 }]
                  }
                ]}
                onPress={() => handleProficiencyChange(level.value)}
                activeOpacity={0.9}
              >
                <View style={styles.cardContent}>
                  <View style={styles.cardLeft}>
                    <Text style={styles.cardIcon}>{level.icon}</Text>
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
                  
                  {isSelected && (
                    <View style={styles.selectedIndicator}>
                      <Text style={styles.checkIcon}>✓</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Stats Row - Moved up */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary[600] }]}>
              {getAssessedCount()}/{totalTopics}
            </Text>
            <Text style={[styles.statLabel, { color: colors.neutral[500] }]}>
              Done
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.warning[600] }]}>
              {getEstimatedStudyHours()}h
            </Text>
            <Text style={[styles.statLabel, { color: colors.neutral[500] }]}>
              Study
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
                backgroundColor: currentTopicIndex > 0 ? colors.neutral[200] : colors.neutral[100],
                opacity: currentTopicIndex > 0 ? 1 : 0.5
              }
            ]}
            onPress={navigateToPrevious}
            disabled={currentTopicIndex === 0 || isAnimating}
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
                backgroundColor: currentTopicIndex < totalTopics - 1 
                  ? colors.primary[500] 
                  : colors.success[500]
              }
            ]}
            onPress={currentTopicIndex < totalTopics - 1 ? navigateToNext : handleContinue}
            disabled={isAnimating}
          >
            <Text style={styles.mainButtonText}>
              {currentTopicIndex < totalTopics - 1 ? 'Next →' : 'Complete'}
            </Text>
          </TouchableOpacity>
        </View>
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
  topicDots: {
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
    paddingHorizontal: 16,
  },
  topicHeader: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  subjectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  subjectIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  subjectName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  topicName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  topicDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  topicMeta: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.1,
  },
  proficiencyContainer: {
    marginBottom: 12,
    gap: 8,
  },
  proficiencyCard: {
    borderRadius: 12,
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
    padding: 12,  
    position: 'relative',
  },
  cardLeft: {
    marginRight: 12,
    minWidth: 32,
    alignItems: 'center',
  },
  cardIcon: {
    fontSize: 22,
  },
  cardRight: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  cardDescription: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 10,
    right: 12,
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
    paddingBottom: isIOS ? 30 : 16,
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
    paddingHorizontal: 24,
    paddingTop: 20,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
  },
  badgeContainer: {
    alignItems: 'center',
  },
  difficultyBadge: {
    padding: 4,
    borderRadius: 4,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
  },
}); 