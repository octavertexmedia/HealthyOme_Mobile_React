import {
  canCancelOrder,
  canReorderOrder,
  isSubscriptionOrder,
} from './orderPolicies';

describe('order policies', () => {
  it('never allows a subscription delivery to be cancelled by the customer', () => {
    expect(isSubscriptionOrder('subscription')).toBe(true);
    expect(canCancelOrder('subscription', 'pending')).toBe(false);
    expect(canCancelOrder('subscription', 'confirmed')).toBe(false);
  });

  it('only allows early non-subscription orders to be cancelled', () => {
    expect(canCancelOrder('quick_meal', 'pending')).toBe(true);
    expect(canCancelOrder('quick_meal', 'confirmed')).toBe(true);
    expect(canCancelOrder('quick_meal', 'preparing')).toBe(false);
    expect(canCancelOrder('quick_meal', 'delivered')).toBe(false);
  });

  it('only offers reorder for quick meals backed by a meal item', () => {
    expect(canReorderOrder({ order_type: 'quick_meal', meal_item_id: 42 })).toBe(true);
    expect(canReorderOrder({ order_type: 'quick_meal', meal_item_id: null })).toBe(false);
    expect(canReorderOrder({ order_type: 'subscription', meal_item_id: 42 })).toBe(false);
    expect(canReorderOrder({ order_type: 'snack', meal_item_id: 42 })).toBe(false);
  });
});
