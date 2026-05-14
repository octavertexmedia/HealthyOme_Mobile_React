import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  consultationsApi,
  type Booking,
  type BookingStatus,
} from '../../src/features/consultations/api/consultations.api';
import { usePayment } from '../../src/features/payments/hooks/usePayment';

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

  const bookingsQuery = useQuery({
    queryKey: ['my-bookings'],
    queryFn: consultationsApi.myBookings,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => consultationsApi.cancel(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-bookings'] }),
  });

  const onCancel = (b: Booking) => {
    Alert.alert(
      'Cancel this consultation?',
      `${b.dietician_name} • ${formatWhen(b.scheduled_at)}`,
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: () => cancelMutation.mutate(b.id),
        },
      ]
    );
  };

  const onPay = async (b: Booking) => {
    Alert.alert(
      'Complete payment',
      `Pay ₹${b.fee} for your consultation with ${b.dietician_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pay COD',
          onPress: async () => {
            const r = await pay({ method: 'cod', bookingId: b.id });
            if (r.status === 'paid') queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
          },
        },
        {
          text: 'Pay now',
          onPress: async () => {
            const r = await pay({ method: 'razorpay', bookingId: b.id });
            if (r.status === 'paid') queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
            else if (r.status === 'failed' && r.error !== 'payment_sdk_missing') {
              Alert.alert('Payment failed', r.error);
            }
          },
        },
      ]
    );
  };

  const bookings = bookingsQuery.data ?? [];
  const busy = paying || cancelMutation.isPending;

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
            const needsPay = b.payment_status === 'pending' && b.status !== 'cancelled';
            return (
              <View key={b.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.docName}>{b.dietician_name}</Text>
                    <Text style={styles.when}>{formatWhen(b.scheduled_at)}</Text>
                  </View>
                  <View style={[styles.statusTag, { backgroundColor: STATUS_COLOR[b.status] + '22' }]}>
                    <Text style={[styles.statusText, { color: STATUS_COLOR[b.status] }]}>
                      {STATUS_LABEL[b.status]}
                    </Text>
                  </View>
                </View>

                <Text style={styles.feeText}>
                  ₹{b.fee} •{' '}
                  <Text style={{ color: b.payment_status === 'paid' ? '#4B8E3D' : '#C7463A' }}>
                    {b.payment_status === 'paid' ? 'Paid' : 'Payment pending'}
                  </Text>
                </Text>

                {(needsPay || canCancel) && (
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
});
