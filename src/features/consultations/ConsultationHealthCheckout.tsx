import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { consultationsApi, type Booking } from './api/consultations.api';
import { validateHealthDraft, type HealthDraft } from './healthValidation';
import { useAuthStore } from '../auth/store/auth.store';
import { usePayment } from '../payments/hooks/usePayment';
import { consultKeys } from './hooks/useConsult';

export function ConsultationHealthCheckout({ booking }: { booking: Booking }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const revision = useAuthStore((state) => state.sessionRevision);
  const { pay } = usePayment();
  const [draft, setDraft] = useState<HealthDraft>({
    client_full_name: booking.client_full_name || '', age: booking.age == null ? '' : String(booking.age),
    height_cm: booking.height_cm == null ? '' : String(booking.height_cm), weight_kg: booking.weight_kg == null ? '' : String(booking.weight_kg),
    goal: booking.goal || '', medical_conditions: booking.medical_conditions || '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const active = useRef(true);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  const sameSession = () => active.current && useAuthStore.getState().sessionRevision === revision;
  const closed = !['pending', 'confirmed'].includes(booking.status);
  const submit = async () => {
    if (lock.current || closed) return;
    const parsed = validateHealthDraft(draft);
    if (!parsed.data) { setError(parsed.error); return; }
    lock.current = true;
    setBusy(true);
    setError('');
    let healthSaved = false;
    try {
      const saved = await consultationsApi.saveBookingHealth(booking.id, parsed.data);
      if (!sameSession()) return;
      if (saved.id !== booking.id || !saved.health_complete || !['pending', 'confirmed'].includes(saved.status)) {
        throw new Error('Health save was not confirmed for this active booking');
      }
      healthSaved = true;
      if (!saved.needs_payment) {
        router.replace(`/consult/manage/${booking.id}`);
        return;
      }
      // Never send medical fields to payment metadata, navigation, or analytics.
      const result = await pay({ kind: 'consult', order: { consult_booking_id: booking.id } });
      if (!sameSession()) return;
      void queryClient.invalidateQueries({ queryKey: consultKeys.bookings });
      if (result.status === 'paid') router.replace(`/consult/manage/${booking.id}`);
      else setError('Payment was not completed. Your health details are saved. Check My bookings before retrying.');
    } catch {
      if (sameSession()) setError(healthSaved
        ? 'Payment could not be confirmed. Check My bookings before retrying.'
        : 'Could not save health details. Payment was not started.');
    } finally {
      lock.current = false;
      if (sameSession()) setBusy(false);
    }
  };
  const fields: { key: keyof HealthDraft; label: string; keyboard?: 'number-pad' | 'decimal-pad'; limit: number }[] = [
    { key: 'client_full_name', label: 'Full name', limit: 200 },
    { key: 'age', label: 'Age', keyboard: 'number-pad', limit: 3 },
    { key: 'height_cm', label: 'Height (cm)', keyboard: 'decimal-pad', limit: 6 },
    { key: 'weight_kg', label: 'Weight (kg)', keyboard: 'decimal-pad', limit: 6 },
    { key: 'goal', label: 'Goal', limit: 64 },
    { key: 'medical_conditions', label: 'Medical conditions or allergies (optional)', limit: 5000 },
  ];
  return <ScrollView contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 50 }} keyboardShouldPersistTaps="handled">
    <Text accessibilityRole="header" style={{ fontSize: 22, fontWeight: '700' }}>Health details before payment</Text>
    <Text>For your consultation with {booking.dietician_name}</Text>
    <Text>These details are saved to your consultation and health profile. They are not sent to the payment provider.</Text>
    {fields.map(({ key, label, keyboard, limit }) => <View key={key}>
      <Text style={{ marginBottom: 6 }}>{label}</Text>
      <TextInput accessibilityLabel={label} value={draft[key]} keyboardType={keyboard} maxLength={limit}
        multiline={key === 'medical_conditions'} editable={!busy && !closed}
        onChangeText={(value) => setDraft((current) => ({ ...current, [key]: value }))}
        style={{ minHeight: 48, borderWidth: 1, borderColor: '#CDDDC5', borderRadius: 12, padding: 12, backgroundColor: '#fff' }} />
    </View>)}
    {closed && <Text>This booking is no longer available for payment.</Text>}
    {!!error && <Text accessibilityRole="alert">{error}</Text>}
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Save health details and continue"
      accessibilityState={{ disabled: busy || closed }} disabled={busy || closed} onPress={submit}
      style={{ backgroundColor: '#34732D', borderRadius: 24, padding: 16, alignItems: 'center' }}>
      {busy ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '600' }}>Save health details and continue</Text>}
    </TouchableOpacity>
    <TouchableOpacity accessibilityRole="button" disabled={busy} onPress={() => router.replace('/consult/my')} style={{ padding: 14 }}><Text>My bookings</Text></TouchableOpacity>
  </ScrollView>;
}
