import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { consultationsApi, type Dietician } from '../../src/features/consultations/api/consultations.api';
import { useAuthStore } from '../../src/features/auth/store/auth.store';
import { usePayment } from '../../src/features/payments/hooks/usePayment';
import type { PaymentMethod } from '../../src/features/payments/api/payments.api';

const PAYMENT_OPTIONS: { method: PaymentMethod; label: string; sub: string; icon: any }[] = [
  { method: 'razorpay', label: 'UPI / Cards (Razorpay)', sub: 'Pay using UPI, cards, netbanking', icon: 'card-outline' },
  { method: 'stripe', label: 'International cards (Stripe)', sub: 'Visa, Mastercard, Amex', icon: 'card' },
  { method: 'cod', label: 'Cash at consultation', sub: 'Pay during the session', icon: 'cash-outline' },
];

function isoLocalDate(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function labelForDate(iso: string, idx: number): string {
  if (idx === 0) return 'Today';
  if (idx === 1) return 'Tomorrow';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatSlotTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export default function ConsultBookingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const { pay, loading: paying } = usePayment();

  const dates = useMemo(() => Array.from({ length: 7 }, (_, i) => isoLocalDate(i)), []);
  const [date, setDate] = useState(dates[0]);
  const [selectedDietician, setSelectedDietician] = useState<Dietician | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pendingBookingId, setPendingBookingId] = useState<number | null>(null);

  const defaultPhone = (user as any)?.phone_number || (user as any)?.username || '';
  const [phoneInput, setPhoneInput] = useState(defaultPhone);
  const [notes, setNotes] = useState('');

  const dieticiansQuery = useQuery({
    queryKey: ['dieticians'],
    queryFn: consultationsApi.listDieticians,
  });

  const slotsQuery = useQuery({
    queryKey: ['slots', selectedDietician?.id, date],
    queryFn: () => consultationsApi.listSlots(selectedDietician!.id, date),
    enabled: !!selectedDietician,
    staleTime: 30 * 1000,
  });

  const bookMutation = useMutation({
    mutationFn: consultationsApi.book,
  });

  const startBooking = () => {
    if (!isAuthenticated) {
      router.push('/(auth)/login' as any);
      return;
    }
    if (!selectedDietician || !selectedSlot) {
      Alert.alert('Pick a slot', 'Please choose a dietician and a time slot.');
      return;
    }
    if (!phoneInput.trim()) {
      Alert.alert('Phone required', 'Enter the number the dietician should call.');
      return;
    }
    setSheetOpen(true);
  };

  const onPickMethod = async (method: PaymentMethod) => {
    setSheetOpen(false);
    if (!selectedDietician || !selectedSlot) return;
    try {
      const booking = await bookMutation.mutateAsync({
        dietician_id: selectedDietician.id,
        scheduled_at: selectedSlot,
        phone: phoneInput.trim(),
        notes: notes.trim() || undefined,
      });
      setPendingBookingId(booking.id);

      const result = await pay({ method, bookingId: booking.id });

      if (result.status === 'paid') {
        queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
        queryClient.invalidateQueries({ queryKey: ['slots'] });
        Alert.alert(
          'Consultation booked',
          `Your session with ${selectedDietician.name} is confirmed for ${formatSlotTime(selectedSlot)}.`,
          [{ text: 'OK', onPress: () => router.replace('/consult/my' as any) }]
        );
      } else if (result.status === 'cancelled') {
        Alert.alert(
          'Payment cancelled',
          'Your booking is reserved as pending. Complete payment from "My consultations".'
        );
      } else if (result.error === 'payment_sdk_missing') {
        Alert.alert('Update required', 'Card payments need an app update. Try Cash on Consult.');
      } else {
        Alert.alert('Payment failed', result.error || 'Please try a different method.');
      }
    } catch (e: any) {
      const code = e?.response?.data?.error;
      if (code === 'slot_taken') {
        Alert.alert('Slot taken', 'Someone just booked this slot — please pick another.');
        slotsQuery.refetch();
        setSelectedSlot(null);
      } else {
        Alert.alert('Could not book', e?.response?.data?.detail || e?.message || 'Try again.');
      }
    } finally {
      setPendingBookingId(null);
    }
  };

  const busy = bookMutation.isPending || paying || pendingBookingId !== null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book consultation</Text>
        <TouchableOpacity onPress={() => router.push('/consult/my' as any)}>
          <Text style={styles.myLink}>My bookings</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Choose a dietician</Text>

        {dieticiansQuery.isLoading ? (
          <ActivityIndicator color="#4B8E3D" style={{ marginVertical: 24 }} />
        ) : dieticiansQuery.isError ? (
          <Text style={styles.errorText}>Could not load dieticians.</Text>
        ) : (dieticiansQuery.data ?? []).length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="medical-outline" size={28} color="#9CA3AF" />
            <Text style={styles.emptyText}>No dieticians available yet.</Text>
          </View>
        ) : (
          (dieticiansQuery.data ?? []).map((doc) => (
            <TouchableOpacity
              key={doc.id}
              style={[styles.docCard, selectedDietician?.id === doc.id && styles.docCardSelected]}
              activeOpacity={0.85}
              onPress={() => {
                setSelectedDietician(doc);
                setSelectedSlot(null);
              }}
            >
              <View style={styles.docAvatar}>
                {doc.photo ? (
                  <Image source={{ uri: doc.photo }} style={styles.docPhoto} />
                ) : (
                  <Text style={{ fontSize: 28 }}>👩‍⚕️</Text>
                )}
              </View>
              <View style={styles.docInfo}>
                <Text style={styles.docName}>{doc.name}</Text>
                <Text style={styles.docSpecialty}>{doc.specialty || 'Nutrition'}</Text>
                <View style={styles.docMeta}>
                  <Ionicons name="star" size={12} color="#F5A623" />
                  <Text style={styles.docRating}>{doc.rating.toFixed(1)}</Text>
                  <Text style={styles.docPrice}>· ₹{doc.fee}/session</Text>
                </View>
              </View>
              {selectedDietician?.id === doc.id && (
                <Ionicons name="checkmark-circle" size={24} color="#4B8E3D" style={{ marginLeft: 8 }} />
              )}
            </TouchableOpacity>
          ))
        )}

        {selectedDietician && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Pick a date</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.dateRow}>
                {dates.map((d, idx) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.dateChip, date === d && styles.dateChipSelected]}
                    onPress={() => {
                      setDate(d);
                      setSelectedSlot(null);
                    }}
                  >
                    <Text style={[styles.dateChipText, date === d && styles.dateChipTextSelected]}>
                      {labelForDate(d, idx)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Pick a time</Text>
            {slotsQuery.isLoading ? (
              <ActivityIndicator color="#4B8E3D" style={{ marginVertical: 12 }} />
            ) : slotsQuery.data && slotsQuery.data.slots.length > 0 ? (
              <View style={styles.slotsGrid}>
                {slotsQuery.data.slots.map((s) => {
                  const selected = selectedSlot === s.scheduled_at;
                  return (
                    <TouchableOpacity
                      key={s.scheduled_at}
                      style={[
                        styles.slotChip,
                        !s.available && styles.slotChipDisabled,
                        selected && styles.slotChipSelected,
                      ]}
                      disabled={!s.available}
                      onPress={() => setSelectedSlot(s.scheduled_at)}
                    >
                      <Text
                        style={[
                          styles.slotText,
                          !s.available && styles.slotTextDisabled,
                          selected && styles.slotTextSelected,
                        ]}
                      >
                        {formatSlotTime(s.scheduled_at)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.muted}>No slots available for this day.</Text>
            )}

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Phone</Text>
            <Text style={styles.muted}>The dietician will call you on this number.</Text>
            <TextInput
              style={styles.textInput}
              keyboardType="phone-pad"
              placeholder="+91 9876543210"
              placeholderTextColor="#9CA3AF"
              value={phoneInput}
              onChangeText={setPhoneInput}
              maxLength={20}
            />

            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Notes (optional)</Text>
            <TextInput
              style={[styles.textInput, styles.notesInput]}
              placeholder="Goals, medical history, allergies — anything to help your dietician"
              placeholderTextColor="#9CA3AF"
              value={notes}
              onChangeText={setNotes}
              multiline
              maxLength={1000}
            />
            <Text style={styles.charCounter}>{notes.length} / 1000</Text>
          </>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[
            styles.bookBtn,
            (!selectedDietician || !selectedSlot || busy) && styles.bookBtnDisabled,
          ]}
          onPress={startBooking}
          disabled={!selectedDietician || !selectedSlot || busy}
          activeOpacity={0.9}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.bookBtnText}>
              Book{selectedDietician ? ` · ₹${selectedDietician.fee}` : ''}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <Modal visible={sheetOpen} animationType="slide" transparent onRequestClose={() => setSheetOpen(false)}>
        <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={() => setSheetOpen(false)}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}} style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Choose payment method</Text>
            <Text style={styles.sheetSub}>
              {selectedDietician ? `₹${selectedDietician.fee} • ${selectedDietician.name}` : ''}
            </Text>
            {PAYMENT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.method}
                style={styles.methodRow}
                activeOpacity={0.85}
                onPress={() => onPickMethod(opt.method)}
              >
                <Ionicons name={opt.icon} size={26} color="#0B262F" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.methodLabel}>{opt.label}</Text>
                  <Text style={styles.methodSub}>{opt.sub}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6C6C6C" />
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setSheetOpen(false)} style={styles.sheetCancel}>
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F7F8' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#111' },
  myLink: { fontSize: 14, fontWeight: '600', color: '#4B8E3D' },

  scrollContent: { padding: 16 },

  sectionTitle: { fontSize: 17, fontWeight: '600', color: '#111', marginBottom: 8 },
  muted: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  errorText: { fontSize: 14, color: '#C7463A', marginTop: 12 },

  empty: { alignItems: 'center', padding: 24, gap: 8 },
  emptyText: { color: '#6B7280' },

  docCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  docCardSelected: { borderColor: '#4B8E3D', backgroundColor: '#F0FFF4' },
  docAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EAF7FD',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  docPhoto: { width: 56, height: 56, borderRadius: 28 },
  docInfo: { flex: 1 },
  docName: { fontSize: 16, fontWeight: '600', color: '#111' },
  docSpecialty: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  docMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  docRating: { fontSize: 12, fontWeight: '600', color: '#111' },
  docPrice: { fontSize: 12, color: '#6B7280' },

  dateRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  dateChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dateChipSelected: { backgroundColor: '#4B8E3D', borderColor: '#4B8E3D' },
  dateChipText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  dateChipTextSelected: { color: '#fff' },

  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slotChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  slotChipSelected: { backgroundColor: '#4B8E3D', borderColor: '#4B8E3D' },
  slotChipDisabled: { backgroundColor: '#F3F4F6', borderColor: '#F3F4F6' },
  slotText: { fontSize: 13, fontWeight: '500', color: '#374151' },
  slotTextSelected: { color: '#fff' },
  slotTextDisabled: { color: '#9CA3AF', textDecorationLine: 'line-through' },

  textInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111',
    marginTop: 8,
  },
  notesInput: { minHeight: 100, textAlignVertical: 'top' },
  charCounter: { fontSize: 12, color: '#9CA3AF', marginTop: 4, alignSelf: 'flex-end' },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  bookBtn: { backgroundColor: '#4B8E3D', borderRadius: 999, paddingVertical: 18, alignItems: 'center' },
  bookBtnDisabled: { backgroundColor: '#9CA3AF' },
  bookBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    marginBottom: 12,
  },
  sheetTitle: { fontSize: 18, fontWeight: '600', color: '#0B262F' },
  sheetSub: { fontSize: 14, color: '#6C6C6C', marginTop: 4, marginBottom: 16 },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
  },
  methodLabel: { fontSize: 15, fontWeight: '600', color: '#0B262F' },
  methodSub: { fontSize: 13, color: '#6C6C6C', marginTop: 2 },
  sheetCancel: { paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  sheetCancelText: { fontSize: 15, fontWeight: '600', color: '#0B262F' },
});
