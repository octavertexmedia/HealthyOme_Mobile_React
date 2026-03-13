import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ordersApi } from '../../src/features/orders/api/orders.api';
import { useAuthStore } from '../../src/features/auth/store/auth.store';
import { colors, spacing, typography } from '../../src/shared/theme';
import { formatPrice, formatDate } from '../../src/shared/utils/helpers';
import EmptyState from '../../src/shared/components/EmptyState';

// Web App Equivalent Mock Data for Subscriptions to show the design
const mockSubscriptionOrders = [
  {
    id: "1", date: "2025-01-12", time: "13:40", mealType: "Lunch",
    plan: "Balanced Meal", title: "Vegetable Poha + Salad", status: "Delivered",
  },
  {
    id: "2", date: "2025-01-12", time: "09:10", mealType: "Breakfast",
    plan: "Balanced Meal", title: "Upma + Fruit", status: "Delivered",
  },
  {
    id: "3", date: "2025-01-13", time: "13:00", mealType: "Lunch",
    plan: "Protein Meal", title: "Chicken Salad + Smoothie", arrive: "1PM - 2PM", customizable: true,
  },
];

const mockQuickMealOrders = [
  {
    id: "q1", date: "2025-01-12", time: "20:15", plan: "Soup",
    title: "Chicken Soup + Mushroom Soup (2)", status: "Delivered", bill: "₹234", reorder: true,
  },
  {
    id: "q2", date: "2025-01-10", time: "19:30", plan: "Salad",
    title: "Chicken Salad + Mushroom Salad (2)", status: "Delivered", bill: "₹234", reorder: true,
  },
];

type TabType = "subscriptions" | "quick";

