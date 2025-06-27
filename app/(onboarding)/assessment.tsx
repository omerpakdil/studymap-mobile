import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Dimensions,
  FlatList,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Button } from '@/components';
import { useTheme } from '@/themes';

const { width } = Dimensions.get('window');
const isIOS = Platform.OS === 'ios';

// Exam types data
const examTypes = [
  {
    id: 'sat',
    name: 'SAT',
    fullName: 'Scholastic Assessment Test',
    description: 'College admission test for US universities',
    duration: '3 hours',
    subjects: ['Math', 'Reading', 'Writing'],
    icon: '🎓',
    color: '#3B82F6',
    popular: true,
  },
  {
    id: 'gre',
    name: 'GRE',
    fullName: 'Graduate Record Examination',
    description: 'Graduate school admission test',
    duration: '3 hours 45 min',
    subjects: ['Verbal', 'Quantitative', 'Analytical Writing'],
    icon: '📚',
    color: '#8B5CF6',
    popular: true,
  },
  {
    id: 'toefl',
    name: 'TOEFL',
    fullName: 'Test of English as a Foreign Language',
    description: 'English proficiency test for non-native speakers',
    duration: '3 hours',
    subjects: ['Reading', 'Listening', 'Speaking', 'Writing'],
    icon: '🌍',
    color: '#10B981',
    popular: true,
  },
  {
    id: 'ielts',
    name: 'IELTS',
    fullName: 'International English Language Testing System',
    description: 'English proficiency test for international students',
    duration: '2 hours 45 min',
    subjects: ['Listening', 'Reading', 'Writing', 'Speaking'],
    icon: '🗣️',
    color: '#F59E0B',
    popular: false,
  },
  {
    id: 'gmat',
    name: 'GMAT',
    fullName: 'Graduate Management Admission Test',
    description: 'MBA and graduate business program admission',
    duration: '3 hours 7 min',
    subjects: ['Verbal', 'Quantitative', 'Integrated Reasoning', 'AWA'],
    icon: '💼',
    color: '#EF4444',
    popular: false,
  },
  {
    id: 'lsat',
    name: 'LSAT',
    fullName: 'Law School Admission Test',
    description: 'Law school admission test',
    duration: '3 hours 35 min',
    subjects: ['Logical Reasoning', 'Reading Comprehension', 'Analytical Reasoning'],
    icon: '⚖️',
    color: '#6366F1',
    popular: false,
  },
];

