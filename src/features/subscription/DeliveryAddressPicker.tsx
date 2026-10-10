import React, { useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../auth/store/auth.store';
import { addressesApi } from '../addresses/api/addresses.api';
import { subscriptionApi } from './api/subscription.api';

export interface DeliveryAddressTarget { date: string; mealTimeId: number; mealTimeName: string }

export function DeliveryAddressPicker({ subscriptionId, target, onClose }: {
  subscriptionId: number;
  target: DeliveryAddressTarget;
  onClose: () => void;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);
  const [saving, setSaving] = useState(false);
  const query = useQuery({ queryKey: ['addresses', userId], queryFn: addressesApi.list, enabled: !!userId });
  const save = async (addressId: number | null) => {
    if (saving || !userId) return;
    setSaving(true);
    try {
      await subscriptionApi.setDeliveryAddress(subscriptionId, { date: target.date, meal_time_id: target.mealTimeId, address_id: addressId });
      if (useAuthStore.getState().user?.id !== userId) return;
      await queryClient.invalidateQueries({ queryKey: ['subscriptions', 'manage', subscriptionId] });
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
      onClose();
    } catch (error: any) {
      Alert.alert('Could not change delivery address', error?.response?.data?.error || error?.message || 'Please try again.');
    } finally { setSaving(false); }
  };
  return (
    <Modal visible animationType="slide" transparent onRequestClose={() => { if (!saving) onClose(); }}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}>
          <Text style={styles.title}>Delivery address</Text>
          <Text style={styles.detail}>{target.date} · {target.mealTimeName}</Text>
          <Text style={styles.detail}>This changes only this delivery. Your usual addresses stay the same.</Text>
          {saving ? <ActivityIndicator color="#2C921D" /> : null}
          <ScrollView style={{ maxHeight: 340 }}>
            <TouchableOpacity disabled={saving} style={styles.row} onPress={() => save(null)}><Text>Use usual delivery address</Text></TouchableOpacity>
            {query.isLoading ? <ActivityIndicator color="#2C921D" /> : query.isError ? (
              <TouchableOpacity style={styles.row} onPress={() => query.refetch()}><Text>Could not load addresses. Tap to retry.</Text></TouchableOpacity>
            ) : query.data?.map((address) => {
              const eligible = address.delivery_area?.is_accepted === true;
              return <TouchableOpacity key={address.id} style={[styles.row, !eligible && { opacity: 0.5 }]} disabled={saving || !eligible}
                onPress={() => save(address.id)}>
                <Text style={styles.label}>{address.label || 'Saved address'}</Text>
                <Text style={styles.detail}>{address.address || [address.address_line1, address.address_line2].filter(Boolean).join(', ')}</Text>
                {!eligible ? <Text style={styles.detail}>Choose a subscription delivery area for this address first.</Text> : null}
              </TouchableOpacity>;
            })}
          </ScrollView>
          <TouchableOpacity disabled={saving} style={styles.row} onPress={() => { onClose(); router.push('/profile-pages/addresses'); }}><Text style={styles.link}>Add or manage saved addresses</Text></TouchableOpacity>
          <TouchableOpacity disabled={saving} style={styles.row} onPress={onClose}><Text>Cancel</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  title: { fontSize: 20, fontWeight: '700', color: '#111' },
  label: { fontSize: 16, fontWeight: '600', color: '#111' },
  detail: { fontSize: 13, lineHeight: 19, color: '#6B7280', marginTop: 6 },
  row: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  link: { color: '#2C921D', fontWeight: '600' },
});
