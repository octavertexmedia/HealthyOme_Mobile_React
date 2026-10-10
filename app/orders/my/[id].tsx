import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ordersApi,
  type OrderDetail,
  type OrderTracking,
  type OrderStatus,
} from '../../../src/features/orders/api/orders.api';
import { canCancelOrder } from '../../../src/features/orders/orderPolicies';
import { getImageUrl } from '../../../src/shared/utils/helpers';

export default function OrderDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id: string }>();
  const orderId = Number(params.id);
  const queryClient = useQueryClient();

  const detailQuery = useQuery<OrderDetail>({
    queryKey: ['order', orderId, 'detail'],
    queryFn: () => ordersApi.getOrderDetail(orderId),
    enabled: Number.isFinite(orderId),
  });

  const trackQuery = useQuery<OrderTracking>({
    queryKey: ['order', orderId, 'track'],
    queryFn: () => ordersApi.trackOrder(orderId),
    enabled: Number.isFinite(orderId),
    refetchInterval: (q) => {
      const status = q.state.data?.status;
      if (status === 'delivered' || status === 'cancelled') return false;
      return 15000;
    },
    refetchIntervalInBackground: false,
  });

  const cancelMutation = useMutation({
    mutationFn: () => ordersApi.cancelOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (err: any) => {
      Alert.alert(
        'Could not cancel',
        err?.response?.data?.error || 'Please try again in a moment.'
      );
    },
  });

  const confirmCancel = () => {
    Alert.alert(
      'Cancel this order?',
      'This action cannot be undone.',
      [
        { text: 'Keep order', style: 'cancel' },
        {
          text: 'Cancel order',
          style: 'destructive',
          onPress: () => cancelMutation.mutate(),
        },
      ]
    );
  };

  const detail = detailQuery.data;
  const tracking = trackQuery.data;
  const status = tracking?.status ?? detail?.status;
  const canCancel =
    tracking?.cancellable ?? canCancelOrder(detail?.order_type, status);

  const headerColor = useMemo(() => {
    switch (status) {
      case 'delivered':
        return '#0F7A2E';
      case 'cancelled':
        return '#C7463A';
      default:
        return '#0B262F';
    }
  }, [status]);

  if (detailQuery.isLoading && !detail) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color="#2C921D" />
      </View>
    );
  }

  if (!detail) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Order not found.</Text>
        <TouchableOpacity style={styles.linkBtn} onPress={() => router.back()}>
          <Text style={styles.linkText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order #{detail.id}</Text>
        <TouchableOpacity onPress={() => trackQuery.refetch()}>
          <Ionicons name="refresh" size={22} color="#111" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        <View style={styles.heroCard}>
          {detail.meal_image ? (
            <Image source={{ uri: getImageUrl(detail.meal_image) }} style={styles.heroImg} />
          ) : (
            <View style={[styles.heroImg, styles.heroImgPlaceholder]}>
              <Ionicons name="restaurant-outline" size={32} color="#0B262F" />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.mealName}>{detail.meal_name}</Text>
            <Text style={[styles.statusTag, { color: headerColor }]}>
              {tracking?.status_display ?? capitalize(detail.status)}
            </Text>
            <Text style={styles.deliveryHint}>
              Delivery: {detail.delivery_date}
              {detail.delivery_time_slot ? ` • ${detail.delivery_time_slot}` : ''}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tracking</Text>
          {trackQuery.isLoading ? (
            <ActivityIndicator color="#2C921D" />
          ) : tracking ? (
            <TrackingTimeline steps={tracking.steps} currentStatus={tracking.status} />
          ) : (
            <Text style={styles.muted}>Tracking unavailable right now.</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment</Text>
          <SummaryRow label="Item total" value={`₹ ${detail.total_amount}`} />
          {detail.discount_amount > 0 && (
            <SummaryRow label="Discount" value={`– ₹ ${detail.discount_amount}`} />
          )}
          <View style={styles.dashedDivider} />
          <SummaryRow label="Paid" value={`₹ ${detail.final_amount}`} bold />
          {detail.payment_method ? (
            <SummaryRow
              label="Method"
              value={`${capitalize(detail.payment_method)}${
                detail.payment_status ? ` · ${capitalize(detail.payment_status)}` : ''
              }`}
            />
          ) : null}
        </View>

        {(detail.special_instructions || detail.delivery_instructions) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            {detail.special_instructions ? (
              <Text style={styles.noteText}>“{detail.special_instructions}”</Text>
            ) : null}
            {detail.delivery_instructions ? (
              <Text style={styles.noteSub}>{detail.delivery_instructions}</Text>
            ) : null}
          </View>
        )}
      </ScrollView>

      {canCancel && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={[styles.cancelBtn, cancelMutation.isPending && { opacity: 0.6 }]}
            onPress={confirmCancel}
            disabled={cancelMutation.isPending}
            activeOpacity={0.9}
          >
            {cancelMutation.isPending ? (
              <ActivityIndicator color="#C7463A" />
            ) : (
              <Text style={styles.cancelText}>Cancel order</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function TrackingTimeline({
  steps,
  currentStatus,
}: {
  steps: OrderTracking['steps'];
  currentStatus: OrderStatus;
}) {
  if (currentStatus === 'cancelled') {
    return (
      <View style={styles.cancelledBox}>
        <Ionicons name="close-circle" size={22} color="#C7463A" />
        <Text style={styles.cancelledText}>This order was cancelled.</Text>
      </View>
    );
  }

  return (
    <View>
      {steps.map((step, idx) => {
        const isCurrent = step.status === currentStatus;
        const isLast = idx === steps.length - 1;
        return (
          <View key={step.status} style={styles.stepRow}>
            <View style={styles.stepDotCol}>
              <View
                style={[
                  styles.stepDot,
                  step.completed && styles.stepDotDone,
                  isCurrent && styles.stepDotCurrent,
                ]}
              >
                {step.completed && (
                  <Ionicons name="checkmark" size={12} color="#fff" />
                )}
              </View>
              {!isLast && (
                <View
                  style={[
                    styles.stepLine,
                    step.completed && styles.stepLineDone,
                  ]}
                />
              )}
            </View>
            <View style={{ flex: 1, paddingBottom: isLast ? 0 : 16 }}>
              <Text
                style={[
                  styles.stepLabel,
                  step.completed && styles.stepLabelDone,
                  isCurrent && styles.stepLabelCurrent,
                ]}
              >
                {step.label}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function SummaryRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, bold && styles.summaryBold]}>{label}</Text>
      <Text style={[styles.summaryValue, bold && styles.summaryBold]}>{value}</Text>
    </View>
  );
}

function capitalize(s?: string) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  errorText: { fontSize: 16, color: '#C7463A', marginBottom: 12 },
  linkBtn: { paddingVertical: 12, paddingHorizontal: 20 },
  linkText: { fontSize: 16, fontWeight: '600', color: '#0B262F' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#141414' },

  heroCard: {
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  heroImg: {
    width: 72,
    height: 72,
    borderRadius: 14,
    backgroundColor: '#F1F5F0',
  },
  heroImgPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  mealName: { fontSize: 17, fontWeight: '600', color: '#0B262F' },
  statusTag: { marginTop: 4, fontSize: 14, fontWeight: '600' },
  deliveryHint: { marginTop: 4, fontSize: 13, color: '#6C6C6C' },

  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#0B262F', marginBottom: 12 },
  muted: { color: '#6C6C6C' },

  stepRow: { flexDirection: 'row', gap: 12 },
  stepDotCol: { alignItems: 'center', width: 22 },
  stepDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#D5D8D7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotDone: { backgroundColor: '#2C921D', borderColor: '#2C921D' },
  stepDotCurrent: { borderColor: '#2C921D', borderWidth: 3 },
  stepLine: { flex: 1, width: 2, backgroundColor: '#E2DEDE', marginTop: 2 },
  stepLineDone: { backgroundColor: '#2C921D' },
  stepLabel: { fontSize: 14, color: '#6C6C6C', fontWeight: '500', marginTop: -2 },
  stepLabelDone: { color: '#0B262F' },
  stepLabelCurrent: { color: '#0B262F', fontWeight: '700' },

  cancelledBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: '#FDECEA',
    borderRadius: 10,
  },
  cancelledText: { color: '#C7463A', fontWeight: '600' },

  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  summaryLabel: { fontSize: 14, color: '#6C6C6C' },
  summaryValue: { fontSize: 14, color: '#0B262F', fontWeight: '500' },
  summaryBold: { fontWeight: '700', color: '#0B262F', fontSize: 16 },
  dashedDivider: {
    height: 1,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#BFBFBF',
    marginVertical: 8,
  },
  noteText: { fontSize: 14, color: '#0B262F', fontStyle: 'italic' },
  noteSub: { fontSize: 13, color: '#6C6C6C', marginTop: 4 },

  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2DEDE',
    backgroundColor: '#fff',
  },
  cancelBtn: {
    borderRadius: 90,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#C7463A',
    backgroundColor: '#fff',
  },
  cancelText: { color: '#C7463A', fontWeight: '600', fontSize: 16 },
});
