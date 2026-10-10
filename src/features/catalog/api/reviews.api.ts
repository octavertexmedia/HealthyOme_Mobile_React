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

export const reviewsApi = {
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
