import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import Categories from '../../../app/subscription/categories';
import Plans from '../../../app/subscription/plans';
import Details from '../../../app/subscription/plans/[slug]';
import Customize from '../../../app/subscription/create';
import MySubscriptions from '../../../app/subscription/my';
import Onboarding from '../../../app/onboarding';
import LegacyLocation from '../../../app/onboarding/location';
import { defaultBrowsePlan, matchesBrowseCategory, nextSubscriptionStartDate } from './browsePolicy';
import { safeAuthRedirect } from '../auth/authRedirect';
import { useSubscriptionDraft } from './subscriptionDraft';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockPay = jest.fn();
const mockQuery = jest.fn();
let mockParams: Record<string, string> = {};
const mockPlan = { id: 1, is_active: true, price: '123', meal_plan_type: { id: 9, name: 'Test pack' }, subscription_period: { id: 3, name: '3 days', days: 3 }, category: { id: 1, name: 'Veg' } };
const mockCategory = { id: 2, slug: 'test-category', title: 'Test category', subtitle: '', badge: '', image: '', image_url: null, gradient_from: '', gradient_to: '', image_object_fit: 'cover' as const, meal_plan_type_ids: [9], filter_slugs: [], filter_name_contains: [], filter_name_excludes: [] };
const mockCard = { slug: 'test-pack', meal_plan_type: mockPlan.meal_plan_type, starting_price: '123', starting_period_label: '3 days', preview_images: [], plans_count: 1 };
const mockTimes = { meal_times: [{ id: 2, name: 'Lunch' }], max_meal_times_selectable: 1 };
const mockOverview = { slug: 'test-pack', meal_plan_type: mockPlan.meal_plan_type, plans: [mockPlan, { ...mockPlan, id: 2, price: '205', subscription_period: { id: 5, name: '5 days', days: 5 } }], starting_price: '123', starting_period_label: '3 days', meal_times: mockTimes.meal_times, available_meals: [], can_subscribe: true };
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, canGoBack: () => false, back: jest.fn() }),
  useLocalSearchParams: () => mockParams,
  Redirect: ({ href }: { href: string }) => { mockReplace(href); return null; },
}));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('../../shared/storage/mmkv', () => ({ storage: { set: jest.fn().mockResolvedValue(undefined) } }));
jest.mock('../auth/store/auth.store', () => ({ useAuthStore: (select: (state: unknown) => unknown) => select({ isAuthenticated: false, user: null }) }));
jest.mock('../payments/hooks/usePayment', () => ({ usePayment: () => ({ pay: mockPay, loading: false }) }));
jest.mock('./api/subscription.api', () => ({ subscriptionApi: {} }));
jest.mock('../addresses/api/addresses.api', () => ({ addressesApi: {} }));
jest.mock('@tanstack/react-query', () => ({
  useQuery: (options: { queryKey: string[]; enabled?: boolean }) => {
    mockQuery(options);
    const data = ({ 'subscription-browse-categories': [mockCategory], 'subscription-browse-catalog': { meal_plans: [mockCard] }, 'subscription-overview': mockOverview, 'subscription-plans': mockOverview.plans, 'subscription-meal-times': mockTimes } as Record<string, unknown>)[options.queryKey[0]];
    return { data, isLoading: false, isError: false };
  },
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}));
beforeEach(() => { mockParams = {}; useSubscriptionDraft.getState().clear(); });

it('opens public categories, plans and details without authentication', () => {
  const categories = render(<Categories />);
  fireEvent.press(screen.getByRole('button', { name: 'Test category' }));
  expect(mockPush).toHaveBeenLastCalledWith({ pathname: '/subscription/plans', params: { category: 'test-category' } });
  categories.unmount();
  mockParams = { category: 'test-category' };
  const plans = render(<Plans />);
  fireEvent.press(screen.getByRole('button', { name: 'Test pack' }));
  expect(mockPush).toHaveBeenLastCalledWith({ pathname: '/subscription/plans/[slug]', params: { slug: 'test-pack' } });
  plans.unmount();
  mockParams = { slug: 'test-pack' };
  render(<Details />);
  fireEvent.press(screen.getByText('Customize plan'));
  expect(mockPush).toHaveBeenLastCalledWith({ pathname: '/subscription/create', params: { plan: 'test-pack' } });
  expect(mockPay).not.toHaveBeenCalled();
});

