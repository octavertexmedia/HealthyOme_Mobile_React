import apiClient from '../../../shared/api/client';

// Built in shop/referral_service.py:329 (referral_me_payload).
export interface ReferralRecent {
  id: number;
  status: string;
  attributed_at: string;
  rewarded_at: string | null;
  referred_name: string;
}

export interface ReferralMe {
  program_enabled: boolean;
  code: string;
  share_path: string;
  pending_count: number;
  rewarded_count: number;
  referrer_reward_points: number;
  referee_reward_points: number;
  // coupon_value fields are decimal-as-string.
  referrer_coupon_value: string;
  referee_coupon_value: string;
  recent: ReferralRecent[];
}

export interface ReferralValidateResult {
  valid: boolean;
  code?: string;
  error?: string;
}

export const referralsApi = {
  // Authenticated. GET /referrals/me/. Auto-creates the user's referral code if missing.
  getMyReferral: async (): Promise<ReferralMe> => {
    const { data } = await apiClient.get<ReferralMe>('/referrals/me/');
    return data;
  },

  // Public (pre-signup). POST /referrals/validate/ with {code}. Returns 200 {valid:true,code}
  // or 400 {valid:false,error}. We normalize both branches to the same shape.
  validateReferralCode: async (code: string): Promise<ReferralValidateResult> => {
    try {
      const { data } = await apiClient.post<ReferralValidateResult>('/referrals/validate/', { code });
      return data;
    } catch (err: any) {
      const data = err?.response?.data;
      if (data && typeof data.valid === 'boolean') return data as ReferralValidateResult;
      return { valid: false, error: 'Could not validate referral code. Please try again.' };
    }
  },
};
