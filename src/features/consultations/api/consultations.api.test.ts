import apiClient from '../../../shared/api/client';
import { consultationsApi } from './consultations.api';
import { consultationPausePayload } from '../pausePreferences';
jest.mock('../../../shared/api/client', () => ({ __esModule: true, default: { patch: jest.fn() } }));
it('PATCHes pause-date preferences without cancellation or rescheduling fields', async () => {
  const data = { id: 9, pause_dates: ['2026-10-15'] };
  jest.mocked(apiClient.patch).mockResolvedValue({ data });
  await expect(consultationsApi.patchBooking(9, consultationPausePayload(['2026-10-15']))).resolves.toBe(data);
  expect(apiClient.patch).toHaveBeenLastCalledWith('/consult/bookings/9/', { pause_dates: ['2026-10-15'] });
  await consultationsApi.patchBooking(9, consultationPausePayload([]));
  expect(apiClient.patch).toHaveBeenLastCalledWith('/consult/bookings/9/', { pause_dates: [] });
});
