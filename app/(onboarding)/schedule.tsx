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
  View,
} from 'react-native';

import { useTheme } from '@/themes';

const { width } = Dimensions.get('window');
const isIOS = Platform.OS === 'ios';

const daysOfWeek = [
  { id: 'monday', name: 'Monday', short: 'Mon' },
  { id: 'tuesday', name: 'Tuesday', short: 'Tue' },
  { id: 'wednesday', name: 'Wednesday', short: 'Wed' },
  { id: 'thursday', name: 'Thursday', short: 'Thu' },
  { id: 'friday', name: 'Friday', short: 'Fri' },
  { id: 'saturday', name: 'Saturday', short: 'Sat' },
  { id: 'sunday', name: 'Sunday', short: 'Sun' },
];

const timeSlots = [
  { id: 'early_morning', label: 'Early Morning', time: '6:00 - 9:00 AM', icon: '🌅' },
  { id: 'morning', label: 'Morning', time: '9:00 AM - 12:00 PM', icon: '☀️' },
  { id: 'afternoon', label: 'Afternoon', time: '12:00 - 5:00 PM', icon: '🌤️' },
  { id: 'evening', label: 'Evening', time: '5:00 - 9:00 PM', icon: '🌇' },
  { id: 'night', label: 'Night', time: '9:00 PM - 12:00 AM', icon: '🌙' },
];

interface ScheduleSelection {
  [day: string]: string[];
}

