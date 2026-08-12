import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import apiClient from '../../shared/api/client';

let registering: Promise<boolean> | null = null;
let rotationSub: ReturnType<typeof Notifications.addPushTokenListener> | null = null;
// Remember the last token we registered so we can de-register the exact device
// (the backend keys de-registration on fcm_token, not device_id).
let lastToken: string | null = null;

const ANDROID_CHANNELS: Array<{ id: string; name: string }> = [
  { id: 'orders',        name: 'Order updates' },
  { id: 'promotions',    name: 'Promotions & offers' },
  { id: 'subscriptions', name: 'Subscription reminders' },
  { id: 'consults',      name: 'Consultations' },
  { id: 'rewards',       name: 'Reward alerts' },
];

function deviceId(): string {
  return (
    (Device.osBuildId ?? Device.modelId ?? Device.deviceName ?? 'unknown') +
    ':' +
    Platform.OS
  );
}

async function postRegistration(token: string): Promise<boolean> {
  try {
    // Backend contract: POST /notifications/device/ (notifications/device_api.py).
    // Requires `fcm_token`; device_type must be one of ios|android|web.
    await apiClient.post('/notifications/device/', {
      fcm_token: token,
      device_id: deviceId(),
      device_type: Platform.OS === 'ios' ? 'ios' : 'android',
      device_name: Device.deviceName ?? '',
      app_version: Constants.expoConfig?.version ?? '',
    });
    lastToken = token;
    return true;
  } catch {
    return false;
  }
}

/**
 * Request notification permission, obtain an Expo push token, and register it
 * with the backend. Idempotent — safe to call on every authenticated launch.
 *
 * Also installs a token-rotation listener once so OS-rotated tokens get
 * re-POSTed automatically. Returns true on success.
 */
export async function registerPushToken(): Promise<boolean> {
  if (registering) return registering;

  registering = (async () => {
    if (!Device.isDevice) return false;

    const existing = await Notifications.getPermissionsAsync();
    let granted = existing.granted || existing.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
    if (!granted) {
      const req = await Notifications.requestPermissionsAsync();
      granted = req.granted;
    }
    if (!granted) return false;

    if (Platform.OS === 'android') {
      for (const channel of ANDROID_CHANNELS) {
        await Notifications.setNotificationChannelAsync(channel.id, {
          name: channel.name,
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
          vibrationPattern: [0, 250, 250, 250],
        });
      }
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      (Constants as any)?.easConfig?.projectId;
    if (!projectId) return false;

    let token: string;
    try {
      const res = await Notifications.getExpoPushTokenAsync({ projectId });
      token = res.data;
    } catch {
      return false;
    }

    if (!rotationSub) {
      rotationSub = Notifications.addPushTokenListener((next) => {
        if (next?.data) {
          postRegistration(next.data).catch(() => {});
        }
      });
    }

    return postRegistration(token);
  })().finally(() => {
    registering = null;
  });

  return registering;
}

/**
 * Unregister this device with the backend so push delivery stops.
 * Called from the logout flow. Safe to call when not registered — failures are
 * swallowed so logout can never be blocked by a flaky network.
 */
export async function unregisterPushToken(): Promise<void> {
  try {
    // Backend contract: DELETE /notifications/device/ with body { fcm_token }.
    if (lastToken) {
      await apiClient.delete('/notifications/device/', {
        data: { fcm_token: lastToken },
      });
    }
  } catch {
    // intentionally swallowed
  }
  lastToken = null;
  if (rotationSub) {
    rotationSub.remove();
    rotationSub = null;
  }
}
