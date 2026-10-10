import type { BrowseCategory, BrowsePlan, SubscriptionPlan } from './api/subscription.api';

/** Match the observed Veg default without assuming any global category ID. */
export function defaultBrowsePlan(plans: SubscriptionPlan[]): SubscriptionPlan | undefined {
  const active = plans.filter((plan) => plan.is_active);
  const vegetarian = active.filter((plan) => plan.category?.name.trim().toLowerCase() === 'veg');
  return [...(vegetarian.length ? vegetarian : active)]
    .sort((a, b) => (b.subscription_period.days ?? 0) - (a.subscription_period.days ?? 0))[0];
}

export function matchesBrowseCategory(plan: BrowsePlan, category: BrowseCategory): boolean {
  if (category.meal_plan_type_ids?.length) return category.meal_plan_type_ids.includes(plan.meal_plan_type.id);
  const name = plan.meal_plan_type.name.toLowerCase();
  const excludes = category.filter_name_excludes ?? [];
  const includes = category.filter_name_contains ?? [];
  const slugs = category.filter_slugs ?? [];
  if (excludes.some((term) => name.includes(term.toLowerCase()))) return false;
  return (!includes.length && !slugs.length) || includes.some((term) => name.includes(term.toLowerCase())) || slugs.includes(plan.slug);
}

export function nextSubscriptionStartDate(now = new Date()): string {
  const date = new Date(now);
  date.setDate(date.getDate() + 1);
  if (date.getDay() === 0) date.setDate(date.getDate() + 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
