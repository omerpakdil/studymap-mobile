import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';

const FALLBACK_ASSET = require('@/assets/sounds/lofi-fallback.mp3');
const LOFI_VOLUME = 0.55;
const STREAM_TIMEOUT_MS = 7000;
const STORAGE_KEY = 'preferred_lofi_channel_v1';

export const LOFI_CHANNELS = [
  {
    id: 'ambient',
    label: 'Ambient',
    subtitle: 'Fluid',
    sources: [
      'https://ice5.somafm.com/fluid-128-mp3',
      'https://ice1.somafm.com/fluid-128-mp3',
      'https://ice5.somafm.com/fluid-128-aac',
      'https://ice1.somafm.com/fluid-128-aac',
    ],
  },
  {
    id: 'lofi',
    label: 'Lofi',
    subtitle: 'Groove Salad',
    sources: [
      'https://ice1.somafm.com/groovesalad-256-mp3',
      'https://ice2.somafm.com/groovesalad-256-mp3',
      'https://ice4.somafm.com/groovesalad-256-mp3',
      'https://ice5.somafm.com/groovesalad-128-mp3',
      'https://ice3.somafm.com/groovesalad-128-mp3',
      'https://ice1.somafm.com/groovesalad-128-mp3',
    ],
  },
  {
    id: 'deep',
    label: 'Deep Focus',
    subtitle: 'Drone Zone',
    sources: [
      'https://ice5.somafm.com/dronezone-128-mp3',
      'https://ice1.somafm.com/dronezone-128-mp3',
      'https://ice2.somafm.com/dronezone-128-mp3',
    ],
  },
] as const;

export type LofiChannelId = (typeof LOFI_CHANNELS)[number]['id'];
type LofiChannel = (typeof LOFI_CHANNELS)[number];

async function createStreamSound(uri: string) {
  const result = await Promise.race([
    Audio.Sound.createAsync(
      { uri },
      {
        shouldPlay: false,
        isLooping: false,
        volume: LOFI_VOLUME,
        progressUpdateIntervalMillis: 1000,
      },
    ),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`stream timeout: ${uri}`)), STREAM_TIMEOUT_MS)
    ),
  ]);

  return (result as { sound: Audio.Sound }).sound;
}

async function createBestAvailableSound(channel: LofiChannel) {
  for (const uri of channel.sources) {
    try {
      return await createStreamSound(uri);
    } catch {
      // Try next endpoint.
    }
  }

  const result = await Audio.Sound.createAsync(
    FALLBACK_ASSET,
    {
      shouldPlay: false,
      isLooping: true,
      volume: LOFI_VOLUME,
      progressUpdateIntervalMillis: 1000,
    },
  );

  return result.sound;
}

export function useLofiPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [channelId, setChannelId] = useState<LofiChannelId>('ambient');
  const soundRef = useRef<Audio.Sound | null>(null);
  const channelRef = useRef<LofiChannelId>('ambient');

  const activeChannel = LOFI_CHANNELS.find((item) => item.id === channelId) ?? LOFI_CHANNELS[0];

  useEffect(() => {
    channelRef.current = channelId;
  }, [channelId]);

  useEffect(() => {
    void (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved && LOFI_CHANNELS.some((item) => item.id === saved)) {
          setChannelId(saved as LofiChannelId);
        }
      } catch {
        // Ignore storage issues.
      }
    })();
  }, []);

  const stop = useCallback(async () => {
    if (!soundRef.current) return;
    try {
      soundRef.current.setOnPlaybackStatusUpdate(null);
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
    } catch {
      // already stopped/unloaded
    }
    soundRef.current = null;
    setIsPlaying(false);
  }, []);

  const changeChannel = useCallback(async (nextChannelId: LofiChannelId) => {
    if (nextChannelId === channelRef.current) return;

    channelRef.current = nextChannelId;
    setChannelId(nextChannelId);

    try {
      await AsyncStorage.setItem(STORAGE_KEY, nextChannelId);
    } catch {
      // Ignore persistence issues.
    }

    if (!isPlaying) {
      return;
    }

    await stop();
    const nextChannel = LOFI_CHANNELS.find((item) => item.id === nextChannelId) ?? LOFI_CHANNELS[0];

    setIsLoading(true);
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        interruptionModeIOS: 1,
        interruptionModeAndroid: 1,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const sound = await createBestAvailableSound(nextChannel);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) {
          if ('error' in status && status.error) {
            setIsPlaying(false);
          }
          return;
        }

        if (status.didJustFinish && !status.isLooping) {
          setIsPlaying(false);
        }
      });

      soundRef.current = sound;
      await sound.playAsync();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  }, [isPlaying, stop]);

  const toggle = useCallback(async () => {
    if (isPlaying) {
      await stop();
      return;
    }

    setIsLoading(true);
    try {
      if (soundRef.current) {
        await stop();
      }

      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        interruptionModeIOS: 1,
        interruptionModeAndroid: 1,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const channel = LOFI_CHANNELS.find((item) => item.id === channelRef.current) ?? LOFI_CHANNELS[0];
      const sound = await createBestAvailableSound(channel);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) {
          if ('error' in status && status.error) {
            setIsPlaying(false);
          }
          return;
        }

        if (status.didJustFinish && !status.isLooping) {
          setIsPlaying(false);
        }
      });

      soundRef.current = sound;
      await sound.playAsync();
      setIsPlaying(true);
    } catch {
      // non-critical — swallow silently
    } finally {
      setIsLoading(false);
    }
  }, [isPlaying, stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      void stop();
    };
  }, [stop]);

  return {
    isPlaying,
    isLoading,
    toggle,
    stop,
    channels: LOFI_CHANNELS,
    channelId,
    activeChannel,
    changeChannel,
  };
}
