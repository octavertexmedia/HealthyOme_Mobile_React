import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import PlanMenu from './PlanMenu';
import { formatMenuDate } from './menuSchedule';

let mockError = false;
let mockParams: Record<string, string> = { slug: 'test-plan', planId: '555', categoryId: '1', mealTimeId: '2' };
const mockRefetch = jest.fn(); const mockQuery = jest.fn();
const mockData = { meal_plan_type: { id: 74, name: 'Home style', available_menu_view: 'card', menu_card_image: '/static.png' }, plans: [{ id: 555, is_active: true, price: '235', category: { id: 1, name: 'Veg' }, subscription_period: { days: 1, name: 'Trial' } }], meal_times: [{ id: 2, name: 'Lunch' }] };
const mockMenu = { days: [{ date: '2026-10-12', meals: [{ id: 1, name: 'Published lunch', dietary_type: 'veg', meal_time_name: 'Lunch', calories: null }, { id: 2, name: 'Wrong dinner', dietary_type: 'veg', meal_time_name: 'Dinner' }] }] };
jest.mock('expo-router', () => ({ useLocalSearchParams: () => mockParams, useRouter: () => ({ push: jest.fn(), replace: jest.fn(), canGoBack: () => false }) }));
jest.mock('@tanstack/react-query', () => ({ useQuery: (options: { queryKey: string[] }) => { mockQuery(options); return { data: options.queryKey[0] === 'subscription-menu' ? mockMenu : mockData, isLoading: false, isError: mockError && options.queryKey[0] === 'subscription-menu', refetch: mockRefetch }; } }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) }));
jest.mock('../../shared/components/PlatformIcon', () => ({ PlatformIcon: () => null }));
jest.mock('../cart/store/cart.store', () => ({ useCartStore: (select: (state: unknown) => unknown) => select({ totalItems: 0 }) }));
beforeEach(() => { jest.useFakeTimers().setSystemTime(new Date('2026-10-10T12:00:00Z')); mockError = false; mockParams = { slug: 'test-plan', planId: '555', categoryId: '1', mealTimeId: '2' }; });
afterEach(() => jest.useRealTimers());
it('uses live dated data, not the static card, and applies the selected slot', () => {
  render(<PlanMenu />); expect(screen.getByText('Published lunch')).toBeTruthy();
  expect(screen.queryByText('Wrong dinner')).toBeNull(); expect(screen.getByText('Nutrition not published')).toBeTruthy();
  expect(mockQuery).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ['subscription-menu', 'test-plan', 74, '2026-10-10', '2026-11-07'], enabled: true }));
});
it('labels an unpublished selected day without creating placeholder food', () => {
  render(<PlanMenu />); fireEvent.press(screen.getByRole('radio', { name: formatMenuDate('2026-10-11') }));
  expect(screen.getByText(/No published menu for Sun/)).toBeTruthy(); expect(screen.queryByText('Published lunch')).toBeNull();
});
it('rejects a selected subscription row from a different plan', () => {
  mockParams.planId = '999'; render(<PlanMenu />);
  expect(screen.getByText(/selection does not belong/)).toBeTruthy();
  expect(mockQuery).toHaveBeenLastCalledWith(expect.objectContaining({ enabled: false }));
});
it('shows a real failed request with an explicit retry rather than stale menu content', () => {
  mockError = true; render(<PlanMenu />); expect(screen.queryByText('Published lunch')).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: 'Retry menu' })); expect(mockRefetch).toHaveBeenCalledTimes(1);
});
