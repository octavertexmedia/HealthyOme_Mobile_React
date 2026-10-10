import React, { useCallback } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import SubscriptionPlanDetails from './PlanDetails';

// Compatibility for saved links: the menu is the same modal above plan details,
// never a second full-screen menu implementation.
export default function PlanMenu() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const dismiss = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace({ pathname: '/subscription/plans/[slug]', params: { slug } });
  }, [router, slug]);
  return <SubscriptionPlanDetails menuInitiallyOpen onMenuDismiss={dismiss} />;
}
