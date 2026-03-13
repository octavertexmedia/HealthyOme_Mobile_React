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
import { useFeaturedMeals } from '../../src/features/catalog/hooks/useMeals';
import { useCartStore } from '../../src/features/cart/store/cart.store';
import { formatPrice, getImageUrl } from '../../src/shared/utils/helpers';

// SVG Imports
import CatSmoothie from '../../assets/images/figma/new_home/cat_smoothie.svg';
import CatSoup from '../../assets/images/figma/new_home/cat_soup.svg';
import CatSalads from '../../assets/images/figma/new_home/cat_salads.svg';
import CatMeals from '../../assets/images/figma/new_home/cat_meals.svg';
import CatMeals2 from '../../assets/images/figma/new_home/cat_meals_2.svg';
import HeroBgShape from '../../assets/images/figma/new_home/hero_bg_shape.svg';

const { width } = Dimensions.get('window');
// compute card width to fit inside horizontal padding (20px each side)
const CARD_WIDTH = width - 40;

const PROMOS = [
  {
    id: 1,
    title: "20% off 1st order, up to $10",
    description: "Get upto 20% off on your first order with code GET20OFF",
    bgColor: "#DFF4F4",
    img: require('../../assets/images/figma/new_home/promo_blue_right.png'),
    btnColor: "#0099A3",
    btnTextColor: "#fff",
  },
  {
    id: 2,
    title: "20% off 1st order, up to $10",
    description: "Get upto 20% off on your first order with code GET20OFF",
    bgColor: "#FFF5CD",
    img: require('../../assets/images/figma/new_home/promo_yellow_right.png'),
    btnColor: "#F5CD31",
    btnTextColor: "#111",
  },
];

const CATEGORIES = [
  { id: "1", name: "Smoothie", Icon: CatSmoothie },
  { id: "2", name: "Soup", Icon: CatSoup },
  { id: "3", name: "Salads", Icon: CatSalads },
  { id: "4", name: "Meals", Icon: CatMeals },
  { id: "5", name: "Meals", Icon: CatMeals2 },
];

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: featuredMeals, refetch: refetchMeals } = useFeaturedMeals();
  const addItem = useCartStore((s) => s.addItem);
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
            <TouchableOpacity style={styles.locationWrap}>
              <View style={styles.pinCircle}>
                <Ionicons name="location" size={20} color="#111" />
              </View>
              <View>
                <Text style={styles.locationText}>Pune</Text>
                <Text style={styles.addressText}>Address</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cartCircle} onPress={() => router.push('/cart')}>
              <Ionicons name="cart-outline" size={20} color="#111" />
            </TouchableOpacity>
          </View>

          {/* Hero Content */}
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>Healthy Eating,{'\n'}Made Effortless.</Text>
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

        {/* ─── PROMO CAROUSEL ─── */}
        <View style={{ marginTop: 12 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
          >
            {PROMOS.map((promo) => (
              <View key={promo.id} style={[styles.promoSliderCard, { backgroundColor: promo.bgColor }]}>
                {/* Right Image */}
                <Image source={promo.img} style={styles.promoSliderImg} resizeMode="cover" />
                
                {/* Content */}
                <View style={styles.promoSliderContent}>
                  <Text style={styles.promoSliderTitle}>{promo.title}</Text>
                  <Text style={styles.promoSliderDesc}>{promo.description}</Text>
                  
                  <TouchableOpacity style={[styles.promoSliderBtn, { backgroundColor: promo.btnColor }]}>
                    <Text style={[styles.promoSliderBtnText, { color: promo.btnTextColor, textTransform: 'capitalize' }]}>Learn more</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

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
                  <Text style={styles.subTitle}>Subscription Meals</Text>
                  <Text style={styles.subDesc}>Long-term habit builder</Text>
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
                  <Text style={styles.quickTitle}>Quick Meals</Text>
                  <Text style={[styles.subDesc, { marginTop: 4 }]}>Instant healthy delivery</Text>
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
                  <Text style={styles.quickTitle}>Consult a Dietician</Text>
                  <Text style={[styles.subDesc, { marginTop: 4 }]}>Personalized food guidance</Text>
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

        {/* ─── CATEGORIES ─── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeading}>Categories</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingVertical: 12 }}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity key={cat.id} style={styles.catItem} onPress={() => router.push('/(tabs)/menu')}>
              <cat.Icon width={56} height={56} style={{ marginBottom: 8 }} />
              <Text style={styles.catLabel}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ─── FEATURED MEALS ─── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeading}>Featured Meal</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 16, marginTop: 16 }}
        >
          {featuredMeals ? featuredMeals.slice(0, 4).map((meal) => {
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
            <Text style={{ marginLeft: 20 }}>Loading featured meals...</Text>
          )}
        </ScrollView>

        {/* ─── FOOTER ─── */}
        <View style={styles.footerWrap}>
          <Text style={styles.footerText}>
            Serving select areas to keep meals fresh and healthy 🌱
          </Text>
        </View>

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

  /* Section Headings */
  sectionHeader: { paddingHorizontal: 20, marginTop: 24 },
  sectionHeading: { fontSize: 18, fontWeight: '600', color: '#111' },

  /* Categories */
  catItem: { alignItems: 'center', width: 74 },
  catIcon: { width: 56, height: 56, marginBottom: 8 },
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
