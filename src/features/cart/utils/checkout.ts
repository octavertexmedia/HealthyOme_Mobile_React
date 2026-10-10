import type { CheckoutQuote, CartSyncLine } from '../api/cart.api';
import type { CartItem } from '../store/cart.store';

export interface CheckoutCartProjection {
  lines: CartSyncLine[];
  unsupportedItems: CartItem[];
  customBowlItems: CartItem[];
}

/**
 * Converts local cart rows into the exact set the server can safely replace.
 *
 * It is important that callers also inspect `unsupportedItems`: sending only
 * the returned lines with `replace: true` while unsupported local rows exist
 * would silently remove those rows from the server checkout.
 */
export function projectCartForCheckout(items: CartItem[]): CheckoutCartProjection {
  const lines: CartSyncLine[] = [];
  const unsupportedItems: CartItem[] = [];
  const customBowlItems: CartItem[] = [];

  for (const item of items) {
    if (!Number.isInteger(item.qty) || item.qty < 1) {
      unsupportedItems.push(item);
      continue;
    }

    if (/^\d+$/.test(item.id)) {
      lines.push({ meal_item_id: Number(item.id), quantity: item.qty });
      continue;
    }

    if (item.id.startsWith('snack-')) {
      const snackId = Number(item.id.slice('snack-'.length));
      if (Number.isInteger(snackId) && snackId > 0) {
        lines.push({ snack_item_id: snackId, quantity: item.qty });
        continue;
      }
    }

    unsupportedItems.push(item);
    if (item.id.startsWith('bowl-') || item.meta?.kind === 'custom-bowl') {
      customBowlItems.push(item);
    }
  }

  return { lines, unsupportedItems, customBowlItems };
}

export function normalizeCouponCode(value: string): string {
  return value.trim().toUpperCase();
}

export function tomorrowIso(now = new Date()): string {
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return [
    tomorrow.getFullYear(),
    String(tomorrow.getMonth() + 1).padStart(2, '0'),
    String(tomorrow.getDate()).padStart(2, '0'),
  ].join('-');
}

/** Checkout only accepts an actual local calendar date from tomorrow onward. */
export function isValidCheckoutDate(value: string, now = new Date()): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const candidate = new Date(year, month - 1, day);
  if (
    candidate.getFullYear() !== year ||
    candidate.getMonth() !== month - 1 ||
    candidate.getDate() !== day
  ) {
    return false;
  }

  return value >= tomorrowIso(now);
}

export function checkoutQuoteBlockMessage(quote?: CheckoutQuote): string | null {
  if (!quote) return 'Confirming your order total…';
  if (quote.error_message) return quote.error_message;
  if (quote.warnings.length > 0) {
    return `Your cart changed while it was being checked: ${quote.warnings.join(' ')}`;
  }
  if (!quote.meets_minimum_order && quote.minimum_order_amount > 0) {
    return `Minimum order is ₹${quote.minimum_order_amount}. Add more items to continue.`;
  }
  if (quote.can_checkout === false) {
    return 'Checkout is not available for this cart.';
  }
  return null;
}

/** Verifies that the authoritative quote contains every submitted row and quantity. */
export function checkoutQuoteCoversLines(
  quote: CheckoutQuote,
  expectedLines: CartSyncLine[]
): boolean {
  const quotedItems = quote.cart?.items ?? [];
  if (quotedItems.length !== expectedLines.length) return false;

  return expectedLines.every((line) =>
    quotedItems.some((item) => {
      if (item.quantity !== line.quantity) return false;
      if ('meal_item_id' in line) return item.meal_item_id === line.meal_item_id;
      return item.snack_item_id === line.snack_item_id;
    })
  );
}
