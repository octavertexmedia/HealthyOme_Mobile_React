import React from 'react';
import { Text, View } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { CustomerShell, shellTabSelected } from './CustomerShell';
import { customerShellPolicy } from './shellPolicy';
import Login from '../../../app/(auth)/login';
import { ScreenHeader } from './ScreenHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SnacksScreen from '../../../app/snacks';

let mockPath = '/';
let mockSegments: string[] | undefined;
const mockNavigate = jest.fn(); const mockPush = jest.fn(); const mockBack = jest.fn(); const mockReplace = jest.fn();
let mockCanGoBack = true;
let mockCartCount = 2;
jest.mock('expo-router', () => ({ usePathname: () => mockPath, useSegments: () => mockSegments ?? (mockPath === '/' ? ['(tabs)'] : mockPath.split('/').filter(Boolean)), useLocalSearchParams: () => ({}), useRouter: () => ({ navigate: mockNavigate, push: mockPush, canGoBack: () => mockCanGoBack, back: mockBack, replace: mockReplace }) }));
jest.mock('../../features/catalog/hooks/useMeals', () => ({ useSiteSettings: () => ({ data: { home_quick_meals_card_enabled: false, healthy_snacks_enabled: true, functional_training_customer_enabled: true } }) }));
jest.mock('../../features/cart/store/cart.store', () => ({ useCartStore: (fn: (state: unknown) => unknown) => fn({ totalItems: mockCartCount, items: [] }) }));
jest.mock('../../features/snacks/hooks/useSnacks', () => ({ useInfiniteSnacks: () => ({ data: { pages: [] } }), useSnackCategories: () => ({ data: [] }), useSnack: () => ({ data: undefined }) }));
jest.mock('../../features/catalog/components/ProductReviews', () => ({ ProductReviews: () => null }));
jest.mock('../../features/auth/store/auth.store', () => ({ useAuthStore: (fn: (state: unknown) => unknown) => fn({ isAuthenticated: false }) }));
jest.mock('../../features/auth/api/auth.api', () => ({ authApi: { sendPhoneOTP: jest.fn() } }));
jest.mock('./PlatformIcon', () => ({ PlatformIcon: () => null }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('react-native-safe-area-context', () => {
  const R = jest.requireActual('react'); const C = R.createContext({ top: 40, bottom: 20, left: 0, right: 0 });
  return { SafeAreaInsetsContext: C, useSafeAreaInsets: () => R.useContext(C) };
});
beforeEach(() => { mockSegments = undefined; mockCanGoBack = true; mockCartCount = 2; });

it('never mounts navigation on the root splash, then reveals it for resolved Home without remounting content', () => {
  mockPath = '/'; mockSegments = [];
  const onMount = jest.fn();
  function Route() { React.useEffect(onMount, []); return <Text>Startup content</Text>; }
  const view = render(<CustomerShell><Route /></CustomerShell>);
  expect(screen.getByTestId('startup-route-container')).toBeTruthy();
  expect(screen.queryByTestId('customer-shell')).toBeNull();
  expect(screen.queryByTestId('customer-top-navigation')).toBeNull();
  expect(screen.queryByTestId('persistent-bottom-navigation')).toBeNull();
  mockSegments = ['(tabs)'];
  view.rerender(<CustomerShell><Route /></CustomerShell>);
  expect(screen.getByTestId('customer-top-navigation')).toBeTruthy();
  expect(screen.getByTestId('persistent-bottom-navigation')).toBeTruthy();
  expect(onMount).toHaveBeenCalledTimes(1);
});

it('keeps navigation hidden during deep-link resolution and on the resolved login route', () => {
  mockPath = '/'; mockSegments = [];
  const view = render(<CustomerShell><Text>Resolving link</Text></CustomerShell>);
  expect(screen.queryByTestId('customer-top-navigation')).toBeNull();
  mockPath = '/login'; mockSegments = ['(auth)', 'login'];
  view.rerender(<CustomerShell><Text>Sign in</Text></CustomerShell>);
  expect(screen.queryByTestId('customer-top-navigation')).toBeNull();
  expect(screen.queryByTestId('persistent-bottom-navigation')).toBeNull();
});

it.each(['/', '/catalog', '/menu', '/training', '/dietitian', '/consult', '/functional-training'])('owns exactly one header and tab bar on main browsing route %s', (path) => {
  mockPath = path; render(<CustomerShell><Text>Route content</Text></CustomerShell>);
  expect(screen.getAllByTestId('customer-top-navigation')).toHaveLength(1);
  expect(screen.getAllByTestId('persistent-bottom-navigation')).toHaveLength(1);
  expect(screen.getAllByLabelText('HealthyOme')).toHaveLength(1);
  expect(screen.getAllByRole('tab')).toHaveLength(5);
  expect(screen.getByLabelText('Cart, 2 items')).toBeTruthy();
});
it.each([0, 2])('renders the actual Snacks route with one local cart for %i items, Back and no shared branded header', (count) => {
  mockPath = '/snacks'; mockSegments = ['(tabs)', 'snacks'];
  mockCartCount = count;
  render(<CustomerShell><SnacksScreen /></CustomerShell>);
  expect(screen.queryByTestId('customer-top-navigation')).toBeNull();
  expect(screen.queryByLabelText('HealthyOme')).toBeNull();
  expect(screen.getAllByTestId('snacks-catalog-header')).toHaveLength(1);
  expect(screen.getAllByRole('button', { name: /cart/i })).toHaveLength(1);
  expect(screen.getByRole('button', { name: `Cart, ${count} items` })).toBeTruthy();
  expect(screen.queryByText('View Cart')).toBeNull();
  expect(screen.getAllByRole('button', { name: 'Go back' })).toHaveLength(1);
  expect(screen.getByRole('button', { name: `Cart, ${count} items` })).toHaveStyle({ minHeight: 48, minWidth: 48 });
  expect(screen.getByTestId('customer-route-content')).toHaveStyle({ paddingTop: 40, paddingBottom: 0 });
  expect(screen.getByTestId('snacks-catalog-gradient')).toHaveStyle({ paddingTop: 8 });
  expect(screen.getByTestId('persistent-bottom-navigation')).toHaveStyle({ paddingBottom: 20 });
  expect(screen.getByRole('tab', { name: 'Snacks' })).toHaveProp('accessibilityState', { selected: true });
  fireEvent.press(screen.getByRole('button', { name: `Cart, ${count} items` }));
  expect(mockNavigate).toHaveBeenCalledWith('/cart');
  fireEvent.press(screen.getByRole('button', { name: 'Go back' }));
  expect(mockBack).toHaveBeenCalledTimes(1);
});
it('keeps a cold-linked Snacks catalogue escapable to Home without navigation history', () => {
  mockPath = '/snacks'; mockSegments = ['snacks', 'index']; mockCanGoBack = false;
  render(<CustomerShell><SnacksScreen /></CustomerShell>);
  expect(screen.getAllByRole('button', { name: 'Cart, 2 items' })).toHaveLength(1);
  fireEvent.press(screen.getByRole('button', { name: 'Go back' }));
  expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
});
it.each(['/login', '/verify', '/(auth)/login', '/checkout', '/consult/health', '/product-review/snack/8', '/subscription/plans/test', '/subscription/create', '/cart', '/profile-pages/edit', '/functional-training/trainer', '/orders/my/8'])('removes redundant shell chrome for focused/detail route %s', (path) => {
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
  expect(customerShellPolicy('/profile-pages/terms').tabs).toBe(false);
  expect(customerShellPolicy('/checkout').keyboard).toBe(true);
  expect(customerShellPolicy('/login').keyboard).toBe(false);
});

it.each(['/subscription/categories', '/subscription/plans', '/profile', '/orders'])('keeps tab access but only one compact title bar on secondary list %s', (path) => {
  mockPath = path;
  render(<CustomerShell><ScreenHeader title="Route title" /></CustomerShell>);
  expect(screen.queryByTestId('customer-top-navigation')).toBeNull();
  expect(screen.queryByLabelText('HealthyOme')).toBeNull();
  expect(screen.getAllByTestId('screen-header')).toHaveLength(1);
  expect(screen.getAllByTestId('persistent-bottom-navigation')).toHaveLength(1);
  fireEvent.press(screen.getByLabelText('Cart, 2 items'));
  expect(mockNavigate).toHaveBeenCalledWith('/cart');
});

it('consumes detail system insets exactly once without a global bar or covering the CTA', () => {
  function Content() {
    const insets = useSafeAreaInsets();
    return <Text testID="remaining-insets">{JSON.stringify(insets)}</Text>;
  }
  mockPath = '/subscription/create';
  render(<CustomerShell><ScreenHeader title="Customize plan" /><Content /></CustomerShell>);
  expect(screen.getByTestId('customer-route-content')).toHaveStyle({ paddingTop: 40, paddingBottom: 20, flex: 1 });
  expect(screen.getByTestId('remaining-insets')).toHaveTextContent('{"top":0,"bottom":0,"left":0,"right":0}');
  expect(screen.queryByTestId('persistent-bottom-navigation')).toBeNull();
});
