import apiClient from '../../../shared/api/client';
import { subscriptionApi } from './subscription.api';

jest.mock('../../../shared/api/client', () => ({ __esModule: true, default: { post: jest.fn(), get: jest.fn() } }));
it('uses exact pause and partial resume contracts, retaining the server response', async () => {
  const data = { plan_status: 'active' };
  jest.mocked(apiClient.post).mockResolvedValue({ data });
  await expect(subscriptionApi.pause(8, { pause_dates: ['2026-10-15'] })).resolves.toBe(data);
  expect(apiClient.post).toHaveBeenLastCalledWith('/subscriptions/8/pause/', { pause_dates: ['2026-10-15'] });
  await expect(subscriptionApi.resume(8, { resume_dates: ['2026-10-15'] })).resolves.toBe(data);
  expect(apiClient.post).toHaveBeenLastCalledWith('/subscriptions/8/resume/', { resume_dates: ['2026-10-15'] });
});
it('never turns an empty partial resume or pause into a backend write', async () => {
  await expect(subscriptionApi.resume(8, { resume_dates: [] })).rejects.toThrow('Select at least one');
  await expect(subscriptionApi.pause(8, { pause_dates: [] })).rejects.toThrow('Select at least one');
  expect(apiClient.post).not.toHaveBeenCalled();
});
it('keeps an explicitly requested full resume distinct', async () => {
  jest.mocked(apiClient.post).mockResolvedValue({ data: {} });
  await subscriptionApi.resume(8);
  expect(apiClient.post).toHaveBeenCalledWith('/subscriptions/8/resume/', {});
});
it('loads actual meal-time IDs without a made-up plan filter', async () => {
  const data = { meal_times: [{ id: 42, name: 'Lunch' }], max_meal_times_selectable: null, meal_plan_type: null };
  jest.mocked(apiClient.get).mockResolvedValue({ data });
  await expect(subscriptionApi.getMealTimes()).resolves.toEqual(data);
  expect(apiClient.get).toHaveBeenCalledWith('/meal-times-list/', { params: undefined, publicRequest: true });
});
it('loads the public day-wise menu with exact plan identity and no credentials', async () => {
  const data = { slug: 'test-plan', meal_plan_type_id: 8, from: '2026-10-12', to: '2026-10-18', days: [{ date: '2026-10-12', meals: [{ id: 2, name: 'Meal', protein: 30 }] }] };
  jest.mocked(apiClient.get).mockResolvedValue({ data });
  await expect(subscriptionApi.getMenuSchedule('test-plan', 8)).resolves.toEqual(data);
  expect(apiClient.get).toHaveBeenCalledWith('/subscriptions/meal-plan-menu/', { params: { slug: 'test-plan', meal_plan_type: 8 }, publicRequest: true });
});
it('rejects menu data for a mismatched plan or malformed days', async () => {
  jest.mocked(apiClient.get).mockResolvedValue({ data: { slug: 'other', meal_plan_type_id: 8, days: [] } });
  await expect(subscriptionApi.getMenuSchedule('test-plan', 8)).rejects.toThrow('Invalid menu schedule');
  jest.mocked(apiClient.get).mockResolvedValue({ data: { slug: 'test-plan', meal_plan_type_id: 8, days: [{ meals: null }] } });
  await expect(subscriptionApi.getMenuSchedule('test-plan', 8)).rejects.toThrow('Invalid menu schedule');
});
