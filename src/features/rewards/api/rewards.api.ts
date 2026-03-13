import apiClient from '../../../shared/api/client';

export const rewardsApi = {
  getRewards: async () => {
    const response = await apiClient.get('/rewards/');
    if (Array.isArray(response.data)) return response.data;
    return response.data.results || [];
  },

  getMyRewards: async () => {
    const response = await apiClient.get('/rewards/my/');
    return response.data;
  },

  claimReward: async (rewardId: number) => {
    const response = await apiClient.post('/rewards/claim/', { reward_id: rewardId });
    return response.data;
  },

  getUserPoints: async () => {
    try {
      const response = await apiClient.get('/rewards/points/');
      return response.data?.points || response.data?.total_points || 0;
    } catch {
      return 0;
    }
  },
};
