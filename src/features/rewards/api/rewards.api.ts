import apiClient from '../../../shared/api/client';

export interface Reward {
  id: number;
  name: string;
  description?: string;
  reward_type: string;
  points_required: number;
  discount_percentage?: number;
  discount_amount?: number | string;
  cashback_amount?: number | string;
  is_active: boolean;
}

export interface RewardTransaction {
  id: number;
  transaction_type: 'earned' | 'redeemed' | 'expired' | 'bonus';
  points: number;
  description: string;
  created_at: string;
}

export const rewardsApi = {
  // Public reward catalog (ViewSet)
  getRewards: async (): Promise<Reward[]> => {
    const { data } = await apiClient.get('/rewards/');
    if (Array.isArray(data)) return data;
    return data?.results ?? [];
  },

  // Claimable rewards for the authenticated user
  getAvailable: async (): Promise<Reward[]> => {
    const { data } = await apiClient.get('/rewards/available/');
    if (Array.isArray(data)) return data;
    return data?.results ?? [];
  },

  // Earned/spent transaction log
  getHistory: async (): Promise<RewardTransaction[]> => {
    const { data } = await apiClient.get('/rewards/history/');
    if (Array.isArray(data)) return data;
    return data?.results ?? [];
  },

  claimReward: async (rewardId: number) => {
    const { data } = await apiClient.post(`/rewards/${rewardId}/claim/`);
    return data;
  },

  getUserPoints: async (): Promise<number> => {
    try {
      const { data } = await apiClient.get('/rewards/points/');
      return data?.points ?? data?.total_points ?? 0;
    } catch {
      return 0;
    }
  },
};
