import React from 'react';
import { Text, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { subscriptionApi } from '../../src/features/subscription/api/subscription.api';
import { matchesBrowseCategory } from '../../src/features/subscription/browsePolicy';
import { BrowseScreen, BrowseCard, browseStyles } from '../../src/features/subscription/BrowseScreen';

export default function SubscriptionPlans() {
  const router = useRouter();
  const { category: slug } = useLocalSearchParams<{ category?: string }>();
  const categories = useQuery({ queryKey: ['subscription-browse-categories'], queryFn: subscriptionApi.getBrowseCategories });
  const catalog = useQuery({ queryKey: ['subscription-browse-catalog'], queryFn: subscriptionApi.getBrowseCatalog });
  const category = categories.data?.find((item) => item.slug === slug);
  const plans = (catalog.data?.meal_plans ?? []).filter((plan) => !slug || (category && matchesBrowseCategory(plan, category)));
  return <BrowseScreen title={category?.title || 'Available Plans'} fallback="/subscription/categories">
    <Text style={browseStyles.title}>Find a plan that fits your routine</Text>
    {catalog.isLoading || categories.isLoading ? <ActivityIndicator /> : catalog.isError || categories.isError ? <Text style={browseStyles.body}>Could not load plans. Please try again later.</Text> : !plans.length ? <Text style={browseStyles.body}>No plans are available in this category.</Text> : plans.map((plan) =>
      <BrowseCard key={plan.slug} title={plan.meal_plan_type.name} description={plan.meal_plan_type.description}
        image={plan.meal_plan_type.image_url || plan.meal_plan_type.image || plan.preview_images[0]}
        label={`From ₹${Number(plan.starting_price).toFixed(0)} · ${plan.starting_period_label}`}
        onPress={() => router.push({ pathname: '/subscription/plans/[slug]', params: { slug: plan.slug } })} />)}
  </BrowseScreen>;
}
