import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import CheckoutScreen from '../../../app/checkout';
import { addressesApi } from '../addresses/api/addresses.api';

const mockPush = jest.fn();
const mockPay = jest.fn();
const mockRefetch = jest.fn();
let mockAuth = { isAuthenticated: true, user: { id: 1, email: 'fixture@example.invalid' }, sessionRevision: 1 };
let mockAddressQuery: { data: { id: number; label: string; address: string; is_default: boolean }[]; isLoading: boolean; isError: boolean };
const mockQuote = {
  can_checkout: true, warnings: [], error: null, meets_minimum_order: true,
  subtotal: 300, shipping: 0, discount: 0, payable_total: 300,
  cart: { items: [{ meal_item_id: 7, snack_item_id: null, custom_bowl_id: null, quantity: 1 }] },
};
const mockProjection = { lines: [{ meal_item_id: 7, quantity: 1 }], customBowlItems: [], unsupportedItems: [] };
const mockUseQuote = jest.fn();
const mockCart = { items: [{ id: '7', name: 'Fixture meal', qty: 1, price: 300 }], totalPrice: 300, clearCart: jest.fn(), updateQuantity: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush, back: jest.fn() }), useLocalSearchParams: () => ({}) }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('../../shared/components/PlatformIcon', () => ({ PlatformIcon: () => null }));
jest.mock('@tanstack/react-query', () => ({ useQuery: () => mockAddressQuery }));
jest.mock('./hooks/useCheckoutQuote', () => ({ useCheckoutQuote: (options: unknown) => mockUseQuote(options) }));
jest.mock('../catalog/hooks/useMeals', () => ({ useSiteSettings: () => ({ data: {} }) }));
jest.mock('../payments/hooks/usePayment', () => ({ usePayment: () => ({ pay: mockPay, loading: false }) }));
jest.mock('./store/cart.store', () => ({ useCartStore: () => mockCart }));
jest.mock('../auth/store/auth.store', () => ({ useAuthStore: Object.assign((select?: (state: typeof mockAuth) => unknown) => select ? select(mockAuth) : mockAuth, { getState: () => mockAuth }) }));
jest.mock('../addresses/api/addresses.api', () => ({ addressesApi: { list: jest.fn(), setDefault: jest.fn(), update: jest.fn() } }));

beforeEach(() => {
  mockAuth = { isAuthenticated: true, user: { id: 1, email: 'fixture@example.invalid' }, sessionRevision: 1 };
  mockAddressQuery = { data: [{ id: 1, label: 'Home', address: 'Fixture home', is_default: true }, { id: 2, label: 'Work', address: 'Fixture work', is_default: false }], isLoading: false, isError: false };
  mockPay.mockReset().mockResolvedValue({ status: 'cancelled' });
  mockRefetch.mockReset().mockResolvedValue({ data: mockQuote, isError: false });
  mockUseQuote.mockReset().mockImplementation(() => ({ data: mockQuote, isFetching: false, refetch: mockRefetch, projection: mockProjection }));
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

it('binds quote, payment order and fulfillment to the same order-local address, not the account default', async () => {
  render(<CheckoutScreen />);
  fireEvent.press(screen.getByRole('radio', { name: 'Work: Fixture work' }));
  expect(mockUseQuote).toHaveBeenLastCalledWith(expect.objectContaining({ addressId: 2, enabled: true }));
  fireEvent.press(screen.getByRole('button', { name: 'Proceed to payment' }));
  await waitFor(() => expect(mockPay).toHaveBeenCalledTimes(1));
  expect(mockPay).toHaveBeenCalledWith(expect.objectContaining({ order: expect.objectContaining({ address_id: 2 }), fulfillment: expect.objectContaining({ address_id: 2 }) }));
  expect(addressesApi.setDefault).not.toHaveBeenCalled();
  expect(addressesApi.update).not.toHaveBeenCalled();
});
it('blocks payment if the selected address was removed during refresh', async () => {
  let resolveQuote!: (value: unknown) => void;
  mockRefetch.mockReturnValue(new Promise((resolve) => { resolveQuote = resolve; }));
  const view = render(<CheckoutScreen />);
  fireEvent.press(screen.getByRole('radio', { name: 'Work: Fixture work' }));
  fireEvent.press(screen.getByRole('button', { name: 'Proceed to payment' }));
  mockAddressQuery.data = [mockAddressQuery.data[0]];
  view.rerender(<CheckoutScreen />);
  await act(async () => resolveQuote({ data: mockQuote, isError: false }));
  expect(mockPay).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Proceed to payment' })).toBeDisabled();
});
it('rejects a failed quote refresh even if cached data looked payable', async () => {
  mockRefetch.mockResolvedValue({ data: mockQuote, isError: true });
  render(<CheckoutScreen />);
  fireEvent.press(screen.getByRole('button', { name: 'Proceed to payment' }));
  await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('Checkout unavailable', expect.any(String)));
  expect(mockPay).not.toHaveBeenCalled();
});
it('keeps guests at sign-in without payment or default-address writes', () => {
  mockAuth.isAuthenticated = false;
  mockAddressQuery.data = [];
  render(<CheckoutScreen />);
  fireEvent.press(screen.getByRole('button', { name: 'Sign in to checkout' }));
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/(auth)/login', params: { redirect: '/checkout' } });
  expect(mockPay).not.toHaveBeenCalled();
  expect(addressesApi.setDefault).not.toHaveBeenCalled();
});
