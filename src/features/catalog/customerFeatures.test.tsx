import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { customerFeatures, customerTabs, homeFeatures } from './customerFeatures';
import { CustomerFeatureGate } from './components/CustomerFeatureGate';

const mockRedirect = jest.fn();
const mockRefetch = jest.fn();
let mockSettings: { data?: Parameters<typeof customerFeatures>[0]; isLoading: boolean; isError?: boolean };
jest.mock('expo-router', () => ({ Redirect: ({ href }: { href: string }) => { mockRedirect(href); return null; } }));
jest.mock('./hooks/useMeals', () => ({ useSiteSettings: () => ({ ...mockSettings, refetch: mockRefetch }) }));

it('matches the current five-tab order and retains both catalogues when enabled', () => {
  expect(customerTabs({ home_quick_meals_card_enabled: false, healthy_snacks_enabled: true }).map((tab) => tab.title))
    .toEqual(['Home', 'Snacks', 'Training', 'Orders', 'Dietitian']);
  expect(customerTabs({ healthy_snacks_enabled: true }).map((tab) => tab.title))
    .toEqual(['Home', 'Meals', 'Snacks', 'Training', 'Orders', 'Dietitian']);
});
it('waits for settings, then uses the newly merged web-main Snacks default', () => {
  expect(customerFeatures()).toEqual({ quickMeals: false, snacks: false, training: false });
  expect(customerFeatures({}).snacks).toBe(true);
  expect(customerTabs({ healthy_snacks_enabled: false, functional_training_customer_enabled: false }).map((tab) => tab.title))
    .toEqual(['Home', 'Meals', 'Orders', 'Dietitian']);
});
it('keeps Home card visibility separate from catalogue/navigation availability', () => {
  const settings = { healthy_snacks_enabled: true, home_healthy_snacks_card_enabled: false, home_consult_card_enabled: false };
  expect(homeFeatures(settings).showSnacks).toBe(false);
  expect(customerFeatures(settings).snacks).toBe(true);
  expect(customerTabs(settings).some((tab) => tab.title === 'Dietitian')).toBe(true);
});
it.each(['snacks', 'training'] as const)('guards a disabled direct %s route without mounting its content', (feature) => {
  mockSettings = { data: { healthy_snacks_enabled: false, functional_training_customer_enabled: false }, isLoading: false };
  const child = jest.fn(() => <Text>Private test content</Text>);
  const Child = child;
  render(<CustomerFeatureGate feature={feature}><Child /></CustomerFeatureGate>);
  expect(mockRedirect).toHaveBeenCalledWith('/(tabs)');
  expect(child).not.toHaveBeenCalled();
});
it('waits for settings, offers error retry, and reacts to a flag change', () => {
  mockSettings = { isLoading: true };
  const view = render(<CustomerFeatureGate feature="snacks"><Text>Snack catalogue</Text></CustomerFeatureGate>);
  expect(screen.getByLabelText('Loading store settings')).toBeTruthy();
  mockSettings = { isLoading: false, isError: true };
  view.rerender(<CustomerFeatureGate feature="snacks"><Text>Snack catalogue</Text></CustomerFeatureGate>);
  fireEvent.press(screen.getByText('Retry store settings'));
  expect(mockRefetch).toHaveBeenCalledTimes(1);
  mockSettings = { isLoading: false, data: { healthy_snacks_enabled: true } };
  view.rerender(<CustomerFeatureGate feature="snacks"><Text>Snack catalogue</Text></CustomerFeatureGate>);
  expect(screen.getByText('Snack catalogue')).toBeTruthy();
});
