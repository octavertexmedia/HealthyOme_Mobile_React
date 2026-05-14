import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { mealsApi } from '../api/meals.api';

export const useInfiniteMeals = (params: { search?: string; category?: number }) => {
  return useInfiniteQuery({
    queryKey: ['meals', 'infinite', params.search ?? '', params.category ?? null],
    queryFn: ({ pageParam }) =>
      mealsApi.getMealsPage({
        page: pageParam as number,
        search: params.search,
        category: params.category,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) => last.nextPage,
    staleTime: 60 * 1000,
  });
};

export const useMeals = () => {
  return useQuery({
    queryKey: ['meals'],
    queryFn: mealsApi.getMeals,
    staleTime: 5 * 60 * 1000,
  });
};

export const useMeal = (id: number) => {
  return useQuery({
    queryKey: ['meal', id],
    queryFn: () => mealsApi.getMeal(id),
    staleTime: 10 * 60 * 1000,
    enabled: !!id,
  });
};

export const useFeaturedMeals = () => {
  return useQuery({
    queryKey: ['meals', 'featured'],
    queryFn: mealsApi.getFeaturedMeals,
    staleTime: 5 * 60 * 1000,
  });
};

export const useMealsByCategory = (categoryId: number) => {
  return useQuery({
    queryKey: ['meals', 'category', categoryId],
    queryFn: () => mealsApi.getMealsByCategory(categoryId),
    staleTime: 5 * 60 * 1000,
    enabled: !!categoryId,
  });
};

export const useMealPlanTypes = () => {
  return useQuery({
    queryKey: ['mealPlanTypes'],
    queryFn: mealsApi.getMealPlanTypes,
    staleTime: 15 * 60 * 1000,
  });
};

export const useHeroSlides = () => {
  return useQuery({
    queryKey: ['heroSlides'],
    queryFn: mealsApi.getHeroSlides,
    staleTime: 15 * 60 * 1000,
  });
};

export const useSiteSettings = () => {
  return useQuery({
    queryKey: ['siteSettings'],
    queryFn: mealsApi.getSiteSettings,
    staleTime: 60 * 60 * 1000,
  });
};
