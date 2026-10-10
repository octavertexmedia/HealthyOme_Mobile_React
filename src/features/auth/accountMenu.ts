import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';
import type { Href } from 'expo-router';
import { customerFeatures } from '../catalog/customerFeatures';
import type { SiteSettings } from '../catalog/types/meal.types';

type MenuAction =
  | { kind: 'route'; route: string; needsAuth?: boolean }
  | { kind: 'website'; url: `https://healthyome.in/${string}` }
  | { kind: 'logout' };
export type AccountMenuItem = MenuAction & {
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
};
export type AccountMenuSection = { title: string; items: AccountMenuItem[] };

/** Customer web sidebar order, with native destinations and shared feature gates. */
export function accountMenu(isAuthenticated: boolean, settings?: SiteSettings): AccountMenuSection[] {
  return [
    { title: 'Orders', items: [
      { label: 'All Subscriptions', icon: 'cube-outline', kind: 'route', route: '/subscription/my', needsAuth: true },
      { label: 'My Orders', icon: 'bag-handle-outline', kind: 'route', route: '/orders', needsAuth: true },
      ...(customerFeatures(settings).training ? [{ label: 'My training', icon: 'barbell-outline', kind: 'route', route: '/functional-training/my', needsAuth: true } satisfies AccountMenuItem] : []),
    ] },
    { title: 'Your Information', items: [
      { label: 'Saved Address', icon: 'location-outline', kind: 'route', route: '/profile-pages/addresses', needsAuth: true },
      { label: 'Favourites', icon: 'heart-outline', kind: 'route', route: '/profile-pages/favourites', needsAuth: true },
    ] },
    { title: 'Payments', items: [
      { label: 'My Rewards', icon: 'gift-outline', kind: 'route', route: '/rewards', needsAuth: true },
      { label: 'Payment Modes', icon: 'card-outline', kind: 'route', route: '/profile-pages/payment', needsAuth: true },
      { label: 'Offers', icon: 'pricetag-outline', kind: 'route', route: '/profile-pages/offers', needsAuth: true },
    ] },
    { title: 'Support', items: [
      { label: 'About Healthy-O-Me', icon: 'information-circle-outline', kind: 'website', url: 'https://healthyome.in/about' },
      { label: 'Help & Support', icon: 'help-circle-outline', kind: 'route', route: '/profile-pages/support' },
      { label: 'Contact & Enquiries', icon: 'chatbubbles-outline', kind: 'website', url: 'https://healthyome.in/contact' },
      { label: 'Business Partnerships', icon: 'business-outline', kind: 'website', url: 'https://healthyome.in/business' },
      { label: 'FAQs', icon: 'document-text-outline', kind: 'route', route: '/profile-pages/faqs' },
      { label: 'App tour', icon: 'sparkles-outline', kind: 'route', route: '/profile-pages/tour' },
    ] },
    { title: 'Accounts', items: [
      ...(isAuthenticated ? [
        { label: 'Notifications', icon: 'notifications-outline', kind: 'route', route: '/profile-pages/notifications', needsAuth: true },
        { label: 'Settings', icon: 'settings-outline', kind: 'route', route: '/profile-pages/edit', needsAuth: true },
        { label: 'Notification Preferences', icon: 'options-outline', kind: 'route', route: '/profile-pages/preferences', needsAuth: true },
      ] satisfies AccountMenuItem[] : []),
      { label: 'Terms & Privacy', icon: 'shield-checkmark-outline', kind: 'route', route: '/profile-pages/legal' },
      { label: 'Data Deletion', icon: 'trash-outline', kind: 'route', route: '/profile-pages/data-deletion' },
      isAuthenticated
        ? { label: 'Logout', icon: 'log-out-outline', kind: 'logout' }
        : { label: 'Sign In', icon: 'log-in-outline', kind: 'route', route: '/(auth)/login' },
    ] },
  ];
}

export function accountMenuHref(item: AccountMenuItem, isAuthenticated: boolean): Href | null {
  if (item.kind !== 'route') return null;
  return item.needsAuth && !isAuthenticated
    ? { pathname: '/(auth)/login', params: { redirect: item.route } }
    : item.route as Href;
}
