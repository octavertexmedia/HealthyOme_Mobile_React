export type NotificationRouteData = Record<string, unknown> | undefined;

function pickId(data: NotificationRouteData, ...keys: string[]): string | undefined {
  if (!data) return undefined;
  for (const key of keys) {
    const value = data[key];
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    if (typeof value === 'string' && /^\d+$/.test(value.trim())) return value.trim();
  }
  return undefined;
}

/** Convert customer-web notification links into routes that exist in Expo Router. */
export function mobileRouteForNotificationPath(rawPath?: string | null): string | null {
  if (!rawPath) return null;
  const withoutOrigin = rawPath.trim().replace(/^https?:\/\/[^/]+/i, '');
  const [path, query = ''] = withoutOrigin.split('?', 2);

  const tracked = path.match(/^\/track\/(\d+)\/?$/);
  if (tracked) return `/orders/my/${tracked[1]}`;

  const orderDetail = path.match(/^\/orders\/my\/(\d+)\/?$/);
  if (orderDetail) return `/orders/my/${orderDetail[1]}`;

  if (path === '/orders' || path === '/orders/') {
    const highlighted = new URLSearchParams(query).get('highlight');
    return highlighted && /^\d+$/.test(highlighted)
      ? `/orders/my/${highlighted}`
      : '/(tabs)/orders';
  }

  if (/^\/subscription\/manage\/\d+\/?$/.test(path)) return '/subscription';
  if (path === '/subscription/active' || path === '/subscription/active/') {
    return '/subscription';
  }
  if (path === '/subscription/categories' || path === '/subscription/categories/') {
    return '/subscription/plans';
  }
  if (path === '/subscription' || path === '/subscription/') return '/subscription';

  if (/^\/consult\/manage\/\d+\/?$/.test(path)) return '/consult/my';
  if (path === '/consult/my' || path === '/consult/my/') return '/consult/my';

  const knownRoutes: Record<string, string> = {
    '/cart': '/cart',
    '/checkout': '/checkout',
    '/rewards': '/rewards',
    '/menu': '/(tabs)/menu',
    '/snacks': '/snacks',
    '/functional-training': '/functional-training',
  };
  return knownRoutes[path] ?? null;
}

export function routeFromNotificationData(data: NotificationRouteData): string | null {
  if (!data) return null;

  for (const key of ['path', 'link_path', 'action_url', 'link']) {
    const value = data[key];
    if (typeof value === 'string') {
      const route = mobileRouteForNotificationPath(value);
      if (route) return route;
    }
  }

  switch (data.type) {
    case 'order_status':
    case 'order': {
      const id = pickId(data, 'order_id', 'orderId', 'id');
      return id ? `/orders/my/${id}` : '/(tabs)/orders';
    }
    case 'subscription':
    case 'subscription_reminder':
      return '/subscription';
    case 'consult':
    case 'consultation':
      return '/consult/my';
    case 'reward':
    case 'reward_alert':
      return '/rewards';
    case 'promotion':
    case 'promo':
      return '/(tabs)/menu';
    default:
      return null;
  }
}
