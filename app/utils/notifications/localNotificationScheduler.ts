import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

import { PlannedNotification } from '@/app/types/notifications';

const LOCAL_NOTIFICATION_MAP_KEY = 'scheduled_local_notifications_v1';

type ScheduledMap = Record<string, string>;

const loadScheduledMap = async (): Promise<ScheduledMap> => {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_NOTIFICATION_MAP_KEY);
    return raw ? (JSON.parse(raw) as ScheduledMap) : {};
  } catch {
    return {};
  }
};

const saveScheduledMap = async (value: ScheduledMap): Promise<void> => {
  await AsyncStorage.setItem(LOCAL_NOTIFICATION_MAP_KEY, JSON.stringify(value));
};

export const scheduleLocalNotificationPlan = async (
  plan: PlannedNotification[]
): Promise<void> => {
  const existing = await loadScheduledMap();
  const nextMap: ScheduledMap = {};

  for (const item of plan) {
    const alreadyScheduledId = existing[item.id];
    if (alreadyScheduledId) {
      nextMap[item.id] = alreadyScheduledId;
      continue;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: item.title,
        body: item.body,
        data: {
          ...item.payload,
          notificationType: item.type,
          notificationChannel: item.channel,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(item.scheduledFor),
      },
    });

    nextMap[item.id] = notificationId;
  }

  for (const [planId, nativeId] of Object.entries(existing)) {
    if (!nextMap[planId]) {
      await Notifications.cancelScheduledNotificationAsync(nativeId);
    }
  }

  await saveScheduledMap(nextMap);
};

export const cancelScheduledLocalNotificationPlan = async (): Promise<void> => {
  const existing = await loadScheduledMap();
  await Promise.all(
    Object.values(existing).map(notificationId =>
      Notifications.cancelScheduledNotificationAsync(notificationId)
    )
  );
  await AsyncStorage.removeItem(LOCAL_NOTIFICATION_MAP_KEY);
};

