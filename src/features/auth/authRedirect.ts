const ALLOWED_PREFIXES = [
  '/checkout',
  '/cart',
  '/orders',
  '/subscription',
  '/consult',
  '/functional-training',
  '/rewards',
  '/profile-pages',
] as const;

/** Keep post-login navigation inside known customer routes. */
export function safeAuthRedirect(value: string | string[] | undefined): string | null {
  const candidate = (Array.isArray(value) ? value[0] : value)?.trim();
  if (!candidate || !candidate.startsWith('/') || candidate.startsWith('//')) return null;

  const path = candidate.split(/[?#]/, 1)[0];
  if (path.split('/').includes('..')) return null;
  return ALLOWED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  )
    ? candidate
    : null;
}
