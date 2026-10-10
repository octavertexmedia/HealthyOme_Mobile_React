// Exact allowlists: a new detail route must not inherit the entire browsing shell.
const brandedBrowseRoutes = new Set(['/', '/menu', '/catalog', '/snacks', '/training', '/functional-training', '/dietitian', '/consult']);
const tabRoutes = new Set([...brandedBrowseRoutes, '/orders', '/profile', '/subscription', '/subscription/categories', '/subscription/plans']);

/** Screens own compact titles/back controls; only main browsing owns full branding. */
export function customerShellPolicy(path: string) {
  const withoutQuery = path.split(/[?#]/)[0];
  const normalized = (withoutQuery === '/(tabs)/index' ? '/' : withoutQuery.replace(/^\/\((auth|tabs)\)/, '')).replace(/\/+$/, '') || '/';
  const auth = /^\/(login|verify)(\/|$)/.test(normalized);
  const onboarding = normalized === '/index' || normalized.startsWith('/onboarding');
  const focused = normalized === '/checkout' || normalized.startsWith('/checkout/') || normalized === '/consult/health' || normalized.startsWith('/product-review/');
  const kind = auth ? 'auth' : onboarding ? 'onboarding' : focused ? 'focused' : brandedBrowseRoutes.has(normalized) ? 'browse' : 'detail';
  return {
    kind,
    header: kind === 'browse',
    tabs: !auth && !onboarding && !focused && tabRoutes.has(normalized),
    keyboard: !auth && !onboarding,
    // Consume system insets once even when there is no global bar. Auth owns its own.
    contentInsets: !auth && !onboarding,
  };
}
