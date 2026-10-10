import React from 'react';
import SubscriptionPlanDetails from './PlanDetails';

// Compatibility for saved links: the menu is the same modal above plan details,
// never a second full-screen menu implementation.
export default function PlanMenu() {
  // Keep this plan mounted as its Modal dismisses. Navigating away in the same
  // update caused an Android Fabric child-already-parented crash on saved links.
  // Closing reveals the exact plan underneath; the normal page Back remains available.
  return <SubscriptionPlanDetails menuInitiallyOpen />;
}
