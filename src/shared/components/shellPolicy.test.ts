import { customerShellPolicy } from './shellPolicy';

it.each(['/', '/(tabs)', '/(tabs)/index', '/(tabs)/snacks', '/snacks/', '/functional-training', '/consult'])('reserves full chrome for exact main browse route %s', (path) => {
  expect(customerShellPolicy(path)).toMatchObject({ kind: 'browse', header: true, tabs: true });
});
it.each(['/subscription/categories', '/subscription/plans?category=test', '/profile', '/orders'])('allows list-level tab access without a second brand bar on %s', (path) => {
  expect(customerShellPolicy(path)).toMatchObject({ header: false, tabs: true, contentInsets: true });
});
it.each(['/subscription/plans/meal-plan', '/subscription/menu/meal-plan', '/subscription/create', '/subscription/my', '/subscription/manage/42', '/cart', '/meal/42', '/functional-training/trainer', '/consult/booking', '/profile-pages/terms?slug=privacy', '/future-detail-route'])('fails closed to compact navigation on detail %s', (path) => {
  expect(customerShellPolicy(path)).toMatchObject({ kind: 'detail', header: false, tabs: false, contentInsets: true });
});
it.each(['/checkout', '/checkout/confirm', '/consult/health', '/product-review/snack/8'])('keeps the focused task free of global navigation on %s', (path) => {
  expect(customerShellPolicy(path)).toMatchObject({ kind: 'focused', header: false, tabs: false, keyboard: true });
});
it.each(['/login', '/(auth)/verify', '/onboarding', '/onboarding/location', '/index'])('leaves auth/onboarding insets and keyboard handling with the route %s', (path) => {
  expect(customerShellPolicy(path)).toMatchObject({ header: false, tabs: false, contentInsets: false, keyboard: false });
});
