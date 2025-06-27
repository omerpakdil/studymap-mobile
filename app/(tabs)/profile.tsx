import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/themes';

export default function ProfileScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.neutral[50] }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.neutral[900] }]}>
          👤 Profile
        </Text>
        <Text style={[styles.subtitle, { color: colors.neutral[600] }]}>
          User profile and settings will be developed here
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
}); 