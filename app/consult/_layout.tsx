import React from 'react';
import { Stack } from 'expo-router';

export default function ConsultLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="booking" />
      <Stack.Screen name="intro" />
      <Stack.Screen name="my" />
      <Stack.Screen name="manage/[id]" />
    </Stack>
  );
}
