import React, { useState, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, Image, Dimensions, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMeals, useMealPlanTypes } from '../../src/features/catalog/hooks/useMeals';
import { useCartStore } from '../../src/features/cart/store/cart.store';
import { colors, spacing, borderRadius, typography, shadows } from '../../src/shared/theme';
import { formatPrice, getImageUrl } from '../../src/shared/utils/helpers';
import type { MealItem } from '../../src/features/catalog/types/meal.types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - spacing.xl * 2 - spacing.md) / 2;

const FILTER_TABS = ['All', 'Veg', 'Non-Veg', 'Keto', 'High Protein'];

export default function MenuScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: meals, isLoading, refetch } = useMeals();
  const { data: planTypes } = useMealPlanTypes();
  const addItem = useCartStore((s) => s.addItem);
  const totalItems = useCartStore((s) => s.totalItems);
  const totalPrice = useCartStore((s) => s.totalPrice);

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  const filteredMeals = useMemo(() => {
    let filtered = meals || [];
    if (search.trim()) {
      const s = search.toLowerCase();
      filtered = filtered.filter(m =>
        m.name.toLowerCase().includes(s) || m.description?.toLowerCase().includes(s)
      );
    }
    if (activeFilter !== 'All') {
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

  const renderMeal = ({ item }: { item: MealItem }) => {
    const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price || 0;
    const catName = item.category && typeof item.category === 'object' ? item.category.name : item.category_name || '';
    return (
      <TouchableOpacity
        style={styles.mealCard}
        onPress={() => router.push(`/meal/${item.id}`)}
        activeOpacity={0.85}
      >
        <View style={styles.mealImageWrap}>
          {item.image ? (
            <Image source={{ uri: getImageUrl(item.image) }} style={styles.mealImage} />
          ) : (
            <View style={styles.mealImageFallback}>
              <Ionicons name="restaurant" size={28} color={colors.text.disabled} />
            </View>
          )}
          {item.rating && (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={10} color="#FFD700" />
              <Text style={styles.ratingText}>{Number(item.rating).toFixed(1)}</Text>
            </View>
          )}
        </View>
        <View style={styles.mealInfo}>
          <Text style={styles.mealCat}>{catName}</Text>
          <Text style={styles.mealName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.mealCals}>{item.calories ? `${item.calories} kcal` : '—'}</Text>
          <View style={styles.mealBottom}>
            <Text style={styles.mealPrice}>{formatPrice(price)}</Text>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => addItem({
                id: String(item.id), name: item.name, price,
                image: item.image || undefined, calories: item.calories,
              })}
            >
              <Ionicons name="add" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Menu</Text>
        <TouchableOpacity onPress={() => router.push('/cart')} style={styles.cartBtn}>
          <Ionicons name="cart-outline" size={24} color={colors.text.primary} />
          {totalItems > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{totalItems}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.text.disabled} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search meals..."
            placeholderTextColor={colors.text.placeholder}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={colors.text.disabled} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <FlatList
        horizontal
        data={FILTER_TABS}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterChip, activeFilter === item && styles.filterChipActive]}
            onPress={() => setActiveFilter(item)}
          >
            <Text style={[styles.filterText, activeFilter === item && styles.filterTextActive]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Meals Grid */}
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

      {/* Floating Cart Bar */}
      {totalItems > 0 && (
        <TouchableOpacity
          style={[styles.floatingCart, { bottom: insets.bottom + 70 }]}
          onPress={() => router.push('/cart')}
          activeOpacity={0.9}
        >
          <View style={styles.floatingCartLeft}>
            <View style={styles.floatingCartBadge}>
              <Text style={styles.floatingCartBadgeText}>{totalItems}</Text>
            </View>
            <Text style={styles.floatingCartText}>View Cart</Text>
          </View>
          <Text style={styles.floatingCartPrice}>{formatPrice(totalPrice)}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
  },
  headerTitle: { ...typography.heading.xl, color: colors.text.primary },
  cartBtn: { position: 'relative', padding: spacing.sm },
  cartBadge: {
    position: 'absolute', top: 0, right: 0, backgroundColor: colors.primary,
    width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center',
  },
  cartBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  searchWrap: { paddingHorizontal: spacing.xl, marginBottom: spacing.md },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: borderRadius.lg, paddingHorizontal: spacing.lg, height: 44,
    borderWidth: 1, borderColor: colors.border, gap: spacing.sm,
  },
  searchInput: { flex: 1, ...typography.body.md, color: colors.text.primary },
  filterList: { paddingHorizontal: spacing.xl, gap: spacing.sm, marginBottom: spacing.md },
  filterChip: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.full,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { ...typography.body.sm, color: colors.text.secondary },
  filterTextActive: { color: '#fff' },
  gridContent: { paddingHorizontal: spacing.xl, paddingBottom: 140 },
  gridRow: { gap: spacing.md, marginBottom: spacing.md },
  mealCard: {
    width: CARD_WIDTH, backgroundColor: colors.surface, borderRadius: borderRadius.xl,
    overflow: 'hidden', borderWidth: 1, borderColor: colors.border, ...shadows.sm,
  },
  mealImageWrap: { width: '100%', height: 110, position: 'relative' },
  mealImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  mealImageFallback: {
    width: '100%', height: '100%', backgroundColor: colors.divider,
    justifyContent: 'center', alignItems: 'center',
  },
  ratingBadge: {
    position: 'absolute', top: spacing.sm, right: spacing.sm,
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  ratingText: { fontSize: 10, fontWeight: '600', color: colors.text.primary },
  mealInfo: { padding: spacing.md },
  mealCat: { ...typography.body.xs, color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  mealName: { ...typography.body.md, color: colors.text.primary, fontWeight: '600', marginTop: 2 },
  mealCals: { ...typography.body.sm, color: colors.text.muted, marginTop: 2 },
  mealBottom: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm,
  },
  mealPrice: { ...typography.heading.sm, color: colors.text.primary },
  addBtn: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  emptyWrap: { justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyText: { ...typography.body.md, color: colors.text.muted, marginTop: spacing.md },
  floatingCart: {
    position: 'absolute', left: spacing.xl, right: spacing.xl,
    backgroundColor: colors.primary, borderRadius: borderRadius.xl,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, ...shadows.lg,
  },
  floatingCartLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  floatingCartBadge: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center', alignItems: 'center',
  },
  floatingCartBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  floatingCartText: { ...typography.button.lg, color: '#fff' },
  floatingCartPrice: { ...typography.button.lg, color: '#fff' },
});
