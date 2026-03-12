import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '../../src/shared/theme';
import Button from '../../src/shared/components/Button';

const TIME_SLOTS = ['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'];
const DAYS = Array.from({ length: 7 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i);
  return { date: d.getDate(), day: d.toLocaleDateString('en', { weekday: 'short' }), full: d.toISOString() };
});

export default function BookingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Consultation</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Select a Date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.xxl }}>
          {DAYS.map((d, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.dayCard, selectedDay === i && styles.dayCardActive]}
              onPress={() => setSelectedDay(i)}
            >
              <Text style={[styles.dayLabel, selectedDay === i && styles.dayLabelActive]}>{d.day}</Text>
              <Text style={[styles.dayDate, selectedDay === i && styles.dayDateActive]}>{d.date}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>Select Time Slot</Text>
        <View style={styles.slotsGrid}>
          {TIME_SLOTS.map((slot) => (
            <TouchableOpacity
              key={slot}
              style={[styles.slotChip, selectedSlot === slot && styles.slotChipActive]}
              onPress={() => setSelectedSlot(slot)}
            >
              <Text style={[styles.slotText, selectedSlot === slot && styles.slotTextActive]}>{slot}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button
          title="Confirm Booking"
          onPress={() => Alert.alert('🎉 Booked!', 'Your consultation has been scheduled', [
            { text: 'OK', onPress: () => router.dismissAll() }
          ])}
          disabled={!selectedSlot}
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
  sectionTitle: { ...typography.heading.md, color: colors.text.primary, marginBottom: spacing.md },
  dayCard: {
    width: 64, alignItems: 'center', paddingVertical: spacing.lg, borderRadius: borderRadius.xl,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, marginRight: spacing.md,
  },
  dayCardActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayLabel: { ...typography.body.sm, color: colors.text.secondary },
  dayLabelActive: { color: 'rgba(255,255,255,0.8)' },
  dayDate: { ...typography.heading.lg, color: colors.text.primary, marginTop: spacing.xs },
  dayDateActive: { color: '#fff' },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  slotChip: {
    paddingVertical: spacing.md, paddingHorizontal: spacing.xl, borderRadius: borderRadius.lg,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  slotChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  slotText: { ...typography.body.md, color: colors.text.secondary },
  slotTextActive: { color: '#fff', fontWeight: '600' },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
    paddingHorizontal: spacing.xl, paddingTop: spacing.lg,
  },
});
