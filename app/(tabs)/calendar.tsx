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

import { StudyTask } from '@/app/utils/claudeStudyGenerator';
import { loadDailyTasks } from '@/app/utils/studyProgramStorage';
import { useTheme } from '@/themes';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const isIOS = Platform.OS === 'ios';

// Calendar view types
type CalendarView = 'month' | 'week' | 'day';

// Calendar data type
type CalendarData = {
  [key: string]: StudyTask[];
};

const subjectColors = {
  Math: { bg: '#EFF6FF', border: '#3B82F6', text: '#1E40AF' },
  Mathematics: { bg: '#EFF6FF', border: '#3B82F6', text: '#1E40AF' },
  Verbal: { bg: '#F0FDF4', border: '#10B981', text: '#047857' },
  English: { bg: '#F0FDF4', border: '#10B981', text: '#047857' },
  Writing: { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E' },
  Science: { bg: '#F3E8FF', border: '#8B5CF6', text: '#6D28D9' },
  Physics: { bg: '#F3E8FF', border: '#8B5CF6', text: '#6D28D9' },
  Chemistry: { bg: '#FDF2F8', border: '#EC4899', text: '#BE185D' },
  Biology: { bg: '#ECFDF5', border: '#059669', text: '#065F46' },
  History: { bg: '#FEF7ED', border: '#D97706', text: '#92400E' },
  Default: { bg: '#F1F5F9', border: '#64748B', text: '#475569' },
};

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Time slot formatting utility
const formatTimeSlot = (timeSlot: string, compact: boolean = false) => {
  const timeSlotMap: Record<string, { label: string; time: string; shortLabel: string }> = {
    'early_morning': { label: 'Early Morning', time: '6:00 - 9:00 AM', shortLabel: 'Early Morning' },
    'morning': { label: 'Morning', time: '9:00 AM - 12:00 PM', shortLabel: 'Morning' },
    'afternoon': { label: 'Afternoon', time: '12:00 - 5:00 PM', shortLabel: 'Afternoon' },
    'evening': { label: 'Evening', time: '5:00 - 9:00 PM', shortLabel: 'Evening' },
    'night': { label: 'Night', time: '9:00 PM - 12:00 AM', shortLabel: 'Night' },
  };
  
  const slot = timeSlotMap[timeSlot];
  if (slot) {
    if (compact) {
      return slot.shortLabel;
    }
    return `${slot.label}\n${slot.time}`;
  }
  
  return timeSlot || 'No time set';
};

export default function CalendarScreen() {
  const { colors } = useTheme();
  const [currentView, setCurrentView] = useState<CalendarView>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<CalendarData>({});
  const [loading, setLoading] = useState(true);

  // Load calendar data from Claude-generated tasks
  const loadCalendarData = async () => {
    try {
      setLoading(true);
      const allTasks = await loadDailyTasks();
      
      // Group tasks by date
      const tasksByDate: CalendarData = {};
      allTasks.forEach((task: StudyTask) => {
        if (!tasksByDate[task.date]) {
          tasksByDate[task.date] = [];
        }
        tasksByDate[task.date].push(task);
      });
      
      setCalendarData(tasksByDate);
      console.log('📅 Calendar data loaded:', {
        totalDays: Object.keys(tasksByDate).length,
        totalTasks: allTasks.length
      });
      
    } catch (error) {
      console.error('❌ Error loading calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalendarData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCalendarData();
    }, [])
  );

  // Helper functions
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDate = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startDate; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getWeekDays = (date: Date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(date.getDate() - day);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const weekDay = new Date(startOfWeek);
      weekDay.setDate(startOfWeek.getDate() + i);
      days.push(weekDay);
    }
    
    return days;
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    
    if (currentView === 'month') {
      newDate.setMonth(selectedDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (currentView === 'week') {
      newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 1 : -1));
    }
    
    setSelectedDate(newDate);
  };

  const getDateTasks = (date: Date) => {
    return calendarData[formatDate(date)] || [];
  };

  const getDateProgress = (date: Date) => {
    const tasks = getDateTasks(date);
    if (tasks.length === 0) return 0;
    const completed = tasks.filter((task: StudyTask) => task.completed).length;
    return (completed / tasks.length) * 100;
  };

  const getSubjectColor = (subject: string) => {
    return subjectColors[subject as keyof typeof subjectColors] || subjectColors.Default;
  };

  const renderViewToggle = () => (
    <View style={[styles.viewToggle, { backgroundColor: colors.neutral[100] }]}>
      {(['month', 'week', 'day'] as CalendarView[]).map((view) => (
        <TouchableOpacity
          key={view}
          style={[
            styles.viewToggleButton,
            currentView === view && { backgroundColor: colors.primary[500] }
          ]}
          onPress={() => setCurrentView(view)}
        >
          <Text style={[
            styles.viewToggleText,
            { color: currentView === view ? '#FFFFFF' : colors.neutral[600] }
          ]}>
            {view.charAt(0).toUpperCase() + view.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderHeader = () => {
    let headerText = '';
    
    if (currentView === 'month') {
      headerText = `${monthNames[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
    } else if (currentView === 'week') {
      const weekDays = getWeekDays(selectedDate);
      const startDay = weekDays[0];
      const endDay = weekDays[6];
      headerText = `${startDay.getDate()} - ${endDay.getDate()} ${monthNames[selectedDate.getMonth()]}`;
    } else {
      headerText = `${selectedDate.getDate()} ${monthNames[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
    }

    return (
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.navButton, { backgroundColor: colors.neutral[100] }]}
          onPress={() => navigateDate('prev')}
        >
          <Text style={[styles.navButtonText, { color: colors.neutral[700] }]}>←</Text>
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: colors.neutral[900] }]}>
          {headerText}
        </Text>
        
        <TouchableOpacity
          style={[styles.navButton, { backgroundColor: colors.neutral[100] }]}
          onPress={() => navigateDate('next')}
        >
          <Text style={[styles.navButtonText, { color: colors.neutral[700] }]}>→</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderMonthView = () => {
    const days = getDaysInMonth(selectedDate);

    return (
      <View style={styles.monthContainer}>
        {/* Day headers */}
        <View style={styles.dayHeaders}>
          {dayNames.map((dayName) => (
            <Text key={dayName} style={[styles.dayHeader, { color: colors.neutral[500] }]}>
              {dayName}
            </Text>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={styles.calendarGrid}>
          {days.map((day, index) => {
            if (!day) {
              return <View key={index} style={styles.emptyDay} />;
            }

            const isToday = formatDate(day) === formatDate(new Date());
            const isSelected = formatDate(day) === formatDate(selectedDate);
            const tasks = getDateTasks(day);
            const progress = getDateProgress(day);

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayCell,
                  isToday && { backgroundColor: colors.primary[50] },
                  isSelected && { backgroundColor: colors.primary[100] },
                  tasks.length > 0 && { borderWidth: 1, borderColor: colors.primary[200] },
                ]}
                onPress={() => {
                  setSelectedDate(day);
                  // If the day has tasks, switch to day view to show details
                  if (tasks.length > 0) {
                    setCurrentView('day');
                  }
                }}
              >
                <Text style={[
                  styles.dayNumber,
                  { color: isToday ? colors.primary[600] : colors.neutral[800] },
                  isSelected && { fontWeight: '700' },
                  tasks.length > 0 && { fontWeight: '600' }
                ]}>
                  {day.getDate()}
                </Text>
                
                {tasks.length > 0 && (
                  <View style={styles.dayIndicators}>
                    {/* Progress indicator */}
                    <View style={[styles.progressIndicator, { backgroundColor: colors.neutral[200] }]}>
                      <View style={[
                        styles.progressFill,
                        { 
                          backgroundColor: progress === 100 ? colors.success[500] : colors.primary[500],
                          width: `${progress}%`
                        }
                      ]} />
                    </View>
                    
                    {/* Subject dots */}
                    <View style={styles.subjectDots}>
                      {[...new Set(tasks.map((task: StudyTask) => task.subject))].slice(0, 3).map((subject, idx) => (
                        <View
                          key={idx}
                          style={[
                            styles.subjectDot,
                            { backgroundColor: subjectColors[subject as keyof typeof subjectColors]?.border }
                          ]}
                        />
                      ))}
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderWeekView = () => {
    const weekDays = getWeekDays(selectedDate);

    return (
      <View style={styles.weekContainer}>
        <View style={styles.weekHeader}>
          {weekDays.map((day, index) => {
            const isToday = formatDate(day) === formatDate(new Date());
            const isSelected = formatDate(day) === formatDate(selectedDate);
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.weekDayHeader,
                  isSelected && { backgroundColor: colors.primary[500] }
                ]}
                onPress={() => setSelectedDate(day)}
              >
                <Text style={[
                  styles.weekDayName,
                  { color: isSelected ? '#FFFFFF' : colors.neutral[500] }
                ]}>
                  {dayNames[day.getDay()]}
                </Text>
                <Text style={[
                  styles.weekDayNumber,
                  { color: isToday ? colors.primary[600] : isSelected ? '#FFFFFF' : colors.neutral[800] },
                  isToday && !isSelected && { fontWeight: '700' }
                ]}>
                  {day.getDate()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <ScrollView style={styles.weekTasksContainer}>
          {weekDays.map((day, dayIndex) => {
            const tasks = getDateTasks(day);
            if (tasks.length === 0) return null;

            return (
              <View key={dayIndex} style={styles.weekDayTasks}>
                <Text style={[styles.weekDayTitle, { color: colors.neutral[800] }]}>
                  {dayNames[day.getDay()]}, {day.getDate()}
                </Text>
                {tasks.map((task: StudyTask, taskIndex: number) => (
                  <View
                    key={taskIndex}
                    style={[
                      styles.weekTaskCard,
                      {
                        backgroundColor: subjectColors[task.subject as keyof typeof subjectColors]?.bg,
                        borderLeftColor: subjectColors[task.subject as keyof typeof subjectColors]?.border,
                      }
                    ]}
                  >
                    <View style={styles.weekTaskContent}>
                      <Text style={[
                        styles.weekTaskSubject,
                        { color: subjectColors[task.subject as keyof typeof subjectColors]?.text }
                      ]}>
                        {task.subject}
                      </Text>
                      <Text style={[styles.weekTaskTopic, { color: colors.neutral[600] }]}>
                        {task.topic}
                      </Text>
                    </View>
                    <View style={styles.weekTaskInfo}>
                      <Text style={[styles.weekTaskTime, { color: colors.neutral[500] }]}>
                        {formatTimeSlot(task.timeSlot || '', true)}
                      </Text>
                      <Text style={[styles.weekTaskDuration, { color: colors.neutral[500] }]}>
                        {task.duration}m
                      </Text>
                      {task.completed && (
                        <Text style={styles.weekTaskCompleted}>✓</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderDayView = () => {
    const tasks = getDateTasks(selectedDate);

    return (
      <ScrollView style={styles.dayContainer}>
        {tasks.length === 0 ? (
          <View style={styles.emptyDayContainer}>
            <Text style={[styles.emptyDayText, { color: colors.neutral[500] }]}>
              📅 No study sessions planned for this day
            </Text>
          </View>
        ) : (
          <View style={styles.dayTasksList}>
            {tasks.map((task: StudyTask, index: number) => (
              <View
                key={index}
                style={[
                  styles.dayTaskCard,
                  {
                    backgroundColor: colors.neutral[0],
                    borderLeftColor: subjectColors[task.subject as keyof typeof subjectColors]?.border,
                  }
                ]}
              >
                <View style={styles.dayTaskTime}>
                  <Text style={[styles.dayTaskTimeText, { color: colors.neutral[600] }]}>
                    {formatTimeSlot(task.timeSlot || '', true)}
                  </Text>
                  <Text style={[styles.dayTaskDuration, { color: colors.neutral[500] }]}>
                    {task.duration} min
                  </Text>
                </View>
                
                <View style={styles.dayTaskContent}>
                  <View style={styles.dayTaskHeader}>
                    <Text style={[
                      styles.dayTaskSubject,
                      { color: subjectColors[task.subject as keyof typeof subjectColors]?.text }
                    ]}>
                      {task.subject}
                    </Text>
                    {task.completed && (
                      <View style={[styles.completedBadge, { backgroundColor: colors.success[500] }]}>
                        <Text style={styles.completedBadgeText}>✓</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.dayTaskTopic, { color: colors.neutral[600] }]}>
                    {task.topic}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.neutral[50] }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.neutral[50]} />
      
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Text style={[styles.screenTitle, { color: colors.neutral[900] }]}>
          Study Calendar
        </Text>
        {renderViewToggle()}
      </View>

      {/* Navigation Header */}
      {renderHeader()}

      {/* Calendar Content */}
      <View style={styles.calendarContent}>
        {currentView === 'month' && renderMonthView()}
        {currentView === 'week' && renderWeekView()}
        {currentView === 'day' && renderDayView()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: isIOS ? 8 : 16,
    paddingBottom: 16,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  viewToggle: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 2,
  },
  viewToggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  viewToggleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  calendarContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  // Month View
  monthContainer: {},
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    paddingVertical: 8,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyDay: {
    width: `${100/7}%`,
    height: 70,
  },
  dayCell: {
    width: `${100/7}%`,
    height: 70,
    padding: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  dayIndicators: {
    width: '100%',
    alignItems: 'center',
  },
  progressIndicator: {
    width: 20,
    height: 3,
    borderRadius: 1.5,
    marginBottom: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: 3,
    borderRadius: 1.5,
  },
  subjectDots: {
    flexDirection: 'row',
    gap: 2,
  },
  subjectDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },

  // Week View
  weekContainer: {
    flex: 1,
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  weekDayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  weekDayName: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  weekDayNumber: {
    fontSize: 16,
    fontWeight: '600',
  },
  weekTasksContainer: {
    flex: 1,
  },
  weekDayTasks: {
    marginBottom: 20,
  },
  weekDayTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  weekTaskCard: {
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weekTaskContent: {
    flex: 1,
  },
  weekTaskSubject: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  weekTaskTopic: {
    fontSize: 13,
  },
  weekTaskInfo: {
    alignItems: 'flex-end',
  },
  weekTaskTime: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  weekTaskDuration: {
    fontSize: 11,
  },
  weekTaskCompleted: {
    fontSize: 16,
    color: '#10B981',
    marginTop: 4,
  },

  // Day View
  dayContainer: {
    flex: 1,
  },
  emptyDayContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyDayText: {
    fontSize: 16,
    textAlign: 'center',
  },
  dayTasksList: {
    paddingTop: 8,
  },
  dayTaskCard: {
    borderRadius: 12,
    borderLeftWidth: 6,
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  dayTaskTime: {
    width: 80,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayTaskTimeText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  dayTaskDuration: {
    fontSize: 11,
  },
  dayTaskContent: {
    flex: 1,
    padding: 16,
  },
  dayTaskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  dayTaskSubject: {
    fontSize: 16,
    fontWeight: '700',
  },
  dayTaskTopic: {
    fontSize: 14,
    lineHeight: 20,
  },
  completedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
}); 