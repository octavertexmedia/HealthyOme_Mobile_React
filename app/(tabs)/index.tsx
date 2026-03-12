import React, { useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, Dimensions, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFeaturedMeals, useHeroSlides } from '../../src/features/catalog/hooks/useMeals';
import { useCartStore } from '../../src/features/cart/store/cart.store';
import { colors, spacing, borderRadius, typography, shadows } from '../../src/shared/theme';
import { formatPrice, getImageUrl } from '../../src/shared/utils/helpers';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: featuredMeals, refetch: refetchMeals, isLoading } = useFeaturedMeals();
  const { data: heroSlides } = useHeroSlides();
  const addItem = useCartStore((s) => s.addItem);
  const totalItems = useCartStore((s) => s.totalItems);
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchMeals();
    setRefreshing(false);
  }, [refetchMeals]);

  const getCategoryName = (meal: any): string => {
    if (meal.category && typeof meal.category === 'object') return meal.category.name;
    return meal.category_name || 'Other';
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Healthy-O-Me</Text>
          <Text style={styles.headerSubtitle}>Healthy Food Delivered 🌱</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/cart')} style={styles.cartButton}>
          <Ionicons name="cart-outline" size={24} color={colors.text.primary} />
          {totalItems > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{totalItems}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Banner */}
        <View style={styles.heroContainer}>
          <LinearGradient
            colors={['rgba(4, 54, 15, 1)', 'rgba(5, 74, 19, 1)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroBanner}
          >
            <View style={styles.heroContent}>
              <View style={[styles.heroBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Text style={[styles.heroBadgeText, { color: '#fff' }]}>🥗 FRESH & HEALTHY</Text>
              </View>
              <Text style={[styles.heroTitle, { color: '#fff' }]}>Healthy Eating,{'\n'}Made Effortless.</Text>
              <Image 
                source={require('../../assets/images/figma/new_home/hero_lobster.png')}
                style={{ position: 'absolute', bottom: -10, right: -20, width: 100, height: 100 }}
                resizeMode="contain"
              />
              <TouchableOpacity style={styles.heroButton} onPress={() => router.push('/(tabs)/menu')}>
                <Text style={styles.heroButtonText}>Explore Menu</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Subscription Meals Card */}
        <TouchableOpacity
          style={styles.sectionPadding}
          onPress={() => router.push('/subscription')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#F9FEF7', '#CDEFC4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.promoCard}
          >
            <View style={styles.promoContent}>
              <View style={styles.promoBadge}>
                <Text style={styles.promoBadgeText}>BEST VALUE</Text>
              </View>
              <Text style={styles.promoTitle}>Subscription Meals</Text>
              <Text style={styles.promoSubtitle}>Long-term habit builder</Text>
            </View>
            <Image
              source={require('../../assets/images/subscription-img.webp')}
              style={{ width: 140, height: 110, position: 'absolute', right: -10, bottom: -10 }}
              resizeMode="contain"
            />
          </LinearGradient>
        </TouchableOpacity>

        {/* Quick Meals Card */}
        <TouchableOpacity
          style={styles.sectionPadding}
          onPress={() => router.push('/(tabs)/menu')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#FFFEFF', '#FCE17B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.promoCard}
          >
            <View style={styles.promoContent}>
              <Text style={styles.promoTitle}>Quick Meals</Text>
              <Text style={styles.promoSubtitle}>Instant healthy delivery</Text>
            </View>
            <Image
              source={require('../../assets/images/quick-meal.webp')}
              style={{ width: 140, height: 110, position: 'absolute', right: -20, bottom: -20 }}
              resizeMode="contain"
            />
          </LinearGradient>
        </TouchableOpacity>

        {/* Consult a Dietician */}
        <TouchableOpacity
          className="relative overflow-hidden rounded-[14px] border border-[#F3F3F3] p-4 mx-5 mb-4"
          onPress={() => router.push('/consult')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['rgba(255, 255, 255, 1)', 'rgba(223, 244, 244, 1)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <View className="flex-row items-end justify-between relative z-10">
            <View className="w-[244px] flex-shrink border-transparent">
              <Text className="text-[18px] font-semibold leading-[26px] tracking-tight text-black">
                Consult a Dietician
              </Text>
              <Text className="mt-1 text-sm font-medium leading-[20px] text-[#7A7A7A]">
                Personalized food guidance
              </Text>
            </View>

            <Image
              source={require('../../assets/images/figma/new_home/consult_dietician-1fcf07.png')}
              style={{ width: 82, height: 98, position: 'absolute', right: -10, bottom: -10 }}
              resizeMode="contain"
            />
          </View>
        </TouchableOpacity>

        {/* Categories */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll} contentContainerStyle={{ paddingHorizontal: spacing.xl }}>
          {['Veg', 'Non-Veg', 'Keto', 'High Protein', 'Low Carb', 'Vegan'].map((cat, i) => (
            <TouchableOpacity key={cat} style={styles.categoryChip} onPress={() => router.push('/(tabs)/menu')}>
              <LinearGradient
                colors={i % 2 === 0 ? ['#E8F5E9', '#C8E6C9'] : ['#FFF3E0', '#FFE0B2']}
                style={styles.categoryGradient}
              >
                <Text style={styles.categoryIcon}>
                  {['🥬', '🍗', '🥑', '💪', '🥗', '🌱'][i]}
                </Text>
              </LinearGradient>
              <Text style={styles.categoryLabel}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Featured Meals */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Meals</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/menu')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.featuredGrid}>
          {(featuredMeals || []).slice(0, 4).map((meal) => {
            const price = typeof meal.price === 'string' ? parseFloat(meal.price) : meal.price || 0;
            return (
              <TouchableOpacity
                key={meal.id}
                style={styles.mealCard}
                onPress={() => router.push(`/meal/${meal.id}`)}
                activeOpacity={0.85}
              >
                <View style={styles.mealImageContainer}>
                  {meal.image ? (
                    <Image source={{ uri: getImageUrl(meal.image) }} style={styles.mealImage} />
                  ) : (
                    <View style={styles.mealImageFallback}>
                      <Ionicons name="restaurant" size={32} color={colors.text.disabled} />
                    </View>
                  )}
                </View>
                <View style={styles.mealInfo}>
                  <Text style={styles.mealCategory}>{getCategoryName(meal)}</Text>
                  <Text style={styles.mealName} numberOfLines={2}>{meal.name}</Text>
                  <View style={styles.mealMeta}>
                    <Text style={styles.mealCalories}>
                      {meal.calories ? `${meal.calories} kcal` : '—'}
                    </Text>
                  </View>
                  <View style={styles.mealBottom}>
                    <Text style={styles.mealPrice}>{formatPrice(price)}</Text>
                    <TouchableOpacity
                      style={styles.addButton}
                      onPress={() => addItem({
                        id: String(meal.id),
                        name: meal.name,
                        price: price,
                        image: meal.image || undefined,
                        calories: meal.calories,
                      })}
                    >
                      <Ionicons name="add" size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Bowl Builder CTA */}
        <TouchableOpacity
          style={styles.sectionPadding}
          onPress={() => router.push('/bowl-builder')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#FFF8E1', '#FFECB3']}
            style={[styles.promoCard, { borderColor: '#FFE082' }]}
          >
            <View style={styles.promoContent}>
              <Text style={styles.promoTitle}>Build Your Bowl</Text>
              <Text style={styles.promoSubtitle}>Customize your perfect meal</Text>
            </View>
            <View style={styles.promoImagePlaceholder}>
              <Text style={{ fontSize: 40 }}>🥣</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Footer Tagline */}
        <View style={styles.footerTagline}>
          <Text style={styles.footerText}>
            Serving select areas to keep meals fresh and healthy 🌱
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
  },
  headerTitle: { ...typography.heading.md, color: colors.primary },
  headerSubtitle: { ...typography.body.sm, color: colors.text.secondary, marginTop: 2 },
  cartButton: { position: 'relative', padding: spacing.sm },
  cartBadge: {
    position: 'absolute', top: 0, right: 0, backgroundColor: colors.primary,
    width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center',
  },
  cartBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  scrollContent: { paddingBottom: 100 },
  heroContainer: { paddingHorizontal: spacing.xl, marginBottom: spacing.lg },
  heroBanner: { borderRadius: borderRadius.xl, padding: spacing.xxl, minHeight: 180 },
  heroContent: {},
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.7)', paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs, borderRadius: borderRadius.full, alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  heroBadgeText: { ...typography.body.xs, color: colors.primary, fontWeight: '600', letterSpacing: 0.5 },
  heroTitle: { ...typography.heading.xl, color: colors.text.primary, marginBottom: spacing.sm },
  heroSubtitle: { ...typography.body.md, color: colors.text.secondary, marginBottom: spacing.lg },
  heroButton: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary,
    paddingVertical: spacing.md, paddingHorizontal: spacing.xl, borderRadius: borderRadius.lg,
    alignSelf: 'flex-start', gap: spacing.sm,
  },
  heroButtonText: { ...typography.button.md, color: '#fff' },
  sectionPadding: { paddingHorizontal: spacing.xl, marginBottom: spacing.md },
  promoCard: {
    borderRadius: borderRadius.xl, padding: spacing.lg, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between', minHeight: 130,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  promoContent: { flex: 1 },
  promoBadge: {
    backgroundColor: colors.primaryLight, paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs, borderRadius: borderRadius.full, alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  promoBadgeText: { ...typography.body.xs, color: colors.primary, fontWeight: '600', letterSpacing: 1 },
  promoTitle: { ...typography.heading.lg, color: colors.text.primary, marginBottom: spacing.xs },
  promoSubtitle: { ...typography.body.md, color: colors.text.muted },
  promoImagePlaceholder: {
    width: 100, height: 100, justifyContent: 'center', alignItems: 'center',
  },
  consultCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    padding: spacing.lg, borderRadius: borderRadius.xl, borderWidth: 1,
    borderColor: colors.border, gap: spacing.md, ...shadows.sm,
  },
  consultIcon: {
    width: 48, height: 48, borderRadius: borderRadius.md, backgroundColor: colors.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  consultTitle: { ...typography.heading.sm, color: colors.text.primary },
  consultSubtitle: { ...typography.body.sm, color: colors.text.secondary, marginTop: 2 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.xl, marginTop: spacing.xxl, marginBottom: spacing.md,
  },
  sectionTitle: { ...typography.heading.md, color: colors.text.primary },
  seeAll: { ...typography.body.md, color: colors.primary },
  categoryScroll: { marginBottom: spacing.lg },
  categoryChip: { alignItems: 'center', marginRight: spacing.lg },
  categoryGradient: {
    width: 60, height: 60, borderRadius: 30,
    justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm,
  },
  categoryIcon: { fontSize: 28 },
  categoryLabel: { ...typography.body.sm, color: colors.text.secondary },
  featuredGrid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  mealCard: {
    width: (width - spacing.xl * 2 - spacing.md) / 2, backgroundColor: colors.surface,
    borderRadius: borderRadius.xl, overflow: 'hidden', borderWidth: 1,
    borderColor: colors.border, ...shadows.sm,
  },
  mealImageContainer: { width: '100%', height: 120 },
  mealImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  mealImageFallback: {
    width: '100%', height: '100%', backgroundColor: colors.divider,
    justifyContent: 'center', alignItems: 'center',
  },
  mealInfo: { padding: spacing.md },
  mealCategory: { ...typography.body.xs, color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  mealName: { ...typography.body.lg, color: colors.text.primary, marginTop: spacing.xxs, fontWeight: '600' },
  mealMeta: { flexDirection: 'row', marginTop: spacing.xs },
  mealCalories: { ...typography.body.sm, color: colors.text.muted },
  mealBottom: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: spacing.sm,
  },
  mealPrice: { ...typography.heading.sm, color: colors.text.primary },
  addButton: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  footerTagline: { padding: spacing.xxl, marginTop: spacing.lg },
  footerText: { ...typography.heading.xl, color: colors.text.placeholder, lineHeight: 32 },
});
