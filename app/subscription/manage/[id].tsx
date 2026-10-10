import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
  Switch,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { colors, spacing, borderRadius, typography } from '../../../src/shared/theme';
import { useAuthStore } from '../../../src/features/auth/store/auth.store';
import { DeliveryAddressPicker, type DeliveryAddressTarget } from '../../../src/features/subscription/DeliveryAddressPicker';
import { canChangeDeliveryAddress } from '../../../src/features/subscription/deliveryChanges';
import { SubscriptionDatePicker } from '../../../src/features/subscription/SubscriptionDatePicker';
import { subscriptionDateOptions, validateSubscriptionDateSelection, type SubscriptionDateAction } from '../../../src/features/subscription/pauseDatePolicy';
import {
  subscriptionApi,
  type ManageSubscriptionResponse,
  type SubscriptionSettingsUpdate,
} from '../../../src/features/subscription/api/subscription.api';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function localDatePlus(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

function apiError(error: unknown, fallback: string): string {
  const candidate = error as { response?: { data?: { error?: string; message?: string } }; message?: string };
  return candidate?.response?.data?.error || candidate?.response?.data?.message || candidate?.message || fallback;
}

export default function ManageSubscriptionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const params = useLocalSearchParams<{ id?: string }>();
  const subscriptionId = Number(params.id);
  const validId = Number.isInteger(subscriptionId) && subscriptionId > 0;

  const manageQuery = useQuery({
    queryKey: ['subscriptions', 'manage', subscriptionId],
    queryFn: () => subscriptionApi.getManage(subscriptionId),
    enabled: isAuthenticated && validId,
  });

  const [vegDays, setVegDays] = useState<number[]>([]);
  const [instructions, setInstructions] = useState('Hand it to me');
  const [reminderDays, setReminderDays] = useState(2);
  const [whatsappUpdates, setWhatsappUpdates] = useState(true);
  const [addressTarget, setAddressTarget] = useState<DeliveryAddressTarget | null>(null);
  const [dateAction, setDateAction] = useState<SubscriptionDateAction | null>(null);

  useEffect(() => {
    const settings = manageQuery.data?.settings;
    if (!settings) return;
    setVegDays(settings.veg_days ?? []);
    setInstructions(settings.delivery_instructions || 'Hand it to me');
    setReminderDays(settings.reminder_days_before ?? 2);
    setWhatsappUpdates(settings.whatsapp_updates !== false);
  }, [manageQuery.data?.settings]);

  const applyResponse = (response: ManageSubscriptionResponse) => {
    queryClient.setQueryData(['subscriptions', 'manage', subscriptionId], response);
    queryClient.invalidateQueries({ queryKey: ['subscriptions', 'all'] });
    queryClient.invalidateQueries({ queryKey: ['subscriptions', 'active'] });
    queryClient.invalidateQueries({ queryKey: ['orders'] });
  };

  const settingsMutation = useMutation({
    mutationFn: (body: SubscriptionSettingsUpdate) => subscriptionApi.updateSettings(subscriptionId, body),
    onSuccess: (response) => {
      applyResponse(response);
      Alert.alert('Preferences saved', 'Your subscription settings were updated.');
    },
    onError: (error) => Alert.alert('Could not save preferences', apiError(error, 'Try again later.')),
  });

  const datesMutation = useMutation({
    mutationFn: async ({ action, selected }: { action: SubscriptionDateAction; selected: string[] }) => {
      const session = useAuthStore.getState();
      if (!session.isAuthenticated || !manageQuery.data) throw new Error('Sign in and refresh the subscription first.');
      const dates = validateSubscriptionDateSelection(selected, subscriptionDateOptions(manageQuery.data, action, localDatePlus(0)));
      const response = action === 'pause'
        ? await subscriptionApi.pause(subscriptionId, { pause_dates: dates })
        : await subscriptionApi.resume(subscriptionId, { resume_dates: dates });
      return { response, revision: session.sessionRevision };
    },
    onSuccess: ({ response, revision }) => {
      if (useAuthStore.getState().sessionRevision !== revision) return;
      applyResponse(response);
      setDateAction(null);
    },
    onError: (error) => Alert.alert('Could not update delivery dates', apiError(error, 'Try again later.')),
  });

  const saveSettings = () => {
    settingsMutation.mutate({
      veg_days: vegDays,
      delivery_instructions: instructions.trim() || 'Hand it to me',
      reminder_days_before: reminderDays,
      whatsapp_updates: whatsappUpdates,
    });
  };

  const data = manageQuery.data;
  const subscription = data?.subscription;
  const ended = data?.plan_status === 'ended' || subscription?.is_active === false;
  const busy = settingsMutation.isPending || datesMutation.isPending;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="chevron-back" size={23} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage plan</Text>
        <TouchableOpacity
          style={styles.iconButton}
          disabled={!subscription || ended}
          onPress={() => router.push(`/subscription/recharge/${subscriptionId}` as any)}
        >
          <Ionicons name="wallet-outline" size={22} color={subscription && !ended ? colors.primary : colors.text.disabled} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxxl }]}
        refreshControl={
          validId && isAuthenticated ? (
            <RefreshControl
              refreshing={manageQuery.isFetching && !manageQuery.isLoading}
              onRefresh={() => manageQuery.refetch()}
              tintColor={colors.primary}
            />
          ) : undefined
        }
      >
        {!isAuthenticated ? (
          <EmptyState icon="lock-closed-outline" title="Sign in to manage this plan" action="Sign in" onPress={() => router.push('/(auth)/login' as any)} />
        ) : !validId ? (
          <EmptyState icon="alert-circle-outline" title="Invalid subscription" action="Go back" onPress={() => router.back()} />
        ) : manageQuery.isLoading ? (
          <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 64 }} />
        ) : manageQuery.isError || !subscription ? (
          <EmptyState icon="cloud-offline-outline" title="Could not load this subscription" action="Retry" onPress={() => manageQuery.refetch()} />
        ) : (
          <>
            <View style={styles.heroCard}>
              <View style={styles.heroTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroTitle}>{subscription.meal_plan_type?.name || 'Meal plan'}</Text>
                  <Text style={styles.heroSubtitle}>{subscription.subscription_period?.name || 'Subscription'}</Text>
                </View>
                <Text style={styles.statusText}>{(data.plan_status || 'active').replaceAll('_', ' ')}</Text>
              </View>
              <View style={styles.metrics}>
                <Metric value={String(subscription.deliveries_left ?? '—')} label="Deliveries left" />
                <Metric value={formatDate(subscription.end_date)} label="Plan ends" />
              </View>
              {!ended ? (
                <View style={styles.heroActions}>
                  {subscription.is_on_hold ? (
                    <TouchableOpacity
                      style={styles.primaryAction}
                      disabled={busy}
                      onPress={() => setDateAction('resume')}
                    >
                      <Text style={styles.primaryActionText}>Resume dates</Text>
                    </TouchableOpacity>
                  ) : null}
                    <TouchableOpacity style={styles.outlineAction} disabled={busy} onPress={() => setDateAction('pause')}>
                      <Text style={styles.outlineActionText}>Pause dates</Text>
                    </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.primaryAction}
                    disabled={busy}
                    onPress={() => router.push(`/subscription/recharge/${subscriptionId}` as any)}
                  >
                    <Text style={styles.primaryActionText}>Recharge</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>

            {!ended ? (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Preferences</Text>
                <Text style={styles.sectionLabel}>Vegetarian-only days</Text>
                <View style={styles.daysRow}>
                  {DAYS.map((day, index) => {
                    const selected = vegDays.includes(index);
                    return (
                      <TouchableOpacity
                        key={day}
                        style={[styles.dayChip, selected && styles.dayChipSelected]}
                        onPress={() => setVegDays((current) => selected ? current.filter((value) => value !== index) : [...current, index])}
                      >
                        <Text style={[styles.dayChipText, selected && styles.dayChipTextSelected]}>{day}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.sectionLabel}>Delivery instructions</Text>
                <TextInput
                  style={styles.input}
                  value={instructions}
                  onChangeText={setInstructions}
                  placeholder="Hand it to me"
                  placeholderTextColor={colors.text.placeholder}
                  maxLength={240}
                />

                <Text style={styles.sectionLabel}>Reminder</Text>
                <View style={styles.reminderRow}>
                  {[1, 2, 3].map((days) => (
                    <TouchableOpacity
                      key={days}
                      style={[styles.reminderChip, reminderDays === days && styles.reminderChipSelected]}
                      onPress={() => setReminderDays(days)}
                    >
                      <Text style={[styles.reminderText, reminderDays === days && styles.reminderTextSelected]}>{days} day{days === 1 ? '' : 's'} before</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.switchRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.switchTitle}>WhatsApp updates</Text>
                    <Text style={styles.switchBody}>Delivery and plan reminders</Text>
                  </View>
                  <Switch
                    value={whatsappUpdates}
                    onValueChange={setWhatsappUpdates}
                    trackColor={{ false: colors.border, true: colors.primaryLight }}
                    thumbColor={whatsappUpdates ? colors.primary : colors.text.disabled}
                  />
                </View>

                <TouchableOpacity style={styles.saveButton} disabled={busy} onPress={saveSettings}>
                  <Text style={styles.saveButtonText}>{settingsMutation.isPending ? 'Saving…' : 'Save preferences'}</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Delivery schedule</Text>
              {data.delivery_schedule.length ? (
                data.delivery_schedule.slice(0, 30).map((day) => (
                  <View key={day.date} style={styles.scheduleDay}>
                    <View style={styles.scheduleHeader}>
                      <Text style={styles.scheduleDate}>{formatDate(day.date)}</Text>
                      <Text style={[styles.scheduleState, day.paused && { color: colors.status.warning }]}>
                        {day.paused ? 'Paused' : day.kitchen_closed ? 'Kitchen closed' : (day.delivery_state || 'Scheduled').replaceAll('_', ' ')}
                      </Text>
                    </View>
                    {day.slots.map((slot, index) => (
                      <View key={`${day.date}-${slot.meal_time_id}-${index}`} style={styles.slotRow}>
                        <Ionicons name="time-outline" size={16} color={colors.text.muted} />
                        <Text style={styles.slotText}>
                          {slot.meal_time_name}{slot.meal_item_name ? ` · ${slot.meal_item_name}` : ''}
                          {slot.address_label ? `\n${slot.address_label}` : ''}
                        </Text>
                        {!ended && canChangeDeliveryAddress(day, slot, localDatePlus(0)) ? (
                          <TouchableOpacity disabled={busy} accessibilityLabel={`Change address for ${day.date} ${slot.meal_time_name}`}
                            onPress={() => setAddressTarget({ date: day.date, mealTimeId: slot.meal_time_id, mealTimeName: slot.meal_time_name })}>
                            <Text style={{ color: colors.primary, fontWeight: '600' }}>Address</Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    ))}
                  </View>
                ))
              ) : (
                <Text style={styles.emptySchedule}>No scheduled deliveries are available yet.</Text>
              )}
            </View>
          </>
        )}
      </ScrollView>
      {addressTarget && isAuthenticated ? <DeliveryAddressPicker subscriptionId={subscriptionId} target={addressTarget} onClose={() => setAddressTarget(null)} /> : null}
      {dateAction && isAuthenticated && data ? <SubscriptionDatePicker key={`${subscriptionId}-${dateAction}`} action={dateAction}
        dates={subscriptionDateOptions(data, dateAction, localDatePlus(0))} busy={busy}
        onSubmit={(selected) => { if (!busy) datesMutation.mutate({ action: dateAction, selected }); }} onClose={() => setDateAction(null)} /> : null}
    </View>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function EmptyState({
  icon,
  title,
  action,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  action: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={38} color={colors.text.muted} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <TouchableOpacity style={styles.saveButton} onPress={onPress}>
        <Text style={styles.saveButtonText}>{action}</Text>
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
  heroCard: { backgroundColor: colors.primaryDark, borderRadius: borderRadius.xl, padding: spacing.xl },
  heroTop: { flexDirection: 'row', gap: spacing.md },
  heroTitle: { ...typography.heading.lg, color: colors.text.inverse },
  heroSubtitle: { ...typography.body.md, color: '#D5E8D2', marginTop: spacing.xs },
  statusText: { ...typography.body.sm, color: colors.text.inverse, textTransform: 'capitalize', fontWeight: '700' },
  metrics: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
  metric: { flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: borderRadius.md, padding: spacing.md },
  metricValue: { ...typography.body.md, color: colors.text.inverse, fontWeight: '700' },
  metricLabel: { ...typography.body.sm, color: '#D5E8D2', marginTop: spacing.xs },
  heroActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  primaryAction: { flex: 1, alignItems: 'center', backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius: borderRadius.full },
  primaryActionText: { ...typography.body.md, color: colors.text.inverse, fontWeight: '700' },
  outlineAction: { flex: 1, alignItems: 'center', borderWidth: 1, borderColor: '#D5E8D2', paddingVertical: spacing.md, borderRadius: borderRadius.full },
  outlineActionText: { ...typography.body.md, color: colors.primary, fontWeight: '700' },
  sectionCard: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, marginTop: spacing.lg, borderWidth: 1, borderColor: colors.border },
  sectionTitle: { ...typography.heading.md, color: colors.text.primary, marginBottom: spacing.lg },
  sectionLabel: { ...typography.body.md, color: colors.text.primary, fontWeight: '600', marginBottom: spacing.sm, marginTop: spacing.md },
  daysRow: { flexDirection: 'row', gap: spacing.xs },
  dayChip: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.border },
  dayChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayChipText: { ...typography.body.sm, color: colors.text.secondary, fontWeight: '600' },
  dayChipTextSelected: { color: colors.text.inverse },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md, color: colors.text.primary, backgroundColor: colors.background },
  reminderRow: { flexDirection: 'row', gap: spacing.sm },
  reminderChip: { flex: 1, alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, paddingVertical: spacing.sm },
  reminderChipSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  reminderText: { ...typography.body.sm, color: colors.text.secondary },
  reminderTextSelected: { color: colors.primary, fontWeight: '700' },
  switchRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xl },
  switchTitle: { ...typography.body.md, color: colors.text.primary, fontWeight: '600' },
  switchBody: { ...typography.body.sm, color: colors.text.secondary, marginTop: spacing.xs },
  saveButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: borderRadius.full, paddingVertical: spacing.md, paddingHorizontal: spacing.xxl, marginTop: spacing.xl },
  saveButtonText: { ...typography.body.md, color: colors.text.inverse, fontWeight: '700' },
  scheduleDay: { paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider },
  scheduleHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  scheduleDate: { ...typography.body.md, color: colors.text.primary, fontWeight: '700' },
  scheduleState: { ...typography.body.sm, color: colors.text.secondary, textTransform: 'capitalize' },
  slotRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  slotText: { ...typography.body.sm, color: colors.text.secondary, flex: 1 },
  emptySchedule: { ...typography.body.md, color: colors.text.secondary },
  empty: { alignItems: 'center', paddingTop: 72, paddingHorizontal: spacing.xl },
  emptyTitle: { ...typography.heading.md, color: colors.text.primary, marginTop: spacing.lg, textAlign: 'center' },
});
