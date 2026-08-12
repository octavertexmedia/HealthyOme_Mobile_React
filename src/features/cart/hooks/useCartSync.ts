import { useEffect, useRef } from 'react';
import { useAuthStore } from '../../auth/store/auth.store';
import { useCartStore, type CartItem } from '../store/cart.store';
import { cartApi, type CartSyncLine } from '../api/cart.api';

/**
 * Maps local cart lines to the meal/snack lines /cart/sync/ accepts.
 * Meal lines key by a numeric id; snack lines by a `snack-<id>` id. Custom bowls
 * (`bowl-*`) can't be represented server-side and are intentionally omitted here
 * (they are preserved locally by the store's hydrateFromServer instead).
 */
const toSyncLines = (items: CartItem[]): CartSyncLine[] => {
  const lines: CartSyncLine[] = [];
  for (const item of items) {
    if (item.qty <= 0) continue;
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
 * Syncs the local Zustand cart with the server when the user becomes authenticated.
 *
 * Strategy:
 *   1. Local items are POSTed to /cart/sync/ (server uses max-quantity merge).
 *   2. The merged server cart replaces the local store via hydrateFromServer.
 *
 * Runs once per login (tracked by a ref). On logout (isAuthenticated → false),
 * the ref resets so the next login re-syncs.
 */
export function useCartSync() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const synced = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      synced.current = false;
      return;
    }
    if (synced.current) return;
    synced.current = true;

    (async () => {
      try {
        const local = useCartStore.getState().items;
        const payload = toSyncLines(local);

        const server =
          payload.length > 0
            ? await cartApi.sync(payload)
            : await cartApi.get();

        useCartStore.getState().hydrateFromServer(server);
      } catch {
        synced.current = false; // allow retry on next mount
      }
    })();
  }, [isAuthenticated]);
}
