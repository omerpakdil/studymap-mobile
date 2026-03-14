import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { Dimensions, Platform, StyleSheet, Text, View } from 'react-native';
import {
  AttachStep,
  SpotlightTourProvider,
  type TourStep,
  flip,
  offset,
  shift,
} from 'react-native-spotlight-tour';
import { TourCard } from '@/app/components/walkthrough/TourCard';
import { resolveAppLanguage, type SupportedLanguage } from '@/app/i18n';
import { hasSeenWalkthrough, markWalkthroughSeen } from '@/app/utils/walkthroughState';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

const TAB = {
  active: '#0F9D8C',
  inactive: '#6B7280',
  label: '#64748B',
  barBorder: 'rgba(15,157,140,0.16)',
  barA: 'rgba(255,255,255,0.94)',
  barB: 'rgba(244,253,250,0.92)',
  itemA: 'rgba(15,157,140,0.16)',
  itemB: 'rgba(45,212,191,0.10)',
};

const TAB_LABELS: Record<SupportedLanguage, { dashboard: string; calendar: string; progress: string; profile: string }> = {
  en: { dashboard: 'Dashboard', calendar: 'Calendar', progress: 'Progress', profile: 'Profile' },
  tr: { dashboard: 'Pano', calendar: 'Takvim', progress: 'Ilerleme', profile: 'Profil' },
  de: { dashboard: 'Dashboard', calendar: 'Kalender', progress: 'Fortschritt', profile: 'Profil' },
  fr: { dashboard: 'Tableau', calendar: 'Calendrier', progress: 'Progres', profile: 'Profil' },
  ar: { dashboard: 'الرئيسية', calendar: 'التقويم', progress: 'التقدم', profile: 'الملف' },
  ja: { dashboard: 'ダッシュボード', calendar: 'カレンダー', progress: '進捗', profile: 'プロフィール' },
  ko: { dashboard: '대시보드', calendar: '캘린더', progress: '진행', profile: '프로필' },
  'pt-BR': { dashboard: 'Painel', calendar: 'Calendario', progress: 'Progresso', profile: 'Perfil' },
  'zh-Hans': { dashboard: '仪表盘', calendar: '日历', progress: '进度', profile: '我的' },
  id: { dashboard: 'Dasbor', calendar: 'Kalender', progress: 'Kemajuan', profile: 'Profil' },
  hi: { dashboard: 'डैशबोर्ड', calendar: 'कैलेंडर', progress: 'प्रगति', profile: 'प्रोफाइल' },
};

function TourAutoStart({ start }: { start: () => void }) {
  useEffect(() => {
    hasSeenWalkthrough().then((seen) => {
      if (!seen) {
        const timer = setTimeout(async () => {
          await markWalkthroughSeen();
          start();
        }, 600);
        return () => clearTimeout(timer);
      }
    });
  }, [start]);
  return null;
}

