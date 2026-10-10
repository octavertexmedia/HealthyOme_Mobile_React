import apiClient from '../../../shared/api/client';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface OrderSummary {
  id: number;
  order_type: string;
  meal_item_id?: number | null;
  snack_item_id?: number | null;
  meal_name: string;
  meal_image: string;
  order_date: string;
  delivery_date: string;
  delivery_time_slot: string;
  status: OrderStatus;
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  special_instructions: string;
  created_at: string;
}

export interface OrderDetail extends OrderSummary {
  delivery_instructions: string;
  payment_status?: PaymentStatus;
  payment_method?: string;
}

export interface TrackStep {
  status: OrderStatus;
  label: string;
  completed: boolean;
}

export interface OrderTracking {
  id: number;
  status: OrderStatus;
  status_display: string;
  order_type: string;
  cancellable: boolean;
  steps: TrackStep[];
  meal_name: string;
  delivery_date: string;
  delivery_time_slot: string;
}

export const ordersApi = {
  getMyOrders: async (): Promise<OrderSummary[]> => {
    const response = await apiClient.get('/orders/my/');
    return response.data?.results || response.data || [];
  },

  getOrderDetail: async (id: number): Promise<OrderDetail> => {
    const response = await apiClient.get(`/orders/my/${id}/`);
    return response.data;
  },

  trackOrder: async (id: number): Promise<OrderTracking> => {
    const response = await apiClient.get(`/orders/my/${id}/track/`);
    return response.data;
  },

  cancelOrder: async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(`/orders/my/${id}/cancel/`);
    return response.data;
  },

  reorderOrder: async (id: number): Promise<{
    status: string;
    message: string;
    cart?: { total_items: number; total_price: number };
  }> => {
    const response = await apiClient.post(`/orders/${id}/reorder/`);
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
    items: { meal_item_id: number; quantity: number }[];
  }): Promise<{
    success: boolean;
    message: string;
    order_ids: number[];
    summary: {
      subtotal: number;
      discount: number;
      total: number;
      points_earned: number;
      delivery_date: string;
    };
  }> => {
    const response = await apiClient.post('/orders/place/', data);
    return response.data;
  },
};
