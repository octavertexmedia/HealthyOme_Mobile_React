import React from 'react';
import { ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useSiteSettings } from '../../src/features/catalog/hooks/useMeals';
import MenuScreen from './menu';
import SnacksScreen from '../snacks';

export default function CustomerCatalogTab() {
  const { data: settings, isLoading } = useSiteSettings();
  if (isLoading) return <ActivityIndicator />;
  if (!settings) return <Redirect href="/(tabs)" />;
  if (settings.home_quick_meals_card_enabled !== false) return <MenuScreen />;
  if (settings.healthy_snacks_enabled !== false) return <SnacksScreen />;
  return <Redirect href="/(tabs)" />;
}
