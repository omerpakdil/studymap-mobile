import { Asset } from 'expo-asset';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { useTheme } from '@/themes';

export default function TermsScreen() {
  const { colors } = useTheme();
  const [uri, setUri] = useState<string | null>(null);

  useEffect(() => {
    const loadAsset = async () => {
      const asset = Asset.fromModule(require('../../assets/legal/terms.html'));
      await asset.downloadAsync();
      setUri(asset.localUri ?? asset.uri);
    };

    loadAsset();
  }, []);

  return (
    <>
      <Stack.Screen options={{ title: 'Terms of Use' }} />
      {uri ? (
        <WebView
          originWhitelist={['*']}
          source={{ uri }}
          style={{ flex: 1, backgroundColor: colors.neutral[0] }}
        />
      ) : (
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
    </>
  );
}
