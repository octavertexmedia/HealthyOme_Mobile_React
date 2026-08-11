import apiClient from '../../../shared/api/client';

// Matches shop/serializers.py RewardSerializer (:596) — the effective definition.
// discount_amount / cashback_amount are DecimalFields => serialized as strings.
export interface Reward {
  id: number;
  name: string;
  description: string;
  image_url: string | null;
  points_required: number;
  reward_type: 'free_meal' | 'discount' | 'cashback';
  discount_amount: string | null;
  discount_percentage: number | null;
  cashback_amount: string | null;
  is_active: boolean;
}

// Matches shop/models.py TRANSACTION_TYPE_CHOICES (:953): only 'earned' | 'spent'.
export interface RewardTransaction {
  id: number;
  transaction_type: 'earned' | 'spent';
  points: number;
  description: string;
  order: number | null;
  reward: number | null;
  created_at: string;
}

export interface UserRewardPoints {
  total_points: number;
  created_at: string;
  updated_at: string;
}

export interface ClaimRewardResult {
  status: 'success';
  message: string;
  remaining_points: number;
}

export const rewardsApi = {
  // Public reward catalog. AllowAny. GET /rewards/available/ returns a BARE array
  // (no {count,next,previous,results} wrapper). Filters is_active, ordered by points_required.
  getAvailable: async (): Promise<Reward[]> => {
    const { data } = await apiClient.get<Reward[]>('/rewards/available/');
    return Array.isArray(data) ? data : [];
  },

  // Authenticated. GET /rewards/history/ returns a BARE array, ordered by -created_at.
  getHistory: async (): Promise<RewardTransaction[]> => {
    const { data } = await apiClient.get<RewardTransaction[]>('/rewards/history/');
    return Array.isArray(data) ? data : [];
  },

  // Authenticated. GET /rewards/points/ returns {total_points, created_at, updated_at}.
  getUserPoints: async (): Promise<number> => {
    try {
      const { data } = await apiClient.get<UserRewardPoints>('/rewards/points/');
      return data?.total_points ?? 0;
    } catch {
      return 0;
    }
  },

  // Authenticated. POST /rewards/{rewardId}/claim/ with empty body.
  // Success: {status, message, remaining_points}. Errors: {error}.
  claimReward: async (rewardId: number): Promise<ClaimRewardResult> => {
    const { data } = await apiClient.post<ClaimRewardResult>(`/rewards/${rewardId}/claim/`, {});
    return data;
  },
};
