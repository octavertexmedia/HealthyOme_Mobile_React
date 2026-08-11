import apiClient from '../../../shared/api/client';

// ── Nested serializer shapes (backend ALWAYS returns nested objects, never bare ids) ──
export interface MealPlanTypeRef {
  id: number;
  name: string;
  description?: string;
  image?: string;
  image_url?: string | null;
  is_active?: boolean;
  max_meal_times_selectable?: number;
  allowed_meal_time_ids?: number[];
  show_available_menu?: boolean;
  marketing_features?: string[];
}

export interface SubscriptionPeriodRef {
  id: number;
  name: string;
  days?: number;
  is_trial?: boolean;
  description?: string;
}

export interface CategoryRef {
  id: number;
  name: string;
  image?: string;
  image_url?: string | null;
  sort_order?: number;
}

export interface MealTimeRef {
  id: number;
  name: string;
  delivery_window?: string;
  sort_order?: number;
  available_for_subscription?: boolean;
  is_active?: boolean;
}

// SubscriptionPlanSerializer (shop/api/subscriptions.py). price is a decimal STRING.
export interface SubscriptionPlan {
  id: number;
  name?: string;
  meal_plan_type: MealPlanTypeRef;
  subscription_period: SubscriptionPeriodRef;
  category?: CategoryRef;
  price: string;
  price_per_meal_slot?: string;
  pricing_model?: string;
  original_price?: string | null;
  free_meals?: number;
  cashback_percentage?: number;
  is_active: boolean;
  savings?: number;
  description?: string;
}

// ActiveMealPlanSerializer (shop/api/subscriptions.py). Note: field is `price`, NOT total_amount.
export interface ActiveSubscription {
  id: number;
  customer_name?: string;
  meal_plan_type: MealPlanTypeRef;
  subscription_period?: SubscriptionPeriodRef;
  category?: CategoryRef;
  meal_times?: MealTimeRef[];
  start_date: string;
  end_date?: string;
  total_deliveries?: number;
  deliveries_left?: number;
  price?: string;
  is_active: boolean;
  is_on_hold: boolean;
  hold_start_date?: string | null;
  hold_end_date?: string | null;
  pause_dates?: string[];
  carry_forward_days?: number;
  created_at?: string;
  updated_at?: string;
}

export interface SubscriptionSettings {
  id: number;
  start_date: string;
  veg_days: number[];
  reminder_days_before: number;
  delivery_instructions: string;
  whatsapp_updates: boolean;
  created_at?: string;
  updated_at?: string;
}

// build_manage_subscription_response (shop/subscription_manage.py). Returned by pause/resume/manage.
export interface ManageSubscriptionResponse {
  subscription: ActiveSubscription;
  settings: SubscriptionSettings | null;
  delivery_schedule: any[];
  plan_status: 'active' | 'paused' | 'expiring_soon' | 'ended';
  fetched_at: string;
}

export interface CheckoutResponse {
  status: string;
  message: string;
  subscription: ActiveSubscription;
  order_summary: {
    item_total: number;
    discount: number;
    final_amount: number;
  };
}

export const subscriptionApi = {
  // Canonical plans endpoint (subscriptions.py:133). Flat array, NO pagination wrapper.
  getPlans: async (): Promise<SubscriptionPlan[]> => {
    const { data } = await apiClient.get('/subscriptions/plans/');
    return Array.isArray(data) ? data : [];
  },

  // Same canonical endpoint filtered by meal_plan_type (replaces deprecated /subscription-plans/by_plan/).
  getPlansByType: async (mealPlanTypeId: number): Promise<SubscriptionPlan[]> => {
    const { data } = await apiClient.get('/subscriptions/plans/', {
      params: { meal_plan_type: mealPlanTypeId },
    });
    return Array.isArray(data) ? data : [];
  },

  // Active subscriptions (subscriptions.py:559). Default returns a flat array.
  getActive: async (): Promise<ActiveSubscription[]> => {
    const { data } = await apiClient.get('/subscriptions/active/');
    return Array.isArray(data) ? data : [];
  },

  // Real subscription creation path is checkout (subscriptions.py:756). The legacy
  // /subscriptions/create/ endpoint is intentionally disabled (returns 410 GONE).
  // NOTE: this is the pre-payment checkout; native Razorpay payment is still required
  // for a paid plan (see crossCutting notes) — the payments module owns that step.
  checkout: async (body: {
    subscription_id: number;
    address_id?: number;
    coupon_code?: string;
  }): Promise<CheckoutResponse> => {
    const { data } = await apiClient.post('/subscriptions/checkout/', body);
    return data;
  },

  // Range pause {hold_start_date, hold_end_date} OR discrete {pause_dates}. Returns full manage payload.
  pause: async (
    id: number,
    params: { hold_start_date: string; hold_end_date: string } | { pause_dates: string[] }
  ): Promise<ManageSubscriptionResponse> => {
    const { data } = await apiClient.post(`/subscriptions/${id}/pause/`, params);
    return data;
  },

  // Empty body resumes fully; optional {resume_dates} resumes specific days. Returns full manage payload.
  resume: async (id: number, params?: { resume_dates: string[] }): Promise<ManageSubscriptionResponse> => {
    const { data } = await apiClient.post(`/subscriptions/${id}/resume/`, params ?? {});
    return data;
  },
};
