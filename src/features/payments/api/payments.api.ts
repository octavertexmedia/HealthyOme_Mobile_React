import apiClient from '../../../shared/api/client';

/**
 * HealthyOme is Razorpay-only (no COD, no Stripe). All customer payment
 * endpoints live under /api/shop/payments/razorpay/*. The shared axios client
 * already has baseURL = /api/shop, so paths here are relative to that.
 *
 * Flow (matches web checkout):
 *   GET public-key -> get key_id
 *   POST create-*-order (server derives the authoritative amount; no orders
 *        exist yet) -> { transaction_id, razorpay_order_id, amount, currency }
 *   open Razorpay with razorpay_order_id
 *   POST verify -> { verified, order_ids[] } (verify CREATES the ops.Order rows)
 *   OR, for a 100%-coupon ₹0 checkout, create-order returns
 *   zero_rupee_checkout:true and you POST complete-zero-order instead.
 */

// ---------------------------------------------------------------------------
// public-key
// ---------------------------------------------------------------------------
export interface PublicKeyResponse {
  enabled: boolean;
  key_id: string;
  save_cards: boolean;
  /** only present when enabled */
  is_live?: boolean;
}

// ---------------------------------------------------------------------------
// create-order (cart / subscription / recharge)
// ---------------------------------------------------------------------------
export interface CreateOrderItem {
  /** one of meal_item_id | snack_item_id per line */
  meal_item_id?: number;
  snack_item_id?: number;
  quantity: number;
}

export interface CreateOrderRequest {
  currency?: string;
  /** optional UI hint; server rejects with amount_mismatch if it diverges */
  amount?: number;
  coupon_code?: string;
  /** used for delivery-zone validation before pay */
  address_id?: number;
  /** REQUIRED valid email server-side */
  email?: string;
  /** arbitrary keys forwarded to Razorpay notes */
  notes?: Record<string, unknown>;
  /** quick-meal cart lines; omit to use the server cart */
  items?: CreateOrderItem[];
  /** replace server cart with items (default true) */
  replace?: boolean;
  /** subscription checkout payload */
  subscription?: Record<string, unknown>;
  /** subscription recharge payload */
  recharge?: Record<string, unknown>;
}

/**
 * Shared response shape for all three create-*-order endpoints.
 * customer fields only present when save-cards is enabled and a cust_* exists.
 * zero_rupee_checkout only present (true) on the ₹0 100%-coupon path.
 */
export interface CreateOrderResponse {
  transaction_id: number;
  razorpay_order_id: string;
  /** rupees (float). Razorpay.open() needs paise -> multiply by 100. */
  amount: number;
  currency: string;
  razorpay_customer_id?: string;
  remember_customer?: boolean;
  zero_rupee_checkout?: boolean;
}

// ---------------------------------------------------------------------------
// create-consult-order
// ---------------------------------------------------------------------------
export interface CreateConsultOrderRequest {
  /** required unless consult_booking_id given */
  plan_code?: string;
  /** required (or resolved from dietician_slug/dietician_id) */
  dietician_name?: string;
  dietician_slug?: string;
  /** alias for dietician_slug resolution */
  dietician_id?: number;
  /** ISO datetime; required unless consult_booking_id given */
  slot_start?: string;
  booking_notes?: string;
  /** pending DieticianBooking id; when set, plan/dietician/slot come from it */
  consult_booking_id?: number;
  coupon_code?: string;
  amount?: number;
  currency?: string;
}

// ---------------------------------------------------------------------------
// create-functional-training-order
// ---------------------------------------------------------------------------
export interface CreateFunctionalTrainingOrderRequest {
  /** REQUIRED pending FunctionalTrainingEnrollment id */
  enrollment_id: number;
  coupon_code?: string;
  amount?: number;
  currency?: string;
}

// ---------------------------------------------------------------------------
// verify / complete-zero-order fulfillment passthrough
// ---------------------------------------------------------------------------
export interface FulfillmentPassthrough {
  address_id?: number;
  delivery_date?: string;
  delivery_time_slot?: string;
  delivery_instructions?: string;
  coupon_code?: string;
  notes?: string;
  email?: string;
  /** extra keys (whatsapp_updates, reminder_days_before, ...) forwarded as-is */
  [key: string]: unknown;
}

export interface VerifyRequest extends FulfillmentPassthrough {
  transaction_id: number;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface VerifyResponse {
  verified: boolean;
  order_ids: number[];
  subscription_id?: number;
  subscription_recharged?: boolean;
  consult_booking_id?: number;
  functional_training_enrollment_id?: number;
  idempotent?: boolean;
}

export interface CompleteZeroOrderRequest extends FulfillmentPassthrough {
  /** must be a tx flagged zero_rupee_coupon with amount 0 */
  transaction_id: number;
}

export interface CompleteZeroOrderResponse extends VerifyResponse {
  zero_rupee_checkout: boolean;
}

export const paymentsApi = {
  async getPublicKey(): Promise<PublicKeyResponse> {
    const { data } = await apiClient.get<PublicKeyResponse>(
      '/payments/razorpay/public-key/'
    );
    return data;
  },

  async createOrder(body: CreateOrderRequest): Promise<CreateOrderResponse> {
    const { data } = await apiClient.post<CreateOrderResponse>(
      '/payments/razorpay/create-order/',
      body
    );
    return data;
  },

  async createConsultOrder(
    body: CreateConsultOrderRequest
  ): Promise<CreateOrderResponse> {
    const { data } = await apiClient.post<CreateOrderResponse>(
      '/payments/razorpay/create-consult-order/',
      body
    );
    return data;
  },

  async createFunctionalTrainingOrder(
    body: CreateFunctionalTrainingOrderRequest
  ): Promise<CreateOrderResponse> {
    const { data } = await apiClient.post<CreateOrderResponse>(
      '/payments/razorpay/create-functional-training-order/',
      body
    );
    return data;
  },

  async verify(body: VerifyRequest): Promise<VerifyResponse> {
    const { data } = await apiClient.post<VerifyResponse>(
      '/payments/razorpay/verify/',
      body
    );
    return data;
  },

  async completeZeroOrder(
    body: CompleteZeroOrderRequest
  ): Promise<CompleteZeroOrderResponse> {
    const { data } = await apiClient.post<CompleteZeroOrderResponse>(
      '/payments/razorpay/complete-zero-order/',
      body
    );
    return data;
  },
};
