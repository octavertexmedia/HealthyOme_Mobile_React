import apiClient from '../../../shared/api/client';
import type { FavouriteItem, ToggleFavouriteResponse } from '../types/favourite.types';

export const favouritesApi = {
  // GET /favourites/ — bare array; the view swallows internal errors and returns [].
  // Guard with Array.isArray since there is no pagination wrapper to rely on.
  getFavourites: async (): Promise<FavouriteItem[]> => {
    const response = await apiClient.get<FavouriteItem[]>('/favourites/');
    return Array.isArray(response.data) ? response.data : [];
  },

  // POST /favourites/toggle/ — body must use the exact field name meal_item_id (snake_case int).
  // Response field is `favourited` (British spelling, boolean).
  toggle: async (mealItemId: number): Promise<ToggleFavouriteResponse> => {
    const response = await apiClient.post<ToggleFavouriteResponse>('/favourites/toggle/', {
      meal_item_id: mealItemId,
    });
    return response.data;
  },
};
