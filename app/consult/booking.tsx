import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  resolveMediaUrl,
  slotStartISO,
  type AvailabilitySlot,
  type ConsultPlan,
  type Dietician,
} from '../../src/features/consultations/api/consultations.api';
import {
  useAvailability,
  useConsultPlans,
  useCreateBooking,
  useDieticians,
} from '../../src/features/consultations/hooks/useConsult';
import { useAuthStore } from '../../src/features/auth/store/auth.store';

function isoLocalDate(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function labelForDate(iso: string): string {
  const today = isoLocalDate(0);
  const tomorrow = isoLocalDate(1);
  if (iso === today) return 'Today';
  if (iso === tomorrow) return 'Tomorrow';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatSlotTime(slot: AvailabilitySlot): string {
  const d = new Date(`${slot.date}T${slot.startTime}:00`);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export default function ConsultBookingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const rangeFrom = useMemo(() => isoLocalDate(0), []);
  const rangeTo = useMemo(() => isoLocalDate(29), []);

  const [selectedDietician, setSelectedDietician] = useState<Dietician | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<ConsultPlan | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const bookingLock = useRef(false);
  const [notes, setNotes] = useState('');

  const dieticiansQuery = useDieticians();
  const plansQuery = useConsultPlans();
  const availabilityQuery = useAvailability(selectedDietician?.id, rangeFrom, rangeTo);
  const bookMutation = useCreateBooking();

  // Default-select the recommended plan (or first) once plans load.
  useEffect(() => {
    if (!selectedPlan && plansQuery.data && plansQuery.data.length > 0) {
      setSelectedPlan(plansQuery.data.find((p) => p.recommended) ?? plansQuery.data[0]);
    }
  }, [plansQuery.data, selectedPlan]);

  // Group availability slots by date.
  const slotsByDate = useMemo(() => {
    const map: Record<string, AvailabilitySlot[]> = {};
    for (const slot of availabilityQuery.data ?? []) {
      (map[slot.date] ??= []).push(slot);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return map;
  }, [availabilityQuery.data]);

  const availableDates = useMemo(() => Object.keys(slotsByDate).sort(), [slotsByDate]);

  // Keep selectedDate valid whenever availability changes.
  useEffect(() => {
    if (availableDates.length === 0) {
      if (selectedDate !== null) setSelectedDate(null);
      return;
    }
    if (!selectedDate || !availableDates.includes(selectedDate)) {
      setSelectedDate(availableDates[0]);
    }
  }, [availableDates, selectedDate]);

  const daySlots = selectedDate ? slotsByDate[selectedDate] ?? [] : [];
  const price = selectedPlan?.price ?? 0;

  const doBooking = async () => {
    if (bookingLock.current) return;
    if (!isAuthenticated) {
      router.push({ pathname: '/(auth)/login', params: { redirect: '/consult/booking' } });
      return;
    }
    if (!selectedDietician || !selectedPlan || !selectedSlot) {
      Alert.alert('Pick a slot', 'Choose a dietician, plan and available time slot.');
      return;
    }
    const sessionRevision = useAuthStore.getState().sessionRevision;
    bookingLock.current = true;
    setBookingInProgress(true);
    try {
      const booking = await bookMutation.mutateAsync({
        dietician_slug: selectedDietician.id,
        dietician_name: selectedDietician.name,
        plan_code: selectedPlan.code,
        slot_start: slotStartISO(selectedSlot),
        notes: notes.trim() || undefined,
      });
      if (useAuthStore.getState().sessionRevision !== sessionRevision) return;
      if (!Number.isSafeInteger(booking.id) || booking.id < 1) throw new Error('Invalid booking response');
      // Only the booking ID travels in navigation. Health is collected and saved
      // on the next private screen before payment can start.
      router.push({ pathname: '/consult/health', params: { booking: String(booking.id) } });
    } catch {
      Alert.alert('Could not reserve your slot', 'Check My bookings before trying again. No payment was started.');
    } finally {
      bookingLock.current = false;
      setBookingInProgress(false);
    }
  };

  const busy = bookMutation.isPending || bookingInProgress;

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
          (dieticiansQuery.data ?? []).map((doc) => {
            const img = resolveMediaUrl(doc.image);
            const selected = selectedDietician?.id === doc.id;
            // rating is a server-computed average (Decimal) — may arrive as a
            // string; coerce before calling toFixed to avoid a runtime crash.
            const rating = Number(doc.rating);
            return (
              <TouchableOpacity
                key={doc.id}
                style={[styles.docCard, selected && styles.docCardSelected]}
                activeOpacity={0.85}
                onPress={() => {
                  setSelectedDietician(doc);
                  setSelectedSlot(null);
                  setSelectedDate(null);
                }}
              >
                <View style={styles.docAvatar}>
                  {img ? (
                    <Image source={{ uri: img }} style={styles.docPhoto} />
                  ) : (
                    <Text style={{ fontSize: 28 }}>👩‍⚕️</Text>
                  )}
                </View>
                <View style={styles.docInfo}>
                  <Text style={styles.docName}>{doc.name}</Text>
                  <Text style={styles.docSpecialty}>{doc.specialty || 'Nutrition'}</Text>
                  <View style={styles.docMeta}>
                    <Ionicons name="star" size={12} color="#F5A623" />
                    <Text style={styles.docRating}>
                      {Number.isFinite(rating) ? rating.toFixed(1) : '—'}
                    </Text>
                    {!!doc.experience && <Text style={styles.docPrice}>· {doc.experience}</Text>}
                  </View>
                </View>
                {selected && (
                  <Ionicons name="checkmark-circle" size={24} color="#4B8E3D" style={{ marginLeft: 8 }} />
                )}
              </TouchableOpacity>
            );
          })
        )}

        {selectedDietician && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Choose a plan</Text>
            {plansQuery.isLoading ? (
              <ActivityIndicator color="#4B8E3D" style={{ marginVertical: 12 }} />
            ) : (plansQuery.data ?? []).length === 0 ? (
              <Text style={styles.muted}>No consultation plans available.</Text>
            ) : (
              (plansQuery.data ?? []).map((plan) => {
                const selected = selectedPlan?.code === plan.code;
                return (
                  <TouchableOpacity
                    key={plan.code}
                    style={[styles.planCard, selected && styles.planCardSelected]}
                    activeOpacity={0.85}
                    onPress={() => setSelectedPlan(plan)}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={styles.planTitleRow}>
                        <Text style={styles.planTitle}>{plan.title}</Text>
                        {plan.recommended && (
                          <View style={styles.recommendBadge}>
                            <Text style={styles.recommendText}>Recommended</Text>
                          </View>
                        )}
                      </View>
                      {plan.durationWeeks > 0 && (
                        <Text style={styles.planMeta}>{plan.durationWeeks} week plan</Text>
                      )}
                      {!!plan.discountLabel && (
                        <Text style={styles.planDiscount}>{plan.discountLabel}</Text>
                      )}
                    </View>
                    <View style={styles.planRight}>
                      <Text style={styles.planPrice}>₹{plan.price}</Text>
                      <Ionicons
                        name={selected ? 'radio-button-on' : 'radio-button-off'}
                        size={20}
                        color={selected ? '#4B8E3D' : '#9CA3AF'}
                      />
                    </View>
                  </TouchableOpacity>
                );
              })
            )}

            <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Pick a date</Text>
            {availabilityQuery.isLoading ? (
              <ActivityIndicator color="#4B8E3D" style={{ marginVertical: 12 }} />
            ) : availableDates.length === 0 ? (
              <Text style={styles.muted}>No availability in the next 30 days.</Text>
            ) : (
              <>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.dateRow}>
                    {availableDates.map((d) => (
                      <TouchableOpacity
                        key={d}
                        style={[styles.dateChip, selectedDate === d && styles.dateChipSelected]}
                        onPress={() => {
                          setSelectedDate(d);
                          setSelectedSlot(null);
                        }}
                      >
                        <Text style={[styles.dateChipText, selectedDate === d && styles.dateChipTextSelected]}>
                          {labelForDate(d)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Pick a time</Text>
                {daySlots.length > 0 ? (
                  <View style={styles.slotsGrid}>
                    {daySlots.map((s) => {
                      const selected = selectedSlot?.id === s.id;
                      return (
                        <TouchableOpacity
                          key={s.id}
                          style={[styles.slotChip, selected && styles.slotChipSelected]}
                          onPress={() => setSelectedSlot(s)}
                        >
                          <Text style={[styles.slotText, selected && styles.slotTextSelected]}>
                            {formatSlotTime(s)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  <Text style={styles.muted}>No slots available for this day.</Text>
                )}
              </>
            )}

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Notes (optional)</Text>
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
            (!selectedDietician || !selectedPlan || !selectedSlot || busy) && styles.bookBtnDisabled,
          ]}
          onPress={doBooking}
          disabled={!selectedDietician || !selectedPlan || !selectedSlot || busy}
          activeOpacity={0.9}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.bookBtnText}>
              Continue to health details{selectedPlan ? ` · ₹${price}` : ''}
            </Text>
          )}
        </TouchableOpacity>
      </View>
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

  planCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  planCardSelected: { borderColor: '#4B8E3D', backgroundColor: '#F0FFF4' },
  planTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  planTitle: { fontSize: 15, fontWeight: '600', color: '#111' },
  planMeta: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  planDiscount: { fontSize: 12, color: '#4B8E3D', fontWeight: '600', marginTop: 4 },
  planRight: { alignItems: 'flex-end', gap: 6 },
  planPrice: { fontSize: 16, fontWeight: '700', color: '#0B262F' },
  recommendBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  recommendText: { fontSize: 11, fontWeight: '600', color: '#2C921D' },

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
  slotText: { fontSize: 13, fontWeight: '500', color: '#374151' },
  slotTextSelected: { color: '#fff' },

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
