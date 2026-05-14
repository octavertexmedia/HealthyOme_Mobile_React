import { useEffect, useRef } from 'react';
import { useAuthStore } from '../../auth/store/auth.store';
import { useCartStore } from '../store/cart.store';
import { cartApi } from '../api/cart.api';

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
        const payload = local
          .map((i) => ({ meal_item_id: parseInt(i.id, 10), quantity: i.qty }))
          .filter((it) => Number.isFinite(it.meal_item_id) && it.quantity > 0);

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
