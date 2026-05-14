import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ordersApi, type OrderSummary, type OrderStatus } from '../../src/features/orders/api/orders.api';
import { useAuthStore } from '../../src/features/auth/store/auth.store';
import { colors } from '../../src/shared/theme';
import { formatPrice, formatDate, formatTime } from '../../src/shared/utils/helpers';
import EmptyState from '../../src/shared/components/EmptyState';

type TabType = 'subscriptions' | 'quick';

const STATUS_DISPLAY: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  pending:    { label: 'Pending',    color: '#92400E', bg: '#FEF3C7' },
  confirmed:  { label: 'Confirmed',  color: '#1E40AF', bg: '#DBEAFE' },
  preparing:  { label: 'Preparing',  color: '#1E40AF', bg: '#DBEAFE' },
  ready:      { label: 'Ready',      color: '#15803D', bg: '#DCFCE7' },
  delivered:  { label: 'Delivered',  color: '#15803D', bg: '#DCFCE7' },
  cancelled:  { label: 'Cancelled',  color: '#991B1B', bg: '#FEE2E2' },
};

const isSubscriptionOrder = (o: OrderSummary) =>
  /sub/i.test(o.order_type || '');

export default function OrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [activeTab, setActiveTab] = useState<TabType>('quick');
  const [refreshing, setRefreshing] = useState(false);

  const ordersQuery = useQuery({
    queryKey: ['orders', 'my'],
    queryFn: ordersApi.getMyOrders,
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await ordersQuery.refetch();
    setRefreshing(false);
  };

  const groupedOrders = useMemo(() => {
    const orders = ordersQuery.data ?? [];
    const filtered = orders.filter((o) =>
      activeTab === 'subscriptions' ? isSubscriptionOrder(o) : !isSubscriptionOrder(o)
    );

    const groups: Record<string, OrderSummary[]> = {};
    for (const o of filtered) {
      const key = o.delivery_date || o.order_date || o.created_at?.slice(0, 10) || 'Other';
      if (!groups[key]) groups[key] = [];
      groups[key].push(o);
    }
    return groups;
  }, [ordersQuery.data, activeTab]);

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My orders</Text>
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

  const isLoading = ordersQuery.isLoading && !ordersQuery.data;
  const hasOrders = Object.keys(groupedOrders).length > 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My orders</Text>
      </View>

      <View style={styles.tabsContainer}>
        <View style={styles.tabsWrapper}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'quick' && styles.tabBtnActive]}
            onPress={() => setActiveTab('quick')}
          >
            <Text style={[styles.tabText, activeTab === 'quick' && styles.tabTextActive]}>Quick Meal</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'subscriptions' && styles.tabBtnActive]}
            onPress={() => setActiveTab('subscriptions')}
          >
            <Text style={[styles.tabText, activeTab === 'subscriptions' && styles.tabTextActive]}>Subscriptions</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : !hasOrders ? (
          <View style={{ marginTop: 40 }}>
            <EmptyState
              icon="receipt-outline"
              title="No orders yet"
              description="Your order history will appear here"
              actionLabel="Browse Menu"
              onAction={() => router.push('/(tabs)/menu')}
            />
          </View>
        ) : (
          Object.entries(groupedOrders).map(([date, items]) => (
            <View key={date} style={styles.daySection}>
              <View style={styles.dateBadge}>
                <Text style={styles.dateLabel}>{formatDate(date) || date}</Text>
              </View>

              <View style={styles.itemsWrapper}>
                {items.map((item) => {
                  const statusInfo = STATUS_DISPLAY[item.status] ?? STATUS_DISPLAY.pending;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.timelineItem}
                      activeOpacity={0.85}
                      onPress={() => router.push(`/orders/my/${item.id}` as any)}
                    >
                      <View style={styles.timelineLine} />
                      <View style={styles.card}>
                        <View style={styles.cardHeader}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.planText}>
                              {item.order_type || 'Meal'}{item.delivery_time_slot ? ` · ${item.delivery_time_slot}` : ''}
                            </Text>
                            <Text style={styles.titleText}>{item.meal_name || 'Order'}</Text>
                          </View>
                          <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                            <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
                          </View>
                        </View>
                        <Text style={styles.billText}>
                          Ordered {formatTime(item.created_at)} · Total {formatPrice(item.final_amount || item.total_amount)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F8F7' },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111' },

  tabsContainer: { backgroundColor: '#fff', paddingHorizontal: 16, paddingBottom: 16 },
  tabsWrapper: { flexDirection: 'row', backgroundColor: '#F1F1F1', borderRadius: 12, padding: 4 },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  tabText: { fontSize: 14, fontWeight: '500', color: '#6B7280' },
  tabTextActive: { color: '#111' },

  loadingWrap: { paddingVertical: 48, alignItems: 'center' },

  daySection: { marginTop: 16 },
  dateBadge: { backgroundColor: '#EAF1F0', paddingHorizontal: 16, paddingVertical: 8 },
  dateLabel: { fontSize: 14, fontWeight: '600', color: '#111' },
  itemsWrapper: { paddingHorizontal: 16, paddingVertical: 16, gap: 16 },

  timelineItem: { paddingLeft: 16, position: 'relative' },
  timelineLine: { position: 'absolute', left: 0, top: 0, bottom: -16, width: 1, backgroundColor: '#D1D5DB' },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  planText: { fontSize: 14, color: '#6B7280' },
  titleText: { fontSize: 15, fontWeight: '500', color: '#111', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 12, fontWeight: '600' },
  billText: { fontSize: 14, color: '#6B7280', marginTop: 8 },
});
