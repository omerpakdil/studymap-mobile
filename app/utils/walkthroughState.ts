import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'walkthrough_v6_seen';

export async function hasSeenWalkthrough(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(KEY);
    return val === '1';
  } catch {
    return true; // fail-safe: don't show if storage is unavailable
  }
}

export async function markWalkthroughSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, '1');
  } catch {
    // non-critical
  }
}

export async function resetWalkthrough(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // non-critical
  }
}


export async function resetWalkthroughForDev(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // non-critical
  }
}
