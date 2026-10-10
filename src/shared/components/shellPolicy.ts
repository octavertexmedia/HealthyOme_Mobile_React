// Exact allowlists: a new detail route must not inherit the entire browsing shell.
const brandedBrowseRoutes = new Set(['/', '/menu', '/catalog', '/snacks', '/training', '/functional-training', '/dietitian', '/consult']);
const tabRoutes = new Set([...brandedBrowseRoutes, '/orders', '/profile', '/subscription', '/subscription/categories', '/subscription/plans']);

/** Screens own compact titles/back controls; only main browsing owns full branding. */
export function customerShellPolicy(path: string, segments?: readonly string[]) {
  const withoutQuery = path.split(/[?#]/)[0];
  const normalized = (withoutQuery === '/(tabs)/index' ? '/' : withoutQuery.replace(/^\/\((auth|tabs)\)/, '')).replace(/\/+$/, '') || '/';
  const auth = /^\/(login|verify)(\/|$)/.test(normalized);
  // Root index and unresolved deep links have no route segments. Home is
  // '(tabs)', although usePathname reports '/' for both. Fail closed until the
  // navigator resolves the actual screen, never drawing browse chrome on splash.
  const startup = segments !== undefined && (segments.length === 0 || segments.every((segment) => segment === 'index'));
  const onboarding = normalized === '/index' || normalized.startsWith('/onboarding');
  const focused = normalized === '/checkout' || normalized.startsWith('/checkout/') || normalized === '/consult/health' || normalized.startsWith('/product-review/');
  const kind = startup ? 'startup' : auth ? 'auth' : onboarding ? 'onboarding' : focused ? 'focused' : brandedBrowseRoutes.has(normalized) ? 'browse' : 'detail';
  return {
    kind,
    header: kind === 'browse',
    tabs: !startup && !auth && !onboarding && !focused && tabRoutes.has(normalized),
    keyboard: !startup && !auth && !onboarding,
    // Consume system insets once even when there is no global bar. Auth owns its own.
    contentInsets: !startup && !auth && !onboarding,
  };
}
