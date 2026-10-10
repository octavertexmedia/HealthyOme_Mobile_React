import React from 'react';
import { Text, View } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { CustomerShell, shellTabSelected } from './CustomerShell';
import { customerShellPolicy } from './shellPolicy';
import Login from '../../../app/(auth)/login';

let mockPath = '/';
const mockNavigate = jest.fn(); const mockPush = jest.fn(); const mockBack = jest.fn();
jest.mock('expo-router', () => ({ usePathname: () => mockPath, useLocalSearchParams: () => ({}), useRouter: () => ({ navigate: mockNavigate, push: mockPush, canGoBack: () => true, back: mockBack }) }));
jest.mock('../../features/catalog/hooks/useMeals', () => ({ useSiteSettings: () => ({ data: { home_quick_meals_card_enabled: false, healthy_snacks_enabled: true, functional_training_customer_enabled: true } }) }));
jest.mock('../../features/cart/store/cart.store', () => ({ useCartStore: (fn: (state: unknown) => unknown) => fn({ totalItems: 2 }) }));
jest.mock('../../features/auth/store/auth.store', () => ({ useAuthStore: (fn: (state: unknown) => unknown) => fn({ isAuthenticated: false }) }));
jest.mock('../../features/auth/api/auth.api', () => ({ authApi: { sendPhoneOTP: jest.fn() } }));
jest.mock('./PlatformIcon', () => ({ PlatformIcon: () => null }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('react-native-safe-area-context', () => {
  const R = jest.requireActual('react'); const C = R.createContext({ top: 40, bottom: 20, left: 0, right: 0 });
  return { SafeAreaInsetsContext: C, useSafeAreaInsets: () => R.useContext(C) };
});

it.each(['/', '/snacks', '/subscription/plans/test', '/subscription/create', '/cart', '/profile', '/consult', '/functional-training'])('owns exactly one header and tab bar on browsing route %s', (path) => {
  mockPath = path; render(<CustomerShell><Text>Route content</Text></CustomerShell>);
  expect(screen.getAllByTestId('customer-top-navigation')).toHaveLength(1);
  expect(screen.getAllByTestId('persistent-bottom-navigation')).toHaveLength(1);
  expect(screen.getAllByLabelText('HealthyOme')).toHaveLength(1);
  expect(screen.getAllByRole('tab')).toHaveLength(5);
  expect(screen.getByLabelText('Cart, 2 items')).toBeTruthy();
});
it.each(['/login', '/verify', '/(auth)/login', '/checkout', '/consult/health', '/product-review/snack/8'])('removes redundant shell chrome for focused route %s', (path) => {
  mockPath = path; render(<CustomerShell><Text>Focused content</Text></CustomerShell>);
  expect(screen.queryByTestId('customer-top-navigation')).toBeNull();
  expect(screen.queryByTestId('persistent-bottom-navigation')).toBeNull();
  expect(screen.getByText('Focused content')).toBeTruthy();
});
it('centers the brand independently of unequal left/right controls and reserves content space', () => {
  mockPath = '/'; render(<CustomerShell><View /></CustomerShell>);
  expect(screen.getByTestId('centered-brand')).toHaveStyle({ position: 'absolute', left: 96, right: 96 });
  expect(screen.getByTestId('shell-top-safe-area')).toHaveStyle({ paddingTop: 40 });
  expect(screen.getByTestId('persistent-bottom-navigation')).toHaveStyle({ paddingBottom: 20 });
  expect(screen.getByTestId('customer-route-content')).toHaveStyle({ flex: 1 });
});
it('routes profile, cart, location and tabs without piling up duplicate navigation shells', () => {
  mockPath = '/'; render(<CustomerShell><View /></CustomerShell>);
  fireEvent.press(screen.getByLabelText('Profile')); expect(mockNavigate).toHaveBeenCalledWith('/(tabs)/profile');
  fireEvent.press(screen.getByLabelText('Cart, 2 items')); expect(mockNavigate).toHaveBeenCalledWith('/cart');
  fireEvent.press(screen.getByLabelText('Select delivery location')); expect(mockPush).toHaveBeenCalledWith({ pathname: '/(auth)/login', params: { redirect: '/profile-pages/addresses' } });
  fireEvent.press(screen.getByRole('tab', { name: 'Training' })); expect(mockNavigate).toHaveBeenCalledWith('/(tabs)/training');
});
it('renders exactly one centered auth brand, no top nav or tabs, and keeps Back available', () => {
  mockPath = '/login'; render(<CustomerShell><Login /></CustomerShell>);
  expect(screen.getAllByLabelText('HealthyOme')).toHaveLength(1);
  expect(screen.queryByTestId('customer-top-navigation')).toBeNull();
  expect(screen.queryByRole('tablist')).toBeNull();
  fireEvent.press(screen.getByLabelText('Close sign in')); expect(mockBack).toHaveBeenCalledTimes(1);
});
it('maps nested service routes to their tabs without treating profile as Home', () => {
  expect(shellTabSelected('index', '/subscription/create')).toBe(true);
  expect(shellTabSelected('training', '/functional-training/example')).toBe(true);
  expect(shellTabSelected('dietitian', '/consult/my')).toBe(true);
  expect(shellTabSelected('index', '/profile')).toBe(false);
  expect(customerShellPolicy('/profile-pages/terms').tabs).toBe(true);
  expect(customerShellPolicy('/checkout').keyboard).toBe(true);
  expect(customerShellPolicy('/login').keyboard).toBe(false);
});
