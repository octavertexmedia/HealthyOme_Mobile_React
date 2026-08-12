import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import {
  type Booking,
  type BookingStatus,
  type ConsultPlan,
} from '../../src/features/consultations/api/consultations.api';
import {
  consultKeys,
  useCancelBooking,
  useConsultPlans,
  useMyBookings,
  useReviewBooking,
} from '../../src/features/consultations/hooks/useConsult';
import { usePayment } from '../../src/features/payments/hooks/usePayment';
import { useAuthStore } from '../../src/features/auth/store/auth.store';

const STATUS_COLOR: Record<BookingStatus, string> = {
  pending: '#F5A623',
  confirmed: '#4B8E3D',
  completed: '#0B262F',
  cancelled: '#C7463A',
  no_show: '#9CA3AF',
};

const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: 'Awaiting payment',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No show',
};

function formatWhen(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }) +
    ' · ' +
    d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  );
}

export default function MyConsultationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { pay, loading: paying } = usePayment();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const bookingsQuery = useMyBookings();
  const plansQuery = useConsultPlans();
  const cancelMutation = useCancelBooking();
  const reviewMutation = useReviewBooking();

  const [reviewFor, setReviewFor] = useState<Booking | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const planByCode = useMemo(() => {
    const map: Record<string, ConsultPlan> = {};
    for (const p of plansQuery.data ?? []) map[p.code] = p;
    return map;
  }, [plansQuery.data]);

  const priceFor = (b: Booking): number | null => planByCode[b.plan_code]?.price ?? null;
  const planTitleFor = (b: Booking): string =>
    planByCode[b.plan_code]?.title ?? b.plan_code;

  const onCancel = (b: Booking) => {
    Alert.alert(
      'Cancel this consultation?',
      `${b.dietician_name} • ${formatWhen(b.slot_start)}`,
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: () =>
            cancelMutation.mutate(b.id, {
              onError: (e: any) =>
                Alert.alert('Could not cancel', e?.response?.data?.error || e?.message || 'Try again.'),
            }),
        },
      ]
    );
  };

  const onPay = async (b: Booking) => {
    const price = priceFor(b);
    Alert.alert(
      'Complete payment',
      `Pay${price != null ? ` ₹${price}` : ''} for your consultation with ${b.dietician_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pay now',
          onPress: async () => {
            const r = await pay({
              kind: 'consult',
              order: { consult_booking_id: b.id },
            });
            if (r.status === 'paid') {
              queryClient.invalidateQueries({ queryKey: consultKeys.bookings });
            } else if (r.status === 'failed') {
              if (r.error === 'payment_sdk_missing') {
                Alert.alert(
                  'Update required',
                  'Payments need an app update — please update the app to complete payment.'
                );
              } else {
                Alert.alert('Payment failed', r.error);
              }
            }
          },
        },
      ]
    );
  };

  const openReview = (b: Booking) => {
    setReviewFor(b);
    setReviewRating(5);
    setReviewComment('');
  };

  const submitReview = () => {
    if (!reviewFor) return;
    reviewMutation.mutate(
      { id: reviewFor.id, rating: reviewRating, comment: reviewComment.trim() || undefined },
      {
        onSuccess: () => {
          setReviewFor(null);
          Alert.alert('Thank you', 'Your review has been submitted.');
        },
        onError: (e: any) =>
          Alert.alert('Could not submit', e?.response?.data?.error || e?.message || 'Try again.'),
      }
    );
  };

  const bookings = bookingsQuery.data ?? [];
  const busy = paying || cancelMutation.isPending;

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#111" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My consultations</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.empty}>
          <Ionicons name="log-in-outline" size={36} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>Login to see your consultations</Text>
          <Text style={styles.emptySub}>Sign in to view and manage your bookings.</Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => router.push('/(auth)/login' as any)}
          >
            <Text style={styles.emptyBtnText}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My consultations</Text>
        <TouchableOpacity onPress={() => router.push('/consult/booking' as any)}>
          <Ionicons name="add" size={24} color="#4B8E3D" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        refreshControl={
          <RefreshControl
            refreshing={bookingsQuery.isFetching && !bookingsQuery.isLoading}
            onRefresh={() => bookingsQuery.refetch()}
            tintColor="#4B8E3D"
          />
        }
      >
        {bookingsQuery.isLoading ? (
          <ActivityIndicator color="#4B8E3D" style={{ marginTop: 32 }} />
        ) : bookingsQuery.isError ? (
          <View style={styles.empty}>
            <Ionicons name="cloud-offline-outline" size={36} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>Couldn't load your consultations</Text>
            <Text style={styles.emptySub}>Check your connection and try again.</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => bookingsQuery.refetch()}>
              <Text style={styles.emptyBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : bookings.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={36} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No consultations yet</Text>
            <Text style={styles.emptySub}>Book a session to talk to a dietician.</Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => router.push('/consult/booking' as any)}
            >
              <Text style={styles.emptyBtnText}>Book consultation</Text>
            </TouchableOpacity>
          </View>
        ) : (
          bookings.map((b) => {
            const canCancel = b.status === 'pending' || b.status === 'confirmed';
            const needsPay = b.needs_payment && b.status !== 'cancelled';
            const canReview = b.status === 'completed';
            const price = priceFor(b);
            return (
              <View key={b.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.docName}>{b.dietician_name}</Text>
                    <Text style={styles.when}>{formatWhen(b.slot_start)}</Text>
                    <Text style={styles.planName}>{planTitleFor(b)}</Text>
                  </View>
                  <View style={[styles.statusTag, { backgroundColor: (STATUS_COLOR[b.status] ?? '#9CA3AF') + '22' }]}>
                    <Text style={[styles.statusText, { color: STATUS_COLOR[b.status] ?? '#9CA3AF' }]}>
                      {STATUS_LABEL[b.status] ?? b.status}
                    </Text>
                  </View>
                </View>

                <Text style={styles.feeText}>
                  {price != null ? `₹${price} • ` : ''}
                  <Text style={{ color: b.needs_payment ? '#C7463A' : '#4B8E3D' }}>
                    {b.needs_payment ? 'Payment pending' : 'Paid'}
                  </Text>
                </Text>

                {(needsPay || canCancel || canReview) && (
                  <View style={styles.cardActions}>
                    {needsPay && (
                      <TouchableOpacity
                        style={[styles.payBtn, busy && { opacity: 0.5 }]}
                        disabled={busy}
                        onPress={() => onPay(b)}
                      >
                        <Text style={styles.payBtnText}>Pay now</Text>
                      </TouchableOpacity>
                    )}
                    {canReview && (
                      <TouchableOpacity
                        style={[styles.payBtn, busy && { opacity: 0.5 }]}
                        disabled={busy}
                        onPress={() => openReview(b)}
                      >
                        <Text style={styles.payBtnText}>Leave review</Text>
                      </TouchableOpacity>
                    )}
                    {canCancel && (
                      <TouchableOpacity
                        style={[styles.cancelBtn, busy && { opacity: 0.5 }]}
                        disabled={busy}
                        onPress={() => onCancel(b)}
                      >
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal
        visible={reviewFor !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setReviewFor(null)}
      >
        <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={() => setReviewFor(null)}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}} style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Rate your consultation</Text>
            <Text style={styles.sheetSub}>{reviewFor?.dietician_name}</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <TouchableOpacity key={n} onPress={() => setReviewRating(n)}>
                  <Ionicons
                    name={n <= reviewRating ? 'star' : 'star-outline'}
                    size={34}
                    color="#F5A623"
                  />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.reviewInput}
              placeholder="Share a few words (optional)"
              placeholderTextColor="#9CA3AF"
              value={reviewComment}
              onChangeText={setReviewComment}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.submitBtn, reviewMutation.isPending && { opacity: 0.6 }]}
              disabled={reviewMutation.isPending}
              onPress={submitReview}
            >
              {reviewMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Submit review</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setReviewFor(null)} style={styles.sheetCancel}>
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

  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#0B262F', marginTop: 12 },
  emptySub: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
  emptyBtn: {
    marginTop: 16,
    backgroundColor: '#4B8E3D',
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  docName: { fontSize: 16, fontWeight: '600', color: '#111' },
  when: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  planName: { fontSize: 13, color: '#4B8E3D', marginTop: 4, fontWeight: '500' },
  statusTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600' },
  feeText: { fontSize: 14, color: '#0B262F', marginTop: 10 },

  cardActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  payBtn: {
    flex: 1,
    backgroundColor: '#4B8E3D',
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
  },
  payBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  cancelBtn: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#C7463A',
  },
  cancelBtnText: { color: '#C7463A', fontWeight: '600', fontSize: 14 },

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
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 16 },
  reviewInput: {
    backgroundColor: '#F6F7F8',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111',
    minHeight: 90,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: '#4B8E3D',
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  sheetCancel: { paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  sheetCancelText: { fontSize: 15, fontWeight: '600', color: '#0B262F' },
});
