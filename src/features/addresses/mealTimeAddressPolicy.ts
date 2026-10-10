import type { DeliveryArea } from '../delivery-areas/api/deliveryAreas.api';
import type { MealTimeRef } from '../subscription/api/subscription.api';

export function standingMealTimes(options: MealTimeRef[]): MealTimeRef[] {
  return options.filter((item) => Number.isInteger(item.id) && item.id > 0 && item.is_active !== false && item.available_for_subscription !== false);
}

export function validateMealTimeAddressSelection(ids: number[], area: DeliveryArea | null, options?: MealTimeRef[]): number[] {
  const selected = [...new Set(ids)].sort((left, right) => left - right);
  if (!selected.length) return []; // Explicitly clear assignments, including on quick-meal addresses.
  if (area?.is_accepted !== true) throw new Error('Usual meal-time addresses must be in a subscription delivery area. Clear the meal-time selections or change the area.');
  if (!options) throw new Error('Load the available meal times before saving these assignments.');
  const allowed = new Set(standingMealTimes(options).map((item) => item.id));
  if (selected.some((id) => !allowed.has(id))) throw new Error('Remove unavailable meal times and select from the current list.');
  return selected;
}
