import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  StyleSheet, Image, Dimensions, RefreshControl, Modal, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useInfiniteSnacks, useSnackCategories } from '../../src/features/snacks/hooks/useSnacks';
import { useCartStore } from '../../src/features/cart/store/cart.store';
import { colors, spacing, shadows } from '../../src/shared/theme';
import { formatPrice, getImageUrl } from '../../src/shared/utils/helpers';
import { useDebounce } from '../../src/shared/utils/useDebounce';
import { FastList } from '../../src/shared/components/FastList';
import type { SnackItem } from '../../src/features/snacks/types/snack.types';
import { ProductReviews } from '../../src/features/catalog/components/ProductReviews';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - spacing.xl * 2 - spacing.md) / 2;

// 'all' sentinel = no server-side category filter.
const ALL_CATEGORY = 'all' as const;

// Decimal fields arrive from the API as strings; coerce and drop empties.
const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'string' ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? n : null;
};

// Cart line id — the 'snack-' prefix lets checkout map it to snack_item_id.
const cartIdFor = (snackId: number) => `snack-${snackId}`;

export default function SnacksScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const cartItems = useCartStore((s) => s.items);
  const totalItems = useCartStore((s) => s.totalItems);

  const { data: categories } = useSnackCategories();

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<number | typeof ALL_CATEGORY>(ALL_CATEGORY);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SnackItem | null>(null);

  // Server search runs only after the user pauses typing for 300ms.
  const debouncedSearch = useDebounce(search, 300);

  const {
    data,
    isLoading,
    isError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteSnacks({
    search: debouncedSearch.trim() || undefined,
    category: activeCategory === ALL_CATEGORY ? undefined : activeCategory,
  });

  const snacks = useMemo<SnackItem[]>(() => {
    if (!data) return [];
    return data.pages.flatMap((p) => p.items);
  }, [data]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const getCartQty = (snackId: number) => {
    const ci = cartItems.find((i) => i.id === cartIdFor(snackId));
    return ci?.qty || 0;
  };

  const handleAdd = (item: SnackItem) => {
    addItem({
      id: cartIdFor(item.id),
      name: item.name,
      price: num(item.price) ?? 0,
      image: item.image || undefined,
      calories: item.calories,
      category: item.category?.name,
    });
  };

  /* ─── Snack Grid Card ─── */
  const renderSnack = ({ item }: { item: SnackItem }) => {
    const price = num(item.price) ?? 0;
    const catName = item.category?.name || '';
    const qty = getCartQty(item.id);

    return (
      <TouchableOpacity
        style={styles.mealCard}
        onPress={() => setSelectedItem(item)}
        activeOpacity={0.85}
      >
        <View style={styles.mealImageWrap}>
          {item.image ? (
            <Image source={{ uri: getImageUrl(item.image) }} style={styles.mealImage} />
          ) : (
            <View style={styles.mealImageFallback}>
              <Ionicons name="fast-food-outline" size={28} color={colors.text.disabled} />
            </View>
          )}
        </View>

        <View style={styles.mealInfo}>
          <Text style={styles.mealName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.mealMeta} numberOfLines={1}>
            {catName}{catName && item.calories ? ' • ' : ''}{item.calories ? `${item.calories} kcal` : ''}
          </Text>

          <View style={styles.mealBottom}>
            <Text style={styles.mealPrice}>{formatPrice(price)}</Text>

            {qty > 0 ? (
              <View style={styles.qtyControls}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => updateQuantity(cartIdFor(item.id), qty - 1)}
                >
                  <Ionicons name="remove" size={14} color="#666" />
                </TouchableOpacity>
                <Text style={styles.qtyText}>{qty}</Text>
                <TouchableOpacity
                  style={[styles.qtyBtn, styles.qtyBtnPlus]}
                  onPress={() => updateQuantity(cartIdFor(item.id), qty + 1)}
                >
                  <Ionicons name="add" size={14} color="#1E6F3E" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.addBtn} onPress={() => handleAdd(item)}>
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
    const price = num(selectedItem.price) ?? 0;
    const qty = getCartQty(selectedItem.id);

    const macros = [
      { label: 'Calories', value: num(selectedItem.calories), unit: ' kcal', iconName: 'flame-outline', color: '#ff6b35' },
      { label: 'Protein', value: num(selectedItem.protein), unit: ' g', iconName: 'barbell-outline', color: '#8b5a2b' },
      { label: 'Carbs', value: num(selectedItem.carbs), unit: ' g', iconName: 'nutrition-outline', color: '#1e6f3e' },
      { label: 'Fats', value: num(selectedItem.fats), unit: ' g', iconName: 'water-outline', color: '#0099a3' },
      { label: 'Fiber', value: num(selectedItem.fiber), unit: ' g', iconName: 'leaf-outline', color: '#2c921d' },
    ].filter((m) => m.value !== null);

    const originalPrice = num(selectedItem.original_price);
    const showStrike = originalPrice !== null && originalPrice > price;
    const description = selectedItem.description || selectedItem.excerpt;

    return (
      <Modal visible animationType="fade" transparent onRequestClose={() => setSelectedItem(null)}>
        <BlurView intensity={20} tint="dark" style={styles.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setSelectedItem(null)}
          />
        </BlurView>

        <View style={[styles.modalSheetWrap, { paddingBottom: insets.bottom }]}>
          <View style={styles.modalCloseWrap}>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSelectedItem(null)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalSheet}>
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              <View style={styles.modalImageWrap}>
                {selectedItem.image ? (
                  <Image source={{ uri: getImageUrl(selectedItem.image) }} style={styles.modalImage} />
                ) : (
                  <View style={[styles.modalImage, { backgroundColor: colors.divider, justifyContent: 'center', alignItems: 'center' }]}>
                    <Ionicons name="fast-food-outline" size={48} color={colors.text.disabled} />
                  </View>
                )}
              </View>

              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{selectedItem.name}</Text>

                <View style={styles.modalPriceRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {showStrike && (
                      <Text style={styles.modalStrikePrice}>{formatPrice(originalPrice)}</Text>
                    )}
                    <Text style={styles.modalPrice}>{formatPrice(price)}</Text>
                  </View>

                  {qty > 0 ? (
                    <View style={styles.modalQtyControls}>
                      <TouchableOpacity
                        style={styles.modalQtyBtn}
                        onPress={() => updateQuantity(cartIdFor(selectedItem.id), qty - 1)}
                      >
                        <Ionicons name="remove" size={18} color="#4B8E3D" />
                      </TouchableOpacity>
                      <Text style={styles.modalQtyText}>{qty}</Text>
                      <TouchableOpacity
                        style={styles.modalQtyBtn}
                        onPress={() => updateQuantity(cartIdFor(selectedItem.id), qty + 1)}
                      >
                        <Ionicons name="add" size={18} color="#4B8E3D" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity style={styles.modalAddBtn} onPress={() => handleAdd(selectedItem)}>
                      <Text style={styles.modalAddBtnText}>Add to Cart</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {description ? <Text style={styles.modalDesc}>{description}</Text> : null}

                {macros.length > 0 && (
                  <View style={styles.macrosCard}>
                    <Text style={styles.macrosTitle}>Nutrition</Text>
                    <View style={styles.macrosRow}>
                      {macros.map((m) => (
                        <View key={m.label} style={styles.macroItem}>
                          <View style={styles.macroIcon}>
                            <Ionicons name={m.iconName as any} size={20} color={m.color} />
                          </View>
                          <Text style={styles.macroLabel}>{m.label}</Text>
                          <Text style={styles.macroValue}>{m.value}{m.unit}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
                <ProductReviews productType="snack" productId={selectedItem.id} />
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
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Healthy Snacks</Text>
          <TouchableOpacity onPress={() => router.push('/cart')} style={styles.cartBtn}>
            <Ionicons name="cart-outline" size={24} color="#fff" />
            {totalItems > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{totalItems}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for snacks"
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Category chips from /snack-categories/ */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          <TouchableOpacity
            style={[styles.filterPill, activeCategory === ALL_CATEGORY && styles.filterPillActive]}
            onPress={() => setActiveCategory(ALL_CATEGORY)}
          >
            <Text style={[styles.filterText, activeCategory === ALL_CATEGORY && styles.filterTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          {categories?.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.filterPill, activeCategory === cat.id && styles.filterPillActive]}
              onPress={() => setActiveCategory(cat.id)}
            >
              <Text style={[styles.filterText, activeCategory === cat.id && styles.filterTextActive]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      {/* ─── SNACKS GRID ─── */}
      <FastList<SnackItem>
        data={snacks}
        numColumns={2}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderSnack}
        extraData={cartItems}
        estimatedItemSize={210}
        contentContainerStyle={styles.gridContent}
        columnWrapperStyle={styles.gridRow}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            {isLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <>
                <Ionicons
                  name={isError ? 'cloud-offline-outline' : 'fast-food-outline'}
                  size={48}
                  color={colors.text.disabled}
                />
                <Text style={styles.emptyText}>
                  {isError ? 'Could not load snacks' : 'No snacks found'}
                </Text>
                {isError && (
                  <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
                    <Text style={styles.retryText}>Retry</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
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

      {renderModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FBF4' },

  /* ─ Header ─ */
  headerGradient: { paddingBottom: spacing.lg, paddingHorizontal: spacing.xl },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: spacing.lg,
  },
  backBtn: { padding: spacing.sm, marginLeft: -spacing.sm },
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
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: '#fff',
  },
  filterPillActive: { backgroundColor: '#0F3D21' },
  filterText: { fontSize: 13, fontWeight: '500', color: '#111' },
  filterTextActive: { color: '#fff' },

  /* ─ Grid ─ */
  gridContent: { paddingHorizontal: spacing.xl, paddingBottom: 140, paddingTop: spacing.lg },
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
  retryBtn: {
    marginTop: spacing.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm,
    backgroundColor: colors.primary, borderRadius: 999,
  },
  retryText: { color: '#fff', fontSize: 13, fontWeight: '600' },

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
    flexDirection: 'column', alignItems: 'center', maxHeight: '90%',
  },
  modalCloseWrap: { marginBottom: 24 },
  modalCloseBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center', ...shadows.lg,
  },
  modalSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32,
    width: '100%', overflow: 'hidden', height: '100%',
  },
  modalImageWrap: { width: '100%', height: 260 },
  modalImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  modalContent: { padding: 16 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#111' },
  modalPriceRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12,
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
    backgroundColor: '#4B8E3D', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 999,
  },
  modalAddBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  modalDesc: { fontSize: 13, color: '#6B7280', lineHeight: 20, marginTop: 16 },

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
