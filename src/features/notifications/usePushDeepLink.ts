import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';

type PushData = Record<string, unknown> | undefined;

function pickId(data: PushData, ...keys: string[]): string | undefined {
  if (!data) return undefined;
  for (const key of keys) {
    const v = data[key];
    if (typeof v === 'string' && v) return v;
    if (typeof v === 'number') return String(v);
  }
  return undefined;
}

/**
 * Routes a notification tap to the relevant screen.
 *
 * Supported payloads:
 * - `{ path }` — absolute route to push directly (used by future signals)
 * - `{ type: 'order_status', order_id }` → /orders/my/:id
 * - `{ type: 'subscription', subscription_id? }` → /subscription
 * - `{ type: 'consult', booking_id? }` → /consult/my
 * - `{ type: 'reward' }` → /rewards
 * - `{ type: 'promotion' }` → /(tabs)/menu
 * - anything else → no-op (notification still shown by the OS)
 */
export function usePushDeepLink() {
  const router = useRouter();

  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    const routeFromData = (data: PushData) => {
      if (!data) return;

      if (typeof data.path === 'string' && data.path) {
        router.push(data.path as any);
        return;
      }

      switch (data.type) {
        case 'order_status':
        case 'order': {
          const id = pickId(data, 'order_id', 'id');
          if (id) router.push(`/orders/my/${id}` as any);
          else router.push('/(tabs)/orders' as any);
          return;
        }
        case 'subscription':
        case 'subscription_reminder':
          router.push('/subscription' as any);
          return;
        case 'consult':
        case 'consultation':
          router.push('/consult/my' as any);
          return;
        case 'reward':
        case 'reward_alert':
          router.push('/rewards' as any);
          return;
        case 'promotion':
        case 'promo':
          router.push('/(tabs)/menu' as any);
          return;
        default:
          return;
      }
    };

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      routeFromData(response.notification.request.content.data as PushData);
    });

    // Handle the case where the app was opened from a notification (cold start)
    Notifications.getLastNotificationResponseAsync().then((response) => {
      routeFromData(response?.notification.request.content.data as PushData);
    });

    return () => sub.remove();
  }, [router]);
}
