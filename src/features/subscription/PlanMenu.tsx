import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { subscriptionApi } from './api/subscription.api';
import { BrowseScreen, browseStyles } from './BrowseScreen';
import { defaultBrowsePlan } from './browsePolicy';
import { filterMenuDays, formatMenuDate, menuDateRange, menuDates, menuDiet, menuNutrition, menuQueryKey } from './menuSchedule';
import { getImageUrl } from '../../shared/utils/helpers';
import Button from '../../shared/components/Button';

function Choice({ title, selected, onPress }: { title: string; selected: boolean; onPress: () => void }) {
  return <TouchableOpacity accessibilityRole="radio" accessibilityLabel={title} accessibilityState={{ selected }} onPress={onPress} style={[styles.choice, selected && styles.choiceSelected]}>
    <Text style={{ color: selected ? '#245E23' : '#4B5563', fontWeight: selected ? '700' : '400' }}>{title}</Text>
  </TouchableOpacity>;
}
export default function PlanMenu() {
  const params = useLocalSearchParams<{ slug: string; planId?: string; categoryId?: string; mealTimeId?: string; date?: string }>();
  const slug = params.slug;
  const range = useMemo(() => menuDateRange(), []);
  const [selection, setSelection] = useState<{ slug: string; categoryId?: string; mealTimeId?: string; date?: string }>({ slug });
  const selected = selection.slug === slug ? selection : { slug };
  const choose = (patch: Partial<typeof selection>) => setSelection({ ...selected, ...patch, slug });
  const overview = useQuery({ queryKey: ['subscription-overview', slug], queryFn: () => subscriptionApi.getOverview(slug), enabled: Boolean(slug), retry: false });
  const data = overview.data;
  const plan = data?.meal_plan_type;
  const row = params.planId ? data?.plans.find((item) => String(item.id) === params.planId && item.is_active) : defaultBrowsePlan(data?.plans ?? []);
  const categories = Array.from(new Map((data?.plans ?? []).flatMap((item) => item.is_active && item.category ? [[item.category.id, item.category] as const] : [])).values());
  const categoryId = selected.categoryId ?? params.categoryId ?? (row?.category ? String(row.category.id) : '');
  const category = categories.find((item) => String(item.id) === categoryId);
  const mealTimeId = selected.mealTimeId ?? params.mealTimeId ?? (data?.meal_times[0] ? String(data.meal_times[0].id) : '');
  const mealTime = data?.meal_times.find((item) => String(item.id) === mealTimeId);
  const date = selected.date ?? params.date ?? '';
  const invalidSelection = Boolean((params.planId && !row) || (categoryId && !category) || (mealTimeId && !mealTime));
  const schedule = useQuery({ queryKey: menuQueryKey(slug, plan?.id, range), queryFn: () => subscriptionApi.getMenuSchedule(slug, plan!.id, range), enabled: Boolean(plan && !invalidSelection), retry: false });
  const days = filterMenuDays(schedule.data?.days ?? [], { category: category?.name, mealTime: mealTime?.name, date });
  const loading = overview.isLoading || (!invalidSelection && schedule.isLoading);
  return <BrowseScreen title="Day-wise menu" fallback={{ pathname: '/subscription/plans/[slug]', params: { slug } }}>
    <Text style={browseStyles.title}>{plan?.name || 'Published menu'}</Text>
    <Text style={browseStyles.body}>Kitchen-published dates · India time (Asia/Kolkata). Missing dates are not a delivery promise.</Text>
    {loading ? <ActivityIndicator accessibilityLabel="Loading dated menu" /> : overview.isError || schedule.isError ? <View style={styles.day}>
      <Text accessibilityRole="alert">Could not load the dated menu.</Text><Button title="Retry menu" onPress={() => { void (overview.isError ? overview.refetch() : schedule.refetch()); }} />
    </View> : invalidSelection ? <Text accessibilityRole="alert">This selection does not belong to this plan. Go back and choose the plan again.</Text> : <>
      {!!categories.length && <View style={styles.filter}><Text style={styles.label}>Category</Text><View style={styles.choices}>{categories.map((item) => <Choice key={item.id} title={item.name} selected={item.id === category?.id} onPress={() => choose({ categoryId: String(item.id) })} />)}</View></View>}
      {!!data?.meal_times.length && <View style={styles.filter}><Text style={styles.label}>Meal slot</Text><View style={styles.choices}>{data.meal_times.map((item) => <Choice key={item.id} title={item.name} selected={item.id === mealTime?.id} onPress={() => choose({ mealTimeId: String(item.id) })} />)}</View></View>}
      <Text style={styles.label}>Date</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateChoices}>
        <Choice title="All published dates" selected={!date} onPress={() => choose({ date: '' })} />
        {menuDates(range).map((day) => <Choice key={day} title={formatMenuDate(day)} selected={date === day} onPress={() => choose({ date: day })} />)}
      </ScrollView>
      {category && !menuDiet(category.name) ? <Text accessibilityRole="alert">Dietary matching is not published for this category.</Text> : !days.some((day) => day.meals.length) ?
        <Text accessibilityRole="alert">No published menu{date ? ` for ${formatMenuDate(date)}` : ' in this date range'} for the selected category and meal slot.</Text> : null}
      {days.map((day) => <View key={day.date} style={styles.day}>
        <Text accessibilityRole="header" style={styles.date}>{formatMenuDate(day.date)}</Text>
        {!day.meals.length && <Text style={browseStyles.body}>No published meal for the selected category and slot.</Text>}
        {day.meals.map((meal, index) => <View key={`${meal.id}-${meal.meal_time_name}-${index}`} style={styles.meal}>
          <Text style={styles.slot}>{meal.meal_time_name || 'Meal slot not published'} · {meal.dietary_type || 'Diet not published'}</Text>
          {!!meal.image && <Image accessibilityLabel={meal.name} source={{ uri: getImageUrl(meal.image) }} style={styles.image} />}
          <Text style={styles.name}>{meal.name.trim()}</Text><Text style={browseStyles.body}>{menuNutrition(meal)}</Text>
        </View>)}
      </View>)}
      <Text style={browseStyles.body}>Only kitchen-published meals are shown. Nutrition values that are absent are not estimated.</Text>
    </>}
  </BrowseScreen>;
}
const styles = StyleSheet.create({
  filter: { gap: 8 }, choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, dateChoices: { gap: 8 },
  choice: { minHeight: 48, paddingHorizontal: 14, paddingVertical: 12, justifyContent: 'center', borderWidth: 1, borderColor: '#DCE5D8', borderRadius: 16, backgroundColor: '#fff' },
  choiceSelected: { borderColor: '#34732D', backgroundColor: '#EFF8E9' }, label: { fontSize: 15, fontWeight: '600', color: '#183829' },
  day: { gap: 12, paddingVertical: 10 }, date: { color: '#245E23', fontSize: 18, fontWeight: '700' },
  meal: { padding: 16, gap: 10, borderWidth: 1, borderColor: '#DCE5D8', borderRadius: 18, backgroundColor: '#fff' },
  image: { width: '100%', height: 150, borderRadius: 12 }, slot: { fontSize: 13, fontWeight: '600', color: '#53604E' }, name: { fontSize: 16, lineHeight: 23, fontWeight: '600', color: '#183829' },
});
