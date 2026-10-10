import React from 'react';
import { Text, Image, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { subscriptionApi } from '../../../src/features/subscription/api/subscription.api';
import { BrowseScreen, browseStyles } from '../../../src/features/subscription/BrowseScreen';
import Button from '../../../src/shared/components/Button';
import { getImageUrl } from '../../../src/shared/utils/helpers';

export default function SubscriptionPlanDetails() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const query = useQuery({ queryKey: ['subscription-overview', slug], queryFn: () => subscriptionApi.getOverview(slug), enabled: Boolean(slug) });
  const data = query.data;
  const image = getImageUrl(data?.meal_plan_type.image_url || data?.meal_plan_type.image);
  return <BrowseScreen title="Plan details" fallback="/subscription/plans">
    {query.isLoading ? <ActivityIndicator /> : query.isError || !data ? <Text style={browseStyles.body}>Could not load this plan.</Text> : <>
      {image ? <Image source={{ uri: image }} style={[browseStyles.image, { borderRadius: 20 }]} /> : null}
      <Text style={browseStyles.title}>{data.meal_plan_type.name}</Text>
      {data.meal_plan_type.description ? <Text style={browseStyles.body}>{data.meal_plan_type.description}</Text> : null}
      <Text style={browseStyles.price}>From ₹{data.starting_price} · {data.starting_period_label}</Text>
      {data.meal_plan_type.marketing_features?.map((feature) => <Text key={feature} style={browseStyles.body}>• {feature}</Text>)}
      <Text style={browseStyles.body}>{data.meal_times.map((time) => `${time.name}${time.delivery_window ? ` · ${time.delivery_window}` : ''}`).join('\n')}</Text>
      {data.can_subscribe === false ? <Text style={browseStyles.body}>{data.subscribe_blocker || 'This plan is unavailable.'}</Text> : null}
      <Button title="Customize plan" disabled={data.can_subscribe === false} onPress={() => router.push({ pathname: '/subscription/create', params: { plan: slug } })} />
      {data.meal_plan_type.show_available_menu !== false && data.available_meals.length ? <>
        <Text style={browseStyles.title}>Available menu</Text>
        {data.available_meals.map((meal) => <Text key={meal.id} style={browseStyles.body}>{meal.name}</Text>)}
      </> : null}
    </>}
  </BrowseScreen>;
}
