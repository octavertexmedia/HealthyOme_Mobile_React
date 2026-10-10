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
  available_menu_view?: 'list' | 'card';
  menu_card_image?: string;
  menu_card_image_url?: string | null;
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

export interface MealTimesListResponse {
  meal_times: MealTimeRef[];
  max_meal_times_selectable: number | null;
  meal_plan_type: Pick<MealPlanTypeRef, 'id' | 'name' | 'image' | 'image_url'> | null;
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

export interface BrowseCategory {
  id: number; slug: string; title: string; subtitle: string; badge: string;
  image: string; image_url: string | null; gradient_from: string; gradient_to: string;
  image_object_fit: 'cover' | 'contain'; meal_plan_type_ids: number[];
  filter_slugs: string[]; filter_name_contains: string[]; filter_name_excludes: string[];
}
export interface BrowsePlan {
  slug: string; meal_plan_type: MealPlanTypeRef; starting_price: string;
  starting_period_label: string; preview_images: string[]; plans_count: number;
}
export interface PlanOverview {
  slug: string; meal_plan_type: MealPlanTypeRef; plans: SubscriptionPlan[];
  starting_price: string | null; starting_period_label: string | null;
  available_meals: { id: number; name: string; image?: string; service_date?: string; meal_time_name?: string }[];
  meal_times: MealTimeRef[]; max_meal_times_selectable?: number | null;
  can_subscribe?: boolean; subscribe_blocker?: string | null;
  stats?: { avg_rating: number | null; total_sold: number; subscriber_count: number; meal_count: number };
}

export interface PlanMenuSchedule {
  slug: string; meal_plan_type_id: number; from: string; to: string;
  days: { date: string; meals: { id: number; name: string; image?: string | null; meal_time_name?: string | null; dietary_type?: string | null;
    calories?: number | null; protein?: number | null; carbs?: number | null; fats?: number | null; fiber?: number | null }[] }[];
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
  start_date: string | null;
  veg_days: number[];
  reminder_days_before: number;
  delivery_instructions: string;
  whatsapp_updates: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DeliveryScheduleSlot {
  meal_time_id: number;
  meal_time_name: string;
  delivery_window?: string;
  meal_item_id?: number;
  meal_item_name?: string;
  meal_item_image_url?: string | null;
  order_id?: number;
  order_status?: string;
  paused?: boolean;
  delivery_state?: string;
  address_id?: number | null;
  address_label?: string;
}

export type DeliveryScheduleDayState =
  | 'scheduled'
  | 'delivered'
  | 'partial'
  | 'cancelled'
  | 'paused'
  | 'closed';

export interface DeliveryScheduleDay {
  date: string;
  slots: DeliveryScheduleSlot[];
  paused?: boolean;
  extended?: boolean;
  kitchen_closed?: boolean;
  delivery_state?: DeliveryScheduleDayState;
  orders_delivered?: number;
  orders_total?: number;
}

// build_manage_subscription_response (shop/subscription_manage.py). Returned by pause/resume/manage.
export interface ManageSubscriptionResponse {
  subscription: ActiveSubscription;
  settings: SubscriptionSettings | null;
  delivery_schedule: DeliveryScheduleDay[];
  plan_status: 'active' | 'paused' | 'expiring_soon' | 'ended';
  fetched_at: string;
}

export interface UserSubscriptionsResponse {
  active: ActiveSubscription[];
  inactive: ActiveSubscription[];
}

export type SubscriptionSettingsUpdate = Partial<{
  start_date: string;
  veg_days: number[];
  reminder_days_before: number;
  delivery_instructions: string;
  whatsapp_updates: boolean;
}>;

export interface SubscriptionRechargePayload {
  subscription_id: number;
  subscription_period_id: number;
}

export interface DeliveryAddressOverride {
  date: string;
  meal_time_id: number;
  address_id: number | null;
}

export interface RechargePeriodOption {
  id: number;
  name: string;
  days: number;
  price: string;
  checkout_total?: string;
  additional_deliveries?: number;
  plan_id: number;
}

export interface RechargeQuoteResponse {
  order_kind: string;
  subtotal: number;
  shipping: number;
  discount: number;
  payable_total: number;
  can_checkout: boolean;
  zero_rupee_checkout?: boolean;
  error?: string | null;
  error_message?: string | null;
  price_per_meal_slot?: number;
  meal_slot_count?: number;
  additional_deliveries?: number;
  period_days?: number;
  subscription_id: number;
  meal_plan_type: { id: number; name: string };
  category: { id: number | null; name: string };
  current_period: { id: number | null; name: string; days: number };
  period_options: RechargePeriodOption[];
  continuation_start_date: string;
  deliveries_left: number;
  total_deliveries: number;
  end_date: string | null;
  recharge?: SubscriptionRechargePayload | null;
}

export const subscriptionApi = {
  getBrowseCategories: async (): Promise<BrowseCategory[]> => {
    const { data } = await apiClient.get<BrowseCategory[]>('/subscriptions/browse-categories/', { publicRequest: true });
    return data;
  },
  getBrowseCatalog: async (): Promise<{ meal_plans: BrowsePlan[]; offers: { title: string; description: string }[] }> => {
    const { data } = await apiClient.get('/subscriptions/browse-catalog/', { publicRequest: true });
    return data;
  },
  getOverview: async (slug: string): Promise<PlanOverview> => {
    const { data } = await apiClient.get<PlanOverview>('/subscriptions/meal-plan-overview/', { params: { slug }, publicRequest: true });
    return data;
  },
  getMenuSchedule: async (slug: string, mealPlanTypeId: number): Promise<PlanMenuSchedule> => {
    const { data } = await apiClient.get<PlanMenuSchedule>('/subscriptions/meal-plan-menu/', { params: { slug, meal_plan_type: mealPlanTypeId }, publicRequest: true });
    if (data.slug !== slug || data.meal_plan_type_id !== mealPlanTypeId || !Array.isArray(data.days) || data.days.some((day) => !Array.isArray(day.meals))) throw new Error('Invalid menu schedule');
    return data;
  },
  // Canonical plans endpoint (subscriptions.py:133). Flat array, NO pagination wrapper.
  getPlans: async (): Promise<SubscriptionPlan[]> => {
    const { data } = await apiClient.get('/subscriptions/plans/', { publicRequest: true });
    return Array.isArray(data) ? data : [];
  },

  // Same canonical endpoint filtered by meal_plan_type (replaces deprecated /subscription-plans/by_plan/).
  getPlansByType: async (mealPlanTypeId: number): Promise<SubscriptionPlan[]> => {
    const { data } = await apiClient.get('/subscriptions/plans/', {
      publicRequest: true,
      params: { meal_plan_type: mealPlanTypeId },
    });
    return Array.isArray(data) ? data : [];
  },

  getMealTimes: async (mealPlanTypeId?: number): Promise<MealTimesListResponse> => {
    const { data } = await apiClient.get<MealTimesListResponse | MealTimeRef[]>(
      '/meal-times-list/',
      { params: mealPlanTypeId ? { meal_plan_type_id: mealPlanTypeId } : undefined, publicRequest: true }
    );
    if (Array.isArray(data)) {
      return {
        meal_times: data,
        max_meal_times_selectable: null,
        meal_plan_type: null,
      };
    }
    return {
      meal_times: data.meal_times ?? [],
      max_meal_times_selectable: data.max_meal_times_selectable ?? null,
      meal_plan_type: data.meal_plan_type ?? null,
    };
  },

  // Active subscriptions (subscriptions.py:559). Default returns a flat array.
  getActive: async (): Promise<ActiveSubscription[]> => {
    const { data } = await apiClient.get('/subscriptions/active/');
    return Array.isArray(data) ? data : [];
  },

  getUserSubscriptions: async (includeInactive = true): Promise<UserSubscriptionsResponse> => {
    const { data } = await apiClient.get<UserSubscriptionsResponse | ActiveSubscription[]>(
      '/subscriptions/active/',
      { params: includeInactive ? { include_inactive: 1 } : undefined }
    );
    if (Array.isArray(data)) return { active: data, inactive: [] };
    return {
      active: data.active ?? [],
      inactive: data.inactive ?? [],
    };
  },

  getManage: async (id: number): Promise<ManageSubscriptionResponse> => {
    const { data } = await apiClient.get<ManageSubscriptionResponse>(`/subscriptions/${id}/`);
    return data;
  },

  updateSettings: async (
    id: number,
    body: SubscriptionSettingsUpdate
  ): Promise<ManageSubscriptionResponse> => {
    const { data } = await apiClient.put<ManageSubscriptionResponse>(
      `/subscriptions/${id}/`,
      body
    );
    return data;
  },

  setDeliveryAddress: async (id: number, body: DeliveryAddressOverride): Promise<void> => {
    const { data } = await apiClient.request<{ success: boolean }>({
      url: `/subscriptions/${id}/delivery-address-overrides/`,
      method: body.address_id === null ? 'DELETE' : 'PUT',
      data: body,
    });
    if (!data.success) throw new Error('The delivery address change was not confirmed.');
  },

  getRechargeQuote: async (
    id: number,
    subscriptionPeriodId: number,
    couponCode?: string
  ): Promise<RechargeQuoteResponse> => {
    const { data } = await apiClient.get<RechargeQuoteResponse>(
      `/subscriptions/${id}/recharge/quote/`,
      {
        params: {
          subscription_period_id: subscriptionPeriodId,
          ...(couponCode ? { coupon_code: couponCode } : {}),
        },
      }
    );
    return data;
  },

  // Range pause {hold_start_date, hold_end_date} OR discrete {pause_dates}. Returns full manage payload.
  pause: async (
    id: number,
    params: { hold_start_date: string; hold_end_date: string } | { pause_dates: string[] }
  ): Promise<ManageSubscriptionResponse> => {
    if ('pause_dates' in params && !params.pause_dates.length) throw new Error('Select at least one date to pause.');
    const { data } = await apiClient.post(`/subscriptions/${id}/pause/`, params);
    return data;
  },

  // Empty body resumes fully; optional {resume_dates} resumes specific days. Returns full manage payload.
  resume: async (id: number, params?: { resume_dates: string[] }): Promise<ManageSubscriptionResponse> => {
    // Empty/missing body means full resume on the backend; a supplied selection must never silently become that.
    if (params && !params.resume_dates.length) throw new Error('Select at least one date to resume.');
    const { data } = await apiClient.post(`/subscriptions/${id}/resume/`, params ?? {});
    return data;
  },
};
