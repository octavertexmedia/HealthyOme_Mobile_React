import 'react-native-gesture-handler';
import 'react-native-reanimated';
import '../global.css';
import React, { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { QueryProvider } from '../src/providers/QueryProvider';
import { colors } from '../src/shared/theme';
import * as SplashScreen from 'expo-splash-screen';
import { setAuthFailureHandler } from '../src/shared/api/client';
import { useAuthStore } from '../src/features/auth/store/auth.store';
import { registerPushToken, unregisterPushToken } from '../src/features/notifications/registerPushToken';
import { usePushDeepLink } from '../src/features/notifications/usePushDeepLink';
import { useCartSync } from '../src/features/cart/hooks/useCartSync';
import { initSentry } from '../src/shared/observability/sentry';

initSentry();

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const restoreSession = useAuthStore((s) => s.restoreSession);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const pushEnabled = useAuthStore((s) => s.user?.notify_push !== false);
  const [ready, setReady] = useState(false);
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
    (async () => {
      try {
        await restoreSession();
      } finally {
        if (mounted) {
          setReady(true);
          await SplashScreen.hideAsync();
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [restoreSession]);

  useEffect(() => {
    if (isAuthenticated && pushEnabled) {
      registerPushToken().catch(() => {});
    } else {
      unregisterPushToken().catch(() => {});
    }
  }, [isAuthenticated, pushEnabled]);

  if (!ready) return null;

  return (
    <QueryProvider>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false, presentation: 'modal' }} />
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
      </View>
    </QueryProvider>
  );
}
