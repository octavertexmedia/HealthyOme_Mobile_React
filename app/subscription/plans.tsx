import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { subscriptionApi, type SubscriptionPlan } from '../../src/features/subscription/api/subscription.api';
import { colors } from '../../src/shared/theme';
import EmptyState from '../../src/shared/components/EmptyState';

const GRADIENT_PALETTE: [string, string][] = [
  ['#E8F5E9', '#C8E6C9'],
  ['#FFF3E0', '#FFE0B2'],
  ['#E3F2FD', '#BBDEFB'],
  ['#FCE4EC', '#F8BBD0'],
  ['#F3E5F5', '#E1BEE7'],
];

function planTitle(plan: SubscriptionPlan): string {
  if (plan.name) return plan.name;
  if (typeof plan.meal_plan_type === 'object' && plan.meal_plan_type?.name) {
    return plan.meal_plan_type.name;
  }
  return 'Subscription Plan';
}

function planSubtitle(plan: SubscriptionPlan): string {
  const period =
    typeof plan.subscription_period === 'object'
      ? plan.subscription_period?.name
      : null;
  const category =
    typeof plan.category === 'object' ? plan.category?.name : null;
  return [category, period].filter(Boolean).join(' · ');
}

function planPriceLabel(plan: SubscriptionPlan): string {
  const price = Number(plan.price);
  if (Number.isNaN(price)) return '';
  const period =
    typeof plan.subscription_period === 'object'
      ? plan.subscription_period?.name
      : null;
  return `₹${price.toFixed(0)}${period ? ` / ${period}` : ''}`;
}

export default function SubscriptionPlansScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const plansQuery = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: subscriptionApi.getPlans,
  });

  const plans = (plansQuery.data ?? []).filter((p) => p.is_active);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Available Plans</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={plansQuery.isFetching && !plansQuery.isLoading}
            onRefresh={() => plansQuery.refetch()}
            tintColor={colors.primary}
          />
        }
      >
        {plansQuery.isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
        ) : plansQuery.isError ? (
          <EmptyState
            icon="cloud-offline-outline"
            title="Could not load plans"
            description="Pull down to refresh, or try again later."
          />
        ) : plans.length === 0 ? (
          <EmptyState
            icon="cube-outline"
            title="No active plans"
            description="Subscription plans aren't available right now."
          />
        ) : (
          plans.map((plan, idx) => (
            <TouchableOpacity
              key={plan.id}
              style={styles.planCard}
              activeOpacity={0.9}
              onPress={() =>
                router.push({ pathname: '/subscription/create', params: { planId: String(plan.id) } } as any)
              }
            >
              <LinearGradient colors={GRADIENT_PALETTE[idx % GRADIENT_PALETTE.length]} style={styles.planCardInner}>
                <View style={styles.planEmoji}>
                  <Ionicons name="leaf-outline" size={28} color="#4B8E3D" />
                </View>
                <View style={styles.planInfo}>
                  <Text style={styles.planTitle}>{planTitle(plan)}</Text>
                  {!!planSubtitle(plan) && (
                    <Text style={styles.planDesc}>{planSubtitle(plan)}</Text>
                  )}
                  {!!plan.description && (
                    <Text style={styles.planDesc} numberOfLines={2}>{plan.description}</Text>
                  )}
                  <Text style={styles.planPrice}>{planPriceLabel(plan)}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6B7280" />
              </LinearGradient>
            </TouchableOpacity>
          ))
        )}

        <View style={styles.serviceInfo}>
          <ServiceInfoItem icon="shield-checkmark-outline" text="No hidden charges" />
          <ServiceInfoItem icon="refresh-outline" text="Pause or cancel anytime" />
          <ServiceInfoItem icon="time-outline" text="Fresh meals daily" />
          <ServiceInfoItem icon="star-outline" text="Satisfaction guaranteed" />
        </View>
      </ScrollView>
    </View>
  );
}

function ServiceInfoItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.serviceRow}>
      <Ionicons name={icon as any} size={18} color="#4B8E3D" />
      <Text style={styles.serviceText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F7F8' },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#111' },

  scrollContent: { padding: 16, gap: 16, flexGrow: 1 },

  planCard: {
    borderRadius: 20, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  planCardInner: {
    flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16,
  },
  planEmoji: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  planInfo: { flex: 1 },
  planTitle: { fontSize: 17, fontWeight: '700', color: '#111', marginBottom: 4 },
  planDesc: { fontSize: 13, color: '#6B7280', lineHeight: 18, marginBottom: 6 },
  planPrice: { fontSize: 16, fontWeight: '600', color: '#4B8E3D' },

  serviceInfo: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20, marginTop: 8, gap: 14,
  },
  serviceRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  serviceText: { fontSize: 14, color: '#6B7280' },
});
