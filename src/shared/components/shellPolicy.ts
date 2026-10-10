/** Auth owns its brand/back controls; focused checkout owns its title and CTA. */
export function customerShellPolicy(path: string) {
  const normalized = path.replace('/(auth)', '').replace('/(tabs)', '') || '/';
  const auth = /^\/(login|verify)(\/|$)/.test(normalized);
  const onboarding = normalized === '/index' || normalized.startsWith('/onboarding');
  const focused = normalized === '/checkout' || normalized.startsWith('/checkout/') || normalized === '/consult/health' || normalized.startsWith('/product-review/');
  return { header: !auth && !onboarding && !focused, tabs: !auth && !onboarding && !focused, keyboard: !auth && !onboarding };
}
