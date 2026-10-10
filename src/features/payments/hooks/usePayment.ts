import { useState, useCallback, useRef } from 'react';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import {
  paymentsApi,
  type CreateOrderRequest,
  type CreateSubscriptionOrderRequest,
  type CreateSubscriptionRechargeOrderRequest,
  type CreateConsultOrderRequest,
  type CreateFunctionalTrainingOrderRequest,
  type CreateOrderResponse,
  type FulfillmentPassthrough,
} from '../api/payments.api';

export type PayResult =
  | {
      status: 'paid';
      transaction_id: number;
      order_ids: number[];
      zero_rupee: boolean;
      subscription_id?: number;
      subscription_recharged?: boolean;
      consult_booking_id?: number;
      functional_training_enrollment_id?: number;
    }
  | { status: 'cancelled' }
  | { status: 'failed'; error: string };

/**
 * Razorpay-only checkout params. `kind` selects which create-*-order endpoint
 * the server-authoritative amount is derived from; `fulfillment` is the
 * passthrough (address_id, delivery_date, email, coupon_code, notes, ...) that
 * verify / complete-zero-order forward into order creation.
 */
export type PayParams =
  | { kind: 'cart'; order: CreateOrderRequest; fulfillment?: FulfillmentPassthrough }
  | {
      kind: 'subscription';
      order: CreateSubscriptionOrderRequest;
      fulfillment?: FulfillmentPassthrough;
    }
  | {
      kind: 'subscription_recharge';
      order: CreateSubscriptionRechargeOrderRequest;
      fulfillment?: FulfillmentPassthrough;
    }
  | {
      kind: 'consult';
      order: CreateConsultOrderRequest;
      fulfillment?: FulfillmentPassthrough;
    }
  | {
      kind: 'functional_training';
      order: CreateFunctionalTrainingOrderRequest;
      fulfillment?: FulfillmentPassthrough;
    };

/**
 * usePayment orchestrates: public-key -> create-*-order -> (Razorpay SDK ->
 * verify) OR (complete-zero-order for a ₹0 100%-coupon checkout).
 *
 * Chargeable orders require a native build containing react-native-razorpay.
 * In Expo Go, a CHARGEABLE order returns
 * { status: 'failed', error: 'payment_sdk_missing' }. The zero-rupee path never
 * touches the SDK, so ₹0 (100%-coupon) checkout still works today.
 */
export function usePayment() {
  const [loading, setLoading] = useState(false);
  const paymentInFlight = useRef(false);

  const pay = useCallback(async (params: PayParams): Promise<PayResult> => {
    if (paymentInFlight.current) return { status: 'failed', error: 'payment_in_progress' };
    paymentInFlight.current = true;
    setLoading(true);
    try {
      // Expo Go cannot load react-native-razorpay. Fail before creating a
      // server-side payment transaction so the QR preview is browse-only and
      // cannot leave orphan payment attempts behind.
      if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
        return { status: 'failed', error: 'payment_sdk_missing' };
      }

      const init = await createOrderFor(params);

      // ₹0 (100% coupon): no charge — settle via complete-zero-order.
      if (init.zero_rupee_checkout) {
        const res = await paymentsApi.completeZeroOrder({
          // Spread passthrough first so the authoritative transaction_id below
          // can never be clobbered by a stray fulfillment key.
          ...(params.fulfillment ?? {}),
          transaction_id: init.transaction_id,
        });
        return paidResult(init.transaction_id, res, true);
      }

      // Chargeable order: need the native Razorpay SDK. In Expo Go the JS
      // package resolves but the native module is absent, so also verify
      // `.open` exists — otherwise report payment_sdk_missing (needs a dev build).
      let RazorpayCheckout: any;
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports -- Expo Go omits this native module.
        RazorpayCheckout = require('react-native-razorpay').default;
      } catch {
        return { status: 'failed', error: 'payment_sdk_missing' };
      }
      if (!RazorpayCheckout || typeof RazorpayCheckout.open !== 'function') {
        return { status: 'failed', error: 'payment_sdk_missing' };
      }

      const pk = await paymentsApi.getPublicKey();
      if (!pk.enabled || !pk.key_id) {
        return { status: 'failed', error: 'payments_disabled' };
      }

      try {
        const data = await RazorpayCheckout.open({
          key: pk.key_id,
          // JSON amount is rupees(float); Razorpay wants paise(int).
          amount: Math.round(init.amount * 100),
          currency: init.currency,
          order_id: init.razorpay_order_id,
          name: 'HealthyOme',
          description: 'Order payment',
          theme: { color: '#1F8A3C' },
        });

        const res = await paymentsApi.verify({
          // Spread passthrough first so the authoritative verification fields
          // below can never be clobbered by a stray fulfillment key.
          ...(params.fulfillment ?? {}),
          transaction_id: init.transaction_id,
          razorpay_order_id: data.razorpay_order_id,
          razorpay_payment_id: data.razorpay_payment_id,
          razorpay_signature: data.razorpay_signature,
        });
        return paidResult(init.transaction_id, res, false);
      } catch (e: any) {
        if (e?.code === 0 || /cancel/i.test(e?.description ?? '')) {
          return { status: 'cancelled' };
        }
        return {
          status: 'failed',
          error: e?.description || e?.message || 'razorpay_error',
        };
      }
    } catch (e: any) {
      const msg =
        e?.response?.data?.code ||
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        e?.message ||
        'payment_error';
      return { status: 'failed', error: String(msg) };
    } finally {
      paymentInFlight.current = false;
      setLoading(false);
    }
  }, []);

  return { pay, loading };
}

function createOrderFor(params: PayParams): Promise<CreateOrderResponse> {
  switch (params.kind) {
    case 'subscription':
      return paymentsApi.createSubscriptionOrder(params.order);
    case 'subscription_recharge':
      return paymentsApi.createSubscriptionRechargeOrder(params.order);
    case 'consult':
      return paymentsApi.createConsultOrder(params.order);
    case 'functional_training':
      return paymentsApi.createFunctionalTrainingOrder(params.order);
    case 'cart':
    default:
      return paymentsApi.createOrder(params.order);
  }
}

function paidResult(
  transactionId: number,
  res: {
    verified: boolean;
    order_ids: number[];
    subscription_id?: number;
    subscription_recharged?: boolean;
    consult_booking_id?: number;
    functional_training_enrollment_id?: number;
  },
  zeroRupee: boolean
): PayResult {
  // Match web checkout: an HTTP 200/SDK callback alone is not fulfillment confirmation.
  if (res.verified !== true) return { status: 'failed', error: 'payment_verification_unconfirmed' };
  return {
    status: 'paid',
    transaction_id: transactionId,
    order_ids: res.order_ids ?? [],
    zero_rupee: zeroRupee,
    subscription_id: res.subscription_id,
    subscription_recharged: res.subscription_recharged,
    consult_booking_id: res.consult_booking_id,
    functional_training_enrollment_id: res.functional_training_enrollment_id,
  };
}
