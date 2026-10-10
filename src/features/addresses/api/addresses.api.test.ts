import apiClient from '../../../shared/api/client';
import { addressesApi } from './addresses.api';
jest.mock('../../../shared/api/client', () => ({ __esModule: true, default: { post: jest.fn(), put: jest.fn() } }));
it('sends actual standing meal-time IDs through the existing address contract', async () => {
  const payload = { delivery_area_id: 7, default_meal_time_ids: [42, 91] };
  const data = { id: 3, ...payload };
  jest.mocked(apiClient.post).mockResolvedValue({ data });
  jest.mocked(apiClient.put).mockResolvedValue({ data });
  await expect(addressesApi.create(payload)).resolves.toBe(data);
  expect(apiClient.post).toHaveBeenCalledWith('/addresses/', payload);
  await expect(addressesApi.update(3, payload)).resolves.toBe(data);
  expect(apiClient.put).toHaveBeenLastCalledWith('/addresses/3/', payload);
  await addressesApi.update(3, { default_meal_time_ids: [] });
  expect(apiClient.put).toHaveBeenLastCalledWith('/addresses/3/', { default_meal_time_ids: [] });
});
