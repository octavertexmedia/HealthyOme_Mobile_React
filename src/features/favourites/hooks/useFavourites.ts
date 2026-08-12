import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { favouritesApi } from '../api/favourites.api';
import type { FavouriteItem } from '../types/favourite.types';
import { useAuthStore } from '../../auth/store/auth.store';

export const favouritesKey = ['favourites'] as const;

// Optional snapshot lets the meal screen build an optimistic entry when *adding*
// a favourite (the favourites list may not yet hold this meal).
export interface ToggleFavouriteVars {
  mealItemId: number;
  snapshot?: {
    name: string;
    image: string | null;
    price: number | null;
    calories: number | string | null;
  };
}

interface ToggleContext {
  previous?: FavouriteItem[];
}

export const useFavourites = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: favouritesKey,
    queryFn: favouritesApi.getFavourites,
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });
};

// Derives whether a given meal is currently favourited from the cached list.
export const useIsFavourite = (mealItemId: number): boolean => {
  const { data } = useFavourites();
  if (!Number.isFinite(mealItemId)) return false;
  return (data ?? []).some((f) => f.meal_item_id === mealItemId);
};

export const useToggleFavourite = () => {
  const queryClient = useQueryClient();

  return useMutation<Awaited<ReturnType<typeof favouritesApi.toggle>>, unknown, ToggleFavouriteVars, ToggleContext>({
    mutationFn: ({ mealItemId }) => favouritesApi.toggle(mealItemId),
    onMutate: async ({ mealItemId, snapshot }) => {
      await queryClient.cancelQueries({ queryKey: favouritesKey });
      const previous = queryClient.getQueryData<FavouriteItem[]>(favouritesKey) ?? [];
      const exists = previous.some((f) => f.meal_item_id === mealItemId);

      const next: FavouriteItem[] = exists
        ? previous.filter((f) => f.meal_item_id !== mealItemId)
        : [
            {
              // Temporary negative id — replaced by the server's real row on invalidate.
              id: -mealItemId,
              meal_item_id: mealItemId,
              name: snapshot?.name ?? '',
              image: snapshot?.image ?? null,
              price: snapshot?.price ?? null,
              calories: snapshot?.calories ?? null,
              created_at: new Date().toISOString(),
            },
            ...previous,
          ];

      queryClient.setQueryData<FavouriteItem[]>(favouritesKey, next);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(favouritesKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: favouritesKey });
    },
  });
};
