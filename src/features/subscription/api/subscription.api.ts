import apiClient from '../../../shared/api/client';

export interface SubscriptionPlan {
  id: number;
  name?: string;
  meal_plan_type: number | { id: number; name: string };
  subscription_period: number | { id: number; name: string; days?: number };
  category?: number | { id: number; name: string };
  price: number | string;
  original_price?: number | string;
  description?: string;
  is_active: boolean;
}

export interface ActiveSubscription {
  id: number;
  meal_plan_type?: any;
  subscription_period?: any;
  start_date: string;
  end_date?: string;
  deliveries_left?: number;
  is_active: boolean;
  is_on_hold: boolean;
  hold_start_date?: string | null;
  hold_end_date?: string | null;
  total_amount?: number | string;
}

export const subscriptionApi = {
  getPlans: async (): Promise<SubscriptionPlan[]> => {
    const { data } = await apiClient.get('/subscription-plans/');
    if (Array.isArray(data)) return data;
    return data?.results ?? [];
  },

  getPlansByType: async (planTypeId: number): Promise<SubscriptionPlan[]> => {
    const { data } = await apiClient.get('/subscription-plans/by_plan/', {
      params: { plan_type: planTypeId },
    });
    if (Array.isArray(data)) return data;
    return data?.results ?? [];
  },

  getActive: async (): Promise<ActiveSubscription[]> => {
    const { data } = await apiClient.get('/subscriptions/active/');
    if (Array.isArray(data)) return data;
    return data?.results ?? [];
  },

  createSubscription: async (data: {
    meal_plan_type_id: number;
    subscription_period_id: number;
    category_id?: number;
    start_date: string;
    delivery_instructions?: string;
    veg_days?: number[];
  }) => {
    const { data: res } = await apiClient.post('/subscriptions/create/', data);
    return res;
  },

  pause: async (id: number, params: { hold_start_date: string; hold_end_date: string }) => {
    const { data } = await apiClient.post(`/subscriptions/${id}/pause/`, params);
    return data;
  },

  resume: async (id: number) => {
    const { data } = await apiClient.post(`/subscriptions/${id}/resume/`);
    return data;
  },

  cancel: async (id: number) => {
    const { data } = await apiClient.post(`/subscriptions/${id}/cancel/`);
    return data;
  },
};
