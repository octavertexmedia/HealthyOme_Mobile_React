import { act, renderHook } from '@testing-library/react-native';
import { paymentsApi } from '../api/payments.api';
import { usePayment } from './usePayment';

jest.mock('expo-constants', () => ({ __esModule: true, default: { executionEnvironment: 'standalone' }, ExecutionEnvironment: { StoreClient: 'storeClient' } }));
jest.mock('react-native-razorpay', () => ({ __esModule: true, default: { open: jest.fn() } }));
jest.mock('../api/payments.api', () => ({ paymentsApi: { createOrder: jest.fn(), getPublicKey: jest.fn(), verify: jest.fn(), completeZeroOrder: jest.fn() } }));

const init = { transaction_id: 7, razorpay_order_id: 'order_mock', amount: 100, currency: 'INR' };
const sdkResponse = { razorpay_order_id: 'order_mock', razorpay_payment_id: 'pay_mock', razorpay_signature: 'mock-signature' };
const RazorpayCheckout = jest.requireMock<{ default: { open: jest.Mock<Promise<typeof sdkResponse>, [Record<string, unknown>]> } }>('react-native-razorpay').default;
beforeEach(() => {
  jest.mocked(paymentsApi.createOrder).mockResolvedValue(init);
  jest.mocked(paymentsApi.getPublicKey).mockResolvedValue({ enabled: true, key_id: 'mock-public-key', save_cards: false });
  jest.mocked(RazorpayCheckout.open).mockResolvedValue(sdkResponse);
});

it('requires explicit server verification before reporting a chargeable payment as paid', async () => {
  jest.mocked(paymentsApi.verify).mockResolvedValue({ verified: false, order_ids: [] });
  const { result } = renderHook(() => usePayment());
  await act(async () => {
    await expect(result.current.pay({ kind: 'cart', order: {} })).resolves.toEqual({ status: 'failed', error: 'payment_verification_unconfirmed' });
  });
  expect(paymentsApi.verify).toHaveBeenCalledWith({ transaction_id: 7, ...sdkResponse });
});
it('accepts a verified response and uses server amount/order fields for the native SDK', async () => {
  jest.mocked(paymentsApi.verify).mockResolvedValue({ verified: true, order_ids: [82] });
  const { result } = renderHook(() => usePayment());
  await act(async () => {
    await expect(result.current.pay({ kind: 'cart', order: {} })).resolves.toMatchObject({ status: 'paid', order_ids: [82] });
  });
  expect(RazorpayCheckout.open).toHaveBeenCalledWith(expect.objectContaining({ amount: 10000, order_id: 'order_mock', currency: 'INR' }));
});
it('also fails closed when zero-value completion is not verified, without invoking the SDK', async () => {
  jest.mocked(paymentsApi.createOrder).mockResolvedValue({ ...init, amount: 0, zero_rupee_checkout: true });
  jest.mocked(paymentsApi.completeZeroOrder).mockResolvedValue({ verified: false, order_ids: [], zero_rupee_checkout: true });
  const { result } = renderHook(() => usePayment());
  await act(async () => {
    await expect(result.current.pay({ kind: 'cart', order: {} })).resolves.toEqual({ status: 'failed', error: 'payment_verification_unconfirmed' });
  });
  expect(RazorpayCheckout.open).not.toHaveBeenCalled();
});
it('blocks overlapping payment starts and releases the guard after completion', async () => {
  let resolveOrder!: (value: typeof init) => void;
  jest.mocked(paymentsApi.createOrder).mockImplementationOnce(() => new Promise((resolve) => { resolveOrder = resolve; }));
  jest.mocked(paymentsApi.verify).mockResolvedValue({ verified: true, order_ids: [82] });
  const { result } = renderHook(() => usePayment());
  await act(async () => {
    const first = result.current.pay({ kind: 'cart', order: {} });
    await expect(result.current.pay({ kind: 'cart', order: {} })).resolves.toEqual({ status: 'failed', error: 'payment_in_progress' });
    expect(paymentsApi.createOrder).toHaveBeenCalledTimes(1);
    resolveOrder(init);
    await first;
  });
  expect(result.current.loading).toBe(false);
  await act(async () => { await result.current.pay({ kind: 'cart', order: {} }); });
  expect(paymentsApi.createOrder).toHaveBeenCalledTimes(2);
});
