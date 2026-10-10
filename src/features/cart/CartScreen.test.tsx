import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import CartScreen from '../../../app/cart';

const mockPush = jest.fn();
const mockUpdateQuantity = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush, back: jest.fn() }) }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('../../shared/components/PlatformIcon', () => ({ PlatformIcon: () => null }));
jest.mock('./hooks/useCheckoutQuote', () => ({ useCheckoutQuote: () => ({ data: undefined }) }));
jest.mock('./store/cart.store', () => ({
  useCartStore: () => ({
    items: [{ id: '42', name: 'Test meal', price: 100, qty: 1 }],
    totalItems: 1, totalPrice: 100, updateQuantity: mockUpdateQuantity, clearCart: jest.fn(),
  }),
}));

it('lets a customer reopen meal details directly from the cart', () => {
  render(<CartScreen />);
  fireEvent.press(screen.getByRole('link', { name: 'View Test meal details' }));
  expect(mockPush).toHaveBeenCalledWith('/meal/42');
  expect(mockUpdateQuantity).not.toHaveBeenCalled();
});

it('keeps checkout available after exposing product navigation', () => {
  render(<CartScreen />);
  fireEvent.press(screen.getByText(/Proceed to Checkout/));
  expect(mockPush).toHaveBeenCalledWith('/checkout');
});