export default function AssessmentScreen() {
  const { colors } = useTheme();
  const [selectedExam, setSelectedExam] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredExams = examTypes.filter(exam =>
    exam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exam.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const popularExams = filteredExams.filter(exam => exam.popular);
  const otherExams = filteredExams.filter(exam => !exam.popular);

  const handleExamSelect = (examId: string) => {
    setSelectedExam(examId);
  };

  const handleContinue = () => {
    if (selectedExam) {
             // Navigate to subject selection with selected exam
       router.push('/(onboarding)/subject-selection');
    }
  };

  const renderExamCard = ({ item }: { item: typeof examTypes[0] }) => {
    const isSelected = selectedExam === item.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.examCard,
          {
            borderColor: isSelected ? item.color : colors.neutral[200],
            backgroundColor: isSelected ? colors.neutral[0] : colors.neutral[0],
            borderWidth: isSelected ? 3 : 2,
            transform: isSelected ? [{ scale: 1.01 }] : [{ scale: 1 }],
            shadowColor: isSelected ? item.color : '#000',
            shadowOpacity: isSelected ? 0.25 : 0.1,
            shadowRadius: isSelected ? 12 : 4,
            elevation: isSelected ? 8 : 3,
          },
        ]}
        onPress={() => handleExamSelect(item.id)}
        activeOpacity={0.7}
      >
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
            <Text style={styles.iconText}>{item.icon}</Text>
          </View>
          <View style={styles.examInfo}>
                         <Text style={[styles.examName, { color: colors.neutral[900] }] as any}>
               {item.name}
             </Text>
             <Text style={[styles.examFullName, { color: colors.neutral[600] }] as any}>
               {item.fullName}
             </Text>
          </View>
          {item.popular && (
            <View style={[styles.popularBadge, { backgroundColor: colors.primary[500] }]}>
              <Text style={styles.popularText}>Popular</Text>
            </View>
          )}
        </View>

        {/* Card Content */}
        <Text style={[styles.examDescription, { color: colors.neutral[600] }]}>
          {item.description}
        </Text>

        {/* Duration */}
        <View style={styles.durationContainer}>
          <Text style={[styles.durationLabel, { color: colors.neutral[500] }]}>
            Duration:
          </Text>
          <Text style={[styles.durationValue, { color: colors.neutral[700] }]}>
            {item.duration}
          </Text>
        </View>

        {/* Subjects */}
        <View style={styles.subjectsContainer}>
          <Text style={[styles.subjectsLabel, { color: colors.neutral[500] }]}>
            Subjects:
          </Text>
          <View style={styles.subjectTags}>
            {item.subjects.slice(0, 3).map((subject, index) => (
              <View
                key={index}
                style={[
                  styles.subjectTag,
                  { backgroundColor: `${item.color}20` }
                ]}
              >
                <Text style={[styles.subjectText, { color: item.color }]}>
                  {subject}
                </Text>
              </View>
            ))}
            {item.subjects.length > 3 && (
              <Text style={[styles.moreSubjects, { color: colors.neutral[500] }]}>
                +{item.subjects.length - 3} more
              </Text>
            )}
          </View>
        </View>

        {/* Selection Indicator */}
        {isSelected && (
          <View style={[styles.selectionIndicator, { backgroundColor: item.color }]}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        )}
        
        {/* Premium Selection Glow */}
        {isSelected && (
          <View style={[styles.selectionGlow, { borderColor: item.color }]} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.neutral[0] }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.neutral[0]} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={[styles.backIcon, { color: colors.neutral[600] }]}>←</Text>
        </TouchableOpacity>
        
        <View style={styles.progressContainer}>
          <View style={[styles.progressTrack, { backgroundColor: colors.neutral[200] }]}>
            <View style={[styles.progressFill, { backgroundColor: colors.primary[500], width: '20%' }]} />
          </View>
          <Text style={[styles.progressText, { color: colors.neutral[500] }]}>
            Step 1 of 5
          </Text>
        </View>
      </View>

      {/* Content */}
             <ScrollView 
         style={styles.content} 
         showsVerticalScrollIndicator={false}
         contentContainerStyle={{ paddingBottom: 20 }}
       >
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={[styles.title, { color: colors.neutral[900] }]}>
            Choose Your Exam
          </Text>
          <Text style={[styles.subtitle, { color: colors.neutral[600] }]}>
            Select the exam you're preparing for to get a personalized study plan
          </Text>
        </View>

        {/* Popular Exams */}
        {popularExams.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.neutral[800] }]}>
              Popular Exams
            </Text>
                         <FlatList
               data={popularExams}
               renderItem={renderExamCard}
               keyExtractor={(item) => item.id}
               scrollEnabled={false}
               ItemSeparatorComponent={() => <View style={{ height: 20 }} />}
               contentContainerStyle={{ paddingVertical: 8 }}
             />
          </View>
        )}

        {/* Other Exams */}
        {otherExams.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.neutral[800] }]}>
              Other Exams
            </Text>
                         <FlatList
               data={otherExams}
               renderItem={renderExamCard}
               keyExtractor={(item) => item.id}
               scrollEnabled={false}
               ItemSeparatorComponent={() => <View style={{ height: 20 }} />}
               contentContainerStyle={{ paddingVertical: 8 }}
             />
          </View>
        )}
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomSection}>
                 <Button
           variant="primary"
           onPress={handleContinue}
           disabled={!selectedExam}
           style={styles.continueButton}
         >
          Continue to Subjects
        </Button>
      </View>

      {/* Background Gradient */}
      <LinearGradient
        colors={[
          'rgba(99, 102, 241, 0.03)',
          'transparent',
          'rgba(139, 92, 246, 0.03)',
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
    paddingHorizontal: 24,
    paddingTop: isIOS ? 8 : 16,
    paddingBottom: 16,
    position: 'relative',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    left: 24,
    zIndex: 1,
  },
  backIcon: {
    fontSize: 24,
    fontWeight: '600',
  },
  progressContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    width: 120,
    height: 4,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  titleSection: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  examCard: {
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 4,
    marginVertical: 4,
    position: 'relative',
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 24,
  },
  examInfo: {
    flex: 1,
  },
  examName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  examFullName: {
    fontSize: 14,
    fontWeight: '500',
  },
  popularBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  popularText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  examDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  durationLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
  },
  durationValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  subjectsContainer: {
    marginBottom: 8,
  },
  subjectsLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  subjectTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  subjectTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 4,
  },
  subjectText: {
    fontSize: 12,
    fontWeight: '600',
  },
  moreSubjects: {
    fontSize: 12,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  selectionIndicator: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  checkmark: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  selectionGlow: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 17,
    borderWidth: 1,
    opacity: 0.4,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: isIOS ? 34 : 20,
  },
  continueButton: {
    width: '100%',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
}); 