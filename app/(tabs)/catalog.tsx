import React from 'react';
import { ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useSiteSettings } from '../../src/features/catalog/hooks/useMeals';
import MenuScreen from './menu';
import SnacksScreen from '../snacks';
import { customerFeatures } from '../../src/features/catalog/customerFeatures';

export default function CustomerCatalogTab() {
  const { data: settings, isLoading } = useSiteSettings();
  if (isLoading) return <ActivityIndicator />;
  if (!settings) return <Redirect href="/(tabs)" />;
  const features = customerFeatures(settings);
  if (features.quickMeals) return <MenuScreen />;
  if (features.snacks) return <SnacksScreen />;
  return <Redirect href="/(tabs)" />;
}
