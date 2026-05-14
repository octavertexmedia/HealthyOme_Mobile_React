import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Dimensions, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMeal } from '../../src/features/catalog/hooks/useMeals';
import { reviewsApi, type MealReview } from '../../src/features/catalog/api/reviews.api';
import { useCartStore } from '../../src/features/cart/store/cart.store';
import { cartApi } from '../../src/features/cart/api/cart.api';
import { useAuthStore } from '../../src/features/auth/store/auth.store';
import { colors, spacing, borderRadius, typography, shadows } from '../../src/shared/theme';
import { formatPrice, getImageUrl } from '../../src/shared/utils/helpers';
import Loading from '../../src/shared/components/Loading';

const { width } = Dimensions.get('window');

export default function MealDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const mealId = Number(id);
  const { data: meal, isLoading } = useMeal(mealId);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const addItem = useCartStore((s) => s.addItem);
  const hydrateFromServer = useCartStore((s) => s.hydrateFromServer);
  const [qty, setQty] = React.useState(1);

  const reviewsQuery = useQuery<MealReview[]>({
    queryKey: ['reviews', 'meal', mealId],
    queryFn: () => reviewsApi.forMeal(mealId),
    enabled: Number.isFinite(mealId),
    staleTime: 60 * 1000,
  });

  const addToServerCart = useMutation({
    mutationFn: (variables: { mealItemId: number; quantity: number }) =>
      cartApi.add(variables.mealItemId, variables.quantity),
    onSuccess: (server) => {
      hydrateFromServer(server);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  if (isLoading || !meal) return <Loading fullScreen />;

  const price = typeof meal.price === 'string' ? parseFloat(meal.price) : meal.price || 0;
  const catName = meal.category && typeof meal.category === 'object' ? meal.category.name : 'Other';

  const nutritionItems = [
    { label: 'Calories', value: meal.calories ? `${meal.calories}` : '—', unit: 'kcal', icon: '🔥' },
    { label: 'Protein', value: meal.protein ? `${meal.protein}` : '—', unit: 'g', icon: '💪' },
    { label: 'Carbs', value: meal.carbs ? `${meal.carbs}` : '—', unit: 'g', icon: '🌾' },
    { label: 'Fats', value: meal.fats ? `${meal.fats}` : '—', unit: 'g', icon: '🥑' },
    { label: 'Fiber', value: meal.fiber ? `${meal.fiber}` : '—', unit: 'g', icon: '🥬' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image */}
        <View style={styles.imageContainer}>
          {meal.image ? (
            <Image source={{ uri: getImageUrl(meal.image) }} style={styles.image} />
          ) : (
            <View style={styles.imageFallback}>
              <Ionicons name="restaurant" size={64} color={colors.text.disabled} />
            </View>
          )}
          <TouchableOpacity style={[styles.backBtn, { top: spacing.sm }]} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.category}>{catName}</Text>
          <Text style={styles.name}>{meal.name}</Text>

          {meal.rating && (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.ratingText}>{Number(meal.rating).toFixed(1)}</Text>
            </View>
          )}

          <Text style={styles.price}>{formatPrice(price)}</Text>
          {meal.original_price && Number(meal.original_price) > price && (
            <Text style={styles.originalPrice}>{formatPrice(meal.original_price)}</Text>
          )}

          {meal.description && (
            <View style={styles.descSection}>
              <Text style={styles.sectionTitle}>About this meal</Text>
              <Text style={styles.description}>{meal.description}</Text>
            </View>
          )}

          {/* Nutrition */}
          <Text style={styles.sectionTitle}>Nutrition Info</Text>
          <View style={styles.nutritionGrid}>
            {nutritionItems.map((item) => (
              <View key={item.label} style={styles.nutritionCard}>
                <Text style={styles.nutritionIcon}>{item.icon}</Text>
                <Text style={styles.nutritionValue}>{item.value}<Text style={styles.nutritionUnit}>{item.unit}</Text></Text>
                <Text style={styles.nutritionLabel}>{item.label}</Text>
              </View>
            ))}
          </View>

          {/* Reviews */}
          <Text style={styles.sectionTitle}>Reviews</Text>
          {reviewsQuery.isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 12 }} />
          ) : (reviewsQuery.data ?? []).length === 0 ? (
            <Text style={styles.reviewEmpty}>No reviews yet — be the first after your order.</Text>
          ) : (
            (reviewsQuery.data ?? []).slice(0, 5).map((r) => (
              <View key={r.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewName}>{r.user_name || 'Customer'}</Text>
                  <View style={styles.reviewStars}>
                    <Ionicons name="star" size={12} color="#F5A623" />
                    <Text style={styles.reviewRating}>{Number(r.rating).toFixed(1)}</Text>
                  </View>
                </View>
                {r.comment ? <Text style={styles.reviewComment}>{r.comment}</Text> : null}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.qtyControl}>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty(Math.max(1, qty - 1))}>
            <Ionicons name="remove" size={20} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.qtyText}>{qty}</Text>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty(qty + 1)}>
            <Ionicons name="add" size={20} color={colors.text.primary} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.addToCartBtn, addToServerCart.isPending && { opacity: 0.7 }]}
          disabled={addToServerCart.isPending}
          onPress={() => {
            // Optimistic — Zustand update immediately for instant feel.
            addItem({
              id: String(meal.id),
              name: meal.name,
              price,
              image: meal.image || undefined,
              quantity: qty,
            });
            // Server sync — only when authenticated. If it fails, the cart-sync
            // hook will reconcile on next login.
            if (isAuthenticated) {
              addToServerCart.mutate({ mealItemId: meal.id, quantity: qty });
            }
            router.back();
          }}
        >
          {addToServerCart.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.addToCartText}>Add to Cart · {formatPrice(price * qty)}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  imageContainer: { width, height: 280, position: 'relative' },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  imageFallback: { width: '100%', height: '100%', backgroundColor: colors.divider, justifyContent: 'center', alignItems: 'center' },
  backBtn: {
    position: 'absolute', left: spacing.lg, width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center', ...shadows.md,
  },
  content: { padding: spacing.xl },
  category: { ...typography.body.xs, color: colors.primary, textTransform: 'uppercase', letterSpacing: 1 },
  name: { ...typography.heading.xl, color: colors.text.primary, marginTop: spacing.xs },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.sm },
  ratingText: { ...typography.body.md, color: colors.text.primary, fontWeight: '600' },
  price: { ...typography.heading.xl, color: colors.primary, marginTop: spacing.md, fontSize: 28 },
  originalPrice: { ...typography.body.lg, color: colors.text.disabled, textDecorationLine: 'line-through' },
  descSection: { marginTop: spacing.xxl },
  sectionTitle: { ...typography.heading.md, color: colors.text.primary, marginBottom: spacing.md, marginTop: spacing.lg },
  description: { ...typography.body.lg, color: colors.text.secondary, lineHeight: 24 },
  nutritionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: 120 },
  nutritionCard: {
    width: (width - spacing.xl * 2 - spacing.md * 2) / 3, backgroundColor: colors.surface,
    borderRadius: borderRadius.lg, padding: spacing.md, alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  nutritionIcon: { fontSize: 20, marginBottom: spacing.xs },
  nutritionValue: { ...typography.heading.sm, color: colors.text.primary },
  nutritionUnit: { ...typography.body.xs, color: colors.text.muted },
  nutritionLabel: { ...typography.body.xs, color: colors.text.muted, marginTop: 2 },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg, gap: spacing.lg, ...shadows.lg,
  },
  qtyControl: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  qtyBtn: {
    width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  qtyText: { ...typography.heading.sm, color: colors.text.primary, minWidth: 24, textAlign: 'center' },
  addToCartBtn: {
    flex: 1, backgroundColor: colors.primary, borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg, alignItems: 'center',
  },
  addToCartText: { ...typography.button.lg, color: '#fff' },

  reviewEmpty: { ...typography.body.md, color: colors.text.muted, marginBottom: 120 },
  reviewCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewName: { ...typography.body.md, color: colors.text.primary, fontWeight: '600' },
  reviewStars: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reviewRating: { ...typography.body.sm, color: colors.text.primary, fontWeight: '600' },
  reviewComment: { ...typography.body.sm, color: colors.text.secondary, marginTop: 4, lineHeight: 18 },
});
