import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '../../src/shared/theme';
import Button from '../../src/shared/components/Button';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CreateSubscription() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [vegDays, setVegDays] = useState<number[]>([]);
  const [instructions, setInstructions] = useState('Hand it to me');

  const toggleDay = (i: number) => {
    setVegDays(prev => prev.includes(i) ? prev.filter(d => d !== i) : [...prev, i]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configure Plan</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Select Veg-Only Days</Text>
        <Text style={styles.sectionDesc}>Choose days when you want only vegetarian meals</Text>
        <View style={styles.daysRow}>
          {DAYS.map((day, i) => (
            <TouchableOpacity
              key={day}
              style={[styles.dayChip, vegDays.includes(i) && styles.dayChipActive]}
              onPress={() => toggleDay(i)}
            >
              <Text style={[styles.dayText, vegDays.includes(i) && styles.dayTextActive]}>{day}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: spacing.xxl }]}>Delivery Instructions</Text>
        {['Hand it to me', 'Leave at door', 'Call when arriving'].map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[styles.optionRow, instructions === opt && styles.optionRowActive]}
            onPress={() => setInstructions(opt)}
          >
            <Ionicons
              name={instructions === opt ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color={instructions === opt ? colors.primary : colors.text.disabled}
            />
            <Text style={styles.optionText}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button
          title="Start Subscription"
          onPress={() => Alert.alert('Success', 'Subscription created!', [
            { text: 'OK', onPress: () => router.dismissAll() }
          ])}
          fullWidth
          size="lg"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
  },
  headerTitle: { ...typography.heading.lg, color: colors.text.primary },
  scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: 120 },
  sectionTitle: { ...typography.heading.md, color: colors.text.primary, marginBottom: spacing.xs },
  sectionDesc: { ...typography.body.md, color: colors.text.secondary, marginBottom: spacing.lg },
  daysRow: { flexDirection: 'row', gap: spacing.sm },
  dayChip: {
    flex: 1, paddingVertical: spacing.md, alignItems: 'center', borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  dayChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayText: { ...typography.body.sm, color: colors.text.secondary, fontWeight: '600' },
  dayTextActive: { color: '#fff' },
  optionRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.lg, paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface, borderRadius: borderRadius.lg,
    marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  optionRowActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  optionText: { ...typography.body.lg, color: colors.text.primary },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
    paddingHorizontal: spacing.xl, paddingTop: spacing.lg,
  },
});
