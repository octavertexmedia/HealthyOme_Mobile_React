import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../src/features/auth/store/auth.store';
import { consultationsApi, type Booking } from '../../../src/features/consultations/api/consultations.api';
import { consultKeys, useBookingMealPlan } from '../../../src/features/consultations/hooks/useConsult';
import { validateHealthDraft, type HealthDraft } from '../../../src/features/consultations/healthValidation';
import { PauseDatePreferences } from '../../../src/features/consultations/PauseDatePreferences';
import { consultationPausePayload } from '../../../src/features/consultations/pausePreferences';

export default function ManageConsultation() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const bookingId = Number(id);
  const valid = Number.isInteger(bookingId) && bookingId > 0;
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const query = useQuery({ queryKey: consultKeys.booking(bookingId), queryFn: () => consultationsApi.getBooking(bookingId), enabled: isAuthenticated && valid });
  if (!isAuthenticated) return <Redirect href={{ pathname: '/(auth)/login', params: { redirect: `/consult/manage/${id}` } }} />;
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity accessibilityLabel="Go back" onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#111" /></TouchableOpacity>
        <Text style={styles.title}>Consultation details</Text>
      </View>
      {!valid ? <Text style={styles.content}>Invalid consultation.</Text> : query.isLoading ? <ActivityIndicator color="#2C921D" /> : query.isError || !query.data ? (
        <TouchableOpacity style={styles.content} onPress={() => query.refetch()}><Text>Could not load your consultation. Tap to retry.</Text></TouchableOpacity>
      ) : <ConsultationForm key={query.data.id} booking={query.data} />}
    </View>
  );
}

function ConsultationForm({ booking }: { booking: Booking }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const userId = useAuthStore((state) => state.user?.id);
  const plan = useBookingMealPlan(booking.id);
  const [draft, setDraft] = useState<HealthDraft>({
    client_full_name: booking.client_full_name || '', age: booking.age == null ? '' : String(booking.age),
    height_cm: booking.height_cm == null ? '' : String(booking.height_cm), weight_kg: booking.weight_kg == null ? '' : String(booking.weight_kg),
    goal: booking.goal || '', medical_conditions: booking.medical_conditions || '',
  });
  const [notes, setNotes] = useState(booking.notes || '');
  const [whatsapp, setWhatsapp] = useState(booking.whatsapp_updates);
  const [reminder, setReminder] = useState(booking.remind_before_end);
  const [pauseDates, setPauseDates] = useState<string[]>(booking.pause_dates ?? []);
  const [saving, setSaving] = useState(false);
  const save = async (includeHealth: boolean) => {
    if (saving) return;
    const parsed = includeHealth ? validateHealthDraft(draft) : null;
    if (parsed && !parsed.data) { Alert.alert('Check your details', parsed.error); return; }
    setSaving(true);
    try {
      const updated = await consultationsApi.patchBooking(booking.id, {
        ...(parsed?.data ?? {}), notes: notes.trim(), whatsapp_updates: whatsapp, remind_before_end: reminder,
        ...consultationPausePayload(pauseDates),
      });
      if (useAuthStore.getState().user?.id !== userId) return;
      queryClient.setQueryData(consultKeys.booking(booking.id), updated);
      setPauseDates(updated.pause_dates ?? []);
      queryClient.invalidateQueries({ queryKey: consultKeys.bookings });
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      Alert.alert('Details saved', 'Your consultation has been updated.');
    } catch (error: any) {
      Alert.alert('Could not save details', error?.response?.data?.error || error?.message || 'Please try again.');
    } finally { setSaving(false); }
  };
  const fields: { key: keyof HealthDraft; label: string; keyboard?: 'number-pad' | 'decimal-pad'; multiline?: boolean }[] = [
    { key: 'client_full_name', label: 'Full name' }, { key: 'age', label: 'Age', keyboard: 'number-pad' },
    { key: 'height_cm', label: 'Height (cm)', keyboard: 'decimal-pad' }, { key: 'weight_kg', label: 'Weight (kg)', keyboard: 'decimal-pad' },
    { key: 'goal', label: 'Goal' }, { key: 'medical_conditions', label: 'Medical conditions or allergies (optional)', multiline: true },
  ];
  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>{booking.dietician_name}</Text>
      <Text style={styles.detail}>Share these details with your dietician to personalise your consultation.</Text>
      {fields.map(({ key, label, keyboard, multiline }) => <View key={key}>
        <Text style={styles.label}>{label}</Text>
        <TextInput accessibilityLabel={label} value={draft[key]} keyboardType={keyboard} multiline={multiline}
          editable={!saving} style={styles.input} onChangeText={(value) => setDraft((current) => ({ ...current, [key]: value }))} />
      </View>)}
      <Text style={styles.label}>Notes for your dietician</Text>
      <TextInput accessibilityLabel="Notes for your dietician" value={notes} onChangeText={setNotes} style={styles.input} multiline editable={!saving} />
      <View style={styles.row}><Text>WhatsApp updates</Text><Switch accessibilityLabel="Consultation WhatsApp updates" value={whatsapp} onValueChange={setWhatsapp} disabled={saving} /></View>
      <View style={styles.row}><Text>Remind before the plan ends</Text><Switch accessibilityLabel="Remind before the plan ends" value={reminder} onValueChange={setReminder} disabled={saving} /></View>
      <PauseDatePreferences dates={pauseDates} disabled={saving} onChange={setPauseDates} />
      <TouchableOpacity disabled={saving} style={styles.button} onPress={() => save(true)}><Text style={styles.buttonText}>{saving ? 'Saving…' : 'Save health details and preferences'}</Text></TouchableOpacity>
      <TouchableOpacity disabled={saving} style={styles.secondary} onPress={() => save(false)}><Text style={styles.link}>Save preferences only</Text></TouchableOpacity>
      <Text style={[styles.title, { marginTop: 30 }]}>Your dietician&apos;s meal plan</Text>
      {plan.isLoading ? <ActivityIndicator color="#2C921D" /> : plan.isError ? <TouchableOpacity style={styles.secondary} onPress={() => plan.refetch()}><Text>Could not load the meal plan. Tap to retry.</Text></TouchableOpacity> : plan.data ? <View>
        <Text style={styles.detail}>{plan.data.goal}</Text><Text style={styles.detail}>{plan.data.notes}</Text>
        {plan.data.meals.map((meal) => <TouchableOpacity key={meal.id} style={styles.secondary} onPress={() => router.push(`/meal/${meal.id}` as any)}><Text style={styles.link}>{meal.name}</Text></TouchableOpacity>)}
      </View> : <Text style={styles.detail}>Your dietician has not shared a meal plan yet.</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20 },
  title: { fontSize: 18, fontWeight: '700', color: '#111' },
  content: { padding: 20, paddingBottom: 60 },
  detail: { fontSize: 14, lineHeight: 21, color: '#6B7280', marginTop: 10 },
  label: { color: '#4B5563', marginTop: 18, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, backgroundColor: '#fff', padding: 14, color: '#111', minHeight: 48 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingVertical: 14 },
  button: { backgroundColor: '#2C921D', borderRadius: 24, padding: 16, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
  secondary: { paddingVertical: 16 },
  link: { color: '#2C921D', fontWeight: '600' },
});
