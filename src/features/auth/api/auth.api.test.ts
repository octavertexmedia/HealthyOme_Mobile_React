import apiClient from '../../../shared/api/client';
import { authApi } from './auth.api';

jest.mock('../../../shared/api/client', () => ({ __esModule: true, default: { patch: jest.fn() } }));

it('uses the canonical profile from the backend update envelope', async () => {
  const user = { id: 4, first_name: 'Server-normalized', notify_push: false };
  jest.mocked(apiClient.patch).mockResolvedValueOnce({ data: { success: true, user } });
  await expect(authApi.updateProfile({ first_name: 'Input', notify_push: false })).resolves.toBe(user);
  expect(apiClient.patch).toHaveBeenCalledWith('/profile/', { first_name: 'Input', notify_push: false });
});

it('does not claim success when the profile update is unconfirmed', async () => {
  jest.mocked(apiClient.patch).mockResolvedValueOnce({ data: { success: false } });
  await expect(authApi.updateProfile({ notify_push: false })).rejects.toThrow('not confirmed');
});
