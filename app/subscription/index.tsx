import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../src/features/auth/store/auth.store';
import apiClient from '../../src/shared/api/client';

// ─── Types ───────────────────────────────
type ActiveSub = {
  id: number;
  meal_plan_type: { name: string };
  subscription_period: { name: string };
  category: { name: string };
  deliveries_left: number;
  total_deliveries: number;
  status: string;
};

function SubCard({ sub }: { sub: ActiveSub }) {
  const pct = Math.round((sub.deliveries_left / sub.total_deliveries) * 100);
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View>
          <Text style={styles.cardTitle}>{sub.meal_plan_type?.name || 'Subscription'}</Text>
          <Text style={styles.cardSub}>
            {sub.subscription_period?.name} | {sub.category?.name}
          </Text>
        </View>
        {sub.status && sub.status !== 'Active' && (
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>{sub.status}</Text>
          </View>
        )}
      </View>

      {/* Progress Bar */}
      <View style={styles.progressWrap}>
        <View style={[styles.progressBar, { width: `${pct}%` as any }]} />
      </View>
      <Text style={styles.progressLabel}>
        {sub.deliveries_left} of {sub.total_deliveries} deliveries left
      </Text>
    </View>
  );
}

export default function SubscriptionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { data: subs, isLoading } = useQuery({
    queryKey: ['subscriptions', 'active'],
    queryFn: async () => {
      const res = await apiClient.get('/subscriptions/my/');
      return res.data as ActiveSub[];
    },
    enabled: isAuthenticated,
  });

  const subscriptions = subs || [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Dark green background header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerTextWrap}>
          <Text style={styles.headerCount}>{subscriptions.length}</Text>
          <Text style={styles.headerLabel}>Active subscriptions</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#fff" style={{ marginTop: 40 }} />
        ) : subscriptions.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>No active subscriptions</Text>
            <TouchableOpacity style={styles.browsePlansBtn} onPress={() => router.push('/subscription/plans')}>
              <Text style={styles.browsePlansBtnText}>Browse Plans</Text>
            </TouchableOpacity>
          </View>
        ) : (
          subscriptions.map((sub) => <SubCard key={sub.id} sub={sub} />)
        )}

        {/* Spacer for bottom bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={styles.bottomBtn} onPress={() => router.push('/subscription/plans')}>
          <Text style={styles.bottomBtnText}>+ Add another plan</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B3F1F' },

  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  closeBtn: { width: 36, height: 36, justifyContent: 'center' },
  headerTextWrap: { marginTop: 24 },
  headerCount: { fontSize: 40, fontWeight: '700', color: '#fff', lineHeight: 44 },
  headerLabel: { fontSize: 24, color: '#fff', marginTop: 4 },

  scrollContent: { paddingHorizontal: 16 },

  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#111' },
  cardSub: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  statusBadge: {
    backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
  },
  statusBadgeText: { fontSize: 12, color: '#92400E', fontWeight: '600' },

  progressWrap: {
    height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden', marginBottom: 8,
  },
  progressBar: { height: '100%', backgroundColor: '#4B8E3D', borderRadius: 4 },
  progressLabel: { fontSize: 13, color: '#6B7280' },

  emptyWrap: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 18, color: 'rgba(255,255,255,0.7)', marginBottom: 20 },
  browsePlansBtn: {
    backgroundColor: '#fff', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999,
  },
  browsePlansBtnText: { color: '#2E7D32', fontWeight: '600', fontSize: 16 },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(11,63,31,0.98)',
    paddingHorizontal: 16, paddingTop: 16,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)',
  },
  bottomBtn: {
    backgroundColor: '#fff', borderRadius: 999, paddingVertical: 16, alignItems: 'center',
  },
  bottomBtnText: { fontSize: 16, fontWeight: '600', color: '#2E7D32' },
});
