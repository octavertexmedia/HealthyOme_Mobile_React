import apiClient from '../../shared/api/client';
import { subscriptionApi, type DeliveryScheduleDay, type DeliveryScheduleSlot } from './api/subscription.api';
import { canChangeDeliveryAddress } from './deliveryChanges';

jest.mock('../../shared/api/client', () => ({ __esModule: true, default: { request: jest.fn() } }));
const day: DeliveryScheduleDay = { date: '2026-10-12', slots: [], delivery_state: 'scheduled' };
const slot: DeliveryScheduleSlot = { meal_time_id: 2, meal_time_name: 'Lunch', order_status: 'pending' };

it('permits future open deliveries and blocks completed, dispatched, closed, and past slots', () => {
  expect(canChangeDeliveryAddress(day, slot, '2026-10-10')).toBe(true);
  expect(canChangeDeliveryAddress(day, { ...slot, order_status: 'delivered' }, '2026-10-10')).toBe(false);
  expect(canChangeDeliveryAddress(day, { ...slot, order_status: 'out_for_delivery' }, '2026-10-10')).toBe(false);
  expect(canChangeDeliveryAddress({ ...day, kitchen_closed: true }, slot, '2026-10-10')).toBe(false);
  expect(canChangeDeliveryAddress(day, slot, '2026-10-13')).toBe(false);
});
it('sets and clears an address with the backend per-slot payload', async () => {
  jest.mocked(apiClient.request).mockResolvedValue({ data: { success: true } });
  await subscriptionApi.setDeliveryAddress(9, { date: day.date, meal_time_id: 2, address_id: 3 });
  expect(apiClient.request).toHaveBeenLastCalledWith({ url: '/subscriptions/9/delivery-address-overrides/', method: 'PUT', data: { date: day.date, meal_time_id: 2, address_id: 3 } });
  await subscriptionApi.setDeliveryAddress(9, { date: day.date, meal_time_id: 2, address_id: null });
  expect(apiClient.request).toHaveBeenLastCalledWith({ url: '/subscriptions/9/delivery-address-overrides/', method: 'DELETE', data: { date: day.date, meal_time_id: 2, address_id: null } });
});
