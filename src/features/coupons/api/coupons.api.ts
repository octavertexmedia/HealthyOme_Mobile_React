import apiClient from '../../../shared/api/client';
import type { Coupon } from '../types/coupon.types';

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const couponsApi = {
  // GET /coupons/available/ (AllowAny; auth caller also gets personal vouchers).
  // Returns a BARE JSON array of Coupon objects (no pagination envelope), but we
  // defensively unwrap in case a wrapper ever appears.
  getAvailable: async (): Promise<Coupon[]> => {
    const response = await apiClient.get<PaginatedResponse<Coupon> | Coupon[]>(
      '/coupons/available/'
    );
    if (Array.isArray(response.data)) return response.data;
    return response.data?.results ?? [];
  },
};
