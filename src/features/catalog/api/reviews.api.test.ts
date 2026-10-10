import apiClient from '../../../shared/api/client';
import { reviewsApi, type ReviewProductType } from './reviews.api';

jest.mock('../../../shared/api/client', () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn() } }));

const page = {
  rating: 4,
  count: 1,
  page: 1,
  has_more: false,
  results: [{ id: 7, user_name: 'Customer', rating: 4, comment: 'Fresh meal', created_at: '2026-10-10T10:00:00Z' }],
};

it.each(['meal', 'snack'] as const)('uses the public paginated %s contract without credentials or writes', async (type) => {
  jest.mocked(apiClient.get).mockResolvedValue({ data: { ...page, page: 2, my_review: { privateField: 'not retained' } } });
  await expect(reviewsApi.forProduct(type, 8, 2)).resolves.toEqual({ ...page, page: 2 });
  expect(apiClient.get).toHaveBeenCalledWith(`/product-reviews/${type}/8/`, {
    params: { page: 2 }, publicRequest: true,
  });
  expect(apiClient.post).not.toHaveBeenCalled();
});

it('accepts the observed public empty-page contract', async () => {
  const empty = { rating: null, count: 0, page: 1, has_more: false, results: [], my_review: null };
  jest.mocked(apiClient.get).mockResolvedValue({ data: empty });
  await expect(reviewsApi.forProduct('snack', 8)).resolves.toEqual({ rating: null, count: 0, page: 1, has_more: false, results: [] });
});

it.each([null, [], { ...page, results: undefined }, { ...page, rating: 8 }, { ...page, page: 2 }])(
  'rejects malformed or mismatched pages instead of calling them empty', async (data) => {
    jest.mocked(apiClient.get).mockResolvedValue({ data });
    await expect(reviewsApi.forProduct('meal', 8)).rejects.toThrow('Could not read');
  },
);

it.each([0, -1, 1.5, NaN])('rejects invalid product id %s before making a request', async (id) => {
  await expect(reviewsApi.forProduct('meal', id)).rejects.toThrow('Invalid review product');
  expect(apiClient.get).not.toHaveBeenCalled();
});

it('rejects unknown product types and out-of-range pages before making a request', async () => {
  await expect(reviewsApi.forProduct('other' as ReviewProductType, 8)).rejects.toThrow('Invalid review product');
  for (const invalid of [0, -1, 1.5, 1000001, NaN]) {
    await expect(reviewsApi.forProduct('snack', 8, invalid)).rejects.toThrow('Invalid review page');
  }
  expect(apiClient.get).not.toHaveBeenCalled();
});

it('preserves request failures for the error/retry UI', async () => {
  const failure = new Error('Unavailable');
  jest.mocked(apiClient.get).mockRejectedValue(failure);
  await expect(reviewsApi.forProduct('snack', 8)).rejects.toBe(failure);
});

it('loads the signed-in customer review separately from public cache data', async () => {
  const customer = { ...page, my_review: page.results[0] };
  jest.mocked(apiClient.get).mockResolvedValue({ data: customer });
  await expect(reviewsApi.forCustomer('snack', 8)).resolves.toEqual(customer);
  expect(apiClient.get).toHaveBeenCalledWith('/product-reviews/snack/8/', { params: { page: 1 } });
});

it('uses the verified review create/edit POST contract with validated, trimmed input', async () => {
  jest.mocked(apiClient.post).mockResolvedValue({ data: { ...page, my_review: page.results[0] } });
  await reviewsApi.save('meal', 8, { rating: 4, comment: ' Fresh meal ' });
  expect(apiClient.post).toHaveBeenCalledWith('/product-reviews/meal/8/', { rating: 4, comment: 'Fresh meal' });
});

it.each([{ rating: 0, comment: '' }, { rating: 6, comment: '' }, { rating: 2.5, comment: '' }, { rating: 5, comment: 'x'.repeat(2001) }])('rejects invalid review submissions locally', async (input) => {
  await expect(reviewsApi.save('snack', 8, input)).rejects.toThrow();
  expect(apiClient.post).not.toHaveBeenCalled();
});
