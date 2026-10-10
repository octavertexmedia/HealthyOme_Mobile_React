import { cartItemDetailPath } from './cartNavigation';

it('opens the actual meal detail for a numeric cart row', () => {
  expect(cartItemDetailPath('42')).toBe('/meal/42');
});

it.each(['snack-42', 'bowl-42', 'cart-42', '0', '-1', '42/../admin', '9007199254740992'])(
  'does not misroute unsupported or malformed row %s', (id) => {
    expect(cartItemDetailPath(id)).toBeNull();
  }
);
