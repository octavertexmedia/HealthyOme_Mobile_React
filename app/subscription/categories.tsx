import React from 'react';
import { Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { subscriptionApi } from '../../src/features/subscription/api/subscription.api';
import { BrowseScreen, BrowseCard, browseStyles } from '../../src/features/subscription/BrowseScreen';

export default function SubscriptionCategories() {
  const router = useRouter();
  const query = useQuery({ queryKey: ['subscription-browse-categories'], queryFn: subscriptionApi.getBrowseCategories });
  return <BrowseScreen title="Subscription Meals" fallback="/(tabs)">
    <Text style={browseStyles.body}>Pick a category, then choose your plan duration</Text>
    {query.isLoading ? <ActivityIndicator /> : query.isError ? <Text style={browseStyles.body}>Could not load categories. Please try again later.</Text> : !query.data?.length ? <Text style={browseStyles.body}>No subscription categories are available right now.</Text> : query.data.map((category) =>
      <BrowseCard key={category.id} title={category.title} description={category.subtitle} image={category.image_url || category.image} label={category.badge}
        onPress={() => router.push({ pathname: '/subscription/plans', params: { category: category.slug } })} />)}
  </BrowseScreen>;
}
