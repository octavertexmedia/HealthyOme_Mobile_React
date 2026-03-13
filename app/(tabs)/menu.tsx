import React, { useState, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, Image, Dimensions, RefreshControl, Modal, ScrollView, TouchableWithoutFeedback,
} from 'react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMeals } from '../../src/features/catalog/hooks/useMeals';
import { useCartStore } from '../../src/features/cart/store/cart.store';
import { colors, spacing, borderRadius, typography, shadows } from '../../src/shared/theme';
import { formatPrice, getImageUrl } from '../../src/shared/utils/helpers';
import type { MealItem } from '../../src/features/catalog/types/meal.types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - spacing.xl * 2 - spacing.md) / 2;

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'bowl', label: 'Bowl' },
  { id: 'soups', label: 'Soups' },
  { id: 'salads', label: 'Salads' },
  { id: 'smoothie', label: 'Smoothie' },
];

export default function MenuScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: meals, isLoading, refetch } = useMeals();
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const cartItems = useCartStore((s) => s.items);
  const totalItems = useCartStore((s) => s.totalItems);
  const totalPrice = useCartStore((s) => s.totalPrice);

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MealItem | null>(null);

  const filteredMeals = useMemo(() => {
    let filtered = meals || [];
    if (search.trim()) {
      const s = search.toLowerCase();
      filtered = filtered.filter(m =>
        m.name.toLowerCase().includes(s) || m.description?.toLowerCase().includes(s)
      );
    }
    if (activeFilter !== 'all') {
      filtered = filtered.filter(m => {
        const cat = m.category && typeof m.category === 'object' ? m.category.name : m.category_name || '';
        return cat.toLowerCase().includes(activeFilter.toLowerCase());
      });
    }
    return filtered;
  }, [meals, search, activeFilter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const getCartQty = (itemId: string | number) => {
    const ci = cartItems.find(i => i.id === String(itemId));
    return ci?.qty || 0;
  };

  const handleAdd = (item: MealItem) => {
    const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price || 0;
    addItem({
      id: String(item.id), name: item.name, price,
      image: item.image || undefined, calories: item.calories,
    });
  };

  /* ─── Meal Grid Card ─── */
  const renderMeal = ({ item }: { item: MealItem }) => {
    const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price || 0;
    const catName = item.category && typeof item.category === 'object' ? item.category.name : item.category_name || '';
    const qty = getCartQty(item.id);

    return (
      <TouchableOpacity
        style={styles.mealCard}
        onPress={() => setSelectedItem(item)}
        activeOpacity={0.85}
      >
        {/* Image */}
        <View style={styles.mealImageWrap}>
          {item.image ? (
            <Image source={{ uri: getImageUrl(item.image) }} style={styles.mealImage} />
          ) : (
            <View style={styles.mealImageFallback}>
              <Ionicons name="restaurant" size={28} color={colors.text.disabled} />
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.mealInfo}>
          <Text style={styles.mealName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.mealMeta}>{catName}{catName && item.calories ? ' • ' : ''}{item.calories ? `${item.calories} kcal` : ''}</Text>

          {/* Price + Add */}
          <View style={styles.mealBottom}>
            <Text style={styles.mealPrice}>{formatPrice(price)}</Text>

            {qty > 0 ? (
              <View style={styles.qtyControls}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => updateQuantity(String(item.id), qty - 1)}
                >
                  <Ionicons name="remove" size={14} color="#666" />
                </TouchableOpacity>
                <Text style={styles.qtyText}>{qty}</Text>
                <TouchableOpacity
                  style={[styles.qtyBtn, styles.qtyBtnPlus]}
                  onPress={() => updateQuantity(String(item.id), qty + 1)}
                >
                  <Ionicons name="add" size={14} color="#1E6F3E" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => handleAdd(item)}
              >
                <Ionicons name="add" size={16} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  /* ─── Item Detail Modal ─── */
  const renderModal = () => {
    if (!selectedItem) return null;
    const price = typeof selectedItem.price === 'string' ? parseFloat(selectedItem.price) : selectedItem.price || 0;
    const qty = getCartQty(selectedItem.id);

    const macros = [
      { label: 'Calories', value: selectedItem.calories ? `${selectedItem.calories} kcal` : '289 kcal', iconName: 'flame-outline', color: '#ff6b35' },
      { label: 'Protein', value: '21 g', iconName: 'barbell-outline', color: '#8b5a2b' },
      { label: 'Carbs', value: '16 g', iconName: 'nutrition-outline', color: '#1e6f3e' },
      { label: 'Fats', value: '14 g', iconName: 'water-outline', color: '#0099a3' },
      { label: 'Fiber', value: '8 g', iconName: 'leaf-outline', color: '#2c921d' },
    ];

    return (
      <Modal visible animationType="fade" transparent onRequestClose={() => setSelectedItem(null)}>
        {/* Backdrop */}
        <BlurView intensity={20} tint="dark" style={styles.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setSelectedItem(null)}
          />
        </BlurView>

        {/* Sheet Wrap */}
        <View style={[styles.modalSheetWrap, { paddingBottom: insets.bottom }]}>
          {/* Close Button Above Sheet */}
          <View style={styles.modalCloseWrap}>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSelectedItem(null)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Actual Sheet Content */}
          <View style={styles.modalSheet}>
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              {/* Image */}
              <View style={styles.modalImageWrap}>
                {selectedItem.image ? (
                  <Image source={{ uri: getImageUrl(selectedItem.image) }} style={styles.modalImage} />
                ) : (
                  <View style={[styles.modalImage, { backgroundColor: colors.divider, justifyContent: 'center', alignItems: 'center' }]}>
                    <Ionicons name="restaurant" size={48} color={colors.text.disabled} />
                  </View>
                )}
              </View>

            {/* Content */}
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{selectedItem.name}</Text>

              <View style={styles.modalRatingRow}>
                <Text>⭐</Text>
                <Text style={styles.modalRating}>{selectedItem.rating ? Number(selectedItem.rating).toFixed(1) : '4.9'}</Text>
                <Text style={styles.modalSold}>(156 sold)</Text>
              </View>

              {/* Price + Cart */}
              <View style={styles.modalPriceRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.modalStrikePrice}>₹419.00</Text>
                  <Text style={styles.modalPrice}>{formatPrice(price)}</Text>
                </View>

                {qty > 0 ? (
                  <View style={styles.modalQtyControls}>
                    <TouchableOpacity
                      style={styles.modalQtyBtn}
                      onPress={() => updateQuantity(String(selectedItem.id), qty - 1)}
                    >
                      <Ionicons name="remove" size={18} color="#4B8E3D" />
                    </TouchableOpacity>
                    <Text style={styles.modalQtyText}>{qty}</Text>
                    <TouchableOpacity
                      style={styles.modalQtyBtn}
                      onPress={() => updateQuantity(String(selectedItem.id), qty + 1)}
                    >
                      <Ionicons name="add" size={18} color="#4B8E3D" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.modalAddBtn}
                    onPress={() => handleAdd(selectedItem)}
                  >
                    <Text style={styles.modalAddBtnText}>Add to Cart</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Description */}
              <Text style={styles.modalDesc}>
                {selectedItem.description ||
                  'Crisp romaine hearts topped with succulent pulled chicken, crunchy herb-seasoned croutons, and shavings of aged Parmesan.'}
              </Text>

              {/* Macros */}
              <View style={styles.macrosCard}>
                <Text style={styles.macrosTitle}>Macros</Text>
                <View style={styles.macrosRow}>
                  {macros.map((m) => (
                    <View key={m.label} style={styles.macroItem}>
                      <View style={styles.macroIcon}>
                        <Ionicons name={m.iconName as any} size={20} color={m.color} />
                      </View>
                      <Text style={styles.macroLabel}>{m.label}</Text>
                      <Text style={styles.macroValue}>{m.value}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      {/* ─── GREEN GRADIENT HEADER ─── */}
      <LinearGradient
        colors={['#7BAA5C', '#1E6F3E']}
        style={[styles.headerGradient, { paddingTop: insets.top + 8 }]}
      >
        {/* Top Bar */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Menu</Text>
          <TouchableOpacity onPress={() => router.push('/cart')} style={styles.cartBtn}>
            <Ionicons name="cart-outline" size={24} color="#fff" />
            {totalItems > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{totalItems}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for meals"
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity>
              <Ionicons name="mic" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.id}
              style={[styles.filterPill, activeFilter === f.id && styles.filterPillActive]}
              onPress={() => setActiveFilter(f.id)}
            >
              <Text style={[styles.filterText, activeFilter === f.id && styles.filterTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      {/* ─── HERO CARD (overlapping header) ─── */}
      <View style={styles.heroCardWrap}>
        <TouchableOpacity
          activeOpacity={0.95}
          onPress={() => router.push('/bowl-builder')}
        >
          <LinearGradient
            colors={['#0F3D21', '#1E6F3E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.heroCard}
          >
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>Most Popular</Text>
            </View>
            <Text style={styles.heroTitle}>Make your own Bowl</Text>
            <Text style={styles.heroSubtitle}>Tailor your nutrition exactly how you like it.</Text>
            {/* Decorative images to match 'Make your own Bowl' most popular card */}
            <Image 
              source={require('../../assets/images/figma/new_home/hero_lobster.png')}
              style={styles.heroImgTopRight}
            />
            <Image 
              source={require('../../assets/images/figma/new_home/hero_lobster.png')}
              style={styles.heroImgBottomRight}
            />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* ─── MEALS GRID ─── */}
      <FlatList
        data={filteredMeals}
        numColumns={2}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderMeal}
        contentContainerStyle={styles.gridContent}
        columnWrapperStyle={styles.gridRow}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="restaurant-outline" size={48} color={colors.text.disabled} />
            <Text style={styles.emptyText}>{isLoading ? 'Loading meals...' : 'No meals found'}</Text>
          </View>
        }
      />

      {totalItems > 0 && (
        <View style={[styles.floatingCartWrap, { bottom: insets.bottom + 15 }]}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push('/cart')}
            style={styles.floatingCart}
          >
            <View style={styles.floatingCartLeftIconWrap}>
              <Ionicons name="cart-outline" size={18} color="#fff" />
            </View>
            <View style={styles.floatingCartCenter}>
              <Text style={styles.floatingCartLabel}>View Cart</Text>
              <Text style={styles.floatingCartSub}>{totalItems} items</Text>
            </View>
            <View style={styles.floatingCartRightIconWrap}>
              <Ionicons name="chevron-forward" size={18} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Detail Modal */}
      {renderModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FBF4' },

  /* ─ Header ─ */
  headerGradient: { paddingBottom: 56, paddingHorizontal: spacing.xl },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff' },
  cartBtn: { position: 'relative', padding: spacing.sm },
  cartBadge: {
    position: 'absolute', top: 0, right: 0, backgroundColor: '#FF6B35',
    width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center',
  },
  cartBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  /* ─ Search ─ */
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 999, paddingHorizontal: 16, height: 48, gap: 8,
    marginBottom: spacing.lg,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#111' },

  /* ─ Filters ─ */
  filterRow: { gap: 10, paddingBottom: 4 },
  filterPill: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999,
    backgroundColor: '#fff',
  },
  filterPillActive: { backgroundColor: '#0F3D21' },
  filterText: { fontSize: 13, fontWeight: '500', color: '#111' },
  filterTextActive: { color: '#fff' },

  /* ─ Hero Card ─ */
  heroCardWrap: {
    paddingHorizontal: spacing.xl, marginTop: -40, marginBottom: spacing.lg, zIndex: 10,
  },
  heroCard: {
    borderRadius: 16, padding: 16, position: 'relative', overflow: 'hidden',
  },
  heroBadge: {
    backgroundColor: '#fff', alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, marginBottom: 24,
  },
  heroBadgeText: { fontSize: 11, fontWeight: '600', color: '#1E6F3E' },
  heroTitle: { fontSize: 18, fontWeight: '600', color: '#fff' },
  heroSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4, maxWidth: '75%' },
  heroImgTopRight: {
    position: 'absolute', right: -30, top: -45, width: 110, height: 110, resizeMode: 'cover',
  },
  heroImgBottomRight: {
    position: 'absolute', right: -50, top: 15, width: 110, height: 110, resizeMode: 'cover',
  },

  /* ─ Grid ─ */
  gridContent: { paddingHorizontal: spacing.xl, paddingBottom: 140, paddingTop: 4 },
  gridRow: { gap: spacing.md, marginBottom: spacing.md },
  mealCard: {
    width: CARD_WIDTH, backgroundColor: '#fff', borderRadius: 16,
    overflow: 'hidden', ...shadows.sm,
  },
  mealImageWrap: { width: '100%', height: 112, backgroundColor: '#F1F5F1' },
  mealImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  mealImageFallback: {
    width: '100%', height: '100%', backgroundColor: '#F1F5F1',
    justifyContent: 'center', alignItems: 'center',
  },
  mealInfo: { padding: 12 },
  mealName: { fontSize: 13, fontWeight: '600', color: '#111', lineHeight: 17 },
  mealMeta: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  mealBottom: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8,
  },
  mealPrice: { fontSize: 14, fontWeight: '600', color: '#111' },

  /* Qty controls on card */
  qtyControls: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 2,
    borderColor: '#1E6F3E', borderRadius: 999, overflow: 'hidden',
  },
  qtyBtn: { width: 28, height: 28, justifyContent: 'center', alignItems: 'center' },
  qtyBtnPlus: { backgroundColor: '#E8F5E9' },
  qtyText: { width: 22, textAlign: 'center', fontSize: 13, fontWeight: '600' },

  addBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#1E6F3E', justifyContent: 'center', alignItems: 'center',
  },

  /* ─ Empty ─ */
  emptyWrap: { justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: colors.text.muted, marginTop: spacing.md },

  /* ─ Floating Cart ─ */
  floatingCartWrap: {
    position: 'absolute', width: '100%', alignItems: 'center', zIndex: 50,
  },
  floatingCart: {
    backgroundColor: '#04360F', flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 8, paddingVertical: 8, borderRadius: 40,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 16,
  },
  floatingCartLeftIconWrap: { backgroundColor: '#007A1A', padding: 8, borderRadius: 20 },
  floatingCartCenter: { flexDirection: 'column' },
  floatingCartLabel: { fontSize: 15, fontWeight: '600', color: '#fff', lineHeight: 18 },
  floatingCartSub: { fontSize: 13, fontWeight: '400', color: '#fff', lineHeight: 16 },
  floatingCartRightIconWrap: { backgroundColor: '#2C921D', padding: 8, borderRadius: 20 },

  /* ─── Modal ─── */
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalSheetWrap: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'column', alignItems: 'center',
    maxHeight: '90%',
  },
  modalCloseWrap: {
    marginBottom: 24,
  },
  modalCloseBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center', ...shadows.lg,
  },
  modalSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32,
    width: '100%', overflow: 'hidden', height: '100%'
  },
  modalImageWrap: { width: '100%', height: 260 },
  modalImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  modalContent: { padding: 16 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#111' },
  modalRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  modalRating: { fontSize: 13, fontWeight: '500', color: '#374151' },
  modalSold: { fontSize: 13, color: '#9CA3AF' },
  modalPriceRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 12,
  },
  modalStrikePrice: { fontSize: 13, color: '#9CA3AF', textDecorationLine: 'line-through' },
  modalPrice: { fontSize: 24, fontWeight: '700', color: '#111' },
  modalQtyControls: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 2,
    borderColor: '#4B8E3D', borderRadius: 999, overflow: 'hidden',
  },
  modalQtyBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  modalQtyText: { width: 32, textAlign: 'center', fontSize: 15, fontWeight: '600' },
  modalAddBtn: {
    backgroundColor: '#4B8E3D', paddingHorizontal: 24, paddingVertical: 10,
    borderRadius: 999,
  },
  modalAddBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  modalDesc: { fontSize: 13, color: '#6B7280', lineHeight: 20, marginTop: 16 },

  /* Macros card */
  macrosCard: {
    backgroundColor: '#0F3D21', borderRadius: 16, padding: 16, marginTop: 24,
  },
  macrosTitle: { color: '#fff', fontWeight: '600', fontSize: 13, marginBottom: 16 },
  macrosRow: { flexDirection: 'row', justifyContent: 'space-between' },
  macroItem: { alignItems: 'center', flex: 1 },
  macroIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center', marginBottom: 6,
  },
  macroLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)' },
  macroValue: { fontSize: 11, fontWeight: '600', color: '#fff', marginTop: 2 },
});
