import React, { useMemo, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { bowlApi } from '../../src/features/bowl/api/bowl.api';
import { useBowlStore } from '../../src/features/bowl/store/bowl.store';
import { useCartStore } from '../../src/features/cart/store/cart.store';
import { useAuthStore } from '../../src/features/auth/store/auth.store';

type Tab = 'base' | 'veggie' | 'protein' | 'seeds' | 'dressing' | 'style';

const TABS: { id: Tab; label: string; icon: any; required?: boolean }[] = [
  { id: 'base', label: 'Base', icon: 'restaurant-outline', required: true },
  { id: 'veggie', label: 'Veggies', icon: 'leaf-outline' },
  { id: 'protein', label: 'Protein', icon: 'barbell-outline' },
  { id: 'seeds', label: 'Toppings', icon: 'nutrition-outline' },
  { id: 'dressing', label: 'Sauces', icon: 'water-outline' },
  { id: 'style', label: 'Style', icon: 'flame-outline' },
];

const TYPE_MAP: Record<string, Tab> = {
  vegetables: 'veggie',
  veggie: 'veggie',
  proteins: 'protein',
  protein: 'protein',
  seeds_nuts: 'seeds',
  seeds: 'seeds',
  dressing: 'dressing',
  gravy: 'dressing',
};

const { width } = Dimensions.get('window');
const CARD_W = (width - 20 * 2 - 12) / 2;

export default function BowlBuilderScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const addItem = useCartStore((s) => s.addItem);

  const { base, ingredients, preparation, totalPrice, setBase, toggleIngredient, setPreparation, reset } =
    useBowlStore();

  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<Tab>('base');
  const sectionRefs = useRef<Partial<Record<Tab, number>>>({});
  const scrollRef = useRef<ScrollView | null>(null);

  const basesQuery = useQuery({ queryKey: ['bowlBases'], queryFn: bowlApi.getBases });
  const ingredientsQuery = useQuery({
    queryKey: ['bowlIngredients'],
    queryFn: () => bowlApi.getIngredients(),
  });

  const grouped = useMemo(() => {
    const acc: Record<Tab, any[]> = {
      base: [],
      veggie: [],
      protein: [],
      seeds: [],
      dressing: [],
      style: [],
    };
    (ingredientsQuery.data ?? []).forEach((i: any) => {
      const t = TYPE_MAP[i.ingredient_type] ?? 'seeds';
      acc[t].push(i);
    });
    return acc;
  }, [ingredientsQuery.data]);

  const selectedIds = useMemo(() => new Set(ingredients.map((i) => i.id)), [ingredients]);

  const counts = useMemo(
    () => ({
      base: base ? 1 : 0,
      veggie: ingredients.filter((i) => TYPE_MAP[i.ingredient_type] === 'veggie').length,
      protein: ingredients.filter((i) => TYPE_MAP[i.ingredient_type] === 'protein').length,
      seeds: ingredients.filter((i) => TYPE_MAP[i.ingredient_type] === 'seeds').length,
      dressing: ingredients.filter((i) => TYPE_MAP[i.ingredient_type] === 'dressing').length,
      style: 1,
    }),
    [base, ingredients]
  );

  const persistMutation = useMutation({
    mutationFn: () =>
      bowlApi.createBowl({
        base_id: base!.id,
        ingredient_ids: ingredients.map((i) => i.id),
        preparation,
      }),
  });

  const onTabPress = useCallback((tab: Tab) => {
    setActiveTab(tab);
    const y = sectionRefs.current[tab];
    if (typeof y === 'number' && scrollRef.current) {
      scrollRef.current.scrollTo({ y: Math.max(0, y - 12), animated: true });
    }
  }, []);

  const handleAddToCart = async () => {
    if (!base) {
      Alert.alert('Pick a base', 'Choose a base to start building your bowl.');
      return;
    }

    let savedId: number | undefined;
    if (isAuthenticated) {
      try {
        const saved = await persistMutation.mutateAsync();
        savedId = saved?.id;
      } catch {
        // non-fatal — still add to local cart so user doesn't lose the bowl
      }
    }

    const nameParts = [base.name, ...ingredients.slice(0, 3).map((i) => i.name)];
    const bowlName =
      `Custom Bowl: ${nameParts.join(', ')}` + (ingredients.length > 3 ? `…` : '');

    addItem({
      id: `bowl-${savedId ?? Date.now()}`,
      name: bowlName,
      price: totalPrice,
      quantity,
      meta: {
        kind: 'custom-bowl',
        savedId,
        base: base.name,
        baseId: base.id,
        ingredientIds: ingredients.map((i) => i.id),
        preparation,
      },
    });

    reset();
    router.back();
  };

  const loading = basesQuery.isLoading || ingredientsQuery.isLoading;

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color="#1E6F3E" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={22} color="#0B262F" />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Make your bowl</Text>
          <Text style={styles.headerSub}>Build it your way</Text>
        </View>
        <TouchableOpacity onPress={reset} style={styles.headerBtn}>
          <Ionicons name="refresh-outline" size={20} color="#0B262F" />
        </TouchableOpacity>
      </View>

      {/* ─── Summary card ─── */}
      <LinearGradient colors={['#1E6F3E', '#0F3D21']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.summary}>
        <View style={{ flex: 1 }}>
          <Text style={styles.summaryLabel}>Your bowl</Text>
          <Text style={styles.summaryTitle} numberOfLines={1}>
            {base ? base.name : 'Pick a base'}
          </Text>
          <Text style={styles.summaryMeta}>
            {ingredients.length} ingredient{ingredients.length === 1 ? '' : 's'} • {preparation === 'warm' ? 'Warm' : 'Cold'}
          </Text>
        </View>
        <View style={styles.summaryPriceBox}>
          <Text style={styles.summaryPriceLabel}>Total</Text>
          <Text style={styles.summaryPrice}>₹{totalPrice}</Text>
        </View>
      </LinearGradient>

      {/* ─── Tab strip ─── */}
      <View style={styles.tabsWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
        >
          {TABS.map((t) => {
            const active = activeTab === t.id;
            const count = counts[t.id];
            return (
              <TouchableOpacity
                key={t.id}
                style={[styles.tab, active && styles.tabActive]}
                onPress={() => onTabPress(t.id)}
              >
                <Ionicons name={t.icon} size={14} color={active ? '#fff' : '#0B262F'} />
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
                {count > 0 && (
                  <View style={[styles.tabBadge, active && styles.tabBadgeActive]}>
                    <Text style={[styles.tabBadgeText, active && { color: '#1E6F3E' }]}>{count}</Text>
                  </View>
                )}
                {t.required && !count && (
                  <View style={styles.tabDot} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ─── Sections ─── */}
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 160, paddingTop: 8 }}
        scrollEventThrottle={16}
      >
        <Section
          id="base"
          title="Pick your base"
          required
          subtitle="The foundation of your bowl"
          onLayoutY={(y) => (sectionRefs.current.base = y)}
        >
          <Grid
            items={basesQuery.data ?? []}
            selectedIds={base ? new Set([base.id]) : new Set()}
            onPick={(b) => setBase(b)}
            single
          />
        </Section>

        <Section
          id="veggie"
          title="Veggies"
          subtitle="Fresh & crunchy add-ons"
          onLayoutY={(y) => (sectionRefs.current.veggie = y)}
        >
          <Grid items={grouped.veggie} selectedIds={selectedIds} onPick={toggleIngredient} />
        </Section>

        <Section
          id="protein"
          title="Protein"
          subtitle="Pick what fuels you"
          onLayoutY={(y) => (sectionRefs.current.protein = y)}
        >
          <Grid items={grouped.protein} selectedIds={selectedIds} onPick={toggleIngredient} />
        </Section>

        {grouped.seeds.length > 0 && (
          <Section
            id="seeds"
            title="Toppings"
            subtitle="Seeds, nuts, crunch"
            onLayoutY={(y) => (sectionRefs.current.seeds = y)}
          >
            <Grid items={grouped.seeds} selectedIds={selectedIds} onPick={toggleIngredient} />
          </Section>
        )}

        {grouped.dressing.length > 0 && (
          <Section
            id="dressing"
            title="Sauces & dressings"
            subtitle="Tie it all together"
            onLayoutY={(y) => (sectionRefs.current.dressing = y)}
          >
            <Grid items={grouped.dressing} selectedIds={selectedIds} onPick={toggleIngredient} />
          </Section>
        )}

        <Section
          id="style"
          title="Style"
          subtitle="How would you like it served?"
          onLayoutY={(y) => (sectionRefs.current.style = y)}
        >
          <View style={styles.styleRow}>
            <TouchableOpacity
              style={[styles.styleChip, preparation === 'warm' && styles.styleChipActive]}
              onPress={() => setPreparation('warm')}
            >
              <Ionicons
                name="flame"
                size={18}
                color={preparation === 'warm' ? '#fff' : '#0B262F'}
              />
              <Text
                style={[styles.styleText, preparation === 'warm' && styles.styleTextActive]}
              >
                Warm
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.styleChip, preparation === 'cold' && styles.styleChipActive]}
              onPress={() => setPreparation('cold')}
            >
              <Ionicons
                name="snow"
                size={18}
                color={preparation === 'cold' ? '#fff' : '#0B262F'}
              />
              <Text
                style={[styles.styleText, preparation === 'cold' && styles.styleTextActive]}
              >
                Cold
              </Text>
            </TouchableOpacity>
          </View>
        </Section>
      </ScrollView>

      {/* ─── Footer ─── */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.qty}>
          <TouchableOpacity
            onPress={() => setQuantity(Math.max(1, quantity - 1))}
            style={styles.qtyBtn}
          >
            <Ionicons name="remove" size={18} color="#0B262F" />
          </TouchableOpacity>
          <Text style={styles.qtyText}>{quantity}</Text>
          <TouchableOpacity
            onPress={() => setQuantity(quantity + 1)}
            style={styles.qtyBtn}
          >
            <Ionicons name="add" size={18} color="#0B262F" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.addBtn, (!base || persistMutation.isPending) && styles.addBtnDisabled]}
          onPress={handleAddToCart}
          disabled={!base || persistMutation.isPending}
          activeOpacity={0.9}
        >
          {persistMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.addBtnText}>
                {base ? 'Add to cart' : 'Pick a base'}
              </Text>
              {base && <Text style={styles.addBtnPrice}>₹{totalPrice * quantity}</Text>}
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ───────────────────────── helpers ───────────────────────── */

function Section({
  id,
  title,
  subtitle,
  required,
  children,
  onLayoutY,
}: {
  id: string;
  title: string;
  subtitle?: string;
  required?: boolean;
  children: React.ReactNode;
  onLayoutY?: (y: number) => void;
}) {
  return (
    <View
      style={styles.section}
      onLayout={(e) => onLayoutY?.(e.nativeEvent.layout.y)}
    >
      <View style={styles.sectionHeader}>
        <View style={{ flex: 1 }}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {required && (
              <View style={styles.requiredPill}>
                <Text style={styles.requiredText}>Required</Text>
              </View>
            )}
          </View>
          {subtitle ? <Text style={styles.sectionSub}>{subtitle}</Text> : null}
        </View>
      </View>
      {children}
    </View>
  );
}

function Grid({
  items,
  selectedIds,
  onPick,
  single,
}: {
  items: any[];
  selectedIds: Set<number>;
  onPick: (item: any) => void;
  single?: boolean;
}) {
  if (items.length === 0) {
    return <Text style={styles.emptyText}>No options available right now.</Text>;
  }
  return (
    <View style={styles.grid}>
      {items.map((it) => {
        const active = selectedIds.has(it.id);
        const indicatorColor =
          it.icon_type === 'non_veg' ? '#D93616' : it.icon_type === 'egg' ? '#E2BE24' : '#08B853';
        return (
          <TouchableOpacity
            key={it.id}
            style={[styles.card, active && styles.cardActive]}
            activeOpacity={0.85}
            onPress={() => onPick(it)}
          >
            {it.image ? (
              <Image source={{ uri: it.image }} style={styles.cardImg} />
            ) : (
              <View style={[styles.cardImg, styles.cardImgFallback]}>
                <Ionicons name="leaf" size={26} color="#1E6F3E" />
              </View>
            )}
            {it.icon_type && it.icon_type !== 'none' && (
              <View style={[styles.vegIndicator, { borderColor: indicatorColor }]}>
                <View style={[styles.vegDot, { backgroundColor: indicatorColor }]} />
              </View>
            )}
            {active && (
              <View style={styles.cardCheck}>
                <Ionicons name="checkmark" size={14} color="#fff" />
              </View>
            )}
            <View style={styles.cardBody}>
              <Text style={styles.cardName} numberOfLines={2}>
                {it.name}
              </Text>
              <Text style={styles.cardPrice}>
                {it.price > 0 ? `+ ₹${it.price}` : single ? `₹${it.price}` : 'Free'}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FBF4' },
  center: { justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F7FBF4',
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#0B262F' },
  headerSub: { fontSize: 11, color: '#6B7280' },

  summary: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  summaryLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600', letterSpacing: 0.4, textTransform: 'uppercase' },
  summaryTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 2 },
  summaryMeta: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 },
  summaryPriceBox: { alignItems: 'flex-end' },
  summaryPriceLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
  summaryPrice: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 2 },

  tabsWrap: {
    backgroundColor: '#F7FBF4',
    paddingTop: 12,
    paddingBottom: 8,
  },
  tabs: { paddingHorizontal: 16, gap: 8 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tabActive: { backgroundColor: '#1E6F3E', borderColor: '#1E6F3E' },
  tabText: { fontSize: 13, color: '#0B262F', fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  tabBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#0B262F',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeActive: { backgroundColor: '#fff' },
  tabBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  tabDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#C7463A' },

  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionHeader: { marginBottom: 12 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0B262F' },
  sectionSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  requiredPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: '#FEE2E2' },
  requiredText: { fontSize: 10, fontWeight: '700', color: '#C7463A' },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: CARD_W,
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  cardActive: { borderColor: '#1E6F3E' },
  cardImg: { width: '100%', height: 88, backgroundColor: '#F1F5F1' },
  cardImgFallback: { justifyContent: 'center', alignItems: 'center' },
  cardBody: { padding: 10, gap: 4 },
  cardName: { fontSize: 13, fontWeight: '600', color: '#0B262F' },
  cardPrice: { fontSize: 12, color: '#1E6F3E', fontWeight: '600' },
  cardCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#1E6F3E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vegIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vegDot: { width: 8, height: 8, borderRadius: 4 },

  styleRow: { flexDirection: 'row', gap: 12 },
  styleChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  styleChipActive: { backgroundColor: '#1E6F3E', borderColor: '#1E6F3E' },
  styleText: { fontSize: 14, fontWeight: '700', color: '#0B262F' },
  styleTextActive: { color: '#fff' },

  emptyText: { fontSize: 13, color: '#6B7280', padding: 8 },

  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
  },
  qty: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F1',
    borderRadius: 999,
    paddingHorizontal: 4,
    height: 48,
  },
  qtyBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  qtyText: { width: 28, textAlign: 'center', fontSize: 15, fontWeight: '700', color: '#0B262F' },

  addBtn: {
    flex: 1,
    height: 48,
    borderRadius: 999,
    backgroundColor: '#1E6F3E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },
  addBtnDisabled: { backgroundColor: '#9CA3AF' },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  addBtnPrice: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
