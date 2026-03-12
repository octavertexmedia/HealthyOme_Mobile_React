import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandMMKVStorage } from '../../../shared/storage/mmkv';

export interface CartItem {
  id: string;
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
}

const recalculate = (items: CartItem[]) => ({
  totalItems: items.reduce((sum, i) => sum + i.qty, 0),
  totalPrice: items.reduce((sum, i) => sum + i.price * i.qty, 0),
});

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
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
      },

      removeItem: (id) => {
        const updated = get().items.filter((i) => i.id !== id);
        set({ items: updated, ...recalculate(updated) });
      },

      clearCart: () => set({ items: [], totalItems: 0, totalPrice: 0 }),
    }),
    {
      name: 'cart-store',
      storage: createJSONStorage(() => zustandMMKVStorage),
    }
  )
);
