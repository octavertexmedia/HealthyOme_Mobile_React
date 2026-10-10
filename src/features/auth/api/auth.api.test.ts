import apiClient from '../../../shared/api/client';
import { authApi } from './auth.api';

jest.mock('../../../shared/api/client', () => ({ __esModule: true, default: { patch: jest.fn(), post: jest.fn() } }));

beforeEach(() => jest.clearAllMocks());

it.each([
  ['sendOTP', '/auth/otp/send/'],
  ['resendOTP', '/auth/otp/resend/'],
] as const)('%s uses the Django phone OTP contract', async (method, endpoint) => {
  jest.mocked(apiClient.post).mockResolvedValueOnce({ data: { success: true } });
  await authApi[method]('fixture-phone-not-a-real-account');
  expect(apiClient.post).toHaveBeenCalledWith(endpoint, { phone_number: 'fixture-phone-not-a-real-account' });
  expect(apiClient.post).toHaveBeenCalledTimes(1);
});

it.each([
  ['sendEmailOTP', '/auth/email-otp/send/'],
  ['resendEmailOTP', '/auth/email-otp/resend/'],
] as const)('%s uses the Django email OTP contract', async (method, endpoint) => {
  jest.mocked(apiClient.post).mockResolvedValueOnce({ data: { success: true } });
  await authApi[method]('fixture@example.invalid');
  expect(apiClient.post).toHaveBeenCalledWith(endpoint, { email: 'fixture@example.invalid' });
  expect(apiClient.post).toHaveBeenCalledTimes(1);
});

it.each([
  ['verifyOTP', '/auth/mobile/otp/verify/', 'phone_number'],
  ['verifyEmailOTP', '/auth/mobile/email-otp/verify/', 'email'],
] as const)('%s expects native JWTs, not a Firebase web session', async (method, endpoint, field) => {
  const response = { success: true, user: { id: 4 }, tokens: { access: 'fixture-access', refresh: 'fixture-refresh' } };
  jest.mocked(apiClient.post).mockResolvedValueOnce({ data: response });
  await expect(authApi[method]('fixture-identity', 'fixture-otp')).resolves.toBe(response);
  expect(apiClient.post).toHaveBeenCalledWith(endpoint, { [field]: 'fixture-identity', otp_code: 'fixture-otp' });
  expect(apiClient.post).toHaveBeenCalledTimes(1);
});

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
