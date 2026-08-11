import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '../../../shared/storage/mmkv';
import { useAuthStore } from '../../auth/store/auth.store';
import { cartApi } from '../api/cart.api';
import type { ServerCart, ServerCartItem } from '../api/cart.api';

export interface CartItem {
  id: string;
  serverItemId?: number | null;
  name: string;
  price: number;
  qty: number;
  image?: string;
  calories?: number | null;
  category?: string;
  meta?: Record<string, unknown>;
}

interface CartStore {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;

  addItem: (item: Omit<CartItem, 'qty'> & { quantity?: number }) => void;
  updateQuantity: (id: string, qty: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  hydrateFromServer: (cart: ServerCart) => void;
}

const recalculate = (items: CartItem[]) => ({
  totalItems: items.reduce((sum, i) => sum + i.qty, 0),
  totalPrice: items.reduce((sum, i) => sum + i.price * i.qty, 0),
});

/**
 * Stable local id for a server line. Meal lines key by meal id (so they match
 * the ids used by the menu/home/meal screens); snack and custom-bowl lines key
 * by their own id, since meal_item_id is null for them.
 */
const localIdForServerItem = (si: ServerCartItem): string => {
  if (si.meal_item_id != null) return String(si.meal_item_id);
  if (si.snack_item_id != null) return `snack-${si.snack_item_id}`;
  if (si.custom_bowl_id != null) return `bowl-${si.custom_bowl_id}`;
  return `cart-${si.id}`;
};

/** A local-only line (e.g. a custom bowl) that the server snapshot can't carry. */
const isLocalOnly = (item: CartItem): boolean =>
  item.id.startsWith('bowl-') || item.meta?.kind === 'custom-bowl';

const isAuthed = () => useAuthStore.getState().isAuthenticated;

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => {
      /**
       * Fire-and-forget server reconciliation. Runs a mutation, then rebuilds
       * the local cart from the authoritative server snapshot. Errors are
       * swallowed so the optimistic local state stands and useCartSync can
       * reconcile on the next login.
       */
      const reconcile = (run: () => Promise<ServerCart>) => {
        if (!isAuthed()) return;
        run()
          .then((server) => get().hydrateFromServer(server))
          .catch(() => {
            /* keep optimistic local state; retried on next sync */
          });
      };

      return {
        items: [],
        totalItems: 0,
        totalPrice: 0,

        addItem: ({ quantity = 1, ...item }) => {
          const items = get().items;
          const existing = items.find((i) => i.id === item.id);
          let updated: CartItem[];

          if (existing) {
            updated = items.map((i) =>
              i.id === item.id ? { ...i, qty: i.qty + quantity } : i
            );
          } else {
            updated = [...items, { ...item, qty: quantity }];
          }

          set({ items: updated, ...recalculate(updated) });
          // NOTE: server add is intentionally NOT fired here — the meal-detail
          // screen already POSTs /cart/add/ itself, so syncing in-store too
          // would double-add. Menu/home quick-adds reconcile via useCartSync.
        },

        updateQuantity: (id, qty) => {
          if (qty <= 0) {
            get().removeItem(id);
            return;
          }
          const updated = get().items.map((i) =>
            i.id === id ? { ...i, qty } : i
          );
          set({ items: updated, ...recalculate(updated) });

          const item = updated.find((i) => i.id === id);
          if (!item) return;
          if (item.serverItemId != null) {
            // Server line exists: PUT/PATCH the exact quantity.
            reconcile(() => cartApi.update(item.serverItemId as number, qty));
          } else if (/^\d+$/.test(id)) {
            // Meal with no server line yet: create it at the target quantity.
            reconcile(() => cartApi.add(parseInt(id, 10), qty));
          }
        },

        removeItem: (id) => {
          const removed = get().items.find((i) => i.id === id);
          const updated = get().items.filter((i) => i.id !== id);
          set({ items: updated, ...recalculate(updated) });

          if (removed?.serverItemId != null) {
            reconcile(() => cartApi.remove(removed.serverItemId as number));
          }
        },

        clearCart: () => {
          const hadServerLines =
            isAuthed() && get().items.some((i) => i.serverItemId != null);
          set({ items: [], totalItems: 0, totalPrice: 0 });
          if (hadServerLines) {
            cartApi.clear().catch(() => {
              /* local cart is already empty; server retried on next sync */
            });
          }
        },

        hydrateFromServer: (cart) => {
          const serverItems: CartItem[] = (cart.items ?? []).map((si) => ({
            id: localIdForServerItem(si),
            serverItemId: si.id,
            name: si.name,
            price: Number(si.unit_price ?? si.price),
            qty: si.quantity,
            image: si.image,
            calories: si.calories,
          }));

          // Preserve local-only lines (custom bowls) the server can't represent
          // so a server reconcile never silently drops them.
          const serverIds = new Set(serverItems.map((i) => i.id));
          const preserved = get().items.filter(
            (i) => isLocalOnly(i) && !serverIds.has(i.id)
          );
          const items = [...serverItems, ...preserved];

          set({ items, ...recalculate(items) });
        },
      };
    },
    {
      name: 'cart-store',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
