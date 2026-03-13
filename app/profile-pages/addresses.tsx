import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Address = {
  id: string;
  label: string;
  line1: string;
  line2: string;
  isDefault: boolean;
};

export default function AddressesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [addresses, setAddresses] = useState<Address[]>([
    { id: '1', label: 'Home', line1: '123, Main Street', line2: 'Pune, Maharashtra 411001', isDefault: true },
    { id: '2', label: 'Work', line1: '456, Business Park', line2: 'Pune, Maharashtra 411051', isDefault: false },
  ]);
  const [showAddModal, setShowAddModal] = useState(false);

  const handleDelete = (id: string) => {
    setAddresses(addresses.filter(a => a.id !== id));
  };

  const handleSetDefault = (id: string) => {
    setAddresses(addresses.map(a => ({
      ...a,
      isDefault: a.id === id
    })));
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backCircle} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Addresses</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* BODY */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {addresses.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="location-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No saved addresses</Text>
            <Text style={styles.emptyDesc}>Add your delivery address to get started.</Text>
          </View>
        ) : (
          addresses.map((address) => (
            <View key={address.id} style={[styles.addressCard, address.isDefault && styles.defaultAddressCard]}>
              <View style={styles.addressTopRow}>
                <View style={[styles.labelBadge, address.isDefault ? styles.labelBadgeDefault : styles.labelBadgeNormal]}>
                  <Ionicons 
                    name={address.label === 'Home' ? 'home-outline' : 'briefcase-outline'} 
                    size={14} 
                    color={address.isDefault ? '#2C921D' : '#6B7280'} 
                  />
                  <Text style={[styles.labelText, address.isDefault ? { color: '#2C921D' } : { color: '#6B7280' }]}>
                    {address.label}
                  </Text>
                </View>

                {address.isDefault && (
                  <View style={styles.defaultTag}>
                    <Text style={styles.defaultTagText}>Default</Text>
                  </View>
                )}
              </View>

              <Text style={styles.addressLine1}>{address.line1}</Text>
              <Text style={styles.addressLine2}>{address.line2}</Text>

              <View style={styles.actionRow}>
                {!address.isDefault && (
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleSetDefault(address.id)}>
                    <Text style={styles.actionBtnText}>Set as Default</Text>
                  </TouchableOpacity>
                )}
                <View style={{ flex: 1 }} />
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(address.id)}>
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* FLOATING ACTION BOTTOM */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addBtnText}>Add Address</Text>
        </TouchableOpacity>
      </View>

      {/* ADD MODAL */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <KeyboardAvoidingView 
          style={[styles.modalOverlay, { justifyContent: 'flex-end' }]} 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Add New Address</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#111" />
              </TouchableOpacity>
            </View>

            <TextInput style={styles.input} placeholder="Label (e.g. Home, Work)" placeholderTextColor="#9CA3AF" />
            <TextInput style={styles.input} placeholder="Address Line 1" placeholderTextColor="#9CA3AF" />
            <TextInput style={styles.input} placeholder="Address Line 2" placeholderTextColor="#9CA3AF" />
            <TextInput style={styles.input} placeholder="Pincode" placeholderTextColor="#9CA3AF" keyboardType="number-pad" />

            <TouchableOpacity 
              style={[styles.addBtn, { marginTop: 12 }]} 
              onPress={() => setShowAddModal(false)}
            >
              <Text style={styles.addBtnText}>Save Address</Text>
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
    paddingHorizontal: 20, paddingBottom: 16 
  },
  backCircle: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center'
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111' },
  
  scrollContent: { padding: 20, paddingBottom: 100 },
  
  emptyWrap: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#374151', marginTop: 16 },
  emptyDesc: { fontSize: 14, color: '#6B7280', marginTop: 8 },

  addressCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: '#F3F4F6',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  defaultAddressCard: {
    borderColor: '#2C921D', borderWidth: 1.5,
  },
  addressTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  labelBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  labelBadgeDefault: { backgroundColor: '#D1FADF' },
  labelBadgeNormal: { backgroundColor: '#F3F4F6' },
  labelText: { fontSize: 13, fontWeight: '600' },
  defaultTag: { marginLeft: 8, backgroundColor: '#2C921D', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  defaultTagText: { fontSize: 10, fontWeight: '600', color: '#fff' },

  addressLine1: { fontSize: 15, fontWeight: '500', color: '#111', marginBottom: 4 },
  addressLine2: { fontSize: 14, color: '#6B7280', marginBottom: 16 },

  actionRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12, marginTop: 4 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 8 },
  actionBtnText: { fontSize: 13, fontWeight: '500', color: '#4B5563' },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 16,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F3F4F6'
  },
  addBtn: {
    flexDirection: 'row', backgroundColor: '#2C921D', height: 50, borderRadius: 999,
    justifyContent: 'center', alignItems: 'center', gap: 8
  },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24,
  },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#111' },
  input: {
    backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12,
    paddingHorizontal: 16, height: 50, marginBottom: 12, fontSize: 15,
  },
});
