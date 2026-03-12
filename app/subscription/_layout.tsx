import React from 'react';
import { Stack } from 'expo-router';

export default function SubscriptionLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="plans" />
      <Stack.Screen name="create" />
      <Stack.Screen name="active" />
    </Stack>
  );
}
