import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { colors } from '../../src/shared/theme';
import { useSiteSettings } from '../../src/features/catalog/hooks/useMeals';
import { customerTabs } from '../../src/features/catalog/customerFeatures';

export default function TabsLayout() {
  const { data } = useSiteSettings();
  const tabs = customerTabs(data);
  const names = ['index', 'menu', 'snacks', 'training', 'orders', 'dietitian', 'catalog', 'profile'] as const;
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.text.disabled,
      tabBarStyle: { backgroundColor: colors.surface, borderTopWidth: 0, height: Platform.OS === 'ios' ? 84 : 60, paddingBottom: Platform.OS === 'ios' ? 24 : 8, paddingTop: 8 },
      tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
    }}>
      {names.map((name) => {
        const tab = tabs.find((item) => item.name === name);
        return <Tabs.Screen key={name} name={name} options={tab ? {
          title: tab.title,
          tabBarIcon: ({ color }) => <Ionicons name={tab.icon as React.ComponentProps<typeof Ionicons>['name']} size={22} color={color} />,
        } : { href: null }} />;
      })}
    </Tabs>
  );
}
