import React from 'react';
import { render } from '@testing-library/react-native';
import MenuScreen from '../../../app/(tabs)/menu';
import MealDetail from '../../../app/meal/[id]';

const mockRedirect = jest.fn();
const mockMeals = jest.fn();
jest.mock('expo-router', () => ({ Redirect: ({ href }: { href: string }) => { mockRedirect(href); return null; } }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('./hooks/useMeals', () => ({
  useSiteSettings: () => ({ data: { home_quick_meals_card_enabled: false }, isLoading: false }),
  useInfiniteMeals: mockMeals,
  useMeal: mockMeals,
}));
jest.mock('../cart/store/cart.store', () => ({ useCartStore: jest.fn() }));
jest.mock('../favourites/hooks/useFavourites', () => ({ useIsFavourite: jest.fn(), useToggleFavourite: jest.fn() }));
jest.mock('../auth/store/auth.store', () => ({ useAuthStore: jest.fn() }));
jest.mock('./api/reviews.api', () => ({ reviewsApi: {} }));
jest.mock('../cart/api/cart.api', () => ({ cartApi: {} }));

it.each([MenuScreen, MealDetail])('does not expose a disabled quick-meal surface through a direct route', (Screen) => {
  render(<Screen />);
  expect(mockRedirect).toHaveBeenCalledWith('/(tabs)');
  expect(mockMeals).not.toHaveBeenCalled();
});
