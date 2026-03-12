import apiClient from '../../../shared/api/client';

export const ordersApi = {
  getMyOrders: async () => {
    const response = await apiClient.get('/orders/my/');
    return response.data?.results || response.data || [];
  },

  getOrderDetail: async (id: number) => {
    const response = await apiClient.get(`/orders/my/${id}/`);
    return response.data;
  },

  placeOrder: async (data: {
    address_id?: number;
    address?: string;
    delivery_area_id: number;
    phone: string;
    notes?: string;
    coupon_code?: string;
    delivery_instructions?: string;
    items: Array<{ meal_item_id: number; quantity: number }>;
  }) => {
    const response = await apiClient.post('/orders/place/', data);
    return response.data;
  },

  trackOrder: async (id: number) => {
    const response = await apiClient.get(`/orders/my/${id}/track/`);
    return response.data;
  },
};
