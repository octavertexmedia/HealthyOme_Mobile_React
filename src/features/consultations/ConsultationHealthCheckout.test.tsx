import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConsultationHealthCheckout } from './ConsultationHealthCheckout';
import HealthScreen from '../../../app/consult/health';
import { consultationsApi, type Booking } from './api/consultations.api';

const mockReplace = jest.fn();
const mockPay = jest.fn();
const mockRedirect = jest.fn();
let mockSession = { sessionRevision: 1, isAuthenticated: true, user: { id: 1 } };
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace }), useLocalSearchParams: () => ({ booking: '42' }), Redirect: ({ href }: { href: unknown }) => { mockRedirect(href); return null; } }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) }));
jest.mock('../auth/store/auth.store', () => ({ useAuthStore: Object.assign((select?: (state: typeof mockSession) => unknown) => select ? select(mockSession) : mockSession, { getState: () => mockSession }) }));
jest.mock('../payments/hooks/usePayment', () => ({ usePayment: () => ({ pay: mockPay }) }));
jest.mock('./api/consultations.api', () => ({ consultationsApi: { saveBookingHealth: jest.fn(), getBooking: jest.fn() } }));

const booking: Booking = {
  id: 42, dietician_id: 'fixture', dietician_name: 'Fixture Dietician', plan_code: 'fixture-plan', slot_start: '2026-10-15T10:00:00Z',
  notes: '', whatsapp_updates: false, remind_before_end: false, pause_dates: [], status: 'pending',
  client_full_name: 'Fixture Customer', age: 30, height_cm: 170, weight_kg: 70, goal: 'Fixture goal',
  medical_conditions: 'Fixture private note', health_complete: false, needs_payment: true, created_at: '2026-10-10',
};
const clients: QueryClient[] = [];
function mount(value = booking, route = false) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  clients.push(client);
  return render(<QueryClientProvider client={client}>{route ? <HealthScreen /> : <ConsultationHealthCheckout booking={value} />}</QueryClientProvider>);
}
beforeEach(() => {
  mockSession = { sessionRevision: 1, isAuthenticated: true, user: { id: 1 } };
  jest.mocked(consultationsApi.saveBookingHealth).mockReset().mockResolvedValue({ ...booking, health_complete: true });
  mockPay.mockReset().mockResolvedValue({ status: 'cancelled' });
});
afterEach(() => clients.splice(0).forEach((client) => client.clear()));

it('saves validated health before payment and sends only the booking id to the payment provider', async () => {
  mount();
  fireEvent.press(screen.getByRole('button', { name: 'Save health details and continue' }));
  await waitFor(() => expect(mockPay).toHaveBeenCalledTimes(1));
  expect(consultationsApi.saveBookingHealth).toHaveBeenCalledWith(42, expect.objectContaining({ age: 30, goal: 'Fixture goal' }));
  expect(jest.mocked(consultationsApi.saveBookingHealth).mock.invocationCallOrder[0]).toBeLessThan(mockPay.mock.invocationCallOrder[0]);
  expect(mockPay).toHaveBeenCalledWith({ kind: 'consult', order: { consult_booking_id: 42 } });
  expect(await screen.findByText(/Your health details are saved/)).toBeTruthy();
});
it('blocks invalid health before any save or payment', () => {
  mount();
  fireEvent.changeText(screen.getByLabelText('Age'), '0');
  fireEvent.press(screen.getByRole('button', { name: 'Save health details and continue' }));
  expect(screen.getByText(/Age must be/)).toBeTruthy();
  expect(consultationsApi.saveBookingHealth).not.toHaveBeenCalled();
  expect(mockPay).not.toHaveBeenCalled();
});
it.each(['failed', 'unconfirmed'] as const)('does not pay after a %s health save', async (outcome) => {
  if (outcome === 'failed') jest.mocked(consultationsApi.saveBookingHealth).mockRejectedValue(new Error('sensitive server detail'));
  else jest.mocked(consultationsApi.saveBookingHealth).mockResolvedValue(booking);
  mount();
  fireEvent.press(screen.getByRole('button', { name: 'Save health details and continue' }));
  await screen.findByText('Could not save health details. Payment was not started.');
  expect(screen.queryByText('sensitive server detail')).toBeNull();
  expect(mockPay).not.toHaveBeenCalled();
});
it('rejects duplicate submits and does not pay after an account change during save', async () => {
  let resolveSave!: (value: Booking) => void;
  jest.mocked(consultationsApi.saveBookingHealth).mockReturnValue(new Promise((resolve) => { resolveSave = resolve; }));
  mount();
  const button = screen.getByRole('button', { name: 'Save health details and continue' });
  fireEvent.press(button); fireEvent.press(button);
  expect(consultationsApi.saveBookingHealth).toHaveBeenCalledTimes(1);
  mockSession = { sessionRevision: 2, isAuthenticated: true, user: { id: 2 } };
  await act(async () => resolveSave({ ...booking, health_complete: true }));
  expect(mockPay).not.toHaveBeenCalled();
});
it('never starts payment after the health form has unmounted', async () => {
  let resolveSave!: (value: Booking) => void;
  jest.mocked(consultationsApi.saveBookingHealth).mockReturnValue(new Promise((resolve) => { resolveSave = resolve; }));
  const view = mount();
  fireEvent.press(screen.getByRole('button', { name: 'Save health details and continue' }));
  view.unmount();
  await act(async () => resolveSave({ ...booking, health_complete: true }));
  expect(mockPay).not.toHaveBeenCalled();
});
it('skips payment for an already-paid booking and blocks a cancelled one', async () => {
  jest.mocked(consultationsApi.saveBookingHealth).mockResolvedValue({ ...booking, health_complete: true, status: 'confirmed', needs_payment: false });
  const view = mount();
  fireEvent.press(screen.getByRole('button', { name: 'Save health details and continue' }));
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/consult/manage/42'));
  expect(mockPay).not.toHaveBeenCalled();
  view.unmount();
  mount({ ...booking, status: 'cancelled' });
  expect(screen.getByRole('button', { name: 'Save health details and continue' })).toBeDisabled();
});
it('gates the private health route without querying or putting health fields in login navigation', () => {
  mockSession.isAuthenticated = false;
  mount(booking, true);
  expect(consultationsApi.getBooking).not.toHaveBeenCalled();
  expect(mockRedirect).toHaveBeenCalledWith({ pathname: '/(auth)/login', params: { redirect: '/consult/health?booking=42' } });
});
