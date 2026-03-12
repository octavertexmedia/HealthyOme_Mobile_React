import { create } from 'zustand';

interface BowlIngredient {
  id: number;
  name: string;
  ingredient_type: string;
  price: number;
  icon_type: string;
}

interface BowlBase {
  id: number;
  name: string;
  price: number;
}

interface BowlStore {
  base: BowlBase | null;
  ingredients: BowlIngredient[];
  preparation: 'warm' | 'cold';
  totalPrice: number;

  setBase: (base: BowlBase) => void;
  toggleIngredient: (ingredient: BowlIngredient) => void;
  setPreparation: (prep: 'warm' | 'cold') => void;
  reset: () => void;
}

export const useBowlStore = create<BowlStore>((set, get) => ({
  base: null,
  ingredients: [],
  preparation: 'warm',
  totalPrice: 0,

  setBase: (base) => {
    const ingredientTotal = get().ingredients.reduce((sum, i) => sum + i.price, 0);
    set({ base, totalPrice: base.price + ingredientTotal });
  },

  toggleIngredient: (ingredient) => {
    const current = get().ingredients;
    const exists = current.find((i) => i.id === ingredient.id);
    let updated: BowlIngredient[];

    if (exists) {
      updated = current.filter((i) => i.id !== ingredient.id);
    } else {
      updated = [...current, ingredient];
    }

    const basePrice = get().base?.price || 0;
    const ingredientTotal = updated.reduce((sum, i) => sum + i.price, 0);
    set({ ingredients: updated, totalPrice: basePrice + ingredientTotal });
  },

  setPreparation: (preparation) => set({ preparation }),

  reset: () => set({ base: null, ingredients: [], preparation: 'warm', totalPrice: 0 }),
}));
