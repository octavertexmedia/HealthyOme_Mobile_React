import apiClient from '../../../shared/api/client';
import type {
  MealItem,
  HeroSlide,
  SiteSettings,
  MealPlanType,
  HomeLayout,
  MealCategory,
} from '../types/meal.types';

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface MealsPage {
  items: MealItem[];
  hasMore: boolean;
  nextPage: number | null;
}

export const mealsApi = {
  getMeals: async (): Promise<MealItem[]> => {
    const response = await apiClient.get<PaginatedResponse<MealItem> | MealItem[]>('/meals/');
    if (Array.isArray(response.data)) return response.data;
    return response.data.results || [];
  },

  getMealsPage: async (params: {
    page?: number;
    search?: string;
    category?: number;
  }): Promise<MealsPage> => {
    const cleaned: Record<string, any> = { page: params.page ?? 1 };
    if (params.search?.trim()) cleaned.search = params.search.trim();
    if (params.category) cleaned.category = params.category;
    const response = await apiClient.get<PaginatedResponse<MealItem> | MealItem[]>('/meals/', {
      params: cleaned,
    });
    if (Array.isArray(response.data)) {
      return { items: response.data, hasMore: false, nextPage: null };
    }
    const { results, next } = response.data;
    return {
      items: results || [],
      hasMore: !!next,
      nextPage: next ? (params.page ?? 1) + 1 : null,
    };
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

  getHomeLayout: async (): Promise<HomeLayout> => {
    const response = await apiClient.get<HomeLayout>('/home-layout/');
    return response.data;
  },

  getMealCategories: async (): Promise<MealCategory[]> => {
    const response = await apiClient.get<PaginatedResponse<MealCategory> | MealCategory[]>('/meal-categories/');
    if (Array.isArray(response.data)) return response.data;
    return response.data.results || [];
  },

  getDashboardStats: async () => {
    const response = await apiClient.get('/dashboard/stats/');
    return response.data;
  },
};
