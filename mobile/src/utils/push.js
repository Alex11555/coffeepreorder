// Push notification setup for the customer app.
//
// IMPORTANT: remote push was removed from Expo Go in SDK 53. Touching the
// expo-notifications push APIs there throws. So we detect Expo Go and make
// EVERYTHING a no-op — the app runs fine, just without push. In a real dev
// or production build, push works normally.
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// 'expo' => running inside Expo Go. Anything else (standalone / dev build) is fine.
const isExpoGo = Constants.appOwnership === 'expo';

// Lazy-require so the native module isn't even loaded in Expo Go.
function getNotifications() {
  // eslint-disable-next-line global-require
  return require('expo-notifications');
}
function getDevice() {
  // eslint-disable-next-line global-require
  return require('expo-device');
}

let handlerSet = false;
function ensureHandler() {
  if (handlerSet || isExpoGo) return;
  const Notifications = getNotifications();
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  handlerSet = true;
}

export async function registerForPush() {
  if (isExpoGo) return null; // push not available in Expo Go

  try {
    const Notifications = getNotifications();
    const Device = getDevice();
    if (!Device.isDevice) return null;

    ensureHandler();

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Order updates',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#d4802a',
      });
    }

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      status = req.status;
    }
    if (status !== 'granted') return null;

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;

    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    return tokenData.data;
  } catch (e) {
    console.warn('[push] registration failed:', e?.message);
    return null;
  }
}

// Subscribe to taps on a notification. No-op in Expo Go.
export function addNotificationTapListener(onTap) {
  if (isExpoGo) return () => {};
  try {
    const Notifications = getNotifications();
    ensureHandler();
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response?.notification?.request?.content?.data;
      if (data) onTap(data);
    });
    return () => sub.remove();
  } catch {
    return () => {};
  }
}
