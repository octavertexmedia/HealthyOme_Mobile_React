import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  type Enrollment,
  type EnrollmentStatus,
} from '../../src/features/functional-training/api/functionalTraining.api';
import { useMyEnrollments } from '../../src/features/functional-training/hooks/useFunctionalTraining';
import { usePayment } from '../../src/features/payments/hooks/usePayment';
import { useAuthStore } from '../../src/features/auth/store/auth.store';

const STATUS_COLOR: Record<EnrollmentStatus, string> = {
  pending: '#F5A623',
  active: '#4B8E3D',
  completed: '#0B262F',
  cancelled: '#C7463A',
};

const STATUS_LABEL: Record<EnrollmentStatus, string> = {
  pending: 'Awaiting payment',
  active: 'Active',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

function formatDate(ymd: string): string {
  const d = new Date(`${ymd}T00:00:00`);
  if (Number.isNaN(d.getTime())) return ymd;
  return d.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function MyEnrollmentsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const enrollmentsQuery = useMyEnrollments(isAuthenticated);
  const { pay, loading: paying } = usePayment();
  const email = useAuthStore((s) => s.user?.email);

  const enrollments = enrollmentsQuery.data ?? [];

  const onPay = async (e: Enrollment) => {
    const priceLabel = e.monthly_price_inr != null ? ` ₹${e.monthly_price_inr}` : '';
    Alert.alert(
      'Complete payment',
      `Pay${priceLabel} for your plan with ${e.trainer_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pay now',
          onPress: async () => {
            const r = await pay({
              kind: 'functional_training',
              order: { enrollment_id: e.id },
              fulfillment: email ? { email } : undefined,
            });
            if (r.status === 'paid') {
              enrollmentsQuery.refetch();
            } else if (r.status === 'failed') {
              if (r.error === 'payment_sdk_missing') {
                Alert.alert(
                  'Update required',
                  'Online payment needs the latest app build — please update the app to complete payment.'
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My training plans</Text>
        <TouchableOpacity onPress={() => router.push('/functional-training' as any)}>
          <Ionicons name="add" size={24} color="#2C921D" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        refreshControl={
          <RefreshControl
            refreshing={enrollmentsQuery.isFetching && !enrollmentsQuery.isLoading}
            onRefresh={() => {
              if (isAuthenticated) enrollmentsQuery.refetch();
            }}
            tintColor="#2C921D"
          />
        }
      >
        {!isAuthenticated ? (
          <View style={styles.empty}>
            <Ionicons name="lock-closed-outline" size={36} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>Sign in to view your plans</Text>
            <Text style={styles.emptySub}>
              Your training plans appear here once you sign in.
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => router.push('/(auth)/login' as any)}
            >
              <Text style={styles.emptyBtnText}>Sign in</Text>
            </TouchableOpacity>
          </View>
        ) : enrollmentsQuery.isLoading ? (
          <ActivityIndicator color="#2C921D" style={{ marginTop: 32 }} />
        ) : enrollmentsQuery.isError ? (
          <View style={styles.empty}>
            <Ionicons name="alert-circle-outline" size={36} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>Could not load your plans</Text>
            <Text style={styles.emptySub}>Please check your connection and try again.</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => enrollmentsQuery.refetch()}>
              <Text style={styles.emptyBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : enrollments.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="barbell-outline" size={36} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No training plans yet</Text>
            <Text style={styles.emptySub}>
              Enroll with a trainer to start your functional training.
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => router.push('/functional-training' as any)}
            >
              <Text style={styles.emptyBtnText}>Browse trainers</Text>
            </TouchableOpacity>
          </View>
        ) : (
          enrollments.map((e) => {
            const needsPay = e.needs_payment && e.status !== 'cancelled';
            return (
              <View key={e.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.trainerName}>{e.trainer_name}</Text>
                    <Text style={styles.slot}>{e.time_slot_label}</Text>
                    <Text style={styles.dates}>
                      {formatDate(e.starts_at)} – {formatDate(e.ends_at)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusTag,
                      { backgroundColor: STATUS_COLOR[e.status] + '22' },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: STATUS_COLOR[e.status] }]}>
                      {STATUS_LABEL[e.status]}
                    </Text>
                  </View>
                </View>

                <Text style={styles.feeText}>
                  {e.monthly_price_inr != null ? `₹${e.monthly_price_inr}/mo • ` : ''}
                  <Text
                    style={{
                      color: e.needs_payment
                        ? '#C7463A'
                        : e.status === 'cancelled'
                          ? '#9CA3AF'
                          : '#4B8E3D',
                    }}
                  >
                    {e.needs_payment
                      ? 'Payment pending'
                      : e.status === 'cancelled'
                        ? 'Cancelled'
                        : 'Paid'}
                  </Text>
                </Text>

                {needsPay && (
                  <TouchableOpacity
                    style={[styles.payBtn, paying && { opacity: 0.5 }]}
                    disabled={paying}
                    onPress={() => onPay(e)}
                  >
                    <Text style={styles.payBtnText}>Pay now</Text>
                  </TouchableOpacity>
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
    backgroundColor: '#2C921D',
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
  trainerName: { fontSize: 16, fontWeight: '600', color: '#111' },
  slot: { fontSize: 13, color: '#4B8E3D', marginTop: 4, fontWeight: '500' },
  dates: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  statusTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600' },
  feeText: { fontSize: 14, color: '#0B262F', marginTop: 10 },

  payBtn: {
    backgroundColor: '#2C921D',
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  payBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
