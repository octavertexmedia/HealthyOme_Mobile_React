import type { ServerCartItem } from '../api/cart.api';
import type { CartItem } from '../store/cart.store';
import { mergeServerCartItems } from './cartReconciliation';

const serverItem = (overrides: Partial<ServerCartItem>): ServerCartItem => ({
  id: 100,
  meal_item_id: 1,
  snack_item_id: null,
  custom_bowl_id: null,
  name: 'Meal',
  image: '',
  unit_price: 150,
  price: 150,
  quantity: 1,
  line_total: 150,
  total: 150,
  calories: 400,
  ...overrides,
});

const localItem = (overrides: Partial<CartItem>): CartItem => ({
  id: '1',
  name: 'Meal',
  price: 150,
  qty: 1,
  ...overrides,
});

describe('mergeServerCartItems', () => {
  it('uses authoritative server values for matching rows', () => {
    const result = mergeServerCartItems(
      [serverItem({ quantity: 3, unit_price: 175 })],
      [localItem({ qty: 1, price: 150 })]
    );

    expect(result).toEqual([
      expect.objectContaining({ id: '1', serverItemId: 100, qty: 3, price: 175 }),
    ]);
  });

  it('preserves optimistic meal, snack and bowl rows absent from the snapshot', () => {
    const optimistic = [
      localItem({ id: '2', name: 'Unsynced meal' }),
      localItem({ id: 'snack-4', name: 'Unsynced snack' }),
      localItem({ id: 'bowl-8', name: 'Unsynced bowl', meta: { kind: 'custom-bowl' } }),
    ];

    const result = mergeServerCartItems([serverItem({})], optimistic);

    expect(result.map((entry) => entry.id)).toEqual(['1', '2', 'snack-4', 'bowl-8']);
  });

  it('does not retain a stale server-backed row missing from the snapshot', () => {
    const stale = localItem({ id: '9', serverItemId: 999, name: 'Removed elsewhere' });

    expect(mergeServerCartItems([], [stale])).toEqual([]);
  });
});
