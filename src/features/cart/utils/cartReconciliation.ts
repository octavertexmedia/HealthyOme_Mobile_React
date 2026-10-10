import type { ServerCartItem } from '../api/cart.api';
import type { CartItem } from '../store/cart.store';

/** Stable local id for each kind of server cart row. */
export function localIdForServerItem(item: ServerCartItem): string {
  if (item.meal_item_id != null) return String(item.meal_item_id);
  if (item.snack_item_id != null) return `snack-${item.snack_item_id}`;
  if (item.custom_bowl_id != null) return `bowl-${item.custom_bowl_id}`;
  return `cart-${item.id}`;
}

/**
 * Rebuilds a local cart from an authoritative server snapshot without deleting
 * optimistic rows that have never received a server CartItem id. Rows that the
 * server did return are de-duplicated by their stable local id.
 */
export function mergeServerCartItems(
  serverItems: ServerCartItem[],
  currentItems: CartItem[]
): CartItem[] {
  const mapped: CartItem[] = serverItems.map((item) => ({
    id: localIdForServerItem(item),
    serverItemId: item.id,
    name: item.name,
    price: Number(item.unit_price ?? item.price),
    qty: item.quantity,
    image: item.image,
    calories: item.calories,
  }));

  const serverIds = new Set(mapped.map((item) => item.id));
  const optimistic = currentItems.filter(
    (item) => item.serverItemId == null && !serverIds.has(item.id)
  );

  return [...mapped, ...optimistic];
}
