import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';

export type NavigationIcon = 'home' | 'restaurant' | 'nutrition' | 'barbell' | 'receipt' | 'medical' | 'location' | 'profile' | 'cart' | 'back' | 'close';
const materialNames: Record<NavigationIcon, React.ComponentProps<typeof MaterialIcons>['name']> = {
  home: 'home', restaurant: 'restaurant', nutrition: 'cookie', barbell: 'fitness-center', receipt: 'receipt-long', medical: 'medical-services', location: 'location-on', profile: 'person-outline', cart: 'shopping-cart', back: 'arrow-back', close: 'close',
};
export function PlatformIcon({ name, size = 24, color = '#183829' }: { name: NavigationIcon; size?: number; color?: string }) {
  return <MaterialIcons name={materialNames[name]} size={size} color={color} />;
}