it('allows guest customization and only gates Checkout, retaining selections', () => {
  mockParams = { plan: 'test-pack', planId: '1', startDate: '2026-10-12', mealTimes: '2', vegDays: '0,4', whatsapp: 'false' };
  render(<Customize />);
  expect(screen.getByText('₹123 estimated total')).toBeTruthy();
  fireEvent.press(screen.getByText('5 days'));
  expect(screen.getByText('₹205 estimated total')).toBeTruthy();
  fireEvent.press(screen.getByText('Checkout'));
  const destination = mockPush.mock.calls.at(-1)?.[0];
  expect(destination.pathname).toBe('/(auth)/login');
  expect(safeAuthRedirect(destination.params.redirect)).toBe(destination.params.redirect);
  const params = new URLSearchParams(destination.params.redirect.split('?')[1]);
  expect(params.get('planId')).toBe('2');
  expect(params.get('plan')).toBe('test-pack');
  expect(params.get('startDate')).toBe('2026-10-12');
  expect(params.get('mealTimes')).toBe('2');
  expect(params.get('vegDays')).toBe('0,4');
  expect(params.get('whatsapp')).toBe('false');
  expect(mockQuery).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ['addresses'], enabled: false }));
  expect(mockPay).not.toHaveBeenCalled();
});

it('keeps personal subscriptions private with a specific login return path', () => {
  render(<MySubscriptions />);
  expect(screen.getByText('Sign in to manage your plans')).toBeTruthy();
  expect(mockQuery).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ['subscriptions', 'all'], enabled: false }));
  fireEvent.press(screen.getByText('Sign in'));
  expect(mockPush).toHaveBeenLastCalledWith({ pathname: '/(auth)/login', params: { redirect: '/subscription/my' } });
});

it('disables Checkout after the guest removes the last meal time', () => {
  mockParams = { plan: 'test-pack', planId: '1' };
  render(<Customize />);
  fireEvent.press(screen.getByText('Lunch'));
  expect(screen.getByRole('button', { name: 'Checkout' })).toBeDisabled();
  fireEvent.press(screen.getByText('Checkout'));
  expect(mockPush).not.toHaveBeenCalled();
  expect(mockPay).not.toHaveBeenCalled();
});

it('provides a back destination for direct public links', () => {
  render(<Categories />);
  fireEvent.press(screen.getByRole('button', { name: 'Go back' }));
  expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
});

it('skips onboarding directly to Home, with no pickup or GPS requirement', () => {
  const onboarding = render(<Onboarding />);
  fireEvent.press(screen.getByText('Skip'));
  expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
  onboarding.unmount();
  render(<LegacyLocation />);
  expect(mockReplace).toHaveBeenLastCalledWith('/(tabs)');
});

it('uses backend category membership and skips a Sunday start', () => {
  expect(matchesBrowseCategory(mockCard, mockCategory)).toBe(true);
  expect(matchesBrowseCategory(mockCard, { ...mockCategory, meal_plan_type_ids: [77] })).toBe(false);
  expect(nextSubscriptionStartDate(new Date(2026, 9, 10, 12))).toBe('2026-10-12');
});

it('retains a changed duration when returning from Cart without an explicit override', () => {
  mockParams = { plan: 'test-pack', planId: '1' };
  const first = render(<Customize />);
  fireEvent.press(screen.getByText('5 days'));
  first.unmount(); mockParams = { plan: 'test-pack' };
  render(<Customize />);
  expect(screen.getByText('₹205 estimated total')).toBeTruthy();
});
it('does not silently reselect a deliberately empty meal-slot selection on return', () => {
  mockParams = { plan: 'test-pack', planId: '1', mealTimes: '' };
  render(<Customize />);
  expect(screen.getByRole('button', { name: 'Checkout' })).toBeDisabled();
});
it('gates Quick subscribe at login and preserves the exact plan return path', () => {
  mockParams = { slug: 'test-pack' }; render(<Details />);
  fireEvent.press(screen.getByText('Quick subscribe · ₹123'));
  expect(mockPush).toHaveBeenLastCalledWith({ pathname: '/(auth)/login', params: { redirect: '/subscription/plans/test-pack' } });
  expect(mockPay).not.toHaveBeenCalled();
});

it('defaults to the actual Veg row even when Non-Veg is returned first', () => {
  const veg = { ...mockPlan, id: 567, category: { id: 79, name: 'Veg' }, subscription_period: { id: 24, name: 'Monthly', days: 24 } };
  const nonVeg = { ...veg, id: 582, category: { id: 42, name: 'Non-Veg' } };
  expect(defaultBrowsePlan([nonVeg, veg])?.id).toBe(567);
});
