import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { subscriptionApi } from '../../src/features/subscription/api/subscription.api';
import { colors, spacing, borderRadius, typography, shadows } from '../../src/shared/theme';
import { formatPrice } from '../../src/shared/utils/helpers';
import Loading from '../../src/shared/components/Loading';

export default function SubscriptionPlans() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: plans, isLoading } = useQuery({
    queryKey: ['subscriptionPlans'],
    queryFn: subscriptionApi.getPlans,
  });

  if (isLoading) return <Loading fullScreen />;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Your Plan</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={plans || []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.planCard}
            activeOpacity={0.85}
            onPress={() => router.push('/subscription/create')}
          >
            <View style={styles.planHeader}>
              <View>
                <Text style={styles.planType}>{item.meal_plan_type?.name || 'Plan'}</Text>
                <Text style={styles.planPeriod}>{item.subscription_period?.name || ''}</Text>
              </View>
              {item.free_meals > 0 && (
                <View style={styles.freeBadge}>
                  <Text style={styles.freeBadgeText}>{item.free_meals} Free Meals</Text>
                </View>
              )}
            </View>
            <View style={styles.planPricing}>
              <Text style={styles.planPrice}>{formatPrice(item.price)}</Text>
              {item.original_price && Number(item.original_price) > Number(item.price) && (
                <Text style={styles.planOriginal}>{formatPrice(item.original_price)}</Text>
              )}
              {item.original_price && Number(item.original_price) > Number(item.price) && (
                <View style={styles.saveBadge}>
                  <Text style={styles.saveBadgeText}>
                    Save {formatPrice(Number(item.original_price) - Number(item.price))}
                  </Text>
                </View>
              )}
            </View>
            {item.cashback_percentage > 0 && (
              <Text style={styles.cashback}>💸 {item.cashback_percentage}% cashback</Text>
            )}
            <View style={styles.planFooter}>
              <Text style={styles.selectText}>Select Plan</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.primary} />
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>No subscription plans available</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
  },
  headerTitle: { ...typography.heading.lg, color: colors.text.primary },
  listContent: { paddingHorizontal: spacing.xl, paddingBottom: 40 },
  planCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.xl,
    marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border, ...shadows.sm,
  },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  planType: { ...typography.heading.md, color: colors.text.primary },
  planPeriod: { ...typography.body.md, color: colors.text.secondary, marginTop: 2 },
  freeBadge: { backgroundColor: colors.primaryLight, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  freeBadgeText: { ...typography.body.xs, color: colors.primary, fontWeight: '600' },
  planPricing: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.lg },
  planPrice: { ...typography.heading.xl, color: colors.primary, fontSize: 28 },
  planOriginal: { ...typography.body.lg, color: colors.text.disabled, textDecorationLine: 'line-through' },
  saveBadge: { backgroundColor: colors.status.successBg, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm },
  saveBadgeText: { ...typography.body.xs, color: colors.status.success, fontWeight: '600' },
  cashback: { ...typography.body.md, color: colors.accent.orange, marginTop: spacing.sm },
  planFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.divider,
  },
  selectText: { ...typography.button.md, color: colors.primary },
  emptyWrap: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { ...typography.body.md, color: colors.text.muted },
});
