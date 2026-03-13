import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const PLANS = [
  {
    id: 'balanced',
    title: 'Balanced Meal',
    description: 'Daily healthy meals for a balanced lifestyle',
    price: '₹690 / 3 days',
    emoji: '🥗',
    colors: ['#E8F5E9', '#C8E6C9'] as [string, string],
    route: '/subscription/create',
  },
  {
    id: 'protein',
    title: 'High Protein Meal',
    description: 'Protein-rich meals to support your fitness goals',
    price: '₹890 / 3 days',
    emoji: '💪',
    colors: ['#FFF3E0', '#FFE0B2'] as [string, string],
    route: '/subscription/create',
  },
  {
    id: 'soups',
    title: 'Soups',
    description: 'Light, easy-to-digest meals for evenings',
    price: '₹590 / 3 days',
    emoji: '🍲',
    colors: ['#E3F2FD', '#BBDEFB'] as [string, string],
    route: '/subscription/create',
  },
  {
    id: 'smoothies',
    title: 'Smoothies',
    description: 'Fresh and healthy refreshing smoothies',
    price: '₹590 / 3 days',
    emoji: '🥤',
    colors: ['#FCE4EC', '#F8BBD0'] as [string, string],
    route: '/subscription/create',
  },
];

export default function SubscriptionPlansScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Available Plans</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {PLANS.map((plan) => (
          <TouchableOpacity
            key={plan.id}
            style={styles.planCard}
            activeOpacity={0.9}
            onPress={() => router.push(plan.route as any)}
          >
            <LinearGradient colors={plan.colors} style={styles.planCardInner}>
              <View style={styles.planEmoji}>
                <Text style={{ fontSize: 36 }}>{plan.emoji}</Text>
              </View>
              <View style={styles.planInfo}>
                <Text style={styles.planTitle}>{plan.title}</Text>
                <Text style={styles.planDesc}>{plan.description}</Text>
                <Text style={styles.planPrice}>{plan.price}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6B7280" />
            </LinearGradient>
          </TouchableOpacity>
        ))}

        {/* Service Info */}
        <View style={styles.serviceInfo}>
          <ServiceInfoItem icon="shield-checkmark-outline" text="No hidden charges" />
          <ServiceInfoItem icon="refresh-outline" text="Pause or cancel anytime" />
          <ServiceInfoItem icon="time-outline" text="Fresh meals daily" />
          <ServiceInfoItem icon="star-outline" text="Satisfaction guaranteed" />
        </View>
      </ScrollView>
    </View>
  );
}

function ServiceInfoItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.serviceRow}>
      <Ionicons name={icon as any} size={18} color="#4B8E3D" />
      <Text style={styles.serviceText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F7F8' },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#111' },

  scrollContent: { padding: 16, gap: 16 },

  planCard: {
    borderRadius: 20, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  planCardInner: {
    flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16,
  },
  planEmoji: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  planInfo: { flex: 1 },
  planTitle: { fontSize: 17, fontWeight: '700', color: '#111', marginBottom: 4 },
  planDesc: { fontSize: 13, color: '#6B7280', lineHeight: 18, marginBottom: 8 },
  planPrice: { fontSize: 16, fontWeight: '600', color: '#4B8E3D' },

  serviceInfo: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20, marginTop: 8, gap: 14,
  },
  serviceRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  serviceText: { fontSize: 14, color: '#6B7280' },
});
