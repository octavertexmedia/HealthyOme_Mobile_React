import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { bowlApi } from '../../src/features/bowl/api/bowl.api';
import { useBowlStore } from '../../src/features/bowl/store/bowl.store';
import { useCartStore } from '../../src/features/cart/store/cart.store';
import { colors, spacing, borderRadius, typography, shadows } from '../../src/shared/theme';
import { formatPrice } from '../../src/shared/utils/helpers';
import Loading from '../../src/shared/components/Loading';
import Button from '../../src/shared/components/Button';

const { width } = Dimensions.get('window');

export default function BowlBuilderScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { base, ingredients, preparation, totalPrice, setBase, toggleIngredient, setPreparation, reset } = useBowlStore();
  const addItem = useCartStore((s) => s.addItem);

  const { data: bases, isLoading: loadingBases } = useQuery({
    queryKey: ['bowlBases'],
    queryFn: bowlApi.getBases,
  });

  const { data: allIngredients, isLoading: loadingIngredients } = useQuery({
    queryKey: ['bowlIngredients'],
    queryFn: () => bowlApi.getIngredients(),
  });

  if (loadingBases || loadingIngredients) return <Loading fullScreen />;

  const ingredientTypes = ['vegetables', 'proteins', 'dressings', 'seeds', 'extras'];
  const groupedIngredients: Record<string, any[]> = {};
  (allIngredients || []).forEach((ing: any) => {
    const type = ing.ingredient_type || 'extras';
    if (!groupedIngredients[type]) groupedIngredients[type] = [];
    groupedIngredients[type].push(ing);
  });

  const handleAddToCart = () => {
    if (!base) return;
    const bowlName = `Custom Bowl (${base.name})`;
    addItem({
      id: `bowl-${Date.now()}`,
      name: bowlName,
      price: totalPrice,
      meta: { base, ingredients, preparation },
    });
    reset();
    router.back();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { reset(); router.back(); }}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Build Your Bowl</Text>
        <TouchableOpacity onPress={reset}>
          <Ionicons name="refresh" size={22} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Bowl Preview */}
        <View style={styles.preview}>
          <Text style={{ fontSize: 56 }}>🥣</Text>
          <Text style={styles.previewTitle}>{base ? base.name : 'Choose a base'}</Text>
          <Text style={styles.previewIngredients}>
            {ingredients.length > 0 ? `+ ${ingredients.length} toppings` : 'Add your toppings'}
          </Text>
          <Text style={styles.previewPrice}>{formatPrice(totalPrice)}</Text>
        </View>

        {/* Base Selection */}
        <Text style={styles.sectionTitle}>Choose Your Base</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {(bases || []).map((b: any) => (
            <TouchableOpacity
              key={b.id}
              style={[styles.baseCard, base?.id === b.id && styles.baseCardActive]}
              onPress={() => setBase(b)}
            >
              <Text style={styles.baseIcon}>🍚</Text>
              <Text style={[styles.baseName, base?.id === b.id && styles.baseNameActive]}>{b.name}</Text>
              <Text style={[styles.basePrice, base?.id === b.id && styles.basePriceActive]}>{formatPrice(b.price)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Preparation */}
        <Text style={styles.sectionTitle}>Preparation</Text>
        <View style={styles.prepRow}>
          {(['warm', 'cold'] as const).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.prepChip, preparation === p && styles.prepChipActive]}
              onPress={() => setPreparation(p)}
            >
              <Text style={{ fontSize: 18 }}>{p === 'warm' ? '🔥' : '❄️'}</Text>
              <Text style={[styles.prepText, preparation === p && styles.prepTextActive]}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Ingredients by type */}
        {ingredientTypes.map((type) => {
          const items = groupedIngredients[type];
          if (!items || items.length === 0) return null;
          return (
            <View key={type}>
              <Text style={styles.sectionTitle}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
              <View style={styles.ingredientGrid}>
                {items.map((ing: any) => {
                  const selected = ingredients.some(i => i.id === ing.id);
                  return (
                    <TouchableOpacity
                      key={ing.id}
                      style={[styles.ingredientChip, selected && styles.ingredientChipActive]}
                      onPress={() => toggleIngredient(ing)}
                    >
                      <Text style={[styles.ingredientName, selected && styles.ingredientNameActive]}>
                        {ing.name}
                      </Text>
                      <Text style={[styles.ingredientPrice, selected && styles.ingredientPriceActive]}>
                        +{formatPrice(ing.price)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button
          title={`Add Bowl to Cart · ${formatPrice(totalPrice)}`}
          onPress={handleAddToCart}
          disabled={!base}
          fullWidth
          size="lg"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
  },
  headerTitle: { ...typography.heading.lg, color: colors.text.primary },
  scrollContent: { paddingHorizontal: spacing.xl },
  preview: {
    alignItems: 'center', paddingVertical: spacing.xxl, marginBottom: spacing.lg,
    backgroundColor: colors.surface, borderRadius: borderRadius.xl,
    borderWidth: 1, borderColor: colors.border, ...shadows.sm,
  },
  previewTitle: { ...typography.heading.md, color: colors.text.primary, marginTop: spacing.md },
  previewIngredients: { ...typography.body.md, color: colors.text.secondary, marginTop: spacing.xs },
  previewPrice: { ...typography.heading.xl, color: colors.primary, marginTop: spacing.md, fontSize: 28 },
  sectionTitle: { ...typography.heading.sm, color: colors.text.primary, marginBottom: spacing.md, marginTop: spacing.lg },
  horizontalScroll: { marginBottom: spacing.md },
  baseCard: {
    width: 100, padding: spacing.lg, alignItems: 'center', borderRadius: borderRadius.xl,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    marginRight: spacing.md, ...shadows.sm,
  },
  baseCardActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  baseIcon: { fontSize: 28, marginBottom: spacing.sm },
  baseName: { ...typography.body.sm, color: colors.text.primary, fontWeight: '600', textAlign: 'center' },
  baseNameActive: { color: colors.primary },
  basePrice: { ...typography.body.xs, color: colors.text.muted, marginTop: 2 },
  basePriceActive: { color: colors.primary },
  prepRow: { flexDirection: 'row', gap: spacing.md },
  prepChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    paddingVertical: spacing.lg, borderRadius: borderRadius.lg, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
  },
  prepChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  prepText: { ...typography.body.lg, color: colors.text.secondary, fontWeight: '600' },
  prepTextActive: { color: colors.primary },
  ingredientGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  ingredientChip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  ingredientChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  ingredientName: { ...typography.body.sm, color: colors.text.primary },
  ingredientNameActive: { color: colors.primary, fontWeight: '600' },
  ingredientPrice: { ...typography.body.xs, color: colors.text.muted, textAlign: 'center' },
  ingredientPriceActive: { color: colors.primary },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
    paddingHorizontal: spacing.xl, paddingTop: spacing.lg,
  },
});
