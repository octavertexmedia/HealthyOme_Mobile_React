import React, { useCallback, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, findNodeHandle, View, Text, ActivityIndicator, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { subscriptionApi } from './api/subscription.api';
import { useAuthStore } from '../auth/store/auth.store';
import { defaultBrowsePlan } from './browsePolicy';
import { filterMenuDays, formatMenuDate, menuDateRange, menuQueryKey } from './menuSchedule';
import Button from '../../shared/components/Button';
import { ScreenHeader } from '../../shared/components/ScreenHeader';
import PlanMenuSheet from './PlanMenuSheet';

export default function SubscriptionPlanDetails({ menuInitiallyOpen = false, onMenuDismiss }: { menuInitiallyOpen?: boolean; onMenuDismiss?: () => void } = {}) {
  const router = useRouter();
  const { slug, planId, categoryId, mealTimeId, date } = useLocalSearchParams<{ slug: string; planId?: string; categoryId?: string; mealTimeId?: string; date?: string }>();
  const [menuOpen, setMenuOpen] = useState(menuInitiallyOpen);
  const menuTrigger = useRef<React.ComponentRef<typeof TouchableOpacity>>(null);
  const restoreMenuFocus = useCallback(() => { const node = findNodeHandle(menuTrigger.current); if (node) AccessibilityInfo.setAccessibilityFocus(node); }, []);
  const closeMenu = useCallback(() => { setMenuOpen(false); onMenuDismiss?.(); }, [onMenuDismiss]);
  const authenticated = useAuthStore((state) => state.isAuthenticated);
  const query = useQuery({ queryKey: ['subscription-overview', slug], queryFn: () => subscriptionApi.getOverview(slug), enabled: Boolean(slug), retry: false });
  const data = query.data;
  const planType = data?.meal_plan_type;
  const primary = defaultBrowsePlan(data?.plans ?? []);
  const range = useMemo(() => menuDateRange(), []);
  const schedule = useQuery({ queryKey: menuQueryKey(slug, planType?.id, range), queryFn: () => subscriptionApi.getMenuSchedule(slug, planType!.id, range), enabled: Boolean(planType && planType.show_available_menu !== false), retry: false });
  const preview = filterMenuDays(schedule.data?.days ?? [], { category: primary?.category?.name, mealTime: data?.meal_times[0]?.name }).filter((day) => day.meals.length).slice(0, 2);
  const quick = data?.plans.filter((plan) => plan.is_active && plan.category?.id === primary?.category?.id)
    .sort((a, b) => (a.subscription_period.days ?? 0) - (b.subscription_period.days ?? 0))[0];
  const blocked = !data || query.isError || data.can_subscribe === false;
  const customize = () => router.push({ pathname: '/subscription/create', params: { plan: slug } });
  const quickSubscribe = () => {
    if (!authenticated) { router.push({ pathname: '/(auth)/login', params: { redirect: `/subscription/plans/${slug}` } }); return; }
    if (!quick) { customize(); return; }
    router.push({ pathname: '/subscription/create', params: { plan: slug, planId: String(quick.id), mealTimes: String(data?.meal_times[0]?.id ?? ''), quick: 'true' } });
  };
  return <View style={styles.screen}>
    <View style={styles.screen} accessibilityElementsHidden={menuOpen} importantForAccessibility={menuOpen ? 'no-hide-descendants' : 'auto'}>
    <ScreenHeader title="Subscription Plans" fallback="/subscription/plans" />
    <ScrollView contentContainerStyle={styles.scroll}>
      {query.isLoading ? <ActivityIndicator accessibilityLabel="Loading plan" /> : query.isError || !data ? <View style={styles.section}>
        <Text>Could not load this plan.</Text><Button title="Retry plan" onPress={() => { void query.refetch(); }} />
      </View> : <>
        <View style={styles.section}>
          <Text style={styles.title}>{planType?.name}</Text>
          <Text style={styles.body}>{planType?.description?.trim() && planType.description.toLowerCase() !== planType.name.toLowerCase() ? planType.description : 'Nutritionist-crafted meals delivered fresh.'}</Text>
          <View style={styles.facts}>
            {data.stats?.avg_rating != null && <Text style={styles.fact}>☆ {data.stats.avg_rating}{'\n'}Customer rating</Text>}
            <Text style={styles.fact}>♧{'\n'}{data.meal_times.map((time) => time.name).join(', ')}</Text>
            <Text style={styles.fact}>♡{'\n'}Healthy</Text>
            <TouchableOpacity accessibilityRole="link" onPress={() => router.push('/profile-pages/faqs')}><Text style={styles.fact}>♧{'\n'}Safety info</Text></TouchableOpacity>
            {!!data.stats?.subscriber_count && <Text style={styles.fact}>{data.stats.subscriber_count}{'\n'}Subscribers</Text>}
          </View>
        </View>
        {planType?.show_available_menu !== false && <TouchableOpacity ref={menuTrigger} accessibilityRole="button" accessibilityLabel="View day-wise menu schedule" accessibilityHint="Opens a dismissible menu sheet" style={styles.section}
          onPress={() => setMenuOpen(true)}>
          <View style={styles.row}><Text style={styles.sectionTitle}>Available menu</Text><Ionicons name="chevron-forward" size={18} color="#6B7280" /></View>
          {schedule.isLoading ? <Text style={styles.body}>Loading published dates…</Text> : schedule.isError ? <Text style={styles.body}>Could not load the dated menu. Open to retry.</Text> : preview.length ? preview.map((day) => <View key={day.date} style={{ gap: 4 }}>
            <Text style={styles.sectionTitle}>{formatMenuDate(day.date)}</Text>
            {day.meals.map((meal, index) => <Text key={`${meal.id}-${index}`} style={styles.body}>{meal.meal_time_name || 'Slot not published'}: {meal.name.trim()}</Text>)}
          </View>) : <Text style={styles.body}>No published menu for the selected category and slot.</Text>}
          <Text style={styles.body}>View dates, meal slots and published nutrition · India time</Text>
        </TouchableOpacity>}
        {!!planType?.marketing_features?.length && <View style={styles.section}><Text style={styles.sectionTitle}>About Service</Text>{planType.marketing_features.map((feature) => <Text key={feature} style={styles.body}>• {feature}</Text>)}</View>}
        <View style={styles.section}><Text style={styles.sectionTitle}>Order timings</Text>
          {data.meal_times.map((time) => <View key={time.id} style={styles.row}><Text style={styles.body}>{time.name}</Text><Text>{time.delivery_window || 'Not configured'}</Text></View>)}
        </View>
        <View style={styles.section}><Text style={styles.sectionTitle}>Plans and prices</Text>
          {data.plans.filter((plan) => plan.is_active).map((plan) => <TouchableOpacity key={plan.id} accessibilityRole="button" style={styles.row}
            onPress={() => router.push({ pathname: '/subscription/create', params: { plan: slug, planId: String(plan.id) } })}>
            <Text style={[styles.body, { flex: 1 }]}>{plan.subscription_period.name}{plan.category ? ` · ${plan.category.name}` : ''}</Text><Text>₹{Number(plan.price).toLocaleString('en-IN')}</Text>
          </TouchableOpacity>)}
          <Text style={styles.caption}>Per meal slot. Final totals are confirmed by the server.</Text>
        </View>
      </>}
    </ScrollView>
    <View style={styles.actions}>
      {data?.can_subscribe === false && <Text accessibilityRole="alert">{data.subscribe_blocker || 'This plan is unavailable.'}</Text>}
      <Button title={`Quick subscribe${quick ? ` · ₹${Number(quick.price).toLocaleString('en-IN')}` : ''}`} disabled={blocked} onPress={quickSubscribe} />
      <Button title="Customize plan" variant="secondary" disabled={blocked} onPress={customize} />
      {quick && <Text style={styles.caption}>Quick subscribe uses {quick.subscription_period.name} · {quick.category?.name} · one meal slot. Confirm your date before checkout.</Text>}
    </View>
    </View>
    <PlanMenuSheet visible={menuOpen} onClose={closeMenu} onAfterClose={restoreMenuFocus}
      selection={{ slug, planId: planId ?? (primary ? String(primary.id) : undefined), categoryId: categoryId ?? (primary?.category ? String(primary.category.id) : undefined), mealTimeId: mealTimeId ?? (data?.meal_times[0] ? String(data.meal_times[0].id) : undefined), date }} />
  </View>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' }, heading: { height: 48, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: '#E5E7EB' },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, headingText: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '600' },
  scroll: { paddingBottom: 16 }, section: { padding: 16, gap: 12, borderBottomWidth: 1, borderColor: '#E5E7EB' }, title: { fontSize: 16, fontWeight: '600', color: '#111827' },
  body: { fontSize: 14, lineHeight: 21, color: '#6B7280' }, sectionTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 36 }, facts: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 }, fact: { textAlign: 'center', fontSize: 11, color: '#687281', lineHeight: 20 },
  menuCard: { width: 216, height: 288, alignSelf: 'center', borderRadius: 12, backgroundColor: '#F3F4F6' }, previewRow: { flexDirection: 'row', gap: 12 }, preview: { width: '100%', aspectRatio: 1, borderRadius: 8, backgroundColor: '#F3F4F6' },
  caption: { fontSize: 10, color: '#6B7280', textAlign: 'center', lineHeight: 14 }, actions: { padding: 12, gap: 8, borderTopWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#fff' },
});
