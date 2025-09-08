import { Ionicons } from '@expo/vector-icons';
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
    Achievement,
    calculateDailyProgress,
    calculateWeeklyProgress,
    getProgramMetadata,
    getStudyStreak,
    getSubjectProgress,
    getUserAchievements
} from '@/app/utils/studyProgramStorage';
import { useTheme } from '@/themes';

const { width } = Dimensions.get('window');
const isIOS = Platform.OS === 'ios';

export default function ProgressScreen() {
  const { colors } = useTheme();
  const [selectedTab, setSelectedTab] = useState<'overview' | 'subjects' | 'achievements'>('overview');
  
  // Real data states
  const [programMetadata, setProgramMetadata] = useState<any>(null);
  const [subjectProgress, setSubjectProgress] = useState<any>({});
  const [weeklyProgress, setWeeklyProgress] = useState({ completed: 0, total: 0, hours: 0 });
  const [dailyProgress, setDailyProgress] = useState({ completed: 0, total: 0, minutes: 0 });
  const [studyStreak, setStudyStreak] = useState(0);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  // Calculate overall progress
  const overallProgress = programMetadata && programMetadata.totalTasks > 0 
    ? Math.round((programMetadata.completedTasks / programMetadata.totalTasks) * 100) 
    : 0;

  // Load progress data from Claude-generated program
  const loadProgressData = async () => {
    try {
      setLoading(true);
      
      // Load all progress data
      const today = new Date().toISOString().split('T')[0];
      const [metadata, subjects, weekly, daily, streak, userAchievements] = await Promise.all([
        getProgramMetadata(),
        getSubjectProgress(),
        calculateWeeklyProgress(),
        calculateDailyProgress(today),
        getStudyStreak(),
        getUserAchievements()
      ]);
      
      setProgramMetadata(metadata);
      setSubjectProgress(subjects);
      setWeeklyProgress(weekly);
      setDailyProgress(daily);
      setStudyStreak(streak);
      setAchievements(userAchievements);
      
      // Check for goal completions
      const { checkDailyGoalCompletion, checkWeeklyGoalCompletion } = await import('@/app/utils/studyProgramStorage');
      await checkDailyGoalCompletion(today);
      await checkWeeklyGoalCompletion();
      
      console.log('📊 Progress data loaded:', {
        subjects: Object.keys(subjects).length,
        weeklyHours: weekly.hours,
        dailyMinutes: daily.minutes,
        streak: streak,
        achievements: userAchievements.length,
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

  // Debug info for troubleshooting
  useEffect(() => {
    if (programMetadata) {
      console.log('📊 Overall Progress Debug:', {
        totalTasks: programMetadata.totalTasks,
        completedTasks: programMetadata.completedTasks,
        calculatedProgress: overallProgress,
        examDate: programMetadata.examDate,
        daysRemaining: programMetadata.daysRemaining
      });
    }
  }, [programMetadata, overallProgress]);

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
    
    // Check daily progress
    if (dailyProgress.total > 0) {
      const dailyCompletionRate = (dailyProgress.completed / dailyProgress.total) * 100;
      if (dailyCompletionRate === 100) {
        insights.push({
          type: 'success',
          icon: '🎉',
          title: 'Daily Goal Achieved!',
          message: `You completed all ${dailyProgress.total} tasks today. Great work!`,
          action: 'Keep Momentum',
        });
      } else if (dailyCompletionRate >= 50) {
        insights.push({
          type: 'info',
          icon: '💪',
          title: 'Good Progress Today',
          message: `${dailyProgress.completed} of ${dailyProgress.total} tasks completed today`,
          action: 'Finish Strong',
        });
      } else if (dailyProgress.completed === 0 && dailyProgress.total > 0) {
        insights.push({
          type: 'warning',
          icon: '⏰',
          title: 'Start Your Day',
          message: `You have ${dailyProgress.total} tasks planned for today`,
          action: 'Begin Studying',
        });
      }
    }
    
    // Weekly progress insight
    if (weeklyProgress.total > 0) {
      const weeklyCompletionRate = (weeklyProgress.completed / weeklyProgress.total) * 100;
      if (weeklyCompletionRate >= 80) {
        insights.push({
          type: 'success',
          icon: '📈',
          title: 'Excellent Weekly Progress',
          message: `${weeklyCompletionRate.toFixed(0)}% of this week's tasks completed`,
          action: 'Maintain Pace',
        });
      }
    }
    
         // Analyze subjects performance
     const subjects = Object.entries(subjectProgress) as [string, any][];
     
     if (subjects.length === 0) {
       insights.push({
         type: 'info',
         icon: '📚',
         title: 'No Study Data Yet',
         message: 'Complete some study sessions to see your progress analytics',
         action: 'Start Studying',
       });
       return insights;
     }
     
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
        { key: 'achievements', label: 'Achievements' },
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
          <Ionicons name="flame" size={28} color={colors.success[600]} style={styles.quickStatIcon} />
          <Text style={[styles.quickStatValue, { color: colors.success[700] }]}>
            {studyStreak}
          </Text>
          <Text style={[styles.quickStatLabel, { color: colors.success[600] }]}>
            Day Streak
          </Text>
        </View>
        
        <View style={[styles.quickStatCard, { backgroundColor: colors.primary[50] }]}>
          <Ionicons name="book" size={28} color={colors.primary[600]} style={styles.quickStatIcon} />
          <Text style={[styles.quickStatValue, { color: colors.primary[700] }]}>
            {programMetadata.completedTasks}
          </Text>
          <Text style={[styles.quickStatLabel, { color: colors.primary[600] }]}>
            Tasks Done
          </Text>
        </View>
        
        <View style={[styles.quickStatCard, { backgroundColor: colors.warning[50] }]}>
          <Ionicons name="time" size={28} color={colors.warning[600]} style={styles.quickStatIcon} />
          <Text style={[styles.quickStatValue, { color: colors.warning[700] }]}>
            {weeklyProgress.hours}h
          </Text>
          <Text style={[styles.quickStatLabel, { color: colors.warning[600] }]}>
            This Week
          </Text>
        </View>
        
        <View style={[styles.quickStatCard, { backgroundColor: colors.error[50] }]}>
          <Ionicons name="trophy" size={28} color={colors.error[600]} style={styles.quickStatIcon} />
          <Text style={[styles.quickStatValue, { color: colors.error[700] }]}>
            {programMetadata.weeklyHours}h
          </Text>
          <Text style={[styles.quickStatLabel, { color: colors.error[600] }]}>
            Weekly Goal
          </Text>
        </View>
        
        <View style={[styles.quickStatCard, { backgroundColor: colors.neutral[50] }]}>
          <Ionicons name="calendar" size={28} color={colors.neutral[600]} style={styles.quickStatIcon} />
          <Text style={[styles.quickStatValue, { color: colors.neutral[700] }]}>
            {dailyProgress.minutes}m
          </Text>
          <Text style={[styles.quickStatLabel, { color: colors.neutral[600] }]}>
            Today
          </Text>
        </View>
      </View>

      {/* Weekly Progress Chart */}
      <View style={[styles.chartCard, { backgroundColor: colors.neutral[0] }]}>
        <Text style={[styles.chartTitle, { color: colors.neutral[900] }]}>
          Weekly Study Progress
        </Text>
        <View style={styles.chartContainer}>
          {/* Current week real data */}
          <View style={styles.chartBar}>
            <View
              style={[
                styles.chartBarFill,
                {
                  height: `${Math.max(10, Math.min(100, (weeklyProgress.hours / 15) * 100))}%`,
                  backgroundColor: colors.primary[500],
                },
              ]}
            />
            <Text style={[styles.chartLabel, { color: colors.neutral[600] }]}>
              This Week
            </Text>
            <Text style={[styles.chartValue, { color: colors.neutral[700] }]}>
              {weeklyProgress.hours}h
            </Text>
          </View>
          
          {/* Target indicator */}
          <View style={styles.chartBar}>
            <View
              style={[
                styles.chartBarFill,
                styles.chartBarTarget,
                {
                  height: `100%`,
                },
              ]}
            />
            <Text style={[styles.chartLabel, { color: colors.neutral[600] }]}>
              Target
            </Text>
            <Text style={[styles.chartValue, { color: colors.neutral[700] }]}>
              {programMetadata.weeklyHours || 15}h
            </Text>
          </View>
        </View>
        
        {/* Progress Summary */}
        <View style={styles.progressSummary}>
          <View style={styles.progressSummaryItem}>
            <Text style={[styles.progressSummaryLabel, { color: colors.neutral[600] }]}>
              Tasks Completed
            </Text>
            <Text style={[styles.progressSummaryValue, { color: colors.success[600] }]}>
              {weeklyProgress.completed} / {weeklyProgress.total}
            </Text>
          </View>
          <View style={styles.progressSummaryItem}>
            <Text style={[styles.progressSummaryLabel, { color: colors.neutral[600] }]}>
              Weekly Progress
            </Text>
            <Text style={[styles.progressSummaryValue, { 
              color: weeklyProgress.total > 0 && (weeklyProgress.completed / weeklyProgress.total) >= 0.8 
                ? colors.success[600] 
                : colors.warning[600] 
            }]}>
              {weeklyProgress.total > 0 ? Math.round((weeklyProgress.completed / weeklyProgress.total) * 100) : 0}%
            </Text>
          </View>
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

  const renderAchievements = () => {
    // Group achievements by category
    const achievementsByCategory = achievements.reduce((acc, achievement) => {
      if (!acc[achievement.category]) {
        acc[achievement.category] = [];
      }
      acc[achievement.category].push(achievement);
      return acc;
    }, {} as Record<string, Achievement[]>);

    const getRarityColor = (rarity: string) => {
      switch (rarity) {
        case 'common': return colors.neutral[500];
        case 'rare': return colors.primary[500];
        case 'epic': return colors.warning[500];
        case 'legendary': return colors.error[500];
        default: return colors.neutral[500];
      }
    };

    const getRarityBg = (rarity: string) => {
      switch (rarity) {
        case 'common': return colors.neutral[50];
        case 'rare': return colors.primary[50];
        case 'epic': return colors.warning[50];
        case 'legendary': return colors.error[50];
        default: return colors.neutral[50];
      }
    };

    const getCategoryTitle = (category: string) => {
      switch (category) {
        case 'streak': return '🔥 Study Streaks';
        case 'time': return '⏰ Time Milestones';
        case 'tasks': return '✅ Task Achievements';
        case 'subjects': return '📚 Subject Mastery';
        case 'milestones': return '🎯 Goal Achievements';
        default: return category;
      }
    };

    const unlockedCount = achievements.filter(a => a.unlocked).length;
    const totalCount = achievements.length;

    return (
      <View style={styles.tabContent}>
        {/* Achievement Summary */}
        <View style={[styles.achievementSummary, { backgroundColor: colors.neutral[0] }]}>
          <View style={styles.achievementSummaryContent}>
            <Text style={[styles.achievementSummaryTitle, { color: colors.neutral[900] }]}>
              Your Achievements
            </Text>
            <Text style={[styles.achievementSummaryText, { color: colors.neutral[600] }]}>
              {unlockedCount} of {totalCount} badges unlocked
            </Text>
            <View style={[styles.achievementProgressContainer, { flexDirection: 'row' }]}>
              <View style={[styles.achievementProgressBar, { backgroundColor: colors.neutral[200] }]}>
                <View 
                  style={[
                    styles.achievementProgressFill, 
                    { 
                      backgroundColor: colors.primary[500],
                      width: `${(unlockedCount / totalCount) * 100}%`
                    }
                  ]} 
                />
              </View>
              <Text style={[styles.achievementProgressText, { color: colors.primary[600] }]}>
                {Math.round((unlockedCount / totalCount) * 100)}% Complete
              </Text>
            </View>
          </View>
          <View style={[styles.achievementBadgeContainer, { backgroundColor: colors.primary[50] }]}>
            <Ionicons name="trophy" size={20} color={colors.primary[600]} />
            <Text style={[styles.achievementBadgeCount, { color: colors.primary[600] }]}>
              {unlockedCount}
            </Text>
          </View>
        </View>

        {/* Achievement Categories */}
        {Object.entries(achievementsByCategory).map(([category, categoryAchievements]) => (
          <View key={category} style={[styles.achievementCategory, { backgroundColor: colors.neutral[0] }]}>
            <Text style={[styles.achievementCategoryTitle, { color: colors.neutral[900] }]}>
              {getCategoryTitle(category)}
            </Text>
            <View style={styles.achievementGrid}>
              {categoryAchievements.map((achievement) => (
                <View 
                  key={achievement.id} 
                  style={[
                    styles.achievementCard, 
                    { 
                      backgroundColor: achievement.unlocked ? getRarityBg(achievement.rarity) : colors.neutral[50],
                      borderColor: achievement.unlocked ? getRarityColor(achievement.rarity) : colors.neutral[200],
                      opacity: achievement.unlocked ? 1 : 0.6
                    }
                  ]}
                >
                  {/* Rarity badge at top right */}
                  <View style={[styles.achievementRarity, { backgroundColor: getRarityColor(achievement.rarity) }]}>
                    <Text style={styles.achievementRarityText}>
                      {achievement.rarity.toUpperCase()}
                    </Text>
                  </View>

                  {/* Main content */}
                  <View style={styles.achievementMainContent}>
                    <Text style={[
                      styles.achievementIcon,
                      { opacity: achievement.unlocked ? 1 : 0.5 }
                    ]}>
                      {achievement.icon}
                    </Text>
                    
                    <Text style={[
                      styles.achievementTitle, 
                      { color: achievement.unlocked ? colors.neutral[900] : colors.neutral[500] }
                    ]}>
                      {achievement.title}
                    </Text>
                    
                    <Text style={[
                      styles.achievementDescription, 
                      { color: achievement.unlocked ? colors.neutral[600] : colors.neutral[400] }
                    ]}>
                      {achievement.description}
                    </Text>

                    {/* Progress bar for locked achievements */}
                    {!achievement.unlocked && (
                      <View style={styles.achievementProgressSection}>
                        <View style={[styles.achievementProgressBar, { backgroundColor: colors.neutral[200], height: 6 }]}>
                          <View 
                            style={[
                              styles.achievementProgressFill, 
                              { 
                                backgroundColor: colors.primary[500],
                                width: `${Math.min(100, (achievement.progress / achievement.requirement) * 100)}%`,
                                height: 6
                              }
                            ]} 
                          />
                        </View>
                        <Text style={[styles.achievementProgressLabel, { color: colors.neutral[500] }]}>
                          {achievement.progress} / {achievement.requirement} {achievement.unit}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Success badge at bottom for unlocked achievements */}
                  {achievement.unlocked && (
                    <View style={[styles.achievementSuccessBadge, { backgroundColor: getRarityColor(achievement.rarity) }]}>
                      <Text style={styles.achievementBadgeText}>✓</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.neutral[50] }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.neutral[50]} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Ionicons name="analytics" size={24} color={colors.primary[600]} style={{ marginRight: 8 }} />
          <Text style={[styles.headerTitle, { color: colors.neutral[900] }]}>
            Progress Analytics
          </Text>
        </View>
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
        {selectedTab === 'achievements' && renderAchievements()}
        
        {/* Bottom Spacing - Account for tab bar */}
        <View style={{ height: Platform.OS === 'ios' ? 100 : 88 }} />
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
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
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
    gap: 24,
  },
  overviewLeft: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 20,
  },
  overviewRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    gap: 32,
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
    minWidth: 80,
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
  quickStatIcon: {
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
    padding: 24,
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
    marginBottom: 48,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 100,
    gap: 20,
    marginBottom: 16,
    marginTop: 16,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  chartBarFill: {
    width: '100%',
    minHeight: 10,
    borderRadius: 4,
    marginBottom: 8,
  },
  chartLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  chartValue: {
    fontSize: 14,
    fontWeight: '600',
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
  progressSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  progressSummaryItem: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  progressSummaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  progressSummaryValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  chartBarTarget: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderStyle: 'solid',
  },
  achievementSummary: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  achievementSummaryContent: {
    flex: 1,
    marginRight: 20,
  },
  achievementSummaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  achievementSummaryText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  achievementProgressContainer: {
    alignItems: 'center',
    gap: 12,
  },
  achievementProgressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    flex: 1,
  },
  achievementProgressFill: {
    height: 8,
    borderRadius: 4,
  },
  achievementProgressText: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 80,
    textAlign: 'right',
  },
  achievementBadgeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#EBF4FF',
  },
  achievementBadgeIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  achievementBadgeCount: {
    fontSize: 16,
    fontWeight: '700',
  },
  achievementCategory: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  achievementCategoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  achievementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  achievementCard: {
    width: (width - 64) / 2 - 6, // Daha dar yapıyoruz
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    marginBottom: 10,
  },
  achievementRarity: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  achievementRarityText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  achievementMainContent: {
    flex: 1,
  },
  achievementIcon: {
    fontSize: 28,
  },
  achievementTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 3,
    textAlign: 'center',
  },
  achievementDescription: {
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  achievementProgressSection: {
    width: '100%',
    alignItems: 'center',
    marginTop: 6,
  },
  achievementProgressLabel: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
  },
  achievementSuccessBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  achievementBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#FFFFFF',
  },
}); 