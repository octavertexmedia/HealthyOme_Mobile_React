import React from 'react';
import { PanResponder, type GestureResponderEvent, type PanResponderGestureState } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import PlanMenuSheet, { dismissMenuGesture } from './PlanMenuSheet';
import { formatMenuDate } from './menuSchedule';

let mockError = false;
let mockLoading = false;
let mockParams: Record<string, string> = { slug: 'test-plan', planId: '555', categoryId: '1', mealTimeId: '2' };
const mockRefetch = jest.fn(); const mockQuery = jest.fn(); const mockClose = jest.fn();
const mockData = { meal_plan_type: { id: 74, name: 'Home style', available_menu_view: 'card', menu_card_image: '/static.png' }, plans: [{ id: 555, is_active: true, price: '235', category: { id: 1, name: 'Veg' }, subscription_period: { days: 1, name: 'Trial' } }, { id: 556, is_active: true, price: '245', category: { id: 2, name: 'Non-Veg' }, subscription_period: { days: 1, name: 'Trial' } }], meal_times: [{ id: 2, name: 'Lunch' }, { id: 3, name: 'Dinner' }] };
const mockMenu = { days: [{ date: '2026-10-12', meals: [{ id: 1, name: 'Published lunch', dietary_type: 'veg', meal_time_name: 'Lunch', calories: null, image: 'https://healthyome.in/real-lunch.jpg' }, { id: 2, name: 'Wrong dinner', dietary_type: 'veg', meal_time_name: 'Dinner' }, { id: 3, name: 'Published nonveg dinner', dietary_type: 'non_veg', meal_time_name: 'Dinner' }] }] };
jest.mock('expo-router', () => ({ useLocalSearchParams: () => mockParams, useRouter: () => ({ push: jest.fn(), replace: jest.fn(), canGoBack: () => false }) }));
jest.mock('@tanstack/react-query', () => ({ useQuery: (options: { queryKey: string[] }) => { mockQuery(options); return { data: options.queryKey[0] === 'subscription-menu' ? mockMenu : mockData, isLoading: mockLoading, isError: mockError && options.queryKey[0] === 'subscription-menu', refetch: mockRefetch }; } }));
jest.mock('react-native-safe-area-context', () => jest.requireActual('react-native-safe-area-context/jest/mock').default);
jest.mock('../../shared/components/PlatformIcon', () => ({ PlatformIcon: () => null }));
jest.mock('../cart/store/cart.store', () => ({ useCartStore: (select: (state: unknown) => unknown) => select({ totalItems: 0 }) }));
beforeEach(() => { jest.useFakeTimers().setSystemTime(new Date('2026-10-10T12:00:00Z')); mockError = false; mockLoading = false; mockParams = { slug: 'test-plan', planId: '555', categoryId: '1', mealTimeId: '2' }; });
afterEach(() => jest.useRealTimers());
function PlanMenu({ visible = true }: { visible?: boolean }) { return <PlanMenuSheet visible={visible} selection={{ slug: 'test-plan', ...mockParams }} onClose={mockClose} />; }
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
it('renders actual thumbnail/name rows and an honest missing-image fallback', () => {
  render(<PlanMenu />);
  expect(screen.getByLabelText('Thumbnail: Published lunch').props.source).toEqual({ uri: 'https://healthyome.in/real-lunch.jpg' });
  fireEvent(screen.getByLabelText('Thumbnail: Published lunch'), 'error');
  expect(screen.getByLabelText('No image available: Published lunch')).toBeTruthy();
  fireEvent.press(screen.getByRole('radio', { name: 'Dinner' }));
  expect(screen.getByLabelText('No image available: Wrong dinner')).toBeTruthy();
  expect(screen.queryByLabelText('Thumbnail: Published lunch')).toBeNull();
});
it('retains date, category and slot across closing and reopening the same plan', () => {
  const view = render(<PlanMenu />);
  fireEvent.press(screen.getByRole('radio', { name: 'Non-Veg' }));
  fireEvent.press(screen.getByRole('radio', { name: 'Dinner' }));
  fireEvent.press(screen.getByRole('radio', { name: formatMenuDate('2026-10-12') }));
  fireEvent.press(screen.getByRole('button', { name: 'Close day-wise menu' }));
  expect(mockClose).toHaveBeenCalledTimes(1);
  view.rerender(<PlanMenu visible={false} />); view.rerender(<PlanMenu />);
  for (const name of ['Non-Veg', 'Dinner', formatMenuDate('2026-10-12')]) expect(screen.getByRole('radio', { name }).props.accessibilityState).toEqual({ selected: true });
  expect(screen.getByText('Published nonveg dinner')).toBeTruthy();
  expect(screen.queryByText('Published lunch')).toBeNull();
});
it('supports backdrop, Android back and accessibility escape with no navigation chrome', () => {
  render(<PlanMenu />);
  fireEvent.press(screen.getByTestId('menu-backdrop', { includeHiddenElements: true }));
  fireEvent(screen.getByTestId('day-menu-modal'), 'requestClose');
  fireEvent(screen.getByTestId('day-menu-sheet'), 'accessibilityEscape');
  expect(mockClose).toHaveBeenCalledTimes(3);
  expect(screen.queryByLabelText('Go back')).toBeNull(); expect(screen.queryByLabelText('Cart')).toBeNull(); expect(screen.queryByLabelText('Home')).toBeNull();
});
it('shows loading instead of stale food and rejects malformed dates', () => {
  mockLoading = true; const view = render(<PlanMenu />);
  expect(screen.getByLabelText('Loading dated menu')).toBeTruthy(); expect(screen.queryByText('Published lunch')).toBeNull();
  mockLoading = false; mockParams.date = '2026-02-30'; view.rerender(<PlanMenu />);
  expect(screen.getByText(/selection does not belong/)).toBeTruthy();
  expect(mockQuery).toHaveBeenLastCalledWith(expect.objectContaining({ enabled: false }));
});
it('does not make short or upward movements dismiss the sheet', () => {
  expect(dismissMenuGesture(81, 0)).toBe(true); expect(dismissMenuGesture(20, 1)).toBe(true);
  expect(dismissMenuGesture(10, 2)).toBe(false); expect(dismissMenuGesture(-100, -1)).toBe(false); expect(dismissMenuGesture(40, 0.2)).toBe(false);
});
it('captures downward header movement before nested title controls and releases to close', () => {
  const spy = jest.spyOn(PanResponder, 'create');
  render(<PlanMenu />);
  const config = spy.mock.calls[0][0];
  const event = {} as GestureResponderEvent;
  expect(config.onMoveShouldSetPanResponderCapture?.(event, { dy: 20, dx: 1 } as PanResponderGestureState)).toBe(true);
  expect(config.onMoveShouldSetPanResponderCapture?.(event, { dy: 2, dx: 20 } as PanResponderGestureState)).toBe(false);
  expect(config.onMoveShouldSetPanResponderCapture?.(event, { dy: -20, dx: 0 } as PanResponderGestureState)).toBe(false);
  config.onPanResponderRelease?.(event, { dy: 100, vy: 0 } as PanResponderGestureState);
  expect(mockClose).toHaveBeenCalledTimes(1); spy.mockRestore();
});
