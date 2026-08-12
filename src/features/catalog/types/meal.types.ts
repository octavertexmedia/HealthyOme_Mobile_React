export interface MealCategory {
  id: number;
  name: string;
  slug?: string;
  image?: string | null;
  image_url?: string | null;
  sort_order?: number;
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

export interface PromoBanner {
  id: number;
  title: string;
  description: string;
  bg_color: string;
  button_bg_color: string;
  button_text_color: string;
  right_image_src: string;
  order: number;
  coupon_code: string;
}

export interface HomeLayoutBlockMeal {
  id: number;
  name: string;
  price: number;
  image: string;
  calories: number | null;
  dietary_type: string;
}

export interface HomePageBlock {
  id: number;
  block_type: string;
  title: string;
  order: number;
  meals: HomeLayoutBlockMeal[];
  promo: PromoBanner | null;
}

export interface HomeLayout {
  hero_headline: string;
  home_footer_text: string;
  subscription_card_title: string;
  subscription_card_subtitle: string;
  quick_meals_title: string;
  quick_meals_subtitle: string;
  healthy_snacks_card_title: string;
  healthy_snacks_card_subtitle: string;
  consult_card_title: string;
  consult_card_subtitle: string;
  functional_training_card_title: string;
  functional_training_card_subtitle: string;
  hero_slides: HeroSlide[];
  promo_banners: PromoBanner[];
  home_page_blocks: HomePageBlock[];
}
