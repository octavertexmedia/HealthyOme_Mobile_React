import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../auth/store/auth.store';
import { useCartStore, type CartItem } from '../store/cart.store';
import { cartApi, type CartSyncLine } from '../api/cart.api';

/**
 * Maps local cart items to the meal/snack lines the quote endpoint understands.
 * Custom bowls (bowl-* ids) can't be quoted server-side and are skipped.
 */
const toQuoteLines = (items: CartItem[]): CartSyncLine[] => {
  const lines: CartSyncLine[] = [];
  for (const item of items) {
    if (/^\d+$/.test(item.id)) {
      lines.push({ meal_item_id: parseInt(item.id, 10), quantity: item.qty });
    } else if (item.id.startsWith('snack-')) {
      const snackId = parseInt(item.id.slice('snack-'.length), 10);
      if (Number.isFinite(snackId)) {
        lines.push({ snack_item_id: snackId, quantity: item.qty });
      }
    }
  }
  return lines;
};

/**
 * Server-authoritative checkout totals (subtotal / shipping / discount /
 * payable_total) driven by the current cart. Sends the meal/snack lines with
 * replace:true so the server cart matches and is quoted in one round-trip.
 *
 * Only runs when authenticated with quotable lines. Callers should fall back to
 * a local estimate while `data` is undefined (loading / logged-out / bowl-only).
 */
export function useCheckoutQuote(couponCode?: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const items = useCartStore((s) => s.items);
  const lines = toQuoteLines(items);

  return useQuery({
    queryKey: ['cart', 'checkout-quote', lines, couponCode ?? ''],
    queryFn: () =>
      cartApi.checkoutQuote({
        items: lines,
        replace: true,
        ...(couponCode ? { coupon_code: couponCode } : {}),
      }),
    enabled: isAuthenticated && lines.length > 0,
    staleTime: 30 * 1000,
  });
}
