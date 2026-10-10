import React from 'react';
import { Image } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import PlanDetails from './PlanDetails';
import type { PlanOverview } from './api/subscription.api';

const mockPush = jest.fn(); const mockRefetch = jest.fn();
let mockError = false;
let mockData: PlanOverview;
jest.mock('expo-router', () => ({ useLocalSearchParams: () => ({ slug: 'test-plan' }), useRouter: () => ({ push: mockPush, canGoBack: () => false, replace: jest.fn() }) }));
jest.mock('@tanstack/react-query', () => ({ useQuery: (options: { queryKey: string[] }) => ({ data: options.queryKey[0] === 'subscription-menu' ? { days: [{ date: '2026-10-12', meals: [{ id: 42, name: 'Published lunch', meal_time_name: 'Lunch', dietary_type: 'veg' }] }] } : mockData, isError: mockError, isLoading: false, refetch: mockRefetch }) }));
jest.mock('../auth/store/auth.store', () => ({ useAuthStore: (fn: (state: unknown) => unknown) => fn({ isAuthenticated: false }) }));
jest.mock('./api/subscription.api', () => ({ subscriptionApi: {} }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('../../shared/components/PlatformIcon', () => ({ PlatformIcon: () => null }));
jest.mock('../cart/store/cart.store', () => ({ useCartStore: (select: (state: unknown) => unknown) => select({ totalItems: 0 }) }));
beforeEach(() => {
  mockError = false;
  const type = { id: 74, name: 'Test plan', image_url: 'https://healthyome.in/hero.png', available_menu_view: 'card' as const, menu_card_image_url: 'https://healthyome.in/menu.png' };
  mockData = { slug: 'test-plan', meal_plan_type: type, plans: [{ id: 1, meal_plan_type: type, category: { id: 2, name: 'Veg' }, subscription_period: { id: 3, name: '1 Day Trial', days: 1 }, price: '239.50', is_active: true }], starting_price: '239.50', starting_period_label: '1 Day Trial', available_meals: [], meal_times: [{ id: 2, name: 'Lunch', delivery_window: '12PM–2PM' }], can_subscribe: true };
});
it('always opens backend dates even when marketing config has a static menu card', () => {
  render(<PlanDetails />);
  expect(screen.UNSAFE_queryAllByType(Image)).toHaveLength(0);
  expect(screen.getByText('Lunch: Published lunch')).toBeTruthy();
  expect(screen.getByText('Quick subscribe · ₹239.5')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'View day-wise menu schedule' }));
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/subscription/menu/[slug]', params: { slug: 'test-plan', planId: '1', categoryId: '2', mealTimeId: '2' } });
});
it('opens the day-wise schedule when a plan uses list mode, without inventing a rating', () => {
  mockData.meal_plan_type.available_menu_view = 'list'; render(<PlanDetails />);
  expect(screen.queryByText(/4\.8/)).toBeNull();
  expect(screen.getByText('Lunch: Published lunch')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'View day-wise menu schedule' }));
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/subscription/menu/[slug]', params: { slug: 'test-plan', planId: '1', categoryId: '2', mealTimeId: '2' } });
});
it('preserves a selected price-row identity into customization', () => {
  render(<PlanDetails />); fireEvent.press(screen.getByText('1 Day Trial · Veg'));
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/subscription/create', params: { plan: 'test-plan', planId: '1' } });
});
it('blocks both purchase actions on commercial unavailability or failed loads', () => {
  mockData.can_subscribe = false; render(<PlanDetails />);
  expect(screen.getByRole('button', { name: 'Customize plan' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Quick subscribe · ₹239.5' })).toBeDisabled();
});
it('offers an explicit retry instead of showing an empty successful plan', () => {
  mockError = true; render(<PlanDetails />);
  fireEvent.press(screen.getByText('Retry plan')); expect(mockRefetch).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('button', { name: 'Customize plan' })).toBeDisabled();
});
