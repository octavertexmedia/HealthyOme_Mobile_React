import React, { useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { subscriptionApi } from './api/subscription.api';
import { defaultBrowsePlan } from './browsePolicy';
import { filterMenuDays, formatMenuDate, menuDateRange, menuDates, menuDiet, menuNutrition, menuQueryKey, validServiceDate } from './menuSchedule';
import type { PlanMenuSchedule } from './api/subscription.api';
import { getImageUrl } from '../../shared/utils/helpers';
import Button from '../../shared/components/Button';

function Choice({ title, shortTitle, selected, onPress }: { title: string; shortTitle?: string; selected: boolean; onPress: () => void }) {
  return <TouchableOpacity accessibilityRole="radio" accessibilityLabel={title} accessibilityState={{ selected }} onPress={onPress} style={[styles.choice, selected && styles.choiceSelected]}>
    <Text style={{ color: selected ? '#245E23' : '#4B5563', fontWeight: selected ? '700' : '400', fontSize: 14 }}>{shortTitle ?? title}</Text>
  </TouchableOpacity>;
}
export type MenuSelection = { slug: string; planId?: string; categoryId?: string; mealTimeId?: string; date?: string };
export type MenuFilters = Pick<MenuSelection, 'categoryId' | 'mealTimeId' | 'date'>;
export default function PlanMenuContent({ selection: params, filters: selected, onSelect: choose, visible }: {
  selection: MenuSelection; filters: MenuFilters; onSelect: (patch: Partial<MenuFilters>) => void; visible: boolean;
}) {
  const slug = params.slug;
  const range = menuDateRange();
  const overview = useQuery({ queryKey: ['subscription-overview', slug], queryFn: () => subscriptionApi.getOverview(slug), enabled: visible && Boolean(slug), retry: false });
  const data = overview.data;
  const plan = data?.meal_plan_type;
  const row = params.planId ? data?.plans.find((item) => String(item.id) === params.planId && item.is_active) : defaultBrowsePlan(data?.plans ?? []);
  const categories = Array.from(new Map((data?.plans ?? []).flatMap((item) => item.is_active && item.category ? [[item.category.id, item.category] as const] : [])).values());
  const categoryId = selected.categoryId ?? params.categoryId ?? (row?.category ? String(row.category.id) : '');
  const category = categories.find((item) => String(item.id) === categoryId);
  const mealTimeId = selected.mealTimeId ?? params.mealTimeId ?? (data?.meal_times[0] ? String(data.meal_times[0].id) : '');
  const mealTime = data?.meal_times.find((item) => String(item.id) === mealTimeId);
  const date = selected.date ?? params.date ?? '';
  const invalidSelection = Boolean((params.planId && !row) || (categoryId && !category) || (mealTimeId && !mealTime) || (date && (!validServiceDate(date) || date < range.from || date > range.to)));
  const schedule = useQuery({ queryKey: menuQueryKey(slug, plan?.id, range), queryFn: () => subscriptionApi.getMenuSchedule(slug, plan!.id, range), enabled: visible && Boolean(plan && !invalidSelection), retry: false });
  const days = filterMenuDays(schedule.data?.days ?? [], { category: category?.name, mealTime: mealTime?.name, date });
  const loading = overview.isLoading || (!invalidSelection && schedule.isLoading);
  return <View style={styles.content}>
    <View style={styles.context}><Text style={styles.planName}>{plan?.name || 'Published menu'}</Text><Text style={styles.body}>India time · Asia/Kolkata</Text></View>
    {loading ? <ActivityIndicator accessibilityLabel="Loading dated menu" /> : overview.isError || schedule.isError ? <View style={styles.day}>
      <Text accessibilityRole="alert">Could not load the dated menu.</Text><Button title="Retry menu" onPress={() => { void (overview.isError ? overview.refetch() : schedule.refetch()); }} />
    </View> : invalidSelection ? <Text accessibilityRole="alert">This selection does not belong to this plan. Go back and choose the plan again.</Text> : <>
      {categories.length === 1 && data?.meal_times.length === 1 ? <Text testID="menu-fixed-selection" style={styles.fixedSelection}>{category?.name} · {mealTime?.name}</Text> : <View style={styles.filterGrid}>
        {!!categories.length && <View style={styles.filter}><Text style={styles.label}>Category</Text><View style={styles.choices}>{categories.map((item) => <Choice key={item.id} title={item.name} selected={item.id === category?.id} onPress={() => choose({ categoryId: String(item.id) })} />)}</View></View>}
        {!!data?.meal_times.length && <View style={styles.filter}><Text style={styles.label}>Meal slot</Text><View style={styles.choices}>{data.meal_times.map((item) => <Choice key={item.id} title={item.name} selected={item.id === mealTime?.id} onPress={() => choose({ mealTimeId: String(item.id) })} />)}</View></View>}
      </View>}
      <ScrollView horizontal accessibilityLabel="Choose menu date" showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateChoices}>
        <Choice title="All published dates" shortTitle="All dates" selected={!date} onPress={() => choose({ date: '' })} />
        {menuDates(range).map((day) => <Choice key={day} title={formatMenuDate(day)} shortTitle={formatMenuDate(day).replace(/,?\s+\d{4}$/, '')} selected={date === day} onPress={() => choose({ date: day })} />)}
      </ScrollView>
      {category && !menuDiet(category.name) ? <Text accessibilityRole="alert">Dietary matching is not published for this category.</Text> : !days.some((day) => day.meals.length) ?
        <Text accessibilityRole="alert">No published menu{date ? ` for ${formatMenuDate(date)}` : ' in this date range'} for the selected category and meal slot.</Text> : null}
      {days.map((day) => <MenuDay key={day.date} day={day} />)}
      <Text style={styles.body}>Meals are shown as returned by the menu service. Missing dates are not a delivery promise; missing nutrition values are not estimated.</Text>
    </>}
  </View>;
}
function MenuDay({ day }: { day: PlanMenuSchedule['days'][number] }) {
  const groups = new Map<string, typeof day.meals>();
  for (const meal of day.meals) {
    const slot = meal.meal_time_name?.trim() || 'Meal slot not published';
    groups.set(slot, [...(groups.get(slot) ?? []), meal]);
  }
  return <View style={styles.day}>
    <View style={styles.dayHeading}><Text accessibilityRole="header" style={styles.date}>{formatMenuDate(day.date)}</Text>{groups.size === 1 && <Text style={styles.slot}>{groups.keys().next().value}</Text>}</View>
    {!day.meals.length && <Text style={styles.body}>No published meal for the selected category and slot.</Text>}
    {Array.from(groups, ([slot, meals]) => <View key={slot} style={styles.group}>
      {groups.size > 1 && <Text accessibilityRole="header" style={styles.slot}>{slot}</Text>}
      {meals.map((meal, index) => <MealRow key={`${meal.id}-${index}`} meal={meal} />)}
    </View>)}
  </View>;
}
function MealRow({ meal }: { meal: PlanMenuSchedule['days'][number]['meals'][number] }) {
  const uri = meal.image ? getImageUrl(meal.image) : '';
  const [failedUri, setFailedUri] = useState('');
  const name = meal.name.trim();
  return <View style={styles.meal}>
    {uri && uri !== failedUri ? <Image accessibilityLabel={`Thumbnail: ${name}`} source={{ uri }} style={styles.image} resizeMode="cover" onError={() => setFailedUri(uri)} /> :
      <View accessibilityLabel={`No image available: ${name}`} style={[styles.image, styles.placeholder]}><Text style={styles.placeholderText}>No image</Text></View>}
    <View style={styles.description}><Text style={styles.name}>{name}</Text><Text style={styles.body}>{menuNutrition(meal)}</Text></View>
  </View>;
}
const styles = StyleSheet.create({
  content: { gap: 12 }, context: { gap: 4 }, planName: { fontSize: 17, lineHeight: 23, fontWeight: '600', color: '#183829' }, body: { fontSize: 14, lineHeight: 20, color: '#596356' },
  filterGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, filter: { flex: 1, minWidth: 140, gap: 6 }, choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 }, dateChoices: { gap: 8 },
  fixedSelection: { fontSize: 14, fontWeight: '600', color: '#245E23' },
  choice: { minHeight: 44, paddingHorizontal: 12, paddingVertical: 10, justifyContent: 'center', borderWidth: 1, borderColor: '#DCE5D8', borderRadius: 12, backgroundColor: '#fff' },
  choiceSelected: { borderColor: '#34732D', backgroundColor: '#EFF8E9' }, label: { fontSize: 15, fontWeight: '600', color: '#183829' },
  day: { gap: 8, paddingVertical: 4 }, dayHeading: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }, group: { gap: 8 }, date: { color: '#245E23', fontSize: 16, fontWeight: '700', flexGrow: 1 },
  meal: { flexDirection: 'row', alignItems: 'flex-start', padding: 10, gap: 10, borderWidth: 1, borderColor: '#DCE5D8', borderRadius: 12, backgroundColor: '#fff' },
  description: { flex: 1, gap: 4 }, image: { width: 56, height: 56, borderRadius: 8 },
  placeholder: { backgroundColor: '#F1F4EE', alignItems: 'center', justifyContent: 'center' }, placeholderText: { fontSize: 11, color: '#66705F' },
  slot: { fontSize: 13, fontWeight: '600', color: '#53604E' }, name: { fontSize: 16, lineHeight: 23, fontWeight: '600', color: '#183829' },
});
