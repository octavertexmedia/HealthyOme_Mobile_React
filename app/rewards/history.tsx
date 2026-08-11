import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { rewardsApi, type RewardTransaction } from '../../src/features/rewards/api/rewards.api';
import { useAuthStore } from '../../src/features/auth/store/auth.store';

const POSITIVE: RewardTransaction['transaction_type'][] = ['earned'];

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function titleFor(t: RewardTransaction): string {
  if (t.description) return t.description;
  switch (t.transaction_type) {
    case 'earned':
      return 'Points earned';
    case 'spent':
      return 'Points spent';
    default:
      return 'Adjustment';
  }
}

export default function RewardsHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const pointsQuery = useQuery<number>({
    queryKey: ['rewards', 'points'],
    queryFn: rewardsApi.getUserPoints,
    enabled: isAuthenticated,
  });

  const historyQuery = useQuery<RewardTransaction[]>({
    queryKey: ['rewards', 'history'],
    queryFn: rewardsApi.getHistory,
    enabled: isAuthenticated,
  });

  const history = historyQuery.data ?? [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Points History</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.totalBadge}>
        <Text style={styles.totalLabel}>Total balance</Text>
        <Text style={styles.totalPts}>{pointsQuery.data ?? 0} pts</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={historyQuery.isFetching && !historyQuery.isLoading}
            onRefresh={() => historyQuery.refetch()}
            tintColor="#4B8E3D"
          />
        }
      >
        {!isAuthenticated ? (
          <View style={styles.empty}>
            <Ionicons name="log-in-outline" size={28} color="#9CA3AF" />
            <Text style={styles.emptyText}>Sign in to see your points history.</Text>
            <TouchableOpacity style={styles.signInBtn} onPress={() => router.push('/(auth)/login' as any)}>
              <Text style={styles.signInText}>Sign in</Text>
            </TouchableOpacity>
          </View>
        ) : historyQuery.isLoading ? (
          <ActivityIndicator color="#4B8E3D" style={{ marginVertical: 24 }} />
        ) : historyQuery.isError ? (
          <View style={styles.empty}>
            <Ionicons name="cloud-offline-outline" size={28} color="#9CA3AF" />
            <Text style={styles.emptyText}>Couldn&apos;t load your history. Pull to refresh.</Text>
          </View>
        ) : history.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="time-outline" size={28} color="#9CA3AF" />
            <Text style={styles.emptyText}>No points activity yet.</Text>
          </View>
        ) : (
          history.map((item, idx) => {
            const positive = POSITIVE.includes(item.transaction_type);
            const sign = positive ? '+' : item.points === 0 ? '' : '-';
            const tone = positive ? '#4B8E3D' : '#EF4444';
            const bg = positive ? '#E8F5E9' : '#FEE2E2';
            return (
              <View
                key={item.id}
                style={[styles.historyRow, idx !== history.length - 1 && styles.historyRowBorder]}
              >
                <View style={[styles.iconCircle, { backgroundColor: bg }]}>
                  <Ionicons name={positive ? 'arrow-down' : 'arrow-up'} size={18} color={tone} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.historyTitle}>{titleFor(item)}</Text>
                  <Text style={styles.historyDate}>{formatDate(item.created_at)}</Text>
                </View>
                <Text style={[styles.historyPoints, { color: tone }]}>
                  {sign}
                  {Math.abs(item.points)} pts
                </Text>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F6F6' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#111' },

  totalBadge: {
    backgroundColor: '#0F3D21', padding: 20, paddingHorizontal: 24, margin: 16, borderRadius: 20,
  },
  totalLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  totalPts: { fontSize: 32, fontWeight: '800', color: '#fff' },

  scrollContent: {
    backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 20,
    overflow: 'hidden', paddingHorizontal: 16,
  },
  historyRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16,
  },
  historyRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  iconCircle: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
  },
  historyTitle: { fontSize: 14, fontWeight: '500', color: '#111' },
  historyDate: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  historyPoints: { fontSize: 15, fontWeight: '700' },

  empty: { alignItems: 'center', padding: 24, gap: 8 },
  emptyText: { color: '#6B7280', fontSize: 14 },
  signInBtn: {
    marginTop: 12, paddingHorizontal: 20, paddingVertical: 10,
    backgroundColor: '#4B8E3D', borderRadius: 999,
  },
  signInText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
