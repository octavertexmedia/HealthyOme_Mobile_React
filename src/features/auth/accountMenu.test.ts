import { accountMenu, accountMenuHref } from './accountMenu';
import { safeAuthRedirect } from './authRedirect';
import type { SiteSettings } from '../catalog/types/meal.types';

const enabled = { functional_training_customer_enabled: true } as SiteSettings;
it('matches customer web groups, core labels and item order for guests', () => {
  expect(accountMenu(false, enabled).map(({ title, items }) => [title, items.map((item) => item.label)])).toEqual([
    ['Orders', ['All Subscriptions', 'My Orders', 'My training']],
    ['Your Information', ['Saved Address', 'Favourites']],
    ['Payments', ['My Rewards', 'Payment Modes', 'Offers']],
    ['Support', ['About Healthy-O-Me', 'Help & Support', 'Contact & Enquiries', 'Business Partnerships', 'FAQs', 'App tour']],
    ['Accounts', ['Terms & Privacy', 'Data Deletion', 'Sign In']],
  ]);
});
it('preserves protected destinations across sign-in without guarding public entries', () => {
  for (const item of accountMenu(false, enabled).flatMap((section) => section.items)) {
    if (item.kind === 'route' && item.needsAuth) {
      expect(accountMenuHref(item, false)).toEqual({ pathname: '/(auth)/login', params: { redirect: item.route } });
      expect(safeAuthRedirect(item.route)).toBe(item.route);
      expect(accountMenuHref(item, true)).toBe(item.route);
    } else if (item.kind === 'route') {
      expect(accountMenuHref(item, false)).toBe(item.route);
    } else {
      expect(accountMenuHref(item, false)).toBeNull();
    }
  }
});
it.each([undefined, { functional_training_customer_enabled: false } as SiteSettings])('hides disabled or unresolved training, not order history', (settings) => {
  const labels = accountMenu(true, settings).flatMap((section) => section.items.map((item) => item.label));
  expect(labels).not.toContain('My training');
  expect(labels).toEqual(expect.arrayContaining(['All Subscriptions', 'My Orders']));
});
it('keeps native account controls alongside web Settings without staff/admin items', () => {
  const items = accountMenu(true, enabled).at(-1)!.items;
  expect(items.map((item) => item.label)).toEqual(['Notifications', 'Settings', 'Notification Preferences', 'Terms & Privacy', 'Data Deletion', 'Logout']);
  expect(items.find((item) => item.label === 'Settings')).toMatchObject({ route: '/profile-pages/edit', needsAuth: true });
  expect(JSON.stringify(accountMenu(true, enabled))).not.toMatch(/admin|staff|dashboard/i);
});
