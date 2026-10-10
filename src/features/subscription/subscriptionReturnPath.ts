/** Only non-sensitive customization belongs in navigation; never an address or token. */
export function subscriptionReturnPath(draft: {
  plan?: string; planId?: number; startDate: string; mealTimeIds: number[];
  vegDays: number[]; instructions: string; whatsappUpdates: boolean;
}): string {
  const query = new URLSearchParams({
    startDate: draft.startDate, mealTimes: draft.mealTimeIds.join(','),
    vegDays: draft.vegDays.join(','), instructions: draft.instructions,
    whatsapp: String(draft.whatsappUpdates),
  });
  if (draft.plan) query.set('plan', draft.plan);
  if (draft.planId) query.set('planId', String(draft.planId));
  return `/subscription/create?${query.toString()}`;
}
