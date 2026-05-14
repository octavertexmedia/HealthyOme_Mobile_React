import apiClient from '../../../shared/api/client';

export interface MealReview {
  id: number;
  user_name?: string;
  meal_item_name?: string;
  order?: number;
  rating: number;
  comment: string;
  created_at: string;
  updated_at?: string;
}

export const reviewsApi = {
  async forMeal(mealId: number): Promise<MealReview[]> {
    const { data } = await apiClient.get<MealReview[]>(`/reviews/${mealId}/`);
    return Array.isArray(data) ? data : [];
  },
};
