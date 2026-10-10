import type { PlanMenuSchedule } from './api/subscription.api';

export const MENU_TIME_ZONE = 'Asia/Kolkata';
export type MenuRange = { from: string; to: string };
export function validServiceDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function menuDateRange(now = new Date()): MenuRange {
  const from = new Intl.DateTimeFormat('en-CA', { timeZone: MENU_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  const end = new Date(`${from}T12:00:00Z`); end.setUTCDate(end.getUTCDate() + 28);
  return { from, to: end.toISOString().slice(0, 10) };
}
export function formatMenuDate(date: string): string {
  if (!validServiceDate(date)) return 'Date not published';
  // Calendar labels must never shift with the customer's device timezone.
  return new Intl.DateTimeFormat('en-IN', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${date}T12:00:00Z`));
}
export function menuDates(range: MenuRange): string[] {
  const dates: string[] = [];
  if (!validServiceDate(range.from) || !validServiceDate(range.to)) return dates;
  const day = new Date(`${range.from}T12:00:00Z`);
  while (day.toISOString().slice(0, 10) <= range.to && dates.length < 32) {
    dates.push(day.toISOString().slice(0, 10)); day.setUTCDate(day.getUTCDate() + 1);
  }
  return dates;
}
export const menuQueryKey = (slug: string, id: number | undefined, range: MenuRange) => ['subscription-menu', slug, id, range.from, range.to] as const;
export function validateMenuSchedule(input: unknown, slug: string, id: number, range?: MenuRange): PlanMenuSchedule {
  const data = input as PlanMenuSchedule | null;
  const invalid = () => new Error('Invalid menu schedule');
  if (!data || data.slug !== slug || data.meal_plan_type_id !== id || !validServiceDate(data.from) || !validServiceDate(data.to) || data.to < data.from || !Array.isArray(data.days)) throw invalid();
  if (range && (data.from !== range.from || data.to !== range.to)) throw invalid();
  const seen = new Set<string>();
  const days = data.days.map((day) => {
    if (!day || !validServiceDate(day.date) || !Array.isArray(day.meals) || seen.has(day.date) || day.date < data.from || day.date > data.to) throw invalid();
    seen.add(day.date);
    if (day.meals.some((meal) => !meal || !Number.isInteger(meal.id) || typeof meal.name !== 'string' || !meal.name.trim())) throw invalid();
    return { ...day, meals: [...day.meals] };
  }).sort((a, b) => a.date.localeCompare(b.date));
  return { ...data, days };
}
export function menuDiet(value: string | null | undefined): string | null {
  const key = value?.trim().toLowerCase().replace(/[\s_-]/g, '');
  return ({ veg: 'veg', vegetarian: 'veg', nonveg: 'non_veg', nonvegetarian: 'non_veg', egg: 'egg', eggetarian: 'egg', vegan: 'vegan' } as Record<string, string>)[key ?? ''] ?? null;
}
export function filterMenuDays(days: PlanMenuSchedule['days'], filters: { category?: string; mealTime?: string; date?: string }) {
  return days.filter((day) => !filters.date || day.date === filters.date).map((day) => ({ ...day,
    meals: day.meals.filter((meal) => (!filters.category || (menuDiet(filters.category) !== null && menuDiet(meal.dietary_type) === menuDiet(filters.category))) &&
      (!filters.mealTime || meal.meal_time_name?.trim().toLowerCase() === filters.mealTime.trim().toLowerCase())),
  })).sort((a, b) => a.date.localeCompare(b.date));
}
export function menuNutrition(meal: PlanMenuSchedule['days'][number]['meals'][number]): string {
  const values = [['Calories', meal.calories, 'kcal'], ['Protein', meal.protein, 'g'], ['Carbs', meal.carbs, 'g'], ['Fats', meal.fats, 'g'], ['Fiber', meal.fiber, 'g']] as const;
  return values.filter(([, value]) => typeof value === 'number' && Number.isFinite(value) && value >= 0)
    .map(([label, value, unit]) => `${label}: ${value} ${unit}`).join(' · ') || 'Nutrition not published';
}
