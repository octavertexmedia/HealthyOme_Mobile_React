import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../auth/store/auth.store';
import { useCartStore } from '../store/cart.store';
import { cartApi } from '../api/cart.api';
import { projectCartForCheckout } from '../utils/checkout';

export interface CheckoutQuoteOptions {
  couponCode?: string;
  addressId?: number;
  enabled?: boolean;
}

/**
 * Server-authoritative checkout totals (subtotal / shipping / discount /
 * payable_total) driven by the current cart. Sends the meal/snack lines with
 * replace:true so the server cart matches and is quoted in one round-trip.
 *
 * The query does not run if any row cannot be represented by the server API.
 * That guard prevents `replace:true` from silently dropping a custom bowl or
 * malformed local line while quoting the remaining meals.
 */
export function useCheckoutQuote(options: CheckoutQuoteOptions = {}) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const items = useCartStore((s) => s.items);
  const projection = projectCartForCheckout(items);
  const couponCode = options.couponCode?.trim().toUpperCase();

  const query = useQuery({
    queryKey: [
      'cart',
      'checkout-quote',
      projection.lines,
      couponCode ?? '',
      options.addressId ?? null,
    ],
    queryFn: () =>
      cartApi.checkoutQuote({
        items: projection.lines,
        replace: true,
        ...(couponCode ? { coupon_code: couponCode } : {}),
        ...(options.addressId ? { address_id: options.addressId } : {}),
      }),
    enabled:
      (options.enabled ?? true) &&
      isAuthenticated &&
      projection.lines.length > 0 &&
      projection.unsupportedItems.length === 0,
    staleTime: 30 * 1000,
  });

  return { ...query, projection };
}