export default function OrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  
  const [activeTab, setActiveTab] = useState<TabType>("subscriptions");
  const [month, setMonth] = useState({ label: "January", value: "2025-01" });
  const [refreshing, setRefreshing] = useState(false);

  const { data: realOrders, refetch } = useQuery({
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

  // Merge Real API orders with the Web App Mock to show the UI parity
  const groupedOrders = useMemo(() => {
    const source = activeTab === "subscriptions" ? mockSubscriptionOrders : mockQuickMealOrders;
    
    // In production, we would map `realOrders` to match this `source` array if it exists
    // and correctly categorize into "subscriptions" vs "quick"

    const datesObj: Record<string, any[]> = {};
    source.forEach(o => {
      if (!datesObj[o.date]) datesObj[o.date] = [];
      datesObj[o.date].push(o);
    });

    if (realOrders && realOrders.length > 0 && activeTab === 'quick') {
       // Append real orders to today's date
       const today = new Date().toISOString().split('T')[0];
       if (!datesObj[today]) datesObj[today] = [];
       realOrders.forEach((ro: any) => {
         datesObj[today].push({
           id: ro.id, time: "14:00", plan: "Meal", title: ro.meal_item || "Menu Item",
           status: ro.status, bill: formatPrice(ro.total_amount || 0), reorder: true, date: today
         });
       });
    }

    return datesObj;
  }, [activeTab, realOrders]);

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Active orders</Text>
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Active orders</Text>
        <View style={styles.monthPickerRow}>
          <TouchableOpacity style={styles.monthBtn}>
            <Text style={styles.monthLabel}>{month.label}</Text>
            <Ionicons name="caret-down" size={14} color="#111" />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="calendar-outline" size={20} color="#111" />
          </TouchableOpacity>
        </View>
      </View>

      {/* TABS */}
      <View style={styles.tabsContainer}>
        <View style={styles.tabsWrapper}>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === "subscriptions" && styles.tabBtnActive]}
            onPress={() => setActiveTab("subscriptions")}
          >
            <Text style={[styles.tabText, activeTab === "subscriptions" && styles.tabTextActive]}>
              Subscriptions
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === "quick" && styles.tabBtnActive]}
            onPress={() => setActiveTab("quick")}
          >
            <Text style={[styles.tabText, activeTab === "quick" && styles.tabTextActive]}>
              Quick Meal
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {Object.keys(groupedOrders).length === 0 ? (
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
                 <Text style={styles.dateLabel}>{formatDate(date)}</Text>
               </View>

               <View style={styles.itemsWrapper}>
                 {items.map((item, idx) => (
                    <View key={item.id} style={styles.timelineItem}>
                      {/* Timeline Line */}
                      <View style={styles.timelineLine} />

                      {/* Content Card */}
                      <View style={styles.card}>
                        {item.mealType && (
                          <Text style={styles.slotText}>{item.mealType} · 1 items</Text>
                        )}
                        
                        <View style={styles.cardHeader}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.planText}>{item.plan}</Text>
                            <Text style={styles.titleText}>{item.title}</Text>
                          </View>
                          {item.status === 'Delivered' && (
                            <View style={styles.deliveredBadge}>
                              <Ionicons name="checkmark" size={12} color="#15803D" />
                              <Text style={styles.deliveredText}>Delivered</Text>
                            </View>
                          )}
                        </View>

                        {item.arrive && (
                          <Text style={styles.arriveText}>🚚 Arrive: {item.arrive}</Text>
                        )}
                        {item.bill && (
                          <Text style={styles.billText}>Ordered at {item.time} · Total Bill {item.bill}</Text>
                        )}

                        <View style={styles.cardFooter}>
                          <TouchableOpacity>
                            <Text style={styles.helpText}>Get Help</Text>
                          </TouchableOpacity>
                          
                          {item.customizable && (
                            <TouchableOpacity style={styles.actionBtn}>
                              <Text style={styles.actionBtnText}>+ Add items</Text>
                            </TouchableOpacity>
                          )}
                          
                          {item.reorder && (
                            <TouchableOpacity style={styles.actionBtn}>
                              <Text style={styles.actionBtnText}>⟳ Reorder</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </View>
                 ))}
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
  
  /* Header */
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111' },
  monthPickerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12,
  },
  monthBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  monthLabel: { fontSize: 14, fontWeight: '500', color: '#111' },

  /* Tabs */
  tabsContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  tabsWrapper: {
    flexDirection: 'row',
    backgroundColor: '#F1F1F1',
    borderRadius: 12,
    padding: 4,
  },
  tabBtn: {
    flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8,
  },
  tabBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  tabText: { fontSize: 14, fontWeight: '500', color: '#6B7280' },
  tabTextActive: { color: '#111' },

  /* Day Section */
  daySection: { marginTop: 16 },
  dateBadge: { backgroundColor: '#EAF1F0', paddingHorizontal: 16, paddingVertical: 8 },
  dateLabel: { fontSize: 14, fontWeight: '600', color: '#111' },
  itemsWrapper: { paddingHorizontal: 16, paddingVertical: 16, gap: 16 },

  /* Timeline Item */
  timelineItem: { paddingLeft: 16, position: 'relative' },
  timelineLine: {
    position: 'absolute', left: 0, top: 0, bottom: -16, width: 1, backgroundColor: '#D1D5DB',
  },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  slotText: { fontSize: 14, fontWeight: '500', color: '#111', marginBottom: 6 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  planText: { fontSize: 14, color: '#6B7280' },
  titleText: { fontSize: 15, fontWeight: '500', color: '#111', marginTop: 2 },
  deliveredBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#DCFCE7',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4,
  },
  deliveredText: { fontSize: 12, color: '#15803D', fontWeight: '500' },
  arriveText: { fontSize: 14, color: '#6B7280', marginTop: 8 },
  billText: { fontSize: 14, color: '#6B7280', marginTop: 8 },
  
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16,
  },
  helpText: { fontSize: 14, color: '#16A34A' },
  actionBtn: {
    borderWidth: 1, borderColor: '#16A34A', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6,
  },
  actionBtnText: { fontSize: 13, color: '#16A34A' },
});
