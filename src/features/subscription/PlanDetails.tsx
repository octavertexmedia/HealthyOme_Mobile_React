import React from 'react';
import { View, Text, Image, ActivityIndicator, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { subscriptionApi } from './api/subscription.api';
import { useAuthStore } from '../auth/store/auth.store';
import { defaultBrowsePlan } from './browsePolicy';
import { getImageUrl } from '../../shared/utils/helpers';
import Button from '../../shared/components/Button';
import { ScreenHeader } from '../../shared/components/ScreenHeader';

export default function SubscriptionPlanDetails() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const authenticated = useAuthStore((state) => state.isAuthenticated);
  const query = useQuery({ queryKey: ['subscription-overview', slug], queryFn: () => subscriptionApi.getOverview(slug), enabled: Boolean(slug), retry: false });
  const data = query.data;
  const planType = data?.meal_plan_type;
  const menuCard = getImageUrl(planType?.menu_card_image_url || planType?.menu_card_image);
  const cardView = planType?.available_menu_view === 'card' && Boolean(menuCard);
  const primary = defaultBrowsePlan(data?.plans ?? []);
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
        {planType?.show_available_menu !== false && <TouchableOpacity accessibilityRole="button" accessibilityLabel={cardView ? 'View menu card' : 'View day-wise menu schedule'} style={styles.section}
          onPress={() => router.push({ pathname: '/subscription/menu/[slug]', params: { slug } })}>
          <View style={styles.row}><Text style={styles.sectionTitle}>Available menu</Text><Ionicons name="chevron-forward" size={18} color="#6B7280" /></View>
          {cardView ? <Image accessibilityLabel={`${planType?.name} menu card`} source={{ uri: menuCard }} resizeMode="contain" style={styles.menuCard} /> : <View style={styles.previewRow}>
            {data.available_meals.slice(0, 3).map((meal) => <View key={meal.id} style={{ flex: 1 }}>
              {meal.image ? <Image source={{ uri: getImageUrl(meal.image) }} style={styles.preview} /> : <View style={styles.preview} />}
              <Text numberOfLines={2} style={styles.caption}>{meal.name}</Text>
            </View>)}
            {!data.available_meals.length && <Text style={styles.body}>The upcoming menu is being prepared.</Text>}
          </View>}
          <Text style={styles.body}>Meals change daily and are curated using seasonal ingredients.</Text>
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
