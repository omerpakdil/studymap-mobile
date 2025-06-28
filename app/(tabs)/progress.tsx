import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useState } from 'react';
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

import { useTheme } from '@/themes';

const { width } = Dimensions.get('window');
const isIOS = Platform.OS === 'ios';

// Mock user data for analytics
const mockUser = {
  name: 'Alex',
  targetExam: 'GRE',
  examDate: '2024-06-15',
  daysLeft: 85,
  overallProgress: 68,
  targetScore: 320,
  estimatedScore: 285,
  streakDays: 12,
  totalStudyHours: 89.5,
  weeklyGoal: 15, // hours
  completedThisWeek: 12.5,
};

// Subject performance data
const subjectPerformance = [
  {
    subject: 'Math',
    topics: [
      { name: 'Algebra', progress: 85, timeSpent: 28.5, difficulty: 'Medium', trend: 'up' },
      { name: 'Geometry', progress: 72, timeSpent: 18.2, difficulty: 'Hard', trend: 'stable' },
      { name: 'Statistics', progress: 91, timeSpent: 15.8, difficulty: 'Easy', trend: 'up' },
    ],
    overallScore: 82,
    improvement: '+12%',
    trending: 'up',
  },
  {
    subject: 'Verbal',
    topics: [
      { name: 'Reading Comprehension', progress: 78, timeSpent: 22.1, difficulty: 'Medium', trend: 'up' },
      { name: 'Vocabulary', progress: 65, timeSpent: 19.3, difficulty: 'Hard', trend: 'stable' },
      { name: 'Critical Reasoning', progress: 83, timeSpent: 16.7, difficulty: 'Medium', trend: 'up' },
    ],
    overallScore: 75,
    improvement: '+8%',
    trending: 'up',
  },
  {
    subject: 'Writing',
    topics: [
      { name: 'Essay Structure', progress: 68, timeSpent: 12.4, difficulty: 'Medium', trend: 'stable' },
      { name: 'Grammar & Style', progress: 73, timeSpent: 14.6, difficulty: 'Easy', trend: 'up' },
      { name: 'Critical Writing', progress: 61, timeSpent: 8.9, difficulty: 'Hard', trend: 'down' },
    ],
    overallScore: 67,
    improvement: '+3%',
    trending: 'stable',
  },
];

// Weekly study data
const weeklyStudyData = [
  { week: 'Week 1', hours: 8.5, target: 15 },
  { week: 'Week 2', hours: 12.2, target: 15 },
  { week: 'Week 3', hours: 14.8, target: 15 },
  { week: 'Week 4', hours: 11.3, target: 15 },
  { week: 'Week 5', hours: 15.2, target: 15 },
  { week: 'Week 6', hours: 12.5, target: 15 },
];

// Performance insights and recommendations
const insights = [
  {
    type: 'warning',
    icon: '⚠️',
    title: 'Focus Area Identified',
    message: 'Critical Writing shows declining trend. Consider additional practice.',
    action: 'Start Writing Workshop',
  },
  {
    type: 'success',
    icon: '🎯',
    title: 'Great Progress!',
    message: 'Statistics mastery improved by 23% this week.',
    action: 'View Achievement',
  },
  {
    type: 'info',
    icon: '📊',
    title: 'Study Pattern Insight',
    message: 'Your best performance occurs during morning sessions.',
    action: 'Optimize Schedule',
  },
  {
    type: 'tip',
    icon: '💡',
    title: 'Smart Suggestion',
    message: 'Review Algebra concepts before tomorrow\'s Geometry session.',
    action: 'Add to Plan',
  },
];

