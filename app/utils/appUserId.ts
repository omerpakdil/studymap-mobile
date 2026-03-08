import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases from 'react-native-purchases';

import { isRevenueCatUninitializedError } from './revenueCatSafe';

const TEMP_APP_USER_ID_KEY = 'temp_app_user_id';

export const getAppUserId = async (): Promise<string> => {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.originalAppUserId;
  } catch (error) {
    if (!isRevenueCatUninitializedError(error)) {
      console.error('Failed to resolve RevenueCat app user id:', error);
    }

    const existingTempId = await AsyncStorage.getItem(TEMP_APP_USER_ID_KEY);
    if (existingTempId) {
      return existingTempId;
    }

    const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    await AsyncStorage.setItem(TEMP_APP_USER_ID_KEY, tempId);
    return tempId;
  }
};
