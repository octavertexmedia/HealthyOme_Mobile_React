import { useQuery } from '@tanstack/react-query';
import { rewardsApi } from '../api/rewards.api';

export const useAvailableRewards = () => {
  return useQuery({
    queryKey: ['rewards', 'available'],
    queryFn: rewardsApi.getAvailable,
    staleTime: 5 * 60 * 1000,
  });
};

export const useUserPoints = (enabled: boolean) => {
  return useQuery({
    queryKey: ['rewards', 'points'],
    queryFn: rewardsApi.getUserPoints,
    enabled,
    staleTime: 60 * 1000,
  });
};

export const useRewardHistory = (enabled: boolean) => {
  return useQuery({
    queryKey: ['rewards', 'history'],
    queryFn: rewardsApi.getHistory,
    enabled,
    staleTime: 60 * 1000,
  });
};
