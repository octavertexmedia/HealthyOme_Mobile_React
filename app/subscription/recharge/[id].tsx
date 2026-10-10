import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { colors, spacing, borderRadius, typography } from '../../../src/shared/theme';
import { useAuthStore } from '../../../src/features/auth/store/auth.store';
import { subscriptionApi } from '../../../src/features/subscription/api/subscription.api';
import { usePayment } from '../../../src/features/payments/hooks/usePayment';

function formatMoney(value: number): string {
  return `₹${Number.isFinite(value) ? value.toFixed(0) : '0'}`;
}

function paymentMessage(error: string): string {
  const messages: Record<string, string> = {
    payment_sdk_missing: 'Payments require a HealthyOme development or store build, not Expo Go.',
    payments_disabled: 'Online payments are temporarily unavailable.',
    recharge_plan_not_found: 'That recharge period is no longer available.',
    recharge_pricing_failed: 'The recharge price could not be confirmed. Refresh and try again.',
    subscription_not_found: 'This subscription could not be found.',
    amount_mismatch: 'The recharge price changed. Refresh and try again.',
    invalid_coupon: 'That coupon is invalid or expired.',
    coupon_not_applicable: 'That coupon does not apply to subscription recharges.',
    coupon_min_order_not_met: 'This recharge does not meet the coupon minimum.',
  };
  return messages[error] ?? error.replaceAll('_', ' ');
}

