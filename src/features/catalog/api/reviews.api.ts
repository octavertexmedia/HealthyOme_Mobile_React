import { z } from 'zod';
import apiClient from '../../../shared/api/client';

export type ReviewProductType = 'meal' | 'snack';

const reviewSchema = z.object({
  id: z.number().int().positive(),
  user_name: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string(),
  created_at: z.string(),
});

const reviewsPageSchema = z.object({
  rating: z.number().min(1).max(5).nullable(),
  count: z.number().int().nonnegative(),
  page: z.number().int().min(1).max(1000000),
  has_more: z.boolean(),
  results: z.array(reviewSchema).max(10),
});

export type ProductReviewsPage = z.infer<typeof reviewsPageSchema>;
const customerReviewsSchema = reviewsPageSchema.extend({ my_review: reviewSchema.nullable() });
const reviewInputSchema = z.object({ rating: z.number().int().min(1).max(5), comment: z.string().trim().max(2000) });

function productPath(productType: ReviewProductType, productId: number) {
  if (!['meal', 'snack'].includes(productType) || !Number.isSafeInteger(productId) || productId < 1) throw new Error('Invalid review product.');
  return `/product-reviews/${productType}/${productId}/`;
}

export const reviewsApi = {
  async forCustomer(productType: ReviewProductType, productId: number) {
    const { data } = await apiClient.get<unknown>(productPath(productType, productId), { params: { page: 1 } });
    return customerReviewsSchema.parse(data);
  },
  async save(productType: ReviewProductType, productId: number, input: { rating: number; comment: string }) {
    const path = productPath(productType, productId);
    const body = reviewInputSchema.parse(input);
    const { data } = await apiClient.post<unknown>(path, body);
    return customerReviewsSchema.parse(data);
  },
  async forProduct(productType: ReviewProductType, productId: number, page = 1): Promise<ProductReviewsPage> {
    if (!['meal', 'snack'].includes(productType) || !Number.isSafeInteger(productId) || productId < 1) {
      throw new Error('Invalid review product.');
    }
    if (!Number.isSafeInteger(page) || page < 1 || page > 1000000) {
      throw new Error('Invalid review page.');
    }
    // Public browsing never sends credentials or requests the legacy own-review API.
    const { data } = await apiClient.get<unknown>(`/product-reviews/${productType}/${productId}/`, {
      params: { page },
      publicRequest: true,
    });
    const parsed = reviewsPageSchema.safeParse(data);
    if (!parsed.success || parsed.data.page !== page) {
      throw new Error('Could not read the product reviews response.');
    }
    return parsed.data;
  },
};
