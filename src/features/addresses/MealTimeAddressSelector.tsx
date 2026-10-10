import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { MealTimeRef } from '../subscription/api/subscription.api';
import { standingMealTimes } from './mealTimeAddressPolicy';

export function MealTimeAddressSelector({ options, selected, acceptedArea, disabled, onChange }: {
  options: MealTimeRef[]; selected: number[]; acceptedArea: boolean; disabled: boolean; onChange: (ids: number[]) => void;
}) {
  const available = standingMealTimes(options);
  const rows = [...available, ...selected.filter((id) => !available.some((item) => item.id === id)).map((id) => ({ id, name: `Unavailable meal time (#${id})` }))];
  return <View>
    <Text style={styles.title}>Usual meal-time address</Text>
    <Text style={styles.detail}>Use this address for selected subscription meals. Saving replaces any other usual address for those meal times. Per-delivery overrides stay unchanged.</Text>
    {!acceptedArea ? <Text style={styles.detail}>Select a subscription delivery area to assign meal times. Existing selections can be removed.</Text> : null}
    {!rows.length ? <Text style={styles.detail}>No subscription meal times are available.</Text> : rows.map((item) => {
      const checked = selected.includes(item.id);
      const blocked = disabled || (!checked && !acceptedArea);
      return <TouchableOpacity key={item.id} accessibilityRole="checkbox" accessibilityLabel={`Usual address for ${item.name}`}
        accessibilityState={{ checked, disabled: blocked }} disabled={blocked} style={[styles.row, checked && styles.selected, blocked && styles.disabled]}
        onPress={() => onChange(checked ? selected.filter((id) => id !== item.id) : [...selected, item.id])}>
        <Text>{checked ? '✓  ' : '○  '}{item.name}</Text>
      </TouchableOpacity>;
    })}
  </View>;
}

const styles = StyleSheet.create({
  title: { fontSize: 16, fontWeight: '600', marginTop: 12 }, detail: { fontSize: 13, color: '#6B7280', lineHeight: 19, marginVertical: 8 },
  row: { minHeight: 48, padding: 14, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, marginVertical: 4 },
  selected: { backgroundColor: '#EFF8EC', borderColor: '#2C921D' }, disabled: { opacity: 0.5 },
});
