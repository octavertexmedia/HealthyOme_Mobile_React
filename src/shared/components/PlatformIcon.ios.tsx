import React from 'react';
import { SymbolView } from 'expo-symbols';
import { FontAwesome5 } from '@expo/vector-icons';
import type { NavigationIcon } from './PlatformIcon';

const symbols: Record<Exclude<NavigationIcon, 'nutrition'>, React.ComponentProps<typeof SymbolView>['name']> = {
  home: 'house', restaurant: 'fork.knife', barbell: 'dumbbell', receipt: 'bag', medical: 'stethoscope', location: 'mappin.and.ellipse', profile: 'person.crop.circle', cart: 'cart', back: 'chevron.left', close: 'xmark',
};
/** SF Symbols except Snacks: iOS 26.5 has no cookie symbol; use the bundled vector glyph. */
export function PlatformIcon({ name, size = 24, color = '#183829' }: { name: NavigationIcon; size?: number; color?: string }) {
  if (name === 'nutrition') return <FontAwesome5 name="cookie-bite" solid size={size} color={color} />;
  return <SymbolView name={symbols[name]} size={size} tintColor={color} weight="regular" type="monochrome" style={{ width: size, height: size }} />;
}
