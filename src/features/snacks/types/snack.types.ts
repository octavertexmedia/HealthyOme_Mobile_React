/**
 * Snacks catalog types — mirrors the Django `shop.SnackItemViewSet` /
 * `SnackItemSerializer` shapes exactly (see contracts/snacks.json).
 *
 * Field-name traps preserved from the API:
 *  - price / original_price and the macros protein/carbs/fats/fiber arrive as
 *    decimal STRINGS (e.g. "120.00"); parse before doing math.
 *  - calories is a number (or null).
 *  - `category` is a nested object (or null) — not a bare id.
 *  - the category thumbnail lives on `image_url` (resolved); `image` is the raw
 *    stored path.
 */

export type SnackDietaryType = 'veg' | 'non_veg' | 'vegan' | 'egg';

export interface SnackCategory {
  id: number;
  name: string;
  image: string;
  image_url: string | null;
  sort_order: number;
}

export interface SnackItem {
  id: number;
  name: string;
  excerpt: string;
  description: string;
  /** Resolved image URL, '' if none. */
  image: string;
  category: SnackCategory | null;
  dietary_type: string;
  is_active: boolean;
  /** Decimal-as-string (e.g. "120.00") or null when no pricing row. */
  price: string | null;
  original_price: string | null;
  calories: number | null;
  /** Decimal-as-string or null. */
  protein: string | null;
  carbs: string | null;
  fats: string | null;
  fiber: string | null;
}
