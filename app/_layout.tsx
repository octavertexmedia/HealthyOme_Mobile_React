import '../global.css';
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { QueryProvider } from '../src/providers/QueryProvider';
import { colors } from '../src/shared/theme';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    const prepare = async () => {
      // Load fonts, restore auth, etc.
      await new Promise(resolve => setTimeout(resolve, 500));
      await SplashScreen.hideAsync();
    };
    prepare();
  }, []);

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
          <Stack.Screen name="subscription" options={{ headerShown: false }} />
          <Stack.Screen name="bowl-builder" options={{ headerShown: false }} />
          <Stack.Screen name="rewards" options={{ headerShown: false }} />
          <Stack.Screen name="consult" options={{ headerShown: false }} />
          <Stack.Screen name="profile-pages" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        </Stack>
      </View>
    </QueryProvider>
  );
}
