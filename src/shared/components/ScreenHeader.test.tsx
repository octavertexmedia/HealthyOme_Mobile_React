import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ScreenHeader, screenHeaderMetrics } from './ScreenHeader';

let mockCanGoBack = false;
const mockBack = jest.fn(); const mockReplace = jest.fn(); const mockNavigate = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ back: mockBack, replace: mockReplace, navigate: mockNavigate, canGoBack: () => mockCanGoBack }) }));
jest.mock('./PlatformIcon', () => ({ PlatformIcon: () => null }));
jest.mock('../../features/cart/store/cart.store', () => ({ useCartStore: (select: (state: unknown) => unknown) => select({ totalItems: 3 }) }));
beforeEach(() => { mockCanGoBack = false; });

it('renders just one title/back/cart row with a deep-link fallback', () => {
  render(<ScreenHeader title="Plan details" fallback="/subscription/plans" />);
  expect(screen.getAllByRole('header')).toHaveLength(1);
  expect(screen.queryByLabelText('HealthyOme')).toBeNull();
  fireEvent.press(screen.getByLabelText('Go back'));
  expect(mockReplace).toHaveBeenCalledWith('/subscription/plans');
  fireEvent.press(screen.getByLabelText('Cart, 3 items'));
  expect(mockNavigate).toHaveBeenCalledWith('/cart');
});
it('respects navigation history and omits unrelated cart actions during checkout', () => {
  mockCanGoBack = true;
  render(<ScreenHeader title="Checkout" backLabel="Back to cart" fallback="/cart" showCart={false} />);
  fireEvent.press(screen.getByLabelText('Back to cart'));
  expect(mockBack).toHaveBeenCalledTimes(1);
  expect(screen.queryByLabelText('Cart, 3 items')).toBeNull();
});
it('uses Android Material sizing and iOS compact centered sizing', () => {
  expect(screenHeaderMetrics('android')).toEqual({ minHeight: 64, controlSize: 48, titleSize: 20, titleAlign: 'left' });
  expect(screenHeaderMetrics('ios')).toEqual({ minHeight: 52, controlSize: 44, titleSize: 17, titleAlign: 'center' });
});
it('keeps a contextual action reachable without a duplicated brand row', () => {
  const clear = jest.fn();
  render(<ScreenHeader title="Cart" showCart={false} action={{ label: 'Clear', onPress: clear }} />);
  fireEvent.press(screen.getByRole('button', { name: 'Clear' }));
  expect(clear).toHaveBeenCalledTimes(1);
});
