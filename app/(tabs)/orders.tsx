import React from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ordersApi } from '../../src/features/orders/api/orders.api';
import { useAuthStore } from '../../src/features/auth/store/auth.store';
import { colors, spacing, borderRadius, typography, shadows } from '../../src/shared/theme';
import { formatPrice, formatDate } from '../../src/shared/utils/helpers';
import EmptyState from '../../src/shared/components/EmptyState';

const STATUS_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  pending: { bg: '#FEF3C7', text: '#92400E', icon: 'time-outline' },
  confirmed: { bg: '#DBEAFE', text: '#1E40AF', icon: 'checkmark-circle-outline' },
  preparing: { bg: '#FDE68A', text: '#92400E', icon: 'flame-outline' },
  ready: { bg: '#D1FAE5', text: '#065F46', icon: 'checkmark-done-outline' },
  delivered: { bg: '#ECFCE5', text: '#166534', icon: 'bicycle-outline' },
  cancelled: { bg: '#FEE2E2', text: '#991B1B', icon: 'close-circle-outline' },
};

export default function OrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [refreshing, setRefreshing] = React.useState(false);

  const { data: orders, refetch, isLoading } = useQuery({
    queryKey: ['orders', 'my'],
    queryFn: ordersApi.getMyOrders,
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Orders</Text>
        </View>
        <EmptyState
          icon="log-in-outline"
          title="Login to see your orders"
          description="Sign in to view order history and track deliveries"
          actionLabel="Login"
          onAction={() => router.push('/(auth)/login')}
        />
      </View>
    );
  }

  const renderOrder = ({ item }: { item: any }) => {
    const status = STATUS_COLORS[item.status] || STATUS_COLORS.pending;
    return (
      <TouchableOpacity
        style={styles.orderCard}
        activeOpacity={0.85}
      >
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderId}>Order #{item.id}</Text>
            <Text style={styles.orderDate}>{formatDate(item.order_date || item.delivery_date)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Ionicons name={status.icon as any} size={12} color={status.text} />
            <Text style={[styles.statusText, { color: status.text }]}>{item.status}</Text>
          </View>
        </View>
        <View style={styles.orderDivider} />
        <View style={styles.orderBody}>
          <View style={styles.orderMealInfo}>
            <Ionicons name="restaurant" size={18} color={colors.primary} />
            <Text style={styles.orderMeal} numberOfLines={1}>{item.meal_item || 'Meal'}</Text>
          </View>
          {item.total_amount && (
            <Text style={styles.orderAmount}>{formatPrice(item.total_amount)}</Text>
          )}
        </View>
        {item.delivery_date && (
          <View style={styles.orderFooter}>
            <Ionicons name="calendar-outline" size={14} color={colors.text.muted} />
            <Text style={styles.deliveryText}>Delivery: {formatDate(item.delivery_date)}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>

      <FlatList
        data={orders || []}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderOrder}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <EmptyState
            icon="receipt-outline"
            title="No orders yet"
            description="Your order history will appear here"
            actionLabel="Browse Menu"
            onAction={() => router.push('/(tabs)/menu')}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
  },
  headerTitle: { ...typography.heading.xl, color: colors.text.primary },
  listContent: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  orderCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.xl,
    padding: spacing.lg, marginBottom: spacing.md,
    borderWidth: 1, borderColor: colors.border, ...shadows.sm,
  },
  orderHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  orderId: { ...typography.heading.sm, color: colors.text.primary },
  orderDate: { ...typography.body.sm, color: colors.text.muted, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statusText: { ...typography.body.xs, fontWeight: '600', textTransform: 'capitalize' },
  orderDivider: { height: 1, backgroundColor: colors.divider, marginVertical: spacing.md },
  orderBody: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  orderMealInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  orderMeal: { ...typography.body.lg, color: colors.text.primary, flex: 1 },
  orderAmount: { ...typography.heading.sm, color: colors.primary },
  orderFooter: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    marginTop: spacing.md, paddingTop: spacing.sm,
    borderTopWidth: 1, borderTopColor: colors.divider,
  },
  deliveryText: { ...typography.body.sm, color: colors.text.muted },
});
