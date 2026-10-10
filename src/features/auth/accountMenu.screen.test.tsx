import React from 'react';
import { Alert, Linking } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import ProfileScreen from '../../../app/(tabs)/profile';
import AppTourScreen from '../../../app/profile-pages/tour';
import LegalIndexScreen from '../../../app/profile-pages/legal';
import { storage } from '../../shared/storage/mmkv';

const mockPush = jest.fn(); const mockReplace = jest.fn(); const mockNavigate = jest.fn();
const mockLogout = jest.fn();
let mockAuthenticated = false;
let mockSettings = { functional_training_customer_enabled: true, healthy_snacks_enabled: true, home_quick_meals_card_enabled: false };
let mockSubscriptions: unknown[] = [];
const mockQuery = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush, replace: mockReplace, navigate: mockNavigate }) }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) }));
jest.mock('../../shared/components/ScreenHeader', () => ({ ScreenHeader: ({ title }: { title: string }) => {
  const { Text } = jest.requireActual('react-native'); return <Text>{title}</Text>;
} }));
jest.mock('../../shared/storage/mmkv', () => ({ storage: { set: jest.fn(), delete: jest.fn(), clearAll: jest.fn() } }));
jest.mock('./store/auth.store', () => ({ useAuthStore: () => ({ user: null, isAuthenticated: mockAuthenticated, logout: mockLogout }) }));
jest.mock('../catalog/hooks/useMeals', () => ({ useSiteSettings: () => ({ data: mockSettings }) }));
jest.mock('../subscription/api/subscription.api', () => ({ subscriptionApi: { getActive: jest.fn() } }));
jest.mock('@tanstack/react-query', () => ({ useQuery: (options: unknown) => { mockQuery(options); return { data: mockSubscriptions }; } }));

beforeEach(() => {
  mockAuthenticated = false;
  mockSubscriptions = [];
  mockLogout.mockResolvedValue(undefined);
  mockSettings = { functional_training_customer_enabled: true, healthy_snacks_enabled: true, home_quick_meals_card_enabled: false };
});
afterEach(() => jest.restoreAllMocks());

it('renders guest private entries with sign-in hints and no private query/card', () => {
  mockSubscriptions = [{ id: 123, meal_plan_type: { name: 'Cached private plan' } }];
  render(<ProfileScreen />);
  expect(mockQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
  expect(screen.queryByText('Cached private plan')).toBeNull();
  expect(screen.getByRole('button', { name: 'My training' }).props.accessibilityHint).toBe('Sign in to continue');
  fireEvent.press(screen.getByRole('button', { name: 'My training' }));
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/(auth)/login', params: { redirect: '/functional-training/my' } });
  fireEvent.press(screen.getByRole('button', { name: 'My Orders' }));
  expect(mockPush).toHaveBeenLastCalledWith({ pathname: '/(auth)/login', params: { redirect: '/orders' } });
});
it('opens support and native tour directly for guests, with 48-point row targets', () => {
  render(<ProfileScreen />);
  const tour = screen.getByRole('button', { name: 'App tour' });
  expect(tour).toHaveStyle({ minHeight: 48 });
  fireEvent.press(tour);
  expect(mockPush).toHaveBeenLastCalledWith('/profile-pages/tour');
  fireEvent.press(screen.getByRole('button', { name: 'Help & Support' }));
  expect(mockPush).toHaveBeenLastCalledWith('/profile-pages/support');
});
it.each([
  ['About Healthy-O-Me', 'about'], ['Contact & Enquiries', 'contact'], ['Business Partnerships', 'business'],
])('opens the real public website for %s without login', async (label, path) => {
  const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  render(<ProfileScreen />);
  fireEvent.press(screen.getByRole('link', { name: label }));
  await waitFor(() => expect(open).toHaveBeenCalledWith(`https://healthyome.in/${path}`));
  expect(mockPush).not.toHaveBeenCalled();
});
it('explains browser launch failure rather than leaving a dead action', async () => {
  jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('no browser'));
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  render(<ProfileScreen />);
  fireEvent.press(screen.getByRole('link', { name: 'About Healthy-O-Me' }));
  await waitFor(() => expect(alert).toHaveBeenCalledWith('Could not open website', 'Please visit https://healthyome.in/about in your browser.'));
});
it('uses native protected destinations for a signed-in customer and retains Settings', async () => {
  mockAuthenticated = true;
  render(<ProfileScreen />);
  fireEvent.press(screen.getByRole('button', { name: 'My training' }));
  expect(mockPush).toHaveBeenLastCalledWith('/functional-training/my');
  fireEvent.press(screen.getByRole('button', { name: 'Settings' }));
  expect(mockPush).toHaveBeenLastCalledWith('/profile-pages/edit');
  fireEvent.press(screen.getByRole('button', { name: 'Logout' }));
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(auth)/login'));
});
it('removes the training account entry when its setting is disabled', () => {
  mockSettings.functional_training_customer_enabled = false;
  render(<ProfileScreen />);
  expect(screen.queryByRole('button', { name: 'My training' })).toBeNull();
});
it('replays a flag-aware public tour without clearing cart, session or onboarding storage', () => {
  render(<AppTourScreen />);
  expect(screen.queryByRole('button', { name: 'Explore Quick Meals' })).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: 'Explore Healthy Snacks' }));
  expect(mockPush).toHaveBeenLastCalledWith('/(tabs)/snacks');
  fireEvent.press(screen.getByRole('button', { name: 'Done — explore Home' }));
  expect(mockNavigate).toHaveBeenLastCalledWith('/(tabs)');
  expect(storage.set).not.toHaveBeenCalled();
  expect(storage.delete).not.toHaveBeenCalled();
  expect(mockLogout).not.toHaveBeenCalled();
});
it('keeps both native legal pages reachable from the web-compatible menu label', () => {
  render(<LegalIndexScreen />);
  fireEvent.press(screen.getByRole('button', { name: 'Terms of Service' }));
  expect(mockPush).toHaveBeenLastCalledWith({ pathname: '/profile-pages/terms', params: { slug: 'terms' } });
  fireEvent.press(screen.getByRole('button', { name: 'Privacy Policy' }));
  expect(mockPush).toHaveBeenLastCalledWith({ pathname: '/profile-pages/terms', params: { slug: 'privacy' } });
});
