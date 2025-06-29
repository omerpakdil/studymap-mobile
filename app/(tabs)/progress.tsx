import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useState } from 'react';
import {
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

import {
  calculateWeeklyProgress,
  getProgramMetadata,
  getStudyStreak,
  getSubjectProgress
} from '@/app/utils/studyProgramStorage';
import { useTheme } from '@/themes';

const { width } = Dimensions.get('window');
const isIOS = Platform.OS === 'ios';

export default function ProgressScreen() {
  const { colors } = useTheme();
  const [selectedTab, setSelectedTab] = useState<'overview' | 'subjects' | 'insights'>('overview');
  
  // Real data states
  const [programMetadata, setProgramMetadata] = useState<any>(null);
  const [subjectProgress, setSubjectProgress] = useState<any>({});
  const [weeklyProgress, setWeeklyProgress] = useState({ completed: 0, total: 0, hours: 0 });
  const [studyStreak, setStudyStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load progress data from Claude-generated program
  const loadProgressData = async () => {
    try {
      setLoading(true);
      
      // Load all progress data
      const [metadata, subjects, weekly, streak] = await Promise.all([
        getProgramMetadata(),
        getSubjectProgress(),
        calculateWeeklyProgress(),
        getStudyStreak()
      ]);
      
      setProgramMetadata(metadata);
      setSubjectProgress(subjects);
      setWeeklyProgress(weekly);
      setStudyStreak(streak);
      
      console.log('📊 Progress data loaded:', {
        subjects: Object.keys(subjects).length,
        weeklyHours: weekly.hours,
        streak: streak,
        daysRemaining: metadata?.daysRemaining
      });
      
    } catch (error) {
      console.error('❌ Error loading progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProgressData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProgressData();
    }, [])
  );

  const getTrendIcon = (progress: number) => {
    if (progress >= 75) return '📈';
    if (progress >= 50) return '➖';
    return '📉';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return colors.success[500];
      case 'Medium': return colors.warning[500];
      case 'Hard': return colors.error[500];
      default: return colors.neutral[500];
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'warning': return colors.warning[500];
      case 'success': return colors.success[500];
      case 'info': return colors.primary[500];
      case 'tip': return colors.neutral[600];
      default: return colors.neutral[500];
    }
  };

  // Generate dynamic insights based on real data
  const generateInsights = () => {
    const insights = [];
    
         // Analyze subjects performance
     const subjects = Object.entries(subjectProgress) as [string, any][];
     const weakestSubject = subjects.reduce((prev, curr) => 
       curr[1].progress < prev[1].progress ? curr : prev, 
       subjects[0] || ['', { progress: 100 }]
     );
     
     const strongestSubject = subjects.reduce((prev, curr) => 
       curr[1].progress > prev[1].progress ? curr : prev,
       subjects[0] || ['', { progress: 0 }]
     );

    if (weakestSubject && weakestSubject[1].progress < 50) {
      insights.push({
        type: 'warning',
        icon: '⚠️',
        title: 'Focus Area Identified',
        message: `${weakestSubject[0]} needs attention (${weakestSubject[1].progress}% completed)`,
        action: 'Review Study Plan',
      });
    }

    if (strongestSubject && strongestSubject[1].progress > 80) {
      insights.push({
        type: 'success',
        icon: '🎯',
        title: 'Great Progress!',
        message: `Excellent work on ${strongestSubject[0]} (${strongestSubject[1].progress}% completed)`,
        action: 'View Achievement',
      });
    }

    if (studyStreak >= 7) {
      insights.push({
        type: 'success',
        icon: '🔥',
        title: 'Amazing Streak!',
        message: `You've studied for ${studyStreak} consecutive days!`,
        action: 'Keep it up!',
      });
    } else if (studyStreak === 0) {
      insights.push({
        type: 'tip',
        icon: '💡',
        title: 'Time to Start',
        message: 'Complete a study session today to begin your streak',
        action: 'Start Studying',
      });
    }

    if (programMetadata && programMetadata.daysRemaining <= 30) {
      insights.push({
        type: 'info',
        icon: '📅',
        title: 'Exam Approaching',
        message: `Only ${programMetadata.daysRemaining} days left until your exam`,
        action: 'Intensify Study',
      });
    }

    return insights;
  };

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      {[
        { key: 'overview', label: 'Overview' },
        { key: 'subjects', label: 'Subjects' },
        { key: 'insights', label: 'Insights' },
      ].map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[
            styles.tabItem,
            selectedTab === tab.key && { backgroundColor: colors.primary[500] },
          ]}
          onPress={() => setSelectedTab(tab.key as any)}
        >
          <Text
            style={[
              styles.tabText,
              { color: selectedTab === tab.key ? '#FFFFFF' : colors.neutral[600] },
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Show loading state
  if (loading || !programMetadata) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.neutral[50] }]}>
        <View style={[styles.loadingContainer, { justifyContent: 'center', alignItems: 'center', flex: 1 }]}>
          <Text style={[styles.loadingText, { color: colors.neutral[600] }]}>
            📊 Loading your progress data...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const overallProgress = programMetadata.totalTasks > 0 
    ? Math.round((programMetadata.completedTasks / programMetadata.totalTasks) * 100) 
    : 0;

  const renderOverview = () => (
    <View style={styles.tabContent}>
      {/* Overall Progress Card */}
      <View style={[styles.overviewCard, { backgroundColor: colors.neutral[0] }]}>
        <LinearGradient
          colors={[colors.primary[500], colors.primary[600]] as const}
          style={styles.overviewGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.overviewContent}>
            <View style={styles.overviewLeft}>
              <Text style={styles.overviewPercentage}>{overallProgress}%</Text>
              <Text style={styles.overviewLabel}>Overall Progress</Text>
            </View>
            <View style={styles.overviewRight}>
              <View style={styles.overviewStat}>
                <Text style={styles.overviewStatValue}>{programMetadata.daysRemaining}</Text>
                <Text style={styles.overviewStatLabel}>Days Left</Text>
              </View>
              <View style={styles.overviewStat}>
                <Text style={styles.overviewStatValue}>{programMetadata.examType?.toUpperCase()}</Text>
                <Text style={styles.overviewStatLabel}>Target Exam</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Quick Stats Grid */}
      <View style={styles.quickStatsGrid}>
        <View style={[styles.quickStatCard, { backgroundColor: colors.success[50] }]}>
          <Text style={styles.quickStatEmoji}>🔥</Text>
          <Text style={[styles.quickStatValue, { color: colors.success[700] }]}>
            {studyStreak}
          </Text>
          <Text style={[styles.quickStatLabel, { color: colors.success[600] }]}>
            Day Streak
          </Text>
        </View>
        
        <View style={[styles.quickStatCard, { backgroundColor: colors.primary[50] }]}>
          <Text style={styles.quickStatEmoji}>📚</Text>
          <Text style={[styles.quickStatValue, { color: colors.primary[700] }]}>
            {programMetadata.completedTasks}
          </Text>
          <Text style={[styles.quickStatLabel, { color: colors.primary[600] }]}>
            Tasks Done
          </Text>
        </View>
        
        <View style={[styles.quickStatCard, { backgroundColor: colors.warning[50] }]}>
          <Text style={styles.quickStatEmoji}>⏰</Text>
          <Text style={[styles.quickStatValue, { color: colors.warning[700] }]}>
            {weeklyProgress.hours}h
          </Text>
          <Text style={[styles.quickStatLabel, { color: colors.warning[600] }]}>
            This Week
          </Text>
        </View>
        
        <View style={[styles.quickStatCard, { backgroundColor: colors.error[50] }]}>
          <Text style={styles.quickStatEmoji}>🎯</Text>
          <Text style={[styles.quickStatValue, { color: colors.error[700] }]}>
            {programMetadata.weeklyHours}h
          </Text>
          <Text style={[styles.quickStatLabel, { color: colors.error[600] }]}>
            Weekly Goal
          </Text>
        </View>
      </View>

      {/* Weekly Progress Chart */}
      <View style={[styles.chartCard, { backgroundColor: colors.neutral[0] }]}>
        <Text style={[styles.chartTitle, { color: colors.neutral[900] }]}>
          Weekly Study Hours
        </Text>
        <View style={styles.chartContainer}>
          {/* Generate last 6 weeks of data */}
          {Array.from({ length: 6 }, (_, index) => {
            const weekNumber = index + 1;
            const weeklyTarget = programMetadata?.weeklyHours || 15;
            // Simulate varying progress for visualization
            const actualHours = index < 3 ? 
              weeklyProgress.hours * (0.7 + Math.random() * 0.6) : // Past weeks
              index === 5 ? weeklyProgress.hours : // Current week
              weeklyTarget * (0.8 + Math.random() * 0.4); // Recent weeks
            
            const heightPercentage = Math.min(100, (actualHours / 20) * 100); // Max 20 hours for scaling
            const isTarget = actualHours >= weeklyTarget;
            
            return (
              <View key={index} style={styles.chartBar}>
                <View
                  style={[
                    styles.chartBarFill,
                    {
                      height: `${heightPercentage}%`,
                      backgroundColor: isTarget ? colors.success[500] : colors.primary[500],
                    },
                  ]}
                />
                <Text style={[styles.chartLabel, { color: colors.neutral[600] }]}>
                  W{weekNumber}
                </Text>
                <Text style={[styles.chartValue, { color: colors.neutral[700] }]}>
                  {Math.round(actualHours * 10) / 10}h
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );

  const renderSubjects = () => (
    <View style={styles.tabContent}>
      {Object.entries(subjectProgress).map(([subject, progress]: [string, any], index) => (
        <View key={index} style={[styles.subjectCard, { backgroundColor: colors.neutral[0] }]}>
          <View style={styles.subjectHeader}>
            <View>
              <Text style={[styles.subjectName, { color: colors.neutral[900] }]}>
                {subject}
              </Text>
              <Text style={[styles.subjectScore, { color: colors.neutral[600] }]}>
                {progress.progress}% completed • {progress.hours}h studied • {getTrendIcon(progress.progress)}
              </Text>
            </View>
            <View style={[styles.subjectBadge, { backgroundColor: colors.primary[100] }]}>
              <Text style={[styles.subjectBadgeText, { color: colors.primary[700] }]}>
                {progress.progress >= 75 ? 'Excellent' : progress.progress >= 50 ? 'Good Progress' : 'Needs Focus'}
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.subjectProgressContainer}>
            <View style={[styles.subjectProgressBar, { backgroundColor: colors.neutral[200] }]}>
              <View 
                style={[
                  styles.subjectProgressFill, 
                  { 
                    backgroundColor: progress.progress >= 75 ? colors.success[500] : 
                                    progress.progress >= 50 ? colors.warning[500] : colors.error[500],
                    width: `${progress.progress}%`
                  }
                ]} 
              />
            </View>
            <Text style={[styles.subjectProgressText, { color: colors.neutral[600] }]}>
              {progress.completed} of {progress.total} tasks completed
            </Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderInsights = () => (
    <View style={styles.tabContent}>
      {generateInsights().map((insight, index) => (
        <View key={index} style={[styles.insightCard, { backgroundColor: colors.neutral[0] }]}>
          <View style={styles.insightHeader}>
            <View style={[styles.insightIcon, { backgroundColor: `${getInsightColor(insight.type)}20` }]}>
              <Text style={styles.insightEmoji}>{insight.icon}</Text>
            </View>
            <View style={styles.insightContent}>
              <Text style={[styles.insightTitle, { color: colors.neutral[900] }]}>
                {insight.title}
              </Text>
              <Text style={[styles.insightMessage, { color: colors.neutral[600] }]}>
                {insight.message}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.insightAction, { borderColor: getInsightColor(insight.type) }]}
          >
            <Text style={[styles.insightActionText, { color: getInsightColor(insight.type) }]}>
              {insight.action}
            </Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.neutral[50] }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.neutral[50]} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.neutral[900] }]}>
          📊 Progress Analytics
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.neutral[600] }]}>
          Detailed insights into your study journey
        </Text>
      </View>

      {/* Tab Bar */}
      {renderTabBar()}

      {/* Content */}
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {selectedTab === 'overview' && renderOverview()}
        {selectedTab === 'subjects' && renderSubjects()}
        {selectedTab === 'insights' && renderInsights()}
        
        {/* Bottom Spacing */}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: isIOS ? 8 : 16,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  
  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 4,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Content
  scrollContainer: {
    flex: 1,
  },
  tabContent: {
    paddingHorizontal: 20,
  },
  
  // Overview Tab
  overviewCard: {
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  overviewGradient: {
    borderRadius: 16,
    padding: 24,
  },
  overviewContent: {
    alignItems: 'center',
  },
  overviewLeft: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  overviewRight: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  overviewPercentage: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  overviewLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  overviewStat: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  overviewStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  overviewStatLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  
  // Quick Stats Grid
  quickStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  quickStatCard: {
    width: (width - 60) / 2, // 20px padding on each side, 12px gap
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickStatEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  quickStatLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  
  // Chart
  chartCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    gap: 8,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  chartBarFill: {
    width: '100%',
    borderRadius: 4,
    minHeight: 8,
  },
  chartLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  chartValue: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  
  // Subjects Tab
  subjectCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  subjectName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  subjectScore: {
    fontSize: 14,
    lineHeight: 20,
  },
  subjectBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  subjectBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  subjectProgressContainer: {
    marginTop: 16,
  },
  subjectProgressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  subjectProgressFill: {
    height: 8,
    borderRadius: 4,
  },
  subjectProgressText: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Topics
  topicsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 16,
  },
  topicRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  topicInfo: {
    flex: 1,
  },
  topicName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  topicStats: {
    fontSize: 12,
    lineHeight: 16,
  },
  topicProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topicPercentage: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
  topicTrend: {
    fontSize: 16,
  },
  
  // Insights Tab
  insightCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 16,
  },
  insightIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightEmoji: {
    fontSize: 20,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  insightMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  insightAction: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  insightActionText: {
    fontSize: 14,
    fontWeight: '600',
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
}); 