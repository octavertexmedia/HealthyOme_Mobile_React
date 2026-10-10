/** Only meal rows currently have a native product-detail screen. */
export function cartItemDetailPath(id: string): `/meal/${string}` | null {
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) return null;
  return `/meal/${id}`;
}
