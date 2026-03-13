import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { bowlApi } from '../../src/features/bowl/api/bowl.api';
import { useBowlStore } from '../../src/features/bowl/store/bowl.store';
import { useCartStore } from '../../src/features/cart/store/cart.store';
import DynamicBowl from '../../src/features/bowl/components/DynamicBowl';

const { width } = Dimensions.get('window');

export default function BowlBuilderScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const { 
    base, ingredients, preparation, totalPrice, 
    setBase, toggleIngredient, setPreparation, reset 
  } = useBowlStore();
  
  const addItem = useCartStore((s) => s.addItem);
  const [quantity, setQuantity] = useState(1);

  const { data: bases, isLoading: loadingBases } = useQuery({
    queryKey: ['bowlBases'],
    queryFn: bowlApi.getBases,
  });

  const { data: allIngredients, isLoading: loadingIngredients } = useQuery({
    queryKey: ['bowlIngredients'],
    queryFn: () => bowlApi.getIngredients(),
  });

  const loading = loadingBases || loadingIngredients;

  const groupedIngredients: Record<string, any[]> = {
    veggie: [],
    protein: [],
    seeds_nuts: [],
    dressing: [],
    gravy: [],
  };

  (allIngredients || []).forEach((ing: any) => {
    let type = ing.ingredient_type || 'extras';
    if (type === 'vegetables' || type === 'veggie') type = 'veggie';
    else if (type === 'proteins' || type === 'protein') type = 'protein';
    else if (type === 'seeds_nuts' || type === 'seeds') type = 'seeds_nuts';
    else if (type === 'dressing') type = 'dressing';
    else if (type === 'gravy') type = 'gravy';
    
    if (!groupedIngredients[type]) groupedIngredients[type] = [];
    groupedIngredients[type].push(ing);
  });

  const handleAddToCart = () => {
    if (!base) return;
    
    // Web app logic combines all extras strings
    const bowlName = "Custom Bowl";
    addItem({
      id: `custom-bowl-${Date.now()}`,
      name: bowlName,
      price: totalPrice,
      quantity,
      meta: { 
        base: base.name,
        ingredients: ingredients.map(i => i.name),
      },
    });
    
    reset();
    router.back();
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 16, color: '#4B5563' }}>Loading bowl options...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ─── HEADER ─── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={24} color="#141414" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Make your bowl</Text>
        <TouchableOpacity style={styles.headerHeartBtn}>
          <Ionicons name="heart-outline" size={20} color="#111" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* ─── DYNAMIC BOWL PREVIEW ─── */}
        <View style={styles.previewContainer}>
          <DynamicBowl base={base} ingredients={ingredients} />
        </View>

        {/* ─── OPTIONS ─── */}
        <View style={styles.optionsWrap}>
          <View style={styles.chooseTitleWrap}>
            <Text style={styles.chooseTitle}>Choose your items</Text>
          </View>
          
          {/* Base */}
          <BowlSection 
            title="Base" 
            required 
            single
            options={(bases || []).map((b: any) => ({ ...b, label: b.name, icon_type: 'veg' }))} 
            selected={base ? [base.id] : []}
            onSelect={(id: string) => {
              const b = bases?.find((x: any) => x.id === id);
              if(b) setBase(b);
            }}
          />

          {/* Veggies */}
          <BowlSection 
            title="Veggies" 
            options={(groupedIngredients['veggie'] || []).map(i => ({ ...i, label: i.name }))} 
            selected={ingredients.map(i => i.id)}
            onSelect={(id: string) => {
              const item = groupedIngredients['veggie']?.find(x => x.id === id);
              if(item) toggleIngredient(item);
            }}
          />

          {/* Protein */}
          <BowlSection 
            title="Protein" 
            options={(groupedIngredients['protein'] || []).map(i => ({ ...i, label: i.name }))} 
            selected={ingredients.map(i => i.id)}
            onSelect={(id: string) => {
              const item = groupedIngredients['protein']?.find(x => x.id === id);
              if(item) toggleIngredient(item);
            }}
          />

          {/* Seeds & Nuts */}
          <BowlSection 
            title="Seeds & Nuts" 
            options={(groupedIngredients['seeds_nuts'] || []).map(i => ({ ...i, label: i.name }))} 
            selected={ingredients.map(i => i.id)}
            onSelect={(id: string) => {
              const item = groupedIngredients['seeds_nuts']?.find(x => x.id === id);
              if(item) toggleIngredient(item);
            }}
          />

          {/* Dressings (Sauces / Dips) */}
          {groupedIngredients['dressing'] && groupedIngredients['dressing'].length > 0 && (
            <BowlSection 
              title="Sauces & Dips" 
              options={groupedIngredients['dressing'].map(i => ({ ...i, label: i.name }))} 
              selected={ingredients.map(i => i.id)}
              onSelect={(id: string) => {
                const item = groupedIngredients['dressing']?.find(x => x.id === id);
                if(item) toggleIngredient(item);
              }}
            />
          )}

          {/* Gravy */}
          {groupedIngredients['gravy'] && groupedIngredients['gravy'].length > 0 && (
            <BowlSection 
              title="Gravy (applicable on rice only)" 
              options={groupedIngredients['gravy'].map(i => ({ ...i, label: i.name }))} 
              selected={ingredients.map(i => i.id)}
              onSelect={(id: string) => {
                const item = groupedIngredients['gravy']?.find(x => x.id === id);
                if(item) toggleIngredient(item);
              }}
            />
          )}

          {/* Preparation */}
          <BowlSection 
            title={`Preparation: (Warm/Cold): ${preparation.charAt(0).toUpperCase() + preparation.slice(1)}`} 
            single
            options={[
              { id: 'warm', label: 'Warm', price: 0, icon_type: 'none' },
              { id: 'cold', label: 'Cold', price: 0, icon_type: 'none' }
            ]}
            selected={[preparation]}
            onSelect={(id: string) => setPreparation(id as 'warm' | 'cold')}
          />

        </View>
      </ScrollView>

      {/* ─── FOOTER ─── */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.qtyControls}>
          <TouchableOpacity 
            style={styles.qtyBtn} 
            onPress={() => setQuantity(Math.max(1, quantity - 1))}
          >
            <Text style={styles.qtyBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.qtyText}>{quantity}</Text>
          <TouchableOpacity 
            style={styles.qtyBtnPlus} 
            onPress={() => setQuantity(quantity + 1)}
          >
            <Text style={styles.qtyBtnPlusText}>+</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.addBtn, !base && styles.addBtnDisabled]}
          onPress={handleAddToCart}
          disabled={!base}
          activeOpacity={0.9}
        >
          <Text style={styles.addBtnText}>Add ₹{totalPrice * quantity}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ─── HELPER COMPONENTS ─── */

