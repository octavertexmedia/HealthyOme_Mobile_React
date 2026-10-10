import type { CheckoutQuote } from '../api/cart.api';
import type { CartItem } from '../store/cart.store';
import {
  checkoutQuoteCoversLines,
  checkoutQuoteBlockMessage,
  isValidCheckoutDate,
  normalizeCouponCode,
  projectCartForCheckout,
  tomorrowIso,
} from './checkout';

const item = (overrides: Partial<CartItem>): CartItem => ({
  id: '1',
  name: 'Meal',
  price: 100,
  qty: 1,
  ...overrides,
});

const quote = (overrides: Partial<CheckoutQuote> = {}): CheckoutQuote => ({
  order_kind: 'quick_meal',
  minimum_order_amount: 200,
  free_shipping_threshold: 500,
  standard_shipping_fee: 30,
  warnings: [],
  cart: null,
  subtotal: 250,
  shipping: 30,
  discount: 0,
  payable_total: 280,
  meets_minimum_order: true,
  can_checkout: true,
  zero_rupee_checkout: false,
  error: null,
  error_message: null,
  ...overrides,
});

describe('projectCartForCheckout', () => {
  it('maps valid meal and snack rows without changing quantities', () => {
    const result = projectCartForCheckout([
      item({ id: '42', qty: 2 }),
      item({ id: 'snack-7', name: 'Snack', qty: 3 }),
    ]);

    expect(result.lines).toEqual([
      { meal_item_id: 42, quantity: 2 },
      { snack_item_id: 7, quantity: 3 },
    ]);
    expect(result.unsupportedItems).toEqual([]);
  });

  it('keeps custom bowls visible as unsupported instead of silently dropping them', () => {
    const bowl = item({
      id: 'bowl-9',
      name: 'Custom Bowl',
      meta: { kind: 'custom-bowl' },
    });
    const result = projectCartForCheckout([item({ id: '42' }), bowl]);

    expect(result.lines).toEqual([{ meal_item_id: 42, quantity: 1 }]);
    expect(result.unsupportedItems).toEqual([bowl]);
    expect(result.customBowlItems).toEqual([bowl]);
  });

  it('rejects malformed identifiers and non-positive quantities', () => {
    const badSnack = item({ id: 'snack-nope' });
    const zeroQuantity = item({ id: '12', qty: 0 });
    const result = projectCartForCheckout([badSnack, zeroQuantity]);

    expect(result.lines).toEqual([]);
    expect(result.unsupportedItems).toEqual([badSnack, zeroQuantity]);
  });
});

describe('checkout input helpers', () => {
  const now = new Date(2026, 9, 10, 23, 30);

  it('normalizes coupon codes', () => {
    expect(normalizeCouponCode('  save20  ')).toBe('SAVE20');
  });

  it('uses the next local calendar day and rejects invalid or past dates', () => {
    expect(tomorrowIso(now)).toBe('2026-10-11');
    expect(isValidCheckoutDate('2026-10-11', now)).toBe(true);
    expect(isValidCheckoutDate('2026-10-10', now)).toBe(false);
    expect(isValidCheckoutDate('2026-02-30', now)).toBe(false);
    expect(isValidCheckoutDate('11-10-2026', now)).toBe(false);
  });
});

describe('checkoutQuoteBlockMessage', () => {
  it('uses the server error message when checkout is blocked', () => {
    expect(
      checkoutQuoteBlockMessage(
        quote({ can_checkout: false, error: 'invalid_coupon', error_message: 'Invalid coupon' })
      )
    ).toBe('Invalid coupon');
  });

  it('blocks a quote that skipped an unavailable cart row', () => {
    expect(
      checkoutQuoteBlockMessage(
        quote({ warnings: ['Meal #9 is unavailable and was skipped.'] })
      )
    ).toContain('Meal #9 is unavailable');
  });

  it('describes the minimum order when the server minimum is unmet', () => {
    expect(
      checkoutQuoteBlockMessage(
        quote({ can_checkout: false, meets_minimum_order: false, minimum_order_amount: 300 })
      )
    ).toBe('Minimum order is ₹300. Add more items to continue.');
  });

  it('returns no block for an approved quote', () => {
    expect(checkoutQuoteBlockMessage(quote())).toBeNull();
  });
});

describe('checkoutQuoteCoversLines', () => {
  const quotedMeal = {
    id: 20,
    meal_item_id: 7,
    snack_item_id: null,
    custom_bowl_id: null,
    name: 'Meal',
    image: '',
    unit_price: 100,
    price: 100,
    quantity: 2,
    line_total: 200,
    total: 200,
    calories: 300,
  };

  it('accepts an exact authoritative cart match', () => {
    expect(
      checkoutQuoteCoversLines(
        quote({ cart: { id: 1, items: [quotedMeal], total_items: 2, subtotal: 200, total_price: 200 } }),
        [{ meal_item_id: 7, quantity: 2 }]
      )
    ).toBe(true);
  });

  it('rejects a skipped line or changed quantity', () => {
    const serverQuote = quote({
      cart: { id: 1, items: [quotedMeal], total_items: 2, subtotal: 200, total_price: 200 },
    });
    expect(checkoutQuoteCoversLines(serverQuote, [{ meal_item_id: 7, quantity: 1 }])).toBe(false);
    expect(
      checkoutQuoteCoversLines(serverQuote, [
        { meal_item_id: 7, quantity: 2 },
        { snack_item_id: 4, quantity: 1 },
      ])
    ).toBe(false);
  });
});
