import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';

const STREAM_URL = 'https://ice1.somafm.com/groovesalad-256-mp3';
const FALLBACK_ASSET = require('@/assets/sounds/lofi-fallback.mp3');
const LOFI_VOLUME = 0.55;

export function useLofiPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  const stop = useCallback(async () => {
    if (!soundRef.current) return;
    try {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
    } catch {
      // already stopped/unloaded
    }
    soundRef.current = null;
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(async () => {
    if (isPlaying) {
      await stop();
      return;
    }

    setIsLoading(true);
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      let sound: Audio.Sound;
      try {
        const result = await Promise.race([
          Audio.Sound.createAsync({ uri: STREAM_URL }, { volume: LOFI_VOLUME }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('stream timeout')), 6000)
          ),
        ]);
        sound = (result as { sound: Audio.Sound }).sound;
      } catch {
        // Stream failed or timed out — use bundled fallback
        const result = await Audio.Sound.createAsync(
          FALLBACK_ASSET,
          { isLooping: true, volume: LOFI_VOLUME },
        );
        sound = result.sound;
      }

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

  return { isPlaying, isLoading, toggle, stop };
}
