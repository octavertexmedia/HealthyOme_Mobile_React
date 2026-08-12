import { useQuery } from '@tanstack/react-query';
import { referralsApi } from '../api/referrals.api';

export const useMyReferral = (enabled: boolean) => {
  return useQuery({
    queryKey: ['referrals', 'me'],
    queryFn: referralsApi.getMyReferral,
    enabled,
    staleTime: 60 * 1000,
  });
};
