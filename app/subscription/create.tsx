import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { colors, spacing, borderRadius, typography } from '../../src/shared/theme';
import Button from '../../src/shared/components/Button';
import { subscriptionApi, type SubscriptionPlan } from '../../src/features/subscription/api/subscription.api';
import { addressesApi } from '../../src/features/addresses/api/addresses.api';
import { useAuthStore } from '../../src/features/auth/store/auth.store';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const INSTRUCTIONS_OPTIONS = ['Hand it to me', 'Leave at door', 'Call when arriving'];

function tomorrowIsoDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function CreateSubscription() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const params = useLocalSearchParams<{ planId?: string }>();
  const planId = params.planId ? Number(params.planId) : undefined;

  const [vegDays, setVegDays] = useState<number[]>([]);
  const [instructions, setInstructions] = useState(INSTRUCTIONS_OPTIONS[0]);
  const [startDate, setStartDate] = useState(tomorrowIsoDate());
  const [phone, setPhone] = useState<string>((user as any)?.phone_number || (user as any)?.username || '');

  const plansQuery = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: subscriptionApi.getPlans,
  });

  const addressesQuery = useQuery({
    queryKey: ['addresses'],
    queryFn: addressesApi.list,
    enabled: isAuthenticated,
  });

  const plan: SubscriptionPlan | undefined = useMemo(
    () => plansQuery.data?.find((p) => p.id === planId),
    [plansQuery.data, planId]
  );

  const defaultAddress = useMemo(() => {
    const list = addressesQuery.data ?? [];
    return list.find((a) => a.is_default) ?? list[0];
  }, [addressesQuery.data]);

  const checkoutMutation = useMutation({
    mutationFn: subscriptionApi.checkout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      Alert.alert(
        'Subscription created',
        'Your subscription is set up. You can manage deliveries from the subscriptions screen.',
        [{ text: 'View subscriptions', onPress: () => router.replace('/subscription' as any) }]
      );
    },
    onError: (e: any) => {
      Alert.alert(
        'Could not start subscription',
        e?.response?.data?.error || e?.message || 'Please try again.'
      );
    },
  });

  const toggleDay = (i: number) => {
    setVegDays((prev) => (prev.includes(i) ? prev.filter((d) => d !== i) : [...prev, i]));
  };

  const handleSubmit = () => {
    if (!plan) {
      Alert.alert('Select a plan', 'Please return to plans and pick one.');
      return;
    }
    if (!isAuthenticated) {
      Alert.alert(
        'Sign in to subscribe',
        'Please sign in to start a subscription.',
        [
          { text: 'Sign in', onPress: () => router.push('/(auth)/login' as any) },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
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
    if (!phone.trim()) {
      Alert.alert('Phone required', 'Enter the number for delivery updates.');
      return;
    }

    // Real creation goes through checkout (subscription_id = plan id + address).
    // Preferences (start date, veg days, instructions) are applied via the manage
    // settings endpoint after the subscription exists — see crossCutting notes.
    checkoutMutation.mutate({
      subscription_id: plan.id,
      address_id: defaultAddress.id,
    });
  };

  const loading = plansQuery.isLoading || addressesQuery.isLoading;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configure Plan</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
        ) : !plan ? (
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
            <View style={styles.planSummary}>
              <Text style={styles.summaryLabel}>Selected Plan</Text>
              <Text style={styles.summaryTitle}>
                {plan.name || plan.meal_plan_type?.name || 'Plan'}
              </Text>
              <Text style={styles.summaryPrice}>₹{Number(plan.price).toFixed(0)}</Text>
            </View>

            {defaultAddress ? (
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
            <Text style={styles.sectionDesc}>Format: YYYY-MM-DD</Text>
            <TextInput
              style={styles.input}
              value={startDate}
              onChangeText={setStartDate}
              placeholder="2026-05-15"
              placeholderTextColor={colors.text.muted}
            />

            <Text style={[styles.sectionTitle, { marginTop: spacing.xxl }]}>Phone</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+91 9876543210"
              placeholderTextColor={colors.text.muted}
              keyboardType="phone-pad"
            />

            <Text style={[styles.sectionTitle, { marginTop: spacing.xxl }]}>Veg-only days</Text>
            <Text style={styles.sectionDesc}>Days when you want only vegetarian meals</Text>
            <View style={styles.daysRow}>
              {DAYS.map((day, i) => (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayChip, vegDays.includes(i) && styles.dayChipActive]}
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

            <Text style={styles.paymentNote}>
              Payment for subscriptions is processed separately — our team will reach out shortly after you subscribe.
            </Text>
          </>
        )}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button
          title={checkoutMutation.isPending ? 'Starting…' : 'Start Subscription'}
          onPress={handleSubmit}
          loading={checkoutMutation.isPending}
          disabled={!plan || checkoutMutation.isPending}
          fullWidth
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
  scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: 140 },

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

  paymentNote: {
    ...typography.body.sm,
    color: colors.text.muted,
    marginTop: spacing.xxl,
    fontStyle: 'italic',
  },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
    paddingHorizontal: spacing.xl, paddingTop: spacing.lg,
  },
});
