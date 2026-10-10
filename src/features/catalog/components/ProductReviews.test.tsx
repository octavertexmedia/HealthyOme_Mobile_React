import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProductReviews } from './ProductReviews';
import { reviewsApi, type ProductReviewsPage, type ReviewProductType } from '../api/reviews.api';

jest.mock('../api/reviews.api', () => ({ reviewsApi: { forProduct: jest.fn() } }));
const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
const loadReviews = jest.mocked(reviewsApi.forProduct);
const clients: QueryClient[] = [];
const empty: ProductReviewsPage = { rating: null, count: 0, page: 1, has_more: false, results: [] };
const firstPage: ProductReviewsPage = {
  rating: 4.5, count: 11, page: 1, has_more: true,
  results: Array.from({ length: 10 }, (_, i) => ({ id: i + 1, user_name: 'Customer', rating: 5, comment: `Review ${i + 1}`, created_at: '2026-10-10' })),
};
const secondPage: ProductReviewsPage = {
  ...firstPage, page: 2, has_more: false,
  results: [{ id: 11, user_name: 'Customer', rating: 4, comment: 'Review 11', created_at: '2026-10-10' }],
};

function mount(productType: ReviewProductType = 'snack', productId = 8, onOpenEditor?: () => void) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  clients.push(client);
  const ui = (type: ReviewProductType, id: number) => (
    <QueryClientProvider client={client}><ProductReviews productType={type} productId={id} onOpenEditor={onOpenEditor} /></QueryClientProvider>
  );
  const view = render(ui(productType, productId));
  return { rerenderProduct: (type: ReviewProductType, id: number) => view.rerender(ui(type, id)) };
}

beforeEach(() => { loadReviews.mockReset(); mockPush.mockReset(); });
afterEach(() => { clients.splice(0).forEach((client) => client.clear()); });

it('shows every returned review, aggregate rating, and forward/back pagination', async () => {
  loadReviews.mockImplementation(async (_type, _id, page) => page === 2 ? secondPage : firstPage);
  mount();
  expect(await screen.findByText('4.5 / 5 · 11 reviews')).toBeTruthy();
  expect(screen.getByText('Review 10')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Previous reviews' })).toBeDisabled();
  fireEvent.press(screen.getByRole('button', { name: 'Next reviews' }));
  expect(await screen.findByText('Review 11')).toBeTruthy();
  expect(loadReviews).toHaveBeenLastCalledWith('snack', 8, 2);
  expect(screen.queryByText('Review 1')).toBeNull();
  expect(screen.getByRole('button', { name: 'Next reviews' })).toBeDisabled();
  fireEvent.press(screen.getByRole('button', { name: 'Previous reviews' }));
  expect(await screen.findByText('Review 1')).toBeTruthy();
});

it('distinguishes an empty successful response from loading and failure', async () => {
  loadReviews.mockResolvedValue(empty);
  mount();
  expect(await screen.findByText('No reviews yet.')).toBeTruthy();
  expect(screen.queryByText('Could not load reviews.')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Next reviews' })).toBeNull();
});

it('does not disguise errors as empty reviews or retry automatically; explicit retry recovers', async () => {
  loadReviews.mockRejectedValueOnce(new Error('Unavailable')).mockResolvedValue(empty);
  mount();
  expect(await screen.findByText('Could not load reviews.')).toBeTruthy();
  expect(screen.queryByText('No reviews yet.')).toBeNull();
  expect(loadReviews).toHaveBeenCalledTimes(1);
  fireEvent.press(screen.getByRole('button', { name: 'Retry reviews' }));
  expect(await screen.findByText('No reviews yet.')).toBeTruthy();
  expect(loadReviews).toHaveBeenCalledTimes(2);
});

it('keeps a failed later page recoverable without pretending it is the last page', async () => {
  loadReviews.mockResolvedValueOnce(firstPage).mockRejectedValueOnce(new Error('Page failed')).mockResolvedValueOnce(secondPage);
  mount();
  await screen.findByText('Review 1');
  fireEvent.press(screen.getByRole('button', { name: 'Next reviews' }));
  await screen.findByText('Could not load reviews.');
  expect(screen.getByText('Page 2')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Previous reviews' })).not.toBeDisabled();
  expect(screen.getByRole('button', { name: 'Next reviews' })).toBeDisabled();
  fireEvent.press(screen.getByRole('button', { name: 'Retry reviews' }));
  await screen.findByText('Review 11');
  expect(loadReviews.mock.calls.map((call) => call[2])).toEqual([1, 2, 2]);
});

it('resets pagination and isolates review caches when the product or its type changes', async () => {
  loadReviews.mockImplementation(async (_type, id, page) => id === 8 ? (page === 2 ? secondPage : firstPage) : empty);
  const view = mount();
  await screen.findByText('Review 1');
  fireEvent.press(screen.getByRole('button', { name: 'Next reviews' }));
  await screen.findByText('Review 11');
  view.rerenderProduct('snack', 9);
  await screen.findByText('No reviews yet.');
  expect(loadReviews).toHaveBeenLastCalledWith('snack', 9, 1);
  expect(screen.queryByText('Review 11')).toBeNull();
  view.rerenderProduct('meal', 9);
  await waitFor(() => expect(loadReviews).toHaveBeenLastCalledWith('meal', 9, 1));
});

it('disables page controls while the next page is in flight', async () => {
  loadReviews.mockResolvedValueOnce(firstPage).mockImplementationOnce(() => new Promise(() => {}));
  mount();
  await screen.findByText('Review 1');
  fireEvent.press(screen.getByRole('button', { name: 'Next reviews' }));
  expect(await screen.findByLabelText('Loading reviews')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Next reviews' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Previous reviews' })).toBeDisabled();
  fireEvent.press(screen.getByRole('button', { name: 'Next reviews' }));
  expect(loadReviews).toHaveBeenCalledTimes(2);
});

it('does not request reviews for an invalid product', () => {
  mount('meal', 0);
  expect(loadReviews).not.toHaveBeenCalled();
  expect(screen.queryByText('Customer reviews')).toBeNull();
});

it('dismisses the product modal before opening the editor or login boundary', async () => {
  loadReviews.mockResolvedValue(empty);
  const closeModal = jest.fn(() => expect(mockPush).not.toHaveBeenCalled());
  mount('snack', 8, closeModal);
  await screen.findByText('No reviews yet.');
  fireEvent.press(screen.getByText('Write or edit a review'));
  expect(closeModal).toHaveBeenCalledTimes(1);
  expect(mockPush).toHaveBeenCalledWith('/product-review/snack/8');
});