export default function RechargeSubscriptionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { pay, loading: paying } = usePayment();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const email = useAuthStore((state) => state.user?.email?.trim());
  const params = useLocalSearchParams<{ id?: string }>();
  const subscriptionId = Number(params.id);
  const validId = Number.isInteger(subscriptionId) && subscriptionId > 0;

  const manageQuery = useQuery({
    queryKey: ['subscriptions', 'manage', subscriptionId],
    queryFn: () => subscriptionApi.getManage(subscriptionId),
    enabled: isAuthenticated && validId,
  });

  const [periodId, setPeriodId] = useState<number | null>(null);
  const [couponDraft, setCouponDraft] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const selectedPeriodId =
    periodId ?? manageQuery.data?.subscription.subscription_period?.id ?? null;

  const quoteQuery = useQuery({
    queryKey: ['subscriptions', 'recharge-quote', subscriptionId, selectedPeriodId, appliedCoupon],
    queryFn: () => subscriptionApi.getRechargeQuote(
      subscriptionId,
      selectedPeriodId!,
      appliedCoupon || undefined
    ),
    enabled: isAuthenticated && validId && selectedPeriodId != null,
  });

  const quote = quoteQuery.data;
  const canPay = Boolean(quote?.can_checkout && selectedPeriodId && email && !paying && !quoteQuery.isFetching);

  const applyCoupon = () => {
    const normalized = couponDraft.trim().toUpperCase();
    setCouponDraft(normalized);
    setAppliedCoupon(normalized);
  };

  const handlePayment = async () => {
    if (!selectedPeriodId || !quote) return;
    if (!email || !email.includes('@')) {
      Alert.alert('Email required', 'Add a valid email to your profile before paying.');
      return;
    }
    if (!quote.can_checkout) {
      Alert.alert('Recharge unavailable', quote.error_message || quote.error || 'Choose another recharge period.');
      return;
    }

    const result = await pay({
      kind: 'subscription_recharge',
      order: {
        currency: 'INR',
        email,
        amount: quote.payable_total,
        coupon_code: appliedCoupon || undefined,
        notes: { source: 'mobile_app' },
        recharge: {
          subscription_id: subscriptionId,
          subscription_period_id: selectedPeriodId,
        },
      },
      fulfillment: { email },
    });

    if (result.status === 'cancelled') return;
    if (result.status === 'failed') {
      Alert.alert('Recharge failed', paymentMessage(result.error));
      return;
    }

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['subscriptions', 'all'] }),
      queryClient.invalidateQueries({ queryKey: ['subscriptions', 'manage', subscriptionId] }),
      queryClient.invalidateQueries({ queryKey: ['subscriptions', 'recharge-quote', subscriptionId] }),
    ]);
    Alert.alert(
      'Plan recharged',
      'Payment was confirmed and your additional deliveries are scheduled.',
      [{ text: 'View plan', onPress: () => router.replace(`/subscription/manage/${subscriptionId}` as any) }]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="chevron-back" size={23} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recharge plan</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}>
        {!isAuthenticated ? (
          <EmptyState title="Sign in to recharge this plan" action="Sign in" onPress={() => router.push('/(auth)/login' as any)} />
        ) : !validId ? (
          <EmptyState title="Invalid subscription" action="Go back" onPress={() => router.back()} />
        ) : manageQuery.isLoading || (selectedPeriodId && quoteQuery.isLoading) ? (
          <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 64 }} />
        ) : manageQuery.isError || !manageQuery.data ? (
          <EmptyState title="Could not load this subscription" action="Retry" onPress={() => manageQuery.refetch()} />
        ) : !manageQuery.data.subscription.is_active ? (
          <EmptyState title="Ended subscriptions cannot be recharged" action="View subscriptions" onPress={() => router.replace('/subscription' as any)} />
        ) : !selectedPeriodId ? (
          <EmptyState title="No recharge periods are available" action="Go back" onPress={() => router.back()} />
        ) : (
          <>
            <View style={styles.planCard}>
              <Text style={styles.planEyebrow}>RECHARGING</Text>
              <Text style={styles.planTitle}>{manageQuery.data.subscription.meal_plan_type?.name || 'Meal plan'}</Text>
              <Text style={styles.planBody}>
                {manageQuery.data.subscription.deliveries_left ?? 0} deliveries left · current end date {manageQuery.data.subscription.end_date || '—'}
              </Text>
            </View>

            <Text style={styles.sectionTitle}>Choose a period</Text>
            <View style={styles.periodList}>
              {(quote?.period_options ?? []).map((option) => {
                const selected = selectedPeriodId === option.id;
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[styles.periodCard, selected && styles.periodCardSelected]}
                    onPress={() => setPeriodId(option.id)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.periodName}>{option.name}</Text>
                      <Text style={styles.periodMeta}>
                        {option.additional_deliveries ?? option.days} additional deliveries
                      </Text>
                    </View>
                    <Text style={styles.periodPrice}>
                      ₹{Number(option.checkout_total ?? option.price).toFixed(0)}
                    </Text>
                    <Ionicons
                      name={selected ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={selected ? colors.primary : colors.text.disabled}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.sectionTitle}>Coupon</Text>
            <View style={styles.couponRow}>
              <TextInput
                style={styles.couponInput}
                value={couponDraft}
                onChangeText={setCouponDraft}
                autoCapitalize="characters"
                placeholder="Enter code"
                placeholderTextColor={colors.text.placeholder}
              />
              <TouchableOpacity style={styles.applyButton} onPress={applyCoupon}>
                <Text style={styles.applyText}>{appliedCoupon ? 'Update' : 'Apply'}</Text>
              </TouchableOpacity>
            </View>
            {appliedCoupon ? (
              <TouchableOpacity
                onPress={() => {
                  setCouponDraft('');
                  setAppliedCoupon('');
                }}
              >
                <Text style={styles.removeCoupon}>Remove {appliedCoupon}</Text>
              </TouchableOpacity>
            ) : null}

            {quoteQuery.isFetching ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
            ) : quote ? (
              <View style={styles.summaryCard}>
                <SummaryRow label="Recharge subtotal" value={formatMoney(quote.subtotal)} />
                {quote.discount > 0 ? <SummaryRow label="Discount" value={`−${formatMoney(quote.discount)}`} accent /> : null}
                <View style={styles.divider} />
                <SummaryRow label="Payable now" value={formatMoney(quote.payable_total)} strong />
                {quote.continuation_start_date ? (
                  <Text style={styles.continuationText}>New deliveries continue from {quote.continuation_start_date}.</Text>
                ) : null}
                {!quote.can_checkout ? (
                  <Text style={styles.errorText}>{quote.error_message || quote.error || 'Recharge is unavailable.'}</Text>
                ) : null}
              </View>
            ) : quoteQuery.isError ? (
              <View style={styles.errorCard}>
                <Text style={styles.errorText}>Could not calculate this recharge. Check the period or coupon and try again.</Text>
                <TouchableOpacity onPress={() => quoteQuery.refetch()}>
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      {isAuthenticated && validId && manageQuery.data?.subscription.is_active ? (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.md }]}>
          <TouchableOpacity
            style={[styles.payButton, !canPay && styles.payButtonDisabled]}
            disabled={!canPay}
            onPress={handlePayment}
          >
            {paying ? (
              <ActivityIndicator color={colors.text.inverse} />
            ) : (
              <Text style={styles.payButtonText}>
                {quote?.zero_rupee_checkout ? 'Complete recharge' : `Pay ${formatMoney(quote?.payable_total ?? 0)}`}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

function SummaryRow({ label, value, accent, strong }: { label: string; value: string; accent?: boolean; strong?: boolean }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, strong && styles.summaryStrong]}>{label}</Text>
      <Text style={[styles.summaryValue, accent && { color: colors.primary }, strong && styles.summaryStrong]}>{value}</Text>
    </View>
  );
}

function EmptyState({ title, action, onPress }: { title: string; action: string; onPress: () => void }) {
  return (
    <View style={styles.empty}>
      <Ionicons name="alert-circle-outline" size={38} color={colors.text.muted} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <TouchableOpacity style={styles.applyButton} onPress={onPress}>
        <Text style={styles.applyText}>{action}</Text>
      </TouchableOpacity>
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
  planCard: { backgroundColor: colors.primaryDark, borderRadius: borderRadius.xl, padding: spacing.xl },
  planEyebrow: { ...typography.body.sm, color: '#D5E8D2', letterSpacing: 1, fontWeight: '700' },
  planTitle: { ...typography.heading.xl, color: colors.text.inverse, marginTop: spacing.sm },
  planBody: { ...typography.body.md, color: '#D5E8D2', marginTop: spacing.sm },
  sectionTitle: { ...typography.heading.md, color: colors.text.primary, marginTop: spacing.xxl, marginBottom: spacing.md },
  periodList: { gap: spacing.sm },
  periodCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  periodCardSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  periodName: { ...typography.body.lg, color: colors.text.primary, fontWeight: '700' },
  periodMeta: { ...typography.body.sm, color: colors.text.secondary, marginTop: spacing.xs },
  periodPrice: { ...typography.body.lg, color: colors.primary, fontWeight: '700' },
  couponRow: { flexDirection: 'row', gap: spacing.sm },
  couponInput: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, color: colors.text.primary, backgroundColor: colors.surface },
  applyButton: { backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  applyText: { ...typography.body.md, color: colors.text.inverse, fontWeight: '700' },
  removeCoupon: { ...typography.body.sm, color: colors.status.error, marginTop: spacing.sm, fontWeight: '600' },
  summaryCard: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, marginTop: spacing.xl, borderWidth: 1, borderColor: colors.border },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, marginBottom: spacing.md },
  summaryLabel: { ...typography.body.md, color: colors.text.secondary },
  summaryValue: { ...typography.body.md, color: colors.text.primary },
  summaryStrong: { fontWeight: '700', color: colors.text.primary },
  divider: { height: 1, backgroundColor: colors.divider, marginBottom: spacing.md },
  continuationText: { ...typography.body.sm, color: colors.text.secondary, marginTop: spacing.sm },
  errorCard: { backgroundColor: colors.status.errorBg, borderRadius: borderRadius.lg, padding: spacing.lg, marginTop: spacing.xl },
  errorText: { ...typography.body.sm, color: colors.status.error, marginTop: spacing.sm },
  retryText: { ...typography.body.md, color: colors.primary, fontWeight: '700', marginTop: spacing.md },
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: spacing.lg, paddingTop: spacing.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  payButton: { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', minHeight: 52, borderRadius: borderRadius.full },
  payButtonDisabled: { opacity: 0.45 },
  payButtonText: { ...typography.body.lg, color: colors.text.inverse, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 72, paddingHorizontal: spacing.xl },
  emptyTitle: { ...typography.heading.md, color: colors.text.primary, marginTop: spacing.lg, marginBottom: spacing.xl, textAlign: 'center' },
});
