import { useQuery } from '@tanstack/react-query';
import { couponsApi } from '../api/coupons.api';

export const useCoupons = () => {
  return useQuery({
    queryKey: ['coupons', 'available'],
    queryFn: couponsApi.getAvailable,
    staleTime: 5 * 60 * 1000,
  });
};
