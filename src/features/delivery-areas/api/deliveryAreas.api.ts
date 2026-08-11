import apiClient from '../../../shared/api/client';

// Matches ops.DeliveryArea serializer (shop/serializers.py:83).
// grouped/accepted endpoints return bare JSON (object/array), NOT the paginated wrapper.
export interface DeliveryArea {
  id: number;
  name: string;
  is_accepted: boolean;
  description: string;
  pincodes: string[];
}

export interface GroupedDeliveryAreas {
  // is_accepted=true rows (subscription zones), ordered by name
  subscribed_meals: DeliveryArea[];
  // is_accepted=false rows (quick-meal zones), ordered by name
  quick_meals: DeliveryArea[];
}

export const deliveryAreasApi = {
  // GET /delivery-areas/grouped/ -> { subscribed_meals, quick_meals } (bare object, public)
  async getGrouped(): Promise<GroupedDeliveryAreas> {
    const { data } = await apiClient.get<GroupedDeliveryAreas>('/delivery-areas/grouped/');
    return {
      subscribed_meals: Array.isArray(data?.subscribed_meals) ? data.subscribed_meals : [],
      quick_meals: Array.isArray(data?.quick_meals) ? data.quick_meals : [],
    };
  },

  // GET /delivery-areas/accepted/ -> DeliveryArea[] (bare array, is_accepted=true, public)
  async getAccepted(): Promise<DeliveryArea[]> {
    const { data } = await apiClient.get<DeliveryArea[]>('/delivery-areas/accepted/');
    return Array.isArray(data) ? data : [];
  },
};
