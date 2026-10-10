import { filterMenuDays, formatMenuDate, menuDateRange, menuDates, menuNutrition, menuQueryKey, validateMenuSchedule } from './menuSchedule';
import type { PlanMenuSchedule } from './api/subscription.api';

const schedule: PlanMenuSchedule = { slug: 'meal-plan', meal_plan_type_id: 74, from: '2026-10-10', to: '2026-11-07', days: [
  { date: '2026-10-12', meals: [{ id: 1, name: 'Lunch meal', dietary_type: 'veg', meal_time_name: 'Lunch', calories: null, protein: 0 }] },
  { date: '2026-10-10', meals: [{ id: 2, name: 'Dinner meal', dietary_type: 'veg', meal_time_name: 'Dinner' }, { id: 3, name: 'Chicken', dietary_type: 'non_veg', meal_time_name: 'Lunch' }] },
] };
it('pins the range to India time even when UTC is on the previous day', () => {
  expect(menuDateRange(new Date('2026-10-09T21:00:00Z'))).toEqual({ from: '2026-10-10', to: '2026-11-07' });
  expect(formatMenuDate('2026-10-10').replace(/,/g, '')).toContain('10 Oct 2026');
  expect(menuDates({ from: '2026-10-10', to: '2026-10-12' })).toEqual(['2026-10-10', '2026-10-11', '2026-10-12']);
});
it('sorts actual dates without mutating server rows', () => {
  expect(validateMenuSchedule(schedule, 'meal-plan', 74).days.map((day) => day.date)).toEqual(['2026-10-10', '2026-10-12']);
  expect(schedule.days[0].date).toBe('2026-10-12');
});
it.each([null, { ...schedule, slug: 'another-plan' }, { ...schedule, meal_plan_type_id: 69 }, { ...schedule, days: null }, { ...schedule, days: [{ date: '2026-02-30', meals: [] }] }, { ...schedule, days: [schedule.days[0], schedule.days[0]] }])('fails closed for malformed or cross-plan data', (data) => {
  expect(() => validateMenuSchedule(data, 'meal-plan', 74)).toThrow('Invalid menu schedule');
});
it('rejects a date-window mismatch and keeps cache keys scoped to plan/date', () => {
  expect(() => validateMenuSchedule(schedule, 'meal-plan', 74, { from: '2026-10-12', to: '2026-11-07' })).toThrow();
  expect(menuQueryKey('meal-plan', 74, schedule)).not.toEqual(menuQueryKey('another-plan', 69, schedule));
  expect(menuQueryKey('meal-plan', 74, schedule)).not.toEqual(menuQueryKey('meal-plan', 74, { from: '2026-10-11', to: schedule.to }));
});
it('filters the selected category/slot/date without leaking other meal times', () => {
  const days = filterMenuDays(schedule.days, { category: 'Veg', mealTime: 'Lunch', date: '2026-10-12' });
  expect(days).toHaveLength(1); expect(days[0].meals.map((meal) => meal.name)).toEqual(['Lunch meal']);
  expect(filterMenuDays(schedule.days, { category: 'Unknown', mealTime: 'Lunch' }).every((day) => day.meals.length === 0)).toBe(true);
  expect(filterMenuDays(schedule.days, { date: '2026-10-11' })).toEqual([]);
});
it('distinguishes a published zero from missing nutrition', () => {
  expect(menuNutrition(schedule.days[0].meals[0])).toBe('Protein: 0 g');
  expect(menuNutrition(schedule.days[1].meals[0])).toBe('Nutrition not published');
});
