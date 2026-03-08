import { Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { resolveAppLanguage, t } from '@/app/i18n';
import { useTheme } from '@/themes';

const APPLE_EULA_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';

export default function TermsScreen() {
  const { colors } = useTheme();
  const appLang = resolveAppLanguage();

  return (
    <>
      <Stack.Screen options={{ title: t('legal.terms_title', { lang: appLang, fallback: 'Terms of Use (EULA)' }) }} />
      <WebView
        originWhitelist={['*']}
        source={{ uri: APPLE_EULA_URL }}
        style={{ flex: 1, backgroundColor: colors.neutral[0] }}
        startInLoadingState={true}
        renderLoading={() => (
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: colors.neutral[0],
            }}
          >
            <ActivityIndicator size="large" color={colors.primary[500]} />
          </View>
        )}
      />
    </>
  );
}
