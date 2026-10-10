import type { SiteSettings } from './types/meal.types';

/** Web-main defaults after settings load; no unknown catalogue flashes. */
export function customerFeatures(settings?: SiteSettings) {
  return {
    quickMeals: Boolean(settings && settings.home_quick_meals_card_enabled !== false),
    snacks: Boolean(settings && settings.healthy_snacks_enabled !== false),
    training: Boolean(settings && settings.functional_training_customer_enabled !== false),
  };
}

export function homeFeatures(settings?: SiteSettings) {
  const features = customerFeatures(settings);
  return {
    showSubscription: settings?.home_subscription_card_enabled !== false,
    showQuickMeals: features.quickMeals,
    showSnacks: features.snacks && settings?.home_healthy_snacks_card_enabled !== false,
    showConsult: settings?.home_consult_card_enabled !== false,
    showFunctionalTraining: features.training,
    allowCustomBowls: settings?.custom_bowl_checkout_enabled === true,
  };
}

export function customerTabs(settings?: SiteSettings) {
  const flags = customerFeatures(settings);
  return [
    { name: 'index', title: 'Home', icon: 'home' },
    ...(flags.quickMeals ? [{ name: 'menu', title: 'Meals', icon: 'restaurant' }] : []),
    ...(flags.snacks ? [{ name: 'snacks', title: 'Snacks', icon: 'nutrition' }] : []),
    ...(flags.training ? [{ name: 'training', title: 'Training', icon: 'barbell' }] : []),
    { name: 'orders', title: 'Orders', icon: 'receipt' },
    { name: 'dietitian', title: 'Dietitian', icon: 'medical' },
  ] as const;
}
