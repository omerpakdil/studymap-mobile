import { Ionicons } from '@expo/vector-icons';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import type { RenderProps } from 'react-native-spotlight-tour';
import type { SupportedLanguage } from '@/app/i18n';
import { markWalkthroughSeen } from '@/app/utils/walkthroughState';
import {
  DONE_LABELS,
  NEXT_LABELS,
  SKIP_LABELS,
  TOUR_STEPS,
} from './tourData';

const { width: SW } = Dimensions.get('window');
const isTablet = SW >= 768;
const TOTAL = TOUR_STEPS.length;

interface TourCardProps extends RenderProps {
  lang: SupportedLanguage;
}

export function TourCard({ current, isLast, next, stop, lang }: TourCardProps) {
  const data = TOUR_STEPS[current];
  if (!data) return null;

  const handleSkip = async () => {
    await markWalkthroughSeen();
    stop();
  };

  const handleNext = async () => {
    if (isLast) {
      await markWalkthroughSeen();
      stop();
    } else {
      next();
    }
  };

  return (
    <View style={styles.wrapper}>
      {/* Step dots */}
      <View style={styles.dotsRow}>
        {Array.from({ length: TOTAL }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i < current && styles.dotDone,
              i === current && styles.dotActive,
            ]}
          />
        ))}
      </View>

      {/* Icon badge */}
      <View style={styles.iconBadge}>
        <Ionicons name={data.icon as never} size={22} color="#0F9D8C" />
      </View>

      {/* Title */}
      <Text style={styles.title}>{data.titles[lang] ?? data.titles.en}</Text>

      {/* Description */}
      <Text style={styles.desc}>{data.descs[lang] ?? data.descs.en}</Text>

      {/* Counter */}
      <Text style={styles.counter}>{current + 1} / {TOTAL}</Text>

      {/* Buttons */}
      <View style={styles.btnRow}>
        <Pressable
          style={({ pressed }) => [styles.skipBtn, pressed && styles.btnPressed]}
          onPress={handleSkip}
        >
          <Text style={styles.skipText}>{SKIP_LABELS[lang] ?? SKIP_LABELS.en}</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.nextBtn, pressed && styles.btnPressed]}
          onPress={handleNext}
        >
          <Text style={styles.nextText}>
            {isLast ? (DONE_LABELS[lang] ?? DONE_LABELS.en) : (NEXT_LABELS[lang] ?? NEXT_LABELS.en)}
          </Text>
          {!isLast && (
            <Ionicons name="arrow-forward" size={14} color="#fff" style={{ marginLeft: 5 }} />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: SW - 40,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.95)',
    backgroundColor: 'rgba(255,255,255,0.98)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 10,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 5,
    marginBottom: 14,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  dotDone: {
    backgroundColor: 'rgba(15,157,140,0.28)',
  },
  dotActive: {
    width: 20,
    backgroundColor: '#0F9D8C',
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#ECFDF8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(15,157,140,0.16)',
  },
  title: {
    fontSize: isTablet ? 20 : 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 7,
    letterSpacing: -0.25,
  },
  desc: {
    fontSize: isTablet ? 14 : 13,
    color: '#64748B',
    lineHeight: isTablet ? 21 : 19,
    marginBottom: 12,
  },
  counter: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 10,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  skipBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  nextBtn: {
    flex: 2,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#0F9D8C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F9D8C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  btnPressed: {
    opacity: 0.78,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  nextText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },
});
