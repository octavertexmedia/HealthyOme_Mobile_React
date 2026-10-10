import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { storage } from '../src/shared/storage/mmkv';
import { StartupScreen } from '../src/shared/components/StartupScreen';
import { withStartupDeadline } from '../src/shared/startup';

export default function SplashScreen() {
  const router = useRouter();
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let mounted = true;
    setFailed(false);

    const checkOnboarding = async () => {
      const hasOnboardedStr = await withStartupDeadline(() => storage.getString('has_onboarded'));
      if (!mounted) return;

      if (hasOnboardedStr !== 'true') {
        router.replace('/onboarding');
      } else {
        router.replace('/(tabs)');
      }
    };

    void checkOnboarding().catch(() => { if (mounted) setFailed(true); });
    return () => { mounted = false; };
  }, [router, attempt]);

  return <StartupScreen failed={failed} onRetry={() => setAttempt((value) => value + 1)} />;
}