export default function ScheduleScreen() {
  const { colors } = useTheme();
  const [showIntro, setShowIntro] = useState(true);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleSelection>({});
  const [selectedDay, setSelectedDay] = useState('monday');

  const handleTimeSlotToggle = (day: string, timeSlotId: string) => {
    setSelectedSchedule(prev => {
      const daySchedule = prev[day] || [];
      const isSelected = daySchedule.includes(timeSlotId);
      
      if (isSelected) {
        return {
          ...prev,
          [day]: daySchedule.filter(slot => slot !== timeSlotId)
        };
      } else {
        return {
          ...prev,
          [day]: [...daySchedule, timeSlotId]
        };
      }
    });
  };

  const getTotalHours = () => {
    let totalSlots = 0;
    Object.values(selectedSchedule).forEach(daySlots => {
      totalSlots += daySlots.length;
    });
    return totalSlots * 3; // Each slot is 3 hours
  };

  const getSelectedDaysCount = () => {
    return Object.values(selectedSchedule).filter(daySlots => daySlots.length > 0).length;
  };

  const handleContinue = () => {
    // Navigate to next onboarding step (goals page)
    router.push('/(onboarding)/goals');
  };

  const handleBack = () => {
    router.back();
  };

  if (showIntro) {
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
              Schedule Setup
            </Text>
          </View>
          
          <View style={styles.headerRight} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Text style={styles.mainIcon}>📅</Text>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.neutral[900] }]}>
            When Are You{'\n'}Available to Study?
          </Text>

          {/* Description */}
          <Text style={[styles.description, { color: colors.neutral[600] }]}>
            Help us create the perfect study schedule by selecting your available time slots throughout the week. We'll optimize your learning plan around these times.
          </Text>

          {/* Features */}
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: colors.primary[50] }]}>
                <Text style={styles.featureEmoji}>🎯</Text>
              </View>
              <View style={styles.featureContent}>
                <Text style={[styles.featureTitle, { color: colors.neutral[800] }]}>
                  Smart Scheduling
                </Text>
                <Text style={[styles.featureDesc, { color: colors.neutral[600] }]}>
                  AI-powered schedule optimization
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: colors.success[50] }]}>
                <Text style={styles.featureEmoji}>⏰</Text>
              </View>
              <View style={styles.featureContent}>
                <Text style={[styles.featureTitle, { color: colors.neutral[800] }]}>
                  Flexible Timing
                </Text>
                <Text style={[styles.featureDesc, { color: colors.neutral[600] }]}>
                  Adapt to your lifestyle and commitments
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: colors.warning[50] }]}>
                <Text style={styles.featureEmoji}>📊</Text>
              </View>
              <View style={styles.featureContent}>
                <Text style={[styles.featureTitle, { color: colors.neutral[800] }]}>
                  Progress Tracking
                </Text>
                <Text style={[styles.featureDesc, { color: colors.neutral[600] }]}>
                  Monitor your study consistency
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
                  Never miss a study session
                </Text>
              </View>
            </View>
          </View>

          {/* Info Box */}
          <View style={[styles.infoBox, { backgroundColor: colors.warning[50], borderColor: colors.warning[200] }]}>
            <Text style={[styles.infoText, { color: colors.warning[700] }]}>
              💡 You can always adjust your schedule later in the settings
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
            <Text style={styles.continueButtonText}>Set My Schedule</Text>
          </TouchableOpacity>
        </View>

        {/* Background Gradient */}
        <LinearGradient
          colors={[
            'rgba(251, 146, 60, 0.02)',
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
            Schedule Setup
          </Text>
          <View style={styles.progressInfo}>
            <Text style={[styles.progressText, { color: colors.success[600] }]}>
              {getSelectedDaysCount()}/7 days
            </Text>
          </View>
        </View>
        
        <View style={styles.headerRight} />
      </View>

      {/* Day Selection */}
      <View style={styles.daySelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysContainer}>
          {daysOfWeek.map((day) => {
            const isSelected = selectedDay === day.id;
            const hasSchedule = selectedSchedule[day.id]?.length > 0;
            
            return (
              <TouchableOpacity
                key={day.id}
                style={[
                  styles.dayButton,
                  {
                    backgroundColor: isSelected 
                      ? colors.primary[500] 
                      : hasSchedule 
                        ? colors.success[50]
                        : colors.neutral[0],
                    borderColor: isSelected 
                      ? colors.primary[500] 
                      : hasSchedule 
                        ? colors.success[200]
                        : colors.neutral[200],
                  }
                ]}
                onPress={() => setSelectedDay(day.id)}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.dayButtonText,
                  {
                    color: isSelected 
                      ? '#FFFFFF' 
                      : hasSchedule 
                        ? colors.success[700]
                        : colors.neutral[600],
                    fontWeight: isSelected || hasSchedule ? '700' : '600'
                  }
                ]}>
                  {day.short}
                </Text>
                {hasSchedule && !isSelected && (
                  <View style={[styles.scheduleDot, { backgroundColor: colors.success[500] }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Time Slots */}
      <ScrollView style={styles.timeSlotsContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.selectedDayHeader}>
          <Text style={[styles.selectedDayTitle, { color: colors.neutral[900] }]}>
            {daysOfWeek.find(d => d.id === selectedDay)?.name}
          </Text>
          <Text style={[styles.selectedDaySubtitle, { color: colors.neutral[600] }]}>
            Select your available time slots
          </Text>
        </View>

        <View style={styles.timeSlotsGrid}>
          {timeSlots.map((slot) => {
            const isSelected = selectedSchedule[selectedDay]?.includes(slot.id);
            
            return (
              <TouchableOpacity
                key={slot.id}
                style={[
                  styles.timeSlotCard,
                  {
                    backgroundColor: isSelected ? colors.primary[500] : colors.neutral[0],
                    borderColor: isSelected ? colors.primary[500] : colors.neutral[200],
                  }
                ]}
                onPress={() => handleTimeSlotToggle(selectedDay, slot.id)}
                activeOpacity={0.8}
              >
                <View style={styles.timeSlotContent}>
                  <Text style={styles.timeSlotIcon}>{slot.icon}</Text>
                  <View style={styles.timeSlotInfo}>
                    <Text style={[
                      styles.timeSlotLabel,
                      { color: isSelected ? '#FFFFFF' : colors.neutral[800] }
                    ]}>
                      {slot.label}
                    </Text>
                    <Text style={[
                      styles.timeSlotTime,
                      { color: isSelected ? 'rgba(255,255,255,0.9)' : colors.neutral[600] }
                    ]}>
                      {slot.time}
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

        {/* Stats Summary */}
        <View style={styles.statsSection}>
          <Text style={[styles.statsTitle, { color: colors.neutral[800] }]}>
            Weekly Summary
          </Text>
          
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.primary[50], borderColor: colors.primary[200] }]}>
              <Text style={[styles.statValue, { color: colors.primary[600] }]}>
                {getTotalHours()}h
              </Text>
              <Text style={[styles.statLabel, { color: colors.primary[700] }]}>
                Total Hours
              </Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: colors.success[50], borderColor: colors.success[200] }]}>
              <Text style={[styles.statValue, { color: colors.success[600] }]}>
                {getSelectedDaysCount()}
              </Text>
              <Text style={[styles.statLabel, { color: colors.success[700] }]}>
                Active Days
              </Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: colors.warning[50], borderColor: colors.warning[200] }]}>
              <Text style={[styles.statValue, { color: colors.warning[600] }]}>
                {getTotalHours() > 0 ? Math.round(getTotalHours() / 7) : 0}h
              </Text>
              <Text style={[styles.statLabel, { color: colors.warning[700] }]}>
                Daily Average
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={[
            styles.continueButton, 
            { 
              backgroundColor: getTotalHours() > 0 ? colors.primary[500] : colors.neutral[300],
              opacity: getTotalHours() > 0 ? 1 : 0.6
            }
          ]}
          onPress={handleContinue}
          disabled={getTotalHours() === 0}
          activeOpacity={0.9}
        >
          <Text style={[
            styles.continueButtonText,
            { color: getTotalHours() > 0 ? '#FFFFFF' : colors.neutral[500] }
          ]}>
            Continue to Goals ({getTotalHours()}h/week)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Background Gradient */}
      <LinearGradient
        colors={[
          'rgba(251, 146, 60, 0.02)',
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
  daySelector: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  daysContainer: {
    gap: 8,
    paddingHorizontal: 4,
  },
  dayButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    minWidth: 50,
    alignItems: 'center',
    position: 'relative',
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scheduleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    top: 6,
    right: 6,
  },
  timeSlotsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  selectedDayHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedDayTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  selectedDaySubtitle: {
    fontSize: 13,
  },
  timeSlotsGrid: {
    gap: 8,
    marginBottom: 32,
  },
  timeSlotCard: {
    borderRadius: 12,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 3,
  },
  timeSlotContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    position: 'relative',
  },
  timeSlotIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  timeSlotInfo: {
    flex: 1,
  },
  timeSlotLabel: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 1,
  },
  timeSlotTime: {
    fontSize: 13,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
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
  statsSection: {
    marginBottom: 12,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  bottomSection: {
    paddingHorizontal: 16,
    paddingBottom: isIOS ? 30 : 16,
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
}); 