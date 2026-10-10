import React, { useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput,
  KeyboardAvoidingView, Platform, Modal, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addressesApi, type UserAddress, type CreateAddressPayload } from '../../src/features/addresses/api/addresses.api';
import {
  approvedPincodes,
  validateAddressDraft,
  type AddressDraft,
} from '../../src/features/addresses/addressValidation';
import { useAuthStore } from '../../src/features/auth/store/auth.store';
import { colors } from '../../src/shared/theme';
import EmptyState from '../../src/shared/components/EmptyState';
import DeliveryAreaPicker, { type DeliveryAreaSelection } from '../../src/features/delivery-areas/components/DeliveryAreaPicker';
import ServiceAreaWaitlistModal from '../../src/features/delivery-areas/components/ServiceAreaWaitlistModal';
import { useGroupedDeliveryAreas } from '../../src/features/delivery-areas/hooks/useDeliveryAreas';
import { subscriptionApi } from '../../src/features/subscription/api/subscription.api';
import { MealTimeAddressSelector } from '../../src/features/addresses/MealTimeAddressSelector';
import { validateMealTimeAddressSelection } from '../../src/features/addresses/mealTimeAddressPolicy';

const ADDRESSES_KEY = ['addresses'];

function emptyDraft(contactNumber = ''): AddressDraft {
  return {
    label: '',
    address: '',
    address_line1: '',
    address_line2: '',
    pincode: '',
    landmark: '',
    contact_number: contactNumber,
    delivery_area_id: null,
    default_meal_time_ids: [],
  };
}

function userPhoneSeed(phoneNumber?: string, username?: string): string {
  const raw = phoneNumber || username || '';
  const digits = raw.replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : '';
}

function apiErrorMessage(error: unknown, fallback: string): string {
  const data = (error as { response?: { data?: unknown } })?.response?.data;
  if (!data || typeof data !== 'object') return fallback;
  const body = data as Record<string, unknown>;
  if (typeof body.error === 'string') return body.error;
  for (const value of Object.values(body)) {
    if (typeof value === 'string') return value;
    if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  }
  return fallback;
}