function BowlSection({ title, required, options, selected, onSelect, single }: any) {
  return (
    <View style={styles.sectionContainer}>
      {/* Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {required ? (
          <View style={styles.badgeRequired}>
            <Text style={styles.badgeRequiredText}>*Required</Text>
          </View>
        ) : (
          <Text style={styles.badgeOptional}>Optional</Text>
        )}
      </View>

      {/* Options */}
      <View style={styles.optionsList}>
        {options.map((opt: any) => {
          const active = selected.includes(opt.id);
          const price = opt.price || 0;

          // Determine indicator color based on icon_type
          let indicatorColor = '#08B853'; // default veg
          if (opt.icon_type === 'non_veg') indicatorColor = '#D93616';
          if (opt.icon_type === 'egg') indicatorColor = '#E2BE24';

          const showIndicator = opt.icon_type && opt.icon_type !== 'none';

          return (
            <TouchableOpacity 
              key={opt.id} 
              style={styles.optionRow}
              activeOpacity={0.7}
              onPress={() => onSelect(opt.id)}
            >
              <View style={styles.optionLeft}>
                {showIndicator && (
                   <View style={[styles.vegIndicator, { borderColor: indicatorColor }]}>
                     <View style={[styles.vegDot, { backgroundColor: indicatorColor }]} />
                   </View>
                )}
                <Text style={styles.optionLabel}>
                  {opt.label}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Text style={styles.optionPrice}>₹ {price}</Text>

                {single ? (
                  /* Radio button */
                  <View style={[styles.radioOutline, active && styles.radioOutlineActive]}>
                    {active && <View style={styles.radioDot} />}
                  </View>
                ) : (
                  /* Checkbox */
                  <View style={[styles.checkboxOutline, active && styles.checkboxOutlineActive]}>
                    {active && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDE6C6' },
  
  /* Header */
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 8,
  },
  headerBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '600', color: '#141414' },
  headerHeartBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
  },

  /* Preview */
  previewContainer: {
    width: '100%', height: 260, justifyContent: 'center', alignItems: 'center',
    marginBottom: 0, marginTop: 6,
  },

  /* Options Wrapper */
  optionsWrap: {
    backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16,
    minHeight: 500, paddingTop: 16,
  },
  chooseTitleWrap: {
    paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6'
  },
  chooseTitle: {
    fontSize: 16, fontWeight: '600', color: '#0B262F'
  },

  /* Section */
  sectionContainer: {
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111' },
  badgeRequired: {
    backgroundColor: '#FCE9E5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
  },
  badgeRequiredText: { fontSize: 12, fontWeight: '500', color: '#C7463A' },
  badgeOptional: { fontSize: 12, color: '#6C6C6C' },
  
  optionsList: { gap: 16 },
  optionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  optionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  
  vegIndicator: {
    width: 20, height: 20, borderRadius: 4, borderWidth: 1, borderColor: '#08B853',
    justifyContent: 'center', alignItems: 'center',
  },
  vegDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: '#08B853',
  },

  optionLabel: { fontSize: 14, color: '#111', fontWeight: '500' },
  optionPrice: { fontSize: 14, color: '#0B262F' },

  radioOutline: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: '#D1D5DB',
    justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff'
  },
  radioOutlineActive: { borderColor: '#4B8E3D' },
  radioDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: '#4B8E3D',
  },

  checkboxOutline: {
    width: 20, height: 20, borderRadius: 4, borderWidth: 1.5, borderColor: '#D5D8D7',
    justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff'
  },
  checkboxOutlineActive: { backgroundColor: '#2C921D', borderColor: '#2C921D' },

  /* Footer */
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7EB',
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, gap: 16,
  },
  qtyControls: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#098323',
    borderRadius: 999, overflow: 'hidden', height: 48,
  },
  qtyBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  qtyBtnText: { fontSize: 18, color: '#111' },
  qtyBtnPlus: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  qtyBtnPlusText: { fontSize: 18, color: '#4B8E3D' },
  qtyText: { width: 28, textAlign: 'center', fontSize: 16, fontWeight: '600', color: '#111' },
  
  addBtn: {
    flex: 1, height: 48, borderRadius: 999, backgroundColor: '#2C921D',
    justifyContent: 'center', alignItems: 'center',
  },
  addBtnDisabled: { backgroundColor: '#D1D5DB' },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '500' },
});
