import { Audio } from 'expo-av';

const START_ASSET = require('@/assets/sounds/session-start.wav');
const END_ASSET = require('@/assets/sounds/session-end.wav');

let activeSound: Audio.Sound | null = null;

async function unloadCurrent() {
  if (!activeSound) return;
  try {
    await activeSound.unloadAsync();
  } catch {
    // already unloaded
  }
  activeSound = null;
}

export async function playSessionStart(): Promise<void> {
  try {
    await unloadCurrent();
    const { sound } = await Audio.Sound.createAsync(START_ASSET, { volume: 0.6 });
    activeSound = sound;
    await sound.playAsync();
  } catch {
    // non-critical — swallow so timer flow is never blocked
  }
}

export async function playSessionEnd(): Promise<void> {
  try {
    await unloadCurrent();
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
    });
    const { sound } = await Audio.Sound.createAsync(END_ASSET, { volume: 1.0 });
    activeSound = sound;
    await sound.playAsync();
  } catch {
    // non-critical
  }
}

export async function unloadSessionSound(): Promise<void> {
  await unloadCurrent();
}
