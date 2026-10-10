import type { OrderStatus, OrderSummary } from './api/orders.api';

/** Subscription deliveries are managed by pausing/skipping the plan, not cancellation. */
export const isSubscriptionOrder = (orderType?: string | null): boolean =>
  (orderType ?? '').trim().toLowerCase() === 'subscription';

export const canCancelOrder = (
  orderType: string | null | undefined,
  status: OrderStatus | null | undefined
): boolean =>
  !isSubscriptionOrder(orderType) &&
  (status === 'pending' || status === 'confirmed');

/** The reorder endpoint only accepts previous quick-meal orders with a meal item. */
export const canReorderOrder = (
  order: Pick<OrderSummary, 'order_type' | 'meal_item_id'>
): boolean =>
  order.order_type === 'quick_meal' && order.meal_item_id != null;
