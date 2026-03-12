import apiClient from '../../../shared/api/client';
import type { MealItem, HeroSlide, SiteSettings, MealPlanType } from '../types/meal.types';

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const mealsApi = {
  getMeals: async (): Promise<MealItem[]> => {
    const response = await apiClient.get<PaginatedResponse<MealItem> | MealItem[]>('/meals/');
    if (Array.isArray(response.data)) return response.data;
    return response.data.results || [];
  },

  getMeal: async (id: number): Promise<MealItem> => {
    const response = await apiClient.get<MealItem>(`/meals/${id}/`);
    return response.data;
  },

  getFeaturedMeals: async (): Promise<MealItem[]> => {
    const response = await apiClient.get<PaginatedResponse<MealItem> | MealItem[]>('/meals/featured/');
    if (Array.isArray(response.data)) return response.data;
    return response.data.results || [];
  },

  getMealsByCategory: async (categoryId: number): Promise<MealItem[]> => {
    const response = await apiClient.get<PaginatedResponse<MealItem> | MealItem[]>('/meals/by_category/', {
      params: { category: categoryId },
    });
    if (Array.isArray(response.data)) return response.data;
    return response.data.results || [];
  },

  getMealPlanTypes: async (): Promise<MealPlanType[]> => {
    const response = await apiClient.get<PaginatedResponse<MealPlanType> | MealPlanType[]>('/meal-plans/');
    if (Array.isArray(response.data)) return response.data;
    return response.data.results || [];
  },

  getHeroSlides: async (): Promise<HeroSlide[]> => {
    const response = await apiClient.get<PaginatedResponse<HeroSlide> | HeroSlide[]>('/hero-slides/');
    if (Array.isArray(response.data)) return response.data;
    return response.data.results || [];
  },

  getSiteSettings: async (): Promise<SiteSettings> => {
    const response = await apiClient.get<SiteSettings>('/site-settings/active/');
    return response.data;
  },

  getDashboardStats: async () => {
    const response = await apiClient.get('/dashboard/stats/');
    return response.data;
  },
};
