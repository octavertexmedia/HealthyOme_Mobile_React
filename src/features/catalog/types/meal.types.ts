export interface MealCategory {
  id: number;
  name: string;
}

export interface MealTime {
  id: number;
  name: string;
}

export interface MealPlanType {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
}

export interface MealPricing {
  price: number;
  original_price: number | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fats: number | null;
  fiber: number | null;
  rating: number | null;
  total_sold: number;
  is_active: boolean;
}

export interface MealItem {
  id: number;
  name: string;
  description: string;
  image: string | null;
  meal_plan_type: MealPlanType | null;
  meal_plan_type_name?: string;
  category: MealCategory | null;
  category_name?: string;
  meal_time: MealTime | null;
  meal_time_name?: string;
  is_active: boolean;
  pricing: MealPricing | null;
  price: number | string | null;
  original_price?: number | string | null;
  calories: number | null;
  protein?: number | null;
  carbs?: number | null;
  fats?: number | null;
  fiber?: number | null;
  rating?: number | null;
}

export interface HeroSlide {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  image_url: string | null;
  button_text: string;
  button_link: string;
  order: number;
}

export interface SiteSettings {
  site_name: string;
  tagline: string;
  contact_email: string;
  contact_phone_1: string;
  contact_phone_2: string;
  address: string;
  instagram_url: string;
  whatsapp_number: string;
}