export default function ProgressScreen() {
  const { colors } = useTheme();
  const [selectedTab, setSelectedTab] = useState<'overview' | 'subjects' | 'insights'>('overview');
  const [taskCompletions, setTaskCompletions] = useState<Record<string, boolean>>({});

  // Load completion data
  const loadTaskCompletions = async () => {
    try {
      // This would be the same data structure as Dashboard
      const completions: Record<string, boolean> = {};
      // Mock some completed tasks for demo
      completions['1'] = true;
      completions['2'] = true;
      completions['3'] = false;
      completions['4'] = false;
      setTaskCompletions(completions);
    } catch (error) {
      console.log('Error loading task completions:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTaskCompletions();
    }, [])
  );

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      default: return '➖';
    }
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
            <Text style={styles.overviewTitle}>Exam Preparation Progress</Text>
            <Text style={styles.overviewPercentage}>{mockUser.overallProgress}%</Text>
            <Text style={styles.overviewSubtitle}>
              {mockUser.daysLeft} days until {mockUser.targetExam}
            </Text>
          </View>
        </LinearGradient>
      </View>

      {/* Key Metrics Grid */}
      <View style={styles.metricsGrid}>
        <View style={[styles.metricCard, { backgroundColor: colors.neutral[0] }]}>
          <Text style={styles.metricIcon}>🎯</Text>
          <Text style={[styles.metricValue, { color: colors.primary[700] }]}>
            {mockUser.estimatedScore}
          </Text>
          <Text style={[styles.metricLabel, { color: colors.neutral[600] }]}>
            Est. Score
          </Text>
          <Text style={[styles.metricTarget, { color: colors.neutral[500] }]}>
            Target: {mockUser.targetScore}
          </Text>
        </View>

        <View style={[styles.metricCard, { backgroundColor: colors.neutral[0] }]}>
          <Text style={styles.metricIcon}>⏱️</Text>
          <Text style={[styles.metricValue, { color: colors.success[700] }]}>
            {mockUser.totalStudyHours}h
          </Text>
          <Text style={[styles.metricLabel, { color: colors.neutral[600] }]}>
            Total Studied
          </Text>
          <Text style={[styles.metricTarget, { color: colors.neutral[500] }]}>
            This month
          </Text>
        </View>

        <View style={[styles.metricCard, { backgroundColor: colors.neutral[0] }]}>
          <Text style={styles.metricIcon}>🔥</Text>
          <Text style={[styles.metricValue, { color: colors.warning[700] }]}>
            {mockUser.streakDays}
          </Text>
          <Text style={[styles.metricLabel, { color: colors.neutral[600] }]}>
            Day Streak
          </Text>
          <Text style={[styles.metricTarget, { color: colors.neutral[500] }]}>
            Personal best
          </Text>
        </View>

        <View style={[styles.metricCard, { backgroundColor: colors.neutral[0] }]}>
          <Text style={styles.metricIcon}>📈</Text>
          <Text style={[styles.metricValue, { color: colors.primary[700] }]}>
            {mockUser.completedThisWeek}h
          </Text>
          <Text style={[styles.metricLabel, { color: colors.neutral[600] }]}>
            This Week
          </Text>
          <Text style={[styles.metricTarget, { color: colors.neutral[500] }]}>
            Goal: {mockUser.weeklyGoal}h
          </Text>
        </View>
      </View>

      {/* Weekly Progress Chart */}
      <View style={[styles.chartCard, { backgroundColor: colors.neutral[0] }]}>
        <Text style={[styles.chartTitle, { color: colors.neutral[900] }]}>
          Weekly Study Hours
        </Text>
        <View style={styles.chartContainer}>
          {weeklyStudyData.map((week, index) => {
            const heightPercentage = (week.hours / 20) * 100; // Max 20 hours for scaling
            const isTarget = week.hours >= week.target;
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
                  W{index + 1}
                </Text>
                <Text style={[styles.chartValue, { color: colors.neutral[700] }]}>
                  {week.hours}h
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
      {subjectPerformance.map((subject, index) => (
        <View key={index} style={[styles.subjectCard, { backgroundColor: colors.neutral[0] }]}>
          <View style={styles.subjectHeader}>
            <View>
              <Text style={[styles.subjectName, { color: colors.neutral[900] }]}>
                {subject.subject}
              </Text>
              <Text style={[styles.subjectScore, { color: colors.neutral[600] }]}>
                {subject.overallScore}% average {getTrendIcon(subject.trending)} {subject.improvement}
              </Text>
            </View>
            <View style={[styles.subjectBadge, { backgroundColor: colors.primary[100] }]}>
              <Text style={[styles.subjectBadgeText, { color: colors.primary[700] }]}>
                {subject.trending === 'up' ? 'Improving' : subject.trending === 'down' ? 'Needs Focus' : 'Stable'}
              </Text>
            </View>
          </View>

          {/* Topic breakdown */}
          <View style={styles.topicsContainer}>
            {subject.topics.map((topic, topicIndex) => (
              <View key={topicIndex} style={styles.topicRow}>
                <View style={styles.topicInfo}>
                  <Text style={[styles.topicName, { color: colors.neutral[800] }]}>
                    {topic.name}
                  </Text>
                  <Text style={[styles.topicStats, { color: colors.neutral[500] }]}>
                    {topic.timeSpent}h • {topic.difficulty}
                  </Text>
                </View>
                <View style={styles.topicProgress}>
                  <Text style={[styles.topicPercentage, { color: colors.neutral[700] }]}>
                    {topic.progress}%
                  </Text>
                  <Text style={styles.topicTrend}>
                    {getTrendIcon(topic.trend)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );

  const renderInsights = () => (
    <View style={styles.tabContent}>
      {insights.map((insight, index) => (
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
  overviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    opacity: 0.9,
  },
  overviewPercentage: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  overviewSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  
  // Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
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
  metricIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  metricTarget: {
    fontSize: 12,
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
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
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
}); 