import {
  mobileRouteForNotificationPath,
  routeFromNotificationData,
} from './notificationRoutes';

describe('notification route mapping', () => {
  it('maps customer-web routes onto existing native screens', () => {
    expect(mobileRouteForNotificationPath('/subscription/manage/12')).toBe('/subscription/manage/12');
    expect(mobileRouteForNotificationPath('/subscription/categories')).toBe('/subscription/categories');
    expect(mobileRouteForNotificationPath('/consult/manage/23')).toBe('/consult/my');
    expect(mobileRouteForNotificationPath('/track/34')).toBe('/orders/my/34');
    expect(mobileRouteForNotificationPath('/orders?highlight=45')).toBe('/orders/my/45');
  });

  it('handles absolute web URLs and rejects staff-only paths', () => {
    expect(mobileRouteForNotificationPath('https://healthyome.in/track/52')).toBe('/orders/my/52');
    expect(mobileRouteForNotificationPath('/crm/orders?highlight=52')).toBeNull();
    expect(mobileRouteForNotificationPath('/admin/settings')).toBeNull();
  });

  it('falls back to structured push metadata', () => {
    expect(routeFromNotificationData({ type: 'order_status', orderId: 61 })).toBe('/orders/my/61');
    expect(routeFromNotificationData({ type: 'promotion' })).toBe('/(tabs)/menu');
    expect(routeFromNotificationData({ link_path: '/subscription/active' })).toBe('/subscription/my');
  });
});
