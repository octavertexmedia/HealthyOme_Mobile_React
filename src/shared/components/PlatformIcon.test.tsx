import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { PlatformIcon } from './PlatformIcon.ios';
jest.mock('expo-symbols', () => ({ SymbolView: (props: { name: string }) => {
  const { Text } = jest.requireActual('react-native'); return <Text testID="sf-symbol">{props.name}</Text>;
} }));
it.each([['profile', 'person.crop.circle'], ['cart', 'cart'], ['location', 'mappin.and.ellipse']] as const)('uses genuine SF Symbol names for iOS %s', (name, symbol) => {
  render(<PlatformIcon name={name} />); expect(screen.getByTestId('sf-symbol')).toHaveTextContent(symbol);
});
