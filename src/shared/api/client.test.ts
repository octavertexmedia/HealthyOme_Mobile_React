import apiClient from './client';
import { tokenStore } from '../storage/tokens';
jest.mock('../storage/tokens', () => ({ tokenStore: { getAccess: jest.fn(), getRefresh: jest.fn() } }));
jest.mock('../config/env', () => ({ env: { apiUrl: 'https://example.invalid/api/shop', readOnlyPreview: true } }));

it('blocks production-preview writes before reaching a network adapter', async () => {
  const adapter = jest.fn();
  for (const method of ['post', 'put', 'patch', 'delete']) {
    await expect(apiClient.request({ method, url: '/orders/', adapter })).rejects.toThrow('read-only');
  }
  expect(adapter).not.toHaveBeenCalled();
});

it('does not read or attach credentials to public preview GETs', async () => {
  const adapter = jest.fn(async (config) => ({ data: [], status: 200, statusText: 'OK', headers: {}, config }));
  await apiClient.get('/subscriptions/plans/', { publicRequest: true, headers: { Authorization: 'not-a-real-token' }, adapter });
  expect(adapter.mock.calls[0][0].headers.has('Authorization')).toBe(false);
  expect(tokenStore.getAccess).not.toHaveBeenCalled();
  expect(tokenStore.getRefresh).not.toHaveBeenCalled();
});
