import { useEffect, useState } from 'react';

/**
 * Returns `value` after `delay`ms of stability. Use for search inputs that
 * shouldn't fire a query on every keystroke.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}
