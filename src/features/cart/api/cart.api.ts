import apiClient from '../../../shared/api/client';

/**
 * A single line in the server cart. Shape mirrors the Django serialize_cart
 * snapshot EXACTLY (shop/cart_service.py:156-219):
 *   - the line total field is `line_total` (aliased to `total`) — NOT `subtotal`
 *   - `unit_price` (aliased to `price`) is the per-unit price
 *   - `meal_item_id` is null for snack / custom-bowl lines, so the item is
 *     also tagged with `snack_item_id` / `custom_bowl_id`
 */
export interface ServerCartItem {
  id: number; // CartItem primary key (used for update/remove paths)
  meal_item_id: number | null;
  snack_item_id: number | null;
  custom_bowl_id: number | null;
  name: string;
  image: string;
  unit_price: number;
  price: number; // == unit_price
  quantity: number;
  line_total: number;
  total: number; // == line_total
  calories: number | null;
}

/**
 * The full cart snapshot returned by GET /cart/ and every mutation except
 * DELETE /cart/clear/ (serialize_cart). `total_price` is aliased to `subtotal`
 * server-side, so both are present and equal.
 */
export interface ServerCart {
  id: number;
  items: ServerCartItem[];
  total_items: number;
  subtotal: number;
  total_price: number; // == subtotal
}

/** DELETE /cart/clear/ returns this minimal shape (NOT a full snapshot). */
export interface ClearCartResponse {
  success: boolean;
  items: [];
  total_items: number;
  total_price: number;
}

/** A line accepted by /cart/sync/ and /cart/checkout-quote/. */
export type CartSyncLine =
  | { meal_item_id: number; quantity: number }
  | { snack_item_id: number; quantity: number };

export interface CheckoutQuoteRequest {
  items?: CartSyncLine[];
  replace?: boolean;
  coupon_code?: string;
  address_id?: number;
  subscription?: Record<string, unknown>;
}

/** Quick-meal branch of POST /cart/checkout-quote/ (cart_service.py:237-396). */
export interface CheckoutQuote {
  order_kind: string;
  minimum_order_amount: number;
  free_shipping_threshold: number;
  standard_shipping_fee: number;
  warnings: string[];
  cart: ServerCart | null;
  subtotal: number;
  shipping: number;
  discount: number;
  payable_total: number;
  meets_minimum_order: boolean;
  can_checkout: boolean;
  zero_rupee_checkout: boolean;
  error: string | null;
  error_message: string | null;
}

export const cartApi = {
  async get(): Promise<ServerCart> {
    const { data } = await apiClient.get<ServerCart>('/cart/');
    return data;
  },

  async sync(items: CartSyncLine[], replace = false): Promise<ServerCart> {
    const { data } = await apiClient.post<ServerCart>('/cart/sync/', {
      items,
      replace,
    });
    return data;
  },

  async add(mealItemId: number, quantity = 1): Promise<ServerCart> {
    const { data } = await apiClient.post<ServerCart>('/cart/add/', {
      meal_item_id: mealItemId,
      quantity,
    });
    return data;
  },

  /** PUT/PATCH /cart/update/<cartItemId>/ — itemId is CartItem.id, NOT meal_item_id. */
  async update(cartItemId: number, quantity: number): Promise<ServerCart> {
    const { data } = await apiClient.patch<ServerCart>(`/cart/update/${cartItemId}/`, {
      quantity,
    });
    return data;
  },

  /** DELETE /cart/remove/<cartItemId>/ — itemId is CartItem.id, NOT meal_item_id. */
  async remove(cartItemId: number): Promise<ServerCart> {
    const { data } = await apiClient.delete<ServerCart>(`/cart/remove/${cartItemId}/`);
    return data;
  },

  async clear(): Promise<ClearCartResponse> {
    const { data } = await apiClient.delete<ClearCartResponse>('/cart/clear/');
    return data;
  },

  /**
   * POST /cart/checkout-quote/ — server-authoritative totals (subtotal, shipping,
   * discount, payable_total) plus SiteSettings thresholds. Sending the current
   * meal/snack lines with replace:true makes the server cart match and quotes it.
   */
  async checkoutQuote(body: CheckoutQuoteRequest = {}): Promise<CheckoutQuote> {
    const { data } = await apiClient.post<CheckoutQuote>('/cart/checkout-quote/', body);
    return data;
  },
};