export default function AddressesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<AddressDraft>(() => emptyDraft());
  const [areaName, setAreaName] = useState<string>('');
  const [showAreaPicker, setShowAreaPicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const groupedAreasQuery = useGroupedDeliveryAreas();
  const mealTimesQuery = useQuery({
    queryKey: ['subscription-meal-times', 'all'], queryFn: () => subscriptionApi.getMealTimes(), enabled: isAuthenticated,
  });

  const allAreas = useMemo(
    () => [
      ...(groupedAreasQuery.data?.subscribed_meals ?? []),
      ...(groupedAreasQuery.data?.quick_meals ?? []),
    ],
    [groupedAreasQuery.data],
  );
  const selectedArea = useMemo(
    () => allAreas.find((area) => area.id === form.delivery_area_id) ?? null,
    [allAreas, form.delivery_area_id],
  );
  const selectedPincodes = useMemo(() => approvedPincodes(selectedArea), [selectedArea]);

  const addressesQuery = useQuery({
    queryKey: ADDRESSES_KEY,
    queryFn: addressesApi.list,
    enabled: isAuthenticated,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateAddressPayload) => addressesApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADDRESSES_KEY });
      qc.invalidateQueries({ queryKey: ['subscriptions'] });
      qc.invalidateQueries({ queryKey: ['orders'] });
      closeModal();
    },
    onError: (error: unknown) => {
      Alert.alert('Could not save', apiErrorMessage(error, 'Please check the address and try again.'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (params: { id: number; payload: Partial<CreateAddressPayload> }) =>
      addressesApi.update(params.id, params.payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADDRESSES_KEY });
      qc.invalidateQueries({ queryKey: ['subscriptions'] });
      qc.invalidateQueries({ queryKey: ['orders'] });
      closeModal();
    },
    onError: (error: unknown) => {
      Alert.alert('Could not update', apiErrorMessage(error, 'Please try again.'));
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => addressesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ADDRESSES_KEY }),
    onError: (error: unknown) => {
      Alert.alert('Could not delete', apiErrorMessage(error, 'Please try again.'));
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: number) => addressesApi.setDefault(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ADDRESSES_KEY }),
    onError: (error: unknown) => {
      Alert.alert('Could not set default', apiErrorMessage(error, 'Please try again.'));
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await addressesQuery.refetch();
    setRefreshing(false);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyDraft(userPhoneSeed(user?.phone_number, user?.username)));
    setAreaName('');
    setShowModal(true);
  };

  const openEdit = (a: UserAddress) => {
    setEditingId(a.id);
    setForm({
      label: a.label,
      address: a.address,
      address_line1: a.address_line1 || a.address,
      address_line2: a.address_line2 || '',
      pincode: a.pincode || '',
      landmark: a.landmark,
      contact_number: a.contact_number,
      delivery_area_id: a.delivery_area?.id ?? null,
      is_default: a.is_default,
      default_meal_time_ids: a.default_meal_time_ids ?? [],
    });
    setAreaName(a.delivery_area?.name ?? '');
    setShowModal(true);
  };

  const handleAreaSelect = (area: DeliveryAreaSelection) => {
    const fullArea = allAreas.find((candidate) => candidate.id === area.id);
    const pincodes = approvedPincodes(fullArea);
    setForm((prev) => ({
      ...prev,
      delivery_area_id: area.id,
      pincode: pincodes.includes(prev.pincode)
        ? prev.pincode
        : pincodes.length === 1
          ? pincodes[0]
          : '',
    }));
    setAreaName(area.name);
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
    if (createMutation.isPending || updateMutation.isPending || !isAuthenticated) return;
    const result = validateAddressDraft(form, selectedArea);
    if (!result.ok) {
      Alert.alert('Check your address', result.message);
      return;
    }
    try {
      const ids = validateMealTimeAddressSelection(form.default_meal_time_ids ?? [], selectedArea, mealTimesQuery.isSuccess ? mealTimesQuery.data.meal_times : undefined);
      const payload = { ...result.payload, default_meal_time_ids: ids };
      if (editingId) updateMutation.mutate({ id: editingId, payload });
      else createMutation.mutate(payload);
    } catch (error) {
      Alert.alert('Check meal-time addresses', error instanceof Error ? error.message : 'Please review the selections.');
    }
  };

  const openWaitlist = () => {
    setShowAreaPicker(false);
    setShowModal(false);
    setShowWaitlist(true);
  };

  const cancelWaitlist = () => {
    setShowWaitlist(false);
    setShowModal(true);
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
        ) : addressesQuery.isError ? (
          <EmptyState
            icon="cloud-offline-outline"
            title="Couldn't load addresses"
            description="Please check your connection and try again."
            actionLabel="Retry"
            onAction={() => addressesQuery.refetch()}
          />
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

              <Text style={styles.addressLine1}>{a.address_line1 || a.address}</Text>
              {!!a.address_line2 && <Text style={styles.addressLine2}>{a.address_line2}</Text>}
              {!!a.landmark && <Text style={styles.addressLine2}>Near {a.landmark}</Text>}
              {!!a.delivery_area?.name && (
                <Text style={styles.addressLine2}>
                  {[a.delivery_area.name, a.pincode].filter(Boolean).join(' · ')}
                </Text>
              )}
              {!!a.contact_number && <Text style={styles.addressLine2}>{a.contact_number}</Text>}
              {!!a.default_meal_time_ids?.length && <Text style={styles.addressLine2}>Usual address: {a.default_meal_time_ids.map((id) => mealTimesQuery.data?.meal_times.find((item) => item.id === id)?.name || `Meal time #${id}`).join(', ')}</Text>}

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

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.formContent}
            >
              <TextInput
                style={styles.input}
                placeholder="Label (e.g. Home, Work)"
                placeholderTextColor="#9CA3AF"
                value={form.label}
                onChangeText={(v) => setForm({ ...form, label: v })}
              />
              <TouchableOpacity
                style={styles.selectInput}
                onPress={() => setShowAreaPicker(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="location-outline" size={18} color="#6B7280" />
                <Text
                  style={[styles.selectInputText, !areaName && styles.selectInputPlaceholder]}
                  numberOfLines={1}
                >
                  {areaName || 'Select delivery area *'}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.waitlistLink} onPress={openWaitlist}>
                <Text style={styles.waitlistLinkText}>We don’t serve my area yet — notify me</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.input}
                placeholder="Line 1 — flat, wing or building *"
                placeholderTextColor="#9CA3AF"
                value={form.address_line1}
                onChangeText={(v) => setForm({ ...form, address_line1: v })}
              />
              <TextInput
                style={styles.input}
                placeholder="Line 2 — street or locality"
                placeholderTextColor="#9CA3AF"
                value={form.address_line2}
                onChangeText={(v) => setForm({ ...form, address_line2: v })}
              />
              <TextInput
                style={styles.input}
                placeholder={selectedPincodes.length > 0 ? 'Pincode *' : 'Pincode'}
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                maxLength={6}
                value={form.pincode}
                onChangeText={(v) => setForm({ ...form, pincode: v.replace(/\D/g, '').slice(0, 6) })}
              />
              {selectedPincodes.length > 0 && (
                <Text style={styles.pincodeHint}>
                  Available: {selectedPincodes.join(', ')}
                </Text>
              )}
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

              {mealTimesQuery.isLoading ? <ActivityIndicator color={colors.primary} /> : null}
              {mealTimesQuery.isError ? <TouchableOpacity style={styles.waitlistLink} onPress={() => mealTimesQuery.refetch()}><Text style={styles.waitlistLinkText}>Could not load meal times. Tap to retry.</Text></TouchableOpacity> : null}
              <MealTimeAddressSelector options={mealTimesQuery.data?.meal_times ?? []} selected={form.default_meal_time_ids ?? []}
                acceptedArea={selectedArea?.is_accepted === true} disabled={saving || mealTimesQuery.isFetching}
                onChange={(ids) => setForm((current) => ({ ...current, default_meal_time_ids: ids }))} />
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
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <DeliveryAreaPicker
        visible={showAreaPicker}
        onClose={() => setShowAreaPicker(false)}
        onSelect={handleAreaSelect}
        selectedId={form.delivery_area_id ?? null}
      />
      <ServiceAreaWaitlistModal
        visible={showWaitlist}
        onClose={cancelWaitlist}
        onSubmitted={() => {
          setShowWaitlist(false);
          closeModal();
        }}
        initialEmail={user?.email ?? ''}
        initialPhone={form.contact_number || userPhoneSeed(user?.phone_number, user?.username)}
        initialArea={areaName || form.address_line2}
      />
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
  modalContent: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, maxHeight: '92%',
  },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#111' },
  formContent: { paddingBottom: 4 },
  input: {
    backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12,
    paddingHorizontal: 16, height: 50, marginBottom: 12, fontSize: 15,
  },
  selectInput: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12,
    paddingHorizontal: 16, height: 50, marginBottom: 12,
  },
  selectInputText: { flex: 1, fontSize: 15, color: '#111' },
  selectInputPlaceholder: { color: '#9CA3AF' },
  waitlistLink: { alignSelf: 'flex-start', marginTop: -2, marginBottom: 14 },
  waitlistLinkText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  pincodeHint: { fontSize: 12, color: '#6B7280', marginTop: -8, marginBottom: 12 },
});
