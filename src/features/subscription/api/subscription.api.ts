import apiClient from '../../../shared/api/client';

export const subscriptionApi = {
  getPlans: async () => {
    const response = await apiClient.get('/subscription-plans/');
    if (Array.isArray(response.data)) return response.data;
    return response.data.results || [];
  },

  getPlansByType: async (planTypeId: number) => {
    const response = await apiClient.get('/subscription-plans/by_plan/', {
      params: { plan_type: planTypeId },
    });
    if (Array.isArray(response.data)) return response.data;
    return response.data.results || [];
  },

  getMySubscriptions: async () => {
    const response = await apiClient.get('/subscriptions/my/');
    return response.data?.results || response.data || [];
  },

  createSubscription: async (data: {
    meal_plan_type_id: number;
    subscription_period_id: number;
    category_id?: number;
    start_date: string;
    delivery_instructions?: string;
    veg_days?: number[];
  }) => {
    const response = await apiClient.post('/subscriptions/create/', data);
    return response.data;
  },

  manageSubscription: async (id: number, action: 'hold' | 'resume' | 'cancel') => {
    const response = await apiClient.patch(`/subscriptions/${id}/manage/`, { action });
    return response.data;
  },
};
