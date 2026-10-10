import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image, Switch,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { colors, spacing, borderRadius, typography } from '../../src/shared/theme';
import Button from '../../src/shared/components/Button';
import { subscriptionApi, type SubscriptionPlan } from '../../src/features/subscription/api/subscription.api';
import { addressesApi } from '../../src/features/addresses/api/addresses.api';
import { useAuthStore } from '../../src/features/auth/store/auth.store';
import { usePayment } from '../../src/features/payments/hooks/usePayment';
import { defaultBrowsePlan, nextSubscriptionStartDate } from '../../src/features/subscription/browsePolicy';
import { subscriptionReturnPath } from '../../src/features/subscription/subscriptionReturnPath';
import { useSubscriptionDraft } from '../../src/features/subscription/subscriptionDraft';
import { StartDateCalendar } from '../../src/features/subscription/StartDateCalendar';
import { getImageUrl } from '../../src/shared/utils/helpers';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const INSTRUCTIONS_OPTIONS = ['Hand it to me', 'Leave at door', 'Call when arriving'];
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function tomorrowIsoDate(): string {
  return nextSubscriptionStartDate();
}

function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

export default function CreateSubscription() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { pay, loading: paying } = usePayment();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const routeParams = useLocalSearchParams<{ planId?: string; plan?: string; startDate?: string; mealTimes?: string; vegDays?: string; instructions?: string; whatsapp?: string }>();
  const [params] = useState(() => {
    const saved = useSubscriptionDraft.getState().draft;
    return saved && saved.plan === routeParams.plan && !routeParams.planId ? { ...routeParams, planId: String(saved.planId || ''), startDate: saved.startDate, mealTimes: saved.mealTimeIds.join(','), vegDays: saved.vegDays.join(','), instructions: saved.instructions, whatsapp: String(saved.whatsappUpdates) } : routeParams;
  });
  const [planId, setPlanId] = useState(params.planId ? Number(params.planId) : undefined);

  const [vegDays, setVegDays] = useState<number[]>(params.vegDays ? params.vegDays.split(',').map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n < 6) : []);
  const [instructions, setInstructions] = useState(INSTRUCTIONS_OPTIONS.includes(params.instructions ?? '') ? params.instructions! : INSTRUCTIONS_OPTIONS[0]);
  const [startDate, setStartDate] = useState(params.startDate && isValidIsoDate(params.startDate) ? params.startDate : tomorrowIsoDate());
  const [mealTimeIds, setMealTimeIds] = useState<number[]>(params.mealTimes ? params.mealTimes.split(',').map(Number).filter((n) => Number.isInteger(n) && n > 0) : []);
  const [whatsappUpdates, setWhatsappUpdates] = useState(params.whatsapp !== 'false');

  const overviewQuery = useQuery({
    queryKey: ['subscription-overview', params.plan],
    queryFn: () => subscriptionApi.getOverview(params.plan!),
    enabled: Boolean(params.plan),
  });

  const plansQuery = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: subscriptionApi.getPlans,
    enabled: !params.plan,
  });

  const addressesQuery = useQuery({
    queryKey: ['addresses'],
    queryFn: addressesApi.list,
    enabled: isAuthenticated,
  });

  const plans = useMemo(() => (params.plan ? overviewQuery.data?.plans : plansQuery.data)?.filter((p) => p.is_active) ?? [], [params.plan, overviewQuery.data, plansQuery.data]);
  const plan: SubscriptionPlan | undefined = useMemo(() =>
    plans.find((p) => p.id === planId) ?? (params.plan && planId === undefined
      ? defaultBrowsePlan(plans)
      : undefined), [plans, planId, params.plan]);
  const variants = Array.from(new Map(plans.filter((p) => p.meal_plan_type.id === plan?.meal_plan_type.id).map((p) => [p.category?.id, p.category])).values()).filter((category) => category !== undefined);
  const durations = plans.filter((p) => p.meal_plan_type.id === plan?.meal_plan_type.id && p.category?.id === plan?.category?.id);
  const returnPath = () => subscriptionReturnPath({ plan: params.plan, planId: plan?.id, startDate, mealTimeIds, vegDays, instructions, whatsappUpdates });
  useEffect(() => {
    if (plan && isValidIsoDate(startDate)) useSubscriptionDraft.getState().save({ title: plan.meal_plan_type.name, plan: params.plan, planId: plan.id, startDate, mealTimeIds, vegDays, instructions, whatsappUpdates });
  }, [plan, params.plan, startDate, mealTimeIds, vegDays, instructions, whatsappUpdates]);

  const mealTimesQuery = useQuery({
    queryKey: ['subscription-meal-times', plan?.meal_plan_type.id],
    queryFn: () => subscriptionApi.getMealTimes(plan!.meal_plan_type.id),
    enabled: Boolean(plan?.meal_plan_type.id),
  });

  const availableMealTimes = useMemo(() => {
    const allowed = plan?.meal_plan_type.allowed_meal_time_ids;
    return (mealTimesQuery.data?.meal_times ?? []).filter((mealTime) => {
      if (mealTime.is_active === false || mealTime.available_for_subscription === false) return false;
      return !allowed?.length || allowed.includes(mealTime.id);
    });
  }, [mealTimesQuery.data, plan]);

  const maxMealTimes =
    mealTimesQuery.data?.max_meal_times_selectable ??
    plan?.meal_plan_type.max_meal_times_selectable ??
    availableMealTimes.length;

  useEffect(() => {
    if (!availableMealTimes.length) {
      setMealTimeIds([]);
      return;
    }
    const allowedCount = maxMealTimes > 0 ? maxMealTimes : availableMealTimes.length;
    const availableIds = new Set(availableMealTimes.map((mealTime) => mealTime.id));
    setMealTimeIds((current) => {
      const retained = current.filter((id) => availableIds.has(id)).slice(0, allowedCount);
      return retained.length || params.mealTimes === '' ? retained : availableMealTimes.slice(0, allowedCount).map((mealTime) => mealTime.id);
    });
  }, [availableMealTimes, maxMealTimes, params.mealTimes]);

  const defaultAddress = useMemo(() => {
    const list = addressesQuery.data ?? [];
    return list.find((a) => a.is_default) ?? list[0];
  }, [addressesQuery.data]);

  const toggleDay = (i: number) => {
    setVegDays((prev) => (prev.includes(i) ? prev.filter((d) => d !== i) : [...prev, i]));
  };

  const toggleMealTime = (id: number) => {
    setMealTimeIds((current) => {
      if (current.includes(id)) return current.filter((mealTimeId) => mealTimeId !== id);
      if (maxMealTimes > 0 && current.length >= maxMealTimes) {
        Alert.alert('Meal slot limit', `This plan allows up to ${maxMealTimes} meal slots.`);
        return current;
      }
      return [...current, id];
    });
  };

  const handleSubmit = async () => {
    if (!plan) {
      Alert.alert('Select a plan', 'Please return to plans and pick one.');
      return;
    }
    if (!isAuthenticated) {
      router.push({ pathname: '/(auth)/login', params: { redirect: returnPath() } });
      return;
    }
    if (!defaultAddress) {
      Alert.alert(
        'Add a delivery address',
        'Save an address before subscribing.',
        [
          { text: 'Add address', onPress: () => router.push('/profile-pages/addresses' as any) },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }
    if (overviewQuery.data?.can_subscribe === false) {
      Alert.alert('Plan unavailable', overviewQuery.data.subscribe_blocker || 'This plan cannot be purchased right now.');
      return;
    }
    if (!isValidIsoDate(startDate)) {
      Alert.alert('Invalid start date', 'Enter the start date in YYYY-MM-DD format.');
      return;
    }
    if (startDate < tomorrowIsoDate()) {
      Alert.alert('Invalid start date', 'Choose tomorrow or a later date.');
      return;
    }
    if (new Date(`${startDate}T12:00:00`).getDay() === 0) {
      Alert.alert('Kitchen closed', 'Please choose a start date other than Sunday.');
      return;
    }
    if (!mealTimeIds.length) {
      Alert.alert('Choose a meal slot', 'Select at least one delivery meal slot.');
      return;
    }
    const email = user?.email?.trim();
    if (!email || !email.includes('@')) {
      Alert.alert('Email required', 'Add a valid email to your profile before paying.');
      return;
    }

    const result = await pay({
      kind: 'subscription',
      order: {
        currency: 'INR',
        address_id: defaultAddress.id,
        email,
        notes: { source: 'mobile_app', subscription_plan_id: plan.id },
        subscription: {
          meal_plan_type_id: plan.meal_plan_type.id,
          subscription_period_id: plan.subscription_period.id,
          category_id: plan.category?.id ?? null,
          meal_time_ids: mealTimeIds,
          start_date: startDate,
          veg_days: vegDays,
          reminder_days_before: 2,
          delivery_instructions: instructions,
          whatsapp_updates: whatsappUpdates,
        },
      },
      fulfillment: {
        address_id: defaultAddress.id,
        delivery_date: startDate,
        delivery_instructions: instructions,
        whatsapp_updates: whatsappUpdates,
        reminder_days_before: 2,
        email,
      },
    });

    if (result.status === 'cancelled') return;
    if (result.status === 'failed') {
      Alert.alert('Could not start subscription', paymentErrorMessage(result.error));
      return;
    }

    useSubscriptionDraft.getState().clear();
    await queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    Alert.alert(
      'Subscription created',
      'Payment was confirmed and your subscription is ready to manage.',
      [{ text: 'View subscriptions', onPress: () => router.replace('/subscription/my' as any) }]
    );
  };

  const loading = (params.plan ? overviewQuery.isLoading : plansQuery.isLoading) || addressesQuery.isLoading;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity accessibilityLabel="Go back" onPress={() => router.canGoBack() ? router.back() : router.replace('/subscription/plans')}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customize plan</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
        ) : overviewQuery.isError || plansQuery.isError ? <View style={{ padding: 24 }}><Text>Could not load plan options.</Text><Button title="Retry plan options" onPress={() => { void (params.plan ? overviewQuery.refetch() : plansQuery.refetch()); }} /></View> : !plan ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <Text style={styles.sectionDesc}>Plan not found. Pick one from the plans list.</Text>
            <TouchableOpacity
              style={{ marginTop: 16 }}
              onPress={() => router.replace('/subscription/plans' as any)}
            >
              <Text style={{ color: colors.primary, fontWeight: '600' }}>Browse plans</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {!!(plan.meal_plan_type.image_url || plan.meal_plan_type.image) && <Image source={{ uri: getImageUrl(plan.meal_plan_type.image_url || plan.meal_plan_type.image) }} style={{ width: '100%', height: 145, borderRadius: 16, marginBottom: 20 }} />}
            {variants.length > 1 && <Text style={styles.sectionTitle}>Diet preference</Text>}
            {variants.length > 1 && variants.map((category) => <TouchableOpacity key={category.id} accessibilityRole="radio" accessibilityState={{ checked: category.id === plan.category?.id }}
              style={[styles.optionRow, category.id === plan.category?.id && styles.optionRowActive]}
              onPress={() => setPlanId((plans.find((p) => p.meal_plan_type.id === plan.meal_plan_type.id && p.category?.id === category.id && p.subscription_period.id === plan.subscription_period.id)
                ?? plans.find((p) => p.meal_plan_type.id === plan.meal_plan_type.id && p.category?.id === category.id))?.id)}>
              <Text style={styles.optionText}>{category.name}</Text>
            </TouchableOpacity>)}
            <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Plan duration</Text>
            {durations.map((option) => <TouchableOpacity key={option.id} accessibilityRole="radio" accessibilityState={{ checked: option.id === plan.id }}
              style={[styles.optionRow, option.id === plan.id && styles.optionRowActive]} onPress={() => setPlanId(option.id)}>
              <Ionicons name={option.id === plan.id ? 'radio-button-on' : 'radio-button-off'} size={20} color={option.id === plan.id ? colors.primary : '#CBD5E1'} />
              <View style={{ gap: 5 }}><Text style={styles.optionText}>{option.subscription_period.name}</Text><Text style={{ fontWeight: '600' }}>₹{Number(option.price).toLocaleString('en-IN')}</Text></View>
            </TouchableOpacity>)}

            {!isAuthenticated ? <Text style={styles.sectionDesc}>Delivery address is added after sign-in at Checkout.</Text> : defaultAddress ? (
              <View style={styles.addressCard}>
                <Ionicons name="location-outline" size={20} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.addressLabel}>{defaultAddress.label || 'Delivery address'}</Text>
                  <Text style={styles.addressText} numberOfLines={2}>{defaultAddress.address}</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/profile-pages/addresses' as any)}>
                  <Text style={styles.changeText}>Change</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addAddressCard}
                onPress={() => router.push('/profile-pages/addresses' as any)}
              >
                <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                <Text style={[styles.addressLabel, { color: colors.primary }]}>Add a delivery address</Text>
              </TouchableOpacity>
            )}

            <Text style={[styles.sectionTitle, { marginTop: spacing.xxl }]}>Start date</Text>
            <StartDateCalendar value={startDate} minimum={tomorrowIsoDate()} onChange={setStartDate} />

            <Text style={[styles.sectionTitle, { marginTop: spacing.xxl }]}>Meal slots</Text>
            <Text style={styles.sectionDesc}>
              Select at least one{maxMealTimes > 0 ? ` (up to ${maxMealTimes})` : ''}. The price is per selected slot.
            </Text>
            {mealTimesQuery.isError ? <Button title="Retry meal slots" onPress={() => { void mealTimesQuery.refetch(); }} /> : mealTimesQuery.isLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : availableMealTimes.length ? (
              availableMealTimes.map((mealTime) => {
                const selected = mealTimeIds.includes(mealTime.id);
                return (
                  <TouchableOpacity
                    key={mealTime.id}
                    style={[styles.optionRow, selected && styles.optionRowActive]}
                    onPress={() => toggleMealTime(mealTime.id)}
                  >
                    <Ionicons
                      name={selected ? 'checkbox' : 'square-outline'}
                      size={20}
                      color={selected ? colors.primary : colors.text.disabled}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.optionText}>{mealTime.name}</Text>
                      {mealTime.delivery_window ? (
                        <Text style={styles.mealTimeWindow}>{mealTime.delivery_window}</Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <Text style={styles.errorText}>No subscription meal slots are available for this plan.</Text>
            )}

            <Text style={[styles.sectionTitle, { marginTop: spacing.xxl }]}>Veg-only days</Text>
            <Text style={styles.sectionDesc}>Days when you want only vegetarian meals</Text>
            <View style={styles.daysRow}>
              {DAYS.map((day, i) => (
                <TouchableOpacity
                  key={day}
                  disabled={i === 6}
                  accessibilityState={{ disabled: i === 6 }}
                  style={[styles.dayChip, vegDays.includes(i) && styles.dayChipActive, i === 6 && { opacity: 0.4 }]}
                  onPress={() => toggleDay(i)}
                >
                  <Text style={[styles.dayText, vegDays.includes(i) && styles.dayTextActive]}>{day}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.sectionTitle, { marginTop: spacing.xxl }]}>Delivery instructions</Text>
            {INSTRUCTIONS_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.optionRow, instructions === opt && styles.optionRowActive]}
                onPress={() => setInstructions(opt)}
              >
                <Ionicons
                  name={instructions === opt ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={instructions === opt ? colors.primary : colors.text.disabled}
                />
                <Text style={styles.optionText}>{opt}</Text>
              </TouchableOpacity>
            ))}

            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.optionText}>WhatsApp updates</Text>
                <Text style={styles.mealTimeWindow}>Receive delivery and plan reminders</Text>
              </View>
              <Switch
                value={whatsappUpdates}
                onValueChange={setWhatsappUpdates}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={whatsappUpdates ? colors.primary : colors.text.disabled}
              />
            </View>

            <Text style={styles.paymentNote}>
              Final availability, delivery charges and total are confirmed by the server at checkout. Payment must be verified before the subscription is activated.
            </Text>
          </>
        )}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={{ flex: 1, gap: 4 }}><Text style={{ color: '#fff', fontSize: 12 }}>Plan: {plan?.meal_plan_type.name} | {plan?.subscription_period.name}</Text>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 18 }}>{plan ? `₹${Number(plan.price) * mealTimeIds.length} estimated total` : '—'}</Text></View>
        <Button
          title={paying ? 'Opening payment…' : 'Checkout'}
          onPress={handleSubmit}
          loading={paying}
          disabled={!plan || paying || mealTimesQuery.isLoading || !mealTimeIds.length || overviewQuery.data?.can_subscribe === false}
          style={{ backgroundColor: '#F4FAF0', minWidth: 112 }}
          textStyle={{ color: colors.primary }}
          size="lg"
        />
      </View>
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
  scrollContent: { paddingHorizontal: 16, paddingBottom: 28, paddingTop: 16 },

  planSummary: {
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  summaryLabel: { ...typography.body.sm, color: colors.text.muted, marginBottom: 4 },
  summaryTitle: { ...typography.heading.md, color: colors.text.primary },
  summaryPrice: { ...typography.heading.md, color: colors.primary, marginTop: 4 },

  addressCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addAddressCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed' as const,
  },
  addressLabel: { ...typography.body.md, color: colors.text.primary, fontWeight: '600' },
  addressText: { ...typography.body.sm, color: colors.text.secondary, marginTop: 2 },
  changeText: { ...typography.body.sm, color: colors.primary, fontWeight: '600' },

  sectionTitle: { ...typography.heading.md, color: colors.text.primary, marginBottom: spacing.xs },
  sectionDesc: { ...typography.body.md, color: colors.text.secondary, marginBottom: spacing.lg },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 15,
    color: colors.text.primary,
  },

  daysRow: { flexDirection: 'row', gap: spacing.sm },
  dayChip: {
    flex: 1, paddingVertical: spacing.md, alignItems: 'center', borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  dayChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayText: { ...typography.body.sm, color: colors.text.secondary, fontWeight: '600' },
  dayTextActive: { color: '#fff' },

  optionRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.lg, paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface, borderRadius: borderRadius.lg,
    marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  optionRowActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  optionText: { ...typography.body.lg, color: colors.text.primary },
  mealTimeWindow: { ...typography.body.sm, color: colors.text.secondary, marginTop: 2 },
  errorText: { ...typography.body.md, color: colors.status.error, marginBottom: spacing.lg },
  switchRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.lg, paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface, borderRadius: borderRadius.lg,
    marginTop: spacing.md, borderWidth: 1, borderColor: colors.border,
  },

  paymentNote: {
    ...typography.body.sm,
    color: colors.text.muted,
    marginTop: spacing.xxl,
    fontStyle: 'italic',
  },

  bottomBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#4B8E3D', borderTopWidth: 1, borderTopColor: colors.border,
    paddingHorizontal: spacing.xl, paddingTop: spacing.lg,
  },
});

function paymentErrorMessage(error: string): string {
  const messages: Record<string, string> = {
    payment_sdk_missing: 'Payments require a HealthyOme development or store build, not Expo Go.',
    payments_disabled: 'Online payments are temporarily unavailable.',
    subscription_invalid: 'This subscription configuration is no longer available. Refresh and try again.',
    subscription_plan_not_found: 'This subscription plan is no longer available.',
    meal_times_required: 'Select at least one meal slot.',
    invalid_meal_time_ids: 'One of the selected meal slots is no longer available.',
    too_many_meal_times: 'Too many meal slots were selected for this plan.',
    kitchen_closed_start_date: 'Choose another start date because the kitchen is closed on that day.',
    delivery_area_unavailable: 'The selected address is outside the current delivery area.',
    amount_mismatch: 'The plan price changed. Refresh and try again.',
  };
  return messages[error] ?? error.replaceAll('_', ' ');
}
