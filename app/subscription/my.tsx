import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { colors, spacing, borderRadius, typography } from '../../src/shared/theme';
import { useAuthStore } from '../../src/features/auth/store/auth.store';
import {
  subscriptionApi,
  type ActiveSubscription,
} from '../../src/features/subscription/api/subscription.api';

function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function SubscriptionCard({
  subscription,
  ended,
}: {
  subscription: ActiveSubscription;
  ended?: boolean;
}) {
  const router = useRouter();
  const status = ended ? 'Ended' : subscription.is_on_hold ? 'Paused' : 'Active';
  const statusColor = ended
    ? colors.text.muted
    : subscription.is_on_hold
      ? colors.status.warning
      : colors.status.success;

  return (
    <View style={[styles.card, ended && styles.cardMuted]}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{subscription.meal_plan_type?.name || 'Meal plan'}</Text>
          <Text style={styles.cardSubtitle}>
            {subscription.subscription_period?.name || 'Subscription'}
            {subscription.category?.name ? ` · ${subscription.category.name}` : ''}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${statusColor}1F` }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{status}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{subscription.deliveries_left ?? '—'}</Text>
          <Text style={styles.statLabel}>Deliveries left</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{formatDate(subscription.end_date)}</Text>
          <Text style={styles.statLabel}>Ends</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.action, styles.actionOutline]}
          onPress={() => router.push(`/subscription/manage/${subscription.id}` as any)}
        >
          <Text style={styles.actionOutlineText}>{ended ? 'View details' : 'Manage'}</Text>
        </TouchableOpacity>
        {!ended ? (
          <TouchableOpacity
            style={[styles.action, styles.actionPrimary]}
            onPress={() => router.push(`/subscription/recharge/${subscription.id}` as any)}
          >
            <Text style={styles.actionPrimaryText}>Recharge</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

export default function SubscriptionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const subscriptionsQuery = useQuery({
    queryKey: ['subscriptions', 'all'],
    queryFn: () => subscriptionApi.getUserSubscriptions(true),
    enabled: isAuthenticated,
  });

  const active = subscriptionsQuery.data?.active ?? [];
  const inactive = subscriptionsQuery.data?.inactive ?? [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/subscription')} style={styles.iconButton}>
          <Ionicons name="chevron-back" size={23} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My subscriptions</Text>
        <TouchableOpacity
          onPress={() => router.push('/subscription/plans' as any)}
          style={styles.iconButton}
        >
          <Ionicons name="add" size={25} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxxl }]}
        refreshControl={
          isAuthenticated ? (
            <RefreshControl
              refreshing={subscriptionsQuery.isFetching && !subscriptionsQuery.isLoading}
              onRefresh={() => subscriptionsQuery.refetch()}
              tintColor={colors.primary}
            />
          ) : undefined
        }
      >
        {!isAuthenticated ? (
          <View style={styles.empty}>
            <Ionicons name="lock-closed-outline" size={38} color={colors.text.muted} />
            <Text style={styles.emptyTitle}>Sign in to manage your plans</Text>
            <Text style={styles.emptyBody}>Your active plans, schedule, preferences and recharge options appear here.</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={() => router.push({ pathname: '/(auth)/login', params: { redirect: '/subscription/my' } })}>
              <Text style={styles.primaryButtonText}>Sign in</Text>
            </TouchableOpacity>
          </View>
        ) : subscriptionsQuery.isLoading ? (
          <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 64 }} />
        ) : subscriptionsQuery.isError ? (
          <View style={styles.empty}>
            <Ionicons name="cloud-offline-outline" size={38} color={colors.text.muted} />
            <Text style={styles.emptyTitle}>Could not load subscriptions</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={() => subscriptionsQuery.refetch()}>
              <Text style={styles.primaryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active plans</Text>
              <Text style={styles.sectionCount}>{active.length}</Text>
            </View>
            {active.length ? (
              active.map((subscription) => (
                <SubscriptionCard key={subscription.id} subscription={subscription} />
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyCardTitle}>No active subscriptions</Text>
                <Text style={styles.emptyCardBody}>Choose a meal plan that fits your routine.</Text>
                <TouchableOpacity onPress={() => router.push('/subscription/plans' as any)}>
                  <Text style={styles.linkText}>Browse plans</Text>
                </TouchableOpacity>
              </View>
            )}

            {inactive.length ? (
              <>
                <View style={[styles.sectionHeader, { marginTop: spacing.xxl }]}>
                  <Text style={styles.sectionTitle}>Recently ended</Text>
                  <Text style={styles.sectionCount}>{inactive.length}</Text>
                </View>
                {inactive.map((subscription) => (
                  <SubscriptionCard key={subscription.id} subscription={subscription} ended />
                ))}
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  iconButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.heading.lg, color: colors.text.primary },
  content: { padding: spacing.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  sectionTitle: { ...typography.heading.md, color: colors.text.primary },
  sectionCount: {
    ...typography.body.sm, color: colors.primary, backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    borderRadius: borderRadius.full, fontWeight: '700',
  },
  card: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg,
    marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  cardMuted: { opacity: 0.78 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  cardTitle: { ...typography.heading.md, color: colors.text.primary },
  cardSubtitle: { ...typography.body.sm, color: colors.text.secondary, marginTop: spacing.xs },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  statusText: { ...typography.body.sm, fontWeight: '700' },
  statsRow: { flexDirection: 'row', marginTop: spacing.lg, gap: spacing.md },
  stat: { flex: 1, backgroundColor: colors.background, borderRadius: borderRadius.md, padding: spacing.md },
  statValue: { ...typography.body.md, color: colors.text.primary, fontWeight: '700' },
  statLabel: { ...typography.body.sm, color: colors.text.muted, marginTop: spacing.xs },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  action: { flex: 1, alignItems: 'center', paddingVertical: spacing.md, borderRadius: borderRadius.full },
  actionOutline: { borderWidth: 1, borderColor: colors.primary },
  actionOutlineText: { ...typography.body.md, color: colors.primary, fontWeight: '700' },
  actionPrimary: { backgroundColor: colors.primary },
  actionPrimaryText: { ...typography.body.md, color: colors.text.inverse, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 72, paddingHorizontal: spacing.xl },
  emptyTitle: { ...typography.heading.md, color: colors.text.primary, marginTop: spacing.lg, textAlign: 'center' },
  emptyBody: { ...typography.body.md, color: colors.text.secondary, textAlign: 'center', marginTop: spacing.sm },
  primaryButton: {
    backgroundColor: colors.primary, borderRadius: borderRadius.full,
    paddingHorizontal: spacing.xxl, paddingVertical: spacing.md, marginTop: spacing.xl,
  },
  primaryButtonText: { ...typography.body.md, color: colors.text.inverse, fontWeight: '700' },
  emptyCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.xl,
    borderWidth: 1, borderColor: colors.border,
  },
  emptyCardTitle: { ...typography.heading.md, color: colors.text.primary },
  emptyCardBody: { ...typography.body.md, color: colors.text.secondary, marginTop: spacing.sm },
  linkText: { ...typography.body.md, color: colors.primary, fontWeight: '700', marginTop: spacing.lg },
});
