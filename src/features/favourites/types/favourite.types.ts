// Shapes mirror the Django view shop/api/misc_api.py favourites() / toggle_favourite()
// and the canonical web client frontend/src/services/favourites.service.ts.

// GET /favourites/ returns a bare JSON array of these (no pagination wrapper).
// Field names are assembled manually in the view (no DRF serializer) — do not rename.
export interface FavouriteItem {
  id: number; // UserFavourite pk
  meal_item_id: number; // ops.MealItem pk
  name: string;
  image: string | null;
  price: number | null; // active MealPricing.price, null if none active
  calories: number | string | null; // active MealPricing.calories
  created_at: string; // ISO 8601
}

// POST /favourites/toggle/ success body. `message` is present but the web client ignores it.
export interface ToggleFavouriteResponse {
  favourited: boolean;
  message?: string;
}
