// Push notification setup for the customer app.
//
// Flow:
//   1. registerForPush() asks permission + gets the Expo push token
//   2. AuthContext POSTs that token to the server after login
//   3. server sends pushes on status changes (preparing/ready/picked up)
//
// Note: push notifications do NOT work in Expo Go on Android (SDK 53+);
// they require a dev build or production build. iOS Expo Go also needs a
// dev build for remote push. The code degrades gracefully (returns null).
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// Show alerts even when the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPush() {
  // Only real devices can get a push token.
  if (!Device.isDevice) return null;

  try {
    // Android needs a notification channel.
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
    return tokenData.data; // ExponentPushToken[...]
  } catch (e) {
    console.warn('[push] registration failed:', e?.message);
    return null;
  }
}

// Subscribe to taps on a notification. `onTap(data)` gets the data payload
// (e.g. { orderId, status }). Returns an unsubscribe function.
export function addNotificationTapListener(onTap) {
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response?.notification?.request?.content?.data;
    if (data) onTap(data);
  });
  return () => sub.remove();
}
