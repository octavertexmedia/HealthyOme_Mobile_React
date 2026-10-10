import React, { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { storage } from '../../src/shared/storage/mmkv';

/** Old links remain valid without requesting GPS or changing saved addresses. */
export default function LegacyLocationOnboarding() {
  useEffect(() => { void storage.set('has_onboarded', 'true').catch(() => {}); }, []);
  return <Redirect href="/(tabs)" />;
}
