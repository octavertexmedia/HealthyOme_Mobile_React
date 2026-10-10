/** Reopen the actual product, including the snack detail sheet. */
export function cartItemDetailPath(id: string): `/meal/${string}` | `/snacks?snackId=${string}` | null {
  const snack = /^snack-([1-9]\d*)$/.exec(id)?.[1];
  if (snack && Number.isSafeInteger(Number(snack))) return `/snacks?snackId=${snack}`;
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) return null;
  return `/meal/${id}`;
}
