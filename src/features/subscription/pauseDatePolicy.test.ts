import type { DeliveryScheduleDay, ManageSubscriptionResponse } from './api/subscription.api';
import { subscriptionDateOptions, validateSubscriptionDateSelection } from './pauseDatePolicy';

const day = (date: string, extra: Partial<DeliveryScheduleDay> = {}): DeliveryScheduleDay => ({ date, slots: [{ meal_time_id: 17, meal_time_name: 'Lunch' }], ...extra });
const fixture = (extra: Partial<ManageSubscriptionResponse> = {}): ManageSubscriptionResponse => ({
  subscription: { id: 2, meal_plan_type: { id: 1, name: 'Plan' }, start_date: '2026-10-01', end_date: '2026-11-01', is_active: true, is_on_hold: true, pause_dates: ['2026-10-12', '2026-10-15'] },
  settings: null, fetched_at: '', plan_status: 'active', delivery_schedule: [day('2026-10-10'), day('2026-10-11'), day('2026-10-12', { paused: true }), day('2026-10-13', { kitchen_closed: true }), day('2026-10-14')], ...extra,
});

it('offers any eligible scheduled date, not a seven-day shortcut', () => {
  const data = fixture({ delivery_schedule: Array.from({ length: 12 }, (_, index) => day(`2026-10-${index + 16}`)) });
  expect(subscriptionDateOptions(data, 'pause', '2026-10-10')).toHaveLength(12);
  expect(subscriptionDateOptions(fixture(), 'pause', '2026-10-10')).toEqual(['2026-10-11', '2026-10-14']);
});
it('excludes delivered, dispatched, partial, cancelled, malformed and out-of-plan days', () => {
  const data = fixture({ delivery_schedule: [day('2026-10-17', { delivery_state: 'delivered' }), day('2026-10-18', { delivery_state: 'partial' }), day('2026-10-19', { slots: [{ meal_time_id: 1, meal_time_name: 'Lunch', order_status: 'dispatched' }] }), day('2026-10-20', { delivery_state: 'cancelled' }), day('2026-02-30'), day('2026-11-02'), day('2026-09-30'), day('2026-10-21', { slots: [] })] });
  expect(subscriptionDateOptions(data, 'pause', '2026-10-10')).toEqual([]);
});
it('offers explicit paused dates outside the displayed schedule, excluding past dates', () => {
  expect(subscriptionDateOptions(fixture(), 'resume', '2026-10-13')).toEqual(['2026-10-15']);
});
it('disables inactive/ended plans and unsupported not-on-hold resume', () => {
  expect(subscriptionDateOptions(fixture({ plan_status: 'ended' }), 'pause', '2026-10-10')).toEqual([]);
  const data = fixture(); data.subscription.is_active = false;
  expect(subscriptionDateOptions(data, 'resume', '2026-10-10')).toEqual([]);
  data.subscription.is_active = true; data.subscription.is_on_hold = false;
  expect(subscriptionDateOptions(data, 'resume', '2026-10-10')).toEqual([]);
});
it('rejects empty/stale selections and deduplicates selected dates', () => {
  expect(() => validateSubscriptionDateSelection([], ['2026-10-11'])).toThrow('Select at least one');
  expect(() => validateSubscriptionDateSelection(['2026-10-12'], ['2026-10-11'])).toThrow('no longer available');
  expect(validateSubscriptionDateSelection(['2026-10-14', '2026-10-11', '2026-10-11'], ['2026-10-11', '2026-10-14'])).toEqual(['2026-10-11', '2026-10-14']);
});
