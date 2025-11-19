import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Dimensions,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { availableExams } from '@/app/data';
import { saveExamData } from '@/app/utils/onboardingData';
import { useTheme } from '@/themes';

const { width } = Dimensions.get('window');
const isIOS = Platform.OS === 'ios';

// Exam gradients for visual appeal
const examGradients: { [key: string]: string[] } = {
  'sat': ['#3B82F6', '#1E40AF'],
  'gre': ['#8B5CF6', '#7C3AED'],
  'toefl': ['#10B981', '#059669'],
  'ielts': ['#F59E0B', '#D97706'],
  'gmat': ['#EF4444', '#DC2626'],
  'lsat': ['#06B6D4', '#0891B2']
};

// Exam icons - Modern Ionicons
const examIcons: { [key: string]: keyof typeof Ionicons.glyphMap } = {
  'sat': 'school',              // SAT - College admissions
  'gre': 'library',             // GRE - Graduate school
  'toefl': 'globe',             // TOEFL - International English
  'ielts': 'chatbubbles',       // IELTS - English communication
  'gmat': 'briefcase',          // GMAT - Business school
  'lsat': 'scale'               // LSAT - Law school
};

export default function ExamSelectionScreen() {
  const { colors } = useTheme();
  const [loadingExamId, setLoadingExamId] = useState<string | null>(null);

  const getExamDescription = (examId: string): string => {
    const descriptions: { [key: string]: string } = {
      'sat': 'College Admissions',
      'gre': 'Graduate School',
      'toefl': 'English Proficiency',
      'ielts': 'English Testing',
      'gmat': 'Business School',
      'lsat': 'Law School'
    };
    return descriptions[examId] || 'Test Prep';
  };

  const handleExamSelection = async (exam: any) => {
    try {
      setLoadingExamId(exam.id);
      await saveExamData(exam);
      console.log('✅ Exam data saved:', exam);
      router.push('/(onboarding)/assessment');
    } catch (error) {
      console.error('❌ Error saving exam data:', error);
    } finally {
      setLoadingExamId(null);
    }
  };

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
            Choose Your Exam
          </Text>
        </View>
        
        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={[styles.title, { color: colors.neutral[900] }]}>
            Choose Your Exam
          </Text>
          <Text style={[styles.subtitle, { color: colors.neutral[600] }]}>
            Select your target exam to get a personalized study plan
          </Text>
        </View>

        <View style={styles.examGrid}>
          {availableExams.map((exam: any, index: number) => {
            const gradient = examGradients[exam.id] || ['#6B7280', '#4B5563'];
            const icon = examIcons[exam.id] || 'book';
            const isLoading = loadingExamId === exam.id;

            return (
              <TouchableOpacity
                key={exam.id}
                style={[
                  styles.examCard,
                  { opacity: isLoading ? 0.6 : 1 }
                ]}
                onPress={() => handleExamSelection(exam)}
                activeOpacity={0.8}
                disabled={loadingExamId !== null}
              >
                <LinearGradient
                  colors={gradient as any}
                  style={styles.examCardGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.examCardContent}>
                    <View style={styles.iconContainer}>
                      <Ionicons name={icon} size={40} color="#FFFFFF" />
                    </View>
                    <Text style={styles.examName}>{exam.name}</Text>
                    <Text style={styles.examDescription}>
                      {getExamDescription(exam.id)}
                    </Text>
                  </View>
                </LinearGradient>

                {/* Loading overlay */}
                {isLoading && (
                  <View style={styles.loadingOverlay}>
                    <Text style={styles.loadingText}>●●●</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Background Gradient */}
      <LinearGradient
        colors={[colors.neutral[50], colors.neutral[100]]}
        style={styles.backgroundGradient}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
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
  examGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  examCard: {
    width: (width - 64) / 2, // 2 columns with padding and gap
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  examCardGradient: {
    padding: 20,
    minHeight: 140,
    justifyContent: 'center',
  },
  examCardContent: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  examName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  examDescription: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 16,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  loadingText: {
    color: '#FFFFFF',
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
});
