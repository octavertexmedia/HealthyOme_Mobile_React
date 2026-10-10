import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { authApi } from '../../src/features/auth/api/auth.api';
import { useAuthStore } from '../../src/features/auth/store/auth.store';
import type { NotificationPreferenceKey } from '../../src/features/auth/types/auth.types';

const preferences: { key: NotificationPreferenceKey; label: string; detail: string }[] = [
  { key: 'notify_offers_promotions', label: 'Offers and promotions', detail: 'Updates about discounts and new offers.' },
  { key: 'notify_reward_updates', label: 'Reward updates', detail: 'Updates about points and rewards.' },
  { key: 'notify_push', label: 'Push notifications', detail: 'Also requires notification permission in your phone settings.' },
  { key: 'notify_whatsapp', label: 'WhatsApp updates', detail: 'Receive updates through WhatsApp.' },
];

export default function NotificationPreferencesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();
  const query = useQuery({ queryKey: ['profile', user?.id], queryFn: authApi.getProfile, enabled: isAuthenticated });
  const [saving, setSaving] = useState<NotificationPreferenceKey | null>(null);
  const save = async (key: NotificationPreferenceKey, value: boolean) => {
    if (saving || !user) return;
    setSaving(key);
    try {
      const updated = await authApi.updateProfile({ [key]: value });
      if (useAuthStore.getState().user?.id !== user.id) return;
      useAuthStore.getState().setUser(updated);
      queryClient.setQueryData(['profile', user.id], updated);
    } catch (error: any) {
      Alert.alert('Preference not saved', error?.response?.data?.error || 'Please try again.');
    } finally { setSaving(null); }
  };
  if (!isAuthenticated) return <Redirect href="/(auth)/login?redirect=/profile-pages/preferences" />;
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity accessibilityLabel="Go back" onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#111" /></TouchableOpacity>
        <Text style={styles.title}>Notification preferences</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {query.isLoading ? <ActivityIndicator color="#2C921D" /> : query.isError || !query.data ? (
          <TouchableOpacity onPress={() => query.refetch()}><Text>Could not load preferences. Tap to retry.</Text></TouchableOpacity>
        ) : preferences.map(({ key, label, detail }) => (
          <View style={styles.row} key={key}>
            <View style={{ flex: 1 }}><Text style={styles.label}>{label}</Text><Text style={styles.detail}>{detail}</Text></View>
            {saving === key ? <ActivityIndicator color="#2C921D" /> : <Switch accessibilityLabel={label}
              value={query.data[key] === true} disabled={saving !== null} onValueChange={(value) => save(key, value)} />}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20 },
  title: { fontSize: 18, fontWeight: '600', color: '#111' },
  content: { padding: 20, paddingBottom: 60 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  label: { fontSize: 16, fontWeight: '600', color: '#111' },
  detail: { fontSize: 13, lineHeight: 19, color: '#6B7280', marginTop: 6 },
});
