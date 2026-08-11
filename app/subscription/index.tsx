import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../src/features/auth/store/auth.store';
import { subscriptionApi, type ActiveSubscription } from '../../src/features/subscription/api/subscription.api';

function pickName(field: any, fallback = ''): string {
  if (!field) return fallback;
  if (typeof field === 'string') return field;
  if (typeof field === 'object') return field.name ?? fallback;
  return fallback;
}

function formatDate(iso?: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return iso;
  }
}

function todayPlus(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function SubscriptionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const activeQuery = useQuery<ActiveSubscription[]>({
    queryKey: ['subscriptions', 'active'],
    queryFn: subscriptionApi.getActive,
    enabled: isAuthenticated,
  });

  const subscriptions = (activeQuery.data ?? []).filter((s) => s.is_active);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['subscriptions'] });

  const pauseMutation = useMutation({
    mutationFn: (vars: { id: number; hold_start_date: string; hold_end_date: string }) =>
      subscriptionApi.pause(vars.id, {
        hold_start_date: vars.hold_start_date,
        hold_end_date: vars.hold_end_date,
      }),
    onSuccess: invalidate,
    onError: (e: any) =>
      Alert.alert('Could not pause', e?.response?.data?.error || 'Try again later.'),
  });

  const resumeMutation = useMutation({
    mutationFn: (id: number) => subscriptionApi.resume(id),
    onSuccess: invalidate,
    onError: (e: any) =>
      Alert.alert('Could not resume', e?.response?.data?.error || 'Try again later.'),
  });

  const askPause = (sub: ActiveSubscription) => {
    Alert.alert(
      'Pause subscription',
      'Pause deliveries for 7 days starting tomorrow? Your remaining deliveries roll over.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pause 7 days',
          onPress: () =>
            pauseMutation.mutate({
              id: sub.id,
              hold_start_date: todayPlus(1),
              hold_end_date: todayPlus(7),
            }),
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerTextWrap}>
          <Text style={styles.headerCount}>{subscriptions.length}</Text>
          <Text style={styles.headerLabel}>Active subscription{subscriptions.length === 1 ? '' : 's'}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={activeQuery.isFetching && !activeQuery.isLoading}
            onRefresh={() => activeQuery.refetch()}
            tintColor="#fff"
          />
        }
      >
        {!isAuthenticated ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>Sign in to view your subscriptions</Text>
            <TouchableOpacity
              style={styles.browsePlansBtn}
              onPress={() => router.push('/(auth)/login' as any)}
            >
              <Text style={styles.browsePlansBtnText}>Sign in</Text>
            </TouchableOpacity>
          </View>
        ) : activeQuery.isLoading ? (
          <ActivityIndicator size="large" color="#fff" style={{ marginTop: 40 }} />
        ) : subscriptions.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>No active subscriptions</Text>
            <TouchableOpacity
              style={styles.browsePlansBtn}
              onPress={() => router.push('/subscription/plans' as any)}
            >
              <Text style={styles.browsePlansBtnText}>Browse plans</Text>
            </TouchableOpacity>
          </View>
        ) : (
          subscriptions.map((sub) => {
            const planName = pickName(sub.meal_plan_type, 'Subscription');
            const periodName = pickName(sub.subscription_period);
            const pendingThis =
              (pauseMutation.isPending && pauseMutation.variables?.id === sub.id) ||
              (resumeMutation.isPending && resumeMutation.variables === sub.id);

            return (
              <View key={sub.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{planName}</Text>
                    <Text style={styles.cardSub}>
                      {periodName ? `${periodName}` : ''}
                      {sub.start_date ? `${periodName ? ' · ' : ''}from ${formatDate(sub.start_date)}` : ''}
                    </Text>
                  </View>
                  {sub.is_on_hold && (
                    <View style={styles.holdBadge}>
                      <Text style={styles.holdBadgeText}>On hold</Text>
                    </View>
                  )}
                </View>

                {sub.is_on_hold && (sub.hold_start_date || sub.hold_end_date) && (
                  <Text style={styles.holdText}>
                    Paused {formatDate(sub.hold_start_date)} – {formatDate(sub.hold_end_date)}
                  </Text>
                )}

                {typeof sub.deliveries_left === 'number' && (
                  <Text style={styles.metaText}>
                    {sub.deliveries_left} deliver{sub.deliveries_left === 1 ? 'y' : 'ies'} left
                  </Text>
                )}

                <View style={styles.cardActions}>
                  {sub.is_on_hold ? (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.actionPrimary]}
                      disabled={pendingThis}
                      onPress={() => resumeMutation.mutate(sub.id)}
                    >
                      {pendingThis ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.actionPrimaryText}>Resume</Text>
                      )}
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.actionSecondary]}
                      disabled={pendingThis}
                      onPress={() => askPause(sub)}
                    >
                      {pendingThis ? (
                        <ActivityIndicator color="#1E7F3E" />
                      ) : (
                        <Text style={styles.actionSecondaryText}>Pause 7 days</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={styles.bottomBtn}
          onPress={() => router.push('/subscription/plans' as any)}
        >
          <Text style={styles.bottomBtnText}>+ Add another plan</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B3F1F' },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },
  closeBtn: { width: 36, height: 36, justifyContent: 'center' },
  headerTextWrap: { marginTop: 24 },
  headerCount: { fontSize: 40, fontWeight: '700', color: '#fff', lineHeight: 44 },
  headerLabel: { fontSize: 22, color: '#fff', marginTop: 4 },

  scrollContent: { paddingHorizontal: 16 },

  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16 },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#111' },
  cardSub: { fontSize: 13, color: '#6B7280', marginTop: 4 },

  holdBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  holdBadgeText: { fontSize: 11, color: '#92400E', fontWeight: '700', letterSpacing: 0.5 },
  holdText: { fontSize: 13, color: '#92400E', marginTop: 4 },
  metaText: { fontSize: 13, color: '#0B262F', marginTop: 6 },

  cardActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 999, alignItems: 'center' },
  actionPrimary: { backgroundColor: '#1E7F3E' },
  actionPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  actionSecondary: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#1E7F3E' },
  actionSecondaryText: { color: '#1E7F3E', fontWeight: '700', fontSize: 14 },
  actionDanger: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#C7463A' },
  actionDangerText: { color: '#C7463A', fontWeight: '700', fontSize: 14 },

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
