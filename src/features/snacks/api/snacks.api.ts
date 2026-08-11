import apiClient from '../../../shared/api/client';
import type { SnackItem, SnackCategory } from '../types/snack.types';

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface SnacksPage {
  items: SnackItem[];
  hasMore: boolean;
  nextPage: number | null;
}

export const snacksApi = {
  /**
   * GET /snacks/ — DRF PageNumberPagination (PAGE_SIZE=20). Filters map to the
   * exact query-param names the viewset understands: search, category (id),
   * dietary_type (veg|non_veg|vegan|egg), ordering. Tolerates a bare array too.
   */
  getSnacksPage: async (params: {
    page?: number;
    search?: string;
    category?: number;
    dietary_type?: string;
    ordering?: string;
  }): Promise<SnacksPage> => {
    const cleaned: Record<string, any> = { page: params.page ?? 1 };
    if (params.search?.trim()) cleaned.search = params.search.trim();
    if (params.category) cleaned.category = params.category;
    if (params.dietary_type) cleaned.dietary_type = params.dietary_type;
    if (params.ordering) cleaned.ordering = params.ordering;

    const response = await apiClient.get<PaginatedResponse<SnackItem> | SnackItem[]>('/snacks/', {
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

  /** GET /snacks/{id}/ — single un-wrapped SnackItem. */
  getSnack: async (id: number): Promise<SnackItem> => {
    const response = await apiClient.get<SnackItem>(`/snacks/${id}/`);
    return response.data;
  },

  /**
   * GET /snack-categories/ — BARE ARRAY (no pagination wrapper). Tolerates a
   * paginated wrapper defensively so a backend change never crashes the strip.
   */
  getSnackCategories: async (): Promise<SnackCategory[]> => {
    const response = await apiClient.get<PaginatedResponse<SnackCategory> | SnackCategory[]>(
      '/snack-categories/',
    );
    if (Array.isArray(response.data)) return response.data;
    return response.data.results || [];
  },
};
