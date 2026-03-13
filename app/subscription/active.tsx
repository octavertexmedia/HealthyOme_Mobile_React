import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated, Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_W } = Dimensions.get('window');

const FEATURES = [
  { icon: 'leaf-outline', text: 'Balanced, chef-curated healthy meals' },
  { icon: 'chatbubble-ellipses-outline', text: 'Get menu updates from kitchens on WhatsApp' },
  { icon: 'pause-circle-outline', text: 'Pause your subscription anytime' },
];

const OFFERS = [
  {
    title: 'Balanced Meal',
    desc: 'Daily healthy meals for a balanced lifestyle',
    emoji: '🥗',
    price: '₹690 / 3 days',
    tag: 'BEST SELLER',
    tagColor: '#2C921D',
    bgFrom: '#E8F5E9', bgTo: '#C8E6C9',
  },
  {
    title: 'High Protein Meal',
    desc: 'Protein-rich meals for fitness goals',
    emoji: '💪',
    price: '₹890 / 3 days',
    tag: 'POPULAR',
    tagColor: '#B45309',
    bgFrom: '#FFF7ED', bgTo: '#FED7AA',
  },
  {
    title: 'Soups',
    desc: 'Light, easy-to-digest evening meals',
    emoji: '🍲',
    price: '₹590 / 3 days',
    bgFrom: '#EFF6FF', bgTo: '#BFDBFE',
  },
  {
    title: 'Smoothies',
    desc: 'Fresh and healthy refreshing smoothies',
    emoji: '🥤',
    price: '₹590 / 3 days',
    bgFrom: '#FDF2F8', bgTo: '#F9A8D4',
  },
];

export default function SubscriptionIntroScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [featureIdx, setFeatureIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setFeatureIdx((i) => (i + 1) % FEATURES.length), 1800);
    return () => clearInterval(t);
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ─── DARK GREEN HEADER ─── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>No time to cook? Try{'\n'}Subscription</Text>

        {/* Feature Carousel */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12, paddingRight: 8 }}
          style={{ marginTop: 20 }}
        >
          {FEATURES.map((f, i) => (
            <View key={i} style={[styles.featureChip, i === featureIdx && styles.featureChipActive]}>
              <Ionicons name={f.icon as any} size={18} color="#fff" />
              <Text style={styles.featureChipText}>{f.text}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Dots */}
        <View style={styles.dotsRow}>
          {FEATURES.map((_, i) => (
            <View key={i} style={[styles.dot, i === featureIdx && styles.dotActive]} />
          ))}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.offersTitle}>Available Plans</Text>

        {OFFERS.map((offer) => (
          <TouchableOpacity
            key={offer.title}
            style={[styles.offerCard, { backgroundColor: offer.bgFrom }]}
            activeOpacity={0.85}
            onPress={() => router.push('/subscription/plans')}
          >
            <View style={styles.offerLeft}>
              {offer.tag && (
                <View style={[styles.offerTag, { backgroundColor: offer.tagColor + '22' }]}>
                  <Text style={[styles.offerTagText, { color: offer.tagColor }]}>{offer.tag}</Text>
                </View>
              )}
              <Text style={styles.offerTitle}>{offer.title}</Text>
              <Text style={styles.offerDesc}>{offer.desc}</Text>
              <Text style={styles.offerPrice}>{offer.price}</Text>
            </View>
            <Text style={styles.offerEmoji}>{offer.emoji}</Text>
          </TouchableOpacity>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={() => router.push('/subscription/plans')}
          activeOpacity={0.9}
        >
          <Text style={styles.ctaBtnText}>View available plans</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F7F8' },

  header: {
    backgroundColor: '#0B3F1F', paddingHorizontal: 16,
    paddingTop: 8, paddingBottom: 28, borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  closeBtn: { paddingVertical: 8 },
  headerTitle: {
    fontSize: 18, fontWeight: '600', color: '#fff', textAlign: 'center', lineHeight: 26, marginTop: 8,
  },
  featureChip: {
    width: 160, backgroundColor: '#1E7F3E', borderRadius: 12, padding: 14,
    alignItems: 'center', gap: 8,
  },
  featureChipActive: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  featureChipText: { fontSize: 12, fontWeight: '500', color: '#fff', textAlign: 'center', lineHeight: 16 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 14 },
  dot: { width: 8, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)' },
  dotActive: { width: 24, backgroundColor: '#fff' },

  scrollContent: { padding: 16 },
  offersTitle: { fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 16 },

  offerCard: {
    borderRadius: 20, padding: 20, marginBottom: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  offerLeft: { flex: 1 },
  offerTag: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, alignSelf: 'flex-start', marginBottom: 6,
  },
  offerTagText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  offerTitle: { fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 4 },
  offerDesc: { fontSize: 13, color: '#6B7280', marginBottom: 10, lineHeight: 18 },
  offerPrice: { fontSize: 15, fontWeight: '600', color: '#4B8E3D' },
  offerEmoji: { fontSize: 52 },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F3F4F6',
    paddingHorizontal: 16, paddingTop: 16,
  },
  ctaBtn: {
    backgroundColor: '#1E7F3E', borderRadius: 999, paddingVertical: 18, alignItems: 'center',
  },
  ctaBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
