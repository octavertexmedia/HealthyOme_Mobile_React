import React from 'react';
import { SymbolView } from 'expo-symbols';
import type { NavigationIcon } from './PlatformIcon';

const symbols: Record<NavigationIcon, React.ComponentProps<typeof SymbolView>['name']> = {
  home: 'house', restaurant: 'fork.knife', nutrition: 'carrot', barbell: 'dumbbell', receipt: 'bag', medical: 'stethoscope', location: 'mappin.and.ellipse', profile: 'person.crop.circle', cart: 'cart', back: 'chevron.left', close: 'xmark',
};
/** The already-linked native view renders Apple's SF Symbols. */
export function PlatformIcon({ name, size = 24, color = '#183829' }: { name: NavigationIcon; size?: number; color?: string }) {
  return <SymbolView name={symbols[name]} size={size} tintColor={color} weight="regular" type="monochrome" style={{ width: size, height: size }} />;
}
