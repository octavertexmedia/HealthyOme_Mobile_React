import { useState, useCallback } from 'react';
import { paymentsApi, type CreatePaymentResponse, type PaymentMethod } from '../api/payments.api';

export type PayResult =
  | { status: 'paid'; ref_id: string }
  | { status: 'cancelled' }
  | { status: 'failed'; error: string };

/**
 * usePayment orchestrates create-order → SDK → verify.
 *
 * SDK requirements (require `npx expo prebuild --clean`):
 *   npm install react-native-razorpay @stripe/stripe-react-native
 *
 * Until the SDKs are installed, razorpay/stripe will return
 * { status: 'failed', error: 'payment_sdk_missing' }.
 */
export function usePayment() {
  const [loading, setLoading] = useState(false);

  const pay = useCallback(
    async (params: {
      method: PaymentMethod;
      orderIds?: number[];
      bookingId?: number;
    }): Promise<PayResult> => {
      setLoading(true);
      try {
        const init: CreatePaymentResponse = await paymentsApi.createOrder({
          method: params.method,
          order_ids: params.orderIds,
          booking_id: params.bookingId,
        });

        if (init.method === 'cod') {
          return { status: 'paid', ref_id: init.ref_id };
        }

        if (init.method === 'razorpay') {
          return runRazorpay(init);
        }

        return runStripe(init);
      } catch (e: any) {
        const msg = e?.response?.data?.error || e?.message || 'payment_error';
        return { status: 'failed', error: String(msg) };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { pay, loading };
}

async function runRazorpay(
  init: Extract<CreatePaymentResponse, { method: 'razorpay' }>
): Promise<PayResult> {
  let RazorpayCheckout: any;
  try {
    RazorpayCheckout = require('react-native-razorpay').default;
  } catch {
    return { status: 'failed', error: 'payment_sdk_missing' };
  }

  try {
    const data = await RazorpayCheckout.open({
      key: init.key_id,
      amount: init.amount,
      currency: init.currency,
      order_id: init.provider_order_id,
      name: 'HealthyOme',
      description: 'Order payment',
      theme: { color: '#1F8A3C' },
    });
    await paymentsApi.verifyRazorpay({
      ref_id: init.ref_id,
      razorpay_order_id: data.razorpay_order_id,
      razorpay_payment_id: data.razorpay_payment_id,
      razorpay_signature: data.razorpay_signature,
    });
    return { status: 'paid', ref_id: init.ref_id };
  } catch (e: any) {
    if (e?.code === 0 || /cancel/i.test(e?.description ?? '')) {
      return { status: 'cancelled' };
    }
    return { status: 'failed', error: e?.description || e?.message || 'razorpay_error' };
  }
}

async function runStripe(
  init: Extract<CreatePaymentResponse, { method: 'stripe' }>
): Promise<PayResult> {
  let stripe: any;
  try {
    stripe = require('@stripe/stripe-react-native');
  } catch {
    return { status: 'failed', error: 'payment_sdk_missing' };
  }

  const { initPaymentSheet, presentPaymentSheet } = stripe;
  if (!initPaymentSheet || !presentPaymentSheet) {
    return { status: 'failed', error: 'payment_sdk_missing' };
  }

  const initRes = await initPaymentSheet({
    paymentIntentClientSecret: init.client_secret,
    merchantDisplayName: 'HealthyOme',
  });
  if (initRes?.error) {
    return { status: 'failed', error: initRes.error.message || 'stripe_init_failed' };
  }

  const present = await presentPaymentSheet();
  if (present?.error) {
    if (present.error.code === 'Canceled') return { status: 'cancelled' };
    return { status: 'failed', error: present.error.message || 'stripe_present_failed' };
  }

  await paymentsApi.verifyStripe({
    ref_id: init.ref_id,
    payment_intent_id: init.payment_intent_id,
  });
  return { status: 'paid', ref_id: init.ref_id };
}
