import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../src/features/auth/store/auth.store';
import {
  preferencesApi,
  type NotificationPrefs,
  type PrefKey,
} from '../../src/features/notifications/preferences.api';

const SETTINGS: { key: PrefKey; label: string; subtitle: string }[] = [
  { key: 'order_updates', label: 'Order Updates', subtitle: 'Status of your active orders' },
  { key: 'promotions', label: 'Promotions & Offers', subtitle: 'Deals, discounts and special offers' },
  { key: 'subscription_reminders', label: 'Subscription Reminders', subtitle: 'Upcoming delivery & plan renewals' },
  { key: 'reward_alerts', label: 'Reward Alerts', subtitle: 'When you earn or can redeem points' },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const prefsQuery = useQuery<NotificationPrefs>({
    queryKey: ['notifications', 'preferences'],
    queryFn: preferencesApi.get,
    enabled: isAuthenticated,
  });

  const patchMutation = useMutation({
    mutationFn: preferencesApi.patch,
    // Optimistic — flip the switch immediately, roll back on error.
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: ['notifications', 'preferences'] });
      const previous = queryClient.getQueryData<NotificationPrefs>(['notifications', 'preferences']);
      if (previous) {
        queryClient.setQueryData<NotificationPrefs>(['notifications', 'preferences'], {
          ...previous,
          ...updates,
        });
      }
      return { previous };
    },
    onError: (err: any, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(['notifications', 'preferences'], ctx.previous);
      }
      const msg = err?.response?.data?.error || 'Could not update preference.';
      Alert.alert('Update failed', String(msg));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'preferences'] });
    },
  });

  const prefs = prefsQuery.data;

  const toggle = (key: PrefKey) => {
    if (!prefs) return;
    patchMutation.mutate({ [key]: !prefs[key] } as Partial<NotificationPrefs>);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backCircle} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {!isAuthenticated ? (
          <View style={styles.empty}>
            <Ionicons name="log-in-outline" size={28} color="#9CA3AF" />
            <Text style={styles.emptyText}>Sign in to manage notification preferences.</Text>
          </View>
        ) : prefsQuery.isLoading || !prefs ? (
          <ActivityIndicator color="#4B8E3D" style={{ marginVertical: 32 }} />
        ) : (
          <View style={styles.card}>
            {SETTINGS.map((item, idx) => (
              <React.Fragment key={item.key}>
                <View style={styles.tile}>
                  <View style={styles.tileInfo}>
                    <Text style={styles.tileLabel}>{item.label}</Text>
                    <Text style={styles.tileSub}>{item.subtitle}</Text>
                  </View>
                  <Switch
                    trackColor={{ false: '#D1D5DB', true: '#D1FADF' }}
                    thumbColor={prefs[item.key] ? '#2C921D' : '#f4f3f4'}
                    ios_backgroundColor="#D1D5DB"
                    onValueChange={() => toggle(item.key)}
                    value={prefs[item.key]}
                    disabled={patchMutation.isPending}
                  />
                </View>
                {idx < SETTINGS.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111' },

  scrollContent: { padding: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tile: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 16 },
  tileInfo: { flex: 1 },
  tileLabel: { fontSize: 16, fontWeight: '500', color: '#111', marginBottom: 2 },
  tileSub: { fontSize: 13, color: '#6B7280' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 16 },
  empty: { alignItems: 'center', padding: 32, gap: 12 },
  emptyText: { color: '#6B7280', fontSize: 14, textAlign: 'center' },
});
