import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput,
  KeyboardAvoidingView, Platform, Modal, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addressesApi, type UserAddress, type CreateAddressPayload } from '../../src/features/addresses/api/addresses.api';
import { colors } from '../../src/shared/theme';
import EmptyState from '../../src/shared/components/EmptyState';

const ADDRESSES_KEY = ['addresses'];

export default function AddressesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CreateAddressPayload>({
    label: '',
    address: '',
    landmark: '',
    contact_number: '',
    delivery_area_id: undefined,
  });
  const [refreshing, setRefreshing] = useState(false);

  const addressesQuery = useQuery({
    queryKey: ADDRESSES_KEY,
    queryFn: addressesApi.list,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateAddressPayload) => addressesApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADDRESSES_KEY });
      closeModal();
    },
    onError: (e: any) => {
      Alert.alert('Could not save', e?.response?.data?.error || 'Please check the address and try again.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (params: { id: number; payload: Partial<CreateAddressPayload> }) =>
      addressesApi.update(params.id, params.payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADDRESSES_KEY });
      closeModal();
    },
    onError: (e: any) => {
      Alert.alert('Could not update', e?.response?.data?.error || 'Please try again.');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => addressesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ADDRESSES_KEY }),
    onError: (e: any) => {
      Alert.alert('Could not delete', e?.response?.data?.error || 'Please try again.');
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: number) => addressesApi.setDefault(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ADDRESSES_KEY }),
    onError: (e: any) => {
      Alert.alert('Could not set default', e?.response?.data?.error || 'Please try again.');
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await addressesQuery.refetch();
    setRefreshing(false);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ label: '', address: '', landmark: '', contact_number: '', delivery_area_id: undefined });
    setShowModal(true);
  };

  const openEdit = (a: UserAddress) => {
    setEditingId(a.id);
    setForm({
      label: a.label,
      address: a.address,
      landmark: a.landmark,
      contact_number: a.contact_number,
      delivery_area_id: a.delivery_area?.id,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const handleDelete = (a: UserAddress) => {
    Alert.alert('Delete address?', a.address, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeMutation.mutate(a.id) },
    ]);
  };

  const handleSave = () => {
    if (!form.address?.trim()) {
      Alert.alert('Address required', 'Please enter your street address.');
      return;
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, payload: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const addresses = addressesQuery.data ?? [];
  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backCircle} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Addresses</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {addressesQuery.isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : addresses.length === 0 ? (
          <EmptyState
            icon="location-outline"
            title="No saved addresses"
            description="Add your delivery address to get started."
            actionLabel="Add address"
            onAction={openCreate}
          />
        ) : (
          addresses.map((a) => (
            <View key={a.id} style={[styles.addressCard, a.is_default && styles.defaultAddressCard]}>
              <View style={styles.addressTopRow}>
                <View style={[styles.labelBadge, a.is_default ? styles.labelBadgeDefault : styles.labelBadgeNormal]}>
                  <Ionicons
                    name={(a.label || '').toLowerCase().includes('work') ? 'briefcase-outline' : 'home-outline'}
                    size={14}
                    color={a.is_default ? '#2C921D' : '#6B7280'}
                  />
                  <Text style={[styles.labelText, a.is_default ? { color: '#2C921D' } : { color: '#6B7280' }]}>
                    {a.label || 'Address'}
                  </Text>
                </View>
                {a.is_default && (
                  <View style={styles.defaultTag}>
                    <Text style={styles.defaultTagText}>Default</Text>
                  </View>
                )}
              </View>

              <Text style={styles.addressLine1}>{a.address}</Text>
              {!!a.landmark && <Text style={styles.addressLine2}>Near {a.landmark}</Text>}
              {!!a.delivery_area?.name && <Text style={styles.addressLine2}>{a.delivery_area.name}</Text>}
              {!!a.contact_number && <Text style={styles.addressLine2}>{a.contact_number}</Text>}

              <View style={styles.actionRow}>
                {!a.is_default && (
                  <TouchableOpacity style={styles.actionBtn} onPress={() => setDefaultMutation.mutate(a.id)} disabled={setDefaultMutation.isPending}>
                    <Text style={styles.actionBtnText}>Set as Default</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(a)}>
                  <Ionicons name="create-outline" size={16} color="#4B5563" />
                  <Text style={styles.actionBtnText}>Edit</Text>
                </TouchableOpacity>
                <View style={{ flex: 1 }} />
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(a)} disabled={removeMutation.isPending}>
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addBtnText}>Add Address</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showModal} transparent animationType="slide" onRequestClose={closeModal}>
        <KeyboardAvoidingView
          style={[styles.modalOverlay, { justifyContent: 'flex-end' }]}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>{editingId ? 'Edit Address' : 'Add New Address'}</Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color="#111" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Label (e.g. Home, Work)"
              placeholderTextColor="#9CA3AF"
              value={form.label}
              onChangeText={(v) => setForm({ ...form, label: v })}
            />
            <TextInput
              style={[styles.input, { minHeight: 80, textAlignVertical: 'top', paddingTop: 12 }]}
              placeholder="Street address"
              placeholderTextColor="#9CA3AF"
              value={form.address}
              onChangeText={(v) => setForm({ ...form, address: v })}
              multiline
            />
            <TextInput
              style={styles.input}
              placeholder="Landmark (optional)"
              placeholderTextColor="#9CA3AF"
              value={form.landmark || ''}
              onChangeText={(v) => setForm({ ...form, landmark: v })}
            />
            <TextInput
              style={styles.input}
              placeholder="Contact number"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
              value={form.contact_number || ''}
              onChangeText={(v) => setForm({ ...form, contact_number: v })}
            />
            <TextInput
              style={styles.input}
              placeholder="Delivery area ID (required)"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              value={form.delivery_area_id?.toString() ?? ''}
              onChangeText={(v) => setForm({ ...form, delivery_area_id: v ? parseInt(v, 10) : undefined })}
            />

            <TouchableOpacity
              style={[styles.addBtn, { marginTop: 12, opacity: saving ? 0.6 : 1 }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.addBtnText}>{editingId ? 'Update Address' : 'Save Address'}</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 16,
  },
  backCircle: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111' },

  scrollContent: { padding: 20, paddingBottom: 100, flexGrow: 1 },

  loadingWrap: { paddingVertical: 48, alignItems: 'center' },

  addressCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: '#F3F4F6',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  defaultAddressCard: { borderColor: '#2C921D', borderWidth: 1.5 },
  addressTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  labelBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  labelBadgeDefault: { backgroundColor: '#D1FADF' },
  labelBadgeNormal: { backgroundColor: '#F3F4F6' },
  labelText: { fontSize: 13, fontWeight: '600' },
  defaultTag: { marginLeft: 8, backgroundColor: '#2C921D', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  defaultTagText: { fontSize: 10, fontWeight: '600', color: '#fff' },

  addressLine1: { fontSize: 15, fontWeight: '500', color: '#111', marginBottom: 4 },
  addressLine2: { fontSize: 14, color: '#6B7280', marginBottom: 4 },

  actionRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12, marginTop: 8, gap: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 8 },
  actionBtnText: { fontSize: 13, fontWeight: '500', color: '#4B5563' },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 16,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  addBtn: {
    flexDirection: 'row', backgroundColor: '#2C921D', height: 50, borderRadius: 999,
    justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#111' },
  input: {
    backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12,
    paddingHorizontal: 16, height: 50, marginBottom: 12, fontSize: 15,
  },
});
