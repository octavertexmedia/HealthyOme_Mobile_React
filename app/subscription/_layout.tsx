import React from 'react';
import { Stack } from 'expo-router';

export default function SubscriptionLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="categories" />
      <Stack.Screen name="my" />
      <Stack.Screen name="plans" />
      <Stack.Screen name="plans/[slug]" />
      <Stack.Screen name="create" />
      <Stack.Screen name="active" />
      <Stack.Screen name="manage/[id]" />
      <Stack.Screen name="recharge/[id]" />
    </Stack>
  );
}
