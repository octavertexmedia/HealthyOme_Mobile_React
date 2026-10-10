import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { CheckoutAddressPicker } from './CheckoutAddressPicker';
import { checkoutAddress } from './utils/checkoutAddress';

const addresses = [{ id: 1, label: 'Home', address: 'Fixture home', is_default: true }, { id: 2, label: 'Work', address: 'Fixture work', is_default: false }];
it('uses the default only initially and never silently replaces a deleted selection', () => {
  expect(checkoutAddress(addresses, null)?.id).toBe(1);
  expect(checkoutAddress(addresses, 2)?.id).toBe(2);
  expect(checkoutAddress([addresses[0]], 2)).toBeUndefined();
});
it('selects an order-local id without mutating the account default', () => {
  const onSelect = jest.fn();
  render(<CheckoutAddressPicker addresses={addresses} selectedId={1} onSelect={onSelect} busy={false} onManage={jest.fn()} />);
  fireEvent.press(screen.getByRole('radio', { name: 'Work: Fixture work' }));
  expect(onSelect).toHaveBeenCalledWith(2);
  expect(addresses[0].is_default).toBe(true);
  expect(addresses[1].is_default).toBe(false);
});
it('locks selection during checkout', () => {
  const onSelect = jest.fn();
  render(<CheckoutAddressPicker addresses={addresses} selectedId={2} onSelect={onSelect} busy onManage={jest.fn()} />);
  const home = screen.getByRole('radio', { name: 'Home: Fixture home' });
  expect(home).toBeDisabled();
  fireEvent.press(home);
  expect(onSelect).not.toHaveBeenCalled();
});
