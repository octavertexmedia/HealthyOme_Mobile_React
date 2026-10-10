import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useSiteSettings } from '../hooks/useMeals';
import { customerFeatures } from '../customerFeatures';

export function CustomerFeatureGate({ feature, children }: {
  feature: keyof ReturnType<typeof customerFeatures>;
  children: React.ReactNode;
}) {
  const settings = useSiteSettings();
  if (settings.isLoading) return <ActivityIndicator accessibilityLabel="Loading store settings" />;
  if (settings.isError && !settings.data) return (
    <View style={{ padding: 24 }}>
      <Text>Could not load store settings.</Text>
      <TouchableOpacity accessibilityRole="button" onPress={() => { void settings.refetch(); }} style={{ padding: 16 }}>
        <Text>Retry store settings</Text>
      </TouchableOpacity>
    </View>
  );
  if (!customerFeatures(settings.data)[feature]) return <Redirect href="/(tabs)" />;
  return <>{children}</>;
}
