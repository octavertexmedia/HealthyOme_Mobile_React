import React, { useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, Dimensions, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useQuery } from '@tanstack/react-query';
import { useFeaturedMeals, useHomeLayout, useMealCategories } from '../../src/features/catalog/hooks/useMeals';
import { useCartStore } from '../../src/features/cart/store/cart.store';
import { useAuthStore } from '../../src/features/auth/store/auth.store';
import { rewardsApi } from '../../src/features/rewards/api/rewards.api';
import { addressesApi } from '../../src/features/addresses/api/addresses.api';
import { formatPrice, getImageUrl } from '../../src/shared/utils/helpers';

const { width } = Dimensions.get('window');
// compute card width to fit inside horizontal padding (20px each side)
const CARD_WIDTH = width - 40;

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    data: featuredMeals,
    refetch: refetchMeals,
    isLoading: isFeaturedLoading,
  } = useFeaturedMeals();
  const { data: homeLayout, refetch: refetchHome } = useHomeLayout();
  const { data: categories } = useMealCategories();
  const addItem = useCartStore((s) => s.addItem);
  const cartCount = useCartStore((s) => s.totalItems);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [refreshing, setRefreshing] = React.useState(false);

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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchMeals(), refetchHome()]);
    setRefreshing(false);
  }, [refetchMeals, refetchHome]);

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

          {/* Hero Content */}
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
                        onPress={() => router.push('/(tabs)/menu')}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.promoSliderBtnText, { color: promo.button_text_color || '#fff', textTransform: 'capitalize' }]}>Learn more</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ─── SUBSCRIPTION MEALS CARD ─── */}
        <View style={styles.sectionPad}>
          <TouchableOpacity
            style={styles.roundedCardWrap}
            onPress={() => router.push('/subscription')}
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
                source={require('../../assets/images/figma/new_home/subscription_right-4f2f3b.png')}
                style={styles.subImg}
                resizeMode="contain"
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* ─── QUICK MEALS CARD ─── */}
        <View style={styles.sectionPad}>
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
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ─── CONSULT DIETICIAN CARD ─── */}
        <View style={styles.sectionPad}>
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
                source={require('../../assets/images/figma/new_home/consult_dietician-1fcf07.png')}
                style={styles.consultImg}
                resizeMode="contain"
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ─── HEALTHY SNACKS CARD ─── */}
        <View style={styles.sectionPad}>
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
              <View style={styles.homeCardIcon}>
                <Ionicons name="nutrition-outline" size={44} color="#E8873B" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ─── FUNCTIONAL TRAINING CARD ─── */}
        <View style={styles.sectionPad}>
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
              <View style={styles.homeCardIcon}>
                <Ionicons name="barbell-outline" size={44} color="#3B6FE8" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

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

        {/* ─── FEATURED MEALS ─── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeading}>Featured Meal</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 16, marginTop: 16 }}
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
  heroTitle: {
    fontSize: 24, fontWeight: '800', color: '#fff', lineHeight: 32, letterSpacing: 0.5,
    width: 210,
    textAlign: 'left',
  },
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
  
  consultImg: { width: 90, height: 105, position: 'absolute', right: 0, bottom: -5 },
  homeCardIcon: { position: 'absolute', right: 24, top: 0, bottom: 0, justifyContent: 'center' },

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

  /* Footer Target */
  footerWrap: { paddingHorizontal: 20, marginTop: 40 },
  footerText: { fontSize: 24, fontWeight: '700', color: '#C5C5C5', lineHeight: 32 },
});
