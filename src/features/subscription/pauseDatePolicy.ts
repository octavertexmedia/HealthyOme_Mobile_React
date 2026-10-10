import type { ManageSubscriptionResponse } from './api/subscription.api';
import { isCalendarDate, uniqueDates } from '../../shared/utils/calendarDates';

export type SubscriptionDateAction = 'pause' | 'resume';

export function subscriptionDateOptions(data: ManageSubscriptionResponse, action: SubscriptionDateAction, today: string): string[] {
  const { subscription, delivery_schedule: schedule } = data;
  if (!subscription.is_active || data.plan_status === 'ended') return [];
  const paused = new Set([
    ...(subscription.pause_dates ?? []),
    ...schedule.filter((day) => day.paused || day.delivery_state === 'paused' || day.slots.some((slot) => slot.paused)).map((day) => day.date),
  ]);
  const closed = /^(delivered|completed|closed|out_for_delivery|dispatched)$/i;
  const blocked = (date: string) => schedule.some((day) => day.date === date && (
    day.kitchen_closed || day.delivery_state === 'partial' || closed.test(day.delivery_state ?? '') ||
    day.slots.some((slot) => closed.test(slot.delivery_state ?? '') || closed.test(slot.order_status ?? ''))
  ));
  if (action === 'resume') {
    // The current backend is a no-op when is_on_hold=false; do not offer a false success.
    if (!subscription.is_on_hold) return [];
    return uniqueDates([...paused].filter((date) => isCalendarDate(date) && date >= today && !blocked(date)));
  }
  return uniqueDates(schedule.filter((day) => isCalendarDate(day.date) && day.date > today &&
    day.date >= subscription.start_date && (!subscription.end_date || day.date <= subscription.end_date) &&
    day.slots.length > 0 && !paused.has(day.date) && !blocked(day.date) &&
    day.delivery_state !== 'cancelled' && !day.slots.some((slot) => /^(cancelled|canceled)$/i.test(slot.order_status ?? ''))
  ).map((day) => day.date));
}

export function validateSubscriptionDateSelection(selected: string[], eligible: string[]): string[] {
  const dates = uniqueDates(selected);
  if (!dates.length) throw new Error('Select at least one delivery date.');
  if (dates.some((date) => !eligible.includes(date))) throw new Error('Some selected dates are no longer available. Refresh the schedule and select again.');
  return dates;
}
