import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { PlatformIcon } from './PlatformIcon.ios';
const { PlatformIcon: AndroidIcon } = jest.requireActual<typeof import('./PlatformIcon')>('./PlatformIcon.tsx');
jest.mock('@expo/vector-icons', () => ({ MaterialIcons: (props: { name: string }) => {
  const { Text } = jest.requireActual('react-native'); return <Text testID="material-icon">{props.name}</Text>;
} }));
jest.mock('expo-symbols', () => ({ SymbolView: (props: { name: string }) => {
  const { Text } = jest.requireActual('react-native'); return <Text testID="sf-symbol">{props.name}</Text>;
} }));
it.each([['profile', 'person.crop.circle'], ['cart', 'cart'], ['location', 'mappin.and.ellipse'], ['back', 'chevron.left']] as const)('uses genuine SF Symbol names for iOS %s', (name, symbol) => {
  render(<PlatformIcon name={name} />); expect(screen.getByTestId('sf-symbol')).toHaveTextContent(symbol);
});
it.each([['profile', 'person-outline'], ['cart', 'shopping-cart'], ['location', 'location-on'], ['back', 'arrow-back']] as const)('uses Material navigation icons for Android %s', (name, symbol) => {
  render(<AndroidIcon name={name} />); expect(screen.getByTestId('material-icon')).toHaveTextContent(symbol);
});
