import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '../../../shared/storage/mmkv';
import { useAuthStore } from '../../auth/store/auth.store';
import { cartApi } from '../api/cart.api';
import type { ServerCart } from '../api/cart.api';
import { mergeServerCartItems } from '../utils/cartReconciliation';

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
  ownerId: number | null;
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
        const sessionRevision = useAuthStore.getState().sessionRevision;
        run()
          .then((server) => {
            const session = useAuthStore.getState();
            if (session.isAuthenticated && session.sessionRevision === sessionRevision) get().hydrateFromServer(server);
          })
          .catch(() => {
            /* keep optimistic local state; retried on next sync */
          });
      };

      return {
        ownerId: null,
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

          set({ items: updated, ownerId: useAuthStore.getState().user?.id ?? get().ownerId, ...recalculate(updated) });
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
          // Preserve every optimistic row that has not received a server line
          // id yet. A reconciliation must never make another local add vanish.
          const items = mergeServerCartItems(cart.items ?? [], get().items);

          set({ items, ownerId: useAuthStore.getState().user?.id ?? get().ownerId, ...recalculate(items) });
        },
      };
    },
    {
      name: 'cart-store',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);

// A local reset must not DELETE the previous customer's server cart. Ignore
// late server responses through sessionRevision checks above and in useCartSync.
useAuthStore.subscribe((session, previous) => {
  const ownerId = useCartStore.getState().ownerId;
  if ((previous.isAuthenticated && !session.isAuthenticated) ||
      (session.user && ownerId !== null && ownerId !== session.user.id)) {
    useCartStore.setState({ items: [], totalItems: 0, totalPrice: 0, ownerId: null });
  }
});
