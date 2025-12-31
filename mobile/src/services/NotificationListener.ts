import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { notificationAPI } from './api';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotifications(): Promise<string | undefined> {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0ea5e9',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      alert('Failed to get push notification permissions!');
      return;
    }

    token = (await Notifications.getExpoPushTokenAsync()).data;
  } else {
    alert('Must use physical device for Push Notifications');
  }

  return token;
}

export async function processNotification(notification: Notifications.Notification): Promise<void> {
  try {
    const { title, body, data } = notification.request.content;
    const appName = data?.appName || 'Unknown App';

    // Combine title and body for processing
    const notificationText = `${title || ''} ${body || ''}`.trim();

    if (notificationText) {
      // Send to backend for processing
      await notificationAPI.sendNotification(notificationText, appName);
      console.log('Notification sent to backend:', notificationText);
    }
  } catch (error) {
    console.error('Error processing notification:', error);
  }
}

export function setupNotificationListener(): void {
  // Listen for notifications received while app is foregrounded
  Notifications.addNotificationReceivedListener((notification) => {
    console.log('Notification received:', notification);
    processNotification(notification);
  });

  // Listen for user tapping on notification
  Notifications.addNotificationResponseReceivedListener((response) => {
    console.log('Notification tapped:', response);
    processNotification(response.notification);
  });
}

// NOTE: For accessing ALL notifications (including from banking apps),
// you need to implement a native module with NotificationListenerService (Android)
// or User Notifications framework (iOS). This is beyond Expo's capabilities
// and requires a custom development build or bare React Native.
//
// For a production app, you would need to:
// 1. Eject from Expo or use a custom development build
// 2. Implement native notification listeners
// 3. Filter for banking/finance app notifications
// 4. Forward them to the backend
//
// This current implementation only handles notifications sent TO this app,
// not notifications from other apps.