export default function TabLayout() {
  const lang = resolveAppLanguage();
  const labels = TAB_LABELS[lang] ?? TAB_LABELS.en;

  const sharedFloating = {
    middleware: [offset(16), flip(), shift({ padding: 8 })],
    placement: 'top' as const,
  };

  const tourSteps: TourStep[] = [
    // 0: Dashboard tab
    {
      motion: 'fade',
      shape: { type: 'circle', padding: 12 },
      floatingProps: sharedFloating,
      render: (props) => <TourCard {...props} lang={lang} />,
    },
    // 1: First task card (study session) — AttachStep lives in dashboard.tsx
    {
      motion: 'fade',
      shape: { type: 'rectangle', padding: 8 },
      floatingProps: sharedFloating,
      render: (props) => <TourCard {...props} lang={lang} />,
    },
    // 2: Calendar tab
    {
      motion: 'fade',
      shape: { type: 'circle', padding: 12 },
      floatingProps: sharedFloating,
      render: (props) => <TourCard {...props} lang={lang} />,
    },
    // 3: Progress tab
    {
      motion: 'fade',
      shape: { type: 'circle', padding: 12 },
      floatingProps: sharedFloating,
      render: (props) => <TourCard {...props} lang={lang} />,
    },
    // 4: Profile tab
    {
      motion: 'fade',
      shape: { type: 'circle', padding: 12 },
      floatingProps: sharedFloating,
      render: (props) => <TourCard {...props} lang={lang} />,
    },
  ];

  return (
    <SpotlightTourProvider
      steps={tourSteps}
      overlayColor="#051412"
      overlayOpacity={0.75}
      nativeDriver={false}
      onBackdropPress="continue"
    >
      {({ start }) => (
        <>
          <TourAutoStart start={start} />
          <Tabs
            screenOptions={{
              headerShown: false,
              tabBarHideOnKeyboard: true,
              ...(Platform.OS === 'android' && { tabBarKeyboardHidesTabBar: true }),
              tabBarStyle: {
                position: 'absolute',
                left: isTablet ? 80 : 14,
                right: isTablet ? 80 : 14,
                bottom: isTablet ? 20 : 10,
                height: Platform.OS === 'ios' ? (isTablet ? 92 : 84) : (isTablet ? 86 : 78),
                paddingTop: 8,
                paddingBottom: Platform.OS === 'ios' ? (isTablet ? 24 : 18) : 12,
                paddingHorizontal: isTablet ? 24 : 10,
                borderTopWidth: 1,
                borderTopColor: TAB.barBorder,
                borderRadius: 26,
                backgroundColor: 'transparent',
                shadowColor: '#0F172A',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.16,
                shadowRadius: 18,
                elevation: 12,
                overflow: 'hidden',
              },
              tabBarBackground: () => (
                <LinearGradient
                  colors={[TAB.barA, TAB.barB]}
                  locations={[0, 1]}
                  style={StyleSheet.absoluteFill}
                />
              ),
              tabBarItemStyle: {
                paddingVertical: 0,
              },
            }}
          >
            <Tabs.Screen
              name="dashboard"
              options={{
                title: labels.dashboard,
                tabBarIcon: ({ focused }) => (
                  <AttachStep index={0}>
                    <ModernTabIcon name="dashboard" focused={focused} />
                  </AttachStep>
                ),
                tabBarLabel: ({ focused }) => <ModernTabLabel label={labels.dashboard} focused={focused} />,
              }}
            />
            <Tabs.Screen
              name="calendar"
              options={{
                title: labels.calendar,
                tabBarIcon: ({ focused }) => (
                  <AttachStep index={2}>
                    <ModernTabIcon name="calendar" focused={focused} />
                  </AttachStep>
                ),
                tabBarLabel: ({ focused }) => <ModernTabLabel label={labels.calendar} focused={focused} />,
              }}
            />
            <Tabs.Screen
              name="progress"
              options={{
                title: labels.progress,
                tabBarIcon: ({ focused }) => (
                  <AttachStep index={3}>
                    <ModernTabIcon name="progress" focused={focused} />
                  </AttachStep>
                ),
                tabBarLabel: ({ focused }) => <ModernTabLabel label={labels.progress} focused={focused} />,
              }}
            />
            <Tabs.Screen
              name="profile"
              options={{
                title: labels.profile,
                tabBarIcon: ({ focused }) => (
                  <AttachStep index={4}>
                    <ModernTabIcon name="profile" focused={focused} />
                  </AttachStep>
                ),
                tabBarLabel: ({ focused }) => <ModernTabLabel label={labels.profile} focused={focused} />,
              }}
            />
          </Tabs>
        </>
      )}
    </SpotlightTourProvider>
  );
}

function ModernTabLabel({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={[styles.tabLabel, { color: focused ? TAB.active : TAB.label }]} numberOfLines={1}>
      {label}
    </Text>
  );
}

const TAB_ICONS: Record<'dashboard' | 'calendar' | 'progress' | 'profile', { focused: keyof typeof Ionicons.glyphMap; unfocused: keyof typeof Ionicons.glyphMap }> = {
  dashboard: { focused: 'grid', unfocused: 'grid-outline' },
  calendar:  { focused: 'calendar-clear', unfocused: 'calendar-clear-outline' },
  progress:  { focused: 'stats-chart', unfocused: 'stats-chart-outline' },
  profile:   { focused: 'person', unfocused: 'person-outline' },
};

function ModernTabIcon({ name, focused }: { name: 'dashboard' | 'calendar' | 'progress' | 'profile'; focused: boolean }) {
  return (
    <View style={styles.iconSlot}>
      <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
        {focused && (
          <LinearGradient
            colors={[TAB.itemA, TAB.itemB]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}
        <Ionicons name={TAB_ICONS[name][focused ? 'focused' : 'unfocused']} size={isTablet ? 23 : 20} color={focused ? TAB.active : TAB.inactive} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabLabel: {
    fontSize: isTablet ? 12 : 10,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginTop: 4,
  },
  iconSlot: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  iconWrap: {
    width: isTablet ? 38 : 34,
    height: isTablet ? 38 : 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    borderWidth: 0,
    shadowColor: 'rgba(15,157,140,0.30)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 4,
  },
  tabEmoji: {
    fontSize: isTablet ? 20 : 18,
    opacity: 0.45,
  },
  tabEmojiActive: {
    opacity: 1,
  },
});
