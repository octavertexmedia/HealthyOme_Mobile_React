import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, Dimensions, Image, Linking, AccessibilityInfo, AppState,
  type NativeScrollEvent, type NativeSyntheticEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useQuery } from '@tanstack/react-query';
import {
  useFeaturedMeals,
  useHomeLayout,
  useMealCategories,
  useSiteSettings,
} from '../../src/features/catalog/hooks/useMeals';
import type {
  HomeLayoutBlockMeal,
  PromoBanner,
  SiteSettings,
} from '../../src/features/catalog/types/meal.types';
import { useCartStore } from '../../src/features/cart/store/cart.store';
import { useAuthStore } from '../../src/features/auth/store/auth.store';
import { rewardsApi } from '../../src/features/rewards/api/rewards.api';
import { addressesApi } from '../../src/features/addresses/api/addresses.api';
import { formatPrice, getImageUrl } from '../../src/shared/utils/helpers';

const { width } = Dimensions.get('window');
// compute card width to fit inside horizontal padding (20px each side)
const CARD_WIDTH = width - 40;

type HomeFeatureFlags = {
  showSubscription: boolean;
  showQuickMeals: boolean;
  showSnacks: boolean;
  showConsult: boolean;
  showFunctionalTraining: boolean;
  allowCustomBowls: boolean;
};

function getHomeFeatureFlags(settings?: SiteSettings): HomeFeatureFlags {
  return {
    showSubscription: settings?.home_subscription_card_enabled !== false,
    showQuickMeals: settings?.home_quick_meals_card_enabled !== false,
    // Match the web fail-closed behavior: snacks are hidden unless the catalog
    // is explicitly enabled, and the home card has its own visibility flag.
    showSnacks:
      settings?.healthy_snacks_enabled === true &&
      settings?.home_healthy_snacks_card_enabled !== false,
    showConsult: settings?.home_consult_card_enabled !== false,
    showFunctionalTraining: settings?.functional_training_customer_enabled !== false,
    allowCustomBowls: settings?.custom_bowl_checkout_enabled === true,
  };
}

