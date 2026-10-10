import { safeAuthRedirect } from './authRedirect';

describe('safeAuthRedirect', () => {
  it('preserves allowlisted customer routes and query parameters', () => {
    expect(safeAuthRedirect('/checkout?coupon=SAVE20')).toBe('/checkout?coupon=SAVE20');
    expect(safeAuthRedirect('/subscription/manage/12')).toBe('/subscription/manage/12');
    expect(safeAuthRedirect('/meal/42')).toBe('/meal/42');
    expect(safeAuthRedirect('/product-review/snack/8')).toBe('/product-review/snack/8');
    expect(safeAuthRedirect('/snacks?snackId=8')).toBe('/snacks?snackId=8');
    expect(safeAuthRedirect('/consult/health?booking=42')).toBe('/consult/health?booking=42');
  });

  it('rejects external, protocol-relative, traversal, and staff routes', () => {
    expect(safeAuthRedirect('https://example.com')).toBeNull();
    expect(safeAuthRedirect('//example.com')).toBeNull();
    expect(safeAuthRedirect('/checkout/../admin')).toBeNull();
    expect(safeAuthRedirect('/admin')).toBeNull();
    expect(safeAuthRedirect('/meal/../admin')).toBeNull();
  });
});
