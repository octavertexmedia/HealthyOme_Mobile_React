import 'react-native-gesture-handler';
import 'react-native-reanimated';
import '../global.css';
import React, { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryProvider } from '../src/providers/QueryProvider';
import { colors } from '../src/shared/theme';
import * as SplashScreen from 'expo-splash-screen';
import { setAuthFailureHandler } from '../src/shared/api/client';
import { useAuthStore } from '../src/features/auth/store/auth.store';
import { registerPushToken, unregisterPushToken } from '../src/features/notifications/registerPushToken';
import { usePushDeepLink } from '../src/features/notifications/usePushDeepLink';
import { useCartSync } from '../src/features/cart/hooks/useCartSync';
import { initSentry } from '../src/shared/observability/sentry';
import { env } from '../src/shared/config/env';
import { CustomerShell } from '../src/shared/components/CustomerShell';
import { StartupScreen } from '../src/shared/components/StartupScreen';
import { withStartupDeadline } from '../src/shared/startup';

initSentry();

void SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const router = useRouter();
  const restoreSession = useAuthStore((s) => s.restoreSession);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const pushEnabled = useAuthStore((s) => s.user?.notify_push !== false);
  const [ready, setReady] = useState(false);
  const [startupFailed, setStartupFailed] = useState(false);
  const [startupAttempt, setStartupAttempt] = useState(0);
  usePushDeepLink();
  useCartSync();

  useEffect(() => {
    setAuthFailureHandler(() => {
      useAuthStore.getState().clearSession().catch(() => {});
      router.replace('/(auth)/login' as any);
    });
  }, [router]);

  useEffect(() => {
    let mounted = true;
    setStartupFailed(false);
    (async () => {
      try {
        await withStartupDeadline(async () => {
          if (!env.readOnlyPreview) await restoreSession();
        });
        if (mounted) setReady(true);
      } catch {
        if (mounted) setStartupFailed(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [restoreSession, startupAttempt]);

  // Hide the native launch view only after the JS route or retry screen commits.
  useEffect(() => {
    if (ready || startupFailed) void SplashScreen.hideAsync().catch(() => {});
  }, [ready, startupFailed]);

  useEffect(() => {
    if (env.readOnlyPreview) return;
    if (isAuthenticated && pushEnabled) {
      registerPushToken().catch(() => {});
    } else {
      unregisterPushToken().catch(() => {});
    }
  }, [isAuthenticated, pushEnabled]);

  if (!ready) return <StartupScreen failed={startupFailed} onRetry={() => setStartupAttempt((value) => value + 1)} />;

  return (
    <QueryProvider>
      <CustomerShell>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false, presentation: 'card' }} />
          <Stack.Screen name="meal/[id]" options={{ headerShown: false, presentation: 'card' }} />
          <Stack.Screen name="cart" options={{ headerShown: false }} />
          <Stack.Screen name="checkout" options={{ headerShown: false }} />
          <Stack.Screen name="orders/my/[id]" options={{ headerShown: false, presentation: 'card' }} />
          <Stack.Screen name="subscription" options={{ headerShown: false }} />
          <Stack.Screen name="bowl-builder" options={{ headerShown: false }} />
          <Stack.Screen name="rewards" options={{ headerShown: false }} />
          <Stack.Screen name="consult" options={{ headerShown: false }} />
          <Stack.Screen name="snacks" options={{ headerShown: false }} />
          <Stack.Screen name="functional-training" options={{ headerShown: false }} />
          <Stack.Screen name="profile-pages" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        </Stack>
      </CustomerShell>
    </QueryProvider>
  );
}
