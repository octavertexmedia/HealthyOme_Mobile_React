import React, { useCallback, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, findNodeHandle, View, Text, ActivityIndicator, ScrollView, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
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
import { subscriptionSafety } from './safetyCopy';

export const inlinePlanActions = (width: number, fontScale: number) => width >= 360 && fontScale <= 1.2;
export default function SubscriptionPlanDetails({ menuInitiallyOpen = false, onMenuDismiss }: { menuInitiallyOpen?: boolean; onMenuDismiss?: () => void } = {}) {
  const router = useRouter();
  const { width, fontScale } = useWindowDimensions();
  const inlineActions = inlinePlanActions(width, fontScale);
  const { slug, planId, categoryId, mealTimeId, date } = useLocalSearchParams<{ slug: string; planId?: string; categoryId?: string; mealTimeId?: string; date?: string }>();
  const [menuOpen, setMenuOpen] = useState(menuInitiallyOpen);
  const [safetyOpen, setSafetyOpen] = useState(false);
  const menuTrigger = useRef<React.ComponentRef<typeof TouchableOpacity>>(null);
  const restoreMenuFocus = useCallback(() => { const node = findNodeHandle(menuTrigger.current); if (node) AccessibilityInfo.setAccessibilityFocus(node); }, []);
  const closeMenu = useCallback(() => { setMenuOpen(false); onMenuDismiss?.(); }, [onMenuDismiss]);
  const authenticated = useAuthStore((state) => state.isAuthenticated);
  const query = useQuery({ queryKey: ['subscription-overview', slug], queryFn: () => subscriptionApi.getOverview(slug), enabled: Boolean(slug), retry: false });
  const data = query.data;
  const planType = data?.meal_plan_type;
  const description = planType?.description?.trim();
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
          <View style={styles.row}><Text style={[styles.title, { flex: 1 }]}>{planType?.name}</Text>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Safety Info" accessibilityState={{ expanded: safetyOpen }} style={styles.safetyLink} onPress={() => setSafetyOpen((open) => !open)}>
              <Text style={styles.linkText}>Safety Info</Text><Ionicons name={safetyOpen ? 'chevron-up' : 'chevron-down'} size={16} color="#34732D" />
            </TouchableOpacity>
          </View>
          {!!description && description.toLowerCase() !== planType?.name.toLowerCase() && <Text style={styles.body}>{description}</Text>}
          {(data.stats?.avg_rating != null || !!data.stats?.subscriber_count) && <View style={styles.metadata}>
            {data.stats?.avg_rating != null && <Text style={styles.body}>Rating: {data.stats.avg_rating}</Text>}
            {!!data.stats?.subscriber_count && <Text style={styles.body}>{data.stats.subscriber_count} subscribers</Text>}
          </View>}
          {safetyOpen && <View testID="general-safety-information" style={styles.safetyContent}>
            <Text style={styles.sectionTitle}>General safety information</Text>
            <Text style={styles.body}>{subscriptionSafety.summary}</Text>
            {subscriptionSafety.bullets.map((bullet) => <Text key={bullet} style={styles.body}>• {bullet}</Text>)}
            <Text style={styles.body}>This plan overview does not provide item-specific allergen information. Contact support about ingredients or allergens before ordering.</Text>
            <View style={styles.metadata}>
              <TouchableOpacity accessibilityRole="link" style={styles.safetyLink} onPress={() => router.push('/profile-pages/faqs')}><Text style={styles.linkText}>Read all FAQs</Text></TouchableOpacity>
              <TouchableOpacity accessibilityRole="link" style={styles.safetyLink} onPress={() => router.push('/profile-pages/support')}><Text style={styles.linkText}>Contact support</Text></TouchableOpacity>
            </View>
          </View>}
        </View>
        {planType?.show_available_menu !== false && <TouchableOpacity ref={menuTrigger} accessibilityRole="button" accessibilityLabel="View day-wise menu schedule" accessibilityHint="Opens a dismissible menu sheet" style={styles.section}
          onPress={() => setMenuOpen(true)}>
          <View style={styles.row}><Text style={[styles.sectionTitle, { flex: 1 }]}>Available menu</Text><Text style={styles.body}>{data.meal_times[0]?.name}</Text><Ionicons name="chevron-forward" size={18} color="#6B7280" /></View>
          {schedule.isLoading ? <Text style={styles.body}>Loading published dates…</Text> : schedule.isError ? <Text style={styles.body}>Could not load the dated menu. Open to retry.</Text> : preview.length ? preview.map((day) => <View key={day.date} style={styles.previewRow}>
            <Text accessibilityLabel={formatMenuDate(day.date)} style={styles.previewDate}>{formatMenuDate(day.date).replace(/,?\s+\d{4}$/, '')}</Text>
            <View style={styles.previewMeals}>{day.meals.map((meal, index) => <Text key={`${meal.id}-${index}`} style={styles.body} numberOfLines={2}>{meal.name.trim()}</Text>)}</View>
          </View>) : <Text style={styles.body}>No published menu for the selected category and slot.</Text>}
          <Text style={styles.linkText}>View full menu · India time</Text>
        </TouchableOpacity>}
        {!!planType?.marketing_features?.length && <View style={styles.section}><Text style={styles.sectionTitle}>About Service</Text>{planType.marketing_features.map((feature) => <Text key={feature} style={styles.body}>• {feature}</Text>)}</View>}
        <View style={styles.section}><Text style={styles.sectionTitle}>Order timings</Text>
          <View style={styles.timings}>{data.meal_times.map((time) => <View key={time.id} style={styles.time}><Text style={styles.sectionTitle}>{time.name}</Text><Text style={styles.body}>{time.delivery_window || 'Not configured'}</Text></View>)}</View>
        </View>
        <View style={styles.section}><Text style={styles.sectionTitle}>Plans and prices</Text>
          {data.plans.filter((plan) => plan.is_active).map((plan) => <TouchableOpacity key={plan.id} accessibilityRole="button" style={[styles.row, styles.priceRow]}
            onPress={() => router.push({ pathname: '/subscription/create', params: { plan: slug, planId: String(plan.id) } })}>
            <Text style={[styles.body, { flex: 1 }]}>{plan.subscription_period.name}{plan.category ? ` · ${plan.category.name}` : ''}</Text><Text>₹{Number(plan.price).toLocaleString('en-IN')}</Text>
          </TouchableOpacity>)}
          <Text style={styles.caption}>Per meal slot. Final totals are confirmed by the server.</Text>
        </View>
      </>}
    </ScrollView>
    <View style={styles.actions}>
      {data?.can_subscribe === false && <Text accessibilityRole="alert">{data.subscribe_blocker || 'This plan is unavailable.'}</Text>}
      <View testID="plan-actions" style={[styles.actionGroup, inlineActions && styles.inlineActions]}>
        <Button size="sm" style={inlineActions ? styles.actionButton : undefined} textStyle={styles.actionText} title={`Quick subscribe${quick ? ` · ₹${Number(quick.price).toLocaleString('en-IN')}` : ''}`} disabled={blocked} onPress={quickSubscribe} />
        <Button size="sm" style={inlineActions ? styles.actionButton : undefined} textStyle={styles.actionText} title="Customize plan" variant="secondary" disabled={blocked} onPress={customize} />
      </View>
      {quick && <Text style={styles.caption}>{quick.subscription_period.name} · {quick.category?.name} · 1 slot. Confirm date before checkout.</Text>}
    </View>
    </View>
    <PlanMenuSheet visible={menuOpen} onClose={closeMenu} onAfterClose={restoreMenuFocus}
      selection={{ slug, planId: planId ?? (primary ? String(primary.id) : undefined), categoryId: categoryId ?? (primary?.category ? String(primary.category.id) : undefined), mealTimeId: mealTimeId ?? (data?.meal_times[0] ? String(data.meal_times[0].id) : undefined), date }} />
  </View>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' }, scroll: { paddingBottom: 12 },
  section: { paddingHorizontal: 16, paddingVertical: 12, gap: 8, borderBottomWidth: 1, borderColor: '#E5E7EB' }, title: { fontSize: 17, lineHeight: 23, fontWeight: '600', color: '#111827' },
  body: { fontSize: 14, lineHeight: 20, color: '#626D60' }, sectionTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 32 }, priceRow: { minHeight: 44 },
  metadata: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, safetyLink: { minHeight: 44, minWidth: 72, flexDirection: 'row', gap: 4, alignItems: 'center', justifyContent: 'center' }, safetyContent: { gap: 8, padding: 12, borderRadius: 12, backgroundColor: '#F4F8F1' }, linkText: { fontSize: 14, color: '#34732D', fontWeight: '600' },
  previewRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' }, previewDate: { width: 92, fontSize: 14, lineHeight: 20, fontWeight: '600', color: '#183829' }, previewMeals: { flex: 1, gap: 4 },
  timings: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, time: { flexBasis: '46%', flexGrow: 1, gap: 4 },
  caption: { fontSize: 12, color: '#626D60', textAlign: 'center', lineHeight: 16 }, actions: { paddingHorizontal: 12, paddingVertical: 10, gap: 8, borderTopWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#fff' },
  actionGroup: { gap: 8 }, inlineActions: { flexDirection: 'row' }, actionButton: { flex: 1, minHeight: 48, paddingHorizontal: 12 }, actionText: { flexShrink: 1, textAlign: 'center' },
});