function normalizeCmsPath(link: string): string {
  const pathWithQuery = link.trim().replace(/^https?:\/\/[^/]+/i, '');
  const path = pathWithQuery.split(/[?#]/, 1)[0] || '/';
  return path.length > 1 ? path.replace(/\/+$/, '') : path;
}

function getCmsRoute(link: string, flags: HomeFeatureFlags): string | null {
  const path = normalizeCmsPath(link);
  if (path === '/menu' || path.startsWith('/menu/')) return '/(tabs)/menu';
  if (path === '/cart' || path.startsWith('/cart/')) return '/cart';
  if (path === '/checkout' || path.startsWith('/checkout/')) return '/checkout';
  if (path === '/orders' || path.startsWith('/orders/')) return '/(tabs)/orders';
  if (path === '/rewards' || path.startsWith('/rewards/')) return '/rewards';
  if (path === '/sidebar/offers' || path === '/offers') return '/profile-pages/offers';
  if (path === '/privacy') return '/profile-pages/terms?slug=privacy';
  if (path === '/terms') return '/profile-pages/terms';
  if (path === '/subscription' || path.startsWith('/subscription/')) {
    return flags.showSubscription ? '/subscription' : null;
  }
  if (path === '/consult' || path.startsWith('/consult/')) {
    return flags.showConsult ? '/consult' : null;
  }
  if (path === '/snacks' || path.startsWith('/snacks/')) {
    return flags.showSnacks ? '/snacks' : null;
  }
  if (path === '/functional-training' || path.startsWith('/functional-training/')) {
    return flags.showFunctionalTraining ? '/functional-training' : null;
  }
  if (path === '/bowl-builder' || path.startsWith('/bowl-builder/')) {
    return flags.allowCustomBowls ? '/bowl-builder' : null;
  }
  return null;
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    data: featuredMeals,
    refetch: refetchMeals,
    isLoading: isFeaturedLoading,
  } = useFeaturedMeals();
  const { data: homeLayout, refetch: refetchHome } = useHomeLayout();
  const { data: siteSettings, refetch: refetchSiteSettings } = useSiteSettings();
  const { data: categories } = useMealCategories();
  const addItem = useCartStore((s) => s.addItem);
  const cartCount = useCartStore((s) => s.totalItems);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [refreshing, setRefreshing] = useState(false);
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);
  const heroScrollRef = useRef<ScrollView>(null);

  const pointsQuery = useQuery({
    queryKey: ['rewards', 'points'],
    queryFn: rewardsApi.getUserPoints,
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });

  const addressesQuery = useQuery({
    queryKey: ['addresses'],
    queryFn: addressesApi.list,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  const defaultAddress =
    addressesQuery.data?.find((a) => a.is_default) ?? addressesQuery.data?.[0];
  const locationPrimary = defaultAddress
    ? defaultAddress.label || defaultAddress.delivery_area?.name || 'Delivery'
    : 'Select location';
  const locationSecondary = defaultAddress
    ? defaultAddress.delivery_area?.name && defaultAddress.label
      ? defaultAddress.delivery_area.name
      : defaultAddress.address
    : undefined;

  const promoBanners = homeLayout?.promo_banners ?? [];
  const heroSlides = useMemo(
    () => (homeLayout?.hero_slides ?? []).filter((slide) => slide.title?.trim()),
    [homeLayout?.hero_slides]
  );
  const homeBlocks = homeLayout?.home_page_blocks ?? [];
  const featureFlags = useMemo(() => getHomeFeatureFlags(siteSettings), [siteSettings]);
  const hasCmsMealBlocks = homeBlocks.some(
    (block) => block.block_type === 'meal_strip' && block.meals.length > 0
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchMeals(), refetchHome(), refetchSiteSettings()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchMeals, refetchHome, refetchSiteSettings]);

  const openCmsLink = useCallback(
    (link?: string) => {
      const raw = link?.trim();
      if (!raw) return;
      // CMS content may link off-site. Only permit web URLs; reject custom
      // schemes so remotely managed content cannot open privileged deep links.
      if (/^https?:\/\//i.test(raw)) {
        void Linking.openURL(raw).catch(() => undefined);
        return;
      }
      const route = getCmsRoute(raw, featureFlags);
      if (route) router.push(route as any);
    },
    [featureFlags, router]
  );

  const openPromo = useCallback(
    (promo: PromoBanner) => {
      const coupon = promo.coupon_code?.trim().toUpperCase();
      if (coupon) {
        router.push({ pathname: '/checkout', params: { coupon } } as any);
        return;
      }
      router.push('/profile-pages/offers' as any);
    },
    [router]
  );

  const onHeroScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = Math.round(event.nativeEvent.contentOffset.x / CARD_WIDTH);
      setActiveHeroSlide(Math.max(0, Math.min(next, heroSlides.length - 1)));
    },
    [heroSlides.length]
  );

  useEffect(() => {
    if (heroSlides.length <= 1) return;
    let reduceMotion = false;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      reduceMotion = enabled;
    });
    const motionSubscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled) => { reduceMotion = enabled; }
    );
    const timer = setInterval(() => {
      if (reduceMotion || AppState.currentState !== 'active') return;
      setActiveHeroSlide((current) => {
        const next = (current + 1) % heroSlides.length;
        heroScrollRef.current?.scrollTo({ x: next * CARD_WIDTH, animated: true });
        return next;
      });
    }, 6000);
    return () => {
      clearInterval(timer);
      motionSubscription.remove();
    };
  }, [heroSlides.length]);

  const getCategoryName = (meal: any): string => {
    if (meal.category && typeof meal.category === 'object') return meal.category.name;
    return meal.category_name || 'Other';
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4B8E3D" />}
        contentContainerStyle={styles.scrollContent}
        bounces={false}
      >
        {/* ─── HERO & HEADER ─── */}
        <LinearGradient
          colors={['rgba(4, 54, 15, 1)', 'rgba(5, 74, 19, 1)']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 1 }}
          style={[styles.heroBanner, { paddingTop: Math.max(insets.top, 16) + 16, height: 190 + Math.max(insets.top, 16) }]}
        >
          {/* Header inside Hero */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.locationWrap}
              onPress={() => router.push('/profile-pages/addresses' as any)}
              activeOpacity={0.85}
            >
              <View style={styles.pinCircle}>
                <Ionicons name="location" size={20} color="#111" />
              </View>
              <View style={{ maxWidth: 160 }}>
                <Text style={styles.locationText} numberOfLines={1}>{locationPrimary}</Text>
                {locationSecondary ? (
                  <Text style={styles.addressText} numberOfLines={1}>{locationSecondary}</Text>
                ) : null}
              </View>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              {isAuthenticated && (
                <TouchableOpacity
                  style={styles.pointsPill}
                  onPress={() => router.push('/rewards' as any)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="star" size={14} color="#F5A623" />
                  <Text style={styles.pointsText}>{pointsQuery.data ?? 0}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.cartCircle} onPress={() => router.push('/cart')}>
                <Ionicons name="cart-outline" size={20} color="#111" />
                {cartCount > 0 && (
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>{cartCount > 9 ? '9+' : cartCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {heroSlides.length > 0 ? (
            <>
              <ScrollView
                ref={heroScrollRef}
                horizontal
                pagingEnabled
                nestedScrollEnabled
                bounces={false}
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={onHeroScrollEnd}
                style={styles.heroSlides}
                contentContainerStyle={styles.heroSlidesContent}
              >
                {heroSlides.map((slide) => {
                  const imageUrl = getImageUrl(slide.image_url);
                  const canOpen = !!slide.button_link &&
                    (/^https?:\/\//i.test(slide.button_link) ||
                      !!getCmsRoute(slide.button_link, featureFlags));
                  return (
                    <View key={slide.id} style={styles.heroSlide}>
                      <View style={styles.heroSlideCopy}>
                        <Text style={styles.heroTitle}>{slide.title || homeLayout?.hero_headline}</Text>
                        {!!slide.subtitle && (
                          <Text style={styles.heroSubtitle} numberOfLines={2}>{slide.subtitle}</Text>
                        )}
                        {!!slide.description && (
                          <Text style={styles.heroDescription} numberOfLines={2}>{slide.description}</Text>
                        )}
                        {!!slide.button_text && canOpen && (
                          <TouchableOpacity
                            style={styles.heroButton}
                            onPress={() => openCmsLink(slide.button_link)}
                            activeOpacity={0.85}
                          >
                            <Text style={styles.heroButtonText}>{slide.button_text}</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      {imageUrl ? (
                        <Image
                          source={{ uri: imageUrl }}
                          style={styles.heroSlideImage}
                          resizeMode="contain"
                        />
                      ) : null}
                    </View>
                  );
                })}
              </ScrollView>
              {heroSlides.length > 1 && (
                <View style={styles.heroDots}>
                  {heroSlides.map((slide, index) => (
                    <View
                      key={slide.id}
                      style={[styles.heroDot, index === activeHeroSlide && styles.heroDotActive]}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <>
              <View style={styles.heroContent}>
                {homeLayout?.hero_headline ? (
                  <Text style={styles.heroTitle}>{homeLayout.hero_headline}</Text>
                ) : null}
              </View>
              <Image
                source={require('../../assets/images/figma/new_home/hero_lobster.png')}
                style={styles.heroLeftDish}
                resizeMode="contain"
              />
              <Image
                source={require('../../assets/images/figma/new_home/hero_lobster.png')}
                style={styles.heroRightDish}
                resizeMode="contain"
              />
            </>
          )}
        </LinearGradient>

        {/* ─── PROMO CAROUSEL ─── (only when the CMS returns banners) */}
        {promoBanners.length > 0 && (
          <View style={{ marginTop: 12 }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
            >
              {promoBanners.map((promo) => {
                const bannerImg = getImageUrl(promo.right_image_src);
                return (
                  <View key={promo.id} style={[styles.promoSliderCard, { backgroundColor: promo.bg_color || '#EAF5EA' }]}>
                    {bannerImg ? (
                      <Image source={{ uri: bannerImg }} style={styles.promoSliderImg} resizeMode="cover" />
                    ) : null}

                    <View style={styles.promoSliderContent}>
                      <Text style={styles.promoSliderTitle}>{promo.title}</Text>
                      <Text style={styles.promoSliderDesc}>{promo.description}</Text>

                      <TouchableOpacity
                        style={[styles.promoSliderBtn, { backgroundColor: promo.button_bg_color || '#0099A3' }]}
                        onPress={() => openPromo(promo)}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.promoSliderBtnText, { color: promo.button_text_color || '#fff' }]}>
                          {promo.coupon_code ? `Use ${promo.coupon_code}` : 'View offer'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ─── SUBSCRIPTION MEALS CARD ─── */}
        {featureFlags.showSubscription && <View style={styles.sectionPad}>
          <TouchableOpacity
            style={styles.roundedCardWrap}
            onPress={() => router.push('/subscription/plans')}
            activeOpacity={0.8}
          >
            <View style={[styles.subCardGradient, { backgroundColor: '#EAF5EA' }]}>
              <View style={styles.subCardLeft}>
                <View style={styles.subBadge}>
                  <Text style={styles.subBadgeText}>BEST VALUE</Text>
                </View>
                <View style={{ marginTop: 2 }}>
                  <Text style={styles.subTitle}>{homeLayout?.subscription_card_title || 'Subscription Meals'}</Text>
                  <Text style={styles.subDesc}>{homeLayout?.subscription_card_subtitle || ''}</Text>
                </View>
              </View>

              <Image
                source={homeLayout?.subscription_card_image_src
                  ? { uri: getImageUrl(homeLayout.subscription_card_image_src) }
                  : require('../../assets/images/figma/new_home/subscription_right-4f2f3b.png')}
                style={styles.subImg}
                resizeMode="contain"
              />
            </View>
          </TouchableOpacity>
        </View>}

        {/* ─── QUICK MEALS CARD ─── */}
        {featureFlags.showQuickMeals && <View style={styles.sectionPad}>
          <TouchableOpacity
            style={styles.roundedCardWrap}
            onPress={() => router.push('/(tabs)/menu')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FFFFFA', '#FCEBAF']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.subCardGradient}
            >
              <View style={styles.subCardLeft}>
                <View style={{ flex: 1, justifyContent: 'flex-end', paddingBottom: 8 }}>
                  <Text style={styles.quickTitle}>{homeLayout?.quick_meals_title || 'Quick Meals'}</Text>
                  <Text style={[styles.subDesc, { marginTop: 4 }]}>{homeLayout?.quick_meals_subtitle || ''}</Text>
                </View>
              </View>

              {homeLayout?.quick_meals_card_image_src ? (
                <Image
                  source={{ uri: getImageUrl(homeLayout.quick_meals_card_image_src) }}
                  style={styles.quickCmsImg}
                  resizeMode="contain"
                />
              ) : (
                <>
                  <Image
                    source={require('../../assets/images/figma/new_home/feature_quick_2.png')}
                    style={styles.quickImgRightPlats}
                    resizeMode="cover"
                  />
                  <Image
                    source={require('../../assets/images/figma/new_home/feature_quick_1.png')}
                    style={styles.quickImgLeftPlats}
                    resizeMode="cover"
                  />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>}

        {/* ─── CONSULT DIETICIAN CARD ─── */}
        {featureFlags.showConsult && <View style={styles.sectionPad}>
          <TouchableOpacity
            style={[styles.roundedCardWrap, { borderColor: '#F3F3F3', borderWidth: 1 }]}
            onPress={() => router.push('/consult')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FFFFFF', '#E6F8F8']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.subCardGradient}
            >
              <View style={styles.subCardLeft}>
                <View style={{ flex: 1, justifyContent: 'flex-end', paddingBottom: 8 }}>
                  <Text style={styles.quickTitle}>{homeLayout?.consult_card_title || 'Consult a Dietician'}</Text>
                  <Text style={[styles.subDesc, { marginTop: 4 }]}>{homeLayout?.consult_card_subtitle || ''}</Text>
                </View>
              </View>

              <Image
                source={homeLayout?.consult_card_image_src
                  ? { uri: getImageUrl(homeLayout.consult_card_image_src) }
                  : require('../../assets/images/figma/new_home/consult_dietician-1fcf07.png')}
                style={styles.consultImg}
                resizeMode="contain"
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>}

        {/* ─── HEALTHY SNACKS CARD ─── */}
        {featureFlags.showSnacks && <View style={styles.sectionPad}>
          <TouchableOpacity
            style={[styles.roundedCardWrap, { borderColor: '#F3F3F3', borderWidth: 1 }]}
            onPress={() => router.push('/snacks' as any)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FFFFFF', '#FDF3E6']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.subCardGradient}
            >
              <View style={styles.subCardLeft}>
                <View style={{ flex: 1, justifyContent: 'flex-end', paddingBottom: 8 }}>
                  <Text style={styles.quickTitle}>{homeLayout?.healthy_snacks_card_title || 'Healthy Snacks'}</Text>
                  <Text style={[styles.subDesc, { marginTop: 4 }]}>{homeLayout?.healthy_snacks_card_subtitle || ''}</Text>
                </View>
              </View>
              {homeLayout?.healthy_snacks_card_image_src ? (
                <Image
                  source={{ uri: getImageUrl(homeLayout.healthy_snacks_card_image_src) }}
                  style={styles.serviceCmsImg}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.homeCardIcon}>
                  <Ionicons name="nutrition-outline" size={44} color="#E8873B" />
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>}

        {/* ─── FUNCTIONAL TRAINING CARD ─── */}
        {featureFlags.showFunctionalTraining && <View style={styles.sectionPad}>
          <TouchableOpacity
            style={[styles.roundedCardWrap, { borderColor: '#F3F3F3', borderWidth: 1 }]}
            onPress={() => router.push('/functional-training' as any)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FFFFFF', '#EAF0FF']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.subCardGradient}
            >
              <View style={styles.subCardLeft}>
                <View style={{ flex: 1, justifyContent: 'flex-end', paddingBottom: 8 }}>
                  <Text style={styles.quickTitle}>{homeLayout?.functional_training_card_title || 'Functional Training'}</Text>
                  <Text style={[styles.subDesc, { marginTop: 4 }]}>{homeLayout?.functional_training_card_subtitle || ''}</Text>
                </View>
              </View>
              {homeLayout?.functional_training_card_image_src ? (
                <Image
                  source={{ uri: getImageUrl(homeLayout.functional_training_card_image_src) }}
                  style={styles.serviceCmsImg}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.homeCardIcon}>
                  <Ionicons name="barbell-outline" size={44} color="#3B6FE8" />
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>}

        {/* ─── CATEGORIES ─── */}
        {categories && categories.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeading}>Categories</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingVertical: 12 }}
            >
              {categories.map((cat) => {
                const catImg = getImageUrl(cat.image_url || cat.image);
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={styles.catItem}
                    onPress={() =>
                      router.push({ pathname: '/(tabs)/menu', params: { category: String(cat.id) } })
                    }
                    activeOpacity={0.85}
                  >
                    <View style={styles.catIconWrap}>
                      {catImg ? (
                        <Image source={{ uri: catImg }} style={styles.catIconImg} resizeMode="cover" />
                      ) : (
                        <Ionicons name="restaurant" size={26} color="#4B8E3D" />
                      )}
                    </View>
                    <Text style={styles.catLabel} numberOfLines={1}>{cat.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </>
        )}

        {/* ─── CMS-ORDERED HOME BLOCKS ─── */}
        {homeBlocks.map((block) => {
          if (block.block_type === 'promo' && block.promo) {
            const promo = block.promo;
            const bannerImg = getImageUrl(promo.right_image_src);
            return (
              <View key={block.id} style={styles.inlinePromoWrap}>
                <View style={[styles.promoSliderCard, { backgroundColor: promo.bg_color || '#EAF5EA' }]}>
                  {bannerImg ? (
                    <Image source={{ uri: bannerImg }} style={styles.promoSliderImg} resizeMode="cover" />
                  ) : null}
                  <View style={styles.promoSliderContent}>
                    <Text style={styles.promoSliderTitle}>{promo.title}</Text>
                    <Text style={styles.promoSliderDesc}>{promo.description}</Text>
                    <TouchableOpacity
                      style={[styles.promoSliderBtn, { backgroundColor: promo.button_bg_color || '#0099A3' }]}
                      onPress={() => openPromo(promo)}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.promoSliderBtnText, { color: promo.button_text_color || '#fff' }]}>
                        {promo.coupon_code ? `Use ${promo.coupon_code}` : 'View offer'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }

          if (block.block_type !== 'meal_strip' || block.meals.length === 0) return null;
          return (
            <View key={block.id}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeading}>{block.title || 'Featured'}</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.mealStripContent}
              >
                {block.meals.map((meal: HomeLayoutBlockMeal) => {
                  const imageUrl = getImageUrl(meal.image);
                  return (
                    <TouchableOpacity
                      key={meal.id}
                      style={styles.featCard}
                      onPress={() => router.push(`/meal/${meal.id}` as any)}
                      activeOpacity={0.9}
                    >
                      <Image
                        source={imageUrl
                          ? { uri: imageUrl }
                          : require('../../assets/images/figma/new_home/featured_chicken_salad.png')}
                        style={styles.featImg}
                      />
                      <View style={styles.featInfo}>
                        <Text style={styles.featCat} numberOfLines={1}>{block.title || 'Featured'}</Text>
                        <Text style={styles.featTitle} numberOfLines={2}>{meal.name}</Text>
                        <Text style={styles.featCal}>
                          {meal.calories != null ? `${meal.calories} kcal` : 'Calories unavailable'}
                        </Text>
                        <View style={styles.featBottomRow}>
                          <Text style={styles.featPrice}>{formatPrice(meal.price)}</Text>
                          <TouchableOpacity
                            style={styles.featAddBtn}
                            accessibilityLabel={`Add ${meal.name} to cart`}
                            onPress={() => addItem({
                              id: String(meal.id),
                              name: meal.name,
                              price: Number(meal.price) || 0,
                              image: meal.image || undefined,
                              calories: meal.calories,
                              meta: { kind: 'meal', meal_item_id: meal.id },
                            })}
                          >
                            <Ionicons name="add" size={16} color="#4B8E3D" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          );
        })}

        {/* ─── FEATURED MEALS ─── */}
        {!hasCmsMealBlocks && <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeading}>Featured Meal</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.mealStripContent}
          >
          {featuredMeals && featuredMeals.length > 0 ? featuredMeals.slice(0, 4).map((meal) => {
            const price = typeof meal.price === 'string' ? parseFloat(meal.price) : meal.price || 0;
            return (
              <TouchableOpacity
                key={meal.id}
                style={styles.featCard}
                onPress={() => router.push(`/meal/${meal.id}` as any)}
                activeOpacity={0.9}
              >
                <Image 
                  source={meal.image ? { uri: getImageUrl(meal.image) } : require('../../assets/images/figma/new_home/featured_chicken_salad.png')} 
                  style={styles.featImg} 
                />
                <View style={styles.featInfo}>
                  <Text style={styles.featCat} numberOfLines={1}>{getCategoryName(meal)}</Text>
                  <Text style={styles.featTitle} numberOfLines={2}>{meal.name}</Text>
                  <Text style={styles.featCal}>{meal.calories ? `${meal.calories} kcal` : 'N/A kcal'}</Text>
                  
                  <View style={styles.featBottomRow}>
                    <Text style={styles.featPrice}>{formatPrice(price)}</Text>
                    <TouchableOpacity 
                      style={styles.featAddBtn}
                      onPress={() => addItem({
                        id: String(meal.id),
                        name: meal.name,
                        price: price,
                        image: meal.image || undefined,
                        calories: meal.calories,
                      })}
                    >
                      <Ionicons name="add" size={16} color="#4B8E3D" />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            )
          }) : (
            <Text style={{ marginLeft: 20 }}>
              {isFeaturedLoading ? 'Loading featured meals...' : 'No featured meals available'}
            </Text>
          )}
          </ScrollView>
        </>}

        {/* ─── FOOTER ─── */}
        {homeLayout?.home_footer_text ? (
          <View style={styles.footerWrap}>
            <Text style={styles.footerText}>{homeLayout.home_footer_text}</Text>
          </View>
        ) : null}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFFF8' },
  scrollContent: { paddingBottom: 100 },
  
  /* Hero Banner */
  heroBanner: {
    paddingHorizontal: 20, position: 'relative', overflow: 'hidden'
  },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 20,
  },
  locationWrap: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pinCircle: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
  },
  locationText: { fontSize: 18, fontWeight: '600', color: '#fff' },
  addressText: { fontSize: 12, fontWeight: '400', color: '#fff' },
  cartCircle: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
  },
  cartBadge: {
    position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18,
    paddingHorizontal: 4, borderRadius: 9, backgroundColor: '#C7463A',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#fff',
  },
  cartBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  pointsPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#fff', paddingHorizontal: 10, height: 32, borderRadius: 16,
  },
  pointsText: { fontSize: 13, fontWeight: '700', color: '#0B262F' },
  heroContent: { zIndex: 10, marginTop: 24, position: 'relative' },
  heroSlides: { marginTop: 8, zIndex: 10 },
  heroSlidesContent: { alignItems: 'stretch' },
  heroSlide: { width: CARD_WIDTH, minHeight: 110, position: 'relative', justifyContent: 'center' },
  heroSlideCopy: { width: '66%', zIndex: 3, paddingBottom: 8 },
  heroTitle: {
    fontSize: 24, fontWeight: '800', color: '#fff', lineHeight: 32, letterSpacing: 0.5,
    width: 210,
    textAlign: 'left',
  },
  heroSubtitle: { color: '#EAF5EA', fontSize: 14, fontWeight: '600', lineHeight: 19, marginTop: 2 },
  heroDescription: { color: '#D5E7D6', fontSize: 12, lineHeight: 16, marginTop: 2 },
  heroButton: {
    alignSelf: 'flex-start', marginTop: 7, paddingHorizontal: 13, paddingVertical: 6,
    borderRadius: 999, backgroundColor: '#fff',
  },
  heroButtonText: { color: '#075312', fontSize: 12, fontWeight: '700' },
  heroSlideImage: {
    width: '44%', height: 115, position: 'absolute', right: -6, bottom: -4, zIndex: 2,
  },
  heroDots: {
    position: 'absolute', bottom: 7, left: 0, right: 0, zIndex: 12,
    flexDirection: 'row', justifyContent: 'center', gap: 5,
  },
  heroDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  heroDotActive: { width: 16, backgroundColor: '#fff' },
  heroLeftDish: {
    width: 120, height: 120, position: 'absolute', left: -50, bottom: -20, zIndex: 2,
  },
  heroRightDish: {
    width: 180, height: 180, position: 'absolute', right: -40, bottom: -50, zIndex: 2,
  },

  /* Promos */
  promoSliderCard: {
    // card fills available space taking padding into account
    width: CARD_WIDTH,
    height: 132, borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: '#F2F2F2', position: 'relative',
  },
  promoSliderImg: {
    width: 105, height: '100%', position: 'absolute', right: 0, top: 0,
  },
  promoSliderContent: {
    position: 'absolute', left: 16, top: 12, right: 120, zIndex: 10,
    // reserve space on the right for the promo image, auto-wrap text
  },
  promoSliderTitle: { fontSize: 16, fontWeight: '600', color: '#111', lineHeight: 22 },
  promoSliderDesc: { fontSize: 13, fontWeight: '500', color: '#666', marginTop: 4, lineHeight: 18 },
  promoSliderBtn: {
    marginTop: 10, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, alignSelf: 'flex-start',
  },
  promoSliderBtnText: { fontSize: 13, fontWeight: '600' },
  inlinePromoWrap: { paddingHorizontal: 20, marginTop: 20, alignItems: 'center' },

  /* Action Cards */
  sectionPad: { paddingHorizontal: 20, marginTop: 12 },
  roundedCardWrap: {
    borderRadius: 16, borderWidth: 1, borderColor: '#E6E6E3', overflow: 'hidden', height: 110,
  },
  subCardGradient: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', position: 'relative' },
  subCardLeft: { padding: 16, justifyContent: 'center', zIndex: 10, width: '65%' },
  subBadge: { backgroundColor: '#DDF0EB', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 999, alignSelf: 'flex-start', marginBottom: 2 },
  subBadgeText: { fontSize: 9, fontWeight: '700', color: '#2C921D', letterSpacing: 0.5 },
  subTitle: { fontSize: 16, fontWeight: '700', color: '#111', lineHeight: 20 },
  subDesc: { fontSize: 13, fontWeight: '500', color: '#6A6A6A', marginTop: 2 },
  
  subImg: { width: 130, height: 110, position: 'absolute', right: -15, bottom: -5 },
  
  quickTitle: { fontSize: 16, fontWeight: '700', color: '#111', lineHeight: 20 },
  quickImgLeftPlats: { width: 110, height: 110, position: 'absolute', right: 40, bottom: 0 },
  quickImgRightPlats: { width: 110, height: 110, position: 'absolute', right: -30, bottom: -20 },
  quickCmsImg: { width: 130, height: 110, position: 'absolute', right: -8, bottom: 0 },
  
  consultImg: { width: 90, height: 105, position: 'absolute', right: 0, bottom: -5 },
  homeCardIcon: { position: 'absolute', right: 24, top: 0, bottom: 0, justifyContent: 'center' },
  serviceCmsImg: { width: 105, height: 105, position: 'absolute', right: 4, bottom: 0 },

  /* Section Headings */
  sectionHeader: { paddingHorizontal: 20, marginTop: 24 },
  sectionHeading: { fontSize: 18, fontWeight: '600', color: '#111' },

  /* Categories */
  catItem: { alignItems: 'center', width: 74 },
  catIconWrap: {
    width: 56, height: 56, borderRadius: 28, marginBottom: 8, overflow: 'hidden',
    backgroundColor: '#EAF5EA', justifyContent: 'center', alignItems: 'center',
  },
  catIconImg: { width: '100%', height: '100%' },
  catLabel: { fontSize: 14, fontWeight: '500', color: '#111', textAlign: 'center' },

  /* Featured Meals */
  featCard: {
    width: 250, backgroundColor: '#fff', borderRadius: 24, borderWidth: 1, borderColor: '#E6E6E3',
    overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
  },
  featImg: { width: '100%', height: 160, resizeMode: 'cover' },
  featInfo: { padding: 16 },
  featCat: { fontSize: 12, fontWeight: '600', color: '#7A7A7A', textTransform: 'uppercase' },
  featTitle: { fontSize: 18, fontWeight: '600', color: '#111', marginVertical: 4 },
  featCal: { fontSize: 14, color: '#7A7A7A' },
  featBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  featPrice: { fontSize: 18, fontWeight: '600', color: '#4B8E3D' },
  featAddBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  mealStripContent: { paddingHorizontal: 20, gap: 16, marginTop: 16 },

  /* Footer Target */
  footerWrap: { paddingHorizontal: 20, marginTop: 40 },
  footerText: { fontSize: 24, fontWeight: '700', color: '#C5C5C5', lineHeight: 32 },
});
