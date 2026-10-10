import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import {
  routeFromNotificationData,
  type NotificationRouteData,
} from './notificationRoutes';

/**
 * Routes a notification tap to the relevant screen.
 *
 * Supported payloads:
 * - `{ path | link_path | action_url | link }` — known customer-web routes are
 *   translated to existing native screens; unknown/staff routes are ignored
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

    const routeFromData = (data: NotificationRouteData) => {
      const route = routeFromNotificationData(data);
      if (route) router.push(route as any);
    };

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      routeFromData(response.notification.request.content.data as NotificationRouteData);
    });

    // Handle the case where the app was opened from a notification (cold start)
    Notifications.getLastNotificationResponseAsync().then((response) => {
      routeFromData(response?.notification.request.content.data as NotificationRouteData);
    });

    return () => sub.remove();
  }, [router]);
}
