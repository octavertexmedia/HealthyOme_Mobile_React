import { safeAuthRedirect } from './authRedirect';

describe('safeAuthRedirect', () => {
  it('preserves allowlisted customer routes and query parameters', () => {
    expect(safeAuthRedirect('/checkout?coupon=SAVE20')).toBe('/checkout?coupon=SAVE20');
    expect(safeAuthRedirect('/subscription/manage/12')).toBe('/subscription/manage/12');
  });

  it('rejects external, protocol-relative, traversal, and staff routes', () => {
    expect(safeAuthRedirect('https://example.com')).toBeNull();
    expect(safeAuthRedirect('//example.com')).toBeNull();
    expect(safeAuthRedirect('/checkout/../admin')).toBeNull();
    expect(safeAuthRedirect('/admin')).toBeNull();
  });
});
