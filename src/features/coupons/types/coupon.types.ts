export type CouponDiscountType = 'percentage' | 'fixed';

export type CouponApplicableOn =
  | 'all'
  | 'subscription'
  | 'quick_meal'
  | 'snacks'
  | 'consult'
  | 'functional_training';

// Matches the effective CouponSerializer (shop/serializers.py:770).
// DRF serializes DecimalFields as STRINGS.
export interface Coupon {
  id: number;
  code: string;
  description: string;
  discount_type: CouponDiscountType;
  discount_value: string;
  max_discount: string | null;
  min_order_amount: string;
  valid_from: string;
  valid_until: string;
  usage_limit: number | null;
  usage_count: number;
  is_active: boolean;
  applicable_on: CouponApplicableOn;
}
