import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReviewEditor } from './ReviewEditor';
import ReviewRoute from '../../../../app/product-review/[type]/[id]';
import { reviewsApi } from '../api/reviews.api';
import { env } from '../../../shared/config/env';

const mockReplace = jest.fn();
const mockRedirect = jest.fn();
let mockSession = { isAuthenticated: true, sessionRevision: 1, user: { id: 1 } };
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace }), useLocalSearchParams: () => ({ type: 'snack', id: '8' }), Redirect: ({ href }: { href: unknown }) => { mockRedirect(href); return null; } }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) }));
jest.mock('../../auth/store/auth.store', () => ({ useAuthStore: Object.assign((select?: (state: typeof mockSession) => unknown) => select ? select(mockSession) : mockSession, { getState: () => mockSession }) }));
jest.mock('../../../shared/config/env', () => ({ env: { readOnlyPreview: false } }));
jest.mock('../api/reviews.api', () => ({ reviewsApi: { forCustomer: jest.fn(), save: jest.fn() } }));
jest.mock('../hooks/useMeals', () => ({ useSiteSettings: () => ({ data: { healthy_snacks_enabled: true }, isLoading: false }) }));

const empty = { rating: null, count: 0, page: 1, has_more: false, results: [], my_review: null };
const own = { id: 1, user_name: 'Fixture Customer', rating: 4, comment: 'Fixture review', created_at: '2026-10-10' };
const clients: QueryClient[] = [];
function mount(route = false) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  clients.push(client);
  return render(<QueryClientProvider client={client}>{route ? <ReviewRoute /> : <ReviewEditor productType="snack" productId={8} />}</QueryClientProvider>);
}
beforeEach(() => {
  mockSession = { isAuthenticated: true, sessionRevision: 1, user: { id: 1 } };
  env.readOnlyPreview = false;
  jest.mocked(reviewsApi.forCustomer).mockReset().mockResolvedValue(empty);
  jest.mocked(reviewsApi.save).mockReset().mockResolvedValue({ ...empty, my_review: own });
});
afterEach(() => clients.splice(0).forEach((client) => client.clear()));

it('requires a rating, saves once, and returns to the exact snack without putting the comment in navigation', async () => {
  mount();
  await screen.findByText('Write a review');
  expect(screen.getByRole('button', { name: 'Save review' })).toBeDisabled();
  fireEvent.press(screen.getByRole('radio', { name: '4 stars' }));
  fireEvent.changeText(screen.getByLabelText('Your experience'), 'Fixture review');
  const submit = screen.getByRole('button', { name: 'Save review' });
  fireEvent.press(submit); fireEvent.press(submit);
  await screen.findByText('Your review has been saved. Thank you!');
  expect(reviewsApi.save).toHaveBeenCalledTimes(1);
  expect(reviewsApi.save).toHaveBeenCalledWith('snack', 8, { rating: 4, comment: 'Fixture review' });
  fireEvent.press(screen.getByRole('button', { name: 'Back to product' }));
  expect(mockReplace).toHaveBeenCalledWith('/snacks?snackId=8');
});
it('prefills the signed-in customer review for editing', async () => {
  jest.mocked(reviewsApi.forCustomer).mockResolvedValue({ ...empty, my_review: own });
  mount();
  await screen.findByText('Edit your review');
  expect(screen.getByDisplayValue('Fixture review')).toBeTruthy();
  expect(screen.getByRole('radio', { name: '4 stars' }).props.accessibilityState.checked).toBe(true);
});
it('shows an honest unknown-write error without automatically resubmitting', async () => {
  jest.mocked(reviewsApi.save).mockRejectedValue(new Error('timeout'));
  mount();
  await screen.findByText('Write a review');
  fireEvent.press(screen.getByRole('radio', { name: '5 stars' }));
  fireEvent.press(screen.getByRole('button', { name: 'Save review' }));
  await screen.findByText(/Could not confirm your review was saved/);
  expect(reviewsApi.save).toHaveBeenCalledTimes(1);
});
it('keeps submission disabled in the safe preview', async () => {
  env.readOnlyPreview = true;
  mount();
  await screen.findByText('Write a review');
  fireEvent.press(screen.getByRole('radio', { name: '5 stars' }));
  fireEvent.press(screen.getByRole('button', { name: 'Save review' }));
  expect(reviewsApi.save).not.toHaveBeenCalled();
});
it('does not show success to a different session after an outstanding save', async () => {
  let resolveSave!: (value: Awaited<ReturnType<typeof reviewsApi.save>>) => void;
  jest.mocked(reviewsApi.save).mockReturnValue(new Promise((resolve) => { resolveSave = resolve; }));
  mount();
  await screen.findByText('Write a review');
  fireEvent.press(screen.getByRole('radio', { name: '5 stars' }));
  fireEvent.press(screen.getByRole('button', { name: 'Save review' }));
  mockSession.sessionRevision = 2;
  await act(async () => resolveSave({ ...empty, my_review: own }));
  expect(screen.queryByText('Your review has been saved. Thank you!')).toBeNull();
});
it('preserves a guest review login-return path without querying private review data', async () => {
  mockSession.isAuthenticated = false;
  mount(true);
  await waitFor(() => expect(mockRedirect).toHaveBeenCalledWith({ pathname: '/(auth)/login', params: { redirect: '/product-review/snack/8' } }));
  expect(reviewsApi.forCustomer).not.toHaveBeenCalled();
});
