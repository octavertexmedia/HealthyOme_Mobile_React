import { create } from 'zustand';
import { subscriptionReturnPath } from './subscriptionReturnPath';

export type SubscriptionDraft = Parameters<typeof subscriptionReturnPath>[0] & { title: string };
/** Memory only, no account/address/health data; not a purchasable cart row. */
export const useSubscriptionDraft = create<{ draft: SubscriptionDraft | null; save: (draft: SubscriptionDraft) => void; clear: () => void }>((set) => ({
  draft: null, save: (draft) => set({ draft }), clear: () => set({ draft: null }),
}));
