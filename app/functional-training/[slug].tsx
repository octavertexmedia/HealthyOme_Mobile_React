import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  resolveMediaUrl,
  type Enrollment,
  type TimeSlot,
} from '../../src/features/functional-training/api/functionalTraining.api';
import {
  useCreateEnrollment,
  useTrainer,
} from '../../src/features/functional-training/hooks/useFunctionalTraining';
import { usePayment } from '../../src/features/payments/hooks/usePayment';
import { useAuthStore } from '../../src/features/auth/store/auth.store';

export default function TrainerDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const trainerQuery = useTrainer(slug);
  const createEnrollment = useCreateEnrollment();
  const { pay, loading: paying } = usePayment();

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const email = useAuthStore((s) => s.user?.email);

  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const trainer = trainerQuery.data;
  const slots: TimeSlot[] = trainer?.time_slots ?? [];
  const img = resolveMediaUrl(trainer?.image);
  const busy = createEnrollment.isPending || paying;

  const selectedLabel = useMemo(
    () => slots.find((s) => s.code === selectedSlot)?.label ?? null,
    [slots, selectedSlot]
  );

  const payForEnrollment = async (enrollment: Enrollment) => {
    const r = await pay({
      kind: 'functional_training',
      order: { enrollment_id: enrollment.id },
      fulfillment: email ? { email } : undefined,
    });
    if (r.status === 'paid') {
      Alert.alert('Enrolled', 'Your training plan is active. See you at your session!', [
        { text: 'View my plan', onPress: () => router.replace('/functional-training/my' as any) },
      ]);
    } else if (r.status === 'cancelled') {
      Alert.alert(
        'Payment cancelled',
        'Your enrollment is saved as pending — you can pay for it any time from My plan.',
        [{ text: 'Go to My plan', onPress: () => router.replace('/functional-training/my' as any) }]
      );
    } else {
      if (r.error === 'payment_sdk_missing') {
        Alert.alert(
          'Update required',
          'Online payment needs the latest app build. Your enrollment is saved as pending — update the app to complete payment.',
          [{ text: 'Go to My plan', onPress: () => router.replace('/functional-training/my' as any) }]
        );
      } else {
        Alert.alert('Payment failed', r.error, [
          { text: 'Go to My plan', onPress: () => router.replace('/functional-training/my' as any) },
          { text: 'Close', style: 'cancel' },
        ]);
      }
    }
  };

  const onEnroll = () => {
    if (!trainer || !selectedSlot) return;

    if (!isAuthenticated) {
      Alert.alert('Sign in required', 'Please sign in to enroll in a training plan.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign in', onPress: () => router.push('/(auth)/login' as any) },
      ]);
      return;
    }

    Alert.alert(
      'Confirm enrollment',
      `Enroll with ${trainer.name} for ₹${trainer.monthlyPriceInr}/month${
        selectedLabel ? ` at ${selectedLabel}` : ''
      }?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Enroll & pay',
          onPress: () => {
            createEnrollment.mutate(
              { trainer_slug: trainer.id, time_slot_code: selectedSlot },
              {
                onSuccess: (enrollment) => payForEnrollment(enrollment),
                onError: (e: any) => {
                  const existing: Enrollment | undefined =
                    e?.response?.data?.enrollment;
                  const msg =
                    e?.response?.data?.error ||
                    e?.message ||
                    'Could not create enrollment.';
                  if (existing) {
                    Alert.alert('Already enrolled', msg, [
                      { text: 'Close', style: 'cancel' },
                      {
                        text: existing.needs_payment ? 'Pay now' : 'View my plan',
                        onPress: () =>
                          existing.needs_payment
                            ? payForEnrollment(existing)
                            : router.replace('/functional-training/my' as any),
                      },
                    ]);
                  } else {
                    Alert.alert('Could not enroll', msg);
                  }
                },
              }
            );
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 6 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {trainer?.name ?? 'Trainer'}
        </Text>
        <View style={styles.backBtn} />
      </View>

      {trainerQuery.isLoading ? (
        <ActivityIndicator color="#4B8E3D" style={{ marginTop: 48 }} />
      ) : trainerQuery.isError || !trainer ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={36} color="#9CA3AF" />
          <Text style={styles.errorTitle}>Trainer not found</Text>
          <Text style={styles.errorSub}>
            This trainer may no longer be available.
          </Text>
          <TouchableOpacity style={styles.errorBtn} onPress={() => router.back()}>
            <Text style={styles.errorBtnText}>Go back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 140 }}
          >
            {/* Trainer summary */}
            <View style={styles.summary}>
              {img ? (
                <Image source={{ uri: img }} style={styles.avatar} resizeMode="cover" />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Ionicons name="barbell-outline" size={34} color="#9CA3AF" />
                </View>
              )}
              <Text style={styles.name}>{trainer.name}</Text>
              <Text style={styles.specialty}>{trainer.specialty}</Text>
              <View style={styles.chipsRow}>
                <View style={styles.chip}>
                  <Ionicons name="cash-outline" size={13} color="#4B8E3D" />
                  <Text style={styles.chipText}>
                    ₹{trainer.monthlyPriceInr}/mo
                  </Text>
                </View>
                <View style={styles.chip}>
                  <Ionicons name="calendar-outline" size={13} color="#4B8E3D" />
                  <Text style={styles.chipText}>
                    {trainer.sessionsPerWeek} / week
                  </Text>
                </View>
              </View>
            </View>

            {!!trainer.bio && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>About</Text>
                <Text style={styles.bio}>{trainer.bio}</Text>
              </View>
            )}

            {/* Time slots */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pick your weekly time slot</Text>
              {slots.length === 0 ? (
                <Text style={styles.noSlots}>
                  No time slots available right now.
                </Text>
              ) : (
                <View style={styles.slotGrid}>
                  {slots.map((s) => {
                    const active = s.code === selectedSlot;
                    return (
                      <TouchableOpacity
                        key={s.code}
                        style={[styles.slot, active && styles.slotActive]}
                        onPress={() => setSelectedSlot(s.code)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[styles.slotLabel, active && styles.slotLabelActive]}
                        >
                          {s.label}
                        </Text>
                        <Text
                          style={[styles.slotTime, active && styles.slotTimeActive]}
                        >
                          {s.start_time}–{s.end_time}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          </ScrollView>

          {/* Enroll bar */}
          <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
            <View>
              <Text style={styles.footerPrice}>₹{trainer.monthlyPriceInr}</Text>
              <Text style={styles.footerUnit}>per month</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.enrollBtn,
                (!selectedSlot || busy || slots.length === 0) && styles.enrollBtnDisabled,
              ]}
              disabled={!selectedSlot || busy || slots.length === 0}
              onPress={onEnroll}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.enrollBtnText}>
                  {selectedSlot ? 'Enroll & pay' : 'Select a slot'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F7F8' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '600', color: '#111' },

  /* Summary */
  summary: { alignItems: 'center', backgroundColor: '#fff', paddingVertical: 24, paddingHorizontal: 20 },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#F3F4F6' },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 20, fontWeight: '700', color: '#0B262F', marginTop: 14 },
  specialty: { fontSize: 14, color: '#4B8E3D', fontWeight: '600', marginTop: 4 },
  chipsRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3FBEF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipText: { fontSize: 13, color: '#2C5238', fontWeight: '600' },

  /* Sections */
  section: {
    backgroundColor: '#fff',
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#0B262F', marginBottom: 12 },
  bio: { fontSize: 14, color: '#4B5563', lineHeight: 22 },
  noSlots: { fontSize: 14, color: '#9CA3AF' },

  /* Slots */
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slot: {
    minWidth: '47%',
    flexGrow: 1,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  slotActive: { borderColor: '#2C921D', backgroundColor: '#F3FBEF' },
  slotLabel: { fontSize: 14, fontWeight: '600', color: '#111' },
  slotLabelActive: { color: '#1B6B12' },
  slotTime: { fontSize: 12, color: '#6B7280', marginTop: 3 },
  slotTimeActive: { color: '#4B8E3D' },

  /* Footer */
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0EE',
  },
  footerPrice: { fontSize: 20, fontWeight: '700', color: '#0B262F' },
  footerUnit: { fontSize: 12, color: '#6B7280' },
  enrollBtn: {
    backgroundColor: '#2C921D',
    borderRadius: 999,
    paddingVertical: 15,
    paddingHorizontal: 32,
    minWidth: 170,
    alignItems: 'center',
  },
  enrollBtnDisabled: { backgroundColor: '#B4D9AC' },
  enrollBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  /* Error */
  errorBox: { alignItems: 'center', paddingTop: 72, paddingHorizontal: 32, gap: 8 },
  errorTitle: { fontSize: 18, fontWeight: '600', color: '#0B262F', marginTop: 12 },
  errorSub: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
  errorBtn: {
    marginTop: 16,
    backgroundColor: '#2C921D',
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  errorBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
