import type { DeliveryScheduleDay, DeliveryScheduleSlot } from './api/subscription.api';

/** Only future open deliveries can be edited; completed or closed slots retain their snapshot. */
export function canChangeDeliveryAddress(day: DeliveryScheduleDay, slot: DeliveryScheduleSlot, today: string): boolean {
  const closed = /^(delivered|completed|cancelled|canceled|closed|out_for_delivery|dispatched)$/i;
  return day.date >= today && !day.kitchen_closed &&
    !closed.test(day.delivery_state ?? '') &&
    !closed.test(slot.delivery_state ?? '') &&
    !closed.test(slot.order_status ?? '') &&
    Number.isInteger(slot.meal_time_id) && slot.meal_time_id > 0;
}
