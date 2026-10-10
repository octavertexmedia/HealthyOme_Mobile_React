import React from 'react';
import { ActivityIndicator, Image, Text, View, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { subscriptionApi } from '../../../src/features/subscription/api/subscription.api';
import { BrowseScreen, browseStyles } from '../../../src/features/subscription/BrowseScreen';
import { getImageUrl } from '../../../src/shared/utils/helpers';

export default function PlanMenu() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const overview = useQuery({ queryKey: ['subscription-overview', slug], queryFn: () => subscriptionApi.getOverview(slug), enabled: Boolean(slug), retry: false });
  const plan = overview.data?.meal_plan_type;
  const image = getImageUrl(plan?.menu_card_image_url || plan?.menu_card_image);
  const card = plan?.available_menu_view === 'card' && Boolean(image);
  const schedule = useQuery({ queryKey: ['subscription-menu', slug, plan?.id], queryFn: () => subscriptionApi.getMenuSchedule(slug, plan!.id), enabled: Boolean(plan && !card), retry: false });
  return <BrowseScreen title={card ? 'Menu card' : 'Day-wise menu'} fallback={{ pathname: '/subscription/plans/[slug]', params: { slug } }}>
    {overview.isLoading || (!card && schedule.isLoading) ? <ActivityIndicator /> : overview.isError || (!card && schedule.isError) ? <TouchableOpacity accessibilityRole="button" onPress={() => { void (overview.isError ? overview.refetch() : schedule.refetch()); }}><Text>Could not load the menu. Retry</Text></TouchableOpacity> : card ?
      <Image accessibilityLabel={`${plan?.name} menu card`} source={{ uri: image }} resizeMode="contain" style={{ width: '100%', height: 550 }} /> : <>
        <Text style={browseStyles.title}>{plan?.name}</Text>
        <Text style={browseStyles.body}>Scheduled meals and nutrition supplied by the kitchen. Unpublished dates are not a delivery promise.</Text>
        {!schedule.data?.days.length && <Text style={browseStyles.body}>The upcoming menu is being prepared.</Text>}
        {schedule.data?.days.map((day) => <View key={day.date} style={{ gap: 12, paddingVertical: 12 }}><Text style={browseStyles.price}>{day.date}</Text>
          {day.meals.map((meal, index) => <View key={`${meal.id}-${index}`} style={{ gap: 8, padding: 14, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12 }}>
            {!!meal.image && <Image source={{ uri: getImageUrl(meal.image) }} style={{ width: '100%', height: 140, borderRadius: 8 }} />}
            <Text style={{ fontWeight: '600' }}>{meal.name}</Text><Text style={browseStyles.body}>{meal.meal_time_name}</Text>
            <Text style={browseStyles.body}>{([['Calories', meal.calories, 'kcal'], ['Protein', meal.protein, 'g'], ['Carbs', meal.carbs, 'g'], ['Fats', meal.fats, 'g'], ['Fiber', meal.fiber, 'g']] as const)
              .filter(([, value]) => value != null).map(([label, value, unit]) => `${label}: ${value} ${unit}`).join(' · ') || 'Nutrition not published'}</Text>
          </View>)}
        </View>)}
      </>}
  </BrowseScreen>;
}
