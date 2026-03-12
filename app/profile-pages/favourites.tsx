import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../../src/shared/theme';
import EmptyState from '../../src/shared/components/EmptyState';

export default function FavouritesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.md }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={typography.heading.lg}>Favourites</Text>
        <View style={{ width: 24 }} />
      </View>
      <EmptyState icon="heart-outline" title="No Favourites" description="Save your favourite meals for quick access" actionLabel="Browse Menu" onAction={() => router.push('/(tabs)/menu')} />
    </View>
  );
}
