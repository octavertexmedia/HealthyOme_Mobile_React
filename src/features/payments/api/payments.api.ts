import apiClient from '../../../shared/api/client';

export type PaymentMethod = 'razorpay' | 'stripe' | 'cod';

export type CreatePaymentResponse =
  | {
      method: 'cod';
      ref_id: string;
      status: 'paid';
      amount: number;
    }
  | {
      method: 'razorpay';
      ref_id: string;
      key_id: string;
      provider_order_id: string;
      amount: number;
      currency: string;
    }
  | {
      method: 'stripe';
      ref_id: string;
      publishable_key: string;
      payment_intent_id: string;
      client_secret: string;
      amount: number;
      currency: string;
    };

export const paymentsApi = {
  async createOrder(params: {
    method: PaymentMethod;
    order_ids?: number[];
    booking_id?: number;
  }): Promise<CreatePaymentResponse> {
    const { data } = await apiClient.post<CreatePaymentResponse>(
      '/payments/create-order/',
      params
    );
    return data;
  },

  async verifyRazorpay(params: {
    ref_id: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }): Promise<{ ref_id: string; status: 'paid' }> {
    const { data } = await apiClient.post('/payments/verify/', params);
    return data;
  },

  async verifyStripe(params: {
    ref_id: string;
    payment_intent_id: string;
  }): Promise<{ ref_id: string; status: 'paid' }> {
    const { data } = await apiClient.post('/payments/verify/', params);
    return data;
  },
};
