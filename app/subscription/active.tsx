import React from 'react';
import { Redirect } from 'expo-router';

// This route was previously a hardcoded marketing/upsell page (OFFERS/FEATURES),
// but the profile "active subscription" card links here expecting the user's REAL
// active subscriptions. app/subscription/index.tsx already renders that list (with
// pause/resume), so redirect there instead of duplicating the screen.
export default function ActiveSubscriptionsScreen() {
  return <Redirect href="/subscription" />;
}
